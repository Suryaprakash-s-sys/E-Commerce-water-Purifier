import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setColorScheme } from '../utils/theme';

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync('califnco-theme-mode')
      .then((mode) => {
        if (!active) return;
        const dark = mode === 'dark';
        setColorScheme(dark ? 'dark' : 'light');
        setIsDark(dark);
      })
      .catch(() => setColorScheme('light'));
    return () => { active = false; };
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setColorScheme(nextIsDark ? 'dark' : 'light');
    setIsDark(nextIsDark);
    void SecureStore.setItemAsync('califnco-theme-mode', nextIsDark ? 'dark' : 'light');
  };

  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
