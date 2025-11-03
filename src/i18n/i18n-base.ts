import en from './en';
import es from './es';

export type BaseTranslation = typeof es;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      en: typeof en;
      es: typeof es;
    };
  }
}
