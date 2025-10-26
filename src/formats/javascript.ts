import { ParseState } from "./types";

function isQuoteChar(char: string): boolean {
  return char === '"' || char === "'" || char === "`";
}

function findCommentEnd(chars: string[], startIndex: number, endPattern: string): number {
  const remaining = chars.slice(startIndex);
  const endIndex = remaining.findIndex((c) => c === endPattern);
  const notFound = endIndex === -1;
  return notFound ? chars.length - startIndex : endIndex;
}

function findMultiLineCommentEnd(chars: string[], startIndex: number): number {
  let offset = 2;
  const maxLength = chars.length - startIndex;

  while (offset < maxLength) {
    const currentChar = chars[startIndex + offset];
    const nextChar = chars[startIndex + offset + 1];
    const isCommentEnd = currentChar === "*" && nextChar === "/";

    if (isCommentEnd) {
      return offset + 1;
    }
    offset++;
  }

  return offset;
}

function handleStringChar(state: ParseState, char: string, nextChar: string | undefined): ParseState {
  state.result.push(char);

  const isEscaped = char === "\\" && nextChar;
  if (isEscaped) {
    state.result.push(nextChar!);
    return { result: state.result, inString: state.inString, delimiter: state.delimiter, skip: 1 };
  }

  const isClosingQuote = char === state.delimiter;
  if (isClosingQuote) {
    return { result: state.result, inString: false, delimiter: "", skip: 0 };
  }

  return state;
}

function handleNormalChar(state: ParseState, char: string, nextChar: string | undefined, chars: string[], index: number): ParseState {
  const isQuote = isQuoteChar(char);
  if (isQuote) {
    state.result.push(char);
    return { result: state.result, inString: true, delimiter: char, skip: 0 };
  }

  const isSingleLineComment = char === "/" && nextChar === "/";
  if (isSingleLineComment) {
    const skipCount = findCommentEnd(chars, index, "\n");
    return { result: state.result, inString: state.inString, delimiter: state.delimiter, skip: skipCount };
  }

  const isMultiLineComment = char === "/" && nextChar === "*";
  if (isMultiLineComment) {
    const skipCount = findMultiLineCommentEnd(chars, index);
    return { result: state.result, inString: state.inString, delimiter: state.delimiter, skip: skipCount };
  }

  state.result.push(char);
  return state;
}

export function stripJSComments(input: string): string {
  const chars = input.split("");

  return chars
    .reduce((state: ParseState, char: string, index: number) => {
      const shouldSkip = state.skip > 0;
      if (shouldSkip) {
        return { result: state.result, inString: state.inString, delimiter: state.delimiter, skip: state.skip - 1 };
      }

      const nextChar = chars[index + 1];

      return state.inString
        ? handleStringChar(state, char, nextChar)
        : handleNormalChar(state, char, nextChar, chars, index);
    }, { result: [], inString: false, delimiter: "", skip: 0 })
    .result
    .join("");
}

export function parseJavaScript(input: string): unknown {
  const withoutComments = stripJSComments(input);

  const exportMatch = withoutComments.match(/export\s+default\s+([\s\S]+)/);
  const code = exportMatch ? exportMatch[1] : withoutComments;
  const trimmed = code.trim().replace(/;$/, "");

  return eval(`(${trimmed})`);
}
