# Trophy Vitrine UX Redesign

**Date:** 2026-03-20
**Status:** Approved
**Context:** QA on MiniPay revealed cards too tall, Share button too prominent, no loading feedback, poor contrast against illustrated background, and no scalability plan.

---

## Problem Summary

1. TrophyCard occupies ~25% of 844px viewport — only 4 fit per screen
2. "Share" button takes a full row inside each card, inflating height
3. Skeleton loaders pulse without text feedback ("loading what?")
4. Background illustration behind the list competes with card content
5. Hall of Fame shows no visual hierarchy — same card as My Victories
6. No cap on entries — will degrade with hundreds of victories

## Design Decisions

### 1. Card Layout — Compact 2-Row (Option B)

**Fila 1:** trophy icon + difficulty chip (`Easy`/`Medium`/`Hard`) + token ID (`#4`) + date right-aligned (`Mar 19`)

**Fila 2:** footsteps icon + moves count + clock icon + time + action slot (right-aligned)

- Action slot in **My Victories**: `Share2` icon (16px glyph, 36px tap target)
- Action slot in **Hall of Fame**: truncated player address (`0xCc41...c2dD`)

Target: **6-7 entries visible per screen** (down from ~4).

Height reduction: ~35-45% per card.

### 2. Share — Discrete Icon (Option A)

- Icon: `Share2` from Lucide, 16px
- Tap target: minimum 36px (padding around glyph)
- Position: right edge of fila 2, vertically centered with stats
- Style: ghost/subtle, no heavy background
- Color: muted cyan (`text-cyan-100/50`), press state with subtle highlight
- Behavior: tap triggers native `navigator.share()` with clipboard fallback
- Only shown in My Victories section (not Hall of Fame)

### 3. Background — Art in Hero Only (Option A)

**Hero/Header zone:**
- Illustrated background (existing art or gradient)
- Title "Trophy Vitrine" + subtitle + back button
- Dark overlay for text contrast
- Contained height — not too tall

**List zone:**
- Solid dark background: `#0a1424` or very subtle gradient
- No illustration, no glassmorphism
- Cards on clean surface for maximum readability

**Card styling:**
- Background: `#121c2f` (slightly lighter than page)
- Border: `rgba(255,255,255,0.08)` — subtle, not lechoso
- No heavy blur/frosting
- Rounded corners maintained (rounded-xl)

### 4. Hall of Fame — Top 3 Prestige (Option B)

Top 3 entries get accent treatment on the same base card:

| Rank | Accent |
|------|--------|
| #1   | Gold border/glow — `amber-400/30` stroke, subtle `amber-400/10` shadow |
| #2   | Silver border/glow — `slate-300/30` stroke, subtle `slate-300/10` shadow |
| #3   | Bronze border/glow — `orange-600/30` stroke, subtle `orange-600/10` shadow |

- Same card layout, same height
- Rank number visible (replaces trophy icon or added to fila 1)
- Player address in fila 2 (replaces share icon position)
- Ranks 4-10 use standard card with address, no accent

### 5. Scalability — Cap at 10 (Option C)

- My Victories: show latest 10, sorted newest-first (already implemented)
- Hall of Fame: show top 10 (already implemented)
- No pagination, no infinite scroll in v1
- Pagination can be added when volume justifies it

### 6. Loading States

- Replace pulsing skeletons with skeletons + text: "Loading victories..."
- Skeleton count: 3 placeholder cards (existing)
- Error state: already implemented with retry button (keep as-is)
- Empty state: already implemented with message (keep as-is)

## Files to Modify

| File | Change |
|------|--------|
| `components/trophies/trophy-card.tsx` | Redesign to 2-row compact layout, share as icon |
| `components/trophies/trophy-list.tsx` | Add loading text to skeletons |
| `app/trophies/page.tsx` | Split hero (with art) from list (dark bg), add rank to HoF entries |
| `lib/content/editorial.ts` | Add loading text string to `TROPHY_VITRINE_COPY` |
| `app/globals.css` | Optional: add trophy-card utility classes if needed |

## Out of Scope

- Pagination / infinite scroll
- Detail view for individual victories
- Tap-to-expand cards
- Swipe gestures
- Player avatars / identicons
- Animation on card appearance
