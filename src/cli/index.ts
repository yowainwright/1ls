#!/usr/bin/env bun

import { parseArgs } from "./parser";
import { showHelp } from "./help";
import { processInput } from "../utils/stream";
import { readFile, listFiles, grep } from "../utils/file";
import { Lexer } from "../lexer";
import { ExpressionParser } from "../expression";
import { JsonNavigator } from "../navigator/json";
import { Formatter } from "../formatter/output";
import { warning, info } from "../formatter/colors";
import {
  expandShortcuts,
  shortenExpression,
  getShortcutHelp,
} from "../utils/shortcuts";
import { CliOptions } from "../types";

async function handleInfoCommands(options: CliOptions): Promise<boolean> {
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    const packageJson = await Bun.file("package.json").json();
    console.log(`1ls version ${packageJson.version}`);
    process.exit(0);
  }

  return false;
}

async function handleShortcutCommands(options: CliOptions): Promise<boolean> {
  if (options.shortcuts) {
    console.log(getShortcutHelp());
    process.exit(0);
  }

  if (options.shorten) {
    const shortened = shortenExpression(options.shorten);
    console.log(shortened);
    process.exit(0);
  }

  if (options.expand) {
    const expanded = expandShortcuts(options.expand);
    console.log(expanded);
    process.exit(0);
  }

  return false;
}

async function handleFileOperations(options: CliOptions): Promise<boolean> {
  if (options.list) {
    const files = await listFiles(options.list, {
      recursive: options.recursive,
      extensions: options.extensions,
      maxDepth: options.maxDepth,
    });
    const formatter = new Formatter(options);
    console.log(formatter.format(files));
    return true;
  }

  const hasGrepOperation = options.grep && options.find;
  if (hasGrepOperation) {
    await handleGrepOperation(options);
    return true;
  }

  return false;
}

async function handleGrepOperation(options: CliOptions): Promise<void> {
  const results = await grep(options.grep!, options.find!, {
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

async function loadData(options: CliOptions, args: string[]): Promise<any> {
  if (options.readFile) {
    const filePath = args[args.indexOf("readFile") + 1];
    const data = await readFile(filePath);
    options.expression = args[args.indexOf("readFile") + 2] || ".";
    return data;
  }

  const isStdinAvailable = !process.stdin.isTTY;
  const hasFileOperations = options.list || options.grep;
  const hasNoInput = !isStdinAvailable && !hasFileOperations;

  if (hasNoInput) {
    showHelp();
    process.exit(1);
  }

  if (isStdinAvailable) {
    return await processInput(options.inputFormat);
  }

  return null;
}

async function processExpression(
  options: CliOptions,
  jsonData: any,
): Promise<void> {
  if (!options.expression) {
    const formatter = new Formatter(options);
    console.log(formatter.format(jsonData));
    return;
  }

  try {
    const expandedExpression = expandShortcuts(options.expression);
    const lexer = new Lexer(expandedExpression);
    const tokens = lexer.tokenize();

    const parser = new ExpressionParser(tokens);
    const ast = parser.parse();

    const navigator = new JsonNavigator();
    const result = navigator.evaluate(ast, jsonData);

    const formatter = new Formatter(options);
    console.log(formatter.format(result));
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

export async function main(args: string[]): Promise<void> {
  const options = parseArgs(args);

  await handleInfoCommands(options);
  await handleShortcutCommands(options);

  const fileHandled = await handleFileOperations(options);
  if (fileHandled) return;

  const jsonData = await loadData(options, args);
  await processExpression(options, jsonData);
}

if (import.meta.main) {
  main(process.argv.slice(2)).catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
