const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const { spawn } = require('node:child_process');
const path = require('node:path'), assert = require('node:assert/strict');
(async () => {
 const root = path.resolve(__dirname, '..');
 const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5189', '--strictPort'], { cwd: root, windowsHide: true, stdio: 'pipe' });
 let browser;
 try {
  for (let i=0;i<60;i++) { try { if ((await fetch('http://127.0.0.1:5189')).ok) break; } catch {} await new Promise(r=>setTimeout(r,100)); }
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors=[], writes=[]; page.on('pageerror',e=>errors.push(e.message));
  const photos=Array.from({length:61},(_,i)=>({id:String(i),filename:`Landscape ${String(i+1).padStart(2,'0')}.jpg`,filepath:i===2?'broken':`neutral-${i}`,model:i%2?'Jamie':'Alex',album:i%2?'City walks':'Weekend trips',added:new Date(Date.now()-(i===60?120*86400000:i*60000)).toISOString()}));
  const albums=[{id:1,name:'Weekend trips',parentId:0,count:12,photoCount:10,videoCount:2,albumCount:1,covers:['neutral-0']},{id:2,name:'City walks',parentId:0,count:8,photoCount:8,videoCount:0,albumCount:0,covers:['neutral-1']},{id:3,name:'Mountain mornings',parentId:1,count:0,photoCount:0,videoCount:0,albumCount:0,covers:[]},{id:4,name:'Watch later',parentId:0,count:0,photoCount:0,videoCount:0,albumCount:0,covers:[]}];
  albums[0].covers=['neutral-0','broken','neutral-1','neutral-3'];
  await page.route('**/api/**',async r=>{
   const u=new URL(r.request().url()); let result=[];
   if(u.pathname==='/api/events')return r.fulfill({contentType:'text/event-stream',body:': mock\n\n'});
   if(r.request().method()==='POST'){
    const b=r.request().postDataJSON();writes.push({path:u.pathname,body:b});result={};
    if(u.pathname==='/api/albums/create'){const id=albums.length+1;albums.push({id,name:b.name,parentId:b.parentId,count:0,photoCount:0,videoCount:0,albumCount:0,covers:[]});result={id};}
    if(u.pathname==='/api/collections/rename'){const a=albums.find(a=>a.id===b.id64);if(a)a.name=b.name;}
   }else switch(u.pathname){
    case '/api/mediaroot':result='D:/Media';break;
    case '/api/stats':result={totalBytes:0,videoCount:0,modelCount:0,sites:[]};break;
    case '/api/cookiestatus':result={};break;
    case '/api/models': result=[{name:'Alex',count:31},{name:'Jamie',count:30}];break;
    case '/api/collections':result=albums;break;
    case '/api/photos/all':result=photos;break;
    case '/api/albums/photos':result=photos.slice(0,8);break;
   }
   await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.route('**/media?*',r=>{
   const p=new URL(r.request().url()).searchParams.get('p');if(p==='broken')return r.fulfill({status:404,body:''});
   const n=Number(p.split('-')[1])||0,c=['#38545b','#64516b','#6a604d','#3c5550'][n%4];
   return r.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${n%2?400:640}" height="${n%2?540:360}"><rect width="100%" height="100%" fill="${c}"/><circle cx="280" cy="100" r="65" fill="#ffffff20"/><path d="M0 320 180 130 330 310 500 170 640 300V600H0" fill="#ffffff15"/></svg>`});
  });

  await page.goto('http://127.0.0.1:5189');
  const metrics=()=>{const h=document.querySelector('.ui-page-header'),t=h.querySelector('h1'),p=h.querySelector('p'),s=getComputedStyle(t),r=t.getBoundingClientRect();return {x:r.x,y:r.y,size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,spacing:s.letterSpacing,font:s.fontFamily,margin:getComputedStyle(h).marginBottom,gap:p?getComputedStyle(p).marginTop:null,subtitle:p?['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color'].map(k=>getComputedStyle(p)[k]):null};};
  const typeChecks = new Set();
  async function checkTypography(width) {
    const roles = [
      ['section', '.album-section-heading h2,.settings-section-heading h2,.queue-section-title h2,.download-add-heading h2,.following-add>label,.manager-empty h2', width<=700?20:22, '650', 1.3, '-0.4px'],
      ['subsection', '.settings-group>h2,.storage-breakdown h3', 16, '650', 1.3, '-0.2px'],
      ['label', '.video-filter-field>span', 13, '600', 1.5, '0px'],
      ['body', '.settings-page .setting-copy>p,.following-add>p,.queue-section-title p,.manager-empty p', 14, '400', 1.6, '0px'],
      ['metadata', '.compact-folder-copy small,.person-tile-count,.settings-nav-copy small,.download-overview-card>small', 12, '400', 1.5, '0px'],
      ['eyebrow', '.settings-eyebrow,.download-eyebrow,.following-eyebrow,.dq-eyebrow', 11, '600', 1.5, '1.2px'],
      ['item', '.settings-page .setting-copy>strong', 14, '650', 1.5, '0px']
    ];
    for(const [role, selector, size, weight, leading, spacing] of roles) {
      for(const el of await page.locator(selector).all()) {
        if(!await el.isVisible())continue;
        const actual=await el.evaluate(e=>{const s=getComputedStyle(e);return {size:s.fontSize,weight:s.fontWeight,line:s.lineHeight,spacing:s.letterSpacing==='normal'?'0px':s.letterSpacing};});
        assert.deepEqual(actual,{size:size+'px',weight,line:Number((size*leading).toFixed(2))+'px',spacing},role+' at '+width);
        typeChecks.add(role);
      }
    }
  }
  async function checkIcons() {
    for(const [selector,size] of [
      ['.manager-nav>svg,.settings-navigation button>svg,.ui-button>svg,.preview-size-menu>summary>.ui-icon',18],
      ['.collection-tree-row .folder-open>svg,.manager-search>svg,.queue-search>svg,.destination-search>svg,.ui-chevron',14],
      ['.tag-directory-symbol>svg,.state-symbol>svg',24]
    ]) {
      for(const el of await page.locator(selector).all()) {
        if(!await el.isVisible())continue;
        const actual=await el.evaluate(e=>{const s=getComputedStyle(e);return [s.width,s.height,s.flexShrink];});
        assert.deepEqual(actual,[size+'px',size+'px','0'],selector);
      }
    }
    for(const el of await page.locator('.ui-button>.ui-icon').all()) {
      const colors=await el.evaluate(e=>[getComputedStyle(e).color,getComputedStyle(e.parentElement).color]);
      assert.equal(colors[0],colors[1],'Action icon inherits button color');
      assert.equal(await el.getAttribute('aria-hidden'),'true');
    }
  }
  async function checkSurfaces(width) {
    const padding=width<=700?'16px':'24px';
    for(const selector of ['.settings-section-heading','.following-add','.download-add-card']) {
      for(const el of await page.locator(selector).all()) {
        const actual=await el.evaluate(e=>{const s=getComputedStyle(e);return [s.borderRadius,s.padding];});
        assert.deepEqual(actual,['16px',padding],selector+' geometry at '+width);
      }
    }
    for(const selector of ['.library-card.video-card','.library-card.mixed-media-tile','.library-card.person-tile','.library-card.tag-directory-card','.featured-collection>.album-card']) {
      for(const el of await page.locator(selector).all()) assert.equal(await el.evaluate(e=>getComputedStyle(e).borderRadius),'16px',selector+' corners');
    }
    for(const el of await page.locator('.ui-button,.sort-menu-trigger,.preview-size-menu>summary').all()) assert.equal(await el.evaluate(e=>getComputedStyle(e).borderRadius),'8px','Control corners');
  }
  const checks=[];
  for(const width of [1440,700,390]){
    await page.setViewportSize({width,height:1000});
    let reference;
    for(const section of ['videos','photos','collections','people','tags','following','downloads','settings']){
      await page.locator('[data-section="'+section+'"]').evaluate(e=>e.click());
      await page.getByRole('heading',{name:({videos:'Your video library',photos:'Your photo library',collections:'Collections',people:'People',tags:'Tags',following:'Following',downloads:'Downloads',settings:'Settings'})[section],exact:true}).waitFor();
      const actionName=({videos:'Add videos',photos:'Add photos',collections:'New collection',people:'New person'})[section];
      if(actionName){const action=page.getByRole('group',{name:'Page actions'}).getByRole('button',{name:actionName,exact:true});await action.waitFor();assert.equal(await action.isVisible(),true,section+' top bar action');if(width===1440){await action.click();await page.getByRole('dialog',{name:actionName,exact:true}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0,'Page action dialog closes');}assert.equal(await page.locator('.ui-page-header button').count(),0,'No duplicate header actions');}
      if(['collections','people','tags'].includes(section)){const toolbar=page.locator('.directory-browse-toolbar');assert.equal(await toolbar.count(),1);assert.equal(await toolbar.getByRole('textbox').count(),1);if(section!=='collections')assert.equal(await toolbar.locator('.sort-menu-trigger').count(),1);assert.equal(await page.locator('.content-search-row').count(),0,'No detached directory search');}
      const current=await page.evaluate(metrics);
      if(!reference)reference=current;
      assert.equal(current.size,width<=700?'28px':'36px',section+' size');
      for(const key of ['x','y','weight','line','spacing','font','margin'])assert.equal(current[key],reference[key],section+' '+key+' at '+width);
      if(current.gap!==null){assert.equal(current.gap,'4px');assert.deepEqual(current.subtitle,reference.subtitle,section+' subtitle at '+width);}
      if(section==='videos'){await page.locator('.video-filter-popover>summary').click();await checkTypography(width);await page.keyboard.press('Escape');}
      await checkTypography(width);
      await checkIcons();
      await checkSurfaces(width);
      checks.push(section+' '+width);
    }
    await page.locator('.sidebar-manage button').filter({hasText:'Potential duplicates'}).evaluate(e=>e.click());
    await page.getByRole('heading',{name:'Potential duplicates',exact:true}).waitFor();
    await checkTypography(width);
    const duplicate=await page.evaluate(metrics);for(const key of ['x','y','size','weight','line','spacing','font','margin'])assert.equal(duplicate[key],reference[key],'duplicates '+key);
  }
  assert.equal(typeChecks.size,7,'All typography roles exercised');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks}));
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});


