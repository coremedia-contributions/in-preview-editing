import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import de from "./locales/de";

i18next.use(initReactI18next).init({
  lng: navigator.language.split("-")[0],
  fallbackLng: "en",
  resources: { en, de },
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;

