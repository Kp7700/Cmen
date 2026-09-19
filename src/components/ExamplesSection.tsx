import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, FileCode2 } from 'lucide-react';
import { CMEN_EXAMPLES } from '../data/examples';
import { highlightCmenCode } from '../interpreter';

interface ExamplesSectionProps {
  onLoadExample: (code: string) => void;
}

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({ onLoadExample }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section
      id="examples"
      className="border-b py-16 sm:py-20"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Specimen Library
          </span>
          <h2
            className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Example Programs
          </h2>
          <p
            className="mt-2 text-base leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Curated code specimens showcasing fundamental language capabilities, from initial conception to generational iteration.
          </p>
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CMEN_EXAMPLES.map((example) => (
            <div
              key={example.id}
              className="flex flex-col rounded-xl border shadow-xs overflow-hidden transition-all hover:shadow-sm"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
              }}
            >
              {/* Card Header */}
              <div
                className="flex items-center justify-between border-b px-4 py-3 text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {example.title}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-mono border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {example.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(example.id, example.code)}
                    className="p-1.5 rounded hover:opacity-80 transition-opacity"
                    title="Copy code"
                    aria-label={`Copy ${example.title} code`}
                  >
                    {copiedId === example.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>

                  <button
                    onClick={() => onLoadExample(example.code)}
                    className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    <span>Try</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {example.description}
              </div>

              {/* Code Snippet */}
              <div
                className="p-4 font-mono text-xs leading-relaxed border-t overflow-x-auto flex-1"
                style={{
                  backgroundColor: 'var(--editor-bg)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <pre
                  dangerouslySetInnerHTML={{
                    __html: highlightCmenCode(example.code),
                  }}
                />
              </div>

              {/* Expected Output Preview */}
              <div
                className="border-t px-4 py-2.5 font-mono text-[11px]"
                style={{
                  backgroundColor: 'var(--console-bg)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  <Terminal className="h-3 w-3 text-emerald-500" />
                  <span>Expected Output</span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-mono whitespace-pre-wrap pl-2 border-l border-emerald-500/40">
                  {example.expectedOutput}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
