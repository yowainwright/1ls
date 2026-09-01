import { test } from "node:test";
import assert from "node:assert/strict";
import { Lexer } from "../../src/lexer/index";
import { ExpressionParser } from "../../src/expression/index";
import { JsonNavigator } from "../../src/navigator/json/index";
import { OPERATORS } from "../../src/navigator/json/constants";
import {
  callMethod,
  createParameterContext,
  evaluateObjectOperation,
  executeOperator,
  extractOperator,
  getArrayElement,
  getImplicitParameter,
  getPropertyFromObject,
  isCallableMethod,
  isOperatorMethod,
  sliceArray,
} from "../../src/navigator/json/utils";
import {
  collectAllValues,
  collectPaths,
  deepContains,
  getValueAtPath,
  setValueAtPath,
} from "../../src/navigator/builtins/utils";

function evaluate(expression: string, data: unknown): unknown {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator();
  return navigator.evaluate(ast, data);
}

test("Navigator: simple property access", () => {
  const data = { name: "John", age: 30 };
  assert.strictEqual(evaluate(".name", data), "John");
  assert.strictEqual(evaluate(".age", data), 30);
});

test("Navigator utils: operators handle numeric, string, boolean, and missing operations", () => {
  assert.strictEqual(OPERATORS["+"](1, 2), 3);
  assert.strictEqual(OPERATORS["&&"](true, "ok"), "ok");
  assert.strictEqual(OPERATORS["||"]("", "fallback"), "fallback");
  assert.strictEqual(executeOperator("b", ">", "a"), true);
  assert.strictEqual(executeOperator("a", "<", "b"), true);
  assert.strictEqual(executeOperator("b", ">=", "b"), true);
  assert.strictEqual(executeOperator("a", "<=", "a"), true);
  assert.strictEqual(executeOperator({}, ">", {}), false);
  assert.throws(() => executeOperator(1, "missing", 2), /Unknown operator/);
});

test("Navigator utils: parameter and property helpers cover edge cases", () => {
  const context = createParameterContext(["item", "index"], ["Ada", 0]);
  assert.deepStrictEqual(context, { item: "Ada", index: 0 });
  assert.strictEqual(getImplicitParameter(context), "Ada");
  assert.strictEqual(getPropertyFromObject(null, "name"), undefined);
  assert.strictEqual(getPropertyFromObject({ name: "Ada" }, "name"), "Ada");
  assert.strictEqual(getArrayElement("not array", 0), undefined);
  assert.strictEqual(getArrayElement(["a", "b"], -1), "b");
  assert.deepStrictEqual(sliceArray("not array", 0, 1), undefined);
  assert.deepStrictEqual(sliceArray([1, 2, 3], -2, undefined), [2, 3]);
});

test("Navigator utils: object operations and callable methods cover fallbacks", () => {
  assert.strictEqual(evaluateObjectOperation(null, "keys"), undefined);
  assert.deepStrictEqual(evaluateObjectOperation(["a", "b"], "length"), 2);
  assert.strictEqual(isOperatorMethod("__operator_+__"), true);
  assert.strictEqual(isOperatorMethod("map"), false);
  assert.strictEqual(extractOperator("__operator_>=__"), ">=");
  assert.strictEqual(isCallableMethod({ run: () => "ok" }, "run"), true);
  assert.strictEqual(isCallableMethod({ value: "no" }, "value"), false);
  assert.strictEqual(callMethod("hello", "startsWith", ["he"]), true);
  assert.strictEqual(callMethod("hello", "endsWith", ["lo"]), true);
  assert.throws(() => callMethod({}, "missing", []), /Method missing does not exist/);
});

test("Navigator builtins utils: deep object helpers cover mutation-free paths", () => {
  const data = { users: [{ name: "Ada" }], meta: { active: true } };
  assert.strictEqual(deepContains(data, { users: [{ name: "Ada" }] }), true);
  assert.strictEqual(deepContains(data, { users: [{ name: "Grace" }] }), false);
  assert.strictEqual(getValueAtPath(data, ["users", 0, "name"]), "Ada");
  assert.strictEqual(getValueAtPath(data, ["users", "bad"]), undefined);
  assert.deepStrictEqual(setValueAtPath(data, ["meta", "active"], false), {
    users: [{ name: "Ada" }],
    meta: { active: false },
  });
  assert.deepStrictEqual(setValueAtPath(null, [1, "name"], "Ada"), [undefined, { name: "Ada" }]);
});

