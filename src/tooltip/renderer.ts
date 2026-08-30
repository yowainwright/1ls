import { openSync, writeSync, closeSync } from "fs";
import type { Suggestion } from "../ac/index.ts";
import { ANSI } from "../formatting/index.ts";
import { CURSOR, BORDER } from "./constants.ts";

const TYPE_COLORS: Record<Suggestion["type"], string> = {
  method: ANSI.cyan,
  builtin: ANSI.yellow,
  shortcut: ANSI.green,
  path: ANSI.gray,
};

const colorize = (text: string, color: string): string => `${color}${text}${ANSI.reset}`;

const ANSI_ESCAPE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

const getVisibleLength = (str: string): number => str.replace(ANSI_ESCAPE_PATTERN, "").length;

interface RenderState {
  ttyFd: number | null;
  lastHeight: number;
  selectedIndex: number;
}

const state: RenderState = {
  ttyFd: null,
  lastHeight: 0,
  selectedIndex: 0,
};

const writeTty = (content: string): void => {
  if (state.ttyFd === null) return;
  writeSync(state.ttyFd, content);
};

const formatLine = (suggestion: Suggestion, isSelected: boolean): string => {
  const typeColor = TYPE_COLORS[suggestion.type];
  const prefix = isSelected ? colorize("› ", ANSI.cyan) : "  ";
  const sig = isSelected ? colorize(suggestion.signature, ANSI.bright) : suggestion.signature;
  const typeTag = colorize(` [${suggestion.type}]`, typeColor);
  const desc = colorize(` ${suggestion.description}`, ANSI.gray);

  return `${prefix}${sig}${typeTag}${desc}`;
};

const calculateWidth = (lines: string[]): number => Math.max(...lines.map(getVisibleLength), 0);

const wrapWithBorder = (lines: string[], width: number): string[] => {
  const pad = 1;
  const innerWidth = width + pad * 2;

  const top = colorize(BORDER.TL + BORDER.H.repeat(innerWidth) + BORDER.TR, ANSI.dim);
  const bottom = colorize(BORDER.BL + BORDER.H.repeat(innerWidth) + BORDER.BR, ANSI.dim);

  const wrapped = lines.map((line) => {
    const visibleLen = getVisibleLength(line);
    const rightPad = " ".repeat(Math.max(0, width - visibleLen));
    const leftBorder = colorize(BORDER.V, ANSI.dim);
    const rightBorder = colorize(BORDER.V, ANSI.dim);
    return `${leftBorder} ${line}${rightPad} ${rightBorder}`;
  });

  return [top, ...wrapped, bottom];
};

export const openTty = (ttyPath: string): boolean => {
  if (state.ttyFd !== null) return true;

  try {
    state.ttyFd = openSync(ttyPath, "w");
    return true;
  } catch {
    return false;
  }
};

export const closeTty = (): void => {
  if (state.ttyFd !== null) {
    closeSync(state.ttyFd);
    state.ttyFd = null;
  }
  state.lastHeight = 0;
  state.selectedIndex = 0;
};

const clearPreviousTooltip = (): void => {
  const hasExistingTooltip = state.lastHeight > 0;
  if (!hasExistingTooltip) return;

  const clearLines = Array.from({ length: state.lastHeight }, () => `${ANSI.clearLine}\n`).join("");
  const clearOutput = `${CURSOR.SAVE}\n${clearLines}${CURSOR.RESTORE}`;
  writeTty(clearOutput);
};

export const render = (suggestions: Suggestion[]): void => {
  if (state.ttyFd === null) return;

  const isEmpty = suggestions.length === 0;
  if (isEmpty) {
    hide();
    return;
  }

  clearPreviousTooltip();

  const lines = suggestions.map((s, i) => formatLine(s, i === state.selectedIndex));
  const width = calculateWidth(lines);
  const bordered = wrapWithBorder(lines, width);

  const borderedContent = bordered.map((line) => `${ANSI.clearLine}${line}`).join("\n");
  const output = `${CURSOR.SAVE}\n${borderedContent}${CURSOR.RESTORE}`;

  writeTty(output);
  state.lastHeight = bordered.length;
};

export const hide = (): void => {
  if (state.ttyFd === null) return;
  if (state.lastHeight === 0) return;

  const clearLines = Array.from({ length: state.lastHeight }, () => ANSI.clearLine).join("\n");
  const clearOutput = `${CURSOR.SAVE}\n${clearLines}${CURSOR.RESTORE}`;

  writeTty(clearOutput);
  state.lastHeight = 0;
};

export const selectNext = (suggestionCount: number): void => {
  if (suggestionCount <= 0) return;
  state.selectedIndex = (state.selectedIndex + 1) % suggestionCount;
};

export const selectPrev = (suggestionCount: number): void => {
  if (suggestionCount <= 0) return;
  state.selectedIndex = (state.selectedIndex - 1 + suggestionCount) % suggestionCount;
};

export const getSelectedIndex = (): number => state.selectedIndex;

export const resetSelection = (): void => {
  state.selectedIndex = 0;
};

const PREVIEW_MAX_WIDTH = 60;
const PREVIEW_MAX_LINES = 5;

const truncateLine = (line: string, maxWidth: number): string => {
  const needsTruncation = line.length > maxWidth;
  if (!needsTruncation) return line;

  const truncatedWidth = maxWidth - 1;
  return line.slice(0, truncatedWidth) + "…";
};

const formatPreviewLine = (line: string): string => {
  const truncated = truncateLine(line, PREVIEW_MAX_WIDTH);
  return colorize(truncated, ANSI.dim);
};

const formatDataAsLines = (data: unknown): string[] => {
  const formatted = JSON.stringify(data, null, 2);
  return formatted.split("\n");
};

const buildPreviewLines = (allLines: string[]): string[] => {
  const isTruncated = allLines.length > PREVIEW_MAX_LINES;
  const visibleLines = allLines.slice(0, PREVIEW_MAX_LINES);
  const formattedLines = visibleLines.map(formatPreviewLine);

  if (!isTruncated) return formattedLines;

  const remainingCount = allLines.length - PREVIEW_MAX_LINES;
  const truncationNote = colorize(`  ... ${remainingCount} more lines`, ANSI.gray);
  return [...formattedLines, truncationNote];
};

export const renderPreview = (data: unknown): void => {
  if (state.ttyFd === null) return;

  clearPreviousTooltip();

  const allLines = formatDataAsLines(data);
  const lines = buildPreviewLines(allLines);
  const width = calculateWidth(lines);
  const bordered = wrapWithBorder(lines, width);

  const borderedContent = bordered.map((line) => `${ANSI.clearLine}${line}`).join("\n");
  const output = `${CURSOR.SAVE}\n${borderedContent}${CURSOR.RESTORE}`;

  writeTty(output);
  state.lastHeight = bordered.length;
};
