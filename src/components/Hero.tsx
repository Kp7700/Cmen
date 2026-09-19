import React, { useState } from 'react';
import { Terminal, BookOpen, Play, Check, Copy, ArrowRight } from 'lucide-react';
import { runCmen } from '../interpreter';

interface HeroProps {
  onOpenPlayground: (initialCode?: string) => void;
  onOpenDocs: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenPlayground, onOpenDocs }) => {
  const heroCode = `cum main {
    ejaculate("Hello, World!");
}`;

  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [heroOutput, setHeroOutput] = useState<string[]>(['Hello, World!']);

  const handleCopy = () => {
    navigator.clipboard.writeText(heroCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunHero = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runCmen(heroCode);
      if (res.success) {
        setHeroOutput(res.output);
      } else {
        setHeroOutput(res.errors.map((e) => `Error: ${e.message}`));
      }
      setIsRunning(false);
    }, 120);
  };

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden border-b py-16 sm:py-24 lg:py-28"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Background Subtle Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left Column: Typography and CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Pronunciation & Version Pill */}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono mb-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-blue-500">Cmen</span>
              <span>/ˈsiːmɛn/</span>
              <span className="text-[10px] text-zinc-400">• v0.0.1 Experimental</span>
            </div>

            {/* Main Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              The language of <br className="hidden sm:inline" />
              <span className="underline decoration-blue-500/40 underline-offset-8">
                questionable evolution.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p
              className="mt-3 text-lg sm:text-xl leading-relaxed max-w-2xl font-normal"
              style={{ color: 'var(--text-secondary)' }}
            >
              A small experimental programming language built for developers who want to
              express themselves at a lower level. Coherent syntax, deterministic execution,
              and biologically inspired nomenclature.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                id="hero-btn-open-playground"
                onClick={() => onOpenPlayground(heroCode)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--bg-canvas)',
                }}
              >
                <Terminal className="h-4 w-4" />
                <span>Open Playground</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-70" />
              </button>

              <button
                id="hero-btn-read-docs"
                onClick={onOpenDocs}
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-all hover:bg-opacity-50 active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                <BookOpen className="h-4 w-4" />
                <span>Read Documentation</span>
              </button>
            </div>

            {/* Subtle Metadata Highlights */}
            <div
              className="mt-10 flex flex-wrap items-center gap-6 text-xs font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-emerald-500">✓</span>
                <span>Zero runtime install</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-emerald-500">✓</span>
                <span>Pure client-side execution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-blue-500">✓</span>
                <span>Unapologetic terminology</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Code & Terminal Preview Card */}
          <div className="lg:col-span-5 w-full">
            <div
              className="w-full rounded-xl border shadow-md overflow-hidden transition-all"
              style={{
                backgroundColor: 'var(--editor-bg)',
                borderColor: 'var(--border-strong)',
              }}
            >
              {/* Window Header */}
              <div
                className="flex items-center justify-between border-b px-4 py-2.5 text-xs font-mono"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    main.cmen
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    title="Copy code"
                    aria-label="Copy code snippet"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                  <button
                    onClick={handleRunHero}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    <span>{isRunning ? 'Running...' : 'Run'}</span>
                  </button>
                </div>
              </div>

              {/* Code Area */}
              <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
                <div className="flex">
                  <div
                    className="select-none pr-4 text-right text-xs"
                    style={{ color: 'var(--text-muted)' }}
                    aria-hidden="true"
                  >
                    1<br />2<br />3
                  </div>
                  <div className="flex-1">
                    <span className="token-keyword font-semibold">cum</span>{' '}
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>main</span>{' '}&#123;
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="token-builtin font-semibold">ejaculate</span>
                    (&quot;<span className="token-string">Hello, World!</span>&quot;);
                    <br />
                    &#125;
                  </div>
                </div>
              </div>

              {/* Terminal Output Area */}
              <div
                className="border-t px-4 py-3 font-mono text-xs"
                style={{
                  backgroundColor: 'var(--console-bg)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Terminal className="h-3 w-3" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider">
                    Terminal Release (stdout)
                  </span>
                </div>
                <div className="pl-2 border-l-2 border-emerald-500 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {heroOutput.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
