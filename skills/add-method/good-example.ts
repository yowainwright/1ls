/**
 * GOOD: Suggestions for the autocomplete registry.
 *
 * Each entry drives the inline tooltip.
 * Reference: src/ac/constants.ts, src/ac/types.ts
 */
import type { Suggestion } from "../../src/ac/types";

// GOOD: Native JS method — name matches expression syntax, working insert text, short description
const findLast: Suggestion = {
  name: "findLast",
  signature: ".findLast(x => ...)",
  description: "Find last matching item",
  type: "method",
  insertText: ".findLast(x => x)",
};

// GOOD: 1ls builtin — name matches BUILTIN_FUNCTIONS key exactly
const median: Suggestion = {
  name: "median",
  signature: "median",
  description: "Median of array values",
  type: "builtin",
  insertText: "median",
};

// GOOD: Object suggestion — include the name in OBJECT_SUGGESTIONS
const keys: Suggestion = {
  name: "keys",
  signature: ".keys",
  description: "Array of all keys",
  type: "builtin",
  insertText: ".keys",
};

// GOOD: Builtin with arrow fn — insertText is a complete, runnable expression
const groupBy: Suggestion = {
  name: "groupBy",
  signature: "groupBy(x => ...)",
  description: "Group items by key",
  type: "builtin",
  insertText: "groupBy(x => x)",
};

export { findLast, median, keys, groupBy };
