const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground colors
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

export function colorize(json: string): string {
  if (process.env.NO_COLOR) {
    return json;
  }

  return (
    json
      // Keys (property names)
      .replace(/"([^"]+)":/g, `${COLORS.cyan}"$1"${COLORS.reset}:`)
      // String values
      .replace(/: "([^"]*)"/g, `: ${COLORS.green}"$1"${COLORS.reset}`)
      // Numbers
      .replace(/: (-?\d+\.?\d*)/g, `: ${COLORS.yellow}$1${COLORS.reset}`)
      // Booleans
      .replace(/: (true|false)/g, `: ${COLORS.magenta}$1${COLORS.reset}`)
      // Null
      .replace(/: (null)/g, `: ${COLORS.gray}$1${COLORS.reset}`)
      // Array/Object brackets
      .replace(/([{[])/g, `${COLORS.gray}$1${COLORS.reset}`)
      .replace(/([}\]])/g, `${COLORS.gray}$1${COLORS.reset}`)
  );
}

export function error(message: string): string {
  if (process.env.NO_COLOR) {
    return message;
  }
  return `${COLORS.red}${message}${COLORS.reset}`;
}

export function success(message: string): string {
  if (process.env.NO_COLOR) {
    return message;
  }
  return `${COLORS.green}${message}${COLORS.reset}`;
}

export function warning(message: string): string {
  if (process.env.NO_COLOR) {
    return message;
  }
  return `${COLORS.yellow}${message}${COLORS.reset}`;
}

export function info(message: string): string {
  if (process.env.NO_COLOR) {
    return message;
  }
  return `${COLORS.cyan}${message}${COLORS.reset}`;
}

export function dim(message: string): string {
  if (process.env.NO_COLOR) {
    return message;
  }
  return `${COLORS.dim}${message}${COLORS.reset}`;
}
