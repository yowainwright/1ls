import type { ShortcutMapping } from "./types";
import { escapeRegExp } from "./index";
import { IMPLICIT_PROP } from "./constants";

export const BUILTIN_SHORTCUTS: ShortcutMapping[] = [
  { short: "hd", full: "head", description: "First element", type: "builtin" },
  { short: "lst", full: "last", description: "Last element", type: "builtin" },
  { short: "tl", full: "tail", description: "All but first", type: "builtin" },
  { short: "tk", full: "take", description: "Take n elements", type: "builtin" },
  { short: "drp", full: "drop", description: "Drop n elements", type: "builtin" },
  { short: "unq", full: "uniq", description: "Unique values", type: "builtin" },
  { short: "fltn", full: "flatten", description: "Flatten nested", type: "builtin" },
  { short: "grpBy", full: "groupBy", description: "Group by key", type: "builtin" },
  { short: "srtBy", full: "sortBy", description: "Sort by key", type: "builtin" },
  { short: "chnk", full: "chunk", description: "Split into chunks", type: "builtin" },
  { short: "cmpct", full: "compact", description: "Remove falsy", type: "builtin" },
  { short: "pk", full: "pick", description: "Pick keys", type: "builtin" },
  { short: "omt", full: "omit", description: "Omit keys", type: "builtin" },
  { short: "ks", full: "keys", description: "Object keys", type: "builtin" },
  { short: "mrg", full: "merge", description: "Merge objects", type: "builtin" },
  { short: "dMrg", full: "deepMerge", description: "Deep merge", type: "builtin" },
  { short: "frPrs", full: "fromPairs", description: "Pairs to object", type: "builtin" },
  { short: "toPrs", full: "toPairs", description: "Object to pairs", type: "builtin" },
  { short: "avg", full: "mean", description: "Average value", type: "builtin" },
  { short: "cnt", full: "count", description: "Count items", type: "builtin" },
  { short: "emp", full: "isEmpty", description: "Check if empty", type: "builtin" },
  { short: "nil", full: "isNil", description: "Check if nil", type: "builtin" },
  { short: "plk", full: "pluck", description: "Pluck property", type: "builtin" },
  { short: "typ", full: "type", description: "Get type", type: "builtin" },
  { short: "rng", full: "range", description: "Generate range", type: "builtin" },
  { short: "hs", full: "has", description: "Has key", type: "builtin" },
  { short: "nth", full: "nth", description: "Nth element", type: "builtin" },
  { short: "ctns", full: "contains", description: "Contains value", type: "builtin" },
  { short: "add", full: "add", description: "Add/concat", type: "builtin" },
  { short: "pth", full: "path", description: "All paths", type: "builtin" },
  { short: "gpth", full: "getpath", description: "Get at path", type: "builtin" },
  { short: "spth", full: "setpath", description: "Set at path", type: "builtin" },
  { short: "rec", full: "recurse", description: "Recurse all", type: "builtin" },
  { short: "spl", full: "split", description: "Split string", type: "builtin" },
  { short: "jn", full: "join", description: "Join array", type: "builtin" },
  { short: "stw", full: "startswith", description: "Starts with", type: "builtin" },
  { short: "edw", full: "endswith", description: "Ends with", type: "builtin" },
  { short: "ltrm", full: "ltrimstr", description: "Trim prefix", type: "builtin" },
  { short: "rtrm", full: "rtrimstr", description: "Trim suffix", type: "builtin" },
  { short: "tstr", full: "tostring", description: "To string", type: "builtin" },
  { short: "tnum", full: "tonumber", description: "To number", type: "builtin" },
  { short: "flr", full: "floor", description: "Floor number", type: "builtin" },
  { short: "cl", full: "ceil", description: "Ceil number", type: "builtin" },
  { short: "rnd", full: "round", description: "Round number", type: "builtin" },
  { short: "abs", full: "abs", description: "Absolute value", type: "builtin" },
  { short: "sel", full: "select", description: "Filter by predicate", type: "builtin" },
  { short: "dbg", full: "debug", description: "Debug output", type: "builtin" },
];

