import { test, expect } from 'bun:test';
import { parseENV } from '../../src/formats/env';

test('parseENV strips comments after closed quotes', () => {
  const input = 'KEY="value" # this is a comment';
  const result = parseENV(input);
  expect(result.KEY).toBe('value');
});

test('parseENV handles mixed quotes', () => {
  const input = `KEY1="value1"
KEY2='value2'
KEY3=value3`;
  const result = parseENV(input);
  expect(result.KEY1).toBe('value1');
  expect(result.KEY2).toBe('value2');
  expect(result.KEY3).toBe('value3');
});

test('parseENV handles export prefix', () => {
  const input = 'export KEY="value"';
  const result = parseENV(input);
  expect(result.KEY).toBe('value');
});

test('parseENV handles empty lines and comments', () => {
  const input = `# comment
KEY1=value1

# another comment
KEY2=value2`;
  const result = parseENV(input);
  expect(result.KEY1).toBe('value1');
  expect(result.KEY2).toBe('value2');
});

test('parseENV handles boolean values', () => {
  const input = `TRUE_VAL=true
FALSE_VAL=false`;
  const result = parseENV(input);
  expect(result.TRUE_VAL).toBe(true);
  expect(result.FALSE_VAL).toBe(false);
});

test('parseENV handles null values', () => {
  const input = 'NULL_VAL=null';
  const result = parseENV(input);
  expect(result.NULL_VAL).toBe(null);
});

test('parseENV handles number values', () => {
  const input = `INT_VAL=42
FLOAT_VAL=3.14`;
  const result = parseENV(input);
  expect(result.INT_VAL).toBe(42);
  expect(result.FLOAT_VAL).toBe(3.14);
});

test('parseENV handles line without equals sign', () => {
  const input = `KEY=value
INVALID_LINE
OTHER=other`;
  const result = parseENV(input);
  expect(result.KEY).toBe('value');
  expect(result.OTHER).toBe('other');
  expect(result.INVALID_LINE).toBeUndefined();
});
