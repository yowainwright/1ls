import { LiteralNode } from "../types";
import { BOOLEAN_LITERALS } from "./constants";

export const isBooleanLiteral = (value: string): value is typeof BOOLEAN_LITERALS[number] =>
  (BOOLEAN_LITERALS as readonly string[]).includes(value);

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
