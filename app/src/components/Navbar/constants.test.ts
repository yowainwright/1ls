import { describe, test as it } from "node:test";
import assert from "node:assert/strict";
import { NAV_LINKS, GITHUB_URL } from "./constants";

describe("NAV_LINKS", () => {
  it("contains expected navigation items", () => {
    assert.strictEqual(NAV_LINKS.length, 3);

    const hrefs = NAV_LINKS.map((link) => link.href);
    assert.ok(hrefs.includes("/"));
    assert.ok(hrefs.includes("/docs"));
    assert.ok(hrefs.includes("/playground"));
  });

  it("all links have required properties", () => {
    NAV_LINKS.forEach((link) => {
      assert.notStrictEqual(link.href, undefined);
      assert.notStrictEqual(link.label, undefined);
      assert.notStrictEqual(link.icon, undefined);
    });
  });
});

describe("GITHUB_URL", () => {
  it("points to the correct repository", () => {
    assert.strictEqual(GITHUB_URL, "https://github.com/yowainwright/1ls");
  });
});
