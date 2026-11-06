import { useState, useCallback, useEffect } from "react";
import { favoriteKey } from "../tourism.js";
const storageKey = "saera-favorites";
export function useFavorites({ t, setNotice, lang }) {
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(value)
        ? value.filter((p) => p && p.id && p.theme && p.lang)
        : [];
    } catch {
      return [];
    }
  };
  const [favorites, setFavorites] = useState(read);
  const [tabs, setTabs] = useState({ ko: "general", en: "general" });
  const savedTab = tabs[lang] || "general";
  const setSavedTab = (value) =>
    setTabs((previous) => ({ ...previous, [lang]: value }));
  useEffect(() => {
    const sync = (e) => {
      if (e.key === storageKey) setFavorites(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const isSaved = useCallback(
    (p) => favorites.some((f) => favoriteKey(f) === favoriteKey(p)),
    [favorites],
  );
  const toggle = useCallback(
    (p) => {
      const exists = isSaved(p);
      const next = exists
        ? favorites.filter((f) => favoriteKey(f) !== favoriteKey(p))
        : [...favorites, { ...p, savedAt: new Date().toISOString() }];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setFavorites(next);
        setNotice(
          exists
            ? t("useFavorites.removedFromSavedPlaces")
            : t("useFavorites.savedInThisBrowser"),
        );
      } catch {
        setNotice(t("useFavorites.browserStorageIsUnavailable"));
      }
    },
    [favorites, isSaved, t, setNotice],
  );
  return { favorites, isSaved, toggle, savedTab, setSavedTab };
}
