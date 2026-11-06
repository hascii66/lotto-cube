import { t } from './i18n';
import type { Draw, Filters, Occurrence, PrizeType } from './types';
import { weekdayOf } from './format';
export const prizeLabels = (): Record<PrizeType, string> => ({
  all: t('รวมทุก 3 ตัว · 5 ชุด/งวด'),
  top: t('3 ตัวบน · ท้ายรางวัลที่ 1'),
  front: t('เลขหน้า 3 ตัว · 2 ชุด/งวด'),
  back: t('เลขท้าย 3 ตัว · 2 ชุด/งวด'),
});
export function selectDraws(draws: Draw[], filters: Filters) {
  const matching = [...draws]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(
      (d) =>
        filters.weekday === 'all' ||
        weekdayOf(d.date) === Number(filters.weekday),
    );
  return filters.limit === 'all'
    ? matching
    : matching.slice(0, Number(filters.limit));
}
export function threeNumbers(draw: Draw, type: PrizeType = 'all'): string[] {
  return type === 'top'
    ? [draw.prize1.slice(-3)]
    : type === 'front'
      ? draw.front3
      : type === 'back'
        ? draw.back3
        : [draw.prize1.slice(-3), ...draw.front3, ...draw.back3];
}
export const digitSum = (value: string) =>
  [...value].reduce((sum, digit) => sum + Number(digit), 0);
export const patternOf = (value: string) =>
  new Set(value).size === 1
    ? 'triple'
    : new Set(value).size === 2
      ? 'double'
      : 'unique';
export function frequency(values: string[], index: number) {
  return Array.from(
    { length: 10 },
    (_, digit) => values.filter((v) => Number(v[index]) === digit).length,
  );
}
export function analyzeThree(draws: Draw[], type: PrizeType) {
  const values = draws.flatMap((d) => threeNumbers(d, type));
  return {
    values,
    total: values.length,
    positions: [0, 1, 2].map((i) => frequency(values, i)),
    sums: Array.from(
      { length: 28 },
      (_, sum) => values.filter((v) => digitSum(v) === sum).length,
    ),
    patterns: {
      unique: values.filter((v) => patternOf(v) === 'unique').length,
      double: values.filter((v) => patternOf(v) === 'double').length,
      triple: values.filter((v) => patternOf(v) === 'triple').length,
    },
    low: values.filter((v) => Number(v) < 500).length,
    even: values.filter((v) => digitSum(v) % 2 === 0).length,
  };
}
export type ThreeStats = ReturnType<typeof analyzeThree>;
export function scoreThree(number: string, stats: ThreeStats) {
  const components = stats.positions.map(
    (counts, i) => (25 * counts[Number(number[i])]) / Math.max(1, ...counts),
  );
  components.push(
    (25 * stats.sums[digitSum(number)]) / Math.max(1, ...stats.sums),
  );
  return { components, score: components.reduce((a, b) => a + b, 0) };
}
export function topPicks(stats: ThreeStats) {
  if (!stats.total) return [];
  // A fixed 1,000-number search is smaller and more transparent than a recommendation model.
  return Array.from({ length: 1000 }, (_, i) => {
    const number = String(i).padStart(3, '0');
    const base = scoreThree(number, stats).score;
    const structure =
      stats.patterns[patternOf(number)] /
      Math.max(1, ...Object.values(stats.patterns));
    return { number, score: base * 0.9 + structure * 10 };
  })
    .sort((a, b) => b.score - a.score || a.number.localeCompare(b.number))
    .slice(0, 10);
}
export function permutations(number: string): string[] {
  if (number.length === 1) return [number];
  return [
    ...new Set(
      [...number].flatMap((digit, i) =>
        permutations(number.slice(0, i) + number.slice(i + 1)).map(
          (rest) => digit + rest,
        ),
      ),
    ),
  ].sort();
}
export function findOccurrences(
  draws: Draw[],
  numbers: string[],
  type: PrizeType = 'all',
): Occurrence[] {
  return draws.flatMap((draw) => {
    const prizes: [string, string][] =
      numbers[0]?.length === 2
        ? [[draw.last2, t('เลขท้าย 2 ตัว')]]
        : [
            ...(type === 'all' || type === 'top'
              ? [[draw.prize1.slice(-3), t('3 ตัวบน')] as [string, string]]
              : []),
            ...(type === 'all' || type === 'front'
              ? draw.front3.map(
                  (v) => [v, t('เลขหน้า 3 ตัว')] as [string, string],
                )
              : []),
            ...(type === 'all' || type === 'back'
              ? draw.back3.map(
                  (v) => [v, t('เลขท้าย 3 ตัว')] as [string, string],
                )
              : []),
          ];
    return prizes
      .filter(([value]) => numbers.includes(value))
      .map(([number, label]) => ({ number, label, date: draw.date }));
  });
}
export function analyzeTwo(draws: Draw[]) {
  const values = draws.map((d) => d.last2);
  const counts = Array.from({ length: 100 }, (_, i) => ({
    number: String(i).padStart(2, '0'),
    count: values.filter((v) => Number(v) === i).length,
  }));
  return {
    values,
    counts,
    positions: [frequency(values, 0), frequency(values, 1)],
    max: Math.max(0, ...counts.map((v) => v.count)),
  };
}
export function topLastNumbers(draws: Draw[], digits: 2 | 3) {
  const counts = new Map<string, number>();
  for (const draw of draws) {
    for (const number of digits === 2 ? [draw.last2] : draw.back3) {
      counts.set(number, (counts.get(number) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => b.count - a.count || a.number.localeCompare(b.number))
    .slice(0, 10);
}
export function scoreTwo(number: string, stats: ReturnType<typeof analyzeTwo>) {
  const components = stats.positions.map(
    (counts, i) => (50 * counts[Number(number[i])]) / Math.max(1, ...counts),
  );
  return { components, score: components.reduce((a, b) => a + b, 0) };
}
