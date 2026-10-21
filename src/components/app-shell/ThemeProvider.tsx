"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
}

const STORAGE_KEY = "signaldesk-theme";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextValue>({
  preference: "system",
  resolved: "light",
  setPreference: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ---------------------------------------------------------------------------
// Inline script to prevent FOUC — runs before React hydrates
// ---------------------------------------------------------------------------
export const themeInitScript = `
(function(){
  try{
    var p=localStorage.getItem("${STORAGE_KEY}")||"system";
    var d=p==="system"
      ?(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")
      :p;
    document.documentElement.setAttribute("data-theme",d);
  }catch(e){
    document.documentElement.setAttribute("data-theme","light");
  }
})()`;

// ---------------------------------------------------------------------------
// Resolve helper
// ---------------------------------------------------------------------------
function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }
  return pref;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Read stored preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const pref = stored && ["light", "dark", "system"].includes(stored) ? stored : "system";
    setPreferenceState(pref);
    const r = resolve(pref);
    setResolved(r);
    document.documentElement.setAttribute("data-theme", r);
  }, []);

  // Listen for system theme changes when preference is "system"
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const r = e.matches ? "dark" : "light";
      setResolved(r);
      document.documentElement.setAttribute("data-theme", r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    localStorage.setItem(STORAGE_KEY, pref);
    const r = resolve(pref);
    setResolved(r);
    document.documentElement.setAttribute("data-theme", r);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Theme Toggle Button
// ---------------------------------------------------------------------------
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();

  const cycle = () => {
    const next: ThemePreference =
      preference === "light" ? "dark" : preference === "dark" ? "system" : "light";
    setPreference(next);
  };

  const Icon = preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;
  const label =
    preference === "light" ? "Light" : preference === "dark" ? "Dark" : "System";

  return (
    <button
      onClick={cycle}
      className={`flex items-center justify-center rounded-md transition-colors duration-fast
        text-muted hover:text-ink hover:bg-raised
        ${compact ? "w-9 h-9" : "w-10 h-10"}`}
      title={`Theme: ${label}. Click to change.`}
      aria-label={`Current theme: ${label}. Click to change.`}
    >
      <Icon className="w-[18px] h-[18px]" />
    </button>
  );
}
