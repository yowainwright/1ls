import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test"
import { render, fireEvent, waitFor } from "@testing-library/react"
import { CopyButton } from "../CopyButton"

const mockWriteText = mock(() => Promise.resolve())

const originalClipboard = navigator.clipboard

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
  })
  mockWriteText.mockClear()
})

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    writable: true,
    configurable: true,
  })
})

describe("CopyButton", () => {
  test("renders copy button", () => {
    const { container } = render(<CopyButton code="test code" />)
    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
  })

  test("has correct aria-label", () => {
    const { container } = render(<CopyButton code="test code" />)
    const button = container.querySelector('button')
    expect(button?.getAttribute('aria-label')).toBe('Copy code')
  })

  test("copies code to clipboard when clicked", async () => {
    const { container } = render(<CopyButton code="test code" />)
    const button = container.querySelector('button')
    if (button) {
      fireEvent.click(button)
    }
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith("test code")
    })
  })

  test("shows check icon after copying", async () => {
    const { container } = render(<CopyButton code="test code" />)
    const button = container.querySelector('button')
    if (button) {
      fireEvent.click(button)
    }
    await waitFor(() => {
      expect(button?.getAttribute('aria-label')).toBe('Copied!')
    })
  })

  test("applies custom className", () => {
    const { container } = render(<CopyButton code="test" className="custom-class" />)
    const button = container.querySelector('button')
    expect(button?.className).toContain('custom-class')
  })

  test("has absolute positioning by default", () => {
    const { container } = render(<CopyButton code="test" />)
    const button = container.querySelector('button')
    expect(button?.className).toContain('absolute')
  })
})
