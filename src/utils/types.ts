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
  | "lines"
  | "text";

export interface ShortcutMapping {
  short: string;
  full: string;
  description: string;
  type: "array" | "object" | "string" | "any";
}
