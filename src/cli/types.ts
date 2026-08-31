import type { RuntimeOptions } from "../types";

export interface FileOperationOptions {
  find?: string;
  grep?: string;
  list?: string;
  recursive?: boolean;
  ignoreCase?: boolean;
  showLineNumbers?: boolean;
  extensions?: string[];
  maxDepth?: number;
}

export interface ShorthandOptions {
  shorten?: string;
  expand?: string;
  shortcuts?: boolean;
}

export interface CliOptions extends FileOperationOptions, ShorthandOptions, RuntimeOptions {
  readFile?: boolean;
  help?: boolean;
  version?: boolean;
  slurp?: boolean;
  nullInput?: boolean;
  daemon?: boolean;
}

export interface ParseState {
  args: string[];
  index: number;
  options: CliOptions;
}

export interface ReadFileInvocation {
  filePath: string;
  expression: string;
  hasExplicitExpression: boolean;
}
