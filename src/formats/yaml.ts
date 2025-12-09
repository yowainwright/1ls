import { YAML } from "./constants";
import { parseBooleanValue, parseNullValue } from "./utils";

function parseTypeTag(value: string): { tag: string | null; content: string } {
  if (value.startsWith("!!")) {
    const spaceIdx = value.indexOf(" ");
    if (spaceIdx > 0) {
      return {
        tag: value.substring(2, spaceIdx),
        content: value.substring(spaceIdx + 1)
      };
    }
  }
  return { tag: null, content: value };
}

export function parseYAMLValue(value: string): unknown {
  const { tag, content } = parseTypeTag(value);

  if (tag === "str") {
    return content;
  }

  const hasDoubleQuotes = content.startsWith('"') && content.endsWith('"');
  const hasSingleQuotes = content.startsWith("'") && content.endsWith("'");
  const hasQuotes = hasDoubleQuotes || hasSingleQuotes;

  if (hasQuotes) {
    return content.slice(1, -1);
  }

  const boolValue = parseBooleanValue(content);
  if (boolValue !== undefined) return boolValue;

  const nullValue = parseNullValue(content);
  if (nullValue !== undefined) return nullValue;

  const isInteger = YAML.INTEGER.test(content);
  if (isInteger) return parseInt(content, 10);

  const isFloat = YAML.FLOAT.test(content);
  if (isFloat) return parseFloat(content);

  const isInlineArray = content.startsWith("[") && content.endsWith("]");
  if (isInlineArray) {
    return content
      .slice(1, -1)
      .split(",")
      .map((v) => parseYAMLValue(v.trim()));
  }

  const isInlineObject = content.startsWith("{") && content.endsWith("}");
  if (isInlineObject) {
    const obj: Record<string, unknown> = {};
    const pairs = content.slice(1, -1).split(",");

    pairs.forEach((pair) => {
      const [k, v] = pair.split(":").map((s) => s.trim());
      const hasKeyAndValue = k && v;
      if (hasKeyAndValue) {
        obj[k] = parseYAMLValue(v);
      }
    });

    return obj;
  }

  return content;
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

      if (!value || value === "|" || value === ">" || value === "|+" || value === ">-") return key;
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

function getIndent(line: string): number {
  return line.length - line.trimStart().length;
}

function collectMultilineString(
  lines: string[],
  startIdx: number,
  baseIndent: number,
  style: "|" | ">"
): { value: string; endIdx: number } {
  const contentLines: string[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      contentLines.push("");
      i++;
      continue;
    }

    const lineIndent = getIndent(line);
    if (lineIndent <= baseIndent) break;

    contentLines.push(line.substring(baseIndent + 2));
    i++;
  }

  while (contentLines.length > 0 && contentLines[contentLines.length - 1] === "") {
    contentLines.pop();
  }

  const value = style === "|"
    ? contentLines.join("\n")
    : contentLines.join(" ").replace(/\s+/g, " ").trim();

  return { value, endIdx: i - 1 };
}

interface StackFrame {
  container: Record<string, unknown> | unknown[]
  indent: number
  pendingKey?: string
}

interface AnchorStore {
  [key: string]: unknown
}

function resolveAliases(
  obj: unknown,
  anchors: AnchorStore
): unknown {
  if (typeof obj === "string" && obj.startsWith("*")) {
    const alias = obj.substring(1);
    return anchors[alias] !== undefined ? anchors[alias] : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveAliases(item, anchors));
  }

  if (typeof obj === "object" && obj !== null) {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key === "<<" && typeof value === "string" && value.startsWith("*")) {
        const alias = value.substring(1);
        const merged = anchors[alias];
        if (typeof merged === "object" && merged !== null && !Array.isArray(merged)) {
          Object.assign(result, merged);
        }
      } else {
        result[key] = resolveAliases(value, anchors);
      }
    }

    return result;
  }

  return obj;
}

