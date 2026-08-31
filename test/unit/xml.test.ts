import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  parseXML,
  parseXMLValue,
  parseXMLAttributes,
  parseXMLElement,
} from "../../src/formats/xml";

describe("XML Value Parser", () => {
  test("parses string values", () => {
    assert.strictEqual(parseXMLValue("hello"), "hello");
    assert.strictEqual(parseXMLValue("  world  "), "world");
  });

  test("parses boolean values", () => {
    assert.strictEqual(parseXMLValue("true"), true);
    assert.strictEqual(parseXMLValue("false"), false);
  });

  test("parses numeric values", () => {
    assert.strictEqual(parseXMLValue("42"), 42);
    assert.strictEqual(parseXMLValue("-10"), -10);
    assert.strictEqual(parseXMLValue("3.14"), 3.14);
  });
});

describe("XML Attributes Parser", () => {
  test("parses single attribute", () => {
    const input = 'id="123"';
    assert.deepStrictEqual(parseXMLAttributes(input), { id: 123 });
  });

  test("parses multiple attributes", () => {
    const input = 'id="123" name="test" active="true"';
    assert.deepStrictEqual(parseXMLAttributes(input), {
      id: 123,
      name: "test",
      active: true,
    });
  });

  test("parses attributes with numeric values", () => {
    const input = 'count="42" price="19.99"';
    assert.deepStrictEqual(parseXMLAttributes(input), {
      count: 42,
      price: 19.99,
    });
  });

  test("handles empty attribute string", () => {
    assert.deepStrictEqual(parseXMLAttributes(""), {});
  });
});

describe("XML Element Parser", () => {
  test("parses self-closing tag without attributes", () => {
    const input = "<br/>";
    assert.deepStrictEqual(parseXMLElement(input), { br: null });
  });

  test("parses self-closing tag with attributes", () => {
    const input = '<img src="photo.jpg" width="100"/>';
    assert.deepStrictEqual(parseXMLElement(input), {
      img: {
        _attributes: { src: "photo.jpg", width: 100 },
      },
    });
  });

  test("parses simple tag with text content", () => {
    const input = "<name>Alice</name>";
    assert.deepStrictEqual(parseXMLElement(input), { name: "Alice" });
  });

  test("parses tag with attributes and text", () => {
    const input = '<title lang="en">Hello World</title>';
    assert.deepStrictEqual(parseXMLElement(input), {
      title: {
        _attributes: { lang: "en" },
        _text: "Hello World",
      },
    });
  });

  test("parses nested elements", () => {
    const input = "<user><name>Alice</name><age>30</age></user>";
    assert.deepStrictEqual(parseXMLElement(input), {
      user: {
        name: "Alice",
        age: 30,
      },
    });
  });

  test("parses nested elements with attributes", () => {
    const input = '<user id="1"><name>Alice</name><age>30</age></user>';
    assert.deepStrictEqual(parseXMLElement(input), {
      user: {
        _attributes: { id: 1 },
        name: "Alice",
        age: 30,
      },
    });
  });

  test("handles repeated elements as arrays", () => {
    const input = "<items><item>apple</item><item>banana</item><item>orange</item></items>";
    assert.deepStrictEqual(parseXMLElement(input), {
      items: {
        item: ["apple", "banana", "orange"],
      },
    });
  });

  test("parses numeric content", () => {
    const input = "<count>42</count>";
    assert.deepStrictEqual(parseXMLElement(input), { count: 42 });
  });

  test("parses boolean content", () => {
    const input = "<active>true</active>";
    assert.deepStrictEqual(parseXMLElement(input), { active: true });
  });
});

describe("XML Parser", () => {
  test("parses simple XML document", () => {
    const input = "<root><name>Alice</name><age>30</age></root>";
    assert.deepStrictEqual(parseXML(input), {
      root: {
        name: "Alice",
        age: 30,
      },
    });
  });

  test("handles XML declaration", () => {
    const input = '<?xml version="1.0" encoding="UTF-8"?><root><value>test</value></root>';
    assert.deepStrictEqual(parseXML(input), {
      root: { value: "test" },
    });
  });

  test("parses complex nested structure", () => {
    const input = `
      <catalog>
        <book id="1">
          <title>Learning XML</title>
          <author>John Doe</author>
          <price>29.99</price>
        </book>
        <book id="2">
          <title>Advanced XML</title>
          <author>Jane Smith</author>
          <price>39.99</price>
        </book>
      </catalog>
    `;
    assert.deepStrictEqual(parseXML(input), {
      catalog: {
        book: [
          {
            _attributes: { id: 1 },
            title: "Learning XML",
            author: "John Doe",
            price: 29.99,
          },
          {
            _attributes: { id: 2 },
            title: "Advanced XML",
            author: "Jane Smith",
            price: 39.99,
          },
        ],
      },
    });
  });

  test("handles empty elements", () => {
    const input = "<root><empty/></root>";
    assert.deepStrictEqual(parseXML(input), {
      root: { empty: null },
    });
  });

  test("handles whitespace", () => {
    const input = `
      <user>
        <name>Alice</name>
        <age>30</age>
      </user>
    `;
    assert.deepStrictEqual(parseXML(input), {
      user: {
        name: "Alice",
        age: 30,
      },
    });
  });
});
