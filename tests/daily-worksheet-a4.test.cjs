(function testSource(){
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
let chromium;try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/opt/google/chrome/chrome'].find(p=>p&&fs.existsSync(p));
const fixtures=[
 {subject:'math',grade:3,unit:'general',topic:'shape',type:'',count:5,seed:17},
 {subject:'math',grade:3,unit:'column-practice',topic:'column',type:'column-mul3',count:6,seed:18},
 {subject:'math',grade:3,unit:'column-practice',topic:'column',type:'column-div3',count:12,seed:19},
 {subject:'social',grade:5,unit:'s5-photos',topic:'history-photo',type:'photo-identify',count:5,seed:741},
 {subject:'math',grade:3,unit:'g3-add',topic:'hundreds',type:'add-carry-two',count:5,seed:343},
 {subject:'math',grade:3,unit:'g3-add',topic:'hundreds',type:'add-carry-two',count:10,seed:344},
 {subject:'math',grade:3,unit:'g3-add',topic:'hundreds',type:'add-carry-two',count:20,seed:345},
 {subject:'korean',grade:4,unit:'k4-vocabulary',topic:'vocabulary',type:'vocabulary-context',count:5,seed:124},
 {subject:'korean',grade:4,unit:'k4-vocabulary',topic:'vocabulary',type:'vocabulary-context',count:10,seed:125},
 {subject:'english',grade:3,unit:'',topic:'words',type:'',count:20,seed:128},
 {subject:'science',grade:3,unit:'',topic:'living',type:'',count:20,seed:129},
 {subject:'social',grade:3,unit:'s3-past',topic:'past',type:'past-evidence',count:20,seed:789},
 {subject:'korean',grade:4,unit:'k4-reading',topic:'reading-set',type:'reading-set-literary',count:20,seed:987},
 {subject:'social',grade:5,unit:'s5-photos',topic:'history-photo',type:'photo-identify',count:10,seed:741}
];
function pages(pdf){return [...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length;}
async function inspect(page){
 return page.evaluate(()=>{
  const p=window.DailyWorksheetA4.compose(),root=document.getElementById('printPages');root.classList.add('is-measuring');
  const all=[...root.querySelectorAll('.print-paper')];
  const mathmm=96/25.4;
  const printed=all.flatMap(x=>[...x.querySelectorAll('.print-question-list > li')]);
  const out={
   ...p,count:printed.length,numbered:printed.map(x=>Number(x.dataset.question)),
   overflow:all.flatMap((x,i)=>[...x.querySelectorAll('.print-question-list>li')].filter(l=>l.getBoundingClientRect().bottom>x.getBoundingClientRect().bottom-10*mathmm+2).map(l=>[i+1,l.dataset.question])),
   pagesHaveHead:all.every(x=>!!x.querySelector('.paper-topline')&&!!x.querySelector('.print-page-footer')),
   columns:getComputedStyle(all[0]?.querySelector('ol')).gridTemplateColumns,
   compact:document.getElementById('questions').classList.contains('compact-questions'),
   dense:document.getElementById('questions').classList.contains('calculation-grid'),
   roomy:all.length===1&&all[0].classList.contains('roomy-page'),
   roomShare:all.length===1&&all[0].querySelectorAll('.print-question-list>li').length?
     ((all[0].querySelector('.print-question-list>li:last-child').getBoundingClientRect().bottom-
     all[0].querySelector('.print-question-list').getBoundingClientRect().top)/
     (all[0].getBoundingClientRect().bottom-all[0].querySelector('.print-question-list').getBoundingClientRect().top)):
     0,
   roomyColumns:all.length===1&&all[0].classList.contains('roomy-calculations')
  };
  root.classList.remove('is-measuring');return out;
 });
}
test('A4 print styles and pagination module are wired before core renderer',()=>{
 const html=fs.readFileSync('문제지 만들기.html','utf8');
 assert.ok(html.indexOf('daily-worksheet-pagination.js')<html.indexOf('daily-worksheet.js'));
 const css=fs.readFileSync('daily-worksheet.css','utf8');
 assert.match(css,/@page\{size:A4;margin:12mm\}/);
 assert.match(css,/print-paper:last-child/);
 assert.match(css,/compact-questions/);
 assert.match(css,/roomy-page/);
 const js=fs.readFileSync('daily-worksheet.js','utf8');
 assert.doesNotMatch(js,/성취기준 전체 평가 아님|가상의 연습 자료|성취기준 연계를 검토 중입니다/);
 assert.match(fs.readFileSync('문제지 만들기.html','utf8'),/교사용 정답·풀이 인쇄/);
});
test('five subjects: no A4-spanning questions, efficient short sheets, full PDF pagination', {timeout:180000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const root=pathToFileURL(path.resolve('문제지 만들기.html')).href;
  for(const f of fixtures){
   const u=new URL(root);
   for(const [k,v] of Object.entries(f))if(v!=='')u.searchParams.set(k,String(v));
   await page.goto(u.href,{waitUntil:'load'});
   await page.waitForFunction(()=>document.querySelector('#questions')?.children.length===Number(new URL(location.href).searchParams.get('count')),{timeout:15000});
   await page.evaluate(()=>document.fonts.ready);
   const result=await inspect(page);
   assert.equal(result.ok,true,`${f.subject}/${f.topic}: ${result.issue}`);
   assert.equal(result.count,f.count,`${f.subject}/${f.topic}: all items printed`);
   assert.deepEqual(result.numbered,Array.from({length:f.count},(_,i)=>i+1));
   assert.deepEqual(result.overflow,[],`${f.subject}/${f.topic} questions overflow A4`);
   assert.equal(result.pagesHaveHead,true);
   assert.ok(result.pages>=1&&result.pages<=f.count);
   if(f.subject==='math')assert.equal(result.pages,1,'short arithmetic questions must fit on one sheet');
   if(f.count<=10&&((f.subject==='math'&&f.topic==='hundreds')||(f.subject==='korean'&&f.topic==='vocabulary'))){
     assert.equal(result.roomy,true,'five or ten short questions should be spread over A4');
     assert.ok(result.roomShare>.60,'room to answer should cover most of the writable page, got '+result.roomShare);
     if(f.subject==='math')assert.equal(result.roomyColumns,true,'few calculation problems must use wide two-column writing spaces');
   }
   if(f.subject==='korean'&&f.topic==='vocabulary')assert.equal(result.pages,1,'short vocabulary items must fit on one sheet');
   if(f.subject==='math'||f.subject==='korean'&&f.topic==='vocabulary'){
    await page.emulateMedia({media:'print'});
    const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
    assert.equal(pages(pdf),result.pages,`${f.subject}/${f.topic}: no phantom PDF pages`);
    await page.emulateMedia({media:'screen'});
   }
  }
  assert.deepEqual(errors,[],'no browser exception');
 }finally{await browser.close()}
});
test('teacher copy, large-print reading passages and student copy each paginate independently', {timeout:160000,skip:!chrome&&'Chrome unavailable'},async()=>{
 const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 try{
  const u=pathToFileURL(path.resolve('문제지 만들기.html')).href+'?subject=korean&grade=4&unit=k4-reading&topic=reading-set&type=reading-set-literary&count=20&seed=987&large=1';
  await page.goto(u);await page.waitForFunction(()=>document.querySelector('#questions')?.children.length===20);
  const student=await inspect(page);
  assert.equal(student.ok,true,student.issue);assert.deepEqual(student.overflow,[]);
  await page.evaluate(()=>document.body.classList.add('print-answers'));
  const teacher=await inspect(page);
  assert.equal(teacher.ok,true,teacher.issue);assert.deepEqual(teacher.overflow,[]);
  assert.equal(teacher.count,20);assert.ok(teacher.pages>=student.pages);
  await page.emulateMedia({media:'print'});
  const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
  assert.equal(pages(pdf),teacher.pages,'teacher PDF should have exact measured number of pages');
 }finally{await browser.close()}
});
})();


