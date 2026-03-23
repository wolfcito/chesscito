# Chesscito Coach — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a personal chess coach that analyzes arena games post-match, provides feedback via LLM (paid) or heuristics (free), and tracks improvement with objective badges.

**Architecture:** Server-paid LLM analysis via Upstash-backed async jobs + client-side heuristic fallback. Credits purchased on-chain via existing ShopUpgradeable, tracked off-chain in Upstash. Game records persisted server-side with chess.js validation. No BYOK, no client-side LLM calls.

**Tech Stack:** Next.js 14 App Router, chess.js, @upstash/redis (already installed), zod (new dep), Anthropic SDK (new dep), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-22-chesscito-coach-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/package.json` | Modify | Add zod + @anthropic-ai/sdk deps |
| `apps/web/src/lib/coach/types.ts` | Create | GameRecord, CoachResponse, BasicCoachResponse, CoachAnalysisRecord, PlayerSummary, BadgeCriteria |
| `apps/web/src/lib/coach/game-result.ts` | Create | mapArenaResult() — ArenaStatus + isPlayerWin → GameResult |
| `apps/web/src/lib/coach/validate-game.ts` | Create | validateGameRecord() — replay moves with chess.js, recompute result |
| `apps/web/src/lib/coach/normalize.ts` | Create | Zod schemas + normalizeCoachResponse() |
| `apps/web/src/lib/coach/fallback-engine.ts` | Create | generateQuickReview() — heuristic tips from game metrics |
| `apps/web/src/lib/coach/prompt-template.ts` | Create | buildCoachPrompt() — sealed server-side prompt, result-aware editorial |
| `apps/web/src/lib/coach/badge-evaluator.ts` | Create | evaluateBadges() — objective metrics with guardrails |
| `apps/web/src/lib/coach/redis-keys.ts` | Create | Key namespace helpers for Upstash |
| `apps/web/src/lib/game/use-chess-game.ts` | Modify | Expose moveHistory: string[] (SAN array from chess.js) |
| `apps/web/src/lib/content/editorial.ts` | Modify | Add COACH_COPY constant |
| `apps/web/src/app/api/games/route.ts` | Create | POST (save game) + GET (game history) |
| `apps/web/src/app/api/coach/analyze/route.ts` | Create | POST — idempotent async analysis job |
| `apps/web/src/app/api/coach/job/[id]/route.ts` | Create | GET — poll job status |
| `apps/web/src/app/api/coach/history/route.ts` | Create | GET — past analyses for wallet |
| `apps/web/src/app/api/coach/credits/route.ts` | Create | GET — credit balance for wallet |
| `apps/web/src/components/coach/ask-coach-button.tsx` | Create | Post-game CTA in ArenaEndState |
| `apps/web/src/components/coach/coach-loading.tsx` | Create | Async job polling UI |
| `apps/web/src/components/coach/coach-panel.tsx` | Create | Full analysis result display |
| `apps/web/src/components/coach/coach-fallback.tsx` | Create | Quick Review display |
| `apps/web/src/components/coach/coach-paywall.tsx` | Create | Credit purchase sheet |
| `apps/web/src/components/coach/coach-history.tsx` | Create | Past sessions list |
| `apps/web/src/components/arena/arena-end-state.tsx` | Modify | Wire Ask the Coach button |
| `apps/web/src/app/arena/page.tsx` | Modify | Pass moveHistory + coach state to ArenaEndState |
| `apps/web/src/lib/coach/__tests__/validate-game.test.ts` | Create | Game validation tests |
| `apps/web/src/lib/coach/__tests__/normalize.test.ts` | Create | Zod normalization tests |
| `apps/web/src/lib/coach/__tests__/fallback-engine.test.ts` | Create | Fallback heuristic tests |
| `apps/web/src/lib/coach/__tests__/game-result.test.ts` | Create | Result mapping tests |
| `apps/web/src/lib/coach/__tests__/badge-evaluator.test.ts` | Create | Badge evaluation tests |

---

## Task Dependency Graph

```
Task 1 (deps + types) ──┐
                         ├── Task 3 (validate-game) ──┐
Task 2 (game-result)  ──┤                             │
                         ├── Task 4 (normalize)        ├── Task 7 (analyze route) ─┐
                         ├── Task 5 (fallback-engine)  │                           ├── Task 10 (coach UI) ── Task 12 (wire into arena) ── Task 13 (verification)
                         ├── Task 6 (badge-evaluator)  │                           │
                         │                             │                           │
                         ├── Task 8 (API routes:       │                           │
                         │    games, job, history,  ───┘                           │
                         │    credits)                                             │
                         │                                                        │
                         └── Task 9 (useChessGame ext) ───────────────────────────┘

Task 11 (credit verify) ── depends on Task 1 only, parallel with 2-9
```

Tasks 2-6, 9, 11 are independent and can run in parallel after Task 1.
Task 7 depends on Tasks 3, 4, 5.
Task 8 depends on Task 1.
Task 10 depends on Tasks 7, 8.
Task 12 depends on Tasks 9, 10, 11.
Task 13 depends on Task 12.

---

### Task 1: Add dependencies and create type definitions

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/coach/types.ts`
- Create: `apps/web/src/lib/coach/redis-keys.ts`
- Modify: `apps/web/src/lib/content/editorial.ts`

- [ ] **Step 1: Install zod and Anthropic SDK**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito && pnpm add -F apps/web zod @anthropic-ai/sdk
```

- [ ] **Step 2: Create types.ts**

Create `apps/web/src/lib/coach/types.ts`:

```typescript
export type GameResult = "win" | "lose" | "draw" | "resigned";

export type GameRecord = {
  gameId: string;
  moves: string[];
  result: GameResult;
  difficulty: "easy" | "medium" | "hard";
  totalMoves: number;
  elapsedMs: number;
  timestamp: number;
  receivedAt?: number;
};

export type Mistake = {
  moveNumber: number;
  played: string;
  better: string;
  explanation: string;
};

export type CoachResponse = {
  kind: "full";
  summary: string;
  mistakes: Mistake[];
  lessons: string[];
  praise: string[];
};

export type BasicCoachResponse = {
  kind: "quick";
  summary: string;
  tips: string[];
};

export type CoachAnalysisRecord = {
  gameId: string;
  provider: "server" | "fallback";
  model?: string;
  analysisVersion: string;
  createdAt: number;
  response: CoachResponse | BasicCoachResponse;
};

export type PlayerSummary = {
  gamesPlayed: number;
  recentMistakeCategories: string[];
  avgGameLength: number;
  difficultyDistribution: Record<string, number>;
  weaknessTags: string[];
};

export type JobStatus =
  | { status: "pending" }
  | { status: "ready"; response: CoachResponse }
  | { status: "failed"; reason: string };

