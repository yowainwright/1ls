import { unlinkSync, existsSync, writeFileSync } from "fs";
import { spawnSync } from "child_process";
import { complete } from "./completion";
import { openTty, closeTty, render, hide, resetSelection, selectNext, selectPrev, getSelectedIndex, renderPreview } from "./renderer";
import { FIFO_PATH, RESPONSE_PATH } from "./constants";
import { readFile } from "../file";
import { Lexer } from "../lexer";
import { ExpressionParser } from "../expression";
import { JsonNavigator } from "../navigator/json";
import { expandShortcuts } from "../shortcuts";

export interface Message {
  input: string;
  tty?: string;
  action?: "complete" | "hide" | "next" | "prev" | "preview";
  file?: string;
  expr?: string;
}

export const createFifo = (path: string): boolean => {
  const result = spawnSync("mkfifo", [path]);
  return result.status === 0;
};

export const cleanup = (): void => {
  closeTty();

  const fifoExists = existsSync(FIFO_PATH);
  if (fifoExists) {
    unlinkSync(FIFO_PATH);
  }

  const responseExists = existsSync(RESPONSE_PATH);
  if (responseExists) {
    unlinkSync(RESPONSE_PATH);
  }
};

export const parseMessage = (raw: string): Message | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const isJson = trimmed.startsWith("{");
  if (isJson) {
    try {
      return JSON.parse(trimmed) as Message;
    } catch {
      return { input: trimmed };
    }
  }

  return { input: trimmed };
};

let lastSuggestions: ReturnType<typeof complete>["suggestions"] = [];

const writeResponseWithSelected = (): void => {
  const selectedIdx = getSelectedIndex();
  const selected = lastSuggestions[selectedIdx];
  const response = {
    suggestions: lastSuggestions,
    selected: selected?.signature || "",
  };
  writeFileSync(RESPONSE_PATH, JSON.stringify(response));
};

const evaluateExpression = async (filePath: string, expr: string): Promise<unknown> => {
  const data = await readFile(filePath);
  const expandedExpr = expandShortcuts(expr);
  const lexer = new Lexer(expandedExpr);
  const tokens = lexer.tokenize();
  const parser = new ExpressionParser(tokens);
  const ast = parser.parse();
  const navigator = new JsonNavigator({ strict: false });
  return navigator.evaluate(ast, data);
};

const handlePreview = async (msg: Message): Promise<void> => {
  const hasFileAndExpr = msg.file && msg.expr;
  if (!hasFileAndExpr) return;

  try {
    const result = await evaluateExpression(msg.file!, msg.expr!);
    renderPreview(result);
  } catch {
    hide();
  }
};

export const handleMessage = async (msg: Message): Promise<void> => {
  if (msg.tty) {
    openTty(msg.tty);
  }

  const isHideAction = msg.action === "hide";
  if (isHideAction) {
    hide();
    lastSuggestions = [];
    return;
  }

  const isPreviewAction = msg.action === "preview";
  if (isPreviewAction) {
    await handlePreview(msg);
    return;
  }

  const isNextAction = msg.action === "next";
  if (isNextAction && lastSuggestions.length > 0) {
    selectNext();
    const idx = getSelectedIndex();
    const wrappedIdx = idx % lastSuggestions.length;
    if (idx !== wrappedIdx) resetSelection();
    render(lastSuggestions);
    writeResponseWithSelected();
    return;
  }

  const isPrevAction = msg.action === "prev";
  if (isPrevAction && lastSuggestions.length > 0) {
    selectPrev();
    render(lastSuggestions);
    writeResponseWithSelected();
    return;
  }

  const result = complete(msg.input);
  lastSuggestions = result.suggestions;

  const hasSuggestions = result.suggestions.length > 0;
  if (hasSuggestions) {
    resetSelection();
    render(result.suggestions);
    writeResponseWithSelected();
  } else {
    hide();
    writeFileSync(RESPONSE_PATH, JSON.stringify({ suggestions: [], selected: "" }));
  }
};

export const processLines = async (lines: string[]): Promise<void> => {
  for (const line of lines) {
    const msg = parseMessage(line);
    if (msg) await handleMessage(msg);
  }
};

export const startServer = async (): Promise<void> => {
  cleanup();

  const created = createFifo(FIFO_PATH);
  if (!created) {
    throw new Error(`Failed to create FIFO at ${FIFO_PATH}`);
  }

  console.log(`1ls daemon listening on ${FIFO_PATH}`);

  const file = Bun.file(FIFO_PATH);

  while (true) {
    const stream = file.stream();
    const reader = stream.getReader();

    try {
      const { value, done } = await reader.read();
      const isDone = done || !value;
      if (isDone) continue;

      const raw = new TextDecoder().decode(value);
      const nonEmpty = (line: string): boolean => line.length > 0;
      const lines = raw.split("\n").filter(nonEmpty);

      await processLines(lines);
    } finally {
      reader.releaseLock();
    }
  }
};

export const stopServer = (): void => {
  cleanup();
};
