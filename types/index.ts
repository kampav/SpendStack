// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  householdId?: string;
  createdAt: number; // unix ms
}

// ─── Household ───────────────────────────────────────────────────────────────

export interface Household {
  id: string;
  name: string;
  memberUids: string[];
  createdAt: number;
}

export interface HouseholdMember {
  uid: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
  tier: TierName;
  streakDays: number;
}

// ─── Points ──────────────────────────────────────────────────────────────────

export type TransactionCategory =
  | 'groceries'
  | 'dining'
  | 'travel'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'other';

export interface Transaction {
  id: string;
  userId: string;
  householdId: string;
  amount: number; // pence
  category: TransactionCategory;
  merchant: string;
  description: string;
  occurredAt: number; // unix ms
  pointsEarned: number;
}

export interface PointsLedgerEntry {
  id: string;
  userId: string;
  householdId: string;
  transactionId?: string;
  questId?: string;
  redemptionId?: string;
  delta: number; // positive = earn, negative = redeem
  balance: number; // running total
  reason: string;
  createdAt: number;
}

// ─── Tier ────────────────────────────────────────────────────────────────────

export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Tier {
  id: TierName;
  label: string;
  minPoints: number;
  maxPoints: number | null; // null = no ceiling (platinum)
  multiplier: number;
  color: string;
  badgeEmoji: string;
}

export interface TierProgress {
  current: Tier;
  next: Tier | null;
  pointsInTier: number;
  pointsNeeded: number | null;
  progressPercent: number;
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export interface Streak {
  uid: string;
  currentDays: number;
  longestDays: number;
  lastActivityDate: string; // YYYY-MM-DD
  activeDates: string[]; // YYYY-MM-DD list (last 30 days)
}

export interface StreakMilestoneInfo {
  days: number;
  label: string;
  reward: number; // bonus points
}

// ─── Quests ──────────────────────────────────────────────────────────────────

export type QuestStatus = 'active' | 'completed' | 'expired';

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TransactionCategory;
  targetAmount: number; // pence
  currentAmount: number;
  pointsReward: number;
  status: QuestStatus;
  expiresAt: number; // unix ms
  createdAt: number;
}

// ─── Redemption Store ────────────────────────────────────────────────────────

export interface CatalogueItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  pointsCost: number;
  category: 'cashback' | 'voucher' | 'experience' | 'charity';
  stock: number | null;
  isActive: boolean;
}

export interface Redemption {
  id: string;
  userId: string;
  itemId: string;
  itemTitle: string;
  pointsCost: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  createdAt: number;
}

// ─── Coach ───────────────────────────────────────────────────────────────────

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── API shapes ──────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}
