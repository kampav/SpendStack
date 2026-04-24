# ARCHITECTURE.md — SpendStack Technical Architecture

## Folder Structure

```
spendstack/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── leaderboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── quests/
│   │   │   └── page.tsx
│   │   ├── store/
│   │   │   └── page.tsx
│   │   ├── coach/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── quests/generate/
│   │   │   └── route.ts
│   │   ├── coach/chat/
│   │   │   └── route.ts
│   │   └── transactions/sync/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          ← redirects to /dashboard or /sign-in
├── components/
│   ├── ui/               ← shadcn/ui primitives (never edit directly)
│   ├── leaderboard/
│   │   ├── LeaderboardRow.tsx
│   │   └── LeaderboardList.tsx
│   ├── streak/
│   │   ├── StreakCalendar.tsx
│   │   └── StreakMilestone.tsx
│   ├── tier/
│   │   └── TierMeter.tsx
│   ├── quests/
│   │   └── QuestCard.tsx
│   ├── store/
│   │   └── RedemptionTile.tsx
│   ├── coach/
│   │   └── CoachMessage.tsx
│   ├── shared/
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   └── PageHeader.tsx
│   └── providers/
│       ├── AuthProvider.tsx
│       └── FirestoreProvider.tsx
├── lib/
│   ├── firebase/
│   │   ├── client.ts     ← Firebase client SDK init
│   │   ├── admin.ts      ← Firebase Admin SDK (server only)
│   │   └── converters.ts ← Typed Firestore converters
│   ├── anthropic/
│   │   └── client.ts     ← Server-only Anthropic client
│   ├── points/
│   │   ├── calculator.ts
│   │   └── calculator.test.ts
│   ├── streak/
│   │   ├── engine.ts
│   │   └── engine.test.ts
│   ├── tier/
│   │   ├── resolver.ts
│   │   └── resolver.test.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useLeaderboard.ts
│       ├── useStreak.ts
│       └── useTier.ts
├── types/
│   └── index.ts          ← All shared TypeScript interfaces
├── tests/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── leaderboard.spec.ts
│       ├── streak.spec.ts
│       └── redemption.spec.ts
├── public/
├── .env.local            ← Never committed
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── CLAUDE.md
```

---

## Firebase Setup

### Auth Providers
- **Email/Password** — primary for MVP
- **Google** — one-tap sign-in
- No phone auth in MVP

Client init (`lib/firebase/client.ts`): initialise once using `getApps().length` guard. Export `auth`, `db` (Firestore), `storage`.

Admin init (`lib/firebase/admin.ts`): use `firebase-admin` with `applicationDefault()` credentials — works seamlessly on Cloud Run with Workload Identity. Never import this file from any client component.

### Firestore Collections

```
/users/{uid}
/households/{householdId}
/households/{householdId}/members/{uid}    ← subcollection mirror for leaderboard queries
/transactions/{transactionId}
/pointsLedger/{ledgerEntryId}
/streaks/{uid}
/quests/{questId}
/redemptions/{redemptionId}
/tiers/{tierId}                            ← static config, seeded at deploy
/catalogue/{itemId}                        ← redemption store items, static config
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isHouseholdMember(householdId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/households/$(householdId)) &&
        request.auth.uid in get(/databases/$(database)/documents/households/$(householdId)).data.memberUids;
    }

    // Users: own document only
    match /users/{userId} {
      allow read: if isAuthenticated();   // leaderboard needs read
      allow write: if isOwner(userId);
    }

    // Households: members can read; only creator can write (MVP)
    match /households/{householdId} {
      allow read: if isHouseholdMember(householdId);
      allow create: if isAuthenticated();
      allow update: if isHouseholdMember(householdId);
      allow delete: if false;

      match /members/{memberId} {
        allow read: if isHouseholdMember(householdId);
        allow write: if isOwner(memberId);
      }
    }

    // Transactions: own only
    match /transactions/{transactionId} {
      allow read, write: if isAuthenticated() &&
        isOwner(resource.data.userId);
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }

    // PointsLedger: own only
    match /pointsLedger/{entryId} {
      allow read: if isAuthenticated() &&
        isOwner(resource.data.userId);
      allow create: if false; // server-side only via Admin SDK
      allow update, delete: if false;
    }

    // Streaks: own only
    match /streaks/{userId} {
      allow read, write: if isOwner(userId);
    }

    // Quests: own only
    match /quests/{questId} {
      allow read: if isAuthenticated() &&
        isOwner(resource.data.userId);
      allow write: if false; // server-side only
    }

    // Redemptions: own only
    match /redemptions/{redemptionId} {
      allow read: if isAuthenticated() &&
        isOwner(resource.data.userId);
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }

    // Tiers + Catalogue: public read, no write
    match /tiers/{tierId} {
      allow read: if true;
      allow write: if false;
    }

    match /catalogue/{itemId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## Anthropic SDK Integration

All Anthropic SDK usage is **server-side only**. The API key never appears in client bundles.

`lib/anthropic/client.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

