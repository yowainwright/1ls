export interface TerminalExample {
  title: string
  description: string
  command: string
  input: string
  output?: string
}

export interface TerminalDemoProps {
  example: TerminalExample
}
