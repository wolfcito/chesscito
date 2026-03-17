# Remotion Promo Video — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ~20-25s vertical promo video for Chesscito using Remotion, animating existing game assets with fade/spring/scale transitions across 4 scenes.

**Architecture:** New `apps/video` package in the Turborepo monorepo. Single `<ChesscitPromo>` composition using `<TransitionSeries>` to sequence 4 scene components with fade transitions. Each scene uses `useCurrentFrame()`, `interpolate()`, and `spring()` for animations. Assets are PNGs copied from `apps/web/public/art/`.

**Tech Stack:** Remotion v4, React 18, TypeScript, `@remotion/transitions`, `@remotion/cli`

---

## Chunk 1: Project scaffold + Scene 1

### Task 1: Scaffold `apps/video` package

**Files:**
- Create: `apps/video/package.json`
- Create: `apps/video/tsconfig.json`
- Create: `apps/video/src/index.ts`
- Create: `apps/video/src/Root.tsx`
- Create: `apps/video/src/ChesscitPromo.tsx` (placeholder)

**Important Remotion rules:**
- All animations MUST use `useCurrentFrame()` — CSS transitions/animations are FORBIDDEN
- Always use `<Img>` from `remotion` — never HTML `<img>` or CSS `background-image`
- Use `staticFile()` for all assets from `public/`
- Always premount `<Sequence>` components

- [ ] **Step 1: Create `apps/video/package.json`**

```json
{
  "name": "video",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "studio": "remotion studio src/index.ts",
    "render": "remotion render src/index.ts ChesscitPromo out/chesscito-promo.mp4",
    "build": "echo 'No build step for video package'"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "@remotion/transitions": "^4.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "remotion": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.2.2"
  }
}
```

- [ ] **Step 2: Create `apps/video/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `apps/video/src/index.ts`**

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

- [ ] **Step 4: Create `apps/video/src/Root.tsx` with placeholder composition**

```tsx
import React from "react";
import { Composition } from "remotion";
import { ChesscitPromo } from "./ChesscitPromo";

const FPS = 30;
const DURATION_FRAMES = 660; // ~22s at 30fps

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChesscitPromo"
      component={ChesscitPromo}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
```

- [ ] **Step 5: Create placeholder `apps/video/src/ChesscitPromo.tsx`**

```tsx
import React from "react";
import { AbsoluteFill } from "remotion";

export const ChesscitPromo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0f1a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ color: "white", fontSize: 48 }}>Chesscito Promo</div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 6: Copy assets from `apps/web/public/art/` to `apps/video/public/`**

```bash
mkdir -p apps/video/public
cp apps/web/public/art/bg-splash-chesscito.png apps/video/public/
cp apps/web/public/art/bg-chesscitov3.png apps/video/public/
cp apps/web/public/art/chesscito-board.png apps/video/public/
cp apps/web/public/art/piece-rook.png apps/video/public/
cp apps/web/public/art/piece-bishop.png apps/video/public/
cp apps/web/public/art/piece-knight.png apps/video/public/
cp apps/web/public/art/badge-chesscito.png apps/video/public/
cp apps/web/public/art/reward-glow.png apps/video/public/
```

- [ ] **Step 7: Install dependencies and verify Studio launches**

```bash
cd apps/video && pnpm install
pnpm studio
```

Expected: Remotion Studio opens in browser, shows "Chesscito Promo" placeholder with dark background.

- [ ] **Step 8: Commit**

```bash
git add apps/video/
git commit -m "feat(video): scaffold Remotion apps/video package with placeholder composition"
```

---

### Task 2: Build Scene 1 — Splash/Intro

**Files:**
- Create: `apps/video/src/scenes/SplashIntro.tsx`

Scene: ~4s (120 frames). `bg-splash-chesscito.png` (wolf wizard + logo) fades in from black with a slow zoom 1.0→1.05.

- [ ] **Step 1: Create `apps/video/src/scenes/SplashIntro.tsx`**

```tsx
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const SplashIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in from black over 0.5s (15 frames at 30fps)
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Slow zoom 1.0 → 1.05 over the full duration
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.05], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill
        style={{
          opacity,
          transform: `scale(${scale})`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("bg-splash-chesscito.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Wire Scene 1 into ChesscitPromo temporarily for preview**

Update `apps/video/src/ChesscitPromo.tsx`:

```tsx
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SplashIntro } from "./scenes/SplashIntro";

