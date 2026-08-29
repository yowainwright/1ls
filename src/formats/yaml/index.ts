import type { StackFrame, AnchorStore } from "./types.ts";
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
} from "./utils.ts";

export { parseYAMLValue, findPreviousKey } from "./utils.ts";

const resolveAliasString = (value: string, anchors: AnchorStore): unknown => {
  const alias = value.substring(1);
  const hasAnchor = anchors[alias] !== undefined;
  return hasAnchor ? anchors[alias] : value;
};

const resolveMergeAlias = (value: string, anchors: AnchorStore): Record<string, unknown> | null => {
  const alias = value.substring(1);
  const merged = anchors[alias];

  const isObjectValue = typeof merged === "object" && merged !== null;
  const isPlainObject = !Array.isArray(merged);
  const isValidMerge = isObjectValue && isPlainObject;

  if (!isValidMerge) return null;
  return merged as Record<string, unknown>;
};

const resolveAliases = (obj: unknown, anchors: AnchorStore): unknown => {
  const isAliasString = typeof obj === "string" && obj.startsWith("*");
  if (isAliasString) return resolveAliasString(obj as string, anchors);

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveAliases(item, anchors));
  }

  const isObject = typeof obj === "object" && obj !== null;
  if (!isObject) return obj;

  return Object.entries(obj).reduce<Record<string, unknown>>((result, [key, value]) => {
    const isMergeKey = key === "<<";
    const isAliasValue = typeof value === "string" && value.startsWith("*");
    const isMergeAlias = isMergeKey && isAliasValue;

    if (!isMergeAlias) {
      return { ...result, [key]: resolveAliases(value, anchors) };
    }

    const merged = resolveMergeAlias(value as string, anchors);
    return merged ? { ...result, ...merged } : result;
  }, {});
};

const findFirstContentLine = (lines: string[]): string | undefined =>
  lines.find((line) => {
    const trimmed = stripComment(line).trim();
    const hasContent = Boolean(trimmed);
    if (!hasContent) return false;
    return !isDocumentMarker(trimmed);
  });

const createRootContainer = (lines: string[]): Record<string, unknown> | unknown[] => {
  const firstContent = findFirstContentLine(lines);
  const isRootArray = firstContent?.trim().startsWith("- ");
  if (isRootArray) return [];
  return {};
};

const getTopFrame = (stack: StackFrame[]): StackFrame => stack[stack.length - 1];

const shouldPopFrame = (frame: StackFrame, indent: number): boolean => {
  const isAboveIndent = frame.indent > indent;
  const isAtIndentWithObject = frame.indent >= indent && !Array.isArray(frame.container);
  return isAboveIndent || isAtIndentWithObject;
};

const matchesArrayIndent = (frame: StackFrame, indent: number): boolean => {
  const isCurrentIndent = frame.indent === indent;
  const isRootIndent = frame.indent === -1 && indent === 0;
  return isCurrentIndent || isRootIndent;
};

const popFramesWhile = (stack: StackFrame[], predicate: (frame: StackFrame) => boolean): void => {
  while (stack.length > 1 && predicate(getTopFrame(stack))) {
    stack.length = stack.length - 1;
  }
};

interface ListItemInput {
  content: string;
  targetArray: unknown[];
  stack: StackFrame[];
  indent: number;
  anchors: AnchorStore;
}

const appendToArray = (targetArray: unknown[], value: unknown): void => {
  targetArray[targetArray.length] = value;
};

const appendToStack = (stack: StackFrame[], frame: StackFrame): void => {
  stack[stack.length] = frame;
};

const processObjectListItem = (input: ListItemInput): void => {
  const colonIdx = input.content.indexOf(":");
  const rawKey = input.content.substring(0, colonIdx).trim();
  const rawVal = input.content.substring(colonIdx + 1).trim();
  const { cleanKey, anchorName } = extractAnchorFromKey(rawKey);
  const parsedValue = rawVal ? parseYAMLValue(rawVal) : null;
  const obj: Record<string, unknown> = { [cleanKey]: parsedValue };
  appendToArray(input.targetArray, obj);
  if (anchorName) input.anchors[anchorName] = obj;
  appendToStack(input.stack, { container: obj, indent: input.indent + 2 });
};

const processListItem = (input: ListItemInput): void => {
  const { content, targetArray, stack, indent } = input;
  const isObjectItem = hasValidColonKey(content);
  if (isObjectItem) return processObjectListItem(input);

  if (content) {
    appendToArray(targetArray, parseYAMLValue(content));
    return;
  }

  const emptyObj: Record<string, unknown> = {};
  appendToArray(targetArray, emptyObj);
  appendToStack(stack, { container: emptyObj, indent: indent + 2 });
};

interface YAMLLineInput {
  trimmed: string;
  indent: number;
  lines: string[];
  lineIndex: number;
  stack: StackFrame[];
  anchors: AnchorStore;
}

const attachNewArray = (input: YAMLLineInput, current: StackFrame, targetArray: unknown[]): void => {
  if (current.pendingKey) {
    (current.container as Record<string, unknown>)[current.pendingKey] = targetArray;
    current.pendingKey = undefined;
    return;
  }

  if (Array.isArray(current.container)) return;
  const prevKey = findPreviousKey(input.lines, input.lineIndex);
  if (prevKey) (current.container as Record<string, unknown>)[prevKey] = targetArray;
};

