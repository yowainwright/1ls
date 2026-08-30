import type { EvaluatedFunction } from "../types.ts";

export type BuiltinFn = (data: unknown, args: unknown[]) => unknown;
export type KeyExtractor = EvaluatedFunction;
export type Predicate = EvaluatedFunction;
