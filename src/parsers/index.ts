import type { DataFormat } from "../utils/types";
import { DETECTION } from "./constants";

export function parseLines(input: string): string[] {
  return input
    .trim()
    .split("\n")
    .filter((line) => line.length > 0);
}

export async function parseInput(input: string, format?: DataFormat): Promise<unknown> {
  if (format) {
    switch (format) {
      case "json":
        return JSON.parse(input);

      case "json5": {
        const { parseJSON5 } = await import("./json5");
        return parseJSON5(input);
      }

      case "yaml": {
        const { parseYAML } = await import("./yaml");
        return parseYAML(input);
      }

      case "toml": {
        const { parseTOML } = await import("./toml");
        return parseTOML(input);
      }

      case "xml": {
        const { parseXML } = await import("./xml");
        return parseXML(input);
      }

      case "ini": {
        const { parseINI } = await import("./ini");
        return parseINI(input);
      }

      case "csv": {
        const { parseCSV } = await import("./csv");
        return parseCSV(input);
      }

      case "tsv": {
        const { parseTSV } = await import("./csv");
        return parseTSV(input);
      }

      case "protobuf": {
        const { parseProtobuf } = await import("./protobuf");
        return parseProtobuf(input);
      }

      case "javascript": {
        const { parseJavaScript } = await import("./javascript");
        return parseJavaScript(input);
      }

      case "typescript": {
        const { parseTypeScript } = await import("./typescript");
        return parseTypeScript(input);
      }

      case "lines":
        return parseLines(input);

      case "text":
        return input;
    }
  }

  const detectedFormat = detectFormat(input);

  switch (detectedFormat) {
    case "json":
      return JSON.parse(input);

    case "json5": {
      const { parseJSON5 } = await import("./json5");
      return parseJSON5(input);
    }

    case "yaml": {
      const { parseYAML } = await import("./yaml");
      return parseYAML(input);
    }

    case "toml": {
      const { parseTOML } = await import("./toml");
      return parseTOML(input);
    }

    case "xml": {
      const { parseXML } = await import("./xml");
      return parseXML(input);
    }

    case "ini": {
      const { parseINI } = await import("./ini");
      return parseINI(input);
    }

    case "csv": {
      const { parseCSV } = await import("./csv");
      return parseCSV(input);
    }

    case "tsv": {
      const { parseTSV } = await import("./csv");
      return parseTSV(input);
    }

    case "protobuf": {
      const { parseProtobuf } = await import("./protobuf");
      return parseProtobuf(input);
    }

    case "javascript": {
      const { parseJavaScript } = await import("./javascript");
      return parseJavaScript(input);
    }

    case "typescript": {
      const { parseTypeScript } = await import("./typescript");
      return parseTypeScript(input);
    }

    case "lines":
      return parseLines(input);

    case "text":
    default:
      return input;
  }
}

export function detectFormat(input: string): DataFormat {
  const trimmed = input.trim();

  const hasTypeScriptFeatures =
    DETECTION.TS_INTERFACE.test(trimmed) ||
    DETECTION.TS_TYPE_ALIAS.test(trimmed) ||
    DETECTION.TS_TYPE_ANNOTATION.test(trimmed);

  if (hasTypeScriptFeatures) {
    return "typescript";
  }

  const hasJavaScriptFeatures = DETECTION.JS_EXPORT.test(trimmed);
  if (hasJavaScriptFeatures) {
    return "javascript";
  }

  const looksLikeXML = trimmed.startsWith("<") && trimmed.includes(">");
  if (looksLikeXML) {
    const hasXMLDecl = trimmed.startsWith("<?xml");
    const hasClosingTag = /<\/\w+>/.test(trimmed);
    if (hasXMLDecl || hasClosingTag) {
      return "xml";
    }
  }

  const looksLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (looksLikeJson) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      const hasJSON5Features = DETECTION.JSON5_FEATURES.test(trimmed);
      if (hasJSON5Features) {
        return "json5";
      }
    }
  }

  const hasEqualsSign = trimmed.includes("=");
  if (hasEqualsSign) {
    const hasTOMLStyleQuotedValues = trimmed.match(DETECTION.TOML_QUOTED_VALUES);
    if (hasTOMLStyleQuotedValues) {
      return "toml";
    }

    const hasSectionHeader = trimmed.match(DETECTION.SECTION_HEADER);
    if (hasSectionHeader) {
      const hasTOMLSyntax = trimmed.match(DETECTION.TOML_SECTION) && trimmed.match(DETECTION.TOML_SYNTAX);
      if (hasTOMLSyntax) {
        return "toml";
      }

      const hasINISyntax = trimmed.match(DETECTION.INI_SYNTAX);
      if (hasINISyntax) {
        return "ini";
      }
    }

    const hasINISyntax = trimmed.match(DETECTION.INI_SYNTAX);
    if (hasINISyntax) {
      return "ini";
    }
  }

  const hasYAMLIndicators =
    trimmed.includes("---") ||
    trimmed.includes(": ") ||
    trimmed.match(/^[\s]*-\s+/m);

  if (hasYAMLIndicators) {
    return "yaml";
  }

  const lines = trimmed.split("\n");
  const hasMultipleLines = lines.length > 1;

  if (hasMultipleLines) {
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    const hasMoreTabs = tabCount > 0 && tabCount >= commaCount;
    if (hasMoreTabs) return "tsv";

    if (commaCount > 0) return "csv";

    return "lines";
  }

  return "text";
}
