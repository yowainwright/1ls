import { stdin, stdout, exit } from "process";
import { navigateJson } from "./navigator";
import { createInitialState } from "./state";
import { render, resetRenderState } from "./renderer";
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
import type { State } from "./types";
import { appendFileSync } from "fs";
import { evaluateAndFormatExpression } from "../executor";
import type { CliOptions } from "../types";

const DEBUG_INTERACTIVE = process.env.ONE_LS_DEBUG === "1";

const debug = (msg: string): void => {
  if (!DEBUG_INTERACTIVE) {
    return;
  }

  appendFileSync("/tmp/1ls-debug.log", msg + "\n");
};

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

const handleTerminationSignal = (): void => {
  cleanup();
  exit(0);
};

let isErrorBoundarySetup = false;

export const teardownErrorBoundary = (): void => {
  process.off("uncaughtException", handleFatalError);
  process.off("unhandledRejection", handleFatalError);
  process.off("SIGINT", handleTerminationSignal);
  process.off("SIGTERM", handleTerminationSignal);
  isErrorBoundarySetup = false;
};

export const setupErrorBoundary = (): void => {
  if (isErrorBoundarySetup) return;

  process.once("uncaughtException", handleFatalError);
  process.once("unhandledRejection", handleFatalError);
  process.once("SIGINT", handleTerminationSignal);
  process.once("SIGTERM", handleTerminationSignal);
  isErrorBoundarySetup = true;
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
  debug("runEventLoop started");

  return new Promise((resolve) => {
    const onData = (data: Buffer): void => {
      debug(`onData received: ${JSON.stringify(data.toString())}`);
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
      debug(`state.query is now: "${state.query}"`);
      render(state);
    };

    stdin.on("data", onData);
  });
};

export const runInteractive = async (data: unknown, options: CliOptions): Promise<void> => {
  setupErrorBoundary();
  resetRenderState();

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
        const output = evaluateAndFormatExpression(expressionString, data, options);
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
