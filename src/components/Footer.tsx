import React, { useState } from 'react';
import { ArrowUp, Code2, AlertTriangle } from 'lucide-react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [showRepoToast, setShowRepoToast] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRepoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowRepoToast(true);
    setTimeout(() => setShowRepoToast(false), 3500);
  };

  return (
    <footer
      id="site-footer"
      className="border-t py-12 sm:py-16"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-12 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Brand Info */}
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md border font-mono text-xs font-bold"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                C♂
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Cmen
              </span>
              <span className="font-mono text-xs text-blue-500">v0.0.1</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The language of questionable evolution. An experimental toy language exploring biological terminology with straight-faced software engineering rigor.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="font-semibold font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Project
              </div>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => onNavigate('playground')}
                    className="hover:underline text-left text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Playground
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('features')}
                    className="hover:underline text-left text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Language Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('examples')}
                    className="hover:underline text-left text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Code Examples
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-semibold font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Docs
              </div>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => onNavigate('docs')}
                    className="hover:underline text-left text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Specification
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('docs')}
                    className="hover:underline text-left text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Syntax Reference
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('about')}
                    className="hover:underline text-left text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    About Project
                  </button>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="font-semibold font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Repository
              </div>
              <div className="relative">
                <button
                  onClick={handleRepoClick}
                  className="inline-flex items-center gap-1.5 text-xs hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>GitHub (Placeholder)</span>
                </button>
                {showRepoToast && (
                  <div
                    className="absolute left-0 top-full mt-2 w-56 rounded-lg border p-2.5 text-[11px] font-sans shadow-lg z-50"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <p className="font-semibold text-amber-500 mb-0.5">No Remote Repository</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Cmen does not maintain a public Git repository. The browser execution engine on this page is the definitive implementation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright / Philosophy */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2 text-center sm:text-left">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              Disclaimer: Cmen is experimental software. Any resemblance to established biological processes is entirely intentional.
            </span>
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 transition-colors hover:opacity-80 shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            aria-label="Scroll back to top"
          >
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
