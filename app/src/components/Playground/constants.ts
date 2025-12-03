import type { Format, FormatConfig } from "./types"

export const FORMAT_CONFIGS: Record<Format, FormatConfig> = {
  json: {
    label: "JSON",
    language: "json",
    placeholder: `{
  "users": [
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 }
  ]
}`,
  },
  yaml: {
    label: "YAML",
    language: "yaml",
    placeholder: `users:
  - name: Alice
    age: 30
  - name: Bob
    age: 25`,
  },
  csv: {
    label: "CSV",
    language: "csv",
    placeholder: `name,age
Alice,30
Bob,25`,
  },
  toml: {
    label: "TOML",
    language: "toml",
    placeholder: `[database]
host = "localhost"
port = 5432`,
  },
  text: {
    label: "Text",
    language: "text",
    placeholder: `Line one
Line two
Line three`,
  },
}

export const DEFAULT_EXPRESSION = ".users.filter(u => u.age > 25).map(u => u.name)"

export const FORMATS: Format[] = ["json", "yaml", "csv", "toml", "text"]
