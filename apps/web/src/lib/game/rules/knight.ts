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

  return Infinity;
}
