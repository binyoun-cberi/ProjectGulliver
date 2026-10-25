'use strict';
const fs=require('node:fs'),path=require('node:path'),T=require('../worksheet-learning.js');
const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const headers=['학년','학기','단원','차시','연결 유형','문제은행','객관식 문항 수','20문항까지 부족','상태'];
const rows=[headers];let total=0,ready=0,missing=0;
for(const u of T.catalog.filter(u=>u.subject==='science'))for(const lesson of u.lessons){
 const b=T.binding(u,lesson),n=T.capacity(b,'choice');
 rows.push([u.grade,u.semester,u.name,lesson.name,b?.kind||'미연결',b?.bankId||b?.topic||'',n,Math.max(0,20-n),n>=20?'20문항 이상':n?'보강 필요':'문제은행 미연결']);
 total++;ready+=Number(n>=20);missing+=Math.max(0,20-n);
}
const out=path.resolve(__dirname,'../docs/science-lesson-coverage.csv');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,'\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\n')+'\n','utf8');
console.log(JSON.stringify({total,ready,remaining:total-ready,missingSlots:missing,output:out}));
