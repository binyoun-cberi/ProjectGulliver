'use strict';
const fs=require('node:fs'),path=require('node:path');
const T=require('../worksheet-learning.js');
const records=[['학년','학기','단원','차시','문제은행','객관식 고유 문항 수','20문항까지 부족','상태']];
for(const unit of T.catalog.filter(u=>u.subject==='social'))for(const lesson of unit.lessons){
 const b=T.binding(unit,lesson);
 const capacity=T.capacity(b,'choice');
 records.push([unit.grade,unit.semester,unit.name,lesson.name,b?.bankId||b?.kind||'',capacity,Math.max(0,20-capacity),capacity>=20?'20문항 이상':'보강 필요']);
}
const csv='\ufeff'+records.map(cols=>cols.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const dest=path.resolve(__dirname,'../docs/social-lesson-coverage.csv');
fs.writeFileSync(dest,csv);
const sufficient=records.slice(1).filter(r=>r[5]>=20).length;
console.log('사회 '+(records.length-1)+'차시 / 20문항 가능 '+sufficient+'차시 / 보강 필요 '+(records.length-1-sufficient)+'차시: '+dest);
