import * as std from 'std';
import { evaluate } from './core.js';
import {
  VERSION,
  VALID_OUTPUT_FORMATS,
  VALID_INPUT_FORMATS,
  HELP_TEXT,
  SHORTCUTS_TEXT,
} from './constants.js';

export function parseArgs(args) {
  const options = {
    format: 'json',
    pretty: false,
    raw: false,
    compact: false,
    type: false,
    help: false,
    version: false,
    shortcuts: false,
    expression: '.',
    inputFormat: undefined,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;

      case '--version':
      case '-v':
        options.version = true;
        break;

      case '--raw':
      case '-r':
        options.raw = true;
        break;

      case '--pretty':
      case '-p':
        options.pretty = true;
        break;

      case '--compact':
      case '-c':
        options.compact = true;
        break;

      case '--type':
      case '-t':
        options.type = true;
        break;

      case '--format':
        i++;
        if (i < args.length && VALID_OUTPUT_FORMATS.includes(args[i])) {
          options.format = args[i];
        }
        break;

      case '--input-format':
      case '-if':
        i++;
        if (i < args.length && VALID_INPUT_FORMATS.includes(args[i])) {
          options.inputFormat = args[i];
        }
        break;

      case '--shortcuts':
        options.shortcuts = true;
        break;

      default:
        if (arg.startsWith('.') || arg.startsWith('[')) {
          options.expression = arg;
        }
        break;
    }
    i++;
  }

  return options;
}

export function formatOutput(result, options) {
  if (options.type) {
    const type = result === null ? 'null' : Array.isArray(result) ? 'array' : typeof result;
    return type;
  }

  if (options.raw && typeof result === 'string') {
    return result;
  }

  if (options.compact) {
    return JSON.stringify(result);
  }

  if (options.pretty || options.format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  return JSON.stringify(result, null, 2);
}

function main() {
  const args = scriptArgs.slice(1);
  const options = parseArgs(args);

  if (options.help) {
    print(HELP_TEXT);
    return;
  }

  if (options.version) {
    print(VERSION);
    return;
  }

  if (options.shortcuts) {
    print(SHORTCUTS_TEXT);
    return;
  }

  const input = std.in.readAsString().trim();

  if (!input) {
    std.err.puts('Error: No input provided\n');
    std.exit(1);
  }

  try {
    const data = JSON.parse(input);
    const result = evaluate(data, options.expression);
    const output = formatOutput(result, options);
    print(output);
  } catch (e) {
    std.err.puts(`Error: ${e.message}\n`);
    std.exit(1);
  }
}

main();
