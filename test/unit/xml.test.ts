import { describe, test, expect } from "bun:test";
import { parseXML, parseXMLValue, parseXMLAttributes, parseXMLElement } from "../../src/parsers/xml";

describe("XML Value Parser", () => {
  test("parses string values", () => {
    expect(parseXMLValue("hello")).toBe("hello");
    expect(parseXMLValue("  world  ")).toBe("world");
  });

  test("parses boolean values", () => {
    expect(parseXMLValue("true")).toBe(true);
    expect(parseXMLValue("false")).toBe(false);
  });

  test("parses numeric values", () => {
    expect(parseXMLValue("42")).toBe(42);
    expect(parseXMLValue("-10")).toBe(-10);
    expect(parseXMLValue("3.14")).toBe(3.14);
  });
});

describe("XML Attributes Parser", () => {
  test("parses single attribute", () => {
    const input = 'id="123"';
    expect(parseXMLAttributes(input)).toEqual({ id: 123 });
  });

  test("parses multiple attributes", () => {
    const input = 'id="123" name="test" active="true"';
    expect(parseXMLAttributes(input)).toEqual({
      id: 123,
      name: "test",
      active: true,
    });
  });

  test("parses attributes with numeric values", () => {
    const input = 'count="42" price="19.99"';
    expect(parseXMLAttributes(input)).toEqual({
      count: 42,
      price: 19.99,
    });
  });

  test("handles empty attribute string", () => {
    expect(parseXMLAttributes("")).toEqual({});
  });
});

describe("XML Element Parser", () => {
  test("parses self-closing tag without attributes", () => {
    const input = "<br/>";
    expect(parseXMLElement(input)).toEqual({ br: null });
  });

  test("parses self-closing tag with attributes", () => {
    const input = '<img src="photo.jpg" width="100"/>';
    expect(parseXMLElement(input)).toEqual({
      img: {
        _attributes: { src: "photo.jpg", width: 100 },
      },
    });
  });

  test("parses simple tag with text content", () => {
    const input = "<name>Alice</name>";
    expect(parseXMLElement(input)).toEqual({ name: "Alice" });
  });

  test("parses tag with attributes and text", () => {
    const input = '<title lang="en">Hello World</title>';
    expect(parseXMLElement(input)).toEqual({
      title: {
        _attributes: { lang: "en" },
        _text: "Hello World",
      },
    });
  });

  test("parses nested elements", () => {
    const input = "<user><name>Alice</name><age>30</age></user>";
    expect(parseXMLElement(input)).toEqual({
      user: {
        name: "Alice",
        age: 30,
      },
    });
  });

  test("parses nested elements with attributes", () => {
    const input = '<user id="1"><name>Alice</name><age>30</age></user>';
    expect(parseXMLElement(input)).toEqual({
      user: {
        _attributes: { id: 1 },
        name: "Alice",
        age: 30,
      },
    });
  });

  test("handles repeated elements as arrays", () => {
    const input = "<items><item>apple</item><item>banana</item><item>orange</item></items>";
    expect(parseXMLElement(input)).toEqual({
      items: {
        item: ["apple", "banana", "orange"],
      },
    });
  });

  test("parses numeric content", () => {
    const input = "<count>42</count>";
    expect(parseXMLElement(input)).toEqual({ count: 42 });
  });

  test("parses boolean content", () => {
    const input = "<active>true</active>";
    expect(parseXMLElement(input)).toEqual({ active: true });
  });
});

describe("XML Parser", () => {
  test("parses simple XML document", () => {
    const input = "<root><name>Alice</name><age>30</age></root>";
    expect(parseXML(input)).toEqual({
      root: {
        name: "Alice",
        age: 30,
      },
    });
  });

  test("handles XML declaration", () => {
    const input = '<?xml version="1.0" encoding="UTF-8"?><root><value>test</value></root>';
    expect(parseXML(input)).toEqual({
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
    expect(parseXML(input)).toEqual({
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
    expect(parseXML(input)).toEqual({
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
    expect(parseXML(input)).toEqual({
      user: {
        name: "Alice",
        age: 30,
      },
    });
  });
});
