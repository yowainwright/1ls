import type { StackFrame, AnchorStore } from "./types";
import {
  getIndent,
  stripComment,
  isDocumentMarker,
  isListItemLine,
  getListItemContent,
  hasValidColonKey,
  parseKeyValue,
  extractAnchorFromValue,
  extractAnchorFromKey,
  isMultilineIndicator,
  parseYAMLValue,
  findPreviousKey,
  collectMultilineContent,
  formatMultilineValue,
} from "./utils";

export { parseYAMLValue, findPreviousKey } from "./utils";

const resolveAliasString = (
  value: string,
  anchors: AnchorStore,
): unknown => {
  const alias = value.substring(1);
  const hasAnchor = anchors[alias] !== undefined;
  return hasAnchor ? anchors[alias] : value;
};

const resolveMergeAlias = (
  value: string,
  anchors: AnchorStore,
): Record<string, unknown> | null => {
  const alias = value.substring(1);
  const merged = anchors[alias];

  const isValidMerge =
    typeof merged === "object" && merged !== null && !Array.isArray(merged);

  return isValidMerge ? (merged as Record<string, unknown>) : null;
};

const resolveAliases = (obj: unknown, anchors: AnchorStore): unknown => {
  const isAliasString = typeof obj === "string" && obj.startsWith("*");
  if (isAliasString) return resolveAliasString(obj as string, anchors);

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveAliases(item, anchors));
  }

  const isObject = typeof obj === "object" && obj !== null;
  if (!isObject) return obj;

  return Object.entries(obj).reduce<Record<string, unknown>>(
    (result, [key, value]) => {
      const isMergeKey = key === "<<";
      const isAliasValue = typeof value === "string" && value.startsWith("*");
      const isMergeAlias = isMergeKey && isAliasValue;

      if (!isMergeAlias) {
        return { ...result, [key]: resolveAliases(value, anchors) };
      }

      const merged = resolveMergeAlias(value as string, anchors);
      return merged ? { ...result, ...merged } : result;
    },
    {},
  );
};

const findFirstContentLine = (lines: string[]): string | undefined =>
  lines.find((line) => {
    const trimmed = stripComment(line).trim();
    return trimmed && !isDocumentMarker(trimmed);
  });

const createRootContainer = (
  lines: string[],
): Record<string, unknown> | unknown[] => {
  const firstContent = findFirstContentLine(lines);
  const isRootArray = firstContent?.trim().startsWith("- ");
  return isRootArray ? [] : {};
};

const getTopFrame = (stack: StackFrame[]): StackFrame =>
  stack[stack.length - 1];

const popFramesWhile = (
  stack: StackFrame[],
  predicate: (frame: StackFrame) => boolean,
): void => {
  while (stack.length > 1 && predicate(getTopFrame(stack))) {
    stack.pop();
  }
};

const processListItem = (
  content: string,
  targetArray: unknown[],
  stack: StackFrame[],
  indent: number,
  anchors: AnchorStore,
): void => {
  const isObjectItem = hasValidColonKey(content);

  if (isObjectItem) {
    const colonIdx = content.indexOf(":");
    const rawKey = content.substring(0, colonIdx).trim();
    const rawVal = content.substring(colonIdx + 1).trim();

    const { cleanKey, anchorName } = extractAnchorFromKey(rawKey);
    const parsedValue = rawVal ? parseYAMLValue(rawVal) : null;
    const obj: Record<string, unknown> = { [cleanKey]: parsedValue };

    targetArray.push(obj);

    if (anchorName) anchors[anchorName] = obj;

    stack.push({ container: obj, indent: indent + 2 });
    return;
  }

  if (content) {
    targetArray.push(parseYAMLValue(content));
    return;
  }

  const emptyObj: Record<string, unknown> = {};
  targetArray.push(emptyObj);
  stack.push({ container: emptyObj, indent: indent + 2 });
};

const handleListItem = (
  trimmed: string,
  indent: number,
  lines: string[],
  lineIndex: number,
  stack: StackFrame[],
  anchors: AnchorStore,
): void => {
  const content = getListItemContent(trimmed);

  popFramesWhile(
    stack,
    (f) => f.indent > indent || (f.indent >= indent && !Array.isArray(f.container)),
  );

  const current = getTopFrame(stack);

  const isMatchingArray =
    Array.isArray(current.container) &&
    (current.indent === indent || (current.indent === -1 && indent === 0));

  if (isMatchingArray) {
    if (current.indent === -1) current.indent = indent;
    processListItem(content, current.container as unknown[], stack, indent, anchors);
    return;
  }

  const targetArray: unknown[] = [];

  if (current.pendingKey) {
    (current.container as Record<string, unknown>)[current.pendingKey] = targetArray;
    current.pendingKey = undefined;
  } else if (!Array.isArray(current.container)) {
    const prevKey = findPreviousKey(lines, lineIndex);
    if (prevKey) {
      (current.container as Record<string, unknown>)[prevKey] = targetArray;
    }
  }

  stack.push({ container: targetArray, indent });
  processListItem(content, targetArray, stack, indent, anchors);
};

