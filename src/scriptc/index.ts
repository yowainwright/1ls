#!/usr/bin/env node

import { showHelp } from "../cli/help";
import { readFile } from "../fs/io";
import { expandShortcuts, shortenExpression, getShortcutHelp } from "../shortcuts/index";
import { detectFormat } from "../formats/detect";
import type { CliOptions } from "../types";
import { VERSION } from "../version";
import { processData } from "../executor";
import { parseArgs, processInput, readStdin, resolveReadFileInvocation } from "../cli/utils";

const readDataFile = (filePath: string, options: CliOptions): unknown => {
  if (options.inputFormat) return readFile(filePath, options.inputFormat);
  return readFile(filePath);
};

const processExpression = (options: CliOptions, data: unknown): void => {
  try {
    console.log(processData(data, options));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
    process.exit(1);
  }
};

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
  console.log(detectFormat(input));
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

const loadData = (options: CliOptions, args: string[]): Promise<unknown> | unknown => {
  if (options.readFile) {
    const { filePath, expression } = resolveReadFileInvocation(args);
    options.expression = expression;
    return readDataFile(filePath, options);
  }

  if (!process.stdin.isTTY) return processInput(options.inputFormat);

  showHelp();
  process.exit(1);
};

export const main = async (args: string[]): Promise<void> => {
  const options = parseArgs(args);
  if (handleHelpFlags(options)) return;
  if (handleExpressionTools(options)) return;
  if (await handleDetect(options)) return;
  if (handleReadFile(options, args)) return;

  const data = await loadData(options, args);
  processExpression(options, data);
};

await main(process.argv.slice(2));
