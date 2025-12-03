import { describe, test, expect } from "bun:test"
import { render, fireEvent, waitFor } from "@testing-library/react"
import { Playground, FORMAT_CONFIGS, FORMATS } from "../index"

describe("Playground", () => {
  test("renders section header", () => {
    const { container } = render(<Playground />)

    expect(container.textContent).toContain("Try It Live")
  })

  test("renders format tabs for all formats", () => {
    const { container } = render(<Playground />)

    for (const format of FORMATS) {
      expect(container.textContent).toContain(FORMAT_CONFIGS[format].label)
    }
  })

  test("renders input and expression editors", () => {
    const { container } = render(<Playground />)

    expect(container.textContent).toContain("Input")
    expect(container.textContent).toContain("Expression")
  })

  test("renders output panel", () => {
    const { container } = render(<Playground />)

    expect(container.textContent).toContain("Output")
  })

  test("shows default JSON placeholder on initial render", () => {
    const { container } = render(<Playground />)

    expect(container.textContent).toContain("users")
  })

  test("evaluates expression and shows output", async () => {
    const { container } = render(<Playground />)

    await waitFor(
      () => {
        expect(container.textContent).toContain("Alice")
      },
      { timeout: 1000 }
    )
  })

  test("changes format when tab is clicked", async () => {
    const { container } = render(<Playground />)

    const yamlButton = container.querySelector('button:nth-child(2)')
    if (yamlButton) {
      fireEvent.click(yamlButton)
    }

    await waitFor(() => {
      expect(container.textContent).toContain("name: Alice")
    })
  })
})
