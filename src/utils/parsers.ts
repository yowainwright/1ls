import type { DataFormat } from "./types";

export function detectFormat(input: string): DataFormat {
  const trimmed = input.trim();

  // Check for JSON
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for YAML indicators
  if (
    trimmed.includes("---") ||
    trimmed.includes(": ") ||
    trimmed.match(/^[\s]*-\s+/m)
  ) {
    return "yaml";
  }

  // Check for TOML indicators
  if (trimmed.match(/^\[[\w.]+\]/m) || trimmed.match(/^\w+\s*=\s*/m)) {
    return "toml";
  }

  // Check for CSV/TSV
  const lines = trimmed.split("\n");
  if (lines.length > 1) {
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    if (tabCount > 0 && tabCount >= commaCount) {
      return "tsv";
    }
    if (commaCount > 0) {
      return "csv";
    }
  }

  // Default to lines for multi-line text
  if (lines.length > 1) {
    return "lines";
  }

  return "text";
}

/**
 * Parse line-by-line text into an array
 */
export function parseLines(input: string): string[] {
  return input
    .trim()
    .split("\n")
    .filter((line) => line.length > 0);
}

/**
 * Parse CSV data into an array of objects
 */
export function parseCSV(input: string, delimiter: string = ","): any[] {
  const lines = input.trim().split("\n");
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0], delimiter);
  if (lines.length === 1) return [];

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length === 0) continue;

    const row: any = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = parseCSVValue(values[j] || "");
    }
    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  result.push(current);

  return result.map((field) => field.trim());
}

/**
 * Parse a CSV value, converting to appropriate type
 */
function parseCSVValue(value: string): any {
  const trimmed = value.trim();

  // Remove surrounding quotes if present
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }

  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Boolean values
  if (trimmed.toLowerCase() === "true") return true;
  if (trimmed.toLowerCase() === "false") return false;

  // Null values
  if (trimmed === "" || trimmed.toLowerCase() === "null") return null;

  return trimmed;
}

/**
 * Parse TSV data (Tab-Separated Values)
 */
export function parseTSV(input: string): any[] {
  return parseCSV(input, "\t");
}

/**
 * Parse YAML to JSON (simplified parser for basic YAML)
 */
export function parseYAML(input: string): any {
  const lines = input.trim().split("\n");
  const result: any = {};
  const stack: any[] = [result];
  const indentStack: number[] = [0];
  let currentList: any[] | null = null;
  let listIndent = -1;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    let line = lines[lineNum];

    const commentIdx = line.indexOf("#");
    if (commentIdx >= 0) {
      const beforeComment = line.substring(0, commentIdx);
      const quoteCount = (beforeComment.match(/["']/g) || []).length;
      if (quoteCount % 2 === 0) {
        line = beforeComment;
      }
    }

    if (!line.trim()) continue;

    if (line.trim() === "---" || line.trim() === "...") continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    // Handle list items
    if (trimmed.startsWith("- ")) {
      const value = trimmed.substring(2).trim();

      if (currentList && indent === listIndent) {
        currentList.push(parseYAMLValue(value));
      } else {
        // Start new list
        currentList = [parseYAMLValue(value)];
        listIndent = indent;

        // Find parent object
        while (
          indentStack.length > 1 &&
          indentStack[indentStack.length - 1] >= indent
        ) {
          stack.pop();
          indentStack.pop();
        }

        const parent = stack[stack.length - 1];
        if (typeof parent === "object" && !Array.isArray(parent)) {
          // Need to attach this list to a key
          const prevLine = findPreviousKey(lines, lineNum);
          if (prevLine) {
            parent[prevLine] = currentList;
          }
        }
      }
      continue;
    }

    // Reset list tracking if we're not in a list item
    if (!trimmed.startsWith("- ")) {
      currentList = null;
      listIndent = -1;
    }

    // Handle key-value pairs
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Pop stack until we find the right indentation level
      while (
        indentStack.length > 1 &&
        indentStack[indentStack.length - 1] >= indent
      ) {
        stack.pop();
        indentStack.pop();
      }

      const parent = stack[stack.length - 1];

      if (!value) {
        const nextLineIdx = lineNum + 1;
        if (nextLineIdx < lines.length) {
          const nextLine = lines[nextLineIdx].trim();
          if (nextLine.startsWith("- ")) {
            continue;
          }
        }
        const newObj = {};
        parent[key] = newObj;
        stack.push(newObj);
        indentStack.push(indent);
      } else {
        parent[key] = parseYAMLValue(value);
      }
    }
  }

  return result;
}

function findPreviousKey(lines: string[], currentIndex: number): string | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    let line = lines[i];

    const commentIdx = line.indexOf("#");
    if (commentIdx >= 0) {
      const beforeComment = line.substring(0, commentIdx);
      const quoteCount = (beforeComment.match(/["']/g) || []).length;
      if (quoteCount % 2 === 0) {
        line = beforeComment;
      }
    }

    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("-") && trimmed.includes(":")) {
      const colonIndex = trimmed.indexOf(":");
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      if (!value) {
        return key;
      }
    }
  }
  return null;
}

/**
 * Parse a YAML value
 */
function parseYAMLValue(value: string): any {
  // Remove quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Boolean values
  if (value === "true" || value === "yes" || value === "on") return true;
  if (value === "false" || value === "no" || value === "off") return false;

  // Null values
  if (value === "null" || value === "~" || value === "") return null;

  // Numbers
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  // Arrays (inline)
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseYAMLValue(v.trim()));
  }

  // Objects (inline)
  if (value.startsWith("{") && value.endsWith("}")) {
    const obj: any = {};
    const pairs = value.slice(1, -1).split(",");
    for (const pair of pairs) {
      const [k, v] = pair.split(":").map((s) => s.trim());
      if (k && v) {
        obj[k] = parseYAMLValue(v);
      }
    }
    return obj;
  }

  return value;
}

