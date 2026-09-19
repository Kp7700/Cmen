import {
  ASTNode,
  ProgramNode,
  FuncNode,
  BlockNode,
  CmenError,
  ExecutionResult,
} from '../types';

class ReleaseSignal {
  value: unknown;
  constructor(value: unknown) {
    this.value = value;
  }
}

class DieSignal {
  message: string;
  line: number;
  constructor(message: string, line: number) {
    this.message = message;
    this.line = line;
  }
}

interface VariableCell {
  value: unknown;
  isSeed: boolean;
}

class Environment {
  private bindings = new Map<string, VariableCell>();
  public parent: Environment | null = null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  public define(name: string, value: unknown, isSeed = false) {
    this.bindings.set(name, { value, isSeed });
  }

  public assign(name: string, value: unknown, line: number) {
    let current: Environment | null = this;
    while (current) {
      if (current.bindings.has(name)) {
        const cell = current.bindings.get(name)!;
        if (cell.isSeed) {
          throw new CmenRuntimeError(
            `Cannot mutate '${name}' — seeds are immutable. Fixed at conception.`,
            line
          );
        }
        cell.value = value;
        return;
      }
      current = current.parent;
    }
    throw new CmenRuntimeError(
      `'${name}' was never conceived. Declare it first with 'gene ${name} = ...;'`,
      line
    );
  }

  public get(name: string, line: number): unknown {
    let current: Environment | null = this;
    while (current) {
      if (current.bindings.has(name)) {
        return current.bindings.get(name)!.value;
      }
      current = current.parent;
    }
    throw new CmenRuntimeError(
      `'${name}' is not defined. Nothing by that name was ever conceived.`,
      line
    );
  }
}

class CmenRuntimeError extends Error {
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.line = line;
  }
}

export function stringifyValue(val: unknown): string {
  if (val === null || val === undefined) return 'void';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val.toString() : val.toString();
  }
  return String(val);
}

function isTruthy(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0 && !isNaN(val);
  if (typeof val === 'string') return val.length > 0;
  return val !== null && val !== undefined;
}

export class Evaluator {
  private functions = new Map<string, FuncNode>();
  private globalEnv = new Environment();
  private output: string[] = [];
  private errors: CmenError[] = [];
  private stepCount = 0;
  private callDepth = 0;
  private readonly MAX_STEPS = 150000;
  private readonly MAX_DEPTH = 250;

  constructor(program: ProgramNode) {
    for (const fn of program.funcs) {
      this.functions.set(fn.name, fn);
    }
  }

  private tick(line: number) {
    this.stepCount++;
    if (this.stepCount > this.MAX_STEPS) {
      throw new CmenRuntimeError(
        `Execution limit exceeded (${this.MAX_STEPS} steps). This organism has grown out of control.`,
        line
      );
    }
  }

  public run(): ExecutionResult {
    const startTime = performance.now();
    let returnValue: string | undefined;

    try {
      const mainFunc = this.functions.get('main');
      if (!mainFunc) {
        return {
          success: false,
          output: this.output,
          errors: [
            {
              message: "Missing 'cum main { ... }' entry point.",
              line: 1,
              type: 'fatal',
            },
          ],
          executionTimeMs: 0,
        };
      }

      const res = this.callFunction(mainFunc, [], this.globalEnv, 1);
      if (res !== undefined && res !== null) {
        returnValue = stringifyValue(res);
      }

      const duration = Math.round((performance.now() - startTime) * 10) / 10;
      return {
        success: true,
        output: this.output,
        errors: [],
        executionTimeMs: duration,
        returnValue,
      };
    } catch (err) {
      const duration = Math.round((performance.now() - startTime) * 10) / 10;
      if (err instanceof DieSignal) {
        this.errors.push({
          message: `Program terminated at line ${err.line}: ${err.message}`,
          line: err.line,
          type: 'fatal',
        });
        return {
          success: false,
          output: this.output,
          errors: this.errors,
          executionTimeMs: duration,
        };
      }

      if (err instanceof CmenRuntimeError) {
        this.errors.push({
          message: err.message,
          line: err.line,
          type: 'runtime',
        });
        return {
          success: false,
          output: this.output,
          errors: this.errors,
          executionTimeMs: duration,
        };
      }

      const message = err instanceof Error ? err.message : String(err);
      this.errors.push({
        message: `Runtime error: ${message}`,
        type: 'runtime',
      });
      return {
        success: false,
        output: this.output,
        errors: this.errors,
        executionTimeMs: duration,
      };
    }
  }

