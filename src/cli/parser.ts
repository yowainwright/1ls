import { CliOptions } from "../types";
import { DataFormat } from "../utils/types";
import { VALID_OUTPUT_FORMATS, VALID_INPUT_FORMATS } from "./constants";

const DEFAULT_OPTIONS: CliOptions = {
  format: "json",
  pretty: false,
  raw: false,
  compact: false,
  type: false,
  recursive: false,
  ignoreCase: false,
  showLineNumbers: false,
  inputFormat: undefined,
};

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { ...DEFAULT_OPTIONS };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;

      case "--version":
      case "-v":
        options.version = true;
        break;

      case "--raw":
      case "-r":
        options.raw = true;
        break;

      case "--pretty":
      case "-p":
        options.pretty = true;
        break;

      case "--compact":
      case "-c":
        options.compact = true;
        break;

      case "--type":
      case "-t":
        options.type = true;
        break;

      case "--format":
        i++;
        if (i < args.length) {
          const format = args[i];
          const isValidFormat = VALID_OUTPUT_FORMATS.includes(format as any);
          const hasFormat = format && isValidFormat;
          if (hasFormat) {
            options.format = format as CliOptions["format"];
          }
        }
        break;

      case "--input-format":
      case "-if":
        i++;
        if (i < args.length) {
          const inputFormat = args[i] as DataFormat;
          const isValidInputFormat = VALID_INPUT_FORMATS.includes(inputFormat);
          if (isValidInputFormat) {
            options.inputFormat = inputFormat;
          }
        }
        break;

      case "readFile":
        options.readFile = true;
        i += 2;
        break;

      case "--find":
      case "-f":
        i++;
        if (i < args.length) {
          options.find = args[i];
        }
        break;

      case "--grep":
      case "-g":
        i++;
        if (i < args.length) {
          options.grep = args[i];
        }
        break;

      case "--list":
      case "-l":
        i++;
        if (i < args.length) {
          options.list = args[i];
        }
        break;

      case "--recursive":
      case "-R":
        options.recursive = true;
        break;

      case "--ignore-case":
      case "-i":
        options.ignoreCase = true;
        break;

      case "--line-numbers":
      case "-n":
        options.showLineNumbers = true;
        break;

      case "--ext":
        i++;
        if (i < args.length) {
          const extensions = args[i].split(",");
          options.extensions = extensions.map((ext) =>
            ext.startsWith(".") ? ext : `.${ext}`,
          );
        }
        break;

      case "--max-depth":
        i++;
        if (i < args.length) {
          options.maxDepth = parseInt(args[i], 10);
        }
        break;

      case "--shorten":
        i++;
        if (i < args.length) {
          options.shorten = args[i];
        }
        break;

      case "--expand":
        i++;
        if (i < args.length) {
          options.expand = args[i];
        }
        break;

      case "--shortcuts":
        options.shortcuts = true;
        break;

      default:
        const isExpressionStart = arg.startsWith(".") || arg.startsWith("[");
        if (isExpressionStart) {
          options.expression = arg;
        }
        break;
    }
    i++;
  }

  return options;
}
