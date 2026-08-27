import { CliOptions } from "../types";
import { DataFormat } from "../formats/types";
import { VALID_OUTPUT_FORMATS, VALID_INPUT_FORMATS, DEFAULT_OPTIONS } from "./constants";
import { BUILTIN_FUNCTIONS } from "../navigator/builtins/constants";
import { BUILTIN_SHORTCUTS } from "../shortcuts";

const BUILTIN_NAMES = Object.values(BUILTIN_FUNCTIONS);
const SHORTCUT_NAMES = BUILTIN_SHORTCUTS.map((s) => s.short);
const VALID_OUTPUT_FORMAT_SET = new Set<string>(VALID_OUTPUT_FORMATS);
const VALID_INPUT_FORMAT_SET = new Set<DataFormat>(VALID_INPUT_FORMATS);

const startsWithFunctionName = (arg: string, names: string[]): boolean =>
  names.some((name) => arg.startsWith(`${name}(`));

const isExpressionArgument = (arg: string): boolean => {
  const isDotOrBracket = arg.startsWith(".") || arg.startsWith("[");
  const isBuiltinFunction = startsWithFunctionName(arg, BUILTIN_NAMES);
  const isShortcutFunction = startsWithFunctionName(arg, SHORTCUT_NAMES);
  return isDotOrBracket || isBuiltinFunction || isShortcutFunction;
};

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { ...DEFAULT_OPTIONS };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v") {
      options.version = true;
    } else if (arg === "--raw" || arg === "-r") {
      options.raw = true;
    } else if (arg === "--pretty" || arg === "-p") {
      options.pretty = true;
    } else if (arg === "--compact" || arg === "-c") {
      options.compact = true;
    } else if (arg === "--type" || arg === "-t") {
      options.type = true;
    } else if (arg === "--format") {
        i++;
        const format = args[i];
        const hasFormat = typeof format === "string";
        const isValidFormat = hasFormat && VALID_OUTPUT_FORMAT_SET.has(format);
        if (isValidFormat) {
          options.format = format as CliOptions["format"];
        }
    } else if (arg === "--input-format" || arg === "-if") {
        i++;
        const inputFormat = args[i] as DataFormat;
        const isValidInputFormat = VALID_INPUT_FORMAT_SET.has(inputFormat);
        if (isValidInputFormat) {
          options.inputFormat = inputFormat;
        }
    } else if (arg === "readFile" || arg === "rf") {
        options.readFile = true;
    } else if (arg === "--find" || arg === "-f") {
        i++;
        if (i < args.length) {
          options.find = args[i];
        }
    } else if (arg === "--grep" || arg === "-g") {
        i++;
        if (i < args.length) {
          options.grep = args[i];
        }
    } else if (arg === "--list" || arg === "-l") {
        i++;
        if (i < args.length) {
          options.list = args[i];
        }
    } else if (arg === "--recursive" || arg === "-R") {
        options.recursive = true;
    } else if (arg === "--ignore-case" || arg === "-i") {
        options.ignoreCase = true;
    } else if (arg === "--line-numbers" || arg === "-n") {
        options.showLineNumbers = true;
    } else if (arg === "--ext") {
        i++;
        if (i < args.length) {
          const extensions = args[i].split(",");
          options.extensions = extensions.map((ext) => (ext.startsWith(".") ? ext : `.${ext}`));
        }
    } else if (arg === "--max-depth") {
        i++;
        if (i < args.length) {
          options.maxDepth = parseInt(args[i], 10);
        }
    } else if (arg === "--shorten") {
        i++;
        if (i < args.length) {
          options.shorten = args[i];
        }
    } else if (arg === "--expand") {
        i++;
        if (i < args.length) {
          options.expand = args[i];
        }
    } else if (arg === "--shortcuts") {
        options.shortcuts = true;
    } else if (arg === "--detect") {
        options.detect = true;
    } else if (arg === "--strict" || arg === "-s") {
        options.strict = true;
    } else if (arg === "--daemon") {
        options.daemon = true;
    } else if (arg === "--slurp" || arg === "-S") {
        options.slurp = true;
    } else if (arg === "--null-input" || arg === "-N") {
        options.nullInput = true;
    } else if (isExpressionArgument(arg)) {
      options.expression = arg;
    }
    i++;
  }

  return options;
}
