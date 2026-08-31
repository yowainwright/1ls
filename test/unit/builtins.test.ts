import { test } from "node:test";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { executeBuiltin } from "../../src/navigator/builtins/index";

test("head returns first element", () => {
  assert.strictEqual(executeBuiltin("head", [1, 2, 3], []), 1);
  assert.strictEqual(executeBuiltin("head", ["a", "b"], []), "a");
  assert.strictEqual(executeBuiltin("head", [], []), undefined);
  assert.strictEqual(executeBuiltin("head", "not array", []), undefined);
});

test("last returns last element", () => {
  assert.strictEqual(executeBuiltin("last", [1, 2, 3], []), 3);
  assert.strictEqual(executeBuiltin("last", ["a", "b"], []), "b");
  assert.strictEqual(executeBuiltin("last", [], []), undefined);
  assert.strictEqual(executeBuiltin("last", "not array", []), undefined);
});

test("tail returns all but first", () => {
  assert.deepStrictEqual(executeBuiltin("tail", [1, 2, 3], []), [2, 3]);
  assert.deepStrictEqual(executeBuiltin("tail", [1], []), []);
  assert.deepStrictEqual(executeBuiltin("tail", [], []), []);
  assert.deepStrictEqual(executeBuiltin("tail", "not array", []), []);
});

test("take returns first n elements", () => {
  assert.deepStrictEqual(executeBuiltin("take", [1, 2, 3, 4, 5], [2]), [1, 2]);
  assert.deepStrictEqual(executeBuiltin("take", [1, 2, 3], [5]), [1, 2, 3]);
  assert.deepStrictEqual(executeBuiltin("take", [1, 2, 3], [0]), []);
  assert.deepStrictEqual(executeBuiltin("take", "not array", [2]), []);
});

test("drop removes first n elements", () => {
  assert.deepStrictEqual(executeBuiltin("drop", [1, 2, 3, 4, 5], [2]), [3, 4, 5]);
  assert.deepStrictEqual(executeBuiltin("drop", [1, 2, 3], [5]), []);
  assert.deepStrictEqual(executeBuiltin("drop", [1, 2, 3], [0]), [1, 2, 3]);
  assert.deepStrictEqual(executeBuiltin("drop", "not array", [2]), []);
});

test("uniq removes duplicates", () => {
  assert.deepStrictEqual(executeBuiltin("uniq", [1, 2, 2, 3, 3, 3], []), [1, 2, 3]);
  assert.deepStrictEqual(executeBuiltin("uniq", ["a", "b", "a"], []), ["a", "b"]);
  assert.deepStrictEqual(executeBuiltin("uniq", [], []), []);
  assert.deepStrictEqual(executeBuiltin("uniq", "not array", []), []);
});

test("flatten flattens nested arrays", () => {
  assert.deepStrictEqual(
    executeBuiltin(
      "flatten",
      [
        [1, 2],
        [3, 4],
      ],
      [],
    ),
    [1, 2, 3, 4],
  );
  assert.deepStrictEqual(executeBuiltin("flatten", [[1, [2, [3]]], 4], []), [1, 2, 3, 4]);
  assert.deepStrictEqual(executeBuiltin("flatten", [1, 2, 3], []), [1, 2, 3]);
  assert.deepStrictEqual(executeBuiltin("flatten", "not array", []), []);
});

test("rev reverses array", () => {
  assert.deepStrictEqual(executeBuiltin("rev", [1, 2, 3], []), [3, 2, 1]);
  assert.deepStrictEqual(executeBuiltin("rev", ["a", "b", "c"], []), ["c", "b", "a"]);
  assert.deepStrictEqual(executeBuiltin("rev", [], []), []);
  assert.deepStrictEqual(executeBuiltin("rev", "not array", []), []);
});

