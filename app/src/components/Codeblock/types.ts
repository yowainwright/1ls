export type Language =
  | "json"
  | "yaml"
  | "toml"
  | "javascript"
  | "typescript"
  | "bash"
  | "shell"
  | "diff"
  | "csv"

export interface CodeblockProps {
  code: string
  language?: Language
  className?: string
  showLineNumbers?: boolean
  showLanguage?: boolean
  showCopy?: boolean
  title?: string
}
