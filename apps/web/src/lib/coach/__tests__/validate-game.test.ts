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
    if (result.valid) {
      assert.equal(result.computedResult, "win");
      assert.equal(result.totalMoves, 7);
    }
  });

  it("rejects illegal move sequence", () => {
    const result = validateGameRecord({
      moves: ["e4", "e5", "e4"],
      result: "win",
      difficulty: "easy",
    });
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.ok(result.error.includes("Illegal move"));
    }
  });

  it("corrects mismatched result claim", () => {
    const result = validateGameRecord({
      moves: ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"],
      result: "draw",
      difficulty: "easy",
    });
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.computedResult, "win");
    }
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
    if (result.valid) {
      assert.equal(result.computedResult, "resigned");
    }
  });
});
