import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
const history = JSON.parse(readFileSync('data/lotto-history.json', 'utf8')) as {
  date: string;
  prize1: string;
  front3: string[];
  back3: string[];
  last2: string;
}[];

const current = {
  status: 'current',
  draws: history,
  checkedAt: '2026-11-05T12:00:00Z',
};
test.beforeEach(async ({ page }) => {
  await page.route('**/api/history', (route) =>
    route.fulfill({ json: current }),
  );
});

test('loads the full real archive, checks automatically once, and has no manual sync', async ({
  page,
}) => {
  let checks = 0;
  await page.route('**/api/history', (route) => {
    checks++;
    return route.fulfill({ json: current });
  });
  await page.goto('/');
  await expect(page.locator('.metric-value').first()).toContainText(
    String(history.length),
  );
  await expect(page.locator('.metric-value').nth(1)).toContainText(
    (history.length * 5).toLocaleString('en-GB'),
  );
  await expect(page.locator('.freshness-note')).toContainText(
    'ข้อมูลครบถึงงวดที่ประกาศล่าสุด',
  );
  await expect(page.getByRole('button', { name: /ซิงค์|sync/i })).toHaveCount(
    0,
  );
  expect(checks).toBe(1);
  await page.getByLabel('จำนวนงวด', { exact: true }).selectOption('10');
  await expect(page.locator('.metric-value').nth(1)).toContainText('50');
  await page.reload();
  await expect(page.getByLabel('จำนวนงวด', { exact: true })).toHaveValue('10');
});

test('old seed storage is migrated, missing draws are restored, and personal data is retained', async ({
  page,
}) => {
  const personal = { ...history[0], date: '2016-11-01', source: 'manual' };
  await page.addInitScript(
    (record) =>
      localStorage.setItem('lottolab.draws.v1', JSON.stringify([record])),
    personal,
  );
  await page.goto('/?view=history');
  await expect(page.locator('.freshness-note')).toContainText(
    'ข้อมูลครบถึงงวดที่ประกาศล่าสุด',
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lottocube.draws.v1')!),
  );
  expect(saved).toHaveLength(history.length + 1);
  expect(
    saved.find((d: { date: string }) => d.date === '2016-11-01').source,
  ).toBe('manual');
});

test('homepage top tens follow the latest draw and open award-specific history', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('.top-last-section');
  expect(
    await section.evaluate((node) =>
      node.previousElementSibling?.classList.contains('latest-row'),
    ),
  ).toBe(true);
  await expect(
    section.getByRole('heading', { name: 'Top 10 เลขท้ายที่ออกบ่อย' }),
  ).toBeVisible();
  await expect(section.locator('.top-last-number')).toHaveCount(20);
  await expect(section).toContainText(
    `จากฐานข้อมูลทั้งหมด ${history.length} งวด`,
  );
  const rankingBefore = await section
    .locator('.top-last-number')
    .allTextContents();
  await page.getByLabel('จำนวนงวด', { exact: true }).selectOption('10');
  expect(await section.locator('.top-last-number').allTextContents()).toEqual(
    rankingBefore,
  );
  for (let i = 0; i < 2; i++) {
    const button = section
      .locator('.top-last-card')
      .nth(i)
      .locator('.top-last-number')
      .first();
    const number = await button.locator('strong').innerText();
    const count = Number(
      (await button.locator('.top-last-count').innerText()).replace(/\D/g, ''),
    );
    await button.click();
    await expect(page.getByRole('dialog')).toContainText(number);
    await expect(page.getByRole('dialog').locator('.hit-list li')).toHaveCount(
      count,
    );
    for (const label of await page
      .getByRole('dialog')
      .locator('.hit-list li > span')
      .allTextContents())
      expect(label).toBe(i === 0 ? 'เลขท้าย 2 ตัว' : 'เลขท้าย 3 ตัว');
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  }
});

test('source failure keeps charts available and reports unverified freshness', async ({
  page,
}) => {
  await page.route('**/api/history', (route) => route.fulfill({ status: 503 }));
  await page.goto('/');
  await expect(page.locator('.freshness-note')).toContainText(
    'ยังตรวจสอบงวดล่าสุดไม่ได้',
  );
  await expect(page.locator('.metric-value').first()).toContainText(
    String(history.length),
  );
});

