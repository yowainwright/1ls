import { describe, test, expect } from "bun:test";
import { navigateJson } from "../../src/interactive/navigator";

describe("JSON Navigator", () => {
  test("flattens simple object", () => {
    const data = { name: "John", age: 30 };
    const paths = navigateJson(data);

    const pathStrings = paths.map((p) => p.path);
    expect(pathStrings).toContain(".name");
    expect(pathStrings).toContain(".age");
  });

  test("flattens nested objects", () => {
    const data = {
      user: {
        name: "Alice",
        address: {
          city: "NYC",
        },
      },
    };
    const paths = navigateJson(data);

    const pathStrings = paths.map((p) => p.path);
    expect(pathStrings).toContain(".user");
    expect(pathStrings).toContain(".user.name");
    expect(pathStrings).toContain(".user.address");
    expect(pathStrings).toContain(".user.address.city");
  });

  test("flattens arrays with indices", () => {
    const data = { users: ["Alice", "Bob"] };
    const paths = navigateJson(data);

    const pathStrings = paths.map((p) => p.path);
    expect(pathStrings).toContain(".users");
    expect(pathStrings).toContain(".users[0]");
    expect(pathStrings).toContain(".users[1]");
  });

  test("includes type information", () => {
    const data = {
      str: "hello",
      num: 42,
      bool: true,
      arr: [1, 2],
      obj: { a: 1 },
      nil: null,
    };
    const paths = navigateJson(data);

    const typeMap = paths.reduce((acc, p) => {
      acc[p.path] = p.type;
      return acc;
    }, {} as Record<string, string>);

    expect(typeMap[".str"]).toBe("String");
    expect(typeMap[".num"]).toBe("Number");
    expect(typeMap[".bool"]).toBe("Boolean");
    expect(typeMap[".arr"]).toBe("Array");
    expect(typeMap[".obj"]).toBe("Object");
    expect(typeMap[".nil"]).toBe("null");
  });

  test("includes display values", () => {
    const data = {
      str: "hello",
      num: 42,
      arr: [1, 2, 3],
      obj: { a: 1, b: 2 },
    };
    const paths = navigateJson(data);

    const displayMap = paths.reduce((acc, p) => {
      acc[p.path] = p.displayValue;
      return acc;
    }, {} as Record<string, string>);

    expect(displayMap[".str"]).toBe('"hello"');
    expect(displayMap[".num"]).toBe("42");
    expect(displayMap[".arr"]).toBe("[3 items]");
    expect(displayMap[".obj"]).toBe("{2 keys}");
  });

  test("handles keys with special characters", () => {
    const data = { "user-name": "Alice", "user.email": "alice@example.com" };
    const paths = navigateJson(data);

    const pathStrings = paths.map((p) => p.path);
    expect(pathStrings).toContain('.["user-name"]');
    expect(pathStrings).toContain('.["user.email"]');
  });

  test("handles simple keys without special characters", () => {
    const data = { userName: "Alice", userEmail: "alice@example.com" };
    const paths = navigateJson(data);

    const pathStrings = paths.map((p) => p.path);
    expect(pathStrings).toContain(".userName");
    expect(pathStrings).toContain(".userEmail");
  });
});
