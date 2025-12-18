import {
  Token,
  TokenType,
  ASTNode,
  PropertyAccessNode,
  IndexAccessNode,
  SliceAccessNode,
  MethodCallNode,
  ObjectOperationNode,
  ObjectOperationType,
  ArraySpreadNode,
  ArrowFunctionNode,
  RootNode,
  RecursiveDescentNode,
  OptionalAccessNode,
  NullCoalescingNode,
} from "../types";
import { createLiteralNode, tryParseLiteralIdentifier } from "./utils";

export function createErrorMessage(token: Token, message: string): string {
  return `${message} at position ${token.position} (got ${token.type}: "${token.value}")`;
}

export function createPropertyAccessNode(
  property: string,
  object?: ASTNode,
): PropertyAccessNode {
  return { type: "PropertyAccess", property, object };
}

export function createIndexAccessNode(
  index: number,
  object?: ASTNode,
): IndexAccessNode {
  return { type: "IndexAccess", index, object };
}

export function createSliceAccessNode(
  start: number | undefined,
  end: number | undefined,
  object?: ASTNode,
): SliceAccessNode {
  return { type: "SliceAccess", start, end, object };
}

export function createMethodCallNode(
  method: string,
  args: ASTNode[],
  object?: ASTNode,
): MethodCallNode {
  return { type: "MethodCall", method, args, object };
}

export function createObjectOperationNode(
  operation: ObjectOperationType,
  object?: ASTNode,
): ObjectOperationNode {
  return { type: "ObjectOperation", operation, object };
}

export function createArraySpreadNode(object?: ASTNode): ArraySpreadNode {
  return { type: "ArraySpread", object };
}

export function createArrowFunctionNode(
  params: string[],
  body: ASTNode,
): ArrowFunctionNode {
  return { type: "ArrowFunction", params, body };
}

export function createRootNode(expression?: ASTNode): RootNode {
  return { type: "Root", expression };
}

export function createRecursiveDescentNode(object?: ASTNode): RecursiveDescentNode {
  return { type: "RecursiveDescent", object };
}

export function createOptionalAccessNode(expression: ASTNode, object?: ASTNode): OptionalAccessNode {
  return { type: "OptionalAccess", expression, object };
}

export function createNullCoalescingNode(left: ASTNode, right: ASTNode): NullCoalescingNode {
  return { type: "NullCoalescing", left, right };
}

export const VALID_OBJECT_OPERATIONS: readonly ObjectOperationType[] = [
  "keys",
  "values",
  "entries",
  "length",
] as const;

export function isValidObjectOperation(
  value: string,
): value is ObjectOperationType {
  return VALID_OBJECT_OPERATIONS.includes(value as ObjectOperationType);
}

export class ExpressionParser {
  private tokens: readonly Token[];
  private position: number = 0;
  private current: Token;

  constructor(tokens: readonly Token[]) {
    this.tokens = tokens;
    this.current = this.tokens[0];
  }

  parse(): RootNode {
    const isEmptyExpression = this.current.type === TokenType.EOF;
    if (isEmptyExpression) {
      return createRootNode();
    }

    const expression = this.parseExpression();
    return createRootNode(expression);
  }

  private parseExpression(): ASTNode {
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const node = this.parsePrimaryNode();
    return this.parsePostfix(node);
  }

  private parsePrimaryNode(): ASTNode {
    const currentType = this.current.type;

    const isDoubleDot = currentType === TokenType.DOUBLE_DOT;
    if (isDoubleDot) {
      this.advance();
      return createRecursiveDescentNode();
    }

    const isDot = currentType === TokenType.DOT;
    if (isDot) {
      this.advance();
      const isEndOfExpression = this.current.type === TokenType.EOF;
      if (isEndOfExpression) {
        return createRootNode();
      }
      return this.parseAccessChain();
    }

    const isLeftBracket = currentType === TokenType.LEFT_BRACKET;
    if (isLeftBracket) {
      return this.parseArrayAccess();
    }

    if (currentType === TokenType.IDENTIFIER) {
      return this.parseIdentifierOrFunction();
    }

    if (currentType === TokenType.STRING) {
      const value = this.current.value;
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TokenType.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TokenType.LEFT_PAREN) {
      const params = this.parseFunctionParams();
      return this.parseArrowFunction(params);
    }

    throw new Error(createErrorMessage(this.current, "Unexpected token"));
  }