// This file is server-only — never import from client components
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // server env only, not NEXT_PUBLIC_
});
```

**Quest generation** (`app/api/quests/generate/route.ts`):
- POST handler, authenticated via Firebase Admin to verify `idToken` in Authorization header
- Fetches last 30 transactions for user from Firestore Admin
- Calls `anthropic.messages.create()` (non-streaming) with transaction summary
- Returns JSON array of 3 quest objects
- Writes quests to Firestore via Admin SDK

**Coach chat** (`app/api/coach/chat/route.ts`):
- POST handler, authenticated same way
- Uses `anthropic.messages.stream()` for streaming
- Returns `ReadableStream` via Next.js route handler streaming response
- Client uses `fetch` + `ReadableStream` reader to consume tokens
- System prompt instructs: UK banking coach, encouraging, no regulated financial advice, concise

**Streaming pattern (server route):**
```typescript
const stream = await anthropic.messages.stream({ ... });
return new Response(
  new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  }),
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
);
```

---

## Environment Variables

```bash
# .env.example
# Firebase Client (NEXT_PUBLIC_ = safe to expose to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Anthropic — server only, never NEXT_PUBLIC_
ANTHROPIC_API_KEY=

# GCP — populated automatically on Cloud Run via Workload Identity
GOOGLE_CLOUD_PROJECT=

# App
NEXT_PUBLIC_APP_URL=https://spendstack.example.com
```

---

## Dockerfile (Multi-stage, Node 20 Alpine, Non-root)

```dockerfile
# Stage 1: deps
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "server.js"]
```

Add to `next.config.ts`: `output: 'standalone'`

---

## Workload Identity Federation — GitHub Actions → GCP

Run these commands once to set up keyless auth. Replace placeholders.

```bash
# Variables
PROJECT_ID="your-gcp-project-id"
REPO="your-github-org/spendstack"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-provider"
SA_NAME="github-actions-deployer"
REGION="europe-west2"
SERVICE_NAME="spendstack"

# 1. Create the WIF pool
gcloud iam workload-identity-pools create $POOL_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 2. Create the OIDC provider
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool=$POOL_NAME \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$REPO'"

# 3. Create the service account
gcloud iam service-accounts create $SA_NAME \
  --project=$PROJECT_ID \
  --display-name="GitHub Actions Deployer"

# 4. Grant deployer roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 5. Allow GitHub Actions to impersonate the service account
POOL_ID=$(gcloud iam workload-identity-pools describe $POOL_NAME \
  --project=$PROJECT_ID --location=global --format="value(name)")

gcloud iam service-accounts add-iam-policy-binding \
  $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_ID/attribute.repository/$REPO"

# 6. Output the values needed for GitHub Actions secrets
echo "WIF_PROVIDER: projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"
echo "WIF_SERVICE_ACCOUNT: $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
```

Store the two output values as GitHub Actions secrets: `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT`.

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Test → Build → Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/spendstack/app:$GITHUB_SHA
      - run: |
          gcloud run deploy $SERVICE_NAME \
            --image $REGION-docker.pkg.dev/$PROJECT_ID/spendstack/app:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}
```

---

## Testing Strategy

**Vitest** (unit + integration):
- `lib/points/calculator.test.ts` — test points calculation per transaction type and tier multiplier
- `lib/streak/engine.test.ts` — test streak increment, reset on missed day, milestone detection
- `lib/tier/resolver.test.ts` — test tier threshold boundary conditions
- `app/api/quests/generate/route.test.ts` — mock Anthropic SDK, assert response shape
- `app/api/coach/chat/route.test.ts` — mock stream, assert streaming response headers
- `components/shared/ProgressBar.test.tsx` — test aria attributes and fill width calculation

**Playwright** (E2E, critical journeys):
- `tests/e2e/auth.spec.ts` — sign in with email, sign out, redirect unauthenticated users
- `tests/e2e/leaderboard.spec.ts` — load leaderboard, verify own row is highlighted, verify ranking order
- `tests/e2e/streak.spec.ts` — check in for streak, verify calendar cell updates, verify milestone badge at 7 days
- `tests/e2e/redemption.spec.ts` — browse store, open item sheet, confirm redemption, verify balance deducted
