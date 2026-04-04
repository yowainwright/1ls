/**
 * BAD: Anti-patterns for format parsers.
 *
 * Each block shows what NOT to do and why.
 * Compare with: good-example.ts
 */

// BAD: Async parser — format parsers must be sync for QuickJS NG
// Fix: remove async/await, use sync string parsing only
async function parseFromURL(input: string): Promise<unknown> {
  const response = await fetch(input);
  return response.json();
}

// BAD: Mutates accumulator with push — violates immutability
// Fix: use [...acc, newItem] or reduce with spread
function parseLinesMutating(input: string): string[] {
  const result: string[] = [];
  const lines = input.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      result.push(trimmed);
    }
  }
  return result;
}

// BAD: Uses TextDecoder — not available in QuickJS NG
// Fix: work directly with strings, not byte streams
function parseUTF8(input: Uint8Array): unknown {
  const text = new TextDecoder("utf-8").decode(input);
  return JSON.parse(text);
}

// BAD: Uses URL constructor — not available in QuickJS NG
// Fix: use string.split() or regex for URL parsing
function parseQueryString(input: string): Record<string, string> {
  const url = new URL(input);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// BAD: Regex lookbehind — not supported in all QuickJS NG builds
// Fix: use capturing groups, split, or manual parsing
function parseCamelKeys(input: string): string[] {
  return input.split(/(?<=[a-z])(?=[A-Z])/);
}

// BAD: External dependency — format parsers should have zero deps
// Fix: hand-roll the parser or use only built-in JS
// import { parse } from "some-external-lib";
// function parseWithLib(input: string): unknown {
//   return parse(input);
// }

// BAD: No guard on empty input — will produce garbage output
// Fix: check input.trim().length === 0, return appropriate empty value
function parseCSVNoGuard(input: string): Record<string, unknown>[] {
  const lines = input.split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

// BAD: Over-engineered — class with state for a stateless transform
// Fix: just write a plain function, string in → data out
class FormatParser {
  private delimiter: string;
  private hasHeaders: boolean;

  constructor(delimiter: string, hasHeaders = true) {
    this.delimiter = delimiter;
    this.hasHeaders = hasHeaders;
  }

  parse(input: string): unknown {
    const lines = input.trim().split("\n");
    if (this.hasHeaders) {
      const headers = lines[0].split(this.delimiter);
      return lines.slice(1).map((line) => {
        const vals = line.split(this.delimiter);
        return Object.fromEntries(headers.map((h, i) => [h, vals[i]]));
      });
    }
    return lines.map((l) => l.split(this.delimiter));
  }
}

export {
  parseFromURL,
  parseLinesMutating,
  parseUTF8,
  parseQueryString,
  parseCamelKeys,
  parseCSVNoGuard,
  FormatParser,
};
