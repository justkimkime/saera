import { useState, useEffect, useCallback } from "react";
import { translate } from "../localization.js";
import { defaultLanguage, supportedLanguages } from "../language-config.js";
export function useLanguage() {
  const [lang, updateLanguage] = useState(() => {
    try {
      const saved = sessionStorage.getItem("saera-language");
      return supportedLanguages.includes(saved) ? saved : defaultLanguage;
    } catch {
      return defaultLanguage;
    }
  });
  const setLang = useCallback((value) => {
    if (supportedLanguages.includes(value)) updateLanguage(value);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem("saera-language", lang);
    } catch {}
    document.documentElement.lang = lang;
  }, [lang]);
  const t = useCallback(
    (key, variables) => translate(lang, key, variables),
    [lang],
  );
  return { lang, setLang, t, english: lang === "en" };
}
