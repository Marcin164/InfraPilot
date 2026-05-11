import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import moment from "moment";
import "moment/locale/pl";

import pl from "./locales/pl/translations.json";
import en from "./locales/en/translations.json";

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: "pl", // domyślny język
  fallbackLng: "en",
  // Klucze JSON są płaskie z kropkami w nazwach (np. "knowledge.status" obok
  // "knowledge.status.draft"). Domyślny separator "." traktowałby je jako
  // węzły zagnieżdżone i powodował konflikt — wyłączamy.
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    escapeValue: false,
  },
});

const setMomentLocale = (lng: string) => {
  // moment akceptuje krótki kod ("pl"/"en"), dla "en" używamy domyślnego "en-gb"
  // lub "en" — oba zwracają angielskie nazwy miesięcy.
  moment.locale(lng.startsWith("pl") ? "pl" : "en");
};

setMomentLocale(i18n.language);
i18n.on("languageChanged", setMomentLocale);

export default i18n;
