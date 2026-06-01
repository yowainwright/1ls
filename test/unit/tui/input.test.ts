import { describe, expect, test } from "bun:test";
import { enterBuildMode } from "../../../src/tui/builder";
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
