import type { EvaluationContext } from "../types";
import type { EvaluatedFunction } from "../types";
import { invokeMethod } from "@1ls/dynamic-invoke";
import { OPERATORS } from "./constants";

type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

export const isOperatorMethod = (method: string): boolean =>
  method.startsWith("__operator_") && method.endsWith("__");

export const extractOperator = (method: string): string => method.slice(11, -2);

export const executeOperator = (left: unknown, operator: string, right: unknown): unknown => {
  const operatorFn = OPERATORS[operator];
  if (!operatorFn) {
    throw new Error(`Unknown operator: ${operator}`);
  }
  return operatorFn(left, right);
};

export const createParameterContext = (
  params: readonly string[],
  args: readonly unknown[],
): EvaluationContext => {
  const context: EvaluationContext = {};

  for (let index = 0; index < params.length; index++) {
    context[params[index]] = args[index];
  }

  return context;
};

export const getImplicitParameter = (context: EvaluationContext): unknown => {
  const keys = Object.keys(context);
  return context[keys[0]];
};

export const isValidObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

export const getPropertyFromObject = (obj: unknown, property: string): unknown => {
  if (!isValidObject(obj)) return undefined;
  const jsonObject = obj as JsonObject;
  return jsonObject[property];
};

export const normalizeArrayIndex = (index: number, length: number): number =>
  index < 0 ? length + index : index;

export const getArrayElement = (arr: unknown, index: number): unknown => {
  if (!Array.isArray(arr)) return undefined;

  const normalizedIndex = normalizeArrayIndex(index, arr.length);
  const jsonArray = arr as JsonValue[];
  return jsonArray[normalizedIndex];
};

export const sliceArray = (
  arr: unknown,
  start: number | undefined,
  end: number | undefined,
): unknown => {
  if (!Array.isArray(arr)) return undefined;

  const arrayLen = arr.length;
  const normalizedStart = start !== undefined ? normalizeArrayIndex(start, arrayLen) : 0;
  const normalizedEnd = end !== undefined ? normalizeArrayIndex(end, arrayLen) : arrayLen;

  return arr.slice(normalizedStart, normalizedEnd);
};

export const evaluateObjectOperation = (
  obj: unknown,
  operation: "keys" | "values" | "entries" | "length",
): unknown => {
  if (!isValidObject(obj)) return undefined;

  if (operation === "keys") return Object.keys(obj);
  if (operation === "values") return Object.values(obj);
  if (operation === "entries") return Object.entries(obj);
  if (operation === "length") {
    return Array.isArray(obj) ? obj.length : Object.keys(obj).length;
  }
  return undefined;
};

export const isCallableMethod = (target: unknown, method: string): boolean => {
  if (!isValidObject(target)) return false;
  const methodValue = (target as Record<string, unknown>)[method];
  const isFunction = typeof methodValue === "function";
  return isFunction;
};

const hasMethodOnTarget = (target: unknown, method: string): boolean => {
  const isNullish = target === null || target === undefined;
  if (isNullish) return false;

  const targetObj = target as Record<string, unknown>;
  const methodValue = targetObj[method];
  const isFunction = typeof methodValue === "function";
  return isFunction;
};

const extractErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isArrayTransformMethod = (method: string): boolean => {
  if (method === "map") return true;
  if (method === "filter") return true;
  if (method === "reduce") return true;
  if (method === "find") return true;
  if (method === "some") return true;
  if (method === "every") return true;
  return method === "sort";
};

const isArrayValueMethod = (method: string): boolean => {
  if (method === "reverse") return true;
  if (method === "join") return true;
  if (method === "slice") return true;
  return method === "includes";
};

const callArrayTransformMethod = (
  target: unknown[],
  method: string,
  args: readonly unknown[],
): unknown => {
  const fn = args[0] as EvaluatedFunction;

  if (method === "map") return target.map((item, index, array) => fn(item, index, array));
  if (method === "filter") return target.filter((item, index, array) => Boolean(fn(item, index, array)));
  if (method === "reduce") return reduceArray(target, fn, args[1]);
  if (method === "find") return target.find((item, index, array) => Boolean(fn(item, index, array)));
  if (method === "some") return target.some((item, index, array) => Boolean(fn(item, index, array)));
  if (method === "every") return target.every((item, index, array) => Boolean(fn(item, index, array)));
  if (method === "sort") return sortArray(target, fn);
  return undefined;
};

