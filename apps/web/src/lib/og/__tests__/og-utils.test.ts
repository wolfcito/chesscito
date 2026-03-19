import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatTime,
  clampMoves,
  clampTime,
  truncateId,
  formatPlayer,
} from "../og-utils.js";

describe("formatTime", () => {
  it("formats seconds-only time", () => {
    assert.equal(formatTime(16000), "0:16");
  });
  it("formats minutes and seconds", () => {
    assert.equal(formatTime(125000), "2:05");
  });
  it("formats zero", () => {
    assert.equal(formatTime(0), "0:00");
  });
  it("formats exactly 1 minute", () => {
    assert.equal(formatTime(60000), "1:00");
  });
});

describe("clampMoves", () => {
  it("returns number as string for normal values", () => {
    assert.equal(clampMoves(7), "7");
  });
  it("returns zero as string", () => {
    assert.equal(clampMoves(0), "0");
  });
  it("returns 999 as string", () => {
    assert.equal(clampMoves(999), "999");
  });
  it("clamps values above 999", () => {
    assert.equal(clampMoves(1000), "999+");
  });
  it("clamps extreme values", () => {
    assert.equal(clampMoves(65535), "999+");
  });
});

describe("clampTime", () => {
  it("returns normal time as-is", () => {
    assert.equal(clampTime(16000), "0:16");
  });
  it("clamps time at 99:59 boundary", () => {
    assert.equal(clampTime(5999000), "99:59");
  });
  it("clamps time above boundary", () => {
    assert.equal(clampTime(6000000), "99:59");
  });
  it("clamps extreme time", () => {
    assert.equal(clampTime(4294967295), "99:59");
  });
});

describe("truncateId", () => {
  it("returns short IDs unchanged", () => {
    assert.equal(truncateId("42"), "42");
  });
  it("returns 10-digit IDs unchanged", () => {
    assert.equal(truncateId("1234567890"), "1234567890");
  });
  it("truncates IDs over 10 digits", () => {
    assert.equal(truncateId("12345678901"), "1234567890\u2026");
  });
  it("truncates very long IDs", () => {
    assert.equal(truncateId("123456789012345678901234567890"), "1234567890\u2026");
  });
});

describe("formatPlayer", () => {
  it("formats full address", () => {
    assert.equal(
      formatPlayer("0xA3b2C1d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8A99F"),
      "0xA3b2\u2026A99F"
    );
  });
  it("handles short address gracefully", () => {
    assert.equal(formatPlayer("0x1234"), "0x1234");
  });
});
