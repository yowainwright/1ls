import { describe, test, expect } from "bun:test";
import { cn } from "../utils";

describe("cn", () => {
  test("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("handles single class string", () => {
    expect(cn("foo")).toBe("foo");
  });

  test("ignores falsy values", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  test("handles conditional classes", () => {
    const active = true;
    const disabled = false;
    expect(cn("base", active && "active", disabled && "disabled")).toBe("base active");
  });

  test("resolves tailwind conflicts (last value wins)", () => {
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });

  test("resolves text color conflicts", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  test("handles empty input", () => {
    expect(cn()).toBe("");
  });

  test("handles object syntax", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });
});
