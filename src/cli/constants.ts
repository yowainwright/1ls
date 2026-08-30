import type { CliOptions } from "../types.ts";
import {
  VALID_OUTPUT_FORMATS as SHARED_OUTPUT_FORMATS,
  VALID_INPUT_FORMATS as SHARED_INPUT_FORMATS,
} from "../constants.ts";

export const VALID_OUTPUT_FORMATS = SHARED_OUTPUT_FORMATS;

export const VALID_INPUT_FORMATS = SHARED_INPUT_FORMATS;

export const DEFAULT_OPTIONS: CliOptions = {
  expression: undefined,
  help: false,
  version: false,
  format: "json",
  pretty: false,
  raw: false,
  compact: false,
  type: false,
  recursive: false,
  ignoreCase: false,
  showLineNumbers: false,
  inputFormat: undefined,
  readFile: false,
  find: undefined,
  grep: undefined,
  list: undefined,
  extensions: undefined,
  maxDepth: undefined,
  shorten: undefined,
  expand: undefined,
  shortcuts: false,
  detect: false,
  strict: false,
  slurp: false,
  nullInput: false,
  daemon: false,
};
