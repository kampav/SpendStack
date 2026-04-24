import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { generateInviteCode } from '@/lib/household/inviteCode';
import type { ApiError } from '@/types';

interface HouseholdCreateResponse {
  householdId: string;
  name: string;
  inviteCode: string;
}

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing token');
  return (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<HouseholdCreateResponse | ApiError>> {
  let uid: string;
  try {
    uid = await verifyToken(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // If user already has a household, return it
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const existingHouseholdId = userDoc.data()?.householdId as string | undefined;

    if (existingHouseholdId) {
      const hDoc = await adminDb.collection('households').doc(existingHouseholdId).get();
      const hData = hDoc.data();
      return NextResponse.json({
        householdId: existingHouseholdId,
        name:        hData?.name        ?? 'My Household',
        inviteCode:  hData?.inviteCode  ?? '',
      });
    }

    // Create a new household
    const decodedToken = await adminAuth.getUser(uid);
    const firstName    = (decodedToken.displayName ?? 'My').split(' ')[0];
    const householdName = `${firstName}'s Household`;

    // Generate a unique invite code
    let inviteCode = generateInviteCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await adminDb
        .collection('households')
        .where('inviteCode', '==', inviteCode)
        .limit(1)
        .get();
      if (existing.empty) break;
      inviteCode = generateInviteCode();
    }

    const householdRef = adminDb.collection('households').doc();
    const householdId  = householdRef.id;
    const displayName  = decodedToken.displayName ?? 'User';
    const now          = adminDb.collection('_').doc(); // just for FieldValue access
    void now; // unused — use Date.now() instead for simplicity

    const batch = adminDb.batch();

    batch.set(householdRef, {
      id:         householdId,
      name:       householdName,
      memberUids: [uid],
      inviteCode,
      createdAt:  Date.now(),
    });

    batch.set(
      householdRef.collection('members').doc(uid),
      {
        uid,
        displayName,
        photoURL:    decodedToken.photoURL ?? null,
        totalPoints: 0,
        tier:        'bronze',
        streakDays:  0,
      },
    );

    // Upsert user doc with householdId (merge so we don't wipe existing fields)
    batch.set(
      adminDb.collection('users').doc(uid),
      { uid, displayName, email: decodedToken.email ?? '', householdId },
      { merge: true },
    );

    await batch.commit();

    return NextResponse.json({ householdId, name: householdName, inviteCode });
  } catch (err) {
    console.error('[household/create]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
