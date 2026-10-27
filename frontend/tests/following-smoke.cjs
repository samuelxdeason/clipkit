const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'clipkit-following-'));
 const server=spawn(process.execPath,[path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js'),'--host','127.0.0.1','--port','5195','--strictPort'],{cwd:root,windowsHide:true,stdio:'pipe'});let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5195')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],calls=[];page.on('pageerror',e=>errors.push(e.message));
  const source='https://example.test/alex';
  let lists=[{url:source,title:'Weekend adventures',kind:'channel',count:104,owned:1,new:101,fetchedAt:new Date().toISOString()},{url:'https://example.test/city',title:'City walks',kind:'playlist',count:8,owned:3,new:5}],queue=[{id:'q',url:'https://example.test/item/1',status:'queued'},{id:'d',url:'https://example.test/item/2',status:'downloading',percent:42}];
  const items=Array.from({length:104},(_,i)=>({id:String(i),url:`https://example.test/item/${i}`,title:`Landscape ${String(i).padStart(3,'0')}`,owned:i===0}));let failRefresh=false;
  await page.route('**/api/**',async r=>{
   const u=new URL(r.request().url()),b=r.request().method()==='POST'?r.request().postDataJSON():{};calls.push({path:u.pathname,refresh:u.searchParams.get('refresh'),url:u.searchParams.get('url'),body:b});let result=[];
   if(u.pathname==='/api/events')return r.fulfill({contentType:'text/event-stream',body:': mock\n\n'});
   switch(u.pathname){
    case '/api/models':result=[{name:'Alex Morgan',nickname:'Alex',count:1}];break;
    case '/api/accounts':result=[{url:source,person:'Alex Morgan',displayName:'Alex',handle:'alex',platform:'sample'}];break;
    case '/api/queue':result=queue;break;
    case '/api/synced/lists':result=lists;break;
    case '/api/enumerate':
     if(failRefresh&&u.searchParams.get('refresh')==='1'){failRefresh=false;return r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Mock source temporarily unavailable'})});}
     result=items;break;
    case '/api/enqueue/many':queue.push(...b.urls.map((url,i)=>({id:'new-'+queue.length+'-'+i,url,status:'queued'})));result={added:b.urls.length};break;
    case '/api/synced/remove':lists=lists.filter(l=>l.url!==b.url);result={};break;
    case '/api/modelinfo':result={name:'Alex Morgan',nickname:'Alex',bio:'Sample profile',links:[]};break;
   }
   await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.goto('http://127.0.0.1:5195');await page.locator('.sidebar-manage-disclosure summary').click();await page.locator('[data-section="following"]').click();
  const card=page.getByRole('article',{name:'Weekend adventures'});await card.waitFor();await page.screenshot({path:path.join(temp,'following.png')});
  await page.getByRole('button',{name:'Sort followed sources',exact:true}).click();await page.getByRole('menuitemradio',{name:'Name A–Z',exact:true}).click();assert.equal(await page.locator('.following-source-name').first().innerText(),'Alex');
  await page.getByLabel('Search followed sources').fill('Alex');assert.equal(await page.locator('.following-sources article').count(),1);
  await page.getByLabel('Search followed sources').fill('unknown');await page.getByRole('heading',{name:'No matching sources'}).waitFor();await page.getByRole('button',{name:'Clear source search'}).click();
  await card.getByRole('button',{name:'Browse',exact:true}).click();await page.locator('.following-media-item').first().waitFor();
  assert(calls.some(c=>c.path==='/api/enumerate'&&c.refresh==='0'));
  assert.equal(await page.locator('.following-media-item').count(),100);
  const hero=page.locator('.following-source-hero'),facts=hero.locator('.ui-detail-facts dd');
  const tone=await hero.getAttribute('data-card-tone');
  assert.deepEqual(await facts.allTextContents(),['104','1','101','2']);
  assert.match(await hero.locator('.following-hero-meta').innerText(),/example.test.*@alex.*channel/);
  assert.equal(await hero.getByRole('link',{name:'Open source ↗',exact:true}).getAttribute('href'),source);
  await page.getByRole('button',{name:'Show more (100 of 104)'}).click();assert.equal(await page.locator('.following-media-item').count(),104);
  await page.getByRole('button',{name:'Source item status',exact:true}).click();await page.getByRole('menuitemradio',{name:/^In progress \(/}).click();assert.equal(await page.locator('.following-media-item').count(),2);
  await page.getByRole('button',{name:'Source item status',exact:true}).click();await page.getByRole('menuitemradio',{name:/^Downloaded \(/}).click();assert.equal(await page.locator('.following-media-item').count(),1);
  await page.getByRole('button',{name:'Source item status',exact:true}).click();await page.getByRole('menuitemradio',{name:/^Available \(/}).click();
  await page.getByRole('checkbox',{name:'Select Landscape 003'}).check();await page.locator('.following-media-item.is-selected').waitFor();await page.getByRole('button',{name:'Sort source content',exact:true}).click();await page.getByRole('menuitemradio',{name:'Title A–Z',exact:true}).click();assert.equal(await page.getByRole('checkbox',{name:'Select Landscape 003'}).isChecked(),true);await page.getByRole('button',{name:'Sort source content',exact:true}).click();await page.getByRole('menuitemradio',{name:'Source order',exact:true}).click();
  await page.getByRole('button',{name:'Clear selection (1)'}).click();assert.equal(await page.locator('.following-media-item.is-selected').count(),0);
  await page.getByRole('checkbox',{name:'Select Landscape 003'}).check();await page.getByRole('button',{name:'Download selected (1)'}).click();await page.getByText('1 downloads added to the queue.',{exact:false}).waitFor();
  assert.deepEqual(calls.find(c=>c.path==='/api/enqueue/many').body.urls,['https://example.test/item/3']);
  await page.getByLabel('Search source content').fill('Landscape 004');await page.locator('.following-media-item').first().waitFor();assert.equal(await page.locator('.following-media-item').count(),1);
  assert.deepEqual(await facts.allTextContents(),['104','1','100','3'],'Search does not change source totals; queue updates do');
  assert.equal(await hero.getAttribute('data-card-tone'),tone);
  await page.getByRole('button',{name:'Clear content search'}).click();
  await page.getByRole('button',{name:'Source item status',exact:true}).click();await page.getByRole('menuitemradio',{name:/^All \(/}).click();
  await page.locator('.manager-main').evaluate(e=>e.scrollTo(0,0));await page.screenshot({path:path.join(temp,'source.png')});
  failRefresh=true;await page.getByRole('button',{name:'Check for updates',exact:true}).click();await page.getByRole('alert').waitFor();assert.deepEqual(await facts.allTextContents(),['—','—','—','—'],'Failed checks do not display false zero counts');await page.getByRole('alert').getByRole('button',{name:'Retry',exact:true}).click();await page.locator('.following-media-item').first().waitFor();
  assert(calls.some(c=>c.path==='/api/enumerate'&&c.refresh==='1'));
  await page.getByRole('button',{name:'Download available (100)'}).click();await page.getByText('100 downloads added to the queue.',{exact:false}).waitFor();
  const batch=calls.filter(c=>c.path==='/api/enqueue/many').at(-1).body.urls;assert.equal(batch.length,100);assert(!batch.includes(items[0].url));assert(!batch.includes(items[1].url));assert(!batch.includes(items[2].url));assert(!batch.includes(items[3].url));
  await page.setViewportSize({width:700,height:950});await page.locator('.manager-main').evaluate(e=>e.scrollTo(0,0));await page.screenshot({path:path.join(temp,'source-narrow.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('button',{name:'← All sources',exact:true}).click();
  await page.getByRole('button',{name:'Unfollow City walks',exact:true}).click();await page.getByRole('article',{name:'City walks'}).waitFor({state:'detached'});
  await page.getByLabel('Follow something new',{exact:true}).fill('https://example.test/new-source');await page.getByRole('button',{name:'Load source',exact:true}).click();await page.locator('.following-media-item').first().waitFor();assert(calls.some(c=>c.url==='https://example.test/new-source'&&c.refresh==='1'));
  await page.getByRole('button',{name:'Open downloads',exact:true}).click();await page.getByRole('heading',{name:'Download queue',exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,screenshots:temp,checks:['source search','browse cached source','show more','status filters','selection and clear','selected download','refresh failure/retry','download available excludes owned and queued','unfollow','load new source','downloads navigation','narrow layout']}));
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
