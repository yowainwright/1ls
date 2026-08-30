import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYAML, findPreviousKey } from "../../src/formats/yaml/index";

test("findPreviousKey finds key with empty value", () => {
  const lines = ["parent:", "  - child1"];
  assert.strictEqual(findPreviousKey(lines, 1), "parent");
});

test("findPreviousKey finds key with | indicator", () => {
  const lines = ["text: |", "  multiline content"];
  assert.strictEqual(findPreviousKey(lines, 1), "text");
});

test("findPreviousKey finds key with > indicator", () => {
  const lines = ["text: >", "  folded content"];
  assert.strictEqual(findPreviousKey(lines, 1), "text");
});

test("findPreviousKey finds key with |+ indicator", () => {
  const lines = ["text: |+", "  content"];
  assert.strictEqual(findPreviousKey(lines, 1), "text");
});

test("findPreviousKey finds key with >- indicator", () => {
  const lines = ["text: >-", "  content"];
  assert.strictEqual(findPreviousKey(lines, 1), "text");
});

test("findPreviousKey skips list items", () => {
  const lines = ["items:", "  - item1", "  - item2"];
  assert.strictEqual(findPreviousKey(lines, 2), "items");
});

test("findPreviousKey handles comments outside quotes", () => {
  const lines = ["key: value # comment", "next:"];
  assert.strictEqual(findPreviousKey(lines, 1), null);
});

test("findPreviousKey returns null at start", () => {
  const lines = ["first: value"];
  assert.strictEqual(findPreviousKey(lines, 0), null);
});

test("findPreviousKey skips empty lines", () => {
  const lines = ["parent:", "", "  - child"];
  assert.strictEqual(findPreviousKey(lines, 2), "parent");
});

test("parseYAML handles anchor with nested list", () => {
  const input = `data: &ref
  - item1
  - item2
copy: *ref`;
  const result = parseYAML(input);
  assert.deepStrictEqual(result.data, ["item1", "item2"]);
});

test("parseYAML handles multiline with trailing empty lines removed", () => {
  const input = `text: |
  line1
  line2

`;
  const result = parseYAML(input);
  assert.strictEqual(result.text, "line1\nline2");
});

test("parseYAML handles deeply nested list with findPreviousKey", () => {
  const input = `root:
  parent:
    items:
      - one
      - two`;
  const result = parseYAML(input);
  assert.deepStrictEqual(result.root.parent.items, ["one", "two"]);
});

test("parseYAML handles list after nested key requiring findPreviousKey", () => {
  const input = `config:
  settings:
    - option1
    - option2`;
  const result = parseYAML(input);
  assert.deepStrictEqual(result.config.settings, ["option1", "option2"]);
});

test("parseYAML handles simple anchor and alias", () => {
  const input = `defaults: &defaults
  adapter: postgres
development:
  <<: *defaults
  database: dev`;
  const result = parseYAML(input);
  assert.strictEqual(result.development.adapter, "postgres");
  assert.strictEqual(result.development.database, "dev");
});

test("parseYAML handles list item with inline object", () => {
  const input = `items:
  - name: first
    value: 1
  - name: second
    value: 2`;
  const result = parseYAML(input);
  assert.strictEqual(result.items[0].name, "first");
  assert.strictEqual(result.items[1].value, 2);
});

test("findPreviousKey handles comment with quotes", () => {
  const lines = ['key: "value" # comment', "  - item"];
  const result = findPreviousKey(lines, 1);
  assert.strictEqual(result, null);
});

test("findPreviousKey with multiple empty values", () => {
  const lines = ["first:", "second:", "  - item"];
  assert.strictEqual(findPreviousKey(lines, 2), "second");
});
