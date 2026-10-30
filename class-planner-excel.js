/* XLSX stays in this browser; the same validation serves file upload and paste. */
const ROSTER_EXCEL_HEADERS=['기존 학년','기존 반','기존 번호','이름','성별','학습지표','유의 사항','전학 시기'];
let pendingRosterExcel=null;
function rosterExcelWorkbook(students,grade){
 const book=XLSX.utils.book_new();
 const rows=students.length?students.map(st=>[Number(st.oldGrade)||Number(grade),Number(String(st.oldClass).replace(/반$/,''))||1,Number(st.number)||1,st.name,st.gender,st.level??'',st.traits.join('; '),st.traits.includes('전학 예정')?(st.transferTiming==='before'?'편성 전':'편성 후'):'']):Array.from({length:30},(_,i)=>[Number(grade)||5,1,i+1,'','','','','']);
 const sheet=XLSX.utils.aoa_to_sheet([ROSTER_EXCEL_HEADERS,...rows]);
 sheet['!cols']=[{wch:12},{wch:12},{wch:12},{wch:18},{wch:10},{wch:14},{wch:45},{wch:16}];
 sheet['!autofilter']={ref:'A1:H'+(rows.length+1)};
 XLSX.utils.book_append_sheet(book,sheet,'명단');
 XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([
  ['명단 입력 안내'],['명단 시트의 제목 행을 유지하고 학생 한 명당 한 행을 입력하세요.'],
  ['기존 학년·반은 1~12, 번호는 1~1000, 성별은 남/여, 학습지표는 0 이상의 숫자입니다.'],
  ['유의 사항은 학교에서 쓰는 이름 그대로 입력하고, 여러 항목은 쉼표 또는 세미콜론으로 구분하세요.'],
  ['전학 예정인 학생은 유의 사항에 전학 예정을, 전학 시기에 편성 전 또는 편성 후를 입력하세요.'],
  ['이름이 빈 행은 업로드에서 제외합니다. 학생 행은 1000명까지 추가할 수 있습니다.'],
  ['등록한 학생이 있으면 현재 명단을 담아 내려받습니다. 업로드는 명단을 교체하며 적용 전에 확인할 수 있습니다.']
 ]),'입력안내');
 book.Sheets['입력안내']['!cols']=[{wch:110}];
 return book;
}
function rosterExcelIdentity(st){return [st.oldGrade,st.oldClass,st.number].join(':')}
function rosterExcelImportPlan(book,students,traits,grade,idFactory){
 const sheet=book.Sheets['명단']||book.Sheets[book.SheetNames[0]];
 if(!sheet||!sheet['!ref'])return {errors:['명단 시트가 비어 있습니다.']};
 const range=XLSX.utils.decode_range(sheet['!fullref']||sheet['!ref']);
 if(range.e.r>1000||range.e.c>50)return {errors:['학생은 1000명, 열은 51개 이내로 입력해 주세요.']};
 const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,blankrows:false});
 const header=matrix[0]||[],keys=header.map(bulkHeaderColumn),nameCol=keys.indexOf(3);
 if(nameCol<0||![0,1,2].every(key=>keys.includes(key)))return {errors:['기존 학년·반·번호·이름 제목이 있는 명단을 업로드해 주세요.']};
 const rows=matrix.slice(1).filter(row=>String(row[nameCol]||'').trim());
 if(!rows.length)return {errors:['이름을 입력한 학생이 없습니다.']};
 if(rows.some(row=>[0,1,2].some(key=>!String(row[keys.indexOf(key)]??'').trim())))return {errors:['이름이 있는 행의 기존 학년·반·번호를 모두 입력해 주세요.']};
 const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 const text=[header,...rows].map(row=>row.map(quote).join('\t')).join('\n');
 const source=rows.map(()=>newRosterStudent([],grade,idFactory())),ids=source.map(st=>st.id);
 const result=rosterExcelChanges(text,'oldGrade',ids,source);
 if(result.errors.length)return result;
 const existing=new Map(),ambiguous=new Set();
 for(const st of students){const key=rosterExcelIdentity(st);if(existing.has(key))ambiguous.add(key);existing.set(key,st)}
 const seen=new Set(),next=[];
 for(const change of result.changes){
  const st=change.next,key=rosterExcelIdentity(st);
  if(seen.has(key))return {errors:['기존 학년·반·번호가 중복된 학생이 있습니다: '+key]};
  seen.add(key);
  if(ambiguous.has(key))return {errors:['현재 명단에 기존 학년·반·번호가 중복되어 있습니다. 먼저 수정해 주세요: '+key]};
  const old=existing.get(key);
  next.push(old?{...old,...Object.fromEntries(Object.keys(change.present).map(k=>[k,st[k]]))}:st);
 }
 const newTraits=[...new Set(next.flatMap(st=>st.traits))].filter(tag=>!traits.includes(tag));
 if(traits.length+newTraits.length>64)return {errors:['유의 사항은 최대 64개까지 추가할 수 있습니다.']};
 const retained=new Set(next.map(st=>st.id));
 return {errors:[],students:next,newTraits,removed:students.filter(st=>!retained.has(st.id)).length};
}
function installRosterExcel(){
 $('downloadRosterTemplate').addEventListener('click',()=>{try{XLSX.writeFile(rosterExcelWorkbook(state.students,state.sourceGrade),'클라시트_반편성_명단.xlsx',{bookType:'xlsx',compression:true})}catch{toast('엑셀 양식을 만들지 못했습니다. 다시 시도해 주세요.')}});
 $('uploadRosterExcel').addEventListener('click',()=>$('rosterExcelFile').click());
 $('rosterExcelFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';pendingRosterExcel=null;if(!file)return;
  if(!/\.xlsx$/i.test(file.name)||file.size>5*1024*1024){toast('5MB 이하의 .xlsx 파일을 선택해 주세요.');return}
  try{
   const book=XLSX.read(await file.arrayBuffer(),{type:'array',sheetRows:1002,cellFormula:false,cellHTML:false,cellStyles:false});
   const plan=rosterExcelImportPlan(book,state.students,state.traits,state.sourceGrade,makeId);
   if(plan.errors.length){toast(plan.errors.slice(0,3).join(' / '));return}
   pendingRosterExcel={book,signature:JSON.stringify(state.students)};
   $('rosterExcelPreview').textContent=plan.students.length+'명 적용 · 기존 명단에서 제외 '+plan.removed+'명 · 새 유의 사항 '+plan.newTraits.length+'개'+(plan.newTraits.length?' ('+plan.newTraits.join(', ')+')':'');
   $('rosterExcelDialog').showModal();
  }catch{toast('엑셀 파일을 읽지 못했습니다. 양식의 명단 시트와 파일 형식을 확인해 주세요.')}
 });
 $('cancelRosterExcel').addEventListener('click',()=>$('rosterExcelDialog').close());
 $('rosterExcelDialog').addEventListener('close',()=>{pendingRosterExcel=null});
 $('applyRosterExcel').addEventListener('click',()=>{
  if(!pendingRosterExcel)return;
  if(pendingRosterExcel.signature!==JSON.stringify(state.students)){toast('명단이 변경되었습니다. 엑셀을 다시 업로드해 주세요.');$('rosterExcelDialog').close();return}
  const plan=rosterExcelImportPlan(pendingRosterExcel.book,state.students,state.traits,state.sourceGrade,makeId);
  if(plan.errors.length){toast(plan.errors[0]);return}
  rosterSaveUndo();state.students=plan.students;state.traits.push(...plan.newTraits);
  const ids=new Set(state.students.map(st=>st.id));
  state.pairs=state.pairs.filter(p=>ids.has(p.a)&&ids.has(p.b));
  state.baskets.forEach(b=>b.members=b.members.filter(id=>ids.has(id)));
  state.twinGroups=normalizeTwinGroups(state.twinGroups,ids);
  searchQuery='';$('searchStudent').value='';rosterSelection=null;rosterExtraCells.clear();
  syncSourceFromRoster();invalidate();changeState();$('rosterExcelDialog').close();toast(plan.students.length+'명과 유의 사항을 적용했습니다.');
 });
}
