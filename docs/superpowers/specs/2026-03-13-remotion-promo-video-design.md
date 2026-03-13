# Remotion Promo Video — Design Spec

**Date:** 2026-03-13
**Goal:** Create a short (~20-25s) vertical promo video for Chesscito using Remotion, animating existing game assets for social media (reels/TikTok/Twitter).

## Format

- **Resolution:** 1080x1920 (vertical/mobile-first)
- **FPS:** 30
- **Duration:** ~20-25 seconds
- **Audio:** None (user adds music later)
- **Output:** MP4

## Project Structure

New app `apps/video` in the Turborepo monorepo.

```
apps/video/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── public/              ← PNGs copied from apps/web/public/art/
├── src/
│   ├── Root.tsx              ← RegisterRoot
│   ├── ChesscitPromo.tsx     ← main composition (<Series>)
│   ├── scenes/
│   │   ├── SplashIntro.tsx
│   │   ├── PiecesShowcase.tsx
│   │   ├── BoardBadge.tsx
│   │   └── CtaOutro.tsx
│   └── lib/
│       └── animations.ts     ← interpolate/spring helpers
```

**Dependencies:** Remotion v4, React 18, TypeScript. No extra libraries.

## Scenes

### Scene 1: Splash/Intro (~4s, ~120 frames)

- **Asset:** `bg-splash-chesscito.png` (wolf wizard + "Chesscito" logo)
- **Animations:**
  - Fade in from black (0.5s / 15 frames)
  - Slow zoom 1.0 → 1.05 over full duration (parallax feel)
- **Text:** None — logo is baked into the splash image

### Scene 2: Pieces Showcase (~8s, ~240 frames)

- **Background:** `bg-chesscitov3.png` (teal forest) with subtle vertical parallax
- **Pieces:** `piece-rook.png` → `piece-bishop.png` → `piece-knight.png`
- **Per piece (~2.5s each):**
  - Slide-up + scale 0.8 → 1.0 with spring easing
  - `reward-glow.png` behind, opacity pulsing 0.4 → 0.8
  - Text fade-in below: "Master the Rook" / "Learn the Bishop" / "Conquer the Knight"
  - Crossfade transition ~0.3s between pieces

### Scene 3: Board + Badge (~6s, ~180 frames)

- **Assets:** `chesscito-board.png`, `piece-rook.png`, `badge-chesscito.png`, `reward-glow.png`
- **Animations:**
  - Board enters with scale 0.9 → 1.0
  - Rook piece "moves" across the board (translateX/Y, ~0.5s)
  - Badge appears with scale-bounce (0 → 1.1 → 1.0) + glow burst
  - Text fade-in: "Earn on-chain badges"

### Scene 4: CTA/Outro (~4s, ~120 frames)

- **Background:** Dark solid (#0a0f1a)
- **Elements (sequential fade-in):**
  1. "Chesscito" — fantasy-title style, large
  2. "on Celo" — smaller, muted
  3. "Play now" — with pulsing cyan border
  4. App URL below
- **Fade to black at end**

## Animation Approach

All animations use Remotion's `interpolate()` and `spring()`. No external animation libraries.

- **Easing:** Spring for entrances (damping ~12, mass ~0.5), linear for parallax
- **Transitions:** Crossfade between scenes using opacity interpolation
- **Glow pulse:** Looping opacity via modular frame math

## Assets to Copy

From `apps/web/public/art/` → `apps/video/public/`:

- `bg-splash-chesscito.png`
- `bg-chesscitov3.png`
- `chesscito-board.png`
- `piece-rook.png`
- `piece-bishop.png`
- `piece-knight.png`
- `badge-chesscito.png`
- `reward-glow.png`

## Scripts

- `pnpm --filter video studio` — Remotion Studio preview
- `pnpm --filter video render` — render MP4 to `apps/video/out/`

## Out of Scope

- Audio/music
- Multiple video variants
- Landscape format
- Server-side rendering or hosting the video
