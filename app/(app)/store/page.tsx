'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { RedemptionTile } from '@/components/store/RedemptionTile';
import type { CatalogueItem } from '@/types';

const DEMO_POINTS = 1_340;

const DEMO_CATALOGUE: CatalogueItem[] = [
  {
    id: 'item-1',
    title: '£5 Cashback',
    description: 'Get £5 back into your current account within 3 working days.',
    pointsCost: 500,
    category: 'cashback',
    stock: null,
    isActive: true,
  },
  {
    id: 'item-2',
    title: 'Tesco £10 Voucher',
    description: 'Redeemable in-store or online at Tesco.com.',
    pointsCost: 1000,
    category: 'voucher',
    stock: 50,
    isActive: true,
  },
  {
    id: 'item-3',
    title: 'Cinema Tickets (x2)',
    description: 'Two Odeon standard screen tickets, any film, any date.',
    pointsCost: 1500,
    category: 'experience',
    stock: 20,
    isActive: true,
  },
  {
    id: 'item-4',
    title: 'Plant a Tree 🌱',
    description: 'Donate your points to plant a tree via the Eden Reforestation charity.',
    pointsCost: 200,
    category: 'charity',
    stock: null,
    isActive: true,
  },
];

export default function StorePage() {
  const [userPoints] = useState(DEMO_POINTS);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  function handleRedeem(item: CatalogueItem) {
    // In production: call /api/redemptions with auth token
    setConfirmed(item.title);
    setTimeout(() => setConfirmed(null), 3000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards Store"
        subtitle={`${userPoints.toLocaleString('en-GB')} points available`}
      />

      {confirmed && (
        <div
          className="rounded-xl bg-primary/10 p-3 text-sm font-medium text-primary"
          role="alert"
        >
          ✅ {confirmed} redeemed successfully!
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {DEMO_CATALOGUE.map((item) => (
          <RedemptionTile
            key={item.id}
            item={item}
            userPoints={userPoints}
            onRedeem={handleRedeem}
          />
        ))}
      </div>
    </div>
  );
}
