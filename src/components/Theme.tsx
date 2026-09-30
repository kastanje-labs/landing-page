import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { PixelIcon } from "./PixelIcon";
import { appUrl } from "../deployment";
import {
  legacyThemeStorageKey,
  parseTheme,
  themeForVisit,
  themeStorageKey,
  withTheme,
  type Theme,
} from "../theme-preference";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
export const useTheme = () => useContext(ThemeContext);
export function useAppUrl() {
  const { theme } = useTheme();
  return (path = "/app") => withTheme(appUrl(path), theme);
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    let saved: string | null = null;
    try {
      saved =
        localStorage.getItem(themeStorageKey) ??
        localStorage.getItem(legacyThemeStorageKey);
    } catch {
      /* Storage is optional. */
    }
    return themeForVisit(location.search, saved);
  });
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0b1428" : "#f5f8fd");
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch {
      /* Keep the choice for this visit. */
    }
  }, [theme]);
  useEffect(() => {
    const url = new URL(location.href);
    if (parseTheme(url.searchParams.get("theme"))) {
      url.searchParams.delete("theme");
      history.replaceState(history.state, "", url);
    }
    const sync = (event: StorageEvent) => {
      if (event.key === themeStorageKey) {
        const next = parseTheme(event.newValue);
        if (next) setTheme(next);
      }
    };
    addEventListener("storage", sync);
    return () => removeEventListener("storage", sync);
  }, []);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () =>
          setTheme((current) => (current === "dark" ? "light" : "dark")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function ThemeToggle({ language = "en" }: { language?: "da" | "en" }) {
  const { theme, toggle } = useTheme();
  const label =
    language === "da"
      ? theme === "dark"
        ? "Skift til lyst tema"
        : "Skift til mørkt tema"
      : theme === "dark"
        ? "Switch to light theme"
        : "Switch to dark theme";
  return (
    <button
      type="button"
      className="theme-toggle icon-button"
      onClick={toggle}
      title={label}
      aria-label={label}
    >
      <PixelIcon name={theme === "dark" ? "sun" : "moon"} size={20} />
    </button>
  );
}
