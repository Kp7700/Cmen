import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  Terminal,
} from 'lucide-react';
import { CMEN_EXAMPLES } from '../data/examples';
import { runCmen, highlightCmenCode } from '../interpreter';
import { ExecutionResult } from '../types';

interface PlaygroundProps {
  initialCode?: string;
}

/* ------------------------------------------------------------------ */
/* Editor assist helpers (smart indentation, auto-close pairs,         */
/* autocomplete). These are typing-only aids and do not affect the     */
/* Cmen syntax or the interpreter.                                      */
/* ------------------------------------------------------------------ */

const CMEN_INDENT_UNIT = '    '; // matches the editor's tab-4 rendering

// Keywords taken verbatim from the lexer's KEYWORDS set…
const CMEN_KEYWORDS = [
  'cum', 'gene', 'seed', 'mutate', 'grow', 'when', 'otherwise', 'release',
  'die', 'mate', 'from', 'to', 'and', 'or', 'not', 'true', 'false',
];
// …plus built-in functions recognized by the evaluator.
const CMEN_BUILTINS = ['ejaculate', 'length', 'text', 'number'];

const PAIR_OPEN_TO_CLOSE: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const PAIR_CLOSE_TO_OPEN: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const QUOTES = ['"', "'"];

/** Compute the indentation a line should have, based on the code above it. */
function computeLineIndent(textUpToNewline: string): string {
  const lines = textUpToNewline.split('\n');
  const prevLine = lines[lines.length - 1] || '';
  const prevTrimmed = prevLine.trim();

  let depth = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (/^[}\])]/.test(l)) depth--;
    const opens = (l.match(/[{\[(]/g) || []).length;
    const closes = (l.match(/[}\])]/g) || []).length;
    depth += opens - closes;
  }
  if (depth < 0) depth = 0;
  if (/^[}\])]/.test(prevTrimmed)) depth--;
  if (depth < 0) depth = 0;
  return CMEN_INDENT_UNIT.repeat(depth);
}

/** Extract declared identifiers (gene/seed/mutate/grow loop vars) and function names. */
function extractCmenIdentifiers(src: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /\b(?:gene|seed|mutate)\s+([A-Za-z_][A-Za-z0-9_]*)/g,
    /\bcum\s+([A-Za-z_][A-Za-z0-9_]*)/g,
    /\bgrow\s+([A-Za-z_][A-Za-z0-9_]*)\s+(?:from\s+[^{]+\s+)?to\b/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) names.add(m[1]);
  }
  return Array.from(names);
}

