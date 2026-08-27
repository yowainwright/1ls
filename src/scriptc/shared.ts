import type { DataFormat } from "../formats/types";
import type { CliOptions } from "../types";
import { resolveReadFileInvocation } from "../cli/read-file";
import { processContent } from "../executor";
import { detectFormat } from "../formats/detect";
import { BUILTIN_FUNCTIONS } from "../navigator/builtins/constants";
import { expandShortcuts, getShortcutHelp, shortenExpression } from "../shortcuts";
import { VALID_INPUT_FORMATS, VALID_OUTPUT_FORMATS } from "../constants";
import { BUILTIN_SHORTCUTS } from "../shortcuts";
import { VERSION } from "../version";

interface ScriptcHost {
  readFile(path: string): string | null;
  readStdin(): string;
}

interface CliResult {
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

const DEFAULT_SCRIPTC_OPTIONS: CliOptions = {
  format: "json",
  pretty: false,
  raw: false,
  compact: false,
  type: false,
  recursive: false,
  ignoreCase: false,
  showLineNumbers: false,
  inputFormat: undefined,
  slurp: false,
  nullInput: false,
};

const HELP_TEXT = `1ls - Lightweight JSON CLI with JavaScript syntax

Usage:
  1ls [options] [expression]
  1ls readFile <path> [expression] [options]

Options:
  -h, --help            Show this help message
  -v, --version         Show version number
  -r, --raw             Output raw strings without quotes
  -p, --pretty          Pretty print output with indentation
  -c, --compact         Output compact JSON (no whitespace)
  -t, --type            Show the type and value of the result
  --format <format>     Output format: ${VALID_OUTPUT_FORMATS.join(", ")}
  --input-format, -if   Input format: ${VALID_INPUT_FORMATS.join(", ")}
  --detect              Show detected input format without processing
  --shorten <expr>      Convert expression to shorthand
  --expand <expr>       Convert shorthand to full form
  --shortcuts           List available expression shortcuts
  -s, --strict          Error on undefined properties

Examples:
  echo '{"name":"test"}' | 1ls .name
  echo '[1,2,3]' | 1ls '.map(x => x * 2)'
  1ls readFile data.json '.users.filter(x => x.active)'
`;

const success = (stdout: string): CliResult => ({ exitCode: 0, stdout });

const failure = (stderr: string): CliResult => ({ exitCode: 1, stderr });

const getUnsupportedFeature = (name: string): CliResult =>
  failure(`Error: ${name} is not supported in the scriptc terminal build yet`);

const getFlagValue = (args: string[], flags: string[]): string | undefined => {
  const flagIndex = args.findIndex((arg) => flags.includes(arg));
  return flagIndex === -1 ? undefined : args[flagIndex + 1];
};

const isExpressionArgument = (arg: string): boolean => {
  const isPathExpression = arg.startsWith(".") || arg.startsWith("[");
  const builtinNames = Object.values(BUILTIN_FUNCTIONS);
  const shortcutNames = BUILTIN_SHORTCUTS.map((shortcut) => shortcut.short);
  const isBuiltin = builtinNames.some((name) => arg.startsWith(`${name}(`));
  const isShortcut = shortcutNames.some((name) => arg.startsWith(`${name}(`));
  return isPathExpression || isBuiltin || isShortcut;
};

const getExpression = (args: string[]): string | undefined => args.find(isExpressionArgument);

const hasAnyFlag = (args: string[], flags: string[]): boolean =>
  flags.some((flag) => args.includes(flag));

const getOutputFormat = (args: string[]): CliOptions["format"] => {
  const format = getFlagValue(args, ["--format"]);
  const isValidFormat = format !== undefined && VALID_OUTPUT_FORMATS.includes(format as never);
  return isValidFormat ? (format as CliOptions["format"]) : DEFAULT_SCRIPTC_OPTIONS.format;
};

const getInputFormat = (args: string[]): DataFormat | undefined => {
  const format = getFlagValue(args, ["--input-format", "-if"]);
  const isValidFormat = format !== undefined && VALID_INPUT_FORMATS.includes(format as never);
  return isValidFormat ? (format as DataFormat) : undefined;
};

const getScriptcFlags = (args: string[]): Partial<CliOptions> => ({
  readFile: hasAnyFlag(args, ["readFile", "rf"]),
  help: hasAnyFlag(args, ["--help", "-h"]),
  version: hasAnyFlag(args, ["--version", "-v"]),
  raw: hasAnyFlag(args, ["--raw", "-r"]),
  pretty: hasAnyFlag(args, ["--pretty", "-p"]),
  compact: hasAnyFlag(args, ["--compact", "-c"]),
  type: hasAnyFlag(args, ["--type", "-t"]),
  detect: hasAnyFlag(args, ["--detect"]),
  strict: hasAnyFlag(args, ["--strict", "-s"]),
  daemon: hasAnyFlag(args, ["--daemon"]),
  shortcuts: hasAnyFlag(args, ["--shortcuts"]),
  recursive: hasAnyFlag(args, ["--recursive", "-R"]),
  ignoreCase: hasAnyFlag(args, ["--ignore-case", "-i"]),
  showLineNumbers: hasAnyFlag(args, ["--line-numbers", "-n"]),
  slurp: hasAnyFlag(args, ["--slurp", "-S"]),
  nullInput: hasAnyFlag(args, ["--null-input", "-N"]),
});

const getScriptcValues = (args: string[]): Partial<CliOptions> => {
  const extensions = getFlagValue(args, ["--ext"]);
  const maxDepth = getFlagValue(args, ["--max-depth"]);
  const shorten = getFlagValue(args, ["--shorten"]);
  const expand = getFlagValue(args, ["--expand"]);

  return {
    format: getOutputFormat(args),
    inputFormat: getInputFormat(args),
    expression: getExpression(args),
    shorten,
    expand,
    find: getFlagValue(args, ["--find", "-f"]),
    grep: getFlagValue(args, ["--grep", "-g"]),
    list: getFlagValue(args, ["--list", "-l"]),
    extensions: extensions?.split(",").map((extension) =>
      extension.startsWith(".") ? extension : `.${extension}`,
    ),
    maxDepth: maxDepth === undefined ? undefined : parseInt(maxDepth, 10),
  };
};

const parseScriptcArgs = (args: string[]): CliOptions => ({
  ...DEFAULT_SCRIPTC_OPTIONS,
  ...getScriptcFlags(args),
  ...getScriptcValues(args),
});

const getInformationalResult = (options: CliOptions): CliResult | undefined => {
  if (options.help) return success(HELP_TEXT);
  if (options.version) return success(VERSION);
  if (options.shortcuts) return success(getShortcutHelp());
  if (options.shorten) return success(shortenExpression(options.shorten));
  if (options.expand) return success(expandShortcuts(options.expand));
  return undefined;
};

const getUnsupportedResult = (options: CliOptions): CliResult | undefined => {
  const hasUnsupportedFileOperation = options.list || options.grep || options.find;
  if (hasUnsupportedFileOperation) return getUnsupportedFeature("File listing and grep");
  if (options.daemon) return getUnsupportedFeature("The tooltip daemon");
  return undefined;
};

const processReadFile = (
  args: string[],
  options: CliOptions,
  host: ScriptcHost,
): CliResult => {
  const { filePath, expression } = resolveReadFileInvocation(args);
  const content = host.readFile(filePath);
  if (content === null) return failure(`Error: Failed to read file: ${filePath}`);
  return success(processContent(content, { ...options, expression }));
};

const processStdin = (
  options: CliOptions,
  host: ScriptcHost,
): CliResult => {
  const stdinInput = host.readStdin().trim();
  if (options.detect) {
    if (!stdinInput) return failure("Error: --detect requires input from stdin");
    return success(detectFormat(stdinInput));
  }
  if (!stdinInput) return failure("Error: No input provided");
  return success(processContent(stdinInput, options));
};

export function runCli(args: string[], host: ScriptcHost): CliResult {
  const options = parseScriptcArgs(args);
  const informationalResult = getInformationalResult(options);
  if (informationalResult) return informationalResult;

  const unsupportedResult = getUnsupportedResult(options);
  if (unsupportedResult) return unsupportedResult;

  try {
    if (options.readFile) return processReadFile(args, options, host);
    return processStdin(options, host);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(`Error: ${message}`);
  }
}