export type BadgeCriteria = {
  area: string;
  metric: string;
  threshold: number;
  windowSize: number;
  minDifficulty?: "medium" | "hard";
  minDiverseDifficulties?: number;
};
```

- [ ] **Step 3: Create redis-keys.ts**

Create `apps/web/src/lib/coach/redis-keys.ts`:

```typescript
export const REDIS_KEYS = {
  game: (wallet: string, gameId: string) => `coach:game:${wallet}:${gameId}`,
  gameList: (wallet: string) => `coach:games:${wallet}`,
  job: (jobId: string) => `coach:job:${jobId}`,
  jobByGame: (wallet: string, gameId: string) => `coach:job-ref:${wallet}:${gameId}`,
  analysis: (wallet: string, gameId: string) => `coach:analysis:${wallet}:${gameId}`,
  analysisList: (wallet: string) => `coach:analyses:${wallet}`,
  credits: (wallet: string) => `coach:credits:${wallet}`,
  pendingJob: (wallet: string) => `coach:pending:${wallet}`,
} as const;
```

- [ ] **Step 4: Add COACH_COPY to editorial.ts**

Add to the end of `apps/web/src/lib/content/editorial.ts` (before the last line):

```typescript
export const COACH_COPY = {
  askCoach: "Ask the Coach",
  askCoachSub: "What can I improve?",
  quickReviewTitle: "Quick Review",
  coachAnalysisTitle: "Coach Analysis",
  keyMoments: "KEY MOMENTS",
  whatYouDidWell: "WHAT YOU DID WELL",
  takeaways: "TAKEAWAYS",
  tips: "TIPS",
  yourSessions: "Your Sessions",
  yourProgress: "YOUR PROGRESS",
  gamesAnalyzed: (n: number) => `Games analyzed: ${n}`,
  highestDifficulty: (d: string) => `Highest difficulty: ${d}`,
  currentStreak: (n: number) => `Current streak: ${n} wins`,
  creditTitle: "Coach Credits",
  creditExplain: "1 credit = 1 full game analysis by AI coach",
  creditPack5: "5 uses",
  creditPack20: "20 uses",
  creditBest: "BEST",
  buyWithUsdc: "Buy with USDC",
  orQuickReview: "Or try Quick Review for free",
  getFullAnalysis: "Get Full Analysis",
  getFullAnalysisSub: "See your key moments and personalized tips",
  analyzing: "Analyzing your game...",
  reviewingMoves: "Reviewing your moves",
  canLeave: "You can leave — we'll keep your result ready",
  analysisReady: "Your analysis is ready",
  analysisProcessing: "Your analysis is still processing...",
  analysisFailed: "Analysis couldn't be completed. Your credit was not spent.",
  coachResting: "Coach is resting. Try again later.",
  retry: "Retry",
  full: "Full",
  quick: "Quick",
  keyMomentsCount: (n: number) => `${n} key moments`,
  moveLabel: (n: number, move: string) => `Move ${n} · You played ${move}`,
  tryInstead: (move: string) => `→ Try ${move}`,
} as const;
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/src/lib/coach/ apps/web/src/lib/content/editorial.ts pnpm-lock.yaml
git commit -m "feat(coach): add types, redis keys, editorial copy, and deps (zod + anthropic)

Wolfcito 🐾 @akawolfcito"
```

---

### Task 2: Game result mapping with tests

**Files:**
- Create: `apps/web/src/lib/coach/game-result.ts`
- Create: `apps/web/src/lib/coach/__tests__/game-result.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/lib/coach/__tests__/game-result.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapArenaResult } from "../game-result.js";

describe("mapArenaResult", () => {
  it("maps checkmate + player win to 'win'", () => {
    assert.equal(mapArenaResult("checkmate", true), "win");
  });
  it("maps checkmate + player loss to 'lose'", () => {
    assert.equal(mapArenaResult("checkmate", false), "lose");
  });
  it("maps stalemate to 'draw'", () => {
    assert.equal(mapArenaResult("stalemate", false), "draw");
  });
  it("maps draw to 'draw'", () => {
    assert.equal(mapArenaResult("draw", false), "draw");
  });
  it("maps resigned to 'resigned'", () => {
    assert.equal(mapArenaResult("resigned", false), "resigned");
  });
});
```

- [ ] **Step 2: Add test config for coach tests**

Create `apps/web/tsconfig.test-coach.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": ".tmp/coach-tests",
    "rootDir": "src",
    "target": "es2020",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "noEmit": false,
    "paths": {}
  },
  "include": ["src/lib/coach/**/*.ts"]
}
```

Add to `apps/web/package.json` scripts:

```json
"test:coach": "rm -rf .tmp/coach-tests && tsc -p tsconfig.test-coach.json && node --test .tmp/coach-tests/lib/coach/__tests__/*.test.js && rm -rf .tmp/coach-tests"
```

Update the `"test"` script to include `test:coach`:

```json
"test": "npm run test:server && npm run test:game && npm run test:og && npm run test:coach"
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm run test:coach
```

Expected: compilation error — `game-result` module does not exist.

- [ ] **Step 4: Write implementation**

Create `apps/web/src/lib/coach/game-result.ts`:

```typescript
import type { GameResult } from "./types";

/**
 * Maps ArenaStatus + isPlayerWin to GameResult.
 * Uses plain string param to avoid @/ path alias issues in test builds.
 */
export function mapArenaResult(status: string, isPlayerWin: boolean): GameResult {
  switch (status) {
    case "checkmate":
      return isPlayerWin ? "win" : "lose";
    case "stalemate":
    case "draw":
      return "draw";
    case "resigned":
      return "resigned";
    default:
      return "lose";
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm run test:coach
```

Expected: 5/5 pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/coach/game-result.ts apps/web/src/lib/coach/__tests__/game-result.test.ts apps/web/tsconfig.test-coach.json apps/web/package.json
git commit -m "feat(coach): add mapArenaResult with 5 tests

Wolfcito 🐾 @akawolfcito"
```

---

### Task 3: Game record validation with tests

**Files:**
- Create: `apps/web/src/lib/coach/validate-game.ts`
- Create: `apps/web/src/lib/coach/__tests__/validate-game.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/lib/coach/__tests__/validate-game.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateGameRecord } from "../validate-game.js";

describe("validateGameRecord", () => {
  it("accepts a valid scholar's mate (checkmate + win)", () => {
    const result = validateGameRecord({
      moves: ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"],
      result: "win",
      difficulty: "easy",
    });
    assert.equal(result.valid, true);
    assert.equal(result.computedResult, "win");
    assert.equal(result.totalMoves, 7);
  });

  it("rejects illegal move sequence", () => {
    const result = validateGameRecord({
      moves: ["e4", "e5", "e4"],
      result: "win",
      difficulty: "easy",
    });
    assert.equal(result.valid, false);
    assert.ok(result.error?.includes("Illegal move"));
  });

  it("corrects mismatched result claim", () => {
    const result = validateGameRecord({
      moves: ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"],
      result: "draw",
      difficulty: "easy",
    });
    assert.equal(result.valid, true);
    assert.equal(result.computedResult, "win");
  });

  it("rejects empty moves", () => {
    const result = validateGameRecord({
      moves: [],
      result: "draw",
      difficulty: "easy",
    });
    assert.equal(result.valid, false);
  });

  it("accepts a valid resignation (non-terminal position)", () => {
    const result = validateGameRecord({
      moves: ["e4", "e5", "Nf3"],
      result: "resigned",
      difficulty: "medium",
    });
    assert.equal(result.valid, true);
    assert.equal(result.computedResult, "resigned");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm run test:coach
```

Expected: compilation error — `validate-game` does not exist.

- [ ] **Step 3: Write implementation**

Create `apps/web/src/lib/coach/validate-game.ts`:

```typescript
import { Chess } from "chess.js";
import type { GameResult } from "./types";

type ValidationInput = {
  moves: string[];
  result: GameResult;
  difficulty: string;
};

type ValidationResult =
  | { valid: true; computedResult: GameResult; totalMoves: number }
  | { valid: false; error: string };

export function validateGameRecord(input: ValidationInput): ValidationResult {
  if (!input.moves || input.moves.length === 0) {
    return { valid: false, error: "Empty move list" };
  }

  const game = new Chess();

  for (let i = 0; i < input.moves.length; i++) {
    try {
      const moveResult = game.move(input.moves[i]);
      if (!moveResult) {
        return { valid: false, error: `Illegal move at index ${i}: ${input.moves[i]}` };
      }
    } catch {
      return { valid: false, error: `Illegal move at index ${i}: ${input.moves[i]}` };
    }
  }

  let computedResult: GameResult;
  if (game.isCheckmate()) {
    // Last move was made by the winner. In chess.js, after a checkmate
    // the turn belongs to the loser. White plays as player.
    computedResult = game.turn() === "b" ? "win" : "lose";
  } else if (game.isStalemate() || game.isDraw()) {
    computedResult = "draw";
  } else if (input.result === "resigned") {
    computedResult = "resigned";
  } else {
    computedResult = "draw";
  }

  return {
    valid: true,
    computedResult,
    totalMoves: input.moves.length,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm run test:coach
```

Expected: all tests pass (game-result + validate-game).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/coach/validate-game.ts apps/web/src/lib/coach/__tests__/validate-game.test.ts
git commit -m "feat(coach): add validateGameRecord with chess.js replay and 5 tests

Wolfcito 🐾 @akawolfcito"
```

---

### Task 4: Zod normalization layer with tests

**Files:**
- Create: `apps/web/src/lib/coach/normalize.ts`
- Create: `apps/web/src/lib/coach/__tests__/normalize.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/lib/coach/__tests__/normalize.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeCoachResponse } from "../normalize.js";

describe("normalizeCoachResponse", () => {
  it("accepts a valid full response", () => {
    const raw = {
      kind: "full",
      summary: "Good game.",
      mistakes: [{ moveNumber: 3, played: "Qh5", better: "Nf3", explanation: "Develop first" }],
      lessons: ["Castle early"],
      praise: ["Good opening"],
    };
    const result = normalizeCoachResponse(raw);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.kind, "full");
      assert.equal(result.data.mistakes.length, 1);
    }
  });

  it("rejects response missing kind", () => {
    const raw = { summary: "test", mistakes: [], lessons: [], praise: [] };
    const result = normalizeCoachResponse(raw);
    assert.equal(result.success, false);
  });

  it("rejects summary over 500 chars", () => {
    const raw = {
      kind: "full",
      summary: "x".repeat(600),
      mistakes: [],
      lessons: [],
      praise: [],
    };
    const result = normalizeCoachResponse(raw);
    assert.equal(result.success, false);
  });

  it("caps mistakes at 10", () => {
    const mistakes = Array.from({ length: 15 }, (_, i) => ({
      moveNumber: i + 1,
      played: "e4",
      better: "d4",
      explanation: "test",
    }));
    const raw = { kind: "full", summary: "test", mistakes, lessons: [], praise: [] };
    const result = normalizeCoachResponse(raw);
    assert.equal(result.success, true);
    if (result.success) {
      assert.ok(result.data.mistakes.length <= 10);
    }
  });

  it("returns failure for completely invalid data", () => {
    const result = normalizeCoachResponse("not an object");
    assert.equal(result.success, false);
  });
});
```

- [ ] **Step 2: Write implementation**

Create `apps/web/src/lib/coach/normalize.ts`:

```typescript
import { z } from "zod";
import type { CoachResponse } from "./types";

