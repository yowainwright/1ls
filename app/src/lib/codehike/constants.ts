export const MAX_TRANSITION_DURATION = 900

export const THEMES = [
  "github-dark",
  "github-light",
  "dracula",
  "nord",
  "monokai",
  "one-dark-pro",
] as const

export const ANNOTATION_CLASSES = {
  mark: "bg-primary/20 border-l-2 border-primary",
  callout: "bg-card/90 border border-border rounded-md p-2",
  diffAdd: "bg-green-900/30 border-l-2 border-green-500",
  diffRemove: "bg-red-900/30 border-l-2 border-red-500",
  focus: "opacity-100",
  unfocus: "opacity-40",
}

export const COMPONENT_CLASSES = {
  codeBlock: "border border-border rounded-lg shadow-sm overflow-hidden my-4",
  pre: "overflow-x-auto p-4 text-sm bg-[#0d1117]",
  lineNumbers: "select-none text-muted-foreground pr-4 text-right",
  copyButton: "absolute right-2 top-2 rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/80",
}
