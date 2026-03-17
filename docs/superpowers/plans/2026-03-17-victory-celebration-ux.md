# Victory Celebration UX — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the anticlimactic post-win end state with a cinematic 3-phase celebration overlay powered by Lottie sparkle animations, game stats pills, and a two-tier share system.

**Architecture:** The current `ArenaEndState` component becomes an orchestrator that delegates to three phase-specific sub-components (`VictoryCelebration`, `VictoryMinting`, `VictoryReceipt`). A shared `LottieAnimation` wrapper and `ShareButton` component go in `components/ui/`. The `arena/page.tsx` replaces `isMinting`/`hasMinted` booleans with a single `MintPhase` state machine and extracts `tokenId` from mint receipt logs.

**Tech Stack:** Next.js 14 App Router, `lottie-react`, Tailwind CSS, viem `decodeEventLog`, Web Share API

**Spec:** `docs/superpowers/specs/2026-03-17-victory-celebration-ux-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/web/public/animations/sparkles.json` | Lottie magic particles (download from LottieFiles) |
| Create | `apps/web/public/animations/sparkles-loading.json` | Lottie sparkle loading loop |
| Create | `apps/web/src/components/ui/lottie-animation.tsx` | `"use client"` Lottie wrapper, reusable |
| Create | `apps/web/src/components/ui/share-button.tsx` | Web Share API + clipboard fallback + toast |
| Create | `apps/web/src/components/ui/stat-pill.tsx` | Glass-style stat pill |
| Create | `apps/web/src/components/arena/victory-celebration.tsx` | Phase 1: win overlay with sparkles |
| Create | `apps/web/src/components/arena/victory-minting.tsx` | Phase 2: minting loader |
| Create | `apps/web/src/components/arena/victory-receipt.tsx` | Phase 3: minted receipt |
| Modify | `apps/web/src/components/arena/arena-end-state.tsx` | Rewrite: orchestrate 3 phases (win path) while preserving loss/draw/resign |
| Modify | `apps/web/src/app/arena/page.tsx:42-44,90-165,246-258` | Replace `isMinting`/`hasMinted` with `MintPhase`, capture `tokenId` from logs |
| Modify | `apps/web/src/lib/content/editorial.ts:224-230` | Add `VICTORY_CELEBRATION_COPY` |
| Modify | `apps/web/src/lib/game/arena-utils.ts` | Add shared `formatTime(ms)` helper |

### Review Fixes (from plan review)
- **Dead ternary removed:** `VictoryCelebration` StatPill uses `\`♟ ${moves}\`` directly
- **DRY `formatTime`:** Extracted to `arena-utils.ts`, imported by both `victory-celebration.tsx` and `victory-receipt.tsx`
- **DRY `APP_URL`:** Use `SHARE_COPY.url` from `editorial.ts` instead of hardcoding

---

## Task 1: Install `lottie-react` and add Lottie animation files

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/public/animations/sparkles.json`
- Create: `apps/web/public/animations/sparkles-loading.json`

- [ ] **Step 1: Install lottie-react**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm add lottie-react --filter web
```

- [ ] **Step 2: Download sparkles Lottie JSON**

