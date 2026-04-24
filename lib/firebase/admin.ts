import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// This file is server-only — never import from client components or pages.
// On Cloud Run: applicationDefault() uses Workload Identity (no key needed).
// Locally: GOOGLE_APPLICATION_CREDENTIALS points to service-account.json.

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const credentialEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialEnv) {
    const saPath = resolve(process.cwd(), credentialEnv.replace(/^\.\//, ''));
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

initAdmin();

export const adminDb = getFirestore();
export const adminAuth = getAuth();