export const ChesscitPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={120} premountFor={30}>
        <SplashIntro />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Preview in Studio**

```bash
cd apps/video && pnpm studio
```

Expected: Scene 1 shows the splash image fading in from black with slow zoom.

- [ ] **Step 4: Commit**

```bash
git add apps/video/src/scenes/SplashIntro.tsx apps/video/src/ChesscitPromo.tsx
git commit -m "feat(video): add Scene 1 — splash intro with fade-in and slow zoom"
```

---

## Chunk 2: Scenes 2 and 3

### Task 3: Build Scene 2 — Pieces Showcase

**Files:**
- Create: `apps/video/src/scenes/PiecesShowcase.tsx`

Scene: ~8s (240 frames). Three pieces appear sequentially (~80 frames each) over `bg-chesscitov3.png`. Each piece slides up with spring, has a pulsing glow behind it, and text fades in below.

- [ ] **Step 1: Create `apps/video/src/scenes/PiecesShowcase.tsx`**

```tsx
import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const PIECES = [
  { src: "piece-rook.png", text: "Master the Rook" },
  { src: "piece-bishop.png", text: "Learn the Bishop" },
  { src: "piece-knight.png", text: "Conquer the Knight" },
] as const;

const FRAMES_PER_PIECE = 80; // ~2.67s each

const PieceReveal: React.FC<{ src: string; text: string }> = ({
  src,
  text,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance: slide up + scale
  const entrance = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  const translateY = interpolate(entrance, [0, 1], [80, 0]);
  const scale = interpolate(entrance, [0, 1], [0.8, 1]);

  // Glow pulse: loops using modular frame math
  const glowOpacity = interpolate(
    Math.sin((frame / fps) * Math.PI * 2),
    [-1, 1],
    [0.4, 0.8]
  );

  // Text fade-in with delay
  const textOpacity = interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      {/* Glow */}
      <Img
        src={staticFile("reward-glow.png")}
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          opacity: glowOpacity,
        }}
      />
      {/* Piece */}
      <Img
        src={staticFile(src)}
        style={{
          width: 280,
          height: 280,
          objectFit: "contain",
          transform: `translateY(${translateY}px) scale(${scale})`,
          position: "relative",
          zIndex: 1,
        }}
      />
      {/* Text */}
      <div
        style={{
          position: "absolute",
          bottom: 580,
          opacity: textOpacity,
          color: "#e0f7fa",
          fontSize: 42,
          fontWeight: 700,
          fontFamily: "sans-serif",
          textAlign: "center",
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const PiecesShowcase: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Background */}
      <Img
        src={staticFile("bg-chesscitov3.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
        }}
      />
      {/* Pieces sequence */}
      {PIECES.map((piece, i) => (
        <Sequence
          key={piece.src}
          from={i * FRAMES_PER_PIECE}
          durationInFrames={FRAMES_PER_PIECE}
          premountFor={30}
        >
          <PieceReveal src={piece.src} text={piece.text} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Add Scene 2 to ChesscitPromo for preview**

Update `apps/video/src/ChesscitPromo.tsx` to add Scene 2 after Scene 1:

```tsx
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SplashIntro } from "./scenes/SplashIntro";
import { PiecesShowcase } from "./scenes/PiecesShowcase";

export const ChesscitPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={120} premountFor={30}>
        <SplashIntro />
      </Sequence>
      <Sequence from={120} durationInFrames={240} premountFor={30}>
        <PiecesShowcase />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Preview in Studio**

Expected: After splash, three pieces appear sequentially with slide-up entrance, pulsing glow, and text.

- [ ] **Step 4: Commit**

```bash
git add apps/video/src/scenes/PiecesShowcase.tsx apps/video/src/ChesscitPromo.tsx
git commit -m "feat(video): add Scene 2 — pieces showcase with spring entrances and glow"
```

---

### Task 4: Build Scene 3 — Board + Badge

**Files:**
- Create: `apps/video/src/scenes/BoardBadge.tsx`

Scene: ~6s (180 frames). Board enters with scale, rook moves across it, badge appears with bounce + glow, text fades in.

- [ ] **Step 1: Create `apps/video/src/scenes/BoardBadge.tsx`**

