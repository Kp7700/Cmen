import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Variable,
  FunctionSquare,
} from 'lucide-react';
import { CMEN_EXAMPLES } from '../data/examples';
import { runCmen, highlightCmenCode } from '../interpreter';
import { ExecutionResult } from '../types';
import {
  applyAutoIndent,
  applyAutoClose,
  applyTab,
  collectCmenVariables,
  getCompletions,
} from '../lib/editor';

interface PlaygroundProps {
  initialCode?: string;
}

interface CompletionState {
  list: string[];
  wordStart: number;
  wordEnd: number;
  index: number;
  top: number;
  left: number;
}

const OPENERS = new Set(['(', '{', '[', '"', "'"]);
const CLOSERS = new Set([')', '}', ']', '"', "'"]);

/** Measures the width of one monospace character inside the editor font. */
let charWidthCache: { key: string; width: number } | null = null;

export const Playground: React.FC<PlaygroundProps> = ({ initialCode }) => {
  const [selectedExampleId, setSelectedExampleId] = useState<string>('hello-world');
  const [code, setCode] = useState<string>(
    initialCode || CMEN_EXAMPLES[0].code
  );
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [completion, setCompletion] = useState<CompletionState | null>(null);

  // Synchronize initial code if passed from Hero
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  // Close the suggestion popup whenever the loaded program changes wholesale.
  useEffect(() => {
    setCompletion(null);
  }, [initialCode, selectedExampleId]);

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

  /**
   * Applies an edit produced by one of the editor helpers (auto-indent,
   * auto-close, tab, completion accept) and restores the exact caret/selection.
   * The replacement is done through the textarea itself so that native browser
   * undo/redo keeps working; React state then mirrors the same value.
   */
  const applyEditorEdit = useCallback(
    (nextValue: string, selStart: number, selEnd: number, keepPopupOpen = false) => {
      const ta = textareaRef.current;
      if (ta && ta.value !== nextValue) {
        try {
          // Replace the whole buffer via the editing API (undo-friendly).
          ta.setSelectionRange(0, ta.value.length);
          document.execCommand('insertText', false, nextValue);
        } catch {
          /* execCommand unavailable — fall back to direct assignment below */
        }
        if (ta.value !== nextValue) ta.value = nextValue;
      }
      if (ta) {
        ta.focus();
        ta.setSelectionRange(selStart, selEnd);
        handleScroll();
      }
      setCode(nextValue);
      if (!keepPopupOpen) setCompletion(null);
      // Suggestions track every edit, including Enter/Tab/backspace edits.
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        refreshCompletionsRef.current(nextValue, el ? el.selectionStart : selStart);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /**
   * Surgical single-character edit applied directly at the selection range —
   * used for auto-close/type-over/backspace-pair so plain typing stays a
   * native, fully undoable textarea operation (no full-buffer rewrite).
   */
  const applyLocalEdit = useCallback(
    (nextValue: string, caret: number) => {
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        try {
          document.execCommand('insertText', false, nextValue.slice(start, caret));
        } catch {
          /* ignore — fall back below */
        }
        if (ta.value !== nextValue) {
          ta.value = nextValue;
        }
        ta.focus();
        ta.setSelectionRange(caret, caret);
        handleScroll();
      }
      setCode(nextValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /** Measures the width of one monospace character inside the editor font. */
  const measureCharWidth = useCallback((el: HTMLElement, fontSize: number): number => {
    const fontFamily = window.getComputedStyle(el).fontFamily;
    const key = `${fontFamily}|${fontSize}`;
    if (charWidthCache && charWidthCache.key === key) return charWidthCache.width;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = fontSize * 0.6;
    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const m = ctx.measureText('M');
      if (m && m.width > 0) width = m.width;
    }
    charWidthCache = { key, width };
    return width;
  }, []);

  /** Recomputes (or closes) the variable suggestion popup for the current caret. */
  const refreshCompletions = useCallback((value: string, caret: number) => {
    const comps = getCompletions(value, caret, collectCmenVariables(value));
    if (!comps) {
      setCompletion(null);
      return;
    }
    const ta = textareaRef.current;
    let top = 0;
    let left = 0;
    if (ta) {
      const style = window.getComputedStyle(ta);
      const fontSize = parseFloat(style.fontSize) || 14;
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;
      const charWidth = measureCharWidth(ta, fontSize);

      const textBefore = value.slice(0, caret);
      const newlineCount = (textBefore.match(/\n/g) || []).length;
      const lastNewline = textBefore.lastIndexOf('\n');
      const col = caret - (lastNewline + 1);

      const padTop = parseFloat(style.paddingTop) || 0;
      const padLeft = parseFloat(style.paddingLeft) || 0;

      const rawTop = padTop + newlineCount * lineHeight - ta.scrollTop + lineHeight + 2;
      const rawLeft = padLeft + col * charWidth - ta.scrollLeft;

      const wrap = editorWrapRef.current;
      const maxW = wrap ? wrap.clientWidth : ta.clientWidth;
      const maxH = wrap ? wrap.clientHeight : ta.clientHeight;
      const popupW = 208; // w-52
      const popupH = Math.min(comps.list.length, 6) * 30 + 8;

      top = Math.min(rawTop, maxH - popupH - 4);
      if (top < 2) top = 2;
      left = Math.min(Math.max(rawLeft, 2), Math.max(2, maxW - popupW - 4));
    }
    setCompletion((prev) => ({
      list: comps.list,
      wordStart: comps.wordStart,
      wordEnd: comps.wordEnd,
      index: prev && prev.wordStart === comps.wordStart && prev.index < comps.list.length
        ? prev.index
        : 0,
      top,
      left,
    }));
  }, []);

  /** Accepts the highlighted suggestion, replacing only the typed fragment. */
  const acceptCompletion = useCallback(
    (state: CompletionState) => {
      const chosen = state.list[state.index];
      if (!chosen) {
        setCompletion(null);
        return;
      }
      const nextValue = code.slice(0, state.wordStart) + chosen + code.slice(state.wordEnd);
      const caret = state.wordStart + chosen.length;
      applyEditorEdit(nextValue, caret, caret, true);
      refreshCompletions(nextValue, caret);
    },
    [code, applyEditorEdit, refreshCompletions]
  );

  // Tab key indent handler + auto-closing pairs + auto-indent + autocomplete
  const handleKeyDownInTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    // --- Autocomplete navigation takes priority when the popup is open ---
    if (completion) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = (completion.index + 1) % completion.list.length;
        setCompletion({ ...completion, index: idx });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const idx =
          (completion.index - 1 + completion.list.length) % completion.list.length;
        setCompletion({ ...completion, index: idx });
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        // Let Ctrl/Cmd+Enter keep running the program.
        if (!(e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
          e.preventDefault();
          acceptCompletion(completion);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setCompletion(null);
        return;
      }
    }

    // --- Tab / Shift+Tab indentation (never moves focus away) ---
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const res = applyTab(code, start, end, e.shiftKey);
      if (res) applyEditorEdit(res.value, res.selStart, res.selEnd);
      return;
    }

    // --- Enter: auto indent ---
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const res = applyAutoIndent(code, start, end);
      if (res) {
        e.preventDefault();
        applyEditorEdit(res.value, res.caret, res.caret);
      }
      return;
    }

    // --- Brackets & quotes: auto-close / type-over ---
    if (
      (OPENERS.has(e.key) || CLOSERS.has(e.key)) &&
      !e.ctrlKey && !e.metaKey && !e.altKey
    ) {
      const res = applyAutoClose(code, start, end, e.key);
      if (res) {
        e.preventDefault();
        if (res.value === code) {
          // Typing over an existing closer: just move the caret past it.
          const ta = e.currentTarget;
          ta.setSelectionRange(res.caret, res.caret);
          setCompletion(null);
        } else {
          applyLocalEdit(res.value, res.caret);
        }
        return;
      }
    }

    // --- Backspace between an auto-generated empty pair: delete both sides ---
    if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey && start === end) {
      const res = applyAutoClose(code, start, end, e.key);
      if (res) {
        e.preventDefault();
        applyEditorEdit(res.value, res.caret, res.caret, true);
        return;
      }
    }
  };

  // After each edit settles, update suggestions from the new caret position.
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCode(value);
    if (completion) setCompletion(null);
    // Defer until the DOM reflects the new value so measurement is accurate.
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      refreshCompletions(value, ta ? ta.selectionStart : e.target.selectionEnd);
    });
  };

  // Caret movement (clicks / arrows without typing) also refreshes suggestions.
  const handleTextareaSelect = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (ta.selectionStart !== ta.selectionEnd) {
      setCompletion(null);
      return;
    }
    refreshCompletions(ta.value, ta.selectionStart);
  };

  const closeCompletionOnBlur = () => {
    // Small delay so clicks on the popup still register before closing.
    setTimeout(() => {
      const ta = textareaRef.current;
      const popup = popupRef.current;
      if (document.activeElement !== ta && !(popup && popup.contains(document.activeElement))) {
        setCompletion(null);
      }
    }, 120);
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
              <div ref={editorWrapRef} className="relative flex-1 h-full overflow-hidden">
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
                  onChange={handleCodeChange}
                  onScroll={() => {
                    handleScroll();
                    if (completion) refreshCompletions(code, textareaRef.current?.selectionStart ?? 0);
                  }}
                  onKeyDown={handleKeyDownInTextarea}
                  onSelect={handleTextareaSelect}
                  onBlur={closeCompletionOnBlur}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  data-gramm="false"
                  className="absolute inset-0 m-0 w-full h-full resize-none border-none p-3.5 font-mono text-sm leading-6 bg-transparent text-transparent caret-blue-500 focus:outline-none whitespace-pre tab-4"
                  style={{
                    caretColor: 'var(--accent-tint)',
                  }}
                  aria-label="Cmen source code editor"
                  aria-expanded={completion ? true : undefined}
                  aria-autocomplete="list"
                />

                {/* Variable suggestion popup (matches editor theming) */}
                {completion && (
                  <div
                    ref={popupRef}
                    role="listbox"
                    aria-label="Variable suggestions"
                    className="absolute z-20 w-52 max-w-[calc(100%-8px)] rounded-lg border shadow-lg overflow-hidden"
                    style={{
                      top: `${completion.top}px`,
                      left: `${completion.left}px`,
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-strong)',
                    }}
                  >
                    <div
                      className="max-h-[180px] overflow-y-auto py-1"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {completion.list.map((name, idx) => (
                        <button
                          key={name}
                          type="button"
                          role="option"
                          aria-selected={idx === completion.index}
                          onMouseEnter={() => setCompletion({ ...completion, index: idx })}
                          onClick={() => acceptCompletion({ ...completion, index: idx })}
                          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left font-mono text-xs leading-4 transition-colors"
                          style={{
                            backgroundColor:
                              idx === completion.index ? 'var(--accent-glow)' : 'transparent',
                            color:
                              idx === completion.index
                                ? 'var(--text-primary)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {/^(ejaculate|length|text|number)$/.test(name) ? (
                            <FunctionSquare className="h-3 w-3 shrink-0 text-sky-500" />
                          ) : (
                            <Variable className="h-3 w-3 shrink-0 text-violet-500" />
                          )}
                          <span className="truncate">{name}</span>
                        </button>
                      ))}
                    </div>
                    <div
                      className="hidden sm:flex items-center justify-between border-t px-2.5 py-1 text-[10px] font-mono"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    >
                      <span>↑↓ navigate</span>
                      <span>Tab/Enter accept · Esc close</span>
                    </div>
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
