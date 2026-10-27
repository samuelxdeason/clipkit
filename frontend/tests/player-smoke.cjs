const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
(async () => {
 const root=path.resolve(__dirname,'..');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'clipkit-player-'));
 const video=path.join(temp,'sample.mp4');
 execFileSync(path.resolve(root,'../resources/ffmpeg/ffmpeg.exe'),['-v','error','-f','lavfi','-i','color=c=0x294552:s=160x90:r=12','-t','60','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',video],{windowsHide:true});
 const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5198','--strictPort'],{cwd:root,windowsHide:true,stdio:'pipe'});
 let browser;
 try {
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:5198/tests/player-harness.html')).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  let models=['Alex Morgan'], labels=['Travel'], memberships=[1], fail=false;
  const people=[{name:'Alex Morgan',nickname:'Alex'},{name:'Jamie Lee',nickname:'Jamie'}];
  const collections=[{id:1,name:'Weekend favorites',parentId:0},{id:2,name:'Watch later',parentId:0},{id:3,name:'Locked collection',locked:true,parentId:0}];
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/test-video.mp4',r=>r.fulfill({status:200,contentType:'video/mp4',body:fs.readFileSync(video)}));
  await page.route('**/api/**',async r=>{
   const u=new URL(r.request().url()); const b=r.request().method()==='POST'?r.request().postDataJSON():{};
   if(fail&&u.pathname==='/api/setlabels'){fail=false;return r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Test save failed'})});}
   let result={};
   switch(u.pathname){
    case '/api/models': result=people;break;
    case '/api/labels': result=['Travel','Outdoors'];break;
    case '/api/collections': result=collections;break;
    case '/api/collections-for-video': result=memberships;break;
    case '/api/setmodels': models=b.models;break;
    case '/api/setlabels': labels=b.labels;break;
    case '/api/people/create':people.push({name:b.name,nickname:''});break;
    case '/api/collections/add':memberships=[...new Set([...memberships,b.id64])];break;
    case '/api/collections/remove':memberships=memberships.filter(x=>x!==b.id64);break;
    case '/api/albums/create':result={id:4};collections.push({id:4,name:b.name,parentId:0});break;
   }
   await r.fulfill({contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.goto('http://127.0.0.1:5198/tests/player-harness.html');
  await page.locator('video').evaluate(v=>{v.muted=true;return v.play();});
  await page.waitForFunction(()=>document.querySelector('video').currentTime>=3);
  await page.locator('video').evaluate(v=>v.dataset.identity='original');
  const time=await page.locator('video').evaluate(v=>v.currentTime);
  const stage = await page.locator('.watch-stage').boundingBox();
  assert(stage.height > 750, 'Desktop playback should use most of the window height');
  await page.locator('.watch-organize-bar').getByRole('button',{name:'People',exact:true}).click();
  await page.getByRole('button',{name:/Jamie Jamie Lee/}).click();
  await page.getByText('Person linked to this video.',{exact:false}).waitFor();
  assert.deepEqual(models,['Alex Morgan','Jamie Lee']);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await page.getByText('Change undone.',{exact:false}).waitFor();assert.deepEqual(models,['Alex Morgan']);
  await page.getByRole('textbox',{name:'Search people'}).fill('Taylor Reed');
  await page.getByRole('button',{name:'＋ Create and link “Taylor Reed”'}).click();
  await page.getByText('Person created and linked.',{exact:false}).waitFor();assert(models.includes('Taylor Reed'));
  await page.locator('.wo-tabs').getByRole('button',{name:'Tags',exact:true}).click();
  fail=true;await page.getByRole('button',{name:/Outdoors Add tag/}).click();
  await page.getByRole('alert').waitFor();assert.deepEqual(labels,['Travel']);
  await page.getByRole('button',{name:/Outdoors Add tag/}).click();
  await page.getByText('Tag added.',{exact:false}).waitFor();assert(labels.includes('Outdoors'));
  await page.locator('.wo-tabs').getByRole('button',{name:'Collections',exact:true}).click();
  await page.getByRole('button',{name:/Watch later Collection/}).click();
  await page.getByText('Added to collection.',{exact:false}).waitFor();assert(memberships.includes(2));
  assert.equal(await page.getByRole('button',{name:/Locked collection/}).count(),0);
  await page.getByRole('textbox',{name:'Search collections'}).fill('Evening picks');
  await page.getByRole('button',{name:'＋ Create collection “Evening picks”'}).click();
  await page.getByText('Collection created and video added.',{exact:false}).waitFor();assert(memberships.includes(4));
  await page.getByRole('button',{name:'Fullscreen',exact:true}).click();
  await page.waitForFunction(()=>!!document.fullscreenElement);
  await page.locator('.wo-tabs').getByRole('button',{name:'People',exact:true}).click();
  await page.getByRole('button',{name:/Jamie Jamie Lee/}).click();
  await page.getByText('Person linked to this video.',{exact:false}).waitFor();
  assert(await page.evaluate(()=>!!document.fullscreenElement));
  assert.equal(await page.locator('video').getAttribute('data-identity'),'original');
  assert((await page.locator('video').evaluate(v=>v.currentTime))>time);
  assert.equal(await page.locator('video').evaluate(v=>v.paused),false);
  await page.getByRole('button',{name:'Exit fullscreen',exact:true}).click();
  await page.screenshot({path:path.join(temp,'player-desktop.png')});
  for (const viewport of [{width:880,height:900},{width:390,height:844},{width:1200,height:500}]) {
    await page.setViewportSize(viewport);
    const videoBox=await page.locator('video').boundingBox();
    assert(videoBox.width>250 && videoBox.height>200, 'Playback remains usable at narrow and short sizes');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.getByRole('button',{name:'Rewind 10 seconds'}).scrollIntoViewIfNeeded();
    await page.getByRole('button',{name:'Forward 10 seconds'}).click();
    await page.getByRole('button',{name:'Rewind 10 seconds'}).click();
  }
  await page.setViewportSize({width:700,height:900});
  await page.screenshot({path:path.join(temp,'player-narrow.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.watch-inspector').isVisible(),false);
  await page.keyboard.press('Escape');await page.getByText('Player closed').waitFor();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks:['link/create people','undo','tag save failure and retry','collections/create/locked exclusion','fullscreen edits','same video element and uninterrupted playback','narrow layout','Escape panel then player'],screenshots:temp}));
 } finally {if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});


