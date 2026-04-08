"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("graph-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("graph-theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Theme tokens
export const themes = {
  dark: {
    bg: "#06060f",
    panelBg: "rgba(10, 10, 24, 0.95)",
    searchBg: "rgba(13, 13, 26, 0.85)",
    dropdownBg: "rgba(13, 13, 26, 0.95)",
    border: "rgba(255, 255, 255, 0.06)",
    borderHover: "rgba(255, 255, 255, 0.15)",
    text: "rgba(255, 255, 255, 0.90)",
    textSecondary: "rgba(255, 255, 255, 0.60)",
    textTertiary: "rgba(255, 255, 255, 0.30)",
    textMuted: "rgba(255, 255, 255, 0.15)",
    divider: "rgba(255, 255, 255, 0.04)",
    hoverBg: "rgba(255, 255, 255, 0.04)",
    labelColor: "#ffffff",
    labelDimmed: "rgba(255,255,255,0.12)",
    labelNormal: "rgba(255,255,255,0.75)",
  },
  light: {
    bg: "#f5f5f7",
    panelBg: "rgba(255, 255, 255, 0.95)",
    searchBg: "rgba(255, 255, 255, 0.90)",
    dropdownBg: "rgba(255, 255, 255, 0.98)",
    border: "rgba(0, 0, 0, 0.08)",
    borderHover: "rgba(0, 0, 0, 0.18)",
    text: "rgba(0, 0, 0, 0.85)",
    textSecondary: "rgba(0, 0, 0, 0.55)",
    textTertiary: "rgba(0, 0, 0, 0.30)",
    textMuted: "rgba(0, 0, 0, 0.12)",
    divider: "rgba(0, 0, 0, 0.06)",
    hoverBg: "rgba(0, 0, 0, 0.04)",
    labelColor: "#1a1a2e",
    labelDimmed: "rgba(0,0,0,0.08)",
    labelNormal: "rgba(0,0,0,0.65)",
  },
} as const;
