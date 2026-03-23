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
