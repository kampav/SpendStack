import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { FirestoreProvider } from '@/components/providers/FirestoreProvider';

export const metadata: Metadata = {
  title: 'SpendStack',
  description: 'Gamified loyalty rewards for your household',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <FirestoreProvider>{children}</FirestoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
