import { describe, expect, it } from 'vitest';
import fixture from '../../tests/fixtures/draws.json';
import type { Draw } from './types';
const draws = fixture as Draw[];
import {
  analyzeThree,
  analyzeTwo,
  digitSum,
  findOccurrences,
  patternOf,
  permutations,
  scoreThree,
  scoreTwo,
  selectDraws,
  topPicks,
  nextDrawPicks,
  picksForDraw,
} from './analytics';
import { weekdayOf } from './format';

describe('statistics from the supplied historical results', () => {
  it('reconstructs picks from strictly earlier draws and compares exact award results', () => {
    const earlier: Draw = {
      ...draws[0],
      date: '2024-01-01',
      prize1: '000000',
      last2: '09',
      back3: ['070', '070'],
    };
    const target: Draw = {
      ...draws[0],
      date: '2024-02-01',
      prize1: '000001',
      last2: '09',
      back3: ['070', '999'],
    };
    const later: Draw = {
      ...draws[0],
      date: '2024-03-01',
      prize1: '999999',
      last2: '99',
      back3: ['999', '999'],
    };
    const result = picksForDraw([later, target, earlier], target.date);
    expect(result.history).toEqual([earlier]);
    expect(result.target).toEqual(target);
    expect(result.groups.map((group) => group.actual)).toEqual([
      ['09'],
      ['070', '999'],
      ['000001'],
    ]);
    expect(result.groups.map((group) => group.matched)).toEqual([
      ['09'],
      ['070'],
      ['000001'],
    ]);
    for (const group of result.groups)
      expect(group.picks).toEqual(nextDrawPicks([earlier], group.digits));
    const changed = picksForDraw(
      [
        { ...later, last2: '00', prize1: '123456' },
        { ...target, last2: '88', prize1: '654321', back3: ['888', '888'] },
        earlier,
      ],
      target.date,
    );
    expect(changed.groups.map((group) => group.picks)).toEqual(
      result.groups.map((group) => group.picks),
    );
  });
  it('never substitutes current picks for an unknown draw or a draw without earlier history', () => {
    const oldest = [...draws].sort((a, b) => a.date.localeCompare(b.date))[0];
    for (const date of [oldest.date, '1900-01-01']) {
      const result = picksForDraw(draws, date);
      expect(result.history).toEqual([]);
      expect(
        result.groups.every(
          (group) => !group.picks.length && !group.matched.length,
        ),
      ).toBe(true);
    }
    const next = picksForDraw(draws);
    expect(next.history).toEqual(draws);
    expect(next.target).toBeUndefined();
    expect(
      next.groups.every(
        (group) => !group.actual.length && !group.matched.length,
      ),
    ).toBe(true);
    for (const group of next.groups)
      expect(group.picks).toEqual(nextDrawPicks(draws, group.digits));
  });
  it('matches exhaustive positional scoring for all 2- and 3-digit combinations', () => {
    for (const digits of [2, 3] as const) {
      const values = draws.flatMap((draw) =>
        digits === 2 ? [draw.last2] : draw.back3,
      );
      const counts = Array.from({ length: digits }, (_, position) =>
        Array.from(
          { length: 10 },
          (_, digit) =>
            values.filter((v) => v[position] === String(digit)).length,
        ),
      );
      const exhaustive = Array.from({ length: 10 ** digits }, (_, value) => {
        const number = String(value).padStart(digits, '0');
        const score = [...number].reduce(
          (sum, digit, i) =>
            sum + counts[i][Number(digit)] / Math.max(...counts[i]),
          0,
        );
        return { number, score };
      })
        .sort((a, b) => b.score - a.score || a.number.localeCompare(b.number))
        .slice(0, 10)
        .map((pick) => ({ ...pick, score: (pick.score / digits) * 100 }));
      expect(nextDrawPicks(draws, digits)).toEqual(exhaustive);
    }
  });
  it('keeps six-digit order and leading zeros with deterministic ties and award-specific inputs', () => {
    const sample: Draw[] = [
      { ...draws[0], prize1: '000000', last2: '09', back3: ['070', '070'] },
    ];
    const picks = nextDrawPicks(sample, 6);
    expect(picks.map((pick) => pick.number)).toEqual(
      Array.from({ length: 10 }, (_, i) => `00000${i}`),
    );
    expect(picks[0].score).toBe(100);
    expect(picks[1].score).toBeCloseTo((100 * 5) / 6);
    expect(nextDrawPicks(sample, 2)[0]).toEqual({ number: '09', score: 100 });
    expect(nextDrawPicks(sample, 3)[0]).toEqual({ number: '070', score: 100 });
    const changedOtherAwards: Draw[] = [
      {
        ...sample[0],
        last2: '99',
        front3: ['999', '999'],
        back3: ['999', '999'],
      },
    ];
    expect(nextDrawPicks(changedOtherAwards, 6)).toEqual(picks);
    for (const digits of [2, 3, 6] as const) {
      expect(nextDrawPicks([], digits)).toEqual([]);
      const ranked = nextDrawPicks(draws, digits);
      expect(new Set(ranked.map((pick) => pick.number)).size).toBe(10);
      for (const pick of ranked) {
        expect(pick.number).toMatch(new RegExp(`^[0-9]{${digits}}$`));
        expect(pick.score).toBeGreaterThanOrEqual(0);
        expect(pick.score).toBeLessThanOrEqual(100);
      }
    }
  });
  it('counts 24 draws and all 120 three-digit prizes without dropping leading zeros', () => {
    const stats = analyzeThree(draws, 'all');
    expect(draws).toHaveLength(24);
    expect(stats.total).toBe(120);
    expect(stats.values).toContain('008');
    for (const counts of stats.positions)
      expect(counts.reduce((a, b) => a + b, 0)).toBe(120);
    expect(stats.sums.reduce((a, b) => a + b, 0)).toBe(120);
    expect(Object.values(stats.patterns).reduce((a, b) => a + b, 0)).toBe(120);
    expect(analyzeThree(draws, 'top').total).toBe(24);
    expect(analyzeThree(draws, 'front').total).toBe(48);
    expect(analyzeThree(draws, 'back').total).toBe(48);
  });
  it('uses the correct position, digit-sum, and structural definitions', () => {
    const stats = analyzeThree([draws[0]], 'top');
    expect(stats.values).toEqual(['863']);
    expect(stats.positions[0][8]).toBe(1);
    expect(stats.positions[1][6]).toBe(1);
    expect(stats.positions[2][3]).toBe(1);
    expect(stats.sums[17]).toBe(1);
    expect(digitSum('079')).toBe(16);
    expect(patternOf('079')).toBe('unique');
    expect(patternOf('070')).toBe('double');
    expect(patternOf('000')).toBe('triple');
  });
  it('filters weekday before applying the latest-draw limit', () => {
    const monday = selectDraws(draws, {
      weekday: '1',
      limit: '10',
      prize: 'all',
    });
    expect(monday.every((d) => weekdayOf(d.date) === 1)).toBe(true);
    expect(monday[0].date).toBe('2024-12-16');
    expect(
      selectDraws(draws, { weekday: 'all', limit: '10', prize: 'all' }),
    ).toHaveLength(10);
  });
  it('returns unique permutations, preserving leading zeros', () => {
    expect(permutations('079')).toEqual([
      '079',
      '097',
      '709',
      '790',
      '907',
      '970',
    ]);
    expect(permutations('070')).toEqual(['007', '070', '700']);
    expect(permutations('000')).toEqual(['000']);
    expect(permutations('09')).toEqual(['09', '90']);
  });
  it('finds the exact award and draw date and respects award filters', () => {
    expect(findOccurrences(draws, ['008'])).toContainEqual({
      date: '2024-09-16',
      label: 'เลขท้าย 3 ตัว',
      number: '008',
    });
    expect(findOccurrences(draws, ['008'], 'front')).toEqual([]);
    expect(findOccurrences(draws, ['21'])).toHaveLength(2);
    expect(findOccurrences(draws, [draws[0].prize1])).toContainEqual({
      date: draws[0].date,
      label: 'รางวัลที่ 1',
      number: draws[0].prize1,
    });
    expect(findOccurrences(draws, ['000000'])).toEqual([]);
  });
  it('counts two-digit prizes independently from three-digit awards', () => {
    const stats = analyzeTwo(draws);
    expect(stats.counts.find((v) => v.number === '00')?.count).toBe(1);
    expect(stats.counts.find((v) => v.number === '21')?.count).toBe(2);
    expect(stats.counts.reduce((s, v) => s + v.count, 0)).toBe(24);
    expect(stats.counts).toHaveLength(100);
    expect(scoreTwo('21', stats).score).toBeGreaterThan(0);
  });
  it('produces finite, bounded, deterministic scores with a transparent sum', () => {
    const stats = analyzeThree(draws, 'all');
    for (const pick of topPicks(stats)) {
      expect(pick.score).toBeGreaterThanOrEqual(0);
      expect(pick.score).toBeLessThanOrEqual(100);
      const scored = scoreThree(pick.number, stats);
      expect(scored.score).toBe(scored.components.reduce((a, b) => a + b, 0));
    }
    expect(topPicks(stats)).toEqual(topPicks(stats));
    expect(new Set(topPicks(stats).map((p) => p.number)).size).toBe(10);
  });
  it('handles empty selections without NaN or invented recommendations', () => {
    expect(topPicks(analyzeThree([], 'all'))).toEqual([]);
    expect(scoreThree('079', analyzeThree([], 'all')).score).toBe(0);
    expect(scoreTwo('09', analyzeTwo([])).score).toBe(0);
  });
});
