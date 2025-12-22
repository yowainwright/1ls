import type { ShortcutMapping } from "./shortcuts";

export const VALID_OUTPUT_FORMATS = ["json", "yaml", "csv", "table"] as const;

export const VALID_INPUT_FORMATS = [
  "json",
  "yaml",
  "toml",
  "csv",
  "tsv",
  "lines",
  "text",
] as const;

export const SHORTCUTS: ShortcutMapping[] = [
  { short: ".mp", full: ".map", description: "Transform each element", type: "array" },
  { short: ".flt", full: ".filter", description: "Filter elements", type: "array" },
  { short: ".rd", full: ".reduce", description: "Reduce to single value", type: "array" },
  { short: ".fnd", full: ".find", description: "Find first match", type: "array" },
  { short: ".sm", full: ".some", description: "Test if any match", type: "array" },
  { short: ".evr", full: ".every", description: "Test if all match", type: "array" },
  { short: ".srt", full: ".sort", description: "Sort elements", type: "array" },
  { short: ".rvs", full: ".reverse", description: "Reverse order", type: "array" },
  { short: ".jn", full: ".join", description: "Join to string", type: "array" },
  { short: ".slc", full: ".slice", description: "Extract portion", type: "array" },
  { short: ".kys", full: ".{keys}", description: "Get object keys", type: "object" },
  { short: ".vls", full: ".{values}", description: "Get object values", type: "object" },
  { short: ".ents", full: ".{entries}", description: "Get object entries", type: "object" },
  { short: ".len", full: ".{length}", description: "Get length/size", type: "object" },
  { short: ".lc", full: ".toLowerCase", description: "Convert to lowercase", type: "string" },
  { short: ".uc", full: ".toUpperCase", description: "Convert to uppercase", type: "string" },
  { short: ".trm", full: ".trim", description: "Remove whitespace", type: "string" },
  { short: ".splt", full: ".split", description: "Split string to array", type: "string" },
  { short: ".incl", full: ".includes", description: "Check if includes", type: "array" },
];

export const HELP_TEXT = `1ls - Lightweight JSON CLI with JavaScript syntax

Usage: 1ls [options] [expression]

Options:
  -h, --help            Show this help message
  -v, --version         Show version number
  -r, --raw             Output raw strings without quotes
  -p, --pretty          Pretty print output with indentation
  -c, --compact         Output compact JSON (no whitespace)
  -t, --type            Show the type of the result
  --format <format>     Output format: json, yaml, csv, table
  --input-format, -if   Input format: json, yaml, toml, csv, tsv, lines, text
  --detect              Show detected input format without processing
  --shortcuts           List available expression shortcuts

Expression Syntax:
  .                     Identity (return entire input)
  .foo                  Access property 'foo'
  .foo.bar              Nested property access
  .[0]                  Array index access
  .foo[0].bar           Combined access
  .map(x => x.name)     Transform each element
  .filter(x => x > 5)   Filter elements
  .{keys}               Get object keys
  .{values}             Get object values
  .{length}             Get length

Examples:
  echo '{"name":"test"}' | 1ls .name
  echo '[1,2,3]' | 1ls '.map(x => x * 2)'
  echo '{"a":1,"b":2}' | 1ls '.{keys}'

Shortcuts:
  .mp -> .map           .flt -> .filter       .rd -> .reduce
  .fnd -> .find         .sm -> .some          .evr -> .every
  .srt -> .sort         .rvs -> .reverse      .jn -> .join
  .slc -> .slice        .kys -> .{keys}       .vls -> .{values}
  .ents -> .{entries}   .len -> .{length}
  .lc -> .toLowerCase   .uc -> .toUpperCase   .trm -> .trim
  .splt -> .split       .incl -> .includes
`;

const formatShortcutsByType = (type: string, title: string): string => {
  const filtered = SHORTCUTS.filter((s) => s.type === type);
  const lines = filtered.map((s) => `  ${s.short.padEnd(6)} -> ${s.full.padEnd(14)} ${s.description}`);
  return `${title}:\n${lines.join("\n")}`;
};

export const SHORTCUTS_TEXT = `Expression Shortcuts:

${formatShortcutsByType("array", "Array Methods")}

${formatShortcutsByType("object", "Object Methods")}

${formatShortcutsByType("string", "String Methods")}
`;
