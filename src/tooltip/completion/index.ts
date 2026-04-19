import type { PartialMethod, CompletionResult } from "../../completion";
import {
  ALL_SUGGESTIONS,
  MAX_SUGGESTIONS,
  QUOTE_PATTERN,
  DOT_PATTERN,
  SCORE_PREFIX_MATCH,
  SCORE_CONTAINS_MATCH,
  SCORE_FUZZY_MATCH,
} from "../../completion";

const EMPTY_RESULT: CompletionResult = {
  suggestions: [],
  prefix: "",
  startIndex: 0,
};

const fuzzyMatch = (query: string, target: string): boolean => {
  const lowerQuery = query.toLowerCase();
  const lowerTarget = target.toLowerCase();

  let queryIdx = 0;
  for (let i = 0; i < lowerTarget.length && queryIdx < lowerQuery.length; i++) {
    const isMatch = lowerTarget[i] === lowerQuery[queryIdx];
    if (isMatch) {
      queryIdx++;
    }
  }
  return queryIdx === lowerQuery.length;
};

const scoreMatch = (query: string, target: string): number => {
  const lowerQuery = query.toLowerCase();
  const lowerTarget = target.toLowerCase();

  const isPrefixMatch = lowerTarget.startsWith(lowerQuery);
  if (isPrefixMatch) return SCORE_PREFIX_MATCH;

  const isContainsMatch = lowerTarget.includes(lowerQuery);
  if (isContainsMatch) return SCORE_CONTAINS_MATCH;

  const isFuzzyMatch = fuzzyMatch(query, target);
  if (isFuzzyMatch) return SCORE_FUZZY_MATCH;

  return 0;
};

export const extractPartialMethod = (input: string): PartialMethod | null => {
  const quoteMatch = input.match(QUOTE_PATTERN);
  if (quoteMatch) {
    const afterDot = quoteMatch[2] || "";
    const startIndex = input.length - afterDot.length;
    return { prefix: afterDot, startIndex };
  }

  const dotMatch = input.match(DOT_PATTERN);
  if (dotMatch) {
    const prefix = dotMatch[1];
    const startIndex = input.length - prefix.length;
    return { prefix, startIndex };
  }

  return null;
};

export const complete = (input: string): CompletionResult => {
  const partial = extractPartialMethod(input);
  const hasNoPartial = partial === null;
  if (hasNoPartial) {
    return EMPTY_RESULT;
  }

  const { prefix, startIndex } = partial;

  const scored = ALL_SUGGESTIONS
    .map((s) => ({ suggestion: s, score: scoreMatch(prefix, s.name) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const suggestions = scored.slice(0, MAX_SUGGESTIONS).map((s) => s.suggestion);

  return { suggestions, prefix, startIndex };
};