const MistakeSchema = z.object({
  moveNumber: z.number().int().positive(),
  played: z.string().max(20),
  better: z.string().max(20),
  explanation: z.string().max(300),
});

export const CoachResponseSchema = z.object({
  kind: z.literal("full"),
  summary: z.string().max(500),
  mistakes: z.array(MistakeSchema).max(10),
  lessons: z.array(z.string().max(200)).max(5),
  praise: z.array(z.string().max(200)).max(3),
});

type NormalizeResult =
  | { success: true; data: CoachResponse }
  | { success: false; error: string };

export function normalizeCoachResponse(raw: unknown): NormalizeResult {
  try {
    const parsed = CoachResponseSchema.parse(raw);
    return { success: true, data: parsed };
  } catch (err) {
    const message = err instanceof z.ZodError
      ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
      : "Invalid response format";
    return { success: false, error: message };
  }
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm run test:coach
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/coach/normalize.ts apps/web/src/lib/coach/__tests__/normalize.test.ts
git commit -m "feat(coach): add Zod normalization layer with 5 tests

Wolfcito 🐾 @akawolfcito"
```

---

### Task 5: Fallback heuristic engine with tests

**Files:**
- Create: `apps/web/src/lib/coach/fallback-engine.ts`
- Create: `apps/web/src/lib/coach/__tests__/fallback-engine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/lib/coach/__tests__/fallback-engine.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateQuickReview } from "../fallback-engine.js";

describe("generateQuickReview", () => {
  it("returns kind quick", () => {
    const result = generateQuickReview({
      result: "win",
      difficulty: "easy",
      totalMoves: 12,
      elapsedMs: 30000,
    });
    assert.equal(result.kind, "quick");
  });

  it("generates summary for a win", () => {
    const result = generateQuickReview({
      result: "win",
      difficulty: "easy",
      totalMoves: 12,
      elapsedMs: 30000,
    });
    assert.ok(result.summary.length > 0);
  });

  it("suggests harder difficulty on easy win", () => {
    const result = generateQuickReview({
      result: "win",
      difficulty: "easy",
      totalMoves: 10,
      elapsedMs: 20000,
    });
    assert.ok(result.tips.some((t) => t.toLowerCase().includes("medium") || t.toLowerCase().includes("harder")));
  });

  it("encourages on a loss", () => {
    const result = generateQuickReview({
      result: "lose",
      difficulty: "hard",
      totalMoves: 40,
      elapsedMs: 120000,
    });
    assert.ok(result.summary.length > 0);
    assert.ok(result.tips.length > 0);
  });

  it("handles resigned result", () => {
    const result = generateQuickReview({
      result: "resigned",
      difficulty: "medium",
      totalMoves: 15,
      elapsedMs: 45000,
    });
    assert.equal(result.kind, "quick");
    assert.ok(result.tips.length > 0);
  });
});
```

- [ ] **Step 2: Write implementation**

Create `apps/web/src/lib/coach/fallback-engine.ts`:

```typescript
import type { BasicCoachResponse, GameResult } from "./types";

type QuickReviewInput = {
  result: GameResult;
  difficulty: string;
  totalMoves: number;
  elapsedMs: number;
};

export function generateQuickReview(input: QuickReviewInput): BasicCoachResponse {
  const { result, difficulty, totalMoves, elapsedMs } = input;
  const seconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const timeStr = minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;

  const summary = buildSummary(result, difficulty, totalMoves, timeStr);
  const tips = buildTips(result, difficulty, totalMoves);

  return { kind: "quick", summary, tips };
}

function buildSummary(result: GameResult, difficulty: string, moves: number, time: string): string {
  switch (result) {
    case "win":
      return `You won in ${moves} moves on ${difficulty} difficulty (${time}). Solid game.`;
    case "lose":
      return `You lost after ${moves} moves on ${difficulty} (${time}). Every loss is a learning opportunity.`;
    case "draw":
      return `Draw after ${moves} moves on ${difficulty} (${time}). A closely fought game.`;
    case "resigned":
      return `You resigned after ${moves} moves on ${difficulty} (${time}). Knowing when to reset is part of the game.`;
  }
}

function buildTips(result: GameResult, difficulty: string, moves: number): string[] {
  const tips: string[] = [];

  if (result === "win" && difficulty === "easy") {
    tips.push("Try medium difficulty for a bigger challenge");
  }
  if (result === "win" && difficulty === "medium") {
    tips.push("Ready for hard? The AI plays to win at that level");
  }
  if (result === "win" && moves <= 10) {
    tips.push("Winning in under 10 moves signals strong tactical play");
  }
  if (result === "win" && moves > 30) {
    tips.push("Long games test endgame skills — keep practicing those");
  }
  if (result === "lose") {
    tips.push("Review the moment where the game turned — what would you do differently?");
  }
  if (result === "lose" && difficulty === "hard") {
    tips.push("Hard difficulty is a real challenge — try medium to build confidence");
  }
  if (result === "resigned") {
    tips.push("Before resigning, look for defensive moves — you might find a way out");
  }
  if (result === "draw") {
    tips.push("Draws often come from missed opportunities — look for moments to press advantage");
  }

  if (tips.length === 0) {
    tips.push("Keep playing to improve your pattern recognition");
  }

  return tips.slice(0, 3);
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm run test:coach
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/coach/fallback-engine.ts apps/web/src/lib/coach/__tests__/fallback-engine.test.ts
git commit -m "feat(coach): add heuristic fallback engine with 5 tests

Wolfcito 🐾 @akawolfcito"
```

---

### Task 6: Badge evaluator with guardrails and tests

**Files:**
- Create: `apps/web/src/lib/coach/badge-evaluator.ts`
- Create: `apps/web/src/lib/coach/__tests__/badge-evaluator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/lib/coach/__tests__/badge-evaluator.test.ts`:

```typescript
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateBadges } from "../badge-evaluator.js";
import type { GameRecord } from "../types.js";