```tsx
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const BoardBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Board entrance: scale 0.9 → 1.0
  const boardScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });
  const boardScaleValue = interpolate(boardScale, [0, 1], [0.9, 1]);

  // Rook movement: starts at frame 20, moves from left to right on board
  const rookProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const rookX = interpolate(rookProgress, [0, 1], [-120, 120]);
  const rookY = interpolate(rookProgress, [0, 1], [60, -60]);

  // Badge entrance: starts at ~2.5s (75 frames), bounce effect
  const badgeEntrance = spring({
    frame: frame - 75,
    fps,
    config: { damping: 8 }, // Bouncy
  });
  const badgeScale = interpolate(badgeEntrance, [0, 1], [0, 1]);

  // Badge glow pulse (starts after badge enters)
  const badgeGlowOpacity =
    frame > 75
      ? interpolate(
          Math.sin(((frame - 75) / fps) * Math.PI * 3),
          [-1, 1],
          [0.3, 0.9]
        )
      : 0;

  // Text fade-in: starts at ~3.5s (105 frames)
  const textOpacity = interpolate(frame, [105, 135], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a1a1a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Board */}
      <div
        style={{
          transform: `scale(${boardScaleValue})`,
          position: "relative",
          width: 700,
          height: 647, // Maintains board aspect ratio 1011/934
        }}
      >
        <Img
          src={staticFile("chesscito-board.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
        {/* Rook piece moving on the board */}
        <Img
          src={staticFile("piece-rook.png")}
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            objectFit: "contain",
            top: "50%",
            left: "50%",
            transform: `translate(calc(-50% + ${rookX}px), calc(-50% + ${rookY}px))`,
          }}
        />
      </div>

      {/* Badge with glow */}
      <div
        style={{
          position: "absolute",
          bottom: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <Img
            src={staticFile("reward-glow.png")}
            style={{
              position: "absolute",
              width: 320,
              height: 320,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              opacity: badgeGlowOpacity,
            }}
          />
          <Img
            src={staticFile("badge-chesscito.png")}
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              transform: `scale(${badgeScale})`,
            }}
          />
        </div>
      </div>

      {/* Text */}
      <div
        style={{
          position: "absolute",
          bottom: 320,
          opacity: textOpacity,
          color: "#e0f7fa",
          fontSize: 40,
          fontWeight: 700,
          fontFamily: "sans-serif",
          textAlign: "center",
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
        }}
      >
        Earn on-chain badges
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Add Scene 3 to ChesscitPromo**

Update `apps/video/src/ChesscitPromo.tsx`:

```tsx
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { SplashIntro } from "./scenes/SplashIntro";
import { PiecesShowcase } from "./scenes/PiecesShowcase";
import { BoardBadge } from "./scenes/BoardBadge";

export const ChesscitPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={120} premountFor={30}>
        <SplashIntro />
      </Sequence>
      <Sequence from={120} durationInFrames={240} premountFor={30}>
        <PiecesShowcase />
      </Sequence>
      <Sequence from={360} durationInFrames={180} premountFor={30}>
        <BoardBadge />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Preview in Studio**

Expected: Board enters, rook slides diagonally, badge bounces in with glow, text appears.

- [ ] **Step 4: Commit**

```bash
git add apps/video/src/scenes/BoardBadge.tsx apps/video/src/ChesscitPromo.tsx
git commit -m "feat(video): add Scene 3 — board with rook movement and badge reveal"
```

---

## Chunk 3: Scene 4 + transitions + render

### Task 5: Build Scene 4 — CTA/Outro

**Files:**
- Create: `apps/video/src/scenes/CtaOutro.tsx`

Scene: ~4s (120 frames). Dark background, sequential fade-in of "Chesscito", "on Celo", "Play now" with pulsing border, and URL.

- [ ] **Step 1: Create `apps/video/src/scenes/CtaOutro.tsx`**

