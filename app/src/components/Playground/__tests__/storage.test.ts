import { beforeEach, describe, test, expect } from "bun:test";
import {
  encodeShareableState,
  decodeShareableState,
  getShareableUrl,
  getStateFromUrl,
} from "../storage";

beforeEach(() => {
  window.location.href = "http://localhost/";
});

describe("encodeShareableState", () => {
  test("encodes state to base64 string", () => {
    const state = { format: "json" as const, input: '{"test": true}', expression: ".test" };
    const encoded = encodeShareableState(state);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
  });

  test("produces different output for different states", () => {
    const state1 = { format: "json" as const, input: "a", expression: ".a" };
    const state2 = { format: "yaml" as const, input: "b", expression: ".b" };
    expect(encodeShareableState(state1)).not.toBe(encodeShareableState(state2));
  });

  test("handles special characters in input", () => {
    const state = { format: "json" as const, input: '{"emoji": "🎉"}', expression: ".emoji" };
    const encoded = encodeShareableState(state);
    expect(typeof encoded).toBe("string");
  });

  test("handles newlines in input", () => {
    const state = {
      format: "text" as const,
      input: "line1\nline2\nline3",
      expression: ".filter(x => x)",
    };
    const encoded = encodeShareableState(state);
    expect(typeof encoded).toBe("string");
  });
});

describe("decodeShareableState", () => {
  test("decodes encoded state correctly", () => {
    const original = { format: "json" as const, input: '{"test": true}', expression: ".test" };
    const encoded = encodeShareableState(original);
    const decoded = decodeShareableState(encoded);
    expect(decoded).toEqual(original);
  });

  test("returns null for invalid base64", () => {
    const result = decodeShareableState("not-valid-base64!!!");
    expect(result).toBeNull();
  });

  test("returns null for valid base64 but invalid JSON", () => {
    const invalidJson = btoa("not json");
    const result = decodeShareableState(invalidJson);
    expect(result).toBeNull();
  });

  test("returns null for valid JSON but missing required fields", () => {
    const missingFields = btoa(encodeURIComponent(JSON.stringify({ f: "json" })));
    const result = decodeShareableState(missingFields);
    expect(result).toBeNull();
  });

  test("returns null for invalid format value", () => {
    const invalidFormat = btoa(
      encodeURIComponent(JSON.stringify({ f: "bad", i: "{}", e: "." })),
    );
    const result = decodeShareableState(invalidFormat);
    expect(result).toBeNull();
  });

  test("returns null for empty string", () => {
    const result = decodeShareableState("");
    expect(result).toBeNull();
  });

  test("preserves special characters", () => {
    const original = {
      format: "json" as const,
      input: '{"emoji": "🎉", "quote": "it\'s"}',
      expression: ".emoji",
    };
    const encoded = encodeShareableState(original);
    const decoded = decodeShareableState(encoded);
    expect(decoded).toEqual(original);
  });

  test("preserves newlines", () => {
    const original = {
      format: "text" as const,
      input: "line1\nline2\nline3",
      expression: ".length",
    };
    const encoded = encodeShareableState(original);
    const decoded = decodeShareableState(encoded);
    expect(decoded).toEqual(original);
  });

  test("preserves all format types", () => {
    const formats = ["json", "yaml", "csv", "toml", "text"] as const;
    formats.forEach((format) => {
      const original = { format, input: "test", expression: ".test" };
      const encoded = encodeShareableState(original);
      const decoded = decodeShareableState(encoded);
      expect(decoded?.format).toBe(format);
    });
  });
});

describe("getShareableUrl", () => {
  test("produces URL with ?s= param", () => {
    const state = { format: "json" as const, input: '{"test":true}', expression: ".test" };
    const url = getShareableUrl(state);
    expect(url).toContain("?s=");
  });

  test("URL is parseable and contains encoded state", () => {
    const state = { format: "yaml" as const, input: "name: Alice", expression: ".name" };
    const url = getShareableUrl(state);
    const parsed = new URL(url);
    expect(parsed.searchParams.has("s")).toBe(true);
    expect(parsed.searchParams.get("s")).toBeTruthy();
  });

  test("different states produce different URLs", () => {
    const s1 = { format: "json" as const, input: '{"a":1}', expression: ".a" };
    const s2 = { format: "yaml" as const, input: "b: 2", expression: ".b" };
    expect(getShareableUrl(s1)).not.toBe(getShareableUrl(s2));
  });
});

describe("getStateFromUrl", () => {
  test("returns null when no s param in URL", () => {
    window.location.href = "http://localhost/";
    expect(getStateFromUrl()).toBeNull();
  });

  test("returns decoded state when valid s param present", () => {
    const state = { format: "json" as const, input: '{"x":1}', expression: ".x" };
    const encoded = encodeShareableState(state);
    window.location.href = `http://localhost/?s=${encoded}`;
    const decoded = getStateFromUrl();
    expect(decoded).toEqual(state);
  });

  test("returns null for invalid s param", () => {
    window.location.href = "http://localhost/?s=not-valid-base64!!!";
    expect(getStateFromUrl()).toBeNull();
  });

  test("returns null for invalid format in s param", () => {
    const encoded = btoa(
      encodeURIComponent(JSON.stringify({ f: "bad", i: "{}", e: "." })),
    );
    window.location.href = `http://localhost/?s=${encoded}`;
    expect(getStateFromUrl()).toBeNull();
  });
});

describe("roundtrip encoding/decoding", () => {
  test("complex JSON state survives roundtrip", () => {
    const original = {
      format: "json" as const,
      input: JSON.stringify(
        {
          users: [
            { name: "Alice", age: 30, active: true },
            { name: "Bob", age: 25, active: false },
          ],
          meta: { version: "1.0" },
        },
        null,
        2,
      ),
      expression: ".users.filter(u => u.active).map(u => u.name)",
    };
    const encoded = encodeShareableState(original);
    const decoded = decodeShareableState(encoded);
    expect(decoded).toEqual(original);
  });

  test("YAML state survives roundtrip", () => {
    const original = {
      format: "yaml" as const,
      input: `users:
  - name: Alice
    age: 30
  - name: Bob
    age: 25`,
      expression: ".users.map(u => u.name)",
    };
    const encoded = encodeShareableState(original);
    const decoded = decodeShareableState(encoded);
    expect(decoded).toEqual(original);
  });

  test("CSV state survives roundtrip", () => {
    const original = {
      format: "csv" as const,
      input: `name,age,city
Alice,30,NYC
Bob,25,LA`,
      expression: ".filter(x => x.age > 26)",
    };
    const encoded = encodeShareableState(original);
    const decoded = decodeShareableState(encoded);
    expect(decoded).toEqual(original);
  });

  test("text state with log lines survives roundtrip", () => {
    const original = {
      format: "text" as const,
      input: `INFO: User logged in
ERROR: Connection failed
WARN: Low memory`,
      expression: ".filter(line => line.includes('ERROR'))",
    };
    const encoded = encodeShareableState(original);
    const decoded = decodeShareableState(encoded);
    expect(decoded).toEqual(original);
  });

  test("state survives URL roundtrip", () => {
    const original = { format: "csv" as const, input: "a,b\n1,2", expression: ".map(r => r.a)" };
    const url = getShareableUrl(original);
    const parsed = new URL(url);
    window.location.href = parsed.toString();
    const decoded = getStateFromUrl();
    expect(decoded).toEqual(original);
  });
});
