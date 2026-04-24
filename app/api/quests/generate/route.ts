import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { anthropic } from '@/lib/anthropic/client';
import type { Quest, Transaction, ApiError } from '@/types';

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function POST(req: NextRequest): Promise<NextResponse<Quest[] | ApiError>> {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch last 30 transactions for user
    const txSnap = await adminDb
      .collection('transactions')
      .where('userId', '==', uid)
      .orderBy('occurredAt', 'desc')
      .limit(30)
      .get();

    const transactions = txSnap.docs.map((d) => d.data() as Transaction);

    const summary = transactions
      .map(
        (t) =>
          `£${(t.amount / 100).toFixed(2)} at ${t.merchant} (${t.category}) on ${new Date(t.occurredAt).toLocaleDateString('en-GB')}`
      )
      .join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a UK retail banking loyalty app. Based on the user's recent transactions, generate exactly 3 personalised spending quests in JSON format.

Recent transactions:
${summary || 'No transactions yet.'}

Return a JSON array of 3 objects with this shape:
[
  {
    "title": "Short quest title",
    "description": "One-sentence description",
    "category": "groceries|dining|travel|utilities|entertainment|shopping|other",
    "targetAmount": 5000,   // in pence
    "pointsReward": 150     // integer
  }
]

Rules:
- Base quests on actual spending patterns
- targetAmount between 1000 and 20000 pence
- pointsReward between 50 and 500
- Return ONLY the JSON array, no other text`,
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const parsed = JSON.parse(raw) as Array<{
      title: string;
      description: string;
      category: Quest['category'];
      targetAmount: number;
      pointsReward: number;
    }>;

    const now = Date.now();
    const batch = adminDb.batch();
    const quests: Quest[] = [];

    for (const q of parsed.slice(0, 3)) {
      const ref = adminDb.collection('quests').doc();
      const quest: Quest = {
        id: ref.id,
        userId: uid,
        title: q.title,
        description: q.description,
        category: q.category,
        targetAmount: q.targetAmount,
        currentAmount: 0,
        pointsReward: q.pointsReward,
        status: 'active',
        expiresAt: now + 7 * 86_400_000, // 7 days
        createdAt: now,
      };
      batch.set(ref, quest);
      quests.push(quest);
    }

    await batch.commit();
    return NextResponse.json(quests);
  } catch (err) {
    console.error('[quests/generate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
