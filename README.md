# 1ls

[![CI](https://github.com/yowainwright/1ls/actions/workflows/ci.yml/badge.svg)](https://github.com/yowainwright/1ls/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/yowainwright/1ls/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/1ls)
[![npm version](https://img.shields.io/npm/v/1ls.svg)](https://www.npmjs.com/package/1ls)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-repo-blue)](https://github.com/yowainwright/1ls)

> Minimal syntax. Maximum formats.

```bash
# full
echo '[1,2,3]' | 1ls '.filter(x => x > 1).map(x => x * 2)'

# shortened
echo '[1,2,3]' | 1ls '.fl(x => x > 1).mp(x => x * 2)'
```

JavaScript syntax with shortcuts. JSON, YAML, TOML, XML, CSV, INI, ENV, NDJSON. Zero dependencies.

## Why 1ls?

- **JavaScript Syntax**: Use familiar JavaScript array methods and syntax instead of learning jq's DSL
- **Multi-format**: Works with JSON, JSON5, YAML, TOML, XML, INI, CSV, TSV, ENV, NDJSON, JavaScript, TypeScript, and more
- **Fast**: Built for speed; no deps, compiled by Bun
- **Intuitive**: Property access with dot notation, just like JavaScript
- **Powerful**: Full support for array methods, arrow functions, and object operations
- **Shortcuts**: Built-in shortcuts for common operations (e.g., `.mp` for `.map`)

## jq vs fx vs 1ls

**Filter and map:**
```bash
# jq
echo '[{"age":25},{"age":35}]' | jq '[.[] | select(.age > 30) | .age]'

# fx
echo '[{"age":25},{"age":35}]' | fx '.filter(x => x.age > 30).map(x => x.age)'

# 1ls
echo '[{"age":25},{"age":35}]' | 1ls '.filter(x => x.age > 30).map(x => x.age)'
echo '[{"age":25},{"age":35}]' | 1ls '.fl(x => x.age > 30).mp(x => x.age)'
```

**First matching item:**
```bash
# jq
echo '[{"id":1},{"id":2}]' | jq '[.[] | select(.id == 2)] | first'

# fx
echo '[{"id":1},{"id":2}]' | fx '.find(x => x.id === 2)'

# 1ls
echo '[{"id":1},{"id":2}]' | 1ls '.find(x => x.id === 2)'
echo '[{"id":1},{"id":2}]' | 1ls '.fd(x => x.id === 2)'
```

**Get array length:**
```bash
# jq
echo '[1,2,3,4,5]' | jq 'length'

# fx
echo '[1,2,3,4,5]' | fx '.length'

# 1ls
echo '[1,2,3,4,5]' | 1ls '.length'
echo '[1,2,3,4,5]' | 1ls '.ln'
```

**YAML input:**
```bash
# jq - not supported

# fx
echo 'name: Ada' | fx --yaml '.name'

# 1ls (auto-detects format)
echo 'name: Ada' | 1ls '.name'
```

**Convert between forms:**
```bash
# shorten
1ls --shorten '.filter(x => x > 1).map(x => x * 2)'
# → .fl(x => x > 1).mp(x => x * 2)

# expand
1ls --expand '.fl(x => x > 1).mp(x => x * 2)'
# → .filter(x => x > 1).map(x => x * 2)
```

## Installation

```bash
# Using bun (or npm, pnpm, etc)
# works in the commandline or the web
bun add -g 1ls

# Or via binaries. here you get a QuickJs build
# Using Homebrew (macOS/Linux)
brew install yowainwright/tap/1ls
# Using curl
curl -fsSL https://raw.githubusercontent.com/yowainwright/1ls/main/scripts/install.sh | bash
```

## Quick Start

```bash
# Get a property
echo '{"name": "John", "age": 30}' | 1ls '.name'
# Output: "John"

# Array operations
echo '[1, 2, 3, 4, 5]' | 1ls '.filter(x => x > 2)'
# Output: [3, 4, 5]

# Map with arrow functions
echo '[1, 2, 3]' | 1ls '.map(x => x * 2)'
# Output: [2, 4, 6]

# Chain operations
echo '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]' | 1ls '.filter(x => x.age > 26).map(x => x.name)'
# Output: ["Alice"]

# Interactive mode - explore JSON with fuzzy search
1ls readFile data.json
# Opens interactive explorer with fuzzy search, arrow key navigation, and live preview
```

## Examples

### Interactive Mode

Explore JSON interactively with fuzzy search and build expressions with method discovery:

```bash
# Open interactive explorer from a file (automatic when no expression)
1ls readFile data.json

# Works with all supported formats
1ls readFile config.yaml
1ls readFile config.toml

# For remote data, save to a file first
curl https://api.github.com/users/github > /tmp/user.json
1ls readFile /tmp/user.json

# Or use an expression directly (non-interactive)
1ls readFile data.json '.users.filter(x => x.active)'
```

#### Mode 1: Path Explorer

Navigate and search JSON paths:

- **Fuzzy search**: Type to filter paths (e.g., "user.name" matches `.users[0].name`, `.user.username`, etc.)
- **Live preview**: See values as you navigate
- **Type information**: Shows String, Number, Array, Object, Boolean, or null
- **↑/↓**: Navigate, **Enter**: Select, **Tab**: Build expression, **Esc/q**: Quit

#### Mode 2: Expression Builder

Build complex expressions with guided method selection:

**Workflow:**
1. Navigate to a path in Explorer mode → Press **Tab**
2. Type to fuzzy search methods → **→** to accept
3. Type to fuzzy search properties → **→** to complete
4. Repeat to chain methods
5. Press **Enter** to execute

**Example Session:**
```
1. Navigate to .users (Array) → Tab
2. Type "fil" → → (accepts .filter(x => ...))
3. Type "act" → → (completes with x.active, back to method selection)
4. Type "map" → → (accepts .map(x => ...))
5. Type "name" → → (completes with x.name)
6. Enter → executes: .users.filter(x => x.active).map(x => x.name)
```

**Undo mistakes:**
- Press **←** at any time to undo the last segment
- Example: `.users.filter(x => x.active).map(x => x.name)` → **←** → `.users.filter(x => x.active)`

**Available Methods by Type:**

**Array**: map, filter, reduce, find, findIndex, some, every, sort, reverse, slice, concat, join, flat, flatMap, length

**String**: toUpperCase, toLowerCase, trim, trimStart, trimEnd, split, replace, replaceAll, substring, slice, startsWith, endsWith, includes, match, length

**Object**: {keys}, {values}, {entries}, {length}

**Number**: toFixed, toString

**Keyboard Shortcuts:**
- **↑/↓**: Navigate methods/properties
- **→ or Tab**: Accept/complete method or property (autocomplete-style)
- **←**: Undo last segment (remove to previous dot)
- **Enter**: Execute expression
- **Type**: Fuzzy search methods/properties
- **Esc**: Go back to Explorer / Quit
- **q**: Quit (from Explorer)

**Use cases:**
- Exploring unfamiliar API responses
- Building filter/map chains interactively
- Discovering available methods for each type
- Learning JavaScript array/string methods
- Prototyping complex data transformations

### Working with JSON

```bash
# Access nested properties
echo '{"user": {"name": "John", "posts": [1, 2, 3]}}' | 1ls '.user.name'

# Array indexing (negative indexes supported)
echo '["first", "second", "third"]' | 1ls '.[0]'  # "first"
echo '["first", "second", "third"]' | 1ls '.[-1]' # "third"

# Array slicing
echo '[1, 2, 3, 4, 5]' | 1ls '.[1:3]'  # [2, 3]
echo '[1, 2, 3, 4, 5]' | 1ls '.[:2]'   # [1, 2]
echo '[1, 2, 3, 4, 5]' | 1ls '.[2:]'   # [3, 4, 5]

# Object operations
echo '{"a": 1, "b": 2, "c": 3}' | 1ls '.{keys}'    # ["a", "b", "c"]
echo '{"a": 1, "b": 2, "c": 3}' | 1ls '.{values}'  # [1, 2, 3]
echo '{"a": 1, "b": 2, "c": 3}' | 1ls '.{entries}' # [["a", 1], ["b", 2], ["c", 3]]
```

### Array Methods

```bash
# Filter
echo '[1, 2, 3, 4, 5]' | 1ls '.filter(x => x % 2 === 0)'
# Output: [2, 4]

# Map
echo '["hello", "world"]' | 1ls '.map(x => x.toUpperCase())'
# Output: ["HELLO", "WORLD"]

# Reduce
echo '[1, 2, 3, 4]' | 1ls '.reduce((sum, x) => sum + x, 0)'
# Output: 10

# Find
echo '[{"id": 1}, {"id": 2}, {"id": 3}]' | 1ls '.find(x => x.id === 2)'
# Output: {"id": 2}

# Some/Every
echo '[2, 4, 6]' | 1ls '.every(x => x % 2 === 0)'  # true
echo '[1, 2, 3]' | 1ls '.some(x => x > 2)'         # true

# Chaining methods
echo '[1, 2, 3, 4, 5]' | 1ls '.filter(x => x > 2).map(x => x * 2)'
# Output: [6, 8, 10]
```

### Multi-format Support

```bash
# YAML input
echo 'name: John
age: 30
city: NYC' | 1ls '.name'
# Output: "John"

# CSV input
echo 'name,age
John,30
Jane,25' | 1ls '.map(x => x.name)'
# Output: ["John", "Jane"]

# ENV file input
echo 'DATABASE_URL=postgres://localhost/db
PORT=3000
DEBUG=true' | 1ls '.PORT'
# Output: 3000

# NDJSON (Newline-Delimited JSON) - great for logs
echo '{"level":"error","msg":"Failed"}
{"level":"info","msg":"Started"}
{"level":"error","msg":"Timeout"}' | 1ls '.filter(x => x.level === "error")'
# Output: [{"level":"error","msg":"Failed"}, {"level":"error","msg":"Timeout"}]

# Specify input format explicitly
cat data.yaml | 1ls --input-format yaml '.users[0].name'
cat data.csv | 1ls --input-format csv '.filter(x => x.age > 25)'
cat app.env | 1ls --input-format env '.DATABASE_URL'
cat logs.ndjson | 1ls --input-format ndjson '.filter(x => x.level === "error")'
```

**Supported Formats:**
- JSON, JSON5 (JSON with comments/trailing commas)
- YAML, TOML, XML, INI
- CSV, TSV
- ENV files (.env)
- NDJSON (Newline-Delimited JSON for logs)
- JavaScript, TypeScript (with `export default`)
- Plain text, line-by-line

### File Operations

```bash
# Read from file
1ls readFile data.json '.users.filter(x => x.active)'

# List files
1ls --list . --recursive --ext .json

# Grep files
1ls --grep "TODO" --find . --recursive

# With line numbers
1ls --grep "function" --find ./src --line-numbers
```

### Shortcuts

```bash
# Use shortcuts for common operations
echo '[1, 2, 3]' | 1ls '.mp(x => x * 2)'     # Short for .map()
echo '[1, 2, 3]' | 1ls '.flt(x => x > 1)'    # Short for .filter()
echo '["a", "b"]' | 1ls '.jn(",")'           # Short for .join()

# Show all shortcuts
1ls --shortcuts

# Expand shortcuts
1ls --expand ".mp(x => x * 2)"               # Output: .map(x => x * 2)

# Shorten expression
1ls --shorten ".map(x => x * 2)"             # Output: .mp(x => x * 2)
```

## CLI Options

### Basic Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |
| `--interactive` | | Interactive fuzzy search explorer |
| `--raw` | `-r` | Output raw strings, not JSON |
| `--pretty` | `-p` | Pretty print output (default) |
| `--compact` | `-c` | Compact single-line output |
| `--type` | `-t` | Show type of result |
| `--slurp` | `-S` | Read all inputs into an array |
| `--null-input` | `-N` | Use null as input (for generating data) |

### Format Options

| Option | Description | Values |
|--------|-------------|--------|
| `--format` | Output format | `json`, `yaml`, `csv`, `table` |
| `--input-format`, `-if` | Input format | `json`, `yaml`, `toml`, `csv`, `tsv`, `lines`, `text` |

### File Operations

| Option | Short | Description |
|--------|-------|-------------|
| `readFile` | | Read JSON from file |
| `--list` | `-l` | List files in directory |
| `--find` | `-f` | Find files matching pattern |
| `--grep` | `-g` | Search for pattern in files |
| `--recursive` | `-R` | Recursive search |
| `--ignore-case` | `-i` | Case insensitive search |
| `--line-numbers` | `-n` | Show line numbers |
| `--ext` | | Filter by extensions (comma-separated) |
| `--max-depth` | | Maximum depth for recursive operations |

### Shortcut Operations

| Option | Description |
|--------|-------------|
| `--shortcuts` | Show all available shortcuts |
| `--expand` | Expand shortcuts to full syntax |
| `--shorten` | Convert to shortcut syntax |

## API Reference

### Property Access
- `.property` - Access object property
- `["property"]` - Access property with brackets
- `.[index]` - Array index access (negative indexes supported)
- `.[start:end]` - Array slice
- `.[]` - Array spread

### jq-compatible Operators
- `..` - Recursive descent (collect all nested values)
- `.foo?` - Optional access (returns null on error instead of failing)
- `.foo ?? default` - Null coalescing (provide fallback for null/undefined)

```bash
# Recursive descent - get all values from nested structure
echo '{"a": {"b": 1}, "c": [2, 3]}' | 1ls '..'
# Output: [{"a": {"b": 1}, "c": [2, 3]}, {"b": 1}, 1, [2, 3], 2, 3]

# Optional access - safe navigation
echo '{"user": null}' | 1ls '.user?.name'
# Output: null (instead of error)

# Null coalescing - default values
echo '{"name": null}' | 1ls '.name ?? "anonymous"'
# Output: "anonymous"
```

### Object Operations
- `.{keys}` - Get object keys
- `.{values}` - Get object values
- `.{entries}` - Get object entries
- `.{length}` - Get length

### Array Methods
All standard JavaScript array methods are supported:
- `.map()`, `.filter()`, `.reduce()`
- `.find()`, `.findIndex()`
- `.some()`, `.every()`
- `.sort()`, `.reverse()`
- `.slice()`, `.splice()`
- `.join()`, `.split()`
- `.includes()`, `.indexOf()`
- `.flat()`, `.flatMap()`

### String Methods
- `.toLowerCase()`, `.toUpperCase()`
- `.trim()`, `.trimStart()`, `.trimEnd()`
- `.replace()`, `.replaceAll()`
- `.startsWith()`, `.endsWith()`
- `.substring()`, `.charAt()`
- `.match()`, `.split()`

### Builtin Functions (jq-compatible)

**Array Operations:**
- `head()` / `hd()` - First element
- `last()` / `lst()` - Last element
- `tail()` / `tl()` - All but first element
- `take(n)` / `tk(n)` - Take first n elements
- `drop(n)` / `drp(n)` - Drop first n elements
- `uniq()` / `unq()` - Remove duplicates
- `flatten()` / `fltn()` - Flatten nested arrays
- `rev()` - Reverse array
- `chunk(n)` / `chnk(n)` - Split into chunks of size n
- `compact()` / `cmpct()` - Remove falsy values
- `nth(n)` - Get element at index n
- `add()` - Sum numbers or concatenate arrays/strings

**Object Operations:**
- `keys()` / `ks()` - Get object keys
- `vals()` - Get object values
- `pick(k1, k2, ...)` / `pk()` - Pick specific keys
- `omit(k1, k2, ...)` / `omt()` - Omit specific keys
- `merge(obj)` / `mrg()` - Shallow merge objects
- `deepMerge(obj)` / `dMrg()` - Deep merge objects
- `fromPairs()` / `frPrs()` - Convert pairs to object
- `toPairs()` / `toPrs()` - Convert object to pairs
- `has(key)` / `hs()` - Check if key exists
- `pluck(key)` / `plk()` - Extract property from array of objects

**Grouping & Sorting:**
- `groupBy(fn)` / `grpBy()` - Group by key function
- `sortBy(fn)` / `srtBy()` - Sort by key function

**Math & Aggregation:**
- `sum()` - Sum of numbers
- `mean()` / `avg()` - Average of numbers
- `min()` - Minimum value
- `max()` - Maximum value
- `floor()` / `flr()` - Floor number
- `ceil()` / `cl()` - Ceiling number
- `round()` / `rnd()` - Round number
- `abs()` - Absolute value

**String Operations:**
- `split(sep)` / `spl()` - Split string by separator
- `join(sep)` / `jn()` - Join array with separator
- `startswith(s)` / `stw()` - Check if starts with string
- `endswith(s)` / `edw()` - Check if ends with string
- `ltrimstr(s)` / `ltrm()` - Remove prefix
- `rtrimstr(s)` / `rtrm()` - Remove suffix
- `tostring()` / `tstr()` - Convert to string
- `tonumber()` / `tnum()` - Convert to number

**Type & Inspection:**
- `type()` / `typ()` - Get value type
- `len()` - Get length
- `count()` / `cnt()` - Count items
- `isEmpty()` / `emp()` - Check if empty
- `isNil()` / `nil()` - Check if null/undefined
- `contains(val)` / `ctns()` - Check if contains value

**Path Operations:**
- `path()` / `pth()` - Get all paths in structure
- `getpath(path)` / `gpth()` - Get value at path
- `setpath(path)` / `spth()` - Set value at path
- `recurse()` / `rec()` - Recursively collect all values

**Control Flow:**
- `select(fn)` / `sel()` - Filter by predicate (jq-style)
- `empty()` - Return nothing
- `error(msg)` - Throw error
- `debug()` / `dbg()` - Debug output
- `not()` - Boolean negation
- `range(n)` / `rng()` - Generate range [0, n)

**Composition:**
- `pipe(expr1, expr2, ...)` - Apply expressions left-to-right
- `compose(expr1, expr2, ...)` - Apply expressions right-to-left
- `id()` - Identity function

```bash
# Builtin examples
echo '[1, 2, 3, 4, 5]' | 1ls 'head()'      # 1
echo '[1, 2, 3, 4, 5]' | 1ls 'take(3)'     # [1, 2, 3]
echo '[1, 2, 2, 3]' | 1ls 'uniq()'         # [1, 2, 3]
echo '{"a": 1, "b": 2}' | 1ls 'keys()'     # ["a", "b"]
echo '[1, 2, 3]' | 1ls 'sum()'             # 6
echo '"hello"' | 1ls 'split("")'           # ["h", "e", "l", "l", "o"]
echo '42' | 1ls 'type()'                   # "number"
echo 'null' | 1ls 'range(5)'               # [0, 1, 2, 3, 4]
```

### Arrow Functions
Full support for arrow functions in method calls:
```bash
.map(x => x * 2)
.filter((item, index) => index > 0)
.reduce((acc, val) => acc + val, 0)
```

## Advanced Examples

### Complex Data Processing

```bash
# Process API response
curl https://api.github.com/users/github/repos | 1ls \
  '.filter(x => !x.fork)
   .map(x => ({name: x.name, stars: x.stargazers_count}))
   .sort((a, b) => b.stars - a.stars)
   .slice(0, 5)'

# Extract and transform nested data
echo '{
  "users": [
    {"name": "Alice", "posts": [{"title": "Post 1"}, {"title": "Post 2"}]},
    {"name": "Bob", "posts": [{"title": "Post 3"}]}
  ]
}' | 1ls '.users.flatMap(u => u.posts.map(p => ({user: u.name, title: p.title})))'

# Group and aggregate
echo '[
  {"category": "A", "value": 10},
  {"category": "B", "value": 20},
  {"category": "A", "value": 30}
]' | 1ls '.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + item.value;
  return acc;
}, {})'
```

### Working with Files

```bash
# Find all JSON files and extract specific fields
1ls --list ./data --recursive --ext .json | \
  1ls '.map(f => f.path)' | \
  xargs -I {} sh -c 'echo {} && 1ls readFile {} ".version"'

# Search for TODOs in code
1ls --grep "TODO" --find ./src --recursive --line-numbers

# Process multiple CSV files
for file in *.csv; do
  echo "Processing $file"
  cat "$file" | 1ls --input-format csv '.filter(x => x.status === "active")'
done
```

## Environment Variables

- `NO_COLOR` - Disable colored output

## Performance

1ls is built with Bun and optimized for speed:
- Fast JSON parsing and stringification
- Minimal overhead for expression evaluation
- Efficient streaming for large files
- Native binary compilation

## Development

```bash
# Clone the repository
git clone https://github.com/yowainwright/1ls.git
cd 1ls

# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Build binaries
bun run build:binary:all
```

## Contributing

Contributions are welcome! Please check out the [Contributing Guide](CONTRIBUTING.md).

## License

MIT © Jeff Wainwright

## Comparison with Similar Tools

| Feature | 1ls | jq | fx |
|---------|-----|----|----|
| Syntax | JavaScript | DSL | JavaScript |
| Implementation | Bun/TS | C | Go |
| Learning Curve | Easy | Steep | Easy |
| Multi-format | ✓ (12+) | x | ✓ (JSON/YAML/TOML) |
| Auto-detect Format | ✓ | x | x |
| Interactive Mode | ✓ | x | ✓ |
| Shortcuts | ✓ | x | x |
| Arrow Functions | ✓ | x | ✓ |
| File Operations | ✓ | x | x |
| jq Builtins | ✓ | ✓ | x |
| Recursive Descent (`..`) | ✓ | ✓ | x |
| Null Coalescing (`??`) | ✓ | ✓ | x |

<!-- BENCHMARKS:START -->

## Benchmarks

Comparing 1ls with jq and fx across various operations and data sizes.

- **Runs per test:** 5
- **Data sizes:** 1000, 10000, 100000 records
- **Environment:** Docker (debian:bookworm-slim)

### Summary

| Tool | Avg Time (ms) | vs 1ls |
|------|---------------|--------|
| **1ls** | **0.62** | **1x** |
| jq | 103.17 | 166x slower |
| fx | 171.61 | 276x slower |

**1ls is 166x faster than jq and 276x faster than fx on average.**

Lower is better. Times in milliseconds (ms).

### Basic Operations (ms)

| Operation | Size | jq | fx | 1ls |
|-----------|------|----|----|-----|
| First element | 1000 | 21.26 | 7.79 | 0.60 |
| Length | 1000 | 21.26 | 6.91 | 0.53 |
| Last element | 1000 | 46.02 | 7.67 | 0.47 |
| First element | 10000 | 32.22 | 41.50 | 0.47 |
| Length | 10000 | 31.58 | 38.55 | 0.47 |
| Last element | 10000 | 31.16 | 39.53 | 0.50 |
| First element | 100000 | 158.56 | 382.21 | 0.64 |
| Length | 100000 | 188.74 | 351.79 | 0.56 |
| Last element | 100000 | 159.04 | 355.60 | 0.52 |

### Filter & Map (ms)

| Operation | Size | jq | fx | 1ls |
|-----------|------|----|----|-----|
| Filter | 1000 | 20.73 | 9.49 | 0.47 |
| Map | 1000 | 19.28 | 5.89 | 0.43 |
| Filter+Map | 1000 | 19.78 | 6.28 | 0.54 |
| Filter | 10000 | 47.02 | 65.21 | 0.48 |
| Map | 10000 | 34.35 | 44.06 | 0.53 |
| Filter+Map | 10000 | 37.52 | 44.58 | 0.56 |
| Filter | 100000 | 294.43 | 824.56 | 0.68 |
| Map | 100000 | 208.42 | 395.50 | 0.76 |
| Filter+Map | 100000 | 208.05 | 401.71 | 0.54 |

### Aggregation (ms)

| Operation | Size | jq | fx | 1ls |
|-----------|------|----|----|-----|
| Sum | 1000 | 20.90 | 6.21 | 0.59 |
| Min | 1000 | 20.66 | 7.21 | 0.61 |
| Max | 1000 | 20.90 | 7.37 | 0.57 |
| Sum | 10000 | 36.98 | 43.53 | 0.46 |
| Min | 10000 | 35.86 | 44.54 | 0.54 |
| Max | 10000 | 36.44 | 44.45 | 0.71 |
| Sum | 100000 | 227.80 | 397.98 | 0.65 |
| Min | 100000 | 205.29 | 396.93 | 0.50 |
| Max | 100000 | 194.16 | 388.88 | 0.49 |

### Builtin Functions (ms)

| Operation | Size | jq | fx | 1ls |
|-----------|------|----|----|-----|
| head() | 1000 | 19.93 | 6.55 | 0.49 |
| last() | 1000 | 19.88 | 5.92 | 0.46 |
| take(10) | 1000 | 19.97 | 5.62 | 0.44 |
| uniq() | 1000 | 20.79 | 8.34 | 0.42 |
| flatten() | 1000 | 21.53 | 9.90 | 0.46 |
| head() | 10000 | 31.34 | 40.23 | 0.48 |
| last() | 10000 | 31.81 | 38.05 | 0.54 |
| take(10) | 10000 | 31.00 | 37.69 | 0.46 |
| uniq() | 10000 | 47.00 | 61.05 | 0.48 |
| flatten() | 10000 | 52.07 | 88.38 | 0.62 |
| head() | 100000 | 171.62 | 353.11 | 0.49 |
| last() | 100000 | 158.29 | 359.10 | 0.59 |
| take(10) | 100000 | 151.69 | 351.13 | 0.49 |
| uniq() | 100000 | 355.20 | 576.73 | 0.53 |
| flatten() | 100000 | 370.08 | 760.43 | 0.51 |

Run `bun run test:bench` to regenerate benchmarks.

<!-- BENCHMARKS:END -->

## Troubleshooting

### Expression Errors
- Wrap expressions in quotes to prevent shell interpretation
- Use single quotes for expressions containing dollar signs

### Performance
- For large files, use streaming: `cat large.json | 1ls '.property'`
- Use `--compact` for smaller output size

## Links

- [GitHub Repository](https://github.com/yowainwright/1ls)
- [Documentation](https://1ls.dev)
- [Issue Tracker](https://github.com/yowainwright/1ls/issues)

<img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=500dd7ce-0f58-4763-b6a7-fc992b6a12cb" />
