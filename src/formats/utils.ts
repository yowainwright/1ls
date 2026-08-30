export const TRUTHY_VALUES = ["true", "yes", "on"] as const;
export const FALSY_VALUES = ["false", "no", "off"] as const;
export const NULL_VALUES = ["null", "~", ""] as const;

const TRUTHY_VALUE_SET = new Set<string>(TRUTHY_VALUES);
const FALSY_VALUE_SET = new Set<string>(FALSY_VALUES);
const NULL_VALUE_SET = new Set<string>(NULL_VALUES);

export const isTruthyValue = (value: string): value is (typeof TRUTHY_VALUES)[number] => {
  const normalizedValue = value.toLowerCase();
  return TRUTHY_VALUE_SET.has(normalizedValue);
};

export const isFalsyValue = (value: string): value is (typeof FALSY_VALUES)[number] => {
  const normalizedValue = value.toLowerCase();
  return FALSY_VALUE_SET.has(normalizedValue);
};

export const isNullValue = (value: string): value is (typeof NULL_VALUES)[number] => {
  const normalizedValue = value.toLowerCase();
  return NULL_VALUE_SET.has(normalizedValue);
};

export const parseBooleanValue = (value: string): boolean | undefined => {
  if (isTruthyValue(value)) return true;
  if (isFalsyValue(value)) return false;
  return undefined;
};

export const parseNullValue = (value: string): null | undefined => {
  if (isNullValue(value)) return null;
  return undefined;
};

export const tryParseNumber = (value: string): number | undefined => {
  if (value === "") return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

export const countQuotes = (line: string, endPos: number): number => {
  let count = 0;
  for (let i = 0; i < endPos; i++) {
    if (line[i] === '"') count++;
  }
  return count;
};

export const isQuoteBalanced = (quoteCount: number): boolean => quoteCount % 2 === 0;
