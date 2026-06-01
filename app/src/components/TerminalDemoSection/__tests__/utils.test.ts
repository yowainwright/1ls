import { describe, test, expect } from "bun:test";
import { createCommandString, createSandpackFiles } from "../utils";

describe("createCommandString", () => {
  test("formats echo/pipe command correctly", () => {
    const result = createCommandString('{"name":"Alice"}', ".name");
    expect(result).toBe("echo '{\"name\":\"Alice\"}' | 1ls '.name'");
  });

  test("includes the input and command", () => {
    const input = "hello world";
    const command = ".length";
    const result = createCommandString(input, command);
    expect(result).toContain(input);
    expect(result).toContain(command);
  });

  test("wraps input and command in single quotes", () => {
    const result = createCommandString("data", ".expr");
    expect(result).toMatch(/echo '.*'/);
    expect(result).toMatch(/1ls '.*'/);
  });

  test("pipes echo output to 1ls", () => {
    const result = createCommandString("x", ".y");
    expect(result).toContain("|");
    expect(result.indexOf("echo")).toBeLessThan(result.indexOf("1ls"));
  });
});

describe("createSandpackFiles", () => {
  test("returns object with /demo.sh key", () => {
    const files = createSandpackFiles("input", ".expr");
    expect(files["/demo.sh"]).toBeDefined();
  });

  test("/demo.sh has code with shebang line", () => {
    const files = createSandpackFiles("input", ".expr");
    expect(files["/demo.sh"].code).toContain("#!/bin/bash");
  });

  test("/demo.sh has active=true", () => {
    const files = createSandpackFiles("input", ".expr");
    expect(files["/demo.sh"].active).toBe(true);
  });

  test("code includes the command string", () => {
    const input = '{"n":1}';
    const command = ".n";
    const files = createSandpackFiles(input, command);
    const cmd = createCommandString(input, command);
    expect(files["/demo.sh"].code).toContain(cmd);
  });
});
