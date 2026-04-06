/**
 * GOOD: Test examples following 1ls patterns.
 *
 * - Flat test() calls, no describe blocks
 * - No mocks, no beforeEach/afterEach
 * - Inline data, self-contained tests
 * - Edge cases: empty, wrong type, boundary
 *
 * Reference: test/unit/builtins.test.ts, test/unit/navigator.test.ts
 */

import { test, expect } from "bun:test";
import { executeBuiltin } from "../../src/navigator/builtins";
import { evaluate } from "../../src/browser";

// GOOD: Flat test, direct function call, inline data
test("head returns first element", () => {
  expect(executeBuiltin("head", [1, 2, 3], [])).toBe(1);
});

// GOOD: Tests edge case — empty array
test("head returns undefined for empty array", () => {
  expect(executeBuiltin("head", [], [])).toBeUndefined();
});

// GOOD: Tests wrong input type — builtin returns fallback
test("head returns undefined for non-array", () => {
  expect(executeBuiltin("head", "not array", [])).toBeUndefined();
});

// GOOD: End-to-end via evaluate — tests the full pipeline
test("evaluate: .map transforms array", () => {
  expect(evaluate([1, 2, 3], ".map(x => x * 2)")).toEqual([2, 4, 6]);
});

// GOOD: Tests chained expressions
test("evaluate: filter then map", () => {
  const data = [1, 2, 3, 4, 5];
  expect(evaluate(data, ".filter(x => x > 2).map(x => x * 10)")).toEqual([30, 40, 50]);
});

// GOOD: Tests object operations
test("evaluate: .{keys} returns object keys", () => {
  expect(evaluate({ a: 1, b: 2 }, ".{keys}")).toEqual(["a", "b"]);
});

// GOOD: Tests builtin with function argument
test("groupBy groups by key function", () => {
  const data = [
    { type: "a", val: 1 },
    { type: "b", val: 2 },
    { type: "a", val: 3 },
  ];
  const fn = (x: { type: string }) => x.type;
  const result = executeBuiltin("groupBy", data, [fn]);
  expect(result).toEqual({
    a: [{ type: "a", val: 1 }, { type: "a", val: 3 }],
    b: [{ type: "b", val: 2 }],
  });
});

// GOOD: Tests numeric builtin with boundary
test("sum returns 0 for empty array", () => {
  expect(executeBuiltin("sum", [], [])).toBe(0);
});

// GOOD: Tests non-array input returns numeric fallback
test("sum returns 0 for non-array", () => {
  expect(executeBuiltin("sum", "string", [])).toBe(0);
});
