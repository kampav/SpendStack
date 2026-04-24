# CLAUDE.md — SpendStack Session Context

SpendStack is a gamified UK retail banking loyalty app where household members earn points on spend, build streaks, climb tiers, and compete on a household leaderboard — built as a 40-minute live demo of the full Claude-powered SDLC loop.

**Stack:** Next.js 14 App Router · TypeScript strict · Tailwind CSS · shadcn/ui · Firebase Auth + Firestore · Anthropic SDK (claude-sonnet-4-20250514) · Vitest · Playwright · GCP Cloud Run · GitHub Actions WIF

**Palette:**
```
Primary:  #006A4D
Accent:   #38A169
Navy:     #1A2B3C
Gold:     #D4A017
Cream:    #FBF9F4
Error:    #C53030
N-100:    #F7F7F7
N-200:    #E2E8F0
N-500:    #718096
```

**Coding conventions:**
- TypeScript strict — no `any`, no `@ts-ignore`, no disabled ESLint rules
- Server components by default; use `'use client'` only when needed (event handlers, hooks, browser APIs)
- Named exports everywhere — no default exports except page.tsx and layout.tsx
- Use shadcn/ui components before writing custom ones
- Tests live alongside source: `MyComponent.test.tsx` next to `MyComponent.tsx`
- Never expose `ANTHROPIC_API_KEY` to the client — Anthropic SDK in API routes only
- All Firestore writes that affect PointsLedger go through Admin SDK (server-side)

**Commit style (Conventional Commits):**
```
feat: add streak calendar component
fix: correct tier threshold for gold
chore: update firebase-admin to 12.x
test: add e2e spec for redemption flow
docs: update ARCHITECTURE.md with WIF commands
```

**Features:**
- Pre-built (in repo at demo start): Household Leaderboard, Streak Tracker, Tier Progression
- Live-add (audience picks one): AI Quests, Redemption Store, AI Spending Coach

Every feature must match DESIGN.md exactly — palette, type scale, component names, spacing, accessibility rules.

**Before finishing any task:**
- [ ] `npm run test` passes (Vitest)
- [ ] `npm run typecheck` passes (tsc --noEmit)
- [ ] `npm run lint` passes (ESLint)
- [ ] Conventional commit made with descriptive scope
