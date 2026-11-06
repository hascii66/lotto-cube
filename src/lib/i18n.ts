import english from './en.json';

export type Language = 'th' | 'en';
export function storedLanguage(): Language {
  try {
    return localStorage.getItem('lottocube.language') === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
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
export function t(text: string, values: unknown[] = []): string {
  const messages = english as Record<string, string>;
  const translated = language === 'en' ? (messages[text.trim()] ?? text) : text;
  return translated.replace(/\{(\d+)\}/g, (_, index) =>
    String(values[Number(index)] ?? ''),
  );
}
export const tx = (text: string) => ` ${t(text)} `;
