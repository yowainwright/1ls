export const FIFO_PATH = "/tmp/1ls-input.fifo";
export const RESPONSE_PATH = "/tmp/1ls-response";

// Tooltip-specific cursor controls (not in shared ANSI)
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
