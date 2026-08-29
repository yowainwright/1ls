import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { existsSync } from "fs";

const BROWSER_BUNDLE = join(import.meta.dirname, "../../dist/browser/index.js");
const HAS_BUNDLE = existsSync(BROWSER_BUNDLE);

const describeBrowser = HAS_BUNDLE ? describe : describe.skip;

describeBrowser("Browser Bundle Integration", () => {
  let evaluate: (data: unknown, expression: string) => unknown;
  let expandShortcuts: (expression: string) => string;
  let Lexer: new (input: string) => { tokenize: () => unknown[] };
  let ExpressionParser: new (tokens: unknown[]) => { parse: () => unknown };
  let JsonNavigator: new () => { evaluate: (ast: unknown, data: unknown) => unknown };

  test("module loads successfully", async () => {
    const module = await import(BROWSER_BUNDLE);
    evaluate = module.evaluate;
    expandShortcuts = module.expandShortcuts;
    Lexer = module.Lexer;
    ExpressionParser = module.ExpressionParser;
    JsonNavigator = module.JsonNavigator;

    assert.strictEqual(typeof evaluate, "function");
    assert.strictEqual(typeof expandShortcuts, "function");
    assert.notStrictEqual(Lexer, undefined);
    assert.notStrictEqual(ExpressionParser, undefined);
    assert.notStrictEqual(JsonNavigator, undefined);
  });

  describe("evaluate function", () => {
    test("handles complex nested data", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = {
        company: {
          name: "Acme Corp",
          departments: [
            {
              name: "Engineering",
              employees: [
                { name: "Alice", role: "Lead", salary: 150000 },
                { name: "Bob", role: "Senior", salary: 120000 },
                { name: "Carol", role: "Junior", salary: 80000 },
              ],
            },
            {
              name: "Sales",
              employees: [
                { name: "Dave", role: "Manager", salary: 130000 },
                { name: "Eve", role: "Rep", salary: 70000 },
              ],
            },
          ],
        },
      };

      assert.strictEqual(evaluate(data, ".company.name"), "Acme Corp");
      assert.strictEqual(evaluate(data, ".company.departments[0].name"), "Engineering");
      assert.strictEqual(evaluate(data, ".company.departments[0].employees[0].name"), "Alice");
    });

    test("handles array transformations", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = {
        items: [
          { id: 1, price: 10, qty: 2 },
          { id: 2, price: 20, qty: 1 },
          { id: 3, price: 15, qty: 3 },
        ],
      };

      const totals = evaluate(data, ".items.map(i => i.price * i.qty)");
      assert.deepStrictEqual(totals, [20, 20, 45]);

      const filtered = evaluate(data, ".items.filter(i => i.qty > 1)");
      assert.strictEqual(filtered.length, 2);

      const totalPrice = evaluate(data, ".items.reduce((acc, i) => acc + i.price, 0)");
      assert.strictEqual(totalPrice, 45);
    });

    test("handles object methods", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { a: 1, b: 2, c: 3, d: 4 };

      assert.deepStrictEqual(evaluate(data, ".{keys}"), ["a", "b", "c", "d"]);
      assert.deepStrictEqual(evaluate(data, ".{values}"), [1, 2, 3, 4]);
      assert.deepStrictEqual(evaluate(data, ".{entries}"), [
        ["a", 1],
        ["b", 2],
        ["c", 3],
        ["d", 4],
      ]);
      assert.strictEqual(evaluate(data, ".{length}"), 4);
    });

    test("handles chained operations", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = {
        users: [
          { name: "Alice", age: 30, active: true },
          { name: "Bob", age: 25, active: false },
          { name: "Carol", age: 35, active: true },
          { name: "Dave", age: 28, active: true },
        ],
      };

      const result = evaluate(
        data,
        ".users.filter(u => u.active).filter(u => u.age > 27).map(u => u.name)",
      );
      assert.deepStrictEqual(result, ["Alice", "Carol", "Dave"]);
    });

    test("handles string operations", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { text: "  Hello, World!  " };

      assert.strictEqual(evaluate(data, ".text.trim()"), "Hello, World!");
      assert.strictEqual(evaluate(data, ".text.trim().toLowerCase()"), "hello, world!");
      assert.strictEqual(evaluate(data, ".text.trim().toUpperCase()"), "HELLO, WORLD!");
      assert.deepStrictEqual(evaluate(data, '.text.trim().split(", ")'), ["Hello", "World!"]);
    });

    test("handles sorting", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = {
        numbers: [5, 2, 8, 1, 9],
        users: [
          { name: "Carol", age: 35 },
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 },
        ],
      };

      assert.deepStrictEqual(evaluate(data, ".numbers.sort((a, b) => a - b)"), [1, 2, 5, 8, 9]);
      assert.deepStrictEqual(evaluate(data, ".numbers.sort((a, b) => b - a)"), [9, 8, 5, 2, 1]);

      const sortedByAge = evaluate(data, ".users.sort((a, b) => a.age - b.age).map(u => u.name)");
      assert.deepStrictEqual(sortedByAge, ["Bob", "Alice", "Carol"]);
    });
  });

  describe("shortcuts integration", () => {
    test("shortcuts work in evaluate", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = [1, 2, 3, 4, 5];

      assert.deepStrictEqual(evaluate(data, ".mp(x => x * 2)"), [2, 4, 6, 8, 10]);
      assert.deepStrictEqual(evaluate(data, ".flt(x => x > 3)"), [4, 5]);
      assert.strictEqual(evaluate(data, ".rd((a, b) => a + b, 0)"), 15);
      assert.strictEqual(evaluate(data, ".len"), 5);
    });

    test("chained shortcuts work", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = {
        items: [
          { name: "apple", price: 1 },
          { name: "banana", price: 2 },
          { name: "cherry", price: 3 },
        ],
      };

      const result = evaluate(data, ".items.flt(i => i.price > 1).mp(i => i.name)");
      assert.deepStrictEqual(result, ["banana", "cherry"]);
    });
  });

  describe("class exports", () => {
    test("Lexer tokenizes expressions", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { Lexer } = module;

      const lexer = new Lexer(".users[0].name");
      const tokens = lexer.tokenize();

      assert.strictEqual(Array.isArray(tokens), true);
      assert.ok(tokens.length > 0);
    });

    test("ExpressionParser parses tokens", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { Lexer, ExpressionParser } = module;

      const lexer = new Lexer(".foo.bar");
      const tokens = lexer.tokenize();
      const parser = new ExpressionParser(tokens);
      const ast = parser.parse();

      assert.notStrictEqual(ast, undefined);
      assert.notStrictEqual(ast.type, undefined);
    });

    test("JsonNavigator evaluates AST", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { Lexer, ExpressionParser, JsonNavigator } = module;

      const data = { foo: { bar: "baz" } };
      const lexer = new Lexer(".foo.bar");
      const tokens = lexer.tokenize();
      const parser = new ExpressionParser(tokens);
      const ast = parser.parse();
      const navigator = new JsonNavigator();
      const result = navigator.evaluate(ast, data);

      assert.strictEqual(result, "baz");
    });
  });

  describe("edge cases", () => {
    test("handles empty arrays", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      assert.deepStrictEqual(evaluate([], ".map(x => x)"), []);
      assert.deepStrictEqual(evaluate([], ".filter(x => true)"), []);
      assert.strictEqual(evaluate([], ".{length}"), 0);
    });

    test("handles empty objects", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      assert.deepStrictEqual(evaluate({}, ".{keys}"), []);
      assert.deepStrictEqual(evaluate({}, ".{values}"), []);
      assert.strictEqual(evaluate({}, ".{length}"), 0);
    });

    test("handles null values", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { value: null };
      assert.strictEqual(evaluate(data, ".value"), null);
    });

    test("handles boolean values", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { active: true, deleted: false };
      assert.strictEqual(evaluate(data, ".active"), true);
      assert.strictEqual(evaluate(data, ".deleted"), false);
    });

    test("handles numeric values", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { int: 42, float: 3.14, negative: -10, zero: 0 };
      assert.strictEqual(evaluate(data, ".int"), 42);
      assert.strictEqual(evaluate(data, ".float"), 3.14);
      assert.strictEqual(evaluate(data, ".negative"), -10);
      assert.strictEqual(evaluate(data, ".zero"), 0);
    });
  });
});
