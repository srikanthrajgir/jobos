export const THEME_STORAGE_KEY = "jobos-theme";

export type Theme = "light" | "dark";

// globals.css selects the dark palette with `.dark, [data-theme="dark"]`, so a
// toggle has to move BOTH. Moving only the class — which is what the old Navbar
// handler did — leaves data-theme="dark" on <html> and the dark tokens keep
// winning, which is why the button appeared to do nothing.
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
}

export function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

// Runs as a raw string before first paint, so it cannot import from this module
// — keep the storage key and the class/attribute pair in step with the helpers
// above. Without it, a stored light preference would flash dark on every load,
// because the server has no way to know what this browser chose.
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)},s=localStorage.getItem(k),t=(s==="light"||s==="dark")?s:((window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches)?"light":"dark"),r=document.documentElement;r.classList.toggle("dark",t==="dark");r.setAttribute("data-theme",t);}catch(e){}})();`;
