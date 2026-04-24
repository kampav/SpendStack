/**
 * Firestore seed script — populates demo data for SpendStack
 *
 * Writes:
 *   /households/{HOUSEHOLD_ID}
 *   /households/{HOUSEHOLD_ID}/members/{uid}   ← 3 users
 *   /users/{uid}                                ← 3 users
 *   /streaks/{uid}                              ← 3 streak docs
 *   /transactions/{id}                          ← ~30 days each
 *   /pointsLedger/{id}                          ← matching ledger entries
 *
 * Run: npm run seed
 */

import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// ── Firebase init ────────────────────────────────────────────────────────────

const SA_PATH = path.resolve(process.cwd(), 'service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(SA_PATH, 'utf-8')) as ServiceAccount;

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── Constants ────────────────────────────────────────────────────────────────

const HOUSEHOLD_ID = 'demo-household';

type Category = 'groceries' | 'dining' | 'travel' | 'shopping';

const MERCHANTS: Record<Category, string[]> = {
  groceries: [
    'Tesco', "Sainsbury's", 'Waitrose', 'M&S Food', 'Lidl',
    'ASDA', 'Morrisons', 'Co-op', 'Aldi',
  ],
  dining: [
    'Pret A Manger', "Nando's", 'Wagamama', 'Five Guys', 'Pizza Express',
    'Leon', 'Dishoom', 'Côte Brasserie', 'Shake Shack', 'Honest Burgers',
  ],
  travel: [
    'TfL', 'National Rail', 'Uber', 'Avanti West Coast',
    'LNER', 'Greater Anglia', 'South Western Railway',
  ],
  shopping: [
    'John Lewis', 'ASOS', 'Next', 'H&M', 'Boots',
    'Argos', 'Primark', 'Waterstones', 'Marks & Spencer',
  ],
};

// Amount ranges in pence
const AMOUNT_RANGES: Record<Category, [number, number]> = {
  groceries: [1500, 8500],  // £15 – £85
  dining:    [900,  4500],  // £9  – £45
  travel:    [250,  6500],  // £2.50 – £65
  shopping:  [1000, 12000], // £10 – £120
};

// Points per £1 spent
const BASE_RATES: Record<Category, number> = {
  groceries: 1,
  dining:    2,
  travel:    3,
  shopping:  1,
};

const TIER_MULTIPLIERS: Record<string, number> = {
  everyday: 1.0,
  bronze:   1.0,
  silver:   1.25,
  gold:     1.5,
  platinum: 2.0,
};

// ── User definitions ─────────────────────────────────────────────────────────

interface UserDef {
  uid: string;
  displayName: string;
  email: string;
  lifetimePoints: number;
  tier: string;
  streakDays: number;
  /** Which categories this person prefers (biases transaction generation) */
  preferredCategories: Category[];
}

const USERS: UserDef[] = [
  {
    uid: 'seed-user-priya',
    displayName: 'Priya Sharma',
    email: 'priya@demo.spendstack.app',
    lifetimePoints: 4200,
    tier: 'gold',
    streakDays: 12,
    preferredCategories: ['groceries', 'groceries', 'dining', 'shopping'], // weighted
  },
  {
    uid: 'seed-user-james',
    displayName: 'James Chen',
    email: 'james@demo.spendstack.app',
    lifetimePoints: 3100,
    tier: 'silver',
    streakDays: 5,
    preferredCategories: ['dining', 'dining', 'travel', 'shopping'],
  },
  {
    uid: 'seed-user-cleo',
    displayName: 'Cleo Okonkwo',
    email: 'cleo@demo.spendstack.app',
    lifetimePoints: 1800,
    tier: 'silver',
    streakDays: 2,
    preferredCategories: ['groceries', 'travel', 'shopping', 'dining'],
  },
];

// ── Deterministic pseudo-random (LCG) ────────────────────────────────────────
// Same seed → same data every time the script runs.

function createRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/** Returns midnight UTC for N days ago */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Points calculator ────────────────────────────────────────────────────────

function calcPoints(amountPence: number, category: Category, tier: string): number {
  const mult = TIER_MULTIPLIERS[tier] ?? 1.0;
  return Math.floor((amountPence / 100) * BASE_RATES[category] * mult);
}

// ── Active-day pattern ───────────────────────────────────────────────────────
/**
 * Returns an array of day-indices (0 = today, 29 = 30 days ago) on which this
 * user has a qualifying transaction.
 *
 * - Days [0 … streakDays-1]   → all active (forms the current streak)
 * - Day  [streakDays]         → SKIPPED  (the gap that broke the streak)
 * - Days [streakDays+1 … 29]  → ~85 % active (realistic older history)
 */
function buildActiveDays(streakDays: number, rng: () => number): number[] {
  const active: number[] = [];
  for (let d = 0; d < streakDays; d++) active.push(d);
  // streakDays is the break — skip it
  for (let d = streakDays + 1; d < 30; d++) {
    if (rng() < 0.85) active.push(d);
  }
  return active;
}

// ── Batch helper ─────────────────────────────────────────────────────────────

type WriteOp = { ref: admin.firestore.DocumentReference; data: object };

async function commitInBatches(ops: WriteOp[], label: string): Promise<void> {
  const BATCH_LIMIT = 490;
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const slice = ops.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    for (const { ref, data } of slice) batch.set(ref, data);
    await batch.commit();
    if (ops.length > BATCH_LIMIT) {
      console.log(`    committed ${Math.min(i + BATCH_LIMIT, ops.length)}/${ops.length} ${label}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱  SpendStack seed starting…\n');

  // ── 1. Household ────────────────────────────────────────────────────────

  const householdRef = db.collection('households').doc(HOUSEHOLD_ID);
  await householdRef.set({
    id: HOUSEHOLD_ID,
    name: 'The Demo Household',
    memberUids: USERS.map((u) => u.uid),
    inviteCode: 'DEMO01',
    createdAt: admin.firestore.Timestamp.fromDate(daysAgo(35)),
  });
  console.log('✓  household  →  The Demo Household');

  // ── 2. Per-user data ────────────────────────────────────────────────────

  for (const user of USERS) {
    // Deterministic seed derived from the UID string
    const rng = createRng(
      Array.from(user.uid).reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
    );

    const activeDayIndices = buildActiveDays(user.streakDays, rng);
    // Sort ascending so we process oldest-first (correct running balance)
    const activeDaysOldestFirst = [...activeDayIndices].sort((a, b) => b - a);
    const activeDateStrings = activeDayIndices.map((d) => toIsoDate(daysAgo(d))).sort();

    const longestStreak = user.streakDays + randInt(3, 12, rng);
    const lastActivityDate = toIsoDate(daysAgo(0)); // today

    // ── 2a. /users/{uid} ──────────────────────────────────────────────────
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: null,
      householdId: HOUSEHOLD_ID,
      lifetimePoints: user.lifetimePoints,
      tier: user.tier,
      currentStreak: user.streakDays,
      longestStreak,
      lastActivityDate,
      createdAt: admin.firestore.Timestamp.fromDate(daysAgo(35)),
    });

    // ── 2b. /households/{id}/members/{uid} ────────────────────────────────
    await db
      .collection('households')
      .doc(HOUSEHOLD_ID)
      .collection('members')
      .doc(user.uid)
      .set({
        uid: user.uid,
        displayName: user.displayName,
        photoURL: null,
        totalPoints: user.lifetimePoints,
        tier: user.tier,
        streakDays: user.streakDays,
      });

    // ── 2c. /streaks/{uid} ────────────────────────────────────────────────
    await db.collection('streaks').doc(user.uid).set({
      uid: user.uid,
      currentDays: user.streakDays,
      longestDays: longestStreak,
      lastActivityDate,
      activeDates: activeDateStrings,
    });

    // ── 2d. Transactions + PointsLedger ───────────────────────────────────
    const txOps: WriteOp[] = [];
    const ledgerOps: WriteOp[] = [];
    let runningBalance = 0;

    for (const dayIndex of activeDaysOldestFirst) {
      const txDate = daysAgo(dayIndex);
      // 1-3 transactions on streak days, 1-2 on older days
      const txCount = dayIndex < user.streakDays
        ? randInt(1, 3, rng)
        : randInt(1, 2, rng);

      for (let t = 0; t < txCount; t++) {
        const category = pick(user.preferredCategories, rng);
        const [minAmt, maxAmt] = AMOUNT_RANGES[category];
        const amount = randInt(minAmt, maxAmt, rng);
        const merchant = pick(MERCHANTS[category], rng);
        const points = calcPoints(amount, category, user.tier);
        runningBalance += points;

        // Spread transactions across the day (hour offsets)
        const occurredAt = new Date(txDate.getTime() + t * 3_600_000);

        const txRef = db.collection('transactions').doc();
        txOps.push({
          ref: txRef,
          data: {
            id: txRef.id,
            userId: user.uid,
            householdId: HOUSEHOLD_ID,
            amount,
            category,
            merchant,
            description: merchant,
            pointsEarned: points,
            occurredAt: occurredAt.getTime(),
            isQualifying: amount >= 100,
            transactionDate: admin.firestore.Timestamp.fromDate(occurredAt),
          },
        });

        const ledgerRef = db.collection('pointsLedger').doc();
        ledgerOps.push({
          ref: ledgerRef,
          data: {
            id: ledgerRef.id,
            userId: user.uid,
            householdId: HOUSEHOLD_ID,
            transactionId: txRef.id,
            delta: points,
            balance: runningBalance,
            balanceAfter: runningBalance,
            reason: 'transaction',
            relatedId: txRef.id,
            createdAt: admin.firestore.Timestamp.fromDate(occurredAt),
          },
        });
      }
    }

    // If transaction total differs from target, add an adjustment ledger entry
    const diff = user.lifetimePoints - runningBalance;
    if (diff !== 0) {
      const adjRef = db.collection('pointsLedger').doc();
      ledgerOps.push({
        ref: adjRef,
        data: {
          id: adjRef.id,
          userId: user.uid,
          householdId: HOUSEHOLD_ID,
          transactionId: null,
          delta: diff,
          balance: user.lifetimePoints,
          balanceAfter: user.lifetimePoints,
          reason: diff > 0 ? 'signup_bonus' : 'adjustment',
          relatedId: null,
          createdAt: admin.firestore.Timestamp.fromDate(daysAgo(30)),
        },
      });
    }

    await commitInBatches(txOps, 'transactions');
    await commitInBatches(ledgerOps, 'ledger entries');

    console.log(
      `✓  ${user.displayName.padEnd(14)}` +
      `  tier=${user.tier.padEnd(8)}` +
      `  pts=${String(user.lifetimePoints).padStart(5)}` +
      `  streak=${user.streakDays}d` +
      `  active_days=${activeDayIndices.length}` +
      `  tx=${txOps.length}`
    );
  }

  console.log('\n✅  Seed complete — Firestore is populated.');
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
