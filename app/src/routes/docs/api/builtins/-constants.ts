import type { MethodCardProps } from '../-components/MethodCard/types'

export interface BuiltinCategory {
  title: string
  description: string
  builtins: MethodCardProps[]
}

export const BUILTIN_CATEGORIES: BuiltinCategory[] = [
  {
    title: 'Array Operations',
    description: 'Functions for working with arrays.',
    builtins: [
      {
        name: 'head / hd',
        description: 'Get the first element of an array.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'head()'`,
        output: '1',
      },
      {
        name: 'last / lst',
        description: 'Get the last element of an array.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'last()'`,
        output: '5',
      },
      {
        name: 'tail / tl',
        description: 'Get all elements except the first.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'tail()'`,
        output: '[2, 3, 4, 5]',
      },
      {
        name: 'take / tk',
        description: 'Take the first n elements.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'take(3)'`,
        output: '[1, 2, 3]',
      },
      {
        name: 'drop / drp',
        description: 'Drop the first n elements.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'drop(2)'`,
        output: '[3, 4, 5]',
      },
      {
        name: 'uniq / unq',
        description: 'Remove duplicate values.',
        example: `echo '[1, 2, 2, 3, 3, 3]' | 1ls 'uniq()'`,
        output: '[1, 2, 3]',
      },
      {
        name: 'flatten / fltn',
        description: 'Flatten nested arrays recursively.',
        example: `echo '[[1, 2], [3, [4, 5]]]' | 1ls 'flatten()'`,
        output: '[1, 2, 3, 4, 5]',
      },
      {
        name: 'rev',
        description: 'Reverse an array.',
        example: `echo '[1, 2, 3]' | 1ls 'rev()'`,
        output: '[3, 2, 1]',
      },
      {
        name: 'chunk / chnk',
        description: 'Split array into chunks of size n.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'chunk(2)'`,
        output: '[[1, 2], [3, 4], [5]]',
      },
      {
        name: 'compact / cmpct',
        description: 'Remove falsy values (null, undefined, false, 0, "").',
        example: `echo '[0, 1, false, 2, "", 3, null]' | 1ls 'compact()'`,
        output: '[1, 2, 3]',
      },
      {
        name: 'nth',
        description: 'Get element at index n (supports negative indexes).',
        example: `echo '[10, 20, 30, 40]' | 1ls 'nth(-1)'`,
        output: '40',
      },
      {
        name: 'add',
        description: 'Sum numbers, concatenate arrays, or join strings.',
        example: `echo '[1, 2, 3, 4]' | 1ls 'add()'`,
        output: '10',
      },
    ],
  },
  {
    title: 'Object Operations',
    description: 'Functions for working with objects.',
    builtins: [
      {
        name: 'keys / ks',
        description: 'Get object keys.',
        example: `echo '{"a": 1, "b": 2}' | 1ls 'keys()'`,
        output: '["a", "b"]',
      },
      {
        name: 'vals',
        description: 'Get object values.',
        example: `echo '{"a": 1, "b": 2}' | 1ls 'vals()'`,
        output: '[1, 2]',
      },
      {
        name: 'pick / pk',
        description: 'Pick specific keys from an object.',
        example: `echo '{"a": 1, "b": 2, "c": 3}' | 1ls 'pick("a", "c")'`,
        output: '{"a": 1, "c": 3}',
      },
      {
        name: 'omit / omt',
        description: 'Omit specific keys from an object.',
        example: `echo '{"a": 1, "b": 2, "c": 3}' | 1ls 'omit("b")'`,
        output: '{"a": 1, "c": 3}',
      },
      {
        name: 'merge / mrg',
        description: 'Shallow merge objects.',
        example: `echo '{"a": 1}' | 1ls 'merge({"b": 2})'`,
        output: '{"a": 1, "b": 2}',
      },
      {
        name: 'deepMerge / dMrg',
        description: 'Deep merge objects recursively.',
        example: `echo '{"a": {"x": 1}}' | 1ls 'deepMerge({"a": {"y": 2}})'`,
        output: '{"a": {"x": 1, "y": 2}}',
      },
      {
        name: 'fromPairs / frPrs',
        description: 'Convert array of pairs to object.',
        example: `echo '[["a", 1], ["b", 2]]' | 1ls 'fromPairs()'`,
        output: '{"a": 1, "b": 2}',
      },
      {
        name: 'toPairs / toPrs',
        description: 'Convert object to array of pairs.',
        example: `echo '{"a": 1, "b": 2}' | 1ls 'toPairs()'`,
        output: '[["a", 1], ["b", 2]]',
      },
      {
        name: 'has / hs',
        description: 'Check if object has a key.',
        example: `echo '{"name": "test"}' | 1ls 'has("name")'`,
        output: 'true',
      },
      {
        name: 'pluck / plk',
        description: 'Extract a property from each object in an array.',
        example: `echo '[{"name": "a"}, {"name": "b"}]' | 1ls 'pluck("name")'`,
        output: '["a", "b"]',
      },
    ],
  },
  {
    title: 'Grouping & Sorting',
    description: 'Functions for grouping and sorting data.',
    builtins: [
      {
        name: 'groupBy / grpBy',
        description: 'Group array elements by a key function.',
        example: `echo '[{"type": "a", "v": 1}, {"type": "b", "v": 2}, {"type": "a", "v": 3}]' | 1ls 'groupBy(x => x.type)'`,
        output: '{"a": [...], "b": [...]}',
      },
      {
        name: 'sortBy / srtBy',
        description: 'Sort array by a key function.',
        example: `echo '[{"age": 30}, {"age": 20}, {"age": 25}]' | 1ls 'sortBy(x => x.age)'`,
        output: '[{"age": 20}, {"age": 25}, {"age": 30}]',
      },
    ],
  },
  {
    title: 'Math & Aggregation',
    description: 'Mathematical and aggregation functions.',
    builtins: [
      {
        name: 'sum',
        description: 'Sum of numbers in an array.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'sum()'`,
        output: '15',
      },
      {
        name: 'mean / avg',
        description: 'Average of numbers in an array.',
        example: `echo '[1, 2, 3, 4, 5]' | 1ls 'mean()'`,
        output: '3',
      },
      {
        name: 'min',
        description: 'Minimum value in an array.',
        example: `echo '[5, 2, 8, 1, 9]' | 1ls 'min()'`,
        output: '1',
      },
      {
        name: 'max',
        description: 'Maximum value in an array.',
        example: `echo '[5, 2, 8, 1, 9]' | 1ls 'max()'`,
        output: '9',
      },
      {
        name: 'floor / flr',
        description: 'Floor a number.',
        example: `echo '3.7' | 1ls 'floor()'`,
        output: '3',
      },
      {
        name: 'ceil / cl',
        description: 'Ceiling of a number.',
        example: `echo '3.2' | 1ls 'ceil()'`,
        output: '4',
      },
      {
        name: 'round / rnd',
        description: 'Round a number.',
        example: `echo '3.5' | 1ls 'round()'`,
        output: '4',
      },
      {
        name: 'abs',
        description: 'Absolute value.',
        example: `echo '-5' | 1ls 'abs()'`,
        output: '5',
      },
    ],
  },
  {
    title: 'String Operations',
    description: 'Functions for working with strings.',
    builtins: [
      {
        name: 'split / spl',
        description: 'Split a string by separator.',
        example: `echo '"a,b,c"' | 1ls 'split(",")'`,
        output: '["a", "b", "c"]',
      },
      {
        name: 'join / jn',
        description: 'Join array elements with separator.',
        example: `echo '["a", "b", "c"]' | 1ls 'join("-")'`,
        output: '"a-b-c"',
      },
      {
        name: 'startswith / stw',
        description: 'Check if string starts with prefix.',
        example: `echo '"hello world"' | 1ls 'startswith("hello")'`,
        output: 'true',
      },
      {
        name: 'endswith / edw',
        description: 'Check if string ends with suffix.',
        example: `echo '"hello world"' | 1ls 'endswith("world")'`,
        output: 'true',
      },
      {
        name: 'ltrimstr / ltrm',
        description: 'Remove prefix from string.',
        example: `echo '"hello world"' | 1ls 'ltrimstr("hello ")'`,
        output: '"world"',
      },
      {
        name: 'rtrimstr / rtrm',
        description: 'Remove suffix from string.',
        example: `echo '"hello world"' | 1ls 'rtrimstr(" world")'`,
        output: '"hello"',
      },
      {
        name: 'tostring / tstr',
        description: 'Convert value to string.',
        example: `echo '42' | 1ls 'tostring()'`,
        output: '"42"',
      },
      {
        name: 'tonumber / tnum',
        description: 'Convert string to number.',
        example: `echo '"42"' | 1ls 'tonumber()'`,
        output: '42',
      },
    ],
  },
  {
    title: 'Type & Inspection',
    description: 'Functions for inspecting values.',
    builtins: [
      {
        name: 'type / typ',
        description: 'Get the type of a value.',
        example: `echo '{"a": 1}' | 1ls 'type()'`,
        output: '"object"',
      },
      {
        name: 'len',
        description: 'Get length of array, string, or object.',
        example: `echo '"hello"' | 1ls 'len()'`,
        output: '5',
      },
      {
        name: 'count / cnt',
        description: 'Count items (alias for len).',
        example: `echo '[1, 2, 3]' | 1ls 'count()'`,
        output: '3',
      },
      {
        name: 'isEmpty / emp',
        description: 'Check if value is empty.',
        example: `echo '[]' | 1ls 'isEmpty()'`,
        output: 'true',
      },
      {
        name: 'isNil / nil',
        description: 'Check if value is null or undefined.',
        example: `echo 'null' | 1ls 'isNil()'`,
        output: 'true',
      },
      {
        name: 'contains / ctns',
        description: 'Check if value contains another (deep comparison).',
        example: `echo '[1, 2, 3]' | 1ls 'contains([2])'`,
        output: 'true',
      },
    ],
  },
  {
    title: 'Path Operations',
    description: 'Functions for navigating nested structures.',
    builtins: [
      {
        name: 'path / pth',
        description: 'Get all paths in a structure.',
        example: `echo '{"a": {"b": 1}}' | 1ls 'path()'`,
        output: '[[], ["a"], ["a", "b"]]',
      },
      {
        name: 'getpath / gpth',
        description: 'Get value at a path.',
        example: `echo '{"a": {"b": 1}}' | 1ls 'getpath(["a", "b"])'`,
        output: '1',
      },
      {
        name: 'setpath / spth',
        description: 'Set value at a path.',
        example: `echo '{"a": {"b": 1}}' | 1ls 'setpath(["a", "b"], 99)'`,
        output: '{"a": {"b": 99}}',
      },
      {
        name: 'recurse / rec',
        description: 'Recursively collect all values.',
        example: `echo '{"a": [1, {"b": 2}]}' | 1ls 'recurse()'`,
        output: '[..all nested values..]',
      },
    ],
  },
  {
    title: 'Control Flow',
    description: 'Functions for control flow and composition.',
    builtins: [
      {
        name: 'select / sel',
        description: 'Filter by predicate (jq-style).',
        example: `echo '[1, 2, 3, 4]' | 1ls '.map(x => select(x > 2))'`,
        output: '[3, 4]',
      },
      {
        name: 'empty',
        description: 'Return nothing (useful in select).',
        example: `echo '1' | 1ls 'empty()'`,
        output: '(no output)',
      },
      {
        name: 'error',
        description: 'Throw an error with message.',
        example: `echo '1' | 1ls 'error("bad value")'`,
        output: 'Error: bad value',
      },
      {
        name: 'debug / dbg',
        description: 'Output debug information.',
        example: `echo '{"x": 1}' | 1ls 'debug()'`,
        output: '(logs value, returns input)',
      },
      {
        name: 'not',
        description: 'Boolean negation.',
        example: `echo 'true' | 1ls 'not()'`,
        output: 'false',
      },
      {
        name: 'range / rng',
        description: 'Generate a range of numbers.',
        example: `echo 'null' | 1ls 'range(5)'`,
        output: '[0, 1, 2, 3, 4]',
      },
    ],
  },
  {
    title: 'Composition',
    description: 'Functions for composing operations.',
    builtins: [
      {
        name: 'pipe',
        description: 'Apply expressions left-to-right.',
        example: `echo '[1, 2, 3]' | 1ls 'pipe(.map(x => x * 2), .filter(x => x > 2))'`,
        output: '[4, 6]',
      },
      {
        name: 'compose',
        description: 'Apply expressions right-to-left.',
        example: `echo '[1, 2, 3]' | 1ls 'compose(.filter(x => x > 1), .map(x => x * 2))'`,
        output: '[4, 6]',
      },
      {
        name: 'id',
        description: 'Identity function (returns input unchanged).',
        example: `echo '{"a": 1}' | 1ls 'id()'`,
        output: '{"a": 1}',
      },
    ],
  },
]

export const ALL_BUILTINS = BUILTIN_CATEGORIES.flatMap((cat) => cat.builtins)
