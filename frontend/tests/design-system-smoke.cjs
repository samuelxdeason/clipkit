const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..'), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-design-system-'));
  const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5190', '--strictPort'], { cwd: root, windowsHide: true, stdio: 'pipe' });
  let browser;
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:5190')).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5190/design-system.html');
    const toggle = page.getByRole('button', { name: 'Toggle selection' });
    await toggle.focus(); await page.keyboard.press('Space');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    assert(await page.getByRole('button', { name: 'Unavailable' }).isDisabled());
    const contrast = await page.locator('.finder-shell').evaluate(el => {
      const css = getComputedStyle(el), lum = hex => {
        const rgb = hex.trim().replace('#', '').match(/../g).map(n => parseInt(n, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      };
      return ['--ui-primary-start', '--ui-primary-end', '--ui-primary-hover-start', '--ui-primary-hover-end'].map(t => 1.05 / (lum(css.getPropertyValue(t)) + .05));
    });
    assert(contrast.every(r => r >= 4.5), JSON.stringify(contrast));
    assert.equal(await page.locator('.library-card').count(), 5);
    await page.getByRole('button', { name: 'Play An afternoon in the hills', exact: true }).click();
    await page.getByText('Video playback action', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Open Mountain light.jpg', exact: true }).click();
    await page.getByText('Photo viewer action', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Select Mountain light.jpg', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Deselect Mountain light.jpg', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: path.join(temp, 'desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('.ui-page-header h1').first().evaluate(el => getComputedStyle(el).fontSize), '28px');
    await page.screenshot({ path: path.join(temp, 'phone.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, screenshots: temp, checks: ['keyboard toggle', 'disabled state', 'primary text contrast', 'responsive typography', 'narrow overflow'] }));
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
