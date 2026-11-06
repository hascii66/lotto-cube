import { describe, expect, it, vi, afterEach } from 'vitest';
import fixture from '../../tests/fixtures/draws.json';
import type { Draw } from './types';
const draws = fixture as Draw[];
import { mergeDraws, parseDraws, validateDraw } from './data';
import { getHistory } from './api';
import { readFileSync } from 'node:fs';

afterEach(() => vi.unstubAllGlobals());
describe('data boundary validation', () => {
  it('accepts the downloaded Sanook archive through the actual app importer', () => {
    const history = JSON.parse(
      readFileSync(
        new URL('../../data/lotto-history.json', import.meta.url),
        'utf-8',
      ),
    );
    const parsed = parseDraws(history);
    expect(parsed).toHaveLength(history.length);
    expect(parsed.length).toBeGreaterThanOrEqual(120);
    const known = parsed.find((d) => d.date === draws[0].date)!;
    expect(known.prize1).toBe(draws[0].prize1);
    expect([...known.front3].sort()).toEqual([...draws[0].front3].sort());
    expect([...known.back3].sort()).toEqual([...draws[0].back3].sort());
    expect(known.last2).toBe(draws[0].last2);
  });
  it('roundtrips all supplied records without numerical coercion', () => {
    expect(parseDraws(JSON.parse(JSON.stringify(draws)))).toEqual(draws);
    expect(validateDraw(draws[0]).prize1).toBe('097863');
  });
  it.each([
    { prize1: 97863 },
    { prize1: '97863' },
    { front3: ['290'] },
    { back3: ['070', 'xyz'] },
    { last2: '9' },
    { date: '2024-02-30' },
    { date: '2099-12-16' },
    { date: '<script>' },
  ])('rejects malformed or misleading records: %j', (patch) => {
    expect(() => validateDraw({ ...draws[0], ...patch })).toThrow();
  });
  it('rejects empty, non-array, and duplicate-date imports atomically', () => {
    expect(() => parseDraws([])).toThrow();
    expect(() => parseDraws({ draws })).toThrow();
    expect(() => parseDraws([draws[0], draws[0]])).toThrow();
    expect(() => parseDraws([draws[0], { ...draws[1], last2: 'bad' }])).toThrow(
      /รายการที่ 2|Entry 2/,
    );
  });
  it('keeps existing records during sync, replaces only on explicit import, and sorts', () => {
    const changed = { ...draws[0], last2: '09' };
    expect(mergeDraws([draws[0]], [changed])[0].last2).toBe(draws[0].last2);
    expect(mergeDraws([draws[0]], [changed], true)[0].last2).toBe('09');
    expect(mergeDraws([draws[23]], [draws[0]])[0].date).toBe(draws[0].date);
  });
});

describe('automatic same-origin history service', () => {
  it('deduplicates simultaneous checks and validates the complete response', async () => {
    const mocked = vi.fn().mockResolvedValue(
      Response.json({
        status: 'current',
        draws,
        checkedAt: '2026-11-05T12:00:00Z',
      }),
    );
    vi.stubGlobal('fetch', mocked);
    const first = getHistory();
    const second = getHistory();
    expect(first).toBe(second);
    expect((await first).draws).toHaveLength(24);
    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked.mock.calls[0][0]).toBe('/api/history');
  });
  it('rejects invalid awards and unavailable data without returning partial history', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ status: 'current', draws: [{ date: '2024-12-16' }] }),
        )
        .mockResolvedValueOnce(new Response('', { status: 503 })),
    );
    await expect(getHistory()).rejects.toThrow();
    await expect(getHistory()).rejects.toThrow();
  });
});