Go to [lottiefiles.com](https://lottiefiles.com) and search for "magic sparkles" or "magic particles". Download a free animation JSON that:
- Has no embedded images (vector only)
- Loops smoothly
- Has a fantasy/magic aesthetic (not corporate)
- Is under 50KB

Save to `apps/web/public/animations/sparkles.json`.

Alternatively, use a simple placeholder sparkle animation as a PoC (can be upgraded later).

- [ ] **Step 3: Download sparkles-loading Lottie JSON**

Search LottieFiles for "sparkle loading" or "magic loader". Download a looping spinner animation. Save to `apps/web/public/animations/sparkles-loading.json`.

- [ ] **Step 4: Verify files exist and are valid JSON**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && ls -la apps/web/public/animations/ && node -e "JSON.parse(require('fs').readFileSync('apps/web/public/animations/sparkles.json','utf8')); console.log('sparkles.json OK')" && node -e "JSON.parse(require('fs').readFileSync('apps/web/public/animations/sparkles-loading.json','utf8')); console.log('sparkles-loading.json OK')"
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/public/animations/ pnpm-lock.yaml
git commit -m "feat(arena): add lottie-react and sparkle animation assets"
```

---

## Task 2: Create reusable UI components (LottieAnimation, StatPill, ShareButton)

**Files:**
- Create: `apps/web/src/components/ui/lottie-animation.tsx`
- Create: `apps/web/src/components/ui/stat-pill.tsx`
- Create: `apps/web/src/components/ui/share-button.tsx`

- [ ] **Step 1: Create LottieAnimation wrapper**

```tsx
// apps/web/src/components/ui/lottie-animation.tsx
"use client";

import Lottie from "lottie-react";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  animationData: any;
  loop?: boolean;
  speed?: number;
  className?: string;
};

export function LottieAnimation({ animationData, loop = true, speed = 1, className }: Props) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      speed={speed}
      className={className}
      rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
    />
  );
}
```

- [ ] **Step 2: Create StatPill component**

```tsx
// apps/web/src/components/ui/stat-pill.tsx
type Props = {
  label: string;
  variant?: "cyan" | "amber";
};

