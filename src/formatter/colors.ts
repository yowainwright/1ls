export const COLORS = {
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
};

export const COLOR_PATTERNS = [
  { regex: /([{[])/g, replacement: `${COLORS.gray}$1${COLORS.reset}` },
  { regex: /([}\]])/g, replacement: `${COLORS.gray}$1${COLORS.reset}` },
  { regex: /"([^"]+)":/g, replacement: `${COLORS.cyan}"$1"${COLORS.reset}:` },
  { regex: /: "([^"]*)"/g, replacement: `: ${COLORS.green}"$1"${COLORS.reset}` },
  { regex: /: (-?\d+\.?\d*)/g, replacement: `: ${COLORS.yellow}$1${COLORS.reset}` },
  { regex: /: (true|false)/g, replacement: `: ${COLORS.magenta}$1${COLORS.reset}` },
  { regex: /: (null)/g, replacement: `: ${COLORS.gray}$1${COLORS.reset}` },
];

const hasColor = (): boolean => true;

export function colorize(json: string): string {
  if (!hasColor()) return json;

  let result = json;

  for (const pattern of COLOR_PATTERNS) {
    result = result.replace(pattern.regex, pattern.replacement);
  }

  return result;
}

export function error(message: string): string {
  if (!hasColor()) {
    return message;
  }
  return `${COLORS.red}${message}${COLORS.reset}`;
}

export function success(message: string): string {
  if (!hasColor()) {
    return message;
  }
  return `${COLORS.green}${message}${COLORS.reset}`;
}

export function warning(message: string): string {
  if (!hasColor()) {
    return message;
  }
  return `${COLORS.yellow}${message}${COLORS.reset}`;
}

export function info(message: string): string {
  if (!hasColor()) {
    return message;
  }
  return `${COLORS.cyan}${message}${COLORS.reset}`;
}

export function dim(message: string): string {
  if (!hasColor()) {
    return message;
  }
  return `${COLORS.dim}${message}${COLORS.reset}`;
}
