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
