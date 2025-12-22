import type {
  Token,
  TokenType,
  ASTNode,
  PropertyAccessNode,
  SliceAccessNode,
  ObjectOperationNode,
  ArrowFunctionNode,
  RootNode,
} from "../types";
import { TokenType as TT } from "../types";
import { VALID_OBJECT_OPERATIONS } from "./constants";
import {
  createLiteralNode,
  tryParseLiteralIdentifier,
  createErrorMessage,
  createPropertyAccessNode,
  createIndexAccessNode,
  createSliceAccessNode,
  createMethodCallNode,
  createObjectOperationNode,
  createArraySpreadNode,
  createArrowFunctionNode,
  createRootNode,
  createRecursiveDescentNode,
  createOptionalAccessNode,
  createNullCoalescingNode,
  isValidObjectOperation,
} from "./utils";

export {
  createErrorMessage,
  createPropertyAccessNode,
  createIndexAccessNode,
  createSliceAccessNode,
  createMethodCallNode,
  createObjectOperationNode,
  createArraySpreadNode,
  createArrowFunctionNode,
  createRootNode,
  createRecursiveDescentNode,
  createOptionalAccessNode,
  createNullCoalescingNode,
  isValidObjectOperation,
} from "./utils";

export { VALID_OBJECT_OPERATIONS } from "./constants";

export class ExpressionParser {
  private tokens: readonly Token[];
  private position: number = 0;
  private current: Token;

  constructor(tokens: readonly Token[]) {
    this.tokens = tokens;
    this.current = this.tokens[0];
  }

  parse(): RootNode {
    const isEmptyExpression = this.current.type === TT.EOF;
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

    const isDoubleDot = currentType === TT.DOUBLE_DOT;
    if (isDoubleDot) {
      this.advance();
      return createRecursiveDescentNode();
    }

    const isDot = currentType === TT.DOT;
    if (isDot) {
      this.advance();
      const isEndOfExpression = this.current.type === TT.EOF;
      if (isEndOfExpression) {
        return createRootNode();
      }
      return this.parseAccessChain();
    }

    const isLeftBracket = currentType === TT.LEFT_BRACKET;
    if (isLeftBracket) {
      return this.parseArrayAccess();
    }

    if (currentType === TT.IDENTIFIER) {
      return this.parseIdentifierOrFunction();
    }

    if (currentType === TT.STRING) {
      const value = this.current.value;
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TT.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TT.LEFT_PAREN) {
      const params = this.parseFunctionParams();
      return this.parseArrowFunction(params);
    }

    throw new Error(createErrorMessage(this.current, "Unexpected token"));
  }

  private parseAccessChain(object?: ASTNode): ASTNode {
    const currentType = this.current.type;

    if (currentType === TT.IDENTIFIER) {
      const property = this.current.value;
      this.advance();
      return createPropertyAccessNode(property, object);
    }

    if (currentType === TT.LEFT_BRACKET) {
      return this.parseBracketAccess(object);
    }

    if (currentType === TT.LEFT_BRACE) {
      return this.parseObjectOperation(object);
    }

    throw new Error(
      createErrorMessage(this.current, "Expected property name after dot"),
    );
  }

  private parseBracketAccess(object?: ASTNode): ASTNode {
    this.advance();

    const isSpread = this.current.type === TT.RIGHT_BRACKET;
    if (isSpread) {
      this.advance();
      return createArraySpreadNode(object);
    }

    const isStringProperty = this.current.type === TT.STRING;
    if (isStringProperty) {
      const property = this.current.value;
      this.advance();
      this.expect(TT.RIGHT_BRACKET);
      return createPropertyAccessNode(property, object);
    }

    const isNumber = this.current.type === TT.NUMBER;
    const isNegativeOperator =
      this.current.type === TT.OPERATOR && this.current.value === "-";
    const isColon = this.current.type === TT.COLON;
    const isNumericOrSlice = isNumber || isNegativeOperator || isColon;

    if (isNumericOrSlice) {
      return this.parseNumericIndexOrSlice(object);
    }

    throw new Error(
      createErrorMessage(this.current, "Unexpected token in bracket access"),
    );
  }

  private parseNumericIndexOrSlice(object?: ASTNode): ASTNode {
    const startsWithColon = this.current.type === TT.COLON;
    if (startsWithColon) {
      return this.parseSliceFromColon(undefined, object);
    }

    const index = this.parseNumber();
    this.advance();

    const isSlice = this.current.type === TT.COLON;
    if (isSlice) {
      return this.parseSliceFromColon(index, object);
    }

    this.expect(TT.RIGHT_BRACKET);
    return createIndexAccessNode(index, object);
  }

  private parseSliceFromColon(
    start: number | undefined,
    object?: ASTNode,
  ): SliceAccessNode {
    this.advance();

    const isNumber = this.current.type === TT.NUMBER;
    const isNegativeOperator =
      this.current.type === TT.OPERATOR && this.current.value === "-";
    const hasEndNumber = isNumber || isNegativeOperator;

    const end = hasEndNumber ? this.parseNumber() : undefined;

    if (hasEndNumber) {
      this.advance();
    }

    this.expect(TT.RIGHT_BRACKET);
    return createSliceAccessNode(start, end, object);
  }

  private parseArrayAccess(): ASTNode {
    return this.parseBracketAccess();
  }

  private parseObjectOperation(object?: ASTNode): ObjectOperationNode {
    this.advance();

    const isValidToken = this.current.type === TT.IDENTIFIER;
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
    this.expect(TT.RIGHT_BRACE);

    return createObjectOperationNode(operation, object);
  }

