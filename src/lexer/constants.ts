import { TokenType } from "../types";

export const SINGLE_CHAR_TOKENS: Record<string, TokenType> = {
  ".": TokenType.DOT,
  "[": TokenType.LEFT_BRACKET,
  "]": TokenType.RIGHT_BRACKET,
  "{": TokenType.LEFT_BRACE,
  "}": TokenType.RIGHT_BRACE,
  "(": TokenType.LEFT_PAREN,
  ")": TokenType.RIGHT_PAREN,
  ":": TokenType.COLON,
  ",": TokenType.COMMA,
};

export const OPERATOR_CHARS = "+-*/%<>!&|=";

export const WHITESPACE_CHARS = [" ", "\t", "\n", "\r"] as const;
