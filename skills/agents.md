# Agents Guide

Reference for AI agents working on the 1ls codebase. Read this first, then use the skill that matches your task.

## Skills

Each skill is a directory with `SKILL.md` (instructions), `good-example.ts` (correct patterns), and `bad-example.ts` (anti-patterns). Read all three before writing code.

| Task | Skill | When to use |
|---|---|---|
| Add a builtin function | [`add-builtin/`](./add-builtin/SKILL.md) | Adding `sum`, `median`, `groupBy`-style functions to the expression engine |
| Add a format parser | [`add-format/`](./add-format/SKILL.md) | Adding support for a new input format (like CSV, TOML, etc.) |
| Add an autocomplete method | [`add-method/`](./add-method/SKILL.md) | Adding method hints to the autocomplete registry |
| Write tests | [`add-test/`](./add-test/SKILL.md) | Writing unit or integration tests for any module |

### Workflow

1. **Identify the task** — which skill applies?
2. **Read the skill's `SKILL.md`** — understand the constraints and file locations
3. **Read `good-example.ts`** — internalize the correct patterns
4. **Skim `bad-example.ts`** — know what to avoid
5. **Write code** following the skill's patterns
6. **Run the skill's test command** — verify it works
7. **Check native-core boundaries** — keep core code portable and shell/runtime-free

### Multiple skills apply

Most tasks combine skills:

- **Adding a builtin** → `add-builtin/` + `add-test/`
- **Adding a format** → `add-format/` + `add-test/`
- **Adding autocomplete** → `add-method/` + `add-test/`
- **Fixing a bug in navigator** → `add-test/`
- **Improving autocomplete/tooltip** → extend `src/ac` and `src/tooltip`

Keep parser, evaluator, formatter, and autocomplete code portable. Put shell, filesystem, and runtime-specific behavior behind entrypoint boundaries.

### Eval

Run `node skills/eval.ts` to validate skill structure, example compilation, and link integrity.

## Project Intent

**Goal: the fastest terminal data parser with the most readable syntax.**

### Product Direction

Do not introduce a new architecture. Extend the existing parser, detector, daemon, cache, and tooltip flow.

- **Compiler:** `scriptc` is the production compiler target for the smallest and fastest native tool. Node builds are the development baseline, not the product runtime target.
- **Terminal UX:** Extend the tooltip flow popularized by Warp and Fig into ordinary terminal sessions. The inline hint/autocomplete experience is the feature.
- **Shell integration:** Build Zsh/ZLE first. Keep the daemon protocol shell-neutral so Bash, Fish, and other integrations can follow only after the Zsh experience proves valuable.
- **Language:** Keep JavaScript-like expression syntax and experiences, similar to fx, while retaining 1ls's format support and readable data manipulation.
- **Known unknowns:** Do not solve arbitrary JavaScript execution for constants files unless real usage proves it necessary. Static, safe source handling is sufficient until then.

### Why 1ls exists

| Tool | Strength | Gap |
|---|---|---|
| **jq** | Very fast (native C binary) | Cryptic DSL — high learning curve for JS devs |
| **fx** | Readable JS syntax, reasonably fast | Not natively compiled — slower on large data |
| **1ls** | JS syntax + native binary via `scriptc` | Combines readability with compiled performance |

jq is fast but the syntax is opaque to anyone who knows JavaScript. fx is readable but interpreted. 1ls targets both: `.filter(x => x > 5)` instead of `[.[] | select(. > 5)]`, compiled to a native binary.

### Why scriptc

TypeScript source compiles to the native `1ls` binary through `scriptc`. pnpm and Node are the development baseline; the production target is the smallest native tool that can run the real CLI and inline autocomplete path.

### Design principles

