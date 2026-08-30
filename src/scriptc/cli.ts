import { readFileSync } from "node:fs";
import { VERSION } from "../version.ts";

const HELP_TEXT = `1ls - scriptc native data query

Usage:
  1ls [expression]
  1ls readFile <path> [expression]
  1ls rf <path> [expression]

Options:
  -h, --help       Show this help message
  -v, --version    Show version number
  -r, --raw        Output raw strings without quotes

Examples:
  echo '{"name":"Ada"}' | 1ls .name
  1ls readFile data.json .user.name
`;

const isReadFileCommand = (arg: string): boolean => arg === "readFile" || arg === "rf";

const isHelpFlag = (arg: string): boolean => arg === "--help" || arg === "-h";

const isVersionFlag = (arg: string): boolean => arg === "--version" || arg === "-v";

const isRawFlag = (arg: string): boolean => arg === "--raw" || arg === "-r";

const hasFlag = (args: string[], predicate: (arg: string) => boolean): boolean => {
  let index = 0;
  while (index < args.length) {
    if (predicate(args[index])) return true;
    index++;
  }
  return false;
};

const getExpression = (args: string[]): string => {
  let index = 0;
  while (index < args.length) {
    const arg = args[index];
    if (arg.startsWith(".")) return arg;
    index++;
  }
  return ".";
};

const getNextArg = (args: string[], index: number): string => {
  const nextIndex = index + 1;
  return args[nextIndex] ?? "";
};

const getReadFilePath = (args: string[]): string => {
  let index = 0;
  while (index < args.length) {
    if (isReadFileCommand(args[index])) return getNextArg(args, index);
    index++;
  }
  return "";
};

const getInput = (args: string[]): string => {
  const filePath = getReadFilePath(args);
  if (filePath.length > 0) return readFileSync(filePath, "utf8");
  return readFileSync(0, "utf8");
};

const readProperty = (value: any, key: string): any => {
  if (value === null) return undefined;
  if (value === undefined) return undefined;
  return value[key];
};

const readIndex = (value: any, indexText: string): any => {
  if (value === null) return undefined;
  if (value === undefined) return undefined;
  const index = Number(indexText);
  return value[index];
};

const evaluateSegment = (value: any, segment: string): any => {
  const bracketStart = segment.indexOf("[");
  if (bracketStart === -1) return readProperty(value, segment);

  const rest = segment.slice(bracketStart);
  const bracketEnd = rest.indexOf("]") + bracketStart;
  const key = segment.slice(0, bracketStart);
  const indexText = segment.slice(bracketStart + 1, bracketEnd);
  const target = key.length === 0 ? value : readProperty(value, key);
  return readIndex(target, indexText);
};

const evaluatePath = (value: any, expression: string): any => {
  if (expression === ".") return value;

  const path = expression.startsWith(".") ? expression.slice(1) : expression;
  const segments = path.split(".");
  let current = value;
  let index = 0;

  while (index < segments.length) {
    current = evaluateSegment(current, segments[index]);
    index++;
  }

  return current;
};

const formatJson = (value: any): string => {
  if (value === undefined) return "undefined";
  return JSON.stringify(value);
};

const formatRaw = (value: any): string => {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const run = (args: string[]): void => {
  if (hasFlag(args, isHelpFlag)) {
    console.log(HELP_TEXT);
    return;
  }

  if (hasFlag(args, isVersionFlag)) {
    console.log(`1ls version ${VERSION}`);
    return;
  }

  const input = getInput(args);
  const data = JSON.parse(input);
  const expression = getExpression(args);
  const result = evaluatePath(data, expression);
  const rawOutput = hasFlag(args, isRawFlag);
  const output = rawOutput ? formatRaw(result) : formatJson(result);
  console.log(output);
};

run(process.argv.slice(2));
