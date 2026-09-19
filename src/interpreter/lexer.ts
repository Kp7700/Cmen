import { Token, CmenError } from '../types';

const KEYWORDS = new Set([
  'cum',
  'gene',
  'seed',
  'mutate',
  'grow',
  'when',
  'otherwise',
  'release',
  'die',
  'mate',
  'from',
  'to',
  'and',
  'or',
  'not',
  'true',
  'false',
]);

export function tokenize(source: string): { tokens: Token[]; errors: CmenError[] } {
  const tokens: Token[] = [];
  const errors: CmenError[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const len = source.length;

  while (i < len) {
    const char = source[i];

    // Newline
    if (char === '\n') {
      line++;
      col = 1;
      i++;
      continue;
    }

    // Whitespace
    if (char === ' ' || char === '\t' || char === '\r') {
      col++;
      i++;
      continue;
    }

    // Single-line comment (# ...)
    if (char === '#') {
      while (i < len && source[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(char)) {
      const startCol = col;
      let ident = '';
      while (i < len && /[a-zA-Z0-9_]/.test(source[i])) {
        ident += source[i];
        i++;
        col++;
      }

      if (KEYWORDS.has(ident)) {
        if (ident === 'true' || ident === 'false') {
          tokens.push({
            type: 'kw',
            value: ident === 'true',
            line,
            col: startCol,
          });
        } else {
          tokens.push({
            type: 'kw',
            value: ident,
            line,
            col: startCol,
          });
        }
      } else {
        tokens.push({
          type: 'ident',
          value: ident,
          line,
          col: startCol,
        });
      }
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      const startCol = col;
      let numStr = '';
      let hasDot = false;
      while (i < len && (/[0-9]/.test(source[i]) || source[i] === '.')) {
        if (source[i] === '.') {
          if (hasDot) {
            errors.push({
              message: `Malformed number with multiple decimal points at line ${line}`,
              line,
              col,
              type: 'syntax',
            });
            break;
          }
          hasDot = true;
        }
        numStr += source[i];
        i++;
        col++;
      }
      tokens.push({
        type: 'num',
        value: parseFloat(numStr),
        line,
        col: startCol,
      });
      continue;
    }

    // Strings
    if (char === '"' || char === "'") {
      const quote = char;
      const startCol = col;
      let str = '';
      i++;
      col++;
      let terminated = false;

      while (i < len) {
        const cur = source[i];
        if (cur === '\\') {
          const next = source[i + 1];
          if (next === 'n') str += '\n';
          else if (next === 't') str += '\t';
          else if (next === '\\') str += '\\';
          else if (next === quote) str += quote;
          else str += next || '';
          i += 2;
          col += 2;
          continue;
        }
        if (cur === quote) {
          terminated = true;
          i++;
          col++;
          break;
        }
        if (cur === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        str += cur;
        i++;
      }

      if (!terminated) {
        errors.push({
          message: `Unterminated string literal at line ${line}. Missing closing ${quote}`,
          line,
          col: startCol,
          type: 'syntax',
        });
      }

      tokens.push({
        type: 'str',
        value: str,
        line,
        col: startCol,
      });
      continue;
    }

    // Two-character operators
    const twoChars = source.slice(i, i + 2);
    if (twoChars === '==' || twoChars === '!=' || twoChars === '<=' || twoChars === '>=') {
      tokens.push({
        type: 'op',
        value: twoChars,
        line,
        col,
      });
      i += 2;
      col += 2;
      continue;
    }

    // Single-character operators & delimiters
    if ('+-*/%()<>{},;=<>'.includes(char)) {
      tokens.push({
        type: 'op',
        value: char,
        line,
        col,
      });
      i++;
      col++;
      continue;
    }

    // Unrecognized character
    errors.push({
      message: `Unexpected token '${char}' at line ${line}:${col}`,
      line,
      col,
      type: 'syntax',
    });
    i++;
    col++;
  }

  tokens.push({
    type: 'eof',
    value: 'EOF',
    line,
    col,
  });

  return { tokens, errors };
}
