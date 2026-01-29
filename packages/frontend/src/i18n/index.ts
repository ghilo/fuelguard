import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';

export const languages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'fr', // Default to French for Algeria
    supportedLngs: ['en', 'fr'],
    load: 'languageOnly', // Strip region codes (fr-FR -> fr)

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const language = languages.find((l) => l.code === lng);
  if (language) {
    document.documentElement.dir = language.dir;
    document.documentElement.lang = lng;
  }
});

// Set initial direction
const currentLang = languages.find((l) => l.code === i18n.language);
if (currentLang) {
  document.documentElement.dir = currentLang.dir;
  document.documentElement.lang = i18n.language;
}

export default i18n;

// Helper to format dates based on locale
export function formatDate(date: Date | string, locale?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const lang = locale || i18n.language;

  return d.toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string, locale?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const lang = locale || i18n.language;

  return d.toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(date: Date | string, locale?: string): string {
  return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
}