const callArrayValueMethod = (target: unknown[], method: string, args: readonly unknown[]): unknown => {
  if (method === "reverse") return target.slice().reverse();
  if (method === "join") return target.join(String(args[0] ?? ","));
  if (method === "slice") return target.slice(args[0] as number, args[1] as number | undefined);
  if (method === "includes") return target.includes(args[0]);
  return undefined;
};

const callArrayMethod = (target: unknown[], method: string, args: readonly unknown[]): unknown => {
  if (isArrayTransformMethod(method)) return callArrayTransformMethod(target, method, args);
  if (isArrayValueMethod(method)) return callArrayValueMethod(target, method, args);
  return undefined;
};

const reduceArray = (
  target: unknown[],
  fn: EvaluatedFunction,
  initialValue: unknown,
): unknown => {
  let result = initialValue;

  for (let index = 0; index < target.length; index++) {
    result = fn(result, target[index], index);
  }

  return result;
};

const sortArray = (target: unknown[], fn: EvaluatedFunction): unknown[] => {
  const values = target.slice();
  const compareValues = (left: unknown, right: unknown): number => fn(left, right, values) as number;
  return sortValues(values, compareValues);
};

const insertSortedValue = (
  values: unknown[],
  value: unknown,
  compare: (left: unknown, right: unknown) => number,
): unknown[] => {
  let insertIndex = 0;

  while (insertIndex < values.length) {
    const comparison = compare(value, values[insertIndex]);
    if (comparison < 0) break;
    insertIndex++;
  }

  return values.slice(0, insertIndex).concat(value, values.slice(insertIndex));
};

const sortValues = (
  values: unknown[],
  compare: (left: unknown, right: unknown) => number,
): unknown[] => {
  let sortedValues: unknown[] = [];

  for (const value of values) {
    sortedValues = insertSortedValue(sortedValues, value, compare);
  }

  return sortedValues;
};

const callStringTransformMethod = (target: string, method: string, args: readonly unknown[]): unknown => {
  if (method === "toLowerCase") return target.toLowerCase();
  if (method === "toUpperCase") return target.toUpperCase();
  if (method === "trim") return target.trim();
  if (method === "split") return target.split(String(args[0] ?? ""));
  if (method === "replace") return target.replace(String(args[0] ?? ""), String(args[1] ?? ""));
  return undefined;
};

const callStringSearchMethod = (target: string, method: string, args: readonly unknown[]): unknown => {
  if (method === "includes") return target.includes(String(args[0] ?? ""));
  if (method === "startsWith") return target.startsWith(String(args[0] ?? ""));
  if (method === "endsWith") return target.endsWith(String(args[0] ?? ""));
  return undefined;
};

const callStringMethod = (target: string, method: string, args: readonly unknown[]): unknown => {
  const transformResult = callStringTransformMethod(target, method, args);
  if (transformResult !== undefined) return transformResult;
  const searchResult = callStringSearchMethod(target, method, args);
  if (searchResult !== undefined) return searchResult;
  return undefined;
};

const callTargetMethod = (target: unknown, method: string, args: readonly unknown[]): unknown => {
  const methodExists = hasMethodOnTarget(target, method);
  if (!methodExists) {
    throw new Error(`Method ${method} does not exist on ${typeof target}`);
  }

  return invokeMethod(target, method, args);
};

export const callMethod = (target: unknown, method: string, args: readonly unknown[]): unknown => {
  try {
    if (Array.isArray(target)) {
      const result = callArrayMethod(target, method, args);
      if (result !== undefined) return result;
    }

    if (typeof target === "string") {
      const result = callStringMethod(target, method, args);
      if (result !== undefined) return result;
    }

    return callTargetMethod(target, method, args);
  } catch (error: unknown) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Error executing method ${method}: ${errorMessage}`);
  }
};
