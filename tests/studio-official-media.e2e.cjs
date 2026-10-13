'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const port=8775;
const base='http://127.0.0.1:'+port+'/';
const apps=[['영상 뚝딱.html','filmcraft','FilmCraft'],['음악 뚝딱.html','soundcraft','SoundCraft']];
async function ready(){
 for(let i=0;i<80;i++){try{if((await fetch(base+'studio-official-media.js')).ok)return}catch(e){}
  await new Promise(done=>setTimeout(done,180));
 }throw Error('Unable to serve media studio');
}
test('Chrome: original FilmCraft and SoundCraft distributions open from local studio pages',{timeout:125000},async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{stdio:'ignore'});
 let browser;
 try{
  await ready();
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  for(const [filename,folder,name] of apps){
   const page=await browser.newPage();
   page.setDefaultTimeout(28000);
   await page.goto(base+encodeURIComponent(filename),{waitUntil:'domcontentloaded'});
   await page.locator('#officialMode').waitFor();
   await page.waitForFunction(()=>document.getElementById('officialMode').disabled===false);
   const title=await page.locator('#officialMode').textContent();
   assert.ok(title.includes(name),title);
   await page.locator('#officialMode[aria-selected="true"]').waitFor();
   assert.equal(await page.locator('#simpleEditor').isHidden(),true);
   assert.equal(await page.locator('#officialEditorPanel').isVisible(),true);
   const inner=page.frameLocator('#officialEditorFrame');
   await inner.locator('canvas').first().waitFor({timeout:25000});
   const target=await page.locator('#officialEditorFrame').getAttribute('src');
   assert.equal(target,'assets/artcraft/'+folder+'/index.html');
   const scriptResp=await page.request.get(base+'assets/artcraft/'+folder+'/index.html');
   assert.equal(scriptResp.status(),200);
   assert.ok((await scriptResp.text()).includes('<canvas'));
   await page.locator('#simpleMode').click();
   assert.equal(await page.locator('#simpleEditor').isVisible(),true);
   assert.equal(await page.locator('#officialEditorPanel').isHidden(),true);
   await page.close();
  }
 }finally{await browser?.close();server.kill('SIGTERM')}
});
