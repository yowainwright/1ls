import type { MethodHint } from "./types";

export function getSearchTerm(query: string, triggerAt: number): string {
  const lastDotIndex = query.lastIndexOf(".");
  if (lastDotIndex === -1) return query.slice(triggerAt);
  const term = query.slice(lastDotIndex + 1);
  return term.toLowerCase();
}

export function filterHints(hints: MethodHint[], searchTerm: string): MethodHint[] {
  if (!searchTerm) return hints;
  return hints.filter((hint) => {
    const match = hint.signature.match(/^\.?(\w+)/);
    const name = match?.[1].toLowerCase() ?? hint.signature.toLowerCase();
    return name.startsWith(searchTerm);
  });
}
