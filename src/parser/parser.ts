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
} from "../types";

export class Parser {
  private tokens: Token[];
  private position: number = 0;
  private current: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = this.tokens[0];
  }

  parse(): RootNode {
    if (this.current.type === TokenType.EOF) {
      return { type: "Root" };
    }

    const expression = this.parseExpression();
    return { type: "Root", expression };
  }

  private parseExpression(): ASTNode {
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    let node: ASTNode | undefined;

    if (this.current.type === TokenType.DOT) {
      this.advance();
      node = this.parseAccessChain();
    } else if (this.current.type === TokenType.LEFT_BRACKET) {
      node = this.parseArrayAccess();
    } else if (this.current.type === TokenType.IDENTIFIER) {
      node = this.parseIdentifierOrFunction();
    } else if (this.current.type === TokenType.STRING) {
      const value = this.current.value;
      this.advance();
      node = { type: "Literal", value };
    } else if (this.current.type === TokenType.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      node = { type: "Literal", value };
    } else if (this.current.type === TokenType.LEFT_PAREN) {
      // Handle grouped expressions or arrow functions
      const params = this.parseFunctionParams();
      return this.parseArrowFunction(params);
      // Otherwise it's a grouped expression - not implemented yet
      throw new Error(
        `Grouped expressions not yet supported at position ${this.current.position}`,
      );
    }

    if (!node) {
      throw new Error(
        `Unexpected token: ${this.current.type} at position ${this.current.position}`,
      );
    }

    return this.parsePostfix(node);
  }

  private parseAccessChain(object?: ASTNode): ASTNode {
    if (this.current.type === TokenType.IDENTIFIER) {
      const property = this.current.value;
      this.advance();
      const node: PropertyAccessNode = {
        type: "PropertyAccess",
        property,
        object,
      };
      return this.parsePostfix(node);
    }

    if (this.current.type === TokenType.LEFT_BRACKET) {
      return this.parseBracketAccess(object);
    }

    if (this.current.type === TokenType.LEFT_BRACE) {
      return this.parseObjectOperation(object);
    }

    throw new Error(
      `Expected property name after dot at position ${this.current.position}`,
    );
  }

  private parseBracketAccess(object?: ASTNode): ASTNode {
    this.advance(); // consume [

    if (this.current.type === TokenType.RIGHT_BRACKET) {
      this.advance();
      const node: ArraySpreadNode = { type: "ArraySpread", object };
      return this.parsePostfix(node);
    }

    if (this.current.type === TokenType.STRING) {
      const property = this.current.value;
      this.advance();
      this.expect(TokenType.RIGHT_BRACKET);
      const node: PropertyAccessNode = {
        type: "PropertyAccess",
        property,
        object,
      };
      return this.parsePostfix(node);
    }

    const isNumberOrNegative =
      this.current.type === TokenType.NUMBER ||
      (this.current.type === TokenType.OPERATOR && this.current.value === "-");

    if (isNumberOrNegative) {
      const index = this.parseNumber();
      this.advance();

      if (this.current.type === TokenType.COLON) {
        this.advance();
        let end: number | undefined;

        const currentType = this.current.type as TokenType;
        if (
          currentType === TokenType.NUMBER ||
          (currentType === TokenType.OPERATOR && this.current.value === "-")
        ) {
          end = this.parseNumber();
          this.advance();
        }

        this.expect(TokenType.RIGHT_BRACKET);
        const node: SliceAccessNode = {
          type: "SliceAccess",
          start: index,
          end,
          object,
        };
        return this.parsePostfix(node);
      }

      this.expect(TokenType.RIGHT_BRACKET);
      const node: IndexAccessNode = { type: "IndexAccess", index, object };
      return this.parsePostfix(node);
    }

    if (this.current.type === TokenType.COLON) {
      this.advance();
      let end: number | undefined;

      const currentType = this.current.type as TokenType;
      if (
        currentType === TokenType.NUMBER ||
        (currentType === TokenType.OPERATOR && this.current.value === "-")
      ) {
        end = this.parseNumber();
        this.advance();
      }

      this.expect(TokenType.RIGHT_BRACKET);
      const node: SliceAccessNode = { type: "SliceAccess", end, object };
      return this.parsePostfix(node);
    }

    throw new Error(
      `Unexpected token in bracket access: ${this.current.type} at position ${this.current.position}`,
    );
  }

  private parseArrayAccess(): ASTNode {
    return this.parseBracketAccess();
  }

  private parseObjectOperation(object?: ASTNode): ASTNode {
    this.advance(); // consume {

    if (this.current.type !== TokenType.IDENTIFIER) {
      throw new Error(
        `Expected operation name after { at position ${this.current.position}`,
      );
    }

    const operation = this.current.value;
    const validOperations: ObjectOperationType[] = [
      "keys",
      "values",
      "entries",
      "length",
    ];
    const isValidOperation = validOperations.includes(
      operation as ObjectOperationType,
    );

    if (!isValidOperation) {
      throw new Error(
        `Invalid object operation: ${operation} at position ${this.current.position}`,
      );
    }

    this.advance();
    this.expect(TokenType.RIGHT_BRACE);

    const node: ObjectOperationNode = {
      type: "ObjectOperation",
      operation: operation as ObjectOperationType,
      object,
    };
    return this.parsePostfix(node);
  }

  private parseIdentifierOrFunction(): ASTNode {
    const identifier = this.current.value;
    this.advance();

    if (this.current.type === TokenType.ARROW) {
      return this.parseArrowFunction([identifier]);
    }

    const node: PropertyAccessNode = {
      type: "PropertyAccess",
      property: identifier,
    };
    return this.parsePostfix(node);
  }

  private parseArrowFunction(params: string[]): ArrowFunctionNode {
    this.expect(TokenType.ARROW);
    const body = this.parseFunctionBody();
    return { type: "ArrowFunction", params, body };
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
    // Simple binary expression parser for arrow functions
    // This handles expressions like: x * 2, x > 5, etc.
    let left = this.parseFunctionTerm();

    while (this.current.type === TokenType.OPERATOR) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseFunctionTerm();

      // Create a synthetic method call node for operators
      // This will be handled by the navigator
      left = {
        type: "MethodCall",
        method: `__operator_${operator}__`,
        args: [right],
        object: left,
      };
    }

    return left;
  }

  private parseFunctionTerm(): ASTNode {
    if (this.current.type === TokenType.IDENTIFIER) {
      const identifier = this.current.value;
      this.advance();

      let node: ASTNode = { type: "PropertyAccess", property: identifier };
      while ((this.current.type as TokenType) === TokenType.DOT) {
        this.advance();
        const afterDotType = this.current.type as TokenType;
        if (afterDotType === TokenType.IDENTIFIER) {
          const prop = this.current.value;
          this.advance();
          node = { type: "PropertyAccess", property: prop, object: node };
        } else {
          break;
        }
      }
      return node;
    }

    if (this.current.type === TokenType.NUMBER) {
      const value = Number(this.current.value);
      this.advance();
      return { type: "Literal", value };
    }

    if (this.current.type === TokenType.STRING) {
      const value = this.current.value;
      this.advance();
      return { type: "Literal", value };
    }

    if (this.current.type === TokenType.LEFT_PAREN) {
      this.advance();
      const expr = this.parseBinaryExpression();
      this.expect(TokenType.RIGHT_PAREN);
      return expr;
    }

    throw new Error(
      `Unexpected token in function body: ${this.current.type} at position ${this.current.position}`,
    );
  }

  private parseMethodCall(object: ASTNode, method: string): MethodCallNode {
    this.expect(TokenType.LEFT_PAREN);
    const args: ASTNode[] = [];

    while (
      this.current.type !== TokenType.RIGHT_PAREN &&
      this.current.type !== TokenType.EOF
    ) {
      if (this.current.type === TokenType.LEFT_PAREN) {
        // Parse function parameter list for arrow functions
        const params = this.parseFunctionParams();
        args.push(this.parseArrowFunction(params));
      } else if (this.current.type === TokenType.IDENTIFIER) {
        const identifier = this.current.value;
        this.advance();
        const nextType = this.current.type as TokenType;
        if (nextType === TokenType.ARROW) {
          args.push(this.parseArrowFunction([identifier]));
        } else {
          args.push({
            type: "PropertyAccess",
            property: identifier,
          } as PropertyAccessNode);
        }
      } else {
        args.push(this.parseExpression());
      }

      if (this.current.type === TokenType.COMMA) {
        this.advance();
      }
    }

    this.expect(TokenType.RIGHT_PAREN);
    return { type: "MethodCall", method, args, object };
  }

  private parseFunctionParams(): string[] {
    this.expect(TokenType.LEFT_PAREN);
    const params: string[] = [];

    while (
      this.current.type !== TokenType.RIGHT_PAREN &&
      this.current.type !== TokenType.EOF
    ) {
      if (this.current.type === TokenType.IDENTIFIER) {
        params.push(this.current.value);
        this.advance();
      }

      if (this.current.type === TokenType.COMMA) {
        this.advance();
      }
    }

    this.expect(TokenType.RIGHT_PAREN);
    return params;
  }

  private parsePostfix(node: ASTNode): ASTNode {
    while (true) {
      if (this.current.type === TokenType.DOT) {
        this.advance();
        const afterDotType = this.current.type as TokenType;
        if (afterDotType === TokenType.IDENTIFIER) {
          const property = this.current.value;
          this.advance();

          const afterPropertyType = this.current.type as TokenType;
          if (afterPropertyType === TokenType.LEFT_PAREN) {
            node = this.parseMethodCall(node, property);
          } else {
            node = { type: "PropertyAccess", property, object: node };
          }
        } else if (afterDotType === TokenType.LEFT_BRACKET) {
          node = this.parseBracketAccess(node);
        } else if (afterDotType === TokenType.LEFT_BRACE) {
          node = this.parseObjectOperation(node);
        } else {
          throw new Error(
            `Expected property name after dot at position ${this.current.position}`,
          );
        }
      } else if (this.current.type === TokenType.LEFT_BRACKET) {
        node = this.parseBracketAccess(node);
      } else if (this.current.type === TokenType.LEFT_PAREN) {
        if (node.type === "PropertyAccess" && !node.object) {
          const method = node.property;
          node = this.parseMethodCall({ type: "Root" }, method);
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return node;
  }

  private parseNumber(): number {
    const isNegative = this.current.value === "-";
    if (isNegative) this.advance();

    if (this.current.type !== TokenType.NUMBER) {
      throw new Error(
        `Expected number after minus sign at position ${this.current.position}`,
      );
    }

    const value = Number(this.current.value);
    return isNegative ? -value : value;
  }

  private advance(): void {
    this.position++;
    if (this.position < this.tokens.length) {
      this.current = this.tokens[this.position];
    }
  }

  private expect(type: TokenType): void {
    if (this.current.type !== type) {
      throw new Error(
        `Expected ${type} but got ${this.current.type} at position ${this.current.position}`,
      );
    }
    this.advance();
  }
}
