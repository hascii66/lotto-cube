import { t } from './i18n';
import type { Draw, Filters, Occurrence, PrizeType } from './types';
import { weekdayOf } from './format';
export const DEFAULT_ANALYSIS_WINDOW = 120;

export function latestDraws(draws: Draw[], limit = DEFAULT_ANALYSIS_WINDOW) {
  return [...draws]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export const prizeLabels = (): Record<PrizeType, string> => ({
  all: t('all_3_digit_awards_5_per'),
  top: t('last_3_digits_of_first_prize'),
  front: t('front_3_digits_2_per_draw'),
  back: t('last_3_digits_2_per_draw'),
});
export function selectDraws(draws: Draw[], filters: Filters) {
  const matching = latestDraws(draws, Number(filters.limit)).filter(
    (d) =>
      filters.weekday === 'all' ||
      weekdayOf(d.date) === Number(filters.weekday),
  );
  return matching;
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
      numbers[0]?.length === 6
        ? [[draw.prize1, t('first_prize')]]
        : numbers[0]?.length === 2
          ? [[draw.last2, t('last_two_digits')]]
          : [
              ...(type === 'all' || type === 'top'
                ? [
                    [draw.prize1.slice(-3), t('last_3_of_first_prize')] as [
                      string,
                      string,
                    ],
                  ]
                : []),
              ...(type === 'all' || type === 'front'
                ? draw.front3.map(
                    (v) => [v, t('front_3_digits')] as [string, string],
                  )
                : []),
              ...(type === 'all' || type === 'back'
                ? draw.back3.map(
                    (v) => [v, t('last_three_digits')] as [string, string],
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
export function nextDrawPicks(
  draws: Draw[],
  digits: 2 | 3 | 6,
  allowedDigits?: number[],
) {
  if (!draws.length) return [];
  const values = draws.flatMap((draw) =>
    digits === 2 ? [draw.last2] : digits === 3 ? draw.back3 : [draw.prize1],
  );
  if (digits === 2) {
    const counts = new Map<string, number>();
    values.forEach((number) =>
      counts.set(number, (counts.get(number) ?? 0) + 1),
    );
    const candidates = Array.from({ length: 100 }, (_, number) =>
      String(number).padStart(2, '0'),
    ).filter((number) =>
      allowedDigits?.length
        ? [...number].every((digit) => allowedDigits.includes(Number(digit)))
        : true,
    );
    const max = Math.max(...counts.values());
    return candidates
      .map((number) => ({
        number,
        score: ((counts.get(number) ?? 0) / max) * 100,
      }))
      .sort((a, b) => b.score - a.score || a.number.localeCompare(b.number))
      .slice(0, 10);
  }
  let picks = [{ number: '', score: 0 }];
  for (let position = 0; position < digits; position++) {
    const counts = frequency(values, position);
    const max = Math.max(...counts);
    // Position scores are additive: a discarded prefix cannot enter the top ten
    // after appending the same suffix. Keep exact results without a million-number scan.
    picks = picks
      .flatMap((pick) =>
        (allowedDigits ?? counts.map((_, digit) => digit)).map((digit) => ({
          number: pick.number + digit,
          score: pick.score + counts[digit] / max,
        })),
      )
      .sort((a, b) => b.score - a.score || a.number.localeCompare(b.number))
      .slice(0, 10);
  }
  return picks.map((pick) => ({ ...pick, score: (pick.score / digits) * 100 }));
}
export function picksForDraw(
  draws: Draw[],
  date = 'next',
  limit = DEFAULT_ANALYSIS_WINDOW,
) {
  const target =
    date === 'next' ? undefined : draws.find((draw) => draw.date === date);
  const history =
    date === 'next'
      ? latestDraws(draws, limit)
      : target
        ? latestDraws(
            draws.filter((draw) => draw.date < date),
            limit,
          )
        : [];
  const groups = ([2, 3, 6] as const).map((digits) => {
    const picks = nextDrawPicks(history, digits);
    const actual = target
      ? digits === 2
        ? [target.last2]
        : digits === 3
          ? target.back3
          : [target.prize1]
      : [];
    return {
      digits,
      picks,
      actual,
      matched: actual.filter((number) =>
        picks.some((pick) => pick.number === number),
      ),
    };
  });
  return { target, history, groups };
}
export function scoreTwo(number: string, stats: ReturnType<typeof analyzeTwo>) {
  const components = stats.positions.map(
    (counts, i) => (50 * counts[Number(number[i])]) / Math.max(1, ...counts),
  );
  return { components, score: components.reduce((a, b) => a + b, 0) };
}
