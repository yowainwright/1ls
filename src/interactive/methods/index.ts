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

const METHOD_MAP = new Map<string, Method[]>([
  ["Array", [...ARRAY_METHODS, ...ARRAY_BUILTINS, ...UNIVERSAL_BUILTINS]],
  ["String", [...STRING_METHODS, ...STRING_BUILTINS, ...UNIVERSAL_BUILTINS]],
  ["Object", [...OBJECT_OPERATIONS, ...OBJECT_BUILTINS, ...UNIVERSAL_BUILTINS]],
  ["Number", [...NUMBER_METHODS, ...NUMBER_BUILTINS, ...UNIVERSAL_BUILTINS]],
]);

export const getMethodsForType = (type: string): Method[] =>
  METHOD_MAP.get(type) ?? UNIVERSAL_BUILTINS;
