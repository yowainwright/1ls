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

const isAliasString = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return value.startsWith("*");
};

const isMergeAliasEntry = (key: string, value: unknown): value is string => {
  const isMergeKey = key === "<<";
  if (!isMergeKey) return false;
  return isAliasString(value);
};

const resolveAliasEntry = (
  result: Record<string, unknown>,
  key: string,
  value: unknown,
  anchors: AnchorStore,
): void => {
  if (!isMergeAliasEntry(key, value)) {
    result[key] = resolveAliases(value, anchors);
    return;
  }

  const merged = resolveMergeAlias(value, anchors);
  if (!merged) return;
  Object.assign(result, merged);
};

const resolveObjectAliases = (obj: Record<string, unknown>, anchors: AnchorStore): unknown => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    resolveAliasEntry(result, key, value, anchors);
  }

  return result;
};

const resolveAliases = (obj: unknown, anchors: AnchorStore): unknown => {
  if (isAliasString(obj)) return resolveAliasString(obj, anchors);
  if (Array.isArray(obj)) return obj.map((item) => resolveAliases(item, anchors));

  const isObject = typeof obj === "object" && obj !== null;
  if (!isObject) return obj;

  return resolveObjectAliases(obj as Record<string, unknown>, anchors);
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

const removeTopStackFrame = (stack: StackFrame[]): StackFrame[] =>
  stack.slice(0, stack.length - 1);

const popFramesWhile = (
  stack: StackFrame[],
  predicate: (frame: StackFrame) => boolean,
): StackFrame[] => {
  let frames = stack;

  while (frames.length > 1 && predicate(getTopFrame(frames))) {
    frames = removeTopStackFrame(frames);
  }

  return frames;
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

const setObjectValue = (
  object: Record<string, unknown>,
  key: string,
  value: unknown,
): void => {
  Object.assign(object, { [key]: value });
};

const processObjectListItem = (input: ListItemInput): void => {
  const colonIdx = input.content.indexOf(":");
  const rawKey = input.content.substring(0, colonIdx).trim();
  const rawVal = input.content.substring(colonIdx + 1).trim();
  const { cleanKey, anchorName } = extractAnchorFromKey(rawKey);
  const parsedValue = rawVal ? parseYAMLValue(rawVal) : null;
  const obj: Record<string, unknown> = {};
  setObjectValue(obj, cleanKey, parsedValue);
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
    setObjectValue(current.container as Record<string, unknown>, current.pendingKey, targetArray);
    current.pendingKey = undefined;
    return;
  }

  if (Array.isArray(current.container)) return;
  const prevKey = findPreviousKey(input.lines, input.lineIndex);
  if (prevKey) setObjectValue(current.container as Record<string, unknown>, prevKey, targetArray);
};

const handleListItem = (input: YAMLLineInput): StackFrame[] => {
  const content = getListItemContent(input.trimmed);
  const stack = popFramesWhile(
    input.stack,
    (frame) => shouldPopFrame(frame, input.indent),
  );
  const current = getTopFrame(stack);
  const isArrayContainer = Array.isArray(current.container);
  const isMatchingArray = isArrayContainer && matchesArrayIndent(current, input.indent);

  if (isMatchingArray) {
    if (current.indent === -1) current.indent = input.indent;
    processListItem({ ...input, content, stack, targetArray: current.container as unknown[] });
    return stack;
  }

  const targetArray: unknown[] = [];
  attachNewArray(input, current, targetArray);
  appendToStack(stack, { container: targetArray, indent: input.indent });
  processListItem({ ...input, content, stack, targetArray });
  return stack;
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
  setObjectValue(input.container, input.key, newObj);
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

  setObjectValue(input.container, input.key, null);
  if (input.anchorName) input.anchors[input.anchorName] = null;
};

const handleScalarValue = (input: YAMLValueInput): number => {
  const parsedValue = parseYAMLValue(input.value);
  setObjectValue(input.container, input.key, parsedValue);
  if (input.anchorName) input.anchors[input.anchorName] = parsedValue;
  return input.lineIndex;
};

interface YAMLLineResult {
  lineIndex: number;
  stack: StackFrame[];
}

const createYAMLLineResult = (lineIndex: number, stack: StackFrame[]): YAMLLineResult => ({
  lineIndex,
  stack,
});

const handleKeyValueLine = (input: YAMLLineInput): YAMLLineResult => {
  const parsed = parseKeyValue(input.trimmed);
  if (!parsed) return createYAMLLineResult(input.lineIndex, input.stack);

  const { anchorName, cleanValue } = extractAnchorFromValue(parsed.value);

  const stack = popFramesWhile(
    input.stack,
    (f) => f.indent > input.indent || (f.indent === input.indent && Array.isArray(f.container)),
  );

  const container = getTopFrame(stack).container;
  if (Array.isArray(container)) return createYAMLLineResult(input.lineIndex, stack);

  const valueInput = { ...input, stack, container, key: parsed.key, value: cleanValue, anchorName };
  const isMultiline = isMultilineIndicator(cleanValue);
  if (isMultiline) return createYAMLLineResult(handleMultilineValue(valueInput), stack);

  if (cleanValue) return createYAMLLineResult(handleScalarValue(valueInput), stack);

  handleEmptyValue(valueInput);
  return createYAMLLineResult(input.lineIndex, stack);
};

interface YAMLParseLoop {
  lines: string[];
  anchors: AnchorStore;
  stack: StackFrame[];
}

const hasAnchors = (anchors: AnchorStore): boolean => {
  const names = Object.keys(anchors);
  return names.length > 0;
};

const isEmptyObject = (value: unknown): boolean => {
  const isObjectValue = typeof value === "object" && value !== null;
  if (!isObjectValue) return false;
  if (Array.isArray(value)) return false;
  return Object.keys(value).length === 0;
};

const encodeYAMLScalar = (value: string): string => {
  const parsedValue = parseYAMLValue(value);
  return JSON.stringify(parsedValue);
};

const appendString = (values: string[], value: string): void => {
  values[values.length] = value;
};

const parseBasicYAMLList = (lines: string[], startIndex: number): { json: string; nextIndex: number } => {
  const values: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const trimmed = stripComment(lines[index]).trim();
    if (!trimmed.startsWith("- ")) break;
    appendString(values, encodeYAMLScalar(trimmed.substring(2).trim()));
    index++;
  }

  return { json: `[${values.join(",")}]`, nextIndex: index };
};

