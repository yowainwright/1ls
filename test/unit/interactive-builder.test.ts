import { describe, test, expect } from "bun:test";
import {
  enterBuildMode,
  exitBuildMode,
  selectMethod,
  updateArrowFnExpression,
  completeArrowFn,
  cancelArrowFn,
} from "../../src/interactive/builder";
import { createInitialState } from "../../src/interactive/state";
import { navigateJson } from "../../src/interactive/navigator";
import type { State } from "../../src/interactive/types";

describe("Expression Builder", () => {
  const testData = {
    users: [
      { id: 1, name: "Alice", active: true },
      { id: 2, name: "Bob", active: false },
    ],
  };

  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);

  test("enters build mode from explore mode", () => {
    const newState = enterBuildMode(initialState);

    expect(newState.mode).toBe("build");
    expect(newState.builder).not.toBeNull();
    expect(newState.builder?.basePath).toBe(".users");
    expect(newState.builder?.baseType).toBe("Array");
  });

  test("exits build mode back to explore", () => {
    const buildState = enterBuildMode(initialState);
    const exploreState = exitBuildMode(buildState);

    expect(exploreState.mode).toBe("explore");
    expect(exploreState.builder).toBeNull();
  });

  test("does not enter build mode with no selection", () => {
    const emptyState = { ...initialState, matches: [] };
    const newState = enterBuildMode(emptyState);

    expect(newState.mode).toBe("explore");
    expect(newState.builder).toBeNull();
  });
});

describe("Method Selection", () => {
  const testData = { users: [{ id: 1, name: "Alice" }] };
  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);
  const buildState = enterBuildMode(initialState);

  test("selects simple method without arrow function", () => {
    const methodIndex = 14;
    const newState = selectMethod(buildState, methodIndex);

    expect(newState.mode).toBe("build");
    expect(newState.builder?.expression).toContain(".length");
    expect(newState.builder?.arrowFnContext).toBeNull();
  });

  test("enters arrow function mode for methods needing callback", () => {
    const methodIndex = 0;
    const newState = selectMethod(buildState, methodIndex);

    expect(newState.mode).toBe("build-arrow-fn");
    expect(newState.builder?.arrowFnContext).not.toBeNull();
    expect(newState.builder?.arrowFnContext?.paramName).toBe("x");
  });

  test("handles invalid method index", () => {
    const newState = selectMethod(buildState, 999);

    expect(newState).toEqual(buildState);
  });

  test("handles state with no builder", () => {
    const newState = selectMethod(initialState, 0);

    expect(newState).toEqual(initialState);
  });
});

describe("Arrow Function Builder", () => {
  const testData = {
    users: [{ id: 1, name: "Alice", email: "alice@example.com" }],
  };
  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);
  const buildState = enterBuildMode(initialState);
  const arrowFnState = selectMethod(buildState, 0); // .map

  test("updates arrow function expression with selected property", () => {
    const hasNamePath = arrowFnState.builder?.arrowFnContext?.paramPaths.some(
      (p) => p.path === ".name",
    );
    expect(hasNamePath).toBe(true);

    const namePathIndex =
      arrowFnState.builder?.arrowFnContext?.paramPaths.findIndex(
        (p) => p.path === ".name",
      ) || 0;

    const newState = updateArrowFnExpression(arrowFnState, namePathIndex);

    expect(newState.builder?.arrowFnContext?.expression).toBe("x.name");
  });

  test("completes arrow function and returns to build mode", () => {
    const namePathIndex =
      arrowFnState.builder?.arrowFnContext?.paramPaths.findIndex(
        (p) => p.path === ".name",
      ) || 0;
    const withProperty = updateArrowFnExpression(arrowFnState, namePathIndex);
    const completed = completeArrowFn(withProperty);

    expect(completed.mode).toBe("build");
    expect(completed.builder?.expression).toContain("x => x.name");
    expect(completed.builder?.arrowFnContext).toBeNull();
  });

  test("cancels arrow function and removes partial expression", () => {
    const cancelled = cancelArrowFn(arrowFnState);

    expect(cancelled.mode).toBe("build");
    expect(cancelled.builder?.expression).toBe(".users");
    expect(cancelled.builder?.arrowFnContext).toBeNull();
  });

  test("handles invalid path index", () => {
    const newState = updateArrowFnExpression(arrowFnState, 999);

    expect(newState).toEqual(arrowFnState);
  });

  test("completes without expression returns to build mode", () => {
    const completed = completeArrowFn(arrowFnState);

    expect(completed).toEqual(arrowFnState);
  });
});

describe("Expression Building Flow", () => {
  const testData = {
    users: [
      { id: 1, name: "Alice", active: true },
      { id: 2, name: "Bob", active: false },
    ],
  };
  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);

  test("builds complete expression: .filter().map()", () => {
    const buildState = enterBuildMode(initialState);
    expect(buildState.builder?.expression).toBe(".users");

    const filterState = selectMethod(buildState, 1);
    expect(filterState.mode).toBe("build-arrow-fn");

    const paramPaths = filterState.builder?.arrowFnContext?.paramPaths || [];
    const activePath = paramPaths.find((p) => p.path === ".active");
    expect(activePath).toBeDefined();

    const activePathIndex = paramPaths.findIndex((p) => p.path === ".active");
    expect(activePathIndex).toBeGreaterThanOrEqual(0);

    const withActive = updateArrowFnExpression(filterState, activePathIndex);
    expect(withActive.builder?.arrowFnContext?.expression).toBe("x.active");

    const afterFilter = completeArrowFn(withActive);
    expect(afterFilter.mode).toBe("build");
    expect(afterFilter.builder?.expression).toContain("filter(x => x.active)");

    const mapState = selectMethod(afterFilter, 0);
    expect(mapState.mode).toBe("build-arrow-fn");

    const mapParamPaths = mapState.builder?.arrowFnContext?.paramPaths || [];
    const namePathIndex = mapParamPaths.findIndex((p) => p.path === ".name");
    expect(namePathIndex).toBeGreaterThanOrEqual(0);

    const withName = updateArrowFnExpression(mapState, namePathIndex);
    const final = completeArrowFn(withName);

    expect(final.mode).toBe("build");
    expect(final.builder?.expression).toContain(".filter(x => x.active)");
    expect(final.builder?.expression).toContain(".map(x => x.name)");
  });
});
