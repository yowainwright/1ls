import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { Readable } from "node:stream";

describe("stream utilities", () => {
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    originalStdin = process.stdin;
  });

  afterEach(() => {
    Object.defineProperty(process, "stdin", {
      value: originalStdin,
      writable: true,
    });
  });

  test("processInput reads from stdin and parses JSON", async () => {
    const mockStdin = Readable.from([
      Buffer.from('{"foo": "bar", '),
      Buffer.from('"num": 42}'),
    ]);

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      writable: true,
    });

    const { processInput } = await import("../../src/utils/stream");
    const result = await processInput();
    expect(result).toEqual({ foo: "bar", num: 42 });
  });

  test("processInput returns null for empty input", async () => {
    const mockStdin = Readable.from([Buffer.from("")]);

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      writable: true,
    });

    const { processInput } = await import("../../src/utils/stream");
    const result = await processInput();
    expect(result).toBeNull();
  });

  test("processInput handles YAML format", async () => {
    const yamlContent = "name: test\nvalue: 42";
    const mockStdin = Readable.from([Buffer.from(yamlContent)]);

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      writable: true,
    });

    const { processInput } = await import("../../src/utils/stream");
    const result = await processInput("yaml");
    expect(result).toEqual({ name: "test", value: 42 });
  });

  test("processInput auto-detects format when not specified", async () => {
    const jsonContent = '{"auto": "detect"}';
    const mockStdin = Readable.from([Buffer.from(jsonContent)]);

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      writable: true,
    });

    const { processInput } = await import("../../src/utils/stream");
    const result = await processInput();
    expect(result).toEqual({ auto: "detect" });
  });

  test("processInput handles multiple chunks", async () => {
    const chunks = [
      Buffer.from("["),
      Buffer.from("1,"),
      Buffer.from("2,"),
      Buffer.from("3"),
      Buffer.from("]"),
    ];
    const mockStdin = Readable.from(chunks);

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      writable: true,
    });

    const { processInput } = await import("../../src/utils/stream");
    const result = await processInput();
    expect(result).toEqual([1, 2, 3]);
  });
});
