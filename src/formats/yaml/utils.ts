import { YAML } from "../constants";
import { parseBooleanValue, parseNullValue } from "../utils";

export const getIndent = (line: string): number =>
  line.length - line.trimStart().length;

export const countQuotes = (text: string): number =>
  (text.match(/["']/g) || []).length;

export const isCommentOutsideQuotes = (line: string, commentIdx: number): boolean => {
  const beforeComment = line.substring(0, commentIdx);
  return countQuotes(beforeComment) % 2 === 0;
};

export const stripComment = (line: string): string => {
  const commentIdx = line.indexOf("#");
  const hasNoComment = commentIdx < 0;
  if (hasNoComment) return line;

  const shouldStrip = isCommentOutsideQuotes(line, commentIdx);
  return shouldStrip ? line.substring(0, commentIdx) : line;
};

export const isMultilineIndicator = (value: string): boolean =>
  ["|", ">", "|+", ">-", "|-", ">+"].includes(value);

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

export const parseKeyValue = (
  line: string,
): { key: string; value: string } | null => {
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

  return hasValueAfterAnchor
    ? { anchorName: value.substring(1, spaceIdx), cleanValue: value.substring(spaceIdx + 1) }
    : { anchorName: value.substring(1), cleanValue: "" };
};

export const extractAnchorFromKey = (
  key: string,
): { cleanKey: string; anchorName: string | null } => {
  const hasAnchor = key.includes(" &");
  if (!hasAnchor) return { cleanKey: key, anchorName: null };

  const [cleanKey, anchorName] = key.split(" &");
  return { cleanKey, anchorName };
};

const parseTypeTag = (
  value: string,
): { tag: string | null; content: string } => {
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

  return hasQuotes ? content.slice(1, -1) : null;
};

const parseInlineArray = (content: string): unknown[] | null => {
  const isInlineArray = content.startsWith("[") && content.endsWith("]");
  if (!isInlineArray) return null;

  return content
    .slice(1, -1)
    .split(",")
    .map((v) => parseYAMLValue(v.trim()));
};

const parseInlineObject = (content: string): Record<string, unknown> | null => {
  const isInlineObject = content.startsWith("{") && content.endsWith("}");
  if (!isInlineObject) return null;

  return content
    .slice(1, -1)
    .split(",")
    .map((pair) => pair.split(":").map((s) => s.trim()))
    .filter(([k, v]) => k && v)
    .reduce<Record<string, unknown>>(
      (obj, [k, v]) => ({ ...obj, [k]: parseYAMLValue(v) }),
      {},
    );
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

export const findPreviousKey = (
  lines: string[],
  currentIndex: number,
): string | null =>
  Array.from({ length: currentIndex }, (_, i) => currentIndex - 1 - i)
    .reduce<string | null>((found, i) => {
      if (found !== null) return found;

      const line = stripComment(lines[i]);
      const trimmed = line.trim();

      const isNotKeyLine = !trimmed || trimmed.startsWith("-") || !trimmed.includes(":");
      if (isNotKeyLine) return null;

      const parsed = parseKeyValue(trimmed);
      if (!parsed) return null;

      const hasEmptyOrMultilineValue = !parsed.value || isMultilineIndicator(parsed.value);
      return hasEmptyOrMultilineValue ? parsed.key : null;
    }, null);

export const collectMultilineContent = (
  lines: string[],
  startIdx: number,
  baseIndent: number,
): { contentLines: string[]; endIdx: number } => {
  const result = lines.slice(startIdx).reduce<{
    contentLines: string[];
    endIdx: number;
    done: boolean;
  }>(
    (acc, line, idx) => {
      if (acc.done) return acc;

      const isEmpty = !line.trim();
      if (isEmpty) {
        return { ...acc, contentLines: [...acc.contentLines, ""], endIdx: startIdx + idx };
      }

      const isOutdented = getIndent(line) <= baseIndent;
      if (isOutdented) return { ...acc, done: true };

      const content = line.substring(baseIndent + 2);
      return { ...acc, contentLines: [...acc.contentLines, content], endIdx: startIdx + idx };
    },
    { contentLines: [], endIdx: startIdx - 1, done: false },
  );

  const trimmedLines = result.contentLines
    .reduceRight<string[]>(
      (acc, line) => (acc.length === 0 && line === "" ? acc : [line, ...acc]),
      [],
    );

  return { contentLines: trimmedLines, endIdx: result.endIdx };
};

export const formatMultilineValue = (
  contentLines: string[],
  style: "|" | ">",
): string =>
  style === "|"
    ? contentLines.join("\n")
    : contentLines.join(" ").replace(/\s+/g, " ").trim();
