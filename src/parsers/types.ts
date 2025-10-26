export interface CSVOptions {
  delimiter: string;
}

export interface TOMLTable {
  [key: string]: unknown;
}

export interface YAMLParseContext {
  stack: unknown[];
  indentStack: number[];
  currentList: unknown[] | null;
  listIndent: number;
}

export interface XMLAttributes {
  _attributes?: Record<string, unknown>;
  _text?: unknown;
  [key: string]: unknown;
}

export interface ParseState {
  result: string[];
  inString: boolean;
  delimiter: string;
  skip: number;
}

export interface XMLParseState {
  buffer: string[];
  depth: number;
  skip: number;
}

export interface XMLElementState {
  elements: string[];
  buffer: string[];
  depth: number;
  skip: number;
}

export interface INIParseState {
  result: Record<string, unknown>;
  currentSection: string;
}

export interface ENVParseState {
  result: Record<string, unknown>;
}
