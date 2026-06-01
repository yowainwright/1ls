/**
 * BAD: Anti-patterns for builtin functions.
 *
 * Each block shows what NOT to do and why.
 * These compile but violate 1ls conventions.
 *
 * Compare with: good-example.ts
 */

import type { BuiltinFn } from "../../src/navigator/builtins/types";

// BAD: Mutates input data — .sort() modifies the original array
// Fix: use [...data].sort() to create a copy first
const medianMutates: BuiltinFn = (data) => {
  const arr = data as number[];
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr[mid];
};

// BAD: No type guard — crashes on non-array input
// Fix: check isArray(data) at the top, return fallback
const zipNoGuard: BuiltinFn = (data, [other]) => {
  return (data as unknown[]).map((item, i) => [item, (other as unknown[])[i]]);
};

// BAD: Uses async/await — not available in QuickJS NG CLI context
// Fix: keep builtins synchronous, no Promises
const fetchData = async (data: unknown) => {
  const response = await fetch(String(data));
  return response.json();
};

// BAD: Uses Intl — not available in QuickJS NG (no ICU)
// Fix: use manual string comparison or locale-free sorting
const sortLocale: BuiltinFn = (data) => {
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) =>
    new Intl.Collator("en").compare(String(a), String(b)),
  );
};

// BAD: Uses structuredClone — not in QuickJS NG
// Fix: use { ...obj } for shallow clone or JSON.parse(JSON.stringify(obj)) for deep
const cloneData: BuiltinFn = (data) => {
  return structuredClone(data);
};

// BAD: Side effects in a pure function — console.log, writing to external state
// Fix: builtins should only transform data and return it
let callCount = 0;
const countedSum: BuiltinFn = (data) => {
  callCount++;
  console.log(`Called ${callCount} times`);
  if (!Array.isArray(data)) return 0;
  return data.reduce((a, b) => (a as number) + (b as number), 0);
};

// BAD: Over-engineered — class wrapper for a simple pure function
// Fix: just write a plain function, no abstractions
class BuiltinFactory {
  private name: string;
  constructor(name: string) {
    this.name = name;
  }
  create(): BuiltinFn {
    return (data) => {
      if (!Array.isArray(data)) return [];
      return [...data].reverse();
    };
  }
}
const reverseOverEngineered = new BuiltinFactory("reverse").create();

// BAD: Uses regex lookbehind — not supported in all QuickJS NG builds
// Fix: use lookahead, capturing groups, or manual string parsing
const splitCamelCase: BuiltinFn = (data) => {
  if (typeof data !== "string") return [];
  return data.split(/(?<=[a-z])(?=[A-Z])/);
};

// BAD: Uses TextEncoder — not available in QuickJS NG
// Fix: use manual byte counting if needed, or avoid altogether
const byteLength: BuiltinFn = (data) => {
  if (typeof data !== "string") return 0;
  return new TextEncoder().encode(data).length;
};

// BAD: Unnecessary comments on self-evident code
// Fix: no comments unless the logic is non-obvious
// This function returns the first element of an array
// It checks if the input is an array first
// If not, it returns undefined
const headWithComments: BuiltinFn = (data) => {
  // Check if data is an array
  if (!Array.isArray(data)) return undefined;
  // Return the first element
  return data[0];
};

export {
  medianMutates,
  zipNoGuard,
  fetchData,
  sortLocale,
  cloneData,
  countedSum,
  reverseOverEngineered,
  splitCamelCase,
  byteLength,
  headWithComments,
};
