# Agents Guide

Reference for AI agents working on the 1ls codebase. Read this first, then use the skill that matches your task.

## Skills

Each skill is a directory with `SKILL.md` (instructions), `good-example.ts` (correct patterns), and `bad-example.ts` (anti-patterns). Read all three before writing code.

| Task | Skill | When to use |
|---|---|---|
| Add a builtin function | [`add-builtin/`](./add-builtin/SKILL.md) | Adding `sum`, `median`, `groupBy`-style functions to the expression engine |
| Add a format parser | [`add-format/`](./add-format/SKILL.md) | Adding support for a new input format (like CSV, TOML, etc.) |
| Add an autocomplete method | [`add-method/`](./add-method/SKILL.md) | Adding method hints to the interactive tooltip registry |
| Write tests | [`add-test/`](./add-test/SKILL.md) | Writing unit or integration tests for any module |
| Check QJS compatibility | [`qjs-compat/`](./qjs-compat/SKILL.md) | Writing or auditing code that enters the browser bundle |

### Workflow

1. **Identify the task** — which skill applies?
2. **Read the skill's `SKILL.md`** — understand the constraints and file locations
3. **Read `good-example.ts`** — internalize the correct patterns
4. **Skim `bad-example.ts`** — know what to avoid
5. **Write code** following the skill's patterns
6. **Run the skill's test command** — verify it works
7. **Check QJS compat** — if you touched bundled code, also consult `qjs-compat/`

### Multiple skills apply

Most tasks combine skills:

