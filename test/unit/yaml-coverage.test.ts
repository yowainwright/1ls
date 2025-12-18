import { test, expect } from 'bun:test';
import { parseYAML, findPreviousKey } from '../../src/formats/yaml';

test('findPreviousKey finds key with empty value', () => {
  const lines = ['parent:', '  - child1'];
  expect(findPreviousKey(lines, 1)).toBe('parent');
});

test('findPreviousKey finds key with | indicator', () => {
  const lines = ['text: |', '  multiline content'];
  expect(findPreviousKey(lines, 1)).toBe('text');
});

test('findPreviousKey finds key with > indicator', () => {
  const lines = ['text: >', '  folded content'];
  expect(findPreviousKey(lines, 1)).toBe('text');
});

test('findPreviousKey finds key with |+ indicator', () => {
  const lines = ['text: |+', '  content'];
  expect(findPreviousKey(lines, 1)).toBe('text');
});

test('findPreviousKey finds key with >- indicator', () => {
  const lines = ['text: >-', '  content'];
  expect(findPreviousKey(lines, 1)).toBe('text');
});

test('findPreviousKey skips list items', () => {
  const lines = ['items:', '  - item1', '  - item2'];
  expect(findPreviousKey(lines, 2)).toBe('items');
});

test('findPreviousKey handles comments outside quotes', () => {
  const lines = ['key: value # comment', 'next:'];
  expect(findPreviousKey(lines, 1)).toBe(null);
});

test('findPreviousKey returns null at start', () => {
  const lines = ['first: value'];
  expect(findPreviousKey(lines, 0)).toBe(null);
});

test('findPreviousKey skips empty lines', () => {
  const lines = ['parent:', '', '  - child'];
  expect(findPreviousKey(lines, 2)).toBe('parent');
});

test('parseYAML handles anchor with nested list', () => {
  const input = `data: &ref
  - item1
  - item2
copy: *ref`;
  const result = parseYAML(input);
  expect(result.data).toEqual(['item1', 'item2']);
});

test('parseYAML handles multiline with trailing empty lines removed', () => {
  const input = `text: |
  line1
  line2

`;
  const result = parseYAML(input);
  expect(result.text).toBe('line1\nline2');
});

test('parseYAML handles deeply nested list with findPreviousKey', () => {
  const input = `root:
  parent:
    items:
      - one
      - two`;
  const result = parseYAML(input);
  expect(result.root.parent.items).toEqual(['one', 'two']);
});

test('parseYAML handles list after nested key requiring findPreviousKey', () => {
  const input = `config:
  settings:
    - option1
    - option2`;
  const result = parseYAML(input);
  expect(result.config.settings).toEqual(['option1', 'option2']);
});

test('parseYAML handles simple anchor and alias', () => {
  const input = `defaults: &defaults
  adapter: postgres
development:
  <<: *defaults
  database: dev`;
  const result = parseYAML(input);
  expect(result.development.adapter).toBe('postgres');
  expect(result.development.database).toBe('dev');
});

test('parseYAML handles list item with inline object', () => {
  const input = `items:
  - name: first
    value: 1
  - name: second
    value: 2`;
  const result = parseYAML(input);
  expect(result.items[0].name).toBe('first');
  expect(result.items[1].value).toBe(2);
});

test('findPreviousKey handles comment with quotes', () => {
  const lines = ['key: "value" # comment', '  - item'];
  const result = findPreviousKey(lines, 1);
  expect(result).toBe(null);
});

test('findPreviousKey with multiple empty values', () => {
  const lines = ['first:', 'second:', '  - item'];
  expect(findPreviousKey(lines, 2)).toBe('second');
});
