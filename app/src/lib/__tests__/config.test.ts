import { describe, test, expect } from "bun:test";
import { siteConfig } from "../config";

describe("siteConfig", () => {
  test("has required top-level keys", () => {
    expect("name" in siteConfig).toBe(true);
    expect("tagline" in siteConfig).toBe(true);
    expect("description" in siteConfig).toBe(true);
    expect("hero" in siteConfig).toBe(true);
    expect("links" in siteConfig).toBe(true);
  });

  test("name is a non-empty string", () => {
    expect(typeof siteConfig.name).toBe("string");
    expect(siteConfig.name.length).toBeGreaterThan(0);
  });

  test("hero has required fields", () => {
    const { hero } = siteConfig;
    expect(typeof hero.title).toBe("string");
    expect(typeof hero.subtitle).toBe("string");
    expect(typeof hero.cta).toBe("string");
    expect(typeof hero.ctaHref).toBe("string");
  });

  test("hero.ctaHref is a URL", () => {
    expect(() => new URL(siteConfig.hero.ctaHref)).not.toThrow();
  });

  test("links has github, npm, docs", () => {
    expect(typeof siteConfig.links.github).toBe("string");
    expect(typeof siteConfig.links.npm).toBe("string");
    expect(typeof siteConfig.links.docs).toBe("string");
  });

  test("links are valid URLs", () => {
    expect(() => new URL(siteConfig.links.github)).not.toThrow();
    expect(() => new URL(siteConfig.links.npm)).not.toThrow();
    expect(() => new URL(siteConfig.links.docs)).not.toThrow();
  });

  test("github link points to expected repo", () => {
    expect(siteConfig.links.github).toContain("1ls");
  });
});
