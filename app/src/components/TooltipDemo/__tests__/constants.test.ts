import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { FULL_QUERY, DEMO_STEPS, BASE_STEP_DURATION } from "../constants";

describe("DEMO_STEPS", () => {
  test("has at least one step", () => {
    assert.ok(DEMO_STEPS.length > 0);
  });

  test("each step has required properties", () => {
    DEMO_STEPS.forEach((step) => {
      assert.strictEqual(typeof step.triggerAt, "number");
      assert.strictEqual(typeof step.charEnd, "number");
      assert.strictEqual(Array.isArray(step.hints), true);
      assert.strictEqual(typeof step.description, "object");
      assert.strictEqual(typeof step.description.title, "string");
      assert.strictEqual(typeof step.description.text, "string");
    });
  });

  test("charEnd values are monotonically non-decreasing", () => {
    for (let i = 1; i < DEMO_STEPS.length; i++) {
      assert.ok(DEMO_STEPS[i].charEnd >= DEMO_STEPS[i - 1].charEnd);
    }
  });

  test("last step charEnd equals FULL_QUERY.length", () => {
    const last = DEMO_STEPS[DEMO_STEPS.length - 1];
    assert.strictEqual(last.charEnd, FULL_QUERY.length);
  });

  test("triggerAt is less than or equal to charEnd for each step", () => {
    DEMO_STEPS.forEach((step) => {
      assert.ok(step.triggerAt <= step.charEnd);
    });
  });
});

describe("FULL_QUERY", () => {
  test("is a non-empty string", () => {
    assert.strictEqual(typeof FULL_QUERY, "string");
    assert.ok(FULL_QUERY.length > 0);
  });
});

describe("BASE_STEP_DURATION", () => {
  test("is a positive number", () => {
    assert.strictEqual(typeof BASE_STEP_DURATION, "number");
    assert.ok(BASE_STEP_DURATION > 0);
  });
});
