import { describe, test, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { createInitialState, updateQuery } from "../../src/interactive/state";
import { createTooltipState, updateTooltipFromQuery } from "../../src/interactive/tooltip";
import type { State, JsonPath, TooltipState } from "../../src/interactive/types";

describe("Interactive Renderer - Tooltip Integration", () => {
  const arrayData = [1, 2, 3, 4, 5];
  const arrayPaths: JsonPath[] = [
    { path: ".", value: arrayData, type: "Array", displayValue: "[1, 2, 3, 4, 5]" },
    { path: ".[0]", value: 1, type: "Number", displayValue: "1" },
  ];

  describe("tooltip state in explore mode", () => {
    test("state includes tooltip after initialization", () => {
      const state = createInitialState(arrayPaths, arrayData);

      expect(state.tooltip).toBeDefined();
      expect(state.tooltip.visible).toBe(false);
      expect(state.tooltip.methodHints).toEqual([]);
      expect(state.tooltip.partialMethod).toBe("");
      expect(state.tooltip.selectedHintIndex).toBe(0);
    });

    test("tooltip becomes visible when typing partial method", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".ma");

      expect(updated.tooltip.visible).toBe(true);
      expect(updated.tooltip.methodHints.length).toBeGreaterThan(0);
    });

    test("tooltip shows relevant method for query", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".filter");

      const methodNames = updated.tooltip.methodHints.map((m) => m.item.name);
      expect(methodNames).toContain("filter");
    });

    test("tooltip hides when method is completed with parens", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".map(x => x * 2)");

      expect(updated.tooltip.visible).toBe(false);
    });

    test("tooltip persists partial method name", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".red");

      expect(updated.tooltip.partialMethod).toBe("red");
    });
  });

  describe("tooltip method hints content", () => {
    test("hints include method signature", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".map");

      const mapHint = updated.tooltip.methodHints.find((m) => m.item.name === "map");
      expect(mapHint).toBeDefined();
      expect(mapHint?.item.signature).toContain(".map");
    });

    test("hints include method description", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".filter");

      const filterHint = updated.tooltip.methodHints.find((m) => m.item.name === "filter");
      expect(filterHint).toBeDefined();
      expect(filterHint?.item.description).toBeDefined();
      expect(filterHint?.item.description.length).toBeGreaterThan(0);
    });

    test("hints include category", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".map");

      const mapHint = updated.tooltip.methodHints.find((m) => m.item.name === "map");
      expect(mapHint?.item.category).toBeDefined();
    });

    test("hints mark builtins appropriately", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".head");

      const headHint = updated.tooltip.methodHints.find((m) => m.item.name === "head");
      expect(headHint?.item.isBuiltin).toBe(true);
    });

    test("standard methods are not marked as builtin", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".map");

      const mapHint = updated.tooltip.methodHints.find((m) => m.item.name === "map");
      expect(mapHint?.item.isBuiltin).toBeFalsy();
    });
  });

  describe("tooltip with different data types", () => {
    test("shows string methods for string data", () => {
      const stringData = "hello world";
      const stringPaths: JsonPath[] = [
        { path: ".", value: stringData, type: "String", displayValue: '"hello world"' },
      ];
      const state = createInitialState(stringPaths, stringData);
      const updated = updateQuery(state, ".split");

      const splitHint = updated.tooltip.methodHints.find((m) => m.item.name === "split");
      expect(splitHint).toBeDefined();
    });

    test("shows object methods for object data", () => {
      const objectData = { name: "test", value: 42 };
      const objectPaths: JsonPath[] = [
        { path: ".", value: objectData, type: "Object", displayValue: '{"name": "test"}' },
      ];
      const state = createInitialState(objectPaths, objectData);
      const updated = updateQuery(state, ".pick");

      const pickHint = updated.tooltip.methodHints.find((m) => m.item.name === "pick");
      expect(pickHint).toBeDefined();
    });

    test("shows number methods for number data", () => {
      const numberData = 3.14159;
      const numberPaths: JsonPath[] = [
        { path: ".", value: numberData, type: "Number", displayValue: "3.14159" },
      ];
      const state = createInitialState(numberPaths, numberData);
      const updated = updateQuery(state, ".toFixed");

      const toFixedHint = updated.tooltip.methodHints.find((m) => m.item.name === "toFixed");
      expect(toFixedHint).toBeDefined();
    });
  });

  describe("tooltip fuzzy matching", () => {
    test("fuzzy matches partial method names", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".flt");

      const hasFilter = updated.tooltip.methodHints.some((m) => m.item.name === "filter");
      expect(hasFilter).toBe(true);
    });

    test("ranks exact prefix matches higher", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".fil");

      const firstHint = updated.tooltip.methodHints[0];
      expect(firstHint.item.name).toBe("filter");
    });

    test("shows multiple matching methods", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".s");

      expect(updated.tooltip.methodHints.length).toBeGreaterThan(1);
      const names = updated.tooltip.methodHints.map((m) => m.item.name);
      const allStartWithS = names.every((n) => n.toLowerCase().includes("s"));
      expect(allStartWithS).toBe(true);
    });
  });

  describe("tooltip state transitions", () => {
    test("transitions from hidden to visible on dot", () => {
      const state = createInitialState(arrayPaths, arrayData);
      expect(state.tooltip.visible).toBe(false);

      const withDot = updateQuery(state, ".");
      expect(withDot.tooltip.visible).toBe(true);
    });

    test("stays visible while typing method name", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const step1 = updateQuery(state, ".");
      const step2 = updateQuery(step1, ".m");
      const step3 = updateQuery(step2, ".ma");
      const step4 = updateQuery(step3, ".map");

      expect(step1.tooltip.visible).toBe(true);
      expect(step2.tooltip.visible).toBe(true);
      expect(step3.tooltip.visible).toBe(true);
      expect(step4.tooltip.visible).toBe(true);
    });

    test("hides when opening paren is typed", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const typing = updateQuery(state, ".map");
      expect(typing.tooltip.visible).toBe(true);

      const withParen = updateQuery(typing, ".map(");
      expect(withParen.tooltip.visible).toBe(false);
    });

    test("hides when closing paren completes method", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const complete = updateQuery(state, ".map()");

      expect(complete.tooltip.visible).toBe(false);
    });
  });

  describe("expression preview integration", () => {
    test("state can evaluate complete expressions", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const complete = updateQuery(state, ".length");

      expect(complete.query).toBe(".length");
      expect(complete.originalData).toEqual(arrayData);
    });

    test("state preserves original data for preview", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const updated = updateQuery(state, ".filter(x => x > 2)");

      expect(updated.originalData).toEqual(arrayData);
    });
  });
});

describe("Tooltip State Unit Tests", () => {
  describe("createTooltipState", () => {
    test("returns correct initial structure", () => {
      const state = createTooltipState();

      expect(state).toEqual({
        visible: false,
        methodHints: [],
        partialMethod: "",
        selectedHintIndex: 0,
      });
    });
  });

  describe("updateTooltipFromQuery", () => {
    test("extracts partial method after last dot", () => {
      const context = { query: ".foo.bar.baz", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.partialMethod).toBe("baz");
    });

    test("handles property access patterns", () => {
      const context = { query: ".users[0].na", dataType: "Object", originalData: {} };
      const state = updateTooltipFromQuery(context);

      expect(state.partialMethod).toBe("na");
    });

    test("returns not visible for bracket notation", () => {
      const context = { query: ".[0]", dataType: "Array", originalData: [] };
      const state = updateTooltipFromQuery(context);

      expect(state.visible).toBe(false);
    });
  });
});
