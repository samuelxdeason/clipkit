const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'clipkit-states-'));
 const server=spawn(process.execPath,[path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js'),'--host','127.0.0.1','--port','5192','--strictPort'],{cwd:root,windowsHide:true,stdio:'pipe'});let browser,release;
 const gate=new Promise(resolve=>release=resolve);
 try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5192')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let firstQueue=true,failPhoto=true,failSettings=true,failDuplicates=true;
  await page.route('**/api/**',async r=>{
   const u=new URL(r.request().url());let result=[],fail=false;
   if(u.pathname==='/api/events')return r.fulfill({contentType:'text/event-stream',body:': mock\n\n'});
   if(u.pathname==='/api/queue'&&firstQueue){await gate;fail=true;}
   if(u.pathname==='/api/photos/all'&&failPhoto){fail=true;}
   if(u.pathname==='/api/stats'){if(failSettings){fail=true;}else result={totalBytes:0,videoCount:0,modelCount:0,sites:[]};}
   if(u.pathname==='/api/mediaroot')result='D:\\Sample library';
   if(u.pathname==='/api/cookiestatus')result={x:false,pornhub:false};
   if(u.pathname==='/api/duplicates'&&failDuplicates){fail=true;}
   if(u.pathname==='/api/duplicates/recycle-folder')result='D:\\Sample library\\Recycle bin';
   await r.fulfill({status:fail?500:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Simulated service failure. Try again.'}:result)});
  });
  await page.goto('http://127.0.0.1:5192');await page.getByRole('heading',{name:'Opening your library…'}).waitFor();
  await page.screenshot({path:path.join(temp,'loading.png')});
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.state-spinner').evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  release();await page.getByRole('heading',{name:'Couldn’t load your library'}).waitFor();await page.screenshot({path:path.join(temp,'load-error.png')});
  firstQueue=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('heading',{name:'A home for your videos'}).waitFor();await page.screenshot({path:path.join(temp,'empty-library.png')});
  await page.getByRole('button',{name:'Add videos',exact:true}).last().click();await page.getByRole('dialog',{name:'Add videos'}).waitFor();await page.keyboard.press('Escape');
  await page.locator('[data-section="photos"]').click();await page.getByRole('heading',{name:'Couldn’t load your photos'}).waitFor();failPhoto=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('heading',{name:'A home for your photos'}).waitFor();
  await page.locator('[data-section="tags"]').click();await page.getByRole('button',{name:'Browse videos',exact:true}).click();await page.getByRole('heading',{name:'Your video library'}).waitFor();
  await page.locator('[data-section="settings"]').click();await page.getByRole('heading',{name:'Couldn’t load settings'}).waitFor();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(temp,'error-small.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  failSettings=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('heading',{name:'Your library',exact:true}).waitFor();
  await page.setViewportSize({width:1440,height:1000});await page.locator('.sidebar-manage-disclosure summary').click();await page.getByRole('button',{name:'Potential duplicates',exact:true}).click();await page.getByRole('alert').waitFor();
  failDuplicates=false;await page.getByRole('button',{name:'Refresh queue',exact:true}).click();await page.getByRole('heading',{name:'No potential duplicates'}).waitFor();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,screenshots:temp,checks:['visible loading indicator','reduced motion','library failure/retry','empty-state add action','photo failure/retry','tag recovery navigation','settings failure/retry','duplicate queue refresh','narrow error layout']}));
 }finally{release();if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
