import { JSON5 } from "./constants.ts";
import type { ParseState } from "./types.ts";

const JSON5_QUOTE_CHARS = new Set(['"', "'"]);

export function isQuoteChar(char: string): boolean {
  const isQuote = JSON5_QUOTE_CHARS.has(char);
  return isQuote;
}

export function findCommentEnd(chars: string[], startIndex: number, endPattern: string): number {
  const remaining = chars.slice(startIndex);
  const endIndex = remaining.findIndex((c) => c === endPattern);
  const notFound = endIndex === -1;
  if (notFound) return chars.length - startIndex;
  return endIndex;
}

export function findMultiLineCommentEnd(chars: string[], startIndex: number): number {
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

export function handleStringChar(
  state: ParseState,
  char: string,
  nextChar: string | undefined,
): ParseState {
  const result = [...state.result, char];

  const isEscaped = char === "\\" && nextChar;
  if (isEscaped) {
    return { result: [...result, nextChar], inString: state.inString, delimiter: state.delimiter, skip: 1 };
  }

  const isClosingQuote = char === state.delimiter;
  if (isClosingQuote) {
    return { result, inString: false, delimiter: "", skip: 0 };
  }

  return { ...state, result };
}

const createSkippedState = (state: ParseState, skip: number): ParseState => ({
  result: state.result,
  inString: state.inString,
  delimiter: state.delimiter,
  skip,
});

interface NormalCharInput {
  state: ParseState;
  char: string;
  nextChar: string | undefined;
  chars: string[];
  index: number;
}

export function handleNormalChar(input: NormalCharInput): ParseState {
  const { state, char, nextChar, chars, index } = input;
  const isQuote = isQuoteChar(char);
  if (isQuote) {
    return { result: [...state.result, char], inString: true, delimiter: char, skip: 0 };
  }

  const isSingleLineComment = char === "/" && nextChar === "/";
  if (isSingleLineComment) {
    const skipCount = findCommentEnd(chars, index, "\n");
    return createSkippedState(state, skipCount);
  }

  const isMultiLineComment = char === "/" && nextChar === "*";
  if (isMultiLineComment) {
    const skipCount = findMultiLineCommentEnd(chars, index);
    return createSkippedState(state, skipCount);
  }

  return { ...state, result: [...state.result, char] };
}

const decrementSkip = (state: ParseState): ParseState => ({
  result: state.result,
  inString: state.inString,
  delimiter: state.delimiter,
  skip: state.skip - 1,
});

const parseJSON5Char = (
  state: ParseState,
  char: string,
  index: number,
  chars: string[],
): ParseState => {
  if (state.skip > 0) return decrementSkip(state);
  const nextChar = chars[index + 1];
  if (state.inString) return handleStringChar(state, char, nextChar);
  return handleNormalChar({ state, char, nextChar, chars, index });
};

export function stripJSON5Comments(input: string): string {
  const chars = input.split("");

  return chars
    .reduce((state: ParseState, char: string, index: number) => parseJSON5Char(state, char, index, chars), {
      result: [],
      inString: false,
      delimiter: "",
      skip: 0,
    })
    .result.join("");
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
