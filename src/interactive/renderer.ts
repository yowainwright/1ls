import { stdout } from "process";
import { clearScreen, clearLine, clearToEnd, moveCursor, colors, colorize, highlightMatches } from "./terminal";
import { renderBuildMode, renderArrowFnMode } from "./renderer-builder";
import { isMethodComplete, getPreviewForExpression } from "./tooltip";
import type { State, JsonPath, TooltipState, Method } from "./types";
import type { FuzzyMatch } from "./fuzzy";

const MAX_VISIBLE_ITEMS = 10;

let lastRenderedLines: string[] = [];
let isFirstRender = true;

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

const PRIMITIVE_TYPES = ["String", "Number", "Boolean", "null"];
const COMPLEX_TYPES = ["Array", "Object"];
const MAX_PREVIEW_LINES = 5;

const formatPrimitivePreview = (displayValue: string): string =>
  colorize(String(displayValue), colors.cyan);

const formatComplexPreview = (value: unknown): string => {
  const formatted = JSON.stringify(value, null, 2);
  const lines = formatted.split("\n");
  const limited = lines.slice(0, MAX_PREVIEW_LINES);
  const hasMore = lines.length > MAX_PREVIEW_LINES;
  const preview = colorize(limited.join("\n"), colors.cyan);

  return hasMore
    ? preview.concat(colorize("\n... (truncated)", colors.dim))
    : preview;
};

const formatPreviewContent = (selected: JsonPath): string => {
  const { type, displayValue, value } = selected;

  const isPrimitive = PRIMITIVE_TYPES.includes(type);
  if (isPrimitive) return formatPrimitivePreview(displayValue);

  const isComplex = COMPLEX_TYPES.includes(type);
  if (isComplex) return formatComplexPreview(value);

  return colorize(String(value), colors.cyan);
};

