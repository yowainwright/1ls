export interface FileInfo {
  path: string;
  name: string;
  ext: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  modified: Date;
  created: Date;
}

export interface ListOptions {
  recursive?: boolean;
  pattern?: RegExp;
  extensions?: string[];
  includeHidden?: boolean;
  maxDepth?: number;
}

export interface GrepOptions {
  ignoreCase?: boolean;
  recursive?: boolean;
  maxMatches?: number;
  showLineNumbers?: boolean;
  context?: number;
  verbose?: boolean;
}

export interface GrepResult {
  file: string;
  line: number;
  column: number;
  match: string;
  context?: string[];
}

export type DataFormat =
  | "json"
  | "json5"
  | "yaml"
  | "toml"
  | "xml"
  | "ini"
  | "csv"
  | "tsv"
  | "protobuf"
  | "javascript"
  | "typescript"
  | "env"
  | "ndjson"
  | "lines"
  | "text";

export interface ShortcutMapping {
  short: string;
  full: string;
  description: string;
  type: "array" | "object" | "string" | "any" | "builtin";
}

export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel];

export interface LogData {
  [key: string]: unknown;
}