test('history search, highlights, clearing, pagination, and Back preserve state', async ({
  page,
}) => {
  await page.goto('/?view=history');
  await page.getByLabel('ค้นหาเลขในฐานข้อมูล').fill('008');
  await expect(page.locator('mark').first()).toHaveText('008');
  await page.getByRole('button', { name: 'ล้างคำค้นหา' }).click();
  await expect(page.getByLabel('ค้นหาเลขในฐานข้อมูล')).toBeFocused();
  await page.getByRole('button', { name: 'หน้าถัดไป' }).click();
  await expect(page.locator('.pagination')).toContainText('หน้า 2');
  await page.getByRole('link', { name: /วิเคราะห์เลข 2 ตัว/ }).click();
  await page.goBack();
  await expect(page.locator('.pagination')).toContainText('หน้า 2');
  await page.getByLabel('ค้นหาเลขในฐานข้อมูล').fill('does-not-exist');
  await expect(page.locator('.empty-state')).toContainText('ไม่พบเลข');
});

test('scorer validates and computes unique permutations and actual history', async ({
  page,
}) => {
  await page.goto('/?view=scorer');
  await page.getByRole('button', { name: 'เช็คสถิติ & คะแนน' }).click();
  await expect(page.locator('#scorer-error')).not.toBeEmpty();
  await page
    .getByRole('button', { name: 'เปลี่ยนภาษา / Change language' })
    .click();
  await expect(page.locator('#scorer-error')).toContainText(
    'Enter one to three',
  );
  await page
    .getByRole('button', { name: 'Change language / เปลี่ยนภาษา' })
    .click();
  await page.locator('#scorer-0').fill('070');
  await page.getByRole('button', { name: 'เช็คสถิติ & คะแนน' }).click();
  await expect(page.locator('.permutation-grid > div')).toHaveCount(3);
  await expect(page.locator('.hit-list')).toContainText('เลขท้าย 3 ตัว');
});

test('manual input and reviewed imports retain validation and cancellation behavior', async ({
  page,
}) => {
  await page.goto('/?view=history');
  await page
    .getByRole('button', { name: 'เพิ่มผลสลากงวดใหม่', exact: true })
    .click();
  await page.getByRole('button', { name: 'บันทึกผลสลาก', exact: true }).click();
  await expect(page.locator('#add-date')).toBeFocused();
  await page.locator('#add-prize1').fill('097863');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toContainText(
    'ยังมีข้อมูลที่ไม่ได้บันทึก',
  );
  await page.getByRole('button', { name: 'ปิดโดยไม่บันทึก' }).click();
  await page.getByRole('button', { name: 'นำเข้า JSON', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('[{}]'),
  });
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'รายการที่ 1',
  );
  await page
    .locator('input[type=file]')
    .setInputFiles('data/lotto-history.json');
  await expect(page.getByRole('dialog')).toContainText(
    `ตรวจรูปแบบผ่าน · ${history.length} งวด`,
  );
  await page
    .getByRole('button', { name: 'บันทึกข้อมูลที่นำเข้า', exact: true })
    .click();
  await page.reload();
  await expect(page.locator('.database-pill')).toContainText(
    String(history.length),
  );
});

test('language and theme switch live, persist, and follow the system by default', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page
    .getByRole('button', { name: 'เปลี่ยนภาษา / Change language' })
    .click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', { name: 'Every number tells a story.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Theme: System · change theme' })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

for (const language of ['th', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`${language} ${theme}: readable, accessible, and mobile layouts across all views`, async ({
      page,
    }) => {
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem('lottocube.language', language);
          localStorage.setItem('lottocube.theme', theme);
        },
        { language, theme },
      );
      await page.setViewportSize({ width: 390, height: 844 });
      for (const view of [
        'overview',
        'three',
        'two',
        'scorer',
        'history',
        'guide',
      ]) {
        await page.goto(`/?view=${view}`);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `overflow: ${view}`,
        ).toBe(true);
        if (language === 'en') {
          const text = (await page.locator('body').innerText()).replaceAll(
            'ไทย',
            '',
          );
          expect(text, `untranslated text on ${view}`).not.toMatch(/[ก-๛]/);
        }
        const audit = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(
          audit.violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
          `${view} accessibility`,
        ).toEqual([]);
      }
      await page.goto('/');
      await page.screenshot({
        path: `test-results/mobile-${language}-${theme}.png`,
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1050 });
      const desktopAudit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        desktopAudit.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/desktop-${language}-${theme}.png`,
        fullPage: true,
      });
    });
  }

test('320px layout, keyboard dialog restoration, installation help, and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?view=two');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator('.heat-cell').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.heat-cell').first()).toBeFocused();
  await page.getByRole('button', { name: 'ติดตั้งแอป', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Safari');
});
