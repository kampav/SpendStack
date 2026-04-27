import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { ApiError } from '@/types';

interface RedeemRequest {
  itemId:      string;
  itemTitle:   string;
  cost:        number;
  householdId: string;
}

interface RedeemResponse {
  success:    true;
  newBalance: number;
}

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing token');
  return (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<RedeemResponse | ApiError>> {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: RedeemRequest;
  try {
    const raw = (await req.json()) as Partial<RedeemRequest>;
    if (
      typeof raw.itemId      !== 'string' || !raw.itemId ||
      typeof raw.itemTitle   !== 'string' || !raw.itemTitle ||
      typeof raw.cost        !== 'number' || raw.cost <= 0 ||
      typeof raw.householdId !== 'string' || !raw.householdId
    ) throw new Error('invalid');
    body = raw as RedeemRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { itemId, itemTitle, cost, householdId } = body;

  try {
    const memberRef = adminDb
      .collection('households')
      .doc(householdId)
      .collection('members')
      .doc(uid);

    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const currentPoints = (memberSnap.data()?.totalPoints as number) ?? 0;
    if (currentPoints < cost) {
      return NextResponse.json(
        { error: `Insufficient points — you have ${currentPoints.toLocaleString('en-GB')}, need ${cost.toLocaleString('en-GB')}` },
        { status: 400 },
      );
    }

    const newBalance = currentPoints - cost;
    const now        = Date.now();
    const batch      = adminDb.batch();

    // Deduct from household member doc (real-time leaderboard picks this up)
    batch.update(memberRef, {
      totalPoints: FieldValue.increment(-cost),
    });

    // Write negative ledger entry
    const ledgerRef = adminDb.collection('pointsLedger').doc();
    batch.set(ledgerRef, {
      id:            ledgerRef.id,
      userId:        uid,
      householdId,
      transactionId: null,
      delta:         -cost,
      balance:       newBalance,
      balanceAfter:  newBalance,
      reason:        'redemption',
      relatedId:     null,
      createdAt:     now,
    });

    // Write redemption record
    const redemptionRef = adminDb.collection('redemptions').doc();
    batch.set(redemptionRef, {
      id:         redemptionRef.id,
      userId:     uid,
      itemId,
      itemTitle,
      pointsCost: cost,
      status:     'pending',
      createdAt:  now,
    });

    await batch.commit();

    return NextResponse.json({ success: true, newBalance });
  } catch (err) {
    console.error('[store/redeem]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
