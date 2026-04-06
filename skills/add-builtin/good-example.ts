/**
 * GOOD: Builtin function examples following 1ls patterns.
 *
 * Each builtin is a pure function: (data: unknown, args: unknown[]) => unknown
 * - Type guard at the top
 * - Immutable transforms (spread, reduce, Object.fromEntries)
 * - QuickJS NG safe (no async, no Intl, no Node/Bun APIs)
 *
 * Reference: src/navigator/builtins/index.ts
 */

import type { BuiltinFn } from "../../src/navigator/builtins/types";

const isArray = (x: unknown): x is unknown[] => Array.isArray(x);
const isObject = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const isNumber = (x: unknown): x is number => typeof x === "number";
const isString = (x: unknown): x is string => typeof x === "string";

// GOOD: Simple array transform — guard, spread, return new array
const zip: BuiltinFn = (data, [other]) => {
  if (!isArray(data) || !isArray(other)) return [];
  const len = Math.min(data.length, (other as unknown[]).length);
  return Array.from({ length: len }, (_, i) => [data[i], (other as unknown[])[i]]);
};

// GOOD: Numeric builtin — guard, reduce, fallback for empty
const product: BuiltinFn = (data) => {
  if (!isArray(data) || data.length === 0) return 0;
  return data.reduce<number>((acc, val) => acc * (val as number), 1);
};

// GOOD: Object transform — guard, Object.fromEntries for immutability
const mapValues: BuiltinFn = (data, [fn]) => {
  if (!isObject(data)) return {};
  const transform = fn as (value: unknown) => unknown;
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, transform(v)]),
  );
};

// GOOD: String builtin — guard, return fallback for wrong type
const words: BuiltinFn = (data) => {
  if (!isString(data)) return [];
  return data.trim().split(/\s+/).filter((w) => w.length > 0);
};

// GOOD: Reduce with accumulator — no mutation
const frequencies: BuiltinFn = (data) => {
  if (!isArray(data)) return {};
  return data.reduce<Record<string, number>>((acc, item) => {
    const key = String(item);
    return { ...acc, [key]: (acc[key] || 0) + 1 };
  }, {});
};

// GOOD: Ternary over if/else for simple logic
const clamp: BuiltinFn = (data, [min, max]) => {
  if (!isNumber(data)) return null;
  const lo = min as number;
  const hi = max as number;
  return data < lo ? lo : data > hi ? hi : data;
};

export { zip, product, mapValues, words, frequencies, clamp };
