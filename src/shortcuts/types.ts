export interface ShortcutMapping {
  short: string;
  full: string;
  description: string;
  type: "array" | "object" | "string" | "any" | "builtin";
}
