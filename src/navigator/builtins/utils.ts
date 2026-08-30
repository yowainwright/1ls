export const isArray = (x: unknown): x is unknown[] => {
  const isArrayValue = Array.isArray(x);
  return isArrayValue;
};

export const isObject = (x: unknown): x is Record<string, unknown> => {
  const isObjectValue = x !== null && typeof x === "object";
  if (!isObjectValue) return false;

  return !Array.isArray(x);
};

export const isNil = (x: unknown): x is null | undefined => x === null || x === undefined;

export const isString = (x: unknown): x is string => typeof x === "string";

export const isNumber = (x: unknown): x is number => typeof x === "number";

export const getType = (x: unknown): string => {
  if (x === null) return "null";
  if (isArray(x)) return "array";
  return typeof x;
};

export const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];
    const shouldRecurseMerge = isObject(targetVal) && isObject(sourceVal);
    result[key] = shouldRecurseMerge ? deepMerge(targetVal, sourceVal) : sourceVal;
  }

  return result;
};

const containsArrayValue = (container: unknown[], value: unknown): boolean =>
  container.some((candidate) => deepContains(candidate, value));

const containsArrayValues = (container: unknown[], value: unknown[]): boolean =>
  value.every((item) => containsArrayValue(container, item));

export const deepContains = (container: unknown, value: unknown): boolean => {
  if (container === value) return true;

  const bothArrays = isArray(container) && isArray(value);
  if (bothArrays) {
    return containsArrayValues(container as unknown[], value as unknown[]);
  }

  const bothObjects = isObject(container) && isObject(value);
  if (bothObjects) {
    const containerObj = container as Record<string, unknown>;
    for (const [key, childValue] of Object.entries(value)) {
      const hasKey = key in containerObj;
      if (!hasKey) return false;
      if (!deepContains(containerObj[key], childValue)) return false;
    }

    return true;
  }

  return false;
};

export const getValueAtPath = (data: unknown, path: (string | number)[]): unknown =>
  path.reduce<unknown>((current, key) => {
    if (isNil(current)) return undefined;
    const isArrayKey = isArray(current) && typeof key === "number";
    if (isArrayKey) return current[key as number];
    const isObjectKey = isObject(current) && typeof key === "string";
    if (isObjectKey) return current[key as string];
    return undefined;
  }, data);

const getChildData = (
  data: unknown,
  key: string | number,
  isArrayKey: boolean,
  isObjectKey: boolean,
): unknown => {
  if (isArrayKey) return (data as unknown[])[key as number];
  if (isObjectKey) return (data as Record<string, unknown>)[key as string];

  return undefined;
};

const createArrayWithValue = (index: number, value: unknown): unknown[] => {
  const values: unknown[] = [];

  for (let itemIndex = 0; itemIndex <= index; itemIndex++) {
    values[itemIndex] = itemIndex === index ? value : undefined;
  }

  return values;
};

export const setValueAtPath = (
  data: unknown,
  path: (string | number)[],
  value: unknown,
): unknown => {
  if (path.length === 0) return value;

  const [first, ...rest] = path;
  const isArrayKey = isArray(data) && typeof first === "number";
  const isObjectKey = isObject(data) && typeof first === "string";
  const childData = getChildData(data, first, isArrayKey, isObjectKey);
  const nestedValue = rest.length === 0 ? value : setValueAtPath(childData, rest, value);

  if (isArrayKey) return data.map((item, i) => (i === first ? nestedValue : item));
  if (isObjectKey) {
    const dataObject = data as Record<string, unknown>;
    return { ...dataObject, [first]: nestedValue };
  }
  if (typeof first === "number") return createArrayWithValue(first, nestedValue);

  return { [first]: nestedValue };
};

export const collectAllValues = (data: unknown): unknown[] => {
  const self = [data];
  if (isArray(data)) return collectArrayValues(self, data);
  if (isObject(data)) return collectObjectValues(self, data);

  return self;
};

const appendValue = <T>(values: T[], value: T): void => {
  values[values.length] = value;
};

const appendValues = <T>(target: T[], values: T[]): void => {
  for (const value of values) {
    appendValue(target, value);
  }
};

const collectArrayValues = (self: unknown[], data: unknown[]): unknown[] => {
  const values = self.slice();

  for (const item of data) {
    appendValues(values, collectAllValues(item));
  }

  return values;
};

const collectObjectValues = (
  self: unknown[],
  data: Record<string, unknown>,
): unknown[] => {
  const values = self.slice();

  for (const key of Object.keys(data)) {
    appendValues(values, collectAllValues(data[key]));
  }

  return values;
};

export const collectPaths = (
  val: unknown,
  currentPath: (string | number)[],
): (string | number)[][] => {
  const self = [currentPath];
  if (isArray(val)) {
    return collectArrayPaths(self, val, currentPath);
  }
  if (isObject(val)) {
    return collectObjectPaths(self, val, currentPath);
  }
  return self;
};

const collectArrayPaths = (
  self: (string | number)[][],
  value: unknown[],
  currentPath: (string | number)[],
): (string | number)[][] => {
  const paths = self.slice();

  for (let index = 0; index < value.length; index++) {
    const childPath = currentPath.concat(index);
    appendValues(paths, collectPaths(value[index], childPath));
  }

  return paths;
};

const collectObjectPaths = (
  self: (string | number)[][],
  value: Record<string, unknown>,
  currentPath: (string | number)[],
): (string | number)[][] => {
  const paths = self.slice();

  for (const key of Object.keys(value)) {
    const childPath = currentPath.concat(key);
    appendValues(paths, collectPaths(value[key], childPath));
  }

  return paths;
};
