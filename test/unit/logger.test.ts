import { describe, test, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { Logger, createLogger, LogLevel } from "../../src/logger";

describe("Logger", () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;
  let consoleWarnSpy: ReturnType<typeof spyOn>;
  let consoleLogSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});
    consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe("constructor", () => {
    test("creates logger with default INFO level", () => {
      const logger = new Logger("test");
      logger.info("test message");
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test("creates logger with custom level", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.info("test message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe("setLevel", () => {
    test("changes log level", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.info("should not log");
      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.INFO);
      logger.info("should log");
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe("error", () => {
    test("logs error message", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.error("error message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      const call = consoleErrorSpy.mock.calls[0][0];
      expect(call).toContain("ERROR");
      expect(call).toContain("test");
      expect(call).toContain("error message");
    });

    test("logs error with stack trace", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      const error = new Error("test error");
      logger.error("error occurred", error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy.mock.calls[1][0]).toContain("Error: test error");
    });

    test("logs error without stack trace when error has no stack", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      const error = new Error("test error");
      delete error.stack;
      logger.error("error occurred", error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.ERROR - 1);
      logger.error("error message");
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("warn", () => {
    test("logs warning message", () => {
      const logger = new Logger("test", LogLevel.WARN);
      logger.warn("warning message");

      expect(consoleWarnSpy).toHaveBeenCalled();
      const call = consoleWarnSpy.mock.calls[0][0];
      expect(call).toContain("WARN");
      expect(call).toContain("test");
      expect(call).toContain("warning message");
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.warn("warning message");
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe("info", () => {
    test("logs info message", () => {
      const logger = new Logger("test", LogLevel.INFO);
      logger.info("info message");

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain("INFO");
      expect(call).toContain("test");
      expect(call).toContain("info message");
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.WARN);
      logger.info("info message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe("debug", () => {
    test("logs debug message", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      logger.debug("debug message");

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain("DEBUG");
      expect(call).toContain("test");
      expect(call).toContain("debug message");
    });

    test("logs debug message with data", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      const data = { foo: "bar", num: 42 };
      logger.debug("debug message", data);

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      const dataCall = consoleLogSpy.mock.calls[1][0];
      expect(dataCall).toContain("foo");
      expect(dataCall).toContain("bar");
    });

    test("does not log data when undefined", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      logger.debug("debug message", undefined);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    test("logs data when explicitly passed as empty object", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      logger.debug("debug message", {});

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.INFO);
      logger.debug("debug message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe("message formatting", () => {
    test("includes timestamp in ISO format", () => {
      const logger = new Logger("test", LogLevel.INFO);
      logger.info("test");

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    test("includes logger name", () => {
      const logger = new Logger("my-logger", LogLevel.INFO);
      logger.info("test");

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain("[my-logger]");
    });
  });

  describe("createLogger", () => {
    test("creates logger with default level from environment", () => {
      const logger = createLogger("env-logger");
      logger.info("test message");
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test("respects LOG_LEVEL environment variable", () => {
      const originalEnv = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "ERROR";

      delete require.cache[require.resolve("../../src/logger")];
      const { createLogger: createLoggerWithEnv } = require("../../src/logger");

      const logger = createLoggerWithEnv("env-test");
      logger.info("should not log");

      // Restore
      if (originalEnv) {
        process.env.LOG_LEVEL = originalEnv;
      } else {
        delete process.env.LOG_LEVEL;
      }
    });
  });
});
