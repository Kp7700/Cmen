import React from 'react';
import { Microscope, HelpCircle, CheckCircle2 } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="border-b py-16 sm:py-20"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Philosophical Overview */}
          <div className="lg:col-span-7">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Project Statement
            </span>
            <h2
              className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              About Cmen
            </h2>

            <blockquote
              className="mt-4 rounded-xl border-l-4 border-blue-500 p-4 font-sans text-base sm:text-lg italic font-normal"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            >
              “Cmen is an experimental programming language exploring what happens when a language design takes biological terminology slightly too seriously.”
            </blockquote>

            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                The name <strong>Cmen</strong> is pronounced strictly as <strong>“C-Men”</strong> (analogous to the letter <em>C</em> followed by <em>men</em>). While phonetic parallels to human reproductive biology are obvious and intentional, the implementation treats every concept with uncompromising technical sobriety.
              </p>
              <p>
                We did not want Cmen to feel like a throwaway meme script with slapdash string replacements. To deliver true deadpan comedy, the language was constructed as an authentic developer tool: a clean recursive-descent parser, formal grammar tokens, strict AST node validation, lexical scoping, and deterministic runtime evaluation.
              </p>
              <p>
                Cmen does not claim to replace C, Rust, or Python in production environments. It is an educational toy, an artistic programming curiosity, and a reminder that developer tooling can take itself both completely seriously and not seriously at all.
              </p>
            </div>
          </div>

          {/* Right Column: Architectural Highlights Card */}
          <div className="lg:col-span-5">
            <div
              className="rounded-xl border p-6 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <Microscope className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Language Spec Sheet
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pronunciation:</span>
                  <span className="font-semibold text-blue-500">“C-Men” (/ˈsiːmɛn/)</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span className="text-emerald-500 font-semibold">Working Prototype (v0.0.1)</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Interpreter:</span>
                  <span>Pure TypeScript / AST Walker</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Typing:</span>
                  <span>Dynamic with Genetic Immutability</span>
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Output Channel:</span>
                  <span className="font-semibold text-purple-500">ejaculate()</span>
                </div>
                <div className="flex justify-between py-1" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>HR Compliance:</span>
                  <span className="text-amber-500 font-semibold">Strongly Discouraged</span>
                </div>
              </div>

              <div
                className="mt-6 rounded-lg p-3.5 border text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div className="flex items-center gap-1.5 font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  <span>Why build this?</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Because syntax matters. Because error diagnostics can be witty. And because forty years of the C programming lineage deserves an irreverent descendant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
