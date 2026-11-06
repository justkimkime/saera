// Display labels and API capabilities are separate from translated UI copy.
export const languageConfig = {
  ko: {
    label: "KOR",
    tourService: "ko",
    wellnessCode: "KOR",
    themes: ["general", "access", "pet", "wellness"],
  },
  en: {
    label: "ENG",
    tourService: "en",
    wellnessCode: "ENG",
    themes: ["general", "wellness"],
  },
};
export const defaultLanguage = "ko";
export const supportedLanguages = Object.keys(languageConfig);
export function languagePolicy(lang) {
  return languageConfig[lang] || languageConfig[defaultLanguage];
}
