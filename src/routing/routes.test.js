import test from "node:test";
import assert from "node:assert/strict";
import { resolveRoute, supportsRoute, themePaths } from "./routes.js";
test("theme routes resolve on direct entry, independently of prior navigation", () => {
  for (const [theme, path] of Object.entries(themePaths))
    assert.equal(resolveRoute(path).theme, theme);
  assert.equal(resolveRoute("/places/access/126508").service, "access");
  assert.equal(resolveRoute("/places/other/126508").page, "not-found");
  assert.equal(resolveRoute("/places/ko/not-an-id").page, "not-found");
});
test("English blocks Korean-only themes and direct detail links", () => {
  for (const path of [
    "/themes/accessible",
    "/themes/pet-friendly",
    "/places/access/126508",
    "/places/pet/126508",
  ]) {
    assert.equal(supportsRoute(resolveRoute(path), "en"), false);
    assert.equal(supportsRoute(resolveRoute(path), "ko"), true);
  }
  assert.equal(supportsRoute(resolveRoute("/themes/wellness"), "en"), true);
  assert.equal(
    supportsRoute(resolveRoute("/places/wellness/126508"), "en"),
    true,
  );
});
