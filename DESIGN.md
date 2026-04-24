# DESIGN.md — SpendStack Design System

## Colour Palette

| Token | Hex | Usage |
|---|---|---|
| `--colour-primary` | `#006A4D` | CTAs, active states, tier badges, nav indicator |
| `--colour-accent` | `#38A169` | Progress bars, streak active days, success states |
| `--colour-navy` | `#1A2B3C` | Page headings, high-emphasis text, dark surfaces |
| `--colour-gold` | `#D4A017` | Milestone badges, Platinum tier, streak rings, reward highlights |
| `--colour-cream` | `#FBF9F4` | Page background, card surfaces |
| `--colour-error` | `#C53030` | Error messages, insufficient balance warnings |
| `--colour-neutral-100` | `#F7F7F7` | Subtle background fills (inputs, inactive rows) |
| `--colour-neutral-200` | `#E2E8F0` | Borders, dividers, skeleton loaders |
| `--colour-neutral-500` | `#718096` | Body text, secondary labels, captions |

**Usage rules:**
- Never use `--colour-primary` as a text colour on `--colour-cream` at body size — fails contrast. Use `--colour-navy` for body text.
- `--colour-gold` is reserved for achievement moments only. Do not use as a general accent.
- Interactive elements must have a 3:1 minimum contrast ratio on their background (WCAG AA for UI components).
- Error states always use `--colour-error`. Never use red for anything decorative.

---

## Type Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `h1` | 2rem (32px) | 700 | Page title (Dashboard header, screen name) |
| `h2` | 1.5rem (24px) | 600 | Section headings (Leaderboard, This Month) |
| `h3` | 1.125rem (18px) | 600 | Card titles, quest names |
| `body` | 1rem (16px) | 400 | All body copy |
| `body-sm` | 0.875rem (14px) | 400 | Secondary labels, timestamps, captions |
| `label` | 0.75rem (12px) | 600 | All-caps badge text, stat labels (letter-spacing: 0.05em) |

Font family: `'Inter', ui-sans-serif, system-ui, sans-serif`
Line height: 1.5 for body, 1.2 for headings
Antialiasing: `-webkit-font-smoothing: antialiased` on all text

---

## Spacing Scale

Based on a 4px base unit. Use Tailwind spacing tokens:

| Token | Value | Use case |
|---|---|---|
| `space-1` | 4px | Internal icon padding |
| `space-2` | 8px | Inline spacing, chip padding |
| `space-3` | 12px | Card internal padding (compact) |
| `space-4` | 16px | Standard card padding |
| `space-6` | 24px | Between sections |
| `space-8` | 32px | Page-level section gap |
| `space-12` | 48px | Hero/header breathing room |

---

## Component Inventory

### Card
Rounded-xl (12px), soft shadow (`0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`), background `--colour-cream`, padding `space-4`. No border unless interactive hover state (border `1px solid --colour-neutral-200`). Cards never stack without `space-4` gap.

### Button
**Primary:** Background `--colour-primary`, text white, rounded-lg, px-6 py-3, font-weight 600, hover: 8% darker via `brightness(0.92)`, focus: 2px offset ring in `--colour-primary` at 50% opacity. Disabled: opacity-40, cursor-not-allowed.
**Secondary:** Background transparent, border `1.5px solid --colour-primary`, text `--colour-primary`, same sizing. Hover: `--colour-primary` at 8% opacity background fill.
**Ghost:** No border, no background, text `--colour-navy`. Hover: `--colour-neutral-100` background. Used for nav items and contextual actions.
**Destructive:** Background `--colour-error`, text white. Confirm-only — never appears as first call to action.

### Badge
Rounded-full, label-size text, px-2 py-0.5. Variants: `tier-everyday` (neutral-500 bg), `tier-silver` (neutral-200 bg, navy text), `tier-gold` (gold bg, navy text), `tier-platinum` (navy bg, gold text). Status: `success` (accent bg, white text), `pending` (gold bg, navy text), `error` (error bg, white text).

### ProgressBar
Height 8px, rounded-full, background `--colour-neutral-200`. Fill: `--colour-accent` for standard progress, `--colour-gold` for tier fill near milestone. Animated fill transition: `width 600ms ease-out` on mount. Always accompanied by a label showing percentage or `X pts to go`.

### Avatar
Circular. Sizes: sm (32px), md (40px), lg (56px). Shows image if `avatarUrl` set; otherwise shows initials in 2 chars, background derived from `uid` hash (one of 6 predefined brand-safe colours), white text. Border `2px solid --colour-cream` when stacked on coloured backgrounds.

