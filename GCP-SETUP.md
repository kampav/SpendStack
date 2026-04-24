# GCP Setup Guide — SpendStack

Complete these steps **once** before the GitHub Actions deploy pipeline can run.
All commands assume you have `gcloud` CLI installed and authenticated (`gcloud auth login`).

---

## 1 · Create a GCP project

```bash
PROJECT_ID="spendstack-prod"          # pick a globally unique ID
gcloud projects create $PROJECT_ID --name="SpendStack"
gcloud config set project $PROJECT_ID

# Link billing (required for Cloud Run + Artifact Registry)
# Find your billing account ID:
gcloud billing accounts list
gcloud billing projects link $PROJECT_ID \
  --billing-account=<YOUR_BILLING_ACCOUNT_ID>
```

---

## 2 · Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  firebase.googleapis.com \
  --project=$PROJECT_ID
```

---

## 3 · Create Artifact Registry repository

```bash
REGION="europe-west2"

gcloud artifacts repositories create spendstack \
  --repository-format=docker \
  --location=$REGION \
  --description="SpendStack container images" \
  --project=$PROJECT_ID
```

---

## 4 · Create a dedicated Cloud Run service account

This is the identity the **running app** uses to call Firebase Admin.
It is separate from the deployer service account used by GitHub Actions.

```bash
CR_SA_NAME="spendstack-runtime"

gcloud iam service-accounts create $CR_SA_NAME \
  --project=$PROJECT_ID \
  --display-name="SpendStack Cloud Run Runtime"

# Grant Firebase Admin access (Firestore + Auth via Admin SDK)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$CR_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# Grant permission to read Secret Manager (if you move secrets there later)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$CR_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5 · Set up Workload Identity Federation (keyless GitHub → GCP auth)

```bash
REPO="kampav/SpendStack"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-provider"
SA_NAME="github-actions-deployer"

# 5a. Create the WIF pool
gcloud iam workload-identity-pools create $POOL_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 5b. Create the OIDC provider
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool=$POOL_NAME \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$REPO'"

# 5c. Create the deployer service account
gcloud iam service-accounts create $SA_NAME \
  --project=$PROJECT_ID \
  --display-name="GitHub Actions Deployer"

# 5d. Grant deployer roles
for ROLE in roles/run.admin roles/artifactregistry.writer roles/cloudbuild.builds.editor roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="$ROLE"
done

# Also allow the deployer to act as the Cloud Run runtime SA
gcloud iam service-accounts add-iam-policy-binding \
  $CR_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
  --project=$PROJECT_ID \
  --role="roles/iam.serviceAccountUser" \
  --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# 5e. Allow GitHub Actions to impersonate the deployer SA
POOL_ID=$(gcloud iam workload-identity-pools describe $POOL_NAME \
  --project=$PROJECT_ID --location=global --format="value(name)")

gcloud iam service-accounts add-iam-policy-binding \
  $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/$REPO"
```

---

## 6 · Output the values you need for GitHub secrets

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

echo ""
echo "=== ADD THESE AS GITHUB ACTIONS SECRETS ==="
echo ""
echo "GCP_PROJECT_ID:      $PROJECT_ID"
echo ""
echo "WIF_PROVIDER:        projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"
echo ""
echo "WIF_SERVICE_ACCOUNT: $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo ""
echo "ANTHROPIC_API_KEY:   <your key from .env.local>"
echo ""
echo "NEXT_PUBLIC_APP_URL: https://spendstack-<hash>-nw.a.run.app"
echo "  (update this after first deploy — get URL from Cloud Run console)"
```

---

## 7 · Add GitHub Actions secrets

Go to: **https://github.com/kampav/SpendStack/settings/secrets/actions**

Add these repository secrets:

| Secret name | Value |
|---|---|
| `GCP_PROJECT_ID` | e.g. `spendstack-prod` |
| `WIF_PROVIDER` | from step 6 output |
| `WIF_SERVICE_ACCOUNT` | from step 6 output |
| `ANTHROPIC_API_KEY` | from your `.env.local` |
| `NEXT_PUBLIC_APP_URL` | Cloud Run URL (set after first deploy) |

---

## 8 · Grant Cloud Build access to Artifact Registry

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUDBUILD_SA="$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$CLOUDBUILD_SA" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$CLOUDBUILD_SA" \
  --role="roles/run.admin"

gcloud iam service-accounts add-iam-policy-binding \
  $CR_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
  --project=$PROJECT_ID \
  --role="roles/iam.serviceAccountUser" \
  --member="serviceAccount:$CLOUDBUILD_SA"
```

---

## 9 · Add Firebase project to GCP project

In the [Firebase Console](https://console.firebase.google.com):
1. Open your existing Firebase project (`spendstack-c344a`)
2. **Project settings → General → Your apps** — confirm the app is registered
3. **Project settings → Service accounts** — the Admin SDK now uses the Cloud Run runtime SA via ADC — no JSON key download needed for production

---

## 10 · Verify the pipeline

Push any commit to `main`. The Actions tab at  
**https://github.com/kampav/SpendStack/actions**  
will show the `Test → Build → Deploy` workflow.

First run takes ~5 minutes (Docker layer cache is cold).  
Subsequent runs: ~2 minutes.

---

## Quick reference — variables used throughout

```
PROJECT_ID=spendstack-prod
REGION=europe-west2
SERVICE_NAME=spendstack
REPO=kampav/SpendStack
POOL_NAME=github-actions-pool
PROVIDER_NAME=github-provider
SA_NAME=github-actions-deployer
CR_SA_NAME=spendstack-runtime
```
