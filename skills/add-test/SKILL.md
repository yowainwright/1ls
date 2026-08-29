---
description: Write tests for 1ls following project patterns
---

# Write Tests

Tests use Node's built-in test runner (`node:test`) and assertions (`node:assert/strict`). Flat structure, no mocks, inline data, direct function calls.

## Files to Touch

- **`test/unit/<module>.test.ts`** — unit tests for a specific module
- **`test/integration/`** — integration tests for CLI and app-facing behavior

## Patterns by Module

### Builtins — `test/unit/builtins.test.ts`

```typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import { executeBuiltin } from "../../src/navigator/builtins";

test("myfunc does the thing", () => {
  assert.deepStrictEqual(executeBuiltin("myfunc", [1, 2, 3], []), expected);
  assert.deepStrictEqual(executeBuiltin("myfunc", "not array", []), []);
});
```

### Expression evaluation — end-to-end via `evaluate()`

```typescript
import { evaluate } from "../../src/browser";

test("expression: .map with transform", () => {
  assert.deepStrictEqual(evaluate([1, 2, 3], ".map(x => x * 2)"), [2, 4, 6]);
});
```

### Format parsers

```typescript
import { parseCSV } from "../../src/formats/csv";

test("parseCSV handles basic input", () => {
  assert.deepStrictEqual(parseCSV("name,age\nalice,30"), [{ name: "alice", age: 30 }]);
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

- [Node Test Runner](https://nodejs.org/api/test.html) — test API reference
- [Node Assert](https://nodejs.org/api/assert.html) — assertion API
- Tests: [`test/unit/builtins.test.ts`](../../test/unit/builtins.test.ts) — builtin tests
- Tests: [`test/unit/navigator.test.ts`](../../test/unit/navigator.test.ts) — navigator tests
- Tests: [`test/unit/formats.test.ts`](../../test/unit/formats.test.ts) — format tests
- Tests: [`test/integration/cli.test.ts`](../../test/integration/cli.test.ts) — CLI end-to-end tests

## Run

```bash
pnpm test                             # all tests
pnpm test -- --test-name-pattern builtins
pnpm run test:coverage                # with coverage (LCOV)
```
