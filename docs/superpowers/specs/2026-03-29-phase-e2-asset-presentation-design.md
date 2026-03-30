# Phase E2 — Asset Presentation Pass

## Status: SPEC APPROVED

## Objective

Elevate the presentation of existing assets (piece art, dock icons, reward collectibles) to their full visual potential through CSS treatment, without creating new assets or adding motion. Validate whether the identity gap is primarily a presentation problem before investing in motion, drama, or new art.

## Why E2

Phase E1 established hero composition: board as sacred center, dock as architectural floor, piece rail as roster, gameplay panel as command surface. But the assets within that composition are still presented functionally — too small, too flat, too raw. The crystalline piece art, illustrated dock icons, and collectible assets carry more visual identity than the UI currently reveals.

## Strategy: Presentation-First

1. Prove that current assets can feel premium and iconic through treatment alone
2. Only escalate to motion (E3), drama (E4), or new assets after validating E2 on device
3. Order: Piece rail → Dock icons → Reward surfaces → Background (conditional)

## Global Hierarchy (unchanged from E1)

```
Board (sacred center, focal vignette)
  >>> Gameplay Panel (command support)
    > Piece Rail champion (ring + pedestal + glow) — UPGRADED IN E2
      > Reward surface hero (shadow + tint + subtle pedestal) — NEW IN E2
        > Dock icons (unified family) — UPGRADED IN E2
          > Inline icons (raw, no treatment)
```

---

## Section 1: Piece Rail Hero Showcase

### Objective

The active piece in the rail receives champion showcase ceremony: ring frame, pedestal glow, and reinforced float shadow. This treatment is exclusive to the rail — it does not extend to the board or other contexts.

### Mechanism

Build on the E1 active tab treatment (`scale(1.05)`, `border-color 0.45`, `box-shadow 14px/0.18`):

**Ring frame** — `::before` pseudo-element on `.hero-rail-tab.is-active`:
- Circular border: `1.5px solid rgba(180,160,110,0.22)` — start restrained
- Glow: `box-shadow: 0 0 24px rgba(200,170,100,0.10), inset 0 0 24px rgba(200,170,100,0.05)`
- Centered on the tab, slightly larger than the tab content
- `pointer-events: none`

**Pedestal glow** — `::after` pseudo-element on `.hero-rail-tab.is-active`:
- `radial-gradient(ellipse at 50% 85%, rgba(200,170,100,0.25) 0%, transparent 70%)`
- Positioned at the base of the tab
- Height: 30% to 40% of tab height — choose final value during visual review
- `pointer-events: none`

**Piece float shadow** — reinforce `.piece-hero` drop-shadow:
- From E1: `drop-shadow(0 2px 6px rgba(0,0,0,0.5))`
- E2: `drop-shadow(0 3px 8px rgba(0,0,0,0.6))` — deeper shadow for stronger float

### Ring tuning rule

Start slightly restrained. Only increase ring intensity (border opacity, glow spread) if real-device review shows the active piece still lacks ceremony. Do not ship at maximum intensity by default.

### Subordination rule

The active rail showcase must still read clearly below board authority at first glance. If the ring + pedestal combination visually competes with the board focal vignette, reduce ring intensity first.

### Overflow / collision rules

- No clipping against neighboring tabs
- No visual collision with the label area beneath the active piece
- No overflow visible outside the rail container
- Ring must be contained within or barely exceeding the tab boundary

### Constraints

- Rail-only treatment — do not extend to board pieces
- No animation (float, pulse, breathe) — static treatment only
- Touch targets >= 44px in all states
- `prefers-reduced-motion`: no impact (static pseudo-elements)

---

## Section 2: Dock Icon Hybrid Unification

### Objective

The 5 dock PNG icons feel like one visual family without losing their individual character. CSS filter pipeline unifies perceived weight, warmth, and depth.

### Pre-implementation requirement

Before finalizing the treatment, verify ALL 5 dock icons:
- `badge-menu.png`
- `shop-menu.png`
- `play-menu.png` (wolf mage)
- `leaderboard-menu.png`
- `invite-share-menu.png`

Calibrate the treatment against the full real icon set, not a partial assumption.

### Mechanism

**Unified filter pipeline** — a warm-leaning normalization treatment applied to all dock item images:
- The goal is consistent perceived weight, warmth, and depth across all icons
- `sepia()` is a tuning candidate for warmth normalization, not a mandatory base value — avoid muddying blue/gem assets or degrading existing color contrast
- `drop-shadow` for consistent depth perception
- `brightness` and `saturate` for weight normalization

Starting values (calibrate during visual review):
```css
filter: sepia(0.15) saturate(1.1) brightness(0.95) drop-shadow(0 1px 3px rgba(0,0,0,0.4));
```

These are starting points. If `sepia` degrades specific icons (especially blue/gem-heavy ones), reduce or remove it for those icons.

