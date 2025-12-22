import type { EvaluationContext } from "../types";
import { OPERATORS } from "./constants";

export const isOperatorMethod = (method: string): boolean =>
  method.startsWith("__operator_") && method.endsWith("__");

export const extractOperator = (method: string): string =>
  method.slice(11, -2);

export const executeOperator = (
  left: unknown,
  operator: string,
  right: unknown,
): unknown => {
  const operatorFn = OPERATORS[operator];
  if (!operatorFn) {
    throw new Error(`Unknown operator: ${operator}`);
  }
  return operatorFn(left, right);
};

export const createParameterContext = (
  params: readonly string[],
  args: readonly unknown[],
): EvaluationContext =>
  Object.fromEntries(params.map((param, index) => [param, args[index]]));

export const getImplicitParameter = (context: EvaluationContext): unknown => {
  const values = Object.values(context);
  return values[0];
};

export const isValidObject = (
  value: unknown,
): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

export const getPropertyFromObject = (
  obj: unknown,
  property: string,
): unknown => {
  if (!isValidObject(obj)) return undefined;
  return obj[property];
};

export const normalizeArrayIndex = (index: number, length: number): number =>
  index < 0 ? length + index : index;

export const getArrayElement = (arr: unknown, index: number): unknown => {
  if (!Array.isArray(arr)) return undefined;

  const normalizedIndex = normalizeArrayIndex(index, arr.length);
  return arr[normalizedIndex];
};

export const sliceArray = (
  arr: unknown,
  start: number | undefined,
  end: number | undefined,
): unknown => {
  if (!Array.isArray(arr)) return undefined;

  const arrayLen = arr.length;
  const normalizedStart =
    start !== undefined ? normalizeArrayIndex(start, arrayLen) : 0;
  const normalizedEnd =
    end !== undefined ? normalizeArrayIndex(end, arrayLen) : arrayLen;

  return arr.slice(normalizedStart, normalizedEnd);
};

export const evaluateObjectOperation = (
  obj: unknown,
  operation: "keys" | "values" | "entries" | "length",
): unknown => {
  if (!isValidObject(obj)) return undefined;

  switch (operation) {
    case "keys":
      return Object.keys(obj);
    case "values":
      return Object.values(obj);
    case "entries":
      return Object.entries(obj);
    case "length":
      return Array.isArray(obj) ? obj.length : Object.keys(obj).length;
  }
};

export const isCallableMethod = (target: unknown, method: string): boolean => {
  if (!isValidObject(target)) return false;
  const methodValue = (target as Record<string, unknown>)[method];
  return typeof methodValue === "function";
};

const hasMethodOnTarget = (target: unknown, method: string): boolean => {
  const isNullish = target === null || target === undefined;
  if (isNullish) return false;

  const targetObj = target as Record<string, unknown>;
  return typeof targetObj[method] === "function";
};

const extractErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const callMethod = (
  target: unknown,
  method: string,
  args: readonly unknown[],
): unknown => {
  const methodExists = hasMethodOnTarget(target, method);
  if (!methodExists) {
    throw new Error(`Method ${method} does not exist on ${typeof target}`);
  }

  try {
    const targetObj = target as Record<string, unknown>;
    const methodFn = targetObj[method] as (...args: unknown[]) => unknown;
    return methodFn.call(target, ...args);
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Error executing method ${method}: ${errorMessage}`);
  }
};
