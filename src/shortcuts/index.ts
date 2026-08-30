import type { ShortcutMapping } from "./types.ts";
import { REGEX_SPECIAL_CHARS, IMPLICIT_PROP, BUILTIN_SHORTCUTS, SHORTCUTS } from "./constants.ts";

export type { ShortcutMapping } from "./types.ts";
export { BUILTIN_SHORTCUTS, SHORTCUTS } from "./constants.ts";

export const escapeRegExp = (str: string): string => str.replace(REGEX_SPECIAL_CHARS, "\\$&");

const EXPAND_PATTERNS = SHORTCUTS.map((s) => ({
  regex: new RegExp(`${escapeRegExp(s.short)}(?![a-zA-Z])`, "g"),
  replacement: s.full,
})).sort((a, b) => b.replacement.length - a.replacement.length);

const SHORTEN_PATTERNS = SHORTCUTS.map((s) => ({
  regex: new RegExp(`${escapeRegExp(s.full)}(?![a-zA-Z])`, "g"),
  replacement: s.short,
})).sort((a, b) => b.regex.source.length - a.regex.source.length);

const BUILTIN_EXPAND_PATTERNS = BUILTIN_SHORTCUTS.map((s) => ({
  regex: new RegExp(`(?<![a-zA-Z])${escapeRegExp(s.short)}\\(`, "g"),
  replacement: `${s.full}(`,
})).sort((a, b) => b.replacement.length - a.replacement.length);

const BUILTIN_SHORTEN_PATTERNS = BUILTIN_SHORTCUTS.map((s) => ({
  regex: new RegExp(`(?<![a-zA-Z])${escapeRegExp(s.full)}\\(`, "g"),
  replacement: `${s.short}(`,
})).sort((a, b) => b.regex.source.length - a.regex.source.length);

const isQuoteChar = (char: string): boolean => {
  if (char === '"') return true;
  if (char === "'") return true;
  return char === "`";
};

interface CodeTransformState {
  result: string;
  codeSegment: string;
  quote: string | null;
  isEscaped: boolean;
}

const appendQuotedChar = (state: CodeTransformState, char: string): CodeTransformState => {
  if (state.isEscaped) {
    return { ...state, result: state.result + char, isEscaped: false };
  }

  if (char === "\\") {
    return { ...state, result: state.result + char, isEscaped: true };
  }

  const quote = char === state.quote ? null : state.quote;
  return { ...state, result: state.result + char, quote };
};

const flushCodeSegment = (
  state: CodeTransformState,
  transform: (segment: string) => string,
): CodeTransformState => ({
  ...state,
  result: state.result + transform(state.codeSegment),
  codeSegment: "",
});

const startQuotedSegment = (
  state: CodeTransformState,
  char: string,
  transform: (segment: string) => string,
): CodeTransformState => {
  const flushedState = flushCodeSegment(state, transform);
  return { ...flushedState, quote: char, result: flushedState.result + char };
};

const transformCodeChar = (
  state: CodeTransformState,
  char: string,
  transform: (segment: string) => string,
): CodeTransformState => {
  if (state.quote) return appendQuotedChar(state, char);

  const isQuote = isQuoteChar(char);
  if (isQuote) return startQuotedSegment(state, char, transform);

  return { ...state, codeSegment: state.codeSegment + char };
};

const transformCodeSegments = (
  expression: string,
  transform: (segment: string) => string,
): string => {
  const initialState: CodeTransformState = {
    result: "",
    codeSegment: "",
    quote: null,
    isEscaped: false,
  };
  let state = initialState;

  for (const char of expression) {
    state = transformCodeChar(state, char, transform);
  }

  return flushCodeSegment(state, transform).result;
};

const expandImplicitMethodSegment = (segment: string): string => {
  const methodPattern = new RegExp(IMPLICIT_PROP.METHOD_WITH_ARGS.source, "g");
  let result = "";
  let lastIndex = 0;

  for (const match of segment.matchAll(methodPattern)) {
    result += segment.slice(lastIndex, match.index);
    result += expandImplicitMethodMatch(match);
    lastIndex = match.index + match[0].length;
  }

  return result + segment.slice(lastIndex);
};

const expandImplicitMethodMatch = (match: RegExpMatchArray): string => {
  const args = match[2];
  const hasArrowFunction = args.includes("=>");
  if (hasArrowFunction) return match[0];

  const hasImplicitProp =
    IMPLICIT_PROP.PROPERTY_AT_START.test(args) || IMPLICIT_PROP.PROPERTY_AFTER_OPERATOR.test(args);

  if (!hasImplicitProp) return match[0];

  const param = IMPLICIT_PROP.PARAM;
  const expandedArgs = args
    .replace(IMPLICIT_PROP.EXPAND_AT_START, `$1${param}.$2`)
    .replace(IMPLICIT_PROP.EXPAND_AFTER_OPERATOR, `$1${param}.$2`);

  return `.${match[1]}(${param} => ${expandedArgs})`;
};

const expandImplicitProps = (expression: string): string => {
  return transformCodeSegments(expression, expandImplicitMethodSegment);
};

export const expandShortcuts = (expression: string): string => {
  const withExpandedMethods = transformCodeSegments(expression, (segment) =>
    EXPAND_PATTERNS.reduce(
      (result, { regex, replacement }) => result.replace(regex, replacement),
      segment,
    ),
  );

  const withExpandedBuiltins = transformCodeSegments(withExpandedMethods, (segment) =>
    BUILTIN_EXPAND_PATTERNS.reduce(
      (result, { regex, replacement }) => result.replace(regex, replacement),
      segment,
    ),
  );

  return expandImplicitProps(withExpandedBuiltins);
};

