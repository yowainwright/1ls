import { stdout } from "process";
import { clearScreen, colors, colorize, highlightMatches } from "./terminal";
import { renderBuildMode, renderArrowFnMode } from "./renderer-builder";
import type { State, JsonPath } from "./types";
import type { FuzzyMatch } from "./fuzzy";

const MAX_VISIBLE_ITEMS = 10;

const formatPath = (path: string, matches: number[]): string =>
  highlightMatches(path, matches);

const formatType = (type: string): string => {
  const prefix = "[";
  const suffix = "]";
  const text = prefix.concat(type, suffix);
  return colorize(text, colors.dim);
};

const formatValue = (displayValue: string): string =>
  colorize(displayValue, colors.gray);

const formatPrefix = (isSelected: boolean): string => {
  const selectedPrefix = colorize("❯", colors.green);
  const unselectedPrefix = " ";
  return isSelected ? selectedPrefix : unselectedPrefix;
};

const formatPathEntry = (
  match: FuzzyMatch<JsonPath>,
  isSelected: boolean,
): string => {
  const item = match.item;
  const matches = match.matches;

  const prefix = formatPrefix(isSelected);
  const pathText = formatPath(item.path, matches);
  const typeText = formatType(item.type);
  const valueText = formatValue(item.displayValue);

  const line = prefix
    .concat(" ", pathText)
    .concat(" ", typeText)
    .concat(" ", valueText);

  return line;
};

const renderTitle = (): string => {
  const title = "1ls Interactive Explorer";
  const color = colors.bright.concat(colors.cyan);
  return colorize(title, color);
};

const renderPrompt = (query: string): string => {
  const title = renderTitle();
  const searchLabel = "\n\nSearch: ";
  const prompt = title.concat(searchLabel, query, "\n\n");
  return prompt;
};

const renderVisiblePaths = (state: State): string => {
  const selectedIndex = state.selectedIndex;
  const totalMatches = state.matches.length;

  if (totalMatches === 0) {
    return colorize("No matches found", colors.dim);
  }

  const halfWindow = Math.floor(MAX_VISIBLE_ITEMS / 2);
  let startIndex = Math.max(0, selectedIndex - halfWindow);
  const endIndex = Math.min(totalMatches, startIndex + MAX_VISIBLE_ITEMS);

  const actualVisible = endIndex - startIndex;
  if (actualVisible < MAX_VISIBLE_ITEMS && totalMatches >= MAX_VISIBLE_ITEMS) {
    startIndex = Math.max(0, endIndex - MAX_VISIBLE_ITEMS);
  }

  const visibleMatches = state.matches.slice(startIndex, endIndex);
  const mapper = (match: FuzzyMatch<JsonPath>, idx: number): string => {
    const absoluteIndex = startIndex + idx;
    const isSelected = absoluteIndex === selectedIndex;
    return formatPathEntry(match, isSelected);
  };
  const lines = visibleMatches.map(mapper);
  const joined = lines.join("\n");
  return joined;
};

const renderPreview = (state: State): string => {
  const hasMatches = state.matches.length > 0;
  const hasValidIndex =
    state.selectedIndex >= 0 && state.selectedIndex < state.matches.length;

  if (!hasMatches || !hasValidIndex) {
    return "";
  }

  const selected = state.matches[state.selectedIndex].item;
  const previewTitle = colorize("\n\nPreview:\n", colors.bright);

  let preview = "";
  const valueType = selected.type;

  if (valueType === "String" || valueType === "Number" || valueType === "Boolean" || valueType === "null") {
    preview = colorize(String(selected.displayValue), colors.cyan);
  } else if (valueType === "Array" || valueType === "Object") {
    const formatted = JSON.stringify(selected.value, null, 2);
    const lines = formatted.split("\n");
    const limited = lines.slice(0, 5);
    const hasMore = lines.length > 5;
    preview = colorize(limited.join("\n"), colors.cyan);
    if (hasMore) {
      preview = preview.concat(colorize("\n... (truncated)", colors.dim));
    }
  } else {
    preview = colorize(String(selected.value), colors.cyan);
  }

  return previewTitle.concat(preview);
};

const renderMoreIndicator = (totalCount: number): string => {
  const remaining = totalCount - MAX_VISIBLE_ITEMS;
  const hasMore = remaining > 0;

  if (hasMore) {
    const text = "\n\n... ".concat(String(remaining), " more");
    return colorize(text, colors.dim);
  }

  return "";
};

const renderHelp = (): string => {
  const help = "\n\n".concat(
    colorize("↑/↓", colors.bright),
    " navigate  ",
    colorize("Enter", colors.bright),
    " select  ",
    colorize("Tab", colors.bright),
    " build  ",
    colorize("Esc/q", colors.bright),
    " quit",
  );
  return colorize(help, colors.dim);
};

const renderExploreMode = (state: State): void => {
  clearScreen();

  const prompt = renderPrompt(state.query);
  stdout.write(prompt);

  const paths = renderVisiblePaths(state);
  stdout.write(paths);

  const moreIndicator = renderMoreIndicator(state.matches.length);
  stdout.write(moreIndicator);

  const preview = renderPreview(state);
  stdout.write(preview);

  const help = renderHelp();
  stdout.write(help);
};

const MODE_RENDERERS: Record<State["mode"], (state: State) => void> = {
  explore: renderExploreMode,
  build: renderBuildMode,
  "build-arrow-fn": renderArrowFnMode,
};

export const render = (state: State): void => {
  const renderer = MODE_RENDERERS[state.mode];
  renderer(state);
};
