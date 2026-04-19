import { stdout } from "process";
import { ANSI } from "../formatting";

export const clearScreen = (): void => {
  stdout.write(ANSI.clearScreen);
};

export const moveCursor = (row: number, col: number = 1): void => {
  stdout.write(`\x1b[${row};${col}H`);
};

export const clearLine = (): void => {
  stdout.write(ANSI.clearLine);
};

export const clearToEnd = (): void => {
  stdout.write(ANSI.clearToEnd);
};

export const hideCursor = (): void => {
  stdout.write(ANSI.hideCursor);
};

export const showCursor = (): void => {
  stdout.write(ANSI.showCursor);
};

export const enableRawMode = (): void => {
  const hasSetRawMode = process.stdin.setRawMode !== undefined;
  if (hasSetRawMode) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
};

export const disableRawMode = (): void => {
  const hasSetRawMode = process.stdin.setRawMode !== undefined;
  if (hasSetRawMode) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
};

export const colors = ANSI;

export const colorize = (text: string, color: string): string => {
  const colorized = color.concat(text, ANSI.reset);
  return colorized;
};

export const highlightMatches = (text: string, matches: number[]): string => {
  const chars = text.split("");
  const highlightColor = ANSI.bright.concat(ANSI.cyan);

  const mapper = (char: string, idx: number): string => {
    const shouldHighlight = matches.includes(idx);
    return shouldHighlight ? colorize(char, highlightColor) : char;
  };

  const highlighted = chars.map(mapper);
  const joined = highlighted.join("");
  return joined;
};
