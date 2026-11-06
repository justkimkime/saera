import test from "node:test";
import assert from "node:assert/strict";
import { loadKakaoMap, validMapPoint } from "./kakao-map.js";

test("Kakao SDK requires a key, shares loading, and reuses the loaded SDK", async () => {
  await assert.rejects(loadKakaoMap(""), /missing-key/);
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({ remove() {} }),
    head: {
      appendChild(script) {
        scripts.push(script);
      },
    },
  };
  try {
    const first = loadKakaoMap("example-key");
    const second = loadKakaoMap("example-key");
    assert.equal(first, second);
    assert.equal(scripts.length, 1);
    assert.match(scripts[0].src, /autoload=false/);
    window.kakao = {
      maps: {
        load(callback) {
          this.Map = function () {};
          callback();
        },
      },
    };
    scripts[0].onload();
    assert.equal(await first, window.kakao.maps);
    assert.equal(await loadKakaoMap("example-key"), window.kakao.maps);
    assert.equal(scripts.length, 1);
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("map coordinates reject missing, non-finite and out-of-range positions", () => {
  assert.ok(validMapPoint({ lat: 37.5, lng: 127 }));
  assert.ok(validMapPoint({ lat: 0, lng: 0 }));
  for (const point of [
    null,
    {},
    { lat: NaN, lng: 127 },
    { lat: 91, lng: 127 },
    { lat: 37, lng: 181 },
  ]) {
    assert.ok(!validMapPoint(point));
  }
});
