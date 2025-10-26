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
