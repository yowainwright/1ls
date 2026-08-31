import type { ObjectOperationType } from "../types";

export const BOOLEAN_LITERALS = ["true", "false", "null"] as const;

export const VALID_OBJECT_OPERATIONS: readonly ObjectOperationType[] = [
  "keys",
  "values",
  "entries",
  "length",
] as const;
