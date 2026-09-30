import assert from "node:assert/strict";
import test from "node:test";
import { themeForVisit, withTheme } from "../src/theme-preference.ts";
test("a landing link carries an explicit theme into the app without changing its route", () => {
  const href = withTheme(
    "https://app.example.com/app/compare?model=one#price",
    "dark",
  );
  assert.equal(
    href,
    "https://app.example.com/app/compare?model=one&theme=dark#price",
  );
  assert.equal(themeForVisit(new URL(href).search, "light"), "dark");
});
test("saved choice survives a visit; malformed input cannot become a theme", () => {
  assert.equal(themeForVisit("", "dark"), "dark");
  assert.equal(themeForVisit("?theme=unknown", "light"), "light");
  assert.equal(themeForVisit("?theme=unknown", null), "light");
});
test("local app links retain query and fragment and replace a prior theme", () => {
  assert.equal(
    withTheme("/app/settings?theme=dark#display-currency", "light"),
    "/app/settings?theme=light#display-currency",
  );
});
