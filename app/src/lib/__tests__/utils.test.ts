import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { cn } from "../utils";

describe("cn", () => {
  test("merges multiple class strings", () => {
    assert.strictEqual(cn("foo", "bar"), "foo bar");
  });

  test("handles single class string", () => {
    assert.strictEqual(cn("foo"), "foo");
  });

  test("ignores falsy values", () => {
    assert.strictEqual(cn("foo", undefined, null, false, "bar"), "foo bar");
  });

  test("handles conditional classes", () => {
    const active = true;
    const disabled = false;
    assert.strictEqual(cn("base", active && "active", disabled && "disabled"), "base active");
  });

  test("resolves tailwind conflicts (last value wins)", () => {
    const result = cn("p-2", "p-4");
    assert.strictEqual(result, "p-4");
  });

  test("resolves text color conflicts", () => {
    const result = cn("text-red-500", "text-blue-500");
    assert.strictEqual(result, "text-blue-500");
  });

  test("handles empty input", () => {
    assert.strictEqual(cn(), "");
  });

  test("handles object syntax", () => {
    assert.strictEqual(cn({ foo: true, bar: false }), "foo");
  });
});