- JavaScript syntax over custom DSL — `.filter(x => x > 5)` not `[.[] | select(. > 5)]`
- 60+ jq-compatible builtins — `head`, `tail`, `sum`, `groupBy`, `sortBy`, etc.
- Multi-format input — JSON, YAML, TOML, XML, CSV, TSV, INI, ENV, NDJSON, Protobuf
- Performance — faster than jq and fx (see [Benchmarking](#benchmarking))

### Batch mode pipeline

```
Input (stdin/file)
  → parseInput()          src/formats/index.ts        — detect + parse format
  → expandShortcuts()     src/shortcuts/index.ts      — .mp → .map
  → Lexer.tokenize()      src/lexer/index.ts          — string → tokens
  → ExpressionParser()    src/expression/index.ts     — tokens → AST
  → JsonNavigator()       src/navigator/json/index.ts — AST + data → result
  → formatOutput()        src/formatter/output.ts     — result → string
```

### Terminal autocomplete pipeline

```
ZLE buffer/cursor
  → complete()            src/ac/index.ts             — contextual candidates
  → handleMessage()       src/tooltip/server.ts       — daemon request handling
  → render()              src/tooltip/renderer.ts     — bounded ANSI overlay
```

### Runtime boundary

```
src/scriptc/        ← native binary entrypoint and runtime adapter
src/browser/        ← app/browser-compatible API while the app still imports it
```

Core code that must stay portable:
- `src/lexer/`, `src/expression/`, `src/navigator/`, `src/formats/`, `src/shortcuts/`, `src/ac/`, `src/browser/`

Runtime-specific code:
- `src/cli/`, `src/fs/`, `src/completions/`, `src/tooltip/`, `src/scriptc/`

## Code Style

### Priorities

1. **Fast first** — optimize for runtime performance before readability
2. **Readable second** — clear code beats clever code when perf is equal
3. **No new files** — add to existing files; create a new file only when there is no logical home

### Iteration

- **Prefer prototype methods** (`map`, `filter`, `reduce`, `find`, `some`, `every`, `flatMap`) over `for` loops
- Use `for` only when profiling shows a meaningful gain — and note why
- Never spread inside a hot loop (`[...acc, item]` in reduce is O(n²)) — use an accumulator object/array and build the final result after

### Complexity and nesting

- **Avoid brute-force algorithms** — think about O(n) before writing any nested iteration
- **No deep nesting** — more than 2 levels of indent means break it into a named function or variable
- **Hoist condition logic** into a named variable before the `if`:

```typescript
// bad
if (data !== null && typeof data === "object" && !Array.isArray(data)) { ... }

// good
const isPlainObject = data !== null && typeof data === "object" && !Array.isArray(data);
if (isPlainObject) { ... }
```

- **Max 3 operators per assignment** — if a variable assignment or object literal needs more, split it

### Functions

- **Pure** — input in, output out, no side effects, no mutation of arguments
- **Type guard first** — check input type at the top, return a sensible fallback for wrong types
- **Immutable** — `[...data].sort()` not `data.sort()`, `{ ...obj }` not `obj.x = y`
- **Single expression body** when a function can be a one-liner
- **No classes** for one-off operations — plain functions

### Output and logging

- **No `console.log`** anywhere in library, bundle, autocomplete, or tooltip code
- `console.error` for debug output only
- In the tooltip daemon, rendering belongs in `src/tooltip/renderer.ts`
- Batch output flows through `formatOutput()` only

### TypeScript

- **Target**: `esnext` — use latest ES features freely
- **Strict**: `strict: true`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- **No comments** unless logic is genuinely non-obvious
- **Optional chaining** (`?.`) and nullish coalescing (`??`) freely
- **Constants** in existing `constants.ts`; helpers in `utils.ts`

### Type Guards

Use existing guards from `src/navigator/builtins/utils.ts`:

```typescript
isArray(x)   // x is unknown[]
isObject(x)  // x is Record<string, unknown>
isNil(x)     // x is null | undefined
isString(x)  // x is string
isNumber(x)  // x is number
```

### Native-Core Compatibility

Parser, evaluator, formatter, and autocomplete code must stay portable:
- no filesystem, shell, network, or process access;
- no host runtime APIs outside runtime adapters;
- no arbitrary JavaScript execution for source discovery.

## Terminal Tooltip

The inline tooltip is the product path. It is a daemon plus shell adapter.

### Key files

| File | Responsibility |
|---|---|
| `src/ac/index.ts` | Autocomplete composition and contextual suggestions |
| `src/ac/constants.ts` | Method, builtin, shortcut, and scoring constants |
| `src/ac/types.ts` | Suggestion and completion contracts |
| `src/ac/utils.ts` | Fuzzy search, partial extraction, and type filtering |
| `src/tooltip/server.ts` | Daemon request handling and response state |
| `src/tooltip/renderer.ts` | ANSI overlay rendering |
| `src/tooltip/shell/1ls-tooltip.zsh` | ZLE adapter and key routing |

### Tooltip / autocomplete flow

Triggered when the active expression ends with `.partialName`:

1. `extractPartialMethod(query)` returns the active prefix and replacement start.
2. `complete(input, { data, expression })` builds contextual property and method suggestions.
3. `fuzzySearch(suggestions, partial, suggestion => suggestion.name)` ranks matches.
4. The daemon stores the selected suggestion and renderer draws the overlay.
5. ZLE applies the selected insert text.

Keep parser/provider decisions out of the renderer. The renderer draws a model; it does not infer command structure or replacement ranges.

## Communication Style

- **Minimal** — say what needs to be said, nothing more
- **Right over empathy** — accuracy and precision matter more than softening language
- **No preamble** — don't restate the task before doing it
- **No trailing summaries** — don't recap what you just changed
- **Lead with the answer** — conclusion first, reasoning only if needed
- **Code over prose** — show the diff, don't describe it

## Model Selection

| Task | Model |
|---|---|
| Planning, architecture decisions | `claude-opus-4-6` (best) |
| Writing or refactoring code | `claude-opus-4-6` (best) |
| Fixing bugs | `claude-opus-4-6` (best) |
| Writing documentation or text | `claude-opus-4-6` (best) |
| Tests, type fixes, lint, nits | `claude-sonnet-4-6` (fast) |

## Linting & Formatting

```bash
pnpm run lint          # oxlint src/
pnpm run lint:fix      # oxlint src/ --fix
pnpm run format        # oxfmt src/
pnpm run format:fix    # oxfmt src/ --write
pnpm run typecheck     # tsc --noEmit
```

- **oxlint** `1.65.0` — linter, scoped to `src/`
- **oxfmt** `0.36.0` — formatter, scoped to `src/`

## Testing

### Framework

[Node Test](https://nodejs.org/api/test.html) — native Node test runner. See [`add-test/SKILL.md`](./add-test/SKILL.md) for patterns and examples.

### Structure

```
test/
  unit/           # 28+ unit test files
  integration/    # CLI and app-facing end-to-end behavior
  benchmarks/     # Docker-based perf comparison
  fixtures/       # Test data files
```

### Rules

- **Flat `test()` calls** — no `describe` blocks for unit tests
- **No mocks** — test real functions with real data
- **No `beforeEach`/`afterEach`** — each test is self-contained
- **Inline data** — small, visible test data in each test
- **Edge cases always** — empty input, wrong type, boundary values
- **One concept per test** — test name describes the behavior

### Test entry points by module

| Module | Import | Call Pattern |
|---|---|---|
| Builtins | `executeBuiltin` from `src/navigator/builtins` | `executeBuiltin("name", data, [args])` |
| Evaluate | `evaluate` from `src/browser` | `evaluate(data, ".expression")` |
| Lexer | `Lexer` from `src/lexer` | `new Lexer(expr).tokenize()` |
| Formats | `parseCSV` etc. from `src/formats/*` | `parseCSV(inputString)` |
| Shortcuts | `expandShortcuts` from `src/browser` | `expandShortcuts(".mp(x => x)")` |

### Running

```bash
pnpm test                                                   # all tests
pnpm test -- --test-name-pattern builtins                    # specific test subset
pnpm run test:coverage                                      # with LCOV coverage
pnpm run test:integration                                   # integration only
```

## Benchmarking

### Running benchmarks

```bash
pnpm run test:bench          # build Docker image + run benchmarks
pnpm run test:bench:update   # update benchmark results in repo
```

### How it works

- Docker container (`debian:bookworm-slim`) with `jq`, `fx`, and `1ls`
- Tests 3 data sizes: **1,000 / 10,000 / 100,000** records
- **5 runs per test**, averaged
- Categories: basic ops, filter/map, aggregation, builtins, nested data, strings
- Compares: `jq` vs `fx` vs `1ls` (lower ms is better)

### Performance considerations

When writing new builtins or format parsers:

- **Avoid `[...spread]` in hot loops** — creates a new array each iteration. Use `reduce` with a single accumulator for large datasets.
- **`Object.fromEntries` + `.map`** is efficient for key/value transforms
- **`Array.from({ length }, fn)`** is faster than `.fill().map()` for generating arrays
- **Early return** on type guard failure — don't process data that won't match
- **`Math.min`/`Math.max` with spread** can stack-overflow on very large arrays (100k+) — use `reduce` instead

### Benchmark reference

| Source | Path |
|---|---|
| Dockerfile | [`test/benchmarks/Dockerfile`](../test/benchmarks/Dockerfile) |
| Run script | [`test/benchmarks/run.sh`](../test/benchmarks/run.sh) |
| Update script | [`test/benchmarks/update.sh`](../test/benchmarks/update.sh) |

## Links

- [Node Test](https://nodejs.org/api/test.html) — test runner
- [MDN Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [MDN String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [MDN RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
