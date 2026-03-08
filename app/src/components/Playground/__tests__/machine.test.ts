import { describe, test, expect, mock } from "bun:test";

mock.module("1ls/browser", () => ({
  evaluate: (data: unknown, expr: string) => {
    const fn = new Function("data", `with(data) { return data${expr} }`);
    return fn(data);
  },
  parseYAML: (s: string) => ({ raw: s }),
  parseCSV: (s: string) => s.split("\n").map((line) => line.split(",")),
  parseTOML: (s: string) => ({ raw: s }),
  expandShortcuts: (s: string) => s,
  shortenExpression: (s: string) => s,
}));

import { createActor, waitFor } from "xstate";
import { playgroundMachine } from "../machine";
import { States, MachineEvents, SANDBOX_STARTER, FORMAT_CONFIGS, DEFAULT_EXPRESSION } from "../constants";

describe("playgroundMachine — preset mode", () => {
  test("initializes with preset context (isSandbox=false)", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    const ctx = actor.getSnapshot().context;
    expect(ctx.isSandbox).toBe(false);
    expect(ctx.format).toBe("json");
    expect(ctx.input).toBe(FORMAT_CONFIGS.json.placeholder);
    expect(ctx.expression).toBe(DEFAULT_EXPRESSION);
    expect(ctx.showMinifiedExpression).toBe(false);
    actor.stop();
  });

  test("skips initializing → goes straight to ready", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    const snapshot = actor.getSnapshot();
    expect(snapshot.matches("ready")).toBe(true);
    actor.stop();
  });

  test("starts in shareIdle nested state", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    expect(actor.getSnapshot().matches({ ready: States.SHARE_IDLE })).toBe(true);
    actor.stop();
  });

  test("FORMAT_CHANGE updates format and input for preset", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.FORMAT_CHANGE, format: "yaml" });
    const ctx = actor.getSnapshot().context;
    expect(ctx.format).toBe("yaml");
    expect(ctx.input).toBe(FORMAT_CONFIGS.yaml.placeholder);
    actor.stop();
  });

  test("INPUT_CHANGE updates input", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.INPUT_CHANGE, input: "new input" });
    expect(actor.getSnapshot().context.input).toBe("new input");
    actor.stop();
  });

  test("EXPRESSION_CHANGE updates expression", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.EXPRESSION_CHANGE, expression: ".newExpr" });
    expect(actor.getSnapshot().context.expression).toBe(".newExpr");
    actor.stop();
  });

  test("TOGGLE_MINIFIED toggles showMinifiedExpression", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    expect(actor.getSnapshot().context.showMinifiedExpression).toBe(false);
    actor.send({ type: MachineEvents.TOGGLE_MINIFIED });
    expect(actor.getSnapshot().context.showMinifiedExpression).toBe(true);
    actor.send({ type: MachineEvents.TOGGLE_MINIFIED });
    expect(actor.getSnapshot().context.showMinifiedExpression).toBe(false);
    actor.stop();
  });

  test("FORMAT_DETECTED does not apply in preset mode (guard fails)", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    const originalFormat = actor.getSnapshot().context.format;
    actor.send({ type: MachineEvents.FORMAT_DETECTED, format: "yaml" });
    expect(actor.getSnapshot().context.format).toBe(originalFormat);
    actor.stop();
  });

  test("SHARE transitions to shareCopied", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.SHARE });
    expect(actor.getSnapshot().matches({ ready: States.SHARE_COPIED })).toBe(true);
    actor.stop();
  });
});

describe("playgroundMachine — sandbox mode", () => {
  test("initializes with sandbox context (isSandbox=true)", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    expect(actor.getSnapshot().context.isSandbox).toBe(true);
    actor.stop();
  });

  test("initial context uses SANDBOX_STARTER.json data", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    const ctx = actor.getSnapshot().context;
    expect(ctx.input).toBe(SANDBOX_STARTER.json.data);
    expect(ctx.expression).toBe(SANDBOX_STARTER.json.expression);
    actor.stop();
  });

  test("transitions to ready after actor resolves", async () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    const snapshot = await waitFor(actor, (s) => s.matches("ready"), { timeout: 3000 });
    expect(snapshot.matches("ready")).toBe(true);
    actor.stop();
  });

  test("FORMAT_DETECTED applies when isSandbox=true", async () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    await waitFor(actor, (s) => s.matches("ready"), { timeout: 3000 });
    actor.send({ type: MachineEvents.FORMAT_DETECTED, format: "csv" });
    expect(actor.getSnapshot().context.format).toBe("csv");
    actor.stop();
  });
});
