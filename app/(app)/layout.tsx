'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', emoji: '🏠' },
  { href: '/leaderboard', label: 'Leaderboard', emoji: '🏆' },
  { href: '/profile', label: 'Profile', emoji: '👤' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-n-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-n-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <span className="text-lg font-black text-primary">SpendStack</span>
        <button
          onClick={() => signOut(auth)}
          className="text-xs text-n-500 hover:text-error transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-6 md:mx-auto md:w-full md:max-w-lg">
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        className="sticky bottom-0 flex border-t border-n-200 bg-white/90 backdrop-blur-sm"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ href, label, emoji }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors',
              pathname === href ? 'text-primary' : 'text-n-500 hover:text-navy'
            )}
            aria-current={pathname === href ? 'page' : undefined}
          >
            <span className="text-lg leading-none" aria-hidden="true">{emoji}</span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
