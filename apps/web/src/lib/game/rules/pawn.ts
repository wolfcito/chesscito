import type { BoardPosition } from "../types";

/**
 * Pawn moves for Practice exercises (white, moves up the board).
 *
 * Returns:
 * - Forward 1 square (always, if not blocked and within bounds)
 * - Forward 2 squares from starting rank (rank 1), if not blocked
 * - Diagonal captures: 1 square diagonally forward (both sides)
 *
 * In practice mode, diagonal squares are always included as valid targets
 * so capture exercises work without needing a piece to capture.
 */
export function getPawnMoves(
  origin: BoardPosition,
  blockers: BoardPosition[] = [],
): BoardPosition[] {
  const moves: BoardPosition[] = [];
  const isBlocked = (f: number, r: number) =>
    blockers.some((b) => b.file === f && b.rank === r);

  // Forward 1
  const fwd1 = { file: origin.file, rank: origin.rank + 1 };
  if (fwd1.rank < 8 && !isBlocked(fwd1.file, fwd1.rank)) {
    moves.push(fwd1);

    // Forward 2 (only from starting rank 1, and only if forward-1 was clear)
    if (origin.rank === 1) {
      const fwd2 = { file: origin.file, rank: origin.rank + 2 };
      if (fwd2.rank < 8 && !isBlocked(fwd2.file, fwd2.rank)) {
        moves.push(fwd2);
      }
    }
  }

  // Diagonal captures (always included in practice — no piece-on-square check)
  for (const df of [-1, 1]) {
    const diag = { file: origin.file + df, rank: origin.rank + 1 };
    if (diag.file >= 0 && diag.file < 8 && diag.rank < 8) {
      moves.push(diag);
    }
  }

  return moves;
}
