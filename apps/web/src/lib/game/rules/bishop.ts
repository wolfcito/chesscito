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
 * - Infinity si distinto color (alfil no puede cambiar de color)
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
