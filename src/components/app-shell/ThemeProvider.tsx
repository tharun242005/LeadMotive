"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Sun, Moon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types — Strict Dual Theme (Day / Night)
// ---------------------------------------------------------------------------
export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = "leadmotive-theme";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  resolved: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ---------------------------------------------------------------------------
// Inline script to prevent FOUC — runs before React hydrates (defaults to Day/light)
// ---------------------------------------------------------------------------
export const themeInitScript = `
(function(){
  try{
    var p = localStorage.getItem("${STORAGE_KEY}") || "light";
    if (p !== "light" && p !== "dark") p = "light";
    document.documentElement.setAttribute("data-theme", p);
  }catch(e){
    document.documentElement.setAttribute("data-theme", "light");
  }
})()`;

// ---------------------------------------------------------------------------
// Provider (Defaults to Day Mode; users can toggle to Night Mode)
// ---------------------------------------------------------------------------
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      const initial: ThemeMode = stored === "light" || stored === "dark" ? stored : "light";
      setThemeState(initial);
      document.documentElement.setAttribute("data-theme", initial);
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // storage unavailable
    }
    document.documentElement.setAttribute("data-theme", newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolved: theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Theme Toggle Button (Day / Night only)
// ---------------------------------------------------------------------------
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer
        border border-edge hover:border-brand/40 bg-panel hover:bg-raised text-muted hover:text-ink shadow-xs
        ${compact ? "w-8 h-8" : "h-9 px-3 gap-2"}`}
      title={isDark ? "Switch to Day Mode (Terracotta Editorial)" : "Switch to Night Mode (Midnight Tech)"}
      aria-label={isDark ? "Switch to Day Mode" : "Switch to Night Mode"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-warm transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand transition-transform hover:-rotate-12" />
      )}
      {!compact && (
        <span className="text-xs font-medium tracking-wide">
          {isDark ? "Day" : "Night"}
        </span>
      )}
    </button>
  );
}
