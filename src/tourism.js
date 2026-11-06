import { supportedLanguages, languagePolicy } from "./language-config.js";
import { translate } from "./localization.js";
import catalog from "./search-catalog.json" with { type: "json" };
import { textValue, safeUrl } from "./response-data.js";
export const themes = ["general", "access", "pet", "wellness"].map((id) => ({
  id: id,
  ...Object.fromEntries(
    supportedLanguages
      .filter((lang) => languagePolicy(lang).themes.includes(id))
      .map((lang) => [lang, translate(lang, `themes.${id}`)]),
  ),
}));
export const regions = [
  "11",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "36",
  "41",
  "51",
  "43",
  "44",
  "52",
  "46",
  "47",
  "48",
  "50",
].map((code) => [
  code,
  translate("ko", `regions.${code}`),
  translate("en", `regions.${code}`),
]);
export const types = Object.fromEntries(
  supportedLanguages.map((lang) => [
    lang,
    (
      {
        ko: ["12", "14", "15", "25", "28", "32", "38", "39"],
        en: ["76", "78", "85", "75", "80", "79", "82", "77"],
      }[languagePolicy(lang).tourService] || []
    ).map((code) => [code, translate(lang, `types.${code}`)]),
  ]),
);
export function serviceFor(theme, lang) {
  return theme === "general" ? languagePolicy(lang).tourService : theme;
}
export function operationFor(service, prefix) {
  return catalog
    .find((s) => s.id === service)
    ?.operations.find((o) => o.id.startsWith(prefix));
}
export function normalizePlace(item, service, lang, theme) {
  return {
    id: String(item.contentid || item.contentId || ""),
    type: String(item.contenttypeid || item.contentTypeId || ""),
    title: textValue(item.title || ""),
    address: textValue(
      [item.addr1 || item.baseAddr, item.addr2 || item.detailAddr]
        .filter(Boolean)
        .join(" "),
    ),
    image:
      safeUrl(
        item.firstimage || item.orgImage || item.firstimage2 || item.thumbImage,
      ) || "",
    description: textValue(item.overview || ""),
    lat: Number(item.mapy || item.mapY) || null,
    lng: Number(item.mapx || item.mapX) || null,
    distance: Number(item.dist) || null,
    service,
    lang,
    theme,
  };
}
export function parseResponse(result) {
  if (result.error) throw new Error(result.error);
  const root = result.data?.response,
    header = root?.header || result.data;
  if (
    header?.resultCode != null &&
    !["0000", "00", "0"].includes(String(header.resultCode))
  )
    throw new Error(textValue(header.resultMsg) || `API ${header.resultCode}`);
  if (!root?.body)
    throw new Error("응답을 확인할 수 없습니다. 잠시 후 다시 시도해주세요.");
  const body = root.body,
    item = body.items?.item;
  return {
    items: Array.isArray(item)
      ? item
      : item && typeof item === "object"
        ? [item]
        : [],
    total: Number(body.totalCount) || 0,
  };
}
export async function requestTour(service, prefix, params = {}, signal) {
  const op = operationFor(service, prefix);
  if (!op) throw new Error("지원하지 않는 조회입니다.");
  const allowed = new Set(op.params.map((p) => p.name));
  const q = new URLSearchParams({ service, operation: op.id });
  for (const [key, value] of Object.entries({
    MobileOS: "ETC",
    MobileApp: "SAERA",
    ...params,
  }))
    if (allowed.has(key) && value !== "" && value != null)
      q.set(key, String(value));
  const response = await fetch(`/api/tour?${q}`, { signal });
  return parseResponse(await response.json());
}
export function favoriteKey(p) {
  return `${p.theme}/${p.service}/${p.lang}/${p.id}`;
}

export const wellnessThemes = [
  "EX050100",
  "EX050200",
  "EX050300",
  "EX050400",
  "EX050500",
  "EX050600",
  "EX050700",
].map((id) => ({
  code: id,
  ...Object.fromEntries(
    supportedLanguages
      .filter((lang) => true)
      .map((lang) => [lang, translate(lang, `wellnessThemes.${id}`)]),
  ),
}));
export function wellnessThemeLabel(value, lang = "ko") {
  const raw = textValue(value);
  const codes = raw.match(/EX\d{6}/gi) || [raw];
  return [...new Set(codes)]
    .map(
      (code) =>
        wellnessThemes.find((theme) => theme.code === code.toUpperCase())?.[
          lang
        ] || code,
    )
    .join(" · ");
}