function makeGame(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    gameId: crypto.randomUUID(),
    moves: ["e4", "e5"],
    result: "win",
    difficulty: "medium",
    totalMoves: 20,
    elapsedMs: 60000,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("evaluateBadges", () => {
  it("returns no badges for empty game list", () => {
    const badges = evaluateBadges([]);
    assert.equal(badges.length, 0);
  });

  it("does not award tactics badge on easy games only", () => {
    const games = Array.from({ length: 10 }, () => makeGame({ difficulty: "easy", result: "win" }));
    const badges = evaluateBadges(games);
    const tactics = badges.find((b) => b.area === "tactics");
    assert.equal(tactics?.earned, false);
  });

  it("awards tactics badge with 40%+ win rate on hard", () => {
    const games = [
      ...Array.from({ length: 4 }, () => makeGame({ difficulty: "hard", result: "win" })),
      ...Array.from({ length: 6 }, () => makeGame({ difficulty: "hard", result: "lose" })),
    ];
    const badges = evaluateBadges(games);
    const tactics = badges.find((b) => b.area === "tactics");
    assert.equal(tactics?.earned, true);
  });

  it("requires diversity for consistency badge", () => {
    const games = Array.from({ length: 20 }, () => makeGame({ difficulty: "easy", result: "win" }));
    const badges = evaluateBadges(games);
    const consistency = badges.find((b) => b.area === "consistency");
    assert.equal(consistency?.earned, false);
  });

  it("awards consistency badge with diverse difficulties", () => {
    const games = [
      ...Array.from({ length: 3 }, () => makeGame({ difficulty: "easy", result: "win" })),
      ...Array.from({ length: 3 }, () => makeGame({ difficulty: "medium", result: "win" })),
    ];
    const badges = evaluateBadges(games);
    const consistency = badges.find((b) => b.area === "consistency");
    assert.equal(consistency?.earned, true);
  });
});
```

- [ ] **Step 2: Write implementation**

Create `apps/web/src/lib/coach/badge-evaluator.ts`:

```typescript
import type { GameRecord, BadgeCriteria } from "./types";

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

const BADGE_DEFINITIONS: BadgeCriteria[] = [
  { area: "tactics", metric: "win_rate_hard", threshold: 0.4, windowSize: 10, minDifficulty: "hard" },
  { area: "efficiency", metric: "avg_moves_to_win", threshold: 25, windowSize: 10, minDifficulty: "medium" },
  { area: "consistency", metric: "win_streak", threshold: 5, windowSize: 20, minDiverseDifficulties: 2 },
  { area: "endgame", metric: "win_rate_long_games", threshold: 0.5, windowSize: 10, minDifficulty: "medium" },
];

export type BadgeResult = {
  area: string;
  earned: boolean;
  progress: number;
  threshold: number;
};

export function evaluateBadges(games: GameRecord[]): BadgeResult[] {
  return BADGE_DEFINITIONS.map((badge) => {
    const window = games.slice(-badge.windowSize);

    const filtered = badge.minDifficulty
      ? window.filter((g) => DIFFICULTY_ORDER[g.difficulty] >= DIFFICULTY_ORDER[badge.minDifficulty!])
      : window;

    if (badge.minDiverseDifficulties) {
      const uniqueDiffs = new Set(window.map((g) => g.difficulty));
      if (uniqueDiffs.size < badge.minDiverseDifficulties) {
        return { area: badge.area, earned: false, progress: 0, threshold: badge.threshold };
      }
    }

    const progress = computeMetric(badge.metric, filtered);

    return {
      area: badge.area,
      earned: filtered.length >= Math.min(badge.windowSize, 5) && meetsThreshold(badge.metric, progress, badge.threshold),
      progress,
      threshold: badge.threshold,
    };
  });
}

function meetsThreshold(metric: string, value: number, threshold: number): boolean {
  if (metric === "avg_moves_to_win") return value > 0 && value <= threshold;
  return value >= threshold;
}

function computeMetric(metric: string, games: GameRecord[]): number {
  if (games.length === 0) return 0;

  switch (metric) {
    case "win_rate_hard":
    case "win_rate_long_games": {
      const relevant = metric === "win_rate_long_games"
        ? games.filter((g) => g.totalMoves > 30)
        : games;
      if (relevant.length === 0) return 0;
      return relevant.filter((g) => g.result === "win").length / relevant.length;
    }
    case "avg_moves_to_win": {
      const wins = games.filter((g) => g.result === "win");
      if (wins.length === 0) return 0;
      return wins.reduce((sum, g) => sum + g.totalMoves, 0) / wins.length;
    }
    case "win_streak": {
      let streak = 0;
      for (let i = games.length - 1; i >= 0; i--) {
        if (games[i].result === "win") streak++;
        else break;
      }
      return streak;
    }
    default:
      return 0;
  }
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm run test:coach
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/coach/badge-evaluator.ts apps/web/src/lib/coach/__tests__/badge-evaluator.test.ts
git commit -m "feat(coach): add badge evaluator with anti-farming guardrails and 5 tests

Wolfcito 🐾 @akawolfcito"
```

---

### Task 7: Prompt template + analyze API route

**Files:**
- Create: `apps/web/src/lib/coach/prompt-template.ts`
- Create: `apps/web/src/app/api/coach/analyze/route.ts`

- [ ] **Step 1: Create prompt template**

Create `apps/web/src/lib/coach/prompt-template.ts`:

```typescript
import type { GameResult, PlayerSummary } from "./types";

const RESULT_HINTS: Record<GameResult, string> = {
  win: "The player won. Focus on: (1) strengths shown, (2) moments where a stronger opponent would have punished them, (3) how to win more efficiently.",
  lose: "The player lost. Be encouraging. Focus on: (1) what went wrong (kindly), (2) critical mistakes that turned the game, (3) concrete skills to practice.",
  draw: "The game was a draw. Focus on: (1) why the game didn't resolve, (2) missed opportunities to press advantage, (3) how to convert drawn positions.",
  resigned: "The player resigned. Focus on: (1) the turning point, (2) the position that felt lost + a safer continuation, (3) pattern recognition for similar positions.",
};

export function buildCoachPrompt(
  moves: string[],
  result: GameResult,
  difficulty: string,
  summary: PlayerSummary | null,
): string {
  const movesStr = moves.map((m, i) => `${Math.floor(i / 2) + 1}${i % 2 === 0 ? "." : "..."} ${m}`).join(" ");

  const summaryBlock = summary
    ? `\nPlayer context: ${summary.gamesPlayed} games played, avg ${Math.round(summary.avgGameLength)} moves per game. Recent weaknesses: ${summary.weaknessTags.slice(0, 5).join(", ") || "none identified yet"}.`
    : "";

  return `You are a chess coach analyzing a game played on Chesscito (a learning app for beginners and casual players).

Game: ${movesStr}
Result: ${result} (${difficulty} difficulty AI opponent)
${summaryBlock}

${RESULT_HINTS[result]}

Respond ONLY with a JSON object matching this exact schema (no markdown, no explanation outside JSON):
{
  "kind": "full",
  "summary": "2-3 sentence conversational summary of the game",
  "mistakes": [{"moveNumber": N, "played": "move", "better": "alternative", "explanation": "why"}],
  "lessons": ["actionable lesson 1", ...],
  "praise": ["specific thing done well", ...]
}

Rules:
- mistakes: max 5, only include genuine mistakes
- lessons: max 3, concrete and actionable
- praise: max 2, specific to this game (never empty — find something positive even in a loss)
- All text in English
- Keep explanations simple — the player may be a beginner`;
}
```

- [ ] **Step 2: Create analyze route**

Create `apps/web/src/app/api/coach/analyze/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import Anthropic from "@anthropic-ai/sdk";
import { validateGameRecord } from "@/lib/coach/validate-game";
import { normalizeCoachResponse } from "@/lib/coach/normalize";
import { buildCoachPrompt } from "@/lib/coach/prompt-template";
import { REDIS_KEYS } from "@/lib/coach/redis-keys";
import type { GameRecord, CoachAnalysisRecord, PlayerSummary } from "@/lib/coach/types";

const redis = Redis.fromEnv();

const MODEL = process.env.COACH_LLM_MODEL ?? "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 1500;
const LLM_TIMEOUT_MS = 45_000;
const ANALYSIS_VERSION = "1.0.0";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, walletAddress } = body as { gameId?: string; walletAddress?: string };

    if (!gameId || !walletAddress) {
      return NextResponse.json({ error: "Missing gameId or walletAddress" }, { status: 400 });
    }

    const wallet = walletAddress.toLowerCase();

    // --- Idempotency: existing result? ---
    const existingAnalysis = await redis.get<CoachAnalysisRecord>(REDIS_KEYS.analysis(wallet, gameId));
    if (existingAnalysis) {
      return NextResponse.json({ status: "ready", response: existingAnalysis.response });
    }

    // --- Idempotency: pending job? ---
    const existingJobId = await redis.get<string>(REDIS_KEYS.jobByGame(wallet, gameId));
    if (existingJobId) {
      return NextResponse.json({ jobId: existingJobId });
    }

    // --- Rate limit: 1 pending job per wallet ---
    const pendingJobId = await redis.get<string>(REDIS_KEYS.pendingJob(wallet));
    if (pendingJobId) {
      return NextResponse.json({ error: "An analysis is already in progress" }, { status: 429 });
    }

    // --- Credit check ---
    const credits = (await redis.get<number>(REDIS_KEYS.credits(wallet))) ?? 0;
    if (credits <= 0) {
      return NextResponse.json({ error: "No credits available" }, { status: 402 });
    }

    // --- Fetch game record ---
    const gameRecord = await redis.get<GameRecord>(REDIS_KEYS.game(wallet, gameId));
    if (!gameRecord) {
      return NextResponse.json({ error: "Game record not found" }, { status: 404 });
    }

    // --- Validate game ---
    const validation = validateGameRecord({
      moves: gameRecord.moves,
      result: gameRecord.result,
      difficulty: gameRecord.difficulty,
    });
    if (!validation.valid) {
      return NextResponse.json({ error: `Invalid game: ${validation.error}` }, { status: 400 });
    }

    // --- Check LLM availability ---
    if (!anthropic) {
      return NextResponse.json({ error: "Coach is not configured" }, { status: 503 });
    }

    // --- Create job ---
    const jobId = crypto.randomUUID();
    await redis.set(REDIS_KEYS.job(jobId), { status: "pending" }, { ex: 60 });
    await redis.set(REDIS_KEYS.jobByGame(wallet, gameId), jobId, { ex: 60 });
    await redis.set(REDIS_KEYS.pendingJob(wallet), jobId, { ex: 60 });

    // --- Build prompt ---
    const playerSummary = await redis.get<PlayerSummary>(`coach:summary:${wallet}`);
    const prompt = buildCoachPrompt(
      gameRecord.moves,
      validation.computedResult,
      gameRecord.difficulty,
      playerSummary,
    );

    // --- Call LLM ---
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

      const message = await anthropic.messages.create(
        {
          model: MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          messages: [{ role: "user", content: prompt }],
        },
        { signal: controller.signal },
      );

      clearTimeout(timeout);

      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const normalized = normalizeCoachResponse(parsed);

      if (!normalized.success) {
        throw new Error(`Normalization failed: ${normalized.error}`);
      }

      // --- Success: store result, decrement credit ---
      const analysisRecord: CoachAnalysisRecord = {
        gameId,
        provider: "server",
        model: MODEL,
        analysisVersion: ANALYSIS_VERSION,
        createdAt: Date.now(),
        response: normalized.data,
      };

      await Promise.all([
        redis.set(REDIS_KEYS.analysis(wallet, gameId), analysisRecord, { ex: 30 * 24 * 60 * 60 }),
        redis.lpush(REDIS_KEYS.analysisList(wallet), gameId),
        redis.decr(REDIS_KEYS.credits(wallet)),
        redis.set(REDIS_KEYS.job(jobId), { status: "ready", response: normalized.data }, { ex: 30 * 24 * 60 * 60 }),
        redis.del(REDIS_KEYS.pendingJob(wallet)),
      ]);

      return NextResponse.json({ status: "ready", response: normalized.data });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";

      await Promise.all([
        redis.set(REDIS_KEYS.job(jobId), { status: "failed", reason }, { ex: 24 * 60 * 60 }),
        redis.del(REDIS_KEYS.pendingJob(wallet)),
        redis.del(REDIS_KEYS.jobByGame(wallet, gameId)),
      ]);

      return NextResponse.json({ status: "failed", reason }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Note on sync vs async:** This route performs the LLM call inline and returns the result directly. In Next.js serverless, there's no reliable way to fire-and-forget to a background process. The `CoachLoading` screen is still useful because: (1) the client shows it while waiting for the HTTP response (3-45s), (2) if the WebView suspends mid-request, the jobId stored in Redis allows re-entry via polling. This is "sync execution with async re-entry support", not a true job queue.

- [ ] **Step 3: Type-check**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/coach/prompt-template.ts apps/web/src/app/api/coach/analyze/route.ts
git commit -m "feat(coach): add prompt template and analyze API route with idempotency

Server-side LLM analysis with:
- Idempotency per wallet+gameId
- Credit verification and decrement on success only
- Game validation via chess.js replay
- Zod response normalization
- 45s timeout, rate limit 1 pending job/wallet

Wolfcito 🐾 @akawolfcito"
```

---

### Task 8: Supporting API routes (games, job, history, credits)

**Files:**
- Create: `apps/web/src/app/api/games/route.ts`
- Create: `apps/web/src/app/api/coach/job/[id]/route.ts`
- Create: `apps/web/src/app/api/coach/history/route.ts`
- Create: `apps/web/src/app/api/coach/credits/route.ts`

- [ ] **Step 1: Create games route**

Create `apps/web/src/app/api/games/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { REDIS_KEYS } from "@/lib/coach/redis-keys";
import type { GameRecord } from "@/lib/coach/types";

const redis = Redis.fromEnv();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { walletAddress, game } = body as { walletAddress?: string; game?: GameRecord };

    if (!walletAddress || !game?.gameId) {
      return NextResponse.json({ error: "Missing walletAddress or game" }, { status: 400 });
    }

    const wallet = walletAddress.toLowerCase();
    const record: GameRecord = {
      ...game,
      totalMoves: game.moves.length,
      receivedAt: Date.now(),
    };

    await Promise.all([
      redis.set(REDIS_KEYS.game(wallet, game.gameId), record, { ex: 90 * 24 * 60 * 60 }),
      redis.lpush(REDIS_KEYS.gameList(wallet), game.gameId),
      redis.ltrim(REDIS_KEYS.gameList(wallet), 0, 99),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet")?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const gameIds = await redis.lrange<string>(REDIS_KEYS.gameList(wallet), 0, 19);
  const games = await Promise.all(
    gameIds.map((id) => redis.get<GameRecord>(REDIS_KEYS.game(wallet, id))),
  );

  return NextResponse.json(games.filter(Boolean));
}
```

- [ ] **Step 2: Create job polling route**

Create `apps/web/src/app/api/coach/job/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { REDIS_KEYS } from "@/lib/coach/redis-keys";
import type { JobStatus } from "@/lib/coach/types";

const redis = Redis.fromEnv();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const jobId = params.id;
  if (!jobId) return NextResponse.json({ error: "Missing job ID" }, { status: 400 });

  const job = await redis.get<JobStatus>(REDIS_KEYS.job(jobId));
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json(job);
}
```

- [ ] **Step 3: Create history route**

Create `apps/web/src/app/api/coach/history/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { REDIS_KEYS } from "@/lib/coach/redis-keys";
import type { CoachAnalysisRecord, GameRecord } from "@/lib/coach/types";

const redis = Redis.fromEnv();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet")?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const gameIds = await redis.lrange<string>(REDIS_KEYS.analysisList(wallet), 0, 19);

  const entries = await Promise.all(
    gameIds.map(async (gameId) => {
      const [analysis, game] = await Promise.all([
        redis.get<CoachAnalysisRecord>(REDIS_KEYS.analysis(wallet, gameId)),
        redis.get<GameRecord>(REDIS_KEYS.game(wallet, gameId)),
      ]);
      return analysis && game ? { ...analysis, game } : null;
    }),
  );

  return NextResponse.json(entries.filter(Boolean));
}
```

- [ ] **Step 4: Create credits route**

Create `apps/web/src/app/api/coach/credits/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { REDIS_KEYS } from "@/lib/coach/redis-keys";

const redis = Redis.fromEnv();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet")?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

  const credits = (await redis.get<number>(REDIS_KEYS.credits(wallet))) ?? 0;
  return NextResponse.json({ credits });
}
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/games/ apps/web/src/app/api/coach/job/ apps/web/src/app/api/coach/history/ apps/web/src/app/api/coach/credits/
git commit -m "feat(coach): add games, job polling, history, and credits API routes

