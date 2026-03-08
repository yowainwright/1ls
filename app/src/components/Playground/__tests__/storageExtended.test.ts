import { describe, test, expect, beforeEach } from "bun:test";
import { getShareableUrl, getStateFromUrl, encodeShareableState } from "../storage";

beforeEach(() => {
  window.location.href = "http://localhost/";
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
});

describe("roundtrip: URL encode → decode", () => {
  test("state survives URL roundtrip", () => {
    const original = { format: "csv" as const, input: "a,b\n1,2", expression: ".map(r => r.a)" };
    const url = getShareableUrl(original);
    const parsed = new URL(url);
    window.location.href = parsed.toString();
    const decoded = getStateFromUrl();
    expect(decoded).toEqual(original);
  });
});
