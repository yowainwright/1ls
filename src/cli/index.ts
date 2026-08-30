import { showHelp } from "./help.ts";
import { readFile } from "../fs/io.ts";
import { expandShortcuts, shortenExpression, getShortcutHelp } from "../shortcuts/index.ts";
import { detectFormat } from "../formats/detect.ts";
import type { CliOptions } from "../types.ts";
import { VERSION } from "../version.ts";
import { processData } from "../executor.ts";
import { parseArgs, processInput, readStdin, resolveReadFileInvocation } from "./utils.ts";

const readDataFile = (filePath: string, options: CliOptions): unknown => {
  if (options.inputFormat) {
    return readFile(filePath, options.inputFormat);
  }

  return readFile(filePath);
};

export function loadData(options: CliOptions, args: string[]): Promise<unknown> | unknown {
  if (options.readFile) {
    const { filePath, expression } = resolveReadFileInvocation(args);
    const data = readDataFile(filePath, options);
    options.expression = expression;
    return data;
  }

  const isStdinAvailable = !process.stdin.isTTY;
  const hasFileOperations = options.list || options.grep;
  const isInputMissing = !isStdinAvailable && !hasFileOperations;

  if (isInputMissing) {
    showHelp();
    process.exit(1);
  }

  if (isStdinAvailable) {
    return processInput(options.inputFormat);
  }

  return null;
}

export function processExpression(options: CliOptions, jsonData: unknown): void {
  try {
    console.log(processData(jsonData, options));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
    process.exit(1);
  }
}

const handleHelpFlags = (options: CliOptions): boolean => {
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    console.log(`1ls version ${VERSION}`);
    process.exit(0);
  }

  if (options.shortcuts) {
    console.log(getShortcutHelp());
    process.exit(0);
  }

  return false;
};

const handleExpressionTools = (options: CliOptions): boolean => {
  if (options.shorten) {
    console.log(shortenExpression(options.shorten));
    process.exit(0);
  }

  if (options.expand) {
    console.log(expandShortcuts(options.expand));
    process.exit(0);
  }

  return false;
};

const handleDetect = async (options: CliOptions): Promise<boolean> => {
  if (!options.detect) return false;

  const isStdinAvailable = !process.stdin.isTTY;
  if (!isStdinAvailable) {
    console.error("Error: --detect requires input from stdin");
    process.exit(1);
  }

  const input = await readStdin();
  const format = detectFormat(input);
  console.log(format);
  process.exit(0);
};

const handleReadFile = (options: CliOptions, args: string[]): boolean => {
  if (!options.readFile) return false;

  const { filePath, expression } = resolveReadFileInvocation(args);
  const data = readDataFile(filePath, options);
  options.expression = expression;
  processExpression(options, data);
  return true;
};

export async function main(args: string[]): Promise<void> {
  const options = parseArgs(args);
  if (handleHelpFlags(options)) return;
  if (handleExpressionTools(options)) return;
  if (await handleDetect(options)) return;
  if (handleReadFile(options, args)) return;

  const jsonData = await loadData(options, args);
  processExpression(options, jsonData);
}
