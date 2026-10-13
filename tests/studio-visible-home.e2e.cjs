'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright-core');
const port=8787,base='http://127.0.0.1:'+port+'/';
async function ready(){
 for(let i=0;i<70;i++){try{if((await fetch(base+'index.html')).ok)return}catch{}
 await new Promise(r=>setTimeout(r,200))}
 throw Error('site not ready');
}
test('Homepage and new-activity modal expose video/music editor links in Chrome',{timeout:90000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(16000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
  // The separate cards are not studioLegacy-hidden.
  await page.locator('.quick-tool[href="영상 뚝딱.html"]').waitFor();
  await page.locator('.quick-tool[href="음악 뚝딱.html"]').waitFor();
  await page.locator('.tool-row').filter({hasText:'영상 뚝딱'}).first().waitFor();
  await page.locator('.tool-row').filter({hasText:'음악 뚝딱'}).first().waitFor();
  await page.locator('#menuButton').click();
  await page.locator('#createButton').click();
  await page.locator('#createDialog a[href="영상 뚝딱.html"]').waitFor();
  await page.locator('#createDialog a[href="음악 뚝딱.html"]').waitFor();
  for(const kind of ['영상','음악']){
   const p=base+encodeURIComponent(kind+' 뚝딱.html');
   const resp=await page.request.get(p);
   assert.equal(resp.status(),200,p);
   assert.ok((await resp.text()).includes('officialEditorFrame'));
  }
  assert.deepEqual(errors,[]);
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
});