test("Navigator builtins utils: collection helpers return recursive values and paths", () => {
  const data = { user: { name: "Ada" }, tags: ["math", "code"] };
  assert.deepStrictEqual(collectAllValues(data), [data, data.user, "Ada", data.tags, "math", "code"]);
  assert.deepStrictEqual(collectPaths(data, []), [
    [],
    ["user"],
    ["user", "name"],
    ["tags"],
    ["tags", 0],
    ["tags", 1],
  ]);
});

test("Navigator: nested property access", () => {
  const data = { user: { name: "John", email: "john@example.com" } };
  assert.strictEqual(evaluate(".user.name", data), "John");
  assert.strictEqual(evaluate(".user.email", data), "john@example.com");
});

test("Navigator: array index access", () => {
  const data = { users: ["Alice", "Bob", "Charlie"] };
  assert.strictEqual(evaluate(".users[0]", data), "Alice");
  assert.strictEqual(evaluate(".users[1]", data), "Bob");
  assert.strictEqual(evaluate(".users[-1]", data), "Charlie");
});

test("Navigator: array slice", () => {
  const data = [1, 2, 3, 4, 5];
  assert.deepStrictEqual(evaluate("[0:3]", data), [1, 2, 3]);
  assert.deepStrictEqual(evaluate("[2:]", data), [3, 4, 5]);
  assert.deepStrictEqual(evaluate("[:3]", data), [1, 2, 3]);
});

test("Navigator: array spread", () => {
  const data = { items: [1, 2, 3] };
  assert.deepStrictEqual(evaluate(".items[]", data), [1, 2, 3]);
});

test("Navigator: object operations", () => {
  const data = { a: 1, b: 2, c: 3 };
  assert.deepStrictEqual(evaluate(".{keys}", data), ["a", "b", "c"]);
  assert.deepStrictEqual(evaluate(".{values}", data), [1, 2, 3]);
  assert.deepStrictEqual(evaluate(".{entries}", data), [
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]);
  assert.strictEqual(evaluate(".{length}", data), 3);
});

test("Navigator: array map", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate(".map(x => x * 2)", data), [2, 4, 6]);
});

test("Navigator: array filter", () => {
  const data = [1, 2, 3, 4, 5];
  assert.deepStrictEqual(evaluate(".filter(x => x > 2)", data), [3, 4, 5]);
});

test("Navigator: method chaining", () => {
  const data = {
    users: [
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
      { name: "Charlie", age: 35 },
    ],
  };
  assert.deepStrictEqual(evaluate(".users.map(u => u.name)", data), ["Alice", "Bob", "Charlie"]);
  assert.deepStrictEqual(evaluate(".users.filter(u => u.age > 25)", data), [
    { name: "Bob", age: 30 },
    { name: "Charlie", age: 35 },
  ]);
});

test("Navigator: string methods", () => {
  const data = { name: "John Doe" };
  assert.strictEqual(evaluate(".name.toLowerCase()", data), "john doe");
  assert.strictEqual(evaluate(".name.toUpperCase()", data), "JOHN DOE");
  assert.strictEqual(evaluate('.name.includes("John")', data), true);
  assert.strictEqual(evaluate('.name.includes("Jane")', data), false);
});

test("Navigator: callable object methods", () => {
  const data = {
    user: {
      label: (value: unknown) => `name:${value}`,
    },
  };

  assert.strictEqual(evaluate('.user.label("Ada")', data), "name:Ada");
});

test("Navigator: callable object methods keep target binding", () => {
  const data = {
    user: {
      prefix: "name",
      label(this: { prefix: string }, value: unknown): string {
        return `${this.prefix}:${value}`;
      },
    },
  };

  assert.strictEqual(evaluate('.user.label("Ada")', data), "name:Ada");
});

test("Navigator: callable object methods receive all arguments", () => {
  const data = {
    user: {
      format(...values: unknown[]): string {
        return values.join(":");
      },
    },
  };

  assert.strictEqual(evaluate('.user.format("a", "b", "c", "d")', data), "a:b:c:d");
  assert.strictEqual(evaluate('.user.format("a", "b", "c", "d", "e")', data), "a:b:c:d:e");
  assert.strictEqual(
    evaluate('.user.format("a", "b", "c", "d", "e", "f", "g", "h", "i")', data),
    "a:b:c:d:e:f:g:h:i",
  );
});

