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
  await page.goto('/?view=three');
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

test('next-draw picks cover three award types and open exact award history', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('.top-last-section');
  expect(
    await section.evaluate((node) =>
      node.nextElementSibling?.classList.contains('latest-peek'),
    ),
  ).toBe(true);
  await expect(
    section.getByRole('heading', { name: '10 เลขคัดสำหรับงวดถัดไป' }),
  ).toBeVisible();
  await expect(section.locator('.top-last-number')).toHaveCount(10);
  await expect(section.locator('.top-last-card')).toHaveCount(1);
  await section.getByText('สูตรคำนวณที่ตรวจสอบได้').click();
  await expect(section.locator('.formula[open]')).toContainText(
    'คะแนนแต่ละหลัก',
  );
  await expect(section).toContainText('ไม่รับประกันผล');
  await expect(section).toContainText(
    `จากฐานข้อมูลทั้งหมด ${history.length} งวด`,
  );
  const rankingBefore = await section
    .locator('.top-last-number')
    .allTextContents();
  await page.goto('/?limit=10');
  expect(await section.locator('.top-last-number').allTextContents()).toEqual(
    rankingBefore,
  );
  for (let i = 0; i < 3; i++) {
    await section.locator('.pick-awards button').nth(i).click();
    const button = section
      .locator('.top-last-card')
      .first()
      .locator('.top-last-number')
      .first();
    const number = await button.locator('strong').innerText();
    expect(number).toHaveLength([2, 3, 6][i]);
    const score = Number(await button.locator('.top-last-count').innerText());
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    const count = history
      .flatMap((draw) =>
        i === 0 ? [draw.last2] : i === 1 ? draw.back3 : [draw.prize1],
      )
      .filter((n) => n === number).length;
    await button.click();
    await expect(page.getByRole('dialog')).toContainText(number);
    await expect(page.getByRole('dialog').locator('.hit-list li')).toHaveCount(
      count,
    );
    for (const label of await page
      .getByRole('dialog')
      .locator('.hit-list li > span')
      .allTextContents())
      expect(label).toBe(['เลขท้าย 2 ตัว', 'เลขท้าย 3 ตัว', 'รางวัลที่ 1'][i]);
    if (!count)
      await expect(page.getByRole('dialog')).toContainText('ยังไม่เคยพบเลขนี้');
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  }
});

test('source failure keeps picks available and reports unverified freshness', async ({
  page,
}) => {
  await page.route('**/api/history', (route) => route.fulfill({ status: 503 }));
  await page.goto('/');
  await expect(page.locator('.freshness-note')).toContainText(
    'ยังตรวจสอบงวดล่าสุดไม่ได้',
  );
  await expect(page.locator('.top-last-number')).toHaveCount(10);
});

test('historical picks exclude selected and later results and preserve the chosen draw', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('.top-last-section');
  const selector = page.locator('#pick-draw');
  await expect(selector.locator('option')).toHaveCount(history.length + 1);
  await selector.click();
  await page.keyboard.press('Escape');
  await expect(selector).toBeFocused();
  const target = history[Math.floor(history.length / 2)];
  const earlier = history.filter((draw) => draw.date < target.date);
  await selector.selectOption(target.date);
  await expect(selector).toBeFocused();
  await expect(page).toHaveURL(new RegExp(`pickDraw=${target.date}`));
  await expect(section).toContainText(
    'ไม่ใช่บันทึกเลขคัดที่เผยแพร่ไว้ในวันนั้น',
  );
  await expect(section).toContainText(
    `ใช้ข้อมูลก่อนงวดที่เลือก ${earlier.length} งวด`,
  );
  for (const [i, digits] of ([2, 3, 6] as const).entries()) {
    await section.locator('.pick-awards button').nth(i).click();
    const card = section.locator('.top-last-card').first();
    const values = earlier.flatMap((draw) =>
      digits === 2 ? [draw.last2] : digits === 3 ? draw.back3 : [draw.prize1],
    );
    const counts = Array.from({ length: digits }, (_, position) =>
      Array.from(
        { length: 10 },
        (_, digit) =>
          values.filter((number) => number[position] === String(digit)).length,
      ),
    );
    const best = counts
      .map((position) => position.indexOf(Math.max(...position)))
      .join('');
    await expect(card.locator('.top-last-number strong').first()).toHaveText(
      best,
    );
    const expected = await card
      .locator('.top-last-number strong')
      .allTextContents();
    expect(expected).toHaveLength(10);
    const scores = await card.locator('.top-last-count').allTextContents();
    for (const [rank, number] of expected.entries()) {
      const score =
        ([...number].reduce(
          (sum, digit, i) =>
            sum + counts[i][Number(digit)] / Math.max(...counts[i]),
          0,
        ) /
          digits) *
        100;
      expect(Number(scores[rank])).toBe(Math.round(score * 10) / 10);
    }
    const actual =
      digits === 2
        ? [target.last2]
        : digits === 3
          ? target.back3
          : [target.prize1];
    await expect(card.locator('.pick-comparison strong')).toHaveText(
      actual.join(' · '),
    );
    const matches = actual.filter((number) => expected.includes(number));
    await expect(card.locator('.pick-comparison')).toContainText(
      `${matches.length}/${actual.length}`,
    );
    expect(
      await card.locator('.top-last-match strong').allTextContents(),
    ).toEqual(expected.filter((number) => actual.includes(number)));
  }
  await section.locator('.top-last-number').first().click();
  for (const date of await page
    .getByRole('dialog')
    .locator('time')
    .evaluateAll((nodes) => nodes.map((node) => node.dateTime)))
    expect(date < target.date).toBe(true);
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(selector).toHaveValue(target.date);
  await page
    .getByRole('button', { name: 'เปลี่ยนภาษา / Change language' })
    .click();
  await expect(selector).toHaveValue(target.date);
  await expect(section).toContainText('Reconstructed with');
  await selector.selectOption('next');
  await page.goBack();
  await expect(selector).toHaveValue(target.date);
  await page.goForward();
  await expect(selector).toHaveValue('next');
});

