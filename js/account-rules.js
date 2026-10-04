(function(root){
 const labels={founding:'오픈 멤버 가입 혜택',contribute:'공개 놀이 적립',editor_pick:'에디터 픽 적립',code:'이용권 코드',admin:'이용기간 조정'};
 function days(value){const n=Number(value);return Number.isFinite(n)?`${n>0?'+':''}${n}일`:'확인 필요';}
 function kstDate(value){return value?new Date(value).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'}):'-';}
 function status(expiry,now=new Date()){
   const today=now.toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
   if(!expiry)return {title:'무료 이용 중',expiry:'플러스 이용권을 등록하거나 놀이 공유로 이용기간을 적립할 수 있어요.'};
   return expiry>=today?{title:'플러스 이용 중',expiry:`${kstDate(expiry)}까지 이용 가능`}:{title:'무료 이용 중',expiry:`이전 플러스 이용기간: ${kstDate(expiry)} 종료`};
 }
 const api={labels,days,kstDate,status};if(typeof module==='object'&&module.exports)module.exports=api;else root.AccountRules=api;
})(typeof window==='object'?window:globalThis);
