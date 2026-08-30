import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createActor, waitFor } from "xstate";
import { playgroundMachine } from "../machine";
import { States, MachineEvents, SANDBOX_STARTER, FORMAT_CONFIGS, DEFAULT_EXPRESSION } from "../constants";

describe("playgroundMachine — preset mode", () => {
  test("initializes with preset context (isSandbox=false)", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    const ctx = actor.getSnapshot().context;
    assert.strictEqual(ctx.isSandbox, false);
    assert.strictEqual(ctx.format, "json");
    assert.strictEqual(ctx.input, FORMAT_CONFIGS.json.placeholder);
    assert.strictEqual(ctx.expression, DEFAULT_EXPRESSION);
    assert.strictEqual(ctx.showMinifiedExpression, false);
    actor.stop();
  });

  test("skips initializing → goes straight to ready", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    const snapshot = actor.getSnapshot();
    assert.strictEqual(snapshot.matches("ready"), true);
    actor.stop();
  });

  test("starts in shareIdle nested state", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    assert.strictEqual(actor.getSnapshot().matches({ ready: States.SHARE_IDLE }), true);
    actor.stop();
  });

  test("FORMAT_CHANGE updates format and input for preset", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.FORMAT_CHANGE, format: "yaml" });
    const ctx = actor.getSnapshot().context;
    assert.strictEqual(ctx.format, "yaml");
    assert.strictEqual(ctx.input, FORMAT_CONFIGS.yaml.placeholder);
    actor.stop();
  });

  test("INPUT_CHANGE updates input", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.INPUT_CHANGE, input: "new input" });
    assert.strictEqual(actor.getSnapshot().context.input, "new input");
    actor.stop();
  });

  test("EXPRESSION_CHANGE updates expression", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.EXPRESSION_CHANGE, expression: ".newExpr" });
    assert.strictEqual(actor.getSnapshot().context.expression, ".newExpr");
    actor.stop();
  });

  test("TOGGLE_MINIFIED toggles showMinifiedExpression", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    assert.strictEqual(actor.getSnapshot().context.showMinifiedExpression, false);
    actor.send({ type: MachineEvents.TOGGLE_MINIFIED });
    assert.strictEqual(actor.getSnapshot().context.showMinifiedExpression, true);
    actor.send({ type: MachineEvents.TOGGLE_MINIFIED });
    assert.strictEqual(actor.getSnapshot().context.showMinifiedExpression, false);
    actor.stop();
  });

  test("FORMAT_DETECTED does not apply in preset mode (guard fails)", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    const originalFormat = actor.getSnapshot().context.format;
    actor.send({ type: MachineEvents.FORMAT_DETECTED, format: "yaml" });
    assert.strictEqual(actor.getSnapshot().context.format, originalFormat);
    actor.stop();
  });

  test("SHARE transitions to shareCopied", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "preset" } });
    actor.start();
    actor.send({ type: MachineEvents.SHARE });
    assert.strictEqual(actor.getSnapshot().matches({ ready: States.SHARE_COPIED }), true);
    actor.stop();
  });
});

describe("playgroundMachine — sandbox mode", () => {
  test("initializes with sandbox context (isSandbox=true)", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    assert.strictEqual(actor.getSnapshot().context.isSandbox, true);
    actor.stop();
  });

  test("initial context uses SANDBOX_STARTER.json data", () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    const ctx = actor.getSnapshot().context;
    assert.strictEqual(ctx.input, SANDBOX_STARTER.json.data);
    assert.strictEqual(ctx.expression, SANDBOX_STARTER.json.expression);
    actor.stop();
  });

  test("transitions to ready after actor resolves", async () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    const snapshot = await waitFor(actor, (s) => s.matches("ready"), { timeout: 3000 });
    assert.strictEqual(snapshot.matches("ready"), true);
    actor.stop();
  });

  test("FORMAT_DETECTED applies when isSandbox=true", async () => {
    const actor = createActor(playgroundMachine, { input: { mode: "sandbox" } });
    actor.start();
    await waitFor(actor, (s) => s.matches("ready"), { timeout: 3000 });
    actor.send({ type: MachineEvents.FORMAT_DETECTED, format: "csv" });
    assert.strictEqual(actor.getSnapshot().context.format, "csv");
    actor.stop();
  });
});
