import React, { useState } from 'react';
import { Sun, Moon, Terminal, Menu, X, Code2 } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  activeSection,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sourceTooltip, setSourceTooltip] = useState(false);

  const navItems = [
    { id: 'playground', label: 'Playground' },
    { id: 'features', label: 'Features' },
    { id: 'docs', label: 'Documentation' },
    { id: 'examples', label: 'Examples' },
    { id: 'about', label: 'About' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const handleSourceClick = () => {
    setSourceTooltip(true);
    setTimeout(() => setSourceTooltip(false), 3500);
  };

  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(9, 9, 13, 0.85)' : 'rgba(250, 250, 252, 0.88)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
            aria-label="Cmen home"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-sm font-bold shadow-xs transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="tracking-tighter">C</span>
              <span className="text-xs text-blue-500 font-semibold">♂</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Cmen
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium border"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  v0.0.1
                </span>
              </div>
              <span className="font-mono text-[11px] leading-none" style={{ color: 'var(--text-muted)' }}>
                /ˈsiːmɛn/
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'font-semibold'
                  : 'hover:opacity-80'
              }`}
              style={{
                color: activeSection === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: activeSection === item.id ? 'var(--bg-surface-elevated)' : 'transparent',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Action Controls: Source & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Source Code Button with Deadpan Tooltip */}
          <div className="relative">
            <button
              id="source-code-btn"
              onClick={handleSourceClick}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-mono font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title="View source repository"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Source</span>
            </button>
            {sourceTooltip && (
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-lg border p-2.5 text-xs font-sans shadow-lg z-50"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              >
                <p className="font-semibold text-amber-500 mb-0.5">Repository Notice</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  There is no public GitHub repository. Cmen exists beyond version control. The full interpreter runs inside this browser session.
                </p>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-md border transition-colors hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'White' : 'Black'} theme`}
            title={`Toggle ${theme === 'dark' ? 'White' : 'Black'} theme`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Quick Playground Button */}
          <button
            id="nav-cta-playground"
            onClick={() => handleNavClick('playground')}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold shadow-xs transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-canvas)',
            }}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Open Playground</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-md border transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden border-b px-4 py-4 shadow-lg animate-in slide-in-from-top-2 duration-150"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors text-left"
                style={{
                  color: activeSection === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: activeSection === item.id ? 'var(--bg-surface-elevated)' : 'transparent',
                }}
              >
                <span>{item.label}</span>
                {activeSection === item.id && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
              </button>
            ))}

            <div className="pt-2 border-t mt-2 flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={handleSourceClick}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-mono text-left"
                style={{ color: 'var(--text-muted)' }}
              >
                <Code2 className="h-4 w-4" />
                <span>Source Repository (Placeholder)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