```tsx
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const APP_URL = "chesscito.vercel.app";

export const CtaOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Sequential fade-ins
  const titleOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(
    frame,
    [0.5 * fps, 0.9 * fps],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const ctaOpacity = interpolate(frame, [1 * fps, 1.4 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const urlOpacity = interpolate(frame, [1.5 * fps, 1.9 * fps], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // CTA border pulse
  const borderOpacity = interpolate(
    Math.sin((frame / fps) * Math.PI * 2),
    [-1, 1],
    [0.4, 1]
  );

  // Fade to black at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 0.5 * fps, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0f1a",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          fontSize: 72,
          fontWeight: 800,
          color: "#e0f7fa",
          fontFamily: "serif",
          letterSpacing: 2,
          textShadow: "0 0 40px rgba(0, 188, 212, 0.4)",
        }}
      >
        Chesscito
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 28,
          color: "rgba(224, 247, 250, 0.5)",
          fontFamily: "sans-serif",
          marginTop: 12,
        }}
      >
        on Celo
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          marginTop: 60,
          padding: "16px 48px",
          border: `2px solid rgba(0, 188, 212, ${borderOpacity})`,
          borderRadius: 16,
          fontSize: 32,
          fontWeight: 700,
          color: "#00bcd4",
          fontFamily: "sans-serif",
        }}
      >
        Play now
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          marginTop: 24,
          fontSize: 22,
          color: "rgba(224, 247, 250, 0.4)",
          fontFamily: "monospace",
        }}
      >
        {APP_URL}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/video/src/scenes/CtaOutro.tsx
git commit -m "feat(video): add Scene 4 — CTA outro with sequential reveals and pulsing border"
```

---

### Task 6: Wire all scenes with TransitionSeries + fade transitions

**Files:**
- Modify: `apps/video/src/ChesscitPromo.tsx`
- Modify: `apps/video/src/Root.tsx` (update duration)

Replace the manual `<Sequence>` layout with `<TransitionSeries>` and fade transitions between scenes.

**Duration math (with transitions):**
- Scene 1: 120 frames
- Transition: 15 frames (fade)
- Scene 2: 240 frames
- Transition: 15 frames (fade)
- Scene 3: 180 frames
- Transition: 15 frames (fade)
- Scene 4: 120 frames
- Total: 120 + 240 + 180 + 120 - 15 - 15 - 15 = **615 frames** (~20.5s)

- [ ] **Step 1: Rewrite `apps/video/src/ChesscitPromo.tsx` with TransitionSeries**

```tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SplashIntro } from "./scenes/SplashIntro";
import { PiecesShowcase } from "./scenes/PiecesShowcase";
import { BoardBadge } from "./scenes/BoardBadge";
import { CtaOutro } from "./scenes/CtaOutro";

const FADE_DURATION = 15; // 0.5s at 30fps

export const ChesscitPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0f1a" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <SplashIntro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={240}>
          <PiecesShowcase />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={180}>
          <BoardBadge />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_DURATION })}
        />

        <TransitionSeries.Sequence durationInFrames={120}>
          <CtaOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Update `apps/video/src/Root.tsx` duration**

Change `DURATION_FRAMES` from `660` to `615`:

```tsx
const DURATION_FRAMES = 615; // ~20.5s at 30fps (accounts for 3 fade transitions)
```

- [ ] **Step 3: Preview full video in Studio**

```bash
cd apps/video && pnpm studio
```

Expected: All 4 scenes play sequentially with smooth fade transitions between them. Total duration ~20.5s.

- [ ] **Step 4: Commit**

```bash
git add apps/video/src/ChesscitPromo.tsx apps/video/src/Root.tsx
git commit -m "feat(video): wire all scenes with TransitionSeries fade transitions"
```

---

### Task 7: Render final MP4 and verify

**Files:**
- Create: `apps/video/.gitignore`

- [ ] **Step 1: Create `apps/video/.gitignore`**

```
node_modules/
out/
dist/
```

- [ ] **Step 2: Render the video**

```bash
cd apps/video && pnpm render
```

Expected: MP4 file generated at `apps/video/out/chesscito-promo.mp4`. No errors. File should be ~20.5s at 1080x1920.

- [ ] **Step 3: Verify output**

```bash
# Check file exists and get basic info
ls -lh apps/video/out/chesscito-promo.mp4
```

- [ ] **Step 4: Final commit**

```bash
git add apps/video/.gitignore
git commit -m "chore(video): add .gitignore for output directory"
```

---

## Summary

| Task | Description | Effort |
|------|-------------|--------|
| 1 | Scaffold `apps/video` package | S |
| 2 | Scene 1 — Splash/Intro | S |
| 3 | Scene 2 — Pieces Showcase | M |
| 4 | Scene 3 — Board + Badge | M |
| 5 | Scene 4 — CTA/Outro | S |
| 6 | Wire TransitionSeries + transitions | S |
| 7 | Render + verify | S |

**Total: 7 tasks, 7 commits, ~615 frames (~20.5s)**
