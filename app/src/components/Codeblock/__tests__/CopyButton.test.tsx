import { mock, describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "../CopyButton";

const mockWriteText = mock.fn(() => Promise.resolve());

const originalClipboard = navigator.clipboard;

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  });
  mockWriteText.mock.resetCalls();
});

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    writable: true,
    configurable: true,
  });
});

describe("CopyButton", () => {
  test("renders copy button", () => {
    const { container } = render(<CopyButton code="test code" />);
    const button = container.querySelector("button");
    assert.ok(button);
  });

  test("has correct aria-label", () => {
    const { container } = render(<CopyButton code="test code" />);
    const button = container.querySelector("button");
    assert.strictEqual(button?.getAttribute("aria-label"), "Copy code");
  });

  test("copies code to clipboard when clicked", async () => {
    const { container } = render(<CopyButton code="test code" />);
    const button = container.querySelector("button");
    if (button) {
      fireEvent.click(button);
    }
    await waitFor(() => {
      assert.ok(mockWriteText.mock.calls.some((call) => isDeepStrictEqual(call.arguments, ["test code"])));
    });
  });

  test("shows check icon after copying", async () => {
    const { container } = render(<CopyButton code="test code" />);
    const button = container.querySelector("button");
    if (button) {
      fireEvent.click(button);
    }
    await waitFor(() => {
      assert.strictEqual(button?.getAttribute("aria-label"), "Copied!");
    });
  });

  test("applies custom className", () => {
    const { container } = render(<CopyButton code="test" className="custom-class" />);
    const button = container.querySelector("button");
    assert.ok(button?.className.includes("custom-class"));
  });

  test("has absolute positioning by default", () => {
    const { container } = render(<CopyButton code="test" />);
    const button = container.querySelector("button");
    assert.ok(button?.className.includes("absolute"));
  });
});
