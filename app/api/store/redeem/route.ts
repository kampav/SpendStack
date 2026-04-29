import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { ApiError } from '@/types';

interface RedeemRequest {
  itemId:      string;
  itemTitle:   string;
  pointsCost:  number;
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
      typeof raw.itemId      !== 'string' || !raw.itemId      ||
      typeof raw.itemTitle   !== 'string' || !raw.itemTitle   ||
      typeof raw.pointsCost  !== 'number' || raw.pointsCost <= 0 ||
      typeof raw.householdId !== 'string' || !raw.householdId
    ) throw new Error('invalid');
    body = raw as RedeemRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { itemId, itemTitle, pointsCost, householdId } = body;

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
    if (currentPoints < pointsCost) {
      return NextResponse.json(
        {
          error: `Insufficient points — you have ${currentPoints.toLocaleString('en-GB')}, need ${pointsCost.toLocaleString('en-GB')}`,
        },
        { status: 400 },
      );
    }

    const newBalance = currentPoints - pointsCost;
    const now        = Date.now();
    const batch      = adminDb.batch();

    // Deduct from household member doc (real-time leaderboard picks this up)
    batch.update(memberRef, {
      totalPoints: FieldValue.increment(-pointsCost),
    });

    // Negative PointsLedger entry — server-side only per security rules
    const ledgerRef = adminDb.collection('pointsLedger').doc();
    batch.set(ledgerRef, {
      id:           ledgerRef.id,
      userId:       uid,
      householdId,
      delta:        -pointsCost,
      balance:      newBalance,
      reason:       'redemption',
      relatedId:    itemId,
      balanceAfter: newBalance,
      createdAt:    now,
    });

    // Redemption record
    const redemptionRef = adminDb.collection('redemptions').doc();
    batch.set(redemptionRef, {
      id:         redemptionRef.id,
      userId:     uid,
      itemId,
      itemTitle,
      pointsCost,
      status:     'fulfilled',
      createdAt:  now,
    });

    await batch.commit();

    return NextResponse.json({ success: true, newBalance });
  } catch (err) {
    console.error('[store/redeem]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