// Equal-height exercises reproduce the former 13/7 split independently of question-bank wording.
{
 const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
 const {pathToFileURL}=require('node:url');let chromium;try{({chromium}=require('playwright-core'))}catch{}
 const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
 test('measured two-page worksheet balances 20 questions and fills five-question illustration sheets',{skip:(!chrome||!chromium)&&'Chrome required',timeout:90000},async()=>{
  const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--allow-file-access-from-files']});
  try{const page=await browser.newPage({viewport:{width:1440,height:1100}});
   await page.goto(pathToFileURL(path.resolve('문제지 만들기.html')).href+'?subject=math&grade=3&unit=general&topic=shape&count=5&seed=17');
   const result=await page.evaluate(()=>{
    const list=document.getElementById('questions');list.className='';list.replaceChildren();
    for(let i=0;i<20;i++){const li=document.createElement('li');li.textContent=(i+1)+'번 문제';li.style.cssText='min-height:64px;box-sizing:border-box';list.append(li)}
    const packed=DailyWorksheetA4.compose();return packed;
   });assert.equal(result.ok,true,result.issue);assert.deepEqual(result.counts,[10,10]);
   const spread=await page.evaluate(()=>{
    const list=document.getElementById('questions');list.replaceChildren();
    for(let i=0;i<5;i++){const li=document.createElement('li');li.innerHTML='<svg width="80" height="50" aria-label="도형"><rect width="70" height="40"/></svg><p>도형을 살펴보고 설명을 쓰세요.</p>';list.append(li)}
    const packed=DailyWorksheetA4.compose(),host=document.getElementById('printPages');host.classList.add('is-measuring');const paper=host.querySelector('.print-paper'),ol=paper.querySelector('ol'),last=ol.lastElementChild;
    const share=(last.getBoundingClientRect().bottom-ol.getBoundingClientRect().top)/(paper.getBoundingClientRect().bottom-ol.getBoundingClientRect().top);host.classList.remove('is-measuring');return {...packed,share};
   });assert.equal(spread.ok,true);assert.equal(spread.pages,1);assert.ok(spread.share>.65,'illustrations should leave usable writing space throughout the page');
  }finally{await browser.close()}
 });
}
