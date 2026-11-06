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
  topLastNumbers,
} from './analytics';
import { weekdayOf } from './format';

describe('statistics from the supplied historical results', () => {
  it('ranks only the actual last-two and last-three awards, preserving zeros', () => {
    expect(topLastNumbers([draws[0]], 3)).toEqual([
      { number: '339', count: 1 },
      { number: '881', count: 1 },
    ]);
    expect(topLastNumbers([draws[9]], 3)).toEqual([
      { number: '070', count: 1 },
      { number: '622', count: 1 },
    ]);
    expect(topLastNumbers([draws[4]], 2)).toEqual([{ number: '00', count: 1 }]);
  });
  it('orders tied frequencies numerically and never fills empty ranks with invented results', () => {
    expect(topLastNumbers(draws, 2).slice(0, 4)).toEqual([
      { number: '21', count: 2 },
      { number: '61', count: 2 },
      { number: '79', count: 2 },
      { number: '89', count: 2 },
    ]);
    expect(topLastNumbers(draws, 3).slice(0, 2)).toEqual([
      { number: '070', count: 2 },
      { number: '421', count: 2 },
    ]);
    expect(topLastNumbers(draws, 3)).toHaveLength(10);
    expect(topLastNumbers([], 2)).toEqual([]);
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
