export type Language =
  | "json"
  | "yaml"
  | "toml"
  | "javascript"
  | "typescript"
  | "bash"
  | "shell"
  | "diff"

export interface CodeblockProps {
  code: string
  language?: Language
  className?: string
  showLineNumbers?: boolean
  showLanguage?: boolean
  showCopy?: boolean
  title?: string
}
