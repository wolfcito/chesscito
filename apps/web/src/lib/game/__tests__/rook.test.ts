import test from "node:test";
import assert from "node:assert/strict";

import { getRookMoves, canRookMoveTo } from "../rules/rook";

test("rook moves through ranks and files on an empty board", () => {
  const moves = getRookMoves({ file: 0, rank: 0 });

  assert.equal(moves.length, 14);
  assert.equal(canRookMoveTo({ file: 0, rank: 0 }, { file: 0, rank: 7 }), true);
  assert.equal(canRookMoveTo({ file: 0, rank: 0 }, { file: 7, rank: 0 }), true);
  assert.equal(canRookMoveTo({ file: 0, rank: 0 }, { file: 7, rank: 7 }), false);
});

test("rook movement stops before blockers", () => {
  const blockers = [
    { file: 0, rank: 3 },
    { file: 4, rank: 0 },
  ];

  const moves = getRookMoves({ file: 0, rank: 0 }, blockers);

  assert.deepEqual(
    moves,
    [
      { file: 1, rank: 0 },
      { file: 0, rank: 1 },
      { file: 2, rank: 0 },
      { file: 0, rank: 2 },
      { file: 3, rank: 0 },
    ]
  );
  assert.equal(canRookMoveTo({ file: 0, rank: 0 }, { file: 0, rank: 3 }, blockers), false);
  assert.equal(canRookMoveTo({ file: 0, rank: 0 }, { file: 4, rank: 0 }, blockers), false);
});
