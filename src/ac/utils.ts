import {
  ALL_SUGGESTIONS,
  ARRAY_SUGGESTIONS,
  DOT_PATTERN,
  MAX_SUGGESTIONS,
  NUMBER_SUGGESTIONS,
  OBJECT_SUGGESTIONS,
  QUOTE_PATTERN,
  STRING_SUGGESTIONS,
} from "./constants";
import type { FuzzyMatch, PartialMethod, Suggestion } from "./types";

export const detectDataType = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "Array";

  const type = typeof value;
  if (type === "string") return "String";
  if (type === "number") return "Number";
  if (type === "boolean") return "Boolean";
  if (type === "object") return "Object";

  return "unknown";
};

const calculateScore = (text: string, pattern: string, matches: number[]): number => {
  const baseScore = matches.length * 100;
  const firstMatch = matches[0];
  const startBonus = firstMatch === 0 ? 10 : 0;
  const lengthPenalty = text.length - pattern.length;
  const consecutiveBonus = matches.reduce(getConsecutiveBonus, 0);

  return baseScore + consecutiveBonus + startBonus - lengthPenalty;
};

const getConsecutiveBonus = (
  bonus: number,
  position: number,
  index: number,
  matches: number[],
): number => {
  if (index === 0) return bonus;

  const previousMatch = matches[index - 1];
  const isConsecutive = previousMatch === position - 1;
  if (!isConsecutive) return bonus;

  return bonus + 5;
};

const findMatches = (text: string, pattern: string): number[] | null => {
  const lowerText = text.toLowerCase();
  const lowerPattern = pattern.toLowerCase();
  const matches: number[] = [];
  let patternIndex = 0;

  for (let textIndex = 0; textIndex < lowerText.length; textIndex++) {
    const patternChar = lowerPattern[patternIndex];
    if (lowerText[textIndex] !== patternChar) continue;

    matches.push(textIndex);
    patternIndex = patternIndex + 1;
  }

  return patternIndex === lowerPattern.length ? matches : null;
};

const createFuzzyMatch = <T>(item: T, text: string, pattern: string): FuzzyMatch<T> | null => {
  const matches = findMatches(text, pattern);
  if (!matches) return null;

  const score = calculateScore(text, pattern, matches);
  return { item, score, matches };
};

const compareScores = <T>(a: FuzzyMatch<T>, b: FuzzyMatch<T>): number => b.score - a.score;

const isFuzzyMatch = <T>(match: FuzzyMatch<T> | null): match is FuzzyMatch<T> => match !== null;

export const fuzzySearch = <T>(
  items: T[],
  pattern: string,
  getText: (item: T) => string,
): FuzzyMatch<T>[] => {
  if (!pattern) {
    return items.map((item) => ({ item, score: 0, matches: [] }));
  }

  return items
    .map((item) => createFuzzyMatch(item, getText(item), pattern))
    .filter(isFuzzyMatch)
    .sort(compareScores);
};

export const extractPartialMethod = (input: string): PartialMethod | null => {
  const quoteMatch = input.match(QUOTE_PATTERN);
  if (quoteMatch) {
    const prefix = quoteMatch[2] || "";
    return { prefix, startIndex: input.length - prefix.length };
  }

  const dotMatch = input.match(DOT_PATTERN);
  if (!dotMatch) return null;

  const prefix = dotMatch[1] || "";
  return { prefix, startIndex: input.length - prefix.length };
};

const hasSuggestionName = (names: readonly string[], suggestion: Suggestion): boolean =>
  names.includes(suggestion.name);

export const getSuggestionsForType = (dataType?: string): Suggestion[] => {
  if (dataType === "Array") {
    return ALL_SUGGESTIONS.filter((suggestion) => hasSuggestionName(ARRAY_SUGGESTIONS, suggestion));
  }

  if (dataType === "String") {
    return ALL_SUGGESTIONS.filter((suggestion) =>
      hasSuggestionName(STRING_SUGGESTIONS, suggestion),
    );
  }

  if (dataType === "Object") {
    return ALL_SUGGESTIONS.filter((suggestion) =>
      hasSuggestionName(OBJECT_SUGGESTIONS, suggestion),
    );
  }

  if (dataType === "Number") {
    return ALL_SUGGESTIONS.filter((suggestion) =>
      hasSuggestionName(NUMBER_SUGGESTIONS, suggestion),
    );
  }

  return ALL_SUGGESTIONS.slice(0, MAX_SUGGESTIONS);
};
