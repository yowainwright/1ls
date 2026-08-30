import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createCommandString, createSandpackFiles } from "../utils";

describe("createCommandString", () => {
  test("formats echo/pipe command correctly", () => {
    const result = createCommandString('{"name":"Alice"}', ".name");
    assert.strictEqual(result, "echo '{\"name\":\"Alice\"}' | 1ls '.name'");
  });

  test("includes the input and command", () => {
    const input = "hello world";
    const command = ".length";
    const result = createCommandString(input, command);
    assert.match(result, /hello world/);
    assert.match(result, /\.length/);
  });

  test("wraps input and command in single quotes", () => {
    const result = createCommandString("data", ".expr");
    assert.match(result, /echo '.*'/);
    assert.match(result, /1ls '.*'/);
  });

  test("pipes echo output to 1ls", () => {
    const result = createCommandString("x", ".y");
    assert.match(result, /\|/);
    assert.match(result, /echo.*1ls/);
  });
});

describe("createSandpackFiles", () => {
  test("returns object with /demo.sh key", () => {
    const files = createSandpackFiles("input", ".expr");
    assert.notStrictEqual(files["/demo.sh"], undefined);
  });

  test("/demo.sh has code with shebang line", () => {
    const files = createSandpackFiles("input", ".expr");
    assert.ok(files["/demo.sh"].code.includes("#!/bin/bash"));
  });

  test("/demo.sh has active=true", () => {
    const files = createSandpackFiles("input", ".expr");
    assert.strictEqual(files["/demo.sh"].active, true);
  });

  test("code includes the command string", () => {
    const input = '{"n":1}';
    const command = ".n";
    const files = createSandpackFiles(input, command);
    const cmd = createCommandString(input, command);
    assert.ok(files["/demo.sh"].code.includes(cmd));
  });
});
