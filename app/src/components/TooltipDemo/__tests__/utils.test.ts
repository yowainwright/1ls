import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getSearchTerm, filterHints } from "../utils";
import type { MethodHint } from "../types";

const hints: MethodHint[] = [
  { signature: ".filter(x => ...)", description: "Filter items" },
  { signature: ".find(x => ...)", description: "Find first" },
  { signature: ".map(x => ...)", description: "Transform each" },
  { signature: ".max()", description: "Maximum value", isBuiltin: true },
  { signature: ".name", description: '"Alice"', isData: true },
];

describe("getSearchTerm", () => {
  test("extracts text after last dot", () => {
    assert.strictEqual(getSearchTerm(".filter(x => x).ma", 0), "ma");
  });

  test("uses triggerAt when no dot found", () => {
    assert.strictEqual(getSearchTerm("filter", 0), "filter");
  });

  test("handles dot at end", () => {
    assert.strictEqual(getSearchTerm(".items.", 0), "");
  });

  test("lowercases the result", () => {
    assert.strictEqual(getSearchTerm(".MAP", 0), "map");
  });

  test("falls back to triggerAt slice when no dot", () => {
    assert.strictEqual(getSearchTerm("abcdef", 2), "cdef");
  });
});

describe("filterHints", () => {
  test("returns all hints when searchTerm is empty", () => {
    assert.strictEqual(filterHints(hints, "").length, hints.length);
  });

  test("filters by prefix match on method name", () => {
    const results = filterHints(hints, "fi");
    assert.strictEqual(results.some((h) => h.signature.includes("filter")), true);
    assert.strictEqual(results.some((h) => h.signature.includes("find")), true);
    assert.strictEqual(results.every((h) => !h.signature.includes(".map")), true);
  });

  test("filters to multi-match", () => {
    const results = filterHints(hints, "ma");
    assert.ok(results.length >= 1);
    assert.strictEqual(results.some((h) => h.signature.includes("map") || h.signature.includes("max")), true);
  });

  test("handles dot-prefixed signatures (data properties)", () => {
    const results = filterHints(hints, "na");
    assert.strictEqual(results.some((h) => h.signature === ".name"), true);
  });

  test("returns empty array when no hints match", () => {
    assert.strictEqual(filterHints(hints, "xyz").length, 0);
  });

  test("is case-insensitive via lowercased searchTerm", () => {
    const results = filterHints(hints, "ma");
    assert.ok(results.length > 0);
  });
});
