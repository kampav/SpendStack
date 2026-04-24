import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// This file is server-only — never import from client components or pages

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  // On Cloud Run, applicationDefault() uses Workload Identity automatically.
  // Locally, GOOGLE_APPLICATION_CREDENTIALS points to the service-account.json.
  const credentialEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialEnv) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(
      process.cwd() + '/' + credentialEnv.replace(/^\.\//, '')
    );
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  // Production: Workload Identity / ADC
  const { applicationDefault } = require('firebase-admin/app');
  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

initAdmin();

export const adminDb = getFirestore();
export const adminAuth = getAuth();
