import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { RESPONSE_PATH } from "../../../src/tooltip/constants";
import { handleMessage, parseMessage } from "../../../src/tooltip/server";

const removeResponseFile = (): void => {
  if (existsSync(RESPONSE_PATH)) {
    unlinkSync(RESPONSE_PATH);
  }
};

describe("tooltip/server", () => {
  beforeEach(removeResponseFile);
  afterEach(removeResponseFile);

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

    test("parses escaped JSON payloads", () => {
      const msg =
        '{"input":"1ls rf file.json \\".user.na\\"","tty":"/dev/ttys002","action":"complete","file":"file.json","expr":".user.na"}';
      const result = parseMessage(msg);

      expect(result).not.toBeNull();
      expect(result?.file).toBe("file.json");
      expect(result?.expr).toBe(".user.na");
      expect(result?.input).toContain('.user.na');
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

  describe("handleMessage", () => {
    test("updates the selected response across next, prev, and hide actions", async () => {
      await handleMessage({ input: "data." });

      const initial = readFileSync(RESPONSE_PATH, "utf8");
      expect(initial.length).toBeGreaterThan(0);

      await handleMessage({ input: "", action: "next" });
      const next = readFileSync(RESPONSE_PATH, "utf8");
      expect(next.length).toBeGreaterThan(0);
      expect(next).not.toBe(initial);

      await handleMessage({ input: "", action: "prev" });
      expect(readFileSync(RESPONSE_PATH, "utf8")).toBe(initial);

      await handleMessage({ input: "", action: "hide" });
      expect(readFileSync(RESPONSE_PATH, "utf8")).toBe("");
    });
  });
});
