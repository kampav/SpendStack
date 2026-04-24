// Alphanumeric chars excluding ambiguous I, O, 0, 1
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Generates a random 6-character alphanumeric invite code */
export function generateInviteCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)],
  ).join('');
}