test('oldest and missing draws explain why no historical picks can be shown', async ({
  page,
}) => {
  const oldest = [...history].sort((a, b) => a.date.localeCompare(b.date))[0];
  await page.goto(`/?pickDraw=${oldest.date}`);
  const section = page.locator('.top-last-section');
  await expect(section.locator('.top-last-number')).toHaveCount(0);
  await expect(section.locator('.pick-comparison')).toHaveCount(1);
  await expect(section.locator('.empty-state').first()).toContainText(
    'ไม่มีข้อมูลก่อนงวดนี้สำหรับคัดเลข',
  );
  await page.goto('/?pickDraw=1900-01-01');
  await expect(section).toContainText('ไม่พบงวดที่เลือกในคลัง');
  await expect(section.locator('.top-last-number')).toHaveCount(0);
  await page.locator('#pick-draw').selectOption('next');
  await expect(section.locator('.top-last-number')).toHaveCount(10);
});

test('next-draw numbers fit narrow phones and sidebar breakpoint widths', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('lottocube.language', 'en'),
  );
  await page.goto('/');
  for (const width of [320, 650, 801, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    for (let category = 0; category < 3; category++) {
      await page.locator('.pick-awards button').nth(category).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `page overflow at ${width}px`,
      ).toBe(true);
      const clipped = await page
        .locator('.top-last-number strong')
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => node.scrollWidth > node.clientWidth)
            .map((node) => node.textContent),
        );
      expect(clipped, `clipped picks at ${width}px`).toEqual([]);
    }
    if (width === 320)
      await page
        .locator('.top-last-section')
        .screenshot({ path: 'test-results/picks-320.png' });
  }
});

test('mobile homepage shows all ten picks immediately and shortcuts retain context', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'เมนูลัดมือถือ' });
  await expect(nav).toBeVisible();
  const lastPick = await page.locator('.top-last-number').last().boundingBox();
  const navBox = await nav.boundingBox();
  expect(lastPick!.y + lastPick!.height).toBeLessThan(navBox!.y);
  await expect(page.locator('.metric-grid, .filter-bar')).toHaveCount(0);
  const category = page.getByRole('group', { name: 'เลือกประเภทเลขคัด' });
  await category
    .getByRole('button', { name: 'ท้าย 3 ตัว', exact: true })
    .click();
  await expect(page).toHaveURL(/pickDigits=3/);
  await page.reload();
  await expect(
    category.getByRole('button', { name: 'ท้าย 3 ตัว', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.latest-peek > summary').click();
  await expect(page.locator('.draw-ticket')).toBeVisible();
  await expect(page.locator('.draw-ticket')).toContainText(
    history[0].front3.join(' · '),
  );
  await page.locator('.latest-peek > summary').click();
  await nav.getByRole('link', { name: 'เช็กเลข', exact: true }).click();
  await expect(page.locator('#scorer-0')).toBeVisible();
  await nav.getByRole('link', { name: 'ย้อนหลัง', exact: true }).click();
  await expect(page.getByLabel('ค้นหาเลขในฐานข้อมูล')).toBeVisible();
  await nav.getByRole('link', { name: 'เลขคัด', exact: true }).click();
  await expect(
    category.getByRole('button', { name: 'ท้าย 3 ตัว', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const menu = page.getByRole('button', { name: 'เปิดเมนูหลัก', exact: true });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('button', { name: 'ปิดเมนู', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
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
    page.getByRole('heading', { name: 'Picks and past results' }),
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
        if (view === 'overview')
          await page.locator('#pick-draw').selectOption(history[1].date);
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
  await page.getByRole('button', { name: 'เปิดเมนูหลัก', exact: true }).click();
  await page.getByRole('button', { name: 'ติดตั้งแอป', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Safari');
});
