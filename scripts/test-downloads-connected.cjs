// Every API call is intercepted. Never starts a real download or touches a live queue.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const appRequire = createRequire(path.join(root, 'apps/library/package.json'));
(async () => {
  const { preview } = await import(pathToFileURL(appRequire.resolve('vite')).href);
  const server = await preview({ root: path.join(root, 'apps/library'), configFile: false,
    preview: { host: '127.0.0.1', port: 5193, strictPort: true } });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.addInitScript(() => { window.EventSource = class extends EventTarget {
      constructor() { super(); window.queueEvents = this; } close() {}
    }; });
    let jobs = Array.from({ length: 28 }, (_, i) => ({ id: String(i), title: `Study ${i}`,
      url: `https://example.invalid/${i}`, status: i === 0 ? 'downloading' : i === 1 ? 'error' : i === 2 ? 'done' : i === 3 ? 'duplicate' : 'queued',
      percent: 34, speed: '2 MiB/s', eta: '00:20', error: i === 1 ? 'Synthetic failure' : '', count: 0, replace: false }));
    const calls = [], errors = [];
    let failRead = false, failWrite = false;
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', async route => {
      const request = route.request(), url = new URL(request.url());
      const body = request.method() === 'POST' ? request.postDataJSON() : null;
      calls.push({ path: url.pathname, body });
      const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (url.pathname === '/api/queue') return failRead ? reply({ error: 'Queue offline' }, 503) : reply(jobs);
      if (failWrite) return reply({ error: 'Write rejected' }, 409);
      if (url.pathname === '/api/enqueue/many') return reply({ added: body.urls.length });
      if (url.pathname === '/api/job/move') return reply({ ok: true });
      if (url.pathname === '/api/job/remove') { jobs = jobs.filter(job => job.id !== body.id); return reply({ ok: true }); }
      if (url.pathname === '/api/job/retry') {
        jobs = jobs.map(job => job.status === 'error' && (!body.id || job.id === body.id) ? { ...job, status: 'queued', error: '' } : job);
        return reply({ added: 1 });
      }
      if (url.pathname === '/api/queue/clear-completed') { jobs = jobs.filter(job => !['done', 'duplicate'].includes(job.status)); return reply({ ok: true }); }
      throw Error('Unexpected endpoint ' + url.pathname);
    });
    const shots = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-downloads-'));
    await page.goto('http://127.0.0.1:5193/?view=downloads');
    await page.getByText('1–24 of 28 downloads', { exact: true }).waitFor();
    const active = page.getByRole('article', { name: 'Study 0', exact: true });
    assert.equal(await active.getByRole('button').count(), 0, 'Active jobs have no unsupported cancel/pause');
    assert.equal(await active.getByRole('progressbar').getAttribute('value'), '34');
    const overview = page.getByRole('region', { name: 'Queue overview', exact: true });
    const composer = page.locator('form').filter({ has: page.getByLabel('Add download links', { exact: true }) });
    const overviewBox = await overview.boundingBox(), composerBox = await composer.boundingBox();
    assert(composerBox.y + composerBox.height <= overviewBox.y, 'Composer sits above the unified overview');
    await page.screenshot({ path: path.join(shots, 'downloads.png'), fullPage: false });
    await page.getByRole('button', { name: /^In progress/ }).click();
    await page.getByText('1–1 of 1 downloads', { exact: true }).waitFor();
    await page.getByRole('button', { name: /^In progress/ }).click();
    await page.getByText('1–24 of 28 downloads', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'next page', exact: true }).click();
    await page.getByText('25–28 of 28 downloads', { exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Search downloads', exact: true }).fill('Study 5');
    await page.getByText('1–1 of 1 downloads', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Download next', exact: true }).click();
    assert.deepEqual(calls.find(call => call.path === '/api/job/move').body, { id: '5', direction: 'next' });
    await page.getByRole('button', { name: 'Remove from queue', exact: true }).click();
    await page.getByRole('heading', { name: 'No matching downloads' }).waitFor();
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    await page.getByRole('button', { name: 'Retry download', exact: true }).click();
    assert.deepEqual(calls.find(call => call.path === '/api/job/retry').body, { id: '1' });
    await page.getByRole('button', { name: 'Clear completed', exact: true }).click();
    await page.getByText('1–24 of 25 downloads', { exact: true }).waitFor();
    const input = page.getByLabel('Add download links', { exact: true });
    await input.fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Add to queue', exact: true }).click();
    await page.getByText('Use HTTP(S) links without embedded credentials.', { exact: true }).waitFor();
    assert(!calls.some(call => call.path === '/api/enqueue/many'));
    await page.getByRole('button', { name: 'Add multiple links', exact: true }).click();
    await input.fill('https://example.invalid/new\nhttps://example.invalid/new');
    failWrite = true;
    await page.getByRole('button', { name: 'Add to queue', exact: true }).click();
    await page.getByText('Write rejected', { exact: true }).waitFor();
    assert((await input.inputValue()).includes('/new'));
    failWrite = false;
    await page.getByRole('button', { name: 'Add to queue', exact: true }).click();
    await page.getByText('1 new downloads added. Existing queue entries may be skipped.', { exact: true }).waitFor();
    assert.equal(await input.inputValue(), '');
    assert.deepEqual(calls.filter(call => call.path === '/api/enqueue/many').at(-1).body, { urls: ['https://example.invalid/new'] });
    jobs[0].percent = 75;
    await page.evaluate(() => window.queueEvents.dispatchEvent(new Event('queue')));
    await page.waitForFunction(() => document.querySelector('progress')?.value === 75);
    jobs[0].percent = 81;
    await page.waitForFunction(() => document.querySelector('progress')?.value === 81);
    failRead = true;
    await page.getByRole('button', { name: 'Refresh queue', exact: true }).click();
    await page.getByText('Queue offline', { exact: true }).waitFor();
    assert(await active.isVisible(), 'Read failures retain the last queue snapshot');
    failRead = false;
    await page.getByRole('button', { name: 'Retry connection', exact: true }).click();
    await page.getByText('Queue offline', { exact: true }).waitFor({ state: 'hidden' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => window.scrollTo(0, 0));
    const mobileOverview = await overview.boundingBox(), mobileComposer = await composer.boundingBox();
    assert(mobileComposer.y + mobileComposer.height <= mobileOverview.y, 'Mobile composer precedes overview');
    await page.screenshot({ path: path.join(shots, 'downloads-phone.png'), fullPage: false });
    const uiRequire = createRequire(path.join(root, 'packages/ui/package.json'));
    await page.addScriptTag({ path: uiRequire.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations);
    assert.deepEqual(violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) })), []);
    jobs = [];
    await page.evaluate(() => window.queueEvents.dispatchEvent(new Event('queue')));
    await page.getByRole('heading', { name: 'Your queue is clear', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('Downloads passed: progress, paging, search, queue actions, draft recovery, URL validation, SSE, mobile and axe. Screenshots: ' + shots);
  } finally { if (browser) await browser.close(); await server.httpServer.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
