'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { Card } from '@/components/ui/Card';

const DEMO_HOUSEHOLD_ID = 'demo-household';

type Category = 'all' | 'cashback' | 'voucher' | 'experience' | 'charity';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',        label: 'All'          },
  { id: 'cashback',   label: '💰 Cashback'  },
  { id: 'voucher',    label: '🎟 Vouchers'   },
  { id: 'experience', label: '🎭 Experiences'},
  { id: 'charity',    label: '🌱 Charity'   },
];

const CATALOGUE = [
  { id: 'cat-1',  emoji: '💰', title: '£5 Cashback',        cost: 500,  category: 'cashback'   as Category },
  { id: 'cat-2',  emoji: '💰', title: '£10 Cashback',       cost: 1000, category: 'cashback'   as Category },
  { id: 'cat-3',  emoji: '🛒', title: 'Tesco £10 Voucher',  cost: 900,  category: 'voucher'    as Category },
  { id: 'cat-5',  emoji: '☕', title: 'Pret Coffee Week',   cost: 800,  category: 'voucher'    as Category },
  { id: 'cat-6',  emoji: '🎬', title: 'Cinema x2 Tickets', cost: 1500, category: 'experience' as Category },
  { id: 'cat-7',  emoji: '🍽️', title: 'Restaurant £25',    cost: 2000, category: 'experience' as Category },
  { id: 'cat-8',  emoji: '🏊', title: 'Spa Day for Two',   cost: 3000, category: 'experience' as Category },
  { id: 'cat-9',  emoji: '✈️', title: 'Airport Lounge x2', cost: 2500, category: 'experience' as Category },
  { id: 'cat-10', emoji: '🌱', title: 'Plant a Tree',       cost: 200,  category: 'charity'   as Category },
  { id: 'cat-11', emoji: '🌍', title: '£5 to Shelter',     cost: 400,  category: 'charity'   as Category },
  { id: 'cat-12', emoji: '🦁', title: 'Adopt an Animal',   cost: 750,  category: 'charity'   as Category },
];

export default function StorePage() {
  const { user } = useAuth();
  const { members } = useLeaderboard(DEMO_HOUSEHOLD_ID);
  const [filter, setFilter]         = useState<Category>('all');
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null); // item id being confirmed
  const [redeeming, setRedeeming]   = useState<string | null>(null); // item id in-flight

  const me         = members.find((m) => m.uid === user?.uid) ?? members[0];
  const userPoints = me?.totalPoints ?? 0;

  const filtered = filter === 'all' ? CATALOGUE : CATALOGUE.filter((i) => i.category === filter);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRedeem(id: string, title: string, cost: number) {
    if (!user) return;

    // First tap → confirm
    if (confirming !== id) {
      setConfirming(id);
      return;
    }

    // Second tap → execute
    setConfirming(null);
    setRedeeming(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/store/redeem', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId:      id,
          itemTitle:   title,
          cost,
          householdId: DEMO_HOUSEHOLD_ID,
        }),
      });

      const body = (await res.json()) as { error?: string; newBalance?: number };

      if (!res.ok) {
        showToast(body.error ?? 'Redemption failed — try again.', false);
      } else {
        showToast(`${title} redeemed! 🎉`, true);
      }
    } catch {
      showToast('Network error — try again.', false);
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-6 animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[26px] font-extrabold text-navy tracking-tight">Rewards Store</h1>
        <p className="text-[13px] text-n-500 mt-1">
          <span className="font-bold text-primary tabular">{userPoints.toLocaleString('en-GB')}</span> points available
        </p>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="alert"
          className={`rounded-xl px-4 py-3 text-[14px] font-semibold ${
            toast.ok ? 'bg-accent/10 text-accent' : 'bg-error/10 text-error'
          }`}
        >
          {toast.ok ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}

      {/* ── Category filter ───────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setFilter(id); setConfirming(null); }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-150 ${
              filter === id
                ? 'bg-primary text-white'
                : 'bg-n-100 text-n-500 hover:text-navy'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => {
          const canAfford  = userPoints >= item.cost;
          const isConfirm  = confirming === item.id;
          const isLoading  = redeeming === item.id;

          return (
            <Card
              key={item.id}
              padding="none"
              className={`overflow-hidden relative ${!canAfford ? 'opacity-70' : ''}`}
            >
              {/* Image / icon area */}
              <div className="h-24 bg-n-100 flex items-center justify-center text-[44px]">
                {item.emoji}
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold text-navy leading-snug">{item.title}</p>
                <p className="text-[12px] font-semibold text-gold mt-1 tabular">
                  🪙 {item.cost.toLocaleString('en-GB')} pts
                </p>
              </div>

              {/* Lock overlay */}
              {!canAfford && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <div className="flex flex-col items-center text-center px-2">
                    <span className="text-[20px]">🔒</span>
                    <span className="text-[11px] font-semibold text-n-500 mt-1">
                      Need {(item.cost - userPoints).toLocaleString('en-GB')} more
                    </span>
                  </div>
                </div>
              )}

              {/* Redeem / Confirm button */}
              {canAfford && (
                <button
                  onClick={() => handleRedeem(item.id, item.title, item.cost)}
                  disabled={isLoading}
                  aria-label={isConfirm ? `Confirm redeem ${item.title}` : `Redeem ${item.title}`}
                  className={`absolute bottom-2 right-2 px-2.5 py-1 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50 ${
                    isConfirm
                      ? 'bg-gold hover:brightness-95'
                      : 'bg-primary hover:brightness-95'
                  }`}
                >
                  {isLoading ? '…' : isConfirm ? 'Confirm?' : 'Redeem'}
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Dismiss confirm on scroll/filter change hint */}
      {confirming && (
        <p className="text-[11px] text-n-500 text-center -mt-2">
          Tap again to confirm · tap elsewhere to cancel
        </p>
      )}
    </div>
  );
}
