import { INI } from "./constants";
import type { INIParseState } from "./types";

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
  const commentIndex = findINICommentIndex(line);
  if (commentIndex < 0) return line;
  return line.substring(0, commentIndex);
}

const isINICommentChar = (char: string): boolean => {
  if (char === ";") return true;
  return char === "#";
};

const findINICommentIndex = (line: string): number => {
  for (let index = 0; index < line.length; index++) {
    if (isINICommentChar(line[index])) return index;
  }

  return -1;
};

const processINISection = (state: INIParseState, trimmed: string): INIParseState => {
  const sectionName = trimmed.slice(1, -1).trim();
  const result = state.result[sectionName] ? state.result : { ...state.result, [sectionName]: {} };
  return {
    result,
    currentSection: sectionName,
  };
};

const setINIValue = (state: INIParseState, key: string, value: string): INIParseState => {
  const parsedValue = parseINIValue(value);
  const hasSection = state.currentSection.length > 0;
  if (!hasSection) return { ...state, result: { ...state.result, [key]: parsedValue } };

  const section = state.result[state.currentSection] as Record<string, unknown>;
  return {
    ...state,
    result: { ...state.result, [state.currentSection]: { ...section, [key]: parsedValue } },
  };
};

const processINIKeyValue = (state: INIParseState, trimmed: string): INIParseState => {
  const equalsIdx = trimmed.indexOf("=");
  if (equalsIdx <= 0) return state;
  const key = trimmed.substring(0, equalsIdx).trim();
  const value = trimmed.substring(equalsIdx + 1).trim();
  return setINIValue(state, key, value);
};

export function processINILine(state: INIParseState, line: string): INIParseState {
  const trimmed = stripINIComments(line).trim();
  if (!trimmed) return state;
  const isSection = trimmed.startsWith("[") && trimmed.endsWith("]");
  if (isSection) return processINISection(state, trimmed);
  return processINIKeyValue(state, trimmed);
}

export function parseINI(input: string): Record<string, unknown> {
  const lines = input.trim().split("\n");

  const finalState = lines.reduce((state, line) => processINILine(state, line), {
    result: {},
    currentSection: "",
  } as INIParseState);

  return finalState.result;
}