Wolfcito 🐾 @akawolfcito"
```

---

### Task 9: Extend useChessGame to expose move history

**Files:**
- Modify: `apps/web/src/lib/game/use-chess-game.ts`

- [ ] **Step 1: Read current hook implementation**

Read `apps/web/src/lib/game/use-chess-game.ts` to find the exact location where `moveCount` is tracked and where `gameRef.current` is used.

- [ ] **Step 2: Add moveHistory to state and expose it**

The hook uses `gameRef.current` which is a `Chess` instance. Add:

1. A `moveHistory` state: `const [moveHistory, setMoveHistory] = useState<string[]>([]);`
2. After each successful move (where `moveCount` is incremented), also update: `setMoveHistory(gameRef.current.history());`
3. On `reset()`, clear: `setMoveHistory([]);`
4. Return `moveHistory` in the hook's return value.

The exact lines to modify depend on the current code structure — the implementer should read the file first and identify:
- Where `setMoveCount` is called → add `setMoveHistory(gameRef.current.history())` alongside
- Where the return object is constructed → add `moveHistory`
- Where `reset` clears state → add `setMoveHistory([])`

- [ ] **Step 3: Type-check**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/game/use-chess-game.ts
git commit -m "feat(coach): expose moveHistory (SAN array) from useChessGame hook

Wolfcito 🐾 @akawolfcito"
```

