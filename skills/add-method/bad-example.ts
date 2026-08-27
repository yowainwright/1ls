/**
 * BAD: Common mistakes in method entries.
 *
 * Each block shows a mistake that silently breaks the autocomplete.
 * Compare with: good-example.ts
 */
import type { Suggestion } from "../../src/ac/types";

// BAD: name doesn't match expression syntax — user types "filter" but name is "filterBy"
// Fix: name must be the exact token the user types in the expression
const wrongName: Suggestion = {
  name: "filterBy", // user types ".filter", not ".filterBy"
  signature: ".filter(x => ...)",
  description: "Filter items",
  type: "method",
  insertText: ".filter(x => x)",
};

// BAD: description is too long — overflows the tooltip line
// Fix: ≤ 6 words, one short phrase, no period
const longDescription: Suggestion = {
  name: "reduce",
  signature: ".reduce((acc, x) => ..., initial)",
  description:
    "Reduces an array by iterating over all elements and accumulating a single result value",
  type: "method",
  insertText: ".reduce((acc, x) => acc, 0)",
};

// BAD: insertText is not a runnable expression — Tab-complete inserts broken code
// Fix: insertText must evaluate without syntax errors
const brokenTemplate: Suggestion = {
  name: "map",
  signature: ".map(fn)",
  description: "Transform each item",
  type: "method",
  insertText: ".map(/* your fn here */)", // syntax error in expression engine
};

// BAD: type is "builtin" but "sumAll" is not in BUILTIN_FUNCTIONS
// Fix: verify the name exists in src/navigator/builtins/constants.ts before setting type
const nonExistentBuiltin: Suggestion = {
  name: "sumAll",
  signature: "sumAll",
  description: "Sum all values",
  type: "builtin", // "sumAll" is not registered
  insertText: "sumAll",
};

// BAD: duplicate name in the same type array — fuzzy search shows the hint twice
// Fix: search the constants file for the name before adding
const duplicateFilter: Suggestion = {
  name: "filter", // already in METHODS
  signature: ".filter(predicate)",
  description: "Filter by predicate",
  type: "method",
  insertText: ".filter(x => x)",
};

export { wrongName, longDescription, brokenTemplate, nonExistentBuiltin, duplicateFilter };
