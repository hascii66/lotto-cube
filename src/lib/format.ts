import { getLanguage, t } from './i18n';
export const locale = () => (getLanguage() === 'en' ? 'en-GB' : 'th-TH');
export const timezone = 'Asia/Bangkok';
export const formatDate = (date: string, short = false) =>
  new Intl.DateTimeFormat(locale(), {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: 'numeric',
    timeZone: timezone,
  }).format(new Date(`${date}T12:00:00+07:00`));
export const formatNumber = (number: number) =>
  new Intl.NumberFormat(locale()).format(number);
export const percent = (count: number, total: number) =>
  total ? (count / total) * 100 : 0;
export const weekdays = () => [
  t('อาทิตย์'),
  t('จันทร์'),
  t('อังคาร'),
  t('พุธ'),
  t('พฤหัสบดี'),
  t('ศุกร์'),
  t('เสาร์'),
];
export const weekdayOf = (date: string) =>
  new Date(`${date}T00:00:00Z`).getUTCDay();
export function today() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return ['year', 'month', 'day']
    .map((key) => parts.find((p) => p.type === key)!.value)
    .join('-');
}