test("groupBy groups by function result", () => {
  const data = [
    { type: "a", val: 1 },
    { type: "b", val: 2 },
    { type: "a", val: 3 },
  ];
  const fn = (x: { type: string }) => x.type;
  const result = executeBuiltin("groupBy", data, [fn]);
  assert.deepStrictEqual(result, {
    a: [
      { type: "a", val: 1 },
      { type: "a", val: 3 },
    ],
    b: [{ type: "b", val: 2 }],
  });
  assert.deepStrictEqual(executeBuiltin("groupBy", "not array", [fn]), {});
});

test("sortBy sorts by function result", () => {
  const data = [
    { name: "c", age: 30 },
    { name: "a", age: 20 },
    { name: "b", age: 25 },
  ];
  assert.deepStrictEqual(executeBuiltin("sortBy", data, [(x: { age: number }) => x.age]), [
    { name: "a", age: 20 },
    { name: "b", age: 25 },
    { name: "c", age: 30 },
  ]);
  assert.deepStrictEqual(executeBuiltin("sortBy", data, [(x: { name: string }) => x.name]), [
    { name: "a", age: 20 },
    { name: "b", age: 25 },
    { name: "c", age: 30 },
  ]);
  assert.deepStrictEqual(executeBuiltin("sortBy", "not array", [(x: unknown) => x]), []);
});

test("chunk splits array into chunks", () => {
  assert.deepStrictEqual(executeBuiltin("chunk", [1, 2, 3, 4, 5], [2]), [[1, 2], [3, 4], [5]]);
  assert.deepStrictEqual(executeBuiltin("chunk", [1, 2, 3, 4, 5, 6], [3]), [
    [1, 2, 3],
    [4, 5, 6],
  ]);
  assert.deepStrictEqual(executeBuiltin("chunk", [1, 2], [5]), [[1, 2]]);
  assert.deepStrictEqual(executeBuiltin("chunk", [], [2]), []);
  assert.deepStrictEqual(executeBuiltin("chunk", "not array", [2]), []);
});

test("compact removes falsy values", () => {
  assert.deepStrictEqual(executeBuiltin("compact", [0, 1, false, 2, "", 3, null, undefined], []), [
    1, 2, 3,
  ]);
  assert.deepStrictEqual(executeBuiltin("compact", [true, false, true], []), [true, true]);
  assert.deepStrictEqual(executeBuiltin("compact", [], []), []);
  assert.deepStrictEqual(executeBuiltin("compact", "not array", []), []);
});

test("pluck extracts property from array of objects", () => {
  const data = [
    { name: "alice", age: 30 },
    { name: "bob", age: 25 },
  ];
  assert.deepStrictEqual(executeBuiltin("pluck", data, ["name"]), ["alice", "bob"]);
  assert.deepStrictEqual(executeBuiltin("pluck", data, ["age"]), [30, 25]);
  assert.deepStrictEqual(executeBuiltin("pluck", data, ["missing"]), [undefined, undefined]);
  assert.deepStrictEqual(executeBuiltin("pluck", "not array", ["name"]), []);
});

test("pick selects specified keys from object", () => {
  const data = { a: 1, b: 2, c: 3 };
  assert.deepStrictEqual(executeBuiltin("pick", data, ["a", "b"]), { a: 1, b: 2 });
  assert.deepStrictEqual(executeBuiltin("pick", data, ["a"]), { a: 1 });
  assert.deepStrictEqual(executeBuiltin("pick", data, ["missing"]), {});
  assert.deepStrictEqual(executeBuiltin("pick", "not object", ["a"]), {});
});

test("omit removes specified keys from object", () => {
  const data = { a: 1, b: 2, c: 3 };
  assert.deepStrictEqual(executeBuiltin("omit", data, ["c"]), { a: 1, b: 2 });
  assert.deepStrictEqual(executeBuiltin("omit", data, ["a", "b"]), { c: 3 });
  assert.deepStrictEqual(executeBuiltin("omit", data, ["missing"]), { a: 1, b: 2, c: 3 });
  assert.deepStrictEqual(executeBuiltin("omit", "not object", ["a"]), {});
});

