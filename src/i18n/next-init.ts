import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zodEn from 'zod-i18n-map/locales/en/zod.json' assert { type: 'json' };
import zodEs from 'zod-i18n-map/locales/es/zod.json' assert { type: 'json' };

import en from './en';
import es from './es';

export function initI18nReact() {
  i18n.use(initReactI18next).init({
    supportedLngs: ['en', 'es'],
    lng: 'es',
    fallbackLng: 'es',
    initAsync: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: en,
        zod: zodEn,
      },
      es: {
        translation: es,
        zod: zodEs,
      },
    },
  });
  return i18n;
}

export const IndexedLocale: Record<string, string> = {
  en: 'English',
  es: 'Español',
};