test("Navigator: callable object methods support scriptc-safe arities", () => {
  const data = {
    user: {
      format(...values: unknown[]): string {
        return values.join(":");
      },
    },
  };
  const cases = Array.from({ length: 10 }, (_, argCount) => {
    const args = Array.from({ length: argCount }, (_, index) => `"${index}"`).join(", ");
    const expected = Array.from({ length: argCount }, (_, index) => String(index)).join(":");
    return { args, expected };
  });

  cases.forEach(({ args, expected }) => {
    assert.strictEqual(evaluate(`.user.format(${args})`, data), expected);
  });
});

test("Navigator: callable array and string methods outside allowlists", () => {
  assert.strictEqual(evaluate(".at(-1)", [1, 2, 3]), 3);
  assert.strictEqual(evaluate(".substring(1, 4)", "hello"), "ell");
});

test("Navigator: arithmetic operators", () => {
  const data = [10, 20, 30];
  assert.deepStrictEqual(evaluate(".map(x => x + 5)", data), [15, 25, 35]);
  assert.deepStrictEqual(evaluate(".map(x => x * 2)", data), [20, 40, 60]);
  assert.deepStrictEqual(evaluate(".map(x => x + 2 * 3)", [1]), [7]);
  assert.deepStrictEqual(evaluate(".map(x => (x + 2) * 3)", [1]), [9]);
});

test("Navigator: comparison operators", () => {
  const data = [1, 2, 3, 4, 5];
  assert.deepStrictEqual(evaluate(".filter(x => x > 2)", data), [3, 4, 5]);
  assert.deepStrictEqual(evaluate(".filter(x => x >= 3)", data), [3, 4, 5]);
});

test("Navigator: object operation on arrays", () => {
  const data = [1, 2, 3, 4, 5];
  assert.strictEqual(evaluate(".{length}", data), 5);
});

test("Navigator: method calls inside arrow functions", () => {
  const lines = [
    "PLAYER_JOINED: Alice entered the game",
    "KILL: Bob eliminated by Alice",
    'CHAT: Alice: "nice shot!"',
    "KILL: Charlie eliminated by Bob",
  ];
  assert.deepStrictEqual(evaluate(".filter(l => l.includes('KILL'))", lines), [
    "KILL: Bob eliminated by Alice",
    "KILL: Charlie eliminated by Bob",
  ]);
  assert.deepStrictEqual(evaluate(".filter(l => l.includes('CHAT'))", lines), [
    'CHAT: Alice: "nice shot!"',
  ]);
  assert.deepStrictEqual(evaluate(".filter(l => l.includes('PLAYER_JOINED'))", lines), [
    "PLAYER_JOINED: Alice entered the game",
  ]);
});

test("Navigator: chained method calls inside arrow functions", () => {
  const data = ["  hello  ", "  WORLD  ", "  Test  "];
  assert.deepStrictEqual(evaluate(".map(s => s.trim())", data), ["hello", "WORLD", "Test"]);
  assert.deepStrictEqual(evaluate(".map(s => s.trim().toLowerCase())", data), ["hello", "world", "test"]);
});

test("Navigator: nested method calls in filter predicates", () => {
  const users = [
    { name: "Alice Smith", role: "admin" },
    { name: "Bob Jones", role: "user" },
    { name: "Charlie Smith", role: "user" },
  ];
  assert.deepStrictEqual(evaluate(".filter(u => u.name.includes('Smith'))", users), [
    { name: "Alice Smith", role: "admin" },
    { name: "Charlie Smith", role: "user" },
  ]);
});

test("Navigator: division operator", () => {
  const data = [10, 20, 30];
  assert.deepStrictEqual(evaluate(".map(x => x / 2)", data), [5, 10, 15]);
});

test("Navigator: modulo operator", () => {
  const data = [10, 15, 20];
  assert.deepStrictEqual(evaluate(".map(x => x % 7)", data), [3, 1, 6]);
});

test("Navigator: less than operator", () => {
  const data = [1, 5, 10];
  assert.deepStrictEqual(evaluate(".filter(x => x < 6)", data), [1, 5]);
});

test("Navigator: less than or equal operator", () => {
  const data = [1, 5, 10];
  assert.deepStrictEqual(evaluate(".filter(x => x <= 5)", data), [1, 5]);
});

test("Navigator: equality operators", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate(".filter(x => x == 2)", data), [2]);
  assert.deepStrictEqual(evaluate(".filter(x => x === 2)", data), [2]);
});

