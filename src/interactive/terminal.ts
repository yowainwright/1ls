import { stdout } from "process";

export const clearScreen = (): void => {
  stdout.write("\x1b[2J\x1b[H");
};

export const moveCursor = (row: number, col: number = 1): void => {
  stdout.write(`\x1b[${row};${col}H`);
};

export const clearLine = (): void => {
  stdout.write("\x1b[2K");
};

export const clearToEnd = (): void => {
  stdout.write("\x1b[J");
};

export const hideCursor = (): void => {
  stdout.write("\x1b[?25l");
};

export const showCursor = (): void => {
  stdout.write("\x1b[?25h");
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

export const colors = Object.assign(
  {},
  {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    gray: "\x1b[90m",
  },
);

export const colorize = (text: string, color: string): string => {
  const resetCode = colors.reset;
  const colorized = color.concat(text, resetCode);
  return colorized;
};

export const highlightMatches = (text: string, matches: number[]): string => {
  const chars = text.split("");
  const highlightColor = colors.bright.concat(colors.cyan);

  const mapper = (char: string, idx: number): string => {
    const shouldHighlight = matches.includes(idx);
    return shouldHighlight ? colorize(char, highlightColor) : char;
  };

  const highlighted = chars.map(mapper);
  const joined = highlighted.join("");
  return joined;
};
