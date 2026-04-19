import type { Suggestion } from "./types";

export const MAX_SUGGESTIONS = 8;

export const SCORE_PREFIX_MATCH = 100;
export const SCORE_CONTAINS_MATCH = 50;
export const SCORE_FUZZY_MATCH = 25;

export const QUOTE_PATTERN = /['"]([^'"]*\.([a-zA-Z]*))?$/;
export const DOT_PATTERN = /\.([a-zA-Z]*)$/;

export const METHODS: Suggestion[] = [
  { name: "map", signature: ".map(x => ...)", description: "Transform each element", type: "method" },
  { name: "filter", signature: ".filter(x => ...)", description: "Filter by condition", type: "method" },
  { name: "find", signature: ".find(x => ...)", description: "Find first match", type: "method" },
  { name: "reduce", signature: ".reduce((a,x) => ..., init)", description: "Reduce to value", type: "method" },
  { name: "some", signature: ".some(x => ...)", description: "Test if any match", type: "method" },
  { name: "every", signature: ".every(x => ...)", description: "Test if all match", type: "method" },
  { name: "sort", signature: ".sort((a,b) => ...)", description: "Sort elements", type: "method" },
  { name: "slice", signature: ".slice(start, end)", description: "Get subset", type: "method" },
  { name: "join", signature: ".join(sep)", description: "Join to string", type: "method" },
  { name: "flat", signature: ".flat(depth)", description: "Flatten nested", type: "method" },
  { name: "includes", signature: ".includes(val)", description: "Check if contains", type: "method" },
  { name: "indexOf", signature: ".indexOf(val)", description: "Find index", type: "method" },
  { name: "length", signature: ".length", description: "Get length", type: "method" },
  { name: "toLowerCase", signature: ".toLowerCase()", description: "To lowercase", type: "method" },
  { name: "toUpperCase", signature: ".toUpperCase()", description: "To uppercase", type: "method" },
  { name: "trim", signature: ".trim()", description: "Remove whitespace", type: "method" },
  { name: "split", signature: ".split(sep)", description: "Split to array", type: "method" },
  { name: "replace", signature: ".replace(a, b)", description: "Replace text", type: "method" },
  { name: "startsWith", signature: ".startsWith(s)", description: "Check prefix", type: "method" },
  { name: "endsWith", signature: ".endsWith(s)", description: "Check suffix", type: "method" },
];

export const BUILTINS: Suggestion[] = [
  { name: "head", signature: ".head()", description: "First element", type: "builtin" },
  { name: "last", signature: ".last()", description: "Last element", type: "builtin" },
  { name: "tail", signature: ".tail()", description: "All but first", type: "builtin" },
  { name: "take", signature: ".take(n)", description: "First n elements", type: "builtin" },
  { name: "drop", signature: ".drop(n)", description: "Skip first n", type: "builtin" },
  { name: "uniq", signature: ".uniq()", description: "Remove duplicates", type: "builtin" },
  { name: "flatten", signature: ".flatten()", description: "Flatten nested", type: "builtin" },
  { name: "compact", signature: ".compact()", description: "Remove falsy", type: "builtin" },
  { name: "chunk", signature: ".chunk(n)", description: "Split into chunks", type: "builtin" },
  { name: "groupBy", signature: ".groupBy(fn)", description: "Group by key", type: "builtin" },
  { name: "sortBy", signature: ".sortBy(fn)", description: "Sort by key", type: "builtin" },
  { name: "pluck", signature: ".pluck(key)", description: "Extract property", type: "builtin" },
  { name: "sum", signature: ".sum()", description: "Sum numbers", type: "builtin" },
  { name: "mean", signature: ".mean()", description: "Average", type: "builtin" },
  { name: "min", signature: ".min()", description: "Minimum value", type: "builtin" },
  { name: "max", signature: ".max()", description: "Maximum value", type: "builtin" },
  { name: "keys", signature: ".keys()", description: "Object keys", type: "builtin" },
  { name: "vals", signature: ".vals()", description: "Object values", type: "builtin" },
  { name: "pick", signature: ".pick(k1, k2)", description: "Pick keys", type: "builtin" },
  { name: "omit", signature: ".omit(k1, k2)", description: "Omit keys", type: "builtin" },
  { name: "merge", signature: ".merge(obj)", description: "Merge objects", type: "builtin" },
  { name: "len", signature: ".len()", description: "Get length", type: "builtin" },
  { name: "type", signature: ".type()", description: "Get type", type: "builtin" },
  { name: "isEmpty", signature: ".isEmpty()", description: "Check if empty", type: "builtin" },
];

export const SHORTCUTS: Suggestion[] = [
  { name: "mp", signature: ".mp(x => ...)", description: "map shortcut", type: "shortcut" },
  { name: "flt", signature: ".flt(x => ...)", description: "filter shortcut", type: "shortcut" },
  { name: "fnd", signature: ".fnd(x => ...)", description: "find shortcut", type: "shortcut" },
  { name: "rd", signature: ".rd((a,x) => ..., init)", description: "reduce shortcut", type: "shortcut" },
  { name: "kys", signature: ".kys", description: "keys shortcut", type: "shortcut" },
  { name: "vls", signature: ".vls", description: "values shortcut", type: "shortcut" },
  { name: "lc", signature: ".lc()", description: "toLowerCase shortcut", type: "shortcut" },
  { name: "uc", signature: ".uc()", description: "toUpperCase shortcut", type: "shortcut" },
  { name: "trm", signature: ".trm()", description: "trim shortcut", type: "shortcut" },
];

export const ALL_SUGGESTIONS: Suggestion[] = [...METHODS, ...BUILTINS, ...SHORTCUTS];
