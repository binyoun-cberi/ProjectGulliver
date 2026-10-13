/**
 * Client-only HWPX export.
 * The MIT-licensed @ssabrojs/hwpxjs 0.4.0 browser bundle is vendor-hosted
 * in ProjectGulliver. No document contents are sent to an external service.
 */
import { htmlToHwpx } from './vendor/hwpxjs/hwpxjs.browser.mjs';

export async function makeHwpx(rawDocument){
 const core=globalThis.MunseoCore;
 const writer=globalThis.MunseoHwpxCore;
 if(!core||!writer)throw Error('문서 변환 모듈을 불러오지 못했어요.');
 const doc=core.validate(rawDocument);
 const html=writer.toHtml(doc);
 const data=await htmlToHwpx(html,{title:doc.title,creator:'뚝딱교실'});
 if(!(data instanceof Uint8Array)||data.byteLength<350){
  throw new Error('한글 문서 파일을 생성하지 못했어요.');
 }
 return data;
}
