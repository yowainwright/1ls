import type { ShortcutMapping } from "./types";
import { escapeRegExp } from "./index";

// Memorable shortcuts for common operations
export const SHORTCUTS: ShortcutMapping[] = [
  // Array methods
  {
    short: ".mp",
    full: ".map",
    description: "Transform each element",
    type: "array",
  },
  {
    short: ".flt",
    full: ".filter",
    description: "Filter elements",
    type: "array",
  },
  {
    short: ".rd",
    full: ".reduce",
    description: "Reduce to single value",
    type: "array",
  },
  {
    short: ".fnd",
    full: ".find",
    description: "Find first match",
    type: "array",
  },
  {
    short: ".fndIdx",
    full: ".findIndex",
    description: "Find index of first match",
    type: "array",
  },
  {
    short: ".sm",
    full: ".some",
    description: "Test if any match",
    type: "array",
  },
  {
    short: ".evr",
    full: ".every",
    description: "Test if all match",
    type: "array",
  },
  { short: ".srt", full: ".sort", description: "Sort elements", type: "array" },
  {
    short: ".rvs",
    full: ".reverse",
    description: "Reverse order",
    type: "array",
  },
  { short: ".jn", full: ".join", description: "Join to string", type: "array" },
  {
    short: ".slc",
    full: ".slice",
    description: "Extract portion",
    type: "array",
  },
  {
    short: ".splt",
    full: ".split",
    description: "Split string to array",
    type: "string",
  },
  { short: ".psh", full: ".push", description: "Add to end", type: "array" },
  { short: ".pp", full: ".pop", description: "Remove from end", type: "array" },
  {
    short: ".shft",
    full: ".shift",
    description: "Remove from start",
    type: "array",
  },
  {
    short: ".unshft",
    full: ".unshift",
    description: "Add to start",
    type: "array",
  },
  {
    short: ".fltMap",
    full: ".flatMap",
    description: "Map and flatten",
    type: "array",
  },
  {
    short: ".flt1",
    full: ".flat",
    description: "Flatten array",
    type: "array",
  },
  {
    short: ".incl",
    full: ".includes",
    description: "Check if includes",
    type: "array",
  },
  {
    short: ".idxOf",
    full: ".indexOf",
    description: "Find index",
    type: "array",
  },

  // Object methods
  {
    short: ".kys",
    full: ".{keys}",
    description: "Get object keys",
    type: "object",
  },
  {
    short: ".vls",
    full: ".{values}",
    description: "Get object values",
    type: "object",
  },
  {
    short: ".ents",
    full: ".{entries}",
    description: "Get object entries",
    type: "object",
  },
  {
    short: ".len",
    full: ".{length}",
    description: "Get length/size",
    type: "object",
  },

  // String methods
  {
    short: ".lc",
    full: ".toLowerCase",
    description: "Convert to lowercase",
    type: "string",
  },
  {
    short: ".uc",
    full: ".toUpperCase",
    description: "Convert to uppercase",
    type: "string",
  },
  {
    short: ".trm",
    full: ".trim",
    description: "Remove whitespace",
    type: "string",
  },
  {
    short: ".trmSt",
    full: ".trimStart",
    description: "Remove leading whitespace",
    type: "string",
  },
  {
    short: ".trmEnd",
    full: ".trimEnd",
    description: "Remove trailing whitespace",
    type: "string",
  },
  {
    short: ".rpl",
    full: ".replace",
    description: "Replace text",
    type: "string",
  },
  {
    short: ".rplAll",
    full: ".replaceAll",
    description: "Replace all occurrences",
    type: "string",
  },
  {
    short: ".pdSt",
    full: ".padStart",
    description: "Pad start",
    type: "string",
  },
  { short: ".pdEnd", full: ".padEnd", description: "Pad end", type: "string" },
  {
    short: ".stsWith",
    full: ".startsWith",
    description: "Check if starts with",
    type: "string",
  },
  {
    short: ".endsWith",
    full: ".endsWith",
    description: "Check if ends with",
    type: "string",
  },
  {
    short: ".sbstr",
    full: ".substring",
    description: "Extract substring",
    type: "string",
  },
  {
    short: ".chr",
    full: ".charAt",
    description: "Get character at index",
    type: "string",
  },
  {
    short: ".chrCd",
    full: ".charCodeAt",
    description: "Get character code",
    type: "string",
  },
  {
    short: ".mtch",
    full: ".match",
    description: "Match pattern",
    type: "string",
  },

  // Universal methods
  {
    short: ".str",
    full: ".toString",
    description: "Convert to string",
    type: "any",
  },
  {
    short: ".json",
    full: ".toJSON",
    description: "Convert to JSON",
    type: "any",
  },
  {
    short: ".val",
    full: ".valueOf",
    description: "Get primitive value",
    type: "any",
  },
];

const shortToFull = new Map(SHORTCUTS.map((s) => [s.short, s.full]));
const fullToShort = new Map(SHORTCUTS.map((s) => [s.full, s.short]));

const EXPAND_PATTERNS = SHORTCUTS
  .map((s) => ({
    regex: new RegExp(`\\${s.short}(?![a-zA-Z])`, "g"),
    replacement: s.full,
  }))
  .sort((a, b) => b.replacement.length - a.replacement.length);

const SHORTEN_PATTERNS = SHORTCUTS
  .map((s) => ({
    regex: new RegExp(`${escapeRegExp(s.full)}(?![a-zA-Z])`, "g"),
    replacement: s.short,
  }))
  .sort((a, b) => b.regex.source.length - a.regex.source.length);

export function expandShortcuts(expression: string): string {
  return EXPAND_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    expression,
  );
}

export function shortenExpression(expression: string): string {
  return SHORTEN_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    expression,
  );
}

export function getShortcutHelp(): string {
  const arrayShortcuts = SHORTCUTS.filter((s) => s.type === "array");
  const objectShortcuts = SHORTCUTS.filter((s) => s.type === "object");
  const stringShortcuts = SHORTCUTS.filter((s) => s.type === "string");
  const universalShortcuts = SHORTCUTS.filter((s) => s.type === "any");

  const formatSection = (title: string, shortcuts: ShortcutMapping[]) => {
    const maxShortLen = Math.max(...shortcuts.map((s) => s.short.length));
    const maxFullLen = Math.max(...shortcuts.map((s) => s.full.length));

    const header = `\n${title}:\n`;
    const items = shortcuts
      .map(
        (s) =>
          `  ${s.short.padEnd(maxShortLen + 2)} → ${s.full.padEnd(maxFullLen + 2)} # ${s.description}`,
      )
      .join("\n");

    return header + items;
  };

  return `
Shorthand Reference:
${formatSection("Array Methods", arrayShortcuts)}
${formatSection("Object Methods", objectShortcuts)}
${formatSection("String Methods", stringShortcuts)}
${formatSection("Universal Methods", universalShortcuts)}

Examples:
  echo '[1,2,3]' | 1ls '.mp(x => x * 2)'        # Short form
  echo '[1,2,3]' | 1ls '.map(x => x * 2)'       # Full form

  1ls --shorten ".map(x => x * 2)"              # Returns: .mp(x => x * 2)
  1ls --expand ".mp(x => x * 2)"                # Returns: .map(x => x * 2)
`;
}

export function isShortcut(method: string): boolean {
  return shortToFull.has(method) || fullToShort.has(method);
}

export function getFullMethod(shortMethod: string): string | undefined {
  return shortToFull.get(shortMethod);
}

export function getShortMethod(fullMethod: string): string | undefined {
  return fullToShort.get(fullMethod);
}
