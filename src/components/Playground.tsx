import React, { useState, useEffect, useRef } from 'react';
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

  // Tab key indent handler
  const handleKeyDownInTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
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
