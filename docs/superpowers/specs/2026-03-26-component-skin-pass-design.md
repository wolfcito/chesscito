# Component Skin Pass — Design Spec

**Date:** 2026-03-26
**Status:** Frozen
**Prerequisite:** Surface System (2026-03-25) + Game Skin Pass (2026-03-26) applied.
**Goal:** Upgrade component materialidad from "correct flat" to "carved/embossed game objects" — without changing architecture, layout, or the frozen surface system.

## Design Direction

**Base:** Carved / Embossed — surfaces with relief, inner shadows suggesting depth, like coins, medallions, and plaques.

**Hero accents:** Relic / Artifact — warm gold glow on active/hero states only. Controlled, never dominant.

**NOT this:** Sci-fi, crystal, holographic, or glass. Not Clash Royale layout copy.

## Warm Containment Rule

The warm/gold accent is reserved for:
- Hero selector active tab
- Progress chip (game badge)
- Featured store card
- Owned badge glow
- Trophy card icon + border
- Section label tint

The warm accent must NOT spread to:
- Target/mission labels (stay cyan)
- More button, back button, or any HUD control (stay neutral)
- Sheet headers or close buttons (stay neutral)
- Footer/dock (stay neutral)
- Any text that must be read quickly (metadata stays high-contrast neutral)

---

## 1. Hero Selector Rail — Carved Medallion

### Rail Container

