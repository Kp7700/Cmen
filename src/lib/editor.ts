/**
 * Lightweight editor helpers for the Cmen playground.
 *
 * These functions power auto-indent, auto-closing brackets/quotes and
 * variable autocomplete on top of the existing textarea + highlight-overlay
 * architecture. They never change Cmen syntax or interpreter behavior.
 */

export const INDENT = '    '; // 4 spaces per indentation level

const OPEN_TO_CLOSE: Record<string, string> = {
  '(': ')',
  '{': '}',
  '[': ']',
  '"': '"',
  "'": "'",
};

const PAIR_CLOSERS = new Set([')', '}', ']', '"', "'"]);

// Cmen keywords (kept in sync with the lexer) — excluded from suggestions.
const CMEN_KEYWORDS = new Set([
  'cum', 'gene', 'seed', 'mutate', 'grow', 'when', 'otherwise',
  'release', 'die', 'mate', 'from', 'to', 'and', 'or', 'not',
  'true', 'false',
]);

// Built-in functions — suggested alongside user variables.
const CMEN_BUILTINS = ['ejaculate', 'length', 'text', 'number'];

/**
 * Scans the source and returns a function that tells whether a given index
 * sits inside a string literal or a `#` comment (i.e. "dead zone").
 * Backslash escapes are honored; an unterminated string/comment extends to
 * the end of the buffer, which is exactly what the editor wants while typing.
 */
export function makeDeadZoneChecker(source: string): (index: number) => boolean {
  const zones: Array<[number, number]> = [];
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    if (c === '#') {
      const start = i;
      while (i < n && source[i] !== '\n') i++;
      zones.push([start, i]);
    } else if (c === '"' || c === "'") {
      const quote = c;
      const start = i;
      i++;
      while (i < n && source[i] !== quote) {
        if (source[i] === '\\') i++; // skip escaped character
        i++;
      }
      if (i < n) i++; // consume closing quote
      zones.push([start, i]);
    } else {
      i++;
    }
  }
  return (index: number) => zones.some(([s, e]) => index >= s && index < e);
}

/**
 * Returns the start of the current line and the text between that start and
 * the caret.
 */
function currentLinePrefix(source: string, caret: number): { lineStart: number; prefix: string } {
  const lineStart = source.lastIndexOf('\n', caret - 1) + 1;
  return { lineStart, prefix: source.slice(lineStart, caret) };
}

/**
 * Handles the Enter key: preserves current indentation, opens a new level
 * after `{`, and de-indents the new line when the previous line merely
 * closes a block (`}` alone) or when the text right after the cursor is `}`.
 * Returns null when no special handling applies.
 */
export function applyAutoIndent(
  source: string,
  selStart: number,
  selEnd: number
): { value: string; caret: number } | null {
  const { lineStart, prefix } = currentLinePrefix(source, selStart);
  const trimmedPrefix = prefix.trim();

  // Never reformat indentation inside strings or comments.
  const inDeadZone = makeDeadZoneChecker(source);
  if (selStart > lineStart && inDeadZone(selStart - 1)) return null;
  if (inDeadZone(lineStart)) return null;

  const baseIndent = /^[\t ]*/.exec(prefix)![0];
  const charBefore = selStart > 0 ? source[selStart - 1] : '';
  const charAfter = selEnd < source.length ? source[selEnd] : '';

  let indent = baseIndent;
  if (charBefore === '{') {
    // Opening a block: go one level deeper.
    indent = baseIndent + INDENT;
  } else if (trimmedPrefix === '}' || charAfter === '}') {
    // Line contains only a closing brace, or we are inserting right before
    // an existing closing brace: the new line belongs one level out.
    const unit = leadingUnit(baseIndent);
    indent = unit ? baseIndent.slice(0, baseIndent.length - unit.length) : baseIndent.replace(/[ \t]+$/, '');
  }

  // If the `}` immediately after the cursor ends up alone on its own line,
  // pull it back to the enclosing level so nested blocks stay aligned.
  const trailing = charAfter === '}' ? baseIndent : '';

  const inserted = '\n' + indent + trailing;
  const value = source.slice(0, selStart) + inserted + source.slice(selEnd);
  return { value, caret: selStart + 1 + indent.length };
}

/**
 * Indentation unit for a line of text: one tab character counts as one level,
 * four spaces count as one level (matches the editor's `tab-4` rendering).
 */
function leadingUnit(line: string): string {
  if (line.startsWith('\t')) return '\t';
  if (/^    /.test(line)) return '    ';
  return '';
}

/**
 * Handles Tab / Shift+Tab on the current line (or multi-line selection).
 * Returns null when the keystroke should fall through to default behavior.
 */
