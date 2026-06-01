import { stdout } from "process";
import {
  clearScreen,
  clearLine,
  clearToEnd,
  moveCursor,
  colors,
  colorize,
  highlightMatches,
} from "./terminal";
import { renderBuildMode, renderArrowFnMode } from "./renderer-builder";
import { isMethodComplete, getPreviewForExpression } from "./tooltip";
import type { State, JsonPath } from "./types";
import type { FuzzyMatch } from "./fuzzy";
import type { Method } from "./methods/types";

const MAX_VISIBLE_ITEMS = 10;

let lastRenderedLines: string[] = [];
let isFirstRender = true;

const formatPath = (path: string, matches: number[]): string => highlightMatches(path, matches);

const formatType = (type: string): string => {
  const prefix = "[";
  const suffix = "]";
  const text = prefix.concat(type, suffix);
  return colorize(text, colors.dim);
};

const formatValue = (displayValue: string): string => colorize(displayValue, colors.gray);

const formatPrefix = (isSelected: boolean): string => {
  const selectedPrefix = colorize("❯", colors.green);
  const unselectedPrefix = " ";
  return isSelected ? selectedPrefix : unselectedPrefix;
};

const formatPathEntry = (match: FuzzyMatch<JsonPath>, isSelected: boolean): string => {
  const item = match.item;
  const matches = match.matches;

  const prefix = formatPrefix(isSelected);
  const pathText = formatPath(item.path, matches);
  const typeText = formatType(item.type);
  const valueText = formatValue(item.displayValue);

  const line = prefix.concat(" ", pathText).concat(" ", typeText).concat(" ", valueText);

  return line;
};

const TOOLTIP_SEPARATOR = "  ".concat("─".repeat(48));

const renderTooltipHintRow = (match: FuzzyMatch<Method>, isSelected: boolean): string => {
  const method = match.item;
  const prefix = formatPrefix(isSelected);
  const signature = isSelected ? colorize(method.signature, colors.bright) : method.signature;
  const category = method.category ? colorize(`  [${method.category}]`, colors.dim) : "";
  const description = colorize(`  ${method.description}`, colors.gray);
  return prefix.concat(" ", signature, category, description);
};

const renderTooltipSection = (state: State): string[] => {
  if (!state.tooltip.visible) return [];
  const { methodHints, selectedHintIndex } = state.tooltip;
  const hintLines = methodHints.map((match, i) => renderTooltipHintRow(match, i === selectedHintIndex));
  return ["", ...hintLines, colorize(TOOLTIP_SEPARATOR, colors.dim)];
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

  return hasMore ? preview.concat(colorize("\n... (truncated)", colors.dim)) : preview;
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

const renderHelp = (tooltipVisible: boolean): string => {
  const help = tooltipVisible
    ? "\n\n".concat(
        colorize("↑/↓", colors.bright), " hints  ",
        colorize("Tab/→", colors.bright), " accept  ",
        colorize("Esc", colors.bright), " dismiss  ",
        colorize("Enter", colors.bright), " select",
      )
    : "\n\n".concat(
        colorize("↑/↓", colors.bright), " navigate  ",
        colorize("Enter", colors.bright), " select  ",
        colorize("Tab", colors.bright), " build  ",
        colorize("Esc/q", colors.bright), " quit",
      );
  return colorize(help, colors.dim);
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

const calculateVisibleRange = (
  selectedIndex: number,
  totalMatches: number,
): { start: number; end: number } => {
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

  return hasMore ? ["", colorize("... " + remaining + " more", colors.dim)] : [];
};

const buildPreviewLines = (state: State): string[] => {
  const preview = renderPreview(state);
  return preview ? preview.split("\n") : [];
};

const buildExploreContent = (state: State): string[] => {
  const header = [renderTitle(), "", "Search: " + state.query];
  const tooltipSection = renderTooltipSection(state);
  const expressionPreview = renderExpressionPreview(state);
  const matchLines = buildMatchLines(state);
  const remainingIndicator = buildRemainingIndicator(state.matches.length);
  const previewLines = buildPreviewLines(state);
  const footer = ["", renderHelp(state.tooltip.visible).trim()];

  return header
    .concat(tooltipSection)
    .concat(expressionPreview)
    .concat([""])
    .concat(matchLines)
    .concat(remainingIndicator)
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
    if (hasChanged) {
      renderChangedLine(line, i);
    }
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
