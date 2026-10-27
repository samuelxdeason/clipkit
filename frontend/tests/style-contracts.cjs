// Guard the ownership boundary: global tokens live in one file, not page sheets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const postcss=require('postcss'),root=path.resolve(__dirname,'../src');
const entry=fs.readFileSync(path.join(root,'app-theme.css'),'utf8');
const imports=[...entry.matchAll(/@import "\.\/(.*?)";/g)].map(m=>m[1]);
const repo=path.resolve(root,'../..');
const packageInfo=require('../../packages/design-tokens/package.json');
assert.equal(packageInfo.private,true,'Tokens remain private');
assert(!packageInfo.dependencies,'Tokens must stay dependency-free');
assert(fs.existsSync(path.join(repo,'package-lock.json')),'Root workspace lockfile required');
for(const file of ['frontend/package-lock.json','frontend/pnpm-lock.yaml','frontend/pnpm-workspace.yaml'])assert(!fs.existsSync(path.join(repo,file)),'No nested or alternate lockfiles');
assert.equal(imports[0],'tokens.css');
const tokenPath=require.resolve('@clipkit/design-tokens/tokens.css');
assert.equal(fs.readFileSync(path.join(root,'tokens.css'),'utf8').trim(),'/* Compatibility entry: values are owned by the shared package. */\n@import "@clipkit/design-tokens/tokens.css";','Frontend tokens entry must remain an import-only shim');
assert.equal(new Set(imports).size,imports.length,'No duplicate stylesheets');
assert.equal(imports[imports.indexOf('surface-system.css')+1],'browse-layout.css','Browsing has one ordered layout owner');
for(const file of imports){
 const css=fs.readFileSync(path.join(root,file),'utf8');
 assert.ok(!css.includes('--ui-browse-control'),'Retired toolbar palette must not return');
 postcss.parse(css).walkRules(rule=>{
  if(/compact-video-toolbar|results-rail-toolbar|browse-query-group|browse-pagination/.test(rule.selector))assert.equal(file,'browse-layout.css','Shared browsing styles belong in browse-layout.css');
 });
}
let tokens=0;
for(const file of imports){
 postcss.parse(fs.readFileSync(file==='tokens.css'?tokenPath:path.join(root,file),'utf8')).walkDecls(d=>{
  if(d.prop.startsWith('--')&&d.parent.selector==='.finder-shell'){
   assert.equal(file,'tokens.css',`${d.prop} must be defined in tokens.css`);tokens++;
  }
 });
}
assert.ok(tokens>100);
for(const file of ['Manager.tsx','design-system-preview.tsx']){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 assert.ok(source.includes('import "./app-theme.css";'));
 assert.ok(!/import "\.\/(?:ui-system|surface-system|typography|icon-system)\.css"/.test(source),'Use the theme entry');
}
console.log(JSON.stringify({passed:true,tokens,checks:['single token owner','ordered theme entry','shared app and preview theme']}));
