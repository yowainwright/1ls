import { describe, expect, test } from "bun:test";
import {
  COLORS,
  Formatter,
  colorize,
  dim,
  error,
  info,
  success,
  warning,
} from "../../src/formatter";

const withNoColor = <T>(value: string | undefined, callback: () => T): T => {
  const previousValue = process.env.NO_COLOR;
  if (value === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = value;
  }

  try {
    return callback();
  } finally {
    if (previousValue === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = previousValue;
    }
  }
};

describe("Formatter", () => {
  test("formats raw values without adding JSON decoration", () => {
    const formatter = new Formatter({ raw: true });

    expect(formatter.format("Ada")).toBe("Ada");
    expect(formatter.format(undefined)).toBe("");
    expect(formatter.format(null)).toBe("null");
    expect(formatter.format({ age: 37 })).toBe('{"age":37}');
    expect(formatter.format(37)).toBe("37");
  });

  test("formats JSON with compact, pretty, and type options", () => {
    expect(new Formatter({}).format(undefined)).toBe("undefined");
    expect(new Formatter({ compact: true }).format({ name: "Ada" })).toBe('{"name":"Ada"}');

    const pretty = new Formatter({ pretty: true }).format({ name: "Ada" });
    expect(pretty).toContain('"name": "Ada"');

    expect(new Formatter({ type: true }).format([1, 2])).toContain("[array]");
    expect(new Formatter({ type: true }).format(true)).toContain("[boolean]");
  });

  test("formats YAML primitives, multiline strings, and nested records", () => {
    const formatter = new Formatter({ format: "yaml" });

    expect(formatter.format(null)).toBe("null");
    expect(formatter.format("line one\nline two")).toBe("|\n  line one\n  line two");
    expect(formatter.format(42)).toBe("42");
    expect(formatter.format(false)).toBe("false");
    expect(formatter.format([])).toBe("[]");
    expect(formatter.format(["Ada", 42])).toBe("- Ada\n- 42");
    expect(formatter.format({})).toBe("{}");
    expect(formatter.format({ name: "Ada", details: { age: 37 } })).toBe(
      "name: Ada\ndetails:\n  age: 37",
    );
  });

  test("formats CSV records and primitive arrays", () => {
    const formatter = new Formatter({ format: "csv" });

    expect(formatter.format({ name: "Ada" })).toContain('"name": "Ada"');
    expect(formatter.format([])).toBe("");
    expect(
      formatter.format([
        { name: "Ada", note: 'hello, "world"', empty: null },
        { name: "Bob", note: "line\nnext" },
      ]),
    ).toBe('name,note,empty\nAda,"hello, ""world""",\nBob,"line\nnext",');
    expect(formatter.format(["Ada", null, "a,b"])).toBe('Ada\n\n"a,b"');
  });

  test("formats tables for records and primitive arrays", () => {
    const formatter = new Formatter({ format: "table" });

    expect(formatter.format({ name: "Ada" })).toContain('"name": "Ada"');
    expect(formatter.format([])).toBe("(empty array)");
    expect(formatter.format(["Ada", 42, null])).toBe("0: Ada\n1: 42\n2: null");

    const table = formatter.format([
      { name: "Ada", age: 3 },
      { name: "Bob", city: "NY" },
    ]);
    expect(table).toContain("name | age | city");
    expect(table).toContain("Ada  | 3   |");
    expect(table).toContain("Bob  |     | NY  ");
  });
});

describe("formatter colors", () => {
  test("colorizes JSON tokens and status messages", () => {
    withNoColor(undefined, () => {
      const json = colorize('{"name": "Ada", "age": -1.5, "active": true, "none": null}');

      expect(json).toContain(`${COLORS.cyan}"name"${COLORS.reset}`);
      expect(json).toContain(`${COLORS.green}"Ada"${COLORS.reset}`);
      expect(json).toContain(`${COLORS.yellow}-1.5${COLORS.reset}`);
      expect(json).toContain(`${COLORS.magenta}true${COLORS.reset}`);
      expect(json).toContain(`${COLORS.gray}null${COLORS.reset}`);
      expect(json).toContain(`${COLORS.gray}{${COLORS.reset}`);
      expect(json).toContain(`${COLORS.gray}}${COLORS.reset}`);

      expect(error("failed")).toBe(`${COLORS.red}failed${COLORS.reset}`);
      expect(success("done")).toBe(`${COLORS.green}done${COLORS.reset}`);
      expect(warning("careful")).toBe(`${COLORS.yellow}careful${COLORS.reset}`);
      expect(info("details")).toBe(`${COLORS.cyan}details${COLORS.reset}`);
      expect(dim("quiet")).toBe(`${COLORS.dim}quiet${COLORS.reset}`);
    });
  });

  test("leaves output uncolored when NO_COLOR is set", () => {
    withNoColor("1", () => {
      expect(colorize('{"name":"Ada"}')).toBe('{"name":"Ada"}');
      expect(error("failed")).toBe("failed");
      expect(success("done")).toBe("done");
      expect(warning("careful")).toBe("careful");
      expect(info("details")).toBe("details");
      expect(dim("quiet")).toBe("quiet");
    });
  });
});
