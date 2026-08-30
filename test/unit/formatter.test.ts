import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  COLORS,
  Formatter,
  colorize,
  dim,
  error,
  info,
  setColorEnabled,
  success,
  warning,
} from "../../src/formatter/index.ts";

const stripAnsi = (value: string): string => value.replace(/\x1b\[[0-9;]*m/g, "");

describe("Formatter", () => {
  test("formats raw values without adding JSON decoration", () => {
    const formatter = new Formatter({ raw: true });

    assert.strictEqual(formatter.format("Ada"), "Ada");
    assert.strictEqual(formatter.format(undefined), "");
    assert.strictEqual(formatter.format(null), "null");
    assert.strictEqual(formatter.format({ age: 37 }), '{"age":37}');
    assert.strictEqual(formatter.format(37), "37");
  });

  test("formats JSON with compact, pretty, and type options", () => {
    assert.strictEqual(new Formatter({}).format(undefined), "undefined");
    assert.strictEqual(new Formatter({ compact: true }).format({ name: "Ada" }), '{"name":"Ada"}');

    const pretty = new Formatter({ pretty: true }).format({ name: "Ada" });
    assert.ok(stripAnsi(pretty).includes('"name": "Ada"'));

    assert.ok(new Formatter({ type: true }).format([1, 2]).includes("[array]"));
    assert.ok(new Formatter({ type: true }).format(true).includes("[boolean]"));
  });

  test("formats YAML primitives, multiline strings, and nested records", () => {
    const formatter = new Formatter({ format: "yaml" });

    assert.strictEqual(formatter.format(null), "null");
    assert.strictEqual(formatter.format("line one\nline two"), "|\n  line one\n  line two");
    assert.strictEqual(formatter.format(42), "42");
    assert.strictEqual(formatter.format(false), "false");
    assert.strictEqual(formatter.format([]), "[]");
    assert.strictEqual(formatter.format(["Ada", 42]), "- Ada\n- 42");
    assert.strictEqual(formatter.format({}), "{}");
    assert.strictEqual(formatter.format({ name: "Ada", details: { age: 37 } }), "name: Ada\ndetails:\n  age: 37",);
  });

  test("formats CSV records and primitive arrays", () => {
    const formatter = new Formatter({ format: "csv" });

    assert.ok(formatter.format({ name: "Ada" }).includes('"name": "Ada"'));
    assert.strictEqual(formatter.format([]), "");
    assert.strictEqual(
      formatter.format([
        { name: "Ada", note: 'hello, "world"', empty: null },
        { name: "Bob", note: "line\nnext" },
      ]),
      'name,note,empty\nAda,"hello, ""world""",\nBob,"line\nnext",',
    );
    assert.strictEqual(formatter.format(["Ada", null, "a,b"]), 'Ada\n\n"a,b"');
  });

  test("formats tables for records and primitive arrays", () => {
    const formatter = new Formatter({ format: "table" });

    assert.ok(formatter.format({ name: "Ada" }).includes('"name": "Ada"'));
    assert.strictEqual(formatter.format([]), "(empty array)");
    assert.strictEqual(formatter.format(["Ada", 42, null]), "0: Ada\n1: 42\n2: null");

    const table = formatter.format([
      { name: "Ada", age: 3 },
      { name: "Bob", city: "NY" },
    ]);
    assert.ok(table.includes("name | age | city"));
    assert.ok(table.includes("Ada  | 3   |"));
    assert.ok(table.includes("Bob  |     | NY  "));
  });
});

describe("formatter colors", () => {
  test("defaults to plain output for direct formatter consumers", () => {
    assert.strictEqual(colorize('{"name": "Ada"}'), '{"name": "Ada"}');
    assert.strictEqual(new Formatter({ pretty: true }).format({ name: "Ada" }), '{\n  "name": "Ada"\n}');
  });

  test("can disable colors without requiring a Node-only process global", () => {
    setColorEnabled(false);

    try {
      assert.strictEqual(colorize('{"name": "Ada"}'), '{"name": "Ada"}');
      assert.strictEqual(error("failed"), "failed");
      assert.strictEqual(success("done"), "done");
      assert.strictEqual(warning("careful"), "careful");
      assert.strictEqual(info("details"), "details");
      assert.strictEqual(dim("quiet"), "quiet");
    } finally {
      setColorEnabled(true);
    }
  });

  test("colorizes JSON tokens and status messages", () => {
    setColorEnabled(true);

    try {
      const json = colorize('{"name": "Ada", "age": -1.5, "active": true, "none": null}');

      assert.ok(json.includes(`${COLORS.cyan}"name"${COLORS.reset}`));
      assert.ok(json.includes(`${COLORS.green}"Ada"${COLORS.reset}`));
      assert.ok(json.includes(`${COLORS.yellow}-1.5${COLORS.reset}`));
      assert.ok(json.includes(`${COLORS.magenta}true${COLORS.reset}`));
      assert.ok(json.includes(`${COLORS.gray}null${COLORS.reset}`));
      assert.ok(json.includes(`${COLORS.gray}{${COLORS.reset}`));
      assert.ok(json.includes(`${COLORS.gray}}${COLORS.reset}`));

      assert.strictEqual(error("failed"), `${COLORS.red}failed${COLORS.reset}`);
      assert.strictEqual(success("done"), `${COLORS.green}done${COLORS.reset}`);
      assert.strictEqual(warning("careful"), `${COLORS.yellow}careful${COLORS.reset}`);
      assert.strictEqual(info("details"), `${COLORS.cyan}details${COLORS.reset}`);
      assert.strictEqual(dim("quiet"), `${COLORS.dim}quiet${COLORS.reset}`);
    } finally {
      setColorEnabled(true);
    }
  });
});
