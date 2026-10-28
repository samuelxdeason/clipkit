// Every backend and media request is intercepted. Never accesses a real vault.
const assert = require('node:assert/strict'),
  path = require('node:path'),
  fs = require('node:fs'),
  os = require('node:os');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(__dirname, '..'),
  appRequire = createRequire(path.join(root, 'apps/library/package.json'));
(async () => {
  const { preview } = await import(pathToFileURL(appRequire.resolve('vite')).href);
  const server = await preview({
    root: path.join(root, 'apps/library'),
    configFile: false,
    preview: { host: '127.0.0.1', port: 5194, strictPort: true },
  });
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.addInitScript(() => {
      window.EventSource = class extends EventTarget {
        constructor() {
          super();
          window.directoryEvents = this;
        }
        close() {}
      };
    });
    let people = Array.from({ length: 26 }, (_, i) => ({
      name: i === 0 ? 'Alex & Casey' : `Person ${String(i).padStart(2, '0')}`,
      nickname: i === 0 ? 'AC' : '',
      count: i === 0 ? 2 : i === 25 ? 0 : 1,
      thumbnail: i % 3 === 0 ? 'fixtures/profile-avatar.svg' : '',
      sites: 'Local',
    }));
    let info = {
      name: 'Alex & Casey',
      nickname: 'AC',
      bio: 'Existing notes',
      cover: 'fixtures/profile-avatar.svg',
      links: [{ label: 'Website', url: 'https://example.invalid/profile' }],
    };
    let accounts = [
      {
        platform: 'Local',
        handle: 'owned',
        person: 'Alex & Casey',
        displayName: 'Connected fixture',
        url: 'https://example.invalid/owned',
      },
      { platform: 'Local', handle: 'free', person: '', url: '' },
      { platform: 'Local', handle: 'someone-else', person: 'Person 01', url: '' },
    ];
    let videos = [
      {
        site: 'Local',
        id: '1',
        title: 'First',
        filename: 'First.mp4',
        filepath: 'a.mp4',
        added: '2026-01-01',
        people: ['Alex & Casey'],
        models: [],
        labels: ['Quiet & calm', 'Quiet & calm', 'Travel'],
        duration: 90,
        favorite: true,
      },
      {
        site: 'Local',
        id: '2',
        title: 'Second',
        filename: 'Second.mp4',
        filepath: 'b.mp4',
        added: '2026-01-02',
        people: ['Alex & Casey'],
        models: ['Alex & Casey'],
        labels: ['Quiet & calm'],
        duration: 150,
        favorite: false,
      },
    ];
    videos = videos.map(video => ({ ...video, thumbnail: 'fixtures/profile-avatar.svg', width: 1920, height: 1080 }));
    videos.push({ ...videos[0], id: 'unrelated', title: 'Unrelated video', filepath: 'other.mp4', people: ['Person 01'], labels: [] });
    const calls = [],
      errors = [];
    let failSave = false,
      failRead = false;
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/**', async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        body = request.method() === 'POST' ? request.postDataJSON() : null;
      calls.push({ path: url.pathname, body, query: Object.fromEntries(url.searchParams) });
      const reply = (data, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (url.pathname === '/api/models')
        return failRead ? reply({ error: 'Directory unavailable' }, 503) : reply(people);
      if (url.pathname === '/api/collections') return reply([]);
      if (url.pathname === '/api/videos') return reply(videos);
      if (url.pathname === '/api/photos/all')
        return reply([
          {
            id: 'photo',
            filename: 'Portrait.jpg',
            filepath: 'photo.jpg',
            model: 'Alex & Casey',
            album: '',
            added: '2026-01-01',
          },
        ]);
      if (url.pathname === '/api/modelinfo') return reply(info);
      if (url.pathname === '/api/accounts') return reply(accounts);
      if (url.pathname === '/api/people/create') {
        people.push({ name: body.name, count: 0 });
        return reply({ ok: true });
      }
      if (url.pathname === '/api/savemodelinfo') {
        if (failSave) return reply({ error: 'Profile save rejected' }, 409);
        info = { ...info, ...body };
        people = people.map((person) =>
          person.name === body.name ? { ...person, nickname: body.nickname } : person,
        );
        return reply({ ok: true });
      }
      if (url.pathname === '/api/model/rename') {
        people = people.map((person) =>
          person.name === body.name ? { ...person, name: body.newName } : person,
        );
        info = { ...info, name: body.newName };
        accounts = accounts.map((account) =>
          account.person === body.name ? { ...account, person: body.newName } : account,
        );
        return reply({ ok: true });
      }
      if (url.pathname === '/api/people/delete') {
        people = people.filter((person) => person.name !== body.name);
        return reply({ ok: true });
      }
      if (url.pathname === '/api/accounts/connect') {
        accounts = accounts.map((account) =>
          account.platform === body.platform && account.handle === body.handle
            ? { ...account, person: body.name }
            : account,
        );
        return reply({ ok: true });
      }
      if (url.pathname === '/api/accounts/create') {
        accounts.push({ platform: 'Local', handle: 'new', person: body.name, url: body.url });
        return reply({ ok: true });
      }
      throw Error('Unexpected API ' + url.pathname);
    });
    await page.route('**/media?*', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#25313d"/><circle cx="300" cy="225" r="100" fill="#8b9fae"/><ellipse cx="300" cy="610" rx="220" ry="270" fill="#607a8d"/></svg>',
      }),
    );
    const shots = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-directories-'));
    await page.goto('http://127.0.0.1:5194/?view=people');
    await page.getByText('1–24 of 26 people', { exact: true }).waitFor();
    const ac = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'AC', exact: true }) });
    await page.screenshot({ path: path.join(shots, 'people.png'), fullPage: true });
    assert.equal(await ac.getAttribute('data-directory-kind'), 'people');
    const tone = await ac.locator('[data-identity-tone]').getAttribute('data-identity-tone');
    async function choose(label, option) {
      await page.getByRole('combobox', { name: label, exact: true }).click();
      await page.getByRole('option', { name: option, exact: true }).click();
    }
    const portraitWidths = [];
    for (const size of ['Small previews', 'Medium previews', 'Large previews']) {
      await choose('Preview size', size);
      portraitWidths.push((await ac.locator('[data-identity-tone]').boundingBox()).width);
      assert.equal(await ac.locator('[data-identity-tone]').getAttribute('data-identity-tone'), tone);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert(portraitWidths[0] < portraitWidths[1] && portraitWidths[1] < portraitWidths[2],
      'People portraits should grow with preview size');
    await choose('Preview size', 'Medium previews');
    await choose('Sort people', 'Most videos');
    assert.equal(await ac.locator('[data-identity-tone]').getAttribute('data-identity-tone'), tone);
    await page.getByRole('button', { name: 'next page', exact: true }).click();
    await page.getByText('25–26 of 26 people', { exact: true }).waitFor();
    await page.reload();
    await page.getByText('25–26 of 26 people', { exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Search people' }).fill('AC');
    await page.getByText('1–1 of 1 people', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'New person', exact: true }).click();
    await page.getByLabel('Name', { exact: true }).fill('New face');
    await page.getByRole('button', { name: 'Create person', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.deepEqual(calls.find((call) => call.path === '/api/people/create').body, {
      name: 'New face',
    });
    await ac.getByRole('link').click();
    await page.getByRole('heading', { name: 'AC', exact: true }).waitFor();
    assert.equal(
      await page.locator('[data-identity-tone]').getAttribute('data-identity-tone'),
      tone,
    );
    const hero = page.getByRole('region', {name:'Person profile',exact:true});
    await hero.waitFor();
    assert.equal(await hero.locator('dl dt').allTextContents().then(values => values.join(',')), 'Videos,Favorites,Video runtime,Video sources');
    assert.deepEqual(await hero.locator('dl dd').allTextContents(), ['2', '1', '4 min', '1']);
    assert.equal(await page.getByRole('button',{name:'Delete person',exact:true}).count(), 0);
    await page.getByText('1–2 of 2 videos', { exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Connected accounts', exact: true }).count(), 0);
    await page.getByRole('textbox', { name: 'Search videos', exact: true }).fill('Unrelated');
    await page.getByRole('heading', { name: 'No videos match', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    await page.getByText('1–2 of 2 videos', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(shots, 'profile.png'), fullPage: true });
    await page.setViewportSize({ width: 2560, height: 1440 });
    const portraitBox = await hero.locator('[data-identity-tone]').boundingBox();
    const titleBox = await hero.getByRole('heading', { level: 1 }).boundingBox();
    assert(Math.abs(portraitBox.width - 240) < 1, 'Wide profiles keep a compact 240px portrait');
    assert(titleBox.x - portraitBox.x - portraitBox.width < 40, 'Profile copy stays beside portrait');
    await page.screenshot({ path: path.join(shots, 'profile-wide.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(shots, 'profile-phone.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
    await page.getByLabel('Display name', { exact: true }).fill('Updated display');
    await page.getByLabel('About this person', { exact: true }).fill('Updated notes');
    failSave = true;
    await page.getByRole('button', { name: 'Save profile', exact: true }).click();
    await page.getByRole('dialog').getByText('Profile save rejected', { exact: true }).waitFor();
    assert.equal(
      await page.getByLabel('About this person', { exact: true }).inputValue(),
      'Updated notes',
    );
    failSave = false;
    await page.getByRole('button', { name: 'Save profile', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('heading', { name: 'Updated display', exact: true }).waitFor();
    assert.deepEqual(calls.filter((call) => call.path === '/api/savemodelinfo').at(-1).body.links, [
      { label: 'Website', url: 'https://example.invalid/profile' },
    ]);
    await page.getByRole('tab', { name: 'Accounts', exact: true }).click();
    await choose('Existing unassigned account', 'Local · free');
    await page.getByRole('button', { name: 'Connect account', exact: true }).click();
    await page.getByRole('button', { name: 'Disconnect free', exact: true }).waitFor();
    assert.deepEqual(calls.find((call) => call.path === '/api/accounts/connect').body, {
      name: 'Alex & Casey',
      platform: 'Local',
      handle: 'free',
    });
    await page.getByRole('button', { name: 'Disconnect owned', exact: true }).click();
    await page
      .getByRole('button', { name: 'Disconnect owned', exact: true })
      .waitFor({ state: 'hidden' });
    await page
      .getByLabel('Account profile URL', { exact: true })
      .fill('https://example.invalid/new');
    await page.getByRole('button', { name: 'Connect URL', exact: true }).click();
    await page.getByRole('button', { name: 'Disconnect new', exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Videos', exact: true }).click();
    await page.getByText('1–2 of 2 videos', { exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Videos', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.getByText('1–1 of 1 photos', { exact: true }).waitFor();
    assert(page.url().includes('view=person'));
    await page.getByRole('link', { name: 'Tags', exact: true }).click();
    await page.getByRole('heading', { name: 'Tags', exact: true }).waitFor();
    await page.getByText('1–2 of 2 tags', { exact: true }).waitFor();
    const quiet = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: 'Quiet & calm', exact: true }) });
    await quiet.getByText('2 videos', { exact: true }).waitFor();
    await page.screenshot({ path: path.join(shots, 'tags.png'), fullPage: true });
    assert.equal(await quiet.getAttribute('data-directory-kind'), 'tags');
    assert((await quiet.boundingBox()).height < 260, 'Tags remain compact discovery tiles');
    await quiet.getByRole('link').click();
    await page
      .getByRole('button', { name: 'Remove Tags (all): Quiet & calm filter', exact: true })
      .waitFor();
    await page.goto('http://127.0.0.1:5194/?view=person&name=Alex%20%26%20Casey');
    await page.getByRole('heading', { name: 'Updated display', exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Accounts', exact: true }).click();
    await page.getByRole('button', { name: 'Manage', exact: true }).click();
    await page.getByRole('button', { name: 'Rename person', exact: true }).click();
    await page.getByLabel('Registered name', { exact: true }).fill('Renamed person');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Rename person', exact: true })
      .click();
    await page.waitForURL('**name=Renamed%20person');
    await page.getByRole('heading', { name: 'Updated display', exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Accounts', exact: true }).click();
    await page.getByRole('button', { name: 'Manage', exact: true }).click();
    await page.getByRole('button', { name: 'Delete person', exact: true }).click();
    await page.getByText(/Media files are kept/).waitFor();
    await page.getByRole('button', { name: 'Confirm deletion', exact: true }).click();
    await page.waitForURL('**view=people');
    assert.deepEqual(calls.find((call) => call.path === '/api/people/delete').body, {
      name: 'Renamed person',
    });
    await page.getByRole('textbox', { name: 'Search people' }).fill('');
    failRead = true;
    await page.getByRole('button', { name: 'Refresh library', exact: true }).click();
    await page.getByRole('alert').getByText('Directory unavailable', { exact: true }).waitFor();
    failRead = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByRole('alert').waitFor({ state: 'hidden' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(shots, 'phone.png'), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const uiRequire = createRequire(path.join(root, 'packages/ui/package.json'));
    await page.addScriptTag({ path: uiRequire.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(
      async () =>
        (
          await window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
          })
        ).violations,
    );
    assert.deepEqual(
      violations.map((issue) => ({
        id: issue.id,
        targets: issue.nodes.map((node) => node.target),
      })),
      [],
    );
    assert.deepEqual(errors, []);
    console.log(
      'Directories passed: counts, paging, stable identity colors, create/edit/retry, account connect/disconnect, scoped media links, rename/delete, recovery and mobile axe. Screenshots: ' +
        shots,
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
