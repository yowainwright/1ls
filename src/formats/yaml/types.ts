export interface StackFrame {
  container: Record<string, unknown> | unknown[];
  indent: number;
  pendingKey?: string;
}

export interface AnchorStore {
  [key: string]: unknown;
}
