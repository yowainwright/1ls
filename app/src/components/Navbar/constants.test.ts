import { describe, it, expect } from "bun:test"
import { NAV_LINKS, GITHUB_URL } from "./constants"

describe("NAV_LINKS", () => {
  it("contains expected navigation items", () => {
    expect(NAV_LINKS).toHaveLength(3)

    const hrefs = NAV_LINKS.map((link) => link.href)
    expect(hrefs).toContain("/")
    expect(hrefs).toContain("/docs")
    expect(hrefs).toContain("/playground")
  })

  it("all links have required properties", () => {
    NAV_LINKS.forEach((link) => {
      expect(link.href).toBeDefined()
      expect(link.label).toBeDefined()
      expect(link.icon).toBeDefined()
    })
  })
})

describe("GITHUB_URL", () => {
  it("points to the correct repository", () => {
    expect(GITHUB_URL).toBe("https://github.com/yowainwright/1ls")
  })
})