  private callFunction(
    fn: FuncNode,
    args: unknown[],
    parentEnv: Environment,
    callLine: number
  ): unknown {
    this.callDepth++;
    if (this.callDepth > this.MAX_DEPTH) {
      throw new CmenRuntimeError(
        `Stack overflow — descent too deep (recursion limit: ${this.MAX_DEPTH}).`,
        callLine
      );
    }

    if (fn.params.length !== args.length) {
      throw new CmenRuntimeError(
        `Function '${fn.name}' expected ${fn.params.length} argument(s) but received ${args.length}.`,
        callLine
      );
    }

    const localEnv = new Environment(parentEnv);
    for (let i = 0; i < fn.params.length; i++) {
      localEnv.define(fn.params[i], args[i], false);
    }

    try {
      this.executeBlock(fn.body, localEnv);
      return null;
    } catch (sig) {
      if (sig instanceof ReleaseSignal) {
        return sig.value;
      }
      throw sig;
    } finally {
      this.callDepth--;
    }
  }

  private executeBlock(block: BlockNode, env: Environment) {
    for (const stmt of block.stmts) {
      this.executeStatement(stmt, env);
    }
  }

  private executeStatement(stmt: ASTNode, env: Environment) {
    this.tick(stmt.line);

    switch (stmt.kind) {
      case 'decl': {
        const val = this.evaluate(stmt.expr, env);
        env.define(stmt.name, val, stmt.declType === 'seed');
        break;
      }

      case 'assign': {
        const val = this.evaluate(stmt.expr, env);
        env.assign(stmt.name, val, stmt.line);
        break;
      }

      case 'grow': {
        const startVal = stmt.fromExpr ? this.evaluate(stmt.fromExpr, env) : 1;
        const endVal = this.evaluate(stmt.toExpr, env);

        if (typeof startVal !== 'number' || typeof endVal !== 'number') {
          throw new CmenRuntimeError(
            `'grow' bounds must be numbers. Received (${typeof startVal}) to (${typeof endVal}).`,
            stmt.line
          );
        }

        const loopEnv = new Environment(env);
        for (let i = startVal; i <= endVal; i++) {
          this.tick(stmt.line);
          loopEnv.define(stmt.varName, i, false);
          try {
            this.executeBlock(stmt.body, loopEnv);
          } catch (sig) {
            if (sig instanceof ReleaseSignal || sig instanceof DieSignal) {
              throw sig;
            }
            throw sig;
          }
        }
        break;
      }

      case 'when': {
        const cond = this.evaluate(stmt.condition, env);
        if (isTruthy(cond)) {
          const thenEnv = new Environment(env);
          this.executeBlock(stmt.thenBlock, thenEnv);
        } else if (stmt.elseBlock) {
          const elseEnv = new Environment(env);
          this.executeBlock(stmt.elseBlock, elseEnv);
        }
        break;
      }

      case 'release': {
        const val = stmt.expr ? this.evaluate(stmt.expr, env) : null;
        throw new ReleaseSignal(val);
      }

      case 'die': {
        const reason = stmt.expr
          ? stringifyValue(this.evaluate(stmt.expr, env))
          : 'The program chose not to survive.';
        throw new DieSignal(reason, stmt.line);
      }

      case 'exprStmt': {
        this.evaluate(stmt.expr, env);
        break;
      }

      case 'block': {
        const innerEnv = new Environment(env);
        this.executeBlock(stmt, innerEnv);
        break;
      }

      default:
        throw new CmenRuntimeError(
          `Unrecognized statement kind: ${(stmt as ASTNode).kind}`,
          stmt.line
        );
    }
  }

