import { BUILTIN_FUNCTIONS } from "../navigator/builtins/constants";
import { BUILTIN_SHORTCUTS } from "../shortcuts/index";
import { parseInput } from "../formats/index";
import type { DataFormat } from "../formats/types";
import type { CliOptions, OutputFormat } from "../types";
import { DEFAULT_OPTIONS, VALID_INPUT_FORMATS, VALID_OUTPUT_FORMATS } from "./constants";

export interface ReadFileInvocation {
  filePath: string;
  expression: string;
  hasExplicitExpression: boolean;
}

interface ParseState {
  args: string[];
  index: number;
  options: CliOptions;
}

const BUILTIN_NAMES = Object.values(BUILTIN_FUNCTIONS);
const SHORTCUT_NAMES = BUILTIN_SHORTCUTS.map((shortcut) => shortcut.short);

const startsWithFunctionName = (arg: string, names: string[]): boolean => {
  for (const name of names) {
    if (arg.startsWith(`${name}(`)) return true;
  }

  return false;
};

const isExpressionArgument = (arg: string): boolean => {
  const isPathExpression = arg.startsWith(".") || arg.startsWith("[");
  if (isPathExpression) return true;
  if (startsWithFunctionName(arg, BUILTIN_NAMES)) return true;
  return startsWithFunctionName(arg, SHORTCUT_NAMES);
};

const advance = (state: ParseState, steps = 1): ParseState => ({
  ...state,
  index: state.index + steps,
});

const applyHelpFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "--help") {
    options.help = true;
    return true;
  }

  if (arg === "-h") {
    options.help = true;
    return true;
  }

  if (arg === "--version") {
    options.version = true;
    return true;
  }

  if (arg === "-v") {
    options.version = true;
    return true;
  }

  return false;
};

const applyOutputFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "--raw") {
    options.raw = true;
    return true;
  }

  if (arg === "-r") {
    options.raw = true;
    return true;
  }

  if (arg === "--pretty") {
    options.pretty = true;
    return true;
  }

  if (arg === "-p") {
    options.pretty = true;
    return true;
  }

  return applyCompactOutputFlag(arg, options);
};

const applyCompactOutputFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "--compact") {
    options.compact = true;
    return true;
  }

  if (arg === "-c") {
    options.compact = true;
    return true;
  }

  if (arg === "--type") {
    options.type = true;
    return true;
  }

  if (arg === "-t") {
    options.type = true;
    return true;
  }

  return false;
};

const applyFileFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "readFile") {
    options.readFile = true;
    return true;
  }

  if (arg === "rf") {
    options.readFile = true;
    return true;
  }

  if (arg === "--recursive") {
    options.recursive = true;
    return true;
  }

  if (arg === "-R") {
    options.recursive = true;
    return true;
  }

  return applySearchFlag(arg, options);
};

const applySearchFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "--ignore-case") {
    options.ignoreCase = true;
    return true;
  }

  if (arg === "-i") {
    options.ignoreCase = true;
    return true;
  }

  if (arg === "--line-numbers") {
    options.showLineNumbers = true;
    return true;
  }

  if (arg === "-n") {
    options.showLineNumbers = true;
    return true;
  }

  return false;
};

const applyRuntimeFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "--shortcuts") {
    options.shortcuts = true;
    return true;
  }

  if (arg === "--detect") {
    options.detect = true;
    return true;
  }

  if (arg === "--strict") {
    options.strict = true;
    return true;
  }

  if (arg === "-s") {
    options.strict = true;
    return true;
  }

  return applyInputModeFlag(arg, options);
};

const applyInputModeFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "--daemon") {
    options.daemon = true;
    return true;
  }

  if (arg === "--slurp") {
    options.slurp = true;
    return true;
  }

  if (arg === "-S") {
    options.slurp = true;
    return true;
  }

  return applyNullInputFlag(arg, options);
};

const applyNullInputFlag = (arg: string, options: CliOptions): boolean => {
  if (arg === "--null-input") {
    options.nullInput = true;
    return true;
  }

  if (arg === "-N") {
    options.nullInput = true;
    return true;
  }

  return false;
};

const applyBooleanFlag = (arg: string, options: CliOptions): boolean => {
  if (applyHelpFlag(arg, options)) return true;
  if (applyOutputFlag(arg, options)) return true;
  if (applyFileFlag(arg, options)) return true;
  return applyRuntimeFlag(arg, options);
};

const isPathValueFlag = (arg: string): boolean => {
  if (arg === "--list") return true;
  if (arg === "-l") return true;
  if (arg === "--ext") return true;
  if (arg === "--max-depth") return true;
  if (arg === "--shorten") return true;
  return arg === "--expand";
};

