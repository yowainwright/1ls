import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  FORMAT_CONFIGS,
  FORMATS,
  SANDBOX_STARTER,
  States,
  MachineEvents,
  Actions,
  Guards,
  Actors,
  Delays,
  DEFAULT_EXPRESSION,
} from "../constants";

describe("FORMAT_CONFIGS", () => {
  test("has entry for each format", () => {
    FORMATS.forEach((format) => {
      assert.strictEqual(format in FORMAT_CONFIGS, true);
    });
  });

  test("each config has label, language, placeholder, suggestions", () => {
    FORMATS.forEach((format) => {
      const config = FORMAT_CONFIGS[format];
      assert.strictEqual(typeof config.label, "string");
      assert.strictEqual(typeof config.language, "string");
      assert.strictEqual(typeof config.placeholder, "string");
      assert.strictEqual(Array.isArray(config.suggestions), true);
    });
  });

  test("each config has at least one suggestion", () => {
    FORMATS.forEach((format) => {
      assert.ok(FORMAT_CONFIGS[format].suggestions.length > 0);
    });
  });

  test("each suggestion has label and expression", () => {
    FORMATS.forEach((format) => {
      FORMAT_CONFIGS[format].suggestions.forEach((suggestion) => {
        assert.strictEqual(typeof suggestion.label, "string");
        assert.strictEqual(typeof suggestion.expression, "string");
      });
    });
  });
});

describe("FORMATS", () => {
  test("is a non-empty array", () => {
    assert.strictEqual(Array.isArray(FORMATS), true);
    assert.ok(FORMATS.length > 0);
  });

  test("contains json, yaml, csv, toml, text", () => {
    assert.ok(FORMATS.includes("json"));
    assert.ok(FORMATS.includes("yaml"));
    assert.ok(FORMATS.includes("csv"));
    assert.ok(FORMATS.includes("toml"));
    assert.ok(FORMATS.includes("text"));
  });

  test("matches FORMAT_CONFIGS keys", () => {
    const configKeys = Object.keys(FORMAT_CONFIGS).sort();
    const formatsKeys = [...FORMATS].sort();
    assert.deepStrictEqual(formatsKeys, configKeys);
  });
});

describe("SANDBOX_STARTER", () => {
  test("has entry for each format", () => {
    FORMATS.forEach((format) => {
      assert.strictEqual(format in SANDBOX_STARTER, true);
    });
  });

  test("each entry has data and expression", () => {
    FORMATS.forEach((format) => {
      const starter = SANDBOX_STARTER[format];
      assert.strictEqual(typeof starter.data, "string");
      assert.strictEqual(typeof starter.expression, "string");
      assert.ok(starter.data.length > 0);
      assert.ok(starter.expression.length > 0);
    });
  });
});

describe("States", () => {
  test("has INITIALIZING, READY, SHARE_IDLE, SHARE_COPIED", () => {
    assert.strictEqual(States.INITIALIZING, "initializing");
    assert.strictEqual(States.READY, "ready");
    assert.strictEqual(States.SHARE_IDLE, "shareIdle");
    assert.strictEqual(States.SHARE_COPIED, "shareCopied");
  });
});

describe("MachineEvents", () => {
  test("has all expected event names", () => {
    assert.strictEqual(MachineEvents.FORMAT_CHANGE, "FORMAT_CHANGE");
    assert.strictEqual(MachineEvents.INPUT_CHANGE, "INPUT_CHANGE");
    assert.strictEqual(MachineEvents.EXPRESSION_CHANGE, "EXPRESSION_CHANGE");
    assert.strictEqual(MachineEvents.TOGGLE_MINIFIED, "TOGGLE_MINIFIED");
    assert.strictEqual(MachineEvents.SHARE, "SHARE");
    assert.strictEqual(MachineEvents.FORMAT_DETECTED, "FORMAT_DETECTED");
  });
});

describe("Actions", () => {
  test("has expected action names", () => {
    assert.strictEqual(typeof Actions.APPLY_INITIAL_STATE, "string");
    assert.strictEqual(typeof Actions.PERSIST_STATE, "string");
    assert.strictEqual(typeof Actions.UPDATE_FORMAT, "string");
  });
});

describe("Guards", () => {
  test("has IS_SANDBOX guard", () => {
    assert.strictEqual(typeof Guards.IS_SANDBOX, "string");
  });
});

describe("Actors", () => {
  test("has LOAD_INITIAL_STATE actor", () => {
    assert.strictEqual(typeof Actors.LOAD_INITIAL_STATE, "string");
  });
});

describe("Delays", () => {
  test("SHARE_RESET is a positive number", () => {
    assert.strictEqual(typeof Delays.SHARE_RESET, "number");
    assert.ok(Delays.SHARE_RESET > 0);
  });
});

describe("DEFAULT_EXPRESSION", () => {
  test("is a non-empty string", () => {
    assert.strictEqual(typeof DEFAULT_EXPRESSION, "string");
    assert.ok(DEFAULT_EXPRESSION.length > 0);
  });
});
