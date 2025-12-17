import type { CodeExample } from "./types"

export const CODE_EXAMPLES: CodeExample[] = [
  {
    title: "Shortcut Syntax",
    description: "Minified expressions: .fl = .filter, .mp = .map",
    format: "JSON",
    command: "1ls '.fl(x => x.age > 25).mp(x => x.name)'",
    input: `[
  {"name": "Alice", "age": 30},
  {"name": "Bob", "age": 20},
  {"name": "Carol", "age": 28}
]`,
    output: `["Alice", "Carol"]`,
    language: "json",
  },
  {
    title: "JSON Processing",
    description: "Access nested JSON properties with JavaScript syntax",
    format: "JSON",
    command: "1ls '.users[0].name'",
    input: `{
  "users": [
    {
      "name": "Alice",
      "role": "admin"
    }
  ]
}`,
    output: `"Alice"`,
    language: "json",
  },
  {
    title: "YAML Support",
    description: "Parse and query YAML files directly",
    format: "YAML",
    command: "1ls '.database.host'",
    input: `database:
  host: localhost
  port: 5432
  name: myapp`,
    output: `"localhost"`,
    language: "yaml",
  },
  {
    title: "CSV Transformation",
    description: "Filter and transform CSV data",
    format: "CSV",
    command: "1ls '.filter(x => x.age > 25).map(x => x.name)'",
    input: `name,age
Alice,30
Bob,20
Carol,28`,
    output: `["Alice", "Carol"]`,
    language: "csv",
  },
  {
    title: "TypeScript/JavaScript",
    description: "Process exported data from TS/JS files",
    format: "TypeScript",
    command: "1ls '.dependencies.react'",
    input: `export default {
  "name": "my-app",
  "dependencies": {
    "react": "^18.0.0"
  }
}`,
    output: `"^18.0.0"`,
    language: "typescript",
  },
  {
    title: "Plain Text",
    description: "Process text files line by line",
    format: "Text",
    command: "1ls '.filter(x => x.includes(\"TODO\"))'",
    input: `TODO: Fix bug
DONE: Feature complete
TODO: Add tests
IN PROGRESS: Refactor`,
    output: `["TODO: Fix bug", "TODO: Add tests"]`,
    language: "text",
  },
]
