import { ENVParseState } from "./types";
import { parseBooleanValue, parseNullValue, tryParseNumber } from "./utils";

export function parseENVValue(value: string): unknown {
  const trimmed = value.trim();

  const hasDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  const hasSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  const hasQuotes = hasDoubleQuotes || hasSingleQuotes;

  if (hasQuotes) {
    return trimmed.slice(1, -1);
  }

  const boolValue = parseBooleanValue(trimmed);
  if (boolValue !== undefined) return boolValue;

  const nullValue = parseNullValue(trimmed);
  if (nullValue !== undefined) return nullValue;

  const numberValue = tryParseNumber(trimmed);
  if (numberValue !== undefined) return numberValue;

  return trimmed;
}

function stripENVComments(line: string): string {
  const commentIdx = line.indexOf("#");
  const hasComment = commentIdx >= 0;

  if (!hasComment) return line;

  const beforeComment = line.substring(0, commentIdx);
  const insideQuotes = beforeComment.match(/["'].*["']/);
  const hasQuotedContent = insideQuotes !== null;

  if (hasQuotedContent) {
    const quoteCount = (beforeComment.match(/["']/g) || []).length;
    const isInsideQuote = quoteCount % 2 !== 0;

    if (isInsideQuote) {
      return line;
    }
  }

  return beforeComment;
}

function processENVLine(state: ENVParseState, line: string): ENVParseState {
  const withoutComments = stripENVComments(line);
  const trimmed = withoutComments.trim();
  const isEmpty = !trimmed;

  if (isEmpty) {
    return state;
  }

  const isExport = trimmed.startsWith("export ");
  const lineToProcess = isExport ? trimmed.substring(7).trim() : trimmed;

  const equalsIdx = lineToProcess.indexOf("=");
  const hasKeyValue = equalsIdx > 0;

  if (hasKeyValue) {
    const key = lineToProcess.substring(0, equalsIdx).trim();
    const value = lineToProcess.substring(equalsIdx + 1).trim();
    state.result[key] = parseENVValue(value);
  }

  return state;
}

export function parseENV(input: string): Record<string, unknown> {
  const lines = input.trim().split("\n");

  const finalState = lines.reduce(
    (state, line) => processENVLine(state, line),
    { result: {} } as ENVParseState
  );

  return finalState.result;
}