export function StatPill({ label, variant = "cyan" }: Props) {
  const borderClass =
    variant === "amber" ? "border-amber-400/30" : "border-cyan-400/30";

  return (
    <span
      className={`rounded-full border ${borderClass} bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm`}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Create ShareButton component**

This extracts and generalizes the share pattern from `result-overlay.tsx` (lines 107-144).

```tsx
// apps/web/src/components/ui/share-button.tsx
"use client";

import { useState } from "react";

type Props = {
  text: string;
  url: string;
  label: string;
  copiedLabel?: string;
  variant?: "ghost-cyan" | "amber";
};

export function ShareButton({
  text,
  url,
  label,
  copiedLabel = "Copied!",
  variant = "ghost-cyan",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard also failed — silently ignore
    }
  }

  const baseClass =
    "w-full rounded-2xl px-6 py-2.5 font-semibold transition-all active:scale-95";
  const variantClass =
    variant === "amber"
      ? "bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:shadow-[0_0_24px_rgba(245,158,11,0.5)]"
      : "border border-cyan-400/30 bg-transparent text-cyan-300 hover:bg-cyan-400/10";

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={`${baseClass} ${variantClass}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
```

- [ ] **Step 4: Verify build compiles**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

Expected: Build succeeds (components aren't imported yet, but should have no syntax errors).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/lottie-animation.tsx apps/web/src/components/ui/stat-pill.tsx apps/web/src/components/ui/share-button.tsx
git commit -m "feat(ui): add LottieAnimation, StatPill, and ShareButton components"
```

---

## Task 3: Add editorial copy

**Files:**
- Modify: `apps/web/src/lib/content/editorial.ts:224-230`

- [ ] **Step 1: Add VICTORY_CELEBRATION_COPY after VICTORY_MINT_COPY**

Add right after the existing `VICTORY_MINT_COPY` block (line 230):

```typescript
export const VICTORY_CELEBRATION_COPY = {
  title: "Victory!",
  mintedTitle: (id: number | bigint) => `Victory #${id} Minted!`,
  mintedTitleFallback: "Victory Minted!",
  mintedSubtitle: "on Celo blockchain",
  shareWin: "Share Win",
  shareVictory: "Share Victory",
  mintingMessage: "Minting your victory...",
  copiedToast: "Copied!",
  shareTextBasic: (moves: number, url: string) =>
    `♟ Checkmate in ${moves} moves. Can you beat that?\nPlay Chesscito on Celo 👉 ${url}`,
  shareTextMinted: (moves: number, tokenId: bigint | number, url: string) =>
    `♟ Checkmate in ${moves} moves. Can you beat that?\nVictory #${tokenId} minted on-chain 👉 ${url}`,
} as const;
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/content/editorial.ts
git commit -m "feat(editorial): add VICTORY_CELEBRATION_COPY constants"
```

---

## Task 4: Create VictoryCelebration (Phase 1)

**Files:**
- Create: `apps/web/src/components/arena/victory-celebration.tsx`

- [ ] **Step 1: Create the Phase 1 component**

This is the main celebration overlay shown immediately on player win.

```tsx
// apps/web/src/components/arena/victory-celebration.tsx
"use client";

import { ARENA_COPY, SHARE_COPY, VICTORY_CELEBRATION_COPY, VICTORY_MINT_COPY } from "@/lib/content/editorial";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import { ShareButton } from "@/components/ui/share-button";
import { StatPill } from "@/components/ui/stat-pill";
import { formatTime } from "@/lib/game/arena-utils";
import sparklesData from "@/../public/animations/sparkles.json";

type Props = {
  moves: number;
  elapsedMs: number;
  difficulty: string;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  onMintVictory?: () => void;
  mintPrice?: string;
  mintError?: string | null;
};

export function VictoryCelebration({
  moves,
  elapsedMs,
  difficulty,
  onPlayAgain,
  onBackToHub,
  onMintVictory,
  mintPrice,
  mintError,
}: Props) {
  const shareText = VICTORY_CELEBRATION_COPY.shareTextBasic(moves, SHARE_COPY.url);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-300"
      role="alert"
      aria-live="assertive"
    >
      {/* Lottie sparkles behind card */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <LottieAnimation animationData={sparklesData} className="h-full w-full opacity-40" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-[#0b1628]/90 px-8 py-8 backdrop-blur-xl shadow-[0_0_40px_rgba(52,211,153,0.15)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Wolf icon */}
        <img
          src="/art/favicon-wolf.png"
          alt=""
          aria-hidden="true"
          className="h-16 w-16 drop-shadow-[0_0_20px_rgba(103,232,249,0.5)]"
        />

        {/* Title */}
        <h2 className="fantasy-title text-3xl font-bold text-emerald-300 drop-shadow-[0_0_16px_rgba(52,211,153,0.5)]">
          {VICTORY_CELEBRATION_COPY.title}
        </h2>

        {/* Stat pills */}
        <div className="flex items-center gap-2">
          <StatPill label={difficulty.toUpperCase()} variant="cyan" />
          <StatPill label={`♟ ${moves}`} variant="cyan" />
          <StatPill label={`⏱ ${formatTime(elapsedMs)}`} variant="cyan" />
        </div>

        {/* Buttons */}
        <div className="flex w-full flex-col items-center gap-3">
          {/* Share (basic) */}
          <ShareButton
            text={shareText}
            url={SHARE_COPY.url}
            label={`♟ ${VICTORY_CELEBRATION_COPY.shareWin}`}
            copiedLabel={VICTORY_CELEBRATION_COPY.copiedToast}
            variant="ghost-cyan"
          />

          {/* Mint button */}
          {onMintVictory && (
            <button
              type="button"
              onClick={onMintVictory}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 font-semibold text-white shadow-[0_0_16px_rgba(245,158,11,0.3)] transition-all hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] active:scale-95"
            >
              {`${VICTORY_MINT_COPY.mintButton} — ${mintPrice ?? ""}`}
            </button>
          )}

          {/* Mint error */}
          {mintError && (
            <p className="text-xs text-rose-300">{mintError}</p>
          )}

          {/* Play Again / Back to Hub */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-2.5 font-semibold text-white shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-all hover:shadow-[0_0_24px_rgba(34,211,238,0.5)] active:scale-95"
            >
              {ARENA_COPY.playAgain}
            </button>
            <button
              type="button"
              onClick={onBackToHub}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 font-semibold text-white/70 transition-all hover:bg-white/10 active:scale-95"
            >
              {ARENA_COPY.backToHub}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/arena/victory-celebration.tsx
git commit -m "feat(arena): add VictoryCelebration component (Phase 1)"
```

---

## Task 5: Create VictoryMinting (Phase 2)

**Files:**
- Create: `apps/web/src/components/arena/victory-minting.tsx`

- [ ] **Step 1: Create the Phase 2 loading component**

```tsx
// apps/web/src/components/arena/victory-minting.tsx
"use client";

import { VICTORY_CELEBRATION_COPY } from "@/lib/content/editorial";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import sparklesLoadingData from "@/../public/animations/sparkles-loading.json";

export function VictoryMinting() {
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0b1628]/90 px-12 py-10 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.1)] animate-in zoom-in-95 duration-300">
        <div className="h-20 w-20">
          <LottieAnimation animationData={sparklesLoadingData} />
        </div>
        <p className="text-lg font-semibold text-amber-200 animate-pulse">
          {VICTORY_CELEBRATION_COPY.mintingMessage}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/arena/victory-minting.tsx
git commit -m "feat(arena): add VictoryMinting component (Phase 2)"
```

---

## Task 6: Create VictoryReceipt (Phase 3)

**Files:**
- Create: `apps/web/src/components/arena/victory-receipt.tsx`

- [ ] **Step 1: Create the Phase 3 receipt component**

```tsx
// apps/web/src/components/arena/victory-receipt.tsx
"use client";

import { ARENA_COPY, SHARE_COPY, VICTORY_CELEBRATION_COPY } from "@/lib/content/editorial";
import { LottieAnimation } from "@/components/ui/lottie-animation";
import { ShareButton } from "@/components/ui/share-button";
import { StatPill } from "@/components/ui/stat-pill";
import { formatTime } from "@/lib/game/arena-utils";
import sparklesData from "@/../public/animations/sparkles.json";

type Props = {
  tokenId: bigint | null;
  moves: number;
  elapsedMs: number;
  difficulty: string;
  onPlayAgain: () => void;
  onBackToHub: () => void;
};

export function VictoryReceipt({
  tokenId,
  moves,
  elapsedMs,
  difficulty,
  onPlayAgain,
  onBackToHub,
}: Props) {
  const title = tokenId != null
    ? VICTORY_CELEBRATION_COPY.mintedTitle(tokenId)
    : VICTORY_CELEBRATION_COPY.mintedTitleFallback;

  const shareText = tokenId != null
    ? VICTORY_CELEBRATION_COPY.shareTextMinted(moves, tokenId, SHARE_COPY.url)
    : VICTORY_CELEBRATION_COPY.shareTextBasic(moves, SHARE_COPY.url);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-300"
      role="alert"
      aria-live="assertive"
    >
      {/* Lottie sparkles — intensified (1.5x speed) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <LottieAnimation animationData={sparklesData} speed={1.5} className="h-full w-full opacity-60" />
      </div>

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-[#0b1628]/90 px-8 py-8 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.15)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        {/* Wolf icon — amber glow */}
        <img
          src="/art/favicon-wolf.png"
          alt=""
          aria-hidden="true"
          className="h-16 w-16 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
        />

        {/* Title */}
        <h2 className="fantasy-title text-3xl font-bold text-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.5)]">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-white/50">
          {VICTORY_CELEBRATION_COPY.mintedSubtitle}
        </p>

        {/* Stat pills — amber */}
        <div className="flex items-center gap-2">
          <StatPill label={difficulty.toUpperCase()} variant="amber" />
          <StatPill label={`♟ ${moves}`} variant="amber" />
          <StatPill label={`⏱ ${formatTime(elapsedMs)}`} variant="amber" />
        </div>

        {/* Buttons */}
        <div className="flex w-full flex-col items-center gap-3">
          {/* Share (upgraded — amber, primary) */}
          <ShareButton
            text={shareText}
            url={SHARE_COPY.url}
            label={`🏆 ${VICTORY_CELEBRATION_COPY.shareVictory}`}
            copiedLabel={VICTORY_CELEBRATION_COPY.copiedToast}
            variant="amber"
          />

          {/* Play Again / Back to Hub */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPlayAgain}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-2.5 font-semibold text-white shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-all hover:shadow-[0_0_24px_rgba(34,211,238,0.5)] active:scale-95"
            >
              {ARENA_COPY.playAgain}
            </button>
            <button
              type="button"
              onClick={onBackToHub}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 font-semibold text-white/70 transition-all hover:bg-white/10 active:scale-95"
            >
              {ARENA_COPY.backToHub}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/arena/victory-receipt.tsx
git commit -m "feat(arena): add VictoryReceipt component (Phase 3)"
```

---

## Task 7: Rewrite ArenaEndState as phase orchestrator

**Files:**
- Modify: `apps/web/src/components/arena/arena-end-state.tsx`

- [ ] **Step 1: Rewrite ArenaEndState**

The component now orchestrates: for player wins it delegates to the 3 phase components; for losses/draws/resigns it keeps the existing minimal card.

```tsx
// apps/web/src/components/arena/arena-end-state.tsx
"use client";

import { ARENA_COPY } from "@/lib/content/editorial";
import type { ArenaStatus } from "@/lib/game/types";
import { VictoryCelebration } from "./victory-celebration";
import { VictoryMinting } from "./victory-minting";
import { VictoryReceipt } from "./victory-receipt";

export type MintPhase = "idle" | "minting" | "minted";

type Props = {
  status: ArenaStatus;
  isPlayerWin: boolean;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  // Victory mint props
  mintPhase: MintPhase;
  onMintVictory?: () => void;
  mintPrice?: string;
  mintError?: string | null;
  tokenId?: bigint | null;
  // Game stats
  moves: number;
  elapsedMs: number;
  difficulty: string;
};

function getLoseText(status: ArenaStatus): string {
  switch (status) {
    case "checkmate":
      return ARENA_COPY.endState.checkmate.lose;
    case "stalemate":
      return ARENA_COPY.endState.stalemate;
    case "draw":
      return ARENA_COPY.endState.draw;
    case "resigned":
      return ARENA_COPY.endState.resigned;
    default:
      return "";
  }
}

export function ArenaEndState({
  status,
  isPlayerWin,
  onPlayAgain,
  onBackToHub,
  mintPhase,
  onMintVictory,
  mintPrice,
  mintError,
  tokenId,
  moves,
  elapsedMs,
  difficulty,
}: Props) {
  // Player WIN path — 3-phase celebration
  if (isPlayerWin) {
    if (mintPhase === "minting") {
      return <VictoryMinting />;
    }
    if (mintPhase === "minted") {
      return (
        <VictoryReceipt
          tokenId={tokenId ?? null}
          moves={moves}
          elapsedMs={elapsedMs}
          difficulty={difficulty}
          onPlayAgain={onPlayAgain}
          onBackToHub={onBackToHub}
        />
      );
    }
    // mintPhase === "idle" → Phase 1
    return (
      <VictoryCelebration
        moves={moves}
        elapsedMs={elapsedMs}
        difficulty={difficulty}
        onPlayAgain={onPlayAgain}
        onBackToHub={onBackToHub}
        onMintVictory={onMintVictory}
        mintPrice={mintPrice}
        mintError={mintError}
      />
    );
  }

  // LOSS / DRAW / RESIGN — keep existing minimal card
  const text = getLoseText(status);
  if (!text) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-[15vh] animate-in fade-in duration-300"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0b1628]/90 px-8 py-8 backdrop-blur-xl shadow-[0_0_40px_rgba(251,113,133,0.1)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <img
          src="/art/favicon-wolf.png"
          alt=""
          aria-hidden="true"
          className="h-14 w-14 drop-shadow-[0_0_20px_rgba(103,232,249,0.5)]"
        />
        <h2 className="fantasy-title text-2xl font-bold text-rose-300 drop-shadow-[0_0_16px_rgba(251,113,133,0.4)]">
          {text}
        </h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-2.5 font-semibold text-white shadow-[0_0_16px_rgba(34,211,238,0.3)] transition-all hover:shadow-[0_0_24px_rgba(34,211,238,0.5)] active:scale-95"
          >
            {ARENA_COPY.playAgain}
          </button>
          <button
            type="button"
            onClick={onBackToHub}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2.5 font-semibold text-white/70 transition-all hover:bg-white/10 active:scale-95"
          >
            {ARENA_COPY.backToHub}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

Note: Build may fail because `arena/page.tsx` still passes old props. That's expected — we fix it in Task 8.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/arena/arena-end-state.tsx
git commit -m "refactor(arena): rewrite ArenaEndState as 3-phase orchestrator"
```

---

## Task 8: Update arena/page.tsx — MintPhase state + tokenId extraction

**Files:**
- Modify: `apps/web/src/app/arena/page.tsx`

This is the critical integration task. We replace `isMinting`/`hasMinted` with `MintPhase`, extract `tokenId` from the mint receipt, and pass the new props to `ArenaEndState`.

- [ ] **Step 1: Update imports and state**

Replace lines 1-44 with:

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { decodeEventLog } from "viem";
import { useChessGame } from "@/lib/game/use-chess-game";
import { ArenaBoard } from "@/components/arena/arena-board";
import { DifficultySelector } from "@/components/arena/difficulty-selector";
import { ArenaHud } from "@/components/arena/arena-hud";
import { PromotionOverlay } from "@/components/arena/promotion-overlay";
import { ArenaEndState, type MintPhase } from "@/components/arena/arena-end-state";
import { ARENA_COPY } from "@/lib/content/editorial";
import { getConfiguredChainId, getVictoryNFTAddress } from "@/lib/contracts/chains";
import { victoryAbi } from "@/lib/contracts/victory";
import {
  ACCEPTED_TOKENS,
  DIFFICULTY_TO_CHAIN,
  VICTORY_PRICES,
  erc20Abi,
  formatUsd,
  normalizePrice,
} from "@/lib/contracts/tokens";

type SignatureResponse =
  | { nonce: string; deadline: string; signature: `0x${string}`; error?: never }
  | { error: string };

export default function ArenaPage() {
  const router = useRouter();
  const game = useChessGame();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();

  const [mintPhase, setMintPhase] = useState<MintPhase>("idle");
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
```

- [ ] **Step 2: Update handleMintVictory to use MintPhase and extract tokenId**

Replace the `handleMintVictory` function (old lines 90-165):

```tsx
  async function handleMintVictory() {
    if (!canMint || !address || !victoryNFTAddress || !publicClient) return;

    setMintPhase("minting");
    setMintError(null);
    try {
      // 1. Get server signature
      const res = await fetch("/api/sign-victory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          player: address,
          difficulty: chainDifficulty,
          totalMoves: game.moveCount,
          timeMs: game.elapsedMs,
        }),
      });
      const payload = (await res.json()) as SignatureResponse;
      if (!res.ok || "error" in payload) {
        throw new Error(payload.error ?? "Could not fetch signature");
      }

      // 2. Select payment token
      const token = selectPaymentToken(mintPriceUsd6);
      if (!token) throw new Error("No token with sufficient balance");

      const normalizedAmount = normalizePrice(mintPriceUsd6, token.decimals);

      // 3. Check allowance and approve if needed
      const allowance = await publicClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, victoryNFTAddress],
      });

      if ((allowance as bigint) < normalizedAmount) {
        const approveHash = await writeContractAsync({
          address: token.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [victoryNFTAddress, normalizedAmount],
          chainId,
          account: address,
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      // 4. Mint and wait for confirmation
      const mintHash = await writeContractAsync({
        address: victoryNFTAddress,
        abi: victoryAbi,
        functionName: "mintSigned",
        args: [
          chainDifficulty,
          game.moveCount,
          game.elapsedMs,
          token.address,
          BigInt(payload.nonce),
          BigInt(payload.deadline),
          payload.signature,
        ],
        chainId,
        account: address,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });

      // 5. Extract tokenId from VictoryMinted event
      let extractedTokenId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: victoryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "VictoryMinted" && "tokenId" in decoded.args) {
            extractedTokenId = decoded.args.tokenId as bigint;
            break;
          }
        } catch {
          // Not our event — skip
        }
      }

      setTokenId(extractedTokenId);
      setMintPhase("minted");
      setMintError(null);
    } catch (err) {
      console.error("Mint failed:", err);
      const msg = err instanceof Error ? err.message : "Mint failed";
      setMintError(msg.includes("User rejected") ? null : "Mint failed. Try again.");
      setMintPhase("idle"); // Revert to Phase 1
    }
  }
```

- [ ] **Step 3: Update handlePlayAgain to reset MintPhase**

```tsx
  const handlePlayAgain = () => {
    setMintPhase("idle");
    setTokenId(null);
    setMintError(null);
    game.reset();
  };
```

- [ ] **Step 4: Update ArenaEndState render call**

Replace the old `{isEndState && (<ArenaEndState .../>)}` block (old lines 246-258):

```tsx
      {isEndState && (
        <ArenaEndState
          status={game.status}
          isPlayerWin={isPlayerWin}
          onPlayAgain={handlePlayAgain}
          onBackToHub={handleBackToHub}
          mintPhase={mintPhase}
          onMintVictory={canMint ? () => void handleMintVictory() : undefined}
          mintPrice={mintPriceLabel}
          mintError={mintError}
          tokenId={tokenId}
          moves={game.moveCount}
          elapsedMs={game.elapsedMs}
          difficulty={game.difficulty}
        />
      )}
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

Expected: Build succeeds.

- [ ] **Step 6: Verify existing tests still pass**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web test
```

Expected: All tests pass (no existing tests for arena-end-state).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/arena/page.tsx
git commit -m "feat(arena): integrate MintPhase state machine and tokenId extraction"
```

---

## Task 9: Manual QA and final verification

- [ ] **Step 1: Run full build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web build
```

- [ ] **Step 2: Run dev server and test locally**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web dev
```

Test in browser at `http://localhost:3000/arena`:
1. Select Easy difficulty and win a game
2. **Phase 1 check:** Verify sparkle animation plays, "Victory!" title shows, stat pills display correct difficulty/moves/time, "Share Win" button works (Web Share or clipboard), "Mint Victory" button is visible if wallet connected
3. **Phase 2 check:** Click "Mint Victory", verify loading animation appears with "Minting your victory..." text
4. **Phase 3 check:** After mint succeeds, verify amber color scheme, "Victory #N Minted!" title with tokenId, "on Celo blockchain" subtitle, "Share Victory" amber button with upgraded text
5. **Error check:** Test mint failure (reject wallet prompt) — should revert to Phase 1 with error
6. **Loss check:** Lose a game — verify the minimal rose-colored card still works (no sparkles, no share, no mint)

- [ ] **Step 3: Verify Lottie renders on mobile viewport**

In Chrome DevTools, set viewport to 390px width (iPhone 12 Pro). Confirm sparkles don't overflow, card is centered, buttons are tappable.

- [ ] **Step 4: Run all tests**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm --filter web test && cd apps/contracts && npx hardhat test
```
