import { describe, test } from "node:test";
import assert from "node:assert/strict";
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
} from "../../src/ac/index.ts";
import type { Suggestion } from "../../src/ac/index.ts";

describe("ac", () => {
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
      assert.strictEqual(results.length, 5);
      assert.strictEqual(results[0].score, 0);
    });

    test("filters items by fuzzy pattern", () => {
      const results = fuzzySearch(items, "map", (item) => item.name);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].item.name, "map");
      assert.strictEqual(results[1].item.name, "flatMap");
    });

    test("scores exact matches higher", () => {
      const results = fuzzySearch(items, "map", (item) => item.name);
      assert.ok(results[0].score > results[1].score);
    });

    test("returns empty array when no matches", () => {
      const results = fuzzySearch(items, "xyz", (item) => item.name);
      assert.strictEqual(results.length, 0);
    });

    test("is case insensitive", () => {
      const results = fuzzySearch(items, "MAP", (item) => item.name);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].item.name, "map");
    });

    test("tracks match positions correctly", () => {
      const results = fuzzySearch(items, "mp", (item) => item.name);
      const mapMatch = results.find((r) => r.item.name === "map");
      assert.deepStrictEqual(mapMatch?.matches, [0, 2]);
    });

    test("scores consecutive matches higher", () => {
      const testItems = [{ name: "abc" }, { name: "a_b_c" }];
      const results = fuzzySearch(testItems, "abc", (item) => item.name);
      assert.strictEqual(results[0].item.name, "abc");
    });

    test("scores matches at start higher", () => {
      const testItems = [{ name: "xmap" }, { name: "map" }];
      const results = fuzzySearch(testItems, "map", (item) => item.name);
      assert.strictEqual(results[0].item.name, "map");
    });
  });

  describe("suggestion constants", () => {
    test("METHODS contains standard array/string methods", () => {
      const methodNames = METHODS.map((method) => method.name);
      assert.ok(methodNames.includes("map"));
      assert.ok(methodNames.includes("filter"));
      assert.ok(methodNames.includes("reduce"));
      assert.ok(methodNames.includes("find"));
    });

    test("BUILTINS contains 1ls builtins", () => {
      const builtinNames = BUILTINS.map((builtin) => builtin.name);
      assert.ok(builtinNames.includes("head"));
      assert.ok(builtinNames.includes("tail"));
      assert.ok(builtinNames.includes("keys"));
      assert.ok(builtinNames.includes("vals"));
    });

    test("SHORTCUTS contains shorthand methods", () => {
      const shortcutNames = SHORTCUTS.map((shortcut) => shortcut.name);
      assert.ok(shortcutNames.includes("mp"));
      assert.ok(shortcutNames.includes("flt"));
      assert.ok(shortcutNames.includes("fnd"));
    });

    test("ALL_SUGGESTIONS combines all suggestion types", () => {
      const total = METHODS.length + BUILTINS.length + SHORTCUTS.length;
      assert.strictEqual(ALL_SUGGESTIONS.length, total);
    });

    test("each suggestion has required fields", () => {
      ALL_SUGGESTIONS.forEach((suggestion: Suggestion) => {
        assert.notStrictEqual(suggestion.name, undefined);
        assert.notStrictEqual(suggestion.signature, undefined);
        assert.notStrictEqual(suggestion.description, undefined);
        assert.notStrictEqual(suggestion.type, undefined);
        assert.ok(["method", "builtin", "shortcut", "path"].includes(suggestion.type));
      });
    });
  });

  describe("scoring constants", () => {
    test("score constants are defined", () => {
      assert.strictEqual(MAX_SUGGESTIONS, 8);
      assert.strictEqual(SCORE_PREFIX_MATCH, 100);
      assert.strictEqual(SCORE_CONTAINS_MATCH, 50);
      assert.strictEqual(SCORE_FUZZY_MATCH, 25);
    });

    test("prefix score > contains score > fuzzy score", () => {
      assert.ok(SCORE_PREFIX_MATCH > SCORE_CONTAINS_MATCH);
      assert.ok(SCORE_CONTAINS_MATCH > SCORE_FUZZY_MATCH);
    });
  });
});
