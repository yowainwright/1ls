import { YAML } from "../constants.ts";
import { parseBooleanValue, parseNullValue } from "../utils.ts";

export const getIndent = (line: string): number => line.length - line.trimStart().length;

export const countQuotes = (text: string): number => (text.match(/["']/g) || []).length;

export const isCommentOutsideQuotes = (line: string, commentIdx: number): boolean => {
  const beforeComment = line.substring(0, commentIdx);
  const quoteCount = countQuotes(beforeComment);
  const isEvenQuoteCount = quoteCount % 2 === 0;
  return isEvenQuoteCount;
};

export const stripComment = (line: string): string => {
  const commentIdx = line.indexOf("#");
  const hasComment = commentIdx >= 0;
  if (!hasComment) return line;

  const shouldStrip = isCommentOutsideQuotes(line, commentIdx);
  return shouldStrip ? line.substring(0, commentIdx) : line;
};

export const isMultilineIndicator = (value: string): boolean => {
  if (value === "|") return true;
  if (value === ">") return true;
  if (value === "|+") return true;
  if (value === ">-") return true;
  if (value === "|-") return true;
  return value === ">+";
};

export const isDocumentMarker = (trimmed: string): boolean =>
  trimmed === "---" || trimmed === "...";

export const isListItemLine = (trimmed: string): boolean =>
  trimmed.startsWith("- ") || trimmed === "-";

export const getListItemContent = (trimmed: string): string =>
  trimmed === "-" ? "" : trimmed.substring(2).trim();

export const hasValidColonKey = (value: string): boolean => {
  const colonIdx = value.indexOf(":");
  if (colonIdx <= 0) return false;

  const key = value.substring(0, colonIdx);
  const isUnquotedWithoutSpaces = !key.includes(" ");
  const isQuoted = key.startsWith('"') || key.startsWith("'");

  return isUnquotedWithoutSpaces || isQuoted;
};

export const parseKeyValue = (line: string): { key: string; value: string } | null => {
  const colonIdx = line.indexOf(":");
  if (colonIdx <= 0) return null;

  return {
    key: line.substring(0, colonIdx).trim(),
    value: line.substring(colonIdx + 1).trim(),
  };
};

export const extractAnchorFromValue = (
  value: string,
): { anchorName: string | null; cleanValue: string } => {
  const startsWithAnchor = value.startsWith("&");
  if (!startsWithAnchor) return { anchorName: null, cleanValue: value };

  const spaceIdx = value.indexOf(" ");
  const hasValueAfterAnchor = spaceIdx > 0;

  if (hasValueAfterAnchor) {
    return { anchorName: value.substring(1, spaceIdx), cleanValue: value.substring(spaceIdx + 1) };
  }

  return { anchorName: value.substring(1), cleanValue: "" };
};

export const extractAnchorFromKey = (
  key: string,
): { cleanKey: string; anchorName: string | null } => {
  const hasAnchor = key.includes(" &");
  if (!hasAnchor) return { cleanKey: key, anchorName: null };

  const [cleanKey, anchorName] = key.split(" &");
  return { cleanKey, anchorName };
};

const parseTypeTag = (value: string): { tag: string | null; content: string } => {
  const isTypeTagged = value.startsWith("!!");
  if (!isTypeTagged) return { tag: null, content: value };

  const spaceIdx = value.indexOf(" ");
  const hasContent = spaceIdx > 0;
  if (!hasContent) return { tag: null, content: value };

  return {
    tag: value.substring(2, spaceIdx),
    content: value.substring(spaceIdx + 1),
  };
};

const parseQuotedString = (content: string): string | null => {
  const hasDoubleQuotes = content.startsWith('"') && content.endsWith('"');
  const hasSingleQuotes = content.startsWith("'") && content.endsWith("'");
  const hasQuotes = hasDoubleQuotes || hasSingleQuotes;

  if (!hasQuotes) return null;
  return content.slice(1, -1);
};

const parseInlineArray = (content: string): unknown[] | null => {
  const isInlineArray = content.startsWith("[") && content.endsWith("]");
  if (!isInlineArray) return null;

  return content
    .slice(1, -1)
    .split(",")
    .map((v) => parseYAMLValue(v.trim()));
};

const parseInlineObjectPair = (pair: string): readonly [string, string] | null => {
  const [key, value] = pair.split(":");
  const trimmedKey = key?.trim();
  const trimmedValue = value?.trim();
  const hasKeyAndValue = Boolean(trimmedKey && trimmedValue);

  return hasKeyAndValue ? [trimmedKey, trimmedValue] : null;
};

const parseInlineObject = (content: string): Record<string, unknown> | null => {
  const isInlineObject = content.startsWith("{") && content.endsWith("}");
  if (!isInlineObject) return null;

  const pairs = content.slice(1, -1).split(",");
  return pairs.reduce<Record<string, unknown>>((object, pair) => {
    const parsedPair = parseInlineObjectPair(pair);
    if (!parsedPair) return object;

    const [key, value] = parsedPair;
    return { ...object, [key]: parseYAMLValue(value) };
  }, {});
};

export const parseYAMLValue = (value: string): unknown => {
  const { tag, content } = parseTypeTag(value);
  if (tag === "str") return content;

  const quotedString = parseQuotedString(content);
  if (quotedString !== null) return quotedString;

  const boolValue = parseBooleanValue(content);
  if (boolValue !== undefined) return boolValue;

  const nullValue = parseNullValue(content);
  if (nullValue !== undefined) return nullValue;

  const isInteger = YAML.INTEGER.test(content);
  if (isInteger) return parseInt(content, 10);

  const isFloat = YAML.FLOAT.test(content);
  if (isFloat) return parseFloat(content);

  const inlineArray = parseInlineArray(content);
  if (inlineArray !== null) return inlineArray;

  const inlineObject = parseInlineObject(content);
  if (inlineObject !== null) return inlineObject;

  return content;
};

export const findPreviousKey = (lines: string[], currentIndex: number): string | null =>
  Array.from({ length: currentIndex }, (_, i) => currentIndex - 1 - i).reduce<string | null>(
    (found, i) => {
      if (found !== null) return found;

      const line = stripComment(lines[i]);
      const trimmed = line.trim();

      const hasKeyLine = Boolean(trimmed) && !trimmed.startsWith("-") && trimmed.includes(":");
      if (!hasKeyLine) return null;

      const parsed = parseKeyValue(trimmed);
      if (!parsed) return null;

      const hasEmptyOrMultilineValue = !parsed.value || isMultilineIndicator(parsed.value);
      return hasEmptyOrMultilineValue ? parsed.key : null;
    },
    null,
  );

interface MultilineState {
  contentLines: string[];
  endIdx: number;
  done: boolean;
}

interface MultilineContext {
  startIdx: number;
  baseIndent: number;
}

const collectMultilineLine = (
  state: MultilineState,
  line: string,
  idx: number,
  context: MultilineContext,
): MultilineState => {
  if (state.done) return state;
  const absoluteIndex = context.startIdx + idx;
  if (!line.trim()) return { ...state, contentLines: [...state.contentLines, ""], endIdx: absoluteIndex };
  const isOutdented = getIndent(line) <= context.baseIndent;
  if (isOutdented) return { ...state, done: true };
  const content = line.substring(context.baseIndent + 2);
  return { ...state, contentLines: [...state.contentLines, content], endIdx: absoluteIndex };
};

const trimTrailingBlankLines = (lines: string[]): string[] =>
  lines.reduceRight<string[]>((acc, line) => {
    const shouldDrop = acc.length === 0 && line === "";
    if (shouldDrop) return acc;
    return [line, ...acc];
  }, []);

export const collectMultilineContent = (
  lines: string[],
  startIdx: number,
  baseIndent: number,
): { contentLines: string[]; endIdx: number } => {
  const context = { startIdx, baseIndent };
  const result = lines.slice(startIdx).reduce<MultilineState>(
    (state, line, idx) => collectMultilineLine(state, line, idx, context),
    { contentLines: [], endIdx: startIdx - 1, done: false },
  );

  const trimmedLines = trimTrailingBlankLines(result.contentLines);

  return { contentLines: trimmedLines, endIdx: result.endIdx };
};

export const formatMultilineValue = (contentLines: string[], style: "|" | ">"): string =>
  style === "|" ? contentLines.join("\n") : contentLines.join(" ").replace(/\s+/g, " ").trim();
