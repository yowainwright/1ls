import { BUILTIN_FUNCTIONS } from "../navigator/builtins/constants.ts";
import { BUILTIN_SHORTCUTS } from "../shortcuts/index.ts";
import type { DataFormat } from "../formats/types.ts";
import type { CliOptions } from "../types.ts";
import { DEFAULT_OPTIONS, VALID_INPUT_FORMATS, VALID_OUTPUT_FORMATS } from "./constants.ts";

type BooleanOption = keyof Pick<
  CliOptions,
  | "help"
  | "version"
  | "raw"
  | "pretty"
  | "compact"
  | "type"
  | "readFile"
  | "recursive"
  | "ignoreCase"
  | "showLineNumbers"
  | "shortcuts"
  | "detect"
  | "strict"
  | "daemon"
  | "slurp"
  | "nullInput"
>;

interface ParseState {
  args: string[];
  index: number;
  options: CliOptions;
}

type ValueHandler = (value: string, options: CliOptions) => void;

const BUILTIN_NAMES = Object.values(BUILTIN_FUNCTIONS);
const SHORTCUT_NAMES = BUILTIN_SHORTCUTS.map((shortcut) => shortcut.short);
const VALID_OUTPUT_FORMAT_SET = new Set<string>(VALID_OUTPUT_FORMATS);
const VALID_INPUT_FORMAT_SET = new Set<DataFormat>(VALID_INPUT_FORMATS);

const BOOLEAN_FLAGS = new Map<string, BooleanOption>([
  ["--help", "help"],
  ["-h", "help"],
  ["--version", "version"],
  ["-v", "version"],
  ["--raw", "raw"],
  ["-r", "raw"],
  ["--pretty", "pretty"],
  ["-p", "pretty"],
  ["--compact", "compact"],
  ["-c", "compact"],
  ["--type", "type"],
  ["-t", "type"],
  ["readFile", "readFile"],
  ["rf", "readFile"],
  ["--recursive", "recursive"],
  ["-R", "recursive"],
  ["--ignore-case", "ignoreCase"],
  ["-i", "ignoreCase"],
  ["--line-numbers", "showLineNumbers"],
  ["-n", "showLineNumbers"],
  ["--shortcuts", "shortcuts"],
  ["--detect", "detect"],
  ["--strict", "strict"],
  ["-s", "strict"],
  ["--daemon", "daemon"],
  ["--slurp", "slurp"],
  ["-S", "slurp"],
  ["--null-input", "nullInput"],
  ["-N", "nullInput"],
]);

const VALUE_FLAGS = new Set([
  "--format",
  "--input-format",
  "-if",
  "--find",
  "-f",
  "--grep",
  "-g",
  "--list",
  "-l",
  "--ext",
  "--max-depth",
  "--shorten",
  "--expand",
]);

const startsWithFunctionName = (arg: string, names: string[]): boolean => {
  const functionPrefix = names.find((name) => arg.startsWith(`${name}(`));
  return functionPrefix !== undefined;
};

const isExpressionArgument = (arg: string): boolean => {
  const isPathExpression = arg.startsWith(".") || arg.startsWith("[");
  const isBuiltinFunction = startsWithFunctionName(arg, BUILTIN_NAMES);
  const isShortcutFunction = startsWithFunctionName(arg, SHORTCUT_NAMES);
  if (isPathExpression) return true;
  if (isBuiltinFunction) return true;

  return isShortcutFunction;
};

const advance = (state: ParseState, steps = 1): ParseState => ({
  ...state,
  index: state.index + steps,
});

const applyBooleanFlag = (arg: string, options: CliOptions): boolean => {
  const option = BOOLEAN_FLAGS.get(arg);
  if (option === undefined) return false;

  options[option] = true;
  return true;
};

const normalizeExtensions = (value: string): string[] =>
  value.split(",").map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));

const isDataFormat = (value: string): value is DataFormat =>
  VALID_INPUT_FORMAT_SET.has(value as DataFormat);

const setOutputFormat: ValueHandler = (value, options) => {
  if (VALID_OUTPUT_FORMAT_SET.has(value)) options.format = value as never;
};

const setInputFormat: ValueHandler = (value, options) => {
  if (isDataFormat(value)) options.inputFormat = value;
};

const setFindPattern: ValueHandler = (value, options) => {
  options.find = value;
};

const setGrepPattern: ValueHandler = (value, options) => {
  options.grep = value;
};

const setListPath: ValueHandler = (value, options) => {
  options.list = value;
};

const setExtensions: ValueHandler = (value, options) => {
  options.extensions = normalizeExtensions(value);
};

const setMaxDepth: ValueHandler = (value, options) => {
  options.maxDepth = parseInt(value, 10);
};

const setShortenExpression: ValueHandler = (value, options) => {
  options.shorten = value;
};

const setExpandExpression: ValueHandler = (value, options) => {
  options.expand = value;
};

const VALUE_HANDLERS = new Map<string, ValueHandler>([
  ["--format", setOutputFormat],
  ["--input-format", setInputFormat],
  ["-if", setInputFormat],
  ["--find", setFindPattern],
  ["-f", setFindPattern],
  ["--grep", setGrepPattern],
  ["-g", setGrepPattern],
  ["--list", setListPath],
  ["-l", setListPath],
  ["--ext", setExtensions],
  ["--max-depth", setMaxDepth],
  ["--shorten", setShortenExpression],
  ["--expand", setExpandExpression],
]);

const applyValueFlag = (arg: string, value: string, options: CliOptions): void => {
  const handler = VALUE_HANDLERS.get(arg);
  if (handler === undefined) return;

  handler(value, options);
};

const parseValueFlag = (state: ParseState, arg: string): ParseState | null => {
  if (!VALUE_FLAGS.has(arg)) return null;

  const value = state.args[state.index + 1];
  if (value !== undefined) applyValueFlag(arg, value, state.options);

  return advance(state, 2);
};

const parseArg = (state: ParseState): ParseState => {
  const arg = state.args[state.index];
  if (arg === undefined) return advance(state);
  if (applyBooleanFlag(arg, state.options)) return advance(state);

  const valueState = parseValueFlag(state, arg);
  if (valueState) return valueState;
  if (isExpressionArgument(arg)) state.options.expression = arg;

  return advance(state);
};

export function parseArgs(args: string[]): CliOptions {
  let state = { args, index: 0, options: { ...DEFAULT_OPTIONS } };

  while (state.index < args.length) {
    state = parseArg(state);
  }

  return state.options;
}
