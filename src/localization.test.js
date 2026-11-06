import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import messages from "./locales/messages.json" with { type: "json" };
import { translate } from "./localization.js";
import { supportedLanguages, languagePolicy } from "./language-config.js";

test("registered languages have matching translation keys and interpolation variables", () => {
  const base = Object.keys(messages.ko).sort();
  const variables = (text) =>
    [...String(text).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
  for (const lang of supportedLanguages) {
    assert.deepEqual(Object.keys(messages[lang]).sort(), base);
    for (const key of base) {
      assert.equal(typeof messages[lang][key], "string");
      assert.deepEqual(
        variables(messages[lang][key]),
        variables(messages.ko[key]),
        `${lang}: ${key}`,
      );
    }
  }
});
test("language lookup falls back to Korean and safely interpolates literal values", () => {
  assert.equal(translate("en", "Header.explore"), "Explore");
  assert.equal(translate("ja", "Header.explore"), "여행지 검색");
  assert.equal(translate("en", "missing.key"), "missing.key");
  assert.equal(
    translate("en", "PlaceCard.saveValue", { place_title: "A $& {{other}}" }),
    "Save A $& {{other}}",
  );
});
test("API language policy is independent of editable translation labels", () => {
  assert.equal(languagePolicy("ko").wellnessCode, "KOR");
  assert.equal(languagePolicy("en").wellnessCode, "ENG");
  assert.ok(!languagePolicy("en").themes.includes("pet"));
});
test("literal t/translate calls reference keys in the shared JSON", () => {
  function files(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((d) =>
        d.isDirectory()
          ? files(`${dir}/${d.name}`)
          : /\.(jsx|js)$/.test(d.name) && !d.name.endsWith(".test.js")
            ? [`${dir}/${d.name}`]
            : [],
      );
  }
  for (const file of files("src")) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(
      /\bt\(\s*["']([^"']+)["']|\btranslate\(\s*lang\s*,\s*["']([^"']+)["']/g,
    )) {
      const key = match[1] || match[2];
      assert.ok(Object.hasOwn(messages.ko, key), `${file}: ${key}`);
    }
  }
});
