const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {spawn,execFileSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'clipkit-duplicates-')),sample=path.join(temp,'sample.mp4');
 execFileSync(path.resolve(root,'../resources/ffmpeg/ffmpeg.exe'),['-v','error','-f','lavfi','-i','color=c=0x38545b:s=160x90:r=12','-t','30','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',sample],{windowsHide:true});
 const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5193','--strictPort'],{cwd:root,windowsHide:true,stdio:'pipe'});let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5193')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
  const make=(id,height)=>({id,site:'Local',title:'Mountain light '+id,filename:id+'.mp4',filepath:id+'.mp4',thumbnail:id==='a'?'broken':id+'.svg',width:height===1080?1920:1280,height,duration:30,filesize:height*100000,people:['Alex'],labels:['Nature'],added:'2026-10-27T09:00:00Z'});
  let groups=[{id:1,videos:[make('a',1080),make('b',720)]},{id:2,videos:[make('c',1080),make('d',720),make('e',720)]}],fail=true;
  await page.route('**/api/**',async r=>{
   const u=new URL(r.request().url());let result=[];
   if(u.pathname==='/api/events')return r.fulfill({contentType:'text/event-stream',body:': mock\n\n'});
   if(u.pathname==='/api/duplicates')result=groups;
   if(u.pathname==='/api/duplicates/recycle-folder')result='D:\\Sample library\\Recycle bin';
   if(u.pathname==='/api/duplicates/resolve'){
    const b=r.request().postDataJSON();writes.push(b);
    if(fail){fail=false;return r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Mock cleanup failed'})});}
    groups=groups.filter(g=>g.id!==b.id64);result={};
   }
   await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.route('**/media?*',r=>{
   const p=new URL(r.request().url()).searchParams.get('p');
   if(p.endsWith('.mp4'))return r.fulfill({contentType:'video/mp4',body:fs.readFileSync(sample)});
   if(p==='broken')return r.fulfill({status:404,body:''});
   return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#38545b"/><circle cx="440" cy="100" r="65" fill="#ffffff20"/><path d="M0 320 200 110 400 320 520 180 640 290V360H0" fill="#ffffff15"/></svg>'});
  });
  await page.goto('http://127.0.0.1:5193');await page.locator('.sidebar-manage-disclosure summary').click();await page.getByRole('button',{name:'Potential duplicates',exact:true}).click();
  await page.getByRole('heading',{name:'Compare 2 videos'}).waitFor();await page.getByText('No preview image',{exact:true}).waitFor();
  await page.locator('.dq-recycle-info summary').click();await page.getByText('D:\\Sample library\\Recycle bin',{exact:true}).waitFor();await page.locator('.dq-recycle-info summary').click();
  await page.getByRole('button',{name:'More details',exact:true}).click();await page.getByRole('rowheader',{name:'Location',exact:true}).waitFor();
  await page.getByRole('button',{name:'Keep only copy 1',exact:true}).click();assert.equal(await page.getByRole('checkbox',{name:'Keep copy 2',exact:true}).isChecked(),false);
  await page.getByRole('button',{name:'Skip for now',exact:true}).click();await page.getByRole('heading',{name:'Compare 3 videos'}).waitFor();await page.getByLabel('Jump to group').selectOption('1');assert.equal(await page.getByRole('checkbox',{name:'Keep copy 2',exact:true}).isChecked(),false);
  await page.getByRole('checkbox',{name:'Keep copy 1',exact:true}).uncheck();assert.equal(await page.getByRole('button',{name:'Save & next',exact:true}).isDisabled(),true);await page.getByRole('checkbox',{name:'Keep copy 1',exact:true}).check();
  await page.screenshot({path:path.join(temp,'review.png')});
  await page.getByRole('button',{name:'Play copy 1: Mountain light a',exact:true}).click();await page.locator('.watch-window video').first().waitFor();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Preview side by side',exact:true}).click();assert.equal(await page.locator('.dq-preview video').count(),2);
  await page.locator('.dq-preview video').first().evaluate(v=>{v.muted=true;return v.play();});await page.locator('.dq-preview video').nth(1).evaluate(v=>{v.muted=true;return v.play();});assert.equal(await page.locator('.dq-preview video').first().evaluate(v=>v.paused),true);
  await page.getByRole('button',{name:'Save & next',exact:true}).click();await page.getByRole('alert').getByText(/Mock cleanup failed/).waitFor();assert.equal(await page.locator('.dq-preview video').count(),0);assert.equal(await page.getByRole('checkbox',{name:'Keep copy 1',exact:true}).isChecked(),true);
  await page.getByRole('button',{name:'Save & next',exact:true}).click();await page.getByRole('heading',{name:'Compare 3 videos'}).waitFor();assert.deepEqual(writes.at(-1),{id64:1,keep:[{site:'Local',id:'a'}]});
  await page.setViewportSize({width:700,height:1000});await page.screenshot({path:path.join(temp,'review-narrow.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert(await page.locator('.dq-table-scroll').evaluate(e=>e.scrollWidth>e.clientWidth));
  await page.getByRole('button',{name:'Keep all',exact:true}).click();await page.getByRole('heading',{name:'All reviewed',exact:true}).waitFor();assert.equal(writes.at(-1).keep.length,3);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,screenshots:temp,checks:['comparison and extra metadata','missing thumbnail','recycle explanation','keep-only and minimum keeper','skip preserves draft','jump navigation','player opens','preview playback exclusivity','cleanup failure/retry and exact payload','previews stopped before saving','keep all','horizontal comparison on narrow screen']}));
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});

