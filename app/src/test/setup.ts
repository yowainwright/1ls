import { afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

expect.extend(matchers);

const originalConsoleError = console.error.bind(console);
const reactAsyncWarningPatterns = [
  /not wrapped in act/i,
  /suspended resource finished loading inside a test/i,
  /component suspended inside an `act` scope/i,
];

console.error = (...args: unknown[]) => {
  const message = args.map(String).join(" ");
  if (message.includes("Unexpected React async test warning")) {
    originalConsoleError(...args);
    return;
  }
  if (reactAsyncWarningPatterns.some((pattern) => pattern.test(message))) {
    throw new Error(`Unexpected React async test warning: ${message}`);
  }
  originalConsoleError(...args);
};

afterEach(() => {
  cleanup();
});
