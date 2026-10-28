// Production assets only; synthetic demo and catalogue never access a vault or API.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const appRequire = createRequire(path.join(root, 'apps/library/package.json'));
const uiRequire = createRequire(path.join(root, 'packages/ui/package.json'));

(async () => {
  const { preview } = await import(pathToFileURL(appRequire.resolve('vite')).href);
  const app = await preview({ root: path.join(root, 'apps/library'), configFile: false, preview: { host: '127.0.0.1', port: 5198, strictPort: true } });
  const catalogue = await preview({ root: path.join(root, 'packages/ui'), configFile: false, build: { outDir: 'storybook-static' }, preview: { host: '127.0.0.1', port: 6198, strictPort: true } });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5198');
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const metrics = locator => locator.evaluate(el => {
      const css = getComputedStyle(el);
      return { height: el.getBoundingClientRect().height, width: el.getBoundingClientRect().width, background: css.backgroundColor, radius: css.borderRadius, color: css.color, font: css.fontFamily, outline: css.outlineWidth };
    });
    const primary = page.getByRole('button', { name: 'Add videos', exact: true });
    const expected = await metrics(primary);
    assert.equal(expected.background, 'rgb(189, 35, 66)');
    assert.equal(expected.radius, '8px');
    assert.equal(expected.height, 40);
    assert.equal((await metrics(page.getByLabel('Library name'))).height, expected.height);
    const favorite = page.getByRole('button', { name: 'Favorite demo' });
    assert.equal((await metrics(favorite)).width, 40);
    await favorite.click(); await favorite.hover();
    assert.equal(await favorite.getAttribute('aria-pressed'), 'true');
    assert.equal((await metrics(favorite)).background, 'rgb(48, 27, 34)');
    await page.getByRole('button', { name: 'Explore the controls' }).click();
    assert(await page.getByLabel('Library name').evaluate(el => el === document.activeElement), 'Input ref forwarded');
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    assert.equal((await metrics(page.getByLabel('Library name'))).outline, '2px');
    assert(await page.getByRole('button', { name: 'Saving…' }).isDisabled());
    await primary.click();
    await page.getByRole('status').filter({ hasText: 'No files were changed' }).waitFor();
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await page.getByRole('button', { name: 'Test form action' }).click();
    await page.getByRole('status').filter({ hasText: 'No files were changed' }).waitFor();
    await page.addScriptTag({ path: uiRequire.resolve('axe-core/axe.min.js') });
    const accessibility = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations);
    assert.deepEqual(accessibility.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) })), []);
    const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-foundation-'));
    await page.screenshot({ path: path.join(screenshots, 'desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    await page.screenshot({ path: path.join(screenshots, 'phone.png'), fullPage: true });
    await page.goto('http://127.0.0.1:6198/iframe.html?id=controls-button--primary&viewMode=story');
    const story = page.getByRole('button', { name: 'Save changes' });
    await story.waitFor();
    const actual = await metrics(story);
    for (const key of ['height', 'background', 'radius', 'font', 'color']) assert.equal(actual[key], expected[key], `App and Storybook share ${key}`);
    await page.goto('http://127.0.0.1:6198/iframe.html?id=controls-button--selection&viewMode=story');
    const toggle = page.getByRole('button', { name: 'Favorite', exact: true });
    await toggle.focus(); await page.keyboard.press('Space');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, screenshots, checks: ['production assets', 'app/catalogue theme parity', 'control alignment', 'refs', 'pressed hover', 'loading', 'native form', 'keyboard selection/focus', 'axe WCAG checks', 'narrow layout'] }));
  } finally {
    if (browser) await browser.close();
    await Promise.all([new Promise(resolve => app.httpServer.close(resolve)), new Promise(resolve => catalogue.httpServer.close(resolve))]);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
