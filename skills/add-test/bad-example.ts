/**
 * BAD: Anti-patterns for tests.
 *
 * Each block shows what NOT to do and why.
 * Compare with: good-example.ts
 */

import { afterEach, beforeEach, describe, mock, test } from "node:test";
import assert from "node:assert/strict";
import { executeBuiltin } from "../../src/navigator/builtins";

// BAD: describe blocks — 1ls tests are flat test() calls
// Fix: remove describe, use descriptive test names instead
describe("head builtin", () => {
  test("returns first element", () => {
    assert.strictEqual(executeBuiltin("head", [1, 2, 3], []), 1);
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
  assert.strictEqual(executeBuiltin("head", sharedData, []), 1);
});

// BAD: Mock — test real functions, not mocks
// Fix: call the actual function with real data
const mockBuiltin = mock.fn(() => 42);
test("uses mock instead of real function", () => {
  mockBuiltin();
  assert.ok(mockBuiltin.mock.calls.length > 0);
});

// BAD: No edge cases — only tests the happy path
// Fix: add tests for empty array, wrong type, boundary values
test("sum only tests happy path", () => {
  assert.strictEqual(executeBuiltin("sum", [1, 2, 3], []), 6);
});

// BAD: Multiple unrelated assertions in one test
// Fix: one assertion concept per test, split into separate tests
test("tests everything at once", () => {
  assert.strictEqual(executeBuiltin("head", [1, 2, 3], []), 1);
  assert.strictEqual(executeBuiltin("last", [1, 2, 3], []), 3);
  assert.deepStrictEqual(executeBuiltin("tail", [1, 2, 3], []), [2, 3]);
  assert.strictEqual(executeBuiltin("sum", [1, 2, 3], []), 6);
  assert.strictEqual(executeBuiltin("len", [1, 2, 3], []), 3);
});

// BAD: Vague test name — doesn't describe the behavior
// Fix: "head returns undefined for empty array"
test("it works", () => {
  assert.strictEqual(executeBuiltin("head", [], []), undefined);
});

// BAD: External fixture file dependency — keep data inline
// Fix: use inline objects/arrays in the test
// import fixtures from "./fixtures/large-dataset.json";
// test("processes large dataset", () => {
//   assert.strictEqual(executeBuiltin("sum", fixtures.numbers, []), 5050);
// });

// BAD: Async test for a sync function — unnecessary complexity
// Fix: just call the function synchronously
test("unnecessary async", async () => {
  const result = await Promise.resolve(executeBuiltin("head", [1], []));
  assert.strictEqual(result, 1);
});
