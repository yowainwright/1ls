import { describe, expect, test } from "bun:test";
import { evaluate, expandShortcuts, Lexer, ExpressionParser, JsonNavigator } from "../../src/browser";

describe("Browser evaluate function", () => {
  describe("property access", () => {
    test("accesses top-level property", () => {
      const data = { name: "test", value: 42 };
      expect(evaluate(data, ".name")).toBe("test");
      expect(evaluate(data, ".value")).toBe(42);
    });

    test("accesses nested properties", () => {
      const data = { user: { profile: { name: "Alice" } } };
      expect(evaluate(data, ".user.profile.name")).toBe("Alice");
    });

    test("accesses array elements", () => {
      const data = { items: ["a", "b", "c"] };
      expect(evaluate(data, ".items[0]")).toBe("a");
      expect(evaluate(data, ".items[2]")).toBe("c");
    });

    test("accesses mixed paths", () => {
      const data = { users: [{ name: "Alice" }, { name: "Bob" }] };
      expect(evaluate(data, ".users[0].name")).toBe("Alice");
      expect(evaluate(data, ".users[1].name")).toBe("Bob");
    });
  });

  describe("array methods", () => {
    test("map transforms elements", () => {
      const data = [1, 2, 3];
      expect(evaluate(data, ".map(x => x * 2)")).toEqual([2, 4, 6]);
    });

    test("filter selects elements", () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate(data, ".filter(x => x > 3)")).toEqual([4, 5]);
    });

    test("find returns first match", () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      expect(evaluate(data, ".find(x => x.id === 2)")).toEqual({ id: 2 });
    });

    test("some checks for any match", () => {
      const data = [1, 2, 3];
      expect(evaluate(data, ".some(x => x > 2)")).toBe(true);
      expect(evaluate(data, ".some(x => x > 5)")).toBe(false);
    });

    test("every checks all match", () => {
      const data = [2, 4, 6];
      expect(evaluate(data, ".every(x => x % 2 === 0)")).toBe(true);
      expect(evaluate(data, ".every(x => x > 3)")).toBe(false);
    });

    test("reduce aggregates values", () => {
      const data = [1, 2, 3, 4];
      expect(evaluate(data, ".reduce((a, b) => a + b, 0)")).toBe(10);
    });

    test("sort orders elements", () => {
      const data = [3, 1, 2];
      expect(evaluate(data, ".sort((a, b) => a - b)")).toEqual([1, 2, 3]);
    });

    test("reverse reverses order", () => {
      const data = [1, 2, 3];
      expect(evaluate(data, ".reverse()")).toEqual([3, 2, 1]);
    });

    test("slice extracts portion", () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate(data, ".slice(1, 3)")).toEqual([2, 3]);
    });

    test("join creates string", () => {
      const data = ["a", "b", "c"];
      expect(evaluate(data, '.join("-")')).toBe("a-b-c");
    });

    test("includes checks membership", () => {
      const data = [1, 2, 3];
      expect(evaluate(data, ".includes(2)")).toBe(true);
      expect(evaluate(data, ".includes(5)")).toBe(false);
    });
  });

  describe("object methods", () => {
    test("{keys} returns object keys", () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(evaluate(data, ".{keys}")).toEqual(["a", "b", "c"]);
    });

    test("{values} returns object values", () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(evaluate(data, ".{values}")).toEqual([1, 2, 3]);
    });

    test("{entries} returns key-value pairs", () => {
      const data = { a: 1, b: 2 };
      expect(evaluate(data, ".{entries}")).toEqual([["a", 1], ["b", 2]]);
    });

    test("{length} returns array length", () => {
      const data = [1, 2, 3, 4, 5];
      expect(evaluate(data, ".{length}")).toBe(5);
    });

    test("{length} returns object keys count", () => {
      const data = { a: 1, b: 2, c: 3 };
      expect(evaluate(data, ".{length}")).toBe(3);
    });
  });

  describe("string methods", () => {
    test("toLowerCase converts case", () => {
      const data = { text: "HELLO" };
      expect(evaluate(data, ".text.toLowerCase()")).toBe("hello");
    });

    test("toUpperCase converts case", () => {
      const data = { text: "hello" };
      expect(evaluate(data, ".text.toUpperCase()")).toBe("HELLO");
    });

    test("trim removes whitespace", () => {
      const data = { text: "  hello  " };
      expect(evaluate(data, ".text.trim()")).toBe("hello");
    });

    test("split creates array", () => {
      const data = { text: "a,b,c" };
      expect(evaluate(data, '.text.split(",")')).toEqual(["a", "b", "c"]);
    });

    test("includes checks substring", () => {
      const data = { text: "hello world" };
      expect(evaluate(data, '.text.includes("world")')).toBe(true);
      expect(evaluate(data, '.text.includes("foo")')).toBe(false);
    });
  });

  describe("chained operations", () => {
    test("chains multiple array methods", () => {
      const data = { users: [{ name: "Alice", age: 30 }, { name: "Bob", age: 20 }] };
      expect(evaluate(data, ".users.filter(u => u.age > 25).map(u => u.name)")).toEqual(["Alice"]);
    });

    test("chains property access and methods", () => {
      const data = { items: [1, 2, 3, 4, 5] };
      expect(evaluate(data, ".items.filter(x => x > 2).{length}")).toBe(3);
    });
  });
});

