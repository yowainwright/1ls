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

export const BUILTINS: Record<string, BuiltinFn> = {
  [BUILTIN_FUNCTIONS.HEAD]: (data) => (isArray(data) ? data[0] : undefined),
  [BUILTIN_FUNCTIONS.LAST]: (data) =>
    isArray(data) ? data[data.length - 1] : undefined,
  [BUILTIN_FUNCTIONS.TAIL]: (data) => (isArray(data) ? data.slice(1) : []),
  [BUILTIN_FUNCTIONS.TAKE]: (data, [n]) =>
    isArray(data) ? data.slice(0, n as number) : [],
  [BUILTIN_FUNCTIONS.DROP]: (data, [n]) =>
    isArray(data) ? data.slice(n as number) : [],
  [BUILTIN_FUNCTIONS.UNIQ]: (data) => (isArray(data) ? [...new Set(data)] : []),
  [BUILTIN_FUNCTIONS.FLATTEN]: (data) =>
    isArray(data) ? data.flat(Infinity) : [],
  [BUILTIN_FUNCTIONS.REVERSE]: (data) =>
    isArray(data) ? [...data].reverse() : [],
  [BUILTIN_FUNCTIONS.GROUPBY]: (data, [fn]) => {
    if (!isArray(data)) return {};
    const keyFn = fn as KeyExtractor;
    return data.reduce<Record<string, unknown[]>>((acc, item) => {
      const key = String(keyFn(item));
      const existing = acc[key] || [];
      return { ...acc, [key]: [...existing, item] };
    }, {});
  },
  [BUILTIN_FUNCTIONS.SORTBY]: (data, [fn]) => {
    if (!isArray(data)) return [];
    const keyFn = fn as KeyExtractor;
    return [...data].sort((a, b) => {
      const aVal = keyFn(a) as string | number;
      const bVal = keyFn(b) as string | number;
      const aLessThanB = aVal < bVal;
      const aGreaterThanB = aVal > bVal;
      if (aLessThanB) return -1;
      if (aGreaterThanB) return 1;
      return 0;
    });
  },
  [BUILTIN_FUNCTIONS.CHUNK]: (data, [size]) => {
    if (!isArray(data)) return [];
    const n = size as number;
    const numChunks = Math.ceil(data.length / n);
    return Array.from({ length: numChunks }, (_, i) =>
      data.slice(i * n, (i + 1) * n),
    );
  },
  [BUILTIN_FUNCTIONS.COMPACT]: (data) =>
    isArray(data) ? data.filter(Boolean) : [],
  [BUILTIN_FUNCTIONS.PLUCK]: (data, [key]) => {
    if (!isArray(data)) return [];
    return data.map((item) => (isObject(item) ? item[key as string] : undefined));
  },
  [BUILTIN_FUNCTIONS.PICK]: (data, args) => {
    if (!isObject(data)) return {};
    const isSingleArrayArg = args.length === 1 && isArray(args[0]);
    const keys = isSingleArrayArg ? (args[0] as string[]) : (args as string[]);
    return keys.reduce((acc, key) => {
      const keyStr = key as string;
      const hasKey = keyStr in data;
      return hasKey ? { ...acc, [keyStr]: data[keyStr] } : acc;
    }, {} as Record<string, unknown>);
  },
  [BUILTIN_FUNCTIONS.OMIT]: (data, args) => {
    if (!isObject(data)) return {};
    const isSingleArrayArg = args.length === 1 && isArray(args[0]);
    const keysToOmit = isSingleArrayArg
      ? (args[0] as string[])
      : (args as string[]);
    const keySet = new Set(keysToOmit);
    return Object.fromEntries(
      Object.entries(data).filter(([k]) => !keySet.has(k)),
    );
  },
  [BUILTIN_FUNCTIONS.KEYS]: (data) => (isObject(data) ? Object.keys(data) : []),
  [BUILTIN_FUNCTIONS.VALUES]: (data) =>
    isObject(data) ? Object.values(data) : [],
  [BUILTIN_FUNCTIONS.MERGE]: (data, args) => {
    if (!isObject(data)) return {};
    return args.reduce<Record<string, unknown>>((acc, obj) => {
      const objRecord = obj as Record<string, unknown>;
      return { ...acc, ...objRecord };
    }, data);
  },
  [BUILTIN_FUNCTIONS.DEEPMERGE]: (data, args) => {
    if (!isObject(data)) return {};
    return args.reduce<Record<string, unknown>>((acc, obj) => {
      const shouldMerge = isObject(obj);
      return shouldMerge ? deepMerge(acc, obj) : acc;
    }, data);
  },
  [BUILTIN_FUNCTIONS.FROMPAIRS]: (data) => {
    if (!isArray(data)) return {};
    return Object.fromEntries(data as [string, unknown][]);
  },
  [BUILTIN_FUNCTIONS.TOPAIRS]: (data) =>
    isObject(data) ? Object.entries(data) : [],
  [BUILTIN_FUNCTIONS.SUM]: (data) => {
    if (!isArray(data)) return 0;
    return data.reduce<number>((acc, val) => acc + (val as number), 0);
  },
  [BUILTIN_FUNCTIONS.MEAN]: (data) => {
    const isEmptyOrNotArray = !isArray(data) || data.length === 0;
    if (isEmptyOrNotArray) return 0;
    const sum = data.reduce<number>((acc, val) => acc + (val as number), 0);
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
  [BUILTIN_FUNCTIONS.ISNIL]: (data) => isNil(data),
  [BUILTIN_FUNCTIONS.IDENTITY]: (data) => data,
  [BUILTIN_FUNCTIONS.TYPE]: (data) => getType(data),
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
    if (firstIsArray) return data.flat();
    return data.reduce<number>((acc, val) => acc + (val as number), 0);
  },
  [BUILTIN_FUNCTIONS.PATH]: (data) => collectPaths(data, []),
  [BUILTIN_FUNCTIONS.GETPATH]: (data, [path]) =>
    getValueAtPath(data, path as (string | number)[]),
  [BUILTIN_FUNCTIONS.SETPATH]: (data, [path, value]) =>
    setValueAtPath(data, path as (string | number)[], value),
  [BUILTIN_FUNCTIONS.RECURSE]: (data) => collectAllValues(data),
  [BUILTIN_FUNCTIONS.SPLIT]: (data, [sep]) => {
    if (!isString(data)) return [];
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
    const passes = predicate(data);
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

export const executeBuiltin = (
  name: string,
  data: unknown,
  args: unknown[],
): unknown => {
  const fn = BUILTINS[name];
  if (!fn) throw new Error(`Unknown builtin: ${name}`);
  return fn(data, args);
};
