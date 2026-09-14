// Run against `npm run preview` with Playwright installed, or set PLAYWRIGHT_MODULE.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname;
        const photos = Array.from({ length: 90 }, (_, i) => ({ id: String(i), filename: `Photo ${i}`, filepath: `sample-${i}`, album: 'Test album' }));
        return route.fulfill({ json: path === '/api/photos/all' ? photos : path === '/api/stats' ? {} : [] });
      });
      await page.route('**/media?*', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#aaa"/></svg>' }));
      await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:4174');
      await page.getByRole('button', { name: viewport.width > 767 ? 'Photographs' : 'Photos', exact: true }).last().click();
      await page.locator('.photo-masonry img').first().waitFor();
      await page.locator('.photo-masonry img').evaluateAll(imgs => Promise.all(imgs.map(img => { img.loading = 'eager'; return img.decode(); })));
      // Retain a containing block after entrance motion, as affected WebViews do.
      await page.addStyleTag({ content: '#archive-content > .rise { animation: none; transform: translateY(0); }' });
      const main = page.locator('#archive-content');
      assert.ok(await main.evaluate(el => el.scrollHeight > el.clientHeight * 3));
      for (const fraction of [0, 0.5, 1]) {
        await main.evaluate((el, fraction) => { el.scrollTop = (el.scrollHeight - el.clientHeight) * fraction; }, fraction);
        const photo = page.locator('.photo-masonry .archive-media').nth(Math.floor(89 * fraction));
        await photo.scrollIntoViewIfNeeded();
        await photo.focus();
        const before = await main.evaluate(el => el.scrollTop);
        await photo.click();
        const viewer = page.getByRole('dialog', { name: 'Photo viewer' });
        await viewer.waitFor();
        const box = await viewer.boundingBox();
        assert.deepEqual(box, { x: 0, y: 0, ...viewport });
        assert.equal(await viewer.evaluate(el => el.parentElement === document.body), true);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Tab');
        assert.equal(await viewer.evaluate(el => el.contains(document.activeElement)), true);
        await page.keyboard.press('Escape');
        assert.ok(Math.abs(await main.evaluate(el => el.scrollTop) - before) < 2, 'Closing the viewer moved the archive');
        assert.equal(await photo.evaluate(el => el === document.activeElement), true);

        // Invoke the page-owned dialog without Playwright scrolling its trigger into view.
        await page.getByRole('button', { name: 'From a link', exact: true }).evaluate(el => el.click());
        const panel = page.getByText('Add photos from a URL', { exact: true }).locator('..');
        await panel.waitFor();
        await panel.evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
        const modal = await panel.boundingBox();
        assert.ok(modal.y >= 0 && modal.y + modal.height <= viewport.height, 'Modal escaped the visible viewport');
        assert.ok(Math.abs(modal.y + modal.height / 2 - viewport.height / 2) < 2, 'Modal was not centered');
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('Photo viewer and page modal remain in the viewport on long desktop and mobile pages.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
