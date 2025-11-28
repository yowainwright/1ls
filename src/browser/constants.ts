import type { ShortcutMapping } from "../utils/types";

export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

export const SHORTCUTS: ShortcutMapping[] = [
  { short: ".mp", full: ".map", description: "Transform each element", type: "array" },
  { short: ".flt", full: ".filter", description: "Filter elements", type: "array" },
  { short: ".rd", full: ".reduce", description: "Reduce to single value", type: "array" },
  { short: ".fnd", full: ".find", description: "Find first match", type: "array" },
  { short: ".sm", full: ".some", description: "Test if any match", type: "array" },
  { short: ".evr", full: ".every", description: "Test if all match", type: "array" },
  { short: ".srt", full: ".sort", description: "Sort elements", type: "array" },
  { short: ".rvs", full: ".reverse", description: "Reverse order", type: "array" },
  { short: ".jn", full: ".join", description: "Join to string", type: "array" },
  { short: ".slc", full: ".slice", description: "Extract portion", type: "array" },
  { short: ".kys", full: ".{keys}", description: "Get object keys", type: "object" },
  { short: ".vls", full: ".{values}", description: "Get object values", type: "object" },
  { short: ".ents", full: ".{entries}", description: "Get object entries", type: "object" },
  { short: ".len", full: ".{length}", description: "Get length/size", type: "object" },
  { short: ".lc", full: ".toLowerCase", description: "Convert to lowercase", type: "string" },
  { short: ".uc", full: ".toUpperCase", description: "Convert to uppercase", type: "string" },
  { short: ".trm", full: ".trim", description: "Remove whitespace", type: "string" },
  { short: ".splt", full: ".split", description: "Split string to array", type: "string" },
  { short: ".incl", full: ".includes", description: "Check if includes", type: "array" },
];
