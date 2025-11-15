import type { JsonPath } from "./types";

const getType = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "Array";
  const type = typeof value;
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatDisplayValue = (value: unknown, type: string): string => {
  if (type === "null") return "null";
  if (type === "String") return `"${value}"`;
  if (type === "Array") return `[${(value as unknown[]).length} items]`;
  if (type === "Object") return `{${Object.keys(value as object).length} keys}`;
  return String(value);
};

const flattenJson = (
  obj: unknown,
  prefix: string = "",
  result: JsonPath[] = [],
): JsonPath[] => {
  if (obj === null || obj === undefined) {
    const type = getType(obj);
    const displayValue = formatDisplayValue(obj, type);
    result.push({ path: prefix || ".", value: obj, type, displayValue });
    return result;
  }

  if (Array.isArray(obj)) {
    const type = getType(obj);
    const displayValue = formatDisplayValue(obj, type);
    const arrayPath = prefix || ".";
    result.push({ path: arrayPath, value: obj, type, displayValue });

    obj.forEach((item, index) => {
      const newPrefix = prefix ? `${prefix}[${index}]` : `.[${index}]`;
      flattenJson(item, newPrefix, result);
    });

    return result;
  }

  if (typeof obj === "object") {
    const type = getType(obj);
    const displayValue = formatDisplayValue(obj, type);
    const objectPath = prefix || ".";

    if (prefix) {
      result.push({ path: objectPath, value: obj, type, displayValue });
    }

    const entries = Object.entries(obj);
    entries.forEach(([key, value]) => {
      const needsBrackets = /[^a-zA-Z0-9_$]/.test(key);
      const newPrefix = prefix
        ? needsBrackets
          ? `${prefix}["${key}"]`
          : `${prefix}.${key}`
        : needsBrackets
          ? `.["${key}"]`
          : `.${key}`;
      flattenJson(value, newPrefix, result);
    });

    return result;
  }

  const type = getType(obj);
  const displayValue = formatDisplayValue(obj, type);
  const path = prefix || ".";
  result.push({ path, value: obj, type, displayValue });

  return result;
};

export const navigateJson = (data: unknown): JsonPath[] => {
  const paths = flattenJson(data);
  return paths;
};
