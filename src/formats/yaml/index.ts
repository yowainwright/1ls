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

const appendToArray = (targetArray: unknown[], value: unknown): number => {
  targetArray[targetArray.length] = value;
  return targetArray.length - 1;
};

const appendToStack = (stack: StackFrame[], frame: StackFrame): void => {
  stack[stack.length] = frame;
};

const createStackFrame = (
  container: Record<string, unknown> | unknown[],
  indent: number,
  parentKey: string | number | null,
): StackFrame => ({
  container,
  indent,
  pendingKey: null,
  parentKey,
});

const setObjectValue = (
  object: Record<string, unknown>,
  key: string,
  value: unknown,
): void => {
  object[key] = value;
};

const processObjectListItem = (input: ListItemInput): void => {
  const colonIdx = input.content.indexOf(":");
  const rawKey = input.content.substring(0, colonIdx).trim();
  const rawVal = input.content.substring(colonIdx + 1).trim();
  const { cleanKey, anchorName } = extractAnchorFromKey(rawKey);
  const parsedValue = rawVal ? parseYAMLValue(rawVal) : null;
  const obj: Record<string, unknown> = {};
  setObjectValue(obj, cleanKey, parsedValue);
  const parentKey = appendToArray(input.targetArray, obj);
  if (anchorName) input.anchors[anchorName] = obj;
  appendToStack(input.stack, createStackFrame(obj, input.indent + 2, parentKey));
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
  const parentKey = appendToArray(targetArray, emptyObj);
  appendToStack(stack, createStackFrame(emptyObj, indent + 2, parentKey));
};

interface YAMLLineInput {
  trimmed: string;
  indent: number;
  lines: string[];
  lineIndex: number;
  stack: StackFrame[];
  anchors: AnchorStore;
}

const attachNewArray = (
  input: YAMLLineInput,
  current: StackFrame,
  targetArray: unknown[],
): string | null => {
  if (current.pendingKey) {
    const pendingKey = consumePendingKey(current);
    setObjectValue(current.container as Record<string, unknown>, pendingKey, targetArray);
    return pendingKey;
  }

  if (Array.isArray(current.container)) return null;
  const prevKey = findPreviousKey(input.lines, input.lineIndex);
  if (prevKey) setObjectValue(current.container as Record<string, unknown>, prevKey, targetArray);
  return prevKey;
};

const consumePendingKey = (frame: StackFrame): string => {
  const pendingKey = frame.pendingKey as string;
  frame.pendingKey = null;
  return pendingKey;
};

const processMatchingArrayListItem = (
  input: YAMLLineInput,
  content: string,
  stack: StackFrame[],
  current: StackFrame,
): void => {
  if (current.indent === -1) current.indent = input.indent;
  processListItem({
    content,
    targetArray: current.container as unknown[],
    stack,
    indent: input.indent,
    anchors: input.anchors,
  });
};

const processNewArrayListItem = (
  input: YAMLLineInput,
  content: string,
  stack: StackFrame[],
  current: StackFrame,
): void => {
  const targetArray: unknown[] = [];
  const parentKey = attachNewArray(input, current, targetArray);
  appendToStack(stack, createStackFrame(targetArray, input.indent, parentKey));
  processListItem({ content, targetArray, stack, indent: input.indent, anchors: input.anchors });
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
    processMatchingArrayListItem(input, content, stack, current);
    return stack;
  }

  processNewArrayListItem(input, content, stack, current);
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
  appendToStack(input.stack, createStackFrame(newObj, nextIndent, input.key));
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

interface YAMLLineResult {
  lineIndex: number;
  stack: StackFrame[];
}

const createYAMLLineResult = (lineIndex: number, stack: StackFrame[]): YAMLLineResult => ({
  lineIndex,
  stack,
});

interface ScalarValueInput {
  container: Record<string, unknown>;
  key: string;
  value: string;
  anchorName: string | null;
  anchors: AnchorStore;
}

const setScalarValue = (input: ScalarValueInput): Record<string, unknown> => {
  const parsedValue = parseYAMLValue(input.value);
  setObjectValue(input.container, input.key, parsedValue);
  if (input.anchorName) input.anchors[input.anchorName] = parsedValue;
  return input.container;
};

const replaceTopFrameContainer = (
  stack: StackFrame[],
  container: Record<string, unknown>,
): void => {
  const index = stack.length - 1;
  const current = stack[index];
  stack[index] = {
    container,
    indent: current.indent,
    pendingKey: current.pendingKey,
    parentKey: current.parentKey,
  };
};

const setContainerChild = (
  container: Record<string, unknown> | unknown[],
  key: string | number,
  value: unknown,
): Record<string, unknown> | unknown[] => {
  if (Array.isArray(container)) {
    container[key as number] = value;
    return container;
  }

  container[key as string] = value;
  return container;
};

const propagateTopFrameContainer = (stack: StackFrame[]): void => {
  let childIndex = stack.length - 1;

  while (childIndex > 0) {
    const child = stack[childIndex];
    if (child.parentKey === null) return;

    const parentIndex = childIndex - 1;
    const parent = stack[parentIndex];
    const parentContainer = setContainerChild(parent.container, child.parentKey, child.container);
    stack[parentIndex] = {
      container: parentContainer,
      indent: parent.indent,
      pendingKey: parent.pendingKey,
      parentKey: parent.parentKey,
    };
    childIndex = parentIndex;
  }
};

