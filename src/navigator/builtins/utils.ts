export const isArray = (x: unknown): x is unknown[] => Array.isArray(x);

export const isObject = (x: unknown): x is Record<string, unknown> => {
  const isObjectValue = x !== null && typeof x === "object";
  return isObjectValue && !Array.isArray(x);
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
): Record<string, unknown> =>
  Object.keys(source).reduce(
    (result, key) => {
      const targetVal = target[key];
      const sourceVal = source[key];
      const shouldRecurseMerge = isObject(targetVal) && isObject(sourceVal);
      return {
        ...result,
        [key]: shouldRecurseMerge ? deepMerge(targetVal, sourceVal) : sourceVal,
      };
    },
    { ...target },
  );

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
    return Object.entries(value).every(
      ([k, v]) => k in containerObj && deepContains(containerObj[k], v),
    );
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

export const setValueAtPath = (
  data: unknown,
  path: (string | number)[],
  value: unknown,
): unknown => {
  if (path.length === 0) return value;

  const [first, ...rest] = path;
  const isArrayKey = isArray(data) && typeof first === "number";
  const isObjectKey = isObject(data) && typeof first === "string";
  const childData = isArrayKey
    ? data[first as number]
    : isObjectKey
      ? data[first as string]
      : undefined;
  const nestedValue = rest.length === 0 ? value : setValueAtPath(childData, rest, value);

  if (isArrayKey) {
    return data.map((item, i) => (i === first ? nestedValue : item));
  }

  if (isObjectKey) {
    return { ...data, [first]: nestedValue };
  }

  if (typeof first === "number") {
    return Array.from({ length: first + 1 }, (_, i) => (i === first ? nestedValue : undefined));
  }

  return { [first]: nestedValue };
};

export const collectAllValues = (data: unknown): unknown[] => {
  const self = [data];
  const children = isArray(data)
    ? data.flatMap(collectAllValues)
    : isObject(data)
      ? Object.values(data).flatMap(collectAllValues)
      : [];
  return [...self, ...children];
};

export const collectPaths = (
  val: unknown,
  currentPath: (string | number)[],
): (string | number)[][] => {
  const self = [currentPath];
  if (isArray(val)) {
    const childPaths = val.flatMap((item, i) => collectPaths(item, [...currentPath, i]));
    return [...self, ...childPaths];
  }
  if (isObject(val)) {
    const childPaths = Object.keys(val).flatMap((k) => collectPaths(val[k], [...currentPath, k]));
    return [...self, ...childPaths];
  }
  return self;
};