---

### Task 10: Coach UI components

**Files:**
- Create: `apps/web/src/components/coach/ask-coach-button.tsx`
- Create: `apps/web/src/components/coach/coach-loading.tsx`
- Create: `apps/web/src/components/coach/coach-panel.tsx`
- Create: `apps/web/src/components/coach/coach-fallback.tsx`
- Create: `apps/web/src/components/coach/coach-paywall.tsx`
- Create: `apps/web/src/components/coach/coach-history.tsx`

This task creates all 6 coach UI components. Each is a self-contained component following existing patterns (dark frosted theme, game Button variants, editorial.ts copy).

- [ ] **Step 1: Create ask-coach-button.tsx**

Create `apps/web/src/components/coach/ask-coach-button.tsx`:

```typescript
"use client";

import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COACH_COPY } from "@/lib/content/editorial";

type Props = {
  onClick: () => void;
};

export function AskCoachButton({ onClick }: Props) {
  return (
    <Button
      type="button"
      variant="game-solid"
      size="game"
      onClick={onClick}
      className="border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300 hover:bg-emerald-500/[0.15]"
    >
      <GraduationCap size={18} className="inline -mt-0.5" />
      <span className="flex flex-col items-start leading-tight">
        <span className="font-bold">{COACH_COPY.askCoach}</span>
        <span className="text-[0.6rem] text-emerald-200/50">{COACH_COPY.askCoachSub}</span>
      </span>
    </Button>
  );
}
```

- [ ] **Step 2: Create coach-loading.tsx**

Create `apps/web/src/components/coach/coach-loading.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { COACH_COPY } from "@/lib/content/editorial";
import type { CoachResponse } from "@/lib/coach/types";

type Props = {
  jobId: string;
  onReady: (response: CoachResponse) => void;
  onFailed: (reason: string) => void;
};

export function CoachLoading({ jobId, onReady, onFailed }: Props) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/coach/job/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "ready") {
          clearInterval(pollInterval);
          onReady(data.response);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          onFailed(data.reason ?? "Unknown error");
        }
      } catch { /* retry on next poll */ }
    }, 3000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(pollInterval);
    };
  }, [jobId, onReady, onFailed]);

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12">
      <GraduationCap className="h-12 w-12 text-emerald-400/60" />
      <p className="text-lg font-semibold text-white">{COACH_COPY.analyzing}{dots}</p>
      <p className="text-sm text-cyan-100/40">{COACH_COPY.reviewingMoves}</p>
      <p className="mt-4 text-xs text-cyan-100/30">{COACH_COPY.canLeave}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create coach-panel.tsx**

Create `apps/web/src/components/coach/coach-panel.tsx`:

```typescript
"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARENA_COPY, COACH_COPY } from "@/lib/content/editorial";
import type { CoachResponse } from "@/lib/coach/types";
import { formatTime } from "@/lib/game/arena-utils";

type Props = {
  response: CoachResponse;
  difficulty: string;
  totalMoves: number;
  elapsedMs: number;
  credits: number;
  onPlayAgain: () => void;
  onBackToHub: () => void;
};

