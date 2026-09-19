import { tokenize } from './lexer';
import { Parser } from './parser';
import { Evaluator } from './evaluator';
import { ExecutionResult } from '../types';

export function runCmen(source: string): ExecutionResult {
  const startTime = performance.now();
  const { tokens, errors: lexErrors } = tokenize(source);

  if (lexErrors.length > 0) {
    return {
      success: false,
      output: [],
      errors: lexErrors,
      executionTimeMs: Math.round((performance.now() - startTime) * 10) / 10,
    };
  }

  const parser = new Parser(tokens);
  const { ast, errors: parseErrors } = parser.parse();

  if (parseErrors.length > 0 || !ast) {
    return {
      success: false,
      output: [],
      errors: parseErrors,
      executionTimeMs: Math.round((performance.now() - startTime) * 10) / 10,
    };
  }

  const evaluator = new Evaluator(ast);
  return evaluator.run();
}

/**
 * Lightweight syntax highlighter for Cmen code
 */
export function highlightCmenCode(code: string): string {
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const re = /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(cum|gene|seed|mutate|grow|when|otherwise|release|die|mate|from|to|and|or|not|true|false)\b|\b(ejaculate|length|text|number)\b|\b(\d+(?:\.\d+)?)\b/g;

  return escapeHtml(code).replace(
    re,
    (_match, comment, stringLit, keyword, builtin, numberLit) => {
      if (comment) return `<span class="token-comment">${comment}</span>`;
      if (stringLit) return `<span class="token-string">${stringLit}</span>`;
      if (keyword) return `<span class="token-keyword font-semibold">${keyword}</span>`;
      if (builtin) return `<span class="token-builtin font-semibold">${builtin}</span>`;
      if (numberLit) return `<span class="token-number">${numberLit}</span>`;
      return _match;
    }
  );
}
