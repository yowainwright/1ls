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

function stripComment(line: string): string {
  const commentIdx = line.indexOf("#");
  if (commentIdx < 0) return line;
  const beforeComment = line.substring(0, commentIdx);
  const quoteCount = (beforeComment.match(/["']/g) || []).length;
  return quoteCount % 2 === 0 ? beforeComment : line;
}

function isListItemWithObject(value: string): boolean {
  const colonIdx = value.indexOf(":");
  if (colonIdx <= 0) return false;
  const key = value.substring(0, colonIdx);
  return !key.includes(" ") || key.startsWith('"') || key.startsWith("'");
}

interface StackFrame {
  container: Record<string, unknown> | unknown[]
  indent: number
  pendingKey?: string
}

export function parseYAML(input: string): unknown {
  const lines = input.trim().split("\n");
  const result: Record<string, unknown> = {};
  const stack: StackFrame[] = [{ container: result, indent: -1 }];

  function getIndent(line: string): number {
    return line.length - line.trimStart().length;
  }

  function top(): StackFrame {
    return stack[stack.length - 1];
  }

  function popWhile(predicate: (frame: StackFrame) => boolean): void {
    while (stack.length > 1 && predicate(top())) {
      stack.pop();
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = stripComment(lines[i]);
    const trimmed = line.trim();

    if (!trimmed || trimmed === "---" || trimmed === "...") continue;

    const indent = getIndent(line);
    const isListItem = trimmed.startsWith("- ");

    if (isListItem) {
      const content = trimmed.substring(2).trim();

      popWhile((f) => f.indent > indent || (f.indent >= indent && !Array.isArray(f.container)));

      let targetArray: unknown[];
      const current = top();

      if (Array.isArray(current.container) && current.indent === indent) {
        targetArray = current.container;
      } else {
        targetArray = [];

        if (current.pendingKey) {
          (current.container as Record<string, unknown>)[current.pendingKey] = targetArray;
          current.pendingKey = undefined;
        } else {
          const prevKey = findPreviousKey(lines, i);
          if (prevKey && !Array.isArray(current.container)) {
            (current.container as Record<string, unknown>)[prevKey] = targetArray;
          }
        }
        stack.push({ container: targetArray, indent });
      }

      if (isListItemWithObject(content)) {
        const colonIdx = content.indexOf(":");
        const key = content.substring(0, colonIdx).trim();
        const val = content.substring(colonIdx + 1).trim();
        const obj: Record<string, unknown> = { [key]: val ? parseYAMLValue(val) : null };
        targetArray.push(obj);
        stack.push({ container: obj, indent: indent + 2 });
      } else if (content) {
        targetArray.push(parseYAMLValue(content));
      } else {
        const obj: Record<string, unknown> = {};
        targetArray.push(obj);
        stack.push({ container: obj, indent: indent + 2 });
      }
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const key = trimmed.substring(0, colonIdx).trim();
      const value = trimmed.substring(colonIdx + 1).trim();

      popWhile((f) => f.indent > indent || (f.indent === indent && Array.isArray(f.container)));

      const current = top();
      const container = current.container;

      if (Array.isArray(container)) continue;

      if (value) {
        container[key] = parseYAMLValue(value);
      } else {
        const nextIdx = i + 1;
        const hasNext = nextIdx < lines.length;
        const nextLine = hasNext ? stripComment(lines[nextIdx]) : "";
        const nextTrimmed = nextLine.trim();
        const nextIndent = hasNext ? getIndent(nextLine) : -1;
        const nextIsListItem = nextTrimmed.startsWith("- ");
        const nextIsNestedContent = hasNext && nextIndent > indent && nextTrimmed;

        if (nextIsListItem && nextIndent > indent) {
          current.pendingKey = key;
        } else if (nextIsNestedContent) {
          const newObj: Record<string, unknown> = {};
          container[key] = newObj;
          stack.push({ container: newObj, indent });
        } else {
          container[key] = null;
        }
      }
    }
  }

  return result;
}
