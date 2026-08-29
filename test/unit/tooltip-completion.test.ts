import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { complete, extractPartialMethod } from "../../src/ac/index.ts";

describe("ac", () => {
  describe("extractPartialMethod", () => {
    test("returns null for input without dot", () => {
      const result = extractPartialMethod("foo bar");
      assert.strictEqual(result, null);
    });

    test("extracts partial after dot", () => {
      const result = extractPartialMethod("data.ma");
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.prefix, "ma");
    });

    test("extracts partial after quoted string with dot", () => {
      const result = extractPartialMethod("1ls file.json '.fi");
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.prefix, "fi");
    });

    test("extracts empty prefix for just a dot", () => {
      const result = extractPartialMethod("data.");
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.prefix, "");
    });

    test("returns startIndex correctly", () => {
      const input = "data.map";
      const result = extractPartialMethod(input);
      assert.strictEqual(result?.startIndex, 5); // position after the dot
    });
  });

  describe("complete", () => {
    test("returns empty result for input without dot", () => {
      const result = complete("foo bar");
      assert.deepStrictEqual(result.suggestions, []);
      assert.strictEqual(result.prefix, "");
    });

    test("returns suggestions for partial method", () => {
      const result = complete("data.ma");
      assert.ok(result.suggestions.length > 0);
      assert.strictEqual(result.prefix, "ma");
    });

    test("includes map in suggestions for .ma", () => {
      const result = complete("data.ma");
      const hasMap = result.suggestions.some((s) => s.name === "map");
      assert.strictEqual(hasMap, true);
    });

    test("includes filter in suggestions for .fi", () => {
      const result = complete("data.fi");
      const hasFilter = result.suggestions.some((s) => s.name === "filter");
      assert.strictEqual(hasFilter, true);
    });

    test("limits suggestions to MAX_SUGGESTIONS", () => {
      const result = complete("data.");
      assert.ok(result.suggestions.length <= 8);
    });

    test("orders suggestions by match score", () => {
      const result = complete("data.map");
      const mapIndex = result.suggestions.findIndex((s) => s.name === "map");
      assert.strictEqual(mapIndex, 0); // exact match should be first
    });

    test("includes suggestion type", () => {
      const result = complete("data.ma");
      result.suggestions.forEach((s) => {
        assert.ok(["method", "builtin", "shortcut", "path"].includes(s.type));
      });
    });

    test("includes suggestion signature", () => {
      const result = complete("data.ma");
      const map = result.suggestions.find((s) => s.name === "map");
      assert.ok(map?.signature.includes(".map"));
    });

    test("includes suggestion description", () => {
      const result = complete("data.fi");
      const filter = result.suggestions.find((s) => s.name === "filter");
      assert.notStrictEqual(filter?.description, undefined);
      assert.ok(filter?.description.length > 0);
    });

    test("matches builtins", () => {
      const result = complete("data.hea");
      const hasHead = result.suggestions.some((s) => s.name === "head");
      assert.strictEqual(hasHead, true);
    });

    test("matches shortcuts", () => {
      const result = complete("data.mp");
      const hasMp = result.suggestions.some((s) => s.name === "mp");
      assert.strictEqual(hasMp, true);
    });

    test("handles quoted string input", () => {
      const result = complete("1ls rf file.json '.ma");
      assert.ok(result.suggestions.length > 0);
    });
  });

  describe("complete with data context", () => {
    test("suggests object properties for root object expressions", () => {
      const result = complete("1ls rf file.json '.na", {
        data: { name: "Ada", age: 37 },
        expression: ".na",
      });

      assert.strictEqual(result.suggestions[0]?.type, "path");
      assert.strictEqual(result.suggestions[0]?.name, "name");
      assert.strictEqual(result.suggestions[0]?.insertText, ".name");
    });

    test("suggests nested properties relative to the selected object", () => {
      const result = complete("1ls rf file.json '.user.na", {
        data: { user: { name: "Ada", email: "ada@example.com" } },
        expression: ".user.na",
      });

      assert.strictEqual(result.suggestions[0]?.name, "name");
      assert.strictEqual(result.suggestions[0]?.insertText, ".name");
    });

    test("suggests bracket notation for special keys", () => {
      const result = complete("1ls rf file.json '.user.sp", {
        data: { user: { "sp ace": true } },
        expression: ".user.sp",
      });

      assert.strictEqual(result.suggestions[0]?.type, "path");
      assert.strictEqual(result.suggestions[0]?.insertText, '["sp ace"]');
    });

    test("filters methods by array context", () => {
      const result = complete("1ls rf file.json '.to", {
        data: [1, 2, 3],
        expression: ".to",
      });

      const names = result.suggestions.map((suggestion) => suggestion.name);
      assert.ok(!names.includes("toUpperCase"));
      assert.ok(!names.includes("toLowerCase"));
    });

    test("suggests array methods for array context", () => {
      const result = complete("1ls rf file.json '.ma", {
        data: [1, 2, 3],
        expression: ".ma",
      });

      const mapSuggestion = result.suggestions.find((suggestion) => suggestion.name === "map");
      assert.ok(mapSuggestion?.signature.includes(".map"));
      assert.strictEqual(mapSuggestion?.insertText, ".map(x => x)");
    });

    test("falls back to generic suggestions if contextual evaluation fails", () => {
      const result = complete("1ls rf file.json '.ma", {
        data: { user: { name: "Ada" } },
        expression: ".missing.ma",
      });

      const hasMap = result.suggestions.some((suggestion) => suggestion.name === "map");
      assert.strictEqual(hasMap, true);
    });
  });
});