  private parseAccessChain(object?: ASTNode): ASTNode {
    const currentType = this.current.type;

    if (currentType === TokenType.IDENTIFIER) {
      const property = this.current.value;
      this.advance();
      return createPropertyAccessNode(property, object);
    }

    if (currentType === TokenType.LEFT_BRACKET) {
      return this.parseBracketAccess(object);
    }

    if (currentType === TokenType.LEFT_BRACE) {
      return this.parseObjectOperation(object);
    }

    throw new Error(
      createErrorMessage(this.current, "Expected property name after dot"),
    );
  }

  private parseBracketAccess(object?: ASTNode): ASTNode {
    this.advance();

    const isSpread = this.current.type === TokenType.RIGHT_BRACKET;
    if (isSpread) {
      this.advance();
      return createArraySpreadNode(object);
    }

    const isStringProperty = this.current.type === TokenType.STRING;
    if (isStringProperty) {
      const property = this.current.value;
      this.advance();
      this.expect(TokenType.RIGHT_BRACKET);
      return createPropertyAccessNode(property, object);
    }

    const isNumber = this.current.type === TokenType.NUMBER;
    const isNegativeOperator = this.current.type === TokenType.OPERATOR && this.current.value === "-";
    const isColon = this.current.type === TokenType.COLON;
    const isNumericOrSlice = isNumber || isNegativeOperator || isColon;

    if (isNumericOrSlice) {
      return this.parseNumericIndexOrSlice(object);
    }

    throw new Error(
      createErrorMessage(this.current, "Unexpected token in bracket access"),
    );
  }

  private parseNumericIndexOrSlice(object?: ASTNode): ASTNode {
    const startsWithColon = this.current.type === TokenType.COLON;
    if (startsWithColon) {
      return this.parseSliceFromColon(undefined, object);
    }

    const index = this.parseNumber();
    this.advance();

    const isSlice = this.current.type === TokenType.COLON;
    if (isSlice) {
      return this.parseSliceFromColon(index, object);
    }

    this.expect(TokenType.RIGHT_BRACKET);
    return createIndexAccessNode(index, object);
  }

  private parseSliceFromColon(
    start: number | undefined,
    object?: ASTNode,
  ): SliceAccessNode {
    this.advance();

    const isNumber = this.current.type === TokenType.NUMBER;
    const isNegativeOperator = this.current.type === TokenType.OPERATOR && this.current.value === "-";
    const hasEndNumber = isNumber || isNegativeOperator;

    const end = hasEndNumber ? this.parseNumber() : undefined;

    if (hasEndNumber) {
      this.advance();
    }

    this.expect(TokenType.RIGHT_BRACKET);
    return createSliceAccessNode(start, end, object);
  }

  private parseArrayAccess(): ASTNode {
    return this.parseBracketAccess();
  }

  private parseObjectOperation(object?: ASTNode): ObjectOperationNode {
    this.advance();

    const isValidToken = this.current.type === TokenType.IDENTIFIER;
    if (!isValidToken) {
      throw new Error(
        createErrorMessage(this.current, "Expected operation name after {"),
      );
    }

    const operation = this.current.value;

    if (!isValidObjectOperation(operation)) {
      const validOps = VALID_OBJECT_OPERATIONS.join(", ");
      throw new Error(
        createErrorMessage(
          this.current,
          `Invalid object operation "${operation}". Valid operations: ${validOps}`,
        ),
      );
    }

    this.advance();
    this.expect(TokenType.RIGHT_BRACE);

    return createObjectOperationNode(operation, object);
  }

