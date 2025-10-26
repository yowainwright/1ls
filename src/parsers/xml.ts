import { XML } from "./constants";
import { XMLParseState, XMLElementState } from "./types";

export function parseXMLValue(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  const isNumber = XML.NUMBER.test(trimmed);
  if (isNumber) return parseFloat(trimmed);

  return trimmed;
}

export function parseXMLAttributes(attrString: string): Record<string, unknown> {
  const matches = Array.from(attrString.matchAll(XML.ATTRIBUTES));

  return matches.reduce((attrs, match) => {
    const [, key, value] = match;
    attrs[key] = parseXMLValue(value);
    return attrs;
  }, {} as Record<string, unknown>);
}

export function parseXMLElement(xml: string): unknown {
  const trimmed = xml.trim();

  const selfClosingMatch = trimmed.match(XML.SELF_CLOSING);
  if (selfClosingMatch) {
    const [, tagName, attrsString] = selfClosingMatch;
    const hasAttrs = attrsString.trim().length > 0;

    if (hasAttrs) {
      return {
        [tagName]: {
          _attributes: parseXMLAttributes(attrsString),
        },
      };
    }

    return { [tagName]: null };
  }

  const openTagMatch = trimmed.match(XML.OPEN_TAG);
  if (!openTagMatch) {
    return parseXMLValue(trimmed);
  }

  const [, tagName, attrsString, content] = openTagMatch;
  const innerContent = content.trim();

  const hasNestedTags = XML.NESTED_TAGS.test(innerContent);

  if (!hasNestedTags) {
    const hasAttrs = attrsString.trim().length > 0;

    if (hasAttrs) {
      return {
        [tagName]: {
          _attributes: parseXMLAttributes(attrsString),
          _text: parseXMLValue(innerContent),
        },
      };
    }

    return { [tagName]: parseXMLValue(innerContent) };
  }

  const children = parseXMLChildren(innerContent);
  const hasAttrs = attrsString.trim().length > 0;

  if (hasAttrs) {
    return {
      [tagName]: {
        _attributes: parseXMLAttributes(attrsString),
        ...children,
      },
    };
  }

  return { [tagName]: children };
}

function splitXMLElements(content: string): string[] {
  const chars = content.split("");

  const finalState = chars.reduce(
    (state: XMLElementState, char: string, index: number) => {
      const shouldSkip = state.skip > 0;
      if (shouldSkip) {
        return {
          elements: state.elements,
          buffer: state.buffer,
          depth: state.depth,
          skip: state.skip - 1,
        };
      }

      const isOpenBracket = char === "<";
      if (isOpenBracket) {
        const isClosing = chars[index + 1] === "/";
        const remaining = content.slice(index);
        const isSelfClosing = remaining.match(/^<[^>]+\/>/);

        if (isClosing) {
          state.buffer.push(char);
          return {
            elements: state.elements,
            buffer: state.buffer,
            depth: state.depth - 1,
            skip: 0,
          };
        }

        if (isSelfClosing) {
          const selfClosingTag = isSelfClosing[0];
          selfClosingTag.split("").forEach((c) => state.buffer.push(c));

          const isTopLevel = state.depth === 0;
          if (isTopLevel) {
            const element = state.buffer.join("").trim();
            state.elements.push(element);
            state.buffer.length = 0;
          }

          return {
            elements: state.elements,
            buffer: state.buffer,
            depth: state.depth,
            skip: selfClosingTag.length - 1,
          };
        }

        state.buffer.push(char);
        return {
          elements: state.elements,
          buffer: state.buffer,
          depth: state.depth + 1,
          skip: 0,
        };
      }

      state.buffer.push(char);

      const isTopLevel = state.depth === 0;
      const bufferContent = state.buffer.join("").trim();
      const hasContent = bufferContent.length > 0;
      const isNotWhitespace = !char.match(/\s/);

      if (isTopLevel && hasContent && isNotWhitespace) {
        const hasCompleteTags = bufferContent.match(XML.COMPLETE_TAGS);
        if (hasCompleteTags) {
          state.elements.push(bufferContent);
          state.buffer.length = 0;
        }
      }

      return {
        elements: state.elements,
        buffer: state.buffer,
        depth: state.depth,
        skip: 0,
      };
    },
    { elements: [], buffer: [], depth: 0, skip: 0 } as XMLElementState & { skip: number }
  );

  const finalContent = finalState.buffer.join("").trim();
  const hasFinalContent = finalContent.length > 0;

  return hasFinalContent
    ? [...finalState.elements, finalContent]
    : finalState.elements;
}

function mergeXMLElement(
  result: Record<string, unknown>,
  key: string,
  value: unknown
): void {
  const existing = result[key];
  const hasExisting = existing !== undefined;

  if (!hasExisting) {
    result[key] = value;
    return;
  }

  const isArray = Array.isArray(existing);
  if (isArray) {
    existing.push(value);
    return;
  }

  result[key] = [existing, value];
}

export function parseXMLChildren(content: string): Record<string, unknown> {
  const elements = splitXMLElements(content);

  return elements.reduce((result, element) => {
    const parsed = parseXMLElement(element);
    const isObject = typeof parsed === "object" && parsed !== null;

    if (isObject) {
      Object.entries(parsed).forEach(([key, value]) => {
        mergeXMLElement(result, key, value);
      });
    }

    return result;
  }, {} as Record<string, unknown>);
}

export function parseXML(input: string): unknown {
  const trimmed = input.trim();

  const xmlDeclMatch = trimmed.match(XML.XML_DECLARATION);
  const content = xmlDeclMatch ? trimmed.slice(xmlDeclMatch[0].length) : trimmed;

  return parseXMLElement(content);
}