export function CoachPanel({
  response,
  difficulty,
  totalMoves,
  elapsedMs,
  credits,
  onPlayAgain,
  onBackToHub,
}: Props) {
  const time = formatTime(elapsedMs);
  const diffLabel = ARENA_COPY.difficulty[difficulty as keyof typeof ARENA_COPY.difficulty] ?? difficulty;

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="fantasy-title text-xl font-bold text-white">{COACH_COPY.coachAnalysisTitle}</h2>
        <span className="text-xs text-cyan-100/40">{credits} credits</span>
      </div>
      <p className="text-xs text-cyan-100/50">{diffLabel} - {totalMoves} moves - {time}</p>

      {/* Summary */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-sm italic text-cyan-100/70">{`"${response.summary}"`}</p>
      </div>

      {/* Key Moments */}
      {response.mistakes.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{COACH_COPY.keyMoments}</h3>
          <div className="flex flex-col gap-3">
            {response.mistakes.map((m) => (
              <div key={m.moveNumber} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs font-semibold text-white/80">{COACH_COPY.moveLabel(m.moveNumber, m.played)}</p>
                <p className="text-xs font-semibold text-emerald-400/70">{COACH_COPY.tryInstead(m.better)}</p>
                <p className="mt-1 text-xs text-cyan-100/50">{`"${m.explanation}"`}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What You Did Well */}
      {response.praise.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{COACH_COPY.whatYouDidWell}</h3>
          {response.praise.map((p, i) => (
            <p key={i} className="text-sm text-cyan-100/60">{`"${p}"`}</p>
          ))}
        </section>
      )}

      {/* Takeaways */}
      {response.lessons.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{COACH_COPY.takeaways}</h3>
          <ul className="flex flex-col gap-1">
            {response.lessons.map((l, i) => (
              <li key={i} className="text-sm text-cyan-100/60">- {l}</li>
            ))}
          </ul>
        </section>
      )}

      {/* CTAs */}
      <div className="mt-4 flex flex-col gap-2">
        <Button type="button" variant="game-primary" size="game" onClick={onPlayAgain}>
          <RotateCcw size={16} className="inline -mt-0.5" /> {ARENA_COPY.playAgain}
        </Button>
        <Button type="button" variant="game-text" size="game-sm" onClick={onBackToHub}>
          {ARENA_COPY.backToHub}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create coach-fallback.tsx**

Create `apps/web/src/components/coach/coach-fallback.tsx`:

```typescript
"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARENA_COPY, COACH_COPY } from "@/lib/content/editorial";
import type { BasicCoachResponse } from "@/lib/coach/types";
import { formatTime } from "@/lib/game/arena-utils";

type Props = {
  response: BasicCoachResponse;
  difficulty: string;
  totalMoves: number;
  elapsedMs: number;
  result: string;
  onGetFullAnalysis: () => void;
  onPlayAgain: () => void;
  onBackToHub: () => void;
};

export function CoachFallback({
  response,
  difficulty,
  totalMoves,
  elapsedMs,
  result,
  onGetFullAnalysis,
  onPlayAgain,
  onBackToHub,
}: Props) {
  const time = formatTime(elapsedMs);
  const diffLabel = ARENA_COPY.difficulty[difficulty as keyof typeof ARENA_COPY.difficulty] ?? difficulty;

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <h2 className="fantasy-title text-xl font-bold text-white">{COACH_COPY.quickReviewTitle}</h2>
      <p className="text-xs text-cyan-100/50">{diffLabel} - {totalMoves} moves - {result}</p>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-sm text-cyan-100/70">{response.summary}</p>
      </div>

      {response.tips.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{COACH_COPY.tips}</h3>
          <ul className="flex flex-col gap-1">
            {response.tips.map((t, i) => (
              <li key={i} className="text-sm text-cyan-100/60">- {t}</li>
            ))}
          </ul>
        </section>
      )}

      <Button
        type="button"
        variant="game-solid"
        size="game"
        onClick={onGetFullAnalysis}
        className="border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-300"
      >
        <span className="flex flex-col items-center leading-tight">
          <span className="font-bold">{COACH_COPY.getFullAnalysis}</span>
          <span className="text-[0.6rem] text-emerald-200/40">{COACH_COPY.getFullAnalysisSub}</span>
        </span>
      </Button>

      <Button type="button" variant="game-primary" size="game" onClick={onPlayAgain}>
        <RotateCcw size={16} className="inline -mt-0.5" /> {ARENA_COPY.playAgain}
      </Button>
      <Button type="button" variant="game-text" size="game-sm" onClick={onBackToHub}>
        {ARENA_COPY.backToHub}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create coach-paywall.tsx and coach-history.tsx**

Create `apps/web/src/components/coach/coach-paywall.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { COACH_COPY } from "@/lib/content/editorial";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: (pack: 5 | 20) => void;
  onQuickReview: () => void;
};

export function CoachPaywall({ open, onOpenChange, onBuy, onQuickReview }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mission-shell rounded-t-3xl border-slate-700">
        <SheetHeader>
          <SheetTitle className="fantasy-title text-cyan-50">{COACH_COPY.creditTitle}</SheetTitle>
          <SheetDescription className="text-cyan-100/75">{COACH_COPY.creditExplain}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onBuy(5)}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center transition-all hover:bg-white/[0.06]"
          >
            <p className="text-lg font-bold text-white">{COACH_COPY.creditPack5}</p>
            <p className="text-sm text-cyan-100/50">$0.10</p>
          </button>
          <button
            type="button"
            onClick={() => onBuy(20)}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] p-4 text-center transition-all hover:bg-emerald-500/[0.08]"
          >
            <p className="text-lg font-bold text-white">{COACH_COPY.creditPack20}</p>
            <p className="text-sm text-cyan-100/50">$0.30</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.6rem] font-bold text-emerald-300">{COACH_COPY.creditBest}</span>
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-cyan-100/30">
          <button type="button" onClick={onQuickReview} className="underline hover:text-cyan-100/50">
            {COACH_COPY.orQuickReview}
          </button>
        </p>
      </SheetContent>
    </Sheet>
  );
}
```

Create `apps/web/src/components/coach/coach-history.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { ARENA_COPY, COACH_COPY } from "@/lib/content/editorial";
import type { CoachAnalysisRecord, GameRecord } from "@/lib/coach/types";

type HistoryEntry = CoachAnalysisRecord & { game: GameRecord };

type Props = {
  walletAddress: string;
  credits: number;
  onSelectEntry: (entry: HistoryEntry) => void;
};