test("Navigator: inequality operators", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate(".filter(x => x != 2)", data), [1, 3]);
  assert.deepStrictEqual(evaluate(".filter(x => x !== 2)", data), [1, 3]);
});

test("Navigator: filter with greater than", () => {
  const data = [1, 2, 3, 4, 5];
  assert.deepStrictEqual(evaluate(".filter(x => x > 3)", data), [4, 5]);
});

test("Navigator: filter with less than", () => {
  const data = [1, 2, 3, 4, 5];
  assert.deepStrictEqual(evaluate(".filter(x => x < 3)", data), [1, 2]);
});

test("Navigator: subtraction operator", () => {
  const data = [10, 20, 30];
  assert.deepStrictEqual(evaluate(".map(x => x - 5)", data), [5, 15, 25]);
});

test("Navigator: array reduce method", () => {
  const data = [1, 2, 3, 4];
  assert.strictEqual(evaluate(".reduce((acc, x) => acc + x, 0)", data), 10);
});

test("Navigator: array find method", () => {
  const data = [1, 2, 3, 4, 5];
  assert.strictEqual(evaluate(".find(x => x > 3)", data), 4);
});

test("Navigator: array some method", () => {
  const data = [1, 2, 3];
  assert.strictEqual(evaluate(".some(x => x > 2)", data), true);
  assert.strictEqual(evaluate(".some(x => x > 5)", data), false);
});

test("Navigator: array every method", () => {
  const data = [2, 4, 6];
  assert.strictEqual(evaluate(".every(x => x % 2 === 0)", data), true);
});

test("Navigator: string split method", () => {
  const data = { text: "a,b,c" };
  assert.deepStrictEqual(evaluate('.text.split(",")', data), ["a", "b", "c"]);
});

test("Navigator: string replace method", () => {
  const data = { text: "hello world" };
  assert.strictEqual(evaluate('.text.replace("world", "there")', data), "hello there");
});

test("Navigator: array join method", () => {
  const data = ["a", "b", "c"];
  assert.strictEqual(evaluate('.join("-")', data), "a-b-c");
});

test("Navigator: array reverse method", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate(".reverse()", data), [3, 2, 1]);
});

test("Navigator: array sort method", () => {
  const data = [3, 1, 2];
  assert.deepStrictEqual(evaluate(".sort((a, b) => a - b)", data), [1, 2, 3]);
});

test("Navigator: nested array access", () => {
  const data = {
    matrix: [
      [1, 2],
      [3, 4],
    ],
  };
  assert.strictEqual(evaluate(".matrix[0][1]", data), 2);
});

test("Navigator: property access on null returns undefined", () => {
  const data = { value: null };
  assert.strictEqual(evaluate(".value.name", data), undefined);
});

test("Navigator: array method on non-array returns undefined", () => {
  const data = { value: "not an array" };
  assert.strictEqual(evaluate(".value[0]", data), undefined);
});

test("Navigator: slice on non-array returns undefined", () => {
  const data = { value: "string" };
  assert.strictEqual(evaluate(".value[0:2]", data), undefined);
});

function evaluateStrict(expression: string, data: unknown): unknown {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator({ strict: true });
  return navigator.evaluate(ast, data);
}

test("Navigator: strict mode throws on undefined property", () => {
  const data = { name: "John" };
  assert.throws(() => evaluateStrict(".nonexistent", data), /Property "nonexistent" is undefined/);
});

test("Navigator: strict mode allows valid property access", () => {
  const data = { name: "John" };
  assert.strictEqual(evaluateStrict(".name", data), "John");
});

test("Navigator: strict mode throws on nested undefined property", () => {
  const data = { user: { name: "John" } };
  assert.throws(() => evaluateStrict(".user.email", data), /Property "email" is undefined/);
});

test("Navigator: non-strict mode returns undefined for missing property", () => {
  const data = { name: "John" };
  assert.strictEqual(evaluate(".nonexistent", data), undefined);
});

test("Navigator: pipe applies transformations left-to-right", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate("pipe(.map(x => x * 2))", data), [2, 4, 6]);
  assert.deepStrictEqual(evaluate("pipe(.map(x => x * 2), .map(x => x + 1))", data), [3, 5, 7]);
});

test("Navigator: compose applies transformations right-to-left", () => {
  const data = [1, 2, 3];
  assert.deepStrictEqual(evaluate("compose(.map(x => x + 1), .map(x => x * 2))", data), [3, 5, 7]);
});

