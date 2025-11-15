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
import { expandShortcuts } from "../utils/shortcuts";
import type { State } from "./types";

const cleanup = (): void => {
  showCursor();
  disableRawMode();
  clearScreen();
};


const handleError = (error: Error): void => {
  cleanup();
  const errorPrefix = colorize("Error: ", colors.yellow);
  const errorMessage = error.message;
  const newline = "\n";
  const fullMessage = errorPrefix.concat(errorMessage, newline);
  stdout.write(fullMessage);
  exit(1);
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
  const paths = navigateJson(data);

  const hasPaths = paths.length > 0;
  if (!hasPaths) {
    const message = colorize("No paths found in data\n", colors.yellow);
    stdout.write(message);
    exit(1);
  }

  const initialState = createInitialState(paths, data);

  enableRawMode();
  hideCursor();
  render(initialState);

  try {
    const expressionString = await runEventLoop(initialState);
    cleanup();

    const hasExpression = expressionString !== null;
    if (hasExpression) {
      try {
        stdout.write(colorize("\nExpression: " + expressionString + "\n\n", colors.dim));

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
    handleError(error as Error);
  }
};
