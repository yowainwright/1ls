import { LogLevel, LogLevelType, LogData } from "./types";

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
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage("ERROR", message));
      if (error?.stack) {
        console.error(error.stack);
      }
    }
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
    if (this.level >= LogLevel.DEBUG) {
      console.log(this.formatMessage("DEBUG", message));
      if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
}

const logLevelMap: Record<string, LogLevelType> = {
  ERROR: LogLevel.ERROR,
  WARN: LogLevel.WARN,
  INFO: LogLevel.INFO,
  DEBUG: LogLevel.DEBUG,
};

const globalLevel = process.env.LOG_LEVEL
  ? logLevelMap[process.env.LOG_LEVEL] || LogLevel.INFO
  : LogLevel.INFO;

export function createLogger(name: string): Logger {
  return new Logger(name, globalLevel);
}