const handleMultilineValue = (
  container: Record<string, unknown>,
  key: string,
  value: string,
  lines: string[],
  lineIndex: number,
  indent: number,
  anchors: AnchorStore,
  anchorName: string | null,
): number => {
  const style = value.startsWith("|") ? "|" : ">";
  const { contentLines, endIdx } = collectMultilineContent(lines, lineIndex + 1, indent);
  const multilineValue = formatMultilineValue(contentLines, style);

  container[key] = multilineValue;
  if (anchorName) anchors[anchorName] = multilineValue;

  return endIdx;
};

const handleEmptyValue = (
  container: Record<string, unknown>,
  key: string,
  lines: string[],
  lineIndex: number,
  indent: number,
  stack: StackFrame[],
  anchors: AnchorStore,
  anchorName: string | null,
): void => {
  const current = getTopFrame(stack);
  const nextIdx = lineIndex + 1;
  const hasNext = nextIdx < lines.length;
  const nextLine = hasNext ? stripComment(lines[nextIdx]) : "";
  const nextTrimmed = nextLine.trim();
  const nextIndent = hasNext ? getIndent(nextLine) : -1;

  const nextIsListItem = isListItemLine(nextTrimmed);
  const nextIsDeeperList = nextIsListItem && nextIndent > indent;
  const nextIsNestedContent = hasNext && nextIndent > indent && nextTrimmed;

  if (nextIsDeeperList) {
    current.pendingKey = key;
    if (anchorName) anchors[anchorName] = {};
    return;
  }

  if (nextIsNestedContent) {
    const newObj: Record<string, unknown> = {};
    container[key] = newObj;
    if (anchorName) anchors[anchorName] = newObj;
    stack.push({ container: newObj, indent: nextIndent });
    return;
  }

  container[key] = null;
  if (anchorName) anchors[anchorName] = null;
};

const handleKeyValueLine = (
  trimmed: string,
  indent: number,
  lines: string[],
  lineIndex: number,
  stack: StackFrame[],
  anchors: AnchorStore,
): number => {
  const parsed = parseKeyValue(trimmed);
  if (!parsed) return lineIndex;

  const { anchorName, cleanValue } = extractAnchorFromValue(parsed.value);

  popFramesWhile(
    stack,
    (f) => f.indent > indent || (f.indent === indent && Array.isArray(f.container)),
  );

  const container = getTopFrame(stack).container;
  if (Array.isArray(container)) return lineIndex;

  const isMultiline = isMultilineIndicator(cleanValue);
  if (isMultiline) {
    return handleMultilineValue(
      container,
      parsed.key,
      cleanValue,
      lines,
      lineIndex,
      indent,
      anchors,
      anchorName,
    );
  }

  if (cleanValue) {
    const parsedValue = parseYAMLValue(cleanValue);
    container[parsed.key] = parsedValue;
    if (anchorName) anchors[anchorName] = parsedValue;
    return lineIndex;
  }

  handleEmptyValue(
    container,
    parsed.key,
    lines,
    lineIndex,
    indent,
    stack,
    anchors,
    anchorName,
  );

  return lineIndex;
};

export const parseYAML = (input: string): unknown => {
  const lines = input.trim().split("\n");
  const anchors: AnchorStore = {};
  const rootContainer = createRootContainer(lines);
  const stack: StackFrame[] = [{ container: rootContainer, indent: -1 }];

  let i = 0;
  while (i < lines.length) {
    const line = stripComment(lines[i]);
    const trimmed = line.trim();

    const shouldSkip = !trimmed || isDocumentMarker(trimmed);
    if (shouldSkip) {
      i++;
      continue;
    }

    const indent = getIndent(line);

    if (isListItemLine(trimmed)) {
      handleListItem(trimmed, indent, lines, i, stack, anchors);
      i++;
      continue;
    }

    i = handleKeyValueLine(trimmed, indent, lines, i, stack, anchors) + 1;
  }

  return resolveAliases(rootContainer, anchors);
};