const popKeyValueFrames = (input: YAMLLineInput): StackFrame[] =>
  popFramesWhile(
    input.stack,
    (f) => f.indent > input.indent || (f.indent === input.indent && Array.isArray(f.container)),
  );

const handleScalarKeyValueLine = (
  input: YAMLLineInput,
  stack: StackFrame[],
  scalar: ScalarValueInput,
): YAMLLineResult => {
  const updatedContainer = setScalarValue(scalar);
  replaceTopFrameContainer(stack, updatedContainer);
  propagateTopFrameContainer(stack);
  return createYAMLLineResult(input.lineIndex, stack);
};

interface CreateValueInputArgs {
  input: YAMLLineInput;
  stack: StackFrame[];
  container: Record<string, unknown>;
  key: string;
  value: string;
  anchorName: string | null;
}

interface KeyValueParts {
  key: string;
  cleanValue: string;
  anchorName: string | null;
}

interface ObjectKeyValueInput {
  input: YAMLLineInput;
  stack: StackFrame[];
  container: Record<string, unknown>;
  parts: KeyValueParts;
}

const createValueInput = (args: CreateValueInputArgs): YAMLValueInput => ({
  trimmed: args.input.trimmed,
  indent: args.input.indent,
  lines: args.input.lines,
  lineIndex: args.input.lineIndex,
  stack: args.stack,
  anchors: args.input.anchors,
  container: args.container,
  key: args.key,
  value: args.value,
  anchorName: args.anchorName,
});

const createScalarInput = (args: ObjectKeyValueInput): ScalarValueInput => ({
  container: args.container,
  key: args.parts.key,
  value: args.parts.cleanValue,
  anchorName: args.parts.anchorName,
  anchors: args.input.anchors,
});

const handleObjectKeyValueLine = (args: ObjectKeyValueInput): YAMLLineResult => {
  const isMultiline = isMultilineIndicator(args.parts.cleanValue);
  const isScalarValue = Boolean(args.parts.cleanValue) && !isMultiline;
  if (isScalarValue) {
    const scalar = createScalarInput(args);
    return handleScalarKeyValueLine(args.input, args.stack, scalar);
  }

  const valueInput = createValueInput({
    input: args.input,
    stack: args.stack,
    container: args.container,
    key: args.parts.key,
    value: args.parts.cleanValue,
    anchorName: args.parts.anchorName,
  });
  if (isMultiline) return createYAMLLineResult(handleMultilineValue(valueInput), args.stack);

  handleEmptyValue(valueInput);
  return createYAMLLineResult(args.input.lineIndex, args.stack);
};

const createKeyValueParts = (key: string, value: string): KeyValueParts => {
  const { anchorName, cleanValue } = extractAnchorFromValue(value);
  return { key, cleanValue, anchorName };
};

const handleKeyValueLine = (input: YAMLLineInput): YAMLLineResult => {
  const parsed = parseKeyValue(input.trimmed);
  if (!parsed) return createYAMLLineResult(input.lineIndex, input.stack);

  const stack = popKeyValueFrames(input);
  const container = getTopFrame(stack).container;
  if (Array.isArray(container)) return createYAMLLineResult(input.lineIndex, stack);

  const parts = createKeyValueParts(parsed.key, parsed.value);
  return handleObjectKeyValueLine({ input, stack, container, parts });
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

const createYAMLLineInput = (
  context: YAMLParseLoop,
  lineIndex: number,
  line: string,
): YAMLLineInput => ({
  trimmed: line.trim(),
  indent: getIndent(line),
  lines: context.lines,
  lineIndex,
  stack: context.stack,
  anchors: context.anchors,
});

const parseYAMLLine = (context: YAMLParseLoop, lineIndex: number): number => {
  const line = stripComment(context.lines[lineIndex]);
  const trimmed = line.trim();
  const shouldSkip = !trimmed || isDocumentMarker(trimmed);
  if (shouldSkip) return lineIndex + 1;
  const input = createYAMLLineInput(context, lineIndex, line);
  if (isListItemLine(trimmed)) {
    context.stack = handleListItem(input);
    return lineIndex + 1;
  }
  const result = handleKeyValueLine(input);
  context.stack = result.stack;
  return result.lineIndex + 1;
};

const createYAMLParseLoop = (lines: string[]): YAMLParseLoop => {
  const anchors: AnchorStore = {};
  const rootContainer = createRootContainer(lines);
  return {
    lines,
    anchors,
    stack: [createStackFrame(rootContainer, -1, null)],
  };
};

const parseYAMLLines = (context: YAMLParseLoop): void => {
  let i = 0;
  while (i < context.lines.length) {
    i = parseYAMLLine(context, i);
  }
};

export const parseYAML = (input: string): unknown => {
  const lines = input.trim().split("\n");
  const context = createYAMLParseLoop(lines);
  parseYAMLLines(context);

  const stackRoot = context.stack[0].container;
  const parsed = hasAnchors(context.anchors) ? resolveAliases(stackRoot, context.anchors) : stackRoot;
  return parsed;
};
