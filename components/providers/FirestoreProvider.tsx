'use client';

// FirestoreProvider is a thin wrapper kept for future real-time context needs.
// Currently the Firestore client (db) is imported directly where needed.
// Add shared Firestore state here as the app grows.

import { ReactNode } from 'react';

export function FirestoreProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