test("keys returns object keys", () => {
  assert.deepStrictEqual(executeBuiltin("keys", { a: 1, b: 2 }, []), ["a", "b"]);
  assert.deepStrictEqual(executeBuiltin("keys", {}, []), []);
  assert.deepStrictEqual(executeBuiltin("keys", "not object", []), []);
});

test("vals returns object values", () => {
  assert.deepStrictEqual(executeBuiltin("vals", { a: 1, b: 2 }, []), [1, 2]);
  assert.deepStrictEqual(executeBuiltin("vals", {}, []), []);
  assert.deepStrictEqual(executeBuiltin("vals", "not object", []), []);
});

test("merge shallow merges objects", () => {
  assert.deepStrictEqual(executeBuiltin("merge", { a: 1 }, [{ b: 2 }]), { a: 1, b: 2 });
  assert.deepStrictEqual(executeBuiltin("merge", { a: 1 }, [{ a: 2 }]), { a: 2 });
  assert.deepStrictEqual(executeBuiltin("merge", { a: 1 }, [{ b: 2 }, { c: 3 }]), { a: 1, b: 2, c: 3 });
  assert.deepStrictEqual(executeBuiltin("merge", "not object", [{ a: 1 }]), {});
});

test("deepMerge recursively merges objects", () => {
  const base = { a: 1, nested: { x: 1, y: 2 } };
  const override = { b: 2, nested: { y: 3, z: 4 } };
  assert.deepStrictEqual(executeBuiltin("deepMerge", base, [override]), {
    a: 1,
    b: 2,
    nested: { x: 1, y: 3, z: 4 },
  });
  assert.deepStrictEqual(executeBuiltin("deepMerge", { a: { b: { c: 1 } } }, [{ a: { b: { d: 2 } } }]), {
    a: { b: { c: 1, d: 2 } },
  });
  assert.deepStrictEqual(executeBuiltin("deepMerge", "not object", [{ a: 1 }]), {});
});

test("fromPairs converts array of pairs to object", () => {
  assert.deepStrictEqual(
    executeBuiltin(
      "fromPairs",
      [
        ["a", 1],
        ["b", 2],
      ],
      [],
    ),
    { a: 1, b: 2 },
  );
  assert.deepStrictEqual(executeBuiltin("fromPairs", [], []), {});
  assert.deepStrictEqual(executeBuiltin("fromPairs", "not array", []), {});
});

test("toPairs converts object to array of pairs", () => {
  assert.deepStrictEqual(executeBuiltin("toPairs", { a: 1, b: 2 }, []), [
    ["a", 1],
    ["b", 2],
  ]);
  assert.deepStrictEqual(executeBuiltin("toPairs", {}, []), []);
  assert.deepStrictEqual(executeBuiltin("toPairs", "not object", []), []);
});

test("sum adds all numbers", () => {
  assert.strictEqual(executeBuiltin("sum", [1, 2, 3, 4], []), 10);
  assert.strictEqual(executeBuiltin("sum", [10, -5, 5], []), 10);
  assert.strictEqual(executeBuiltin("sum", [], []), 0);
  assert.strictEqual(executeBuiltin("sum", "not array", []), 0);
});

test("mean calculates average", () => {
  assert.strictEqual(executeBuiltin("mean", [1, 2, 3, 4, 5], []), 3);
  assert.strictEqual(executeBuiltin("mean", [10, 20], []), 15);
  assert.strictEqual(executeBuiltin("mean", [], []), 0);
  assert.strictEqual(executeBuiltin("mean", "not array", []), 0);
});

test("min returns minimum value", () => {
  assert.strictEqual(executeBuiltin("min", [3, 1, 4, 1, 5], []), 1);
  assert.strictEqual(executeBuiltin("min", [-5, 0, 5], []), -5);
  assert.strictEqual(executeBuiltin("min", [42], []), 42);
  assert.strictEqual(executeBuiltin("min", "not array", []), undefined);
});

