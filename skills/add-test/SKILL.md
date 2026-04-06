---
description: Write tests for 1ls following project patterns
---

# Write Tests

Tests use Bun's test runner (`bun:test`). Flat structure, no mocks, inline data, direct function calls.

## Files to Touch

- **`test/unit/<module>.test.ts`** — unit tests for a specific module
- **`test/integration/`** — integration tests (e.g., QJS binary, CLI end-to-end)

## Patterns by Module

### Builtins — `test/unit/builtins.test.ts`

```typescript
import { test, expect } from "bun:test";
import { executeBuiltin } from "../../src/navigator/builtins";

test("myfunc does the thing", () => {
  expect(executeBuiltin("myfunc", [1, 2, 3], [])).toEqual(expected);
  expect(executeBuiltin("myfunc", "not array", [])).toEqual([]);
});
```

### Expression evaluation — end-to-end via `evaluate()`

```typescript
import { evaluate } from "../../src/browser";

test("expression: .map with transform", () => {
  expect(evaluate([1, 2, 3], ".map(x => x * 2)")).toEqual([2, 4, 6]);
});
```

### Format parsers

```typescript
import { parseCSV } from "../../src/formats/csv";

test("parseCSV handles basic input", () => {
  expect(parseCSV("name,age\nalice,30")).toEqual([{ name: "alice", age: 30 }]);
});
```

## Constraints

- **Flat `test()` calls** at module level — no `describe` blocks for unit tests
- **No mocks** — test real functions with real data
- **No `beforeEach`/`afterEach`** — each test is self-contained
- **Inline test data** — keep it small and visible
- **Always test edge cases**: empty input, wrong type, boundary values
- **For builtins**: always test non-array/non-object input returns the fallback
- **One assertion concept per test** — test name describes the behavior

## See Examples

- [good-example.ts](./good-example.ts) — correct test patterns
- [bad-example.ts](./bad-example.ts) — anti-patterns to avoid

## Links

- [Bun Test Runner](https://bun.sh/docs/cli/test) — test API reference
- [Bun Test Matchers](https://bun.sh/docs/test/writing#matchers) — `expect` API
- Tests: [`test/unit/builtins.test.ts`](../../test/unit/builtins.test.ts) — builtin tests
- Tests: [`test/unit/navigator.test.ts`](../../test/unit/navigator.test.ts) — navigator tests
- Tests: [`test/unit/formats.test.ts`](../../test/unit/formats.test.ts) — format tests
- Tests: [`test/integration/qjs.test.ts`](../../test/integration/qjs.test.ts) — QJS binary tests

## Run

```bash
bun test                              # all tests
bun test test/unit/builtins.test.ts   # specific file
bun test --coverage                   # with coverage (LCOV)
```
