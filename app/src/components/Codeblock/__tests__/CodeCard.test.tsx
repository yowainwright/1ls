import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { render } from "@testing-library/react";
import { CodeCard } from "../CodeCard";

describe("CodeCard", () => {
  test("renders children", () => {
    const { getByText } = render(<CodeCard>hello world</CodeCard>);
    assert.ok(getByText("hello world"));
  });

  test("applies className", () => {
    const { container } = render(<CodeCard className="w-full p-6">x</CodeCard>);
    assert.ok(container.firstChild instanceof Element && container.firstChild.classList.contains("w-full"));
    assert.ok(container.firstChild instanceof Element && container.firstChild.classList.contains("p-6"));
  });

  test("has base card classes by default", () => {
    const { container } = render(<CodeCard>x</CodeCard>);
    const el = container.firstChild as HTMLElement;
    assert.ok(el instanceof Element && el.classList.contains("rounded-lg"));
    assert.ok(el instanceof Element && el.classList.contains("overflow-hidden"));
    assert.ok(el instanceof Element && el.classList.contains("border-border/10"));
  });

  test("light variant (default) uses bg-card", () => {
    const { container } = render(<CodeCard>x</CodeCard>);
    assert.ok(container.firstChild instanceof Element && container.firstChild.classList.contains("bg-card"));
  });

  test("dark variant uses dracula background", () => {
    const { container } = render(<CodeCard variant="dark">x</CodeCard>);
    assert.ok(container.firstChild instanceof Element && container.firstChild.classList.contains("bg-[#282a36]"));
    assert.ok(!(container.firstChild instanceof Element) || !container.firstChild.classList.contains("bg-card"));
  });

  test("light variant does not use dark background", () => {
    const { container } = render(<CodeCard variant="light">x</CodeCard>);
    assert.ok(container.firstChild instanceof Element && container.firstChild.classList.contains("bg-card"));
    assert.ok(!(container.firstChild instanceof Element) || !container.firstChild.classList.contains("bg-[#282a36]"));
  });
});
