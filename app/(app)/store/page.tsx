'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLeaderboard } from '@/lib/hooks/useLeaderboard';
import { Card } from '@/components/ui/Card';

const DEMO_HOUSEHOLD_ID = 'demo-household';

type Category = 'all' | 'cashback' | 'voucher' | 'experience' | 'charity';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',        label: 'All'         },
  { id: 'cashback',   label: '💰 Cashback'  },
  { id: 'voucher',    label: '🎟 Vouchers'   },
  { id: 'experience', label: '🎭 Experiences'},
  { id: 'charity',    label: '🌱 Charity'   },
];

const CATALOGUE = [
  { id: '1', emoji: '💰', title: '£5 Cashback',        cost: 500,  category: 'cashback'   as Category },
  { id: '2', emoji: '🛒', title: 'Tesco £10 Voucher',  cost: 1000, category: 'voucher'    as Category },
  { id: '3', emoji: '🎬', title: 'Cinema x2 Tickets',  cost: 1500, category: 'experience' as Category },
  { id: '4', emoji: '🌱', title: 'Plant a Tree',        cost: 200,  category: 'charity'   as Category },
  { id: '5', emoji: '☕', title: 'Pret Coffee Week',    cost: 800,  category: 'voucher'    as Category },
  { id: '6', emoji: '🏊', title: 'Spa Day for Two',    cost: 3000, category: 'experience' as Category },
];

export default function StorePage() {
  const { user } = useAuth();
  const { members } = useLeaderboard(DEMO_HOUSEHOLD_ID);
  const [filter, setFilter] = useState<Category>('all');
  const [redeemed, setRedeemed] = useState<string | null>(null);

  const me = members.find((m) => m.uid === user?.uid) ?? members[0];
  const userPoints = me?.totalPoints ?? 0;

  const filtered = filter === 'all' ? CATALOGUE : CATALOGUE.filter((i) => i.category === filter);

  function handleRedeem(id: string, title: string) {
    setRedeemed(title);
    setTimeout(() => setRedeemed(null), 3000);
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

      {/* ── Success toast ─────────────────────────────────────────────── */}
      {redeemed && (
        <div role="alert" className="rounded-xl bg-accent/10 px-4 py-3 text-[14px] font-semibold text-accent">
          ✅ {redeemed} redeemed!
        </div>
      )}

      {/* ── Category filter ───────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
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
          const canAfford = userPoints >= item.cost;
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
              {canAfford && (
                <button
                  onClick={() => handleRedeem(item.id, item.title)}
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-primary text-white text-[11px] font-bold rounded-lg hover:brightness-95 transition-all"
                >
                  Redeem
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
