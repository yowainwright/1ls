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
  LiteralNode,
} from "../types";

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

export function createLiteralNode(
  value: string | number | boolean | null,
): LiteralNode {
  return { type: "Literal", value };
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

export class Parser {
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

    if (currentType === TokenType.DOT) {
      this.advance();
      return this.parseAccessChain();
    }

    if (currentType === TokenType.LEFT_BRACKET) {
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
    this.advance(); // consume [

    // Handle array spread []
    const isSpread = this.current.type === TokenType.RIGHT_BRACKET;
    if (isSpread) {
      this.advance();
      return createArraySpreadNode(object);
    }

    // Handle string property access ["key"]
    const isStringProperty = this.current.type === TokenType.STRING;
    if (isStringProperty) {
      const property = this.current.value;
      this.advance();
      this.expect(TokenType.RIGHT_BRACKET);
      return createPropertyAccessNode(property, object);
    }

    // Handle numeric index or slice
    const isNumericOrSlice =
      this.current.type === TokenType.NUMBER ||
      (this.current.type === TokenType.OPERATOR && this.current.value === "-") ||
      this.current.type === TokenType.COLON;

    if (isNumericOrSlice) {
      return this.parseNumericIndexOrSlice(object);
    }

    throw new Error(
      createErrorMessage(this.current, "Unexpected token in bracket access"),
    );
  }

  private parseNumericIndexOrSlice(object?: ASTNode): ASTNode {
    // Check if this is a slice starting with colon [:5]
    const startsWithColon = this.current.type === TokenType.COLON;
    if (startsWithColon) {
      return this.parseSliceFromColon(undefined, object);
    }

    // Parse the first number
    const index = this.parseNumber();
    this.advance();

    // Check if this is a slice [1:5]
    const isSlice = this.current.type === TokenType.COLON;
    if (isSlice) {
      return this.parseSliceFromColon(index, object);
    }

    // It's a simple index access [1]
    this.expect(TokenType.RIGHT_BRACKET);
    return createIndexAccessNode(index, object);
  }

  private parseSliceFromColon(
    start: number | undefined,
    object?: ASTNode,
  ): SliceAccessNode {
    this.advance(); // consume colon

    const hasEndNumber =
      this.current.type === TokenType.NUMBER ||
      (this.current.type === TokenType.OPERATOR && this.current.value === "-");

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
    this.advance(); // consume {

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

      // Create synthetic method call for operators
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

    let node: ASTNode = createPropertyAccessNode(identifier);

    const isDot = () => this.current.type === TokenType.DOT;
    const isIdentifier = () => this.current.type === TokenType.IDENTIFIER;

    while (isDot()) {
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

    // Arrow function with parentheses: (x, y) => x + y
    if (currentType === TokenType.LEFT_PAREN) {
      const params = this.parseFunctionParams();
      return this.parseArrowFunction(params);
    }

    // Simple arrow function: x => x * 2
    if (currentType === TokenType.IDENTIFIER) {
      const identifier = this.current.value;
      this.advance();

      const isArrowFunction = this.current.type === TokenType.ARROW;
      if (isArrowFunction) {
        return this.parseArrowFunction([identifier]);
      }

      return createPropertyAccessNode(identifier);
    }

    // Number literal
    if (currentType === TokenType.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return createLiteralNode(value);
    }

    // String literal
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

      if (tokenType === TokenType.DOT) {
        current = this.parsePostfixDot(current);
        continue;
      }

      if (tokenType === TokenType.LEFT_BRACKET) {
        current = this.parseBracketAccess(current);
        continue;
      }

      if (tokenType === TokenType.LEFT_PAREN) {
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
    this.advance(); // consume dot

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
