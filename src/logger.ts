export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel];

export interface LogData {
  [key: string]: unknown;
}

export class Logger {
  private level: LogLevelType;
  private name: string;

  constructor(name: string, level: LogLevelType = LogLevel.INFO) {
    this.name = name;
    this.level = level;
  }

  setLevel(level: LogLevelType): void {
    this.level = level;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.name}] ${message}`;
  }

  error(message: string, error?: Error): void {
    if (this.level < LogLevel.ERROR) return;

    console.error(this.formatMessage("ERROR", message));
    if (error?.stack) console.error(error.stack);
  }

  warn(message: string): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage("WARN", message));
    }
  }

  info(message: string): void {
    if (this.level >= LogLevel.INFO) {
      console.log(this.formatMessage("INFO", message));
    }
  }

  debug(message: string, data?: LogData): void {
    if (this.level < LogLevel.DEBUG) return;

    console.log(this.formatMessage("DEBUG", message));
    if (data !== undefined) console.log(JSON.stringify(data, null, 2));
  }
}

const logLevelMap: Record<string, LogLevelType> = {
  ERROR: LogLevel.ERROR,
  WARN: LogLevel.WARN,
  INFO: LogLevel.INFO,
  DEBUG: LogLevel.DEBUG,
};

const getGlobalLevel = (): LogLevelType => {
  const logLevel = process.env.LOG_LEVEL;
  if (!logLevel) return LogLevel.INFO;
  return logLevelMap[logLevel] ?? LogLevel.INFO;
};

export function createLogger(name: string): Logger {
  return new Logger(name, getGlobalLevel());
}
