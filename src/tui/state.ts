import { fuzzySearch } from "./fuzzy";
import {
  createTooltipState,
  updateTooltipFromQuery,
  selectNextHint,
  selectPreviousHint,
  getSelectedHint,
} from "./tooltip";
import { evaluatePreview } from "./preview";
import type { State, JsonPath } from "./types";

export const createInitialState = (paths: JsonPath[], originalData: unknown): State => {
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
      tooltip: createTooltipState(),
    },
  );
  return state;
};

const detectDataType = (data: unknown): string => {
  if (data === null) return "null";
  if (Array.isArray(data)) return "Array";
  const type = typeof data;
  const typeMap: Record<string, string> = {
    string: "String",
    number: "Number",
    boolean: "Boolean",
    object: "Object",
  };
  return typeMap[type] || "unknown";
};

export const updateQuery = (state: State, newQuery: string): State => {
  const matches = fuzzySearch(state.paths, newQuery, (item) => item.path);
  const selectedIndex = matches.length > 0 ? 0 : state.selectedIndex;

  const lastDotIndex = newQuery.lastIndexOf(".");
  const prefix = lastDotIndex > 0 ? newQuery.slice(0, lastDotIndex) : "";
  const prefixResult = prefix ? evaluatePreview(prefix, state.originalData) : null;
  const dataType = prefixResult?.success ? detectDataType(prefixResult.value) : detectDataType(state.originalData);
  const tooltipContext = { query: newQuery, dataType, originalData: state.originalData };
  const tooltip = updateTooltipFromQuery(tooltipContext);

  return Object.assign({}, state, { query: newQuery, matches, selectedIndex, tooltip });
};

export const updateSelection = (state: State, delta: number): State => {
  const isExploreMode = state.mode === "explore";
  const isBuildMode = state.mode === "build";

  const isTooltipActive = isExploreMode && state.tooltip.visible;
  if (isTooltipActive) {
    const newTooltip = delta > 0 ? selectNextHint(state.tooltip) : selectPreviousHint(state.tooltip);
    return Object.assign({}, state, { tooltip: newTooltip });
  }

  const totalMatches = isExploreMode
    ? state.matches.length
    : isBuildMode
      ? state.methodMatches.length
      : state.propertyMatches.length;

  const hasNoMatches = totalMatches === 0;
  if (hasNoMatches) return state;

  const currentIndex = state.selectedIndex;
  const rawNext = currentIndex + delta;
  const newIndex = rawNext < 0 ? totalMatches - 1 : rawNext >= totalMatches ? 0 : rawNext;

  return Object.assign({}, state, { selectedIndex: newIndex });
};

export const acceptTooltipHint = (state: State): State => {
  const selectedMethod = getSelectedHint(state.tooltip);
  const hasNoMethod = !selectedMethod?.template;
  if (hasNoMethod) return state;

  const lastDotIndex = state.query.lastIndexOf(".");
  const prefix = lastDotIndex >= 0 ? state.query.slice(0, lastDotIndex) : "";
  const newQuery = prefix.concat(selectedMethod!.template!);
  return updateQuery(state, newQuery);
};

export const dismissTooltip = (state: State): State =>
  Object.assign({}, state, { tooltip: createTooltipState() });

export const getSelectedPath = (state: State): JsonPath | null => {
  const hasMatches = state.matches.length > 0;
  const hasValidIndex = state.selectedIndex >= 0 && state.selectedIndex < state.matches.length;

  const canSelectPath = hasMatches && hasValidIndex;
  if (canSelectPath) {
    return state.matches[state.selectedIndex].item;
  }

  return null;
};
