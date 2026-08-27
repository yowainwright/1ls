import { describe, test, expect } from "bun:test";
import { complete, extractPartialMethod } from "../../src/ac";

describe("ac", () => {
  describe("extractPartialMethod", () => {
    test("returns null for input without dot", () => {
      const result = extractPartialMethod("foo bar");
      expect(result).toBeNull();
    });

    test("extracts partial after dot", () => {
      const result = extractPartialMethod("data.ma");
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe("ma");
    });

    test("extracts partial after quoted string with dot", () => {
      const result = extractPartialMethod("1ls file.json '.fi");
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe("fi");
    });

    test("extracts empty prefix for just a dot", () => {
      const result = extractPartialMethod("data.");
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe("");
    });

    test("returns startIndex correctly", () => {
      const input = "data.map";
      const result = extractPartialMethod(input);
      expect(result?.startIndex).toBe(5); // position after the dot
    });
  });

  describe("complete", () => {
    test("returns empty result for input without dot", () => {
      const result = complete("foo bar");
      expect(result.suggestions).toEqual([]);
      expect(result.prefix).toBe("");
    });

    test("returns suggestions for partial method", () => {
      const result = complete("data.ma");
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.prefix).toBe("ma");
    });

    test("includes map in suggestions for .ma", () => {
      const result = complete("data.ma");
      const hasMap = result.suggestions.some((s) => s.name === "map");
      expect(hasMap).toBe(true);
    });

    test("includes filter in suggestions for .fi", () => {
      const result = complete("data.fi");
      const hasFilter = result.suggestions.some((s) => s.name === "filter");
      expect(hasFilter).toBe(true);
    });

    test("limits suggestions to MAX_SUGGESTIONS", () => {
      const result = complete("data.");
      expect(result.suggestions.length).toBeLessThanOrEqual(8);
    });

    test("orders suggestions by match score", () => {
      const result = complete("data.map");
      const mapIndex = result.suggestions.findIndex((s) => s.name === "map");
      expect(mapIndex).toBe(0); // exact match should be first
    });

    test("includes suggestion type", () => {
      const result = complete("data.ma");
      result.suggestions.forEach((s) => {
        expect(["method", "builtin", "shortcut", "path"]).toContain(s.type);
      });
    });

    test("includes suggestion signature", () => {
      const result = complete("data.ma");
      const map = result.suggestions.find((s) => s.name === "map");
      expect(map?.signature).toContain(".map");
    });

    test("includes suggestion description", () => {
      const result = complete("data.fi");
      const filter = result.suggestions.find((s) => s.name === "filter");
      expect(filter?.description).toBeDefined();
      expect(filter?.description.length).toBeGreaterThan(0);
    });

    test("matches builtins", () => {
      const result = complete("data.hea");
      const hasHead = result.suggestions.some((s) => s.name === "head");
      expect(hasHead).toBe(true);
    });

    test("matches shortcuts", () => {
      const result = complete("data.mp");
      const hasMp = result.suggestions.some((s) => s.name === "mp");
      expect(hasMp).toBe(true);
    });

    test("handles quoted string input", () => {
      const result = complete("1ls rf file.json '.ma");
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("complete with data context", () => {
    test("suggests object properties for root object expressions", () => {
      const result = complete("1ls rf file.json '.na", {
        data: { name: "Ada", age: 37 },
        expression: ".na",
      });

      expect(result.suggestions[0]?.type).toBe("path");
      expect(result.suggestions[0]?.name).toBe("name");
      expect(result.suggestions[0]?.insertText).toBe(".name");
    });

    test("suggests nested properties relative to the selected object", () => {
      const result = complete("1ls rf file.json '.user.na", {
        data: { user: { name: "Ada", email: "ada@example.com" } },
        expression: ".user.na",
      });

      expect(result.suggestions[0]?.name).toBe("name");
      expect(result.suggestions[0]?.insertText).toBe(".name");
    });

    test("suggests bracket notation for special keys", () => {
      const result = complete("1ls rf file.json '.user.sp", {
        data: { user: { "sp ace": true } },
        expression: ".user.sp",
      });

      expect(result.suggestions[0]?.type).toBe("path");
      expect(result.suggestions[0]?.insertText).toBe('["sp ace"]');
    });

    test("filters methods by array context", () => {
      const result = complete("1ls rf file.json '.to", {
        data: [1, 2, 3],
        expression: ".to",
      });

      const names = result.suggestions.map((suggestion) => suggestion.name);
      expect(names).not.toContain("toUpperCase");
      expect(names).not.toContain("toLowerCase");
    });

    test("suggests array methods for array context", () => {
      const result = complete("1ls rf file.json '.ma", {
        data: [1, 2, 3],
        expression: ".ma",
      });

      const mapSuggestion = result.suggestions.find((suggestion) => suggestion.name === "map");
      expect(mapSuggestion?.signature).toContain(".map");
      expect(mapSuggestion?.insertText).toBe(".map(x => x)");
    });

    test("falls back to generic suggestions if contextual evaluation fails", () => {
      const result = complete("1ls rf file.json '.ma", {
        data: { user: { name: "Ada" } },
        expression: ".missing.ma",
      });

      const hasMap = result.suggestions.some((suggestion) => suggestion.name === "map");
      expect(hasMap).toBe(true);
    });
  });
});
