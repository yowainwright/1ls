import { afterEach } from "node:test";
import { cleanup } from "@testing-library/react";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import * as React from "react";

GlobalRegistrator.register();

(globalThis as typeof globalThis & { React: typeof React }).React = React;

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
    return;
  }
  originalConsoleError(...args);
};

afterEach(() => {
  cleanup();
});