**Size normalization:**
- All dock icon images use `object-fit: contain` within fixed-size containers
- Prefer 1-2 normalization buckets for perceived visual weight (e.g., "standard" and "dense/detailed")
- Avoid bespoke per-icon tuning unless absolutely necessary
- Goal: similar perceived visual weight, not identical pixel dimensions

### Scope boundaries

- Do NOT apply warm tint to the center action (Swords lucide icon) — it uses teal for Arena identity
- Do NOT add new active-state logic for side items — this section is about presentation unification only, not new state behavior
- Do NOT modify dock layout, spacing, or background (E1 already defined these)

### Evaluation rule

After the treatment pass, validate:
1. Does the wolf mage still feel memorable?
2. Do badge, chest, and other icons now feel visually related?
3. Is the family mismatch reduced enough to defer new asset work?

### Escalation path

If icons still feel too stylistically fragmented after the treatment pass, flag them for a true asset unification pass in a future phase. Do not try to solve fundamental style mismatch with heavier filters.

---

## Section 3: Reward Surface Ceremony

### Objective

Collectible and reward assets (badges, score icons, shop items) receive more premium presentation when they appear as hero elements in cards, slots, or modal regions.

### Mechanism

**Reward showcase treatment** — a reusable CSS class `.reward-icon-showcase`:
- `drop-shadow(0 4px 12px rgba(0,0,0,0.5))` — depth, the asset floats
- Subtle pedestal: `radial-gradient(ellipse at 50% 90%, rgba(255,255,255,0.06) 0%, transparent 60%)` — reads as support, not as a stage
- Warm-leaning treatment applied only when it improves family coherence — do not flatten or over-unify assets that already carry strong gold/gem identity

### Hero presentation definition

Apply the treatment ONLY when the asset is the **primary visual anchor** of a card, slot, or modal region:
- Badge icon as the hero of a BadgeSheet card
- Shop item icon as the hero of a shop slot
- Trophy/leaderboard icon in its presentation context

Do NOT apply in:
- Repeated list rows
- Thumbnails or small inline references
- Dense collection views
- Any context where the asset is reference, not protagonist

### Ceremony hierarchy

```
Piece rail champion (ring + pedestal + glow)  >  Reward surface hero (shadow + tint + subtle pedestal)  >  Inline icon (raw)
```

The reward pedestal must read as support, not as a stage. It must be clearly less ceremonious than the piece rail champion showcase.

### Constraints

- No ring frame on reward icons — ring is exclusive to piece rail champion
- No animation — static treatment only
- Compatible with existing panel tier system (panel-base, panel-elevated, panel-showcase)
- Compatible with existing Phase D reward glow backdrops

---

## Section 4: Background / Scene Treatment Evaluation

### Objective

Evaluate whether the current background (`bg-chesscitov3`) needs treatment refinement to improve scene identity. This is conditional — implement only if visual review justifies it.

### Current state

The background is already significantly subordinated by:
- Phase A atmosphere overlays (vignette + falloff)
- E1 board-stage-focus focal overlay
- E1 dock architectural base (opaque floor)

It reads as "dark ambient texture" — barely visible as a distinct asset.

### Decision rule

1. Implement Sections 1-3 first
2. Visual review the complete Play Hub
3. If the background feels like the weak link in scene identity → apply treatment
4. If the background works → do not touch

### Treatment candidates (only if justified)

Apply in this order — stop as soon as the gap is closed:
1. `background-position` optimization — center the most relevant part of the asset under the vignette
2. `background-size` adjustment — ensure optimal coverage at 390px
3. Only if still needed: very subtle `brightness()` / `saturate()` tuning

### Identity rule

Background refinement is allowed only if it improves scene identity without pulling attention away from the board. The board remains the sacred center — the background must remain subordinate.

### Constraints

- Do not replace the background asset
- Do not add a fourth overlay layer to the atmosphere system
- Do not make the background more prominent than it currently is
- Any adjustment is fine-tuning, not a direction change

---

## Global Rules

### Animation budget: zero

E2 is a static presentation pass. No new animations, no Lottie, no keyframes. Motion is deferred to E3 if needed.

### Reduced motion

All E2 changes are static CSS treatments. `prefers-reduced-motion` has no impact.

### Mobile-first / 390px

All treatments designed for and tested at 390px width.

### Token coherence

Reusable treatments should be tokenized as CSS custom properties or utility classes. Single-use tuning values are acceptable but should not proliferate.

### Asset resource hierarchy (for future phases)

When animation or motion assets are eventually needed:
1. Free Lottie animations first
2. Custom Lottie if no suitable free option exists
3. Static image/PNG fallback as minimum viable version

---

## Success Criteria

1. The active piece in the rail reads as a champion with ceremony, not just a selected tab
2. Dock icons feel like one visual family despite different illustration styles
3. Reward/collectible assets feel premium when presented as heroes in their context
4. No element competes with the board for visual authority
5. The overall Play Hub identity feels more distinctive and memorable after E2
6. All treatments work within the existing asset set — no new assets required for E2