export function CoachHistory({ walletAddress, credits, onSelectEntry }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/coach/history?wallet=${walletAddress}`)
      .then((r) => r.json())
      .then((data: HistoryEntry[]) => setEntries(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const gamesAnalyzed = entries.length;
  const highestDiff = entries.reduce((max, e) => {
    const order: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
    return (order[e.game.difficulty] ?? 0) > (order[max] ?? 0) ? e.game.difficulty : max;
  }, "easy");

  let streak = 0;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].game.result === "win") streak++;
    else break;
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="fantasy-title text-xl font-bold text-white">{COACH_COPY.yourSessions}</h2>
        <span className="text-xs text-cyan-100/40">{credits} credits</span>
      </div>

      {loading && <p className="text-center text-sm text-cyan-100/40">Loading...</p>}

      {!loading && entries.map((entry) => {
        const diffLabel = ARENA_COPY.difficulty[entry.game.difficulty as keyof typeof ARENA_COPY.difficulty] ?? entry.game.difficulty;
        const topTakeaway = entry.response.kind === "full"
          ? entry.response.lessons[0] ?? entry.response.summary
          : entry.response.tips[0] ?? entry.response.summary;
        const momentCount = entry.response.kind === "full" ? entry.response.mistakes.length : 0;
        const typeLabel = entry.response.kind === "full" ? COACH_COPY.full : COACH_COPY.quick;

        return (
          <button
            key={entry.gameId}
            type="button"
            onClick={() => onSelectEntry(entry)}
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all hover:bg-white/[0.05]"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/80">
                {entry.game.result.charAt(0).toUpperCase() + entry.game.result.slice(1)} - {diffLabel} - {entry.game.totalMoves} moves
              </p>
              <span className="text-[0.6rem] font-semibold text-cyan-100/40">{typeLabel}</span>
            </div>
            <p className="mt-1 truncate text-xs italic text-cyan-100/50">{`"${topTakeaway}"`}</p>
            {momentCount > 0 && (
              <p className="mt-0.5 text-[0.6rem] text-cyan-100/30">{COACH_COPY.keyMomentsCount(momentCount)}</p>
            )}
          </button>
        );
      })}

      {!loading && entries.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">{COACH_COPY.yourProgress}</h3>
          <p className="text-xs text-cyan-100/50">{COACH_COPY.gamesAnalyzed(gamesAnalyzed)}</p>
          <p className="text-xs text-cyan-100/50">{COACH_COPY.highestDifficulty(ARENA_COPY.difficulty[highestDiff as keyof typeof ARENA_COPY.difficulty] ?? highestDiff)}</p>
          {streak > 0 && <p className="text-xs text-cyan-100/50">{COACH_COPY.currentStreak(streak)}</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Type-check**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/coach/
git commit -m "feat(coach): add 6 coach UI components

- AskCoachButton (post-game entry)
- CoachLoading (async job polling)
- CoachPanel (full analysis result)
- CoachFallback (quick review)
- CoachPaywall (credit purchase sheet)
- CoachHistory (past sessions with progress)

Wolfcito 🐾 @akawolfcito"
```

---

### Task 11: Credit purchase verification route

**Files:**
- Create: `apps/web/src/app/api/coach/verify-purchase/route.ts`

The existing ShopUpgradeable emits `ShopPurchase(buyer, itemId, payToken, price)` events. For v1, instead of a persistent event listener, we use a verification endpoint that the client calls after a successful shop purchase to credit the wallet.

- [ ] **Step 1: Create verify-purchase route**

Create `apps/web/src/app/api/coach/verify-purchase/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { celo } from "viem/chains";
import { Redis } from "@upstash/redis";
import { REDIS_KEYS } from "@/lib/coach/redis-keys";

const redis = Redis.fromEnv();
const SHOP_ADDRESS = process.env.NEXT_PUBLIC_SHOP_ADDRESS as `0x${string}` | undefined;
const COACH_5_ITEM_ID = 3n;
const COACH_20_ITEM_ID = 4n;
const CREDITS_PER_ITEM: Record<string, number> = { "3": 5, "4": 20 };

const client = SHOP_ADDRESS
  ? createPublicClient({ chain: celo, transport: http() })
  : null;

const SHOP_PURCHASE_EVENT = parseAbiItem(
  "event ShopPurchase(address indexed buyer, uint256 indexed itemId, address payToken, uint256 price)"
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { txHash, walletAddress } = body as { txHash?: string; walletAddress?: string };

    if (!txHash || !walletAddress || !client || !SHOP_ADDRESS) {
      return NextResponse.json({ error: "Missing params or not configured" }, { status: 400 });
    }

    const wallet = walletAddress.toLowerCase();

    // Prevent double-credit: check if this tx was already processed
    const txKey = `coach:processed-tx:${txHash}`;
    const alreadyProcessed = await redis.get(txKey);
    if (alreadyProcessed) {
      return NextResponse.json({ ok: true, credits: await redis.get<number>(REDIS_KEYS.credits(wallet)) ?? 0 });
    }

    // Verify the tx on-chain
    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
    }

    // Find ShopPurchase event for coach items
    const logs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === SHOP_ADDRESS.toLowerCase()
    );

    let creditsToAdd = 0;
    for (const log of logs) {
      try {
        // Parse topic[2] as itemId (indexed param)
        const itemId = log.topics[2] ? BigInt(log.topics[2]) : null;
        const buyer = log.topics[1]
          ? ("0x" + log.topics[1].slice(26)).toLowerCase()
          : null;

        if (buyer !== wallet) continue;
        if (itemId === COACH_5_ITEM_ID) creditsToAdd += 5;
        else if (itemId === COACH_20_ITEM_ID) creditsToAdd += 20;
      } catch { continue; }
    }

    if (creditsToAdd === 0) {
      return NextResponse.json({ error: "No coach credit purchase found in transaction" }, { status: 400 });
    }

    // Credit the wallet and mark tx as processed
    await Promise.all([
      redis.incrby(REDIS_KEYS.credits(wallet), creditsToAdd),
      redis.set(txKey, "1", { ex: 90 * 24 * 60 * 60 }),
    ]);

    const newBalance = (await redis.get<number>(REDIS_KEYS.credits(wallet))) ?? 0;
    return NextResponse.json({ ok: true, credits: newBalance });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/coach/verify-purchase/
git commit -m "feat(coach): add credit purchase verification route

Verifies ShopPurchase events on-chain, credits wallet in Upstash.
Idempotent per txHash — prevents double-crediting.

Wolfcito 🐾 @akawolfcito"
```

---

### Task 12: Wire coach into Arena page

**Files:**
- Modify: `apps/web/src/components/arena/arena-end-state.tsx`
- Modify: `apps/web/src/app/arena/page.tsx`

This task connects all the coach components to the existing Arena flow. The implementer should:

- [ ] **Step 1: Add coach state to arena/page.tsx**

Add state management for the coach flow in `arena/page.tsx`:

1. Import coach components and types
2. Add states: `coachPhase` ("idle" | "loading" | "result" | "fallback" | "paywall"), `coachJobId`, `coachResponse`, `coachCredits`
3. Add `handleAskCoach()` that:
   - Checks wallet connection
   - If no wallet → generate quick review via `generateQuickReview()` → set phase to "fallback"
   - If wallet → fetch credits from `/api/coach/credits`
   - If credits > 0 → construct GameRecord from hook state:
     ```typescript
     const gameRecord: GameRecord = {
       gameId: crypto.randomUUID(),
       moves: game.moveHistory,        // SAN array from extended hook
       result: mapArenaResult(game.status, isPlayerWin),
       difficulty: game.difficulty,
       totalMoves: game.moveHistory.length,
       elapsedMs: game.elapsedMs,
       timestamp: Date.now(),
     };
     ```
     Save via POST `/api/games`, then POST `/api/coach/analyze` → set phase to "loading" with jobId
   - If credits === 0 → set phase to "paywall"
4. Pass `moveHistory` from `game.moveHistory` (new) and `onAskCoach` to ArenaEndState

- [ ] **Step 2: Add AskCoachButton to ArenaEndState**

In `arena-end-state.tsx`, add the `AskCoachButton` between Play Again and Back to Hub in both the win path (VictoryCelebration etc.) and the lose path. The button receives `onAskCoach` prop.

Add to Props type:

```typescript
onAskCoach?: () => void;
```

In the lose card's CTA section, add between Play Again and Back to Hub:

```typescript
{onAskCoach && (
  <AskCoachButton onClick={onAskCoach} />
)}
```

Similarly, add to `VictoryCelebration` component props and render.

- [ ] **Step 3: Render coach phases in arena/page.tsx**

Add conditional rendering based on `coachPhase`:

```typescript
{coachPhase === "loading" && coachJobId && (
  <CoachLoading
    jobId={coachJobId}
    onReady={(response) => { setCoachResponse(response); setCoachPhase("result"); }}
    onFailed={(reason) => { setCoachPhase("idle"); /* show error toast */ }}
  />
)}
{coachPhase === "result" && coachResponse && (
  <CoachPanel response={coachResponse} ... />
)}
{coachPhase === "fallback" && coachFallbackResponse && (
  <CoachFallback response={coachFallbackResponse} ... />
)}
{coachPhase === "paywall" && (
  <CoachPaywall open onOpenChange={() => setCoachPhase("idle")} ... />
)}
```

- [ ] **Step 4: Type-check and build**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit && npx next build
```

Expected: no errors, build succeeds.

- [ ] **Step 5: Run all tests**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npm test
```

Expected: all tests pass (existing + new coach tests).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/arena/ apps/web/src/app/arena/
git commit -m "feat(coach): wire coach into arena page — complete v1 flow

Connects AskCoachButton to ArenaEndState, adds coach phase
management to arena page, renders coach loading/result/fallback/paywall.

Wolfcito 🐾 @akawolfcito"
```

---

### Task 13: Final verification and env setup

**Files:**
- Create: `apps/web/.env.example` (update with new vars)

- [ ] **Step 1: Update .env.example**

Add the following new environment variables to `.env.example`:

```bash
# Coach (Chesscito Coach feature)
ANTHROPIC_API_KEY=
COACH_LLM_MODEL=claude-haiku-4-5-20251001

# Upstash Redis (required for Coach)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 2: Full build verification**

```bash
cd /Users/wolfcito/development/BLCKCHN/GOOD_WOLF_LABS/akawolfcito/celo/chesscito/apps/web && npx tsc --noEmit && npx next build && npm test
```

Expected: tsc clean, build succeeds, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/.env.example
git commit -m "chore(coach): add coach env vars to .env.example

Wolfcito 🐾 @akawolfcito"
```

---

## Explicitly Deferred (not in this plan)

| Item | Reason |
|------|--------|
| **Sync-on-connect** (localStorage games → server on wallet connect) | Nice-to-have. Anonymous games are ephemeral by design. Can be added as a follow-up without blocking v1. |
| **Shop item registration** (itemId 3n, 4n on ShopUpgradeable) | Requires contract owner to call `setItem()`. Separate ops task — not a code change. Document in deploy checklist. |
| **Persistent event listener** for ShopPurchase | v1 uses verify-purchase endpoint (client-initiated). A webhook/indexer is a v2 optimization. |
