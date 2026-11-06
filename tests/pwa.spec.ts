import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:4173' });
test('production PWA installs its shell and fonts and reopens offline in both languages', async ({
  page,
  context,
  request,
}) => {
  const manifestResponse = await request.get('/manifest.webmanifest');
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe('standalone');
  expect(
    manifest.icons.some(
      (icon: { purpose: string }) => icon.purpose === 'maskable',
    ),
  ).toBe(true);
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    const bytes = await response.body();
    expect(bytes.readUInt32BE(16)).toBe(icon.sizes === '192x192' ? 192 : 512);
  }
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(
      names.find((name) => name.startsWith('lottocube-'))!,
    );
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  expect(cached.some((path) => path.endsWith('.woff2'))).toBe(true);
  expect(cached.some((path) => path.startsWith('/api/'))).toBe(false);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: 'เลขคัดและผลย้อนหลัง' }),
  ).toBeVisible();
  await expect(page.locator('.freshness-note')).toContainText('ออฟไลน์');
  await page
    .getByRole('button', { name: 'เปลี่ยนภาษา / Change language' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Picks and past results' }),
  ).toBeVisible();
  const reopened = await context.newPage();
  await reopened.goto('/?view=two', { waitUntil: 'domcontentloaded' });
  await expect(reopened.locator('.heat-cell')).toHaveCount(100);
  await expect(reopened.locator('html')).toHaveAttribute('lang', 'en');
  await reopened.close();
});
