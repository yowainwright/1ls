export const SUPPORTED_CODE_EXTENSIONS = [
  ".ts",
  ".js",
  ".tsx",
  ".jsx",
] as const;
export const SUPPORTED_DATA_EXTENSIONS = [".json", ".yml", ".yaml"] as const;
export const SUPPORTED_TEXT_EXTENSIONS = [".md", ".txt"] as const;

export const DEFAULT_SEARCH_EXTENSIONS = [
  ...SUPPORTED_CODE_EXTENSIONS,
  ...SUPPORTED_DATA_EXTENSIONS,
  ...SUPPORTED_TEXT_EXTENSIONS,
] as const;

export const OPERATOR_METHOD_PREFIX = "__operator_";
export const OPERATOR_METHOD_SUFFIX = "__";

export const APP_VERSION = "1.0.0";
export const APP_NAME = "1ls";

export const VALID_OUTPUT_FORMATS = ["json", "yaml", "csv", "table"] as const;
export const VALID_INPUT_FORMATS = [
  "json",
  "yaml",
  "toml",
  "csv",
  "tsv",
  "lines",
  "text",
] as const;

export const VALID_OBJECT_OPERATIONS = [
  "keys",
  "values",
  "entries",
  "length",
] as const;

export const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Implicit property access patterns for shorthand syntax.
 *
 * Allows `.property` inside method callbacks as shorthand for `x => x.property`.
 * Example: `.mp(.name)` expands to `.map(x => x.name)`
 */
export const IMPLICIT_PROP = {
  /** Default parameter name when expanding to arrow function */
  PARAM: "x",

  /**
   * Matches method calls that may contain implicit property access.
   * Captures: [1] method name, [2] arguments
   */
  METHOD_WITH_ARGS: /\.(\w+)\(([^)]+)\)/g,

  /**
   * Matches implicit property access: `.property` at start or after operator/space.
   * Matches: `.name`, `.age`, `.foo.bar`
   * Context: must follow `(`, space, or operator - not another identifier
   */
  PROPERTY_ACCESS: /(?<=[(,\s&|><=!+\-*/%])\.([a-zA-Z_]\w*)/g,

  /**
   * Matches `.property` at the very start of method arguments.
   */
  PROPERTY_AT_START: /^\s*\.([a-zA-Z_]\w*)/,

  /**
   * Matches `.property` after operators or delimiters (not at start).
   */
  PROPERTY_AFTER_OPERATOR: /[,\s&|><=!+\-*/%]\.([a-zA-Z_]\w*)/,

  /**
   * Replaces `.property` at start of string with `x.property`.
   */
  EXPAND_AT_START: /^(\s*)\.([a-zA-Z_]\w*)/,

  /**
   * Replaces `.property` after operators with `x.property`.
   */
  EXPAND_AFTER_OPERATOR: /([,\s&|><=!+\-*/%])\.([a-zA-Z_]\w*)/g,

  /**
   * Matches arrow functions for shortening back to implicit form.
   * Captures: [1] method name, [2] param, [3] body
   */
  ARROW_FUNC: /\.(\w+)\((\w+)\s*=>\s*([^)]+)\)/g,

  /**
   * Template for matching a parameter followed by dot.
   * Example: for param "x", matches "x." but not "ax." or "x_."
   */
  PARAM_DOT_TEMPLATE: "(?<![a-zA-Z0-9_])PARAM\\.",
} as const;

export const BUILTIN_FUNCTIONS = {
  PIPE: "pipe",
  COMPOSE: "compose",
  HEAD: "head",
  LAST: "last",
  TAIL: "tail",
  TAKE: "take",
  DROP: "drop",
  UNIQ: "uniq",
  FLATTEN: "flatten",
  REVERSE: "rev",
  GROUPBY: "groupBy",
  SORTBY: "sortBy",
  CHUNK: "chunk",
  COMPACT: "compact",
  PICK: "pick",
  OMIT: "omit",
  KEYS: "keys",
  VALUES: "vals",
  MERGE: "merge",
  DEEPMERGE: "deepMerge",
  FROMPAIRS: "fromPairs",
  TOPAIRS: "toPairs",
  SUM: "sum",
  MEAN: "mean",
  MIN: "min",
  MAX: "max",
  LEN: "len",
  COUNT: "count",
  ISEMPTY: "isEmpty",
  ISNIL: "isNil",
  IDENTITY: "id",
  PLUCK: "pluck",
  TYPE: "type",
  RANGE: "range",
  HAS: "has",
  NTH: "nth",
  CONTAINS: "contains",
  ADD: "add",
  PATH: "path",
  GETPATH: "getpath",
  SETPATH: "setpath",
  RECURSE: "recurse",
  SPLIT: "split",
  JOIN: "join",
  STARTSWITH: "startswith",
  ENDSWITH: "endswith",
  LTRIMSTR: "ltrimstr",
  RTRIMSTR: "rtrimstr",
  TOSTRING: "tostring",
  TONUMBER: "tonumber",
  FLOOR: "floor",
  CEIL: "ceil",
  ROUND: "round",
  ABS: "abs",
  NOT: "not",
  SELECT: "select",
  EMPTY: "empty",
  ERROR: "error",
  DEBUG: "debug",
} as const;
