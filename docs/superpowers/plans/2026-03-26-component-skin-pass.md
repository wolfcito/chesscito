# Component Skin Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade 7 components from flat/glass to carved/embossed materialidad, making them feel like game objects rather than app controls.

**Architecture:** CSS-only changes. Hero rail and tabs get carved styles via globals.css classes. Other components get inline Tailwind/style updates. No layout, logic, or data changes.

**Tech Stack:** Tailwind CSS, CSS custom properties, Next.js React components

**Spec:** `docs/superpowers/specs/2026-03-26-component-skin-pass-design.md`

---

## Operational Guardrails

1. **Hero rail inactive tabs:** Validate contrast on device. If icon readability drops, raise inactive opacity from 0.50 to 0.55 — don't change the carved direction.
2. **Progress chip:** Verify vertical alignment with more button in the utility cluster after height change.
3. **Trophy cards:** QA metadata readability (date, moves, time, wallet). Metadata stays neutral — don't warm it.
4. **Section labels:** If labels compete with cards, reduce text-shadow opacity or warm tint before touching size.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/app/globals.css` | Modify | Hero rail + tab carved styles |
| `apps/web/src/components/play-hub/mission-panel.tsx` | Modify | Active tab label color + top action emboss |
| `apps/web/src/components/play-hub/exercise-drawer.tsx` | Modify | Progress chip carved plaque |
| `apps/web/src/components/play-hub/shop-sheet.tsx` | Modify | Featured card relic showcase |
| `apps/web/src/components/play-hub/badge-sheet.tsx` | Modify | Badge rows embossed plaque |
| `apps/web/src/components/trophies/trophy-card.tsx` | Modify | Trophy cards carved medal |
| `apps/web/src/app/trophies/page.tsx` | Modify | Section labels embossed inscription |

---

### Task 1: Hero Rail — Carved Medallion

**Files:**
- Modify: `apps/web/src/app/globals.css:689-735`
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx:139,146`

- [ ] **Step 1: Update hero-rail class to carved style**

In `globals.css`, replace the `.hero-rail` class (lines 689-702):

```css
/* ── Hero selector rail ── */
.hero-rail {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 60px;
  background: linear-gradient(180deg, rgba(12, 20, 35, 0.85) 0%, rgba(6, 14, 28, 0.75) 100%);
  border: 1px solid rgba(160, 140, 100, 0.15);
  border-radius: 36px;
  padding: 4px 5px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.3);
}
```

Changes: `background` from `var(--surface-c-heavy)` to carved gradient. `border` from white to warm. Removed `backdrop-filter` (opaque gradient). Inner shadow top+bottom for depth.

- [ ] **Step 2: Update active tab to carved medallion**

Replace `.hero-rail-tab.is-active` (lines 719-723):

```css
.hero-rail-tab.is-active {
  background: linear-gradient(180deg, rgba(20, 28, 45, 0.95) 0%, rgba(8, 14, 28, 0.90) 100%);
  border-color: rgba(180, 160, 110, 0.35);
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.06), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 0 12px rgba(200, 170, 100, 0.12);
}
```

- [ ] **Step 3: Update inactive tab to micro-emboss**

Replace `.hero-rail-tab.is-inactive` (lines 725-729):

```css
.hero-rail-tab.is-inactive {
  opacity: 0.50;
  border-color: rgba(255, 255, 255, 0.04);
  background: rgba(255, 255, 255, 0.02);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.03), inset 0 -1px 2px rgba(0, 0, 0, 0.2);
}
```

- [ ] **Step 4: Update active icon drop-shadow and label color in JSX**

In `mission-panel.tsx`, line 139, change the active icon className:

