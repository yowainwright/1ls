import { INI } from "./constants";
import { INIParseState } from "./types";

export function parseINIValue(value: string): unknown {
  const trimmed = value.trim();

  const hasQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  if (hasQuotes) {
    return trimmed.slice(1, -1);
  }

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  const isNumber = INI.NUMBER.test(trimmed);
  if (isNumber) return parseFloat(trimmed);

  return trimmed;
}

export function stripINIComments(line: string): string {
  const commentIdx = line.indexOf(";");
  const hashCommentIdx = line.indexOf("#");

  const hasComment = commentIdx >= 0 || hashCommentIdx >= 0;
  if (!hasComment) return line;

  const firstCommentIdx =
    commentIdx >= 0 && hashCommentIdx >= 0
      ? Math.min(commentIdx, hashCommentIdx)
      : Math.max(commentIdx, hashCommentIdx);

  return line.substring(0, firstCommentIdx);
}

export function processINILine(state: INIParseState, line: string): INIParseState {
  const withoutComments = stripINIComments(line);
  const trimmed = withoutComments.trim();
  const isEmpty = !trimmed;

  if (isEmpty) {
    return state;
  }

  const isSection = trimmed.startsWith("[") && trimmed.endsWith("]");
  if (isSection) {
    const sectionName = trimmed.slice(1, -1).trim();
    const hasSection = !state.result[sectionName];

    if (hasSection) {
      state.result[sectionName] = {};
    }

    return {
      result: state.result,
      currentSection: sectionName,
    };
  }

  const equalsIdx = trimmed.indexOf("=");
  const hasKeyValue = equalsIdx > 0;

  if (hasKeyValue) {
    const key = trimmed.substring(0, equalsIdx).trim();
    const value = trimmed.substring(equalsIdx + 1).trim();
    const hasSection = state.currentSection.length > 0;

    if (hasSection) {
      const section = state.result[state.currentSection] as Record<string, unknown>;
      section[key] = parseINIValue(value);
    } else {
      state.result[key] = parseINIValue(value);
    }
  }

  return state;
}

export function parseINI(input: string): Record<string, unknown> {
  const lines = input.trim().split("\n");

  const finalState = lines.reduce(
    (state, line) => processINILine(state, line),
    { result: {}, currentSection: "" } as INIParseState
  );

  return finalState.result;
}
