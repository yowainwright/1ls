/**
 * GOOD: QuickJS NG compatible code patterns.
 *
 * All code here uses only ES2023 APIs that work in both Bun and QuickJS NG.
 * No async, no Intl, no Node/Bun APIs, no regex lookbehind.
 *
 * Reference: src/navigator/builtins/utils.ts, src/formats/utils.ts
 */

// GOOD: Type guards — the foundation of safe code in 1ls
const isArray = (x: unknown): x is unknown[] => Array.isArray(x);
const isObject = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const isString = (x: unknown): x is string => typeof x === "string";
const isNumber = (x: unknown): x is number => typeof x === "number";
const isNil = (x: unknown): x is null | undefined => x === null || x === undefined;

// GOOD: Immutable sort — spread before sort
function sortNumbers(data: unknown): unknown[] {
  if (!isArray(data)) return [];
  return [...data].sort((a, b) => (a as number) - (b as number));
}

// GOOD: Deep clone via JSON round-trip (no structuredClone)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// GOOD: Shallow clone via spread
function shallowClone(obj: Record<string, unknown>): Record<string, unknown> {
  return { ...obj };
}

// GOOD: Object transform with Object.fromEntries (immutable)
function renameKeys(
  obj: Record<string, unknown>,
  mapping: Record<string, string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [mapping[k] || k, v]),
  );
}

// GOOD: String ops — all QJS-safe
function normalizeWhitespace(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

function capitalize(str: string): string {
  return str.length === 0 ? str : str[0].toUpperCase() + str.slice(1);
}

// GOOD: Regex without lookbehind — use capturing group instead
function splitOnTransition(str: string): string[] {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ");
}

// GOOD: Array.from for creating arrays (QJS-safe)
function range(start: number, end: number): number[] {
  const length = Math.max(0, end - start);
  return Array.from({ length }, (_, i) => start + i);
}

// GOOD: Set for dedup (basic Set usage is QJS-safe)
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

// GOOD: Reduce for accumulation — no mutation
function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFn(item);
    return { ...acc, [key]: [...(acc[key] || []), item] };
  }, {});
}

// GOOD: Map for caching (basic Map usage is QJS-safe)
// Use cache.has() — not !== undefined — so cached undefined values aren't re-computed
function memoize<T>(fn: (key: string) => T): (key: string) => T {
  const cache = new Map<string, T>();
  return (key: string): T => {
    if (cache.has(key)) return cache.get(key) as T;
    const result = fn(key);
    cache.set(key, result);
    return result;
  };
}

export {
  isArray, isObject, isString, isNumber, isNil,
  sortNumbers, deepClone, shallowClone, renameKeys,
  normalizeWhitespace, capitalize, splitOnTransition,
  range, unique, groupBy, memoize,
};
