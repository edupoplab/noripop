(function(root){
  function toKstInput(value){return value ? new Date(new Date(value).getTime()+9*3600000).toISOString().slice(0,16) : '';}
  function fromKstInput(value){if(!value)return null;const d=new Date(value+':00+09:00');if(!Number.isFinite(d.getTime()))throw Error('게시 날짜를 확인해 주세요.');return d.toISOString();}
  function payload(title,body,published,start,end){
    title=title.trim();body=body.trim();
    if(!title||!body)throw Error('제목과 내용을 입력해 주세요.');
    if(title.length>200||body.length>10000)throw Error('제목은 200자, 내용은 10,000자 이내로 입력해 주세요.');
    const starts_at=fromKstInput(start),ends_at=fromKstInput(end);
    if(starts_at&&ends_at&&ends_at<=starts_at)throw Error('종료 시각은 시작 시각보다 뒤여야 합니다.');
    return {title,body,is_published:published,starts_at,ends_at};
  }
  function status(n,now=Date.now()){
    if(n.deleted_at)return '휴지통';if(!n.is_published)return '숨김';
    if(n.ends_at&&Date.parse(n.ends_at)<=now)return '게시 종료';
    if(n.starts_at&&Date.parse(n.starts_at)>now)return '게시 예약';return '공개 중';
  }
  const api={toKstInput,fromKstInput,payload,status};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.NoticeRules=api;
})(typeof window==='object'?window:globalThis);
