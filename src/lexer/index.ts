import type { Token } from "../types.ts";
import { TokenType } from "../types.ts";
import { OPERATOR_CHARS, WHITESPACE_CHARS } from "./constants.ts";

export function getContextSnippet(input: string, position: number, length = 20): string {
  const start = Math.max(0, position - length);
  const end = Math.min(input.length, position + length);
  const snippet = input.slice(start, end);
  const markerOffset = Math.min(position - start, length);
  const marker = " ".repeat(markerOffset) + "^";
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
    let tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();
      if (this.position >= this.input.length) break;

      const token = this.nextToken();
      tokens = token ? [...tokens, token] : tokens;
    }

    return [...tokens, createToken(TokenType.EOF, "", this.position)];
  }

  private nextToken(): Token | null {
    const pairedToken = this.readPairedToken();
    if (pairedToken) return pairedToken;

    const singleToken = this.readSingleToken();
    if (singleToken) return singleToken;

    return this.readComplexToken();
  }

  private readPairedToken(): Token | null {
    const tokenStartPosition = this.position;

    const isDoubleDot = this.current === "." && this.peek() === ".";
    if (isDoubleDot) {
      this.advance();
      this.advance();
      return createToken(TokenType.DOUBLE_DOT, "..", tokenStartPosition);
    }

    const isDoubleQuestion = this.current === "?" && this.peek() === "?";
    if (isDoubleQuestion) {
      this.advance();
      this.advance();
      return createToken(TokenType.DOUBLE_QUESTION, "??", tokenStartPosition);
    }

    return null;
  }

  private readSingleToken(): Token | null {
    const tokenStartPosition = this.position;

    if (this.current === "?") {
      this.advance();
      return createToken(TokenType.QUESTION, "?", tokenStartPosition);
    }

    const tokenType = this.getSingleCharTokenType(this.current);
    if (tokenType) {
      const token = createToken(tokenType, this.current, tokenStartPosition);
      this.advance();
      return token;
    }

    const isArrow = this.current === "=" && this.peek() === ">";
    if (isArrow) {
      this.advance();
      this.advance();
      return createToken(TokenType.ARROW, "=>", tokenStartPosition);
    }

    return null;
  }

  private getSingleCharTokenType(char: string): TokenType | null {
    if (char === ".") return TokenType.DOT;
    if (char === "[") return TokenType.LEFT_BRACKET;
    if (char === "]") return TokenType.RIGHT_BRACKET;
    if (char === "{") return TokenType.LEFT_BRACE;
    if (char === "}") return TokenType.RIGHT_BRACE;
    if (char === "(") return TokenType.LEFT_PAREN;
    if (char === ")") return TokenType.RIGHT_PAREN;
    if (char === ":") return TokenType.COLON;
    if (char === ",") return TokenType.COMMA;
    return null;
  }

  private readComplexToken(): Token | null {
    const isStringStart = this.current === '"' || this.current === "'";
    if (isStringStart) {
      return this.readString(this.current, this.position);
    }

    const isDigit = this.isDigit(this.current);
    const isNegativeNumber = this.current === "-" && this.isDigit(this.peek());
    const isNumberStart = isDigit || isNegativeNumber;
    if (isNumberStart) {
      return this.readNumber(this.position);
    }

    const isIdentifierStart = this.isIdentifierStart(this.current);
    if (isIdentifierStart) return this.readIdentifier(this.position);

    const isOperator = OPERATOR_CHARS.includes(this.current);
    if (isOperator) return this.readOperator(this.position);

    return this.skipUnknownToken();
  }

  private skipUnknownToken(): null {
    this.advance();
    return null;
  }

  private readString(quote: string, tokenStartPosition: number): Token {
    let value = "";
    this.advance();

    while (this.current !== quote && this.position < this.input.length) {
      if (this.current === "\\") {
        value += this.readEscapedChar();
        continue;
      }

      value += this.current;
      this.advance();
    }

    if (this.current === quote) this.advance();

    return createToken(TokenType.STRING, value, tokenStartPosition);
  }

  private readEscapedChar(): string {
    this.advance();
    if (this.position >= this.input.length) return "";

    const [escapedChar] = [this.current];
    this.advance();
    return escapedChar;
  }

  private readNumber(tokenStartPosition: number): Token {
    let value = "";

    if (this.current === "-") {
      value += this.current;
      this.advance();
    }

    while (this.isDigit(this.current)) {
      value += this.current;
      this.advance();
    }

    value += this.readDecimalPart();

    return createToken(TokenType.NUMBER, value, tokenStartPosition);
  }

  private readDecimalPart(): string {
    const hasDecimal = this.current === "." && this.isDigit(this.peek());
    if (!hasDecimal) return "";

    let value = this.current;
    this.advance();

    while (this.isDigit(this.current)) {
      value += this.current;
      this.advance();
    }

    return value;
  }

  private readIdentifier(tokenStartPosition: number): Token {
    let value = "";

    while (this.isIdentifierChar(this.current)) {
      value += this.current;
      this.advance();
    }

    return createToken(TokenType.IDENTIFIER, value, tokenStartPosition);
  }

  private readOperator(tokenStartPosition: number): Token {
    let value = "";

    while (OPERATOR_CHARS.includes(this.current)) {
      value += this.current;
      this.advance();
    }

    return createToken(TokenType.OPERATOR, value, tokenStartPosition);
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
    const nextPosition = this.position + 1;
    return this.input[nextPosition] || "";
  }

  private isWhitespace(char: string): boolean {
    if (char === WHITESPACE_CHARS[0]) return true;
    if (char === WHITESPACE_CHARS[1]) return true;
    if (char === WHITESPACE_CHARS[2]) return true;
    return char === WHITESPACE_CHARS[3];
  }

  private isDigit(char: string): boolean {
    const isAtLeastZero = char >= "0";
    if (!isAtLeastZero) return false;

    return char <= "9";
  }

  private isIdentifierStart(char: string): boolean {
    const isLowercase = char >= "a" && char <= "z";
    const isUppercase = char >= "A" && char <= "Z";
    const isUnderscore = char === "_";
    const isDollar = char === "$";
    if (isLowercase) return true;
    if (isUppercase) return true;

    if (isUnderscore) return true;

    return isDollar;
  }

  private isIdentifierChar(char: string): boolean {
    const isValidStart = this.isIdentifierStart(char);
    if (isValidStart) return true;

    return this.isDigit(char);
  }
}
