export const TRUTHY_VALUES = ["true", "yes", "on"] as const;
export const FALSY_VALUES = ["false", "no", "off"] as const;
export const NULL_VALUES = ["null", "~", ""] as const;

export const isTruthyValue = (value: string): value is typeof TRUTHY_VALUES[number] =>
  (TRUTHY_VALUES as readonly string[]).includes(value);

export const isFalsyValue = (value: string): value is typeof FALSY_VALUES[number] =>
  (FALSY_VALUES as readonly string[]).includes(value);

export const isNullValue = (value: string): value is typeof NULL_VALUES[number] =>
  (NULL_VALUES as readonly string[]).includes(value);

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

export const isQuoteBalanced = (quoteCount: number): boolean =>
  quoteCount % 2 === 0;
