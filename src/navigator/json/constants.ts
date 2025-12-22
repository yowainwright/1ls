import type { OperatorFunction } from "../types";

export const OPERATORS: Readonly<Record<string, OperatorFunction>> = {
  "+": (left: unknown, right: unknown) =>
    (left as number) + (right as number),
  "-": (left: unknown, right: unknown) =>
    (left as number) - (right as number),
  "*": (left: unknown, right: unknown) =>
    (left as number) * (right as number),
  "/": (left: unknown, right: unknown) =>
    (left as number) / (right as number),
  "%": (left: unknown, right: unknown) =>
    (left as number) % (right as number),
  ">": (left: unknown, right: unknown) =>
    (left as number | string) > (right as number | string),
  "<": (left: unknown, right: unknown) =>
    (left as number | string) < (right as number | string),
  ">=": (left: unknown, right: unknown) =>
    (left as number | string) >= (right as number | string),
  "<=": (left: unknown, right: unknown) =>
    (left as number | string) <= (right as number | string),
  "==": (left: unknown, right: unknown) => left == right,
  "===": (left: unknown, right: unknown) => left === right,
  "!=": (left: unknown, right: unknown) => left != right,
  "!==": (left: unknown, right: unknown) => left !== right,
  "&&": (left: unknown, right: unknown) => left && right,
  "||": (left: unknown, right: unknown) => left || right,
};