/**
 * Parse TOML to JSON (simplified parser for basic TOML)
 */
export function parseTOML(input: string): any {
  const lines = input.trim().split("\n");
  const result: any = {};
  let currentSection: any = result;
  let currentSectionPath: string[] = [];

  for (let line of lines) {
    const commentIdx = line.indexOf("#");
    if (commentIdx >= 0) {
      const beforeComment = line.substring(0, commentIdx);
      const quoteCount = (beforeComment.match(/["']/g) || []).length;
      if (quoteCount % 2 === 0) {
        line = beforeComment;
      }
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle sections [section.name]
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const sectionPath = trimmed.slice(1, -1).split(".");
      currentSection = result;
      currentSectionPath = [];

      for (const part of sectionPath) {
        if (!currentSection[part]) {
          currentSection[part] = {};
        }
        currentSection = currentSection[part];
        currentSectionPath.push(part);
      }
      continue;
    }

    // Handle key-value pairs
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex > 0) {
      const key = trimmed.substring(0, equalsIndex).trim();
      const value = trimmed.substring(equalsIndex + 1).trim();
      currentSection[key] = parseTOMLValue(value);
    }
  }

  return result;
}

/**
 * Parse a TOML value
 */
function parseTOMLValue(value: string): any {
  // Strings
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  // Booleans
  if (value === "true") return true;
  if (value === "false") return false;

  // Numbers
  if (/^[+-]?\d+$/.test(value)) return parseInt(value, 10);
  if (/^[+-]?\d+\.\d+$/.test(value)) return parseFloat(value);

  // Arrays
  if (value.startsWith("[") && value.endsWith("]")) {
    const items = value.slice(1, -1).split(",");
    return items.map((item) => parseTOMLValue(item.trim()));
  }

  // Inline tables
  if (value.startsWith("{") && value.endsWith("}")) {
    const table: any = {};
    const pairs = value.slice(1, -1).split(",");
    for (const pair of pairs) {
      const [k, v] = pair.split("=").map((s) => s.trim());
      if (k && v) {
        table[k] = parseTOMLValue(v);
      }
    }
    return table;
  }

  return value;
}

/**
 * Parse input based on detected or specified format
 */
export function parseInput(input: string, format?: DataFormat): any {
  const detectedFormat = format || detectFormat(input);

  switch (detectedFormat) {
    case "json":
      return JSON.parse(input);

    case "yaml":
      return parseYAML(input);

    case "toml":
      return parseTOML(input);

    case "csv":
      return parseCSV(input);

    case "tsv":
      return parseTSV(input);

    case "lines":
      return parseLines(input);

    case "text":
    default:
      return input;
  }
}
