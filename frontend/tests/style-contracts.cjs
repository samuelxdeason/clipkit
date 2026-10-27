// Guard the ownership boundary: global tokens live in one file, not page sheets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const postcss=require('postcss'),root=path.resolve(__dirname,'../src');
const entry=fs.readFileSync(path.join(root,'app-theme.css'),'utf8');
const imports=[...entry.matchAll(/@import "\.\/(.*?)";/g)].map(m=>m[1]);
assert.equal(imports[0],'tokens.css');
assert.equal(new Set(imports).size,imports.length,'No duplicate stylesheets');
let tokens=0;
for(const file of imports){
 postcss.parse(fs.readFileSync(path.join(root,file),'utf8')).walkDecls(d=>{
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
