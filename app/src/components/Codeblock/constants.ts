import type { Language } from "./types"

export const THEME = "dracula" as const

export const LANGUAGES: readonly Language[] = [
  "json",
  "yaml",
  "toml",
  "javascript",
  "typescript",
  "bash",
] as const

export const CODEBLOCK_CLASSES = {
  container: "rounded-lg border border-border/10 overflow-hidden shadow-sm",
  pre: "overflow-x-auto p-4 text-sm",
}
