import { XML } from "./constants.ts";

interface XMLElementState {
  elements: string[];
  buffer: string;
  depth: number;
  skip: number;
}

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

  return matches.reduce(
    (attrs, match) => {
      const [, key, value] = match;
      attrs[key] = parseXMLValue(value);
      return attrs;
    },
    {} as Record<string, unknown>,
  );
}

export function parseXMLElement(xml: string): unknown {
  const trimmed = xml.trim();
  const selfClosingMatch = trimmed.match(XML.SELF_CLOSING);
  if (selfClosingMatch) return parseSelfClosingElement(selfClosingMatch);

  const openTagMatch = trimmed.match(XML.OPEN_TAG);
  if (!openTagMatch) return parseXMLValue(trimmed);

  return parseOpenElement(openTagMatch);
}

const hasXMLAttributes = (attrsString: string): boolean => attrsString.trim().length > 0;

function parseSelfClosingElement(match: RegExpMatchArray): Record<string, unknown> {
  const [, tagName, attrsString] = match;
  if (!hasXMLAttributes(attrsString)) return { [tagName]: null };
  return {
    [tagName]: {
      _attributes: parseXMLAttributes(attrsString),
    },
  };
}

function parsePlainElement(
  tagName: string,
  attrsString: string,
  innerContent: string,
): Record<string, unknown> {
  if (!hasXMLAttributes(attrsString)) return { [tagName]: parseXMLValue(innerContent) };
  return {
    [tagName]: {
      _attributes: parseXMLAttributes(attrsString),
      _text: parseXMLValue(innerContent),
    },
  };
}

function parseNestedElement(
  tagName: string,
  attrsString: string,
  innerContent: string,
): Record<string, unknown> {
  const children = parseXMLChildren(innerContent);
  if (!hasXMLAttributes(attrsString)) return { [tagName]: children };
  return {
    [tagName]: {
      _attributes: parseXMLAttributes(attrsString),
      ...children,
    },
  };
}

function parseOpenElement(match: RegExpMatchArray): Record<string, unknown> {
  const [, tagName, attrsString, content] = match;
  const innerContent = content.trim();
  const hasNestedTags = XML.NESTED_TAGS.test(innerContent);
  if (!hasNestedTags) return parsePlainElement(tagName, attrsString, innerContent);
  return parseNestedElement(tagName, attrsString, innerContent);
}

const decrementXMLSkip = (state: XMLElementState): XMLElementState => ({
  ...state,
  skip: state.skip - 1,
});

const flushXMLBuffer = (state: XMLElementState): XMLElementState => {
  const element = state.buffer.trim();
  if (!element) return state;
  return { ...state, elements: [...state.elements, element], buffer: "" };
};

const appendXMLBuffer = (state: XMLElementState, value: string): XMLElementState => ({
  ...state,
  buffer: state.buffer + value,
});

const handleSelfClosingTag = (
  state: XMLElementState,
  selfClosingTag: string,
): XMLElementState => {
  const bufferedState = appendXMLBuffer(state, selfClosingTag);
  const nextState = state.depth === 0 ? flushXMLBuffer(bufferedState) : bufferedState;
  return { ...nextState, skip: selfClosingTag.length - 1 };
};

interface XMLCharInput {
  state: XMLElementState;
  char: string;
  index: number;
  chars: string[];
  content: string;
}

const handleOpenBracket = ({
  state,
  char,
  index,
  chars,
  content,
}: XMLCharInput): XMLElementState => {
  const isClosing = chars[index + 1] === "/";
  if (isClosing) return { ...appendXMLBuffer(state, char), depth: state.depth - 1 };
  const selfClosingMatch = content.slice(index).match(/^<[^>]+\/>/);
  if (selfClosingMatch) return handleSelfClosingTag(state, selfClosingMatch[0]);
  return { ...appendXMLBuffer(state, char), depth: state.depth + 1 };
};

const handleXMLTextChar = (state: XMLElementState, char: string): XMLElementState => {
  const bufferedState = appendXMLBuffer(state, char);
  const bufferContent = bufferedState.buffer.trim();
  const hasVisibleChar = !/\s/.test(char);
  const hasCompleteTags = XML.COMPLETE_TAGS.test(bufferContent);
  const hasTopLevelContent = state.depth === 0 && bufferContent.length > 0;
  const shouldFlush = hasTopLevelContent && hasVisibleChar && hasCompleteTags;
  if (shouldFlush) return flushXMLBuffer(bufferedState);
  return bufferedState;
};

const splitXMLChar = ({ state, char, index, chars, content }: XMLCharInput): XMLElementState => {
  if (state.skip > 0) return decrementXMLSkip(state);
  if (char === "<") return handleOpenBracket({ state, char, index, chars, content });
  return handleXMLTextChar(state, char);
};

function splitXMLElements(content: string): string[] {
  const chars = content.split("");
  const initialState: XMLElementState = { elements: [], buffer: "", depth: 0, skip: 0 };
  const finalState = chars.reduce(
    (state, char, index) => splitXMLChar({ state, char, index, chars, content }),
    initialState,
  );

  const finalContent = finalState.buffer.trim();
  const hasFinalContent = finalContent.length > 0;

  return hasFinalContent ? [...finalState.elements, finalContent] : finalState.elements;
}

function mergeXMLElement(
  result: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> {
  const existing = result[key];
  const hasExisting = existing !== undefined;

  if (!hasExisting) return { ...result, [key]: value };

  const isArray = Array.isArray(existing);
  if (isArray) return { ...result, [key]: [...existing, value] };

  return { ...result, [key]: [existing, value] };
}

function mergeXMLElementObject(result: Record<string, unknown>, parsed: object): Record<string, unknown> {
  return Object.entries(parsed).reduce(
    (nextResult, [key, value]) => mergeXMLElement(nextResult, key, value),
    result,
  );
}

export function parseXMLChildren(content: string): Record<string, unknown> {
  const elements = splitXMLElements(content);

  return elements.reduce((result, element) => {
    const parsed = parseXMLElement(element);
    const isObject = typeof parsed === "object" && parsed !== null;
    if (!isObject) return result;
    return mergeXMLElementObject(result, parsed);
  }, {} as Record<string, unknown>);
}

export function parseXML(input: string): unknown {
  const trimmed = input.trim();

  const xmlDeclMatch = trimmed.match(XML.XML_DECLARATION);
  const content = xmlDeclMatch ? trimmed.slice(xmlDeclMatch[0].length) : trimmed;

  return parseXMLElement(content);
}
