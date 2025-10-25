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
