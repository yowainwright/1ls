---
description: Ensure code is compatible with QuickJS NG runtime
---

# QuickJS NG Compatibility

All code in the browser bundle (`src/browser/index.ts` entry) must run in both Bun and [QuickJS NG](https://github.com/quickjs-ng/quickjs). This skill covers what's safe and what's not.

## Files to Touch

This is an audit skill — it applies to any file in the browser bundle, not a specific location.

Bundle files (must be QJS-safe): `src/lexer/`, `src/expression/`, `src/navigator/`, `src/formats/`, `src/shortcuts/`, `src/browser/`

Bun-only files (exempt from QJS rules): `src/cli/`, `src/interactive/`, `src/file/`, `src/completions/`

## Constraints

- No `async/await`, `Promise`, or `dynamic import()` in bundle code
- No `Intl`, `fetch`, `URL`, `URLSearchParams`, `TextEncoder`, `TextDecoder`
- No `structuredClone`, `WeakRef`, `FinalizationRegistry`
- No `setTimeout`, `setInterval`, `queueMicrotask`
- No `Bun.*`, `process.*`, `require()`, Node built-ins
- No regex lookbehind (`(?<=...)`)
- No mutation of input — use `[...data].sort()`, `Object.fromEntries`, `reduce`
- Use `console.error` for debug output — never `console.log` (conflicts with QJS stdout)

## Build Pipeline

```
src/browser/index.ts  →  bun build (ESM, browser target)  →  dist/qjs/core.js
src/qjs/cli.js        →  qjsc -m (QuickJS compiler)       →  bin/1ls-qjs
```

Modules that enter the browser bundle: `src/lexer/`, `src/expression/`, `src/navigator/`, `src/formats/`, `src/shortcuts/`, `src/browser/`.

Modules that do NOT enter the bundle (Bun-only): `src/cli/`, `src/interactive/`, `src/file/`.

## Allowed APIs (ES2023+)

QuickJS NG targets latest ECMAScript. Safe to use:

| Category | Safe APIs |
|---|---|
| **Array** | `map`, `filter`, `reduce`, `find`, `some`, `every`, `flat`, `flatMap`, `at`, `findLast`, `toSorted`, `toReversed`, `with`, `Array.from` |
| **Object** | `keys`, `values`, `entries`, `fromEntries`, `assign`, `hasOwn` |
| **String** | `startsWith`, `endsWith`, `includes`, `replaceAll`, `trimStart`, `trimEnd`, `at`, `split`, `slice` |
| **Math** | all (`floor`, `ceil`, `round`, `abs`, `min`, `max`, etc.) |
| **Number** | `isNaN`, `isFinite`, `parseInt`, `parseFloat`, `isInteger` |
| **JSON** | `parse`, `stringify` |
| **RegExp** | full support except lookbehind (`(?<=...)`) |
| **Other** | `Set`, `Map`, `Symbol`, destructuring, spread, rest, optional chaining (`?.`), nullish coalescing (`??`), template literals |

## Forbidden APIs

| API | Why | Alternative |
|---|---|---|
| `async/await`, `Promise` | No event loop in QJS CLI | Keep functions sync |
| `Intl.*` | No ICU in QuickJS | Manual string ops |
| `fetch`, `URL`, `URLSearchParams` | No network/URL APIs | String parsing |
| `TextEncoder`, `TextDecoder` | Not available | Manual UTF-8 or avoid |
| `structuredClone` | Not available | `{ ...obj }` or `JSON.parse(JSON.stringify())` |
| `WeakRef`, `FinalizationRegistry` | Not available | Strong references |
| `setTimeout`, `setInterval` | No event loop | N/A |
| `Bun.*`, `process.*`, `require()` | Runtime-specific | N/A |
| `import()` dynamic | Not in QJS CLI context | Static `import` only |
| `(?<=...)` regex lookbehind | Not all QJS builds | Lookahead or manual parse |

## See Examples

- [good-example.ts](./good-example.ts) — QJS-safe patterns
- [bad-example.ts](./bad-example.ts) — QJS-incompatible patterns

## Links

- [QuickJS NG](https://github.com/quickjs-ng/quickjs) — source + ES feature tests
- [QuickJS NG Docs](https://quickjs-ng.github.io/quickjs/) — official docs
- [MDN Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [MDN String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [MDN RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
- Source: [`src/browser/index.ts`](../../src/browser/index.ts) — browser/QJS entry point
- Source: [`src/qjs/cli.js`](../../src/qjs/cli.js) — QuickJS CLI wrapper
- Source: [`scripts/build-qjs.sh`](../../scripts/build-qjs.sh) — build script
- Tests: [`test/integration/qjs.test.ts`](../../test/integration/qjs.test.ts) — QJS binary tests

## Run

```bash
bun run build:qjs:bundle              # build the QJS bundle
bun run build:qjs                     # compile to native binary (requires qjsc)
echo '{"a":1}' | ./bin/1ls-qjs .a     # test the binary
bun test test/integration/qjs.test.ts  # integration tests
```

## Checklist for New Code

1. No `async/await`, `Promise`, or `dynamic import()` in any code that enters the browser bundle
2. No Bun/Node APIs in bundled modules
3. No `Intl`, `WeakRef`, `fetch`, `URL`, `TextEncoder`, `setTimeout`, `setInterval`
4. No regex lookbehind (`(?<=...)`)
5. Pure functions — input in, output out, no side effects
6. No mutation of input data — never `.sort()` or `.push()` on args, use `[...data].sort()` or `reduce`
7. Use `console.error` for debug output, never `console.log` (conflicts with QJS stdout)