describe("expandShortcuts", () => {
  test("expands array shortcuts", () => {
    expect(expandShortcuts(".mp")).toBe(".map");
    expect(expandShortcuts(".flt")).toBe(".filter");
    expect(expandShortcuts(".rd")).toBe(".reduce");
    expect(expandShortcuts(".fnd")).toBe(".find");
    expect(expandShortcuts(".sm")).toBe(".some");
    expect(expandShortcuts(".evr")).toBe(".every");
    expect(expandShortcuts(".srt")).toBe(".sort");
    expect(expandShortcuts(".rvs")).toBe(".reverse");
    expect(expandShortcuts(".jn")).toBe(".join");
    expect(expandShortcuts(".slc")).toBe(".slice");
    expect(expandShortcuts(".incl")).toBe(".includes");
  });

  test("expands object shortcuts", () => {
    expect(expandShortcuts(".kys")).toBe(".{keys}");
    expect(expandShortcuts(".vls")).toBe(".{values}");
    expect(expandShortcuts(".ents")).toBe(".{entries}");
    expect(expandShortcuts(".len")).toBe(".{length}");
  });

  test("expands string shortcuts", () => {
    expect(expandShortcuts(".lc")).toBe(".toLowerCase");
    expect(expandShortcuts(".uc")).toBe(".toUpperCase");
    expect(expandShortcuts(".trm")).toBe(".trim");
    expect(expandShortcuts(".splt")).toBe(".split");
  });

  test("expands shortcuts in expressions", () => {
    expect(expandShortcuts(".users.mp(u => u.name)")).toBe(".users.map(u => u.name)");
    expect(expandShortcuts(".items.flt(x => x > 5).len")).toBe(".items.filter(x => x > 5).{length}");
  });

  test("does not expand partial matches", () => {
    expect(expandShortcuts(".mapper")).toBe(".mapper");
    expect(expandShortcuts(".filter")).toBe(".filter");
  });
});

describe("exported classes", () => {
  test("Lexer is exported and works", () => {
    const lexer = new Lexer(".foo.bar");
    const tokens = lexer.tokenize();
    expect(tokens.length).toBeGreaterThan(0);
  });

  test("ExpressionParser is exported and works", () => {
    const lexer = new Lexer(".foo");
    const tokens = lexer.tokenize();
    const parser = new ExpressionParser(tokens);
    const ast = parser.parse();
    expect(ast).toBeDefined();
  });

  test("JsonNavigator is exported and works", () => {
    const navigator = new JsonNavigator();
    const lexer = new Lexer(".name");
    const tokens = lexer.tokenize();
    const parser = new ExpressionParser(tokens);
    const ast = parser.parse();
    const result = navigator.evaluate(ast, { name: "test" });
    expect(result).toBe("test");
  });
});
