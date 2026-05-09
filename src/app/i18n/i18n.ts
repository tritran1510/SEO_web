import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./resources/en";
import { vi } from "./resources/vi";

export const SUPPORTED_LANGUAGES = ["vi", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "seo-web-language";
const DEFAULT_LANGUAGE: SupportedLanguage = "vi";

function isSupportedLanguage(language: string | null | undefined): language is SupportedLanguage {
  return typeof language === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

function resolveInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(storedLanguage)) {
    return storedLanguage;
  }

  const browserLanguage = window.navigator.language.split("-")[0];
  return isSupportedLanguage(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources: {
    en,
    vi,
  },
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

void i18n.on("languageChanged", (language) => {
  if (typeof window !== "undefined" && isSupportedLanguage(language)) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
});

export async function switchLanguage(language: SupportedLanguage) {
  await i18n.changeLanguage(language);
}

export async function toggleLanguage() {
  const nextLanguage: SupportedLanguage = i18n.language === "vi" ? "en" : "vi";
  await switchLanguage(nextLanguage);
}

export default i18n;