test("Navigator: pipe with filter and map", () => {
  const data = [
    { name: "alice", age: 30 },
    { name: "bob", age: 20 },
  ];
  assert.deepStrictEqual(evaluate("pipe(.filter(x => x.age > 25), .map(x => x.name))", data), ["alice"]);
});

test("Navigator: head returns first element", () => {
  assert.strictEqual(evaluate("head()", [1, 2, 3]), 1);
  assert.strictEqual(evaluate("head()", []), undefined);
});

test("Navigator: last returns last element", () => {
  assert.strictEqual(evaluate("last()", [1, 2, 3]), 3);
  assert.strictEqual(evaluate("last()", []), undefined);
});

test("Navigator: tail returns all but first", () => {
  assert.deepStrictEqual(evaluate("tail()", [1, 2, 3]), [2, 3]);
});

test("Navigator: take and drop", () => {
  assert.deepStrictEqual(evaluate("take(2)", [1, 2, 3, 4]), [1, 2]);
  assert.deepStrictEqual(evaluate("drop(2)", [1, 2, 3, 4]), [3, 4]);
});

test("Navigator: uniq removes duplicates", () => {
  assert.deepStrictEqual(evaluate("uniq()", [1, 2, 2, 3, 3, 3]), [1, 2, 3]);
});

test("Navigator: flatten nested arrays", () => {
  assert.deepStrictEqual(
    evaluate("flatten()", [
      [1, 2],
      [3, [4, 5]],
    ]),
    [1, 2, 3, 4, 5],
  );
});

test("Navigator: keys and vals", () => {
  const data = { a: 1, b: 2 };
  assert.deepStrictEqual(evaluate("keys()", data), ["a", "b"]);
  assert.deepStrictEqual(evaluate("vals()", data), [1, 2]);
});

test("Navigator: pick and omit", () => {
  const data = { a: 1, b: 2, c: 3 };
  assert.deepStrictEqual(evaluate('pick("a", "b")', data), { a: 1, b: 2 });
  assert.deepStrictEqual(evaluate('omit("c")', data), { a: 1, b: 2 });
});

test("Navigator: fromPairs and toPairs", () => {
  assert.deepStrictEqual(
    evaluate("fromPairs()", [
      ["a", 1],
      ["b", 2],
    ]),
    { a: 1, b: 2 },
  );
  assert.deepStrictEqual(evaluate("toPairs()", { a: 1, b: 2 }), [
    ["a", 1],
    ["b", 2],
  ]);
});

test("Navigator: sum, mean, min, max", () => {
  const data = [1, 2, 3, 4, 5];
  assert.strictEqual(evaluate("sum()", data), 15);
  assert.strictEqual(evaluate("mean()", data), 3);
  assert.strictEqual(evaluate("min()", data), 1);
  assert.strictEqual(evaluate("max()", data), 5);
});

test("Navigator: isEmpty and isNil", () => {
  assert.strictEqual(evaluate("isEmpty()", []), true);
  assert.strictEqual(evaluate("isEmpty()", [1]), false);
  assert.strictEqual(evaluate("isEmpty()", {}), true);
  assert.strictEqual(evaluate("isEmpty()", { a: 1 }), false);
  assert.strictEqual(evaluate("isNil()", null), true);
  assert.strictEqual(evaluate("isNil()", undefined), true);
  assert.strictEqual(evaluate("isNil()", 0), false);
});

test("Navigator: pluck extracts property from array of objects", () => {
  const data = [{ name: "alice" }, { name: "bob" }];
  assert.deepStrictEqual(evaluate('pluck("name")', data), ["alice", "bob"]);
});

test("Navigator: len and count", () => {
  assert.strictEqual(evaluate("len()", [1, 2, 3]), 3);
  assert.strictEqual(evaluate("count()", { a: 1, b: 2 }), 2);
  assert.strictEqual(evaluate("len()", "hello"), 5);
});

test("Navigator: sortBy sorts by key function", () => {
  const data = [
    { name: "charlie", age: 30 },
    { name: "alice", age: 25 },
    { name: "bob", age: 35 },
  ];
  assert.deepStrictEqual(evaluate("sortBy(x => x.age)", data), [
    { name: "alice", age: 25 },
    { name: "charlie", age: 30 },
    { name: "bob", age: 35 },
  ]);
  assert.deepStrictEqual(evaluate("sortBy(x => x.name)", data), [
    { name: "alice", age: 25 },
    { name: "bob", age: 35 },
    { name: "charlie", age: 30 },
  ]);
});

