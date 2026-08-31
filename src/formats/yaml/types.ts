export interface StackFrame {
  container: Record<string, unknown> | unknown[];
  indent: number;
  pendingKey: string | null;
  parentKey: string | number | null;
}

export interface AnchorStore {
  [key: string]: unknown;
}
