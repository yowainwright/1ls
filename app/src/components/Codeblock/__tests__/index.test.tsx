import { describe, test, expect } from "bun:test"
import { render, waitFor } from "@testing-library/react"
import { Codeblock, getHighlighter } from "../index"

describe("Codeblock", () => {
  test("renders fallback with code while loading", () => {
    const { container } = render(<Codeblock code='{"test": true}' language="json" />)

    expect(container.textContent).toContain('{"test": true}')
  })

  test("renders highlighted code after loading", async () => {
    const { container } = render(<Codeblock code='{"name": "test"}' language="json" />)

    await waitFor(() => {
      const shikiElement = container.querySelector(".shiki")
      expect(shikiElement).toBeInTheDocument()
    })
  })

  test("applies custom className", () => {
    const { container } = render(
      <Codeblock code="test" language="json" className="custom-class" />
    )

    expect(container.firstChild).toHaveClass("custom-class")
  })

  test("uses default language of json", () => {
    const { container } = render(<Codeblock code='{"a": 1}' />)

    expect(container.textContent).toContain('{"a": 1}')
  })
})

describe("getHighlighter", () => {
  test("returns a highlighter instance", async () => {
    const highlighter = await getHighlighter()

    expect(highlighter).toBeDefined()
    expect(typeof highlighter.codeToHtml).toBe("function")
  })

  test("returns the same instance on subsequent calls", async () => {
    const first = await getHighlighter()
    const second = await getHighlighter()

    expect(first).toBe(second)
  })
})
