import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi.json";
import en from "./locales/en.json";

const STORAGE_KEY = "bp-language";

/** Đọc ngôn ngữ đã lưu (localStorage), mặc định tiếng Việt. */
function getInitialLanguage() {
  if (typeof window === "undefined") return "vi";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "vi";
}

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
});

/** Đổi ngôn ngữ và lưu lựa chọn. */
export function setLanguage(lang) {
  const next = lang === "en" ? "en" : "vi";
  i18n.changeLanguage(next);
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
}

export default i18n;
