import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import moment from "moment";
import "moment/locale/pl";
import "moment/locale/de";
import "moment/locale/fr";
import "moment/locale/it";
import "moment/locale/es";

import pl from "./locales/pl/translations.json";
import en from "./locales/en/translations.json";
import de from "./locales/de/translations.json";
import fr from "./locales/fr/translations.json";
import it from "./locales/it/translations.json";
import es from "./locales/es/translations.json";

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
    de: { translation: de },
    fr: { translation: fr },
    it: { translation: it },
    es: { translation: es },
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

const SUPPORTED_MOMENT_LOCALES = ["pl", "de", "fr", "it", "es"];

const setMomentLocale = (lng: string) => {
  const short = lng.split("-")[0];
  moment.locale(SUPPORTED_MOMENT_LOCALES.includes(short) ? short : "en");
};

setMomentLocale(i18n.language);
i18n.on("languageChanged", setMomentLocale);

export default i18n;
