'use strict';
const {chromium}=require('playwright-core'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));if(!chrome)throw Error('Chrome is required for PDF review');
const fixtures=[
 {id:'math-add-5',subject:'math',grade:3,unit:'g3-add',topic:'hundreds',type:'add-carry-two',count:5},
 {id:'math-add-20',subject:'math',grade:3,unit:'g3-add',topic:'hundreds',type:'add-carry-two',count:20},
 {id:'math-column-mul-6',subject:'math',grade:3,unit:'column-practice',topic:'column',type:'column-mul3',count:6,columnPlaces:1},
 {id:'math-column-div-12',subject:'math',grade:3,unit:'column-practice',topic:'column',type:'column-div3',count:12,columnMode:'yes'},
 {id:'korean-vocabulary-5',subject:'korean',grade:4,unit:'k4-vocabulary',topic:'vocabulary',type:'vocabulary-context',count:5},
 {id:'korean-reading-20',subject:'korean',grade:4,unit:'k4-reading',topic:'reading-set',type:'reading-set-literary',count:20},
 {id:'korean-reading-large',subject:'korean',grade:4,unit:'k4-reading',topic:'reading-set',type:'reading-set-literary',count:20,large:1},
 {id:'science-living-5',subject:'science',grade:3,unit:'general',topic:'living',count:5},
 {id:'science-ecosystem-20',subject:'science',grade:5,unit:'general',topic:'ecosystem',count:20},
 {id:'english-words-5',subject:'english',grade:3,unit:'general',topic:'words',count:5},
 {id:'english-message-20',subject:'english',grade:5,unit:'general',topic:'message-reading',count:20},
 {id:'social-evidence-20',subject:'social',grade:3,unit:'s3-past',topic:'past',type:'past-evidence',count:20},
 {id:'social-photo-5',subject:'social',grade:5,unit:'s5-photos',topic:'history-photo',type:'photo-identify',count:5},
 {id:'social-photo-20',subject:'social',grade:5,unit:'s5-photos',topic:'history-photo',type:'photo-identify',count:20}
];
(async()=>{const out=path.resolve('test-artifacts/worksheet-review');fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});const manifest=[],issues=[];
try{const page=await browser.newPage({viewport:{width:1440,height:1100}});page.on('pageerror',e=>issues.push(e.message));
for(const f of fixtures){const u=new URL(pathToFileURL(path.resolve('문제지 만들기.html')));for(const[k,v]of Object.entries({...f,seed:987}))if(k!=='id')u.searchParams.set(k,String(v));await page.emulateMedia({media:'screen'});await page.goto(u.href,{waitUntil:'load'});await page.waitForFunction(n=>document.querySelector('#questions')?.children.length===n,f.count);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#questions img')].map(img=>img.decode()))});await page.emulateMedia({media:'print'});
for(const teacher of [false,true]){const name=f.id+'-'+(teacher?'teacher':'student');const result=await page.evaluate(teacher=>{document.body.classList.toggle('print-answers',teacher);const result=DailyWorksheetA4.compose();const host=document.getElementById('printPages'),pages=[...host.querySelectorAll('.print-paper')];const bounds=pages.map(p=>{const list=p.querySelector('.print-question-list'),items=[...list.children],r=p.getBoundingClientRect(),top=list.getBoundingClientRect().top;return {count:items.length,share:(Math.max(...items.map(i=>i.getBoundingClientRect().bottom))-top)/(r.bottom-17*96/25.4-top),overflow:items.filter(i=>{const b=i.getBoundingClientRect();return b.bottom>r.bottom-10*96/25.4+2||b.right>r.right+2||b.left<r.left-2}).map(i=>i.dataset.question)}});const visibleAnswers=[...host.querySelectorAll('.inline-answer,.result-answer')].filter(a=>getComputedStyle(a).display!=='none'&&getComputedStyle(a).visibility!=='hidden').length;return {...result,bounds,visibleAnswers};},teacher);
assert.ok(result.ok,name+': '+result.issue);assert.equal(result.bounds.reduce((n,p)=>n+p.count,0),f.count,name);assert.ok(result.bounds.every(p=>p.overflow.length===0),name+' overflowing');if(!teacher)assert.equal(result.visibleAnswers,0,name+' answer leak');const file=path.join(out,name+'.pdf');await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});manifest.push({id:f.id,subject:f.subject,grade:f.grade,teacher,file:path.basename(file),...result});console.log(name+' '+JSON.stringify(result.bounds.map(p=>({count:p.count,share:Math.round(p.share*100)}))))}
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({manifest,issues},null,2));assert.deepEqual(issues,[]);console.log('PDF review: '+manifest.length+' files exported');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
