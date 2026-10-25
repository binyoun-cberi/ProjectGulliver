(()=>{'use strict';
const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el};
function cell(character,kind){
 const box=make('span','hanja-cell '+kind);box.append(make('span','hanja-glyph',character));
 box.setAttribute('aria-label',kind==='trace'?'따라 쓰기: '+character:kind==='empty'?'혼자 쓰는 칸':'본보기: '+character);return box;
}
function render(li,item,index){
 const t=item.tracing;li.className='hanja-practice '+(t.idiom?'idiom-practice':'character-practice');
 const content=make('section','hanja-content'),heading=make('h3','hanja-heading');heading.append(make('span','hanja-number',String(index+1)),document.createTextNode(item.prompt));content.append(heading);
 if(t.idiom){
  const model=make('div','idiom-model');for(const l of t.letters){const group=make('div','idiom-letter');group.append(cell(l.character,'model'),make('small','hanja-label',`${l.meaning} ${l.sound}`));model.append(group)}content.append(model);
  content.append(make('p','idiom-definition',t.definition),make('p','idiom-example','예문 · '+t.example));
 }else{const model=make('div','character-model');model.append(cell(t.character,'model'));content.append(model)}
 const practice=make('div','hanja-writing');
 if(t.idiom){
  for(let row=0;row<3;row++){const line=make('div','idiom-writing-row');for(const ch of Array.from(t.characters))line.append(cell(row<2&&!t.blank?ch:'',row<2&&!t.blank?'trace':'empty'));practice.append(line)}
 }else{const line=make('div','character-writing-row');for(let i=0;i<5;i++)line.append(cell(i<3&&!t.blank?t.character:'',i<3&&!t.blank?'trace':'empty'));practice.append(line)}
 li.append(content,practice);
 // Practice models remain visible on both student and teacher copies.
}
window.WorksheetHanjaUI={render};
})();
