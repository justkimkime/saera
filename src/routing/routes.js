import { languagePolicy } from "../language-config.js";
export const themePaths = {
  general: "/explore",
  access: "/themes/accessible",
  pet: "/themes/pet-friendly",
  wellness: "/themes/wellness",
};
export function resolveRoute(path) {
  if (path === "/" || path === "/explore")
    return { page: "search", theme: "general" };
  for (const [theme, url] of Object.entries(themePaths))
    if (path === url) return { page: "theme", theme };
  if (path === "/about") return { page: "about" };
  if (path === "/saved") return { page: "saved" };
  const match = path.match(/^\/places\/(ko|en|access|pet|wellness)\/(\d+)$/);
  return match
    ? { page: "detail", service: match[1], id: match[2] }
    : { page: "not-found" };
}
export function supportsRoute(route, lang) {
  const theme =
    route.theme ||
    (["access", "pet", "wellness"].includes(route.service)
      ? route.service
      : "general");
  return languagePolicy(lang).themes.includes(theme);
}
