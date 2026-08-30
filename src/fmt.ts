import type { CliOptions } from "./types";
import { colorize } from "./dx";

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  const isObjectValue = typeof value === "object" && value !== null;
  if (!isObjectValue) return false;
  return !Array.isArray(value);
};

const escapeCsvValue = (value: unknown): string => {
  const isNullish = value === null || value === undefined;
  if (isNullish) return "";

  const stringValue = String(value);
  const hasSpecialCharacters = /[,"\n]/.test(stringValue);
  if (!hasSpecialCharacters) return stringValue;

  return `"${stringValue.replace(/"/g, '""')}"`;
};

const formatCsvRecord = (keys: string[], item: Record<string, unknown>): string =>
  keys.map((key) => escapeCsvValue(item[key])).join(",");

const getColumnWidth = (data: Record<string, unknown>[], key: string): number => {
  let width = key.length;

  for (const item of data) {
    const valueWidth = String(item[key] ?? "").length;
    if (valueWidth > width) width = valueWidth;
  }

  return width;
};

const formatTableRow = (
  keys: string[],
  item: Record<string, unknown>,
  widths: Record<string, number>,
): string => keys.map((key) => String(item[key] ?? "").padEnd(widths[key])).join(" | ");

const hasTableKey = (keys: string[], key: string): boolean => {
  for (const existingKey of keys) {
    if (existingKey === key) return true;
  }

  return false;
};

const appendTableKeys = (keys: string[], item: Record<string, unknown>): void => {
  for (const key of Object.keys(item)) {
    if (!hasTableKey(keys, key)) keys[keys.length] = key;
  }
};

const firstArrayItem = (data: unknown[]): unknown => {
  for (const item of data) {
    return item;
  }

  return undefined;
};

const formatYamlString = (value: string, spaces: string): string => {
  const hasSpecialCharacters = /[\n"']/.test(value);
  if (!hasSpecialCharacters) return value;
  return `|\n${spaces}  ${value.replace(/\n/g, "\n" + spaces + "  ")}`;
};

export class Formatter {
  private options: CliOptions;

  constructor(options: CliOptions) {
    this.options = options;
  }

  format(data: unknown): string {
    if (this.options.raw) {
      return this.formatRaw(data);
    }

    if (this.options.type) {
      return this.formatWithType(data);
    }

    if (this.options.format === "yaml") return this.formatYaml(data);
    if (this.options.format === "csv") return this.formatCsv(data);
    if (this.options.format === "table") return this.formatTable(data);
    return this.formatJson(data);
  }

  private formatRaw(data: unknown): string {
    if (typeof data === "string") {
      return data;
    }
    if (data === undefined) {
      return "";
    }
    if (data === null) {
      return "null";
    }
    if (typeof data === "object") {
      return JSON.stringify(data);
    }
    return String(data);
  }

  private formatJson(data: unknown): string {
    if (data === undefined) {
      return "undefined";
    }

    if (this.options.compact) {
      return JSON.stringify(data);
    }

    if (this.options.pretty) {
      const json = JSON.stringify(data, null, 2);
      return colorize(json);
    }

    return JSON.stringify(data, null, 2);
  }

  private formatWithType(data: unknown): string {
    const type = Array.isArray(data) ? "array" : typeof data;
    const value = this.formatJson(data);
    return `[${type}] ${value}`;
  }

  private formatYaml(data: unknown): string {
    return this.toYaml(data, 0);
  }

  private toYaml(data: unknown, indent: number): string {
    const isNullish = data === null || data === undefined;
    if (isNullish) return "null";
    if (typeof data === "string") return formatYamlString(data, " ".repeat(indent));
    if (this.isYamlPrimitive(data)) return String(data);
    if (Array.isArray(data)) return this.formatYamlArray(data, indent);
    if (typeof data === "object") return this.formatYamlObject(data, indent);

    return String(data);
  }

  private isYamlPrimitive(data: unknown): boolean {
    const isNumber = typeof data === "number";
    if (isNumber) return true;
    const isBoolean = typeof data === "boolean";
    return isBoolean;
  }

  private formatYamlArray(data: unknown[], indent: number): string {
    if (data.length === 0) return "[]";
    const spaces = " ".repeat(indent);
    return data.map((item) => `${spaces}- ${this.toYaml(item, indent + 2).trim()}`).join("\n");
  }

  private formatYamlEntry(key: string, value: unknown, indent: number): string {
    const spaces = " ".repeat(indent);
    const formattedValue = this.toYaml(value, indent + 2);
    const isNestedValue = typeof value === "object" && value !== null;
    if (isNestedValue) return `${spaces}${key}:\n${formattedValue}`;
    return `${spaces}${key}: ${formattedValue}`;
  }

  private formatYamlObject(data: object, indent: number): string {
    const entries = Object.entries(data);
    if (entries.length === 0) return "{}";
    const yamlEntries = entries.map(([key, value]) => this.formatYamlEntry(key, value, indent));
    return yamlEntries.join("\n");
  }

  private formatCsv(data: unknown): string {
    if (!Array.isArray(data)) {
      return this.formatJson(data);
    }

    if (data.length === 0) {
      return "";
    }

    if (isObjectRecord(firstArrayItem(data))) {
      const records = data as Record<string, unknown>[];
      const keys = Object.keys(firstArrayItem(data) as Record<string, unknown>);
      const headers = keys.join(",");
      const rows = records.map((item) => formatCsvRecord(keys, item));
      return [headers, ...rows].join("\n");
    }
    return data.map(escapeCsvValue).join("\n");
  }

  private formatTable(data: unknown): string {
    if (!Array.isArray(data)) {
      return this.formatJson(data);
    }

    if (data.length === 0) {
      return "(empty array)";
    }

    if (isObjectRecord(firstArrayItem(data))) {
      return this.formatObjectTable(data as Record<string, unknown>[]);
    }
    return data
      .map((item, index) => `${index}: ${this.formatRaw(item)}`)
      .join("\n");
  }

  private formatObjectTable(data: Record<string, unknown>[]): string {
    const keys = this.getTableKeys(data);

    const widths = Object.fromEntries(keys.map((key) => [key, getColumnWidth(data, key)]));
    const header = keys.map((key) => key.padEnd(widths[key])).join(" | ");
    const separator = keys.map((key) => "-".repeat(widths[key])).join("-+-");
    const rows = data.map((item) => formatTableRow(keys, item, widths));

    return [header, separator, ...rows].join("\n");
  }

  private getTableKeys(data: Record<string, unknown>[]): string[] {
    const keys: string[] = [];

    for (const item of data) {
      appendTableKeys(keys, item);
    }

    return keys;
  }
}