| Token | Before | After |
|-------|--------|-------|
| Background | `var(--surface-c-heavy)` | `linear-gradient(180deg, rgba(12,20,35,0.85) 0%, rgba(6,14,28,0.75) 100%)` |
| Border | `rgba(255,255,255,0.10)` | `rgba(160,140,100,0.15)` |
| Box-shadow | `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)` | `0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)` |
| Backdrop-filter | `blur(14px)` | Remove (opaque gradient doesn't need it) |

### Active Tab

| Token | Before | After |
|-------|--------|-------|
| Background | `linear-gradient(180deg, rgba(34,211,238,0.22), rgba(6,14,28,0.80))` | `linear-gradient(180deg, rgba(20,28,45,0.95), rgba(8,14,28,0.90))` |
| Border | `rgba(103,232,249,0.50)` | `rgba(180,160,110,0.35)` |
| Box-shadow | `0 0 14px rgba(34,211,238,0.25), inset 0 1px 0 rgba(255,255,255,0.08)` | `inset 0 2px 4px rgba(255,255,255,0.06), inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 12px rgba(200,170,100,0.12)` |
| Icon filter | `drop-shadow(0 0 6px rgba(34,211,238,0.5))` | `drop-shadow(0 0 6px rgba(200,170,100,0.4))` |
| Label color | `white` | `rgba(220,200,150,0.9)` |

### Inactive Tab

| Token | Before | After |
|-------|--------|-------|
| Border | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.04)` |
| Background | `rgba(255,255,255,0.02)` | `rgba(255,255,255,0.02)` |
| Box-shadow | none | `inset 0 1px 2px rgba(255,255,255,0.03), inset 0 -1px 2px rgba(0,0,0,0.2)` |

### Target Zone

No change. Stays cyan HUD language.

---

## 2. Progress Chip — Carved Plaque

| Token | Before | After |
|-------|--------|-------|
| Height | `h-6` (24px) | `h-[26px]` |
| Background | `bg-amber-400/[0.08]` | `linear-gradient(180deg, rgba(20,16,10,0.70), rgba(12,10,8,0.60))` |
| Border | `border-amber-400/25` | `1px solid rgba(180,160,100,0.20)` |
| Text color | `text-amber-300/80` | `rgba(220,200,140,0.85)` |
| Star color | `fill-amber-300 text-amber-300` | `rgba(220,190,100,0.9)` |
| Padding | `px-2.5` | `px-2.5` (keep) |
| Box-shadow | none | `inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.2)` |

### Guardrails
- Must not be visually dominant — it's a small badge, not a hero.
- `8/15` text must remain immediately legible.
- More button next to it does NOT change.

---

## 3. Top Action Buttons — Embossed Neutral

HUD controls. No warm accent. Just subtle depth.

| Token | Before | After |
|-------|--------|-------|
| Background | `rgba(255,255,255,0.06)` | `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))` |
| Border | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.12)` |
| Icon color | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.60)` |
| Box-shadow | none | `inset 0 1px 2px rgba(255,255,255,0.04), inset 0 -1px 2px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)` |

Applies to the `moreAction` wrapper child selectors in `mission-panel.tsx`.

---

## 4. Featured Store Card — Relic Showcase

| Token | Before | After |
|-------|--------|-------|
| Background | `rgba(6,14,28,0.92)` | `linear-gradient(180deg, rgba(18,14,8,0.95), rgba(10,8,6,0.90))` |
| Border | `border-amber-400/50` | `1.5px solid rgba(200,170,100,0.30)` |
| Ring | `ring-2 ring-amber-400/50` | Remove ring, use border only |
| Box-shadow | `0 0 24px rgba(245,158,11,0.15), inset 0 0 16px rgba(245,158,11,0.04)` | `inset 0 1px 3px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 20px rgba(200,170,100,0.10), 0 4px 12px rgba(0,0,0,0.3)` |
| Tag bg | `amber-500/25` | `rgba(200,170,100,0.15)` |
| Tag border | `amber-400/45` | `rgba(200,170,100,0.35)` |
| Tag text | `amber-400/80` | `rgba(220,200,140,0.85)` |
| Title color | `text-slate-100` | `rgba(240,230,200,0.95)` |
| Subtitle color | `text-slate-400` | `rgba(180,160,120,0.60)` |

### Secondary Card

No carved treatment. Stays flat neutral as already implemented (opacity 0.75).

---

## 5. Badge Rows — Embossed Plaque

### Owned State

| Token | Before | After |
|-------|--------|-------|
| Background | `bg-emerald-500/15` | `linear-gradient(180deg, rgba(10,22,18,0.85), rgba(6,16,12,0.75))` |
| Border | `ring-1 ring-emerald-500/25` | `1px solid rgba(16,185,129,0.25)` |
| Box-shadow | `inset 0 0 20px rgba(16,185,129,0.15)` | `inset 0 2px 4px rgba(255,255,255,0.04), inset 0 -2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(16,185,129,0.08)` |
| Icon container | flat | `box-shadow: inset 0 1px 2px rgba(255,255,255,0.06), 0 0 8px rgba(16,185,129,0.15)` |
| Progress bar bg | `bg-slate-700/50` | Add `box-shadow: inset 0 1px 2px rgba(0,0,0,0.3)` (sunken track) |

### Claimable State

Same carved direction but with cyan accent instead of emerald. Keep current token values, just add inner shadows:
- Box-shadow: `inset 0 2px 4px rgba(255,255,255,0.04), inset 0 -2px 4px rgba(0,0,0,0.3)` added to existing styles.

### Locked State

Keep current `bg-white/[0.04] border border-white/[0.06]`. Add only:
- Box-shadow: `inset 0 1px 2px rgba(255,255,255,0.02), inset 0 -1px 2px rgba(0,0,0,0.15)` (very subtle depth).

---

## 6. Trophy Cards — Carved Medal

| Token | Before | After |
|-------|--------|-------|
| Background | `bg-[#121c2f]` | `linear-gradient(180deg, rgba(16,12,8,0.90), rgba(10,8,6,0.85))` |
| Default border | `border-white/[0.08]` | `1px solid rgba(200,170,100,0.20)` |
| Rank 1 border | `border-amber-400/40` | `1px solid rgba(220,190,100,0.35)` |
| Rank 1 shadow | `0 0 10px rgba(251,191,36,0.12)` | `inset 0 1px 3px rgba(255,255,255,0.04), inset 0 -1px 3px rgba(0,0,0,0.3), 0 0 10px rgba(200,170,100,0.10)` |
| Trophy icon | plain emoji | Add `filter: drop-shadow(0 0 4px rgba(200,170,100,0.3))` |
| Difficulty chip | semantic colors | Keep — no change |

### Metadata Guardrail
- Date, moves, time: stay `text-slate-500` / `text-slate-400` for quick readability.
- Do NOT push metadata into warm language.
- Only the card surface, border, and trophy icon get the carved/warm treatment.

---

## 7. Section Labels — Embossed Inscription

| Token | Before | After |
|-------|--------|-------|
| Text color | `text-slate-400` | `rgba(200,180,130,0.55)` |
| Text shadow | none | `0 1px 2px rgba(0,0,0,0.3)` |
| Icon color | `text-amber-400` / `text-purple-400` | `rgba(220,190,100,0.7)` (unified warm) |
| Icon filter | none | `drop-shadow(0 0 3px rgba(200,170,100,0.2))` |

### Guardrails
- Labels must stay structural, not hero.
- Must not compete with card content or sheet titles.
- The warm tint is subtle — closer to patina than to gold.

---

## What This Spec Does NOT Change

- Surface system tiers (frozen)
- Layout, spacing, or component architecture
- Hero selector rail dimensions (60px, 68x52 tabs — frozen from Game Skin Pass)
- Sheet structure or Header Pattern B
- Target/mission labels (stay cyan)
- Footer/dock (stay neutral)
- More button, back button identity (stay HUD neutral, only get embossed depth)
- Any backend, contract, or API behavior
