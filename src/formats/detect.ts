import type { DataFormat } from "./types";
import { DETECTION } from "./constants";

export function parseLines(input: string): string[] {
  return input
    .trim()
    .split("\n")
    .filter((line) => line.length > 0);
}

const isValidJSONLine = (line: string): boolean => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return true;

  try {
    JSON.parse(trimmedLine);
    return true;
  } catch {
    return false;
  }
};

const countMatches = (str: string, pattern: RegExp): number => (str.match(pattern) || []).length;

function detectMultiline(trimmed: string): DataFormat {
  const lines = trimmed.split("\n");

  const hasNDJSONFeatures = DETECTION.NDJSON_FEATURES.test(trimmed);
  const allLinesAreJSON = lines.every(isValidJSONLine);
  const isNDJSON = hasNDJSONFeatures && allLinesAreJSON;
  if (isNDJSON) return "ndjson";

  const firstLine = lines[0];
  const commaCount = countMatches(firstLine, /,/g);
  const tabCount = countMatches(firstLine, /\t/g);

  const isTSV = tabCount > 0 && tabCount >= commaCount;
  if (isTSV) return "tsv";

  const isCSV = commaCount > 0;
  if (isCSV) return "csv";

  return "lines";
}

function detectConfigFormat(trimmed: string): DataFormat {
  const isEnv = DETECTION.ENV_FEATURES.test(trimmed);
  if (isEnv) return "env";

  const hasTomlQuotedValues = DETECTION.TOML_QUOTED_VALUES.test(trimmed);
  if (hasTomlQuotedValues) return "toml";

  const hasSectionHeader = DETECTION.SECTION_HEADER.test(trimmed);
  const hasTomlSection = DETECTION.TOML_SECTION.test(trimmed);
  const hasTomlSyntax = DETECTION.TOML_SYNTAX.test(trimmed);
  const isTomlWithSection = hasSectionHeader && hasTomlSection && hasTomlSyntax;
  if (isTomlWithSection) return "toml";

  const hasIniSyntax = DETECTION.INI_SYNTAX.test(trimmed);
  const isIniWithSection = hasSectionHeader && hasIniSyntax;
  if (isIniWithSection) return "ini";

  if (hasIniSyntax) return "ini";

  return "text";
}

const tryParseJSON = (trimmed: string): DataFormat | null => {
  try {
    JSON.parse(trimmed);
    return "json";
  } catch {
    const hasJSON5Features = DETECTION.JSON5_FEATURES.test(trimmed);
    return hasJSON5Features ? "json5" : null;
  }
};

const detectJSONLike = (
  trimmed: string,
  firstChar: string,
  lastChar: string,
): DataFormat | null => {
  const isObjectLike = firstChar === "{" && lastChar === "}";
  const isArrayLike = firstChar === "[" && lastChar === "]";

  const isJSONLike = isObjectLike || isArrayLike;
  if (isJSONLike) {
    return tryParseJSON(trimmed);
  }

  return null;
};

const detectXML = (trimmed: string): DataFormat | null => {
  const startsWithXmlDecl = trimmed.startsWith("<?xml");
  const hasClosingTag = /<\/\w+>/.test(trimmed);
  const isXML = startsWithXmlDecl || hasClosingTag;

  return isXML ? "xml" : null;
};

const detectByFirstChar = (
  trimmed: string,
  firstChar: string,
  lastChar: string,
): DataFormat | null => {
  const isUnsupportedCode = DETECTION.UNSUPPORTED_CODE_FEATURES.test(trimmed);
  if (isUnsupportedCode) return "text";

  switch (firstChar) {
    case "{":
    case "[":
      return detectJSONLike(trimmed, firstChar, lastChar);

    case "<":
      return detectXML(trimmed);

    case "-":
      return trimmed.startsWith("---") ? "yaml" : null;

    default:
      return null;
  }
};

const detectByContent = (trimmed: string): DataFormat | null => {
  const hasEquals = trimmed.includes("=");
  if (hasEquals) return detectConfigFormat(trimmed);

  const hasYamlColon = trimmed.includes(": ");
  const hasYamlListItem = /^[\s]*-\s+/m.test(trimmed);
  const isYAML = hasYamlColon || hasYamlListItem;
  if (isYAML) return "yaml";

  const hasMultipleLines = trimmed.includes("\n");
  if (hasMultipleLines) return detectMultiline(trimmed);

  return null;
};

export function detectFormat(input: string): DataFormat {
  const trimmed = input.trim();
  if (!trimmed) return "text";

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  const formatByFirstChar = detectByFirstChar(trimmed, firstChar, lastChar);
  if (formatByFirstChar) return formatByFirstChar;

  const formatByContent = detectByContent(trimmed);
  if (formatByContent) return formatByContent;

  return "text";
}