const handleListItem = (input: YAMLLineInput): void => {
  const content = getListItemContent(input.trimmed);
  popFramesWhile(
    input.stack,
    (frame) => shouldPopFrame(frame, input.indent),
  );
  const current = getTopFrame(input.stack);
  const isArrayContainer = Array.isArray(current.container);
  const isMatchingArray = isArrayContainer && matchesArrayIndent(current, input.indent);

  if (isMatchingArray) {
    if (current.indent === -1) current.indent = input.indent;
    processListItem({ ...input, content, targetArray: current.container as unknown[] });
    return;
  }

  const targetArray: unknown[] = [];
  attachNewArray(input, current, targetArray);
  appendToStack(input.stack, { container: targetArray, indent: input.indent });
  processListItem({ ...input, content, targetArray });
};

interface YAMLValueInput extends YAMLLineInput {
  container: Record<string, unknown>;
  key: string;
  value: string;
  anchorName: string | null;
}

const handleMultilineValue = (input: YAMLValueInput): number => {
  const style = input.value.startsWith("|") ? "|" : ">";
  const { contentLines, endIdx } = collectMultilineContent(
    input.lines,
    input.lineIndex + 1,
    input.indent,
  );
  const multilineValue = formatMultilineValue(contentLines, style);
  input.container[input.key] = multilineValue;
  if (input.anchorName) input.anchors[input.anchorName] = multilineValue;
  return endIdx;
};

const handleNestedEmptyValue = (input: YAMLValueInput, nextIndent: number): void => {
  const newObj: Record<string, unknown> = {};
  input.container[input.key] = newObj;
  if (input.anchorName) input.anchors[input.anchorName] = newObj;
  appendToStack(input.stack, { container: newObj, indent: nextIndent });
};

const readNextYAMLLine = (
  input: YAMLValueInput,
): { hasNext: boolean; nextTrimmed: string; nextIndent: number } => {
  const nextIdx = input.lineIndex + 1;
  const hasNext = nextIdx < input.lines.length;
  const nextLine = hasNext ? stripComment(input.lines[nextIdx]) : "";
  const nextIndent = hasNext ? getIndent(nextLine) : -1;
  return {
    hasNext,
    nextTrimmed: nextLine.trim(),
    nextIndent,
  };
};

const handleEmptyValue = (input: YAMLValueInput): void => {
  const current = getTopFrame(input.stack);
  const { hasNext, nextTrimmed, nextIndent } = readNextYAMLLine(input);

  const nextIsListItem = isListItemLine(nextTrimmed);
  const nextIsDeeperList = nextIsListItem && nextIndent > input.indent;
  const nextIsNestedContent = hasNext && nextIndent > input.indent && nextTrimmed;

  if (nextIsDeeperList) {
    current.pendingKey = input.key;
    if (input.anchorName) input.anchors[input.anchorName] = {};
    return;
  }

  if (nextIsNestedContent) {
    handleNestedEmptyValue(input, nextIndent);
    return;
  }

  input.container[input.key] = null;
  if (input.anchorName) input.anchors[input.anchorName] = null;
};

const handleScalarValue = (input: YAMLValueInput): number => {
  const parsedValue = parseYAMLValue(input.value);
  input.container[input.key] = parsedValue;
  if (input.anchorName) input.anchors[input.anchorName] = parsedValue;
  return input.lineIndex;
};

const handleKeyValueLine = (input: YAMLLineInput): number => {
  const parsed = parseKeyValue(input.trimmed);
  if (!parsed) return input.lineIndex;

  const { anchorName, cleanValue } = extractAnchorFromValue(parsed.value);

  popFramesWhile(
    input.stack,
    (f) => f.indent > input.indent || (f.indent === input.indent && Array.isArray(f.container)),
  );

  const container = getTopFrame(input.stack).container;
  if (Array.isArray(container)) return input.lineIndex;

  const valueInput = { ...input, container, key: parsed.key, value: cleanValue, anchorName };
  const isMultiline = isMultilineIndicator(cleanValue);
  if (isMultiline) return handleMultilineValue(valueInput);

  if (cleanValue) return handleScalarValue(valueInput);

  handleEmptyValue(valueInput);
  return input.lineIndex;
};

interface YAMLParseLoop {
  lines: string[];
  anchors: AnchorStore;
  stack: StackFrame[];
}

const parseYAMLLine = (context: YAMLParseLoop, lineIndex: number): number => {
  const line = stripComment(context.lines[lineIndex]);
  const trimmed = line.trim();
  const shouldSkip = !trimmed || isDocumentMarker(trimmed);
  if (shouldSkip) return lineIndex + 1;
  const indent = getIndent(line);
  const input = { trimmed, indent, lines: context.lines, lineIndex, stack: context.stack, anchors: context.anchors };
  if (isListItemLine(trimmed)) {
    handleListItem(input);
    return lineIndex + 1;
  }
  return handleKeyValueLine(input) + 1;
};

export const parseYAML = (input: string): unknown => {
  const lines = input.trim().split("\n");
  const anchors: AnchorStore = {};
  const rootContainer = createRootContainer(lines);
  const stack: StackFrame[] = [{ container: rootContainer, indent: -1 }];

  let i = 0;
  while (i < lines.length) {
    i = parseYAMLLine({ lines, anchors, stack }, i);
  }

  return resolveAliases(rootContainer, anchors);
};