const isValueFlag = (arg: string): boolean => {
  if (arg === "--format") return true;
  if (arg === "--input-format") return true;
  if (arg === "-if") return true;
  if (arg === "--find") return true;
  if (arg === "-f") return true;
  if (arg === "--grep") return true;
  if (arg === "-g") return true;
  return isPathValueFlag(arg);
};

const hasStringValue = (values: readonly string[], value: string): boolean => {
  for (const validValue of values) {
    if (validValue === value) return true;
  }

  return false;
};

const normalizeExtensions = (value: string): string[] =>
  value.split(",").map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));

const isDataFormat = (value: string): value is DataFormat =>
  hasStringValue(VALID_INPUT_FORMATS, value);

const applyFormatValue = (arg: string, value: string, options: CliOptions): boolean => {
  if (arg === "--format") {
    if (hasStringValue(VALID_OUTPUT_FORMATS, value)) options.format = value as OutputFormat;
    return true;
  }

  const isInputFormatFlag = arg === "--input-format" || arg === "-if";
  if (!isInputFormatFlag) return false;
  if (isDataFormat(value)) options.inputFormat = value;
  return true;
};

const applySearchValue = (arg: string, value: string, options: CliOptions): boolean => {
  if (arg === "--find") {
    options.find = value;
    return true;
  }

  if (arg === "-f") {
    options.find = value;
    return true;
  }

  if (arg === "--grep") {
    options.grep = value;
    return true;
  }

  if (arg === "-g") {
    options.grep = value;
    return true;
  }

  return false;
};

const applyPathValue = (arg: string, value: string, options: CliOptions): boolean => {
  if (arg === "--list") {
    options.list = value;
    return true;
  }

  if (arg === "-l") {
    options.list = value;
    return true;
  }

  if (arg === "--ext") {
    options.extensions = normalizeExtensions(value);
    return true;
  }

  if (arg === "--max-depth") {
    options.maxDepth = parseInt(value, 10);
    return true;
  }

  return false;
};

const applyExpressionValue = (arg: string, value: string, options: CliOptions): boolean => {
  if (arg === "--shorten") {
    options.shorten = value;
    return true;
  }

  if (arg === "--expand") {
    options.expand = value;
    return true;
  }

  return false;
};

const applyValueFlag = (arg: string, value: string, options: CliOptions): void => {
  if (applyFormatValue(arg, value, options)) return;
  if (applySearchValue(arg, value, options)) return;
  if (applyPathValue(arg, value, options)) return;
  applyExpressionValue(arg, value, options);
};

const parseValueFlag = (state: ParseState, arg: string): ParseState | null => {
  if (!isValueFlag(arg)) return null;
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

const hasSeparateFlagValue = (arg: string): boolean => {
  if (!isValueFlag(arg)) return false;
  return !arg.includes("=");
};

const isReadFileCommand = (arg: string): boolean => {
  if (arg === "rf") return true;
  return arg === "readFile";
};

const findReadFileCommandIndex = (args: string[]): number => {
  for (let index = 0; index < args.length; index++) {
    if (isReadFileCommand(args[index])) return index;
  }

  return -1;
};

const findExpressionCandidate = (args: string[], commandIndex: number): string | undefined => {
  let candidate: string | undefined;

  for (let index = commandIndex + 2; index < args.length; index++) {
    const arg = args[index];
    if (!arg) continue;
    if (arg.startsWith("-")) {
      if (hasSeparateFlagValue(arg)) index++;
      continue;
    }

    candidate = arg;
    break;
  }

  return candidate;
};

const readCommandFilePath = (args: string[], commandIndex: number): string => {
  const filePath = args[commandIndex + 1];
  if (filePath) return filePath;
  throw new Error("Missing file path for readFile command");
};

export const resolveReadFileInvocation = (args: string[]): ReadFileInvocation => {
  const commandIndex = findReadFileCommandIndex(args);
  if (commandIndex === -1) throw new Error("Missing readFile command");

  const filePath = readCommandFilePath(args, commandIndex);
  const candidate = findExpressionCandidate(args, commandIndex);
  const isExplicitExpression = candidate !== undefined && !candidate.startsWith("-");
  const expression = isExplicitExpression ? candidate : ".";

  return { filePath, expression, hasExplicitExpression: isExplicitExpression };
};

export async function readStdin(): Promise<string> {
  let chunks: Uint8Array[] = [];

  for await (const chunk of process.stdin) {
    chunks = [...chunks, chunk];
  }

  return Buffer.concat(chunks).toString("utf-8");
}

export async function processInput(format?: DataFormat): Promise<unknown> {
  const input = (await readStdin()).trim();
  if (!input) return null;
  return parseInput(input, format);
}
