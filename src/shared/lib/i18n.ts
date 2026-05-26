import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import es from '@/locales/es.json';
import en from '@/locales/en.json';
import uk from '@/locales/uk.json';
import ru from '@/locales/ru.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      uk: { translation: uk },
      ru: { translation: ru },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'uk', 'ru'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'botilocal_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
