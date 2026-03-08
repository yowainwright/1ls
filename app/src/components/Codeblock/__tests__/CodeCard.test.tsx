import { describe, test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { CodeCard } from "../CodeCard";

describe("CodeCard", () => {
  test("renders children", () => {
    const { getByText } = render(<CodeCard>hello world</CodeCard>);
    expect(getByText("hello world")).toBeInTheDocument();
  });

  test("applies className", () => {
    const { container } = render(<CodeCard className="w-full p-6">x</CodeCard>);
    expect(container.firstChild).toHaveClass("w-full");
    expect(container.firstChild).toHaveClass("p-6");
  });

  test("has base card classes by default", () => {
    const { container } = render(<CodeCard>x</CodeCard>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("rounded-lg");
    expect(el).toHaveClass("overflow-hidden");
    expect(el).toHaveClass("border-border/10");
  });

  test("light variant (default) uses bg-card", () => {
    const { container } = render(<CodeCard>x</CodeCard>);
    expect(container.firstChild).toHaveClass("bg-card");
  });

  test("dark variant uses dracula background", () => {
    const { container } = render(<CodeCard variant="dark">x</CodeCard>);
    expect(container.firstChild).toHaveClass("bg-[#282a36]");
    expect(container.firstChild).not.toHaveClass("bg-card");
  });

  test("light variant does not use dark background", () => {
    const { container } = render(<CodeCard variant="light">x</CodeCard>);
    expect(container.firstChild).toHaveClass("bg-card");
    expect(container.firstChild).not.toHaveClass("bg-[#282a36]");
  });
});
