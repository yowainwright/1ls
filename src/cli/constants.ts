import { DataFormat } from "../formats/types";
import { CliOptions } from "../types";
import { VALID_OUTPUT_FORMATS as SHARED_OUTPUT_FORMATS, VALID_INPUT_FORMATS as SHARED_INPUT_FORMATS } from "../constants";

export const VALID_OUTPUT_FORMATS = SHARED_OUTPUT_FORMATS;

export const VALID_INPUT_FORMATS: DataFormat[] = [...SHARED_INPUT_FORMATS];

export const DEFAULT_OPTIONS: CliOptions = {
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
