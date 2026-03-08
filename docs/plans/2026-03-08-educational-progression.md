# Educational Progression System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar un sistema de 5 ejercicios por pieza (Torre, Alfil, Caballo) con estrellas por precisión (1–3★), progresión secuencial y badge que se desbloquea al acumular ≥10/15 estrellas por pieza.

**Architecture:** Las reglas de movimiento de cada pieza viven en `lib/game/rules/`. Los ejercicios son datos estáticos en `lib/game/exercises.ts`. El progreso se persiste en `localStorage` via un hook `useExerciseProgress`. El `Board` recibe `pieceType` y `startPosition` como props, y el `play-hub/page.tsx` orquesta todo.

**Tech Stack:** TypeScript, React hooks, localStorage (sin dependencias nuevas)

---

## Resumen de archivos a tocar

| Acción | Archivo |
|--------|---------|
| Modificar | `apps/web/src/lib/game/types.ts` |
| Modificar | `apps/web/src/lib/game/rules/rook.ts` |
| Crear | `apps/web/src/lib/game/rules/bishop.ts` |
| Crear | `apps/web/src/lib/game/rules/knight.ts` |
| Crear | `apps/web/src/lib/game/exercises.ts` |
| Crear | `apps/web/src/lib/game/scoring.ts` |
| Crear | `apps/web/src/hooks/use-exercise-progress.ts` |
| Modificar | `apps/web/src/lib/game/board.ts` |
| Modificar | `apps/web/src/components/board.tsx` |
| Crear | `apps/web/src/components/play-hub/exercise-stars-bar.tsx` |
| Modificar | `apps/web/src/components/play-hub/mission-panel.tsx` |
| Modificar | `apps/web/src/app/play-hub/page.tsx` |

---

## Task 1: Extender tipos base

**Files:**
- Modify: `apps/web/src/lib/game/types.ts`

**Step 1: Reemplazar el contenido completo**

```typescript
export type PieceId = "rook" | "bishop" | "knight";

export type BoardPosition = {
  file: number; // 0=a … 7=h
  rank: number; // 0=1 … 7=8
};

export type BoardPiece = {
  id: string;
  type: PieceId;
  position: BoardPosition;
};

export type SquareState = {
  file: number;
  rank: number;
  label: string;
  isDark: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  isTarget: boolean;
  piece: BoardPiece | null;
};

export type Exercise = {
  id: string;
  startPos: BoardPosition;   // posición inicial de la pieza
  targetPos: BoardPosition;  // casilla objetivo
  optimalMoves: number;      // mínimo teórico de movimientos
};

export type PieceProgress = {
  piece: PieceId;
  exerciseIndex: number;     // índice del ejercicio activo (0–4)
  stars: [number, number, number, number, number]; // 0–3 por ejercicio
};
```

**Step 2: Verificar que el build no rompa (puede haber errores en board.ts — se arreglan en Task 4)**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/game/types.ts
git commit -m "feat(types): add bishop/knight PieceId and Exercise/PieceProgress types

Wolfcito 🐾 @akawolfcito"
```

---

## Task 2: Reglas del Alfil

**Files:**
- Create: `apps/web/src/lib/game/rules/bishop.ts`
- Reference: `apps/web/src/lib/game/rules/rook.ts` (misma estructura)

**Step 1: Crear el archivo**

```typescript
import type { BoardPosition } from "../types";

function samePosition(a: BoardPosition, b: BoardPosition) {
  return a.file === b.file && a.rank === b.rank;
}

/** Todas las casillas alcanzables por el alfil desde `origin` en 1 movimiento */
export function getBishopMoves(
  origin: BoardPosition,
  blockers: BoardPosition[] = []
): BoardPosition[] {
  const directions = [
    { file: 1, rank: 1 },
    { file: 1, rank: -1 },
    { file: -1, rank: 1 },
    { file: -1, rank: -1 },
  ];

  const moves: BoardPosition[] = [];

  for (const dir of directions) {
    let f = origin.file + dir.file;
    let r = origin.rank + dir.rank;

    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const pos = { file: f, rank: r };

      if (blockers.some((b) => samePosition(b, pos))) break;

      moves.push(pos);
      f += dir.file;
      r += dir.rank;
    }
  }

  return moves;
}

