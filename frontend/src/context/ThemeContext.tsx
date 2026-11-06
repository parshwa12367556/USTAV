import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export type ThemeMode = 'light' | 'dark';
type ThemeContextValue = { theme: ThemeMode; setTheme: (theme: ThemeMode) => void; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const toggleTheme = useCallback(() => setTheme((current) => current === 'light' ? 'dark' : 'light'), []);
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}><div data-theme={theme}>{children}</div></ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used inside ThemeProvider.');
  return context;
}
