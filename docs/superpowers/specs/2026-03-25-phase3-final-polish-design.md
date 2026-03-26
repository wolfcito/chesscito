# Phase 3 Design Spec — Final Polish

**Date:** 2026-03-25
**Status:** Approved
**Scope:** Micro-adjustments for premium feel and state clarity. No architecture changes.

---

## 1. Hero Selector — More Authority

| Element | Current | Change |
|---|---|---|
| Active piece label | `text-[8px] font-extrabold text-cyan-100` | `text-[8px] font-extrabold text-white` — full white for max contrast |
| Active piece bg | `from-cyan-400/15 to-cyan-600/8` | `from-cyan-400/18 to-cyan-600/10` — slightly more fill |
| Inactive pieces border | `border-white/[0.06]` | `border-transparent` — remove border entirely, just ghost shapes |
| Inactive pieces opacity | `opacity-[0.22]` | `opacity-[0.16]` — push further into background |
| "Move to" label | `text-[9px] text-cyan-400/35` | `text-[8px] text-cyan-400/25` — smaller and dimmer, more secondary |
| Gap pieces to target | `mt-2` (8px) | `mt-3` (12px) — more breathing under hero |

## 2. Progress Chip — Premium Refinement

| Element | Current | Change |
|---|---|---|
| Stars chip height | `h-6` (24px) | `h-5` (20px) — tighter, more gem-like |
| Stars chip border | `border-amber-400/15` | `border-amber-400/20` — slightly more definition |
| Stars chip text | `text-[10px] font-bold text-amber-400/60` | `text-[10px] font-bold text-amber-300/70` — brighter value, lighter amber |
| Star icon | `size={10}` | `size={9}` — proportional to smaller chip |
| Star icon class | `fill-amber-400 text-amber-400` | `fill-amber-300 text-amber-300` — match text tone |
| Chip gap | `gap-1` | `gap-0.5` — tighter icon-to-number spacing |
| Chip padding | `px-2.5` | `px-2` — less air, more dense |

## 3. Footer / Dock Ghost State

The dock at opacity 0.30 feels "half dead". Decision: **push it further down to 0.20** so it clearly reads as background furniture, not broken UI.

| Element | Current | Change |
|---|---|---|
| Dock items opacity | `opacity: 0.30` | `opacity: 0.20` |
| Dock items active | `opacity: 0.60` | `opacity: 0.50` |
| Footer bg | `rgba(2, 12, 24, 0.6)` | `rgba(2, 12, 24, 0.5)` — slightly more transparent, less blocky |
| Footer border | `rgba(255, 255, 255, 0.04)` | `rgba(255, 255, 255, 0.03)` — even more subtle |

## 4. Board Highlights — Better Materiality

Current valid-move tiles: flat amber overlay `rgba(217, 180, 74, 0.45)` with inset border. Feels like a colored rectangle on top of the board.

Change: reduce fill opacity, increase border presence. The highlight should feel like a lit edge, not a painted square.

| Element | Current | Change |
|---|---|---|
| `.is-highlighted` bg | `rgba(217, 180, 74, 0.45)` | `rgba(217, 180, 74, 0.25)` — more transparent |
| `.is-highlighted` inner border | `1.5px rgba(217, 180, 74, 0.7)` | `1.5px rgba(217, 180, 74, 0.55)` — softer |
| `.is-highlighted` outer glow | `0 0 8px rgba(217, 180, 74, 0.35)` | `0 0 6px rgba(217, 180, 74, 0.20)` — less bloom |
| `.is-selected` bg | `rgba(217, 180, 74, 0.48)` | `rgba(217, 180, 74, 0.35)` — less opaque |
| `.playhub-board-dot` | Current size | Add `opacity: 0.7` — soften the movement indicator dots |

## 5. Store Modal — Featured Differentiation

Current featured: `ring-2 ring-amber-400/30` + tiny label. Not enough contrast vs secondary items.

| Element | Current | Change |
|---|---|---|
| Featured card | `ring-2 ring-amber-400/30` | `ring-2 ring-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.08)]` — add soft outer glow |
| Featured label bg | `bg-amber-500/15 border-amber-400/25` | `bg-amber-500/20 border-amber-400/35` — slightly more visible |
| Secondary items | Same rune-frame | Add `opacity-80` to non-featured items — dim them to push featured forward |
| Featured buy button | Default `game-solid` | Add `shadow-[0_0_12px_rgba(245,158,11,0.15)]` — amber glow on CTA |

## 6. Badges Modal — Emotional Hierarchy

### Owned (hero state)
| Element | Current | Change |
|---|---|---|
| Card bg | `bg-emerald-500/10` | `bg-emerald-500/12` — tiny bump |
| Badge image | No enhancement | Add `drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]` — glow on the piece image |
| Title text | `text-sm font-semibold text-cyan-50` | `text-sm font-bold text-white` — brightest of all states |
| Progress bar | `bg-emerald-400` | `bg-gradient-to-r from-emerald-400 to-emerald-300` — premium gradient |

### In Progress (claimable)
No changes needed — already distinct with cyan ring.

### Locked
| Element | Current | Change |
|---|---|---|
| Card bg | `bg-slate-800/30` | `bg-slate-800/20` — even more receded |
| Lock icon | `text-cyan-100/30` | `text-cyan-100/20` — dimmer |

### View Trophies CTA
| Element | Current | Change |
|---|---|---|
| Link style | `rounded-xl bg-amber-500/10 ring-1 ring-amber-400/20` | `rounded-2xl bg-amber-500/8 ring-1 ring-amber-400/15 py-3.5` — taller, rounder, more ceremonial |
| Icon | `h-4 w-4` | `h-5 w-5` — larger trophy icon |

---

## Out of Scope

- Layout changes
- New components
- New animations
- Architecture modifications
