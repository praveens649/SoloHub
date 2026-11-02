import { createContext } from "react";
import type { AppTheme } from "../../lib/storage/preferences";

export interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "diwali",
  setTheme: async () => {},
  toggleTheme: async () => {},
});