```tsx
                        ? `text-[26px] leading-none drop-shadow-[0_0_6px_rgba(200,170,100,0.4)] ${plopping ? "animate-[hero-plop_300ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""}`
```

Change: `rgba(34,211,238,0.5)` → `rgba(200,170,100,0.4)` (warm relic glow).

In `mission-panel.tsx`, line 146, change the label color:

```tsx
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[rgba(220,200,150,0.9)]">
```

Change: `text-white` → `text-[rgba(220,200,150,0.9)]` (warm gold).

- [ ] **Step 5: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/globals.css apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "$(cat <<'EOF'
style: hero rail — carved medallion skin, warm relic active tab

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 2: Progress Chip — Carved Plaque

**Files:**
- Modify: `apps/web/src/components/play-hub/exercise-drawer.tsx:69-71`

- [ ] **Step 1: Replace progress chip with carved plaque styling**

In `exercise-drawer.tsx`, line 69, the button className currently is:

```tsx
          className="flex h-6 items-center gap-0.5 rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-2.5 text-[10px] font-bold text-amber-300/80 transition hover:bg-amber-400/[0.12]"
```

Change to:

```tsx
          className="flex h-[26px] items-center gap-1 rounded-full px-2.5 text-[10px] font-bold text-[rgba(220,200,140,0.85)] transition hover:brightness-110"
          style={{ background: "linear-gradient(180deg, rgba(20,16,10,0.70) 0%, rgba(12,10,8,0.60) 100%)", border: "1px solid rgba(180,160,100,0.20)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.2)" }}
```

- [ ] **Step 2: Update star icon color**

In `exercise-drawer.tsx`, line 71, the Star currently is:

```tsx
          <Star size={10} className="fill-amber-300 text-amber-300" />
```

Change to:

```tsx
          <Star size={10} className="fill-[rgba(220,190,100,0.9)] text-[rgba(220,190,100,0.9)]" />
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/play-hub/exercise-drawer.tsx
git commit -m "$(cat <<'EOF'
style: progress chip — carved plaque badge with warm tone

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 3: Top Action Buttons — Embossed Neutral

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx:186`

- [ ] **Step 1: Update moreAction wrapper with embossed neutral styles**

In `mission-panel.tsx`, line 186, the wrapper currently is:

```tsx
            <div className="[&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/[0.10] [&>button]:bg-white/[0.06] [&>button]:text-white/55 [&>button]:transition-all [&>button]:active:scale-95 [&>button]:active:bg-white/[0.12]">
```

Change to:

```tsx
            <div className="[&>button]:flex [&>button]:h-10 [&>button]:w-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/[0.12] [&>button]:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] [&>button]:text-white/60 [&>button]:shadow-[inset_0_1px_2px_rgba(255,255,255,0.04),inset_0_-1px_2px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.2)] [&>button]:transition-all [&>button]:active:scale-95 [&>button]:active:bg-white/[0.12]">
```

Changes: `border-white/[0.10]` → `[0.12]`, `bg-white/[0.06]` → gradient, `text-white/55` → `/60`, added `shadow` with inner emboss.

- [ ] **Step 2: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "$(cat <<'EOF'
style: top actions — embossed neutral depth, no warm accent

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 4: Featured Store Card — Relic Showcase

**Files:**
- Modify: `apps/web/src/components/play-hub/shop-sheet.tsx:60-67`

- [ ] **Step 1: Update featured card to relic showcase**

In `shop-sheet.tsx`, line 60, the item card currently is:

```tsx
            <div key={item.itemId.toString()} className={`rounded-2xl border p-3 relative ${isFeatured ? "border-amber-400/50 bg-[rgba(6,14,28,0.92)] ring-2 ring-amber-400/50 shadow-[0_0_24px_rgba(245,158,11,0.15),inset_0_0_16px_rgba(245,158,11,0.04)]" : "border-white/[0.05] bg-white/[0.02] opacity-75"}`}>
```

Change to:

```tsx
            <div key={item.itemId.toString()} className={`rounded-2xl p-3 relative ${isFeatured ? "" : "border border-white/[0.05] bg-white/[0.02] opacity-75"}`} style={isFeatured ? { background: "linear-gradient(180deg, rgba(18,14,8,0.95) 0%, rgba(10,8,6,0.90) 100%)", border: "1.5px solid rgba(200,170,100,0.30)", boxShadow: "inset 0 1px 3px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 20px rgba(200,170,100,0.10), 0 4px 12px rgba(0,0,0,0.3)" } : undefined}>
```

- [ ] **Step 2: Update featured tag**

In `shop-sheet.tsx`, line 62, the tag currently is:

```tsx
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/45 bg-amber-500/25 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-400/80">
```

Change to:

```tsx
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[rgba(220,200,140,0.85)]" style={{ background: "rgba(200,170,100,0.15)", border: "1px solid rgba(200,170,100,0.35)" }}>
```

- [ ] **Step 3: Update featured text colors**

In `shop-sheet.tsx`, line 66-67, change:

```tsx
              <p className={`text-sm font-semibold ${isFeatured ? "text-slate-100" : "text-slate-300"}`}>{item.label}</p>
              <p className={`text-xs ${isFeatured ? "text-slate-400" : "text-slate-500"}`}>{item.subtitle}</p>
```

to:

```tsx
              <p className={`text-sm font-semibold ${isFeatured ? "text-[rgba(240,230,200,0.95)]" : "text-slate-300"}`}>{item.label}</p>
              <p className={`text-xs ${isFeatured ? "text-[rgba(180,160,120,0.60)]" : "text-slate-500"}`}>{item.subtitle}</p>
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/play-hub/shop-sheet.tsx
git commit -m "$(cat <<'EOF'
style: store featured — relic showcase with carved depth and warm gold

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 5: Badge Rows — Embossed Plaque

**Files:**
- Modify: `apps/web/src/components/play-hub/badge-sheet.tsx:66-73`

- [ ] **Step 1: Update badge card states to embossed plaque**

In `badge-sheet.tsx`, lines 66-73, the className array currently has:

```tsx
        isClaimed
          ? "bg-emerald-500/15 ring-1 ring-emerald-500/25 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]"
          : isClaimable
            ? "bg-cyan-500/12 ring-1 ring-cyan-400/35 shadow-[inset_0_0_12px_rgba(34,211,238,0.06)]"
            : "bg-white/[0.04] border border-white/[0.06]",
```

Change to:

```tsx
        isClaimed
          ? "border border-emerald-500/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.04),inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_10px_rgba(16,185,129,0.08)]"
          : isClaimable
            ? "border border-cyan-400/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.04),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_0_12px_rgba(34,211,238,0.06)]"
            : "border border-white/[0.06] shadow-[inset_0_1px_2px_rgba(255,255,255,0.02),inset_0_-1px_2px_rgba(0,0,0,0.15)]",
```

And add inline style for the claimed gradient background. Change the full className+style block. Replace lines 65-73:

```tsx
    <div
      className={[
        "relative flex items-center gap-3 rounded-2xl px-3 py-3 transition",
        isClaimed
          ? "border border-emerald-500/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.04),inset_0_-2px_4px_rgba(0,0,0,0.3),0_0_10px_rgba(16,185,129,0.08)]"
          : isClaimable
            ? "border border-cyan-400/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.04),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_0_12px_rgba(34,211,238,0.06)]"
            : "border border-white/[0.06] shadow-[inset_0_1px_2px_rgba(255,255,255,0.02),inset_0_-1px_2px_rgba(0,0,0,0.15)]",
      ].join(" ")}
      style={isClaimed
        ? { background: "linear-gradient(180deg, rgba(10,22,18,0.85) 0%, rgba(6,16,12,0.75) 100%)" }
        : isClaimable
          ? { background: "linear-gradient(180deg, rgba(10,18,28,0.85) 0%, rgba(6,14,22,0.75) 100%)" }
          : { background: "rgba(255,255,255,0.03)" }
      }
    >
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/badge-sheet.tsx
git commit -m "$(cat <<'EOF'
style: badge rows — embossed plaque with carved depth per state

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 6: Trophy Cards — Carved Medal

**Files:**
- Modify: `apps/web/src/components/trophies/trophy-card.tsx:14-18,72-74,82`

- [ ] **Step 1: Update RANK_ACCENT to carved style**

In `trophy-card.tsx`, lines 14-18, replace:

```tsx
const RANK_ACCENT: Record<number, string> = {
  1: "border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.12)]",
  2: "border-slate-300/40 shadow-[0_0_10px_rgba(203,213,225,0.12)]",
  3: "border-orange-600/40 shadow-[0_0_10px_rgba(234,88,12,0.12)]",
};
```

with:

```tsx
const RANK_ACCENT: Record<number, string> = {
  1: "border-[rgba(220,190,100,0.35)] shadow-[inset_0_1px_3px_rgba(255,255,255,0.04),inset_0_-1px_3px_rgba(0,0,0,0.3),0_0_10px_rgba(200,170,100,0.10)]",
  2: "border-slate-300/35 shadow-[inset_0_1px_3px_rgba(255,255,255,0.04),inset_0_-1px_3px_rgba(0,0,0,0.3),0_0_8px_rgba(203,213,225,0.08)]",
  3: "border-orange-600/35 shadow-[inset_0_1px_3px_rgba(255,255,255,0.04),inset_0_-1px_3px_rgba(0,0,0,0.3),0_0_8px_rgba(234,88,12,0.08)]",
};
```

- [ ] **Step 2: Update card background to carved gradient**

In `trophy-card.tsx`, lines 71-74, change:

```tsx
      className={[
        "rounded-xl border bg-[#121c2f] px-3 py-2.5",
        accentClass,
      ].join(" ")}
```

to:

```tsx
      className={[
        "rounded-xl border px-3 py-2.5",
        accentClass,
      ].join(" ")}
      style={{ background: "linear-gradient(180deg, rgba(16,12,8,0.90) 0%, rgba(10,8,6,0.85) 100%)" }}
```

- [ ] **Step 3: Update default border and trophy icon**

For default border (line 49), change:

```tsx
  const accentClass = rank && rank <= 3 ? RANK_ACCENT[rank] : "border-white/[0.08]";
```

to:

```tsx
  const accentClass = rank && rank <= 3 ? RANK_ACCENT[rank] : "border-[rgba(200,170,100,0.20)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.03),inset_0_-1px_2px_rgba(0,0,0,0.2)]";
```

In the trophy icon (line 82), change:

```tsx
          <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
```

to:

```tsx
          <Trophy className="h-4 w-4 shrink-0 text-amber-400 drop-shadow-[0_0_4px_rgba(200,170,100,0.3)]" />
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/trophies/trophy-card.tsx
git commit -m "$(cat <<'EOF'
style: trophy cards — carved medal with warm border, relic icon glow

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 7: Section Labels — Embossed Inscription

**Files:**
- Modify: `apps/web/src/app/trophies/page.tsx:127-129,159-161`

- [ ] **Step 1: Update "My Victories" section label**

In `trophies/page.tsx`, lines 127-129, change:

```tsx
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                {TROPHY_VITRINE_COPY.myVictories}
```

to:

```tsx
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[rgba(200,180,130,0.55)]" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                <Crown className="h-3.5 w-3.5 text-[rgba(220,190,100,0.7)] drop-shadow-[0_0_3px_rgba(200,170,100,0.2)]" />
                {TROPHY_VITRINE_COPY.myVictories}
```

- [ ] **Step 2: Update "Hall of Fame" section label**

In `trophies/page.tsx`, lines 159-161, change:

```tsx
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <Crown className="h-3.5 w-3.5 text-purple-400" />
                {TROPHY_VITRINE_COPY.hallOfFame}
```

to:

```tsx
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[rgba(200,180,130,0.55)]" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                <Crown className="h-3.5 w-3.5 text-[rgba(220,190,100,0.7)] drop-shadow-[0_0_3px_rgba(200,170,100,0.2)]" />
                {TROPHY_VITRINE_COPY.hallOfFame}
```

Note: Both labels get the same warm inscription treatment, unifying the palette.

- [ ] **Step 3: Verify build**

Run: `cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/trophies/page.tsx
git commit -m "$(cat <<'EOF'
style: section labels — embossed inscription with warm patina

Wolfcito 🐾 @akawolfcito
EOF
)"
```

---

### Task 8: Visual QA Checklist

No code changes. Manual verification.

- [ ] **Step 1: Hero rail QA**

| Check | Pass? |
|-------|-------|
| Rail has carved depth (inner shadow top + bottom visible) | |
| Active tab reads as medallion with warm gold border | |
| Inactive tabs visible at 0.50 with micro-emboss | |
| Icon glow is warm, not cyan | |
| Label text is warm gold, not white | |
| Target zone stays cyan (no warm bleed) | |

**Guardrail:** If inactive tabs lose readability, raise opacity to 0.55.

- [ ] **Step 2: Progress chip QA**

| Check | Pass? |
|-------|-------|
| Chip feels like carved plaque / small badge | |
| Star icon in warm gold tone | |
| `8/15` text immediately legible | |
| Vertically aligned with more button | |

- [ ] **Step 3: Top actions QA**

| Check | Pass? |
|-------|-------|
| More button has subtle embossed depth | |
| No warm accent — stays neutral | |
| Pressed state still works (scale 0.95) | |

- [ ] **Step 4: Featured store QA**

| Check | Pass? |
|-------|-------|
| Featured card feels like relic showcase | |
| Warm gold border + carved depth | |
| Tag reads "Featured" clearly | |
| Secondary card unchanged (flat, 0.75) | |

- [ ] **Step 5: Badge rows QA**

| Check | Pass? |
|-------|-------|
| Owned badge row has embossed plaque depth | |
| Claimable has cyan-tinted emboss | |
| Locked has very subtle depth | |

- [ ] **Step 6: Trophy cards QA**

| Check | Pass? |
|-------|-------|
| Card background is carved gradient (not solid #121c2f) | |
| Rank 1 has warm gold border | |
| Trophy icon has warm glow | |
| Date, moves, time, wallet STILL readable | |
| Difficulty chip keeps semantic color | |

**Guardrail:** If metadata readability drops, keep metadata colors at `text-slate-500` — don't warm them.

- [ ] **Step 7: Section labels QA**

| Check | Pass? |
|-------|-------|
| Labels have warm patina tint | |
| Text shadow gives subtle depth | |
| Crown icon has micro-glow | |
| Labels do NOT compete with card content below | |

**Guardrail:** If labels compete, reduce text-shadow to `0 1px 1px rgba(0,0,0,0.2)` or tint to `rgba(200,180,130,0.45)`.
