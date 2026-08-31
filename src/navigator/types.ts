export type EvaluationContext = Record<string, unknown>;
export type OperatorFunction = (left: unknown, right: unknown) => unknown;
export type EvaluatedFunction = (item: unknown, index: unknown, array: unknown) => unknown;
