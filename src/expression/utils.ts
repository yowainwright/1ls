import type {
  Token,
  ASTNode,
  LiteralNode,
  PropertyAccessNode,
  IndexAccessNode,
  SliceAccessNode,
  MethodCallNode,
  ObjectOperationNode,
  ObjectOperationType,
  ArraySpreadNode,
  ArrowFunctionNode,
  RootNode,
  RecursiveDescentNode,
  OptionalAccessNode,
  NullCoalescingNode,
} from "../types.ts";
import { BOOLEAN_LITERALS } from "./constants.ts";

export const isBooleanLiteral = (value: string): value is (typeof BOOLEAN_LITERALS)[number] => {
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === BOOLEAN_LITERALS[0]) return true;
  if (normalizedValue === BOOLEAN_LITERALS[1]) return true;
  return normalizedValue === BOOLEAN_LITERALS[2];
};

export const createLiteralNode = (value: string | number | boolean | null): LiteralNode => ({
  type: "Literal",
  value,
});

export const tryParseLiteralIdentifier = (identifier: string): LiteralNode | undefined => {
  if (identifier === "true") return createLiteralNode(true);
  if (identifier === "false") return createLiteralNode(false);
  if (identifier === "null") return createLiteralNode(null);
  return undefined;
};

export const createErrorMessage = (token: Token, message: string): string =>
  `${message} at position ${token.position} (got ${token.type}: "${token.value}")`;

export const createPropertyAccessNode = (
  property: string,
  object: ASTNode | null = null,
): PropertyAccessNode => ({ type: "PropertyAccess", property, object });

export const createIndexAccessNode = (index: number, object: ASTNode | null = null): IndexAccessNode => ({
  type: "IndexAccess",
  index,
  object,
});

export const createSliceAccessNode = (
  start: number | undefined,
  end: number | undefined,
  object: ASTNode | null = null,
): SliceAccessNode => ({ type: "SliceAccess", start, end, object });

export const createMethodCallNode = (
  method: string,
  args: ASTNode[],
  object: ASTNode | null = null,
): MethodCallNode => ({ type: "MethodCall", method, args, object });

export const createObjectOperationNode = (
  operation: ObjectOperationType,
  object: ASTNode | null = null,
): ObjectOperationNode => ({ type: "ObjectOperation", operation, object });

export const createArraySpreadNode = (object: ASTNode | null = null): ArraySpreadNode => ({
  type: "ArraySpread",
  object,
});

export const createArrowFunctionNode = (params: string[], body: ASTNode): ArrowFunctionNode => ({
  type: "ArrowFunction",
  params,
  body,
});

export const createRootNode = (expression: ASTNode | null = null): RootNode => ({
  type: "Root",
  expression,
});

export const createRecursiveDescentNode = (object: ASTNode | null = null): RecursiveDescentNode => ({
  type: "RecursiveDescent",
  object,
});

export const createOptionalAccessNode = (
  expression: ASTNode,
  object: ASTNode | null = null,
): OptionalAccessNode => ({ type: "OptionalAccess", expression, object });

export const createNullCoalescingNode = (left: ASTNode, right: ASTNode): NullCoalescingNode => ({
  type: "NullCoalescing",
  left,
  right,
});

export const isValidObjectOperation = (value: string): value is ObjectOperationType => {
  if (value === "keys") return true;
  if (value === "values") return true;
  if (value === "entries") return true;
  return value === "length";
};
