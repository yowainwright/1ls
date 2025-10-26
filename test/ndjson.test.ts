import { describe, test, expect } from "bun:test";
import { parseNDJSON } from "../src/parsers/ndjson";

describe("parseNDJSON", () => {
  test("parses newline-delimited JSON objects", () => {
    const input = `
{"name": "Alice", "age": 30}
{"name": "Bob", "age": 25}
{"name": "Charlie", "age": 35}
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
      { name: "Charlie", age: 35 },
    ]);
  });

  test("parses log-style NDJSON", () => {
    const input = `
{"timestamp": "2025-01-01T10:00:00Z", "level": "info", "message": "Server started"}
{"timestamp": "2025-01-01T10:01:00Z", "level": "error", "message": "Connection failed"}
{"timestamp": "2025-01-01T10:02:00Z", "level": "info", "message": "Retrying connection"}
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      { timestamp: "2025-01-01T10:00:00Z", level: "info", message: "Server started" },
      { timestamp: "2025-01-01T10:01:00Z", level: "error", message: "Connection failed" },
      { timestamp: "2025-01-01T10:02:00Z", level: "info", message: "Retrying connection" },
    ]);
  });

  test("parses mixed data types", () => {
    const input = `
{"id": 1, "active": true, "score": 98.5}
{"id": 2, "active": false, "score": 87.2}
{"id": 3, "active": true, "score": null}
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      { id: 1, active: true, score: 98.5 },
      { id: 2, active: false, score: 87.2 },
      { id: 3, active: true, score: null },
    ]);
  });

  test("handles arrays in NDJSON", () => {
    const input = `
{"user": "alice", "tags": ["admin", "developer"]}
{"user": "bob", "tags": ["user"]}
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      { user: "alice", tags: ["admin", "developer"] },
      { user: "bob", tags: ["user"] },
    ]);
  });

  test("handles nested objects", () => {
    const input = `
{"user": {"name": "Alice", "email": "alice@example.com"}, "active": true}
{"user": {"name": "Bob", "email": "bob@example.com"}, "active": false}
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      { user: { name: "Alice", email: "alice@example.com" }, active: true },
      { user: { name: "Bob", email: "bob@example.com" }, active: false },
    ]);
  });

  test("skips empty lines", () => {
    const input = `
{"name": "Alice"}

{"name": "Bob"}

{"name": "Charlie"}
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
    ]);
  });

  test("handles malformed JSON as strings", () => {
    const input = `
{"valid": "json"}
invalid line
{"another": "valid"}
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      { valid: "json" },
      "invalid line",
      { another: "valid" },
    ]);
  });

  test("handles single-line arrays as NDJSON", () => {
    const input = `
[1, 2, 3]
[4, 5, 6]
[7, 8, 9]
`;
    const result = parseNDJSON(input);
    expect(result).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);
  });

  test("handles empty input", () => {
    const input = "";
    const result = parseNDJSON(input);
    expect(result).toEqual([]);
  });

  test("handles single JSON object", () => {
    const input = '{"name": "Alice", "age": 30}';
    const result = parseNDJSON(input);
    expect(result).toEqual([{ name: "Alice", age: 30 }]);
  });
});
