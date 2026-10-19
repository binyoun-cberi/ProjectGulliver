'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {spawn} = require('node:child_process');
let chromium;
try {({chromium} = require('playwright-core'));} catch {}

const tools = [
  '자리 배정 프로그램.html', '버스 좌석 배치 프로그램.html',
  '행운의 모둠 메이커.html', '학급 배정 도우미.html',
  '학급췍.html', '우리반 선관위.html', '칭찬 온도계.html'
];
const kinds = ['seating','bus','groups','roles','check','vote','praise'];
const base = 'http://127.0.0.1:8958/';
const browserInstalled = Boolean(chromium && (fs.existsSync(chromium.executablePath()) || ['/opt/google/chrome/chrome','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].some(fs.existsSync)));

test('6.2 seven classroom tools opt in without changing persistent keys or embedded canvas adapters', () => {
  for (const [i, file] of tools.entries()) {
    const html = fs.readFileSync(file,'utf8');
    assert.match(html,/gulliver-teacher-v62\.css/,file);
    assert.match(html,/gulliver-teacher-v62\.js/,file);
    assert.match(html,/gulliver-teacher-display\.js/,file);
    assert.match(html,/GulliverTeacherClassroomFlow\.mount/,file);
    assert.match(html,new RegExp(`kind:['"]${kinds[i]}['"]`),file);
    for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
      if(match[1].trim()) new vm.Script(match[1],{filename:file});
    }
  }
  const keys = {
    '버스 좌석 배치 프로그램.html': 'gulliver.busSeating.v3',
    '행운의 모둠 메이커.html': 'gulliver.groupMaker.v4',
    '학급 배정 도우미.html': 'gulliver.classRoles.v4',
    '학급췍.html': 'classChecklistState',
    '우리반 선관위.html': 'vote_board_v2',
    '칭찬 온도계.html': 'classDashboardStateV2'
  };
  for (const [file,key] of Object.entries(keys)) assert.ok(fs.readFileSync(file,'utf8').includes(key),`${file}: legacy key changed`);
  for (const file of tools.slice(0,5)) assert.match(fs.readFileSync(file,'utf8'),/GulliverTeacherLiveSnapshot/,file);
  const viewer = fs.readFileSync('gulliver-teacher-display-view.js','utf8');
  for (const kind of kinds) assert.match(viewer,new RegExp(`kind === ['"]${kind}['"]`));
  assert.doesNotMatch(viewer,/\b(localStorage|sessionStorage|teacherToken|fixedSeats|avoidPairs|excluded|studentNames|votedStudentIds)\b/);
  assert.match(fs.readFileSync('gulliver-teacher-v62.css','utf8'),/gulliver-studio-embed/);
});

test('6.2 classroom UI controller keeps teacher settings visible until result mode and honours embedded canvas', () => {
  const elements = [];
  function element() {
    const attributes = {}, listeners = {};
    return {
      attributes, listeners, children: [], dataset: {}, className:'', textContent:'',
      append(...nodes){this.children.push(...nodes);},
      prepend(node){this.children.unshift(node);},
      setAttribute(k,v){attributes[k]=v;},
      addEventListener(k,fn){listeners[k]=fn;}
    };
  }
  const classes = new Set();
  const context = {window:{addEventListener(){},GulliverTeacherDisplay:{supported:()=>true,connected:()=>false,open(){}}},document:{
    querySelector(){return null;},createElement(){const node=element();elements.push(node);return node;},
    body:{classList:{toggle(k,value){if(value)classes.add(k);else classes.delete(k);},contains(k){return classes.has(k);}}}
  },TypeError};
  vm.runInNewContext(fs.readFileSync('gulliver-teacher-v62.js','utf8'),context);
  const container=element();
  const flow=context.window.GulliverTeacherClassroomFlow.mount({container,title:'학급 운영'});
  assert.equal(flow.getStep(),'prepare');
  assert.equal(classes.has('gt-v62-result'),false);
  assert.equal(flow.setStep('result'),true);
  assert.equal(classes.has('gt-v62-result'),true);
  assert.equal(flow.setStep('prepare'),true);
  assert.equal(classes.has('gt-v62-result'),false);
  assert.equal(container.children.length,1);
});

test('6.2 projection restricts student popup to public results, including when external CDNs fail',{
  timeout:180000,
  skip:!browserInstalled && 'Chrome/Chromium is not installed here'
},async()=>{
  const server=spawn('python3',['-m','http.server','8958','--bind','127.0.0.1'],{stdio:'ignore'});
  let browser;
  try {
    let ready=false;
    for(let i=0;i<60;i++){
      try {if((await fetch(base+'gulliver-teacher-v62.js')).ok){ready=true;break;}} catch {}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert.ok(ready,'test server not ready');
    browser=await chromium.launch({...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
    const context=await browser.newContext({viewport:{width:1366,height:900}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    const page=await context.newPage();
    page.setDefaultTimeout(15000);
    async function openStudent(file) {
      await page.goto(base+encodeURIComponent(file));
      await page.locator('.gt-v62-flow').waitFor({state:'visible'});
      const popupEvent=page.waitForEvent('popup');
      await page.locator('.gt-v62-student').click();
      const popup=await popupEvent;
      await popup.locator('#displayConnection[data-state="connected"]').waitFor();
      assert.equal(await popup.locator('.gt-shell,.gt-v62-flow,.settings').count(),0);
      return popup;
    }
    let popup=await openStudent(tools[1]);
    await popup.getByText('버스 자리표를 준비하고 있어요').waitFor();
    await page.locator('#sampleBtn').click();
    await page.locator('#generateBtn').click();
    await popup.getByText('우리 반 버스 자리표').waitFor();
    assert.doesNotMatch(await popup.locator('body').innerText(),/추가로 떨어뜨리기|같이 앉히기|자리 고정|앞자리 우선/);
    await page.locator('.gt-v62-actions button').nth(1).click();
    assert.equal(await page.locator('.settings').isVisible(),false);
    await popup.close();

    popup=await openStudent(tools[2]);
    await page.locator('#sampleBtn').click();
    await page.locator('#startBtn').click();
    await page.locator('#revealAllBtn').click();
    await popup.getByText('우리 반 모둠').waitFor();
    assert.doesNotMatch(await popup.locator('body').innerText(),/같은 모둠 피하기|특정 모둠 고정|교사 조건/);
    await popup.close();

    popup=await openStudent(tools[3]);
    await page.locator('[data-tab="students"]').click();
    await page.locator('#studentNames').fill('검수첫째, 검수둘째');
    await page.locator('#addStudentsBtn').click();
    await page.locator('[data-tab="results"]').click();
    await page.locator('#runBtn').click();
    await popup.getByText('우리 반 1인 1역').waitFor();
    assert.doesNotMatch(await popup.locator('body').innerText(),/1지망|2지망|필수 역할|제외 역할/);
    await popup.close();

    popup=await openStudent(tools[4]);
    await popup.getByText('학생별 상태는 선생님만 확인해요.').waitFor();
    assert.doesNotMatch(await popup.locator('body').innerText(),/학급 학생 명단|미제출 학생|전체 초기화/);
    await popup.close();

    popup=await openStudent(tools[5]);
    await popup.getByText('오늘 어떤 간식을 먹을까요?',{exact:false}).first().waitFor();
    assert.doesNotMatch(await popup.locator('body').innerText(),/참여 코드|온라인 시작|학생별 선택|참여 링크/);
    await popup.close();

    popup=await openStudent(tools[6]);
    await popup.getByText('우리 반 칭찬 온도계').waitFor();
    assert.doesNotMatch(await popup.locator('body').innerText(),/차감 이유|숙제를 하지 않음|점수를 받을 학생|칭찬\/차감 누가기록/);
    await popup.close();

    await page.setViewportSize({width:390,height:844});
    await page.goto(base+encodeURIComponent(tools[1]));
    assert.equal(await page.locator('.gt-v62-flow').isVisible(),true);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'6.2 bar causes horizontal overflow');
  } finally {await browser?.close();server.kill('SIGTERM');}
});
