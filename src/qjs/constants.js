export const VERSION = '__VERSION__';

export const VALID_OUTPUT_FORMATS = ['json', 'yaml', 'csv', 'table'];

export const VALID_INPUT_FORMATS = ['json', 'yaml', 'toml', 'csv', 'tsv', 'lines', 'text'];

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

export const SHORTCUTS_TEXT = `Expression Shortcuts:

Array Methods:
  .mp    -> .map           Transform each element
  .flt   -> .filter        Filter elements
  .rd    -> .reduce        Reduce to single value
  .fnd   -> .find          Find first match
  .sm    -> .some          Test if any match
  .evr   -> .every         Test if all match
  .srt   -> .sort          Sort elements
  .rvs   -> .reverse       Reverse order
  .jn    -> .join          Join to string
  .slc   -> .slice         Extract portion
  .incl  -> .includes      Check if includes

Object Methods:
  .kys   -> .{keys}        Get object keys
  .vls   -> .{values}      Get object values
  .ents  -> .{entries}     Get object entries
  .len   -> .{length}      Get length/size

String Methods:
  .lc    -> .toLowerCase   Convert to lowercase
  .uc    -> .toUpperCase   Convert to uppercase
  .trm   -> .trim          Remove whitespace
  .splt  -> .split         Split string to array
`;
