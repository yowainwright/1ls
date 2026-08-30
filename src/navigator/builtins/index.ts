import type { BuiltinFn, KeyExtractor, Predicate } from "./types";
import { EMPTY_SYMBOL, BUILTIN_FUNCTIONS } from "./constants";
import {
  isArray,
  isObject,
  isNil,
  isString,
  isNumber,
  getType,
  deepMerge,
  deepContains,
  getValueAtPath,
  setValueAtPath,
  collectAllValues,
  collectPaths,
} from "./utils";

export { EMPTY_SYMBOL, BUILTIN_FUNCTIONS } from "./constants";
export type { BuiltinFn, KeyExtractor, Predicate } from "./types";

const hasValue = (values: unknown[], value: unknown): boolean => {
  for (const existingValue of values) {
    if (existingValue === value) return true;
  }

  return false;
};

const appendValue = (values: unknown[], value: unknown): void => {
  values[values.length] = value;
};

const uniqueValues = (data: unknown[]): unknown[] => {
  const values: unknown[] = [];

  for (const item of data) {
    if (!hasValue(values, item)) appendValue(values, item);
  }

  return values;
};

const flattenValue = (item: unknown): unknown[] => (isArray(item) ? flattenValues(item) : [item]);

const flattenValues = (data: unknown[]): unknown[] => data.flatMap(flattenValue);

const compareNumberValues = (left: number, right: number): number => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

const compareStringValues = (left: string, right: string): number => {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

const compareSortValues = (left: unknown, right: unknown): number => {
  const isNumberPair = typeof left === "number" && typeof right === "number";
  if (isNumberPair) return compareNumberValues(left as number, right as number);

  const isStringPair = typeof left === "string" && typeof right === "string";
  if (isStringPair) return compareStringValues(left as string, right as string);

  return 0;
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

const mergeObjectValues = (
  data: Record<string, unknown>,
  args: unknown[],
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...data };

  for (const arg of args) {
    if (!isObject(arg)) continue;
    Object.assign(result, arg);
  }

  return result;
};

const deepMergeObjectValues = (
  data: Record<string, unknown>,
  args: unknown[],
): Record<string, unknown> => {
  let result = data;

  for (const arg of args) {
    if (isObject(arg)) result = deepMerge(result, arg);
  }

  return result;
};

const fromPairs = (data: unknown[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const pair of data) {
    if (!isArray(pair)) continue;
    const key = pair[0];
    if (typeof key === "string") result[key] = pair[1];
  }

  return result;
};

const toPairs = (data: Record<string, unknown>): unknown[] => {
  const keys = Object.keys(data);
  const pairs: unknown[] = [];

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    pairs[index] = [key, data[key]];
  }

  return pairs;
};

const sumNumbers = (data: unknown[]): number => {
  let sum = 0;

  for (const value of data) {
    sum += value as number;
  }

  return sum;
};

const flattenOneLevel = (data: unknown[]): unknown[] =>
  data.flatMap((item) => (isArray(item) ? item : [item]));

