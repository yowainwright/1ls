import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Effect } from "effect";

import {
  detectFormat,
  detectJSON,
  detectYAML,
  detectCSV,
  detectTOML,
  detectMalformedJSON,
  isValidJSON,
  looksLikeJSON,
  countCommas,
  hasConsistentCommaCount,
  minifyExpression,
  expandExpression,
  runEvaluation,
  DETECTORS,
  computeFormatChange,
  isSandboxGuard,
  persistPlaygroundState,
  loadInitialStateActor,
} from "../utils";
import { FORMAT_CONFIGS, FORMATS, SANDBOX_STARTER } from "../constants";
import type { PlaygroundContext } from "../types";

const baseContext: PlaygroundContext = {
  isSandbox: false,
  format: "json",
  input: FORMAT_CONFIGS.json.placeholder,
  expression: ".test",
  showMinifiedExpression: false,
};

const sandboxContext: PlaygroundContext = {
  ...baseContext,
  isSandbox: true,
  input: SANDBOX_STARTER.json.data,
  expression: SANDBOX_STARTER.json.expression,
};

describe("isValidJSON", () => {
  test("returns true for valid JSON object", () => {
    assert.strictEqual(isValidJSON('{"name": "test"}'), true);
  });

  test("returns true for valid JSON array", () => {
    assert.strictEqual(isValidJSON("[1, 2, 3]"), true);
  });

  test("returns false for invalid JSON", () => {
    assert.strictEqual(isValidJSON("{name: test}"), false);
  });

  test("returns false for plain text", () => {
    assert.strictEqual(isValidJSON("hello world"), false);
  });
});

describe("looksLikeJSON", () => {
  test("returns true for content starting with {", () => {
    assert.strictEqual(looksLikeJSON('{"test": true}'), true);
  });

  test("returns true for content starting with [", () => {
    assert.strictEqual(looksLikeJSON("[1, 2, 3]"), true);
  });

  test("returns false for content starting with other characters", () => {
    assert.strictEqual(looksLikeJSON("name: value"), false);
  });
});

describe("countCommas", () => {
  test("counts commas correctly", () => {
    assert.strictEqual(countCommas("a,b,c"), 2);
  });

  test("returns 0 for no commas", () => {
    assert.strictEqual(countCommas("abc"), 0);
  });

  test("handles empty string", () => {
    assert.strictEqual(countCommas(""), 0);
  });
});

describe("hasConsistentCommaCount", () => {
  test("returns true for consistent CSV lines", () => {
    const lines = ["name,age,city", "Alice,30,NYC", "Bob,25,LA"];
    assert.strictEqual(hasConsistentCommaCount(lines), true);
  });

  test("returns false for inconsistent comma counts", () => {
    const lines = ["name,age,city", "Alice,30", "Bob,25,LA"];
    assert.strictEqual(hasConsistentCommaCount(lines), false);
  });

  test("returns false for single line", () => {
    const lines = ["name,age,city"];
    assert.strictEqual(hasConsistentCommaCount(lines), false);
  });

  test("returns false for lines with no commas", () => {
    const lines = ["name", "Alice", "Bob"];
    assert.strictEqual(hasConsistentCommaCount(lines), false);
  });
});

describe("detectJSON", () => {
  test("detects valid JSON object", () => {
    const result = detectJSON('{"name": "test"}');
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.format, "json");
    assert.strictEqual(result?.confidence, 1.0);
  });

  test("detects valid JSON array", () => {
    const result = detectJSON("[1, 2, 3]");
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.format, "json");
  });

  test("returns null for non-JSON content", () => {
    assert.strictEqual(detectJSON("name: value"), null);
  });

  test("returns null for malformed JSON", () => {
    assert.strictEqual(detectJSON("{invalid json}"), null);
  });
});

describe("detectYAML", () => {
  test("detects YAML with list items", () => {
    const yaml = `items:
  - item1
  - item2`;
    const result = detectYAML(yaml);
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.format, "yaml");
  });

  test("detects YAML with key-value pairs", () => {
    const yaml = `name: Alice
age: 30`;
    const result = detectYAML(yaml);
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.format, "yaml");
  });

  test("returns null for non-YAML content", () => {
    assert.strictEqual(detectYAML("just plain text"), null);
  });
});