const parseBasicYAMLObject = (lines: string[], startIndex: number): { json: string; nextIndex: number } => {
  const entries: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = stripComment(lines[index]);
    if (getIndent(line) === 0) break;
    const parsed = parseKeyValue(line.trim());
    if (parsed) appendString(entries, `${JSON.stringify(parsed.key)}:${encodeYAMLScalar(parsed.value)}`);
    index++;
  }

  return { json: `{${entries.join(",")}}`, nextIndex: index };
};

const parseBasicYAMLNestedValue = (
  lines: string[],
  startIndex: number,
): { json: string; nextIndex: number } => {
  const nextLine = stripComment(lines[startIndex] ?? "").trim();
  if (nextLine.startsWith("- ")) return parseBasicYAMLList(lines, startIndex);
  return parseBasicYAMLObject(lines, startIndex);
};

const parseBasicYAMLLine = (
  entries: string[],
  lines: string[],
  index: number,
): number => {
  const parsed = parseKeyValue(stripComment(lines[index]).trim());
  if (!parsed) return index + 1;

  if (parsed.value) {
    appendString(entries, `${JSON.stringify(parsed.key)}:${encodeYAMLScalar(parsed.value)}`);
    return index + 1;
  }

  const nested = parseBasicYAMLNestedValue(lines, index + 1);
  appendString(entries, `${JSON.stringify(parsed.key)}:${nested.json}`);
  return nested.nextIndex;
};

const parseBasicYAML = (input: string): unknown => {
  const lines = input.trim().split("\n");
  const entries: string[] = [];
  let index = 0;

  while (index < lines.length) {
    index = parseBasicYAMLLine(entries, lines, index);
  }

  return JSON.parse(`{${entries.join(",")}}`);
};

const parseYAMLLine = (context: YAMLParseLoop, lineIndex: number): number => {
  const line = stripComment(context.lines[lineIndex]);
  const trimmed = line.trim();
  const shouldSkip = !trimmed || isDocumentMarker(trimmed);
  if (shouldSkip) return lineIndex + 1;
  const indent = getIndent(line);
  const input = { trimmed, indent, lines: context.lines, lineIndex, stack: context.stack, anchors: context.anchors };
  if (isListItemLine(trimmed)) {
    context.stack = handleListItem(input);
    return lineIndex + 1;
  }
  const result = handleKeyValueLine(input);
  context.stack = result.stack;
  return result.lineIndex + 1;
};

export const parseYAML = (input: string): unknown => {
  const lines = input.trim().split("\n");
  const anchors: AnchorStore = {};
  const rootContainer = createRootContainer(lines);
  const context: YAMLParseLoop = {
    lines,
    anchors,
    stack: [{ container: rootContainer, indent: -1 }],
  };

  let i = 0;
  while (i < lines.length) {
    i = parseYAMLLine(context, i);
  }

  const parsed = hasAnchors(anchors) ? resolveAliases(rootContainer, anchors) : rootContainer;
  const shouldUseFallback = isEmptyObject(parsed) && Boolean(input.trim());
  if (shouldUseFallback) return parseBasicYAML(input);
  return parsed;
};
