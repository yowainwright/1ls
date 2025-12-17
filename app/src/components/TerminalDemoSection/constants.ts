import type { TerminalExample } from "./types"

export const TERMINAL_EXAMPLES: TerminalExample[] = [
  {
    title: "Shortcut Syntax",
    description: "Minified expressions for faster typing",
    command: ".fl(x => x.age > 25).mp(x => x.name)",
    input: '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 20}]',
    output: '["Alice"]',
  },
  {
    title: "JSON Processing",
    description: "Access nested JSON properties with dot notation",
    command: ".users[0].name",
    input: '{"users": [{"name": "Alice", "role": "admin"}]}',
    output: '"Alice"',
  },
  {
    title: "YAML Support",
    description: "Parse and query YAML files directly",
    command: ".database.host",
    input: 'database:\n  host: localhost\n  port: 5432',
    output: '"localhost"',
  },
  {
    title: "CSV Transformation",
    description: "Filter and transform CSV data",
    command: ".filter(x => x.age > 25).map(x => x.name)",
    input: 'name,age\nAlice,30\nBob,20\nCarol,28',
    output: '["Alice", "Carol"]',
  },
  {
    title: "TypeScript/JavaScript",
    description: "Process exported data from TS/JS files",
    command: ".dependencies.react",
    input: 'export default {\n  "name": "my-app",\n  "dependencies": {\n    "react": "^18.0.0"\n  }\n}',
    output: '"^18.0.0"',
  },
  {
    title: "Plain Text Lines",
    description: "Process text files line by line",
    command: ".filter(x => x.includes(\"TODO\"))",
    input: 'TODO: Fix bug\nDONE: Feature complete\nTODO: Add tests',
    output: '["TODO: Fix bug", "TODO: Add tests"]',
  },
  {
    title: "ENV Files",
    description: "Query environment variables from .env files",
    command: ".DATABASE_URL",
    input: 'DATABASE_URL=postgres://localhost/db\nPORT=3000\nDEBUG=true',
    output: '"postgres://localhost/db"',
  },
]

export const SANDPACK_OPTIONS = {
  showNavigator: false,
  showTabs: false,
  showLineNumbers: true,
  editorHeight: 150,
  readOnly: true,
}
