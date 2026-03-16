# Arena — Full Chess vs AI

**Date:** 2026-03-15
**Status:** Draft
**Issue:** N/A (new feature)

## Overview

Add a full chess game mode to Chesscito where players compete against Stockfish AI on the custom Chesscito board. Accessible via `/arena` route with entry point from the play-hub. Three difficulty levels (Easy/Medium/Hard). No timer in v1.

This extends Chesscito's educational flow: learn piece movements in tutorials → play full chess in the arena → (future) wager on matches.

## Decisions

| Decision | Value |
|---|---|
| Game mode | vs AI (Stockfish WASM) |
| Route | `/arena` with entry from play-hub |
| Difficulty | Selectable: Easy / Medium / Hard |
| Black pieces | CSS tint overlay (gold vs purple) |
| Timer | Not in v1 |
| Rules engine | chess.js |
| Board rendering | Extend board.tsx with `mode="full"` |
| Pawn promotion | Compact overlay with 4 piece options |
| Game persistence | Not in v1 |
| Captured pieces | Nice-to-have v1 |

## Dependencies

### New packages
- `chess.js` (~30KB) — legal move generation, check/mate/draw detection, FEN/PGN, all special moves
- `stockfish.js` (WASM, ~3MB) — AI engine, loaded lazily only when entering `/arena`

### Existing (reused)
- `board.tsx` — homographic rendering, `interpolateQuad`, clip-path cells, CSS transitions
- `globals.css` — `.playhub-board-*` classes
- Piece art in `/public/art/piece-*.png` (all 6 types already exist)

## Architecture

### Types (`lib/game/types.ts`)

New types added alongside existing ones (no modifications to Exercise/PieceProgress):

```ts
type ChessPieceId = "pawn" | "rook" | "bishop" | "knight" | "queen" | "king"
type PieceColor = "w" | "b"
type ChessBoardPiece = { type: ChessPieceId; color: PieceColor; square: string }
type ArenaDifficulty = "easy" | "medium" | "hard"
type ArenaStatus = "selecting" | "playing" | "checkmate" | "stalemate" | "draw" | "resigned"
```

### Game State Hook: `useChessGame(difficulty)`

Located at `lib/game/use-chess-game.ts`.

```
State:
- game: Chess instance (chess.js)
- fen: string (current board position)
- difficulty: ArenaDifficulty
- status: ArenaStatus
- playerColor: "w" (always white in v1)
- isThinking: boolean (AI processing)
- lastMove: { from: string; to: string } | null
- selectedSquare: string | null
- legalMoves: string[] (valid targets for selected piece)
- capturedPieces: { w: ChessPieceId[]; b: ChessPieceId[] }

Actions:
- selectSquare(square) → if own piece, show legal moves; if legal target, execute move
- makeMove(from, to, promotion?) → validate with chess.js, update FEN, trigger AI
- aiMove() → send position to Stockfish worker, receive best move, execute
- reset() → new game with same difficulty
- resign() → end game as loss
- setDifficulty(d) → change difficulty (only in "selecting" status)
```

### Stockfish Web Worker (`lib/game/arena-worker.ts`)

Separate Web Worker that loads Stockfish WASM.

```
Communication protocol:
1. Main thread creates Worker
2. Worker loads stockfish.js + .wasm from /public/engines/
3. Worker sends { type: "ready" }
4. Per AI turn:
   - Main → Worker: { type: "search", fen: string, difficulty: ArenaDifficulty }
   - Worker configures UCI options (Skill Level, UCI_Elo)
   - Worker → Stockfish: "position fen ...", "go depth N"
   - Stockfish → Worker: "bestmove e2e4"
   - Worker → Main: { type: "bestmove", move: "e2e4" }
5. On /arena unmount: Worker.terminate()
```

Difficulty mapping:

| Level | UCI_Elo | Depth | Skill Level | Experience |
|---|---|---|---|---|
| Easy | 400 | 2 | 0 | Frequent mistakes, ideal post-tutorial |
| Medium | 1200 | 8 | 10 | Decent play, challenging for intermediates |
| Hard | 2000 | 15 | 20 | Strong play, for experts |

WASM fallback: if browser doesn't support WASM, show message "Your browser doesn't support the AI engine" and don't offer the mode.

### Board Component Extension (`components/board.tsx`)

New prop `mode: "exercise" | "full"` (default: `"exercise"`).

**When `mode="full"`:**

