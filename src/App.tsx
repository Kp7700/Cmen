import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Playground } from './components/Playground';
import { Documentation } from './components/Documentation';
import { ExamplesSection } from './components/ExamplesSection';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';

export default function App() {
  // Theme state initialization: localStorage -> system preference -> dark
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('cmen_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // Fallback
    }
    return 'dark';
  });

  const [activeSection, setActiveSection] = useState<string>('hero');
  const [playgroundInitialCode, setPlaygroundInitialCode] = useState<string | undefined>(undefined);

  // Sync theme with HTML root class & localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('cmen_theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleLoadInPlayground = (code: string) => {
    setPlaygroundInitialCode(code);
    handleNavigate('playground');
  };

  // Observe active section on scroll
  useEffect(() => {
    const sectionIds = ['hero-section', 'playground', 'features', 'docs', 'examples', 'about'];
    const handleScrollObserver = () => {
      const scrollPosition = window.scrollY + 200;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id === 'hero-section' ? 'hero' : id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScrollObserver, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollObserver);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-500">
      {/* Navigation Header */}
      <Navbar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero
          onOpenPlayground={(code) => {
            if (code) setPlaygroundInitialCode(code);
            handleNavigate('playground');
          }}
          onOpenDocs={() => handleNavigate('docs')}
        />

        {/* 2. Features Ledger */}
        <Features />

        {/* 3. Interactive Code Playground */}
        <Playground initialCode={playgroundInitialCode} />

        {/* 4. Language Documentation */}
        <Documentation onLoadInPlayground={handleLoadInPlayground} />

        {/* 5. Code Examples Gallery */}
        <ExamplesSection onLoadExample={handleLoadInPlayground} />

        {/* 6. About the Language */}
        <AboutSection />
      </main>

      {/* 7. Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
