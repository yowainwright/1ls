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

const OPERATOR_PRECEDENCE: Readonly<Record<string, number>> = {
  "||": 1,
  "&&": 2,
  "==": 3,
  "!=": 3,
  "===": 3,
  "!==": 3,
  ">": 4,
  "<": 4,
  ">=": 4,
  "<=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
};

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

    const expression = this.parsePrimary();
    if (this.current.type !== TT.EOF) {
      throw new Error(createErrorMessage(this.current, "Unexpected token after expression"));
    }

    return createRootNode(expression);
  }

  private parsePrimary(): ASTNode {
    const node = this.parsePrimaryNode();
    return this.parsePostfix(node);
  }

  private parsePrimaryNode(): ASTNode {
    const currentType = this.current.type;

    const isDoubleDot = currentType === TT.DOUBLE_DOT;
    if (isDoubleDot) {
      return this.parseRecursiveDescentRoot();
    }

    const isDot = currentType === TT.DOT;
    if (isDot) {
      return this.parseRootAccess();
    }

    const isLeftBracket = currentType === TT.LEFT_BRACKET;
    if (isLeftBracket) {
      return this.parseBracketAccess();
    }

    if (currentType === TT.IDENTIFIER) return this.parseIdentifierOrFunction();
    if (this.isLiteralToken(currentType)) return this.parseLiteralToken(currentType);
    if (currentType === TT.LEFT_PAREN) return this.parseFunctionExpression();

    throw new Error(createErrorMessage(this.current, "Unexpected token"));
  }

  private isLiteralToken(type: TokenType): boolean {
    if (type === TT.STRING) return true;
    return type === TT.NUMBER;
  }

  private parseLiteralToken(type: TokenType): ASTNode {
    if (type === TT.STRING) return this.parseStringLiteral();
    return this.parseNumberLiteral();
  }

  private parseFunctionExpression(): ASTNode {
    const params = this.parseFunctionParams();
    return this.parseArrowFunction(params);
  }

  private parseRecursiveDescentRoot(): ASTNode {
    this.advance();
    return createRecursiveDescentNode();
  }

  private parseRootAccess(): ASTNode {
    this.advance();
    const isEndOfExpression = this.current.type === TT.EOF;
    if (isEndOfExpression) return createRootNode();
    return this.parseAccessChain();
  }

  private parseStringLiteral(): ASTNode {
    const literalNode = createLiteralNode(this.current.value);
    this.advance();
    return literalNode;
  }

  private parseNumberLiteral(): ASTNode {
    const literalValue = Number(this.current.value);
    this.advance();
    return createLiteralNode(literalValue);
  }

  private parseAccessChain(object?: ASTNode): ASTNode {
    const currentType = this.current.type;

    if (currentType === TT.IDENTIFIER) {
      const propertyNode = createPropertyAccessNode(this.current.value, object);
      this.advance();
      return propertyNode;
    }

    if (currentType === TT.LEFT_BRACKET) {
      return this.parseBracketAccess(object);
    }

    if (currentType === TT.LEFT_BRACE) {
      return this.parseObjectOperation(object);
    }

    throw new Error(createErrorMessage(this.current, "Expected property name after dot"));
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
      return this.parseStringBracketAccess(object);
    }

    const isNumber = this.current.type === TT.NUMBER;
    const isNegativeOperator = this.current.type === TT.OPERATOR && this.current.value === "-";
    const isColon = this.current.type === TT.COLON;
    const isNumericOrSlice = isNumber || isNegativeOperator || isColon;

    if (isNumericOrSlice) {
      return this.parseNumericIndexOrSlice(object);
    }

    throw new Error(createErrorMessage(this.current, "Unexpected token in bracket access"));
  }

  private parseStringBracketAccess(object?: ASTNode): ASTNode {
    const propertyNode = createPropertyAccessNode(this.current.value, object);
    this.advance();
    this.expect(TT.RIGHT_BRACKET);
    return propertyNode;
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

  private parseSliceFromColon(start: number | undefined, object?: ASTNode): SliceAccessNode {
    this.advance();

    const isNumber = this.current.type === TT.NUMBER;
    const isNegativeOperator = this.current.type === TT.OPERATOR && this.current.value === "-";
    const hasEndNumber = isNumber || isNegativeOperator;

    const end = hasEndNumber ? this.parseNumber() : undefined;

    if (hasEndNumber) {
      this.advance();
    }

    this.expect(TT.RIGHT_BRACKET);
    return createSliceAccessNode(start, end, object);
  }

  private parseObjectOperation(object?: ASTNode): ObjectOperationNode {
    this.advance();

    const isValidToken = this.current.type === TT.IDENTIFIER;
    if (!isValidToken) {
      throw new Error(createErrorMessage(this.current, "Expected operation name after {"));
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

  private parseBinaryExpression(minPrecedence = 0): ASTNode {
    let left = this.parseFunctionTerm();

    while (this.current.type === TT.OPERATOR) {
      const operator = this.current.value;
      const precedence = OPERATOR_PRECEDENCE[operator];
      const hasKnownPrecedence = precedence !== undefined;
      const hasLowerPrecedence = precedence < minPrecedence;
      const shouldStop = !hasKnownPrecedence || hasLowerPrecedence;
      if (shouldStop) {
        break;
      }

      this.advance();
      const right = this.parseBinaryExpression(precedence + 1);

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
      return this.parseNumberLiteral();
    }

    if (currentType === TT.STRING) {
      return this.parseStringLiteral();
    }

    if (currentType === TT.LEFT_PAREN) {
      return this.parseGroupedFunctionTerm();
    }

    throw new Error(createErrorMessage(this.current, "Unexpected token in function body"));
  }

  private parseGroupedFunctionTerm(): ASTNode {
    this.advance();
    const expression = this.parseBinaryExpression();
    this.expect(TT.RIGHT_PAREN);
    return expression;
  }

  private parseIdentifierChain(): ASTNode {
    const identifier = this.current.value;
    this.advance();

    const literalNode = tryParseLiteralIdentifier(identifier);
    if (literalNode) return literalNode;

    let node: ASTNode = createPropertyAccessNode(identifier);

    while (this.isIdentifierChainToken()) {
      const nextNode = this.parseIdentifierChainStep(node);
      if (!nextNode) break;
      node = nextNode;
    }

    return node;
  }

  private isIdentifierChainToken(): boolean {
    if (this.current.type === TT.DOT) return true;
    return this.current.type === TT.LEFT_PAREN;
  }

  private parseIdentifierChainStep(node: ASTNode): ASTNode | undefined {
    if (this.current.type === TT.LEFT_PAREN) return this.parseIdentifierMethodCall(node);
    this.advance();
    if (this.current.type !== TT.IDENTIFIER) return undefined;
    return this.parseChainedProperty(node);
  }

  private parseIdentifierMethodCall(node: ASTNode): ASTNode {
    const propertyNode = node as PropertyAccessNode;
    const callObject = propertyNode.object ? propertyNode.object : createRootNode();
    return this.parseMethodCall(callObject, propertyNode.property);
  }

  private parseChainedProperty(node: ASTNode): ASTNode {
    const propertyNode = createPropertyAccessNode(this.current.value, node);
    this.advance();
    return propertyNode;
  }

  private parseMethodCall(object: ASTNode, method: string): ASTNode {
    this.expect(TT.LEFT_PAREN);
    const args = this.parseMethodArguments();
    this.expect(TT.RIGHT_PAREN);
    return createMethodCallNode(method, args, object);
  }

  private parseMethodArguments(): ASTNode[] {
    let args: ASTNode[] = [];

    while (this.current.type !== TT.RIGHT_PAREN && this.current.type !== TT.EOF) {
      const arg = this.parseMethodArgument();
      args = [...args, arg];

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
      return this.parseIdentifierMethodArgument();
    }

    if (currentType === TT.NUMBER) {
      return this.parseNumberLiteral();
    }

    if (currentType === TT.STRING) {
      return this.parseStringLiteral();
    }

    return this.parsePrimary();
  }

  private parseIdentifierMethodArgument(): ASTNode {
    const identifier = this.current.value;
    this.advance();

    const isArrowFunction = this.current.type === TT.ARROW;
    if (isArrowFunction) return this.parseArrowFunction([identifier]);

    return createPropertyAccessNode(identifier);
  }

  private parseFunctionParams(): string[] {
    this.expect(TT.LEFT_PAREN);
    let params: string[] = [];

    while (this.current.type !== TT.RIGHT_PAREN && this.current.type !== TT.EOF) {
      const isIdentifier = this.current.type === TT.IDENTIFIER;
      if (isIdentifier) {
        params = [...params, this.current.value];
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
      const next = this.parsePostfixStep(current);
      if (!next) break;
      current = next;
    }

    return current;
  }

  private parsePostfixStep(node: ASTNode): ASTNode | undefined {
    const tokenType = this.current.type;
    if (tokenType === TT.DOUBLE_DOT) return this.parsePostfixRecursiveDescent(node);
    if (tokenType === TT.DOT) return this.parsePostfixDot(node);
    if (tokenType === TT.LEFT_BRACKET) return this.parseBracketAccess(node);
    if (tokenType === TT.QUESTION) return this.parsePostfixOptionalAccess(node);
    if (tokenType === TT.DOUBLE_QUESTION) return this.parsePostfixNullCoalescing(node);
    if (tokenType === TT.LEFT_PAREN) return this.parseRootMethodPostfix(node);
    return undefined;
  }

  private parsePostfixRecursiveDescent(node: ASTNode): ASTNode {
    this.advance();
    return createRecursiveDescentNode(node);
  }

  private parsePostfixOptionalAccess(node: ASTNode): ASTNode {
    this.advance();
    return createOptionalAccessNode(node);
  }

  private parsePostfixNullCoalescing(node: ASTNode): ASTNode {
    this.advance();
    const right = this.parsePrimary();
    return createNullCoalescingNode(node, right);
  }

  private parseRootMethodPostfix(node: ASTNode): ASTNode | undefined {
    const isPropertyAccess = node.type === "PropertyAccess";
    if (!isPropertyAccess) return undefined;
    const propertyNode = node as PropertyAccessNode;
    if (propertyNode.object) return undefined;
    return this.parseMethodCall(createRootNode(), propertyNode.property);
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

    throw new Error(createErrorMessage(this.current, "Expected property name after dot"));
  }

  private parseNumber(): number {
    const isNegative = this.current.value === "-";
    if (isNegative) {
      this.advance();
    }

    const isNumber = this.current.type === TT.NUMBER;
    if (!isNumber) {
      throw new Error(createErrorMessage(this.current, "Expected number after minus sign"));
    }

    const value = Number(this.current.value);
    if (isNegative) return -value;
    return value;
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
        createErrorMessage(this.current, `Expected ${type} but got ${this.current.type}`),
      );
    }
    this.advance();
  }
}
