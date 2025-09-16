import { Token, TokenType } from "../types";

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

    tokens.push({ type: TokenType.EOF, value: "", position: this.position });
    return tokens;
  }

  private nextToken(): Token | null {
    const startPos = this.position;

    if (this.current === ".") {
      this.advance();
      return { type: TokenType.DOT, value: ".", position: startPos };
    }

    if (this.current === "[") {
      this.advance();
      return { type: TokenType.LEFT_BRACKET, value: "[", position: startPos };
    }

    if (this.current === "]") {
      this.advance();
      return { type: TokenType.RIGHT_BRACKET, value: "]", position: startPos };
    }

    if (this.current === "{") {
      this.advance();
      return { type: TokenType.LEFT_BRACE, value: "{", position: startPos };
    }

    if (this.current === "}") {
      this.advance();
      return { type: TokenType.RIGHT_BRACE, value: "}", position: startPos };
    }

    if (this.current === "(") {
      this.advance();
      return { type: TokenType.LEFT_PAREN, value: "(", position: startPos };
    }

    if (this.current === ")") {
      this.advance();
      return { type: TokenType.RIGHT_PAREN, value: ")", position: startPos };
    }

    if (this.current === ":") {
      this.advance();
      return { type: TokenType.COLON, value: ":", position: startPos };
    }

    if (this.current === ",") {
      this.advance();
      return { type: TokenType.COMMA, value: ",", position: startPos };
    }

    if (this.current === "=" && this.peek() === ">") {
      this.advance();
      this.advance();
      return { type: TokenType.ARROW, value: "=>", position: startPos };
    }

    if (this.current === '"' || this.current === "'") {
      return this.readString();
    }

    if (
      this.isDigit(this.current) ||
      (this.current === "-" && this.isDigit(this.peek()))
    ) {
      return this.readNumber();
    }

    if (this.isIdentifierStart(this.current)) {
      return this.readIdentifier();
    }

    if (this.isOperator(this.current)) {
      return this.readOperator();
    }

    this.advance();
    return null;
  }

  private readString(): Token {
    const startPos = this.position;
    const quote = this.current;
    let value = "";
    this.advance();

    while (this.current !== quote && this.position < this.input.length) {
      if (this.current === "\\") {
        this.advance();
        if (this.position < this.input.length) {
          value += this.current;
          this.advance();
        }
      } else {
        value += this.current;
        this.advance();
      }
    }

    if (this.current === quote) {
      this.advance();
    }

    return { type: TokenType.STRING, value, position: startPos };
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

    if (this.current === "." && this.isDigit(this.peek())) {
      value += this.current;
      this.advance();

      while (this.isDigit(this.current)) {
        value += this.current;
        this.advance();
      }
    }

    return { type: TokenType.NUMBER, value, position: startPos };
  }

  private readIdentifier(): Token {
    const startPos = this.position;
    let value = "";

    while (this.isIdentifierChar(this.current)) {
      value += this.current;
      this.advance();
    }

    return { type: TokenType.IDENTIFIER, value, position: startPos };
  }

  private readOperator(): Token {
    const startPos = this.position;
    let value = "";

    while (this.isOperator(this.current)) {
      value += this.current;
      this.advance();
    }

    return { type: TokenType.OPERATOR, value, position: startPos };
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
    return char === " " || char === "\t" || char === "\n" || char === "\r";
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isIdentifierStart(char: string): boolean {
    return (
      (char >= "a" && char <= "z") ||
      (char >= "A" && char <= "Z") ||
      char === "_" ||
      char === "$"
    );
  }

  private isIdentifierChar(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char);
  }

  private isOperator(char: string): boolean {
    return "+-*/%<>!&|=".includes(char);
  }
}