- Accepts `pieces: ChessBoardPiece[]` prop — derived from FEN by the parent
- Renders N `<picture>` elements (one per piece), each positioned via existing `interpolateQuad`
- CSS tint by color:
  - `.piece-white`: `filter: sepia(0.3) saturate(1.5) brightness(1.1)` (warm gold)
  - `.piece-black`: `filter: hue-rotate(260deg) saturate(0.8) brightness(0.7)` (purple)
- `onSquareClick(square: string)` callback replaces exercise-mode `onMove`
- Only player-color pieces are interactive on player's turn
- `isThinking=true` → board locked

**New CSS cell states:**
- `.is-last-move` — subtle border on from/to squares of last move
- `.is-check` — red tint on king's square when in check

**What doesn't change:**
- Homographic geometry, `interpolateQuad`, clip-paths
- Exercise mode behavior (1 piece, `onMove`, `isLocked`, `tutorialHints`)
- All existing `.playhub-board-*` CSS classes

### Pawn Promotion UI

When a pawn reaches the last rank:
- Compact overlay appears over the board (not fullscreen)
- Shows 4 buttons with piece images: Queen, Rook, Bishop, Knight
- Gold tint applied (player is always white)
- Selection triggers `makeMove(from, to, promotion)`
- AI promotion is automatic (Stockfish decides)

## Screens

### `/arena` — Difficulty Selection (pre-match)

```
┌─────────────────────┐
│     ♟ Free Play     │  title
│                     │
│  ┌───────────────┐  │
│  │  🟢 Easy      │  │  difficulty buttons
│  │  🟡 Medium    │  │  consistent with app
│  │  🔴 Hard      │  │  design system
│  └───────────────┘  │
│                     │
│   [ Start Match ]   │  CTA (cyan, like submitScore)
│                     │
│   ← Back to Hub     │  link to /play-hub
└─────────────────────┘
```

### `/arena` — In Match

```
┌─────────────────────┐
│ ♟ Hard   AI 🤔      │  HUD: difficulty + thinking indicator
├─────────────────────┤
│                     │
│     Board (full)    │  board.tsx mode="full"
│     32 pieces       │
│                     │
├─────────────────────┤
│  Captured: ♙♙♗     │  captured pieces (nice-to-have v1)
├─────────────────────┤
│ [ Resign ]  [ New ] │  actions
└─────────────────────┘
```

### End State

Reuses `PhaseFlash` pattern — overlay with result:
- "Checkmate — You Win!" / "Checkmate — AI Wins" / "Stalemate — Draw"
- Buttons: `[ Play Again ]` `[ Back to Hub ]`

### Entry Point from Play-Hub

- Button/card in HUD zone or below piece selector: **"Free Play ♟"**
- Navigates to `/arena` via `next/link`
- No gating — available from the start (no tutorial completion required)

## Edge Cases

All handled by chess.js — no custom logic needed:
- Threefold repetition → `game.isThreefoldRepetition()`
- Fifty-move rule → `game.isDraw()`
- Insufficient material → `game.isInsufficientMaterial()`
- Stalemate → `game.isStalemate()`
- Castling, en passant → built into chess.js move validation

## Out of Scope (v1)

- Timer / chess clock
- Game persistence (resume after leaving)
- Multiplayer (P2P or server)
- On-chain wagering / economy
- Opening book / endgame tablebase
- Move history panel / PGN export
- Sound effects
- Player plays as black

## Future (v2+)

- Timer with configurable time controls
- Wagering: bet cUSD/USDC per match, winner takes pot (on-chain escrow)
- Play as black option
- Game persistence via localStorage
- Move history sidebar
- Sound effects for moves, captures, check

## File Map

| File | Action |
|---|---|
| `apps/web/package.json` | Add chess.js, stockfish.js |
| `apps/web/src/lib/game/types.ts` | Add ChessPieceId, PieceColor, ChessBoardPiece, ArenaDifficulty, ArenaStatus |
| `apps/web/src/lib/game/use-chess-game.ts` | New — game state hook |
| `apps/web/src/lib/game/arena-worker.ts` | New — Stockfish Web Worker |
| `apps/web/src/components/board.tsx` | Extend with mode="full", multi-piece rendering, new CSS states |
| `apps/web/src/app/globals.css` | Add .piece-white, .piece-black, .is-last-move, .is-check |
| `apps/web/src/app/arena/page.tsx` | New — arena page with selection + game screens |
| `apps/web/src/components/arena/` | New — PromotionOverlay, DifficultySelector, ArenaHud, ArenaEndState |
| `apps/web/src/lib/content/editorial.ts` | Add ARENA_COPY constants |
| `apps/web/public/engines/` | Stockfish WASM files |
| `apps/web/src/components/play-hub/mission-panel.tsx` | Add "Free Play" entry point |
