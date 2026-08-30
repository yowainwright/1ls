import { describe, test as it } from "node:test";
import assert from "node:assert/strict";
import {
  getFlags,
  getFormatOptions,
  getInputFormatOptions,
  getJsonPaths,
  getShortcutCompletions,
  getBuiltinCompletions,
  generateBashCompletions,
  generateZshCompletions,
} from "../../../src/completions/index.ts";
import { SHORTCUTS, BUILTIN_SHORTCUTS } from "../../../src/shortcuts/constants.ts";
import { BUILTIN_FUNCTIONS } from "../../../src/navigator/builtins/constants.ts";
import { VALID_INPUT_FORMATS, VALID_OUTPUT_FORMATS } from "../../../src/constants.ts";

describe("getFlags", () => {
  it("returns long flags", () => {
    const flags = getFlags();
    assert.ok(flags.includes("--help"));
    assert.ok(flags.includes("--version"));
    assert.ok(flags.includes("--format"));
    assert.ok(flags.includes("--slurp"));
    assert.ok(flags.includes("--null-input"));
  });

  it("returns short aliases", () => {
    const flags = getFlags();
    assert.ok(flags.includes("-h"));
    assert.ok(flags.includes("-v"));
    assert.ok(flags.includes("-r"));
  });

  it("omits null shorts", () => {
    const flags = getFlags();
    assert.ok(!flags.includes("null"));
  });
});

describe("getFormatOptions", () => {
  it("returns all valid output formats", () => {
    const formats = getFormatOptions();
    for (const f of VALID_OUTPUT_FORMATS) {
      assert.ok(formats.includes(f));
    }
  });

  it("includes json, yaml, csv, table", () => {
    const formats = getFormatOptions();
    assert.ok(formats.includes("json"));
    assert.ok(formats.includes("yaml"));
    assert.ok(formats.includes("csv"));
    assert.ok(formats.includes("table"));
  });
});

describe("getInputFormatOptions", () => {
  it("returns all valid input formats", () => {
    const formats = getInputFormatOptions();
    for (const f of VALID_INPUT_FORMATS) {
      assert.ok(formats.includes(f));
    }
  });

  it("includes non-default parser formats", () => {
    const formats = getInputFormatOptions();
    assert.ok(formats.includes("json5"));
    assert.ok(formats.includes("xml"));
    assert.ok(formats.includes("ini"));
    assert.ok(formats.includes("env"));
    assert.ok(formats.includes("ndjson"));
  });
});

describe("getJsonPaths", () => {
  it("includes root and array access patterns", () => {
    const paths = getJsonPaths();
    assert.ok(paths.includes("."));
    assert.ok(paths.includes(".[]"));
    assert.ok(paths.includes(".."));
    assert.ok(paths.includes(".{keys}"));
    assert.ok(paths.includes(".{values}"));
    assert.ok(paths.includes(".{entries}"));
  });
});

describe("getShortcutCompletions", () => {
  it("returns all SHORTCUTS short forms", () => {
    const completions = getShortcutCompletions();
    for (const s of SHORTCUTS) {
      assert.ok(completions.includes(s.short));
    }
  });

  it("includes known shortcuts", () => {
    const completions = getShortcutCompletions();
    assert.ok(completions.includes(".mp"));
    assert.ok(completions.includes(".flt"));
    assert.ok(completions.includes(".kys"));
  });

  it("has more entries than the old hardcoded 15", () => {
    assert.ok(getShortcutCompletions().length > 15);
  });
});

describe("getBuiltinCompletions", () => {
  it("contains all BUILTIN_FUNCTIONS values", () => {
    const completions = getBuiltinCompletions();
    for (const fn of Object.values(BUILTIN_FUNCTIONS)) {
      assert.ok(completions.includes(fn));
    }
  });

  it("contains all BUILTIN_SHORTCUTS short forms", () => {
    const completions = getBuiltinCompletions();
    for (const s of BUILTIN_SHORTCUTS) {
      assert.ok(completions.includes(s.short));
    }
  });

  it("has no duplicates", () => {
    const completions = getBuiltinCompletions();
    assert.strictEqual(completions.length, new Set(completions).size);
  });
});

describe("generateBashCompletions", () => {
  it("contains _1ls_complete function", () => {
    assert.ok(generateBashCompletions().includes("_1ls_complete()"));
  });

  it("ends with complete -F registration", () => {
    assert.ok(generateBashCompletions().includes("complete -F _1ls_complete 1ls"));
  });

  it("includes all flags", () => {
    const bash = generateBashCompletions();
    for (const flag of getFlags()) {
      assert.ok(bash.includes(flag));
    }
  });

  it("includes all shortcuts", () => {
    const bash = generateBashCompletions();
    for (const s of SHORTCUTS) {
      assert.ok(bash.includes(s.short));
    }
  });

  it("includes all builtin functions", () => {
    const bash = generateBashCompletions();
    for (const fn of Object.values(BUILTIN_FUNCTIONS)) {
      assert.ok(bash.includes(fn));
    }
  });
});

describe("generateZshCompletions", () => {
  it("starts with #compdef 1ls", () => {
    assert.match(generateZshCompletions(), /^#compdef 1ls/);
  });

  it("contains _1ls function", () => {
    assert.ok(generateZshCompletions().includes("_1ls()"));
  });

  it("contains _arguments construct", () => {
    assert.ok(generateZshCompletions().includes("_arguments"));
  });

  it("ends with _1ls invocation", () => {
    assert.ok(generateZshCompletions().trimEnd().includes('_1ls "$@"'));
  });

  it("includes all shortcuts", () => {
    const zsh = generateZshCompletions();
    for (const s of SHORTCUTS) {
      assert.ok(zsh.includes(s.short));
    }
  });

  it("includes all builtin functions", () => {
    const zsh = generateZshCompletions();
    for (const fn of Object.values(BUILTIN_FUNCTIONS)) {
      assert.ok(zsh.includes(fn));
    }
  });

  it("includes format options", () => {
    const zsh = generateZshCompletions();
    for (const f of VALID_OUTPUT_FORMATS) {
      assert.ok(zsh.includes(f));
    }
  });

  it("includes input format options", () => {
    const zsh = generateZshCompletions();
    for (const f of VALID_INPUT_FORMATS) {
      assert.ok(zsh.includes(f));
    }
  });

  it("does not use reserved zsh variable name 'builtins'", () => {
    const zsh = generateZshCompletions();
    assert.ok(!zsh.includes("builtins=("));
    assert.ok(!zsh.includes("local -a builtins"));
  });

  it("does not pass readFile to _arguments as a flag", () => {
    const zsh = generateZshCompletions();
    const argsBlock = zsh.match(/_arguments[^;]*/s)?.[0] ?? "";
    assert.ok(!argsBlock.includes("readFile["));
  });

  it("handles readFile as a subcommand with file completion", () => {
    const zsh = generateZshCompletions();
    assert.ok(zsh.includes("readFile"));
    assert.ok(zsh.includes("_files"));
    assert.ok(zsh.includes("case $words[2] in"));
    assert.ok(!zsh.includes("case $words[1] in"));
  });
});
