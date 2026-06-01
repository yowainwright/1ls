---
description: Add a new builtin function to the 1ls expression engine
---

# Add Builtin Function

Builtins are pure functions registered in the expression engine. They're called as `functionName(data)` in 1ls expressions (e.g., `echo '[1,2,3]' | 1ls 'sum'`).

## Files to Touch

1. **`src/navigator/builtins/constants.ts`** — add name to `BUILTIN_FUNCTIONS` const
2. **`src/navigator/builtins/index.ts`** — add implementation to `BUILTINS` record
3. **`test/unit/builtins.test.ts`** — add tests via `executeBuiltin(name, data, args)`

## Signature

Every builtin has the same shape defined in `src/navigator/builtins/types.ts`:

```typescript
type BuiltinFn = (data: unknown, args: unknown[]) => unknown;
```

- `data` — the piped input (could be any type)
- `args` — additional arguments passed in the expression
- Return value — the transformed result

## Constraints

- **QuickJS NG compatible**: no `async/await`, no `Intl`, no `WeakRef`, no `fetch`, no `URL`
- **Pure function**: no side effects, no mutation of `data`
- **Type guard first**: check input type at the top, return a sensible fallback for wrong types
- **Use existing guards** from `src/navigator/builtins/utils.ts`: `isArray`, `isObject`, `isNil`, `isString`, `isNumber`
- **Immutable**: use `[...data]`, `Object.fromEntries`, `reduce` — never `.sort()` or `.push()` on input
- **No comments** unless logic is non-obvious

## Placement

- **constants.ts**: add the new key at the end of `BUILTIN_FUNCTIONS`, before `} as const`
- **index.ts**: add the implementation at the end of the `BUILTINS` record, before the closing `}`
- **tests**: append new tests at the end of `test/unit/builtins.test.ts`

## See Examples

- [good-example.ts](./good-example.ts) — correct patterns
- [bad-example.ts](./bad-example.ts) — anti-patterns to avoid

## Links

- [QuickJS NG](https://github.com/quickjs-ng/quickjs) — runtime target
- [QuickJS NG Docs](https://quickjs-ng.github.io/quickjs/) — ES feature support
- [MDN Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — safe to use
- [MDN Object methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) — safe to use
- Source: [`src/navigator/builtins/index.ts`](../../src/navigator/builtins/index.ts) — all builtin implementations
- Source: [`src/navigator/builtins/utils.ts`](../../src/navigator/builtins/utils.ts) — type guards, deepMerge, path ops
- Source: [`src/navigator/builtins/constants.ts`](../../src/navigator/builtins/constants.ts) — function name registry
- Source: [`src/navigator/builtins/types.ts`](../../src/navigator/builtins/types.ts) — `BuiltinFn`, `KeyExtractor`, `Predicate`
- Tests: [`test/unit/builtins.test.ts`](../../test/unit/builtins.test.ts) — existing test patterns

## Run

```bash
bun test test/unit/builtins.test.ts
```
