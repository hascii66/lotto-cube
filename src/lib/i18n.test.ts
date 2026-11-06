import { afterEach, describe, expect, it } from 'vitest';
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import english from './en.json';
import thai from './th.json';
import { setLanguage, t } from './i18n';
import { formatDate, weekdays } from './format';

afterEach(() => setLanguage('th'));
describe('English and Thai locale contract', () => {
  it('translates semantic identifier keys such as last_three_number in both English and Thai', () => {
    setLanguage('th');
    expect(t('last_three_number')).toBe('ท้าย 3 ตัว');
    expect(t('last_two_number')).toBe('ท้าย 2 ตัว');
    expect(t('six_exact_digits')).toBe('6 ตัวตรง');
    setLanguage('en');
    expect(t('last_three_number')).toBe('Last 3 digits');
    expect(t('last_two_number')).toBe('Last 2 digits');
    expect(t('six_exact_digits')).toBe('6 exact digits');
  });

  it('translates placeholders and changes calendars and weekdays consistently', () => {
    setLanguage('en');
    expect(t('stored_draws', [238])).toBe('238 stored draws');
    expect(formatDate('2026-11-01')).toBe('1 November 2026');
    expect(weekdays()[0]).toBe('Sunday');
    setLanguage('th');
    expect(formatDate('2026-11-01')).toContain('2569');
  });

  it('contains strictly English keys in both en.json and th.json with complete key parity', () => {
    const enKeys = Object.keys(english);
    const thKeys = Object.keys(thai);

    expect(enKeys.filter((k) => /[ก-๛]/.test(k))).toEqual([]);
    expect(thKeys.filter((k) => /[ก-๛]/.test(k))).toEqual([]);
    expect(new Set(thKeys)).toEqual(new Set(enKeys));
  });

  it('ensures every t and tx call in application code uses a valid English key', () => {
    const invalidCalls: { file: string; text: string }[] = [];
    function scan(directory: string) {
      for (const item of readdirSync(directory, { withFileTypes: true })) {
        const path = resolve(directory, item.name);
        if (item.isDirectory()) scan(path);
        else if (/\.tsx?$/.test(path) && !path.endsWith('.test.ts')) {
          const source = ts.createSourceFile(
            path,
            readFileSync(path, 'utf8'),
            ts.ScriptTarget.Latest,
            true,
          );
          function visit(node: ts.Node) {
            if (
              ts.isCallExpression(node) &&
              ts.isIdentifier(node.expression) &&
              ['t', 'tx'].includes(node.expression.text)
            ) {
              const key = node.arguments[0];
              if (key && (ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key))) {
                if (/[ก-๛]/.test(key.text) || !(key.text.trim() in english)) {
                  invalidCalls.push({ file: path, text: key.text });
                }
              }
            }
            ts.forEachChild(node, visit);
          }
          visit(source);
        }
      }
    }
    scan('src');
    expect(invalidCalls).toEqual([]);
  });
});