export const Playground: React.FC<PlaygroundProps> = ({ initialCode }) => {
  const [selectedExampleId, setSelectedExampleId] = useState<string>('hello-world');
  const [code, setCode] = useState<string>(
    initialCode || CMEN_EXAMPLES[0].code
  );
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestStart, setSuggestStart] = useState(-1);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const suggestionsRef = useRef<string[]>([]);
  suggestionsRef.current = suggestions;
  const suggestStartRef = useRef(-1);
  suggestStartRef.current = suggestStart;
  const [caretPos, setCaretPos] = useState({ top: 0, left: 0 });

  const activeSuggestionRef = useRef(0);
  activeSuggestionRef.current = activeSuggestion;

  // Reset the suggestion popup whenever the code is replaced wholesale
  // (example selection, reset button, Hero handoff).
  useEffect(() => {
    setSuggestions([]);
    setSuggestStart(-1);
    setActiveSuggestion(0);
  }, [code]);

  // Synchronize initial code if passed from Hero
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Run on Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code]);

  // Synchronize scroll between textarea, syntax highlight pre, and line numbers
  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const execResult = runCmen(code);
      setResult(execResult);
      setIsRunning(false);
    }, 60);
  };

  const handleSelectExample = (id: string) => {
    setSelectedExampleId(id);
    const ex = CMEN_EXAMPLES.find((e) => e.id === id);
    if (ex) {
      setCode(ex.code);
      setResult(null);
      showToast(`Loaded example: ${ex.title}`);
    }
  };

  const handleReset = () => {
    const ex = CMEN_EXAMPLES.find((e) => e.id === selectedExampleId) || CMEN_EXAMPLES[0];
    setCode(ex.code);
    setResult(null);
    showToast('Restored example default');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearConsole = () => {
    setResult(null);
    showToast('Console cleared');
  };

  // Compute line count
  const lineCount = Math.max(code.split('\n').length, 1);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Tab key indent handler + smart indentation, auto-closing pairs & autocomplete
  const hideSuggestions = () => {
    setSuggestions([]);
    setSuggestStart(-1);
    setActiveSuggestion(0);
  };

  /** Update the visible suggestion list from the current word prefix. */
  const refreshSuggestions = useCallback((src: string, caret: number) => {
    let s = caret;
    while (s > 0 && /[A-Za-z0-9_]/.test(src[s - 1])) s--;
    const word = src.slice(s, caret);
    if (!word) {
      hideSuggestions();
      return;
    }
    const lower = word.toLowerCase();
    const vars = extractCmenIdentifiers(src).filter((v) => v !== word);
    const pool = [
      ...vars,
      ...CMEN_KEYWORDS.filter((k) => k !== word),
      ...CMEN_BUILTINS.filter((b) => b !== word),
    ];
    const seen = new Set<string>();
    const matches = pool
      .filter((n) => n.toLowerCase().startsWith(lower) && !seen.has(n) && seen.add(n))
      .slice(0, 8);
    setSuggestions(matches);
    setSuggestStart(matches.length ? s : -1);
    setActiveSuggestion(0);
  }, []);

  /** Apply a text edit and restore the caret after React re-renders. */
  const applyEdit = (next: string, selStart: number, selEnd: number) => {
    pendingSelectionRef.current = { start: selStart, end: selEnd };
    setCode(next);
  };

  const acceptSuggestion = (idx?: number) => {
    const target = textareaRef.current;
    const list = suggestionsRef.current;
    const sStart = suggestStartRef.current;
    if (!target || list.length === 0 || sStart < 0) return false;
    const caret = target.selectionStart;
    const chosen = list[Math.min(idx ?? activeSuggestionRef.current, list.length - 1)];
    const next = code.slice(0, sStart) + chosen + code.slice(caret);
    const newCaret = sStart + chosen.length;
    applyEdit(next, newCaret, newCaret);
    hideSuggestions();
    return true;
  };

  /** Mirror the textarea caret position into an overlay div to place the suggestion popup. */
  const updateCaretPos = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    let mirror = document.getElementById('cmen-caret-mirror') as HTMLDivElement | null;
    if (!mirror) {
      mirror = document.createElement('div');
      mirror.id = 'cmen-caret-mirror';
      mirror.style.position = 'absolute';
      mirror.style.visibility = 'hidden';
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.wordWrap = 'break-word';
      mirror.style.overflow = 'hidden';
      document.body.appendChild(mirror);
    }
    const cs = window.getComputedStyle(ta);
    (['fontFamily', 'fontSize', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'tabSize'] as const).forEach((prop) => {
      // @ts-ignore – index into CSSStyleDeclaration by name
      mirror.style[prop] = cs[prop];
    });
    mirror.style.width = `${ta.clientWidth}px`;
    const pos = ta.selectionStart ?? 0;
    // Measure only up to the caret's line so earlier long lines cannot shift
    // the popup horizontally (the editor itself does not wrap).
    const textBeforeCaret = ta.value.slice(0, pos);
    const lastNl = textBeforeCaret.lastIndexOf('\n');
    mirror.textContent = lastNl === -1 ? textBeforeCaret : textBeforeCaret.slice(lastNl + 1);
    const span = document.createElement('span');
    span.textContent = '\u200b';
    mirror.appendChild(span);
    const lineNo = (textBeforeCaret.match(/\n/g) || []).length;
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 24;
    setCaretPos({ top: lineNo * lh, left: span.offsetLeft });
  }, []);

  const handleKeyDownInTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const hasSug = suggestions.length > 0;

    // Autocomplete navigation / acceptance
    if (hasSug) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        acceptSuggestion();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        hideSuggestions();
        return;
      }
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const hasSel = start !== end;

    // Enter -> smart indentation (compute indent from code above the caret)
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const before = code.slice(lineStart, start);
      const nextNl = code.indexOf('\n', start);
      const after = code.slice(start, nextNl === -1 ? code.length : nextNl);
      const trailingWs = after.match(/^\s*/)?.[0] ?? '';
      // Indent level derived only from the lines strictly above the caret's line
      const textAbove = code.slice(0, lineStart);
      let indent = computeLineIndent(textAbove + before.trimEnd());
      // Pressing Enter right before a closing brace: current line keeps its
      // dedented position and the new line gets one extra level.
      if (/^[}\])]/.test(after.trimStart()) && before.trim() === '') {
        indent = indent === '' ? '' : indent.slice(0, -CMEN_INDENT_UNIT.length);
      }
      const rest = code.slice(start + trailingWs.length);
      const insertion = '\n' + indent;
      applyEdit(code.slice(0, start) + insertion + rest, start + insertion.length, start + insertion.length);
      hideSuggestions();
      return;
    }

    // Closing bracket/quote -> skip over an existing one instead of duplicating
    if (PAIR_CLOSE_TO_OPEN[e.key] || QUOTES.includes(e.key)) {
      if (!hasSel && code[start] === e.key) {
        e.preventDefault();
        applyEdit(code, start + 1, start + 1);
        hideSuggestions();
        return;
      }
      if (QUOTES.includes(e.key) && !hasSel) {
        const prev = start > 0 ? code[start - 1] : '';
        // Only auto-pair outside identifiers/numbers/closing brackets;
        // otherwise treat it as a closing quote and let native typing happen.
        if (!/[A-Za-z0-9_)\]}]/.test(prev)) {
          e.preventDefault();
          const newText = code.slice(0, start) + e.key + e.key + code.slice(end);
          applyEdit(newText, start + 1, start + 1);
          hideSuggestions();
          return;
        }
      }
      return; // plain close with no matching char ahead -> native typing
    }

    // Opening bracket -> auto-close (empty pair, caret stays between the chars)
    if (PAIR_OPEN_TO_CLOSE[e.key]) {
      e.preventDefault();
      const close = PAIR_OPEN_TO_CLOSE[e.key];
      const newText = code.slice(0, start) + e.key + close + code.slice(end);
      applyEdit(newText, start + 1, start + 1);
      hideSuggestions();
      return;
    }

    // Tab -> manual indent (existing behavior)
    if (e.key === 'Tab') {
      e.preventDefault();
      const newCode = code.substring(0, start) + CMEN_INDENT_UNIT + code.substring(end);
      applyEdit(newCode, start + CMEN_INDENT_UNIT.length, start + CMEN_INDENT_UNIT.length);
      hideSuggestions();
      return;
    }

    // Backspace -> delete an empty auto-created pair sensibly
    if (e.key === 'Backspace' && !hasSel && start > 0) {
      const prev = code[start - 1];
      const next = code[start] || '';
      const isEmptyPair =
        (PAIR_OPEN_TO_CLOSE[prev] === next) || (QUOTES.includes(prev) && prev === next);
      if (isEmptyPair) {
        e.preventDefault();
        const newText = code.slice(0, start - 1) + code.slice(start + 1);
        applyEdit(newText, start - 1, start - 1);
        refreshSuggestions(newText, start - 1);
        return;
      }
      // Deleting typed indentation on a fresh line -> remove up to previous tab stop
      const lineStart = code.lastIndexOf('\n', start - 1) + 1;
      const beforeCursor = code.slice(lineStart, start);
      if (/^\s+$/.test(beforeCursor) && beforeCursor.length % CMEN_INDENT_UNIT.length === 0) {
        e.preventDefault();
        const newText = code.slice(0, start - CMEN_INDENT_UNIT.length) + code.slice(start);
        applyEdit(newText, start - CMEN_INDENT_UNIT.length, start - CMEN_INDENT_UNIT.length);
        refreshSuggestions(newText, start - CMEN_INDENT_UNIT.length);
        return;
      }
    }
  };

  // Keep caret position after programmatic edits applied through state
  useLayoutEffect(() => {
    if (pendingSelectionRef.current && textareaRef.current) {
      const { start, end } = pendingSelectionRef.current;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      pendingSelectionRef.current = null;
    }
    updateCaretPos();
  }, [code, updateCaretPos]);

  // Native input events (typing/paste) -> live suggestion updates
  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    refreshSuggestions(target.value, target.selectionStart);
    updateCaretPos();
  };

  const handleTextareaSelectChange = () => {
    const target = textareaRef.current;
    if (!target) return;
    if (target.selectionStart !== target.selectionEnd) hideSuggestions();
  };

  return (
    <section
      id="playground"
      className="border-b py-16 sm:py-20"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Playground Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Interactive Environment
              </span>
              <span
                className="rounded px-2 py-0.5 font-mono text-[10px] font-medium border"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                Local AST Interpreter
              </span>
            </div>
            <h2
              className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Cmen Playground
            </h2>
            <p
              className="mt-1.5 text-sm sm:text-base"
              style={{ color: 'var(--text-secondary)' }}
            >
              Compose, inspect, and evaluate programs with immediate console release.
            </p>
          </div>

          {/* Example Selector Dropdown & Quick Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <select
                id="example-selector-dropdown"
                value={selectedExampleId}
                onChange={(e) => handleSelectExample(e.target.value)}
                className="h-10 rounded-lg border pl-3 pr-9 text-xs font-medium appearance-none shadow-xs transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
                aria-label="Select Cmen example program"
              >
                {CMEN_EXAMPLES.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.category})
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>

            <button
              id="playground-reset-btn"
              onClick={handleReset}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-secondary)',
              }}
              title="Reset to selected example code"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              id="playground-copy-btn"
              onClick={handleCopyCode}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-secondary)',
              }}
              title="Copy code to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              id="playground-run-btn"
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 min-w-[100px]"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{isRunning ? 'Running...' : 'Run Program'}</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className="mb-4 rounded-lg border px-3.5 py-2 text-xs font-medium flex items-center gap-2 animate-in fade-in"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Playground Split Grid (Editor Left, Output Right / Stacked on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Editor Container */}
          <div
            className="lg:col-span-7 flex flex-col rounded-xl border shadow-sm overflow-hidden"
            style={{
              backgroundColor: 'var(--editor-bg)',
              borderColor: 'var(--border-strong)',
            }}
          >
            {/* Editor Bar */}
            <div
              className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-mono"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-500">cmen-editor</span>
                <span style={{ color: 'var(--text-muted)' }}>—</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {CMEN_EXAMPLES.find((e) => e.id === selectedExampleId)?.title || 'Custom Script'}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <kbd className="rounded border px-1.5 py-0.5 text-[10px]" style={{ borderColor: 'var(--border-strong)' }}>
                  Ctrl
                </kbd>
                +
                <kbd className="rounded border px-1.5 py-0.5 text-[10px]" style={{ borderColor: 'var(--border-strong)' }}>
                  Enter
                </kbd>
                <span>to run</span>
              </div>
            </div>

            {/* Code Editor Body with Line Numbers and Synced Highlight Overlay */}
            <div className="relative flex h-[380px] sm:h-[450px] font-mono text-sm leading-6 overflow-hidden">
              {/* Line Numbers Gutter */}
              <div
                ref={lineNumbersRef}
                className="select-none py-3.5 pl-3 pr-2 text-right text-xs overflow-hidden border-r font-mono min-w-[42px]"
                style={{
                  backgroundColor: 'var(--editor-gutter)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
                aria-hidden="true"
              >
                {lineNumbers.map((num) => (
                  <div key={num} className="leading-6">
                    {num}
                  </div>
                ))}
              </div>

              {/* Editable Area with Highlight Overlay */}
              <div className="relative flex-1 h-full overflow-hidden">
                {/* Syntax-highlighted HTML rendering behind */}
                <pre
                  ref={preRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 m-0 p-3.5 font-mono text-sm leading-6 overflow-hidden whitespace-pre tab-4"
                  style={{ color: 'var(--editor-text)' }}
                  dangerouslySetInnerHTML={{
                    __html: highlightCmenCode(code) + '\n',
                  }}
                />

                {/* Actual transparent textarea in front receiving keystrokes */}
                <textarea
                  id="cmen-playground-textarea"
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onInput={handleTextareaInput}
                  onSelect={handleTextareaSelectChange}
                  onBlur={() => hideSuggestions()}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDownInTextarea}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  className="absolute inset-0 m-0 w-full h-full resize-none border-none p-3.5 font-mono text-sm leading-6 bg-transparent text-transparent caret-blue-500 focus:outline-none whitespace-pre tab-4"
                  style={{
                    caretColor: 'var(--accent-tint)',
                  }}
                  aria-label="Cmen source code editor"
                />

                {/* Autocomplete suggestion popup (typing aid only) */}
                {suggestions.length > 0 && (
                  <div
                    id="cmen-autocomplete-popup"
                    role="listbox"
                    aria-label="Cmen autocomplete suggestions"
                    className="absolute z-20 min-w-[140px] max-h-48 overflow-y-auto rounded-md border py-1 text-xs shadow-lg"
                    style={{
                      top: Math.max(0, caretPos.top - (textareaRef.current?.scrollTop ?? 0)) + 26,
                      left: Math.max(0, caretPos.left - (textareaRef.current?.scrollLeft ?? 0)),
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {suggestions.map((sug, idx) => (
                      <button
                        key={sug}
                        type="button"
                        role="option"
                        aria-selected={idx === activeSuggestion}
                        onClick={() => acceptSuggestion(idx)}
                        className="block w-full px-3 py-1 text-left font-mono whitespace-nowrap"
                        style={{
                          backgroundColor: idx === activeSuggestion ? 'var(--accent-tint)' : 'transparent',
                          color: idx === activeSuggestion ? '#ffffff' : 'var(--text-secondary)',
                          opacity: idx === activeSuggestion ? 1 : 0.9,
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editor Footer / Character Stats */}
            <div
              className="flex items-center justify-between border-t px-4 py-2 text-[11px] font-mono"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <span>{lineCount} lines • {code.length} characters</span>
              <span>UTF-8 • Cmen Syntax</span>
            </div>
          </div>

          {/* Console Output Container */}
          <div
            className="lg:col-span-5 flex flex-col rounded-xl border shadow-sm overflow-hidden h-full min-h-[380px] sm:min-h-[450px]"
            style={{
              backgroundColor: 'var(--console-bg)',
              borderColor: 'var(--border-strong)',
            }}
          >
            {/* Console Header */}
            <div
              className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-mono"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Console Output
                </span>
                {result && (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-medium border ${
                      result.success
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {result.success ? 'Success' : 'Diagnostic Error'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {result && (
                  <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="h-3 w-3" />
                    <span>{result.executionTimeMs}ms</span>
                  </span>
                )}

                <button
                  id="console-clear-btn"
                  onClick={handleClearConsole}
                  className="p-1 rounded hover:opacity-80 transition-opacity"
                  title="Clear console output"
                  aria-label="Clear output console"
                >
                  <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Console Output Body */}
            <div className="flex-1 p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-y-auto min-h-[300px]">
              {!result && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6" style={{ color: 'var(--text-muted)' }}>
                  <Terminal className="h-8 w-8 mb-2 stroke-[1.5] opacity-50" />
                  <p className="font-medium text-sm">Console idle</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Press <span className="font-semibold text-blue-500">Run Program</span> to execute the current Cmen code and observe output.
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-2">
                  {/* Successful Outputs via ejaculate() */}
                  {result.output.length > 0 && (
                    <div className="space-y-1">
                      {result.output.map((line, idx) => (
                        <div
                          key={idx}
                          className="pl-2.5 border-l-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-mono whitespace-pre-wrap break-words"
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Return value note if present */}
                  {result.returnValue && (
                    <div
                      className="rounded border p-2 text-xs font-mono mt-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span className="text-blue-500 font-semibold">Program released:</span>{' '}
                      <code>{result.returnValue}</code>
                    </div>
                  )}

                  {/* Diagnostics / Errors */}
                  {result.errors.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {result.errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-600 dark:text-red-400 font-mono text-xs leading-relaxed"
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                            <div>
                              <div className="font-semibold uppercase tracking-wider text-[11px]">
                                {err.type} Error {err.line ? `[Line ${err.line}]` : ''}
                              </div>
                              <div className="mt-1">{err.message}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty output notice */}
                  {result.output.length === 0 && result.errors.length === 0 && (
                    <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      Execution finished cleanly. Nothing was emitted via ejaculate().
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Console Footer */}
            <div
              className="border-t px-4 py-2 text-[11px] font-mono flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <span>Channel: stdout</span>
              <span>Status: Ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
