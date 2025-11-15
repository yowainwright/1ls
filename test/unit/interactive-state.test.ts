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
});
