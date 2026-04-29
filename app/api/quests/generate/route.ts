import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { anthropic } from '@/lib/anthropic/client';
import type { Quest, Transaction, ApiError } from '@/types';

// ── Synthetic transaction summaries for demo users ────────────────────────────
// Avoids needing a composite Firestore index (userId + occurredAt) that isn't
// provisioned in Cloud Run. Real users fall through to the Firestore query.
const DEMO_TX_SUMMARIES: Record<string, string> = {
  'demo-sarah': `
£68.40 at Waitrose (groceries) on 28/04/2025
£124.00 at British Airways (travel) on 26/04/2025
£42.50 at Dishoom (dining) on 25/04/2025
£89.99 at ASOS (shopping) on 24/04/2025
£31.20 at Sainsbury's (groceries) on 23/04/2025
£215.00 at Eurostar (travel) on 21/04/2025
£55.00 at Nobu (dining) on 20/04/2025
£47.80 at Marks & Spencer (groceries) on 19/04/2025
£38.00 at Vue Cinema (entertainment) on 18/04/2025
£72.00 at Uber (travel) on 17/04/2025`.trim(),

  'demo-marcus': `
£67.50 at Dishoom (dining) on 28/04/2025
£48.00 at Odeon (entertainment) on 27/04/2025
£89.00 at Nike (shopping) on 25/04/2025
£34.20 at Wagamama (dining) on 24/04/2025
£45.00 at Spotify + Netflix (entertainment) on 23/04/2025
£28.40 at Tesco (groceries) on 22/04/2025
£72.00 at Hawksmoor (dining) on 21/04/2025
£55.00 at H&M (shopping) on 20/04/2025
£41.00 at Five Guys (dining) on 19/04/2025
£38.00 at PlayStation Store (entertainment) on 18/04/2025`.trim(),

  'demo-priya': `
£54.30 at Sainsbury's (groceries) on 28/04/2025
£82.00 at British Gas (utilities) on 27/04/2025
£31.50 at Dishoom (dining) on 25/04/2025
£47.20 at Tesco (groceries) on 24/04/2025
£29.00 at Thames Water (utilities) on 23/04/2025
£24.80 at Pret A Manger (dining) on 22/04/2025
£38.60 at ALDI (groceries) on 21/04/2025
£45.00 at Zara (shopping) on 20/04/2025
£18.90 at Itsu (dining) on 19/04/2025
£30.00 at EDF Energy (utilities) on 18/04/2025`.trim(),

  'demo-cleo': `
£32.40 at Lidl (groceries) on 28/04/2025
£48.00 at TfL Oyster (travel) on 27/04/2025
£22.50 at Nando's (dining) on 25/04/2025
£28.00 at Amazon (shopping) on 24/04/2025
£18.60 at Tesco Express (groceries) on 23/04/2025
£35.00 at National Rail (travel) on 22/04/2025
£14.90 at McDonald's (dining) on 21/04/2025
£19.80 at ALDI (groceries) on 20/04/2025`.trim(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  return (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
}

/** Strip markdown code fences Claude sometimes wraps JSON in */
function extractJSON(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

async function getTransactionSummary(uid: string): Promise<string> {
  // Demo users → use hardcoded summary (no composite index needed)
  if (DEMO_TX_SUMMARIES[uid]) return DEMO_TX_SUMMARIES[uid];

  // Real users → simple single-field query (auto-indexed by Firestore)
  const snap = await adminDb
    .collection('transactions')
    .where('userId', '==', uid)
    .limit(30)
    .get();

  if (snap.empty) return 'No transactions yet.';

  return snap.docs
    .map((d) => {
      const t = d.data() as Transaction;
      return `£${(t.amount / 100).toFixed(2)} at ${t.merchant} (${t.category}) on ${new Date(t.occurredAt).toLocaleDateString('en-GB')}`;
    })
    .join('\n');
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<Quest[] | ApiError>> {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await getTransactionSummary(uid);

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role:    'user',
          content: `You are a UK retail banking loyalty app. Based on the user's recent transactions, generate exactly 3 personalised spending quests.

Recent transactions:
${summary}

Return a JSON array of exactly 3 objects. Return ONLY the raw JSON — no markdown, no code fences, no explanation.

[
  {
    "title": "Short quest title",
    "description": "One-sentence challenge description",
    "category": "groceries|dining|travel|utilities|entertainment|shopping|other",
    "targetAmount": 5000,
    "pointsReward": 150
  }
]

Rules:
- Base quests on the spending categories visible in the transactions
- targetAmount must be between 1000 and 20000 (pence)
- pointsReward must be between 50 and 500 (integer)`,
        },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const cleaned = extractJSON(rawText);

    const parsed = JSON.parse(cleaned) as Array<{
      title:        string;
      description:  string;
      category:     Quest['category'];
      targetAmount: number;
      pointsReward: number;
    }>;

    const now   = Date.now();
    const batch = adminDb.batch();
    const quests: Quest[] = [];

    for (const q of parsed.slice(0, 3)) {
      const ref   = adminDb.collection('quests').doc();
      const quest: Quest = {
        id:            ref.id,
        userId:        uid,
        title:         q.title,
        description:   q.description,
        category:      q.category,
        targetAmount:  q.targetAmount,
        currentAmount: 0,
        pointsReward:  q.pointsReward,
        status:        'active',
        expiresAt:     now + 7 * 86_400_000,
        createdAt:     now,
      };
      batch.set(ref, quest);
      quests.push(quest);
    }

    await batch.commit();
    return NextResponse.json(quests);
  } catch (err) {
    console.error('[quests/generate] error:', err);
    return NextResponse.json({ error: 'Generation failed — try again.' }, { status: 500 });
  }
}
