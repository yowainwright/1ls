import { describe, test, expect } from "bun:test";
import {
  createInitialState,
  updateQuery,
  updateSelection,
  getSelectedPath,
} from "../../src/interactive/state";
import type { JsonPath } from "../../src/interactive/types";

describe("Interactive State", () => {
  const mockPaths: JsonPath[] = [
    { path: ".name", value: "Alice", type: "String", displayValue: '"Alice"' },
    { path: ".age", value: 30, type: "Number", displayValue: "30" },
    {
      path: ".email",
      value: "alice@example.com",
      type: "String",
      displayValue: '"alice@example.com"',
    },
  ];

  test("creates initial state", () => {
    const state = createInitialState(mockPaths);

    expect(state.paths).toEqual(mockPaths);
    expect(state.query).toBe("");
    expect(state.selectedIndex).toBe(0);
    expect(state.matches.length).toBe(3);
  });

  test("updates query and filters matches", () => {
    const state = createInitialState(mockPaths);
    const newState = updateQuery(state, "name");

    expect(newState.query).toBe("name");
    expect(newState.matches.length).toBe(1);
    expect(newState.matches[0].item.path).toBe(".name");
  });

  test("resets selection when query changes", () => {
    const state = createInitialState(mockPaths);
    const selected = updateSelection(state, 2);
    expect(selected.selectedIndex).toBe(2);

    const filtered = updateQuery(selected, "name");
    expect(filtered.selectedIndex).toBe(0);
  });

  test("moves selection down", () => {
    const state = createInitialState(mockPaths);
    const newState = updateSelection(state, 1);

    expect(newState.selectedIndex).toBe(1);
  });

  test("moves selection up", () => {
    const state = createInitialState(mockPaths);
    const down = updateSelection(state, 2);
    const up = updateSelection(down, -1);

    expect(up.selectedIndex).toBe(1);
  });

  test("wraps selection at bottom", () => {
    const state = createInitialState(mockPaths);
    const atBottom = updateSelection(state, 2);
    const wrapped = updateSelection(atBottom, 1);

    expect(wrapped.selectedIndex).toBe(0);
  });

  test("wraps selection at top", () => {
    const state = createInitialState(mockPaths);
    const wrapped = updateSelection(state, -1);

    expect(wrapped.selectedIndex).toBe(2);
  });

  test("gets selected path", () => {
    const state = createInitialState(mockPaths);
    const selected = getSelectedPath(state);

    expect(selected).not.toBeNull();
    expect(selected?.path).toBe(".name");
  });

  test("returns null when no matches", () => {
    const state = createInitialState(mockPaths);
    const noMatches = updateQuery(state, "xyz");
    const selected = getSelectedPath(noMatches);

    expect(selected).toBeNull();
  });

  describe("tooltip integration", () => {
    const arrayData = [1, 2, 3];
    const arrayPaths: JsonPath[] = [
      { path: ".", value: arrayData, type: "Array", displayValue: "[1, 2, 3]" },
      { path: ".[0]", value: 1, type: "Number", displayValue: "1" },
    ];

    test("initializes tooltip state", () => {
      const state = createInitialState(arrayPaths, arrayData);

      expect(state.tooltip).toBeDefined();
      expect(state.tooltip.visible).toBe(false);
      expect(state.tooltip.methodHints).toEqual([]);
    });

    test("shows tooltip hints when query starts with dot and partial method", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, ".ma");

      expect(withQuery.tooltip.visible).toBe(true);
      expect(withQuery.tooltip.methodHints.length).toBeGreaterThan(0);
      expect(withQuery.tooltip.partialMethod).toBe("ma");
    });

    test("shows tooltip hints for filter method", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, ".fil");

      expect(withQuery.tooltip.visible).toBe(true);
      const hasFilter = withQuery.tooltip.methodHints.some((m) => m.item.name === "filter");
      expect(hasFilter).toBe(true);
    });

    test("hides tooltip when method is complete", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, ".map()");

      expect(withQuery.tooltip.visible).toBe(false);
    });

    test("hides tooltip when query has no dot", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, "foo");

      expect(withQuery.tooltip.visible).toBe(false);
    });

    test("updates tooltip when query changes", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const first = updateQuery(state, ".ma");
      const second = updateQuery(first, ".map");

      expect(second.tooltip.visible).toBe(true);
      expect(second.tooltip.partialMethod).toBe("map");
    });

    test("clears tooltip when backspacing past dot", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withDot = updateQuery(state, ".m");
      expect(withDot.tooltip.visible).toBe(true);

      const cleared = updateQuery(withDot, "");
      expect(cleared.tooltip.visible).toBe(false);
    });

    test("shows array-specific methods for array data", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, ".sl");

      expect(withQuery.tooltip.visible).toBe(true);
      const hasSlice = withQuery.tooltip.methodHints.some((m) => m.item.name === "slice");
      expect(hasSlice).toBe(true);
    });

    test("shows string-specific methods for string data", () => {
      const stringData = "hello";
      const stringPaths: JsonPath[] = [
        { path: ".", value: stringData, type: "String", displayValue: '"hello"' },
      ];
      const state = createInitialState(stringPaths, stringData);
      const withQuery = updateQuery(state, ".toU");

      expect(withQuery.tooltip.visible).toBe(true);
      const hasToUpper = withQuery.tooltip.methodHints.some((m) => m.item.name === "toUpperCase");
      expect(hasToUpper).toBe(true);
    });

    test("shows object-specific methods for object data", () => {
      const objectData = { a: 1 };
      const objectPaths: JsonPath[] = [
        { path: ".", value: objectData, type: "Object", displayValue: '{"a": 1}' },
      ];
      const state = createInitialState(objectPaths, objectData);
      const withQuery = updateQuery(state, ".ke");

      expect(withQuery.tooltip.visible).toBe(true);
      const hasKeys = withQuery.tooltip.methodHints.some((m) => m.item.name === "keys");
      expect(hasKeys).toBe(true);
    });

    test("resets tooltip selectedHintIndex when query changes", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, ".m");

      expect(withQuery.tooltip.selectedHintIndex).toBe(0);
    });

    test("shows builtin methods in hints", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, ".hea");

      expect(withQuery.tooltip.visible).toBe(true);
      const hasHead = withQuery.tooltip.methodHints.some((m) => m.item.name === "head" && m.item.isBuiltin);
      expect(hasHead).toBe(true);
    });

    test("limits tooltip hints to maximum count", () => {
      const state = createInitialState(arrayPaths, arrayData);
      const withQuery = updateQuery(state, ".");

      expect(withQuery.tooltip.methodHints.length).toBeLessThanOrEqual(5);
    });
  });

  describe("updateSelection in different modes", () => {
    const paths: JsonPath[] = [
      { path: ".", value: [1, 2], type: "Array", displayValue: "[1, 2]" },
    ];

    test("uses matches.length in explore mode", () => {
      const state = createInitialState(paths, [1, 2]);
      expect(state.mode).toBe("explore");

      const updated = updateSelection(state, 1);
      expect(updated.selectedIndex).toBe(0);
    });

    test("uses methodMatches.length in build mode", () => {
      const baseState = createInitialState(paths, [1, 2]);
      const buildState = Object.assign({}, baseState, {
        mode: "build" as const,
        methodMatches: [
          { item: { name: "map", signature: ".map()", description: "Map", template: ".map()", category: "Transform" }, score: 100, matches: [] },
          { item: { name: "filter", signature: ".filter()", description: "Filter", template: ".filter()", category: "Transform" }, score: 90, matches: [] },
        ],
      });

      const updated = updateSelection(buildState, 1);
      expect(updated.selectedIndex).toBe(1);

      const wrapped = updateSelection(updated, 1);
      expect(wrapped.selectedIndex).toBe(0);
    });

    test("uses propertyMatches.length in build-arrow-fn mode", () => {
      const baseState = createInitialState(paths, [1, 2]);
      const arrowFnState = Object.assign({}, baseState, {
        mode: "build-arrow-fn" as const,
        propertyMatches: [
          { item: { path: ".name", value: "test", type: "String", displayValue: '"test"' }, score: 100, matches: [] },
          { item: { path: ".age", value: 25, type: "Number", displayValue: "25" }, score: 90, matches: [] },
          { item: { path: ".email", value: "test@example.com", type: "String", displayValue: '"test@example.com"' }, score: 80, matches: [] },
        ],
      });

      const updated = updateSelection(arrowFnState, 1);
      expect(updated.selectedIndex).toBe(1);

      const next = updateSelection(updated, 1);
      expect(next.selectedIndex).toBe(2);

      const wrapped = updateSelection(next, 1);
      expect(wrapped.selectedIndex).toBe(0);
    });

    test("wraps backwards in build-arrow-fn mode", () => {
      const baseState = createInitialState(paths, [1, 2]);
      const arrowFnState = Object.assign({}, baseState, {
        mode: "build-arrow-fn" as const,
        selectedIndex: 0,
        propertyMatches: [
          { item: { path: ".a", value: 1, type: "Number", displayValue: "1" }, score: 100, matches: [] },
          { item: { path: ".b", value: 2, type: "Number", displayValue: "2" }, score: 90, matches: [] },
        ],
      });

      const wrapped = updateSelection(arrowFnState, -1);
      expect(wrapped.selectedIndex).toBe(1);
    });

    test("returns same state when no propertyMatches in build-arrow-fn mode", () => {
      const baseState = createInitialState(paths, [1, 2]);
      const arrowFnState = Object.assign({}, baseState, {
        mode: "build-arrow-fn" as const,
        propertyMatches: [],
      });

      const updated = updateSelection(arrowFnState, 1);
      expect(updated).toBe(arrowFnState);
    });
  });
});
