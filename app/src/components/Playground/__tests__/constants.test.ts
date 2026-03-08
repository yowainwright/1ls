import { describe, test, expect } from "bun:test";
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
      expect(format in FORMAT_CONFIGS).toBe(true);
    });
  });

  test("each config has label, language, placeholder, suggestions", () => {
    FORMATS.forEach((format) => {
      const config = FORMAT_CONFIGS[format];
      expect(typeof config.label).toBe("string");
      expect(typeof config.language).toBe("string");
      expect(typeof config.placeholder).toBe("string");
      expect(Array.isArray(config.suggestions)).toBe(true);
    });
  });

  test("each config has at least one suggestion", () => {
    FORMATS.forEach((format) => {
      expect(FORMAT_CONFIGS[format].suggestions.length).toBeGreaterThan(0);
    });
  });

  test("each suggestion has label and expression", () => {
    FORMATS.forEach((format) => {
      FORMAT_CONFIGS[format].suggestions.forEach((suggestion) => {
        expect(typeof suggestion.label).toBe("string");
        expect(typeof suggestion.expression).toBe("string");
      });
    });
  });
});

describe("FORMATS", () => {
  test("is a non-empty array", () => {
    expect(Array.isArray(FORMATS)).toBe(true);
    expect(FORMATS.length).toBeGreaterThan(0);
  });

  test("contains json, yaml, csv, toml, text", () => {
    expect(FORMATS).toContain("json");
    expect(FORMATS).toContain("yaml");
    expect(FORMATS).toContain("csv");
    expect(FORMATS).toContain("toml");
    expect(FORMATS).toContain("text");
  });

  test("matches FORMAT_CONFIGS keys", () => {
    const configKeys = Object.keys(FORMAT_CONFIGS).sort();
    const formatsKeys = [...FORMATS].sort();
    expect(formatsKeys).toEqual(configKeys);
  });
});

describe("SANDBOX_STARTER", () => {
  test("has entry for each format", () => {
    FORMATS.forEach((format) => {
      expect(format in SANDBOX_STARTER).toBe(true);
    });
  });

  test("each entry has data and expression", () => {
    FORMATS.forEach((format) => {
      const starter = SANDBOX_STARTER[format];
      expect(typeof starter.data).toBe("string");
      expect(typeof starter.expression).toBe("string");
      expect(starter.data.length).toBeGreaterThan(0);
      expect(starter.expression.length).toBeGreaterThan(0);
    });
  });
});

describe("States", () => {
  test("has INITIALIZING, READY, SHARE_IDLE, SHARE_COPIED", () => {
    expect(States.INITIALIZING).toBe("initializing");
    expect(States.READY).toBe("ready");
    expect(States.SHARE_IDLE).toBe("shareIdle");
    expect(States.SHARE_COPIED).toBe("shareCopied");
  });
});

describe("MachineEvents", () => {
  test("has all expected event names", () => {
    expect(MachineEvents.FORMAT_CHANGE).toBe("FORMAT_CHANGE");
    expect(MachineEvents.INPUT_CHANGE).toBe("INPUT_CHANGE");
    expect(MachineEvents.EXPRESSION_CHANGE).toBe("EXPRESSION_CHANGE");
    expect(MachineEvents.TOGGLE_MINIFIED).toBe("TOGGLE_MINIFIED");
    expect(MachineEvents.SHARE).toBe("SHARE");
    expect(MachineEvents.FORMAT_DETECTED).toBe("FORMAT_DETECTED");
  });
});

describe("Actions", () => {
  test("has expected action names", () => {
    expect(typeof Actions.APPLY_INITIAL_STATE).toBe("string");
    expect(typeof Actions.PERSIST_STATE).toBe("string");
    expect(typeof Actions.UPDATE_FORMAT).toBe("string");
  });
});

describe("Guards", () => {
  test("has IS_SANDBOX guard", () => {
    expect(typeof Guards.IS_SANDBOX).toBe("string");
  });
});

describe("Actors", () => {
  test("has LOAD_INITIAL_STATE actor", () => {
    expect(typeof Actors.LOAD_INITIAL_STATE).toBe("string");
  });
});

describe("Delays", () => {
  test("SHARE_RESET is a positive number", () => {
    expect(typeof Delays.SHARE_RESET).toBe("number");
    expect(Delays.SHARE_RESET).toBeGreaterThan(0);
  });
});

describe("DEFAULT_EXPRESSION", () => {
  test("is a non-empty string", () => {
    expect(typeof DEFAULT_EXPRESSION).toBe("string");
    expect(DEFAULT_EXPRESSION.length).toBeGreaterThan(0);
  });
});
