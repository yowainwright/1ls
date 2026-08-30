import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluate,
  expandShortcuts,
  Lexer,
  ExpressionParser,
  JsonNavigator,
} from "../../src/browser/index";

describe("Browser evaluate function", () => {
  describe("property access", () => {
    test("accesses top-level property", () => {
      const data = { name: "test", value: 42 };
      assert.strictEqual(evaluate(data, ".name"), "test");
      assert.strictEqual(evaluate(data, ".value"), 42);
    });

    test("accesses nested properties", () => {
      const data = { user: { profile: { name: "Alice" } } };
      assert.strictEqual(evaluate(data, ".user.profile.name"), "Alice");
    });

    test("accesses array elements", () => {
      const data = { items: ["a", "b", "c"] };
      assert.strictEqual(evaluate(data, ".items[0]"), "a");
      assert.strictEqual(evaluate(data, ".items[2]"), "c");
    });

    test("accesses mixed paths", () => {
      const data = { users: [{ name: "Alice" }, { name: "Bob" }] };
      assert.strictEqual(evaluate(data, ".users[0].name"), "Alice");
      assert.strictEqual(evaluate(data, ".users[1].name"), "Bob");
    });
  });

  describe("array methods", () => {
    test("map transforms elements", () => {
      const data = [1, 2, 3];
      assert.deepStrictEqual(evaluate(data, ".map(x => x * 2)"), [2, 4, 6]);
    });

    test("filter selects elements", () => {
      const data = [1, 2, 3, 4, 5];
      assert.deepStrictEqual(evaluate(data, ".filter(x => x > 3)"), [4, 5]);
    });

    test("find returns first match", () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      assert.deepStrictEqual(evaluate(data, ".find(x => x.id === 2)"), { id: 2 });
    });

    test("some checks for any match", () => {
      const data = [1, 2, 3];
      assert.strictEqual(evaluate(data, ".some(x => x > 2)"), true);
      assert.strictEqual(evaluate(data, ".some(x => x > 5)"), false);
    });

    test("every checks all match", () => {
      const data = [2, 4, 6];
      assert.strictEqual(evaluate(data, ".every(x => x % 2 === 0)"), true);
      assert.strictEqual(evaluate(data, ".every(x => x > 3)"), false);
    });

    test("reduce aggregates values", () => {
      const data = [1, 2, 3, 4];
      assert.strictEqual(evaluate(data, ".reduce((a, b) => a + b, 0)"), 10);
    });

    test("sort orders elements", () => {
      const data = [3, 1, 2];
      assert.deepStrictEqual(evaluate(data, ".sort((a, b) => a - b)"), [1, 2, 3]);
    });

    test("reverse reverses order", () => {
      const data = [1, 2, 3];
      assert.deepStrictEqual(evaluate(data, ".reverse()"), [3, 2, 1]);
    });

    test("slice extracts portion", () => {
      const data = [1, 2, 3, 4, 5];
      assert.deepStrictEqual(evaluate(data, ".slice(1, 3)"), [2, 3]);
    });

    test("join creates string", () => {
      const data = ["a", "b", "c"];
      assert.strictEqual(evaluate(data, '.join("-")'), "a-b-c");
    });

    test("includes checks membership", () => {
      const data = [1, 2, 3];
      assert.strictEqual(evaluate(data, ".includes(2)"), true);
      assert.strictEqual(evaluate(data, ".includes(5)"), false);
    });
  });

  describe("object methods", () => {
    test("{keys} returns object keys", () => {
      const data = { a: 1, b: 2, c: 3 };
      assert.deepStrictEqual(evaluate(data, ".{keys}"), ["a", "b", "c"]);
    });

    test("{values} returns object values", () => {
      const data = { a: 1, b: 2, c: 3 };
      assert.deepStrictEqual(evaluate(data, ".{values}"), [1, 2, 3]);
    });

    test("{entries} returns key-value pairs", () => {
      const data = { a: 1, b: 2 };
      assert.deepStrictEqual(evaluate(data, ".{entries}"), [
        ["a", 1],
        ["b", 2],
      ]);
    });

    test("{length} returns array length", () => {
      const data = [1, 2, 3, 4, 5];
      assert.strictEqual(evaluate(data, ".{length}"), 5);
    });

    test("{length} returns object keys count", () => {
      const data = { a: 1, b: 2, c: 3 };
      assert.strictEqual(evaluate(data, ".{length}"), 3);
    });
  });

  describe("string methods", () => {
    test("toLowerCase converts case", () => {
      const data = { text: "HELLO" };
      assert.strictEqual(evaluate(data, ".text.toLowerCase()"), "hello");
    });

    test("toUpperCase converts case", () => {
      const data = { text: "hello" };
      assert.strictEqual(evaluate(data, ".text.toUpperCase()"), "HELLO");
    });

    test("trim removes whitespace", () => {
      const data = { text: "  hello  " };
      assert.strictEqual(evaluate(data, ".text.trim()"), "hello");
    });

    test("split creates array", () => {
      const data = { text: "a,b,c" };
      assert.deepStrictEqual(evaluate(data, '.text.split(",")'), ["a", "b", "c"]);
    });

    test("includes checks substring", () => {
      const data = { text: "hello world" };
      assert.strictEqual(evaluate(data, '.text.includes("world")'), true);
      assert.strictEqual(evaluate(data, '.text.includes("foo")'), false);
    });
  });

  describe("chained operations", () => {
    test("chains multiple array methods", () => {
      const data = {
        users: [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 20 },
        ],
      };
      assert.deepStrictEqual(evaluate(data, ".users.filter(u => u.age > 25).map(u => u.name)"), ["Alice"]);
    });

    test("chains property access and methods", () => {
      const data = { items: [1, 2, 3, 4, 5] };
      assert.strictEqual(evaluate(data, ".items.filter(x => x > 2).{length}"), 3);
    });
  });
});

