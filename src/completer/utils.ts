import type { PartialMethod } from "./types";
import {
  QUOTE_PATTERN,
  DOT_PATTERN,
  SCORE_PREFIX_MATCH,
  SCORE_CONTAINS_MATCH,
  SCORE_FUZZY_MATCH,
} from "./constants";

export const fuzzyMatch = (query: string, target: string): boolean => {
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

export const scoreMatch = (query: string, target: string): number => {
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
