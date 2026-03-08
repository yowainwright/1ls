import type { ReactNode } from "react";

export interface CodeCardProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
}

export type Language =
  | "json"
  | "yaml"
  | "toml"
  | "javascript"
  | "typescript"
  | "bash"
  | "shell"
  | "diff"
  | "csv";

export interface CodeblockProps {
  code: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  showLanguage?: boolean;
  showCopy?: boolean;
  title?: string;
}