  private parseIdentifierOrFunction(): ASTNode {
    const identifier = this.current.value;
    this.advance();

    const isArrowFunction = this.current.type === TokenType.ARROW;
    if (isArrowFunction) {
      return this.parseArrowFunction([identifier]);
    }

    const literalNode = tryParseLiteralIdentifier(identifier);
    if (literalNode) return literalNode;

    return createPropertyAccessNode(identifier);
  }

  private parseArrowFunction(params: string[]): ArrowFunctionNode {
    this.expect(TokenType.ARROW);
    const body = this.parseFunctionBody();
    return createArrowFunctionNode(params, body);
  }

  private parseFunctionBody(): ASTNode {
    const isBlockBody = this.current.type === TokenType.LEFT_BRACE;

    if (isBlockBody) {
      this.advance();
      const expr = this.parseBinaryExpression();
      this.expect(TokenType.RIGHT_BRACE);
      return expr;
    }

    return this.parseBinaryExpression();
  }

  private parseBinaryExpression(): ASTNode {
    let left = this.parseFunctionTerm();

    while (this.current.type === TokenType.OPERATOR) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseFunctionTerm();

      left = createMethodCallNode(`__operator_${operator}__`, [right], left);
    }

    return left;
  }

  private parseFunctionTerm(): ASTNode {
    const currentType = this.current.type;

    if (currentType === TokenType.IDENTIFIER) {
      return this.parseIdentifierChain();
    }

    if (currentType === TokenType.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TokenType.STRING) {
      const value = this.current.value;
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TokenType.LEFT_PAREN) {
      this.advance();
      const expr = this.parseBinaryExpression();
      this.expect(TokenType.RIGHT_PAREN);
      return expr;
    }

    throw new Error(
      createErrorMessage(this.current, "Unexpected token in function body"),
    );
  }

  private parseIdentifierChain(): ASTNode {
    const identifier = this.current.value;
    this.advance();

    const literalNode = tryParseLiteralIdentifier(identifier);
    if (literalNode) return literalNode;

    let node: ASTNode = createPropertyAccessNode(identifier);

    const isDot = () => this.current.type === TokenType.DOT;
    const isIdentifier = () => this.current.type === TokenType.IDENTIFIER;
    const isMethodCall = () => this.current.type === TokenType.LEFT_PAREN;

    while (isDot() || isMethodCall()) {
      if (isMethodCall()) {
        const propertyNode = node as PropertyAccessNode;
        const method = propertyNode.property;
        const object = propertyNode.object;
        node = this.parseMethodCall(object ? object : createRootNode(), method);
        continue;
      }

      this.advance();

      if (!isIdentifier()) break;

      const prop = this.current.value;
      this.advance();
      node = createPropertyAccessNode(prop, node);
    }

    return node;
  }

  private parseMethodCall(object: ASTNode, method: string): MethodCallNode {
    this.expect(TokenType.LEFT_PAREN);
    const args = this.parseMethodArguments();
    this.expect(TokenType.RIGHT_PAREN);
    return createMethodCallNode(method, args, object);
  }

  private parseMethodArguments(): ASTNode[] {
    const args: ASTNode[] = [];

    while (
      this.current.type !== TokenType.RIGHT_PAREN &&
      this.current.type !== TokenType.EOF
    ) {
      const arg = this.parseMethodArgument();
      args.push(arg);

      const hasComma = this.current.type === TokenType.COMMA;
      if (hasComma) {
        this.advance();
      }
    }

    return args;
  }

  private parseMethodArgument(): ASTNode {
    const currentType = this.current.type;

    if (currentType === TokenType.LEFT_PAREN) {
      const params = this.parseFunctionParams();
      return this.parseArrowFunction(params);
    }

    if (currentType === TokenType.IDENTIFIER) {
      const identifier = this.current.value;
      this.advance();

      const isArrowFunction = this.current.type === TokenType.ARROW;
      if (isArrowFunction) {
        return this.parseArrowFunction([identifier]);
      }

      return createPropertyAccessNode(identifier);
    }

    if (currentType === TokenType.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TokenType.STRING) {
      const value = this.current.value;
      this.advance();
      return createLiteralNode(value);
    }

    return this.parseExpression();
  }

  private parseFunctionParams(): string[] {
    this.expect(TokenType.LEFT_PAREN);
    const params: string[] = [];

    while (
      this.current.type !== TokenType.RIGHT_PAREN &&
      this.current.type !== TokenType.EOF
    ) {
      const isIdentifier = this.current.type === TokenType.IDENTIFIER;
      if (isIdentifier) {
        params.push(this.current.value);
        this.advance();
      }

      const hasComma = this.current.type === TokenType.COMMA;
      if (hasComma) {
        this.advance();
      }
    }

    this.expect(TokenType.RIGHT_PAREN);
    return params;
  }

  private parsePostfix(node: ASTNode): ASTNode {
    let current = node;

    while (true) {
      const tokenType = this.current.type;

      const isDoubleDot = tokenType === TokenType.DOUBLE_DOT;
      if (isDoubleDot) {
        this.advance();
        current = createRecursiveDescentNode(current);
        continue;
      }

      const isDot = tokenType === TokenType.DOT;
      if (isDot) {
        current = this.parsePostfixDot(current);
        continue;
      }

      const isLeftBracket = tokenType === TokenType.LEFT_BRACKET;
      if (isLeftBracket) {
        current = this.parseBracketAccess(current);
        continue;
      }

      const isQuestion = tokenType === TokenType.QUESTION;
      if (isQuestion) {
        this.advance();
        current = createOptionalAccessNode(current);
        continue;
      }

      const isDoubleQuestion = tokenType === TokenType.DOUBLE_QUESTION;
      if (isDoubleQuestion) {
        this.advance();
        const right = this.parsePrimary();
        current = createNullCoalescingNode(current, right);
        continue;
      }

      const isLeftParen = tokenType === TokenType.LEFT_PAREN;
      if (isLeftParen) {
        const isPropertyAccess = current.type === "PropertyAccess";
        const hasNoObject = isPropertyAccess && !(current as PropertyAccessNode).object;
        if (hasNoObject) {
          const method = (current as PropertyAccessNode).property;
          current = this.parseMethodCall(createRootNode(), method);
          continue;
        }
      }

      break;
    }

    return current;
  }

  private parsePostfixDot(node: ASTNode): ASTNode {
    this.advance();

    const currentType = this.current.type;

    if (currentType === TokenType.IDENTIFIER) {
      const property = this.current.value;
      this.advance();

      const isMethodCall = this.current.type === TokenType.LEFT_PAREN;
      if (isMethodCall) {
        return this.parseMethodCall(node, property);
      }

      return createPropertyAccessNode(property, node);
    }

    if (currentType === TokenType.LEFT_BRACKET) {
      return this.parseBracketAccess(node);
    }

    if (currentType === TokenType.LEFT_BRACE) {
      return this.parseObjectOperation(node);
    }

    throw new Error(
      createErrorMessage(this.current, "Expected property name after dot"),
    );
  }

  private parseNumber(): number {
    const isNegative = this.current.value === "-";
    if (isNegative) {
      this.advance();
    }

    const isNumber = this.current.type === TokenType.NUMBER;
    if (!isNumber) {
      throw new Error(
        createErrorMessage(this.current, "Expected number after minus sign"),
      );
    }

    const value = Number(this.current.value);
    return isNegative ? -value : value;
  }

  private advance(): void {
    this.position++;
    const hasMoreTokens = this.position < this.tokens.length;
    if (hasMoreTokens) {
      this.current = this.tokens[this.position];
    }
  }

  private expect(type: TokenType): void {
    const isCorrectType = this.current.type === type;
    if (!isCorrectType) {
      throw new Error(
        createErrorMessage(
          this.current,
          `Expected ${type} but got ${this.current.type}`,
        ),
      );
    }
    this.advance();
  }
}
