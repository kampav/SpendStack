import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  WithFieldValue,
} from 'firebase/firestore';
import type {
  User,
  Household,
  HouseholdMember,
  Transaction,
  PointsLedgerEntry,
  Streak,
  Quest,
  CatalogueItem,
  Redemption,
} from '@/types';

function converter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: WithFieldValue<T>): DocumentData {
      return data as DocumentData;
    },
    fromFirestore(snap: QueryDocumentSnapshot): T {
      return { id: snap.id, ...snap.data() } as unknown as T;
    },
  };
}

export const userConverter = converter<User>();
export const householdConverter = converter<Household>();
export const householdMemberConverter = converter<HouseholdMember>();
export const transactionConverter = converter<Transaction>();
export const pointsLedgerConverter = converter<PointsLedgerEntry>();
export const streakConverter = converter<Streak>();
export const questConverter = converter<Quest>();
export const catalogueConverter = converter<CatalogueItem>();
export const redemptionConverter = converter<Redemption>();
