import React, { useState } from 'react';
import {
  BookOpen,
  Play,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CMEN_DOCS } from '../data/docs';
import { highlightCmenCode } from '../interpreter';

interface DocumentationProps {
  onLoadInPlayground: (code: string) => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onLoadInPlayground }) => {
  const [activeDocId, setActiveDocId] = useState<string>(CMEN_DOCS[0].id);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const activeDoc = CMEN_DOCS.find((d) => d.id === activeDocId) || CMEN_DOCS[0];

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Group documentation into categories
  const categories = Array.from(new Set(CMEN_DOCS.map((d) => d.category)));

  return (
    <section
      id="docs"
      className="border-b py-16 sm:py-20"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Technical Manual
            </span>
            <span
              className="rounded px-2 py-0.5 font-mono text-[10px] font-medium border"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              Specification v0.0.1
            </span>
          </div>
          <h2
            className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Language Documentation
          </h2>
          <p
            className="mt-2 text-base leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            A definitive reference covering lexical analysis, evaluation rules, and runtime ergonomics.
          </p>
        </div>

        {/* Mobile Category / Topic Selector (Visible on small screens) */}
        <div className="lg:hidden mb-6">
          <label htmlFor="mobile-docs-select" className="sr-only">
            Select documentation section
          </label>
          <div className="relative">
            <select
              id="mobile-docs-select"
              value={activeDocId}
              onChange={(e) => setActiveDocId(e.target.value)}
              className="w-full rounded-lg border p-3 font-medium text-sm shadow-xs appearance-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              {CMEN_DOCS.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.category}: {doc.title}
                </option>
              ))}
            </select>
            <ChevronRight
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        {/* Documentation Layout: Desktop Sidebar + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <div
              className="rounded-xl border p-4 shadow-2xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2 pb-3 mb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Table of Contents
                </span>
              </div>

              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category} className="space-y-1">
                    <div
                      className="px-2 font-mono text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {category}
                    </div>
                    <div className="space-y-0.5">
                      {CMEN_DOCS.filter((d) => d.category === category).map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setActiveDocId(doc.id)}
                          className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors text-left ${
                            activeDocId === doc.id
                              ? 'font-semibold'
                              : 'hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: activeDocId === doc.id ? 'var(--bg-surface-elevated)' : 'transparent',
                            color: activeDocId === doc.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderLeft: activeDocId === doc.id ? '2px solid var(--accent-tint)' : '2px solid transparent',
                          }}
                        >
                          <span className="truncate">{doc.title}</span>
                          {activeDocId === doc.id && (
                            <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Article Content */}
          <main
            className="lg:col-span-8 rounded-xl border p-6 sm:p-8 shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            {/* Topic Category Tag */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="font-mono text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400"
              >
                {activeDoc.category}
              </span>
            </div>

            {/* Document Title & Summary */}
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              {activeDoc.title}
            </h1>

            <p
              className="text-base sm:text-lg leading-relaxed mb-6 font-normal"
              style={{ color: 'var(--text-secondary)' }}
            >
              {activeDoc.summary}
            </p>

            {/* Structured Text Content with Markdown-style formatting */}
            <div
              className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4 border-t pt-6"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {activeDoc.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      className="text-lg font-bold tracking-tight mt-6 mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }

                if (paragraph.startsWith('> ')) {
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border-l-4 border-blue-500 p-4 my-4 font-mono text-xs leading-relaxed"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {paragraph.replace(/^>\s*/gm, '')}
                    </div>
                  );
                }

                if (paragraph.startsWith('| ')) {
                  // Table rendering
                  const rows = paragraph.trim().split('\n');
                  const headerCols = rows[0].split('|').filter(Boolean).map((s) => s.trim());
                  const bodyRows = rows.slice(2).map((r) => r.split('|').filter(Boolean).map((s) => s.trim()));

                  return (
                    <div key={idx} className="my-6 overflow-x-auto">
                      <table className="w-full border-collapse text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b" style={{ borderColor: 'var(--border-strong)' }}>
                            {headerCols.map((col, cIdx) => (
                              <th key={cIdx} className="py-2.5 px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bodyRows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="py-2 px-3" style={{ color: 'var(--text-secondary)' }}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n');
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1 my-3 text-sm">
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx}>
                          {item.replace(/^(\d+\.\s*|-\s*)/, '')}
                        </li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p key={idx} className="leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Embedded Executable Code Snippet if applicable */}
            {activeDoc.codeSnippet && (
              <div className="mt-8">
                <div
                  className="rounded-xl border overflow-hidden shadow-xs"
                  style={{
                    backgroundColor: 'var(--editor-bg)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <div
                    className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-mono"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span className="font-semibold text-blue-500">
                      example_{activeDoc.id}.cmen
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopySnippet(activeDoc.codeSnippet!)}
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                        title="Copy code snippet"
                      >
                        {copiedSnippet ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
                      </button>

                      {activeDoc.runnable && (
                        <button
                          onClick={() => onLoadInPlayground(activeDoc.codeSnippet!)}
                          className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors"
                          title="Load directly into Playground"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Run in Playground</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
                    <pre
                      dangerouslySetInnerHTML={{
                        __html: highlightCmenCode(activeDoc.codeSnippet),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
};
