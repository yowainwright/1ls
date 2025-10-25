import { JSON5 } from "./constants";

export function stripJSON5Comments(input: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let stringDelimiter = "";

  while (i < input.length) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (inString) {
      result += char;
      const isEscaped = char === "\\" && nextChar;
      if (isEscaped) {
        result += nextChar;
        i += 2;
        continue;
      }

      if (char === stringDelimiter) {
        inString = false;
      }
      i++;
      continue;
    }

    const isStringStart = char === '"' || char === "'";
    if (isStringStart) {
      inString = true;
      stringDelimiter = char;
      result += char;
      i++;
      continue;
    }

    const isSingleLineComment = char === "/" && nextChar === "/";
    if (isSingleLineComment) {
      while (i < input.length && input[i] !== "\n") {
        i++;
      }
      continue;
    }

    const isMultiLineComment = char === "/" && nextChar === "*";
    if (isMultiLineComment) {
      i += 2;
      while (i < input.length) {
        const isEnd = input[i] === "*" && input[i + 1] === "/";
        if (isEnd) {
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

export function normalizeJSON5(input: string): string {
  let result = stripJSON5Comments(input);

  result = result.replace(JSON5.TRAILING_COMMA, "$1");

  result = result.replace(JSON5.UNQUOTED_KEY, '"$2":');

  result = result.replace(/'/g, '"');

  return result;
}

export function parseJSON5(input: string): unknown {
  const normalized = normalizeJSON5(input);
  return JSON.parse(normalized);
}