const renderPreview = (state: State): string => {
  const { matches, selectedIndex } = state;

  const hasMatches = matches.length > 0;
  const hasValidIndex = selectedIndex >= 0 && selectedIndex < matches.length;
  const canRenderPreview = hasMatches && hasValidIndex;

  if (!canRenderPreview) return "";

  const selected = matches[selectedIndex].item;
  const previewTitle = colorize("\n\nPreview:\n", colors.bright);
  const previewContent = formatPreviewContent(selected);

  return previewTitle.concat(previewContent);
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

const formatTooltipMethod = (
  match: FuzzyMatch<Method>,
  isSelected: boolean,
): string => {
  const method = match.item;
  const prefix = isSelected ? colorize("›", colors.cyan) : " ";
  const signature = colorize(method.signature, colors.bright);
  const description = colorize(" - " + method.description, colors.dim);
  const builtinTag = method.isBuiltin ? colorize(" [builtin]", colors.yellow) : "";

  return prefix.concat(" ", signature, description, builtinTag);
};

const renderTooltipHints = (tooltip: TooltipState): string[] => {
  const hasNoHints = !tooltip.visible || tooltip.methodHints.length === 0;
  if (hasNoHints) return [];

  const header = colorize("Method hints:", colors.dim);
  const hints = tooltip.methodHints.map((match, index) => {
    const isSelected = index === tooltip.selectedHintIndex;
    return formatTooltipMethod(match, isSelected);
  });

  return ["", header, ...hints];
};

const renderExpressionPreview = (state: State): string[] => {
  const hasQuery = state.query.length > 0;
  const queryHasMethod = state.query.includes(".");
  const methodComplete = isMethodComplete(state.query);

  const shouldShowPreview = hasQuery && queryHasMethod && methodComplete;
  if (!shouldShowPreview) return [];

  const { success, preview } = getPreviewForExpression(state.query, state.originalData);
  const previewTitle = colorize("\nResult:", colors.bright);
  const previewColor = success ? colors.cyan : colors.yellow;
  const previewLines = preview.split("\n").slice(0, 5);
  const formattedPreview = previewLines.map((line) => colorize(line, previewColor));

  return [previewTitle, ...formattedPreview];
};

const calculateVisibleRange = (selectedIndex: number, totalMatches: number): { start: number; end: number } => {
  const halfWindow = Math.floor(MAX_VISIBLE_ITEMS / 2);
  const initialStart = Math.max(0, selectedIndex - halfWindow);
  const end = Math.min(totalMatches, initialStart + MAX_VISIBLE_ITEMS);

  const actualVisible = end - initialStart;
  const needsAdjustment = actualVisible < MAX_VISIBLE_ITEMS && totalMatches >= MAX_VISIBLE_ITEMS;
  const start = needsAdjustment ? Math.max(0, end - MAX_VISIBLE_ITEMS) : initialStart;

  return { start, end };
};

const buildMatchLines = (state: State): string[] => {
  const { selectedIndex, matches } = state;
  const totalMatches = matches.length;

  const hasNoMatches = totalMatches === 0;
  if (hasNoMatches) {
    return [colorize("No matches found", colors.dim)];
  }

  const { start, end } = calculateVisibleRange(selectedIndex, totalMatches);
  const visibleMatches = matches.slice(start, end);

  return visibleMatches.map((match, i) => {
    const absoluteIndex = start + i;
    const isSelected = absoluteIndex === selectedIndex;
    return formatPathEntry(match, isSelected);
  });
};

const buildRemainingIndicator = (totalMatches: number): string[] => {
  const remaining = totalMatches - MAX_VISIBLE_ITEMS;
  const hasMore = remaining > 0;

  return hasMore
    ? ["", colorize("... " + remaining + " more", colors.dim)]
    : [];
};

const buildPreviewLines = (state: State): string[] => {
  const preview = renderPreview(state);
  return preview ? preview.split("\n") : [];
};

const buildExploreContent = (state: State): string[] => {
  const header = [renderTitle(), "", "Search: " + state.query, ""];
  const matchLines = buildMatchLines(state);
  const remainingIndicator = buildRemainingIndicator(state.matches.length);
  const tooltipHints = renderTooltipHints(state.tooltip);
  const expressionPreview = renderExpressionPreview(state);
  const previewLines = buildPreviewLines(state);
  const footer = ["", renderHelp().trim()];

  return header
    .concat(matchLines)
    .concat(remainingIndicator)
    .concat(tooltipHints)
    .concat(expressionPreview)
    .concat(previewLines)
    .concat(footer);
};

const renderFirstTime = (lines: string[]): void => {
  clearScreen();
  stdout.write(lines.join("\n"));
  lastRenderedLines = lines;
  isFirstRender = false;
};

const renderChangedLine = (line: string, index: number): void => {
  moveCursor(index + 1);
  clearLine();
  stdout.write(line);
};

const renderDiff = (newLines: string[]): void => {
  if (isFirstRender) {
    renderFirstTime(newLines);
    return;
  }

  newLines.forEach((line, i) => {
    const hasChanged = lastRenderedLines[i] !== line;
    if (hasChanged) renderChangedLine(line, i);
  });

  const hasShrunk = newLines.length < lastRenderedLines.length;
  if (hasShrunk) {
    moveCursor(newLines.length + 1);
    clearToEnd();
  }

  lastRenderedLines = newLines;
};

const renderExploreMode = (state: State): void => {
  const lines = buildExploreContent(state);
  renderDiff(lines);
};

const MODE_RENDERERS: Record<State["mode"], (state: State) => void> = {
  explore: renderExploreMode,
  build: renderBuildMode,
  "build-arrow-fn": renderArrowFnMode,
};

export const resetRenderState = (): void => {
  lastRenderedLines = [];
  isFirstRender = true;
};

export const render = (state: State): void => {
  const renderer = MODE_RENDERERS[state.mode];
  renderer(state);
};
