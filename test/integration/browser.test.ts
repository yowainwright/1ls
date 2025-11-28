import { describe, expect, test } from "bun:test";
import { join } from "path";
import { existsSync } from "fs";

const BROWSER_BUNDLE = join(import.meta.dir, "../../dist/browser/index.js");
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

    expect(typeof evaluate).toBe("function");
    expect(typeof expandShortcuts).toBe("function");
    expect(Lexer).toBeDefined();
    expect(ExpressionParser).toBeDefined();
    expect(JsonNavigator).toBeDefined();
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

      expect(evaluate(data, ".company.name")).toBe("Acme Corp");
      expect(evaluate(data, ".company.departments[0].name")).toBe("Engineering");
      expect(evaluate(data, ".company.departments[0].employees[0].name")).toBe("Alice");
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
      expect(totals).toEqual([20, 20, 45]);

      const filtered = evaluate(data, ".items.filter(i => i.qty > 1)");
      expect(filtered).toHaveLength(2);

      const totalPrice = evaluate(data, ".items.reduce((acc, i) => acc + i.price, 0)");
      expect(totalPrice).toBe(45);
    });

    test("handles object methods", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { a: 1, b: 2, c: 3, d: 4 };

      expect(evaluate(data, ".{keys}")).toEqual(["a", "b", "c", "d"]);
      expect(evaluate(data, ".{values}")).toEqual([1, 2, 3, 4]);
      expect(evaluate(data, ".{entries}")).toEqual([["a", 1], ["b", 2], ["c", 3], ["d", 4]]);
      expect(evaluate(data, ".{length}")).toBe(4);
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
        ".users.filter(u => u.active).filter(u => u.age > 27).map(u => u.name)"
      );
      expect(result).toEqual(["Alice", "Carol", "Dave"]);
    });

    test("handles string operations", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { text: "  Hello, World!  " };

      expect(evaluate(data, ".text.trim()")).toBe("Hello, World!");
      expect(evaluate(data, ".text.trim().toLowerCase()")).toBe("hello, world!");
      expect(evaluate(data, ".text.trim().toUpperCase()")).toBe("HELLO, WORLD!");
      expect(evaluate(data, '.text.trim().split(", ")')).toEqual(["Hello", "World!"]);
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

      expect(evaluate(data, ".numbers.sort((a, b) => a - b)")).toEqual([1, 2, 5, 8, 9]);
      expect(evaluate(data, ".numbers.sort((a, b) => b - a)")).toEqual([9, 8, 5, 2, 1]);

      const sortedByAge = evaluate(data, ".users.sort((a, b) => a.age - b.age).map(u => u.name)");
      expect(sortedByAge).toEqual(["Bob", "Alice", "Carol"]);
    });
  });

  describe("shortcuts integration", () => {
    test("shortcuts work in evaluate", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = [1, 2, 3, 4, 5];

      expect(evaluate(data, ".mp(x => x * 2)")).toEqual([2, 4, 6, 8, 10]);
      expect(evaluate(data, ".flt(x => x > 3)")).toEqual([4, 5]);
      expect(evaluate(data, ".rd((a, b) => a + b, 0)")).toBe(15);
      expect(evaluate(data, ".len")).toBe(5);
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
      expect(result).toEqual(["banana", "cherry"]);
    });
  });

  describe("class exports", () => {
    test("Lexer tokenizes expressions", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { Lexer } = module;

      const lexer = new Lexer(".users[0].name");
      const tokens = lexer.tokenize();

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
    });

    test("ExpressionParser parses tokens", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { Lexer, ExpressionParser } = module;

      const lexer = new Lexer(".foo.bar");
      const tokens = lexer.tokenize();
      const parser = new ExpressionParser(tokens);
      const ast = parser.parse();

      expect(ast).toBeDefined();
      expect(ast.type).toBeDefined();
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

      expect(result).toBe("baz");
    });
  });

  describe("edge cases", () => {
    test("handles empty arrays", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      expect(evaluate([], ".map(x => x)")).toEqual([]);
      expect(evaluate([], ".filter(x => true)")).toEqual([]);
      expect(evaluate([], ".{length}")).toBe(0);
    });

    test("handles empty objects", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      expect(evaluate({}, ".{keys}")).toEqual([]);
      expect(evaluate({}, ".{values}")).toEqual([]);
      expect(evaluate({}, ".{length}")).toBe(0);
    });

    test("handles null values", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { value: null };
      expect(evaluate(data, ".value")).toBe(null);
    });

    test("handles boolean values", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { active: true, deleted: false };
      expect(evaluate(data, ".active")).toBe(true);
      expect(evaluate(data, ".deleted")).toBe(false);
    });

    test("handles numeric values", async () => {
      const module = await import(BROWSER_BUNDLE);
      const { evaluate } = module;

      const data = { int: 42, float: 3.14, negative: -10, zero: 0 };
      expect(evaluate(data, ".int")).toBe(42);
      expect(evaluate(data, ".float")).toBe(3.14);
      expect(evaluate(data, ".negative")).toBe(-10);
      expect(evaluate(data, ".zero")).toBe(0);
    });
  });
});
