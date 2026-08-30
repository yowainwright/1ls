import type { CompletionResult } from "./types";
import { ALL_SUGGESTIONS, MAX_SUGGESTIONS } from "./constants";
import { scoreMatch, extractPartialMethod } from "./utils";

const EMPTY_RESULT: CompletionResult = {
  suggestions: [],
  prefix: "",
  startIndex: 0,
};

export const complete = (input: string): CompletionResult => {
  const partial = extractPartialMethod(input);
  const hasPartial = partial !== null;
  if (!hasPartial) {
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

export * from "./types";
export * from "./constants";
