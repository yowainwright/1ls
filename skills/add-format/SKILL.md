---
description: Add a new input format parser to 1ls
---

# Add Format Parser

Format parsers convert raw string input into structured data. They're invoked via `--input-format` or auto-detected from input content.

## Files to Touch

1. **`src/formats/types.ts`** — add format name to `DataFormat` union type
2. **`src/formats/<name>.ts`** — implement the parser function
3. **`src/formats/index.ts`** — add `case` in `parseInput` switch + detection logic
4. **`src/formats/constants.ts`** — add detection regex patterns (if needed)
5. **`test/unit/formats.test.ts`** or **`test/unit/<name>.test.ts`** — tests

## Signature

```typescript
function parseMyFormat(input: string): unknown
```

- `input` — raw string from stdin or file
- Returns structured data (array of objects for tabular, plain object for config)

## Constraints

- **QuickJS NG compatible**: the parser itself must be sync, no `async/await`
  - The `parseInput` wrapper uses dynamic `import()` for code splitting — that's the only async part
- **No external deps**: hand-roll the parser using only built-in JS
- **Use existing helpers** from `src/formats/utils.ts`: `tryParseNumber`, `parseBooleanValue`, `parseNullValue`
- **Detection must be fast**: regex-based, check first chars and structural patterns
- **Immutable**: build result with `reduce`, `map`, `Object.fromEntries` — no mutation
- **Convention**: tabular data → `Array<Record<string, unknown>>`, config data → `Record<string, unknown>`

## See Examples

- [good-example.ts](./good-example.ts) — correct parser patterns
- [bad-example.ts](./bad-example.ts) — anti-patterns to avoid

## Links

- [QuickJS NG](https://github.com/quickjs-ng/quickjs) — runtime target
- [MDN String.split](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split) — safe in QJS
- [MDN RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) — no lookbehind in QJS
- Source: [`src/formats/index.ts`](../../src/formats/index.ts) — format detection + routing
- Source: [`src/formats/types.ts`](../../src/formats/types.ts) — `DataFormat` union
- Source: [`src/formats/utils.ts`](../../src/formats/utils.ts) — parse helpers
- Source: [`src/formats/csv.ts`](../../src/formats/csv.ts) — reference parser implementation
- Source: [`src/formats/constants.ts`](../../src/formats/constants.ts) — detection regex patterns
- Tests: [`test/unit/formats.test.ts`](../../test/unit/formats.test.ts) — existing test patterns

## Run

```bash
bun test test/unit/formats.test.ts
```
