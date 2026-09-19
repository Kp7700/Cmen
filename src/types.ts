export type TokenType =
  | 'kw'
  | 'ident'
  | 'num'
  | 'str'
  | 'op'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string | number | boolean;
  line: number;
  col: number;
}

export interface CmenError {
  message: string;
  line?: number;
  col?: number;
  type: 'syntax' | 'runtime' | 'fatal';
}

export type ASTNode =
  | ProgramNode
  | FuncNode
  | BlockNode
  | DeclNode
  | AssignNode
  | GrowNode
  | WhenNode
  | ReleaseNode
  | DieNode
  | ExprStmtNode
  | LitNode
  | VarNode
  | BinaryNode
  | UnaryNode
  | CallNode;

export interface ProgramNode {
  kind: 'program';
  funcs: FuncNode[];
  line: number;
}

export interface FuncNode {
  kind: 'func';
  name: string;
  params: string[];
  body: BlockNode;
  line: number;
}

export interface BlockNode {
  kind: 'block';
  stmts: ASTNode[];
  line: number;
}

export interface DeclNode {
  kind: 'decl';
  declType: 'gene' | 'seed';
  name: string;
  expr: ASTNode;
  line: number;
}

export interface AssignNode {
  kind: 'assign';
  name: string;
  expr: ASTNode;
  line: number;
}

export interface GrowNode {
  kind: 'grow';
  varName: string;
  fromExpr: ASTNode | null;
  toExpr: ASTNode;
  body: BlockNode;
  line: number;
}

export interface WhenNode {
  kind: 'when';
  condition: ASTNode;
  thenBlock: BlockNode;
  elseBlock: BlockNode | null;
  line: number;
}

export interface ReleaseNode {
  kind: 'release';
  expr: ASTNode | null;
  line: number;
}

export interface DieNode {
  kind: 'die';
  expr: ASTNode | null;
  line: number;
}

export interface ExprStmtNode {
  kind: 'exprStmt';
  expr: ASTNode;
  line: number;
}

export interface LitNode {
  kind: 'lit';
  value: string | number | boolean;
  line: number;
}

export interface VarNode {
  kind: 'var';
  name: string;
  line: number;
}

export interface BinaryNode {
  kind: 'binary';
  op: string;
  left: ASTNode;
  right: ASTNode;
  line: number;
}

export interface UnaryNode {
  kind: 'unary';
  op: 'neg' | 'mate' | 'not';
  expr: ASTNode;
  line: number;
}

export interface CallNode {
  kind: 'call';
  name: string;
  args: ASTNode[];
  line: number;
}

export interface ExecutionResult {
  success: boolean;
  output: string[];
  errors: CmenError[];
  executionTimeMs: number;
  returnValue?: string;
}

export interface ExampleProgram {
  id: string;
  title: string;
  category: string;
  description: string;
  code: string;
  expectedOutput: string;
}

export interface DocSection {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  codeSnippet?: string;
  runnable?: boolean;
}
