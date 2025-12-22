import { ARROW_FN_PATTERNS, TEMPLATE_REPLACEMENTS, DEFAULT_PARAM_NAMES } from "./constants";

export const needsArrowFn = (template: string): boolean =>
  template.includes(ARROW_FN_PATTERNS.SINGLE_PARAM) ||
  template.includes(ARROW_FN_PATTERNS.SORT_PARAMS) ||
  template.includes(ARROW_FN_PATTERNS.REDUCE_PARAMS);

export const getParamName = (template: string): string =>
  template.includes(ARROW_FN_PATTERNS.SORT_PARAMS)
    ? DEFAULT_PARAM_NAMES.SORT
    : DEFAULT_PARAM_NAMES.DEFAULT;

export const getParamType = (value: unknown): string => {
  if (Array.isArray(value)) return "Array";
  if (value === null) return "null";
  if (typeof value === "object") return "Object";
  if (typeof value === "string") return "String";
  if (typeof value === "number") return "Number";
  if (typeof value === "boolean") return "Boolean";
  return "unknown";
};

export const getArraySampleValue = (value: unknown): unknown => {
  if (!Array.isArray(value)) return {};
  if (value.length === 0) return {};
  return value[0];
};

export const replaceLastOccurrence = (
  str: string,
  find: string,
  replace: string,
): string => {
  const lastIndex = str.lastIndexOf(find);
  if (lastIndex === -1) return str;
  return str.substring(0, lastIndex) + replace + str.substring(lastIndex + find.length);
};

export const replaceTemplateWithExpression = (
  expression: string,
  template: string,
  contextExpression: string,
): string => {
  if (template.includes(TEMPLATE_REPLACEMENTS.SINGLE_PARAM)) {
    return replaceLastOccurrence(
      expression,
      TEMPLATE_REPLACEMENTS.SINGLE_PARAM,
      `x => ${contextExpression}`,
    );
  }

  if (template.includes(TEMPLATE_REPLACEMENTS.SORT_COMPARE)) {
    return replaceLastOccurrence(
      expression,
      TEMPLATE_REPLACEMENTS.SORT_COMPARE,
      `(a, b) => ${contextExpression}`,
    );
  }

  if (template.includes(TEMPLATE_REPLACEMENTS.REDUCE_ACC)) {
    return replaceLastOccurrence(
      expression,
      TEMPLATE_REPLACEMENTS.REDUCE_ACC,
      `(acc, x) => ${contextExpression}`,
    );
  }

  return expression;
};

export const buildArrowExpression = (
  path: string,
  paramName: string,
): string => (path === "." ? paramName : `${paramName}${path}`);