export function parseYAML(input: string): unknown {
  const lines = input.trim().split("\n");
  const anchors: AnchorStore = {};

  const firstNonEmpty = lines.find((l) => {
    const t = stripComment(l).trim();
    return t && t !== "---" && t !== "...";
  });

  const isRootArray = firstNonEmpty?.trim().startsWith("- ");

  const rootContainer: Record<string, unknown> | unknown[] = isRootArray ? [] : {};
  const stack: StackFrame[] = [{ container: rootContainer, indent: -1 }];

  function top(): StackFrame {
    return stack[stack.length - 1];
  }

  function popWhile(predicate: (frame: StackFrame) => boolean): void {
    while (stack.length > 1 && predicate(top())) {
      stack.pop();
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = stripComment(rawLine);
    const trimmed = line.trim();

    if (!trimmed || trimmed === "---" || trimmed === "...") continue;

    const indent = getIndent(line);
    const isListItem = trimmed.startsWith("- ") || trimmed === "-";

    if (isListItem) {
      const content = trimmed === "-" ? "" : trimmed.substring(2).trim();

      popWhile((f) => f.indent > indent || (f.indent >= indent && !Array.isArray(f.container)));

      let targetArray: unknown[];
      const current = top();

      const isMatchingArray = Array.isArray(current.container) &&
        (current.indent === indent || (current.indent === -1 && indent === 0));

      if (isMatchingArray) {
        targetArray = current.container as unknown[];
        if (current.indent === -1) {
          current.indent = indent;
        }
      } else {
        targetArray = [];

        if (current.pendingKey) {
          (current.container as Record<string, unknown>)[current.pendingKey] = targetArray;
          current.pendingKey = undefined;
        } else if (!Array.isArray(current.container)) {
          const prevKey = findPreviousKey(lines, i);
          if (prevKey) {
            (current.container as Record<string, unknown>)[prevKey] = targetArray;
          }
        }
        stack.push({ container: targetArray, indent });
      }

      if (isListItemWithObject(content)) {
        const colonIdx = content.indexOf(":");
        let key = content.substring(0, colonIdx).trim();
        let val = content.substring(colonIdx + 1).trim();

        let anchorName: string | null = null;
        if (key.includes(" &")) {
          const parts = key.split(" &");
          key = parts[0];
          anchorName = parts[1];
        }

        const obj: Record<string, unknown> = { [key]: val ? parseYAMLValue(val) : null };
        targetArray.push(obj);

        if (anchorName) {
          anchors[anchorName] = obj;
        }

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
      let key = trimmed.substring(0, colonIdx).trim();
      let value = trimmed.substring(colonIdx + 1).trim();

      let anchorName: string | null = null;
      if (value.startsWith("&")) {
        const spaceIdx = value.indexOf(" ");
        if (spaceIdx > 0) {
          anchorName = value.substring(1, spaceIdx);
          value = value.substring(spaceIdx + 1);
        } else {
          anchorName = value.substring(1);
          value = "";
        }
      }

      popWhile((f) => f.indent > indent || (f.indent === indent && Array.isArray(f.container)));

      const current = top();
      const container = current.container;

      if (Array.isArray(container)) continue;

      if (value === "|" || value === ">" || value === "|+" || value === ">-" || value === "|-" || value === ">+") {
        const style = value.startsWith("|") ? "|" : ">";
        const { value: multilineValue, endIdx } = collectMultilineString(lines, i + 1, indent, style);
        container[key] = multilineValue;
        if (anchorName) anchors[anchorName] = multilineValue;
        i = endIdx;
      } else if (value) {
        const parsedValue = parseYAMLValue(value);
        container[key] = parsedValue;
        if (anchorName) anchors[anchorName] = parsedValue;
      } else {
        const nextIdx = i + 1;
        const hasNext = nextIdx < lines.length;
        const nextLine = hasNext ? stripComment(lines[nextIdx]) : "";
        const nextTrimmed = nextLine.trim();
        const nextIndent = hasNext ? getIndent(nextLine) : -1;
        const nextIsListItem = nextTrimmed.startsWith("- ") || nextTrimmed === "-";
        const nextIsNestedContent = hasNext && nextIndent > indent && nextTrimmed;

        if (nextIsListItem && nextIndent > indent) {
          current.pendingKey = key;
          if (anchorName) {
            const placeholder: Record<string, unknown> = {};
            anchors[anchorName] = placeholder;
          }
        } else if (nextIsNestedContent) {
          const newObj: Record<string, unknown> = {};
          container[key] = newObj;
          if (anchorName) anchors[anchorName] = newObj;
          stack.push({ container: newObj, indent: nextIndent });
        } else {
          container[key] = null;
          if (anchorName) anchors[anchorName] = null;
        }
      }
    }
  }

  return resolveAliases(rootContainer, anchors);
}
