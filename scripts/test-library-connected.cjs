// Exercises production frontend against an in-memory HTTP contract. Never contacts a vault.
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
  const server = await preview({ root: path.join(root, 'apps/library'), configFile: false, preview: { host: '127.0.0.1', port: 5196, strictPort: true } });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    let videos = Array.from({ length: 505 }, (_, index) => ({
      site: index === 504 ? 'Other' : 'Local', id: index === 504 ? '0' : String(index),
      title: index === 504 ? 'Across sources' : `Video ${String(index).padStart(3, '0')}`,
      source_title: index === 503 ? 'Original searchable phrase' : '',
      filename: `fixture-${index}.mp4`, filepath: `fixtures/${index}.mp4`, thumbnail: index === 502 || index === 501 ? `fixtures/portrait-${index}.jpg` : index === 504 ? 'fixtures/a #1.jpg' : index === 503 ? 'fixtures/missing.jpg' : '',
      added: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      people: index === 503 ? ['Alex', 'Casey'] : ['Alex'], models: ['Alex'],
      labels: index === 503 ? ['Travel', 'Quiet'] : ['Travel'], tags: ['source metadata'],
      duration: index === 503 ? 100 : 600, position: index === 503 ? 96 : 0,
      width: index === 502 || index === 501 ? 608 : 1920, height: index === 503 ? 2160 : 1080, favorite: false, filesize: index + 1,
    }));
    const calls = [], errors = [];
    const mediaPaths=[];
    await page.route('**/media?*', async route => {
      const mediaPath=new URL(route.request().url()).searchParams.get('p');
      mediaPaths.push(mediaPath);
      if(mediaPath==='fixtures/missing.jpg') return route.fulfill({status:404,body:'Missing fixture'});
      if (mediaPath.startsWith('fixtures/portrait-')) return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="90" height="160"><rect width="90" height="160" fill="#31545a"/></svg>'});
      return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#283b46"/><circle cx="450" cy="100" r="40" fill="#afc3bd"/><path d="M0 360 230 130 440 360Z" fill="#526570"/></svg>'});
    });
    let failRead = true, failWrite = false, writes = 0;
    await page.addInitScript(() => {
      class MockEvents extends EventTarget {
        constructor() { super(); window.fixtureEvents = this; }
        close() {}
      }
      window.EventSource = MockEvents;
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', async route => {
      const request = route.request(), url = new URL(request.url());
      const body = request.method() === 'POST' ? request.postDataJSON() : null;
      calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), body });
      const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      if (url.pathname === '/api/videos/triptych') {
        if (url.searchParams.get('id') === '501') return route.fulfill({status:404,body:'Unavailable'});
        return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="684" height="384"><rect width="228" height="384" fill="#31545a"/><rect x="228" width="228" height="384" fill="#785264"/><rect x="456" width="228" height="384" fill="#6f7256"/></svg>'});
      }
      if (url.pathname === '/api/videos') {
        if (failRead) return reply({ error: 'Fixture unavailable' }, 503);
        const offset = Number(url.searchParams.get('offset'));
        return reply(videos.slice(offset, offset + 500));
      }
      if (url.pathname === '/api/models') return reply([{ name: 'Alex', nickname: 'Alex nickname' }, { name: 'Casey' }, { name: 'Jordan' }]);
      if (url.pathname === '/api/collections') return reply([
        {id:1,name:'Folder',parentId:0}, {id:2,name:'Watch later',parentId:1},
        {id:3,name:'Locked',parentId:0,locked:true}, {id:4,name:'Private',parentId:0,hidden:true},
      ]);
      if (request.method() === 'POST') {
        writes++;
        if (failWrite && writes === 2) return reply({ error: 'Fixture write rejected' }, 409);
        if (url.pathname === '/api/setfavorite') videos = videos.map(video => video.site === body.site && video.id === body.id ? {...video, favorite:body.fav} : video);
        else if (url.pathname === '/api/setlabels') videos = videos.map(video => video.site === body.site && video.id === body.id ? {...video, labels:body.labels} : video);
        else if (url.pathname === '/api/setmodels') videos = videos.map(video => video.site === body.site && video.id === body.id ? {...video, models:body.models, people:[...new Set([...video.people,...body.models])]} : video);
        else if (url.pathname === '/api/media/trash') videos = videos.filter(video => !body.videos.some(key => key.site === video.site && key.id === video.id));
        else if (url.pathname !== '/api/albums/add') throw new Error(`Unexpected mutation: ${url.pathname}`);
        return reply({ok:true});
      }
      throw new Error(`Unexpected API: ${url.pathname}`);
    });
    await page.goto('http://127.0.0.1:5196/');
    await page.getByText('Fixture unavailable',{exact:true}).waitFor();
    failRead=false;
    await page.getByRole('button',{name:'Retry',exact:true}).click();
    await page.getByText('1–12 of 505 videos', { exact:true }).waitFor();
    const portraitCard = page.locator('article').filter({has:page.getByRole('heading',{name:'Video 502',exact:true})});
    await portraitCard.locator('[data-portrait-backdrop]').waitFor();
    assert(!(await portraitCard.locator('img').getAttribute('src')).includes('/triptych'));
    assert(!calls.some(call => call.path === '/api/videos/triptych'));
    await page.getByRole('combobox', {name:'Portrait preview style'}).click();
    await page.getByRole('option', {name:'Three frames',exact:true}).click();
    const montage = page.locator('article').filter({has:page.getByRole('heading',{name:'Video 502',exact:true})}).locator('img');
    await page.waitForFunction(() => [...document.querySelectorAll('article img')].some(img => img.src.includes('/api/videos/triptych') && img.complete && img.naturalWidth === 684));
    assert((await montage.getAttribute('src')).includes('/api/videos/triptych'));
    const fallback = page.locator('article').filter({has:page.getByRole('heading',{name:'Video 501',exact:true})}).locator('img');
    await page.waitForFunction(() => [...document.querySelectorAll('article img')].some(img => img.src.includes('portrait-501') && img.complete && img.naturalWidth === 90));
    assert((await fallback.getAttribute('src')).includes('portrait-501'));
    await page.locator('article').filter({has:page.getByRole('heading',{name:'Video 503',exact:true})}).getByText('Preview unavailable',{exact:true}).waitFor();
    assert(mediaPaths.includes('fixtures/a #1.jpg'));
    const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'clipkit-connected-'));
    await page.screenshot({path:path.join(screenshots,'desktop.png'),fullPage:true});
    assert(calls.some(call => call.path === '/api/videos' && call.query.offset === '500'));
    const search = page.getByRole('textbox', {name:'Search videos'});
    await search.fill('"Original searchable phrase"');
    await page.getByText('1–1 of 1 videos', {exact:true}).waitFor();
    assert.equal(await page.locator('article').getAttribute('aria-label'), 'Video 503');
    await page.getByRole('button', {name:'Filters',exact:true}).click();
    const filtersPanel = page.locator('[data-scope=popover][data-part=content]:visible');
    const filterBounds = await filtersPanel.boundingBox();
    assert(filterBounds.height <= 640);
    assert.equal(await page.getByRole('checkbox', { name: 'Needs organizing', exact: true }).count(), 0);
    assert(filterBounds.width >= 700);
    assert(await filtersPanel.locator('[data-slot=body]').evaluate(el => el.scrollHeight <= el.clientHeight + 1), 'Desktop filter panel should fit without scrolling');
    const footerBefore = await page.getByRole('button',{name:'Done',exact:true}).boundingBox();
    await page.screenshot({path:path.join(screenshots,'filters.png')});
    async function choose(label, option) {
      await page.getByRole('combobox',{name:label,exact:true}).click();
      await page.getByRole('option',{name:option,exact:true}).click();
    }
    await choose('Viewing status','Finished');
    await choose('Resolution','4K');
    const footerAfter = await page.getByRole('button',{name:'Done',exact:true}).boundingBox();
    assert(Math.abs(footerBefore.y - footerAfter.y) < 2, 'Filter footer should remain visible while the body scrolls');
    await page.getByRole('button',{name:'Choose people',exact:true}).click();
    await page.getByRole('textbox',{name:'Search people filters',exact:true}).fill('no such person');
    await page.getByText('No matches. Try another search.',{exact:true}).waitFor();
    await page.getByRole('textbox',{name:'Search people filters',exact:true}).fill('case');
    await page.getByText('Casey',{exact:true}).click();
    await page.screenshot({path:path.join(screenshots,'people-picker.png')});
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Choose tags',exact:true}).click();
    await page.getByRole('textbox',{name:'Search tags filters',exact:true}).fill('qui');
    await page.locator('[data-scope="checkbox"][data-part="root"]').filter({has:page.getByText('Quiet',{exact:true})}).click();
    await page.getByRole('button',{name:'Done choosing tags',exact:true}).click();
    await page.getByRole('button',{name:'Done',exact:true}).click();
    await page.getByText('1–1 of 1 videos',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Clear search & filters',exact:true}).click();
    await choose('Sort videos','Oldest first');
    await page.getByRole('button',{name:'next page',exact:true}).click();
    await page.getByText('13–24 of 505 videos',{exact:true}).waitFor();
    await page.reload();
    await page.getByText('13–24 of 505 videos',{exact:true}).waitFor();
    await search.fill('Across sources');
    assert.equal(await page.locator('article').getByRole('button', { name: /^Favorite / }).count(), 0);
    await page.getByRole('button',{name:'Manage',exact:true}).click();
    await page.getByText('Select this page',{exact:true}).click();
    await page.getByRole('button',{name:'Favorite selected',exact:true}).click();
    await page.getByText('Selected videos added to favorites.',{exact:true}).waitFor();
    assert.deepEqual(calls.find(call => call.path === '/api/setfavorite').body, {site:'Other',id:'0',fav:true});
    assert.equal(videos.find(video => video.site === 'Local' && video.id === '0').favorite,false);
    async function selectPage() { await page.getByText('Select this page',{exact:true}).click(); }
    await selectPage();
    await page.getByRole('button',{name:'Add to collection',exact:true}).click();
    await page.getByRole('combobox',{name:'Collection',exact:true}).click();
    assert.equal(await page.getByRole('option',{name:'Locked',exact:true}).count(),0);
    await page.getByRole('option',{name:'Folder / Watch later',exact:true}).click();
    await page.getByRole('button',{name:'Add selected videos',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.deepEqual(calls.find(call => call.path === '/api/albums/add').body,{id64:2,videos:[{site:'Other',id:'0'}],photos:[]});
    await selectPage();
    await page.getByRole('button',{name:'Add people',exact:true}).click();
    await choose('Person to add','Jordan');
    await page.getByRole('button',{name:'Save changes',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.deepEqual(calls.find(call => call.path === '/api/setmodels').body.models,['Alex','Jordan']);
    await selectPage();
    await page.getByRole('button',{name:'Add tags',exact:true}).click();
    await page.getByLabel('Tags, separated by commas').fill('Quiet, Travel');
    await page.getByRole('button',{name:'Save changes',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.deepEqual(calls.find(call => call.path === '/api/setlabels').body.labels,['Travel','Quiet']);
    await selectPage();
    await page.getByRole('button',{name:'Move to trash',exact:true}).click();
    await page.getByText(/There is no in-app Undo/).waitFor();
    await page.getByRole('button',{name:'Confirm removal',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert.equal(await page.getByRole('button',{name:'Undo removal'}).count(),0);
    assert(videos.some(video => video.site === 'Local' && video.id === '0'));
    await page.getByRole('button',{name:'Clear search & filters',exact:true}).click();
    await page.getByText('1–12 of 504 videos',{exact:true}).waitFor();
    await selectPage();
    failWrite=true; writes=0;
    await page.getByRole('button',{name:'Favorite selected',exact:true}).click();
    await page.getByText(/1 of 12 updated/).waitFor();
    const refreshed = page.waitForResponse(response => response.url().includes('/api/videos?limit=500&offset=500'));
    await page.evaluate(() => window.fixtureEvents.dispatchEvent(new Event('library')));
    await refreshed;
    await page.getByText(/1 of 12 updated/).waitFor();
    assert.equal(videos.find(video => video.site === 'Local' && video.id === '0').favorite, true);
    failWrite=false;
    await page.getByRole('button',{name:'Favorite selected',exact:true}).click();
    await page.getByText('Selected videos added to favorites.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Done managing',exact:true}).click();
    failRead=true;
    await page.getByRole('button',{name:'Refresh library',exact:true}).click();
    await page.getByText('Fixture unavailable',{exact:true}).waitFor();
    assert.equal(await page.locator('article').count(),12,'Refresh failure retains existing results');
    failRead=false;
    videos = videos.slice(0,3);
    await page.evaluate(() => window.fixtureEvents.dispatchEvent(new Event('library')));
    await page.getByText('1–3 of 3 videos',{exact:true}).waitFor();
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Filters',exact:true}).click();
    const panel=page.locator('[data-scope=popover][data-part=content]:visible');
    await panel.waitFor();
    await page.getByRole('combobox',{name:'Resolution',exact:true}).scrollIntoViewIfNeeded();
    await page.getByRole('combobox',{name:'Resolution',exact:true}).click();
    const menu=page.getByRole('listbox'); await menu.waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const bounds=await menu.boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.x+bounds.width <= 391 && bounds.y >= 0 && bounds.y+bounds.height <= 845);
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({path:path.join(screenshots,'phone.png'),fullPage:true});
    const uiRequire=createRequire(path.join(root,'packages/ui/package.json'));
    await page.addScriptTag({path:uiRequire.resolve('axe-core/axe.min.js')});
    const violations=await page.evaluate(async () => (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}})).violations);
    assert.deepEqual(violations.map(issue => ({id:issue.id,nodes:issue.nodes.map(node => node.target)})),[]);
    videos=[];
    await page.evaluate(() => window.fixtureEvents.dispatchEvent(new Event('library')));
    await page.getByRole('heading',{name:'Your library is empty'}).waitFor();
    assert.deepEqual(errors,[]);
    console.log('Connected library passed: >500 rows, identity, search/filter intersections, persistence, collection/people/tag writes, trash, partial failure/retry, SSE reconciliation, empty/retry states, mobile overlays and axe. Screenshots: '+screenshots);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode=1; });