test("Navigator: chunk splits array into chunks", () => {
  assert.deepStrictEqual(evaluate("chunk(2)", [1, 2, 3, 4, 5]), [[1, 2], [3, 4], [5]]);
  assert.deepStrictEqual(evaluate("chunk(3)", [1, 2, 3, 4, 5, 6]), [
    [1, 2, 3],
    [4, 5, 6],
  ]);
});

test("Navigator: compact removes falsy values", () => {
  assert.deepStrictEqual(evaluate("compact()", [0, 1, false, 2, "", 3, null, undefined]), [1, 2, 3]);
});

test("Navigator: deepMerge recursively merges objects", async () => {
  const { executeBuiltin } = await import("../../src/navigator/builtins/index");
  const base = { a: 1, nested: { x: 1, y: 2 } };
  const override = { b: 2, nested: { y: 3, z: 4 } };
  assert.deepStrictEqual(executeBuiltin("deepMerge", base, [override]), {
    a: 1,
    b: 2,
    nested: { x: 1, y: 3, z: 4 },
  });
});

test("Navigator: recursive descent (..) collects all values", () => {
  const data = {
    name: "root",
    children: [
      { name: "child1", value: 1 },
      { name: "child2", value: 2, nested: { name: "grandchild" } },
    ],
  };
  const result = evaluate("..", data) as unknown[];
  assert.ok(result.includes("root"));
  assert.ok(result.includes("child1"));
  assert.ok(result.includes("child2"));
  assert.ok(result.includes("grandchild"));
  assert.ok(result.includes(1));
  assert.ok(result.includes(2));
});

test("Navigator: recursive descent on array", () => {
  const data = [
    { id: 1, items: [{ id: 2 }, { id: 3 }] },
    { id: 4, items: [{ id: 5 }] },
  ];
  const result = evaluate("..", data) as unknown[];
  assert.ok(result.includes(1));
  assert.ok(result.includes(2));
  assert.ok(result.includes(3));
  assert.ok(result.includes(4));
  assert.ok(result.includes(5));
});

test("Navigator: optional access returns undefined on missing property", () => {
  const data = { name: "test" };
  assert.strictEqual(evaluate(".name?", data), "test");
  assert.strictEqual(evaluate(".missing?", data), undefined);
});

test("Navigator: optional access on nested path", () => {
  const data = { user: { profile: { name: "John" } } };
  assert.strictEqual(evaluate(".user?.profile?.name?", data), "John");
  assert.strictEqual(evaluate(".user?.missing?.name?", data), undefined);
});

test("Navigator: null coalescing provides default value", () => {
  const data = { name: null, value: "exists" };
  assert.strictEqual(evaluate('.name ?? "default"', data), "default");
  assert.strictEqual(evaluate('.value ?? "default"', data), "exists");
});

test("Navigator: null coalescing with undefined", () => {
  const data = { existing: "value" };
  assert.strictEqual(evaluate('.missing ?? "fallback"', data), "fallback");
  assert.strictEqual(evaluate('.existing ?? "fallback"', data), "value");
});

test("Navigator: null coalescing with number default", () => {
  const data = { count: null };
  assert.strictEqual(evaluate(".count ?? 0", data), 0);
});

test("Navigator: combined optional access and null coalescing", () => {
  const data = { user: null };
  assert.strictEqual(evaluate('.user ?? "anonymous"', data), "anonymous");
});

test("Navigator: type builtin returns correct types", () => {
  assert.strictEqual(evaluate("type()", "hello"), "string");
  assert.strictEqual(evaluate("type()", 42), "number");
  assert.strictEqual(evaluate("type()", true), "boolean");
  assert.strictEqual(evaluate("type()", null), "null");
  assert.strictEqual(evaluate("type()", [1, 2]), "array");
  assert.strictEqual(evaluate("type()", { a: 1 }), "object");
});

