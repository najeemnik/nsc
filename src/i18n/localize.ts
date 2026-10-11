import { DEFAULT_ACTION_BUTTONS } from '../types';
import type { CustomActionButton, Language } from '../types';

/**
 * Every user-facing copy selection must provide all three supported locales.
 * Missing/blank copy is an error instead of silently borrowing another language.
 */
export type LocalizedCopy = Readonly<Record<Language, string>>;

export function localizeText(language: Language, copy: LocalizedCopy): string {
  const value = copy[language];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing ${language} UI copy.`);
  }
  return value;
}

export function localizeActionButtonLabel(button: Partial<CustomActionButton>, language: Language): string {
  const defaults = DEFAULT_ACTION_BUTTONS.find(candidate => candidate.id === button.id);
  return localizeText(language, {
    en: button.labelEn?.trim() || defaults?.labelEn || 'Custom action',
    fa: button.labelFa?.trim() || defaults?.labelFa || 'عمل سفارشی',
    ps: button.labelPs?.trim() || defaults?.labelPs || 'ځانګړی کار',
  });
}

const RTL_LANGUAGES: ReadonlySet<Language> = new Set(['fa', 'ps']);
const INTL_LOCALES: Readonly<Record<Language, string>> = {
  en: 'en-US',
  fa: 'fa-AF',
  ps: 'ps-AF',
};

export function isRtlLanguage(language: Language): boolean {
  return RTL_LANGUAGES.has(language);
}

export function isCurrentLanguage(language: Language, candidate: Language): boolean {
  return language === candidate;
}

export function intlLocaleFor(language: Language): string {
  return INTL_LOCALES[language];
}

export const MISSING_TRANSLATION_COPY: LocalizedCopy = {
  en: 'Translation unavailable',
  fa: 'ترجمه موجود نیست',
  ps: 'ژباړه نشته',
};
