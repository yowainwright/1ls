import { stdin, stdout, exit } from "process";
import { navigateJson } from "./navigator";
import { createInitialState } from "./state";
import { render } from "./renderer";
import { handleInput } from "./input";
import {
  clearScreen,
  hideCursor,
  showCursor,
  enableRawMode,
  disableRawMode,
  colors,
  colorize,
} from "./terminal";
import { Lexer } from "../lexer";
import { ExpressionParser } from "../expression";
import { JsonNavigator } from "../navigator/json";
import { expandShortcuts } from "../shortcuts";
import type { State } from "./types";

let isRawModeEnabled = false;

const cleanup = (): void => {
  if (isRawModeEnabled) {
    showCursor();
    disableRawMode();
    isRawModeEnabled = false;
  }
  clearScreen();
};

const handleFatalError = (error: unknown): void => {
  cleanup();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const output = colorize(`Fatal error: ${errorMessage}\n`, colors.yellow);
  stdout.write(output);
  exit(1);
};

const setupErrorBoundary = (): void => {
  process.on("uncaughtException", handleFatalError);
  process.on("unhandledRejection", handleFatalError);
  process.on("SIGINT", () => {
    cleanup();
    exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    exit(0);
  });
};

const processInput = (
  state: State,
  data: Buffer,
): { state: State | null; output: string | null } => {
  const result = handleInput(state, data);
  return result;
};

const runEventLoop = async (initialState: State): Promise<string | null> => {
  let state = initialState;

  return new Promise((resolve) => {
    const onData = (data: Buffer): void => {
      const { state: newState, output } = processInput(state, data);

      const hasOutput = output !== null;
      if (hasOutput) {
        stdin.off("data", onData);
        resolve(output);
        return;
      }

      const shouldExit = newState === null;
      if (shouldExit) {
        stdin.off("data", onData);
        resolve(null);
        return;
      }

      state = newState;
      render(state);
    };

    stdin.on("data", onData);
  });
};

export const runInteractive = async (data: unknown): Promise<void> => {
  setupErrorBoundary();

  const paths = navigateJson(data);

  const hasPaths = paths.length > 0;
  if (!hasPaths) {
    const message = colorize("No paths found in data\n", colors.yellow);
    stdout.write(message);
    exit(1);
  }

  const initialState = createInitialState(paths, data);

  enableRawMode();
  isRawModeEnabled = true;
  hideCursor();
  render(initialState);

  try {
    const expressionString = await runEventLoop(initialState);
    cleanup();

    const hasExpression = expressionString !== null;
    if (hasExpression) {
      try {
        const expandedExpression = expandShortcuts(expressionString);
        const lexer = new Lexer(expandedExpression);
        const tokens = lexer.tokenize();

        const parser = new ExpressionParser(tokens);
        const ast = parser.parse();

        const navigator = new JsonNavigator();
        const result = navigator.evaluate(ast, data);

        const output = JSON.stringify(result, null, 2);
        stdout.write(output);
        stdout.write("\n");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        stdout.write(colorize("Error: " + message + "\n", colors.yellow));
      }
    }

    exit(0);
  } catch (error) {
    handleFatalError(error);
  }
};
