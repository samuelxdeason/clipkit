const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compiled=ts.transpileModule(fs.readFileSync(require.resolve('../src/collectionDrag.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const exportsObject={};vm.runInNewContext(compiled,{exports:exportsObject});
const {canDropCollection,dragOperation}=exportsObject;
const folders=[{id:1,parentId:0},{id:2,parentId:1},{id:3,parentId:2},{id:4,parentId:0},{id:5,parentId:0,locked:true},{id:6,parentId:5,inheritedLocked:true}];
test('folders reject self, descendants, unchanged parents and locked destinations',()=>{
 const folder={kind:'folder',id:1};
 for(const id of [0,1,2,3,5,6,999])assert.equal(canDropCollection(folder,id,folders),false,`destination ${id}`);
 assert.equal(canDropCollection(folder,4,folders),true);
 assert.equal(canDropCollection({kind:'folder',id:2},0,folders),true);
});
test('mixed media targets and copy semantics match library versus folder sources',()=>{
 const media={kind:'media',sourceId:1,photos:['p'],videos:[{site:'Local',id:'v'}]};
 for(const id of [0,1,5,6,999])assert.equal(canDropCollection(media,id,folders),false);
 assert.equal(canDropCollection(media,2,folders),true);
 assert.equal(canDropCollection({...media,photos:[],videos:[]},2,folders),false);
 assert.equal(dragOperation(media,false),'Move');assert.equal(dragOperation(media,true),'Add');
 assert.equal(dragOperation({...media,sourceId:0},false),'Add');
 assert.equal(dragOperation({kind:'folder',id:1},true),'Move');
});
