'use client';

import { useEffect } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider - Forces dark mode for ID8Labs design language
 *
 * This provider ensures dark mode is always active. We're dark-mode-first,
 * so there's no toggle - just consistent dark UI across all pages.
 *
 * The dark class is also set on <html> in layout.tsx for SSR,
 * but this effect ensures it stays applied after hydration.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // Force dark mode on mount
    const root = document.documentElement;
    root.classList.add('dark');

    // Set color scheme for native elements (form controls, scrollbars)
    root.style.colorScheme = 'dark';
  }, []);

  return <>{children}</>;
}
