export type { Method } from "./types";

export {
  ARRAY_METHODS,
  STRING_METHODS,
  OBJECT_OPERATIONS,
  NUMBER_METHODS,
  ARRAY_BUILTINS,
  OBJECT_BUILTINS,
  STRING_BUILTINS,
  NUMBER_BUILTINS,
  UNIVERSAL_BUILTINS,
} from "./constants";

import {
  ARRAY_METHODS,
  STRING_METHODS,
  OBJECT_OPERATIONS,
  NUMBER_METHODS,
  ARRAY_BUILTINS,
  OBJECT_BUILTINS,
  STRING_BUILTINS,
  NUMBER_BUILTINS,
  UNIVERSAL_BUILTINS,
} from "./constants";
import type { Method } from "./types";

const getUniqueMethods = (methods: Method[], key: (method: Method) => string): Method[] => {
  const seen = new Set<string>();
  const unique: Method[] = [];

  for (const method of methods) {
    const id = key(method);
    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    unique.push(method);
  }

  return unique;
};

export const getAllMethods = (): Method[] =>
  getUniqueMethods(
    [
      ...ARRAY_METHODS,
      ...ARRAY_BUILTINS,
      ...STRING_METHODS,
      ...STRING_BUILTINS,
      ...OBJECT_OPERATIONS,
      ...OBJECT_BUILTINS,
      ...NUMBER_METHODS,
      ...NUMBER_BUILTINS,
      ...UNIVERSAL_BUILTINS,
    ],
    (method) => method.signature,
  );

const METHODS_BY_TYPE: Record<string, Method[]> = {
  Array: getUniqueMethods(
    [...ARRAY_METHODS, ...ARRAY_BUILTINS, ...UNIVERSAL_BUILTINS],
    (method) => method.name,
  ),
  String: getUniqueMethods(
    [...STRING_METHODS, ...STRING_BUILTINS, ...UNIVERSAL_BUILTINS],
    (method) => method.name,
  ),
  Object: getUniqueMethods(
    [...OBJECT_OPERATIONS, ...OBJECT_BUILTINS, ...UNIVERSAL_BUILTINS],
    (method) => method.name,
  ),
  Number: getUniqueMethods(
    [...NUMBER_METHODS, ...NUMBER_BUILTINS, ...UNIVERSAL_BUILTINS],
    (method) => method.name,
  ),
  Boolean: [...UNIVERSAL_BUILTINS],
  null: [...UNIVERSAL_BUILTINS],
  unknown: [...UNIVERSAL_BUILTINS],
};

export const getMethodsForType = (dataType?: string): Method[] => {
  if (!dataType) {
    return getAllMethods();
  }

  return METHODS_BY_TYPE[dataType] ?? METHODS_BY_TYPE.unknown;
};
