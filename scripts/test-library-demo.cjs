// Synthetic UI only. Tests production output, never the existing app or real vault.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const appRequire = createRequire(path.join(root, 'apps/library/package.json'));
const uiRequire = createRequire(path.join(root, 'packages/ui/package.json'));

(async () => {
  const { preview } = await import(pathToFileURL(appRequire.resolve('vite')).href);
  const server = await preview({ root: path.join(root, 'apps/library'), configFile: false, preview: { host: '127.0.0.1', port: 5197, strictPort: true } });
  const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-library-rebuild-'));
  console.log('Screenshots: ' + screenshots);
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5197/?demo=1');
    await page.getByRole('heading', { name: 'Your video library' }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const typography = await page.getByRole('heading', { name: 'Your video library' }).evaluate(el => {
      const style = getComputedStyle(el);
      return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize, tracking: style.letterSpacing };
    });
    assert(typography.family.includes('Segoe UI Variable'));
    assert.equal(typography.weight, '750');
    assert.equal(typography.size, '36px');
    assert.equal(typography.tracking, '-1px');
    const cards = page.locator('article');
    assert.equal(await cards.count(), 12);
    const artwork = cards.locator('img').first();
    const originalArtwork = await artwork.getAttribute('src');
    for (const [width, height] of [[240, 480], [640, 360], [800, 200]]) {
      await artwork.evaluate(async (img, size) => {
        const [width, height] = size;
        img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#31545a"/><rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="white" stroke-width="4"/></svg>`)}`;
        await img.decode();
      }, [width, height]);
      await artwork.hover();
      const fit = await artwork.evaluate(img => {
        const style = getComputedStyle(img), frame = img.parentElement.parentElement.getBoundingClientRect(), box = img.getBoundingClientRect();
        return { fit: style.objectFit, transform: style.transform, frameRatio: frame.width / frame.height, width: box.width, height: box.height, frameWidth: frame.width, frameHeight: frame.height };
      });
      assert.equal(fit.fit, 'contain');
      assert.equal(fit.transform, 'none', 'Hover must not crop thumbnail edges');
      assert(Math.abs(fit.frameRatio - 16 / 9) < 0.02, 'Frames remain widescreen at every preview size');
      assert(Math.abs(fit.width - fit.frameWidth) < 1 && Math.abs(fit.height - fit.frameHeight) < 1, 'Artwork stays bounded by its frame');
      await artwork.screenshot({ path: path.join(screenshots, `thumbnail-${width}x${height}.png`) });
    }
    await artwork.evaluate(async (img, src) => { img.src = src; await img.decode(); }, originalArtwork);
    const navigation = page.getByRole('navigation', { name: 'Library navigation' });
    const currentLink = navigation.getByRole('link', { name: 'Videos', exact: true });
    assert.equal(await currentLink.getAttribute('aria-current'), 'page');
    assert.equal((await currentLink.boundingBox()).height, 44, 'Sidebar rows retain shared geometry');
    assert.equal(await navigation.getByText('Library', { exact: true }).evaluate(el => getComputedStyle(el).fontSize), '11px', 'Group labels use the eyebrow style');
    assert(await navigation.getByRole('button', { name: 'Collections', exact: true }).isDisabled());
    const sortControl = page.getByRole('combobox', { name: 'Sort videos', exact: true });
    const toolbarStyle = await sortControl.evaluate(el => {
      const style = getComputedStyle(el);
      return { background: style.backgroundColor, height: el.getBoundingClientRect().height };
    });
    assert.equal(toolbarStyle.background, 'rgba(0, 0, 0, 0)', 'Toolbar select should have no idle box fill');
    assert.equal(toolbarStyle.height, 42, 'Toolbar controls share the 42px control height');
    const subtitle = page.getByText('Find a favorite. Pick up where you left off.', { exact: true });
    assert.equal(await subtitle.evaluate(el => getComputedStyle(el).fontSize), '14px');
    const tagButton = cards.getByRole('button', { name: /^Filter by tag:/ }).first();
    const cardTag = (await tagButton.getAttribute('aria-label')).replace('Filter by tag: ', '');
    await tagButton.click();
    await page.getByRole('button', { name: `Remove Tags (all): ${cardTag} filter`, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
    assert.equal(await cards.count(), 12);
    await page.screenshot({ path: path.join(screenshots, 'desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 2560, height: 1440 });
    const wideGrid = await page.getByTestId('video-grid').boundingBox();
    assert(wideGrid.width > 2200, 'Library should fill the available desktop width');
    assert.equal(await page.getByTestId('video-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 6);
    await page.screenshot({ path: path.join(screenshots, 'wide.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.getByRole('combobox', { name: 'Preview size', exact: true }).click();
    const previewMenu = page.locator('[data-scope="select"][data-part="content"]:visible');
    const compactBox = await previewMenu.boundingBox();
    assert(compactBox.width < 300 && compactBox.height < 220, 'Three preview choices should form a compact menu');
    for (const option of await previewMenu.getByRole('option').all()) assert((await option.boundingBox()).height <= 48);
    await page.screenshot({ path: path.join(screenshots, 'preview-menu.png') });
    await page.keyboard.press('Escape');
    const first = await cards.first().getAttribute('aria-label');
    async function choose(label, option) {
      await page.getByRole('combobox', { name: label, exact: true }).click();
      await page.getByRole('option', { name: option, exact: true }).click();
    }
    async function bounded(selector) {
      await page.locator(selector + ':visible').last().waitFor({ state: 'visible' });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const box = await page.locator(selector + ':visible').last().boundingBox();
      const viewport = page.viewportSize();
      assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, JSON.stringify(box));
    }
    await choose('Sort videos', 'Oldest first');
    assert.notEqual(await cards.first().getAttribute('aria-label'), first);
    await choose('Preview size', 'Large previews');
    assert.equal(await page.getByTestId('video-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 2);
    await choose('Preview size', 'Small previews');
    assert.equal(await page.getByTestId('video-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 4);
    await page.getByRole('button', { name: 'next page', exact: true }).click();
    await page.getByText('13–24 of 38 videos', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByText('Filter videos', { exact: true }).waitFor();
    await bounded('[data-scope="popover"][data-part="content"]');
    await choose('Resolution', '4K');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByText('1–12 of 13 videos', { exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Search videos' }).fill('Alex');
    assert(await cards.count() > 0);
    for (const card of await cards.all()) assert((await card.innerText()).includes('Alex Morgan'));
    await page.getByText('Active filters', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(screenshots, 'active-filters.png') });
    await page.getByRole('button', { name: 'Clear search & filters', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search videos' }).fill('no matching synthetic title');
    await page.getByRole('heading', { name: 'No videos match' }).waitFor();
    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    await page.getByRole('button', { name: 'Manage', exact: true }).click();
    await page.getByText('Select this page', { exact: true }).click();
    assert(await page.getByRole('checkbox', { name: 'Select this page', exact: true }).isChecked());
    await page.getByText('12 selected', { exact: true }).waitFor();
    const dock = page.getByRole('region', { name: 'Manage videos', exact: true });
    assert.equal(await dock.evaluate(el => getComputedStyle(el).position), 'fixed');
    await page.screenshot({ path: path.join(screenshots, 'manage-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    const dockBox = await dock.boundingBox();
    assert(dockBox.x >= 0 && dockBox.x + dockBox.width <= 390 && dockBox.y + dockBox.height <= 844);
    await page.screenshot({ path: path.join(screenshots, 'manage-phone.png') });
    await page.getByRole('button', { name: 'Exit Manage mode', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.hasAttribute('data-manage-toggle'));
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.getByRole('button', { name: 'Manage', exact: true }).click();
    assert(!(await page.getByRole('checkbox', { name: 'Select this page', exact: true }).isChecked()));
    await page.getByText('Select this page', { exact: true }).click();
    await page.getByRole('button', { name: 'Add to collection', exact: true }).click();
    await page.getByRole('dialog', { name: 'Add to a collection' }).waitFor();
    await choose('Collection', 'Watch later');
    await page.getByRole('button', { name: 'Add selected videos' }).click();
    assert.equal(await page.getByText('In Watch later', { exact: true }).count(), 12);
    await page.getByText('Select this page', { exact: true }).click();
    assert(await page.getByRole('checkbox', { name: 'Select this page', exact: true }).isChecked());
    await page.getByRole('button', { name: 'Remove from demo', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm removal' }).click();
    await page.getByText('1–12 of 26 videos', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Undo removal' }).click();
    await page.getByText('1–12 of 38 videos', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Done managing', exact: true }).click();
    const previewButton = cards.first().getByRole('button', { name: /^Preview / });
    await previewButton.click();
    await page.getByText('Synthetic preview · no video file is loaded.', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(el => el === document.activeElement, await previewButton.elementHandle());
    await page.addScriptTag({ path: uiRequire.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations);
    assert.deepEqual(violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) })), []);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No narrow overflow');
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await bounded('[data-scope="popover"][data-part="content"]');
    await page.getByRole('combobox', { name: 'Person', exact: true }).click();
    await bounded('[data-scope="select"][data-part="content"]');
    await page.keyboard.press('Escape');
    assert(await page.getByText('Filter videos', { exact: true }).isVisible(), 'Nested Escape preserves parent');
    await page.keyboard.press('Escape');
    await page.waitForFunction(el => el === document.activeElement, await page.getByRole('button', { name: 'Filters', exact: true }).elementHandle());
    await page.screenshot({ path: path.join(screenshots, 'phone.png'), fullPage: true });
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    assert(await page.getByRole('navigation', { name: 'Library navigation' }).isVisible());
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.getByText('Demo tools · no real files or downloads', { exact: true }).click();
    await choose('Preview screen state', 'Error and recovery');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    assert.equal(await cards.count(), 12);
    await choose('Preview screen state', 'Loading');
    await page.getByRole('button', { name: 'Finish loading demo' }).click();
    assert.equal(await cards.count(), 12);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks: ['sorting', 'preview sizes', 'paging and resets', 'intersecting filters', 'chips and empty recovery', 'selection and collection edits', 'removal and undo', 'dialog focus', 'nested overlays and Escape', 'narrow shell', 'loading/error recovery', 'axe WCAG checks'], screenshots }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });









