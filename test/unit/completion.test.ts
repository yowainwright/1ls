import { describe, test, expect } from "bun:test";
import {
  fuzzySearch,
  ALL_SUGGESTIONS,
  METHODS,
  BUILTINS,
  SHORTCUTS,
  MAX_SUGGESTIONS,
  SCORE_PREFIX_MATCH,
  SCORE_CONTAINS_MATCH,
  SCORE_FUZZY_MATCH,
} from "../../src/completion";
import type { FuzzyMatch, Suggestion } from "../../src/completion";

describe("completion module", () => {
  describe("fuzzySearch", () => {
    const items = [
      { name: "map" },
      { name: "filter" },
      { name: "find" },
      { name: "reduce" },
      { name: "flatMap" },
    ];

    test("returns all items when pattern is empty", () => {
      const results = fuzzySearch(items, "", (item) => item.name);
      expect(results.length).toBe(5);
      expect(results[0].score).toBe(0);
    });

    test("filters items by fuzzy pattern", () => {
      const results = fuzzySearch(items, "map", (item) => item.name);
      expect(results.length).toBe(2);
      expect(results[0].item.name).toBe("map");
      expect(results[1].item.name).toBe("flatMap");
    });

    test("scores exact matches higher", () => {
      const results = fuzzySearch(items, "map", (item) => item.name);
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });

    test("returns empty array when no matches", () => {
      const results = fuzzySearch(items, "xyz", (item) => item.name);
      expect(results.length).toBe(0);
    });

    test("is case insensitive", () => {
      const results = fuzzySearch(items, "MAP", (item) => item.name);
      expect(results.length).toBe(2);
      expect(results[0].item.name).toBe("map");
    });

    test("tracks match positions correctly", () => {
      const results = fuzzySearch(items, "mp", (item) => item.name);
      const mapMatch = results.find((r) => r.item.name === "map");
      expect(mapMatch?.matches).toEqual([0, 2]);
    });

    test("scores consecutive matches higher", () => {
      const testItems = [
        { name: "abc" },
        { name: "a_b_c" },
      ];
      const results = fuzzySearch(testItems, "abc", (item) => item.name);
      expect(results[0].item.name).toBe("abc");
    });

    test("scores matches at start higher", () => {
      const testItems = [
        { name: "xmap" },
        { name: "map" },
      ];
      const results = fuzzySearch(testItems, "map", (item) => item.name);
      expect(results[0].item.name).toBe("map");
    });
  });

  describe("suggestion constants", () => {
    test("METHODS contains standard array/string methods", () => {
      const methodNames = METHODS.map((m) => m.name);
      expect(methodNames).toContain("map");
      expect(methodNames).toContain("filter");
      expect(methodNames).toContain("reduce");
      expect(methodNames).toContain("find");
    });

    test("BUILTINS contains 1ls builtins", () => {
      const builtinNames = BUILTINS.map((b) => b.name);
      expect(builtinNames).toContain("head");
      expect(builtinNames).toContain("tail");
      expect(builtinNames).toContain("keys");
      expect(builtinNames).toContain("vals");
    });

    test("SHORTCUTS contains shorthand methods", () => {
      const shortcutNames = SHORTCUTS.map((s) => s.name);
      expect(shortcutNames).toContain("mp");
      expect(shortcutNames).toContain("flt");
      expect(shortcutNames).toContain("fnd");
    });

    test("ALL_SUGGESTIONS combines all suggestion types", () => {
      const total = METHODS.length + BUILTINS.length + SHORTCUTS.length;
      expect(ALL_SUGGESTIONS.length).toBe(total);
    });

    test("each suggestion has required fields", () => {
      ALL_SUGGESTIONS.forEach((s) => {
        expect(s.name).toBeDefined();
        expect(s.signature).toBeDefined();
        expect(s.description).toBeDefined();
        expect(s.type).toBeDefined();
        expect(["method", "builtin", "shortcut", "path"]).toContain(s.type);
      });
    });
  });

  describe("scoring constants", () => {
    test("score constants are defined", () => {
      expect(MAX_SUGGESTIONS).toBe(8);
      expect(SCORE_PREFIX_MATCH).toBe(100);
      expect(SCORE_CONTAINS_MATCH).toBe(50);
      expect(SCORE_FUZZY_MATCH).toBe(25);
    });

    test("prefix score > contains score > fuzzy score", () => {
      expect(SCORE_PREFIX_MATCH).toBeGreaterThan(SCORE_CONTAINS_MATCH);
      expect(SCORE_CONTAINS_MATCH).toBeGreaterThan(SCORE_FUZZY_MATCH);
    });
  });
});
