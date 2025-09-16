import { CliOptions } from "../types";
import { colorize } from "./colors";

export class Formatter {
  private options: CliOptions;

  constructor(options: CliOptions) {
    this.options = options;
  }

  format(data: any): string {
    if (this.options.raw) {
      return this.formatRaw(data);
    }

    if (this.options.type) {
      return this.formatWithType(data);
    }

    switch (this.options.format) {
      case "yaml":
        return this.formatYaml(data);
      case "csv":
        return this.formatCsv(data);
      case "table":
        return this.formatTable(data);
      default:
        return this.formatJson(data);
    }
  }

  private formatRaw(data: any): string {
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

  private formatJson(data: any): string {
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

  private formatWithType(data: any): string {
    const type = Array.isArray(data) ? "array" : typeof data;
    const value = this.formatJson(data);
    return `[${type}] ${value}`;
  }

  private formatYaml(data: any): string {
    // Simple YAML formatter (basic implementation)
    return this.toYaml(data, 0);
  }

  private toYaml(data: any, indent: number): string {
    const spaces = " ".repeat(indent);

    if (data === null || data === undefined) {
      return "null";
    }

    if (typeof data === "string") {
      return data.includes("\n") || data.includes('"') || data.includes("'")
        ? `|\n${spaces}  ${data.replace(/\n/g, "\n" + spaces + "  ")}`
        : data;
    }

    if (typeof data === "number" || typeof data === "boolean") {
      return String(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return "[]";
      return data
        .map((item) => `${spaces}- ${this.toYaml(item, indent + 2).trim()}`)
        .join("\n");
    }

    if (typeof data === "object") {
      const entries = Object.entries(data);
      if (entries.length === 0) return "{}";
      return entries
        .map(([key, value]) => {
          const formattedValue = this.toYaml(value, indent + 2);
          if (typeof value === "object" && value !== null) {
            return `${spaces}${key}:\n${formattedValue}`;
          }
          return `${spaces}${key}: ${formattedValue}`;
        })
        .join("\n");
    }

    return String(data);
  }

  private formatCsv(data: any): string {
    if (!Array.isArray(data)) {
      return this.formatJson(data);
    }

    if (data.length === 0) {
      return "";
    }

    // Check if all items are objects with same keys
    if (
      typeof data[0] === "object" &&
      data[0] !== null &&
      !Array.isArray(data[0])
    ) {
      const keys = Object.keys(data[0]);
      const headers = keys.join(",");
      const rows = data.map((item) =>
        keys.map((key) => this.escapeCsvValue(item[key])).join(","),
      );
      return [headers, ...rows].join("\n");
    }

    // Simple array of values
    return data.map((item) => this.escapeCsvValue(item)).join("\n");
  }

  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private formatTable(data: any): string {
    if (!Array.isArray(data)) {
      return this.formatJson(data);
    }

    if (data.length === 0) {
      return "(empty array)";
    }

    // Check if all items are objects
    if (
      typeof data[0] === "object" &&
      data[0] !== null &&
      !Array.isArray(data[0])
    ) {
      return this.formatObjectTable(data);
    }

    // Simple list
    return data
      .map((item, index) => `${index}: ${this.formatRaw(item)}`)
      .join("\n");
  }

  private formatObjectTable(data: any[]): string {
    const keys = [...new Set(data.flatMap((item) => Object.keys(item)))];

    // Calculate column widths
    const widths: Record<string, number> = {};
    keys.forEach((key) => {
      widths[key] = Math.max(
        key.length,
        ...data.map((item) => String(item[key] ?? "").length),
      );
    });

    // Create header
    const header = keys.map((key) => key.padEnd(widths[key])).join(" | ");
    const separator = keys.map((key) => "-".repeat(widths[key])).join("-+-");

    // Create rows
    const rows = data.map((item) =>
      keys
        .map((key) => String(item[key] ?? "").padEnd(widths[key]))
        .join(" | "),
    );

    return [header, separator, ...rows].join("\n");
  }
}
