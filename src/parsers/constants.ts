const INTEGER = /^-?\d+$/;
const INTEGER_WITH_SIGN = /^[+-]?\d+$/;
const FLOAT = /^-?\d+\.\d+$/;
const FLOAT_WITH_SIGN = /^[+-]?\d+\.\d+$/;
const NUMBER = /^-?\d+(\.\d+)?$/;

const ATTRIBUTES = /(\w+)=["']([^"']+)["']/g;
const SELF_CLOSING = /^<(\w+)([^>]*?)\/>/;
const OPEN_TAG = /^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/;
const NESTED_TAGS = /<\w+/;
const COMPLETE_TAGS = /<\/\w+>$/;
const XML_DECLARATION = /^<\?xml[^>]+\?>\s*/;

const TRAILING_COMMA = /,(\s*[}\]])/g;
const UNQUOTED_KEY = /(['\"])?([a-zA-Z_$][a-zA-Z0-9_$]*)\1?\s*:/g;

const JSON5_FEATURES = /\/\/|\/\*|\,\s*[}\]]/;
const SECTION_HEADER = /^\[[\w.\s]+\]$/m;
const TOML_SECTION = /^\[[\w.]+\]$/m;
const TOML_QUOTED_VALUES = /^\w+\s*=\s*"[^"]*"$/m;
const TOML_SYNTAX = /=\s*["\[{]/m;
const INI_SYNTAX = /^\w+\s*=\s*.+$/m;

export const CSV = {
  NUMBER,
} as const;

export const YAML = {
  INTEGER,
  FLOAT,
} as const;

export const TOML = {
  INTEGER: INTEGER_WITH_SIGN,
  FLOAT: FLOAT_WITH_SIGN,
} as const;

export const XML = {
  NUMBER,
  ATTRIBUTES,
  SELF_CLOSING,
  OPEN_TAG,
  NESTED_TAGS,
  COMPLETE_TAGS,
  XML_DECLARATION,
} as const;

export const INI = {
  NUMBER,
} as const;

export const JSON5 = {
  TRAILING_COMMA,
  UNQUOTED_KEY,
} as const;

const JS_EXPORT = /^\s*export\s+(const|let|var|function|class|default|type|interface|enum)/m;
const TS_TYPE_ANNOTATION = /:\s*(string|number|boolean|any|unknown|void|never|object|Array|Promise)/;
const TS_INTERFACE = /^\s*interface\s+\w+/m;
const TS_TYPE_ALIAS = /^\s*type\s+\w+\s*=/m;
const TS_GENERIC = /<[A-Z]\w*>/;

export const JS = {
  EXPORT: JS_EXPORT,
} as const;

export const TS = {
  TYPE_ANNOTATION: TS_TYPE_ANNOTATION,
  INTERFACE: TS_INTERFACE,
  TYPE_ALIAS: TS_TYPE_ALIAS,
  GENERIC: TS_GENERIC,
  EXPORT: JS_EXPORT,
} as const;

export const DETECTION = {
  JSON5_FEATURES,
  SECTION_HEADER,
  TOML_SECTION,
  TOML_QUOTED_VALUES,
  TOML_SYNTAX,
  INI_SYNTAX,
  JS_EXPORT,
  TS_TYPE_ANNOTATION,
  TS_INTERFACE,
  TS_TYPE_ALIAS,
} as const;
