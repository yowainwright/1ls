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
} from "../types";
import { BOOLEAN_LITERALS, VALID_OBJECT_OPERATIONS } from "./constants";

export const isBooleanLiteral = (
  value: string,
): value is (typeof BOOLEAN_LITERALS)[number] =>
  (BOOLEAN_LITERALS as readonly string[]).includes(value);

export const createLiteralNode = (
  value: string | number | boolean | null,
): LiteralNode => ({ type: "Literal", value });

export const tryParseLiteralIdentifier = (
  identifier: string,
): LiteralNode | undefined => {
  if (identifier === "true") return createLiteralNode(true);
  if (identifier === "false") return createLiteralNode(false);
  if (identifier === "null") return createLiteralNode(null);
  return undefined;
};

export const createErrorMessage = (token: Token, message: string): string =>
  `${message} at position ${token.position} (got ${token.type}: "${token.value}")`;

export const createPropertyAccessNode = (
  property: string,
  object?: ASTNode,
): PropertyAccessNode => ({ type: "PropertyAccess", property, object });

export const createIndexAccessNode = (
  index: number,
  object?: ASTNode,
): IndexAccessNode => ({ type: "IndexAccess", index, object });

export const createSliceAccessNode = (
  start: number | undefined,
  end: number | undefined,
  object?: ASTNode,
): SliceAccessNode => ({ type: "SliceAccess", start, end, object });

export const createMethodCallNode = (
  method: string,
  args: ASTNode[],
  object?: ASTNode,
): MethodCallNode => ({ type: "MethodCall", method, args, object });

export const createObjectOperationNode = (
  operation: ObjectOperationType,
  object?: ASTNode,
): ObjectOperationNode => ({ type: "ObjectOperation", operation, object });

export const createArraySpreadNode = (object?: ASTNode): ArraySpreadNode => ({
  type: "ArraySpread",
  object,
});

export const createArrowFunctionNode = (
  params: string[],
  body: ASTNode,
): ArrowFunctionNode => ({ type: "ArrowFunction", params, body });

export const createRootNode = (expression?: ASTNode): RootNode => ({
  type: "Root",
  expression,
});

export const createRecursiveDescentNode = (
  object?: ASTNode,
): RecursiveDescentNode => ({ type: "RecursiveDescent", object });

export const createOptionalAccessNode = (
  expression: ASTNode,
  object?: ASTNode,
): OptionalAccessNode => ({ type: "OptionalAccess", expression, object });

export const createNullCoalescingNode = (
  left: ASTNode,
  right: ASTNode,
): NullCoalescingNode => ({ type: "NullCoalescing", left, right });

export const isValidObjectOperation = (
  value: string,
): value is ObjectOperationType =>
  VALID_OBJECT_OPERATIONS.includes(value as ObjectOperationType);
