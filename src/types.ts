import { DataFormat } from "./utils/types";

export type OutputFormat = "json" | "yaml" | "csv" | "table";

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

export interface FormattingOptions {
  raw?: boolean;
  pretty?: boolean;
  compact?: boolean;
  type?: boolean;
  format?: OutputFormat;
  inputFormat?: DataFormat;
}

export interface CliOptions
  extends FileOperationOptions,
    ShorthandOptions,
    FormattingOptions {
  expression?: string;
  readFile?: boolean;
  help?: boolean;
  version?: boolean;
  interactive?: boolean;
}

export enum TokenType {
  DOT = "DOT",
  IDENTIFIER = "IDENTIFIER",
  LEFT_BRACKET = "LEFT_BRACKET",
  RIGHT_BRACKET = "RIGHT_BRACKET",
  LEFT_BRACE = "LEFT_BRACE",
  RIGHT_BRACE = "RIGHT_BRACE",
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  NUMBER = "NUMBER",
  STRING = "STRING",
  COLON = "COLON",
  COMMA = "COMMA",
  ARROW = "ARROW",
  OPERATOR = "OPERATOR",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export type ASTNode =
  | PropertyAccessNode
  | IndexAccessNode
  | SliceAccessNode
  | MethodCallNode
  | ObjectOperationNode
  | ArraySpreadNode
  | LiteralNode
  | ArrowFunctionNode
  | RootNode;

export interface PropertyAccessNode {
  type: "PropertyAccess";
  property: string;
  object?: ASTNode;
}

export interface IndexAccessNode {
  type: "IndexAccess";
  index: number;
  object?: ASTNode;
}

export interface SliceAccessNode {
  type: "SliceAccess";
  start?: number;
  end?: number;
  object?: ASTNode;
}

export interface MethodCallNode {
  type: "MethodCall";
  method: string;
  args: ASTNode[];
  object?: ASTNode;
}

export type ObjectOperationType = "keys" | "values" | "entries" | "length";

export interface ObjectOperationNode {
  type: "ObjectOperation";
  operation: ObjectOperationType;
  object?: ASTNode;
}

export interface ArraySpreadNode {
  type: "ArraySpread";
  object?: ASTNode;
}

export interface LiteralNode {
  type: "Literal";
  value: string | number | boolean | null;
}

export interface ArrowFunctionNode {
  type: "ArrowFunction";
  params: string[];
  body: ASTNode;
}

export interface RootNode {
  type: "Root";
  expression?: ASTNode;
}
