import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { anthropic } from '@/lib/anthropic/client';
import { DEMO_COACH_CONTEXT } from '@/lib/coach/demoContext';
import type { CoachMessage } from '@/types';

// ── Auth ──────────────────────────────────────────────────────────────────────

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
}

// ── User context builder ──────────────────────────────────────────────────────

interface SpendSummary {
  category: string;
  totalGBP: number;
  txCount: number;
}

async function buildUserContext(uid: string): Promise<string> {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 86_400_000;

  // Parallel fetches — all server-side via Admin SDK
  const [userSnap, streakSnap, txSnap, questSnap] = await Promise.all([
    adminDb.collection('users').doc(uid).get(),
    adminDb.collection('streaks').doc(uid).get(),
    adminDb
      .collection('transactions')
      .where('userId', '==', uid)
      .where('occurredAt', '>=', thirtyDaysAgo)
      .orderBy('occurredAt', 'desc')
      .limit(30)
      .get(),
    adminDb
      .collection('quests')
      .where('userId', '==', uid)
      .where('status', 'in', ['active', 'completed'])
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get(),
  ]);

  // ── User profile ───────────────────────────────────────────────────────────
  const user = userSnap.data() ?? {};
  const displayName  = (user.displayName  as string)  ?? 'User';
  const householdId  = (user.householdId  as string)  ?? null;
  const tierId       = (user.tierId       as string)  ?? 'bronze';

  // ── Member points (from household subcollection) ───────────────────────────
  let totalPoints = 0;
  if (householdId) {
    const memberSnap = await adminDb
      .collection('households')
      .doc(householdId)
      .collection('members')
      .doc(uid)
      .get();
    totalPoints = (memberSnap.data()?.totalPoints as number) ?? 0;
  }

  // ── Streak ─────────────────────────────────────────────────────────────────
  const streak = streakSnap.data() ?? {};
  const currentStreak = (streak.currentDays as number) ?? 0;
  const longestStreak = (streak.longestDays as number) ?? 0;

  // ── Transactions → spend by category ──────────────────────────────────────
  const categoryMap: Record<string, { total: number; count: number }> = {};
  let totalSpendPence = 0;
  let totalPointsEarned = 0;

  for (const doc of txSnap.docs) {
    const tx = doc.data();
    const cat   = (tx.category    as string) ?? 'other';
    const amt   = (tx.amount      as number) ?? 0;
    const pts   = (tx.pointsEarned as number) ?? 0;
    totalSpendPence  += amt;
    totalPointsEarned += pts;
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    categoryMap[cat].total += amt;
    categoryMap[cat].count += 1;
  }

  const spendByCategory: SpendSummary[] = Object.entries(categoryMap)
    .map(([category, { total, count }]) => ({
      category,
      totalGBP: Math.round(total / 100) ,
      txCount:  count,
    }))
    .sort((a, b) => b.totalGBP - a.totalGBP);

  // ── Quests ─────────────────────────────────────────────────────────────────
  const activeQuests  = questSnap.docs
    .filter((d) => d.data().status === 'active')
    .map((d) => {
      const q = d.data();
      const pct = q.targetAmount > 0
        ? Math.round(((q.currentAmount as number) / (q.targetAmount as number)) * 100)
        : 0;
      return `"${q.title as string}" (${q.category as string}, ${pct}% complete, +${q.pointsReward as number} pts)`;
    });

  const completedQuests = questSnap.docs
    .filter((d) => d.data().status === 'completed')
    .map((d) => `"${d.data().title as string}"`);

  // ── Tier thresholds ────────────────────────────────────────────────────────
  const tierMap: Record<string, { next: string; threshold: number }> = {
    bronze:   { next: 'Silver',   threshold: 1_000  },
    silver:   { next: 'Gold',     threshold: 5_000  },
    gold:     { next: 'Platinum', threshold: 15_000 },
    platinum: { next: 'Platinum', threshold: Infinity },
  };
  const { next: nextTier, threshold } = tierMap[tierId] ?? tierMap.bronze;
  const ptsToNext = tierId === 'platinum' ? null : threshold - totalPoints;

  // ── Assemble context block ─────────────────────────────────────────────────
  const lines = [
    `USER: ${displayName}`,
    `TIER: ${tierId.charAt(0).toUpperCase() + tierId.slice(1)}${ptsToNext != null ? ` (${ptsToNext.toLocaleString('en-GB')} pts to ${nextTier})` : ' — Maximum tier!'}`,
    `POINTS BALANCE: ${totalPoints.toLocaleString('en-GB')} pts`,
    `STREAK: ${currentStreak} days active (personal best: ${longestStreak} days)`,
    ``,
    `LAST 30 DAYS SPEND (${txSnap.size} transactions, total £${Math.round(totalSpendPence / 100).toLocaleString('en-GB')}):`,
    ...spendByCategory.map(
      (s) => `  • ${s.category}: £${s.totalGBP.toLocaleString('en-GB')} (${s.txCount} tx)`,
    ),
    `POINTS EARNED THIS PERIOD: ${totalPointsEarned.toLocaleString('en-GB')} pts`,
    ``,
    `ACTIVE QUESTS (${activeQuests.length}):`,
    ...(activeQuests.length > 0 ? activeQuests.map((q) => `  • ${q}`) : ['  • None']),
    `COMPLETED QUESTS: ${completedQuests.length > 0 ? completedQuests.join(', ') : 'None yet'}`,
  ];

  return lines.join('\n');
}

// ── System prompt factory ─────────────────────────────────────────────────────

function buildSystemPrompt(userContext: string): string {
  return `You are SpendStack Coach — a friendly, encouraging personal finance coach built into the SpendStack UK banking loyalty app.

You have real-time access to this user's SpendStack data:

--- USER DATA ---
${userContext}
--- END USER DATA ---

Guidelines:
- Address the user by first name
- Reference their actual numbers — tier, points balance, streak, spend categories, quests
- Keep responses concise (3-5 sentences). Be specific, not generic
- Use British English and £ for currency (amounts in the data are already in £)
- Celebrate wins (streaks, completed quests, tier progress) enthusiastically
- Suggest actionable next steps tied to their real data (e.g. specific categories to hit quest targets)
- Never give regulated financial advice — suggest an FCA-authorised adviser for investments, mortgages or pensions
- Tone: warm, direct, a little playful — like a knowledgeable friend, not a corporate chatbot`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = (await req.json()) as { messages: CoachMessage[] };
  const { messages } = body;

  // 1. Demo users → use hardcoded synthetic context (always works, no index deps)
  // 2. Real users → fetch from Firestore (best-effort, falls back to generic)
  let systemPrompt: string;
  if (DEMO_COACH_CONTEXT[uid]) {
    systemPrompt = buildSystemPrompt(DEMO_COACH_CONTEXT[uid]);
  } else {
    try {
      const userContext = await buildUserContext(uid);
      systemPrompt = buildSystemPrompt(userContext);
    } catch (err) {
      console.error('[coach/chat] context fetch failed:', err);
      systemPrompt = buildSystemPrompt('(User data unavailable — give general SpendStack guidance)');
    }
  }

  const stream = anthropic.messages.stream({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 512,
    system:     systemPrompt,
    messages:   messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
