import { YAML } from "./constants";
import { parseBooleanValue, parseNullValue } from "./utils";

export function parseYAMLValue(value: string): unknown {
  const hasDoubleQuotes = value.startsWith('"') && value.endsWith('"');
  const hasSingleQuotes = value.startsWith("'") && value.endsWith("'");
  const hasQuotes = hasDoubleQuotes || hasSingleQuotes;

  if (hasQuotes) {
    return value.slice(1, -1);
  }

  const boolValue = parseBooleanValue(value);
  if (boolValue !== undefined) return boolValue;

  const nullValue = parseNullValue(value);
  if (nullValue !== undefined) return nullValue;

  const isInteger = YAML.INTEGER.test(value);
  if (isInteger) return parseInt(value, 10);

  const isFloat = YAML.FLOAT.test(value);
  if (isFloat) return parseFloat(value);

  const isInlineArray = value.startsWith("[") && value.endsWith("]");
  if (isInlineArray) {
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseYAMLValue(v.trim()));
  }

  const isInlineObject = value.startsWith("{") && value.endsWith("}");
  if (isInlineObject) {
    const obj: Record<string, unknown> = {};
    const pairs = value.slice(1, -1).split(",");

    pairs.forEach((pair) => {
      const [k, v] = pair.split(":").map((s) => s.trim());
      const hasKeyAndValue = k && v;
      if (hasKeyAndValue) {
        obj[k] = parseYAMLValue(v);
      }
    });

    return obj;
  }

  return value;
}

export function findPreviousKey(lines: string[], currentIndex: number): string | null {
  const indices = Array.from({ length: currentIndex }, (_, i) => currentIndex - 1 - i);

  return indices.reduce<string | null>((found, i) => {
    if (found !== null) return found;

    let line = lines[i];
    const commentIdx = line.indexOf("#");

    const hasComment = commentIdx >= 0;
    if (hasComment) {
      const beforeComment = line.substring(0, commentIdx);
      const quoteCount = (beforeComment.match(/["']/g) || []).length;
      const isOutsideQuotes = quoteCount % 2 === 0;
      if (isOutsideQuotes) {
        line = beforeComment;
      }
    }

    const trimmed = line.trim();
    const isKeyLine = trimmed && !trimmed.startsWith("-") && trimmed.includes(":");

    if (isKeyLine) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (!value) return key;
    }

    return null;
  }, null);
}

export function parseYAML(input: string): unknown {
  const lines = input.trim().split("\n");
  const result: Record<string, unknown> = {};
  const stack: unknown[] = [result];
  const indentStack: number[] = [0];
  let currentList: unknown[] | null = null;
  let listIndent = -1;

  lines.forEach((rawLine, lineNum) => {
    let line = rawLine;

    const commentIdx = line.indexOf("#");
    const hasComment = commentIdx >= 0;
    if (hasComment) {
      const beforeComment = line.substring(0, commentIdx);
      const quoteCount = (beforeComment.match(/["']/g) || []).length;
      const isBalanced = quoteCount % 2 === 0;
      if (isBalanced) {
        line = beforeComment;
      }
    }

    if (!line.trim()) return;
    if (line.trim() === "---" || line.trim() === "...") return;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    const isListItem = trimmed.startsWith("- ");
    if (isListItem) {
      const value = trimmed.substring(2).trim();

      const isSameList = currentList !== null && indent === listIndent;
      if (isSameList) {
        currentList!.push(parseYAMLValue(value));
        return;
      }

      currentList = [parseYAMLValue(value)];
      listIndent = indent;

      while (
        indentStack.length > 1 &&
        indentStack[indentStack.length - 1] >= indent
      ) {
        stack.pop();
        indentStack.pop();
      }

      const parent = stack[stack.length - 1];
      const isObject = typeof parent === "object" && !Array.isArray(parent);

      if (isObject) {
        const prevLine = findPreviousKey(lines, lineNum);
        if (prevLine) {
          (parent as Record<string, unknown>)[prevLine] = currentList;
        }
      }
      return;
    }

    if (!trimmed.startsWith("- ")) {
      currentList = null;
      listIndent = -1;
    }

    const colonIndex = trimmed.indexOf(":");
    const hasKeyValue = colonIndex > 0;

    if (hasKeyValue) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      while (
        indentStack.length > 1 &&
        indentStack[indentStack.length - 1] >= indent
      ) {
        stack.pop();
        indentStack.pop();
      }

      const parent = stack[stack.length - 1];

      if (!value) {
        const nextLineIdx = lineNum + 1;
        if (nextLineIdx < lines.length) {
          const nextLine = lines[nextLineIdx].trim();
          if (nextLine.startsWith("- ")) {
            return;
          }
        }

        const newObj: Record<string, unknown> = {};
        (parent as Record<string, unknown>)[key] = newObj;
        stack.push(newObj);
        indentStack.push(indent);
      } else {
        (parent as Record<string, unknown>)[key] = parseYAMLValue(value);
      }
    }
  });

  return result;
}
