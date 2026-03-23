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