export function canBishopMoveTo(
  origin: BoardPosition,
  target: BoardPosition,
  blockers: BoardPosition[] = []
) {
  return getBishopMoves(origin, blockers).some((m) => samePosition(m, target));
}

/**
 * Mínimo de movimientos del alfil de `from` a `to`.
 * - 0 si es la misma casilla
 * - imposible (Infinity) si distinto color (alfil no puede cambiar de color)
 * - 1 si están en la misma diagonal
 * - 2 si mismo color pero distinta diagonal
 */
export function getBishopOptimalMoves(
  from: BoardPosition,
  to: BoardPosition
): number {
  if (samePosition(from, to)) return 0;

  const sameColor = (from.file + from.rank) % 2 === (to.file + to.rank) % 2;
  if (!sameColor) return Infinity;

  const df = Math.abs(to.file - from.file);
  const dr = Math.abs(to.rank - from.rank);
  if (df === dr) return 1; // misma diagonal

  return 2; // mismo color, distinta diagonal
}
```

**Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep bishop
```

Expected: sin errores.

**Step 3: Commit**

```bash
git add apps/web/src/lib/game/rules/bishop.ts
git commit -m "feat(rules): add bishop movement rules and optimal move calculator

Wolfcito 🐾 @akawolfcito"
```

---

## Task 3: Reglas del Caballo

**Files:**
- Create: `apps/web/src/lib/game/rules/knight.ts`

**Step 1: Crear el archivo**

El caballo necesita BFS para calcular el óptimo (los saltos en L no son intuitivos desde esquinas).

```typescript
import type { BoardPosition } from "../types";

const KNIGHT_DELTAS = [
  { file: 2, rank: 1 }, { file: 2, rank: -1 },
  { file: -2, rank: 1 }, { file: -2, rank: -1 },
  { file: 1, rank: 2 }, { file: 1, rank: -2 },
  { file: -1, rank: 2 }, { file: -1, rank: -2 },
];

function key(p: BoardPosition) {
  return `${p.file},${p.rank}`;
}

/** Saltos válidos del caballo desde `origin` (1 movimiento) */
export function getKnightMoves(origin: BoardPosition): BoardPosition[] {
  return KNIGHT_DELTAS.map((d) => ({
    file: origin.file + d.file,
    rank: origin.rank + d.rank,
  })).filter((p) => p.file >= 0 && p.file < 8 && p.rank >= 0 && p.rank < 8);
}

export function canKnightMoveTo(origin: BoardPosition, target: BoardPosition) {
  return getKnightMoves(origin).some(
    (m) => m.file === target.file && m.rank === target.rank
  );
}

/** BFS: mínimo de saltos del caballo de `from` a `to` */
export function getKnightOptimalMoves(
  from: BoardPosition,
  to: BoardPosition
): number {
  if (from.file === to.file && from.rank === to.rank) return 0;

  const visited = new Set<string>([key(from)]);
  const queue: Array<{ pos: BoardPosition; depth: number }> = [
    { pos: from, depth: 0 },
  ];

  while (queue.length > 0) {
    const { pos, depth } = queue.shift()!;

    for (const next of getKnightMoves(pos)) {
      if (next.file === to.file && next.rank === to.rank) return depth + 1;

      const k = key(next);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ pos: next, depth: depth + 1 });
      }
    }
  }

  return Infinity; // nunca ocurre en un tablero 8x8
}
```

**Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep knight
```

Expected: sin errores.

**Step 3: Commit**

```bash
git add apps/web/src/lib/game/rules/knight.ts
git commit -m "feat(rules): add knight movement rules with BFS optimal path

