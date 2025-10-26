import { LiteralNode } from "../types";
import { BOOLEAN_LITERALS } from "./constants";

export const isBooleanLiteral = (value: string): boolean =>
  BOOLEAN_LITERALS.includes(value as any);

export const createLiteralNode = (
  value: string | number | boolean | null,
): LiteralNode => {
  return { type: "Literal", value };
};

export const tryParseLiteralIdentifier = (
  identifier: string,
): LiteralNode | undefined => {
  if (identifier === "true") return createLiteralNode(true);
  if (identifier === "false") return createLiteralNode(false);
  if (identifier === "null") return createLiteralNode(null);
  return undefined;
};
