import { describe, test, expect } from "bun:test";
import { FULL_QUERY, DEMO_STEPS, BASE_STEP_DURATION } from "../constants";

describe("DEMO_STEPS", () => {
  test("has at least one step", () => {
    expect(DEMO_STEPS.length).toBeGreaterThan(0);
  });

  test("each step has required properties", () => {
    DEMO_STEPS.forEach((step) => {
      expect(typeof step.triggerAt).toBe("number");
      expect(typeof step.charEnd).toBe("number");
      expect(Array.isArray(step.hints)).toBe(true);
      expect(typeof step.description).toBe("object");
      expect(typeof step.description.title).toBe("string");
      expect(typeof step.description.text).toBe("string");
    });
  });

  test("charEnd values are monotonically non-decreasing", () => {
    for (let i = 1; i < DEMO_STEPS.length; i++) {
      expect(DEMO_STEPS[i].charEnd).toBeGreaterThanOrEqual(DEMO_STEPS[i - 1].charEnd);
    }
  });

  test("last step charEnd equals FULL_QUERY.length", () => {
    const last = DEMO_STEPS[DEMO_STEPS.length - 1];
    expect(last.charEnd).toBe(FULL_QUERY.length);
  });

  test("triggerAt is less than or equal to charEnd for each step", () => {
    DEMO_STEPS.forEach((step) => {
      expect(step.triggerAt).toBeLessThanOrEqual(step.charEnd);
    });
  });
});

describe("FULL_QUERY", () => {
  test("is a non-empty string", () => {
    expect(typeof FULL_QUERY).toBe("string");
    expect(FULL_QUERY.length).toBeGreaterThan(0);
  });
});

describe("BASE_STEP_DURATION", () => {
  test("is a positive number", () => {
    expect(typeof BASE_STEP_DURATION).toBe("number");
    expect(BASE_STEP_DURATION).toBeGreaterThan(0);
  });
});
