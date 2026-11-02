import { useState, useEffect, type ReactNode } from "react";
import {
  getUserPreferences,
  setThemePreference,
  type AppTheme,
} from "../../lib/storage/preferences";
import { ThemeContext } from "./ThemeContextDefinition";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setLocalTheme] = useState<AppTheme>("diwali");

  useEffect(() => {
    let mounted = true;
    void getUserPreferences().then((prefs) => {
      if (mounted) {
        setLocalTheme(prefs.theme || "diwali");
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function updateTheme(next: AppTheme) {
    setLocalTheme(next);
    await setThemePreference(next);
  }

  async function toggleTheme() {
    const next = theme === "diwali" ? "dark" : "diwali";
    await updateTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
