import { DataFormat } from "../utils/types";

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
