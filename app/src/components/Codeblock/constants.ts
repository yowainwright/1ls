import type { Language } from "./types";

export const THEME = "dracula" as const;

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
] as const;

export const CODEBLOCK_CLASSES = {
  wrapper: "shiki-wrapper group relative my-6 rounded-lg border border-border/10 overflow-hidden",
  languageBadge:
    "absolute top-3 left-3 z-10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide rounded bg-white/10 text-muted-foreground/70 border-transparent",
};