  private parseIdentifierOrFunction(): ASTNode {
    const identifier = this.current.value;
    this.advance();

    const isArrowFunction = this.current.type === TT.ARROW;
    if (isArrowFunction) {
      return this.parseArrowFunction([identifier]);
    }

    const literalNode = tryParseLiteralIdentifier(identifier);
    if (literalNode) return literalNode;

    return createPropertyAccessNode(identifier);
  }

  private parseArrowFunction(params: string[]): ArrowFunctionNode {
    this.expect(TT.ARROW);
    const body = this.parseFunctionBody();
    return createArrowFunctionNode(params, body);
  }

  private parseFunctionBody(): ASTNode {
    const isBlockBody = this.current.type === TT.LEFT_BRACE;

    if (isBlockBody) {
      this.advance();
      const expr = this.parseBinaryExpression();
      this.expect(TT.RIGHT_BRACE);
      return expr;
    }

    return this.parseBinaryExpression();
  }

  private parseBinaryExpression(): ASTNode {
    let left = this.parseFunctionTerm();

    while (this.current.type === TT.OPERATOR) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseFunctionTerm();

      left = createMethodCallNode(`__operator_${operator}__`, [right], left);
    }

    return left;
  }

  private parseFunctionTerm(): ASTNode {
    const currentType = this.current.type;

    if (currentType === TT.IDENTIFIER) {
      return this.parseIdentifierChain();
    }

    if (currentType === TT.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TT.STRING) {
      const value = this.current.value;
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TT.LEFT_PAREN) {
      this.advance();
      const expr = this.parseBinaryExpression();
      this.expect(TT.RIGHT_PAREN);
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

    const isDot = () => this.current.type === TT.DOT;
    const isIdentifier = () => this.current.type === TT.IDENTIFIER;
    const isMethodCall = () => this.current.type === TT.LEFT_PAREN;

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

  private parseMethodCall(object: ASTNode, method: string): ASTNode {
    this.expect(TT.LEFT_PAREN);
    const args = this.parseMethodArguments();
    this.expect(TT.RIGHT_PAREN);
    return createMethodCallNode(method, args, object);
  }

  private parseMethodArguments(): ASTNode[] {
    const args: ASTNode[] = [];

    while (
      this.current.type !== TT.RIGHT_PAREN &&
      this.current.type !== TT.EOF
    ) {
      const arg = this.parseMethodArgument();
      args.push(arg);

      const hasComma = this.current.type === TT.COMMA;
      if (hasComma) {
        this.advance();
      }
    }

    return args;
  }

  private parseMethodArgument(): ASTNode {
    const currentType = this.current.type;

    if (currentType === TT.LEFT_PAREN) {
      const params = this.parseFunctionParams();
      return this.parseArrowFunction(params);
    }

    if (currentType === TT.IDENTIFIER) {
      const identifier = this.current.value;
      this.advance();

      const isArrowFunction = this.current.type === TT.ARROW;
      if (isArrowFunction) {
        return this.parseArrowFunction([identifier]);
      }

      return createPropertyAccessNode(identifier);
    }

    if (currentType === TT.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return createLiteralNode(value);
    }

    if (currentType === TT.STRING) {
      const value = this.current.value;
      this.advance();
      return createLiteralNode(value);
    }

    return this.parseExpression();
  }

  private parseFunctionParams(): string[] {
    this.expect(TT.LEFT_PAREN);
    const params: string[] = [];

    while (
      this.current.type !== TT.RIGHT_PAREN &&
      this.current.type !== TT.EOF
    ) {
      const isIdentifier = this.current.type === TT.IDENTIFIER;
      if (isIdentifier) {
        params.push(this.current.value);
        this.advance();
      }

      const hasComma = this.current.type === TT.COMMA;
      if (hasComma) {
        this.advance();
      }
    }

    this.expect(TT.RIGHT_PAREN);
    return params;
  }

  private parsePostfix(node: ASTNode): ASTNode {
    let current = node;

    while (true) {
      const tokenType = this.current.type;

      const isDoubleDot = tokenType === TT.DOUBLE_DOT;
      if (isDoubleDot) {
        this.advance();
        current = createRecursiveDescentNode(current);
        continue;
      }

      const isDot = tokenType === TT.DOT;
      if (isDot) {
        current = this.parsePostfixDot(current);
        continue;
      }

      const isLeftBracket = tokenType === TT.LEFT_BRACKET;
      if (isLeftBracket) {
        current = this.parseBracketAccess(current);
        continue;
      }

      const isQuestion = tokenType === TT.QUESTION;
      if (isQuestion) {
        this.advance();
        current = createOptionalAccessNode(current);
        continue;
      }

      const isDoubleQuestion = tokenType === TT.DOUBLE_QUESTION;
      if (isDoubleQuestion) {
        this.advance();
        const right = this.parsePrimary();
        current = createNullCoalescingNode(current, right);
        continue;
      }

      const isLeftParen = tokenType === TT.LEFT_PAREN;
      if (isLeftParen) {
        const isPropertyAccess = current.type === "PropertyAccess";
        const hasNoObject =
          isPropertyAccess && !(current as PropertyAccessNode).object;
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

    if (currentType === TT.IDENTIFIER) {
      const property = this.current.value;
      this.advance();

      const isMethodCall = this.current.type === TT.LEFT_PAREN;
      if (isMethodCall) {
        return this.parseMethodCall(node, property);
      }

      return createPropertyAccessNode(property, node);
    }

    if (currentType === TT.LEFT_BRACKET) {
      return this.parseBracketAccess(node);
    }

    if (currentType === TT.LEFT_BRACE) {
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

    const isNumber = this.current.type === TT.NUMBER;
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
