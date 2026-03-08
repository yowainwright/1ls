import { describe, test, expect, mock } from "bun:test";

mock.module("1ls/browser", () => ({
  evaluate: () => null,
  parseYAML: (s: string) => ({ raw: s }),
  parseCSV: (s: string) => s.split("\n").map((line) => line.split(",")),
  parseTOML: (s: string) => ({ raw: s }),
  expandShortcuts: (s: string) => s,
  shortenExpression: (s: string) => s,
}));

mock.module("../storage", () => ({
  getStateFromUrl: () => null,
  saveState: () => ({}),
  loadState: () => ({}),
}));

import {
  computeFormatChange,
  isSandboxGuard,
  persistPlaygroundState,
  loadInitialStateActor,
} from "../utils";
import { SANDBOX_STARTER, FORMAT_CONFIGS, FORMATS } from "../constants";
import type { PlaygroundContext } from "../types";

const baseContext: PlaygroundContext = {
  isSandbox: false,
  format: "json",
  input: FORMAT_CONFIGS.json.placeholder,
  expression: ".test",
  showMinifiedExpression: false,
};

const sandboxContext: PlaygroundContext = {
  ...baseContext,
  isSandbox: true,
  input: SANDBOX_STARTER.json.data,
  expression: SANDBOX_STARTER.json.expression,
};

describe("computeFormatChange", () => {
  test("sandbox context returns SANDBOX_STARTER data and expression", () => {
    const result = computeFormatChange(sandboxContext, "json");
    expect(result.format).toBe("json");
    expect(result.input).toBe(SANDBOX_STARTER.json.data);
    expect(result.expression).toBe(SANDBOX_STARTER.json.expression);
  });

  test("preset context returns FORMAT_CONFIGS placeholder", () => {
    const result = computeFormatChange(baseContext, "json");
    expect(result.format).toBe("json");
    expect(result.input).toBe(FORMAT_CONFIGS.json.placeholder);
  });

  test("preset context returns first suggestion expression", () => {
    const result = computeFormatChange(baseContext, "json");
    expect(result.expression).toBe(FORMAT_CONFIGS.json.suggestions[0]?.expression ?? ".");
  });

  test.each(FORMATS)("sandbox: format=%s uses SANDBOX_STARTER", (format) => {
    const result = computeFormatChange(sandboxContext, format);
    expect(result.format).toBe(format);
    expect(result.input).toBe(SANDBOX_STARTER[format].data);
    expect(result.expression).toBe(SANDBOX_STARTER[format].expression);
  });

  test.each(FORMATS)("preset: format=%s uses FORMAT_CONFIGS", (format) => {
    const result = computeFormatChange(baseContext, format);
    expect(result.format).toBe(format);
    expect(result.input).toBe(FORMAT_CONFIGS[format].placeholder);
  });
});

describe("isSandboxGuard", () => {
  test("returns true when context.isSandbox=true", () => {
    expect(isSandboxGuard({ context: sandboxContext })).toBe(true);
  });

  test("returns false when context.isSandbox=false", () => {
    expect(isSandboxGuard({ context: baseContext })).toBe(false);
  });
});

describe("persistPlaygroundState", () => {
  test("exits early and does not throw when isSandbox=false", () => {
    expect(() => persistPlaygroundState({ context: baseContext })).not.toThrow();
  });
});

describe("loadInitialStateActor", () => {
  test("returns null for non-sandbox mode", async () => {
    const result = await loadInitialStateActor({ input: { isSandbox: false } });
    expect(result).toBeNull();
  });
});
