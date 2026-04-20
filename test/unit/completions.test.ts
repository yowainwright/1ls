import { describe, it, expect } from "bun:test";
import {
  getFlags,
  getFormatOptions,
  getJsonPaths,
  getShortcutCompletions,
  getBuiltinCompletions,
  generateBashCompletions,
  generateZshCompletions,
} from "../../src/completions/index";
import { SHORTCUTS, BUILTIN_SHORTCUTS } from "../../src/shortcuts/constants";
import { BUILTIN_FUNCTIONS } from "../../src/navigator/builtins/constants";
import { VALID_OUTPUT_FORMATS } from "../../src/constants";

describe("getFlags", () => {
  it("returns long flags", () => {
    const flags = getFlags();
    expect(flags).toContain("--help");
    expect(flags).toContain("--version");
    expect(flags).toContain("--format");
    expect(flags).toContain("--slurp");
    expect(flags).toContain("--null-input");
  });

  it("returns short aliases", () => {
    const flags = getFlags();
    expect(flags).toContain("-h");
    expect(flags).toContain("-v");
    expect(flags).toContain("-r");
  });

  it("omits null shorts", () => {
    const flags = getFlags();
    expect(flags).not.toContain("null");
  });
});

describe("getFormatOptions", () => {
  it("returns all valid output formats", () => {
    const formats = getFormatOptions();
    for (const f of VALID_OUTPUT_FORMATS) {
      expect(formats).toContain(f);
    }
  });

  it("includes json, yaml, csv, table", () => {
    const formats = getFormatOptions();
    expect(formats).toContain("json");
    expect(formats).toContain("yaml");
    expect(formats).toContain("csv");
    expect(formats).toContain("table");
  });
});

describe("getJsonPaths", () => {
  it("includes root and array access patterns", () => {
    const paths = getJsonPaths();
    expect(paths).toContain(".");
    expect(paths).toContain(".[]");
    expect(paths).toContain("..");
    expect(paths).toContain(".{keys}");
    expect(paths).toContain(".{values}");
    expect(paths).toContain(".{entries}");
  });
});

describe("getShortcutCompletions", () => {
  it("returns all SHORTCUTS short forms", () => {
    const completions = getShortcutCompletions();
    for (const s of SHORTCUTS) {
      expect(completions).toContain(s.short);
    }
  });

  it("includes known shortcuts", () => {
    const completions = getShortcutCompletions();
    expect(completions).toContain(".mp");
    expect(completions).toContain(".flt");
    expect(completions).toContain(".kys");
  });

  it("has more entries than the old hardcoded 15", () => {
    expect(getShortcutCompletions().length).toBeGreaterThan(15);
  });
});

describe("getBuiltinCompletions", () => {
  it("contains all BUILTIN_FUNCTIONS values", () => {
    const completions = getBuiltinCompletions();
    for (const fn of Object.values(BUILTIN_FUNCTIONS)) {
      expect(completions).toContain(fn);
    }
  });

  it("contains all BUILTIN_SHORTCUTS short forms", () => {
    const completions = getBuiltinCompletions();
    for (const s of BUILTIN_SHORTCUTS) {
      expect(completions).toContain(s.short);
    }
  });

  it("has no duplicates", () => {
    const completions = getBuiltinCompletions();
    expect(completions.length).toBe(new Set(completions).size);
  });
});

describe("generateBashCompletions", () => {
  it("contains _1ls_complete function", () => {
    expect(generateBashCompletions()).toContain("_1ls_complete()");
  });

  it("ends with complete -F registration", () => {
    expect(generateBashCompletions()).toContain("complete -F _1ls_complete 1ls");
  });

  it("includes all flags", () => {
    const bash = generateBashCompletions();
    for (const flag of getFlags()) {
      expect(bash).toContain(flag);
    }
  });

  it("includes all shortcuts", () => {
    const bash = generateBashCompletions();
    for (const s of SHORTCUTS) {
      expect(bash).toContain(s.short);
    }
  });

  it("includes all builtin functions", () => {
    const bash = generateBashCompletions();
    for (const fn of Object.values(BUILTIN_FUNCTIONS)) {
      expect(bash).toContain(fn);
    }
  });
});

describe("generateZshCompletions", () => {
  it("starts with #compdef 1ls", () => {
    expect(generateZshCompletions()).toMatch(/^#compdef 1ls/);
  });

  it("contains _1ls function", () => {
    expect(generateZshCompletions()).toContain("_1ls()");
  });

  it("contains _arguments construct", () => {
    expect(generateZshCompletions()).toContain("_arguments");
  });

  it("ends with _1ls invocation", () => {
    expect(generateZshCompletions().trimEnd()).toContain('_1ls "$@"');
  });

  it("includes all shortcuts", () => {
    const zsh = generateZshCompletions();
    for (const s of SHORTCUTS) {
      expect(zsh).toContain(s.short);
    }
  });

  it("includes all builtin functions", () => {
    const zsh = generateZshCompletions();
    for (const fn of Object.values(BUILTIN_FUNCTIONS)) {
      expect(zsh).toContain(fn);
    }
  });

  it("includes format options", () => {
    const zsh = generateZshCompletions();
    for (const f of VALID_OUTPUT_FORMATS) {
      expect(zsh).toContain(f);
    }
  });

  it("does not use reserved zsh variable name 'builtins'", () => {
    const zsh = generateZshCompletions();
    expect(zsh).not.toContain("builtins=(");
    expect(zsh).not.toContain("local -a builtins");
  });

  it("does not pass readFile to _arguments as a flag", () => {
    const zsh = generateZshCompletions();
    const argsBlock = zsh.match(/_arguments[^;]*/s)?.[0] ?? "";
    expect(argsBlock).not.toContain("readFile[");
  });

  it("handles readFile as a subcommand with file completion", () => {
    const zsh = generateZshCompletions();
    expect(zsh).toContain("readFile");
    expect(zsh).toContain("_files");
  });
});
