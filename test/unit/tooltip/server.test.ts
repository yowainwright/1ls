import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { handleMessage, parseMessage, configureDaemon } from "../../../src/tooltip/server.ts";

const TEST_ROOT = join(process.cwd(), ".cache", "tests");
const RESPONSE_PATH = join(TEST_ROOT, "1ls-response");

const removeResponseFile = (): void => {
  if (existsSync(RESPONSE_PATH)) {
    unlinkSync(RESPONSE_PATH);
  }
};

describe("tooltip/server", () => {
  beforeEach(() => {
    mkdirSync(TEST_ROOT, { recursive: true });
    configureDaemon({ responsePath: RESPONSE_PATH });
    removeResponseFile();
  });
  afterEach(removeResponseFile);

  describe("parseMessage", () => {
    test("returns null for empty string", () => {
      const result = parseMessage("");
      assert.strictEqual(result, null);
    });

    test("returns null for whitespace only", () => {
      const result = parseMessage("   ");
      assert.strictEqual(result, null);
    });

    test("parses plain text as input", () => {
      const result = parseMessage(".map");
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.input, ".map");
    });

    test("parses JSON message with input", () => {
      const result = parseMessage('{"input":".filter"}');
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.input, ".filter");
    });

    test("parses JSON message with tty", () => {
      const result = parseMessage('{"input":".map","tty":"/dev/ttys001"}');
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.input, ".map");
      assert.strictEqual(result?.tty, "/dev/ttys001");
    });

    test("parses JSON message with action", () => {
      const result = parseMessage('{"input":"","action":"hide"}');
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.action, "hide");
    });

    test("parses full JSON message", () => {
      const msg = '{"input":".re","tty":"/dev/ttys002","action":"complete"}';
      const result = parseMessage(msg);
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.input, ".re");
      assert.strictEqual(result?.tty, "/dev/ttys002");
      assert.strictEqual(result?.action, "complete");
    });

    test("parses escaped JSON payloads", () => {
      const msg =
        '{"input":"1ls rf file.json \\".user.na\\"","tty":"/dev/ttys002","action":"complete","file":"file.json","expr":".user.na"}';
      const result = parseMessage(msg);

      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.file, "file.json");
      assert.strictEqual(result?.expr, ".user.na");
      assert.ok(result?.input.includes(".user.na"));
    });

    test("handles invalid JSON gracefully", () => {
      const result = parseMessage("{invalid json}");
      assert.notStrictEqual(result, null);
      assert.strictEqual(result?.input, "{invalid json}");
    });

    test("trims whitespace from input", () => {
      const result = parseMessage("  .map  ");
      assert.strictEqual(result?.input, ".map");
    });
  });

  describe("handleMessage", () => {
    test("updates the selected response across next, prev, and hide actions", async () => {
      await handleMessage({ input: "data." });

      const initial = readFileSync(RESPONSE_PATH, "utf8");
      assert.ok(initial.length > 0);

      await handleMessage({ input: "", action: "next" });
      const next = readFileSync(RESPONSE_PATH, "utf8");
      assert.ok(next.length > 0);
      assert.notStrictEqual(next, initial);

      await handleMessage({ input: "", action: "prev" });
      assert.strictEqual(readFileSync(RESPONSE_PATH, "utf8"), initial);

      await handleMessage({ input: "", action: "hide" });
      assert.strictEqual(readFileSync(RESPONSE_PATH, "utf8"), "");
    });
  });
});
