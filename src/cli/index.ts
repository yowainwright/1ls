import { showHelp } from "./help";
import { readFile, listFiles, grep } from "../fs/index";
import { Formatter } from "../fmt";
import { warning, info, setColorEnabled } from "../dx";
import { expandShortcuts, shortenExpression, getShortcutHelp } from "../shortcuts/index";
import { detectFormat } from "../formats/detect";
import type { CliOptions } from "../types";
import { VERSION } from "../version";
import { processData } from "../executor";
import { parseArgs, processInput, readStdin, resolveReadFileInvocation } from "./utils";

export const getDaemon = () => import("../tooltip/index");

export function handleGrepOperation(options: CliOptions): void {
  const results = grep(options.grep!, options.find!, {
    recursive: options.recursive,
    ignoreCase: options.ignoreCase,
    showLineNumbers: options.showLineNumbers,
  });

  if (results.length === 0) {
    console.log(warning("No matches found"));
    return;
  }

  for (const result of results) {
    const location = `${info(result.file)}:${result.line}:${result.column}`;
    const output = options.showLineNumbers
      ? `${location}: ${result.match}`
      : `${info(result.file)}: ${result.match}`;
    console.log(output);
  }
}

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

const handleDaemon = async (options: CliOptions): Promise<boolean> => {
  if (!options.daemon) return false;

  const { startDaemon } = await getDaemon();
  await startDaemon();
  return true;
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

const handleList = (options: CliOptions): boolean => {
  if (!options.list) return false;

  const files = listFiles(options.list, {
    recursive: options.recursive,
    extensions: options.extensions,
    maxDepth: options.maxDepth,
  });
  console.log(new Formatter(options).format(files));
  return true;
};

const handleReadFile = (options: CliOptions, args: string[]): boolean => {
  if (!options.readFile) return false;

  const { filePath, expression } = resolveReadFileInvocation(args);
  const data = readDataFile(filePath, options);
  options.expression = expression;
  processExpression(options, data);
  return true;
};

const handleGrep = (options: CliOptions): boolean => {
  const hasGrepQuery = options.grep !== undefined;
  const hasFindPattern = options.find !== undefined;
  const hasGrepOperation = hasGrepQuery && hasFindPattern;
  if (!hasGrepOperation) return false;

  handleGrepOperation(options);
  return true;
};

export async function main(args: string[]): Promise<void> {
  setColorEnabled(!process.env.NO_COLOR);
  const options = parseArgs(args);
  if (handleHelpFlags(options)) return;
  if (await handleDaemon(options)) return;
  if (handleExpressionTools(options)) return;
  if (await handleDetect(options)) return;
  if (handleList(options)) return;
  if (handleGrep(options)) return;
  if (handleReadFile(options, args)) return;

  const jsonData = await loadData(options, args);
  processExpression(options, jsonData);
}

if (import.meta.main) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
    process.exit(1);
  });
}