  private evaluate(expr: ASTNode, env: Environment): unknown {
    this.tick(expr.line);

    switch (expr.kind) {
      case 'lit':
        return expr.value;

      case 'var':
        return env.get(expr.name, expr.line);

      case 'unary': {
        const inner = this.evaluate(expr.expr, env);
        if (expr.op === 'neg') {
          if (typeof inner !== 'number') {
            throw new CmenRuntimeError(
              `Unary negation '-' requires a numeric operand, got ${typeof inner}.`,
              expr.line
            );
          }
          return -inner;
        }
        if (expr.op === 'not') {
          return !isTruthy(inner);
        }
        if (expr.op === 'mate') {
          // Mate converts its operand to string form to prepare for combination/lineage
          return stringifyValue(inner);
        }
        throw new CmenRuntimeError(`Unknown unary operator: ${expr.op}`, expr.line);
      }

      case 'binary': {
        const { op, left, right, line } = expr;

        // Short-circuit logical operators
        if (op === 'or') {
          const lVal = this.evaluate(left, env);
          if (isTruthy(lVal)) return true;
          const rVal = this.evaluate(right, env);
          return isTruthy(rVal);
        }

        if (op === 'and') {
          const lVal = this.evaluate(left, env);
          if (!isTruthy(lVal)) return false;
          const rVal = this.evaluate(right, env);
          return isTruthy(rVal);
        }

        const lVal = this.evaluate(left, env);
        const rVal = this.evaluate(right, env);

        // Addition & String Concatenation
        if (op === '+') {
          if (typeof lVal === 'string' || typeof rVal === 'string') {
            return stringifyValue(lVal) + stringifyValue(rVal);
          }
          if (typeof lVal === 'number' && typeof rVal === 'number') {
            return lVal + rVal;
          }
          throw new CmenRuntimeError(
            `Type mismatch for '+': requires numbers or text, received ${typeof lVal} and ${typeof rVal}.`,
            line
          );
        }

        // Numeric operators
        if (['-', '*', '/', '%'].includes(op)) {
          if (typeof lVal !== 'number' || typeof rVal !== 'number') {
            throw new CmenRuntimeError(
              `Operator '${op}' requires numeric operands, received ${typeof lVal} and ${typeof rVal}.`,
              line
            );
          }

          if (op === '-') return lVal - rVal;
          if (op === '*') return lVal * rVal;
          if (op === '/') {
            if (rVal === 0) {
              throw new CmenRuntimeError('Division by zero — even Cmen cannot divide nothing.', line);
            }
            return lVal / rVal;
          }
          if (op === '%') {
            if (rVal === 0) {
              throw new CmenRuntimeError('Modulo by zero is undefined.', line);
            }
            return lVal % rVal;
          }
        }

        // Equality
        if (op === '==') return lVal === rVal;
        if (op === '!=') return lVal !== rVal;

        // Relational comparisons
        if (['<', '<=', '>', '>='].includes(op)) {
          if (typeof lVal === typeof rVal && (typeof lVal === 'number' || typeof lVal === 'string')) {
            const leftComparable = lVal as number | string;
            const rightComparable = rVal as number | string;
            if (op === '<') return leftComparable < rightComparable;
            if (op === '<=') return leftComparable <= rightComparable;
            if (op === '>') return leftComparable > rightComparable;
            if (op === '>=') return leftComparable >= rightComparable;
          }
          throw new CmenRuntimeError(
            `Comparison '${op}' requires operands of matching type (numbers or text).`,
            line
          );
        }

        throw new CmenRuntimeError(`Unsupported binary operator '${op}'`, line);
      }

      case 'call': {
        const { name, args, line } = expr;

        // Built-in functions
        if (name === 'ejaculate') {
          const evaluatedArgs = args.map((a) => this.evaluate(a, env));
          const lineStr = evaluatedArgs.map(stringifyValue).join(' ');
          this.output.push(lineStr);
          if (this.output.length > 500) {
            throw new CmenRuntimeError(
              'Output buffer overflow (500 lines). Controlled release means controlled.',
              line
            );
          }
          return null;
        }

        if (name === 'length') {
          if (args.length !== 1) {
            throw new CmenRuntimeError("Function 'length' requires exactly 1 argument.", line);
          }
          const val = this.evaluate(args[0], env);
          if (typeof val !== 'string') {
            throw new CmenRuntimeError(
              `'length()' expects text, received ${typeof val}.`,
              line
            );
          }
          return val.length;
        }

        if (name === 'text') {
          if (args.length !== 1) {
            throw new CmenRuntimeError("Function 'text' requires exactly 1 argument.", line);
          }
          return stringifyValue(this.evaluate(args[0], env));
        }

        if (name === 'number') {
          if (args.length !== 1) {
            throw new CmenRuntimeError("Function 'number' requires exactly 1 argument.", line);
          }
          const raw = this.evaluate(args[0], env);
          const num = Number(raw);
          if (isNaN(num)) {
            throw new CmenRuntimeError(
              `Cannot convert '${stringifyValue(raw)}' to number. Some values resist conversion.`,
              line
            );
          }
          return num;
        }

        // User-defined function
        const userFunc = this.functions.get(name);
        if (userFunc) {
          const evaluatedArgs = args.map((a) => this.evaluate(a, env));
          return this.callFunction(userFunc, evaluatedArgs, this.globalEnv, line);
        }

        throw new CmenRuntimeError(
          `Function '${name}' is not defined. Nothing by that name was conceived.`,
          line
        );
      }

      default:
        throw new CmenRuntimeError(`Cannot evaluate AST node of kind: ${(expr as ASTNode).kind}`, expr.line);
    }
  }
}
