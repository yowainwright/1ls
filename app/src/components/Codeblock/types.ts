export type Language =
  | "json"
  | "yaml"
  | "toml"
  | "javascript"
  | "typescript"
  | "bash"

export interface CodeblockProps {
  code: string
  language?: Language
  className?: string
}
