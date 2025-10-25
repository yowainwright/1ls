import { describe, test, expect } from "bun:test";
import { parseTypeScript } from "../src/parsers/typescript";

describe("TypeScript Parser", () => {
  test("parses TypeScript with type annotations", () => {
    const input = `
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "Alice",
  age: 30
};

export default user;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses TypeScript with type aliases", () => {
    const input = `
type UserName = string;
type UserAge = number;

const name: UserName = "Alice";
const age: UserAge = 30;

export default { name, age };
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses TypeScript with generics", () => {
    const input = `
interface Container<T> {
  value: T;
}

const stringContainer: Container<string> = {
  value: "hello"
};

export default stringContainer;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ value: "hello" });
  });

  test("parses TypeScript with enum", () => {
    const input = `
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

const favorite: Color = Color.Blue;

export default { color: favorite };
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ color: "BLUE" });
  });

  test("strips type annotations from arrays", () => {
    const input = `
const numbers: number[] = [1, 2, 3, 4, 5];
export default numbers;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  test("handles TypeScript with comments", () => {
    const input = `
// User interface definition
interface User {
  name: string; // User's full name
  age: number; // User's age in years
}

/* Create a user object */
const user: User = {
  name: "Alice",
  age: 30
};

export default user;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses TypeScript with optional properties", () => {
    const input = `
interface User {
  name: string;
  email?: string;
  age?: number;
}

const user: User = {
  name: "Alice"
};

export default user;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice" });
  });

  test("parses TypeScript with union types", () => {
    const input = `
type Status = "active" | "inactive" | "pending";

const currentStatus: Status = "active";

export default { status: currentStatus };
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ status: "active" });
  });

  test("parses TypeScript with intersection types", () => {
    const input = `
interface Named {
  name: string;
}

interface Aged {
  age: number;
}

type Person = Named & Aged;

const person: Person = {
  name: "Alice",
  age: 30
};

export default person;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses TypeScript with readonly properties", () => {
    const input = `
interface Config {
  readonly version: string;
  readonly port: number;
}

const config: Config = {
  version: "1.0.0",
  port: 3000
};

export default config;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ version: "1.0.0", port: 3000 });
  });

  test("parses TypeScript with nested interfaces", () => {
    const input = `
interface Address {
  street: string;
  city: string;
  zip: number;
}

interface User {
  name: string;
  address: Address;
}

const user: User = {
  name: "Alice",
  address: {
    street: "123 Main St",
    city: "NYC",
    zip: 10001
  }
};

export default user;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({
      name: "Alice",
      address: {
        street: "123 Main St",
        city: "NYC",
        zip: 10001,
      },
    });
  });

  test("parses TypeScript with as const assertion", () => {
    const input = `
const colors = ["red", "green", "blue"] as const;
export default colors;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual(["red", "green", "blue"]);
  });

  test("parses TypeScript with type casting", () => {
    const input = `
const value: unknown = "hello";
const str = value as string;
export default { value: str };
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ value: "hello" });
  });

  test("handles TypeScript with class definitions", () => {
    const input = `
class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

const user = new User("Alice", 30);
export default { name: user.name, age: user.age };
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses TypeScript with function return types", () => {
    const input = `
function getUser(): { name: string; age: number } {
  return { name: "Alice", age: 30 };
}

export default getUser();
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("parses TypeScript with arrow function types", () => {
    const input = `
const getUser = (): { name: string; age: number } => {
  return { name: "Alice", age: 30 };
};

export default getUser();
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  test("handles TypeScript with complex nested types", () => {
    const input = `
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  name: string;
  age: number;
}

const response: ApiResponse<User> = {
  data: {
    name: "Alice",
    age: 30
  },
  status: 200,
  message: "Success"
};

export default response;
`;
    const result = parseTypeScript(input);
    expect(result).toEqual({
      data: { name: "Alice", age: 30 },
      status: 200,
      message: "Success",
    });
  });
});