Wolfcito 🐾 @akawolfcito"
```

---

## Task 4: Optimal moves para Torre + actualizar board.ts

**Files:**
- Modify: `apps/web/src/lib/game/rules/rook.ts`
- Modify: `apps/web/src/lib/game/board.ts`

**Step 1: Agregar `getRookOptimalMoves` al final de rook.ts**

```typescript
/**
 * Mínimo de movimientos de la torre de `from` a `to`.
 * - 0 si misma casilla
 * - 1 si misma fila o columna
 * - 2 en cualquier otro caso
 */
export function getRookOptimalMoves(
  from: BoardPosition,
  to: BoardPosition
): number {
  if (from.file === to.file && from.rank === to.rank) return 0;
  if (from.file === to.file || from.rank === to.rank) return 1;
  return 2;
}
```

**Step 2: Actualizar board.ts** — agregar soporte para las 3 piezas

Reemplazar el contenido de `board.ts`:

```typescript
import type { BoardPiece, BoardPosition, PieceId, SquareState } from "@/lib/game/types";
import { getBishopMoves } from "@/lib/game/rules/bishop";
import { getKnightMoves } from "@/lib/game/rules/knight";
import { getRookMoves } from "@/lib/game/rules/rook";

const BOARD_SIZE = 8;
const FILE_LABELS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function makePiece(type: PieceId, position: BoardPosition): BoardPiece {
  return { id: `${type}-1`, type, position };
}

/** @deprecated Usar makePiece("rook", { file: 0, rank: 0 }) */
export const INITIAL_ROOK: BoardPiece = makePiece("rook", { file: 0, rank: 0 });

export function arePositionsEqual(a: BoardPosition, b: BoardPosition) {
  return a.file === b.file && a.rank === b.rank;
}

export function isInsideBoard(position: BoardPosition) {
  return (
    position.file >= 0 &&
    position.file < BOARD_SIZE &&
    position.rank >= 0 &&
    position.rank < BOARD_SIZE
  );
}

export function getPositionLabel(position: BoardPosition) {
  return `${FILE_LABELS[position.file]}${position.rank + 1}`;
}

export function getValidTargets(
  pieceType: PieceId,
  position: BoardPosition,
  blockers: BoardPosition[] = []
): BoardPosition[] {
  switch (pieceType) {
    case "rook":   return getRookMoves(position, blockers);
    case "bishop": return getBishopMoves(position, blockers);
    case "knight": return getKnightMoves(position);
    default:       return [];
  }
}

/** @deprecated Usar getValidTargets */
export function getRookTargets(position: BoardPosition, blockers: BoardPosition[] = []) {
  return getRookMoves(position, blockers);
}

export function movePiece(piece: BoardPiece, nextPosition: BoardPosition): BoardPiece {
  if (!isInsideBoard(nextPosition)) return piece;
  return { ...piece, position: nextPosition };
}

export function buildBoardSquares({
  selectedPosition,
  piece,
  validTargets,
  targetPosition = null,
}: {
  selectedPosition: BoardPosition | null;
  piece: BoardPiece;
  validTargets: BoardPosition[];
  targetPosition?: BoardPosition | null;
}): SquareState[] {
  const squares: SquareState[] = [];

  for (let rank = BOARD_SIZE - 1; rank >= 0; rank--) {
    for (let file = 0; file < BOARD_SIZE; file++) {
      const position = { file, rank };
      squares.push({
        file,
        rank,
        label: getPositionLabel(position),
        isDark: (file + rank) % 2 === 1,
        isHighlighted: validTargets.some((t) => arePositionsEqual(t, position)),
        isSelected: selectedPosition ? arePositionsEqual(selectedPosition, position) : false,
        isTarget: targetPosition ? arePositionsEqual(targetPosition, position) : false,
        piece: arePositionsEqual(piece.position, position) ? piece : null,
      });
    }
  }

  return squares;
}
```

**Step 3: Verificar build**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add apps/web/src/lib/game/rules/rook.ts apps/web/src/lib/game/board.ts
git commit -m "feat(rules): add rook optimal moves + wire all 3 pieces in board.ts

Wolfcito 🐾 @akawolfcito"
```

