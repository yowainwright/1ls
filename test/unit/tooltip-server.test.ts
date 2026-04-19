import { describe, test, expect } from "bun:test";
import { parseMessage } from "../../src/tooltip/server";

describe("tooltip/server", () => {
  describe("parseMessage", () => {
    test("returns null for empty string", () => {
      const result = parseMessage("");
      expect(result).toBeNull();
    });

    test("returns null for whitespace only", () => {
      const result = parseMessage("   ");
      expect(result).toBeNull();
    });

    test("parses plain text as input", () => {
      const result = parseMessage(".map");
      expect(result).not.toBeNull();
      expect(result?.input).toBe(".map");
    });

    test("parses JSON message with input", () => {
      const result = parseMessage('{"input":".filter"}');
      expect(result).not.toBeNull();
      expect(result?.input).toBe(".filter");
    });

    test("parses JSON message with tty", () => {
      const result = parseMessage('{"input":".map","tty":"/dev/ttys001"}');
      expect(result).not.toBeNull();
      expect(result?.input).toBe(".map");
      expect(result?.tty).toBe("/dev/ttys001");
    });

    test("parses JSON message with action", () => {
      const result = parseMessage('{"input":"","action":"hide"}');
      expect(result).not.toBeNull();
      expect(result?.action).toBe("hide");
    });

    test("parses full JSON message", () => {
      const msg = '{"input":".re","tty":"/dev/ttys002","action":"complete"}';
      const result = parseMessage(msg);
      expect(result).not.toBeNull();
      expect(result?.input).toBe(".re");
      expect(result?.tty).toBe("/dev/ttys002");
      expect(result?.action).toBe("complete");
    });

    test("handles invalid JSON gracefully", () => {
      const result = parseMessage("{invalid json}");
      expect(result).not.toBeNull();
      expect(result?.input).toBe("{invalid json}");
    });

    test("trims whitespace from input", () => {
      const result = parseMessage("  .map  ");
      expect(result?.input).toBe(".map");
    });
  });
});
