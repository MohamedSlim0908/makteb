import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({ mode: 'light', toggleMode: () => {} });

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Force a consistent light theme across the app.
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('darkMode');
  }, []);

  return (
    <ThemeContext.Provider value={{ mode: 'light', toggleMode: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
