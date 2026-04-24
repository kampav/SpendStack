import { redirect } from 'next/navigation';

// Root page — always redirect; auth state handled in (app)/layout.tsx
export default function RootPage() {
  redirect('/dashboard');
}
