import { test, expect } from 'bun:test';
import {
  expandShortcuts,
  shortenExpression,
  getFullMethod,
  getShortMethod,
  isShortcut
} from '../../src/shortcuts';

test('Shortcuts: expand single shortcut', () => {
  expect(expandShortcuts('.mp')).toBe('.map');
  expect(expandShortcuts('.flt')).toBe('.filter');
  expect(expandShortcuts('.kys')).toBe('.{keys}');
  expect(expandShortcuts('.lc')).toBe('.toLowerCase');
});

test('Shortcuts: shorten single method', () => {
  expect(shortenExpression('.map')).toBe('.mp');
  expect(shortenExpression('.filter')).toBe('.flt');
  expect(shortenExpression('.{keys}')).toBe('.kys');
  expect(shortenExpression('.toLowerCase')).toBe('.lc');
});

test('Shortcuts: expand chained shortcuts', () => {
  const input = '.mp(x => x * 2).flt(x => x > 5)';
  const expected = '.map(x => x * 2).filter(x => x > 5)';
  expect(expandShortcuts(input)).toBe(expected);
});

test('Shortcuts: shorten chained methods', () => {
  const input = '.map(x => x * 2).filter(x => x > 5)';
  const expected = '.mp(x => x * 2).flt(x => x > 5)';
  expect(shortenExpression(input)).toBe(expected);
});

test('Shortcuts: expand complex expression', () => {
  const input = '.users.mp(.name).flt(.lc().stsWith("j"))';
  const expected = '.users.map(x => x.name).filter(x => x.toLowerCase().startsWith("j"))';
  expect(expandShortcuts(input)).toBe(expected);
});

test('Shortcuts: shorten complex expression', () => {
  const input = '.users.map(u => u.name).filter(n => n.toLowerCase().startsWith("j"))';
  const expected = '.users.mp(.name).flt(.lc().stsWith("j"))';
  expect(shortenExpression(input)).toBe(expected);
});

test('Shortcuts: preserve non-shortcut text', () => {
  const input = '.customMethod().mp(x => x * 2)';
  const expanded = '.customMethod().map(x => x * 2)';
  expect(expandShortcuts(input)).toBe(expanded);
  expect(shortenExpression(expanded)).toBe(input);
});

test('Shortcuts: handle object operations', () => {
  expect(expandShortcuts('.kys')).toBe('.{keys}');
  expect(expandShortcuts('.vls')).toBe('.{values}');
  expect(expandShortcuts('.ents')).toBe('.{entries}');
  expect(expandShortcuts('.len')).toBe('.{length}');
});

test('Shortcuts: lookup methods', () => {
  expect(getFullMethod('.mp')).toBe('.map');
  expect(getShortMethod('.map')).toBe('.mp');
  expect(isShortcut('.mp')).toBe(true);
  expect(isShortcut('.map')).toBe(true);
  expect(isShortcut('.notAShortcut')).toBe(false);
});

test('Shortcuts: avoid partial replacements', () => {
  // Should not replace 'mp' in 'template'
  expect(expandShortcuts('template')).toBe('template');
  expect(expandShortcuts('.template')).toBe('.template');

  // Should only replace when it's a complete method
  expect(expandShortcuts('.mp(')).toBe('.map(');
  expect(expandShortcuts('.mpa')).toBe('.mpa'); // Should not expand
});

test('Shortcuts: handle array methods correctly', () => {
  const arrayShortcuts = [
    { short: '.mp', full: '.map' },
    { short: '.flt', full: '.filter' },
    { short: '.rd', full: '.reduce' },
    { short: '.fnd', full: '.find' },
    { short: '.sm', full: '.some' },
    { short: '.evr', full: '.every' },
  ];

  arrayShortcuts.forEach(({ short, full }) => {
    expect(expandShortcuts(short)).toBe(full);
    expect(shortenExpression(full)).toBe(short);
  });
});

test('Shortcuts: handle string methods correctly', () => {
  const stringShortcuts = [
    { short: '.lc', full: '.toLowerCase' },
    { short: '.uc', full: '.toUpperCase' },
    { short: '.trm', full: '.trim' },
    { short: '.rpl', full: '.replace' },
  ];

  stringShortcuts.forEach(({ short, full }) => {
    expect(expandShortcuts(short)).toBe(full);
    expect(shortenExpression(full)).toBe(short);
  });
});

test('Shortcuts: getShortcutHelp returns formatted help text', () => {
  const { getShortcutHelp } = require('../../src/shortcuts');
  const help = getShortcutHelp();

  expect(typeof help).toBe('string');
  expect(help).toContain('Array Methods');
  expect(help).toContain('Object Methods');
  expect(help).toContain('String Methods');
  expect(help).toContain('Universal Methods');
  expect(help).toContain('.mp');
  expect(help).toContain('.map');
  expect(help).toContain('Examples');
});

test('Shortcuts: expand implicit property access', () => {
  expect(expandShortcuts('.mp(.name)')).toBe('.map(x => x.name)');
  expect(expandShortcuts('.flt(.active)')).toBe('.filter(x => x.active)');
  expect(expandShortcuts('.fnd(.id === 1)')).toBe('.find(x => x.id === 1)');
});

test('Shortcuts: expand implicit property with operators', () => {
  expect(expandShortcuts('.flt(.age > 30)')).toBe('.filter(x => x.age > 30)');
  expect(expandShortcuts('.flt(.active && .verified)')).toBe('.filter(x => x.active && x.verified)');
});

test('Shortcuts: shorten to implicit property access', () => {
  expect(shortenExpression('.map(x => x.name)')).toBe('.mp(.name)');
  expect(shortenExpression('.filter(u => u.active)')).toBe('.flt(.active)');
  expect(shortenExpression('.find(item => item.id === 1)')).toBe('.fnd(.id === 1)');
});

test('Shortcuts: roundtrip implicit property access', () => {
  const short = '.mp(.name).flt(.age > 30)';
  const expanded = expandShortcuts(short);
  const shortened = shortenExpression(expanded);
  expect(shortened).toBe(short);
});