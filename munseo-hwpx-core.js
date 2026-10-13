(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.MunseoHwpxCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
/**
 * Convert the existing validated 교사용 문서 model into semantic HTML for
 * the pinned HWPX OWPML writer. Never interpolate user text without escaping.
 * This runs entirely on-device; no server-side document conversion.
 */
function esc(input){
 return String(input??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function contentLines(input,max=4000){
 return String(input??'').slice(0,max).replace(/\r\n?/g,'\n').split('\n');
}
function paragraph(text){
 return contentLines(text).map(s=>'<p>'+esc(s||' ')+'</p>').join('\n');
}
function table(block){
 const rows=block.rows||[];
 return '<table><tbody>'+rows.map((cells,i)=>
  '<tr>'+cells.map(cell=>'<'+(i===0?'th':'td')+'>'+esc(cell)+'</'+(i===0?'th':'td')+'>').join('')+'</tr>'
 ).join('')+'</tbody></table>';
}
function list(text){
 const parts=contentLines(text).map(x=>x.trim()).filter(Boolean);
 if(!parts.length)return '<p> </p>';
 return '<ul>'+parts.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
}
function image(block){
 const uri=block.src||'';
 if(!/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(uri)||uri.length>3_000_000)return '';
 return '<p><img src="'+uri+'" alt="'+esc(block.caption||'수업 자료 사진')+'"/></p>'+
   (block.caption?'<p>'+esc(block.caption)+'</p>':'');
}
function toHtml(documentModel){
 if(!documentModel||!Array.isArray(documentModel.blocks))throw Error('문서가 올바르지 않아요.');
 let html='<!doctype html><html lang="ko"><head><meta charset="utf-8"/></head><body>';
 html+='<h1>'+esc(documentModel.title||'새 문서')+'</h1>';
 if(documentModel.subtitle)html+='<p>'+esc(documentModel.subtitle)+'</p>';
 for(const b of documentModel.blocks){
  if(b.type==='heading')html+='<h2>'+esc(b.text)+'</h2>';
  else if(b.type==='paragraph')html+=paragraph(b.text);
  else if(b.type==='list')html+=list(b.text);
  else if(b.type==='table')html+=table(b);
  else if(b.type==='image')html+=image(b);
  else if(b.type==='rule')html+='<hr/>';
 }
 return html+'</body></html>';
}
return{esc,toHtml};
});
