import { mock, describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Logger, createLogger, LogLevel } from "../../src/observability/index.ts";

describe("Logger", () => {
  let consoleErrorSpy: ReturnType<typeof mock.method>;
  let consoleWarnSpy: ReturnType<typeof mock.method>;

  beforeEach(() => {
    consoleErrorSpy = mock.method(console, "error", () => {});
    consoleWarnSpy = mock.method(console, "warn", () => {});
  });

  afterEach(() => {
    consoleErrorSpy.mock.restore();
    consoleWarnSpy.mock.restore();
  });

  describe("constructor", () => {
    test("creates logger with default INFO level", () => {
      const logger = new Logger("test");
      logger.info("test message");
      assert.ok(consoleErrorSpy.mock.calls.length > 0);
    });

    test("creates logger with custom level", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.info("test message");
      assert.strictEqual(consoleErrorSpy.mock.calls.length, 0);
    });
  });

  describe("setLevel", () => {
    test("changes log level", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.info("should not log");
      assert.strictEqual(consoleErrorSpy.mock.calls.length, 0);

      logger.setLevel(LogLevel.INFO);
      logger.info("should log");
      assert.ok(consoleErrorSpy.mock.calls.length > 0);
    });
  });

  describe("error", () => {
    test("logs error message", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.error("error message");

      assert.ok(consoleErrorSpy.mock.calls.length > 0);
      const call = String(consoleErrorSpy.mock.calls[0]?.arguments[0]);
      assert.ok(call.includes("ERROR"));
      assert.ok(call.includes("test"));
      assert.ok(call.includes("error message"));
    });

    test("logs error with stack trace", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      const error = new Error("test error");
      logger.error("error occurred", error);

      assert.strictEqual(consoleErrorSpy.mock.calls.length, 2);
      assert.ok(String(consoleErrorSpy.mock.calls[1]?.arguments[0]).includes("Error: test error"));
    });

    test("logs error without stack trace when error has no stack", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      const error = new Error("test error");
      delete error.stack;
      logger.error("error occurred", error);

      assert.strictEqual(consoleErrorSpy.mock.calls.length, 1);
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.ERROR - 1);
      logger.error("error message");
      assert.strictEqual(consoleErrorSpy.mock.calls.length, 0);
    });
  });

  describe("warn", () => {
    test("logs warning message", () => {
      const logger = new Logger("test", LogLevel.WARN);
      logger.warn("warning message");

      assert.ok(consoleWarnSpy.mock.calls.length > 0);
      const call = String(consoleWarnSpy.mock.calls[0]?.arguments[0]);
      assert.ok(call.includes("WARN"));
      assert.ok(call.includes("test"));
      assert.ok(call.includes("warning message"));
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.ERROR);
      logger.warn("warning message");
      assert.strictEqual(consoleWarnSpy.mock.calls.length, 0);
    });
  });

  describe("info", () => {
    test("logs info message", () => {
      const logger = new Logger("test", LogLevel.INFO);
      logger.info("info message");

      assert.ok(consoleErrorSpy.mock.calls.length > 0);
      const call = String(consoleErrorSpy.mock.calls[0]?.arguments[0]);
      assert.ok(call.includes("INFO"));
      assert.ok(call.includes("test"));
      assert.ok(call.includes("info message"));
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.WARN);
      logger.info("info message");
      assert.strictEqual(consoleErrorSpy.mock.calls.length, 0);
    });
  });

  describe("debug", () => {
    test("logs debug message", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      logger.debug("debug message");

      assert.ok(consoleErrorSpy.mock.calls.length > 0);
      const call = String(consoleErrorSpy.mock.calls[0]?.arguments[0]);
      assert.ok(call.includes("DEBUG"));
      assert.ok(call.includes("test"));
      assert.ok(call.includes("debug message"));
    });

    test("logs debug message with data", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      const data = { foo: "bar", num: 42 };
      logger.debug("debug message", data);

      assert.strictEqual(consoleErrorSpy.mock.calls.length, 2);
      const dataCall = String(consoleErrorSpy.mock.calls[1]?.arguments[0]);
      assert.ok(dataCall.includes("foo"));
      assert.ok(dataCall.includes("bar"));
    });

    test("does not log data when undefined", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      logger.debug("debug message", undefined);

      assert.strictEqual(consoleErrorSpy.mock.calls.length, 1);
    });

    test("logs data when explicitly passed as empty object", () => {
      const logger = new Logger("test", LogLevel.DEBUG);
      logger.debug("debug message", {});

      assert.strictEqual(consoleErrorSpy.mock.calls.length, 2);
    });

    test("does not log when level is too low", () => {
      const logger = new Logger("test", LogLevel.INFO);
      logger.debug("debug message");
      assert.strictEqual(consoleErrorSpy.mock.calls.length, 0);
    });
  });

  describe("message formatting", () => {
    test("includes timestamp in ISO format", () => {
      const logger = new Logger("test", LogLevel.INFO);
      logger.info("test");

      const call = String(consoleErrorSpy.mock.calls[0]?.arguments[0]);
      assert.match(call, /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    test("includes logger name", () => {
      const logger = new Logger("my-logger", LogLevel.INFO);
      logger.info("test");

      const call = String(consoleErrorSpy.mock.calls[0]?.arguments[0]);
      assert.ok(call.includes("[my-logger]"));
    });
  });

  describe("createLogger", () => {
    test("creates logger with default level from environment", () => {
      const logger = createLogger("env-logger");
      logger.info("test message");
      assert.ok(consoleErrorSpy.mock.calls.length > 0);
    });

    test("respects LOG_LEVEL environment variable", () => {
      const originalEnv = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "ERROR";

      try {
        const logger = createLogger("env-test");
        logger.info("should not log");
        assert.strictEqual(consoleErrorSpy.mock.calls.length, 0);
      } finally {
        if (originalEnv) {
          process.env.LOG_LEVEL = originalEnv;
        } else {
          delete process.env.LOG_LEVEL;
        }
      }
    });
  });
});
