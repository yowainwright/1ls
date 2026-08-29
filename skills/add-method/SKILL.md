---
description: Add a new method to the autocomplete tooltip registry
---

# Add Autocomplete Method

Suggestions power the inline tooltip. When the user types `.fi` in an active data expression, fuzzy search scores candidate names and shows ranked hints with signatures, descriptions, and insertable text.

## Files to Touch

1. **`src/ac/constants.ts`** — add the suggestion and type-specific name
2. **`test/unit/ac.test.ts`** — verify the suggestion is present
3. **`test/unit/tooltip-completion.test.ts`** — verify contextual tooltip behavior

## Suggestion Shape

```typescript
// src/ac/types.ts
interface Suggestion {
  name: string;        // fuzzy-matched against user input — must be the JS/builtin name as typed
  signature: string;   // shown in tooltip, e.g. ".filter(x => ...)"
  description: string; // one short phrase, ≤ 6 words, no period
  type: "method" | "builtin" | "shortcut" | "path";
  insertText?: string; // inserted on Tab-complete — must be a runnable expression
}
```

## Which Array to Add To

| Array | When to use |
|---|---|
| `METHODS` | Native JS methods (`map`, `filter`, `trim`…) |
| `BUILTINS` | 1ls builtins (`sum`, `head`, `groupBy`…) |
| `SHORTCUTS` | shorthand suggestions (`mp`, `flt`, `kys`…) |
| `ARRAY_SUGGESTIONS` | names valid for array contexts |
| `STRING_SUGGESTIONS` | names valid for string contexts |
| `OBJECT_SUGGESTIONS` | names valid for object contexts |
| `NUMBER_SUGGESTIONS` | names valid for number contexts |

## Constraints

- **`name` must match the expression syntax** — it's what the user types and what fuzzy search matches
- **`insertText` must be a runnable expression** — the user Tab-completes to it as-is
- **`description` ≤ 6 words** — displayed inline next to the signature in the tooltip
- **No duplicate `name` within a suggestion array** — check before adding; duplicates show the hint twice
- **`type: "builtin"` only if the key exists in `BUILTIN_FUNCTIONS`** — verify in `src/navigator/builtins/constants.ts`
- No `async`, no `Intl`, no host runtime APIs — suggestion entries are data objects, but inserted expressions must be native-core safe

## See Examples

- [good-example.ts](./good-example.ts) — correct suggestion entries
- [bad-example.ts](./bad-example.ts) — common mistakes

## Links

- Source: [`src/ac/constants.ts`](../../src/ac/constants.ts) — suggestion arrays
- Source: [`src/ac/types.ts`](../../src/ac/types.ts) — suggestion contract
- Source: [`src/ac/index.ts`](../../src/ac/index.ts) — contextual completion
- Source: [`src/ac/utils.ts`](../../src/ac/utils.ts) — fuzzy scoring and type filtering
- Source: [`src/navigator/builtins/constants.ts`](../../src/navigator/builtins/constants.ts) — builtin name registry

## Run

```bash
pnpm test -- --test-name-pattern "ac|tooltip"
```
