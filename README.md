# 1ls

[![CI](https://github.com/yowainwright/1ls/actions/workflows/ci.yml/badge.svg)](https://github.com/yowainwright/1ls/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/yowainwright/1ls/branch/main/graph/badge.svg)](https://codecov.io/gh/yowainwright/1ls)
[![npm version](https://img.shields.io/npm/v/1ls.svg)](https://www.npmjs.com/package/1ls)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-repo-blue)](https://github.com/yowainwright/1ls)

> One-line script

A 0 dependency, lightweight, fast data processor with familiar JavaScript syntax.

This is useful for writing 1ls, one-line scripts, in the terminal or for short scripts 
that are as concise as possible in a familiar syntax, JavaScript, with dot notation, 
fuzzy matching, and shortening capabilities for maximum efficiency.

On top of that, the library is very small because it has no dependencies. 
And, it is compiled with QuickJs for binary builds.
This means you get good speed compared to jq and fx but it's still, just JS, 
the language y'all know.

## Why 1ls?

- **JavaScript Syntax**: Use familiar JavaScript array methods and syntax instead of learning jq's DSL
- **Multi-format**: Works with JSON, JSON5, YAML, TOML, XML, INI, CSV, TSV, ENV, NDJSON, JavaScript, TypeScript, and more
- **Fast**: Built for speed; no deps, compiled by Bun
- **Intuitive**: Property access with dot notation, just like JavaScript
- **Powerful**: Full support for array methods, arrow functions, and object operations
- **Shortcuts**: Built-in shortcuts for common operations (e.g., `.mp` for `.map`)

## Installation

```bash
# Using bun (or npm, pnpm, etc)
# works in the commandline or the web
bun add -g 1ls

# Or via binaries. here you get a QuickJs build
# Using Homebrew (macOS/Linux)
brew install yowainwright/1ls/1ls
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
| Performance | ⚡ Fast (Bun) | ⚡ Fast | 🚀 Good |
| Learning Curve | Easy | Steep | Easy |
| Multi-format | ✓ | x | x |
| Interactive Mode | ✓ | x | ✓ |
| Shortcuts | ✓ | x | x |
| Arrow Functions | ✓ | x | ✓ |
| File Operations | ✓ | x | x |

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
