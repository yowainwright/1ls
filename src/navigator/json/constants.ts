import type { OperatorFunction } from "../types";

const compareNumberValues = (left: number, right: number, operator: string): boolean => {
  if (operator === ">") return left > right;
  if (operator === "<") return left < right;
  if (operator === ">=") return left >= right;
  return left <= right;
};

const compareStringValues = (left: string, right: string, operator: string): boolean => {
  if (operator === ">") return left > right;
  if (operator === "<") return left < right;
  if (operator === ">=") return left >= right;
  return left <= right;
};

const compareValues = (left: unknown, right: unknown, operator: string): boolean => {
  const isNumberPair = typeof left === "number" && typeof right === "number";
  if (isNumberPair) return compareNumberValues(left as number, right as number, operator);

  const isStringPair = typeof left === "string" && typeof right === "string";
  if (isStringPair) return compareStringValues(left as string, right as string, operator);

  return false;
};

export const OPERATORS: Readonly<Record<string, OperatorFunction>> = {
  "+": (left: unknown, right: unknown) => (left as number) + (right as number),
  "-": (left: unknown, right: unknown) => (left as number) - (right as number),
  "*": (left: unknown, right: unknown) => (left as number) * (right as number),
  "/": (left: unknown, right: unknown) => (left as number) / (right as number),
  "%": (left: unknown, right: unknown) => (left as number) % (right as number),
  ">": (left: unknown, right: unknown) => compareValues(left, right, ">"),
  "<": (left: unknown, right: unknown) => compareValues(left, right, "<"),
  ">=": (left: unknown, right: unknown) => compareValues(left, right, ">="),
  "<=": (left: unknown, right: unknown) => compareValues(left, right, "<="),
  "==": (left: unknown, right: unknown) => left === right,
  "===": (left: unknown, right: unknown) => left === right,
  "!=": (left: unknown, right: unknown) => left !== right,
  "!==": (left: unknown, right: unknown) => left !== right,
  "&&": (left: unknown, right: unknown) => left && right,
  "||": (left: unknown, right: unknown) => left || right,
};
