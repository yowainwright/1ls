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

export const getMethodsForType = (type: string): Method[] => {
  const universal = UNIVERSAL_BUILTINS;

  switch (type) {
    case "Array":
      return [...ARRAY_METHODS, ...ARRAY_BUILTINS, ...universal];
    case "String":
      return [...STRING_METHODS, ...STRING_BUILTINS, ...universal];
    case "Object":
      return [...OBJECT_OPERATIONS, ...OBJECT_BUILTINS, ...universal];
    case "Number":
      return [...NUMBER_METHODS, ...NUMBER_BUILTINS, ...universal];
    default:
      return universal;
  }
};
