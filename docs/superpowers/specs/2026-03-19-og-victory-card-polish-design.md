# OG Victory Card — Premium Visual Polish

**Issue**: #59
**Date**: 2026-03-19
**Status**: Design approved

## Objective

Elevate the existing OG victory card (`/api/og/victory/[id]`) from functional-minimal to premium dark fantasy. The technical architecture is already complete (onchain reads, ImageResponse, metadata). This spec covers **visual polish only**.

## Approach

- **Cinzel font** via Google Fonts fetch in edge runtime
- **King SVG silhouette** inline as atmospheric watermark
- **Same color palette** — improved execution (contrast, glow, spacing)
- **1200x630** primary (no other sizes in scope)

## Visual Composition

### Background

- **Base gradient**: radial from center-right, `#0b1628` → `#0a1424`. Replaces the existing `linear-gradient(160deg, ...)`.
- **Teal atmosphere**: radial glow centered on headline area, `rgba(94,234,212,0.03)`, radius ~600px. Barely visible — adds depth without competing.

### King SVG Watermark

- Chess king silhouette as inline SVG path
- Size: ~280px height
- Position: right-center, vertically centered
- Opacity: `0.04–0.05` (must not compete with text, even in small previews)
- Purpose: ambient texture reinforcing chess identity

### Content Layout (top to bottom, centered)

**Safe zone**: 80px padding on all 4 sides. All text lives inside this area. The king SVG may bleed outside partially (decorative only).

#### 1. Headline — "CHECKMATE"

- Font: **Cinzel**, 72px, weight 700
- Color: `#5eead4` (teal)
- Letter-spacing: `0.08em`
- Text-shadow: `0 0 30px rgba(94,234,212,0.20)` — subtle glow, must NOT soften text edges. Keep blur moderate and opacity low so letterforms stay crisp.
- Always shows "CHECKMATE" — all minted victories are wins, and the contract has no end-reason field

#### 2. Separator

- Horizontal line, 1px height, ~200px width, centered
- Color: `rgba(94,234,212,0.15)`
- Margin: 20px above and below
- Purpose: visual breathing room between headline and stats

#### 3. Performance Block

- Format: `{moves} MOVES • {time}`
- Font: system sans-serif, 38px, weight 700
- Color: `#f5f5f5`
- Letter-spacing: `0.04em`
- Must be scannable in < 1 second

#### 4. Difficulty Pill

- Text: `EASY` / `MEDIUM` / `HARD`, uppercase
- Font: 14px, weight 600, letter-spacing `0.12em`
- Color: `rgba(160,205,225,0.45)` (muted cyan)
- Background: `rgba(255,255,255,0.03)`
- Border: `1px solid rgba(160,205,225,0.12)`
- Border-radius: 20px
- Padding: `6px 24px`
- Must feel **auxiliary** — never compete with headline or performance
- Margin-bottom: 28px

#### 5. Challenge Line

- Text: "Can you beat this?"
- Font: system sans-serif, 28px, weight 600
- Color: `#fbbf24` (amber)
- Letter-spacing: `0.02em`
- This is the viral hook — must be clearly readable

#### 6. Identity Line

- Format: `Victory #{id} • by {player}`
- If space is tight, **prioritize** `by {player}` over `Victory #{id}`
- Player resolution order: username → ENS → wallet short (`0xA3...9F`)
- Font: 16px, weight 400
- Color: `rgba(160,205,225,0.4)`
- Margin-bottom: 8px

#### 7. Brand

- Text: "CHESSCITO"
- Font: 14px, weight 700, letter-spacing `0.15em`
- Color: `rgba(20,184,166,0.30)`
- Position: absolute bottom-right within safe zone (`bottom: 80px; right: 80px`)
- Breaks from the centered flow — anchored to corner
- Must be the most subtle element on the card

## Visual Hierarchy (enforced)

```
1. CHECKMATE        (Cinzel 72px, teal, glow)
2. 7 MOVES • 0:16   (sans 38px, white)
3. Can you beat this? (sans 28px, amber)
4. [HARD]            (14px pill, muted)
5. by 0xA3...9F      (16px, very muted)
6. CHESSCITO         (14px, barely visible)
```

Nothing may compete with levels 1–3. Levels 4–6 are informational only.

## Safe Zones

- 80px padding on all sides (6.7% width, 12.7% height)
- WhatsApp crops ~10% from edges in preview — 80px padding covers this
- Headline at 72px remains legible at thumbnail widths down to ~300px
- No critical text near edges

## Thumbnail-Proof Criteria

The card must pass this test: **shrink to 300px wide — can you still read the headline and performance line?**

- Headline: Cinzel 72px at 1200px = effective ~18px at 300px thumbnail. Readable.
- Performance: 38px at 1200px = effective ~9.5px at 300px. Tight but readable with bold weight.
- Challenge line: 28px = ~7px at thumbnail. Readable as amber accent.
- Everything below challenge line is bonus context at thumbnail size.

## Technical Implementation

### Font Loading

```typescript
const cinzelFont = fetch(
  new URL("../../../../../assets/fonts/Cinzel-Bold.ttf", import.meta.url)
).then((res) => res.arrayBuffer());
```

- **Local font file**: `src/assets/fonts/Cinzel-Bold.ttf` bundled in the repo (eliminates external dependency on Google Fonts CDN)
- Fetched once per edge cold start, cached by runtime
- Used only for headline "CHECKMATE"
- All other text uses system sans-serif

#### Font Loading — Error Handling

```typescript
let cinzelData: ArrayBuffer | null = null;
try {
  cinzelData = await fetch(CINZEL_URL).then((r) => {
    if (!r.ok) throw new Error(`Font fetch ${r.status}`);
    return r.arrayBuffer();
  });
} catch {
  // Falls back to system serif — card still renders
}
```

If the font fetch fails, the headline renders in system serif. The card is never broken — only degraded typographically.

### King SVG

- Defined as a single SVG constant, encoded as `data:image/svg+xml` base64
- Rendered as `<img src="data:image/svg+xml;base64,..." />` with absolute positioning
- This approach is Satori-compatible (Satori does not support inline `<svg>` elements reliably)
- No external file, no fetch — pure inline data URI

### Data Source

No changes to data fetching. Same onchain reads:
- `victories(tokenId)` → `[difficulty, totalMoves, timeMs]`
- `ownerOf(tokenId)` → player address

### File Changes

| File | Change |
|------|--------|
| `app/api/og/victory/[id]/route.tsx` | Restyle layout, add Cinzel font fetch, add king SVG, adjust spacing/colors |
| `src/assets/fonts/Cinzel-Bold.ttf` | New file — Cinzel Bold font for local loading |

Two file changes. No new dependencies, no architectural changes.

## What This Is NOT

- Not a redesign of the share flow
- Not a new route or new metadata structure
- Not a change to the victory page (`/victory/[id]`)
- Not scope for 1080x1080 or 1080x1920 variants
- Not adding new data to the contract or API

## Quality Criteria

- [ ] Readable in < 1 second
- [ ] Legible at thumbnail size (~300px wide)
- [ ] Feels premium, not like a screenshot
- [ ] Communicates competitive challenge
- [ ] Works as rich preview in WhatsApp
- [ ] Works as rich preview in X (twitter:card summary_large_image)
- [ ] King watermark invisible at first glance, noticed on second look
- [ ] Headline glow adds depth without softening text edges
- [ ] Difficulty pill feels auxiliary, never dominant