test("max returns maximum value", () => {
  assert.strictEqual(executeBuiltin("max", [3, 1, 4, 1, 5], []), 5);
  assert.strictEqual(executeBuiltin("max", [-5, 0, 5], []), 5);
  assert.strictEqual(executeBuiltin("max", [42], []), 42);
  assert.strictEqual(executeBuiltin("max", "not array", []), undefined);
});

test("len returns length", () => {
  assert.strictEqual(executeBuiltin("len", [1, 2, 3], []), 3);
  assert.strictEqual(executeBuiltin("len", { a: 1, b: 2 }, []), 2);
  assert.strictEqual(executeBuiltin("len", "hello", []), 5);
  assert.strictEqual(executeBuiltin("len", 123, []), 0);
});

test("count returns count (alias for len)", () => {
  assert.strictEqual(executeBuiltin("count", [1, 2, 3], []), 3);
  assert.strictEqual(executeBuiltin("count", { a: 1, b: 2 }, []), 2);
  assert.strictEqual(executeBuiltin("count", "hello", []), 5);
  assert.strictEqual(executeBuiltin("count", 123, []), 0);
});

test("isEmpty checks if empty", () => {
  assert.strictEqual(executeBuiltin("isEmpty", [], []), true);
  assert.strictEqual(executeBuiltin("isEmpty", [1], []), false);
  assert.strictEqual(executeBuiltin("isEmpty", {}, []), true);
  assert.strictEqual(executeBuiltin("isEmpty", { a: 1 }, []), false);
  assert.strictEqual(executeBuiltin("isEmpty", "", []), true);
  assert.strictEqual(executeBuiltin("isEmpty", "hello", []), false);
  assert.strictEqual(executeBuiltin("isEmpty", null, []), true);
  assert.strictEqual(executeBuiltin("isEmpty", undefined, []), true);
  assert.strictEqual(executeBuiltin("isEmpty", 0, []), false);
});

test("isNil checks if null or undefined", () => {
  assert.strictEqual(executeBuiltin("isNil", null, []), true);
  assert.strictEqual(executeBuiltin("isNil", undefined, []), true);
  assert.strictEqual(executeBuiltin("isNil", 0, []), false);
  assert.strictEqual(executeBuiltin("isNil", "", []), false);
  assert.strictEqual(executeBuiltin("isNil", false, []), false);
  assert.strictEqual(executeBuiltin("isNil", [], []), false);
});

test("id returns input unchanged", () => {
  assert.strictEqual(executeBuiltin("id", 42, []), 42);
  assert.strictEqual(executeBuiltin("id", "hello", []), "hello");
  assert.deepStrictEqual(executeBuiltin("id", [1, 2, 3], []), [1, 2, 3]);
  assert.deepStrictEqual(executeBuiltin("id", { a: 1 }, []), { a: 1 });
  assert.strictEqual(executeBuiltin("id", null, []), null);
});

test("type returns correct types", () => {
  assert.strictEqual(executeBuiltin("type", null, []), "null");
  assert.strictEqual(executeBuiltin("type", undefined, []), "undefined");
  assert.strictEqual(executeBuiltin("type", 42, []), "number");
  assert.strictEqual(executeBuiltin("type", "hello", []), "string");
  assert.strictEqual(executeBuiltin("type", true, []), "boolean");
  assert.strictEqual(executeBuiltin("type", [1, 2], []), "array");
  assert.strictEqual(executeBuiltin("type", { a: 1 }, []), "object");
});