---

## Task 5: Datos de ejercicios

**Files:**
- Create: `apps/web/src/lib/game/exercises.ts`

**Step 1: Crear el archivo**

Notación: `file` 0=a…7=h, `rank` 0=1…7=8.

```typescript
import type { Exercise, PieceId } from "@/lib/game/types";

function pos(file: number, rank: number) {
  return { file, rank };
}

const ROOK_EXERCISES: Exercise[] = [
  // 1. Mover a lo largo de la fila (horizontal puro)
  { id: "rook-1", startPos: pos(0, 0), targetPos: pos(7, 0), optimalMoves: 1 },
  // 2. Mover a lo largo de la columna (vertical puro)
  { id: "rook-2", startPos: pos(0, 0), targetPos: pos(0, 7), optimalMoves: 1 },
  // 3. Desde el centro hacia arriba
  { id: "rook-3", startPos: pos(3, 3), targetPos: pos(3, 7), optimalMoves: 1 },
  // 4. Distinta fila Y distinta columna — necesita 2 movimientos
  { id: "rook-4", startPos: pos(0, 0), targetPos: pos(7, 7), optimalMoves: 2 },
  // 5. Esquina a esquina complicada
  { id: "rook-5", startPos: pos(7, 7), targetPos: pos(1, 2), optimalMoves: 2 },
];

const BISHOP_EXERCISES: Exercise[] = [
  // 1. Diagonal principal larga (a1→h8)
  { id: "bishop-1", startPos: pos(0, 0), targetPos: pos(7, 7), optimalMoves: 1 },
  // 2. Diagonal anti-principal (h1→a8)
  { id: "bishop-2", startPos: pos(7, 0), targetPos: pos(0, 7), optimalMoves: 1 },
  // 3. Diagonal corta desde el centro
  { id: "bishop-3", startPos: pos(3, 3), targetPos: pos(6, 6), optimalMoves: 1 },
  // 4. Misma fila, mismo color → necesita 2 movimientos (no diagonal directa)
  //    a1(0,0) → g1(6,0): via d4(3,3) → g0... en realidad via (3,3)→ no llega. Usar (2,2)→(4,0) ✓
  //    a1→c3→... vía intermediaria: a1(0,0)→d4(3,3)? no llega a g1. Correcto: a1→b2→...
  //    Ruta: a1(0,0)→e5(4,4)? luego (4,4)→(6,2)→... no. Más simple: (0,0)→(3,3)→(6,0) ✓ 2 mov
  { id: "bishop-4", startPos: pos(0, 0), targetPos: pos(6, 0), optimalMoves: 2 },
  // 5. Mismo color pero ruta no obvia
  //    c3(2,2) → g3(6,2): via e5(4,4)→g3? (4,4)→(6,2): |Δ|=2 ✓ 2 movimientos
  { id: "bishop-5", startPos: pos(2, 2), targetPos: pos(6, 2), optimalMoves: 2 },
];

const KNIGHT_EXERCISES: Exercise[] = [
  // 1. Un salto en L desde el centro
  { id: "knight-1", startPos: pos(3, 3), targetPos: pos(4, 5), optimalMoves: 1 },
  // 2. Un salto desde esquina
  { id: "knight-2", startPos: pos(0, 0), targetPos: pos(1, 2), optimalMoves: 1 },
  // 3. Un salto horizontal más largo
  { id: "knight-3", startPos: pos(0, 0), targetPos: pos(2, 1), optimalMoves: 1 },
  // 4. Dos saltos — no alcanzable en 1
  { id: "knight-4", startPos: pos(0, 0), targetPos: pos(3, 1), optimalMoves: 2 },
  // 5. Trayecto desde esquina a posición lejana
  { id: "knight-5", startPos: pos(0, 0), targetPos: pos(4, 4), optimalMoves: 3 },
];

export const EXERCISES: Record<PieceId, Exercise[]> = {
  rook:   ROOK_EXERCISES,
  bishop: BISHOP_EXERCISES,
  knight: KNIGHT_EXERCISES,
};

export const BADGE_THRESHOLD = 10; // de 15 estrellas posibles
export const EXERCISES_PER_PIECE = 5;
```

**Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep exercises
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/game/exercises.ts
git commit -m "feat(exercises): define 5 exercises per piece with optimal move counts

Wolfcito 🐾 @akawolfcito"
```

---

## Task 6: Cálculo de estrellas

**Files:**
- Create: `apps/web/src/lib/game/scoring.ts`

**Step 1: Crear el archivo**

```typescript
/**
 * Calcula estrellas según precisión (movimientos usados vs óptimos).
 *
 * 3★ → movesUsed <= optimalMoves
 * 2★ → movesUsed === optimalMoves + 1
 * 1★ → movesUsed >= optimalMoves + 2
 * 0★ → no completó (reset) — no llamar esta función en ese caso
 */
export function computeStars(
  movesUsed: number,
  optimalMoves: number
): 0 | 1 | 2 | 3 {
  if (movesUsed <= optimalMoves) return 3;
  if (movesUsed === optimalMoves + 1) return 2;
  return 1;
}

export function totalStars(stars: number[]): number {
  return stars.reduce((sum, s) => sum + s, 0);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/game/scoring.ts
git commit -m "feat(scoring): star calculation based on precision (moves vs optimal)

Wolfcito 🐾 @akawolfcito"
```

---

## Task 7: Hook de progresión

**Files:**
- Create: `apps/web/src/hooks/use-exercise-progress.ts`

**Step 1: Crear el archivo**

El estado se persiste en `localStorage` por pieza. Formato de key: `chesscito:progress:rook`.

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { BADGE_THRESHOLD, EXERCISES, EXERCISES_PER_PIECE } from "@/lib/game/exercises";
import { computeStars, totalStars } from "@/lib/game/scoring";
import type { Exercise, PieceId, PieceProgress } from "@/lib/game/types";

const EMPTY_STARS: PieceProgress["stars"] = [0, 0, 0, 0, 0];

function storageKey(piece: PieceId) {
  return `chesscito:progress:${piece}`;
}

function loadProgress(piece: PieceId): PieceProgress {
  if (typeof window === "undefined") {
    return { piece, exerciseIndex: 0, stars: [...EMPTY_STARS] };
  }

  try {
    const raw = localStorage.getItem(storageKey(piece));
    if (raw) {
      const parsed = JSON.parse(raw) as PieceProgress;
      // sanity check
      if (Array.isArray(parsed.stars) && parsed.stars.length === EXERCISES_PER_PIECE) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupt data
  }

  return { piece, exerciseIndex: 0, stars: [...EMPTY_STARS] };
}

function saveProgress(progress: PieceProgress) {
  try {
    localStorage.setItem(storageKey(progress.piece), JSON.stringify(progress));
  } catch {
    // ignore storage errors
  }
}

export function useExerciseProgress(piece: PieceId) {
  const [progress, setProgress] = useState<PieceProgress>(() =>
    loadProgress(piece)
  );

  // Reload when piece changes
  useEffect(() => {
    setProgress(loadProgress(piece));
  }, [piece]);

  const currentExercise: Exercise = EXERCISES[piece][progress.exerciseIndex];
  const isLastExercise = progress.exerciseIndex === EXERCISES_PER_PIECE - 1;
  const total = totalStars(progress.stars);
  const badgeEarned = total >= BADGE_THRESHOLD;

  /** Registra la finalización del ejercicio activo y calcula estrellas */
  const completeExercise = useCallback(
    (movesUsed: number) => {
      setProgress((prev) => {
        const stars = computeStars(movesUsed, currentExercise.optimalMoves);
        // Toma el máximo (permite reintentar para mejorar)
        const newStars = [...prev.stars] as PieceProgress["stars"];
        newStars[prev.exerciseIndex] = Math.max(
          newStars[prev.exerciseIndex],
          stars
        ) as 0 | 1 | 2 | 3;

        const next: PieceProgress = { ...prev, stars: newStars };
        saveProgress(next);
        return next;
      });
    },
    [currentExercise.optimalMoves]
  );

  /** Avanza al siguiente ejercicio (o se queda en el último) */
  const advanceExercise = useCallback(() => {
    setProgress((prev) => {
      if (prev.exerciseIndex >= EXERCISES_PER_PIECE - 1) return prev;
      const next: PieceProgress = {
        ...prev,
        exerciseIndex: prev.exerciseIndex + 1,
      };
      saveProgress(next);
      return next;
    });
  }, []);

  /** Salta a un ejercicio específico (para revisión) */
  const goToExercise = useCallback((index: number) => {
    setProgress((prev) => {
      const next: PieceProgress = {
        ...prev,
        exerciseIndex: Math.max(0, Math.min(index, EXERCISES_PER_PIECE - 1)),
      };
      saveProgress(next);
      return next;
    });
  }, []);

  return {
    progress,
    currentExercise,
    isLastExercise,
    totalStars: total,
    badgeEarned,
    completeExercise,
    advanceExercise,
    goToExercise,
  };
}
```

**Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep use-exercise
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/use-exercise-progress.ts
git commit -m "feat(hooks): useExerciseProgress with localStorage persistence and star tracking

Wolfcito 🐾 @akawolfcito"
```

---

## Task 8: Actualizar Board component

**Files:**
- Modify: `apps/web/src/components/board.tsx`

El Board debe aceptar `pieceType` y `startPosition` y usar `getValidTargets` en lugar de solo `getRookTargets`. También debe exponer `movesCount` hacia arriba.

**Step 1: Cambiar las props del Board**

Localizar el tipo `BoardProps` (línea ~44) y reemplazarlo:

```typescript
type BoardProps = {
  pieceType?: PieceId;
  startPosition?: BoardPosition;
  mode?: "tutorial" | "practice";
  targetPosition?: BoardPosition | null;
  isLocked?: boolean;
  onMove?: (position: BoardPosition, movesCount: number) => void;
};
```

**Step 2: Actualizar los imports en board.tsx**

Reemplazar:
```typescript
import {
  INITIAL_ROOK,
  arePositionsEqual,
  buildBoardSquares,
  getRookTargets,
  movePiece,
} from "@/lib/game/board";
import type { BoardPosition } from "@/lib/game/types";
```

Por:
```typescript
import {
  arePositionsEqual,
  buildBoardSquares,
  getValidTargets,
  makePiece,
  movePiece,
} from "@/lib/game/board";
import type { BoardPosition, PieceId } from "@/lib/game/types";
```

**Step 3: Actualizar el cuerpo del componente**

Reemplazar la función `Board` para aceptar las nuevas props y usarlas:

```typescript
export function Board({
  pieceType = "rook",
  startPosition = { file: 0, rank: 0 },
  mode = "practice",
  targetPosition = null,
  isLocked = false,
  onMove,
}: BoardProps) {
  const initialPiece = useMemo(
    () => makePiece(pieceType, startPosition),
    // Solo recalcular cuando cambia la pieza o el ejercicio (via key en el padre)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [piece, setPiece] = useState(initialPiece);
  const [selectedPosition, setSelectedPosition] = useState<BoardPosition | null>(
    mode === "tutorial" ? initialPiece.position : null
  );
  const [movesCount, setMovesCount] = useState(0);

  useEffect(() => {
    setSelectedPosition(mode === "tutorial" ? piece.position : null);
  }, [mode, piece.position]);

  const validTargets = useMemo(() => {
    if (!selectedPosition) return [];
    return getValidTargets(pieceType, selectedPosition);
  }, [pieceType, selectedPosition]);

  // ... (el resto del código de squares y render se mantiene igual)

  const handleSquarePress = (label: string) => {
    if (mode !== "practice" || isLocked) return;

    const nextPosition = parseLabel(label);
    const piecePosition = piece.position;

    if (arePositionsEqual(piecePosition, nextPosition)) {
      setSelectedPosition((current) => (current ? null : piecePosition));
      return;
    }

    const canMove = validTargets.some((target) => arePositionsEqual(target, nextPosition));

    if (canMove) {
      const nextMoves = movesCount + 1;
      setMovesCount(nextMoves);
      setPiece((current) => movePiece(current, nextPosition));
      setSelectedPosition(null);
      onMove?.(nextPosition, nextMoves);
      return;
    }

    setSelectedPosition(null);
  };
```

**Nota:** El resto del JSX (renderizado de casillas) no cambia.

**Step 4: Verificar build**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

**Step 5: Commit**

```bash
git add apps/web/src/components/board.tsx
git commit -m "feat(board): accept pieceType/startPosition props, expose movesCount in onMove

Wolfcito 🐾 @akawolfcito"
```

---

## Task 9: Componente de estrellas por ejercicio

**Files:**
- Create: `apps/web/src/components/play-hub/exercise-stars-bar.tsx`

**Step 1: Crear el componente**

Muestra los 5 ejercicios como íconos con sus estrellas acumuladas. El ejercicio activo se resalta.

```tsx
type ExerciseStarsBarProps = {
  stars: [number, number, number, number, number]; // 0–3 por ejercicio
  activeIndex: number;
  onSelect?: (index: number) => void;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <span
      className={filled ? "text-amber-400" : "text-cyan-900/60"}
      aria-hidden="true"
    >
      ★
    </span>
  );
}

export function ExerciseStarsBar({
  stars,
  activeIndex,
  onSelect,
}: ExerciseStarsBarProps) {
  return (
    <div className="flex items-center justify-between gap-1 px-1">
      {stars.map((exerciseStars, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect?.(index)}
            className={[
              "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition",
              isActive
                ? "bg-cyan-900/40 ring-1 ring-cyan-500/50"
                : "opacity-60 hover:opacity-90",
            ].join(" ")}
            aria-label={`Ejercicio ${index + 1}: ${exerciseStars} estrella${exerciseStars !== 1 ? "s" : ""}`}
          >
            <span className="text-[0.6rem] font-semibold tracking-widest text-cyan-400/70">
              {index + 1}
            </span>
            <div className="flex text-[0.65rem] leading-none">
              {[0, 1, 2].map((i) => (
                <StarIcon key={i} filled={i < exerciseStars} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

**Step 2: Verificar tipos**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep exercise-stars
```

**Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/exercise-stars-bar.tsx
git commit -m "feat(ui): ExerciseStarsBar shows 5 exercises with star ratings and active indicator

Wolfcito 🐾 @akawolfcito"
```

---

## Task 10: Integrar en MissionPanel

**Files:**
- Modify: `apps/web/src/components/play-hub/mission-panel.tsx`

**Step 1: Agregar prop `starsBar` al tipo**

```typescript
type MissionPanelProps = {
  // ... props existentes ...
  starsBar: ReactNode; // nuevo
};
```

**Step 2: Renderizar `starsBar` entre el board y el stats bar**

```tsx
{/* Board */}
<div className="min-h-0 flex-1">{board}</div>

{/* Stars bar */}
<div className="mt-2 shrink-0">{starsBar}</div>

{/* Stats bar */}
<div className="chesscito-stats-bar mt-2 shrink-0">
```

**Step 3: Commit**

```bash
git add apps/web/src/components/play-hub/mission-panel.tsx
git commit -m "feat(mission-panel): add starsBar slot between board and stats

Wolfcito 🐾 @akawolfcito"
```

---

## Task 11: Orquestar todo en play-hub/page.tsx

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

Este es el paso de integración final. Los cambios principales:

1. Usar `useExerciseProgress(selectedPiece)` para obtener el ejercicio activo
2. Pasar `pieceType` y `startPosition` al `Board`
3. En `handleMove`, recibir `movesCount` y llamar `completeExercise` cuando llega al target
4. Mostrar `ExerciseStarsBar` en el slot `starsBar` de `MissionPanel`
5. Habilitar Alfil y Caballo (currently `enabled: false`)
6. Usar `badgeEarned` del hook para `canClaim`

**Step 1: Agregar imports**

```typescript
import { ExerciseStarsBar } from "@/components/play-hub/exercise-stars-bar";
import { useExerciseProgress } from "@/hooks/use-exercise-progress";
```

**Step 2: Instanciar el hook**

Dentro de `PlayHubPage`, después de los `useState` existentes:

```typescript
const {
  progress,
  currentExercise,
  isLastExercise,
  totalStars: exerciseTotalStars,
  badgeEarned,
  completeExercise,
  advanceExercise,
  goToExercise,
} = useExerciseProgress(selectedPiece);
```

**Step 3: Actualizar `handleMove`**

```typescript
function handleMove(position: BoardPosition, movesCount: number) {
  const isTarget =
    position.file === currentExercise.targetPos.file &&
    position.rank === currentExercise.targetPos.rank;

  setMoves(movesCount);

  if (isTarget) {
    setPhase("success");
    setElapsedMs(1000);
    completeExercise(movesCount);
    return;
  }

  setPhase("failure");
}
```

**Step 4: Actualizar `resetBoard`**

```typescript
function resetBoard() {
  setBoardKey((previous) => previous + 1);
  setPhase("ready");
  setMoves(0);
  setElapsedMs(0);
}
```

**Step 5: Actualizar el Board en el JSX**

```tsx
board={
  <Board
    key={boardKey}
    pieceType={selectedPiece}
    startPosition={currentExercise.startPos}
    mode="practice"
    targetPosition={currentExercise.targetPos}
    isLocked={phase === "failure" || phase === "success"}
    onMove={handleMove}
  />
}
```

**Step 6: Agregar starsBar al MissionPanel**

```tsx
starsBar={
  <ExerciseStarsBar
    stars={progress.stars}
    activeIndex={progress.exerciseIndex}
    onSelect={goToExercise}
  />
}
```

**Step 7: Habilitar las 3 piezas**

```typescript
pieces={[
  { key: "rook",   label: "Torre",   enabled: true },
  { key: "bishop", label: "Alfil",   enabled: true },
  { key: "knight", label: "Caballo", enabled: true },
]}
```

**Step 8: Usar `badgeEarned` en canClaim**

```typescript
const canSendOnChain =
  Boolean(address) &&
  isConnected &&
  isCorrectChain &&
  phase === "success" &&
  levelId > 0n &&
  badgeEarned; // nueva condición
```

**Step 9: Verificar build completo**

```bash
cd apps/web && pnpm tsc --noEmit
```

Expected: 0 errores.

**Step 10: Probar en browser (390px viewport)**

- Cambiar entre Torre / Alfil / Caballo → el tablero cambia posición inicial
- Completar ejercicio → ver estrellas actualizadas en la barra
- Completar 5 ejercicios con al menos 10★ → botón claim badge habilitado
- Recargar página → progreso persistido

**Step 11: Commit final**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "feat(play-hub): wire educational progression system with exercises, stars and badge unlock

Wolfcito 🐾 @akawolfcito"
```

---

## Resumen de flujo final

```
selectedPiece
    ↓
useExerciseProgress(piece)
    → currentExercise (startPos, targetPos, optimalMoves)
    → progress.stars[0..4]
    → badgeEarned (sum ≥ 10)
    ↓
Board(pieceType, startPosition, targetPosition)
    → onMove(position, movesCount)
    ↓
handleMove → completeExercise(movesCount) → computeStars(moves, optimal)
    ↓
ExerciseStarsBar (progress.stars, progress.exerciseIndex)
    ↓
phase === "success" + badgeEarned → canClaim badge on-chain
```
