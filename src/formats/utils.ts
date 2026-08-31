export const TRUTHY_VALUES = ["true", "yes", "on"] as const;
export const FALSY_VALUES = ["false", "no", "off"] as const;
export const NULL_VALUES = ["null", "~", ""] as const;

export const isTruthyValue = (value: string): value is (typeof TRUTHY_VALUES)[number] => {
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === TRUTHY_VALUES[0]) return true;
  if (normalizedValue === TRUTHY_VALUES[1]) return true;
  return normalizedValue === TRUTHY_VALUES[2];
};

export const isFalsyValue = (value: string): value is (typeof FALSY_VALUES)[number] => {
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === FALSY_VALUES[0]) return true;
  if (normalizedValue === FALSY_VALUES[1]) return true;
  return normalizedValue === FALSY_VALUES[2];
};

export const isNullValue = (value: string): value is (typeof NULL_VALUES)[number] => {
  const normalizedValue = value.toLowerCase();
  if (normalizedValue === NULL_VALUES[0]) return true;
  if (normalizedValue === NULL_VALUES[1]) return true;
  return normalizedValue === NULL_VALUES[2];
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
