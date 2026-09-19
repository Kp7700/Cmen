import {
  Token,
  ASTNode,
  ProgramNode,
  FuncNode,
  BlockNode,
  CmenError,
} from '../types';

export class Parser {
  private tokens: Token[];
  private current = 0;
  public errors: CmenError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || this.tokens[this.tokens.length - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'eof';
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: string, value?: string | number | boolean): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  private match(type: string, value?: string | number | boolean): boolean {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: string, value?: string | number | boolean, errMsg?: string): Token {
    if (this.check(type, value)) {
      return this.advance();
    }
    const token = this.peek();
    const message = errMsg || `Expected '${value ?? type}' but found '${token.value}' at line ${token.line}`;
    this.errors.push({
      message,
      line: token.line,
      col: token.col,
      type: 'syntax',
    });
    throw new Error(message);
  }

  private synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().value === ';') return;
      if (this.previous().value === '}') return;
      if (this.peek().type === 'kw' && ['cum', 'gene', 'seed', 'mutate', 'grow', 'when', 'release', 'die'].includes(String(this.peek().value))) {
        return;
      }
      this.advance();
    }
  }

  public parse(): { ast: ProgramNode | null; errors: CmenError[] } {
    try {
      const funcs: FuncNode[] = [];
      const startLine = this.peek().line;

      if (this.isAtEnd()) {
        this.errors.push({
          message: 'The source file is completely empty. Nothing was conceived.',
          line: 1,
          type: 'syntax',
        });
        return { ast: null, errors: this.errors };
      }

      while (!this.isAtEnd()) {
        if (this.check('kw', 'cum')) {
          const fn = this.functionDeclaration();
          if (fn) funcs.push(fn);
        } else {
          const token = this.peek();
          this.errors.push({
            message: `Top-level code must be inside a 'cum' block (e.g. 'cum main { ... }'). Found '${token.value}' at line ${token.line}`,
            line: token.line,
            col: token.col,
            type: 'syntax',
          });
          this.synchronize();
        }
      }

      const hasMain = funcs.some((f) => f.name === 'main');
      if (!hasMain) {
        this.errors.push({
          message: "No entry point found. Every Cmen program requires a 'cum main { ... }' block to begin life.",
          line: 1,
          type: 'syntax',
        });
      }

      return {
        ast: {
          kind: 'program',
          funcs,
          line: startLine,
        },
        errors: this.errors,
      };
    } catch {
      return { ast: null, errors: this.errors };
    }
  }

  private functionDeclaration(): FuncNode {
    const cumToken = this.consume('kw', 'cum', "Expected 'cum' keyword to declare a block");
    const nameToken = this.consume('ident', undefined, "Expected function or block name after 'cum'");
    const params: string[] = [];

    // Optional parameter list: cum add(a, b) { ... }
    if (this.match('op', '(')) {
      if (!this.check('op', ')')) {
        do {
          const param = this.consume('ident', undefined, 'Expected parameter name');
          params.push(String(param.value));
        } while (this.match('op', ','));
      }
      this.consume('op', ')', "Expected ')' after parameters");
    }

    const body = this.block();
    return {
      kind: 'func',
      name: String(nameToken.value),
      params,
      body,
      line: cumToken.line,
    };
  }

  private block(): BlockNode {
    const openToken = this.consume('op', '{', "Expected '{' to open block");
    const stmts: ASTNode[] = [];

    while (!this.check('op', '}') && !this.isAtEnd()) {
      try {
        const stmt = this.statement();
        if (stmt) stmts.push(stmt);
      } catch {
        this.synchronize();
      }
    }

    this.consume('op', '}', "Expected '}' to close block");
    return {
      kind: 'block',
      stmts,
      line: openToken.line,
    };
  }

  private statement(): ASTNode {
    const token = this.peek();

    // Variable / Constant declaration: gene x = ...; or seed x = ...;
    if (this.check('kw', 'gene') || this.check('kw', 'seed')) {
      const declType = String(this.advance().value) as 'gene' | 'seed';
      const nameToken = this.consume('ident', undefined, `Expected variable name after '${declType}'`);
      this.consume('op', '=', `Expected '=' in '${declType} ${nameToken.value} = ...;'`);
      const expr = this.expression();
      this.consume('op', ';', `Expected ';' at the end of '${declType}' declaration`);
      return {
        kind: 'decl',
        declType,
        name: String(nameToken.value),
        expr,
        line: token.line,
      };
    }

    // Mutation: mutate x = ...;
    if (this.match('kw', 'mutate')) {
      const nameToken = this.consume('ident', undefined, "Expected variable name after 'mutate'");
      this.consume('op', '=', `Expected '=' after 'mutate ${nameToken.value}'`);
      const expr = this.expression();
      this.consume('op', ';', "Expected ';' after mutation");
      return {
        kind: 'assign',
        name: String(nameToken.value),
        expr,
        line: token.line,
      };
    }

    // Direct assignment: x = ...;
    if (token.type === 'ident' && this.tokens[this.current + 1]?.value === '=') {
      const nameToken = this.advance();
      this.advance(); // consume '='
      const expr = this.expression();
      this.consume('op', ';', "Expected ';' after assignment");
      return {
        kind: 'assign',
        name: String(nameToken.value),
        expr,
        line: token.line,
      };
    }

    // Growth loop: grow i from 1 to 5 { ... } or grow i to 5 { ... }
    if (this.match('kw', 'grow')) {
      const varToken = this.consume('ident', undefined, "Expected loop variable name after 'grow'");
      let fromExpr: ASTNode | null = null;
      if (this.match('kw', 'from')) {
        fromExpr = this.expression();
      }
      this.consume('kw', 'to', "Expected 'to' in 'grow' loop (e.g., 'grow i from 1 to 5 { ... }')");
      const toExpr = this.expression();
      const body = this.block();
      return {
        kind: 'grow',
        varName: String(varToken.value),
        fromExpr,
        toExpr,
        body,
        line: token.line,
      };
    }

    // Conditionals: when (cond) { ... } otherwise { ... }
    if (this.match('kw', 'when')) {
      this.consume('op', '(', "Expected '(' after 'when'");
      const condition = this.expression();
      this.consume('op', ')', "Expected ')' after 'when' condition");
      const thenBlock = this.block();
      let elseBlock: BlockNode | null = null;

      if (this.match('kw', 'otherwise')) {
        if (this.check('kw', 'when')) {
          // otherwise when ...
          const nested = this.statement();
          elseBlock = {
            kind: 'block',
            stmts: [nested],
            line: this.previous().line,
          };
        } else {
          elseBlock = this.block();
        }
      }

      return {
        kind: 'when',
        condition,
        thenBlock,
        elseBlock,
        line: token.line,
      };
    }

    // Release (return): release expr;
    if (this.match('kw', 'release')) {
      let expr: ASTNode | null = null;
      if (!this.check('op', ';')) {
        expr = this.expression();
      }
      this.consume('op', ';', "Expected ';' after 'release'");
      return {
        kind: 'release',
        expr,
        line: token.line,
      };
    }

    // Die (terminate): die("reason"); or die;
    if (this.match('kw', 'die')) {
      let expr: ASTNode | null = null;
      if (this.match('op', '(')) {
        if (!this.check('op', ')')) {
          expr = this.expression();
        }
        this.consume('op', ')', "Expected ')' after 'die('");
      }
      this.consume('op', ';', "Expected ';' after 'die'");
      return {
        kind: 'die',
        expr,
        line: token.line,
      };
    }

    // Expression statement (e.g. ejaculate("Hello");)
    const expr = this.expression();
    this.consume('op', ';', "Expected ';' after expression statement");
    return {
      kind: 'exprStmt',
      expr,
      line: token.line,
    };
  }

  private expression(): ASTNode {
    return this.logicalOr();
  }

  private logicalOr(): ASTNode {
    let expr = this.logicalAnd();

    while (this.match('kw', 'or')) {
      const opToken = this.previous();
      const right = this.logicalAnd();
      expr = {
        kind: 'binary',
        op: 'or',
        left: expr,
        right,
        line: opToken.line,
      };
    }
    return expr;
  }

  private logicalAnd(): ASTNode {
    let expr = this.equality();

    while (this.match('kw', 'and')) {
      const opToken = this.previous();
      const right = this.equality();
      expr = {
        kind: 'binary',
        op: 'and',
        left: expr,
        right,
        line: opToken.line,
      };
    }
    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();

    while (this.match('op', '==') || this.match('op', '!=')) {
      const opToken = this.previous();
      const right = this.comparison();
      expr = {
        kind: 'binary',
        op: String(opToken.value),
        left: expr,
        right,
        line: opToken.line,
      };
    }
    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.term();

    while (
      this.match('op', '<') ||
      this.match('op', '<=') ||
      this.match('op', '>') ||
      this.match('op', '>=')
    ) {
      const opToken = this.previous();
      const right = this.term();
      expr = {
        kind: 'binary',
        op: String(opToken.value),
        left: expr,
        right,
        line: opToken.line,
      };
    }
    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();

    while (this.match('op', '+') || this.match('op', '-')) {
      const opToken = this.previous();
      const right = this.factor();
      expr = {
        kind: 'binary',
        op: String(opToken.value),
        left: expr,
        right,
        line: opToken.line,
      };
    }
    return expr;
  }

  private factor(): ASTNode {
    let expr = this.unary();

    while (this.match('op', '*') || this.match('op', '/') || this.match('op', '%')) {
      const opToken = this.previous();
      const right = this.unary();
      expr = {
        kind: 'binary',
        op: String(opToken.value),
        left: expr,
        right,
        line: opToken.line,
      };
    }
    return expr;
  }

  private unary(): ASTNode {
    if (this.match('op', '-')) {
      const opToken = this.previous();
      const right = this.unary();
      return {
        kind: 'unary',
        op: 'neg',
        expr: right,
        line: opToken.line,
      };
    }

    if (this.match('kw', 'not')) {
      const opToken = this.previous();
      const right = this.unary();
      return {
        kind: 'unary',
        op: 'not',
        expr: right,
        line: opToken.line,
      };
    }

    // mate operator: mate expr (affinity / concatenation helper)
    if (this.match('kw', 'mate')) {
      const opToken = this.previous();
      const right = this.unary();
      return {
        kind: 'unary',
        op: 'mate',
        expr: right,
        line: opToken.line,
      };
    }

    return this.primary();
  }

  private primary(): ASTNode {
    const token = this.peek();

    if (this.match('num') || this.match('str') || this.match('kw', true) || this.match('kw', false)) {
      return {
        kind: 'lit',
        value: this.previous().value,
        line: token.line,
      };
    }

    // Grouping: (expr)
    if (this.match('op', '(')) {
      const expr = this.expression();
      this.consume('op', ')', "Expected ')' to close grouped expression");
      return expr;
    }

    // Identifiers or Function Calls (e.g. ejaculate(...) or customFunc(...))
    if (this.match('ident')) {
      const name = String(this.previous().value);
      if (this.match('op', '(')) {
        const args: ASTNode[] = [];
        if (!this.check('op', ')')) {
          do {
            args.push(this.expression());
          } while (this.match('op', ','));
        }
        this.consume('op', ')', `Expected ')' after call to '${name}'`);
        return {
          kind: 'call',
          name,
          args,
          line: token.line,
        };
      }

      return {
        kind: 'var',
        name,
        line: token.line,
      };
    }

    this.errors.push({
      message: `Unexpected token '${token.value}' in expression at line ${token.line}`,
      line: token.line,
      col: token.col,
      type: 'syntax',
    });
    this.advance();
    throw new Error(`Unexpected token at line ${token.line}`);
  }
}
