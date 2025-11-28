import { DataFormat } from "../utils/types";
import {CliOptions} from "../types";

export const VALID_OUTPUT_FORMATS = ["json", "yaml", "csv", "table"] as const;

export const VALID_INPUT_FORMATS: DataFormat[] = [
  "json",
  "yaml",
  "toml",
  "csv",
  "tsv",
  "lines",
  "text",
];

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
};
