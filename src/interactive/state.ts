import { fuzzySearch } from "./fuzzy";
import type { State, JsonPath } from "./types";

export const createInitialState = (
  paths: JsonPath[],
  originalData: unknown,
): State => {
  const matches = fuzzySearch(paths, "", (item) => item.path);
  const state = Object.assign(
    {},
    {
      mode: "explore" as const,
      paths,
      matches,
      query: "",
      selectedIndex: 0,
      builder: null,
      originalData,
      methodMatches: [],
      propertyMatches: [],
    },
  );
  return state;
};

export const updateQuery = (state: State, newQuery: string): State => {
  const matches = fuzzySearch(state.paths, newQuery, (item) => item.path);
  const selectedIndex = matches.length > 0 ? 0 : state.selectedIndex;

  const newState = Object.assign({}, state, {
    query: newQuery,
    matches,
    selectedIndex,
  });

  return newState;
};

export const updateSelection = (state: State, delta: number): State => {
  const isExploreMode = state.mode === "explore";
  const isBuildMode = state.mode === "build";

  const totalMatches = isExploreMode
    ? state.matches.length
    : isBuildMode
      ? state.methodMatches.length
      : state.propertyMatches.length;

  const hasNoMatches = totalMatches === 0;
  if (hasNoMatches) return state;

  const currentIndex = state.selectedIndex;
  let newIndex = currentIndex + delta;

  if (newIndex < 0) {
    newIndex = totalMatches - 1;
  } else if (newIndex >= totalMatches) {
    newIndex = 0;
  }

  const newState = Object.assign({}, state, {
    selectedIndex: newIndex,
  });

  return newState;
};

export const getSelectedPath = (state: State): JsonPath | null => {
  const hasMatches = state.matches.length > 0;
  const hasValidIndex =
    state.selectedIndex >= 0 && state.selectedIndex < state.matches.length;

  if (hasMatches && hasValidIndex) {
    return state.matches[state.selectedIndex].item;
  }

  return null;
};
