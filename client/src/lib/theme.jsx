import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ mode: 'light', toggleMode: () => {} });

function getInitialMode() {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) return stored === 'true' ? 'dark' : 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const initial = getInitialMode();
    setMode(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  function toggleMode() {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 0);

    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    setMode(isDark ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
