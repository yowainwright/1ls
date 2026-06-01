import type { DataFormat } from "./types";
import { detectFormat, parseLines } from "./detect";

export { detectFormat, parseLines } from "./detect";

export async function parseInput(input: string, format?: DataFormat): Promise<unknown> {
  const actualFormat = format ?? detectFormat(input);

  switch (actualFormat) {
    case "json":
      try {
        return JSON.parse(input);
      } catch (e) {
        const preview = input.length > 50 ? input.slice(0, 50) + "..." : input;
        throw new Error(`Invalid JSON: ${(e as Error).message}\nInput: ${preview}`);
      }
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
    case "env": {
      const { parseENV } = await import("./env");
      return parseENV(input);
    }
    case "ndjson": {
      const { parseNDJSON } = await import("./ndjson");
      return parseNDJSON(input);
    }
    case "lines":
      return parseLines(input);
    case "text":
    default: {
      const looksLikeJSON = /^\s*[{[]/.test(input);
      if (looksLikeJSON) {
        try {
          return JSON.parse(input);
        } catch (e) {
          const preview = input.length > 50 ? input.slice(0, 50) + "..." : input;
          throw new Error(`Invalid JSON: ${(e as Error).message}\nInput: ${preview}`);
        }
      }
      return input;
    }
  }
}
