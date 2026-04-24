import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { calculatePoints } from '@/lib/points/calculator';
import { resolveTier } from '@/lib/tier/resolver';
import type { Transaction, ApiError } from '@/types';

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = authHeader.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

interface SyncPayload {
  transactions: Array<Omit<Transaction, 'id' | 'userId' | 'pointsEarned'>>;
}

export async function POST(req: NextRequest): Promise<NextResponse<{ synced: number } | ApiError>> {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { transactions } = (await req.json()) as SyncPayload;

    // Get user's current total points to resolve tier
    const ledgerSnap = await adminDb
      .collection('pointsLedger')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    const currentBalance = ledgerSnap.empty
      ? 0
      : (ledgerSnap.docs[0].data().balance as number);

    const tier = resolveTier(currentBalance);
    const batch = adminDb.batch();
    let runningBalance = currentBalance;

    for (const tx of transactions) {
      const points = calculatePoints(tx.amount, tx.category, tier.id);
      runningBalance += points;

      const txRef = adminDb.collection('transactions').doc();
      const txDoc: Transaction = {
        id: txRef.id,
        userId: uid,
        pointsEarned: points,
        ...tx,
      };
      batch.set(txRef, txDoc);

      const ledgerRef = adminDb.collection('pointsLedger').doc();
      batch.set(ledgerRef, {
        id: ledgerRef.id,
        userId: uid,
        householdId: tx.householdId,
        transactionId: txRef.id,
        delta: points,
        balance: runningBalance,
        reason: `Spend at ${tx.merchant}`,
        createdAt: Date.now(),
      });
    }

    await batch.commit();
    return NextResponse.json({ synced: transactions.length });
  } catch (err) {
    console.error('[transactions/sync]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
