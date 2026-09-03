"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, applyTheme, readTheme, type Theme } from "@/lib/theme";

// The theme lives on <html>, outside React — it is set by the pre-paint script
// before React exists. Observing it (rather than mirroring it into state) keeps
// every mounted toggle correct and avoids setState-in-effect.
function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"],
  });
  return () => observer.disconnect();
}

// Matches the server-rendered default on <html>; the real value is read once
// hydration completes.
const serverSnapshot = (): Theme => "dark";

export default function ThemeToggle({ className = "", size = 20 }: { className?: string; size?: number }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverSnapshot);

  const toggle = () => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing or blocked storage: the theme still switches for this
      // page, it just will not be remembered.
    }
  };

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={className}>
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}
