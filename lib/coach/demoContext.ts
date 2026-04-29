/**
 * Hardcoded synthetic coaching context for the 4 demo users.
 * Keyed by Firebase Auth UID — matches the seed script (scripts/seed.ts).
 *
 * This bypasses Firestore queries entirely so the AI Coach always has rich,
 * accurate data in demos regardless of index availability or network state.
 */
export const DEMO_COACH_CONTEXT: Record<string, string> = {

  // ── Sarah Mitchell — Platinum, 17,200 pts, 23-day streak ─────────────────
  'demo-sarah': `
USER: Sarah
TIER: Platinum (maximum tier — no further upgrades)
POINTS BALANCE: 17,200 pts
STREAK: 23 days active (personal best: 23 days — she is currently matching her all-time record!)

LAST 30 DAYS SPEND (31 transactions, total £1,247):
  • groceries: £312 (9 tx) — top category
  • dining: £284 (7 tx)
  • travel: £341 (6 tx)
  • shopping: £198 (6 tx)
  • entertainment: £112 (3 tx)
POINTS EARNED THIS PERIOD: 2,840 pts

ACTIVE QUESTS (2):
  • "Frequent Flyer" (travel, 83% complete — £341 of £410 target, +300 pts)
  • "Dining Devotee" (dining, 71% complete — £284 of £400 target, +250 pts)
COMPLETED QUESTS: "Grocery Champion", "Weekend Explorer", "Shopping Spree"

RECENT REDEMPTIONS: Spa Day for Two (3,000 pts), Cinema x2 Tickets (1,500 pts)
HOUSEHOLD RANK: #1 out of 4 members
`.trim(),

  // ── Marcus Johnson — Gold, 8,400 pts, 14-day streak ──────────────────────
  'demo-marcus': `
USER: Marcus
TIER: Gold (6,600 pts needed to reach Platinum — currently at 8,400 / 15,000)
POINTS BALANCE: 8,400 pts
STREAK: 14 days active (personal best: 14 days — currently at his best!)

LAST 30 DAYS SPEND (24 transactions, total £734):
  • dining: £267 (8 tx) — top category
  • entertainment: £189 (5 tx)
  • shopping: £156 (5 tx)
  • groceries: £122 (6 tx)
POINTS EARNED THIS PERIOD: 1,240 pts

ACTIVE QUESTS (2):
  • "Dining Devotee" (dining, 67% complete — £267 of £400 target, +250 pts)
  • "Entertainment King" (entertainment, 63% complete — £189 of £300 target, +200 pts)
COMPLETED QUESTS: "Shopping Sprint", "Dining Explorer"

HOUSEHOLD RANK: #2 out of 4 members (4,800 pts behind Sarah)
`.trim(),

  // ── Priya Sharma — Silver, 2,800 pts, 7-day streak ───────────────────────
  'demo-priya': `
USER: Priya
TIER: Silver (2,200 pts needed to reach Gold — currently at 2,800 / 5,000)
POINTS BALANCE: 2,800 pts
STREAK: 7 days active (personal best: 12 days)

LAST 30 DAYS SPEND (18 transactions, total £498):
  • groceries: £198 (7 tx) — top category
  • utilities: £112 (2 tx)
  • dining: £98 (4 tx)
  • shopping: £90 (5 tx)
POINTS EARNED THIS PERIOD: 620 pts

ACTIVE QUESTS (2):
  • "Grocery Grind" (groceries, 66% complete — £198 of £300 target, +150 pts)
  • "Utility Saver" (utilities, 56% complete — £112 of £200 target, +100 pts)
COMPLETED QUESTS: "First Steps"

HOUSEHOLD RANK: #3 out of 4 members (5,600 pts behind Marcus)
`.trim(),

  // ── Cleo Okonkwo — Bronze, 450 pts, 3-day streak ─────────────────────────
  'demo-cleo': `
USER: Cleo
TIER: Bronze (550 pts needed to reach Silver — currently at 450 / 1,000)
POINTS BALANCE: 450 pts
STREAK: 3 days active (personal best: 3 days — just getting started!)

LAST 30 DAYS SPEND (9 transactions, total £187):
  • groceries: £64 (3 tx)
  • travel: £58 (2 tx)
  • dining: £42 (2 tx)
  • shopping: £23 (2 tx)
POINTS EARNED THIS PERIOD: 187 pts

ACTIVE QUESTS (1):
  • "Bronze Boost" (groceries, 32% complete — £64 of £200 target, +80 pts)
COMPLETED QUESTS: None yet

HOUSEHOLD RANK: #4 out of 4 members (2,350 pts behind Priya)
`.trim(),
};