describe("detectCSV", () => {
  test("detects valid CSV", () => {
    const csv = `name,age,city
Alice,30,NYC
Bob,25,LA`;
    const result = detectCSV(csv);
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.format, "csv");
  });

  test("returns null for inconsistent CSV", () => {
    const csv = `name,age,city
Alice,30
Bob,25,LA`;
    assert.strictEqual(detectCSV(csv), null);
  });

  test("returns null for single line", () => {
    assert.strictEqual(detectCSV("name,age,city"), null);
  });
});

describe("detectTOML", () => {
  test("detects TOML with sections and assignments", () => {
    const toml = `[section]
name = "test"
value = 123`;
    const result = detectTOML(toml);
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.format, "toml");
  });

  test("returns null without section headers", () => {
    const content = `name = "test"`;
    assert.strictEqual(detectTOML(content), null);
  });

  test("returns null without assignments", () => {
    const content = `[section]
just text`;
    assert.strictEqual(detectTOML(content), null);
  });
});

describe("detectMalformedJSON", () => {
  test("detects content that looks like JSON", () => {
    const result = detectMalformedJSON("{invalid json}");
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.format, "json");
    assert.strictEqual(result?.confidence, 0.6);
  });

  test("returns null for non-JSON-like content", () => {
    assert.strictEqual(detectMalformedJSON("name: value"), null);
  });
});

describe("detectFormat", () => {
  test("detects JSON", () => {
    const result = detectFormat('{"name": "test"}');
    assert.strictEqual(result.format, "json");
    assert.strictEqual(result.confidence, 1.0);
  });

  test("detects YAML", () => {
    const yaml = `name: Alice
age: 30`;
    const result = detectFormat(yaml);
    assert.strictEqual(result.format, "yaml");
  });

  test("detects CSV", () => {
    const csv = `name,age
Alice,30
Bob,25`;
    const result = detectFormat(csv);
    assert.strictEqual(result.format, "csv");
  });

  test("detects TOML", () => {
    const toml = `[section]
name = "test"`;
    const result = detectFormat(toml);
    assert.strictEqual(result.format, "toml");
  });

  test("returns text for unrecognized content", () => {
    const result = detectFormat("just some plain text");
    assert.strictEqual(result.format, "text");
  });

  test("returns text for empty content", () => {
    const result = detectFormat("");
    assert.strictEqual(result.format, "text");
    assert.strictEqual(result.confidence, 1.0);
  });

  test("returns text for whitespace-only content", () => {
    const result = detectFormat("   \n   ");
    assert.strictEqual(result.format, "text");
  });
});

describe("DETECTORS array", () => {
  test("contains all format detectors", () => {
    assert.strictEqual(DETECTORS.length, 5);
  });

  test("detectors are functions", () => {
    DETECTORS.forEach((detector) => {
      assert.strictEqual(typeof detector, "function");
    });
  });
});

describe("minifyExpression", () => {
  test("shortens .filter to .flt", () => {
    const result = minifyExpression(".filter(x => x)");
    assert.ok(result.includes(".flt"));
  });

  test("shortens .map to .mp", () => {
    const result = minifyExpression(".map(x => x * 2)");
    assert.ok(result.includes(".mp"));
  });

  test("shortens multiple methods", () => {
    const result = minifyExpression(".filter(x => x).map(y => y)");
    assert.ok(result.includes(".flt"));
    assert.ok(result.includes(".mp"));
  });
});

describe("expandExpression", () => {
  test("expands .flt to .filter", () => {
    const result = expandExpression(".flt(x => x)");
    assert.ok(result.includes(".filter"));
  });

  test("expands .mp to .map", () => {
    const result = expandExpression(".mp(x => x * 2)");
    assert.ok(result.includes(".map"));
  });

  test("expands multiple shortcuts", () => {
    const result = expandExpression(".flt(x => x).mp(y => y)");
    assert.ok(result.includes(".filter"));
    assert.ok(result.includes(".map"));
  });
});

