const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'clipkit-settings-'));
 const server=spawn(process.execPath,[path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js'),'--host','127.0.0.1','--port','5194','--strictPort'],{cwd:root,windowsHide:true,stdio:'pipe'});let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5194')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[],calls=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.mockNative=[];
   window.go={main:{App:{APIBase:async()=>'',ChooseMediaRoot:async()=>{window.mockNative.push('folder');return 'D:\\Sample library';},RestartApp:async()=>window.mockNative.push('restart'),ConnectCookies:async()=>{window.mockNative.push('cookies');return {x:true,pornhub:true};}}}};
   window.EventSource=class extends EventTarget{constructor(){super();window.mockEvents=this;}close(){}};
  });
  let failBackup=true;
  await page.route('**/api/**',async r=>{
   const u=new URL(r.request().url());calls.push(u.pathname);let result=[];
   switch(u.pathname){
    case '/api/mediaroot':result='D:\\Media\\My library';break;
    case '/api/stats':result={totalBytes:123456789000,videoCount:864,modelCount:28,sites:[{site:'Local files',bytes:90000000000},{site:'Studio',bytes:33456789000}]};break;
    case '/api/cookiestatus':result={x:false,pornhub:true};break;
    case '/api/backup':if(failBackup){failBackup=false;return r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Mock backup failure'})});}result={path:'D:\\Media\\backups\\catalogue.db'};break;
    case '/api/rebuild':result={count:864};break;
    case '/api/optimize':case '/api/avatars/fetch-all':result={};break;
   }
   await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.goto('http://127.0.0.1:5194');await page.locator('[data-section="settings"]').click();await page.getByRole('heading',{name:'Your library',exact:true}).waitFor();
  await page.getByText('115.0 GB',{exact:true}).waitFor();await page.screenshot({path:path.join(temp,'storage.png')});
  await page.getByRole('button',{name:'Change folder…',exact:true}).click();await page.getByText('D:\\Sample library',{exact:true}).waitFor();await page.getByRole('button',{name:'Restart now',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>window.mockNative),['folder','restart']);
  const nav=page.getByRole('navigation',{name:'Settings sections'});
  await nav.getByRole('button',{name:/Connections/}).click();await page.getByText('Not connected',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Import connection file…',exact:true}).click();await page.getByText('Connection settings updated.',{exact:true}).waitFor();assert.equal(await page.getByText('Connected',{exact:true}).count(),2);
  await page.screenshot({path:path.join(temp,'connections.png')});
  await page.getByRole('button',{name:'Dismiss settings notification'}).click();
  await nav.getByRole('button',{name:/Maintenance/}).click();await page.getByRole('button',{name:'Back up now',exact:true}).click();await page.getByRole('alert').getByText(/Mock backup failure/).waitFor();
  await page.getByRole('button',{name:'Back up now',exact:true}).click();await page.getByText(/Backup saved to/).waitFor();
  await page.getByRole('button',{name:'Rebuild…',exact:true}).click();await page.getByText('Library rebuilt. 864 files catalogued.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Scan & optimize',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Optimizing…',exact:true}).isDisabled(),true);
  await page.evaluate(()=>window.mockEvents.dispatchEvent(new MessageEvent('optimize',{data:JSON.stringify({done:4,total:8,fixed:2,failed:0})})));await page.getByText('Optimizing videos · 4 of 8',{exact:true}).waitFor();
  await page.evaluate(()=>window.mockEvents.dispatchEvent(new MessageEvent('optimize',{data:JSON.stringify({done:8,total:8,fixed:5,failed:1,finished:true})})));await page.getByText('Streaming scan complete. 5 fixed, 1 skipped.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Scan & optimize',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'Fetch pictures',exact:true}).click();await page.evaluate(()=>window.mockEvents.dispatchEvent(new MessageEvent('avatar',{data:JSON.stringify({done:2,total:3,added:1})})));await page.getByText('Fetching profile pictures · 2 of 3',{exact:true}).waitFor();
  await page.evaluate(()=>window.mockEvents.dispatchEvent(new MessageEvent('avatar',{data:JSON.stringify({done:3,total:3,added:2,finished:true})})));await page.getByText('2 profile pictures updated.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Fetch pictures',exact:true}).isEnabled(),true);
  await page.screenshot({path:path.join(temp,'maintenance.png')});
  await page.setViewportSize({width:700,height:1000});await page.screenshot({path:path.join(temp,'maintenance-narrow.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.setViewportSize({width:390,height:844});await nav.getByRole('button',{name:/Library/}).first().click();await page.screenshot({path:path.join(temp,'storage-small.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await nav.getByRole('button',{name:/Advanced/}).click();await page.getByRole('button',{name:/Open tools/}).waitFor();
  assert(calls.includes('/api/backup')&&calls.includes('/api/rebuild')&&calls.includes('/api/optimize')&&calls.includes('/api/avatars/fetch-all'));assert((await page.evaluate(()=>window.mockNative)).includes('cookies'));assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,screenshots:temp,checks:['storage rendering','desktop folder and restart mocks','connection import/status','backup failure and retry','rebuild','streaming progress/completion','avatar progress/completion','advanced tools visibility','narrow layouts']}));
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
