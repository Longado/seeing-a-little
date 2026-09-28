const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const file=path.join(__dirname,'../state.js');
function api(){assert.ok(fs.existsSync(file),'state module must exist');const ctx={};vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx);return ctx.LookState;}
test('resume valid answers and step without losing notes',()=>{const m=api();const s=m.restore(JSON.stringify({version:1,step:3,started:true,answers:{moodA:'安静',noteA:'床让我想休息'},pin:{art:'bedroom',x:.7,y:.6},palette:'warm'}));assert.equal(s.step,3);assert.equal(s.answers.noteA,'床让我想休息');assert.equal(s.pin.x,.7);});
test('corrupted or incompatible storage opens a fresh session',()=>{const m=api();for(const raw of ['{','null','[]','{"version":9}','{"version":1,"step":900,"answers":null}']){const s=m.restore(raw);assert(s.step>=0&&s.step<=6);assert.equal(typeof s.answers,'object');}});
test('invalid image coordinates and oversized persisted notes are sanitized',()=>{const m=api();const s=m.restore(JSON.stringify({version:1,pin:{art:'bad',x:Infinity,y:-3},answers:{noteA:'长'.repeat(9999),unknown:'x'}}));assert.equal(s.pin,null);assert.equal(s.answers.noteA.length,600);assert.equal(s.answers.unknown,undefined);});
test('a changed answer remains distinct from the first impression in export',()=>{const m=api();const s=m.restore(null);s.answers.moodA='紧张';s.answers.reflection='作者想休息，但倾斜的线条让我不安';const text=m.toMarkdown(s);assert(text.includes('紧张'));assert(text.includes('作者想休息'));assert(text.includes('暂未记录'));});
