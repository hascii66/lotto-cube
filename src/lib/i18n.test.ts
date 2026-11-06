import { afterEach, describe, expect, it } from 'vitest';
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import english from './en.json';
import { setLanguage, t } from './i18n';
import { formatDate, weekdays } from './format';

afterEach(() => setLanguage('th'));
describe('English and Thai locale contract', () => {
  it('translates placeholders and changes calendars and weekdays consistently', () => {
    setLanguage('en');
    expect(t('{0} งวดในคลัง', [238])).toBe('238 stored draws');
    expect(formatDate('2026-11-01')).toBe('1 November 2026');
    expect(weekdays()[0]).toBe('Sunday');
    setLanguage('th');
    expect(formatDate('2026-11-01')).toContain('2569');
  });
  it('has an English entry for every Thai translation key used in application code', () => {
    const missing: string[] = [];
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
              if (
                key &&
                ts.isStringLiteral(key) &&
                /[ก-๛]/.test(key.text) &&
                !(key.text.trim() in english)
              )
                missing.push(key.text);
            }
            ts.forEachChild(node, visit);
          }
          visit(source);
        }
      }
    }
    scan('src');
    expect(missing).toEqual([]);
  });
});
