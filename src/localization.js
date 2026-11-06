import messages from "./locales/messages.json" with { type: "json" };
import { defaultLanguage } from "./language-config.js";
export function translate(lang, key, variables = {}) {
  const text = messages[lang]?.[key] ?? messages[defaultLanguage]?.[key] ?? key;
  return String(text).replace(/\{\{([\w]+)\}\}/g, (placeholder, name) =>
    Object.hasOwn(variables, name)
      ? String(variables[name] ?? "")
      : placeholder,
  );
}
