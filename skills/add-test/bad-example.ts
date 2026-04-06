/**
 * BAD: Anti-patterns for tests.
 *
 * Each block shows what NOT to do and why.
 * Compare with: good-example.ts
 */

import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { executeBuiltin } from "../../src/navigator/builtins";

// BAD: describe blocks — 1ls tests are flat test() calls
// Fix: remove describe, use descriptive test names instead
describe("head builtin", () => {
  test("returns first element", () => {
    expect(executeBuiltin("head", [1, 2, 3], [])).toBe(1);
  });
});

// BAD: beforeEach with shared state — tests should be self-contained
// Fix: put test data inline in each test
let sharedData: number[];
beforeEach(() => {
  sharedData = [1, 2, 3, 4, 5];
});
afterEach(() => {
  sharedData = [];
});
test("uses shared state", () => {
  expect(executeBuiltin("head", sharedData, [])).toBe(1);
});

// BAD: Mock — test real functions, not mocks
// Fix: call the actual function with real data
const mockBuiltin = mock(() => 42);
test("uses mock instead of real function", () => {
  mockBuiltin();
  expect(mockBuiltin).toHaveBeenCalled();
});

// BAD: No edge cases — only tests the happy path
// Fix: add tests for empty array, wrong type, boundary values
test("sum only tests happy path", () => {
  expect(executeBuiltin("sum", [1, 2, 3], [])).toBe(6);
});

// BAD: Multiple unrelated assertions in one test
// Fix: one assertion concept per test, split into separate tests
test("tests everything at once", () => {
  expect(executeBuiltin("head", [1, 2, 3], [])).toBe(1);
  expect(executeBuiltin("last", [1, 2, 3], [])).toBe(3);
  expect(executeBuiltin("tail", [1, 2, 3], [])).toEqual([2, 3]);
  expect(executeBuiltin("sum", [1, 2, 3], [])).toBe(6);
  expect(executeBuiltin("len", [1, 2, 3], [])).toBe(3);
});

// BAD: Vague test name — doesn't describe the behavior
// Fix: "head returns undefined for empty array"
test("it works", () => {
  expect(executeBuiltin("head", [], [])).toBeUndefined();
});

// BAD: External fixture file dependency — keep data inline
// Fix: use inline objects/arrays in the test
// import fixtures from "./fixtures/large-dataset.json";
// test("processes large dataset", () => {
//   expect(executeBuiltin("sum", fixtures.numbers, [])).toBe(5050);
// });

// BAD: Async test for a sync function — unnecessary complexity
// Fix: just call the function synchronously
test("unnecessary async", async () => {
  const result = await Promise.resolve(executeBuiltin("head", [1], []));
  expect(result).toBe(1);
});
