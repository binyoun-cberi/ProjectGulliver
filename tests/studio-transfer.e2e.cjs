'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const port=8767,base='http://127.0.0.1:'+port+'/';
const url=base+encodeURIComponent('뚝딱 제작실.html');
async function waitServer(){
 for(let i=0;i<90;i++){
  try{const r=await fetch(base+'studio-transfer-core.js');if(r.ok)return}catch(e){}
  await new Promise(r=>setTimeout(r,200));
 }
 throw Error('테스트용 파일 서버를 열지 못했어요.');
}
test('Chrome: 도안 → 문서, 슬라이드 → 도안·PDF 자동 전달과 원본 보존',{timeout:150000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser=null;
 try{
  await waitServer();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({acceptDownloads:true});
  page.setDefaultTimeout(22000);
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('#editorFrame');
  await page.locator('#toolNav [data-kind="design"]').click();
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
  await page.locator('#proxy-projectTitle').fill('도안에서 보낼 활동지');
  await page.locator('#proxy-projectTitle').press('Tab');
  await page.locator('#transferTarget').selectOption('document');
  await page.locator('#sendToTool').click();
  await page.locator('#toolNav [data-kind="document"][aria-current="true"]').waitFor();
  await frame.locator('#blocks .image img').first().waitFor({timeout:30000});
  assert.ok((await frame.locator('#blocks .image img').first().getAttribute('src')).startsWith('data:image/'));
  await page.locator('#saveStatus').filter({hasText:'기기에 저장됨'}).waitFor();
  const original=await page.evaluate(async()=>{
   const projects=await GulliverStudioStorage.projects();
   const shelf=await GulliverStudioStorage.assets();
   return {original:projects.some(p=>p.kind==='design'&&p.title==='도안에서 보낼 활동지'),assets:shelf.length};
  });
  assert.equal(original.original,true,'원본 도안이 보관돼야 함');
  assert.ok(original.assets>=1,'소재함에 전달 이미지가 남아야 함');

  await page.locator('#toolNav [data-kind="slides"]').click();
  await page.locator('#proxy-slideTitle').waitFor();
  await page.locator('#proxy-slideTitle').fill('가을 나뭇잎 퀴즈');
  await page.locator('#proxy-slideTitle').press('Tab');
  await page.locator('#transferTarget').selectOption('design');
  await page.locator('#sendToTool').click();
  await page.locator('#toolNav [data-kind="design"][aria-current="true"]').waitFor();
  await frame.locator('#sheet image').first().waitFor({timeout:30000});
  assert.ok((await frame.locator('#sheet image').first().getAttribute('href')).startsWith('data:image/'));

  await page.locator('#toolNav [data-kind="slides"]').click();
  await page.locator('#proxy-slideTitle').waitFor();
  await page.locator('#transferTarget').selectOption('pdf');
  await page.locator('#sendToTool').click();
  await page.locator('#toolNav [data-kind="pdf"][aria-current="true"]').waitFor();
  await frame.locator('#fileList li').first().waitFor({timeout:30000});
  const pdf=await frame.locator('#fileList').textContent();
  assert.ok(pdf.includes('.pdf'),'공유한 이미지가 PDF가 되어야 함');
  const notice=await page.locator('#message').textContent();
  assert.match(notice,/PDF|전달/);
  assert.deepEqual(pageErrors,[],'Browser exceptions: '+pageErrors.join(' | '));
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
});
