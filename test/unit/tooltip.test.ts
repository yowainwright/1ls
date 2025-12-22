import { describe, test, expect } from "bun:test";
import {
  createTooltipState,
  updateTooltipFromQuery,
  selectNextHint,
  selectPreviousHint,
  getSelectedHint,
  isMethodComplete,
  formatMethodHint,
  getPreviewForExpression,
  MAX_TOOLTIP_HINTS,
  METHOD_TRIGGER_CHAR,
} from "../../src/interactive/tooltip";

describe("tooltip", () => {
  describe("createTooltipState", () => {
    test("creates initial tooltip state", () => {
      const state = createTooltipState();

      expect(state.visible).toBe(false);
      expect(state.methodHints).toEqual([]);
      expect(state.partialMethod).toBe("");
      expect(state.selectedHintIndex).toBe(0);
    });
  });

  describe("updateTooltipFromQuery", () => {
    test("returns empty state when query has no dot", () => {
      const context = { query: "foo", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(false);
      expect(state.methodHints).toEqual([]);
    });

    test("returns empty state when method is complete with parentheses", () => {
      const context = { query: ".map()", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(false);
    });

    test("shows hints for partial method after dot", () => {
      const context = { query: ".ma", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      expect(state.methodHints.length).toBeGreaterThan(0);
      expect(state.partialMethod).toBe("ma");
    });

    test("limits hints to max count", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.methodHints.length).toBeLessThanOrEqual(5);
    });

    test("matches methods by name", () => {
      const context = { query: ".fil", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      const hasFilter = state.methodHints.some((m) => m.item.name === "filter");
      expect(hasFilter).toBe(true);
    });
  });

  describe("selectNextHint", () => {
    test("increments selected hint index", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const next = selectNextHint(initial);

      expect(next.selectedHintIndex).toBe(1);
    });

    test("wraps around to start", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const lastIndex = initial.methodHints.length - 1;
      const atEnd = Object.assign({}, initial, { selectedHintIndex: lastIndex });
      const wrapped = selectNextHint(atEnd);

      expect(wrapped.selectedHintIndex).toBe(0);
    });

    test("returns same state when no hints", () => {
      const empty = createTooltipState();
      const result = selectNextHint(empty);

      expect(result.selectedHintIndex).toBe(0);
    });
  });

  describe("selectPreviousHint", () => {
    test("decrements selected hint index", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const atOne = Object.assign({}, initial, { selectedHintIndex: 1 });
      const prev = selectPreviousHint(atOne);

      expect(prev.selectedHintIndex).toBe(0);
    });

    test("wraps around to end", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const atStart = Object.assign({}, initial, { selectedHintIndex: 0 });
      const wrapped = selectPreviousHint(atStart);

      expect(wrapped.selectedHintIndex).toBe(initial.methodHints.length - 1);
    });
  });

  describe("getSelectedHint", () => {
    test("returns selected method", () => {
      const context = { query: ".fil", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);
      const hint = getSelectedHint(state);

      expect(hint).not.toBeNull();
      expect(hint?.name).toBeDefined();
    });

    test("returns null when no hints", () => {
      const empty = createTooltipState();
      const hint = getSelectedHint(empty);

      expect(hint).toBeNull();
    });
  });

  describe("isMethodComplete", () => {
    test("returns false for query without dot", () => {
      expect(isMethodComplete("foo")).toBe(false);
    });

    test("returns false for partial method", () => {
      expect(isMethodComplete(".ma")).toBe(false);
    });

    test("returns true for method with closing paren", () => {
      expect(isMethodComplete(".map()")).toBe(true);
      expect(isMethodComplete(".filter(x => x)")).toBe(true);
    });

    test("returns true for property access", () => {
      expect(isMethodComplete(".length")).toBe(true);
    });
  });

  describe("formatMethodHint", () => {
    test("formats method hint with signature and description", () => {
      const match = {
        item: {
          name: "map",
          signature: ".map(x => ...)",
          description: "Transform each item",
          template: ".map(x => x)",
          category: "Transform",
        },
        score: 100,
        matches: [],
      };

      const formatted = formatMethodHint(match);

      expect(formatted.signature).toBe(".map(x => ...)");
      expect(formatted.description).toBe("Transform each item");
      expect(formatted.isBuiltin).toBe(false);
    });

    test("marks builtin methods", () => {
      const match = {
        item: {
          name: "head",
          signature: "head()",
          description: "First element",
          template: ".head()",
          category: "Access",
          isBuiltin: true,
        },
        score: 100,
        matches: [],
      };

      const formatted = formatMethodHint(match);

      expect(formatted.isBuiltin).toBe(true);
    });
  });

  describe("getPreviewForExpression", () => {
    test("returns success with evaluated result for valid expression", () => {
      const data = [1, 2, 3];
      const result = getPreviewForExpression(".length", data);

      expect(result.success).toBe(true);
      expect(result.preview).toBe("3");
    });

    test("returns success for map expression", () => {
      const data = [{ name: "a" }, { name: "b" }];
      const result = getPreviewForExpression(".map(x => x.name)", data);

      expect(result.success).toBe(true);
      expect(result.preview).toContain("a");
      expect(result.preview).toContain("b");
    });

    test("returns success for filter expression", () => {
      const data = [1, 2, 3, 4, 5];
      const result = getPreviewForExpression(".filter(x => x > 2)", data);

      expect(result.success).toBe(true);
      expect(result.preview).toContain("3");
      expect(result.preview).toContain("4");
      expect(result.preview).toContain("5");
    });

    test("returns error for invalid expression", () => {
      const data = [1, 2, 3];
      const result = getPreviewForExpression(".invalidMethod()", data);

      expect(result.success).toBe(false);
      expect(result.preview).toContain("Error");
    });

    test("returns success for object keys", () => {
      const data = { a: 1, b: 2 };
      const result = getPreviewForExpression(".{keys}", data);

      expect(result.success).toBe(true);
      expect(result.preview).toContain("a");
      expect(result.preview).toContain("b");
    });

    test("returns success for object values", () => {
      const data = { a: 1, b: 2 };
      const result = getPreviewForExpression(".{values}", data);

      expect(result.success).toBe(true);
      expect(result.preview).toContain("1");
      expect(result.preview).toContain("2");
    });

    test("returns success for nested property access", () => {
      const data = { user: { name: "test" } };
      const result = getPreviewForExpression(".user.name", data);

      expect(result.success).toBe(true);
      expect(result.preview).toContain("test");
    });

    test("returns success for array index access", () => {
      const data = ["a", "b", "c"];
      const result = getPreviewForExpression(".[1]", data);

      expect(result.success).toBe(true);
      expect(result.preview).toContain("b");
    });

    test("returns success for chained methods", () => {
      const data = [1, 2, 3, 4, 5];
      const result = getPreviewForExpression(".filter(x => x > 2).map(x => x * 2)", data);

      expect(result.success).toBe(true);
      expect(result.preview).toContain("6");
      expect(result.preview).toContain("8");
      expect(result.preview).toContain("10");
    });
  });

  describe("constants", () => {
    test("MAX_TOOLTIP_HINTS is defined", () => {
      expect(MAX_TOOLTIP_HINTS).toBe(5);
    });

    test("METHOD_TRIGGER_CHAR is dot", () => {
      expect(METHOD_TRIGGER_CHAR).toBe(".");
    });
  });

  describe("updateTooltipFromQuery - data type detection", () => {
    test("detects Array type and shows array methods", () => {
      const context = { query: ".ma", dataType: "", originalData: [1, 2, 3] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      const hasMap = state.methodHints.some((m) => m.item.name === "map");
      expect(hasMap).toBe(true);
    });

    test("detects String type and shows string methods", () => {
      const context = { query: ".to", dataType: "", originalData: "hello" };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      const hasToUpper = state.methodHints.some((m) => m.item.name === "toUpperCase");
      expect(hasToUpper).toBe(true);
    });

    test("detects Object type and shows object methods", () => {
      const context = { query: ".ke", dataType: "", originalData: { a: 1 } };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      const hasKeys = state.methodHints.some((m) => m.item.name === "keys");
      expect(hasKeys).toBe(true);
    });

    test("detects Number type and shows number methods", () => {
      const context = { query: ".to", dataType: "", originalData: 42 };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      const hasToFixed = state.methodHints.some((m) => m.item.name === "toFixed");
      expect(hasToFixed).toBe(true);
    });

    test("uses provided dataType over detection", () => {
      const context = { query: ".ma", dataType: "Array", originalData: "string" };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      const hasMap = state.methodHints.some((m) => m.item.name === "map");
      expect(hasMap).toBe(true);
    });
  });

  describe("updateTooltipFromQuery - edge cases", () => {
    test("handles empty query", () => {
      const context = { query: "", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(false);
    });

    test("handles just a dot", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
      expect(state.partialMethod).toBe("");
    });

    test("handles multiple dots - uses last segment", () => {
      const context = { query: ".foo.ba", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.partialMethod).toBe("ba");
    });

    test("handles query with opening paren but no closing", () => {
      const context = { query: ".map(x =>", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(false);
    });

    test("returns not visible for complete method call", () => {
      const context = { query: ".filter(x => x > 0)", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(false);
    });

    test("handles null data", () => {
      const context = { query: ".ty", dataType: "", originalData: null };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(true);
    });
  });

  describe("isMethodComplete - edge cases", () => {
    test("returns false for empty string", () => {
      expect(isMethodComplete("")).toBe(false);
    });

    test("returns false for just a dot", () => {
      expect(isMethodComplete(".")).toBe(false);
    });

    test("returns true for .keys property", () => {
      expect(isMethodComplete(".keys")).toBe(true);
    });

    test("returns true for .values property", () => {
      expect(isMethodComplete(".values")).toBe(true);
    });

    test("returns true for .entries property", () => {
      expect(isMethodComplete(".entries")).toBe(true);
    });

    test("returns true for nested method with closing paren", () => {
      expect(isMethodComplete(".foo.bar()")).toBe(true);
    });

    test("returns false for method with opening paren only", () => {
      expect(isMethodComplete(".map(")).toBe(false);
    });

    test("returns true for complex arrow function", () => {
      expect(isMethodComplete(".reduce((acc, x) => acc + x, 0)")).toBe(true);
    });
  });

  describe("selectNextHint - edge cases", () => {
    test("handles single hint", () => {
      const context = { query: ".redu", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const hasOneHint = initial.methodHints.length === 1;

      if (hasOneHint) {
        const next = selectNextHint(initial);
        expect(next.selectedHintIndex).toBe(0);
      }
    });

    test("preserves other state properties", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const next = selectNextHint(initial);

      expect(next.visible).toBe(initial.visible);
      expect(next.partialMethod).toBe(initial.partialMethod);
      expect(next.methodHints).toBe(initial.methodHints);
    });
  });

  describe("selectPreviousHint - edge cases", () => {
    test("preserves other state properties", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const atOne = Object.assign({}, initial, { selectedHintIndex: 1 });
      const prev = selectPreviousHint(atOne);

      expect(prev.visible).toBe(initial.visible);
      expect(prev.partialMethod).toBe(initial.partialMethod);
      expect(prev.methodHints).toBe(initial.methodHints);
    });

    test("returns same state when no hints", () => {
      const empty = createTooltipState();
      const result = selectPreviousHint(empty);

      expect(result.selectedHintIndex).toBe(0);
    });
  });

  describe("getSelectedHint - edge cases", () => {
    test("returns null for invalid index", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const invalid = Object.assign({}, initial, { selectedHintIndex: 999 });
      const hint = getSelectedHint(invalid);

      expect(hint).toBeNull();
    });

    test("returns null for negative index", () => {
      const context = { query: ".", dataType: "Array", originalData: [] };
      const initial = updateTooltipFromQuery(context);
      const invalid = Object.assign({}, initial, { selectedHintIndex: -1 });
      const hint = getSelectedHint(invalid);

      expect(hint).toBeNull();
    });
  });
});