export const SHORTCUTS: ShortcutMapping[] = [
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
    regex: new RegExp(`${escapeRegExp(s.short)}(?![a-zA-Z])`, "g"),
    replacement: s.full,
  }))
  .sort((a, b) => b.replacement.length - a.replacement.length);

const SHORTEN_PATTERNS = SHORTCUTS
  .map((s) => ({
    regex: new RegExp(`${escapeRegExp(s.full)}(?![a-zA-Z])`, "g"),
    replacement: s.short,
  }))
  .sort((a, b) => b.regex.source.length - a.regex.source.length);

const BUILTIN_EXPAND_PATTERNS = BUILTIN_SHORTCUTS
  .map((s) => ({
    regex: new RegExp(`(?<![a-zA-Z])${escapeRegExp(s.short)}\\(`, "g"),
    replacement: `${s.full}(`,
  }))
  .sort((a, b) => b.replacement.length - a.replacement.length);

const BUILTIN_SHORTEN_PATTERNS = BUILTIN_SHORTCUTS
  .map((s) => ({
    regex: new RegExp(`(?<![a-zA-Z])${escapeRegExp(s.full)}\\(`, "g"),
    replacement: `${s.short}(`,
  }))
  .sort((a, b) => b.regex.source.length - a.regex.source.length);

function expandImplicitProps(expression: string): string {
  const methodPattern = new RegExp(IMPLICIT_PROP.METHOD_WITH_ARGS.source, "g");

  return expression.replace(methodPattern, (match, method, args) => {
    if (args.includes("=>")) {
      return match;
    }

    const hasImplicitProp = IMPLICIT_PROP.PROPERTY_AT_START.test(args) ||
      IMPLICIT_PROP.PROPERTY_AFTER_OPERATOR.test(args);

    if (!hasImplicitProp) {
      return match;
    }

    const param = IMPLICIT_PROP.PARAM;
    const expandedArgs = args
      .replace(IMPLICIT_PROP.EXPAND_AT_START, `$1${param}.$2`)
      .replace(IMPLICIT_PROP.EXPAND_AFTER_OPERATOR, `$1${param}.$2`);

    return `.${method}(${param} => ${expandedArgs})`;
  });
}

export function expandShortcuts(expression: string): string {
  const withExpandedMethods = EXPAND_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    expression,
  );

  const withExpandedBuiltins = BUILTIN_EXPAND_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    withExpandedMethods,
  );

  return expandImplicitProps(withExpandedBuiltins);
}

function createParamDotPattern(param: string): RegExp {
  return new RegExp(IMPLICIT_PROP.PARAM_DOT_TEMPLATE.replace("PARAM", param), "g");
}

function shortenToImplicitProps(expression: string): string {
  const arrowPattern = new RegExp(IMPLICIT_PROP.ARROW_FUNC.source, "g");

  return expression.replace(arrowPattern, (match, method, param, body) => {
    const paramPattern = createParamDotPattern(param);
    const shortenedBody = body.replace(paramPattern, ".");

    if (shortenedBody === body) {
      return match;
    }

    return `.${method}(${shortenedBody})`;
  });
}

export function shortenExpression(expression: string): string {
  const withImplicitProps = shortenToImplicitProps(expression);

  const withShortenedMethods = SHORTEN_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    withImplicitProps,
  );

  return BUILTIN_SHORTEN_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    withShortenedMethods,
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

  const formatBuiltinSection = () => {
    const maxShortLen = Math.max(...BUILTIN_SHORTCUTS.map((s) => s.short.length));
    const maxFullLen = Math.max(...BUILTIN_SHORTCUTS.map((s) => s.full.length));

    const header = `\nBuiltin Functions:\n`;
    const items = BUILTIN_SHORTCUTS
      .map(
        (s) =>
          `  ${s.short}()`.padEnd(maxShortLen + 4) + ` → ${s.full}()`.padEnd(maxFullLen + 4) + ` # ${s.description}`,
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
${formatBuiltinSection()}

Examples:
  echo '[1,2,3]' | 1ls '.mp(x => x * 2)'        # Short form
  echo '[1,2,3]' | 1ls '.map(x => x * 2)'       # Full form
  echo '[1,2,3]' | 1ls 'hd()'                   # First element
  echo '[1,2,3]' | 1ls 'sum()'                  # Sum all

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
