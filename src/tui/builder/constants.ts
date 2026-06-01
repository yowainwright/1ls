export const ARROW_FN_PATTERNS = {
  SINGLE_PARAM: "x =>",
  SORT_PARAMS: "(a, b)",
  REDUCE_PARAMS: "(acc, x)",
} as const;

export const TEMPLATE_REPLACEMENTS = {
  SINGLE_PARAM: "x => x",
  SORT_COMPARE: "(a, b) => a - b",
  REDUCE_ACC: "(acc, x) => acc",
} as const;

export const DEFAULT_PARAM_NAMES = {
  SORT: "a",
  DEFAULT: "x",
} as const;