### LeaderboardRow
Full-width row with: rank number (bold, 2ch fixed width), Avatar (sm), displayName (body), tier badge, points total (right-aligned, bold, `--colour-primary`), weekly delta (caption, green if positive, muted if zero). Own row: subtle `--colour-primary` left border 3px, background `--colour-primary` at 4% opacity. Hover: `--colour-neutral-100` background. 56px min-height.

### StreakCalendar
7-column grid. Each cell: 36px circle. States: `active` (filled `--colour-accent`, white checkmark icon), `missed` (`--colour-neutral-200` fill, no icon), `today-active` (`--colour-accent` fill + `--colour-gold` 2px ring), `today-pending` (dashed `--colour-neutral-200` border, gold centre dot), `future` (invisible / empty). Row labels: Mon–Sun. Milestone markers appear as star icons below the relevant day cell.

### TierMeter
Horizontal layout: tier badge (left), ProgressBar (centre, full width), next tier label + points gap (right). Below bar: small caption "X pts until Gold". Platinum users see "Maximum tier achieved" with a gold shimmer animation on the badge.

### QuestCard
Card component. Header row: category icon + title. Body: description (body-sm, 2 lines max, ellipsis). Footer: points reward badge (gold), expiry label (caption), status. Active quests have a thin `--colour-accent` top border. Complete quests: greyed out, green checkmark overlay. Tappable — navigates to quest detail sheet.

### RedemptionTile
Square card (aspect-ratio 1:1 on mobile, fixed 180px on desktop). Image fills top 60%, object-cover. Bottom: item title (h3), points cost with coin icon. Insufficient balance: overlay with lock icon + "Need X more pts". Hover: slight scale-up (1.02) and shadow elevation.

### CoachMessage
Chat-bubble style. User messages: right-aligned, `--colour-primary` background, white text, rounded-tr-none. Coach messages: left-aligned, white background, `--colour-navy` text, rounded-tl-none, small avatar (green "S" monogram). Streaming text: blinking cursor `|` while tokens arrive. Message container scrolls to bottom on new message.

---

## Screen Layouts

**Dashboard**
Top: greeting header ("Good morning, Pav") with current tier badge. Below: TierMeter full-width card. Two-column grid (mobile: stacked): StreakCalendar card (left/top), a summary stats card showing this month's points and rank (right/bottom). Bottom: truncated Leaderboard (top 3 rows, "See all →" link).

**Leaderboard**
Full-screen list. Header: household name + member count. Period toggle (This Month / All Time) as a segmented control. Sorted LeaderboardRow list. Pull-to-refresh on mobile. Empty state if solo user: illustration + "Invite your household" CTA.

**Profile**
Top: large Avatar (lg), displayName, email. Below: TierMeter. Stats row: Lifetime Points / Current Streak / Quests Completed — three equal-width stat tiles. Redemption history list (collapsed by default, expandable). Sign out ghost button at bottom.

**Quests**
Header: "Your Quests" + week number. Active quests section (3 QuestCards in vertical list). Completed/expired quests collapsed under "Past Quests" disclosure. Empty state if quests not yet generated: spinner + "Generating your quests…"

**Redemption Store**
Category filter chips horizontal scroll. Grid of RedemptionTiles (2-col mobile, 3-col desktop). Tapping a tile opens a bottom sheet with full description, confirm button, and current balance shown. Post-redemption: success animation (confetti burst, subtle) + toast notification.

---

## Motion Guidance

- All transitions: `duration-200 ease-out` as baseline. Never exceed 400ms for UI feedback.
- ProgressBar fill: `600ms ease-out` on mount only — not on every re-render.
- LeaderboardRow reordering: `layout` animation (Framer Motion) on rank change, 300ms.
- Streak calendar: cells fade in with staggered delay (20ms per cell) on first load.
- Confetti on redemption: CSS-only, 1s, fires once, no loop.
- No parallax. No entrance animations on every scroll. No bouncing.
- Reduced motion: all animations suppressed if `prefers-reduced-motion: reduce`.

---

## Accessibility

- WCAG AA contrast minimum on all text. Primary green `#006A4D` on cream `#FBF9F4`: 7.2:1 ✓
- All interactive elements have visible focus rings: `outline: 2px solid #006A4D; outline-offset: 2px`
- No focus style removal anywhere — `focus:outline-none` is banned unless replaced with custom ring
- Keyboard navigation: Tab order follows visual reading order. Modal/sheet traps focus. Esc closes.
- All icons are decorative (`aria-hidden="true"`) unless they carry meaning, in which case they have `aria-label`
- Avatar initials fallback is `aria-label="[displayName] avatar"`
- ProgressBar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- StreakCalendar: each day cell has `aria-label="Monday 21 April, streak active"` etc.
- CoachMessage: live region `aria-live="polite"` on the message container for streaming text
