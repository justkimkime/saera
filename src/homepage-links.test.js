import test from "node:test";
import assert from "node:assert/strict";
import { homepageLinks } from "./homepage-links.js";
import { wellnessThemeLabel } from "./tourism.js";
test("splits the exact concatenated homepage supplied by the provider", () => {
  assert.deepEqual(
    homepageLinks(
      "https://www.heidi-haus.com/https://www.instagram.com/heidihaus.official/",
    ),
    [
      { url: "https://www.heidi-haus.com/", label: "www.heidi-haus.com" },
      {
        url: "https://www.instagram.com/heidihaus.official/",
        label: "Instagram",
      },
    ],
  );
});
test("extracts HTML hrefs, decodes entities and removes duplicates", () => {
  const result = homepageLinks(
    '<a href="https://example.com/?a=1&amp;b=2">공식 홈페이지</a><br>https://example.com/?a=1&amp;b=2 https://instagram.com/example/',
  );
  assert.equal(result.length, 2);
  assert.equal(result[0].url, "https://example.com/?a=1&b=2");
});
test("preserves embedded redirect URLs and rejects unsafe schemes and credentials", () => {
  const redirect = "https://example.com/?next=https://other.example/path";
  assert.equal(homepageLinks(redirect)[0].url, redirect);
  assert.equal(
    homepageLinks(`<a href="${redirect}">링크</a>`)[0].url,
    redirect,
  );
  assert.deepEqual(
    homepageLinks(
      '<a href="javascript:alert(1)">click</a> data:text/html,hi https://user:pass@example.com/',
    ),
    [],
  );
  assert.deepEqual(homepageLinks(null), []);
});
test("uses the shared bilingual wellness codes, retaining unrecognized codes", () => {
  assert.equal(wellnessThemeLabel("EX050100"), "온천/사우나/스파");
  assert.equal(
    wellnessThemeLabel("EX050100", "en"),
    "Hot springs / Sauna / Spa",
  );
  assert.equal(
    wellnessThemeLabel("EX050100,EX050400"),
    "온천/사우나/스파 · 힐링 명상",
  );
  assert.equal(wellnessThemeLabel("EX999999"), "EX999999");
});

test("separates the live Korean homepage labels without changing Korean URL paths", () => {
  const result = homepageLinks(
    "공식홈페이지 https://www.heidi-haus.com/공식인스타그램 https://www.instagram.com/heidihaus.official/",
  );
  assert.deepEqual(
    result.map((link) => link.url),
    [
      "https://www.heidi-haus.com/",
      "https://www.instagram.com/heidihaus.official/",
    ],
  );
  assert.equal(
    decodeURI(homepageLinks("https://example.com/한글경로")[0].url),
    "https://example.com/한글경로",
  );
});
test("keeps HTML tag boundaries between plain links and labels", () => {
  const result = homepageLinks(
    "https://example.com/<strong>Visit us</strong>https://other.example/",
  );
  assert.deepEqual(
    result.map((link) => link.url),
    ["https://example.com/", "https://other.example/"],
  );
});

test("supports the supplied www-only homepage and deduplicates explicit HTTPS", () => {
  assert.deepEqual(homepageLinks("www.hahoe.or.kr"), [
    { url: "https://www.hahoe.or.kr/", label: "www.hahoe.or.kr" },
  ]);
  assert.equal(
    homepageLinks("www.hahoe.or.kr https://www.hahoe.or.kr/").length,
    1,
  );
});
test("supports www-only and protocol-relative HTML hrefs without enabling other schemes", () => {
  assert.equal(
    homepageLinks('<a href="www.hahoe.or.kr">하회마을</a>')[0].url,
    "https://www.hahoe.or.kr/",
  );
  assert.equal(
    homepageLinks('<a href="//www.hahoe.or.kr">하회마을</a>')[0].url,
    "https://www.hahoe.or.kr/",
  );
  assert.deepEqual(
    homepageLinks('<a href="javascript:www.hahoe.or.kr">bad</a>'),
    [],
  );
});