test("Navigator: range generates number sequences", () => {
  assert.deepStrictEqual(evaluate("range(5)", null), [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(evaluate("range(1, 5)", null), [1, 2, 3, 4]);
  assert.deepStrictEqual(evaluate("range(0, 10, 2)", null), [0, 2, 4, 6, 8]);
});

test("Navigator: has checks key existence", () => {
  const data = { name: "test", value: null };
  assert.strictEqual(evaluate('has("name")', data), true);
  assert.strictEqual(evaluate('has("value")', data), true);
  assert.strictEqual(evaluate('has("missing")', data), false);
});

test("Navigator: nth gets element at index", () => {
  const data = ["a", "b", "c", "d"];
  assert.strictEqual(evaluate("nth(0)", data), "a");
  assert.strictEqual(evaluate("nth(2)", data), "c");
  assert.strictEqual(evaluate("nth(-1)", data), "d");
});

test("Navigator: contains checks for subset", async () => {
  const { executeBuiltin } = await import("../../src/navigator/builtins/index");
  assert.strictEqual(executeBuiltin("contains", [1, 2, 3], [[2]]), true);
  assert.strictEqual(executeBuiltin("contains", [1, 2, 3], [[5]]), false);
  assert.strictEqual(executeBuiltin("contains", { a: 1, b: 2 }, [{ a: 1 }]), true);
});

test("Navigator: add concatenates arrays or sums numbers", () => {
  assert.deepStrictEqual(
    evaluate("add()", [
      [1, 2],
      [3, 4],
    ]),
    [1, 2, 3, 4],
  );
  assert.strictEqual(evaluate("add()", [1, 2, 3]), 6);
});

test("Navigator: getpath retrieves nested values", async () => {
  const { executeBuiltin } = await import("../../src/navigator/builtins/index");
  const data = { a: { b: { c: 1 } } };
  assert.strictEqual(executeBuiltin("getpath", data, [["a", "b", "c"]]), 1);
  assert.deepStrictEqual(executeBuiltin("getpath", data, [["a", "b"]]), { c: 1 });
});

test("Navigator: split and join string operations", () => {
  assert.deepStrictEqual(evaluate('split(",")', "a,b,c"), ["a", "b", "c"]);
  assert.strictEqual(evaluate('join("-")', ["a", "b", "c"]), "a-b-c");
});

test("Navigator: startswith and endswith", () => {
  assert.strictEqual(evaluate('startswith("hello")', "hello world"), true);
  assert.strictEqual(evaluate('startswith("world")', "hello world"), false);
  assert.strictEqual(evaluate('endswith("world")', "hello world"), true);
  assert.strictEqual(evaluate('endswith("hello")', "hello world"), false);
});

test("Navigator: ltrimstr and rtrimstr", () => {
  assert.strictEqual(evaluate('ltrimstr("hello ")', "hello world"), "world");
  assert.strictEqual(evaluate('rtrimstr(" world")', "hello world"), "hello");
});

test("Navigator: tostring and tonumber", () => {
  assert.strictEqual(evaluate("tostring()", 42), "42");
  assert.strictEqual(evaluate("tostring()", true), "true");
  assert.strictEqual(evaluate("tonumber()", "42"), 42);
  assert.strictEqual(evaluate("tonumber()", "3.14"), 3.14);
});

test("Navigator: floor, ceil, round", () => {
  assert.strictEqual(evaluate("floor()", 3.7), 3);
  assert.strictEqual(evaluate("ceil()", 3.2), 4);
  assert.strictEqual(evaluate("round()", 3.5), 4);
  assert.strictEqual(evaluate("round()", 3.4), 3);
});

test("Navigator: abs returns absolute value", () => {
  assert.strictEqual(evaluate("abs()", -5), 5);
  assert.strictEqual(evaluate("abs()", 5), 5);
});

test("Navigator: not negates boolean", () => {
  assert.strictEqual(evaluate("not()", true), false);
  assert.strictEqual(evaluate("not()", false), true);
  assert.strictEqual(evaluate("not()", 0), true);
  assert.strictEqual(evaluate("not()", 1), false);
});

test("Navigator: select returns value if predicate passes", async () => {
  const { executeBuiltin, EMPTY_SYMBOL } = await import("../../src/navigator/builtins/index");
  const gt3 = (x: number) => x > 3;
  const lt3 = (x: number) => x < 3;
  assert.strictEqual(executeBuiltin("select", 5, [gt3]), 5);
  assert.strictEqual(executeBuiltin("select", 2, [gt3]), EMPTY_SYMBOL);
  assert.strictEqual(executeBuiltin("select", 2, [lt3]), 2);
});

test("Navigator: error throws with message", () => {
  assert.throws(() => evaluate('error("test error")', null), /test error/);
});
