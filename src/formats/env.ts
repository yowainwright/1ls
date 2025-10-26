import { ENVParseState } from "./types";

export function parseENVValue(value: string): unknown {
  const trimmed = value.trim();

  const hasQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  if (hasQuotes) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;

  const isNumber = /^-?\d+(\.\d+)?$/.test(trimmed);
  if (isNumber) return parseFloat(trimmed);

  return trimmed;
}

function stripENVComments(line: string): string {
  const commentIdx = line.indexOf("#");
  const hasComment = commentIdx >= 0;

  if (!hasComment) return line;

  const beforeComment = line.substring(0, commentIdx);
  const insideQuotes = beforeComment.match(/["'].*["']/);

  if (insideQuotes) {
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
