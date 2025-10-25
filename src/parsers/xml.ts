import { XML } from "./constants";

export function parseXMLValue(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  const isNumber = XML.NUMBER.test(trimmed);
  if (isNumber) return parseFloat(trimmed);

  return trimmed;
}

export function parseXMLAttributes(attrString: string): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};

  const matches = attrString.matchAll(XML.ATTRIBUTES);
  Array.from(matches).forEach((match) => {
    const [, key, value] = match;
    attrs[key] = parseXMLValue(value);
  });

  return attrs;
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

export function parseXMLChildren(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const elements: string[] = [];

  let depth = 0;
  let currentElement = "";
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (char === "<") {
      const isClosing = content[i + 1] === "/";
      const isSelfClosing = content.slice(i).match(/^<[^>]+\/>/);

      if (isClosing) {
        depth--;
        currentElement += char;
      } else if (isSelfClosing) {
        currentElement += isSelfClosing[0];
        i += isSelfClosing[0].length - 1;

        if (depth === 0) {
          elements.push(currentElement.trim());
          currentElement = "";
        }
      } else {
        depth++;
        currentElement += char;
      }
    } else {
      currentElement += char;
    }

    if (depth === 0 && currentElement.trim() && !char.match(/\s/)) {
      const hasCompleteTags = currentElement.match(XML.COMPLETE_TAGS);
      if (hasCompleteTags) {
        elements.push(currentElement.trim());
        currentElement = "";
      }
    }

    i++;
  }

  if (currentElement.trim()) {
    elements.push(currentElement.trim());
  }

  elements.forEach((element) => {
    const parsed = parseXMLElement(element);

    if (typeof parsed === "object" && parsed !== null) {
      const entries = Object.entries(parsed);
      entries.forEach(([key, value]) => {
        const existing = result[key];

        if (existing === undefined) {
          result[key] = value;
          return;
        }

        const isArray = Array.isArray(existing);
        if (isArray) {
          result[key] = [...existing, value];
          return;
        }

        result[key] = [existing, value];
      });
    }
  });

  return result;
}

export function parseXML(input: string): unknown {
  const trimmed = input.trim();

  const xmlDeclMatch = trimmed.match(XML.XML_DECLARATION);
  const content = xmlDeclMatch ? trimmed.slice(xmlDeclMatch[0].length) : trimmed;

  return parseXMLElement(content);
}
