import { stdout } from "process";
import { clearScreen, colors, colorize, highlightMatches } from "./terminal";
import type { State, JsonPath, Method } from "./types";
import type { FuzzyMatch } from "./types";

const MAX_VISIBLE_ITEMS = 10;

const formatMethodName = (
  signature: string,
  matches: number[],
): string => highlightMatches(signature, matches);

const formatCategory = (category: string): string => {
  const text = `[${category}]`;
  return colorize(text, colors.dim);
};

const formatDescription = (description: string): string =>
  colorize(description, colors.gray);

const formatPrefix = (isSelected: boolean): string => {
  const selectedPrefix = colorize("❯", colors.green);
  const unselectedPrefix = " ";
  return isSelected ? selectedPrefix : unselectedPrefix;
};

const formatMethod = (
  method: Method,
  isSelected: boolean,
  matches: number[],
): string => {
  const prefix = formatPrefix(isSelected);
  const signature = formatMethodName(method.signature, matches);
  const category = method.category ? formatCategory(method.category) : "";
  const description = formatDescription(method.description);

  const line = prefix
    .concat(" ", signature)
    .concat(category ? " " + category : "")
    .concat(" - ", description);

  return line;
};

const formatPropertyEntry = (
  match: FuzzyMatch<JsonPath>,
  isSelected: boolean,
): string => {
  const item = match.item;
  const matches = match.matches;

  const prefix = formatPrefix(isSelected);
  const pathText = highlightMatches(item.path, matches);
  const typeText = colorize(`[${item.type}]`, colors.dim);
  const valueText = colorize(item.displayValue, colors.gray);

  const line = prefix
    .concat(" ", pathText)
    .concat(" ", typeText)
    .concat(" ", valueText);

  return line;
};

const renderBuildModeTitle = (state: State): string => {
  const hasBuilder = state.builder !== null;
  if (!hasBuilder) return "";

  const title = "Expression Builder";
  const color = colors.bright.concat(colors.cyan);
  const titleText = colorize(title, color);

  const currentExpr = state.builder!.expression;
  const exprLabel = "\n\nBuilding: ";
  const exprText = colorize(currentExpr, colors.bright.concat(colors.yellow));

  const typeLabel = "\n\nSearch methods for ";
  const typeText = colorize(state.builder!.baseType, colors.bright);
  const searchLabel = ": ";
  const searchQuery = state.query;

  return titleText
    .concat(exprLabel, exprText)
    .concat(typeLabel, typeText, searchLabel, searchQuery, "\n\n");
};

const renderArrowFnModeTitle = (state: State): string => {
  const hasBuilder = state.builder !== null;
  const hasContext = state.builder?.arrowFnContext !== null;
  if (!hasBuilder || !hasContext) return "";

  const title = "Expression Builder - Arrow Function";
  const color = colors.bright.concat(colors.cyan);
  const titleText = colorize(title, color);

  const currentExpr = state.builder!.expression;
  const exprLabel = "\n\nBuilding: ";
  const exprText = colorize(currentExpr, colors.bright.concat(colors.yellow));

  const context = state.builder!.arrowFnContext!;
  const paramLabel = `\n\nSearch properties for '${context.paramName}' (${context.paramType}): `;
  const searchQuery = state.query;

  return titleText.concat(exprLabel, exprText).concat(paramLabel, searchQuery, "\n\n");
};

const renderVisibleMethods = (state: State): string => {
  const hasBuilder = state.builder === null;
  if (hasBuilder) return "";

  const methodMatches = state.methodMatches;
  const selectedIndex = state.selectedIndex;

  if (methodMatches.length === 0) {
    return colorize("No methods found", colors.dim);
  }

  const halfWindow = Math.floor(MAX_VISIBLE_ITEMS / 2);
  let startIndex = Math.max(0, selectedIndex - halfWindow);
  const endIndex = Math.min(methodMatches.length, startIndex + MAX_VISIBLE_ITEMS);

  const actualVisible = endIndex - startIndex;
  if (actualVisible < MAX_VISIBLE_ITEMS && methodMatches.length >= MAX_VISIBLE_ITEMS) {
    startIndex = Math.max(0, endIndex - MAX_VISIBLE_ITEMS);
  }

  const visibleMatches = methodMatches.slice(startIndex, endIndex);
  const mapper = (match: FuzzyMatch<Method>, idx: number): string => {
    const absoluteIndex = startIndex + idx;
    const isSelected = absoluteIndex === selectedIndex;
    return formatMethod(match.item, isSelected, match.matches);
  };
  const lines = visibleMatches.map(mapper);
  const joined = lines.join("\n");
  return joined;
};

const renderVisibleProperties = (state: State): string => {
  const hasBuilder = state.builder === null;
  const hasContext = state.builder?.arrowFnContext === null;
  if (hasBuilder || hasContext) return "";

  const propertyMatches = state.propertyMatches;
  const selectedIndex = state.selectedIndex;

  if (propertyMatches.length === 0) {
    return colorize("No properties found", colors.dim);
  }

  const halfWindow = Math.floor(MAX_VISIBLE_ITEMS / 2);
  let startIndex = Math.max(0, selectedIndex - halfWindow);
  const endIndex = Math.min(propertyMatches.length, startIndex + MAX_VISIBLE_ITEMS);

  const actualVisible = endIndex - startIndex;
  if (actualVisible < MAX_VISIBLE_ITEMS && propertyMatches.length >= MAX_VISIBLE_ITEMS) {
    startIndex = Math.max(0, endIndex - MAX_VISIBLE_ITEMS);
  }

  const visibleMatches = propertyMatches.slice(startIndex, endIndex);
  const mapper = (match: FuzzyMatch<JsonPath>, idx: number): string => {
    const absoluteIndex = startIndex + idx;
    const isSelected = absoluteIndex === selectedIndex;
    return formatPropertyEntry(match, isSelected);
  };
  const lines = visibleMatches.map(mapper);
  const joined = lines.join("\n");
  return joined;
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

const renderBuildHelp = (): string => {
  const help = "\n\n".concat(
    colorize("↑/↓", colors.bright),
    " navigate  ",
    colorize("→/Tab", colors.bright),
    " accept  ",
    colorize("←", colors.bright),
    " undo  ",
    colorize("Enter", colors.bright),
    " execute  ",
    colorize("Esc", colors.bright),
    " quit",
  );
  return colorize(help, colors.dim);
};

export const renderBuildMode = (state: State): void => {
  clearScreen();

  const title = renderBuildModeTitle(state);
  stdout.write(title);

  const methods = renderVisibleMethods(state);
  stdout.write(methods);

  const methodCount = state.methodMatches.length;
  const moreIndicator = renderMoreIndicator(methodCount);
  stdout.write(moreIndicator);

  const help = renderBuildHelp();
  stdout.write(help);
};

export const renderArrowFnMode = (state: State): void => {
  clearScreen();

  const title = renderArrowFnModeTitle(state);
  stdout.write(title);

  const properties = renderVisibleProperties(state);
  stdout.write(properties);

  const propertyCount = state.propertyMatches.length;
  const moreIndicator = renderMoreIndicator(propertyCount);
  stdout.write(moreIndicator);

  const help = renderBuildHelp();
  stdout.write(help);
};