const shortenImplicitBody = (body: string, param: string): string => {
  const prefix = `${param}.`;
  return body.split(prefix).join(".");
};

const shortenImplicitMethodSegment = (segment: string): string => {
  const arrowPattern = new RegExp(IMPLICIT_PROP.ARROW_FUNC.source, "g");
  let result = "";
  let lastIndex = 0;

  for (const match of segment.matchAll(arrowPattern)) {
    result += segment.slice(lastIndex, match.index);
    result += shortenImplicitMethodMatch(match);
    lastIndex = match.index + match[0].length;
  }

  return result + segment.slice(lastIndex);
};

const shortenImplicitMethodMatch = (match: RegExpMatchArray): string => {
  const body = match[3];
  const shortenedBody = shortenImplicitBody(body, match[2]);
  const bodyUnchanged = shortenedBody === body;

  if (bodyUnchanged) return match[0];

  return `.${match[1]}(${shortenedBody})`;
};

const shortenToImplicitProps = (expression: string): string => {
  return transformCodeSegments(expression, shortenImplicitMethodSegment);
};

export const shortenExpression = (expression: string): string => {
  const withImplicitProps = shortenToImplicitProps(expression);

  const withShortenedMethods = transformCodeSegments(withImplicitProps, (segment) =>
    SHORTEN_PATTERNS.reduce(
      (result, { regex, replacement }) => result.replace(regex, replacement),
      segment,
    ),
  );

  return transformCodeSegments(withShortenedMethods, (segment) =>
    BUILTIN_SHORTEN_PATTERNS.reduce(
      (result, { regex, replacement }) => result.replace(regex, replacement),
      segment,
    ),
  );
};

const createShortcutGroups = (): Record<ShortcutMapping["type"], ShortcutMapping[]> => ({
  array: [],
  object: [],
  string: [],
  any: [],
  builtin: [],
});

const appendShortcut = (
  groups: Record<ShortcutMapping["type"], ShortcutMapping[]>,
  shortcut: ShortcutMapping,
): void => {
  const group = groups[shortcut.type];
  group[group.length] = shortcut;
};

const groupShortcutsByType = (): Record<ShortcutMapping["type"], ShortcutMapping[]> => {
  const groups = createShortcutGroups();

  for (const shortcut of SHORTCUTS) {
    appendShortcut(groups, shortcut);
  }

  return groups;
};

const formatSection = (title: string, shortcuts: ShortcutMapping[]): string => {
  const maxShortLen = Math.max(...shortcuts.map((s) => s.short.length));
  const maxFullLen = Math.max(...shortcuts.map((s) => s.full.length));
  const items = shortcuts
    .map(
      (s) =>
        `  ${s.short.padEnd(maxShortLen + 2)} → ${s.full.padEnd(maxFullLen + 2)} # ${s.description}`,
    )
    .join("\n");
  return `\n${title}:\n${items}`;
};

const formatBuiltinShortcut = (
  shortcut: ShortcutMapping,
  maxShortLen: number,
  maxFullLen: number,
): string =>
  `  ${shortcut.short}()`.padEnd(maxShortLen + 4) +
  ` → ${shortcut.full}()`.padEnd(maxFullLen + 4) +
  ` # ${shortcut.description}`;

const formatBuiltinSection = (): string => {
  const maxShortLen = Math.max(...BUILTIN_SHORTCUTS.map((s) => s.short.length));
  const maxFullLen = Math.max(...BUILTIN_SHORTCUTS.map((s) => s.full.length));
  const items = BUILTIN_SHORTCUTS.map((s) =>
    formatBuiltinShortcut(s, maxShortLen, maxFullLen),
  ).join("\n");
  return `\nBuiltin Functions:\n${items}`;
};

export const getShortcutHelp = (): string => {
  const shortcutsByType = groupShortcutsByType();
  return `
Shorthand Reference:
${formatSection("Array Methods", shortcutsByType.array)}
${formatSection("Object Methods", shortcutsByType.object)}
${formatSection("String Methods", shortcutsByType.string)}
${formatSection("Universal Methods", shortcutsByType.any)}
${formatBuiltinSection()}

Examples:
  echo '[1,2,3]' | 1ls '.mp(x => x * 2)'        # Short form
  echo '[1,2,3]' | 1ls '.map(x => x * 2)'       # Full form
  echo '[1,2,3]' | 1ls 'hd()'                   # First element
  echo '[1,2,3]' | 1ls 'sum()'                  # Sum all

  1ls --shorten ".map(x => x * 2)"              # Returns: .mp(x => x * 2)
  1ls --expand ".mp(x => x * 2)"                # Returns: .map(x => x * 2)
`;
};

export const isShortcut = (method: string): boolean =>
  SHORTCUTS.some((shortcut) => shortcut.short === method || shortcut.full === method);

export const getFullMethod = (shortMethod: string): string | undefined =>
  SHORTCUTS.find((shortcut) => shortcut.short === shortMethod)?.full;

export const getShortMethod = (fullMethod: string): string | undefined =>
  SHORTCUTS.find((shortcut) => shortcut.full === fullMethod)?.short;
