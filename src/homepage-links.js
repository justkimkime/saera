import { safeUrl, textValue } from "./response-data.js";

// Some provider fields concatenate URLs without spaces. A repeated scheme is
// a boundary unless it belongs to a query/fragment (for example ?next=https://…).
function splitUrls(value) {
  const result = [];
  for (const match of String(value).matchAll(
    /https?:\/\/[^\s<>"']+|(?<![\w@/:])www\.[^\s<>"']+/gi,
  )) {
    const token = match[0];
    let start = 0;
    for (const scheme of token.matchAll(/https?:\/\//gi)) {
      const index = scheme.index;
      if (index === 0 || /[?#]/.test(token.slice(start, index))) continue;
      result.push(token.slice(start, index));
      start = index;
    }
    result.push(token.slice(start));
  }
  return result;
}
export function homepageLinks(value) {
  if (typeof value !== "string") return [];
  const candidates = [];
  const anchors =
    /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>[\s\S]*?<\/a\s*>/gi;
  const remainder = value.replace(anchors, (_, double, single, bare) => {
    const href = textValue(double || single || bare || "").trim();
    // An HTML href is an explicit boundary. Do not guess inside an actual link.
    if (/^(?:https?:\/\/|www\.|\/\/)/i.test(href)) candidates.push(href);
    return " ";
  });
  // Keep markup as a separator and remove known field labels only when they
  // directly introduce another URL. Do not remove arbitrary Korean URL paths.
  const plain = textValue(remainder.replace(/<[^>]*>/g, " ")).replace(
    /공식\s*(?:홈페이지|인스타그램|블로그)\s*(?=https?:\/\/)/gi,
    " ",
  );
  candidates.push(...splitUrls(plain));
  const seen = new Set();
  return candidates.flatMap((candidate) => {
    const cleaned = candidate.replace(/[;,，。]+$/, "");
    const normalized = /^www\./i.test(cleaned)
      ? `https://${cleaned}`
      : cleaned.startsWith("//")
        ? `https:${cleaned}`
        : cleaned;
    const url = safeUrl(normalized);
    if (!url || seen.has(url)) return [];
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return [];
    seen.add(url);
    return [
      {
        url,
        label: /(^|\.)instagram\.com$/i.test(parsed.hostname)
          ? "Instagram"
          : parsed.hostname,
      },
    ];
  });
}
