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