- **Adding a builtin** → `add-builtin/` + `add-test/` + `qjs-compat/`
- **Adding a format** → `add-format/` + `add-test/` + `qjs-compat/`
- **Adding autocomplete** → `add-method/` + `add-test/`
- **Fixing a bug in navigator** → `add-test/` + `qjs-compat/`
- **Improving the TUI/tooltip** → see [Interactive Mode](#interactive-mode) below

Always check `qjs-compat/` when modifying anything under `src/` that isn't in `src/cli/`, `src/interactive/`, or `src/file/` (those are Bun-only).

### Eval

Run `bun skills/eval.ts` to validate skill structure, example compilation, and link integrity.

## Project Intent

**Goal: the fastest terminal data parser with the most readable syntax.**

### Why 1ls exists

| Tool | Strength | Gap |
|---|---|---|
| **jq** | Very fast (native C binary) | Cryptic DSL — high learning curve for JS devs |
| **fx** | Readable JS syntax, reasonably fast | Not natively compiled — slower on large data |
| **1ls** | JS syntax + native binary via QuickJS NG | Combines readability with compiled performance |

jq is fast but the syntax is opaque to anyone who knows JavaScript. fx is readable but interpreted. 1ls targets both: `.filter(x => x > 5)` instead of `[.[] | select(. > 5)]`, compiled to a native binary.

### Why QuickJS NG

TypeScript source → `tsup` (ESM bundle) → `qjsc` (QuickJS compiler) → native binary (`bin/1ls-qjs`). QuickJS NG compiles a JS subset to C bytecode. The constraint: the browser bundle must be **sync, ES2023-only, no runtime APIs** — this is what makes QJS compilation possible. See [`qjs-compat/`](./qjs-compat/SKILL.md).

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

### Interactive mode pipeline

```
stdin (raw mode)
  → handleInput()         src/interactive/input.ts    — key dispatch
  → updateQuery()         src/interactive/state.ts    — immutable state update
  → updateTooltipFromQuery() src/interactive/tooltip/ — method hint lookup
  → render(state)         src/interactive/renderer.ts — diff-based ANSI repaint
       ↓ on expression complete
  → evaluate()            src/browser/index.ts        — browser bundle (QJS-safe core)
```

### Bundle boundary

```
src/interactive/    ← Bun-only. Uses process.stdin, raw mode, stdout.write, async/await
        ↓ imports
src/browser/        ← QJS-safe. Sync only. Compiled to dist/qjs/core.js for the QJS binary
```

Code that enters the browser/QJS bundle (must be QJS-safe):
- `src/lexer/`, `src/expression/`, `src/navigator/`, `src/formats/`, `src/shortcuts/`, `src/browser/`

Code that does NOT enter the bundle (Bun-only):
- `src/cli/`, `src/interactive/`, `src/file/`, `src/completions/`

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

- **No `console.log`** anywhere in library, bundle, or interactive code
- `console.error` for debug output only (maps to stderr; does not conflict with QJS stdout)
- In the interactive app, only `renderer.ts` writes to `stdout` — nothing else calls `stdout.write`
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

### QuickJS NG Compatibility

All browser bundle code must be sync, ES2023-only. See [`qjs-compat/`](./qjs-compat/SKILL.md) for the full list. Quick rules:
- No `async/await`, `Promise`, dynamic `import()`
- No `Intl`, `fetch`, `URL`, `TextEncoder`, `structuredClone`, `WeakRef`
- No regex lookbehind (`(?<=...)`), no Bun/Node APIs

## Interactive Mode

The interactive app (`1ls -i`) is a Bun-only TUI — raw terminal control, ANSI escape sequences, diff-based rendering. It never enters the QJS bundle but calls into the browser bundle for live expression evaluation.

### Mode state machine

```
explore ──(Enter)──► build ──(arrow fn prompt)──► build-arrow-fn
   ▲                   │                                │
   └───────(Esc)───────┴────────────(Esc)───────────────┘
```

- **explore** — fuzzy-search all JSON paths, ↑/↓ to select, Enter to enter build mode
- **build** — compose expression on selected path; typing `.method` triggers the tooltip
- **build-arrow-fn** — prompt for arrow function body, returns to build with template filled

### Key files

| File | Responsibility |
|---|---|
| `src/interactive/app.ts` | Entry point, raw mode setup, event loop |
| `src/interactive/state.ts` | Immutable state transitions (`updateQuery`, `updateSelection`) |
| `src/interactive/input.ts` | Key dispatch → state transitions |
| `src/interactive/tooltip/index.ts` | Autocomplete logic — extract partial, fuzzy-match, rank hints |
| `src/interactive/methods/constants.ts` | Method registry — all completions by type |
| `src/interactive/methods/index.ts` | `getMethodsForType(dataType)` dispatch |
| `src/interactive/fuzzy.ts` | Fuzzy search with consecutive-match scoring |
| `src/interactive/renderer.ts` | Diff-based ANSI rendering (explore + tooltip) |
| `src/interactive/renderer-builder.ts` | Build mode and arrow-fn mode rendering |
| `src/interactive/terminal.ts` | ANSI escape helpers, raw mode, color constants |
| `src/interactive/preview/` | Live expression evaluation + preview formatting |

### Tooltip / autocomplete flow

Triggered when the query ends with `.partialName` (no `(` yet):

1. `extractPartialMethod(query)` — returns text after the last `.` if incomplete
2. `getMethodsForType(dataType)` — returns all `Method[]` for the current data type
3. `fuzzySearch(methods, partial, m => m.name)` — scores and ranks matches
4. First `MAX_TOOLTIP_HINTS` (5) displayed; Tab/Shift-Tab cycles the selected hint
5. Enter or Tab inserts `method.template` at the cursor

Each `Method` has: `name` (fuzzy-matched), `signature` (displayed), `description` (inline), `template` (inserted), `category`, `isBuiltin`. See [`add-method/SKILL.md`](./add-method/SKILL.md) to add new entries.

### Rendering: diff-based

`renderer.ts` compares `newLines[]` to `lastRenderedLines[]` and repaints only changed lines via ANSI cursor movement. This prevents flicker and keeps rendering fast on every keystroke.

**Rules:**
- Never call `clearScreen()` mid-session — causes visible flicker
- Use `moveCursor(row)` + `clearLine()` + `stdout.write(line)` for changed lines only
- Use `clearToEnd()` only when the total line count shrinks
- Render functions build string arrays and return them — only the top-level `render()` writes to stdout
- `render(state)` must be idempotent: same state → same output, no side effects

### Performance rules (TUI)

- **Fuzzy search runs on every keystroke** — stay O(n·m), no allocations inside the scoring loop
- **State transitions use `Object.assign({}, state, { field })` ** — shallow copy, no deep clone
- **`getMethodsForType` returns pre-built arrays** — do not construct them inside the function
- **ANSI color strings are concatenated at render time** — do not cache colored strings in state
- **No `setTimeout`/`setInterval`** — the interactive app has no event loop beyond stdin data events

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
bun run lint          # oxlint src/
bun run lint:fix      # oxlint src/ --fix
bun run format        # oxfmt src/
bun run format:fix    # oxfmt src/ --write
bun run typecheck     # tsc --noEmit
```

- **oxlint** `1.51.0` — linter, scoped to `src/`
- **oxfmt** `0.36.0` — formatter, scoped to `src/`

## Testing

### Framework

[Bun Test](https://bun.sh/docs/cli/test) — Jest-like API, runs with `bun test`. See [`add-test/SKILL.md`](./add-test/SKILL.md) for patterns and examples.

### Structure

```
test/
  unit/           # 28+ unit test files
  integration/    # QJS binary, CLI end-to-end
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
bun test                              # all tests
bun test test/unit/builtins.test.ts   # specific file
bun test --coverage                   # with LCOV coverage
bun test test/integration/            # integration only
```

## Benchmarking

### Running benchmarks

```bash
bun run test:bench          # build Docker image + run benchmarks
bun run test:bench:update   # update benchmark results in repo
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

- [QuickJS NG](https://github.com/quickjs-ng/quickjs) — secondary runtime
- [QuickJS NG Docs](https://quickjs-ng.github.io/quickjs/) — ES feature support
- [Bun Test](https://bun.sh/docs/cli/test) — test runner
- [MDN Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [MDN Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
- [MDN String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
- [MDN RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
