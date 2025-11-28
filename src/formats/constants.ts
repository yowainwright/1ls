export const INTEGER = /^-?\d+$/;
export const INTEGER_WITH_SIGN = /^[+-]?\d+$/;
export const FLOAT = /^-?\d+\.\d+$/;
export const FLOAT_WITH_SIGN = /^[+-]?\d+\.\d+$/;
export const NUMBER = /^-?\d+(\.\d+)?$/;

export const ATTRIBUTES = /(\w+)=["']([^"']+)["']/g;
export const SELF_CLOSING = /^<(\w+)([^>]*?)\/>/;
export const OPEN_TAG = /^<(\w+)([^>]*)>([\s\S]*)<\/\1>$/;
export const NESTED_TAGS = /<\w+/;
export const COMPLETE_TAGS = /<\/\w+>$/;
export const XML_DECLARATION = /^<\?xml[^>]+\?>\s*/;

export const TRAILING_COMMA = /,(\s*[}\]])/g;
export const UNQUOTED_KEY = /(['"])?([a-zA-Z_$][a-zA-Z0-9_$]*)\1?\s*:/g;

export const JSON5_FEATURES = /\/\/|\/\*|,\s*[}\]]/;
export const SECTION_HEADER = /^\[[\w.\s]+\]$/m;
export const TOML_SECTION = /^\[[\w.]+\]$/m;
export const TOML_QUOTED_VALUES = /^\w+\s*=\s*"[^"]*"$/m;
export const TOML_SYNTAX = /=\s*["[{]/m;
export const INI_SYNTAX = /^\w+\s*=\s*.+$/m;

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

const ENV_FEATURES = /^[A-Z_][A-Z0-9_]*\s*=/m;
const NDJSON_FEATURES = /^\{.*\}\s*$/m;

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
  ENV_FEATURES,
  NDJSON_FEATURES,
} as const;
