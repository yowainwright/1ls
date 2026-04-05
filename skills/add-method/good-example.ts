/**
 * GOOD: Method entries for the interactive autocomplete registry.
 *
 * Each entry drives the tooltip in `1ls -i`.
 * Reference: src/interactive/methods/constants.ts, src/interactive/methods/types.ts
 */
import type { Method } from "../../src/interactive/methods/types";

// GOOD: Native JS method — name matches expression syntax, working template, short description
const findLast: Method = {
  name: "findLast",
  signature: ".findLast(x => ...)",
  description: "Find last matching item",
  template: ".findLast(x => x)",
  category: "Search",
};

// GOOD: 1ls builtin — isBuiltin: true, name matches BUILTIN_FUNCTIONS key exactly
const median: Method = {
  name: "median",
  signature: "median",
  description: "Median of array values",
  template: "median",
  category: "Aggregate",
  isBuiltin: true,
};

// GOOD: Universal builtin (no type restriction) — goes in UNIVERSAL_BUILTINS
const keys: Method = {
  name: "keys",
  signature: ".keys",
  description: "Array of all keys",
  template: ".keys",
  category: "Access",
};

// GOOD: Builtin with arrow fn — template is a complete, runnable expression
const groupBy: Method = {
  name: "groupBy",
  signature: "groupBy(x => ...)",
  description: "Group items by key",
  template: "groupBy(x => x)",
  category: "Aggregate",
  isBuiltin: true,
};

export { findLast, median, keys, groupBy };
