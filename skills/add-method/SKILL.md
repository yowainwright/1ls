---
description: Add a new method to the interactive autocomplete tooltip registry
---

# Add Autocomplete Method

Methods power the tooltip in interactive mode (`1ls -i`). When the user types `.fi` after selecting an Array path, fuzzy search scores all method names and shows ranked hints with signatures, descriptions, and tab-completable templates.

## Files to Touch

1. **`src/interactive/methods/constants.ts`** — add the `Method` entry to the right type array
2. **`test/unit/interactive.test.ts`** — verify the method appears for the correct data type

## Method Shape

```typescript
// src/interactive/methods/types.ts
interface Method {
  name: string;        // fuzzy-matched against user input — must be the JS/builtin name as typed
  signature: string;   // shown in tooltip, e.g. ".filter(x => ...)"
  description: string; // one short phrase, ≤ 6 words, no period
  template?: string;   // inserted on Tab-complete — must be a runnable expression
  category?: string;   // "Transform" | "Filter" | "Aggregate" | "Test" | "Search" | "Access"
  isBuiltin?: boolean; // true only if the name exists in src/navigator/builtins/constants.ts
}
```

## Which Array to Add To

| Array | When to use |
|---|---|
| `ARRAY_METHODS` | Native JS array methods (`map`, `filter`, `reduce`…) |
| `STRING_METHODS` | Native JS string methods (`split`, `slice`, `trim`…) |
| `OBJECT_OPERATIONS` | Native JS object operations (`keys`, `values`, `entries`…) |
| `NUMBER_METHODS` | Native JS number methods / ops |
| `ARRAY_BUILTINS` | 1ls builtins on arrays (`sum`, `median`, `groupBy`…) |
| `OBJECT_BUILTINS` | 1ls builtins on objects |
| `STRING_BUILTINS` | 1ls builtins on strings |
| `NUMBER_BUILTINS` | 1ls builtins on numbers |
| `UNIVERSAL_BUILTINS` | 1ls builtins available on any data type |

## Constraints

- **`name` must match the expression syntax** — it's what the user types and what fuzzy search matches
- **`template` must be a runnable expression** — the user Tab-completes to it as-is
- **`description` ≤ 6 words** — displayed inline next to the signature in the tooltip
- **No duplicate `name` within a type array** — check before adding; duplicates show the hint twice
- **`isBuiltin: true` only if the key exists in `BUILTIN_FUNCTIONS`** — verify in `src/navigator/builtins/constants.ts`
- No `async`, no `Intl`, no Bun APIs — method entries are data objects, but templates must be QJS-safe expressions

## See Examples

- [good-example.ts](./good-example.ts) — correct Method entries
- [bad-example.ts](./bad-example.ts) — common mistakes

## Links

- Source: [`src/interactive/methods/constants.ts`](../../src/interactive/methods/constants.ts) — all method arrays
- Source: [`src/interactive/methods/types.ts`](../../src/interactive/methods/types.ts) — `Method` interface
- Source: [`src/interactive/methods/index.ts`](../../src/interactive/methods/index.ts) — `getMethodsForType` dispatch
- Source: [`src/interactive/tooltip/index.ts`](../../src/interactive/tooltip/index.ts) — how the tooltip uses methods
- Source: [`src/interactive/fuzzy.ts`](../../src/interactive/fuzzy.ts) — fuzzy scoring algorithm
- Source: [`src/navigator/builtins/constants.ts`](../../src/navigator/builtins/constants.ts) — builtin name registry

## Run

```bash
bun test test/unit/interactive.test.ts
bun run build && echo '{"a":[1,2,3]}' | bun src/cli/index.ts -i   # manual smoke test
```
