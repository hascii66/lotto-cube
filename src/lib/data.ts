import { t } from './i18n';
import type { Draw } from './types';
import { today } from './format';
export const STORAGE_KEY = 'lottocube.draws.v1';
export function validateDraw(value: unknown): Draw {
  if (!value || typeof value !== 'object')
    throw new Error(t('each_draw_must_be_an_object'));
  const d = value as Record<string, unknown>;
  if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date))
    throw new Error(t('dates_must_use_the_gregorian_yyyy'));
  const parsed = new Date(`${d.date}T00:00:00Z`);
  if (
    isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== d.date ||
    d.date < '1900-01-01' ||
    d.date > today()
  )
    throw new Error(t('the_date_is_invalid_or_in'));
  if (typeof d.prize1 !== 'string' || !/^\d{6}$/.test(d.prize1))
    throw new Error(t('first_prize_must_be_a_six'));
  if (typeof d.last2 !== 'string' || !/^\d{2}$/.test(d.last2))
    throw new Error(t('last_2_digits_must_be_a'));
  for (const field of ['front3', 'back3']) {
    if (
      !Array.isArray(d[field]) ||
      d[field].length !== 2 ||
      !d[field].every((n) => typeof n === 'string' && /^\d{3}$/.test(n))
    )
      throw new Error(
        t('front_and_last_three_digit_awards'),
      );
  }
  return {
    date: d.date,
    prize1: d.prize1,
    front3: d.front3 as Draw['front3'],
    back3: d.back3 as Draw['back3'],
    last2: d.last2,
    source: ['seed', 'api', 'manual', 'import', 'sanook'].includes(
      String(d.source),
    )
      ? (d.source as Draw['source'])
      : 'import',
  };
}
export function parseDraws(value: unknown): Draw[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10000)
    throw new Error(t('the_file_must_be_a_json'));
  const draws = value.map((d, i) => {
    try {
      return validateDraw(d);
    } catch (error) {
      throw new Error(
        t('entry', [i + 1, (error as Error).message]),
      );
    }
  });
  if (new Set(draws.map((d) => d.date)).size !== draws.length)
    throw new Error(t('duplicate_draw_dates_found_keep_one'));
  return draws.sort((a, b) => b.date.localeCompare(a.date));
}
export function mergeDraws(
  existing: Draw[],
  incoming: Draw[],
  replace = false,
): Draw[] {
  const result = new Map(existing.map((d) => [d.date, d]));
  for (const draw of incoming)
    if (replace || !result.has(draw.date)) result.set(draw.date, draw);
  return [...result.values()].sort((a, b) => b.date.localeCompare(a.date));
}
export const sameResult = (a: Draw, b: Draw) =>
  a.prize1 === b.prize1 &&
  a.last2 === b.last2 &&
  a.front3.join() === b.front3.join() &&
  a.back3.join() === b.back3.join();
export function exportJson(draws: Draw[]) {
  const blob = new Blob([JSON.stringify(draws, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lottocube-${today()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
