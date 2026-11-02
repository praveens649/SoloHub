import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContextDefinition";

export function useTheme() {
  return useContext(ThemeContext);
}
