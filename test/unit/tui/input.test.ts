import { describe, expect, test } from "bun:test";
import { enterBuildMode, selectMethod } from "../../../src/tui/builder";
import { handleInput } from "../../../src/tui/input";
import { navigateJson } from "../../../src/tui/navigator";
import { createInitialState } from "../../../src/tui/state";

describe("interactive input", () => {
  test("enter in explore mode returns the selected path expression", () => {
    const data = { name: "Ada" };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);

    const result = handleInput(state, Buffer.from("\r"));

    expect(result.state).toBeNull();
    expect(result.output).toBe(".name");
  });

  test("enter in build mode returns the builder expression", () => {
    const data = { users: [{ name: "Ada" }] };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);
    const buildState = enterBuildMode(state);

    const result = handleInput(buildState, Buffer.from("\r"));

    expect(result.state).toBeNull();
    expect(result.output).toBe(".users");
  });

  test("escape in build mode returns to explore mode", () => {
    const data = { users: [{ name: "Ada" }] };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);
    const buildState = enterBuildMode(state);

    const result = handleInput(buildState, Buffer.from("\x1b"));

    expect(result.state?.mode).toBe("explore");
    expect(result.state?.builder).toBeNull();
    expect(result.output).toBeNull();
  });

  test("escape in arrow function mode cancels the arrow function only", () => {
    const data = { users: [{ name: "Ada" }] };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);
    const buildState = enterBuildMode(state);
    const arrowState = selectMethod(buildState, 0);

    expect(arrowState.mode).toBe("build-arrow-fn");

    const result = handleInput(arrowState, Buffer.from("\x1b"));

    expect(result.state?.mode).toBe("build");
    expect(result.state?.builder?.expression).toBe(".users");
    expect(result.state?.builder?.arrowFnContext).toBeNull();
    expect(result.output).toBeNull();
  });

  test("ctrl+c in build mode exits the app", () => {
    const data = { users: [{ name: "Ada" }] };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);
    const buildState = enterBuildMode(state);

    const result = handleInput(buildState, Buffer.from("\x03"));

    expect(result.state).toBeNull();
    expect(result.output).toBeNull();
  });

  test("ctrl+c in arrow function mode exits the app", () => {
    const data = { users: [{ name: "Ada" }] };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);
    const buildState = enterBuildMode(state);
    const arrowState = selectMethod(buildState, 0);

    expect(arrowState.mode).toBe("build-arrow-fn");

    const result = handleInput(arrowState, Buffer.from("\x03"));

    expect(result.state).toBeNull();
    expect(result.output).toBeNull();
  });

  test("q exits explore mode when query is empty", () => {
    const data = { query: "Ada" };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);

    const result = handleInput(state, Buffer.from("q"));

    expect(result.state).toBeNull();
    expect(result.output).toBeNull();
  });

  test("q is appended to a non-empty explore query", () => {
    const data = { query: "Ada" };
    const paths = navigateJson(data);
    const state = createInitialState(paths, data);
    const queriedState = handleInput(state, Buffer.from("u")).state!;

    const result = handleInput(queriedState, Buffer.from("q"));

    expect(result.state).not.toBeNull();
    expect(result.state?.query).toBe("uq");
    expect(result.output).toBeNull();
  });
});
