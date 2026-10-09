// The site's color theme. The reader's choice is "paper", "dark", or "auto" (follow the OS),
// stored in localStorage. Base's inline script applies it before first paint with the
// same rules; keep the two in step.

export type ThemeMode = "paper" | "dark" | "auto";
export type Theme = "paper" | "dark";

export const STORAGE_KEY = "rustophile_theme";

// the browser chrome color for each theme (meta theme-color)
const THEME_COLORS: Record<Theme, string> = {
  paper: "#f7f4ea",
  dark: "#353535",
};

const osDark = () => window.matchMedia("(prefers-color-scheme: dark)");

export function storedMode(): ThemeMode {
  try {
    const mode = localStorage.getItem(STORAGE_KEY);
    return mode === "paper" || mode === "dark" ? mode : "auto";
  } catch {
    // storage blocked: follow the OS
    return "auto";
  }
}

export function themeFor(mode: ThemeMode): Theme {
  if (mode === "auto") return osDark().matches ? "dark" : "paper";
  return mode;
}

/**
 * Shows a mode: sets data-theme (which the palette follows) and data-theme-mode (which the
 * theme menu's button icon follows) on <html>, and the browser chrome color. Embedded
 * widgets (comments) follow the "rustophile-theme-change" event.
 */
export function applyMode(mode: ThemeMode) {
  const theme = themeFor(mode);
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-theme-mode", mode);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
  window.dispatchEvent(
    new CustomEvent("rustophile-theme-change", { detail: { theme, mode } }),
  );
}

/** Saves and shows the reader's choice. */
export function chooseMode(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // storage blocked: the choice lasts for this page only
  }
  applyMode(mode);
}

/** Re-applies "auto" when the OS switches between light and dark. Returns an unsubscribe. */
export function followOs(): () => void {
  const query = osDark();
  const onChange = () => {
    if (storedMode() === "auto") applyMode("auto");
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