test("range generates sequences", () => {
  assert.deepStrictEqual(executeBuiltin("range", null, [5]), [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(executeBuiltin("range", null, [2, 5]), [2, 3, 4]);
  assert.deepStrictEqual(executeBuiltin("range", null, [0, 10, 2]), [0, 2, 4, 6, 8]);
  assert.deepStrictEqual(executeBuiltin("range", null, [5, 0]), []);
});

test("has checks key existence", () => {
  assert.strictEqual(executeBuiltin("has", { a: 1, b: 2 }, ["a"]), true);
  assert.strictEqual(executeBuiltin("has", { a: 1 }, ["b"]), false);
  assert.strictEqual(executeBuiltin("has", [1, 2, 3], [0]), true);
  assert.strictEqual(executeBuiltin("has", [1, 2, 3], [5]), false);
  assert.strictEqual(executeBuiltin("has", "string", ["a"]), false);
});

test("nth gets element at index", () => {
  assert.strictEqual(executeBuiltin("nth", [10, 20, 30], [0]), 10);
  assert.strictEqual(executeBuiltin("nth", [10, 20, 30], [2]), 30);
  assert.strictEqual(executeBuiltin("nth", [10, 20, 30], [-1]), 30);
  assert.strictEqual(executeBuiltin("nth", [10, 20, 30], [-2]), 20);
  assert.strictEqual(executeBuiltin("nth", "not array", [0]), undefined);
});

test("contains checks deep containment", () => {
  assert.strictEqual(executeBuiltin("contains", [1, 2, 3], [[2]]), true);
  assert.strictEqual(executeBuiltin("contains", [1, 2, 3], [[5]]), false);
  assert.strictEqual(executeBuiltin("contains", { a: 1, b: 2 }, [{ a: 1 }]), true);
  assert.strictEqual(executeBuiltin("contains", { a: 1 }, [{ b: 2 }]), false);
  assert.strictEqual(
    executeBuiltin(
      "contains",
      [
        [1, 2],
        [3, 4],
      ],
      [[[1, 2]]],
    ),
    true,
  );
});

test("add concatenates or sums", () => {
  assert.strictEqual(executeBuiltin("add", [1, 2, 3, 4], []), 10);
  assert.strictEqual(executeBuiltin("add", ["a", "b", "c"], []), "abc");
  assert.deepStrictEqual(
    executeBuiltin(
      "add",
      [
        [1, 2],
        [3, 4],
      ],
      [],
    ),
    [1, 2, 3, 4],
  );
  assert.strictEqual(executeBuiltin("add", [], []), null);
  assert.strictEqual(executeBuiltin("add", "not array", []), "not array");
});

test("path returns all paths", () => {
  const result = executeBuiltin("path", { a: { b: 1 } }, []) as (string | number)[][];
  assert.ok(result.some((item: unknown) => isDeepStrictEqual(item, [])));
  assert.ok(result.some((item: unknown) => isDeepStrictEqual(item, ["a"])));
  assert.ok(result.some((item: unknown) => isDeepStrictEqual(item, ["a", "b"])));
});

test("getpath retrieves value at path", () => {
  const data = { a: { b: { c: 42 } } };
  assert.strictEqual(executeBuiltin("getpath", data, [["a", "b", "c"]]), 42);
  assert.deepStrictEqual(executeBuiltin("getpath", data, [["a", "b"]]), { c: 42 });
  assert.strictEqual(executeBuiltin("getpath", data, [["x", "y"]]), undefined);
});

test("setpath sets value at path", () => {
  const data = { a: { b: 1 } };
  assert.deepStrictEqual(executeBuiltin("setpath", data, [["a", "b"], 99]), { a: { b: 99 } });
  assert.deepStrictEqual(executeBuiltin("setpath", data, [["a", "c"], 42]), { a: { b: 1, c: 42 } });
});

test("recurse collects all values", () => {
  const data = { a: [1, { b: 2 }] };
  const result = executeBuiltin("recurse", data, []) as unknown[];
  assert.ok(result.includes(data));
  assert.ok(result.includes(1));
  assert.ok(result.includes(2));
});

test("split splits strings", () => {
  assert.deepStrictEqual(executeBuiltin("split", "a,b,c", [","]), ["a", "b", "c"]);
  assert.deepStrictEqual(executeBuiltin("split", "hello", [""]), ["h", "e", "l", "l", "o"]);
  assert.deepStrictEqual(executeBuiltin("split", 123, [","]), []);
});

test("join joins arrays", () => {
  assert.strictEqual(executeBuiltin("join", ["a", "b", "c"], [","]), "a,b,c");
  assert.strictEqual(executeBuiltin("join", [1, 2, 3], ["-"]), "1-2-3");
  assert.strictEqual(executeBuiltin("join", "not array", [","]), "");
});

test("startswith checks prefix", () => {
  assert.strictEqual(executeBuiltin("startswith", "hello world", ["hello"]), true);
  assert.strictEqual(executeBuiltin("startswith", "hello world", ["world"]), false);
  assert.strictEqual(executeBuiltin("startswith", 123, ["1"]), false);
});

test("endswith checks suffix", () => {
  assert.strictEqual(executeBuiltin("endswith", "hello world", ["world"]), true);
  assert.strictEqual(executeBuiltin("endswith", "hello world", ["hello"]), false);
  assert.strictEqual(executeBuiltin("endswith", 123, ["3"]), false);
});

test("ltrimstr removes prefix", () => {
  assert.strictEqual(executeBuiltin("ltrimstr", "hello world", ["hello "]), "world");
  assert.strictEqual(executeBuiltin("ltrimstr", "hello world", ["foo"]), "hello world");
  assert.strictEqual(executeBuiltin("ltrimstr", 123, ["1"]), 123);
});

test("rtrimstr removes suffix", () => {
  assert.strictEqual(executeBuiltin("rtrimstr", "hello world", [" world"]), "hello");
  assert.strictEqual(executeBuiltin("rtrimstr", "hello world", ["foo"]), "hello world");
  assert.strictEqual(executeBuiltin("rtrimstr", 123, ["3"]), 123);
});

test("tostring converts to string", () => {
  assert.strictEqual(executeBuiltin("tostring", 42, []), "42");
  assert.strictEqual(executeBuiltin("tostring", "hello", []), "hello");
  assert.strictEqual(executeBuiltin("tostring", { a: 1 }, []), '{"a":1}');
  assert.strictEqual(executeBuiltin("tostring", null, []), "null");
});

test("tonumber converts to number", () => {
  assert.strictEqual(executeBuiltin("tonumber", "42", []), 42);
  assert.strictEqual(executeBuiltin("tonumber", "3.14", []), 3.14);
  assert.strictEqual(executeBuiltin("tonumber", 42, []), 42);
  assert.strictEqual(executeBuiltin("tonumber", "not a number", []), null);
  assert.strictEqual(executeBuiltin("tonumber", {}, []), null);
});

test("floor floors numbers", () => {
  assert.strictEqual(executeBuiltin("floor", 3.7, []), 3);
  assert.strictEqual(executeBuiltin("floor", -3.2, []), -4);
  assert.strictEqual(executeBuiltin("floor", "not number", []), null);
});

test("ceil ceils numbers", () => {
  assert.strictEqual(executeBuiltin("ceil", 3.2, []), 4);
  assert.strictEqual(executeBuiltin("ceil", -3.7, []), -3);
  assert.strictEqual(executeBuiltin("ceil", "not number", []), null);
});

test("round rounds numbers", () => {
  assert.strictEqual(executeBuiltin("round", 3.4, []), 3);
  assert.strictEqual(executeBuiltin("round", 3.5, []), 4);
  assert.strictEqual(executeBuiltin("round", "not number", []), null);
});

test("abs returns absolute value", () => {
  assert.strictEqual(executeBuiltin("abs", -5, []), 5);
  assert.strictEqual(executeBuiltin("abs", 5, []), 5);
  assert.strictEqual(executeBuiltin("abs", "not number", []), null);
});

test("not negates values", () => {
  assert.strictEqual(executeBuiltin("not", true, []), false);
  assert.strictEqual(executeBuiltin("not", false, []), true);
  assert.strictEqual(executeBuiltin("not", null, []), true);
  assert.strictEqual(executeBuiltin("not", 0, []), true);
  assert.strictEqual(executeBuiltin("not", 1, []), false);
});

test("error throws", () => {
  assert.throws(() => executeBuiltin("error", null, ["custom error"]), /custom error/);
  assert.throws(() => executeBuiltin("error", null, []), /error/);
});
