import { languagePolicy } from "./language-config.js";
import { requestTour } from "./tourism.js";
export const REGION_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
export const SEARCH_CACHE_TTL = 10 * 60 * 1000;
const RETRY_DELAY = 5 * 60 * 1000;
function cacheKey(service, operation, params) {
  return JSON.stringify([
    service,
    operation,
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
export function createRegionCache({
  request = requestTour,
  storage = () => globalThis.localStorage,
  now = () => Date.now(),
} = {}) {
  const memory = new Map(),
    pending = new Map();
  return async function getRegions(service, lang, province = "") {
    const key = `saera-region-codes:v1:${service}:${lang}:${province || "all"}`;
    let entry = memory.get(key);
    if (!entry) {
      try {
        const value = JSON.parse(storage()?.getItem(key) || "null");
        if (
          value?.version === 1 &&
          Number.isFinite(value.savedAt) &&
          value.savedAt <= now() &&
          Array.isArray(value.items) &&
          value.items.every(
            (item) =>
              item &&
              String(item.code || "").trim() &&
              typeof item.name === "string" &&
              item.name.trim(),
          )
        )
          entry = value;
      } catch {}
    }
    if (entry) {
      memory.set(key, entry);
      if (now() - entry.savedAt < REGION_CACHE_TTL)
        return { items: entry.items, stale: false };
      if (entry.retryAt > now()) return { items: entry.items, stale: true };
    }
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      try {
        const params = {
          langDivCd: languagePolicy(lang).wellnessCode,
          numOfRows: 100,
          ...(province ? { lDongRegnCd: province, lDongListYn: "N" } : {}),
        };
        const result = await request(service, "ldongCode", params);
        if (
          !Array.isArray(result.items) ||
          (!province && !result.items.length) ||
          result.items.some(
            (item) =>
              !item ||
              !String(item.code || "").trim() ||
              typeof item.name !== "string" ||
              !item.name.trim(),
          )
        )
          throw new Error("지역 코드 응답을 확인할 수 없습니다.");
        const saved = { version: 1, savedAt: now(), items: result.items };
        memory.set(key, saved);
        try {
          storage()?.setItem(key, JSON.stringify(saved));
        } catch {}
        return { items: saved.items, stale: false };
      } catch (error) {
        if (entry) {
          memory.set(key, { ...entry, retryAt: now() + RETRY_DELAY });
          return { items: entry.items, stale: true };
        }
        throw error;
      }
    })();
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  };
}
export function createSearchCache({
  request = requestTour,
  now = () => Date.now(),
} = {}) {
  const memory = new Map(),
    pending = new Map();
  return async function getSearch(service, operation, params) {
    const key = cacheKey(service, operation, params),
      entry = memory.get(key);
    if (entry && now() - entry.savedAt < SEARCH_CACHE_TTL) return entry.result;
    if (pending.has(key)) return pending.get(key);
    const task = request(service, operation, params).then((result) => {
      memory.set(key, { result, savedAt: now() });
      if (memory.size > 100) memory.delete(memory.keys().next().value);
      return result;
    });
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  };
}
export const getRegionCodes = createRegionCache();
export const getSearchResults = createSearchCache();
