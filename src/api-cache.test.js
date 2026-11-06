import test from "node:test";
import assert from "node:assert/strict";
import {
  createRegionCache,
  createSearchCache,
  REGION_CACHE_TTL,
  SEARCH_CACHE_TTL,
} from "./api-cache.js";
function storage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) || null,
    setItem: (key, value) => map.set(key, value),
    map,
  };
}
const items = [{ code: "11", name: "서울" }];
test("region codes persist across instances and stay separated by service, language and province", async () => {
  let calls = 0;
  const store = storage(),
    request = async () => {
      calls++;
      return { items };
    };
  const load = createRegionCache({
    request,
    storage: () => store,
    now: () => 100,
  });
  await load("ko", "ko");
  await load("ko", "ko");
  await createRegionCache({ request, storage: () => store, now: () => 101 })(
    "ko",
    "ko",
  );
  assert.equal(calls, 1);
  await load("ko", "ko", "11");
  await load("ko", "en");
  await load("pet", "ko");
  assert.equal(calls, 4);
});
test("simultaneous code requests share one call and one persisted result", async () => {
  let calls = 0,
    resolve;
  const store = storage();
  const load = createRegionCache({
    storage: () => store,
    request: () => {
      calls++;
      return new Promise((r) => (resolve = r));
    },
  });
  const first = load("ko", "ko"),
    second = load("ko", "ko");
  assert.equal(calls, 1);
  resolve({ items });
  assert.deepEqual(await first, await second);
  assert.equal(store.map.size, 1);
});
test("expired code refresh failure retains stale storage and backs off before retry", async () => {
  let now = 100,
    calls = 0,
    fail = false;
  const store = storage();
  const load = createRegionCache({
    storage: () => store,
    now: () => now,
    request: async () => {
      calls++;
      if (fail) throw new Error("offline");
      return { items };
    },
  });
  await load("ko", "ko");
  const saved = [...store.map.values()][0];
  now += REGION_CACHE_TTL + 1;
  fail = true;
  assert.deepEqual(await load("ko", "ko"), { items, stale: true });
  assert.equal([...store.map.values()][0], saved);
  await load("ko", "ko");
  assert.equal(calls, 2);
  now += 5 * 60 * 1000 + 1;
  fail = false;
  assert.equal((await load("ko", "ko")).stale, false);
  assert.equal(calls, 3);
});
test("invalid stored data and error responses never replace valid code entries", async () => {
  const store = storage();
  store.setItem("saera-region-codes:v1:ko:ko:all", "not JSON");
  let calls = 0;
  const load = createRegionCache({
    storage: () => store,
    request: async () => {
      calls++;
      return { items: [] };
    },
  });
  await assert.rejects(load("ko", "ko"));
  await assert.rejects(load("ko", "ko"));
  assert.equal(calls, 2);
  assert.equal(store.getItem("saera-region-codes:v1:ko:ko:all"), "not JSON");
});
test("blocked browser storage still permits in-memory reuse", async () => {
  let calls = 0;
  const load = createRegionCache({
    storage: () => {
      throw new Error("denied");
    },
    request: async () => {
      calls++;
      return { items };
    },
  });
  await load("ko", "ko");
  await load("ko", "ko");
  assert.equal(calls, 1);
});
test("search cache separates applied filters and pages, deduplicates calls and expires", async () => {
  let calls = 0,
    now = 100;
  const load = createSearchCache({
    now: () => now,
    request: async () => {
      calls++;
      return { items, total: 1 };
    },
  });
  await Promise.all([
    load("wellness", "areaBasedList", {
      pageNo: 1,
      wellnessThemaCd: "EX050100",
    }),
    load("wellness", "areaBasedList", {
      wellnessThemaCd: "EX050100",
      pageNo: 1,
    }),
  ]);
  assert.equal(calls, 1);
  await load("wellness", "areaBasedList", {
    pageNo: 2,
    wellnessThemaCd: "EX050100",
  });
  assert.equal(calls, 2);
  await load("wellness", "areaBasedList", {
    pageNo: 1,
    wellnessThemaCd: "EX050200",
  });
  assert.equal(calls, 3);
  now += SEARCH_CACHE_TTL + 1;
  await load("wellness", "areaBasedList", {
    pageNo: 1,
    wellnessThemaCd: "EX050100",
  });
  assert.equal(calls, 4);
});
test("failed searches are retryable and never cached", async () => {
  let calls = 0;
  const load = createSearchCache({
    request: async () => {
      calls++;
      throw new Error("offline");
    },
  });
  await assert.rejects(load("ko", "areaBasedList", {}));
  await assert.rejects(load("ko", "areaBasedList", {}));
  assert.equal(calls, 2);
});
