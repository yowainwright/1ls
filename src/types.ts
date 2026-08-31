import type { DataFormat } from "./formats/types";

export type OutputFormat = "json" | "yaml" | "csv" | "table";

export interface FormattingOptions {
  raw?: boolean;
  pretty?: boolean;
  compact?: boolean;
  type?: boolean;
  format?: OutputFormat;
  inputFormat?: DataFormat;
  detect?: boolean;
}

export interface RuntimeOptions extends FormattingOptions {
  expression?: string;
  strict?: boolean;
}

export enum TokenType {
  DOT = "DOT",
  DOUBLE_DOT = "DOUBLE_DOT",
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
  QUESTION = "QUESTION",
  DOUBLE_QUESTION = "DOUBLE_QUESTION",
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
  | RootNode
  | RecursiveDescentNode
  | OptionalAccessNode
  | NullCoalescingNode;

export interface PropertyAccessNode {
  type: "PropertyAccess";
  property: string;
  object: ASTNode | null;
}

export interface IndexAccessNode {
  type: "IndexAccess";
  index: number;
  object: ASTNode | null;
}

export interface SliceAccessNode {
  type: "SliceAccess";
  start?: number;
  end?: number;
  object: ASTNode | null;
}

export interface MethodCallNode {
  type: "MethodCall";
  method: string;
  args: ASTNode[];
  object: ASTNode | null;
}

export type ObjectOperationType = "keys" | "values" | "entries" | "length";

export interface ObjectOperationNode {
  type: "ObjectOperation";
  operation: ObjectOperationType;
  object: ASTNode | null;
}

export interface ArraySpreadNode {
  type: "ArraySpread";
  object: ASTNode | null;
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
  expression: ASTNode | null;
}

export interface RecursiveDescentNode {
  type: "RecursiveDescent";
  object: ASTNode | null;
}

export interface OptionalAccessNode {
  type: "OptionalAccess";
  expression: ASTNode;
  object: ASTNode | null;
}

export interface NullCoalescingNode {
  type: "NullCoalescing";
  left: ASTNode;
  right: ASTNode;
}
