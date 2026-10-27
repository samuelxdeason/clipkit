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
    assert(await page.getByRole('button', { name: 'Unavailable', exact: true }).isDisabled());
    await page.emulateMedia({reducedMotion:'reduce'});
    const style=async(el)=>el.evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,color:s.color,border:s.borderTopColor,outline:s.outlineColor,width:s.outlineWidth,opacity:s.opacity,transform:s.transform};});
    const selected=await style(toggle);
    await toggle.hover();
    assert.equal((await style(toggle)).background,selected.background,'Hover retains pressed state');
    await toggle.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
    assert.equal((await style(toggle)).width,'2px','Keyboard focus is visible');
    const disabled=page.getByRole('button',{name:'Unavailable',exact:true});
    const disabledBefore=await style(disabled);await disabled.hover({force:true});
    assert.equal((await style(disabled)).background,disabledBefore.background,'Disabled hover does not brighten');
    assert.equal((await style(disabled)).opacity,'0.45');
    assert.equal((await style(page.getByRole('button',{name:'Unavailable in fieldset',exact:true}))).opacity,'0.45','Fieldset disabled matches');
    const search=page.getByRole('textbox',{name:'Preview search'});await search.focus();
    assert.equal(await search.evaluate(e=>getComputedStyle(e.parentElement).borderTopColor),'rgb(242, 107, 128)','Search uses cherry focus');
    const sort=page.getByRole('button',{name:'Preview sort',exact:true});await sort.focus();await page.keyboard.press('ArrowDown');
    const chosen=page.getByRole('menuitemradio',{name:'Newest first',exact:true});await chosen.waitFor();await chosen.hover();
    assert.equal((await style(chosen)).background,'rgb(59, 34, 43)','Selected menu hover retains selection');
    assert.equal((await style(chosen)).width,'2px','Focused selected menu shows ring');
    await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    assert.equal(await sort.innerText(),'Oldest first');
    assert.equal(await sort.evaluate(e=>e===document.activeElement),true,'Menu restores focus');
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
    const selectedCard=page.locator('.mixed-media-tile.is-selected');await selectedCard.hover();assert.equal((await style(selectedCard)).background,'rgb(48, 27, 34)','Card hover retains selected surface');
    assert.equal(await selectedCard.evaluate(e=>getComputedStyle(e).transitionDuration),'0s','Reduced motion disables transitions');
    await page.screenshot({ path: path.join(temp, 'desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('.ui-page-header h1').first().evaluate(el => getComputedStyle(el).fontSize), '28px');
    await page.screenshot({ path: path.join(temp, 'phone.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, screenshots: temp, checks: ['keyboard toggle and focus ring', 'selected hover persistence', 'disabled and fieldset states', 'search focus', 'menu keyboard selection and focus return', 'reduced motion', 'primary text contrast', 'responsive typography', 'narrow overflow'] }));
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
