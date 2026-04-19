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

export const getAllMethods = (): Method[] => {
  const seen = new Set<string>();
  const all: Method[] = [];

  const addUnique = (methods: Method[]) => {
    for (const m of methods) {
      if (!seen.has(m.name)) {
        seen.add(m.name);
        all.push(m);
      }
    }
  };

  addUnique(ARRAY_METHODS);
  addUnique(ARRAY_BUILTINS);
  addUnique(STRING_METHODS);
  addUnique(STRING_BUILTINS);
  addUnique(OBJECT_OPERATIONS);
  addUnique(OBJECT_BUILTINS);
  addUnique(NUMBER_METHODS);
  addUnique(NUMBER_BUILTINS);
  addUnique(UNIVERSAL_BUILTINS);

  return all;
};

export const getMethodsForType = (): Method[] => getAllMethods();
