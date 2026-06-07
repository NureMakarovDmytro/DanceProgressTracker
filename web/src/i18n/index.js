import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from './uk.json';
import en from './en.json';

// Конфігурація локалей: код мови, регіон для Intl, напрям тексту.
export const LOCALES = {
  uk: { label: 'Українська', region: 'uk-UA', dir: 'ltr' },
  en: { label: 'English', region: 'en-US', dir: 'ltr' },
};

const saved = localStorage.getItem('lang') || 'uk';

i18n.use(initReactI18next).init({
  resources: { uk: { translation: uk }, en: { translation: en } },
  lng: saved,
  fallbackLng: 'uk',
  interpolation: { escapeValue: false },
});

// Зміна мови: зберігаємо вибір і виставляємо напрям тексту документа.
export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = LOCALES[lang].dir;
}

// Форматування дати за регіоном активної мови (л10n).
export function formatDate(value) {
  const region = LOCALES[i18n.language]?.region || 'uk-UA';
  return new Intl.DateTimeFormat(region, { dateStyle: 'medium' }).format(new Date(value));
}

// Порядок сортування рядків за алфавітом активної мови.
export function collator() {
  const region = LOCALES[i18n.language]?.region || 'uk-UA';
  return new Intl.Collator(region, { sensitivity: 'base' });
}

changeLanguage(saved);

export default i18n;