describe("expandShortcuts", () => {
  test("expands array shortcuts", () => {
    assert.strictEqual(expandShortcuts(".mp"), ".map");
    assert.strictEqual(expandShortcuts(".flt"), ".filter");
    assert.strictEqual(expandShortcuts(".rd"), ".reduce");
    assert.strictEqual(expandShortcuts(".fnd"), ".find");
    assert.strictEqual(expandShortcuts(".sm"), ".some");
    assert.strictEqual(expandShortcuts(".evr"), ".every");
    assert.strictEqual(expandShortcuts(".srt"), ".sort");
    assert.strictEqual(expandShortcuts(".rvs"), ".reverse");
    assert.strictEqual(expandShortcuts(".jn"), ".join");
    assert.strictEqual(expandShortcuts(".slc"), ".slice");
    assert.strictEqual(expandShortcuts(".incl"), ".includes");
  });

  test("expands object shortcuts", () => {
    assert.strictEqual(expandShortcuts(".kys"), ".{keys}");
    assert.strictEqual(expandShortcuts(".vls"), ".{values}");
    assert.strictEqual(expandShortcuts(".ents"), ".{entries}");
    assert.strictEqual(expandShortcuts(".len"), ".{length}");
  });

  test("expands string shortcuts", () => {
    assert.strictEqual(expandShortcuts(".lc"), ".toLowerCase");
    assert.strictEqual(expandShortcuts(".uc"), ".toUpperCase");
    assert.strictEqual(expandShortcuts(".trm"), ".trim");
    assert.strictEqual(expandShortcuts(".splt"), ".split");
  });

  test("expands shortcuts in expressions", () => {
    assert.strictEqual(expandShortcuts(".users.mp(u => u.name)"), ".users.map(u => u.name)");
    assert.strictEqual(expandShortcuts(".items.flt(x => x > 5).len"), ".items.filter(x => x > 5).{length}",);
  });

  test("does not expand partial matches", () => {
    assert.strictEqual(expandShortcuts(".mapper"), ".mapper");
    assert.strictEqual(expandShortcuts(".filter"), ".filter");
  });
});

describe("exported classes", () => {
  test("Lexer is exported and works", () => {
    const lexer = new Lexer(".foo.bar");
    const tokens = lexer.tokenize();
    assert.ok(tokens.length > 0);
  });

  test("ExpressionParser is exported and works", () => {
    const lexer = new Lexer(".foo");
    const tokens = lexer.tokenize();
    const parser = new ExpressionParser(tokens);
    const ast = parser.parse();
    assert.notStrictEqual(ast, undefined);
  });

  test("JsonNavigator is exported and works", () => {
    const navigator = new JsonNavigator();
    const lexer = new Lexer(".name");
    const tokens = lexer.tokenize();
    const parser = new ExpressionParser(tokens);
    const ast = parser.parse();
    const result = navigator.evaluate(ast, { name: "test" });
    assert.strictEqual(result, "test");
  });
});
