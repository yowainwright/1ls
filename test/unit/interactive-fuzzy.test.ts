import { describe, test, expect } from "bun:test";
import { fuzzySearch } from "../../src/interactive/fuzzy";

describe("Fuzzy Search", () => {
  const items = [
    { name: "users[0].name" },
    { name: "users[0].email" },
    { name: "users[1].name" },
    { name: "settings.port" },
    { name: "settings.host" },
  ];

  test("returns all items when pattern is empty", () => {
    const results = fuzzySearch(items, "", (item) => item.name);
    expect(results.length).toBe(5);
  });

  test("filters items by fuzzy pattern", () => {
    const results = fuzzySearch(items, "name", (item) => item.name);
    expect(results.length).toBe(2);
    expect(results[0].item.name).toMatch(/name/);
  });

  test("scores consecutive matches higher", () => {
    const results = fuzzySearch(items, "port", (item) => item.name);
    expect(results.length).toBe(1);
    expect(results[0].item.name).toBe("settings.port");
  });

  test("returns matches in score order", () => {
    const testItems = [
      { name: "u.s.e.r" },
      { name: "user" },
      { name: "users" },
    ];
    const results = fuzzySearch(testItems, "user", (item) => item.name);
    expect(results[0].item.name).toBe("user");
    expect(results[1].item.name).toBe("users");
  });

  test("is case insensitive", () => {
    const results = fuzzySearch(items, "PORT", (item) => item.name);
    expect(results.length).toBe(1);
    expect(results[0].item.name).toBe("settings.port");
  });

  test("tracks match positions", () => {
    const results = fuzzySearch(items, "us", (item) => item.name);
    expect(results[0].matches).toEqual([0, 1]);
  });
});
