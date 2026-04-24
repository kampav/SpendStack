'use client';

import { cn } from '@/lib/utils';
import type { CatalogueItem } from '@/types';

interface RedemptionTileProps {
  item: CatalogueItem;
  userPoints: number;
  onRedeem: (item: CatalogueItem) => void;
  className?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  cashback: '💷',
  voucher: '🎟️',
  experience: '🎉',
  charity: '❤️',
};

export function RedemptionTile({ item, userPoints, onRedeem, className }: RedemptionTileProps) {
  const canAfford = userPoints >= item.pointsCost;
  const outOfStock = item.stock === 0;
  const disabled = !canAfford || outOfStock || !item.isActive;

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        disabled && 'opacity-60',
        className
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          {CATEGORY_EMOJI[item.category] ?? '🎁'}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-navy">{item.title}</h3>
          <p className="text-xs text-n-500 capitalize">{item.category}</p>
        </div>
      </div>

      <p className="mb-4 flex-1 text-xs text-n-500 line-clamp-2">{item.description}</p>

      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-gold">
          {item.pointsCost.toLocaleString('en-GB')} pts
        </span>
        <button
          onClick={() => onRedeem(item)}
          disabled={disabled}
          aria-label={`Redeem ${item.title} for ${item.pointsCost} points`}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            canAfford && !outOfStock && item.isActive
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-n-200 text-n-500 cursor-not-allowed'
          )}
        >
          {outOfStock ? 'Sold out' : !canAfford ? 'Not enough pts' : 'Redeem'}
        </button>
      </div>
    </div>
  );
}
