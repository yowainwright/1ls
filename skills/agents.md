# Agents Guide

Reference for AI agents working on the 1ls codebase. Read this first, then use the skill that matches your task.

## Skills

Each skill is a directory with `SKILL.md` (instructions), `good-example.ts` (correct patterns), and `bad-example.ts` (anti-patterns). Read all three before writing code.

| Task | Skill | When to use |
|---|---|---|
| Add a builtin function | [`add-builtin/`](./add-builtin/SKILL.md) | Adding `sum`, `median`, `groupBy`-style functions to the expression engine |
| Add a format parser | [`add-format/`](./add-format/SKILL.md) | Adding support for a new input format (like CSV, TOML, etc.) |
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
- **Fixing a bug in navigator** → `add-test/` + `qjs-compat/`

Always check `qjs-compat/` when modifying anything under `src/` that isn't in `src/cli/`, `src/interactive/`, or `src/file/` (those are Bun-only).

### Eval

Run `bun skills/eval.ts` to validate skill structure, example compilation, and link integrity.

## Project Intent

1ls is a minimal-syntax JSON/data CLI that uses **JavaScript syntax** instead of jq's DSL. It targets two runtimes:

- **Bun** — primary runtime, native binary compilation
- **QuickJS NG** — secondary, standalone binary via `qjsc`

The browser bundle (`src/browser/index.ts`) is the shared core. It must work in both runtimes.

**Design principles:**
- JavaScript syntax over custom DSL — `.filter(x => x > 5)` not `[.[] | select(. > 5)]`
- 60+ jq-compatible builtins — `head`, `tail`, `sum`, `groupBy`, `sortBy`, etc.
- Multi-format input — JSON, YAML, TOML, XML, CSV, TSV, INI, ENV, NDJSON, Protobuf
- Performance — faster than jq and fx (see [Benchmarking](#benchmarking))

### Architecture

```
Input (stdin/file)
  → parseInput()          src/formats/index.ts       — detect + parse format
  → expandShortcuts()     src/shortcuts/index.ts     — .mp → .map
  → Lexer.tokenize()      src/lexer/index.ts         — string → tokens
  → ExpressionParser()    src/expression/index.ts    — tokens → AST
  → JsonNavigator()       src/navigator/json/index.ts — AST + data → result
  → formatOutput()        src/formatter/output.ts    — result → string
```

### Bundle boundary

Code that enters the browser/QJS bundle (must be QJS-safe):
- `src/lexer/`, `src/expression/`, `src/navigator/`, `src/formats/`, `src/shortcuts/`, `src/browser/`

Code that does NOT enter the bundle (Bun-only):
- `src/cli/`, `src/interactive/`, `src/file/`, `src/completions/`

## Code Style

### TypeScript

- **Target**: `esnext` (see `tsconfig.json`)
- **Strict mode**: `strict: true`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- **No comments** unless logic is non-obvious
- **Ternary over if/else** for simple conditionals
- **Optional chaining** (`?.`) and nullish coalescing (`??`)
- **No new files** unless absolutely necessary — add to existing files
- **Constants** go in existing `constants.ts`, actions in `utils.ts`

### Functions

- **Pure functions** — input in, output out, no side effects
- **Type guard first** — check input type at the top, return sensible fallback
- **Immutable** — never mutate input data
  - Arrays: `[...data].sort()`, `data.filter()`, `data.map()`
  - Objects: `{ ...obj }`, `Object.fromEntries()`, `reduce` with spread
- **Single expression body** when possible
- **No classes** for one-off operations — plain functions

### Type Guards

Use the existing guards from `src/navigator/builtins/utils.ts`:

```typescript
isArray(x)   // x is unknown[]
isObject(x)  // x is Record<string, unknown>
isNil(x)     // x is null | undefined
isString(x)  // x is string
isNumber(x)  // x is number
```

### QuickJS NG Compatibility

All code in the browser bundle must be sync and use only ES2023 APIs. See [`qjs-compat/SKILL.md`](./qjs-compat/SKILL.md) for the full allowed/forbidden API list and checklist.

**Quick rules:**
- No `async/await`, `Promise`, or `dynamic import()` in bundled code
- No `Intl`, `fetch`, `URL`, `TextEncoder`, `structuredClone`, `WeakRef`
- No regex lookbehind (`(?<=...)`)
- No Bun/Node APIs in bundled modules
- No mutation of input — `[...data].sort()` not `data.sort()`
- Use `console.error` for debug, never `console.log` (conflicts with QJS stdout)

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
