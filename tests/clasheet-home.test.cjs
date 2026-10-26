'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{spawn}=require('child_process'),{pathToFileURL}=require('url');
let chromium;try{({chromium}=require('playwright-core'))}catch{}
const chrome=chromium&&[process.env.CHROME_BIN,chromium.executablePath(),'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(p=>p&&fs.existsSync(p));
const output=process.env.HOME_QA_DIR||'test-artifacts/clasheet-home';
async function fonts(page){if(!process.env.WORKSHEET_FONT_CSS)return;const source=process.env.WORKSHEET_FONT_CSS,css=fs.readFileSync(source,'utf8').replace(/url\(([^)]+)\)/g,(_,name)=>'url("'+'data:font/woff2;base64,'+fs.readFileSync(path.resolve(path.dirname(source),name.replace(/["']/g,''))).toString('base64')+'")');await page.addStyleTag({content:css+'\nbody,body *{font-family:"Noto Sans KR",sans-serif!important}'});await page.evaluate(()=>document.fonts.ready);}
test('home exposes current materials, search, favorites, saved activities and usable desktop/mobile navigation',{skip:!chrome,timeout:120000},async()=>{
 const server=spawn('python3',['-m','http.server','8998','--bind','127.0.0.1'],{stdio:'ignore'});let browser;
 try{
  for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:8998/index.html')).ok)break}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']});
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8998/index.html');await fonts(page);
  assert.equal(await page.locator('.format-tile').count(),6);assert.equal(await page.locator('.home-dictation-link').count(),2);assert.equal(await page.locator('.home-tool-list .tool-row').count(),4);
  assert.equal(await page.locator('.home-tool-list a[href="시간 도구.html"]').count(),1);
  const subjectLinks=await page.locator('.format-tile').evaluateAll(links=>links.map(a=>a.getAttribute('href')));for(const href of subjectLinks){assert.ok(fs.existsSync(href.split('?')[0]));assert.ok(new URL(href,'https://example.test').searchParams.get('subject'));}
  const ordering=await page.evaluate(()=>({materials:document.querySelector('.home-materials').getBoundingClientRect().top,intro:document.querySelector('.first-start').getBoundingClientRect().top}));assert.ok(ordering.materials<ordering.intro);
  fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'home-desktop.png'),fullPage:true});
  await page.locator('#search').fill('한자');assert.equal(await page.locator('.home-search-materials a').count(),1);assert.match(await page.locator('.home-search-materials').textContent(),/한자·사자성어/);
  await page.locator('#search').fill('받아쓰기');assert.equal(await page.locator('.home-search-materials a').count(),2);
  await page.locator('#search').fill('타이머');assert.ok(await page.locator('.tool-row').count());assert.match(await page.locator('#homeSearchStatus').textContent(),/^[1-9]\d*개 검색 결과$/);
  await page.locator('#search').fill('없는검색어123');assert.match(await page.locator('.empty').textContent(),/검색 결과가 없어요/);assert.equal(await page.locator('#homeSearchStatus').textContent(),'0개 검색 결과');
  await page.locator('#search').fill('');await page.locator('.home-tool-list .star').first().click();assert.equal(await page.locator('.home-favorites .tool-row').count(),1);assert.equal(await page.locator('.home-tool-list .star').first().getAttribute('aria-pressed'),'true');await page.reload();assert.equal(await page.locator('.home-favorites .tool-row').count(),1);
  // Exercise the actual persistent activity model used by all three editor kinds.
  await page.evaluate(()=>{ClassroomWorkspace.save({kind:'quiz',title:'다음 수업 <안전>',payload:{cards:[{front:'나무',back:'tree'}]}});Gulliver.trackTool(ClassroomTools.find(t=>t.href==='시간 도구.html'));});await page.reload();await fonts(page);
  assert.equal(await page.locator('.activity-card h3').textContent(),'다음 수업 <안전>');assert.equal(await page.locator('.activity-card h3 안전').count(),0);assert.equal(await page.locator('.home-recent-tools a').count(),1);
  await page.locator('#search').fill('다음 수업');assert.equal(await page.locator('.activity-card').count(),1);await page.locator('#search').fill('');
  await page.locator('button[data-view=activities]').filter({hasText:'저장한 활동 모두 보기'}).click();assert.match(page.url(),/view=activities/);assert.equal(await page.locator('.activity-card').count(),1);
  await page.locator('.gx-nav > a[href="index.html"]').click();await page.locator('.format-tile[href*="subject=hanja"]').click();assert.equal(await page.locator('input[name=subject][value=hanja]').isChecked(),true);await page.goBack();await page.locator('.home-dictation-link[href*="subject=english"]').click();assert.equal(new URL(page.url()).searchParams.get('subject'),'english');await page.goBack();
  await fonts(page);for(const width of [320,768,1024,1920]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow at '+width);}
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.locator('.format-tile').count(),6);await page.screenshot({path:path.join(output,'home-mobile.png'),fullPage:true});
  await page.locator('#menuButton').click();await page.locator('.sidebar button[data-view=tools]').click();assert.ok(await page.locator('.tool-row').count()>10);assert.equal(await page.locator('.gx-nav > a[href="index.html?view=tools"]').getAttribute('aria-current'),'page');
  await page.locator('#search').fill('존재하지않는도구123');assert.match(await page.locator('.empty').textContent(),/검색 결과가 없어요/);assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill('SIGTERM');}
});
