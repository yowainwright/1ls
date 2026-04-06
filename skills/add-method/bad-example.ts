/**
 * BAD: Common mistakes in method entries.
 *
 * Each block shows a mistake that silently breaks the autocomplete.
 * Compare with: good-example.ts
 */
import type { Method } from "../../src/interactive/methods/types";

// BAD: name doesn't match expression syntax — user types "filter" but name is "filterBy"
// Fix: name must be the exact token the user types in the expression
const wrongName: Method = {
  name: "filterBy",               // user types ".filter", not ".filterBy"
  signature: ".filter(x => ...)",
  description: "Filter items",
  template: ".filter(x => x)",
};

// BAD: description is too long — overflows the tooltip line
// Fix: ≤ 6 words, one short phrase, no period
const longDescription: Method = {
  name: "reduce",
  signature: ".reduce((acc, x) => ..., initial)",
  description: "Reduces an array by iterating over all elements and accumulating a single result value",
  template: ".reduce((acc, x) => acc, 0)",
};

// BAD: template is not a runnable expression — Tab-complete inserts broken code
// Fix: template must evaluate without syntax errors
const brokenTemplate: Method = {
  name: "map",
  signature: ".map(fn)",
  description: "Transform each item",
  template: ".map(/* your fn here */)",    // syntax error in expression engine
};

// BAD: isBuiltin: true but "sumAll" is not in BUILTIN_FUNCTIONS
// Fix: verify the name exists in src/navigator/builtins/constants.ts before setting isBuiltin
const nonExistentBuiltin: Method = {
  name: "sumAll",
  signature: "sumAll",
  description: "Sum all values",
  template: "sumAll",
  isBuiltin: true,                          // "sumAll" is not registered
};

// BAD: duplicate name in the same type array — fuzzy search shows the hint twice
// Fix: search the constants file for the name before adding
const duplicateFilter: Method = {
  name: "filter",                           // already in ARRAY_METHODS
  signature: ".filter(predicate)",
  description: "Filter by predicate",
  template: ".filter(x => x)",
};

export { wrongName, longDescription, brokenTemplate, nonExistentBuiltin, duplicateFilter };
