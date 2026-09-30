export type Theme = "light" | "dark";
export const themeStorageKey = "kastanje-theme";
export const legacyThemeStorageKey = "pixelrouter-theme";
export function parseTheme(value: string | null): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}
export function themeForVisit(search: string, saved: string | null): Theme {
  return (
    parseTheme(new URLSearchParams(search).get("theme")) ??
    parseTheme(saved) ??
    "light"
  );
}
// Only the visual preference crosses origins, never account or session data.
export function withTheme(href: string, theme: Theme): string {
  const absolute = /^https?:\/\//.test(href);
  const url = new URL(href, "https://kastanje.invalid");
  url.searchParams.set("theme", theme);
  return absolute ? url.href : url.pathname + url.search + url.hash;
}