export const BUILTINS: Record<string, BuiltinFn> = {
  [BUILTIN_FUNCTIONS.HEAD]: (data) => (isArray(data) ? data[0] : undefined),
  [BUILTIN_FUNCTIONS.LAST]: (data) => (isArray(data) ? data[data.length - 1] : undefined),
  [BUILTIN_FUNCTIONS.TAIL]: (data) => (isArray(data) ? data.slice(1) : []),
  [BUILTIN_FUNCTIONS.TAKE]: (data, [n]) => (isArray(data) ? data.slice(0, n as number) : []),
  [BUILTIN_FUNCTIONS.DROP]: (data, [n]) => (isArray(data) ? data.slice(n as number) : []),
  [BUILTIN_FUNCTIONS.UNIQ]: (data) => (isArray(data) ? uniqueValues(data) : []),
  [BUILTIN_FUNCTIONS.FLATTEN]: (data) => (isArray(data) ? flattenValues(data) : []),
  [BUILTIN_FUNCTIONS.REVERSE]: (data) => (isArray(data) ? data.slice().reverse() : []),
  [BUILTIN_FUNCTIONS.GROUPBY]: (data, [fn]) => {
    if (!isArray(data)) return {};
    const keyFn = fn as KeyExtractor;
    const groups: Record<string, unknown[]> = {};

    for (let index = 0; index < data.length; index++) {
      const item = data[index];
      const key = String(keyFn(item, index, data));
      const group = groups[key] ?? [];
      groups[key] = group.concat(item);
    }

    return groups;
  },
  [BUILTIN_FUNCTIONS.SORTBY]: (data, [fn]) => {
    if (!isArray(data)) return [];
    const keyFn = fn as KeyExtractor;
    return sortValues(data, (a, b) => {
      const aVal = keyFn(a, 0, data);
      const bVal = keyFn(b, 0, data);
      return compareSortValues(aVal, bVal);
    });
  },
  [BUILTIN_FUNCTIONS.CHUNK]: (data, [size]) => {
    if (!isArray(data)) return [];
    const n = size as number;
    const numChunks = Math.ceil(data.length / n);
    const chunks: unknown[] = [];

    for (let index = 0; index < numChunks; index++) {
      chunks[index] = data.slice(index * n, (index + 1) * n);
    }

    return chunks;
  },
  [BUILTIN_FUNCTIONS.COMPACT]: (data) => (isArray(data) ? data.filter(Boolean) : []),
  [BUILTIN_FUNCTIONS.PLUCK]: (data, [key]) => {
    if (!isArray(data)) return [];
    return data.map((item) => (isObject(item) ? item[key as string] : undefined));
  },
  [BUILTIN_FUNCTIONS.PICK]: (data, args) => {
    if (!isObject(data)) return {};
    const isSingleArrayArg = args.length === 1 && isArray(args[0]);
    const keys = isSingleArrayArg ? (args[0] as string[]) : (args as string[]);
    return keys.reduce(
      (acc, key) => {
        const keyStr = key as string;
        const hasKey = keyStr in data;
        return hasKey ? { ...acc, [keyStr]: data[keyStr] } : acc;
      },
      {} as Record<string, unknown>,
    );
  },
  [BUILTIN_FUNCTIONS.OMIT]: (data, args) => {
    if (!isObject(data)) return {};
    const isSingleArrayArg = args.length === 1 && isArray(args[0]);
    const keysToOmit = isSingleArrayArg ? (args[0] as string[]) : (args as string[]);
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(data)) {
      if (!hasValue(keysToOmit, key)) result[key] = data[key];
    }

    return result;
  },
  [BUILTIN_FUNCTIONS.KEYS]: (data) => {
    if (!isObject(data)) return [] as string[];
    return Object.keys(data);
  },
  [BUILTIN_FUNCTIONS.VALUES]: (data) => (isObject(data) ? Object.values(data) : []),
  [BUILTIN_FUNCTIONS.MERGE]: (data, args) => {
    if (!isObject(data)) return {};
    return mergeObjectValues(data, args);
  },
  [BUILTIN_FUNCTIONS.DEEPMERGE]: (data, args) => {
    if (!isObject(data)) return {};
    return deepMergeObjectValues(data, args);
  },
  [BUILTIN_FUNCTIONS.FROMPAIRS]: (data) => {
    if (!isArray(data)) return {};
    return fromPairs(data);
  },
  [BUILTIN_FUNCTIONS.TOPAIRS]: (data) => (isObject(data) ? toPairs(data) : []),
  [BUILTIN_FUNCTIONS.SUM]: (data) => {
    if (!isArray(data)) return 0;
    return sumNumbers(data);
  },
  [BUILTIN_FUNCTIONS.MEAN]: (data) => {
    const isEmptyOrNotArray = !isArray(data) || data.length === 0;
    if (isEmptyOrNotArray) return 0;
    const sum = sumNumbers(data);
    return sum / data.length;
  },
  [BUILTIN_FUNCTIONS.MIN]: (data) => {
    if (!isArray(data)) return undefined;
    return Math.min(...(data as number[]));
  },
  [BUILTIN_FUNCTIONS.MAX]: (data) => {
    if (!isArray(data)) return undefined;
    return Math.max(...(data as number[]));
  },
  [BUILTIN_FUNCTIONS.LEN]: (data) => {
    if (isArray(data)) return data.length;
    if (isObject(data)) return Object.keys(data).length;
    if (isString(data)) return data.length;
    return 0;
  },
  [BUILTIN_FUNCTIONS.COUNT]: (data) => {
    if (isArray(data)) return data.length;
    if (isObject(data)) return Object.keys(data).length;
    if (isString(data)) return data.length;
    return 0;
  },
  [BUILTIN_FUNCTIONS.ISEMPTY]: (data) => {
    if (isNil(data)) return true;
    if (isArray(data)) return data.length === 0;
    if (isObject(data)) return Object.keys(data).length === 0;
    if (isString(data)) return data.length === 0;
    return false;
  },
  [BUILTIN_FUNCTIONS.ISNIL]: isNil,
  [BUILTIN_FUNCTIONS.IDENTITY]: (data) => data,
  [BUILTIN_FUNCTIONS.TYPE]: getType,
  [BUILTIN_FUNCTIONS.RANGE]: (_, args) => {
    const [start, end, step = 1] = args as number[];
    const hasOnlyOneArg = end === undefined;
    const rangeStart = hasOnlyOneArg ? 0 : start;
    const rangeEnd = hasOnlyOneArg ? start : end;
    const rangeStep = step as number;
    const length = Math.max(0, Math.ceil((rangeEnd - rangeStart) / rangeStep));
    return Array.from({ length }, (_, i) => rangeStart + i * rangeStep);
  },
  [BUILTIN_FUNCTIONS.HAS]: (data, [key]) => {
    if (isObject(data)) {
      const keyStr = key as string;
      return keyStr in data;
    }
    if (isArray(data)) {
      const index = key as number;
      const isValidIndex = index >= 0 && index < data.length;
      return isValidIndex;
    }
    return false;
  },
  [BUILTIN_FUNCTIONS.NTH]: (data, [n]) => {
    if (!isArray(data)) return undefined;
    const index = n as number;
    const isNegativeIndex = index < 0;
    const normalizedIndex = isNegativeIndex ? data.length + index : index;
    return data[normalizedIndex];
  },
  [BUILTIN_FUNCTIONS.CONTAINS]: (data, [value]) => deepContains(data, value),
  [BUILTIN_FUNCTIONS.ADD]: (data) => {
    if (!isArray(data)) return data;
    const isEmpty = data.length === 0;
    if (isEmpty) return null;
    const firstIsString = isString(data[0]);
    const firstIsArray = isArray(data[0]);
    if (firstIsString) return data.join("");
    if (firstIsArray) return flattenOneLevel(data);
    return sumNumbers(data);
  },
  [BUILTIN_FUNCTIONS.PATH]: (data) => collectPaths(data, []),
  [BUILTIN_FUNCTIONS.GETPATH]: (data, [path]) => getValueAtPath(data, path as (string | number)[]),
  [BUILTIN_FUNCTIONS.SETPATH]: (data, [path, value]) =>
    setValueAtPath(data, path as (string | number)[], value),
  [BUILTIN_FUNCTIONS.RECURSE]: collectAllValues,
  [BUILTIN_FUNCTIONS.SPLIT]: (data, [sep]) => {
    if (!isString(data)) return [] as string[];
    const separator = sep as string;
    return data.split(separator);
  },
  [BUILTIN_FUNCTIONS.JOIN]: (data, [sep]) => {
    if (!isArray(data)) return "";
    const separator = sep as string;
    return data.join(separator);
  },
  [BUILTIN_FUNCTIONS.STARTSWITH]: (data, [prefix]) => {
    if (!isString(data)) return false;
    const prefixStr = prefix as string;
    return data.startsWith(prefixStr);
  },
  [BUILTIN_FUNCTIONS.ENDSWITH]: (data, [suffix]) => {
    if (!isString(data)) return false;
    const suffixStr = suffix as string;
    return data.endsWith(suffixStr);
  },
  [BUILTIN_FUNCTIONS.LTRIMSTR]: (data, [prefix]) => {
    if (!isString(data)) return data;
    const prefixStr = prefix as string;
    const hasPrefix = data.startsWith(prefixStr);
    return hasPrefix ? data.slice(prefixStr.length) : data;
  },
  [BUILTIN_FUNCTIONS.RTRIMSTR]: (data, [suffix]) => {
    if (!isString(data)) return data;
    const suffixStr = suffix as string;
    const hasSuffix = data.endsWith(suffixStr);
    return hasSuffix ? data.slice(0, -suffixStr.length) : data;
  },
  [BUILTIN_FUNCTIONS.TOSTRING]: (data) => {
    if (isString(data)) return data;
    if (isNil(data)) return String(data);
    return JSON.stringify(data);
  },
  [BUILTIN_FUNCTIONS.TONUMBER]: (data) => {
    if (isNumber(data)) return data;
    if (isString(data)) {
      const parsed = Number(data);
      const isValidNumber = !Number.isNaN(parsed);
      return isValidNumber ? parsed : null;
    }
    return null;
  },
  [BUILTIN_FUNCTIONS.FLOOR]: (data) => (isNumber(data) ? Math.floor(data) : null),
  [BUILTIN_FUNCTIONS.CEIL]: (data) => (isNumber(data) ? Math.ceil(data) : null),
  [BUILTIN_FUNCTIONS.ROUND]: (data) => (isNumber(data) ? Math.round(data) : null),
  [BUILTIN_FUNCTIONS.ABS]: (data) => (isNumber(data) ? Math.abs(data) : null),
  [BUILTIN_FUNCTIONS.NOT]: (data) => !data,
  [BUILTIN_FUNCTIONS.SELECT]: (data, [fn]) => {
    const predicate = fn as Predicate;
    const passes = predicate(data, 0, [data]);
    return passes ? data : EMPTY_SYMBOL;
  },
  [BUILTIN_FUNCTIONS.EMPTY]: () => EMPTY_SYMBOL,
  [BUILTIN_FUNCTIONS.ERROR]: (_, [msg]) => {
    throw new Error((msg as string) || "error");
  },
  [BUILTIN_FUNCTIONS.DEBUG]: (data) => {
    console.error("DEBUG:", data);
    return data;
  },
};

export const isBuiltin = (name: string): boolean => name in BUILTINS;

export const executeBuiltin = (name: string, data: unknown, args: unknown[]): unknown => {
  const fn = BUILTINS[name];
  if (!fn) throw new Error(`Unknown builtin: ${name}`);
  return fn(data, args);
};