export function applyTab(
  source: string,
  selStart: number,
  selEnd: number,
  shift: boolean
): { value: string; selStart: number; selEnd: number } | null {
  const inDeadZone = makeDeadZoneChecker(source);

  // Caret-only Tab inside a string/comment: leave indentation alone there.
  if (!shift && selStart === selEnd && inDeadZone(selStart)) return null;

  const firstLineStart = source.lastIndexOf('\n', selStart - 1) + 1;
  const hasSelection = selEnd > selStart;

  if (!shift && !hasSelection) {
    // Simple indent insert at the caret (same behavior as the previous editor).
    const value = source.slice(0, selStart) + INDENT + source.slice(selEnd);
    return { value, selStart: selStart + INDENT.length, selEnd: selStart + INDENT.length };
  }

  // Indent/outdent every line touched by the selection.
  const endLineStart = source.indexOf('\n', selEnd);
  const blockEnd = endLineStart === -1 ? source.length : endLineStart;
  const block = source.slice(firstLineStart, blockEnd);
  const lines = block.split('\n');

  let added = 0;
  let removed = 0;
  const newLines = lines.map((ln, idx) => {
    if (!shift) {
      if (idx > 0 && ln.trim() === '') return ln; // keep blank lines clean
      added += INDENT.length;
      return INDENT + ln;
    }
    const unit = leadingUnit(ln);
    if (unit) {
      removed += unit.length;
      return ln.slice(unit.length);
    }
    const stripped = ln.replace(/^[ \t]+/, '');
    removed += ln.length - stripped.length;
    return stripped;
  });

  const newBlock = newLines.join('\n');
  const value = source.slice(0, firstLineStart) + newBlock + source.slice(blockEnd);
  const delta = added - removed;
  return {
    value,
    selStart: Math.max(firstLineStart, selStart + delta),
    selEnd: Math.max(firstLineStart, selEnd + delta),
  };
}

/**
 * Handles auto-closing pairs and typing-over/backspacing an auto pair.
 * Returns null when the keystroke should fall through to normal typing.
 */
export function applyAutoClose(
  source: string,
  selStart: number,
  selEnd: number,
  key: string
): { value: string; caret: number } | null {
  const inDeadZone = makeDeadZoneChecker(source);

  // Typing a closer that already sits right after the caret → move past it.
  if (PAIR_CLOSERS.has(key) && source[selEnd] === key && !inDeadZone(selEnd)) {
    return { value: source, caret: selEnd + 1 };
  }

  // Backspace directly between an empty pair → delete both characters.
  if (key === 'Backspace' && selStart === selEnd && selStart > 0) {
    const before = source[selStart - 1];
    const after = source[selStart];
    if (OPEN_TO_CLOSE[before] === after && after !== undefined && !inDeadZone(selStart - 1)) {
      const value = source.slice(0, selStart - 1) + source.slice(selStart + 1);
      return { value, caret: selStart - 1 };
    }
  }

  // Type an opener → insert the matching closer (unless inside a string/comment).
  const close = OPEN_TO_CLOSE[key];
  if (close !== undefined && !inDeadZone(selStart)) {
    const selected = source.slice(selStart, selEnd);
    const value = source.slice(0, selStart) + key + selected + close + source.slice(selEnd);
    return { value, caret: selStart + key.length + selected.length };
  }

  return null;
}

/**
 * Collects every identifier declared via `gene`/`seed` as well as `cum`
 * function names and loop variables from the current editor content.
 * Works on raw text, so suggestions appear even when the program does not
 * parse or run. Duplicates are removed (first occurrence wins).
 */
export function collectCmenVariables(source: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const add = (name: string) => {
    if (name && !seen.has(name) && !CMEN_KEYWORDS.has(name)) {
      seen.add(name);
      names.push(name);
    }
  };

  const declRe = /\b(?:gene|seed)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  const funcRe = /\bcum\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  const growRe = /\bgrow\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;

  let m: RegExpExecArray | null;
  while ((m = declRe.exec(source))) add(m[1]);
  while ((m = funcRe.exec(source))) add(m[1]);
  while ((m = growRe.exec(source))) add(m[1]);

  return names;
}

/**
 * Returns autocomplete candidates for the identifier fragment the user is
 * currently typing at the caret, or null when completion does not apply
 * (inside strings/comments, no fragment, or nothing matches).
 */
export function getCompletions(
  source: string,
  caret: number,
  variables: string[]
): { list: string[]; wordStart: number; wordEnd: number } | null {
  if (makeDeadZoneChecker(source)(caret)) return null;

  const before = source.slice(0, caret);
  const match = /[A-Za-z_][A-Za-z0-9_]*$/.exec(before);
  if (!match) return null;
  const word = match[0];
  if (word.length < 1) return null;

  const wordStart = caret - word.length;
  const lowered = word.toLowerCase();
  const pool = [...variables, ...CMEN_BUILTINS.filter((b) => !variables.includes(b))];
  const list = pool
    .filter((name) => name !== word && name.toLowerCase().startsWith(lowered))
    .slice(0, 8);

  if (list.length === 0) return null;
  return { list, wordStart, wordEnd: caret };
}
