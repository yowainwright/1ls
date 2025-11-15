export interface Method {
  name: string;
  signature: string;
  description: string;
  template?: string;
  category?: string;
}

export const ARRAY_METHODS: Method[] = [
  {
    name: "map",
    signature: ".map(x => ...)",
    description: "Transform each item",
    template: ".map(x => x)",
    category: "Transform",
  },
  {
    name: "filter",
    signature: ".filter(x => ...)",
    description: "Filter by condition",
    template: ".filter(x => x)",
    category: "Filter",
  },
  {
    name: "reduce",
    signature: ".reduce((acc, x) => ..., initial)",
    description: "Reduce to single value",
    template: ".reduce((acc, x) => acc, 0)",
    category: "Aggregate",
  },
  {
    name: "find",
    signature: ".find(x => ...)",
    description: "Find first match",
    template: ".find(x => x)",
    category: "Search",
  },
  {
    name: "findIndex",
    signature: ".findIndex(x => ...)",
    description: "Find first match index",
    template: ".findIndex(x => x)",
    category: "Search",
  },
  {
    name: "some",
    signature: ".some(x => ...)",
    description: "Check if any match",
    template: ".some(x => x)",
    category: "Test",
  },
  {
    name: "every",
    signature: ".every(x => ...)",
    description: "Check if all match",
    template: ".every(x => x)",
    category: "Test",
  },
  {
    name: "sort",
    signature: ".sort((a, b) => ...)",
    description: "Sort items",
    template: ".sort((a, b) => a - b)",
    category: "Transform",
  },
  {
    name: "reverse",
    signature: ".reverse()",
    description: "Reverse order",
    template: ".reverse()",
    category: "Transform",
  },
  {
    name: "slice",
    signature: ".slice(start, end)",
    description: "Get subset",
    template: ".slice(0, 10)",
    category: "Transform",
  },
  {
    name: "concat",
    signature: ".concat(arr)",
    description: "Combine arrays",
    template: ".concat([])",
    category: "Transform",
  },
  {
    name: "join",
    signature: '.join(separator)',
    description: "Join to string",
    template: ".join(', ')",
    category: "Convert",
  },
  {
    name: "flat",
    signature: ".flat(depth)",
    description: "Flatten nested arrays",
    template: ".flat(1)",
    category: "Transform",
  },
  {
    name: "flatMap",
    signature: ".flatMap(x => ...)",
    description: "Map then flatten",
    template: ".flatMap(x => x)",
    category: "Transform",
  },
  {
    name: "length",
    signature: ".length",
    description: "Get array length",
    template: ".length",
    category: "Property",
  },
];

export const STRING_METHODS: Method[] = [
  {
    name: "toUpperCase",
    signature: ".toUpperCase()",
    description: "Convert to uppercase",
    template: ".toUpperCase()",
    category: "Transform",
  },
  {
    name: "toLowerCase",
    signature: ".toLowerCase()",
    description: "Convert to lowercase",
    template: ".toLowerCase()",
    category: "Transform",
  },
  {
    name: "trim",
    signature: ".trim()",
    description: "Remove whitespace",
    template: ".trim()",
    category: "Transform",
  },
  {
    name: "trimStart",
    signature: ".trimStart()",
    description: "Remove leading whitespace",
    template: ".trimStart()",
    category: "Transform",
  },
  {
    name: "trimEnd",
    signature: ".trimEnd()",
    description: "Remove trailing whitespace",
    template: ".trimEnd()",
    category: "Transform",
  },
  {
    name: "split",
    signature: ".split(separator)",
    description: "Split into array",
    template: ".split(',')",
    category: "Convert",
  },
  {
    name: "replace",
    signature: ".replace(search, replace)",
    description: "Replace first match",
    template: ".replace('old', 'new')",
    category: "Transform",
  },
  {
    name: "replaceAll",
    signature: ".replaceAll(search, replace)",
    description: "Replace all matches",
    template: ".replaceAll('old', 'new')",
    category: "Transform",
  },
  {
    name: "substring",
    signature: ".substring(start, end)",
    description: "Extract substring",
    template: ".substring(0, 10)",
    category: "Transform",
  },
  {
    name: "slice",
    signature: ".slice(start, end)",
    description: "Extract slice",
    template: ".slice(0, 10)",
    category: "Transform",
  },
  {
    name: "startsWith",
    signature: ".startsWith(str)",
    description: "Check if starts with",
    template: ".startsWith('prefix')",
    category: "Test",
  },
  {
    name: "endsWith",
    signature: ".endsWith(str)",
    description: "Check if ends with",
    template: ".endsWith('suffix')",
    category: "Test",
  },
  {
    name: "includes",
    signature: ".includes(str)",
    description: "Check if contains",
    template: ".includes('text')",
    category: "Test",
  },
  {
    name: "match",
    signature: ".match(regex)",
    description: "Match regex pattern",
    template: ".match(/pattern/)",
    category: "Search",
  },
  {
    name: "length",
    signature: ".length",
    description: "Get string length",
    template: ".length",
    category: "Property",
  },
];

export const OBJECT_OPERATIONS: Method[] = [
  {
    name: "keys",
    signature: ".{keys}",
    description: "Get object keys",
    template: ".{keys}",
    category: "Convert",
  },
  {
    name: "values",
    signature: ".{values}",
    description: "Get object values",
    template: ".{values}",
    category: "Convert",
  },
  {
    name: "entries",
    signature: ".{entries}",
    description: "Get key-value pairs",
    template: ".{entries}",
    category: "Convert",
  },
  {
    name: "length",
    signature: ".{length}",
    description: "Get property count",
    template: ".{length}",
    category: "Property",
  },
];

export const NUMBER_METHODS: Method[] = [
  {
    name: "toFixed",
    signature: ".toFixed(decimals)",
    description: "Format with decimals",
    template: ".toFixed(2)",
    category: "Format",
  },
  {
    name: "toString",
    signature: ".toString()",
    description: "Convert to string",
    template: ".toString()",
    category: "Convert",
  },
];

export const getMethodsForType = (type: string): Method[] => {
  switch (type) {
    case "Array":
      return ARRAY_METHODS;
    case "String":
      return STRING_METHODS;
    case "Object":
      return OBJECT_OPERATIONS;
    case "Number":
      return NUMBER_METHODS;
    default:
      return [];
  }
};
