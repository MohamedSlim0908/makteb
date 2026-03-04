import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ mode: 'light', toggleMode: () => {} });

function getInitialMode() {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) return stored === 'true' ? 'dark' : 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => getInitialMode());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  function toggleMode() {
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 0);

    setMode((currentMode) => {
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('darkMode', nextMode === 'dark');
      return nextMode;
    });
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
