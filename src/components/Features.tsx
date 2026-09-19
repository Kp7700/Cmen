import React from 'react';
import {
  Code,
  Zap,
  ShieldCheck,
  Cpu,
  Repeat,
  HelpCircle,
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: <Code className="h-5 w-5 text-blue-500" />,
      title: 'Simple, Coherent Syntax',
      summary:
        'Cmen is not a chaotic esoteric language. It boasts a formal recursive-descent grammar with curly-bracket blocks, semicolon statement termination, and lexical scoping.',
      detail: 'Predictable parser with zero hidden magic or macro expansion.',
    },
    {
      icon: <HelpCircle className="h-5 w-5 text-purple-500" />,
      title: 'Questionable Terminology',
      summary:
        'Variables are genes, constants are seeds, entry blocks are cum, and standard console output is ejaculate(). All declared with total technical seriousness.',
      detail: 'Every keyword is biologically themed and impossible to forget in standups.',
    },
    {
      icon: <Zap className="h-5 w-5 text-amber-500" />,
      title: 'Instant In-Browser Execution',
      summary:
        'Runs directly in the browser via an extensible AST tree-walking interpreter. No compiler installation, LLVM toolchains, or terminal dependencies required.',
      detail: 'Zero installation latency. Programs evaluate in milliseconds.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
      title: 'Strict Mutation Safety',
      summary:
        'Seeds are immutable by law. Attempting to mutate an established seed raises an immediate runtime abort, guaranteeing genetic integrity across statements.',
      detail: 'Distinguishes between mutable gene evolution and fixed seed conception.',
    },
    {
      icon: <Repeat className="h-5 w-5 text-cyan-500" />,
      title: 'Generational Growth Loops',
      summary:
        'Iterate across numeric ranges using the grow keyword. Bounds are inclusive by default, honoring the philosophy of complete generational commitment.',
      detail: 'Clear syntax for generational repetition without off-by-one ambiguities.',
    },
    {
      icon: <Cpu className="h-5 w-5 text-rose-500" />,
      title: 'Honest Experimental Design',
      summary:
        'We do not claim billion-dollar venture backing, kernel-level zero-cost abstractions, or enterprise readiness. Cmen is an educational toy crafted with craftsmanship.',
      detail: 'All features described in the documentation run authentically in the playground.',
    },
  ];

  return (
    <section
      id="features"
      className="border-b py-20 lg:py-24"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl">
          <span
            className="font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400"
          >
            Language Characteristics
          </span>
          <h2
            className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Engineered for expression. <br className="hidden sm:inline" />
            Bounded by biological precision.
          </h2>
          <p
            className="mt-3 text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            A high-contrast look at what makes Cmen both an authentic working language
            and an unapologetic exercise in deadpan developer humor.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="rounded-xl border p-6 transition-all hover:shadow-xs flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border mb-4"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {feat.icon}
                </div>

                <h3
                  className="text-lg font-semibold tracking-tight mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feat.title}
                </h3>

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {feat.summary}
                </p>
              </div>

              <div
                className="mt-6 pt-4 border-t font-mono text-xs"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                {feat.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
