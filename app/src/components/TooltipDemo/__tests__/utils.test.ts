import { describe, test, expect } from "bun:test";
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
    expect(getSearchTerm(".filter(x => x).ma", 0)).toBe("ma");
  });

  test("uses triggerAt when no dot found", () => {
    expect(getSearchTerm("filter", 0)).toBe("filter");
  });

  test("handles dot at end", () => {
    expect(getSearchTerm(".items.", 0)).toBe("");
  });

  test("lowercases the result", () => {
    expect(getSearchTerm(".MAP", 0)).toBe("map");
  });

  test("falls back to triggerAt slice when no dot", () => {
    expect(getSearchTerm("abcdef", 2)).toBe("cdef");
  });
});

describe("filterHints", () => {
  test("returns all hints when searchTerm is empty", () => {
    expect(filterHints(hints, "")).toHaveLength(hints.length);
  });

  test("filters by prefix match on method name", () => {
    const results = filterHints(hints, "fi");
    expect(results.some((h) => h.signature.includes("filter"))).toBe(true);
    expect(results.some((h) => h.signature.includes("find"))).toBe(true);
    expect(results.every((h) => !h.signature.includes(".map"))).toBe(true);
  });

  test("filters to multi-match", () => {
    const results = filterHints(hints, "ma");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((h) => h.signature.includes("map") || h.signature.includes("max"))).toBe(true);
  });

  test("handles dot-prefixed signatures (data properties)", () => {
    const results = filterHints(hints, "na");
    expect(results.some((h) => h.signature === ".name")).toBe(true);
  });

  test("returns empty array when no hints match", () => {
    expect(filterHints(hints, "xyz")).toHaveLength(0);
  });

  test("is case-insensitive via lowercased searchTerm", () => {
    const results = filterHints(hints, "ma");
    expect(results.length).toBeGreaterThan(0);
  });
});
