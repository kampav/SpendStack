import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { ApiError } from '@/types';

interface HouseholdJoinResponse {
  householdId: string;
  name: string;
}

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing token');
  return (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<HouseholdJoinResponse | ApiError>> {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let code: string;
  try {
    const body = (await req.json()) as { code?: unknown };
    if (typeof body.code !== 'string' || body.code.trim().length === 0) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }
    code = body.code.trim().toUpperCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // Find household by invite code
    const snap = await adminDb
      .collection('households')
      .where('inviteCode', '==', code)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    const householdDoc  = snap.docs[0];
    const householdId   = householdDoc.id;
    const householdData = householdDoc.data();
    const name          = householdData.name as string;

    // If user is already a member, return idempotently
    const memberIds = (householdData.memberUids as string[]) ?? [];
    if (memberIds.includes(uid)) {
      return NextResponse.json({ householdId, name });
    }

    // Fetch the joining user's info
    const authUser    = await adminAuth.getUser(uid);
    const displayName = authUser.displayName ?? 'User';

    const batch = adminDb.batch();

    // Add uid to household's memberUids
    batch.update(householdDoc.ref, {
      memberUids: FieldValue.arrayUnion(uid),
    });

    // Create members sub-doc
    batch.set(householdDoc.ref.collection('members').doc(uid), {
      uid,
      displayName,
      photoURL:    authUser.photoURL ?? null,
      totalPoints: 0,
      tier:        'bronze',
      streakDays:  0,
    });

    // Update user doc
    batch.set(
      adminDb.collection('users').doc(uid),
      { uid, displayName, email: authUser.email ?? '', householdId },
      { merge: true },
    );

    await batch.commit();

    return NextResponse.json({ householdId, name });
  } catch (err) {
    console.error('[household/join]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
