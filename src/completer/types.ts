export type SuggestionType = "method" | "builtin" | "shortcut" | "path";

export interface Suggestion {
  name: string;
  signature: string;
  description: string;
  type: SuggestionType;
  insertText?: string;
}

export interface CompletionResult {
  suggestions: Suggestion[];
  prefix: string;
  startIndex: number;
}

export interface PartialMethod {
  prefix: string;
  startIndex: number;
}
