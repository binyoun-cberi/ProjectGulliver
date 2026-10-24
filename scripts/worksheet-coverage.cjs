'use strict';
const fs=require('node:fs'),path=require('node:path');
const {SUBJECTS,units,alignment,supportedCounts}=require('../daily-worksheet-core.js');
const rows=[['교과','학년','학습 내용','문제 유형','가능 문항 수','문제지 성취기준 코드','상태']];
for(const [subject,info] of Object.entries(SUBJECTS))for(const grade of info.grades)for(const [topic,label,from,to=6] of info.topics){
 if(grade<from||grade>to)continue;
 const variants=units(subject,grade).flatMap(unit=>unit.types.filter(entry=>entry[2]===topic).map(([id,name])=>[id,name]));
 for(const [type,name] of variants.length?variants:[['','기본 연습']]){
  const counts=supportedCounts({subject,grade,topic,type,eras:['prehistoric','ancient','goryeo','joseon','modern'],mathTypes:units('math',grade).flatMap(unit=>unit.types.map(([id])=>id)).filter(id=>id!=='math-mix-worksheet')}),standard=alignment(subject,topic,grade);
  rows.push([info.name,grade,label,name,counts.join('·'),standard?.code||'',standard?'일부 연계 연습':'성취기준 연결 검토 필요']);
 }
}
const csv=rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const destination=path.join(__dirname,'../docs/worksheet-coverage.csv');fs.writeFileSync(destination,'\ufeff'+csv);
const linked=rows.slice(1).filter(row=>row[5]).length;
console.log(`${rows.length-1}개 학년·유형 행, 성취기준 코드 연결 ${linked}행: ${destination}`);
