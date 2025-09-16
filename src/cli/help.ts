export function showHelp(): void {
  console.log(`
1ls - 1 line script for JSON manipulation and file operations

Usage:
  echo '{"key": "value"}' | 1ls [expression] [options]
  1ls readFile <file> [expression] [options]
  1ls --list <dir> [options]
  1ls --grep <pattern> --find <path> [options]

JSON Expressions:
  .key                    Access property
  .user.email            Nested properties
  .["complex-key"]       Bracket notation
  .users[]               All array elements
  .users[0]              Array index
  .users[-1]             Negative index
  .users[0:3]            Array slice
  .obj.{keys}            Object keys
  .obj.{values}          Object values
  .obj.{entries}         Object entries

JavaScript Methods:
  .users.map(u => u.name)
  .users.filter(u => u.active)
  .email.includes('@gmail.com')
  .name.toLowerCase()

Shorthand Methods (use --shortcuts for full list):
  .mp(x => x * 2)         # Short for .map()
  .flt(x => x > 5)        # Short for .filter()
  .kys                    # Short for .{keys}
  .lc()                   # Short for .toLowerCase()

File Operations:
  -l, --list <dir>       List files in directory
  -g, --grep <pattern>   Search for pattern in files
  -f, --find <path>      Path to search in
  -R, --recursive        Recursive search
  -i, --ignore-case      Case insensitive search
  -n, --line-numbers     Show line numbers
  --ext <exts>           Filter by extensions (comma-separated)
  --max-depth <n>        Maximum recursion depth

Output Options:
  -r, --raw              Raw output (no formatting)
  -p, --pretty           Pretty print JSON
  -c, --compact          Compact JSON
  -t, --type             Show value type info
  --format <type>        Output format (json|yaml|csv|table)
  -h, --help             Show help
  -v, --version          Show version

Shorthand Options:
  --shortcuts            Show all available shortcuts
  --shorten <expr>       Convert expression to shorthand
  --expand <expr>        Convert shorthand to full form

Examples:
  # JSON manipulation
  echo '{"name": "John"}' | 1ls .name
  1ls readFile package.json .version
  echo '[1,2,3]' | 1ls '.map(x => x * 2)'

  # File operations
  1ls --list . --recursive --ext js,ts
  1ls --grep "TODO" --find src --recursive
  1ls --list src --format table

  # Shorthand operations
  echo '[1,2,3]' | 1ls '.mp(x => x * 2)'  # Using shortcuts
  1ls --shorten ".map(x => x * 2)"        # Convert to shorthand
  1ls --expand ".mp(x => x * 2)"          # Convert to full form
  1ls --shortcuts                          # Show all shortcuts
  `);
}
