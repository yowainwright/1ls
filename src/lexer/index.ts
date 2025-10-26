import { Token, TokenType } from "../types";
import { SINGLE_CHAR_TOKENS, OPERATOR_CHARS, WHITESPACE_CHARS } from "./constants";

export function getContextSnippet(input: string, position: number, length = 20): string {
  const start = Math.max(0, position - length);
  const end = Math.min(input.length, position + length);
  const snippet = input.slice(start, end);
  const marker = " ".repeat(Math.min(position - start, length)) + "^";
  return `${snippet}\n${marker}`;
}

export function createToken(type: TokenType, value: string, position: number): Token {
  return { type, value, position };
}

export class Lexer {
  private input: string;
  private position: number = 0;
  private current: string;

  constructor(input: string) {
    this.input = input;
    this.current = this.input[0] || "";
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push(createToken(TokenType.EOF, "", this.position));
    return tokens;
  }

  private nextToken(): Token | null {
    const startPos = this.position;

    const tokenType = SINGLE_CHAR_TOKENS[this.current];
    if (tokenType) {
      const char = this.current;
      this.advance();
      return createToken(tokenType, char, startPos);
    }

    const isArrow = this.current === "=" && this.peek() === ">";
    if (isArrow) {
      this.advance();
      this.advance();
      return createToken(TokenType.ARROW, "=>", startPos);
    }

    const isStringStart = this.current === '"' || this.current === "'";
    if (isStringStart) {
      return this.readString();
    }

    const isDigit = this.isDigit(this.current);
    const isNegativeNumber = this.current === "-" && this.isDigit(this.peek());
    const isNumberStart = isDigit || isNegativeNumber;
    if (isNumberStart) {
      return this.readNumber();
    }

    const isIdentifierStart = this.isIdentifierStart(this.current);
    if (isIdentifierStart) {
      return this.readIdentifier();
    }

    const isOperator = this.isOperator(this.current);
    if (isOperator) {
      return this.readOperator();
    }

    this.advance();
    return null;
  }

  private readString(): Token {
    const startPos = this.position;
    const quote = this.current;
    const chars: string[] = [];
    this.advance();

    while (this.current !== quote && this.position < this.input.length) {
      if (this.current === "\\") {
        this.advance();
        if (this.position < this.input.length) {
          chars.push(this.current);
          this.advance();
        }
        continue;
      }

      chars.push(this.current);
      this.advance();
    }

    if (this.current === quote) {
      this.advance();
    }

    return createToken(TokenType.STRING, chars.join(""), startPos);
  }

  private readNumber(): Token {
    const startPos = this.position;
    let value = "";

    if (this.current === "-") {
      value += this.current;
      this.advance();
    }

    while (this.isDigit(this.current)) {
      value += this.current;
      this.advance();
    }

    const hasDecimal = this.current === "." && this.isDigit(this.peek());
    if (hasDecimal) {
      value += this.current;
      this.advance();

      while (this.isDigit(this.current)) {
        value += this.current;
        this.advance();
      }
    }

    return createToken(TokenType.NUMBER, value, startPos);
  }

  private readIdentifier(): Token {
    const startPos = this.position;
    let value = "";

    while (this.isIdentifierChar(this.current)) {
      value += this.current;
      this.advance();
    }

    return createToken(TokenType.IDENTIFIER, value, startPos);
  }

  private readOperator(): Token {
    const startPos = this.position;
    let value = "";

    while (this.isOperator(this.current)) {
      value += this.current;
      this.advance();
    }

    return createToken(TokenType.OPERATOR, value, startPos);
  }

  private skipWhitespace(): void {
    while (this.isWhitespace(this.current)) {
      this.advance();
    }
  }

  private advance(): void {
    this.position++;
    this.current = this.input[this.position] || "";
  }

  private peek(): string {
    return this.input[this.position + 1] || "";
  }

  private isWhitespace(char: string): boolean {
    return WHITESPACE_CHARS.includes(char as any);
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isIdentifierStart(char: string): boolean {
    const isLowercase = char >= "a" && char <= "z";
    const isUppercase = char >= "A" && char <= "Z";
    const isUnderscore = char === "_";
    const isDollar = char === "$";
    return isLowercase || isUppercase || isUnderscore || isDollar;
  }

  private isIdentifierChar(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char);
  }

  private isOperator(char: string): boolean {
    return OPERATOR_CHARS.includes(char);
  }
}
