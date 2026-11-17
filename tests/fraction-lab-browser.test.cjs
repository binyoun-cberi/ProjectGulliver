'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
let chromium;
try{({chromium}=require('playwright-core'));}catch{}
const chrome=[process.env.CHROME_BIN,'/usr/bin/chromium','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].find(p=>p&&fs.existsSync(p));

test('분수 실험실: 터치 조각 이동부터 교사 출제 링크까지 실제 브라우저 통합 검증',
 {skip:(!chromium||!chrome)&&'Playwright 및 Chromium 설치가 필요한 브라우저 검증'},
 async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((request,response)=>{
  let pathname;
  try{pathname=decodeURIComponent((request.url||'/').split('?')[0]);}
  catch{response.writeHead(400);response.end();return;}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){response.writeHead(403);response.end();return;}
  try{
   const data=fs.readFileSync(file);
   response.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8'});
   response.end(data);
  }catch{response.writeHead(404);response.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const origin='http://127.0.0.1:'+server.address().port;
  const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push('교사 화면: '+error.message));
  await page.goto(origin+'/분수%20실험실%20심화.html');
  await page.locator('[data-action="mode"][data-value="calc"]').tap();
  await page.locator('[data-action="transferPiece"][data-source="a"]').first().tap();
  await page.locator('[data-action="transferPiece"][data-source="b"]').first().tap();
  await page.locator('[data-action="transferPiece"][data-source="b"]:not([disabled])').first().tap();
  await page.locator('[data-action="check"]').tap();
  assert.match(await page.locator('#stage').innerText(),/정답입니다/);
  await page.locator('[data-action="mode"][data-value="teacher"]').tap();
  await page.locator('[data-teacher="operation"]').selectOption('subtract');
  await page.locator('[data-teacher="aD"]').selectOption('4');
  await page.locator('[data-teacher="aN"]').selectOption('3');
  await page.locator('[data-teacher="bD"]').selectOption('2');
  await page.locator('[data-teacher="bN"]').selectOption('1');
  await page.locator('#teacherText').fill('교사가 만든 분수 뺄셈 문제');
  await page.locator('[data-action="saveTeacher"]').tap();
  assert.match(await page.locator('#stage').innerText(),/학생 문제 시작/);
  await page.locator('[data-action="shareTeacher"]').first().tap();
  const shareLink=await page.locator('#teacherShareUrl').inputValue();
  assert.match(shareLink,/task=/);
  const studentContext=await browser.newContext({viewport:{width:800,height:1280},hasTouch:true,isMobile:true});
  const student=await studentContext.newPage();
  student.on('pageerror',error=>errors.push('학생 화면: '+error.message));
  await student.goto(shareLink);
  assert.match(await student.locator('#stage').innerText(),/뺄셈 조각 빼기/);
  await student.locator('[data-action="convertTransfer"]').tap();
  await student.locator('[data-action="transferPiece"][data-source="b"]').first().tap();
  await student.locator('[data-action="transferPiece"][data-source="b"]:not([disabled])').first().tap();
  await student.locator('[data-action="check"]').tap();
  assert.match(await student.locator('#stage').innerText(),/정답입니다/);
  assert.deepEqual(errors,[]);
 }finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
