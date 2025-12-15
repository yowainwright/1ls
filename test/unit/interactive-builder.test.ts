import { describe, test, expect } from "bun:test";
import {
  enterBuildMode,
  exitBuildMode,
  selectMethod,
  updateArrowFnExpression,
  completeArrowFn,
  cancelArrowFn,
  updateBuildQuery,
  updateArrowFnQuery,
  undoLastSegment,
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

describe("updateBuildQuery", () => {
  const testData = { users: [{ id: 1, name: "Alice" }] };
  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);
  const buildState = enterBuildMode(initialState);

  test("updates query and filters method matches", () => {
    const newState = updateBuildQuery(buildState, "map");

    expect(newState.query).toBe("map");
    expect(newState.selectedIndex).toBe(0);
  });

  test("returns state unchanged when no builder", () => {
    const newState = updateBuildQuery(initialState, "map");

    expect(newState).toEqual(initialState);
  });

  test("resets selectedIndex on query change", () => {
    const stateWithSelection = { ...buildState, selectedIndex: 5 };
    const newState = updateBuildQuery(stateWithSelection, "filter");

    expect(newState.selectedIndex).toBe(0);
  });
});

describe("updateArrowFnQuery", () => {
  const testData = { users: [{ id: 1, name: "Alice", email: "alice@test.com" }] };
  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);
  const buildState = enterBuildMode(initialState);
  const arrowFnState = selectMethod(buildState, 0);

  test("updates query and filters property matches", () => {
    const newState = updateArrowFnQuery(arrowFnState, "name");

    expect(newState.query).toBe("name");
    expect(newState.selectedIndex).toBe(0);
  });

  test("returns state unchanged when no builder", () => {
    const newState = updateArrowFnQuery(initialState, "name");

    expect(newState).toEqual(initialState);
  });

  test("returns state unchanged when no arrow context", () => {
    const newState = updateArrowFnQuery(buildState, "name");

    expect(newState).toEqual(buildState);
  });
});

describe("undoLastSegment", () => {
  const testData = { users: [{ id: 1, name: "Alice" }] };
  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);
  const buildState = enterBuildMode(initialState);

  test("exits build mode when at base path", () => {
    const newState = undoLastSegment(buildState);

    expect(newState.mode).toBe("explore");
    expect(newState.builder).toBeNull();
  });

  test("handles undo for method with parentheses", () => {
    const mapState = selectMethod(buildState, 0);
    const arrowContext = mapState.builder!.arrowFnContext!;
    const updatedContext = { ...arrowContext, expression: "x" };
    const updatedBuilder = { ...mapState.builder!, arrowFnContext: updatedContext };
    const withExpr = { ...mapState, builder: updatedBuilder };
    const completed = completeArrowFn(withExpr);
    const expressionWithMap = completed.builder?.expression;
    const hasMapMethod = expressionWithMap?.includes(".map(");
    expect(hasMapMethod).toBe(true);

    const afterUndo = undoLastSegment(completed);
    const exitedBuildMode = afterUndo.mode === "explore";
    expect(exitedBuildMode).toBe(true);
  });

  test("returns state unchanged when no builder", () => {
    const newState = undoLastSegment(initialState);

    expect(newState).toEqual(initialState);
  });

  test("exits build mode when expression equals base path after undo", () => {
    const stateWithMinimalExpression = {
      ...buildState,
      builder: { ...buildState.builder!, expression: ".users" },
    };
    const newState = undoLastSegment(stateWithMinimalExpression);

    expect(newState.mode).toBe("explore");
  });
});

