# Trophy Vitrine UX Redesign

**Date:** 2026-03-20
**Status:** Approved
**Context:** QA on MiniPay revealed cards too tall, Share button too prominent, no loading feedback, poor contrast against illustrated background, and no scalability plan.

---

## Problem Summary

1. TrophyCard occupies ~25% of 844px viewport — only 4 fit per screen
2. "Share" button takes a full row inside each card, inflating height
3. Skeleton loaders pulse without text feedback
4. Background illustration behind the list competes with card content
5. Hall of Fame shows no visual hierarchy — same card as My Victories
6. No cap on entries — will degrade with hundreds of victories

## Design Decisions

### 1. Card Layout — Compact 2-Row

**Fila 1:** trophy icon (My Victories) or rank number (Hall of Fame) + difficulty chip (`Easy`/`Medium`/`Hard`) + token ID + date right-aligned (`Mar 19`)

**Priority order when space is tight:** rank/icon > difficulty chip > date > token ID (token ID is truncable or muted, date never drops).

**Fila 2:** footsteps icon + moves count + clock icon + time + action slot (right-aligned)

- Action slot in **My Victories**: `Share2` icon (action — tappable)
- Action slot in **Hall of Fame**: truncated player address (passive label — NOT tappable, no action styling)

**Card dimensions:**
- Min-height target: `72–84px`
- Padding vertical: `10–12px`
- Gap between rows: `6px`
- Target: **6-7 entries visible per screen** (down from ~4)
- Height reduction: ~35-45% per card vs current

### 2. Share — Discrete Icon

- Icon: `Share2` from Lucide, 16px glyph
- Tap target: minimum 36px (padding around glyph)
- Position: right edge of fila 2, vertically centered with stats
- Style: ghost/subtle, no heavy background
- Color: muted cyan (`text-cyan-100/50`), press state with subtle highlight
- Only shown in My Victories section (not Hall of Fame)

**Behavior:**
- Tap triggers `navigator.share()` (native share)
- Fallback: copy to clipboard + toast "Link copied!"
- Brief disable after tap to prevent double-tap
- Toast disappears after 2s

### 3. Background — Art in Hero Only

**Hero/Header zone:**
- Illustrated background (existing art or gradient)
- Title "Trophy Vitrine" + subtitle + back button
- Dark overlay for text contrast
- **Max height: 160–220px** — must not push list start too far down

**List zone:**
- Solid dark background, no illustration, no glassmorphism
- Cards on clean surface for maximum readability

**Design tokens:**
| Token | Value |
|-------|-------|
| Page/list bg | `#0a1424` |
| Card bg | `#121c2f` |
| Card border | `rgba(255,255,255,0.08)` |
| Primary text | `text-slate-100` |
| Secondary text/icons | `text-slate-400` or `text-cyan-100/50` |
| Card border-radius | `rounded-xl` (12px) |

### 4. Hall of Fame — Top 3 Prestige

**Rank replaces trophy icon in fila 1 for ALL Hall of Fame entries (1-10).** Top 3 additionally get accent treatment:

| Rank | Accent |
|------|--------|
| #1   | Gold — `amber-400/30` border, `amber-400/10` shadow |
| #2   | Silver — `slate-300/30` border, `slate-300/10` shadow |
| #3   | Bronze — `orange-600/30` border, `orange-600/10` shadow |

- Same card layout, same height as standard cards
- Ranks 4-10: rank visible, standard card, no accent
- Player address in fila 2 as **passive identity label** (muted text, no tap target styling, no hover/active states)

### 5. Scalability — Cap at 10

- My Victories: show latest 10, sorted newest-first
- Hall of Fame: show top 10
- No pagination, no infinite scroll in v1
- Pagination can be added when volume justifies it

### 6. Loading States

**Initial load:**
- 3 skeleton placeholder cards + text "Loading victories..."
- Skeletons pulse as current, but with visible text label

**Background refresh / refetch:**
- Do NOT reset to full skeleton state
- Keep existing list visible
- Optional: subtle inline indicator if implementing refresh (not required for v1)

**Error state:** keep as-is (red banner + "Tap to retry")

### 7. Empty States — Differentiated

| Case | Message |
|------|---------|
| Wallet not connected | "Connect your wallet to see your victories" (existing) |
| Connected, no victories | "No victories yet" + link to Arena (existing) |
| Hall of Fame empty | "No victories recorded yet" (existing) |

These already exist and are correct. Verify they don't get mixed during redesign.

## Files to Modify

| File | Change |
|------|--------|
| `components/trophies/trophy-card.tsx` | Redesign to 2-row compact layout, share as icon, rank support |
| `components/trophies/trophy-list.tsx` | Add loading text, pass rank to HoF cards |
| `app/trophies/page.tsx` | Split hero (with art) from list (dark bg), assign ranks to HoF |
| `lib/content/editorial.ts` | Add loading text + toast strings to `TROPHY_VITRINE_COPY` |

## Out of Scope

- Pagination / infinite scroll
- Detail view for individual victories
- Tap-to-expand cards
- Swipe gestures
- Player avatars / identicons
- Animation on card appearance
- Background refresh indicator
