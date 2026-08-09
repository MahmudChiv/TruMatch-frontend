'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = () => {
      const saved = localStorage.getItem('trumatch_theme') as 'dark' | 'light' | null;
      if (saved === 'light' || saved === 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    };

    applyTheme();

    window.addEventListener('storage', applyTheme);
    window.addEventListener('trumatch-theme-changed', applyTheme);

    return () => {
      window.removeEventListener('storage', applyTheme);
      window.removeEventListener('trumatch-theme-changed', applyTheme);
    };
  }, []);

  return <>{children}</>;
}
