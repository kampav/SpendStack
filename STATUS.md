# STATUS.md — SpendStack

> Last synced: 2026-04-27 · Commit: a919739

---

## Deployment

| Key | Value |
|---|---|
| **Live URL** | https://spendstack-c5dnxkbnkq-nw.a.run.app |
| **Cloud Run service** | `spendstack` · `europe-west2` |
| **CI/CD** | `.github/workflows/deploy.yml` — test → build → Cloud Run (main only) |
| **Auth method** | Workload Identity Federation (no stored keys) |
| **Last confirmed green deploy** | commit `619e67e` (Run #8) |
| **Pending deploys** | `467854b`, `a919739` — pushed, CI triggered |

---

## Feature Status

### Pre-built (demo-ready)

| Feature | Page | Hook / Lib | Tests | Notes |
|---|---|---|---|---|
| Household Leaderboard | `app/(app)/leaderboard/page.tsx` | `useLeaderboard` · Firestore real-time | 12 (tier resolver) | Podium + rank rows, period toggle |
| Streak Tracker | `app/(app)/streak/page.tsx` | `useStreak` · `lib/streak/engine.ts` | 12 (engine) | 30-day grid, milestones, roadmap |
| Tier Progression | `app/(app)/tier/page.tsx` | `lib/tier/resolver.ts` | 12 (resolver) | Hero card, ladder, perks |
| Points Calculator | — | `lib/points/calculator.ts` | 9 | Base rates × tier multipliers |
| Dashboard | `app/(app)/dashboard/page.tsx` | `useLeaderboard`, `useStreak`, `resolveTierProgress` | — | Hero points, tier bar, streak/rank mini-cards |
| Auth (sign-in/sign-up) | `app/(auth)/sign-in/page.tsx` | `AuthProvider` | — | Firebase Auth, token verified on all routes |
| Household invite/join | `app/(app)/household/page.tsx` | `useHousehold` · `lib/household/inviteCode.ts` | 5 (inviteCode) | 6-char code, copy/share, join form |

### Live-add candidates (scaffolded — pick one for 40-min demo)

| Feature | Status | What works | What's missing |
|---|---|---|---|
| **AI Quests** | ⚠️ API ✅ · Page ❌ | `POST /api/quests/generate` calls Claude, writes to Firestore | Quests page uses `DEMO_QUESTS` static data; needs `useQuests` hook + swap |
| **Rewards Store** | ⚠️ Page ✅ · Redemption ❌ | Catalogue grid, affordability lock, category filter | `handleRedeem` shows toast only — no API call, no points deduction |
| **AI Spending Coach** | ✅ Complete | Streaming Claude chat, suggestion chips, ARIA live region | — |

### Incomplete / Stub

| Item | Location | What's missing |
|---|---|---|
| Recent transactions feed | `dashboard/page.tsx` L18–22 | 3 hardcoded rows; needs `useTransactions` hook + real query |
| Quest completion trigger | — | No worker checks transactions against active quests; no auto-credit |
| Streak milestone bonus | `lib/streak/engine.ts` `getMilestone()` | Milestone detected but no API credits bonus points to ledger |
| Redemption history on Profile | `profile/page.tsx` | Placeholder settings rows; no redemption list |
| Solo-user leaderboard invite prompt | `leaderboard/page.tsx` | Always renders rows; PRD requires invite CTA if memberCount === 1 |
| Settings pages | `profile/page.tsx` L82–91 | 4 non-functional button rows; no routes behind them |

---

## Test Summary

| File | Tests | Covers |
|---|---|---|
| `lib/points/calculator.test.ts` | 9 | All categories × all tiers, edge cases |
| `lib/streak/engine.test.ts` | 12 | Advance, reset, milestone, isAlive, activeDates |
| `lib/tier/resolver.test.ts` | 12 | Tier boundaries, resolveTierProgress, getTierByName |
| `lib/household/inviteCode.test.ts` | 5 | Length, charset, no-ambiguous-chars, uniqueness |
| `app/api/coach/chat/route.test.ts` | 2 | Auth 401, streaming format |
| `app/api/quests/generate/route.test.ts` | 2 | Auth 401, JSON quest array |
| `components/shared/ProgressBar.test.tsx` | 5 | Render, ARIA, sheen, color variants |
| **Total** | **47** | All passing |

---

## Drift Flags (code vs DESIGN.md / PRD.md)

| Location | Spec | Actual | Severity |
|---|---|---|---|
| All `<h1>` elements | 32px (`h1` token per DESIGN.md) | `text-[26px]` | Low |
| PRD.md tier 1 name | "Everyday (0–999 pts)" | "Bronze" in code + seed + UI | Medium |
| StreakCalendar spec | 7-col grid, 36px circles, Mon–Sun labels, milestone stars | 10-col grid, no day labels, no stars | Medium |
| Platinum badge colour | DESIGN.md: navy bg, gold text | `#E5E4E2` (light grey) bg | Medium |
| Store `handleRedeem` | Writes negative ledger entry | Toast only — no write | **High** |
| `components/shared/PageHeader.tsx` | Not in DESIGN.md | Exists, unused (orphan) | Low |

---

## Demo Seed Data

**Password for all:** `Demo1234!`

| Login | Tier | Points | Streak | Transactions | Quests | Redemptions |
|---|---|---|---|---|---|---|
| sarah@demo.spendstack.app | 💎 Platinum | 17,200 | 23d | 55 | 5 (2 active, 2 done, 1 expired) | 3 |
| marcus@demo.spendstack.app | 🥇 Gold | 8,400 | 14d | 49 | 5 | 3 |
| priya@demo.spendstack.app | 🥈 Silver | 2,800 | 7d | 44 | 5 | 2 |
| cleo@demo.spendstack.app | 🥉 Bronze | 450 | 3d | 43 | 5 | 0 |

All in `demo-household`. Household invite code: `DEMO01`.
Re-seed anytime: `npm run seed` (idempotent — updates existing auth users).

---

## Pre-demo Checklist

- [ ] Verify live URL loads: https://spendstack-c5dnxkbnkq-nw.a.run.app
- [ ] Sign in as `sarah@demo.spendstack.app` / `Demo1234!` — confirm Platinum badge, 17,200 pts, 23-day streak
- [ ] Check leaderboard shows all 4 members in correct order
- [ ] Tap Household tab — confirm invite code visible
- [ ] AI Coach: ask "How am I doing this month?" — confirm streaming response
- [ ] Choose live-add feature (Quests recommended — highest wow factor)

### To make Quests fully demo-ready (Priority 1, ~30 min)
1. Create `lib/hooks/useQuests.ts` — Firestore `onSnapshot` on `quests` where `userId == uid`
2. Replace `DEMO_QUESTS` in `app/(app)/quests/page.tsx` with hook result
3. Done — seeded quest data appears, Generate button creates live AI quests

### To make Store redemption real (Priority 2, ~45 min)
1. Create `app/api/store/redeem/route.ts` — verify token, check balance, write negative ledger entry, update member totalPoints
2. In `store/page.tsx`, replace `handleRedeem` with a fetch call to the route
3. Done — points deduct live on screen
