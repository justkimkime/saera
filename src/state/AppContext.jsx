import { languagePolicy } from "../language-config.js";
import { translate } from "../localization.js";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigation } from "../hooks/useNavigation.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { useItineraries } from "../hooks/useItineraries.js";
import { useFavorites } from "../hooks/useFavorites.js";
import { useSearch } from "../hooks/useSearch.js";
import { resolveRoute, themePaths, supportsRoute } from "../routing/routes.js";
import { themes } from "../tourism.js";
const AppContext = createContext(null);
export function AppProvider({ children }) {
  const navigation = useNavigation(),
    language = useLanguage();
  const { path, navigate } = navigation,
    { lang, t } = language;
  const route = resolveRoute(path),
    theme = route.theme || "general";
  const [notice, setNotice] = useState(""),
    [selectedPlace, setSelectedPlace] = useState(null),
    [detailBackPath, setDetailBackPath] = useState("/explore");
  const favorites = useFavorites({ t, setNotice, lang });
  const itineraries = useItineraries({ t, setNotice });
  const search = useSearch({
    theme,
    ...language,
    setNotice,
    active:
      ["search", "theme"].includes(route.page) && supportsRoute(route, lang),
  });
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (!supportsRoute(route, lang)) {
      navigate("/explore", true, true);
      setNotice(t("AppContext.thisPageIsOnlyAvailableInKorean"));
    }
  }, [path, lang]);
  useEffect(() => {
    document.title = `SAERA 새라 · ${translate(lang, "AppContext.exploreKorea")}`;
  }, [path, lang]);
  function changeTheme(value) {
    if (value !== theme || !["search", "theme"].includes(route.page))
      navigate(themePaths[value]);
  }
  function changeLanguage(value) {
    language.setLang(value);
    if (!supportsRoute(route, value) || route.page === "detail")
      navigate("/explore");
  }
  function openPlace(place) {
    setSelectedPlace(place);
    setDetailBackPath(
      ["search", "theme", "saved"].includes(route.page)
        ? path
        : themePaths[place.theme] || "/explore",
    );
    navigate(`/places/${place.service}/${place.id}`);
  }
  const value = {
    ...navigation,
    ...language,
    ...favorites,
    ...itineraries,
    ...search,
    route,
    theme,
    notice,
    setNotice,
    selectedPlace,
    detailBackPath,
    changeTheme,
    changeLanguage,
    openPlace,
    available: themes.filter((a) => languagePolicy(lang).themes.includes(a.id)),
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("AppProvider is required");
  return value;
}
