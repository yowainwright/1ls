import type { Language } from "./types"

export const THEME = "dracula" as const

export const LANGUAGES: readonly Language[] = [
  "json",
  "yaml",
  "toml",
  "javascript",
  "typescript",
  "bash",
  "shell",
  "diff",
  "csv",
] as const

export const CODEBLOCK_CLASSES = {
  wrapper: "shiki-wrapper group relative my-6 rounded-lg border border-border/10 overflow-hidden",
  languageBadge: "absolute top-3 left-3 z-10 px-2 py-1 text-xs font-mono font-semibold uppercase tracking-wide rounded bg-white/10 text-muted-foreground border border-white/10",
}
