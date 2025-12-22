import type { ShortcutMapping } from "./types";
import {
  REGEX_SPECIAL_CHARS,
  IMPLICIT_PROP,
  BUILTIN_SHORTCUTS,
  SHORTCUTS,
} from "./constants";

export type { ShortcutMapping } from "./types";
export { BUILTIN_SHORTCUTS, SHORTCUTS } from "./constants";

export const escapeRegExp = (str: string): string =>
  str.replace(REGEX_SPECIAL_CHARS, "\\$&");

const shortToFull = new Map(SHORTCUTS.map((s) => [s.short, s.full]));
const fullToShort = new Map(SHORTCUTS.map((s) => [s.full, s.short]));

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

const expandImplicitProps = (expression: string): string => {
  const methodPattern = new RegExp(IMPLICIT_PROP.METHOD_WITH_ARGS.source, "g");

  return expression.replace(methodPattern, (match, method, args) => {
    const hasArrowFunction = args.includes("=>");
    if (hasArrowFunction) return match;

    const hasImplicitProp =
      IMPLICIT_PROP.PROPERTY_AT_START.test(args) ||
      IMPLICIT_PROP.PROPERTY_AFTER_OPERATOR.test(args);

    if (!hasImplicitProp) return match;

    const param = IMPLICIT_PROP.PARAM;
    const expandedArgs = args
      .replace(IMPLICIT_PROP.EXPAND_AT_START, `$1${param}.$2`)
      .replace(IMPLICIT_PROP.EXPAND_AFTER_OPERATOR, `$1${param}.$2`);

    return `.${method}(${param} => ${expandedArgs})`;
  });
};

export const expandShortcuts = (expression: string): string => {
  const withExpandedMethods = EXPAND_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    expression,
  );

  const withExpandedBuiltins = BUILTIN_EXPAND_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    withExpandedMethods,
  );

  return expandImplicitProps(withExpandedBuiltins);
};

const createParamDotPattern = (param: string): RegExp =>
  new RegExp(IMPLICIT_PROP.PARAM_DOT_TEMPLATE.replace("PARAM", param), "g");

const shortenToImplicitProps = (expression: string): string => {
  const arrowPattern = new RegExp(IMPLICIT_PROP.ARROW_FUNC.source, "g");

  return expression.replace(arrowPattern, (match, method, param, body) => {
    const paramPattern = createParamDotPattern(param);
    const shortenedBody = body.replace(paramPattern, ".");
    const bodyUnchanged = shortenedBody === body;

    if (bodyUnchanged) return match;

    return `.${method}(${shortenedBody})`;
  });
};

export const shortenExpression = (expression: string): string => {
  const withImplicitProps = shortenToImplicitProps(expression);

  const withShortenedMethods = SHORTEN_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    withImplicitProps,
  );

  return BUILTIN_SHORTEN_PATTERNS.reduce(
    (result, { regex, replacement }) => result.replace(regex, replacement),
    withShortenedMethods,
  );
};

export const getShortcutHelp = (): string => {
  const arrayShortcuts = SHORTCUTS.filter((s) => s.type === "array");
  const objectShortcuts = SHORTCUTS.filter((s) => s.type === "object");
  const stringShortcuts = SHORTCUTS.filter((s) => s.type === "string");
  const universalShortcuts = SHORTCUTS.filter((s) => s.type === "any");

  const formatSection = (title: string, shortcuts: ShortcutMapping[]) => {
    const maxShortLen = Math.max(...shortcuts.map((s) => s.short.length));
    const maxFullLen = Math.max(...shortcuts.map((s) => s.full.length));

    const header = `\n${title}:\n`;
    const items = shortcuts
      .map(
        (s) =>
          `  ${s.short.padEnd(maxShortLen + 2)} → ${s.full.padEnd(maxFullLen + 2)} # ${s.description}`,
      )
      .join("\n");

    return header + items;
  };

  const formatBuiltinSection = () => {
    const maxShortLen = Math.max(
      ...BUILTIN_SHORTCUTS.map((s) => s.short.length),
    );
    const maxFullLen = Math.max(...BUILTIN_SHORTCUTS.map((s) => s.full.length));

    const header = `\nBuiltin Functions:\n`;
    const items = BUILTIN_SHORTCUTS.map(
      (s) =>
        `  ${s.short}()`.padEnd(maxShortLen + 4) +
        ` → ${s.full}()`.padEnd(maxFullLen + 4) +
        ` # ${s.description}`,
    ).join("\n");

    return header + items;
  };

  return `
Shorthand Reference:
${formatSection("Array Methods", arrayShortcuts)}
${formatSection("Object Methods", objectShortcuts)}
${formatSection("String Methods", stringShortcuts)}
${formatSection("Universal Methods", universalShortcuts)}
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
  shortToFull.has(method) || fullToShort.has(method);

export const getFullMethod = (shortMethod: string): string | undefined =>
  shortToFull.get(shortMethod);

export const getShortMethod = (fullMethod: string): string | undefined =>
  fullToShort.get(fullMethod);
