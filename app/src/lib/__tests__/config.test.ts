import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { siteConfig } from "../config";

describe("siteConfig", () => {
  test("has required top-level keys", () => {
    assert.strictEqual("name" in siteConfig, true);
    assert.strictEqual("tagline" in siteConfig, true);
    assert.strictEqual("description" in siteConfig, true);
    assert.strictEqual("hero" in siteConfig, true);
    assert.strictEqual("links" in siteConfig, true);
  });

  test("name is a non-empty string", () => {
    assert.strictEqual(typeof siteConfig.name, "string");
    assert.ok(siteConfig.name.length > 0);
  });

  test("hero has required fields", () => {
    const { hero } = siteConfig;
    assert.strictEqual(typeof hero.title, "string");
    assert.strictEqual(typeof hero.subtitle, "string");
    assert.strictEqual(typeof hero.cta, "string");
    assert.strictEqual(typeof hero.ctaHref, "string");
  });

  test("hero.ctaHref is a URL", () => {
    assert.doesNotThrow(() => new URL(siteConfig.hero.ctaHref));
  });

  test("links has github, npm, docs", () => {
    assert.strictEqual(typeof siteConfig.links.github, "string");
    assert.strictEqual(typeof siteConfig.links.npm, "string");
    assert.strictEqual(typeof siteConfig.links.docs, "string");
  });

  test("links are valid URLs", () => {
    assert.doesNotThrow(() => new URL(siteConfig.links.github));
    assert.doesNotThrow(() => new URL(siteConfig.links.npm));
    assert.doesNotThrow(() => new URL(siteConfig.links.docs));
  });

  test("github link points to expected repo", () => {
    assert.ok(siteConfig.links.github.includes("1ls"));
  });
});
