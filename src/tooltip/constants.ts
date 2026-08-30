export const FIFO_PATH = "/tmp/1ls-input.fifo";
export const RESPONSE_PATH = "/tmp/1ls-response";

export const ANSI = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  clearScreen: "\x1b[2J\x1b[H",
  clearLine: "\x1b[2K",
  clearToEnd: "\x1b[J",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
} as const;

export const moveCursor = (row: number, col: number = 1): string => `\x1b[${row};${col}H`;

export const cursorUp = (n: number = 1): string => `\x1b[${n}A`;

export const cursorDown = (n: number = 1): string => `\x1b[${n}B`;

export const CURSOR = {
  SAVE: "\x1b7",
  RESTORE: "\x1b8",
  INVERSE: "\x1b[7m",
} as const;

export const BORDER = {
  TL: "╭",
  TR: "╮",
  BL: "╰",
  BR: "╯",
  H: "─",
  V: "│",
} as const;
