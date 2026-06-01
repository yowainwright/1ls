import { parseArgs } from "../cli/parser";
import { resolveReadFileInvocation } from "../cli/read-file";
import { evaluateAndFormatExpression, formatResult } from "../executor";
import { detectFormat } from "../formats/detect";
import { parseInputSync } from "../formats/sync";
import { expandShortcuts, getShortcutHelp, shortenExpression } from "../shortcuts";
import { VALID_INPUT_FORMATS, VALID_OUTPUT_FORMATS } from "../constants";
import { VERSION } from "../version";

interface QuickJsHost {
  readFile(path: string): string | null;
  readStdin(): string;
}

interface CliResult {
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

const buildHelpText = (): string => `1ls - Lightweight JSON CLI with JavaScript syntax

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
  failure(`Error: ${name} is not supported in the QuickJS terminal build yet`);

const parseContent = (content: string, inputFormat?: string): unknown =>
  parseInputSync(content, inputFormat as Parameters<typeof parseInputSync>[1]);

const processExpression = (
  expression: string | undefined,
  data: unknown,
  options: ReturnType<typeof parseArgs>,
): string => {
  if (!expression) {
    return formatResult(data, options);
  }

  return evaluateAndFormatExpression(expression, data, options);
};

export function runCli(args: string[], host: QuickJsHost): CliResult {
  const options = parseArgs(args);

  if (options.help) return success(buildHelpText());
  if (options.version) return success(VERSION);
  if (options.shortcuts) return success(getShortcutHelp());
  if (options.shorten) return success(shortenExpression(options.shorten));
  if (options.expand) return success(expandShortcuts(options.expand));

  if (options.list || options.grep || options.find) {
    return getUnsupportedFeature("File listing and grep");
  }

  if (options.daemon) {
    return getUnsupportedFeature("The tooltip daemon");
  }

  if (options.interactive) {
    return getUnsupportedFeature("Interactive mode");
  }

  try {
    if (options.readFile) {
      const { filePath, expression } = resolveReadFileInvocation(args);
      const content = host.readFile(filePath);
      if (content === null) {
        return failure(`Error: Failed to read file: ${filePath}`);
      }

      const data = parseContent(content, options.inputFormat);
      return success(processExpression(expression, data, options));
    }

    const stdinInput = host.readStdin().trim();

    if (options.detect) {
      if (!stdinInput) {
        return failure("Error: --detect requires input from stdin");
      }

      return success(detectFormat(stdinInput));
    }

    if (!stdinInput) {
      return failure("Error: No input provided");
    }

    const data = parseContent(stdinInput, options.inputFormat);
    return success(processExpression(options.expression, data, options));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(`Error: ${message}`);
  }
}