describe("runEvaluation", () => {
  test("evaluates JSON expression correctly", () => {
    const input = '{"users": [{"name": "Alice"}, {"name": "Bob"}]}';
    const expression = ".users.map(u => u.name)";
    const result = Effect.runSync(runEvaluation(input, expression, "json"));
    assert.strictEqual(result.error, null);
    assert.ok(result.output.includes("Alice"));
    assert.ok(result.output.includes("Bob"));
  });

  test("returns empty output for empty input", () => {
    const result = Effect.runSync(runEvaluation("", ".test", "json"));
    assert.strictEqual(result.output, "");
    assert.strictEqual(result.error, null);
  });

  test("returns empty output for empty expression", () => {
    const result = Effect.runSync(runEvaluation('{"test": true}', "", "json"));
    assert.strictEqual(result.output, "");
    assert.strictEqual(result.error, null);
  });

  test("returns error for invalid JSON input", () => {
    const result = Effect.runSync(runEvaluation("{invalid}", ".test", "json"));
    assert.notStrictEqual(result.error, null);
  });

  test("formats undefined expression results without crashing", () => {
    const result = Effect.runSync(runEvaluation('{"test": true}', ".missing", "json"));
    assert.strictEqual(result.error, null);
    assert.strictEqual(result.output, "undefined");
  });

  test("evaluates text format as array of lines", () => {
    const input = "line1\nline2\nline3";
    const expression = ".length";
    const result = Effect.runSync(runEvaluation(input, expression, "text"));
    assert.strictEqual(result.error, null);
    assert.ok(result.output.includes("3"));
  });
});

describe("computeFormatChange", () => {
  test("sandbox context returns SANDBOX_STARTER data and expression", () => {
    const result = computeFormatChange(sandboxContext, "json");
    assert.strictEqual(result.format, "json");
    assert.strictEqual(result.input, SANDBOX_STARTER.json.data);
    assert.strictEqual(result.expression, SANDBOX_STARTER.json.expression);
  });

  test("preset context returns FORMAT_CONFIGS placeholder", () => {
    const result = computeFormatChange(baseContext, "json");
    assert.strictEqual(result.format, "json");
    assert.strictEqual(result.input, FORMAT_CONFIGS.json.placeholder);
  });

  test("preset context returns first suggestion expression", () => {
    const result = computeFormatChange(baseContext, "json");
    assert.strictEqual(result.expression, FORMAT_CONFIGS.json.suggestions[0]?.expression ?? ".");
  });

  FORMATS.forEach((format) => {
    test(`sandbox: format=${format} uses SANDBOX_STARTER`, () => {
      const result = computeFormatChange(sandboxContext, format);
      assert.strictEqual(result.format, format);
      assert.strictEqual(result.input, SANDBOX_STARTER[format].data);
      assert.strictEqual(result.expression, SANDBOX_STARTER[format].expression);
    });
  });

  FORMATS.forEach((format) => {
    test(`preset: format=${format} uses FORMAT_CONFIGS`, () => {
      const result = computeFormatChange(baseContext, format);
      assert.strictEqual(result.format, format);
      assert.strictEqual(result.input, FORMAT_CONFIGS[format].placeholder);
    });
  });
});

describe("isSandboxGuard", () => {
  test("returns true when context.isSandbox=true", () => {
    assert.strictEqual(isSandboxGuard({ context: sandboxContext }), true);
  });

  test("returns false when context.isSandbox=false", () => {
    assert.strictEqual(isSandboxGuard({ context: baseContext }), false);
  });
});

describe("persistPlaygroundState", () => {
  test("exits early and does not throw when isSandbox=false", () => {
    assert.doesNotThrow(() => persistPlaygroundState({ context: baseContext }));
  });
});

describe("loadInitialStateActor", () => {
  test("returns null for non-sandbox mode", async () => {
    const result = await loadInitialStateActor({ input: { isSandbox: false } });
    assert.strictEqual(result, null);
  });
});
