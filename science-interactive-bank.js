(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ScienceInteractiveBank=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Opt-in inquiry questions for the existing worksheet bank. This is a visual,
// deterministic teaching model, not a sensor measurement or a virtual lab claim.
const LABS=Object.freeze({
 gas:Object.freeze({id:'gas',title:'기체의 부피와 압력',topic:'matter',minGrade:5,values:[24,16,12,8],unit:'mL',prompt:'QR 실험에서 기체의 온도와 입자 수를 일정하게 두고 부피를 바꾸어 보세요. 부피가 줄어들면 압력은 어떻게 변하나요? 기록한 수치를 근거로 설명하세요.',detail:'먼저 예측을 적고, QR을 스캔하여 서로 다른 부피 3개를 기록하세요. 이 실험은 일정한 온도의 기체를 나타낸 이상 기체 모형입니다.',answer:'부피가 줄어들면 압력이 커진다.',modelExplanation:'24 mL에서 1.0기압, 12 mL에서 2.0기압, 8 mL에서 3.0기압입니다. 온도와 입자 수가 일정할 때 기체의 압력은 부피에 반비례합니다.'}),
 temperature:Object.freeze({id:'temperature',title:'온도와 입자의 운동',topic:'heat',minGrade:5,values:[10,30,50,70,90],unit:'°C',prompt:'QR 실험에서 물의 온도를 바꾸며 입자 운동 모형을 관찰하세요. 물의 온도가 높아질수록 입자의 운동은 어떻게 달라지나요? 세 번의 관찰 결과를 비교하여 설명하세요.',detail:'서로 다른 온도 3개를 기록하세요. 입자 움직임은 개념 이해를 위한 단순화된 모형입니다.',answer:'온도가 높아질수록 입자가 평균적으로 더 빠르게 움직인다.',modelExplanation:'물의 온도가 높을수록 입자의 평균 운동 에너지가 커집니다. 화면은 그 경향을 나타내는 모형이며 개별 입자의 실제 움직임을 측정한 것은 아닙니다.'}),
 reflection:Object.freeze({id:'reflection',title:'빛의 반사',topic:'light-sound',minGrade:5,values:[15,30,45,60,75],unit:'°',prompt:'QR 실험에서 거울에 비추는 빛의 각도를 세 번 바꾸어 보세요. 법선을 기준으로 잰 입사각과 반사각에는 어떤 관계가 있나요? 측정값을 근거로 설명하세요.',detail:'입사각과 반사각은 거울 면이 아니라 법선(거울 면에 수직인 선)을 기준으로 잽니다.',answer:'입사각과 반사각은 같다.',modelExplanation:'평면거울에서 법선을 기준으로 측정한 입사각과 반사각은 같습니다. 예를 들어 입사각이 30°라면 반사각도 30°입니다.'})
});
function pressureAt(volume){if(!Number.isFinite(volume)||volume<=0)throw Error('부피는 양수여야 합니다.');return 24/volume;}
function particleSpeed(tempC){if(!Number.isFinite(tempC)||tempC< -273.15)throw Error('유효한 온도를 입력하세요.');return Math.sqrt((tempC+273.15)/293.15);}
function reflectionAt(incidence){if(!Number.isFinite(incidence)||incidence<0||incidence>90)throw Error('각도는 0~90° 사이여야 합니다.');return incidence;}
function valueFor(id,value){switch(id){case 'gas':return pressureAt(value);case 'temperature':return particleSpeed(value);case 'reflection':return reflectionAt(value);default:throw Error('실험 종류를 확인하세요.');}}
function record(values,id,value){const lab=LABS[id],number=Number(value);if(!lab||!lab.values.includes(number))throw Error('실험 조건을 확인하세요.');const prior=Array.isArray(values)?values:[];if(prior.includes(number))return prior.slice();if(prior.length>=3)return prior.slice();return [...prior,number];}
function eligible(sheet){if(!sheet||sheet.subject!=='science'||!Array.isArray(sheet.items))return [];return Object.values(LABS).filter(lab=>sheet.grade>=lab.minGrade&&sheet.items.some(item=>(item.sourceTopic||sheet.topic)===lab.topic));}
function enrich(sheet){if(!sheet||sheet.subject!=='science'||!Array.isArray(sheet.items))return sheet;if(sheet.interactiveScience)return sheet;
 const labs=eligible(sheet),items=sheet.items.slice(),applied=[];
 for(const lab of labs){const index=items.findIndex(item=>(item.sourceTopic||sheet.topic)===lab.topic&&!item.interactiveExperiment);if(index<0)continue;
  const previous=items[index],seed=Number(sheet.seed)>>>0;items[index]={prompt:lab.prompt,detail:lab.detail,answer:lab.answer,choices:[],format:'essay',modelExplanation:lab.modelExplanation,scienceGoal:'interactive-'+lab.id,scienceFamily:'inquiry',scienceSource:'interactive-'+lab.id,sourceTopic:previous.sourceTopic||sheet.topic,...(previous.sourceUnit?{sourceUnit:previous.sourceUnit}:{}),interactiveExperiment:{id:lab.id,seed}};applied.push(lab.id);
 }
 return applied.length?{...sheet,items,interactiveScience:applied}:sheet;
}
function linkFor(pageUrl,id,seed){if(!LABS[id])throw Error('실험 종류를 확인하세요.');const url=new URL('과학 탐구 실험.html',pageUrl);url.search=new URLSearchParams({lab:id,seed:String(Number(seed)>>>0)}).toString();return url.href;}
return {LABS,eligible,enrich,linkFor,pressureAt,particleSpeed,reflectionAt,valueFor,record};
});
