/**
 * SpendStack — complete demo seed script
 *
 * Creates Firebase Auth users + all Firestore data:
 *   /households/{HOUSEHOLD_ID}
 *   /households/{HOUSEHOLD_ID}/members/{uid}
 *   /users/{uid}
 *   /streaks/{uid}
 *   /transactions/{id}
 *   /pointsLedger/{id}
 *   /quests/{id}
 *   /catalogue/{id}
 *
 * Demo logins (password: Demo1234! for all):
 *   sarah@demo.spendstack.app   — Platinum 💎  17,200 pts  23d streak
 *   marcus@demo.spendstack.app  — Gold    🥇   8,400 pts  14d streak
 *   priya@demo.spendstack.app   — Silver  🥈   2,800 pts   7d streak
 *   cleo@demo.spendstack.app    — Bronze  🥉     450 pts   3d streak
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
const db   = admin.firestore();
const auth = admin.auth();

// ── Constants ────────────────────────────────────────────────────────────────

const HOUSEHOLD_ID   = 'demo-household';
const DEMO_PASSWORD  = 'Demo1234!';

type Category = 'groceries' | 'dining' | 'travel' | 'utilities' | 'entertainment' | 'shopping';

const MERCHANTS: Record<Category, string[]> = {
  groceries:     ['Tesco', "Sainsbury's", 'Waitrose', 'M&S Food', 'Lidl', 'ASDA', 'Morrisons', 'Co-op', 'Aldi'],
  dining:        ['Pret A Manger', "Nando's", 'Wagamama', 'Five Guys', 'Pizza Express', 'Leon', 'Dishoom', 'Shake Shack', 'Honest Burgers', 'Côte Brasserie'],
  travel:        ['TfL', 'National Rail', 'Uber', 'Avanti West Coast', 'LNER', 'Greater Anglia', 'easyJet', 'British Airways'],
  utilities:     ['British Gas', 'Thames Water', 'Octopus Energy', 'BT Broadband', 'Sky TV', 'Virgin Media'],
  entertainment: ['Spotify', 'Netflix', 'Amazon Prime', 'Apple One', 'Vue Cinemas', 'Odeon', 'Ticketmaster'],
  shopping:      ['John Lewis', 'ASOS', 'Next', 'H&M', 'Boots', 'Argos', 'Marks & Spencer', 'Waterstones', 'Apple Store'],
};

const AMOUNT_RANGES: Record<Category, [number, number]> = {
  groceries:     [1500,  8500],
  dining:        [ 900,  4500],
  travel:        [ 250,  9500],
  utilities:     [4000, 15000],
  entertainment: [ 599,  1499],
  shopping:      [1000, 12000],
};

const BASE_RATES: Record<Category, number> = {
  groceries:     1,
  dining:        2,
  travel:        3,
  utilities:     1,
  entertainment: 2,
  shopping:      1,
};

const TIER_MULTIPLIERS: Record<string, number> = {
  bronze:   1.0,
  silver:   1.25,
  gold:     1.5,
  platinum: 2.0,
};

// ── Demo user definitions ────────────────────────────────────────────────────
// Tiers:  bronze <1000 | silver 1000-4999 | gold 5000-14999 | platinum 15000+

interface UserDef {
  uid:                  string;
  displayName:          string;
  email:                string;
  targetPoints:         number;
  tier:                 string;
  streakDays:           number;
  preferredCategories:  Category[];
  bio:                  string;
}

const USERS: UserDef[] = [
  {
    uid:            'demo-sarah',
    displayName:    'Sarah Mitchell',
    email:          'sarah@demo.spendstack.app',
    targetPoints:   17200,
    tier:           'platinum',
    streakDays:     23,
    preferredCategories: ['groceries', 'dining', 'travel', 'travel', 'shopping'],
    bio:            'Top earner — shows Platinum tier + long streak',
  },
  {
    uid:            'demo-marcus',
    displayName:    'Marcus Johnson',
    email:          'marcus@demo.spendstack.app',
    targetPoints:   8400,
    tier:           'gold',
    streakDays:     14,
    preferredCategories: ['dining', 'dining', 'entertainment', 'shopping', 'groceries'],
    bio:            'Second place — shows Gold tier + 2-week milestone',
  },
  {
    uid:            'demo-priya',
    displayName:    'Priya Sharma',
    email:          'priya@demo.spendstack.app',
    targetPoints:   2800,
    tier:           'silver',
    streakDays:     7,
    preferredCategories: ['groceries', 'groceries', 'utilities', 'dining', 'shopping'],
    bio:            'Mid-tier — shows Silver tier + 1-week milestone',
  },
  {
    uid:            'demo-cleo',
    displayName:    'Cleo Okonkwo',
    email:          'cleo@demo.spendstack.app',
    targetPoints:   450,
    tier:           'bronze',
    streakDays:     3,
    preferredCategories: ['groceries', 'travel', 'dining', 'shopping', 'entertainment'],
    bio:            'New member — shows Bronze tier + early streak',
  },
];

// ── Catalogue items ──────────────────────────────────────────────────────────

const CATALOGUE = [
  { id: 'cat-1', emoji: '💰', title: '£5 Cashback',         description: 'Direct cashback to your linked account',  cost: 500,  category: 'cashback',   stock: null, isActive: true },
  { id: 'cat-2', emoji: '💰', title: '£10 Cashback',        description: 'Direct cashback to your linked account',  cost: 1000, category: 'cashback',   stock: null, isActive: true },
  { id: 'cat-3', emoji: '🛒', title: 'Tesco £10 Voucher',   description: 'Valid in-store and online at Tesco',       cost: 900,  category: 'voucher',    stock: 100,  isActive: true },
  { id: 'cat-4', emoji: '🛒', title: "Sainsbury's £15",     description: 'In-store voucher, valid 90 days',          cost: 1400, category: 'voucher',    stock: 100,  isActive: true },
  { id: 'cat-5', emoji: '☕', title: 'Pret Coffee Week',    description: '5 free coffees at Pret A Manger',          cost: 800,  category: 'voucher',    stock: 50,   isActive: true },
  { id: 'cat-6', emoji: '🎬', title: 'Cinema x2 Tickets',  description: 'Odeon or Vue — any film, any time',        cost: 1500, category: 'experience', stock: 200,  isActive: true },
  { id: 'cat-7', emoji: '🍽️', title: 'Restaurant Voucher', description: '£25 at any Zomato partner restaurant',     cost: 2000, category: 'experience', stock: 75,   isActive: true },
  { id: 'cat-8', emoji: '🏊', title: 'Spa Day for Two',    description: 'Champneys day spa — weekday entry',        cost: 3000, category: 'experience', stock: 20,   isActive: true },
  { id: 'cat-9', emoji: '✈️', title: 'Airport Lounge x2', description: 'Priority Pass single-visit lounge access', cost: 2500, category: 'experience', stock: 30,   isActive: true },
  { id: 'cat-10', emoji: '🌱', title: 'Plant a Tree',       description: 'We plant a tree in your name via Ecologi', cost: 200, category: 'charity',    stock: null, isActive: true },
  { id: 'cat-11', emoji: '🌍', title: '£5 to Shelter',      description: 'Donated to Shelter UK on your behalf',    cost: 400,  category: 'charity',    stock: null, isActive: true },
  { id: 'cat-12', emoji: '🦁', title: 'Adopt an Animal',   description: 'WWF animal adoption for one year',         cost: 750,  category: 'charity',    stock: null, isActive: true },
];

// ── Demo quest templates ─────────────────────────────────────────────────────

function buildQuests(userId: string, tier: string): object[] {
  const now    = Date.now();
  const dayMs  = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;
  const mult   = TIER_MULTIPLIERS[tier] ?? 1;

  return [
    {
      id:            `quest-${userId}-1`,
      userId,
      title:         'Grocery Champion',
      description:   'Spend £50 at supermarkets this week',
      category:      'groceries',
      targetAmount:  5000,
      currentAmount: 3200,
      pointsReward:  Math.round(150 * mult),
      status:        'active',
      expiresAt:     now + weekMs,
      createdAt:     now - 3 * dayMs,
    },
    {
      id:            `quest-${userId}-2`,
      userId,
      title:         'Foodie Explorer',
      description:   'Dine out 3 times this week',
      category:      'dining',
      targetAmount:  4500,
      currentAmount: 4500,
      pointsReward:  Math.round(200 * mult),
      status:        'completed',
      expiresAt:     now + 2 * dayMs,
      createdAt:     now - 5 * dayMs,
    },
    {
      id:            `quest-${userId}-3`,
      userId,
      title:         'Travel Ready',
      description:   'Book a travel transaction over £20',
      category:      'travel',
      targetAmount:  2000,
      currentAmount: 0,
      pointsReward:  Math.round(300 * mult),
      status:        'active',
      expiresAt:     now + 5 * dayMs,
      createdAt:     now - 2 * dayMs,
    },
    {
      id:            `quest-${userId}-4`,
      userId,
      title:         'Weekend Warrior',
      description:   'Make 5 transactions over the weekend',
      category:      'shopping',
      targetAmount:  5,
      currentAmount: 5,
      pointsReward:  Math.round(100 * mult),
      status:        'completed',
      expiresAt:     now - dayMs,       // just expired
      createdAt:     now - 8 * dayMs,
    },
    {
      id:            `quest-${userId}-5`,
      userId,
      title:         'Entertainment Buff',
      description:   'Spend £15 on entertainment this month',
      category:      'entertainment',
      targetAmount:  1500,
      currentAmount: 599,
      pointsReward:  Math.round(175 * mult),
      status:        'active',
      expiresAt:     now + 10 * dayMs,
      createdAt:     now - dayMs,
    },
  ];
}

// ── Demo redemptions ─────────────────────────────────────────────────────────

function buildRedemptions(userId: string, userPoints: number): object[] {
  // Only create redemptions for users with enough points
  if (userPoints < 500) return [];
  const now   = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const redemptions: object[] = [
    {
      id:         `redemption-${userId}-1`,
      userId,
      itemId:     'cat-10',
      itemTitle:  'Plant a Tree',
      pointsCost: 200,
      status:     'fulfilled',
      createdAt:  now - 14 * dayMs,
    },
  ];

  if (userPoints >= 1000) {
    redemptions.push({
      id:         `redemption-${userId}-2`,
      userId,
      itemId:     'cat-1',
      itemTitle:  '£5 Cashback',
      pointsCost: 500,
      status:     'fulfilled',
      createdAt:  now - 7 * dayMs,
    });
  }

  if (userPoints >= 5000) {
    redemptions.push({
      id:         `redemption-${userId}-3`,
      userId,
      itemId:     'cat-3',
      itemTitle:  'Tesco £10 Voucher',
      pointsCost: 900,
      status:     'pending',
      createdAt:  now - 2 * dayMs,
    });
  }

  return redemptions;
}

// ── Deterministic pseudo-random (LCG) ────────────────────────────────────────

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

function buildActiveDays(streakDays: number, rng: () => number): number[] {
  const active: number[] = [];
  for (let d = 0; d < streakDays; d++) active.push(d);
  // Day [streakDays] is the break — skip it
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

// ── Auth: create or update user ──────────────────────────────────────────────

async function upsertAuthUser(user: UserDef): Promise<void> {
  try {
    // Try to get existing user
    const existing = await auth.getUser(user.uid);
    // Update if email/password has drifted
    await auth.updateUser(existing.uid, {
      email:        user.email,
      displayName:  user.displayName,
      password:     DEMO_PASSWORD,
    });
    console.log(`  ↻  auth  ${user.email}  (updated existing)`);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'auth/user-not-found') {
      await auth.createUser({
        uid:          user.uid,
        email:        user.email,
        displayName:  user.displayName,
        password:     DEMO_PASSWORD,
        emailVerified: true,
      });
      console.log(`  +  auth  ${user.email}  (created)`);
    } else {
      throw err;
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱  SpendStack demo seed\n');

  // ── 1. Catalogue items ───────────────────────────────────────────────────
  console.log('📦  Writing catalogue items…');
  const catBatch = db.batch();
  for (const item of CATALOGUE) {
    catBatch.set(db.collection('catalogue').doc(item.id), {
      ...item,
      createdAt: admin.firestore.Timestamp.fromDate(daysAgo(60)),
    });
  }
  await catBatch.commit();
  console.log(`✓  ${CATALOGUE.length} catalogue items\n`);

  // ── 2. Household ─────────────────────────────────────────────────────────
  console.log('🏠  Writing household…');
  await db.collection('households').doc(HOUSEHOLD_ID).set({
    id:         HOUSEHOLD_ID,
    name:       'The Demo Household',
    memberUids: USERS.map((u) => u.uid),
    inviteCode: 'DEMO01',
    createdAt:  admin.firestore.Timestamp.fromDate(daysAgo(40)),
  });
  console.log('✓  household  →  The Demo Household\n');

  // ── 3. Per-user data ─────────────────────────────────────────────────────
  for (const user of USERS) {
    console.log(`👤  ${user.displayName}  (${user.bio})`);

    // 3a. Firebase Auth user
    await upsertAuthUser(user);

    // RNG seeded deterministically per user
    const rng = createRng(
      Array.from(user.uid).reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
    );

    const activeDayIndices  = buildActiveDays(user.streakDays, rng);
    const activeDaysOldest  = [...activeDayIndices].sort((a, b) => b - a); // oldest first
    const activeDateStrings = activeDayIndices.map((d) => toIsoDate(daysAgo(d))).sort();
    const longestStreak     = user.streakDays + randInt(5, 18, rng);

    // 3b. /users/{uid}
    await db.collection('users').doc(user.uid).set({
      uid:              user.uid,
      displayName:      user.displayName,
      email:            user.email,
      photoURL:         null,
      householdId:      HOUSEHOLD_ID,
      lifetimePoints:   user.targetPoints,
      tier:             user.tier,
      currentStreak:    user.streakDays,
      longestStreak,
      lastActivityDate: toIsoDate(daysAgo(0)),
      createdAt:        admin.firestore.Timestamp.fromDate(daysAgo(40)),
    });

    // 3c. /households/{id}/members/{uid}
    await db.collection('households').doc(HOUSEHOLD_ID)
      .collection('members').doc(user.uid).set({
        uid:          user.uid,
        displayName:  user.displayName,
        photoURL:     null,
        totalPoints:  user.targetPoints,
        tier:         user.tier,
        streakDays:   user.streakDays,
      });

    // 3d. /streaks/{uid}
    await db.collection('streaks').doc(user.uid).set({
      uid:              user.uid,
      currentDays:      user.streakDays,
      longestDays:      longestStreak,
      lastActivityDate: toIsoDate(daysAgo(0)),
      activeDates:      activeDateStrings,
    });

    // 3e. Transactions + PointsLedger
    const txOps:     WriteOp[] = [];
    const ledgerOps: WriteOp[] = [];
    let runningBalance = 0;

    for (const dayIndex of activeDaysOldest) {
      const txDate   = daysAgo(dayIndex);
      const txCount  = dayIndex < user.streakDays
        ? randInt(1, 3, rng)
        : randInt(1, 2, rng);

      for (let t = 0; t < txCount; t++) {
        const category = pick(user.preferredCategories, rng);
        const [minAmt, maxAmt] = AMOUNT_RANGES[category];
        const amount   = randInt(minAmt, maxAmt, rng);
        const merchant = pick(MERCHANTS[category], rng);
        const points   = calcPoints(amount, category, user.tier);
        runningBalance += points;

        const occurredAt = new Date(txDate.getTime() + t * 3_600_000 + randInt(0, 3_599_999, rng));

        const txRef = db.collection('transactions').doc();
        txOps.push({
          ref: txRef,
          data: {
            id:              txRef.id,
            userId:          user.uid,
            householdId:     HOUSEHOLD_ID,
            amount,
            category,
            merchant,
            description:     merchant,
            pointsEarned:    points,
            occurredAt:      occurredAt.getTime(),
            isQualifying:    amount >= 100,
            transactionDate: admin.firestore.Timestamp.fromDate(occurredAt),
          },
        });

        const ledgerRef = db.collection('pointsLedger').doc();
        ledgerOps.push({
          ref: ledgerRef,
          data: {
            id:            ledgerRef.id,
            userId:        user.uid,
            householdId:   HOUSEHOLD_ID,
            transactionId: txRef.id,
            delta:         points,
            balance:       runningBalance,
            balanceAfter:  runningBalance,
            reason:        'transaction',
            relatedId:     txRef.id,
            createdAt:     admin.firestore.Timestamp.fromDate(occurredAt),
          },
        });
      }
    }

    // Adjustment entry to hit exact target points
    const diff = user.targetPoints - runningBalance;
    if (diff !== 0) {
      const adjRef = db.collection('pointsLedger').doc();
      ledgerOps.push({
        ref: adjRef,
        data: {
          id:            adjRef.id,
          userId:        user.uid,
          householdId:   HOUSEHOLD_ID,
          transactionId: null,
          delta:         diff,
          balance:       user.targetPoints,
          balanceAfter:  user.targetPoints,
          reason:        diff > 0 ? 'signup_bonus' : 'adjustment',
          relatedId:     null,
          createdAt:     admin.firestore.Timestamp.fromDate(daysAgo(35)),
        },
      });
    }

    await commitInBatches(txOps,     'transactions');
    await commitInBatches(ledgerOps, 'ledger entries');

    // 3f. Quests
    const quests = buildQuests(user.uid, user.tier);
    const questBatch = db.batch();
    for (const q of quests) {
      questBatch.set(db.collection('quests').doc((q as { id: string }).id), q);
    }
    await questBatch.commit();

    // 3g. Redemptions
    const redemptions = buildRedemptions(user.uid, user.targetPoints);
    if (redemptions.length > 0) {
      const redemptionBatch = db.batch();
      for (const r of redemptions) {
        redemptionBatch.set(
          db.collection('redemptions').doc((r as { id: string }).id),
          r,
        );
      }
      await redemptionBatch.commit();
    }

    console.log(
      `   ✓  tier=${user.tier.padEnd(8)} pts=${String(user.targetPoints).padStart(6)} ` +
      `streak=${user.streakDays}d  tx=${txOps.length}  quests=${quests.length}  redemptions=${redemptions.length}`
    );
    console.log('');
  }

  // ── 4. Summary ───────────────────────────────────────────────────────────
  console.log('─'.repeat(60));
  console.log('✅  Seed complete!\n');
  console.log('Demo logins (password: Demo1234! for all):');
  for (const u of USERS) {
    const tierEmoji = { platinum: '💎', gold: '🥇', silver: '🥈', bronze: '🥉' }[u.tier] ?? '•';
    console.log(`  ${tierEmoji}  ${u.email.padEnd(35)} ${u.targetPoints.toLocaleString()} pts`);
  }
  console.log('');
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
