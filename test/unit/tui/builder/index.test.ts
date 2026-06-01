import { describe, expect, test } from "bun:test";
import {
  completeArrowFn,
  enterBuildMode,
  selectMethod,
  undoLastSegment,
  updateArrowFnExpression,
  updateBuildQuery,
} from "../../../../src/tui/builder";
import { navigateJson } from "../../../../src/tui/navigator";
import { createInitialState } from "../../../../src/tui/state";
import type { State } from "../../../../src/tui/types";

const buildMethodWithProperty = (
  state: State,
  methodName: string,
  propertyPath: string,
): State => {
  const filtered = updateBuildQuery(state, methodName);
  const methodState = selectMethod(filtered, 0);
  const paramPaths = methodState.builder?.arrowFnContext?.paramPaths || [];
  const propertyPathIndex = paramPaths.findIndex((path) => path.path === propertyPath);

  expect(propertyPathIndex).toBeGreaterThanOrEqual(0);

  const withProperty = updateArrowFnExpression(methodState, propertyPathIndex);
  return completeArrowFn(withProperty);
};

describe("tui/builder", () => {
  test("undoLastSegment removes the last method without splitting arrow property access", () => {
    const data = {
      users: [
        { id: 1, name: "Ada", email: "ada@example.com" },
        { id: 2, name: "Grace", email: "grace@example.com" },
      ],
    };
    const paths = navigateJson(data);
    const initialState = createInitialState(paths, data);
    const buildState = enterBuildMode(initialState);
    const afterFilter = buildMethodWithProperty(buildState, "filter", ".name");
    const afterMap = buildMethodWithProperty(afterFilter, "map", ".email");

    expect(afterMap.builder?.expression).toBe(
      ".users.filter(x => x.name).map(x => x.email)"
    );

    const afterUndo = undoLastSegment(afterMap);

    expect(afterUndo.mode).toBe("build");
    expect(afterUndo.builder?.expression).toBe(".users.filter(x => x.name)");
  });

  test("undoLastSegment exits build mode after removing the only method", () => {
    const data = { users: [{ id: 1, name: "Ada" }] };
    const paths = navigateJson(data);
    const initialState = createInitialState(paths, data);
    const buildState = enterBuildMode(initialState);
    const afterFilter = buildMethodWithProperty(buildState, "filter", ".name");

    const afterUndo = undoLastSegment(afterFilter);

    expect(afterUndo.mode).toBe("explore");
    expect(afterUndo.builder).toBeNull();
  });
});
