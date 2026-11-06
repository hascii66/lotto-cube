import english from './en.json';
import thai from './th.json';

export type Language = 'en' | 'th';
export function storedLanguage(): Language {
  try {
    return localStorage.getItem('lottocube.language') === 'th' ? 'th' : 'en';
  } catch {
    return 'en';
  }
}
let language = storedLanguage();
export const getLanguage = () => language;
export function setLanguage(next: Language) {
  language = next;
  try {
    localStorage.setItem('lottocube.language', next);
  } catch {
    /* Preference remains available for this session. */
  }
}

const dictionaries: Record<Language, Record<string, string>> = {
  en: english as Record<string, string>,
  th: thai as Record<string, string>,
};

export function t(text: string, values: unknown[] = []): string {
  const dict = dictionaries[language] ?? dictionaries.en;
  const key = text.trim();
  const translated = dict[key] ?? (language === 'th' ? text : (dictionaries.en[key] ?? text));
  return translated.replace(/\{(\d+)\}/g, (_, index) =>
    String(values[Number(index)] ?? ''),
  );
}
export const tx = (text: string) => ` ${t(text)} `;
