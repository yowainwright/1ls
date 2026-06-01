import { afterEach, describe, expect, test } from "bun:test";
import { setupErrorBoundary, teardownErrorBoundary } from "../../../src/tui/app";

const ERROR_BOUNDARY_EVENTS = [
  "uncaughtException",
  "unhandledRejection",
  "SIGINT",
  "SIGTERM",
] as const;

afterEach(() => {
  teardownErrorBoundary();
});

describe("tui/app", () => {
  test("setupErrorBoundary keeps one listener per process event", () => {
    const initialCounts = ERROR_BOUNDARY_EVENTS.map((event) => [
      event,
      process.listenerCount(event),
    ] as const);

    setupErrorBoundary();
    setupErrorBoundary();

    for (const [event, initialCount] of initialCounts) {
      expect(process.listenerCount(event)).toBe(initialCount + 1);
    }

    teardownErrorBoundary();

    for (const [event, initialCount] of initialCounts) {
      expect(process.listenerCount(event)).toBe(initialCount);
    }
  });
});
