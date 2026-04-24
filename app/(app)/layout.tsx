'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Wordmark } from '@/components/ui/Wordmark';
import { cn } from '@/lib/utils';

// ── Tab definition — add a new { href, icon, label } here for live demo ──────
const TABS = [
  { href: '/dashboard',   icon: '🏠', label: 'Home'    },
  { href: '/leaderboard', icon: '🏆', label: 'Board'   },
  { href: '/streak',      icon: '🔥', label: 'Streak'  },
  { href: '/tier',        icon: '💎', label: 'Tier'    },
  { href: '/profile',     icon: '👤', label: 'Profile' },
] as const;

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <Wordmark size={22} />
          <p className="text-sm text-n-500 animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {/* ── Brand header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-n-200 bg-white/90 backdrop-blur-md">
        <Wordmark size={17} />
        <div className="w-8" />
      </header>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {children}
      </main>

      {/* ── Bottom tab bar ───────────────────────────────────────────────── */}
      <nav
        className="sticky bottom-0 z-20 flex border-t border-n-200 bg-white/95 backdrop-blur-xl"
        aria-label="Main navigation"
      >
        {TABS.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1',
                'text-[10px] font-semibold transition-colors duration-150',
                active ? 'text-primary' : 'text-n-500 hover:text-navy',
              )}
            >
              <span
                className={cn(
                  'text-[22px] leading-none transition-transform duration-150',
                  active && 'scale-110',
                )}
                aria-hidden="true"
              >
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