describe("selectMethod edge cases", () => {
  test("handles sort method with (a, b) pattern", () => {
    const testData = { numbers: [3, 1, 2] };
    const paths = navigateJson(testData);
    const initialState = createInitialState(paths, testData);
    const buildState = enterBuildMode(initialState);
    const sortMethodIndex = buildState.methodMatches.findIndex(
      (m) => m.item.name === "sort"
    );
    const hasSortMethod = sortMethodIndex >= 0;
    expect(hasSortMethod).toBe(true);

    const sortState = selectMethod(buildState, sortMethodIndex);
    expect(sortState.builder?.arrowFnContext?.paramName).toBe("a");
  });

  test("handles object type base value", () => {
    const testData = { config: { name: "test", value: 123 } };
    const paths = navigateJson(testData);
    const configIndex = paths.findIndex((p) => p.path === ".config");
    const stateWithConfig = createInitialState(paths, testData);
    stateWithConfig.selectedIndex = configIndex;
    const buildState = enterBuildMode(stateWithConfig);

    expect(buildState.builder?.baseType).toBe("Object");
  });

  test("handles string type base value", () => {
    const testData = { message: "hello world" };
    const paths = navigateJson(testData);
    const messageIndex = paths.findIndex((p) => p.path === ".message");
    const stateWithString = createInitialState(paths, testData);
    stateWithString.selectedIndex = messageIndex;
    const buildState = enterBuildMode(stateWithString);

    expect(buildState.builder?.baseType).toBe("String");
  });

  test("handles number type base value", () => {
    const testData = { count: 42 };
    const paths = navigateJson(testData);
    const countIndex = paths.findIndex((p) => p.path === ".count");
    const stateWithNumber = createInitialState(paths, testData);
    stateWithNumber.selectedIndex = countIndex;
    const buildState = enterBuildMode(stateWithNumber);

    expect(buildState.builder?.baseType).toBe("Number");
  });

  test("handles boolean type base value", () => {
    const testData = { active: true };
    const paths = navigateJson(testData);
    const activeIndex = paths.findIndex((p) => p.path === ".active");
    const stateWithBool = createInitialState(paths, testData);
    stateWithBool.selectedIndex = activeIndex;
    const buildState = enterBuildMode(stateWithBool);

    expect(buildState.builder?.baseType).toBe("Boolean");
  });

  test("handles null type base value", () => {
    const testData = { empty: null };
    const paths = navigateJson(testData);
    const emptyIndex = paths.findIndex((p) => p.path === ".empty");
    const stateWithNull = createInitialState(paths, testData);
    stateWithNull.selectedIndex = emptyIndex;
    const buildState = enterBuildMode(stateWithNull);

    expect(buildState.builder?.baseType).toBe("null");
  });

  test("handles empty array for arrow function context", () => {
    const testData = { items: [] as unknown[] };
    const paths = navigateJson(testData);
    const itemsIndex = paths.findIndex((p) => p.path === ".items");
    const stateWithEmpty = createInitialState(paths, testData);
    stateWithEmpty.selectedIndex = itemsIndex;
    const buildState = enterBuildMode(stateWithEmpty);
    const mapState = selectMethod(buildState, 0);

    expect(mapState.builder?.arrowFnContext?.paramValue).toEqual({});
  });
});

describe("completeArrowFn template replacements", () => {
  const testData = { numbers: [3, 1, 2] };
  const paths = navigateJson(testData);
  const initialState = createInitialState(paths, testData);
  const buildState = enterBuildMode(initialState);

  test("replaces (a, b) => a - b pattern for sort", () => {
    const sortIndex = buildState.methodMatches.findIndex(
      (m) => m.item.name === "sort"
    );
    const hasSortMethod = sortIndex >= 0;
    expect(hasSortMethod).toBe(true);

    const sortState = selectMethod(buildState, sortIndex);
    const arrowContext = sortState.builder!.arrowFnContext!;
    const updatedContext = { ...arrowContext, expression: "a - b" };
    const updatedBuilder = { ...sortState.builder!, arrowFnContext: updatedContext };
    const withExpr = { ...sortState, builder: updatedBuilder };
    const completed = completeArrowFn(withExpr);

    expect(completed.builder?.expression).toContain("(a, b) => a - b");
  });

  test("replaces (acc, x) => acc pattern for reduce", () => {
    const reduceIndex = buildState.methodMatches.findIndex(
      (m) => m.item.name === "reduce"
    );
    const hasReduceMethod = reduceIndex >= 0;
    expect(hasReduceMethod).toBe(true);

    const reduceState = selectMethod(buildState, reduceIndex);
    const arrowContext = reduceState.builder!.arrowFnContext!;
    const updatedContext = { ...arrowContext, expression: "acc + x" };
    const updatedBuilder = { ...reduceState.builder!, arrowFnContext: updatedContext };
    const withExpr = { ...reduceState, builder: updatedBuilder };
    const completed = completeArrowFn(withExpr);

    expect(completed.builder?.expression).toContain("(acc, x) => acc + x");
  });
});
