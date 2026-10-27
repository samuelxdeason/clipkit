const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const { spawn } = require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'clipkit-downloads-'));
 const server=spawn(process.execPath,[path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js'),'--host','127.0.0.1','--port','5196','--strictPort'],{cwd:root,windowsHide:true,stdio:'pipe'});
 let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5196')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(){super();window.mockEvents=this;}close(){}};});
  let queue=[
   {id:'active',title:'Mountain light',url:'https://example.test/mountain',status:'downloading',percent:37.2,speed:'4.2 MiB/s',eta:'00:42'},
   {id:'first',title:'Coastal trails',url:'https://example.test/coast',status:'queued'},
   {id:'second',title:'City in motion',url:'https://example.test/city',status:'queued',replace:true},
   {id:'failed',title:'A quiet afternoon',url:'https://example.test/afternoon',status:'error',error:'Connection timed out. Please retry.'},
   {id:'done',title:'Weekend memories',url:'https://example.test/weekend',status:'done',count:2},
   {id:'duplicate',title:'Favorite moments',url:'https://example.test/favorites',status:'duplicate'}
  ];let failMove=true;
  await page.route('**/api/**',async r=>{
   const u=new URL(r.request().url());let result=[];
   if(r.request().method()==='POST'){
    const b=r.request().postDataJSON();writes.push({path:u.pathname,body:b});result={};
    if(u.pathname==='/api/job/move'){
     if(failMove){failMove=false;return r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Mock queue update failed'})});}
     const waiting=queue.filter(j=>j.status==='queued'),i=waiting.findIndex(j=>j.id===b.id),[job]=waiting.splice(i,1);
     waiting.splice(b.direction==='next'?0:b.direction==='up'?Math.max(0,i-1):Math.min(waiting.length,i+1),0,job);
     queue=[...queue.filter(j=>j.status!=='queued'),...waiting];
    }
    if(u.pathname==='/api/job/remove')queue=queue.filter(j=>j.id!==b.id);
    if(u.pathname==='/api/job/retry'){let added=0;queue=queue.map(j=>{if(j.status==='error'&&(!b.id||b.id===j.id)){added++;return{...j,status:'queued',error:''};}return j;});result={added};}
    if(u.pathname==='/api/queue/clear-completed')queue=queue.filter(j=>!['done','duplicate'].includes(j.status));
    if(u.pathname==='/api/enqueue'){queue.push({id:'new',title:'New sample',url:b.url,status:'queued'});result='new';}
   }else if(u.pathname==='/api/queue')result=queue;
   await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.goto('http://127.0.0.1:5196');
  await page.locator('.sidebar-manage-disclosure summary').click();await page.locator('[data-section="downloads"]').click();
  const row=name=>page.getByRole('article',{name,exact:true});
  await row('Mountain light').waitFor();
  const overview=page.getByRole('region',{name:'Queue overview',exact:true});
  assert.deepEqual(await overview.locator('.download-overview-card>strong').allTextContents(),['1','2','2','1']);
  assert.equal(await overview.locator('.queue-live-summary strong').nth(1).innerText(),'Coastal trails');
  await overview.getByRole('button',{name:'Show completed downloads (2)',exact:true}).click();
  assert.equal(await page.locator('.download-row').count(),2);
  await overview.getByRole('button',{name:'Show completed downloads (2)',exact:true}).click();
  assert.equal(await page.locator('.download-row').count(),6,'Clicking active overview filter restores all');
  const beforeSort=queue.map(j=>j.id),beforeWrites=writes.length;
  await page.getByRole('button',{name:'Sort downloads',exact:true}).click();await page.getByRole('menuitemradio',{name:'Title A–Z',exact:true}).click();
  assert.equal(await page.locator('.download-row').first().getAttribute('aria-label'),'A quiet afternoon');
  assert.deepEqual(queue.map(j=>j.id),beforeSort);assert.equal(writes.length,beforeWrites,'Display sort must not reorder queue');
  assert.equal(await row('Coastal trails').getByRole('button',{name:'Download next',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Sort downloads',exact:true}).click();await page.getByRole('menuitemradio',{name:'Queue order',exact:true}).click();
  assert.equal(await page.locator('.download-row').first().getAttribute('aria-label'),'Mountain light');
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'37.2');
  await page.screenshot({path:path.join(temp,'downloads.png')});
  const updated={...queue[0],percent:62,speed:'6.8 MiB/s',eta:'00:18'};queue[0]=updated;
  await page.evaluate(job=>window.mockEvents.dispatchEvent(new MessageEvent('progress',{data:JSON.stringify(job)})),updated);
  await row('Mountain light').getByText('62% downloaded',{exact:true}).waitFor();
  await row('Mountain light').getByText('6.8 MiB/s · 00:18 remaining',{exact:true}).waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'62');
  assert.match(await overview.locator('.queue-live-summary').innerText(),/62%.*6.8 MiB\/s.*00:18/);
  await page.getByRole('button',{name:'Download filters',exact:true}).click();await page.getByRole('menuitemradio',{name:/^Completed \(/}).click();assert.equal(await page.locator('.download-row').count(),2);
  await page.getByLabel('Search downloads').fill('not present');await page.getByRole('heading',{name:'No matching downloads'}).waitFor();
  await page.getByRole('button',{name:'Clear download search'}).click();
  await page.getByRole('button',{name:'Download filters',exact:true}).click();await page.getByRole('menuitemradio',{name:/^All \(/}).click();
  await row('A quiet afternoon').locator('summary').click();await row('A quiet afternoon').getByText('Connection timed out. Please retry.',{exact:true}).waitFor();
  assert.equal(await row('Coastal trails').getByRole('button',{name:'Download next',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Move down: City in motion',exact:true}).isDisabled(),true);
  await row('City in motion').getByRole('button',{name:'Download next',exact:true}).click();await page.getByRole('alert').getByText(/Mock queue update failed/).waitFor();
  await page.getByRole('button',{name:'Dismiss error'}).click();
  await row('City in motion').getByRole('button',{name:'Download next',exact:true}).click();await row('City in motion').getByText('#1 in queue · Up next · Replacing existing file',{exact:true}).waitFor();
  assert.equal(await overview.locator('.queue-live-summary strong').nth(1).innerText(),'City in motion','Up next follows queue priority');
  await page.getByRole('button',{name:'Move down: City in motion',exact:true}).click();await row('City in motion').getByText('#2 in queue · Replacing existing file',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Move up: City in motion',exact:true}).click();await row('City in motion').getByText('#1 in queue · Up next · Replacing existing file',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Remove Coastal trails from queue',exact:true}).click();await row('Coastal trails').waitFor({state:'detached'});
  await row('A quiet afternoon').getByRole('button',{name:'Retry',exact:true}).click();await row('A quiet afternoon').getByText('Queued',{exact:true}).waitFor();
  queue.push({id:'failure-two',title:'Another sample',url:'https://example.test/another',status:'error',error:'Mock error'});
  await page.evaluate(jobs=>window.mockEvents.dispatchEvent(new MessageEvent('queue',{data:JSON.stringify(jobs)})),queue);
  await page.getByRole('button',{name:'Retry failed',exact:true}).click();await row('Another sample').getByText('Queued',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear completed',exact:true}).click();await row('Weekend memories').waitFor({state:'detached'});assert.equal(await row('Favorite moments').count(),0);
  await page.getByLabel('Media URL',{exact:true}).fill('https://example.test/new');await page.getByRole('button',{name:'Add download',exact:true}).click();await row('New sample').waitFor();assert.equal(await page.getByLabel('Media URL',{exact:true}).inputValue(),'');
  assert(writes.some(w=>w.path==='/api/job/retry'&&w.body.id===''));assert(writes.some(w=>w.path==='/api/job/retry'&&w.body.id==='failed'));
  await page.setViewportSize({width:700,height:950});await page.screenshot({path:path.join(temp,'downloads-narrow.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(temp,'downloads-small.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,screenshots:temp,checks:['live progress/speed/ETA','status filters and search','error details','queue next/up/down/remove','action error recovery','single and bulk retries','clear completed','enqueue','narrow layouts']}));
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
