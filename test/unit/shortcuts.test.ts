import { test } from "node:test";
import assert from "node:assert/strict";
import {
  expandShortcuts,
  shortenExpression,
  getFullMethod,
  getShortMethod,
  isShortcut,
} from "../../src/shortcuts/index";

test("Shortcuts: expand single shortcut", () => {
  assert.strictEqual(expandShortcuts(".mp"), ".map");
  assert.strictEqual(expandShortcuts(".flt"), ".filter");
  assert.strictEqual(expandShortcuts(".kys"), ".{keys}");
  assert.strictEqual(expandShortcuts(".lc"), ".toLowerCase");
});

test("Shortcuts: shorten single method", () => {
  assert.strictEqual(shortenExpression(".map"), ".mp");
  assert.strictEqual(shortenExpression(".filter"), ".flt");
  assert.strictEqual(shortenExpression(".{keys}"), ".kys");
  assert.strictEqual(shortenExpression(".toLowerCase"), ".lc");
});

test("Shortcuts: expand chained shortcuts", () => {
  const input = ".mp(x => x * 2).flt(x => x > 5)";
  const expected = ".map(x => x * 2).filter(x => x > 5)";
  assert.strictEqual(expandShortcuts(input), expected);
});

test("Shortcuts: shorten chained methods", () => {
  const input = ".map(x => x * 2).filter(x => x > 5)";
  const expected = ".mp(x => x * 2).flt(x => x > 5)";
  assert.strictEqual(shortenExpression(input), expected);
});

test("Shortcuts: expand complex expression", () => {
  const input = '.users.mp(.name).flt(.lc().stsWith("j"))';
  const expected = '.users.map(x => x.name).filter(x => x.toLowerCase().startsWith("j"))';
  assert.strictEqual(expandShortcuts(input), expected);
});

test("Shortcuts: shorten complex expression", () => {
  const input = '.users.map(u => u.name).filter(n => n.toLowerCase().startsWith("j"))';
  const expected = '.users.mp(.name).flt(.lc().stsWith("j"))';
  assert.strictEqual(shortenExpression(input), expected);
});

test("Shortcuts: preserve non-shortcut text", () => {
  const input = ".customMethod().mp(x => x * 2)";
  const expanded = ".customMethod().map(x => x * 2)";
  assert.strictEqual(expandShortcuts(input), expanded);
  assert.strictEqual(shortenExpression(expanded), input);
});

test("Shortcuts: preserve shortcut-looking text inside string literals", () => {
  assert.strictEqual(expandShortcuts('.filter(x => x.name === ".mp")'), '.filter(x => x.name === ".mp")',);
  assert.strictEqual(shortenExpression('.filter(x => x.name === ".map")'), '.flt(x => x.name === ".map")',);
});

test("Shortcuts: handle object operations", () => {
  assert.strictEqual(expandShortcuts(".kys"), ".{keys}");
  assert.strictEqual(expandShortcuts(".vls"), ".{values}");
  assert.strictEqual(expandShortcuts(".ents"), ".{entries}");
  assert.strictEqual(expandShortcuts(".len"), ".{length}");
});

test("Shortcuts: lookup methods", () => {
  assert.strictEqual(getFullMethod(".mp"), ".map");
  assert.strictEqual(getShortMethod(".map"), ".mp");
  assert.strictEqual(isShortcut(".mp"), true);
  assert.strictEqual(isShortcut(".map"), true);
  assert.strictEqual(isShortcut(".notAShortcut"), false);
});

test("Shortcuts: avoid partial replacements", () => {
  // Should not replace 'mp' in 'template'
  assert.strictEqual(expandShortcuts("template"), "template");
  assert.strictEqual(expandShortcuts(".template"), ".template");

  // Should only replace when it's a complete method
  assert.strictEqual(expandShortcuts(".mp("), ".map(");
  assert.strictEqual(expandShortcuts(".mpa"), ".mpa"); // Should not expand
});

test("Shortcuts: handle array methods correctly", () => {
  const arrayShortcuts = [
    { short: ".mp", full: ".map" },
    { short: ".flt", full: ".filter" },
    { short: ".rd", full: ".reduce" },
    { short: ".fnd", full: ".find" },
    { short: ".sm", full: ".some" },
    { short: ".evr", full: ".every" },
  ];

  arrayShortcuts.forEach(({ short, full }) => {
    assert.strictEqual(expandShortcuts(short), full);
    assert.strictEqual(shortenExpression(full), short);
  });
});

test("Shortcuts: handle string methods correctly", () => {
  const stringShortcuts = [
    { short: ".lc", full: ".toLowerCase" },
    { short: ".uc", full: ".toUpperCase" },
    { short: ".trm", full: ".trim" },
    { short: ".rpl", full: ".replace" },
  ];

  stringShortcuts.forEach(({ short, full }) => {
    assert.strictEqual(expandShortcuts(short), full);
    assert.strictEqual(shortenExpression(full), short);
  });
});

test("Shortcuts: getShortcutHelp returns formatted help text", async () => {
  const { getShortcutHelp } = await import("../../src/shortcuts/index");
  const help = getShortcutHelp();

  assert.strictEqual(typeof help, "string");
  assert.ok(help.includes("Array Methods"));
  assert.ok(help.includes("Object Methods"));
  assert.ok(help.includes("String Methods"));
  assert.ok(help.includes("Universal Methods"));
  assert.ok(help.includes(".mp"));
  assert.ok(help.includes(".map"));
  assert.ok(help.includes("Examples"));
});

test("Shortcuts: expand implicit property access", () => {
  assert.strictEqual(expandShortcuts(".mp(.name)"), ".map(x => x.name)");
  assert.strictEqual(expandShortcuts(".flt(.active)"), ".filter(x => x.active)");
  assert.strictEqual(expandShortcuts(".fnd(.id === 1)"), ".find(x => x.id === 1)");
});

test("Shortcuts: expand implicit property with operators", () => {
  assert.strictEqual(expandShortcuts(".flt(.age > 30)"), ".filter(x => x.age > 30)");
  assert.strictEqual(expandShortcuts(".flt(.active && .verified)"), ".filter(x => x.active && x.verified)",);
});

test("Shortcuts: shorten to implicit property access", () => {
  assert.strictEqual(shortenExpression(".map(x => x.name)"), ".mp(.name)");
  assert.strictEqual(shortenExpression(".filter(u => u.active)"), ".flt(.active)");
  assert.strictEqual(shortenExpression(".find(item => item.id === 1)"), ".fnd(.id === 1)");
});

test("Shortcuts: roundtrip implicit property access", () => {
  const short = ".mp(.name).flt(.age > 30)";
  const expanded = expandShortcuts(short);
  const shortened = shortenExpression(expanded);
  assert.strictEqual(shortened, short);
});
