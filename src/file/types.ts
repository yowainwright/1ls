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
