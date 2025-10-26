import { REGEX_SPECIAL_CHARS } from "./constants";

export function escapeRegExp(str: string): string {
  return str.replace(REGEX_SPECIAL_CHARS, "\\$&");
}

export * from "./constants";
export * from "./file";
export * from "./logger";
export * from "./shortcuts";
export * from "./stream";
export * from "./types";
