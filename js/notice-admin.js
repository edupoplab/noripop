// Admin-only UI. Database RLS enforces authorization independently.
window.NoticeAdmin = (() => {
  const el=id=>document.getElementById(id), rules=NoticeRules;
  let rows=[], editing=null, busy=false, page=0, generation=0;
  const size=10;
  function message(text,bad=false){el('ntMsg').className='msg '+(bad?'bad':'ok');el('ntMsg').textContent=text;}
  function lock(value){busy=value;el('tab-notice').querySelectorAll('button,input,textarea,select').forEach(e=>e.disabled=value);}
  function reset(){editing=null;el('ntForm').reset();el('ntHeading').textContent='공지 작성';el('ntSave').textContent='공지 올리기';el('ntCancel').hidden=true;}
  function period(n){return `${n.starts_at?rules.toKstInput(n.starts_at).replace('T',' '):'즉시'} ~ ${n.ends_at?rules.toKstInput(n.ends_at).replace('T',' '):'종료 없음'} (한국시간)`;}
  async function load(){
    const seq=++generation,list=el('ntList');
    list.setAttribute('aria-busy','true');list.textContent='공지를 불러오는 중입니다…';
    try{
      let query=sb.from('announcements').select('*',{count:'exact'}).order('created_at',{ascending:false}).order('id',{ascending:false});
      query=el('ntView').value==='trash'?query.not('deleted_at','is',null):query.is('deleted_at',null);
      const {data,error,count}=await query.range(page*size,page*size+size-1);
      if(seq!==generation)return;
      if(error)throw error;
      if(!data.length&&page>0){page--;return load();}
      rows=data;
      list.innerHTML=data.map(n=>`<article class="item"><div class="item-info">
        <div class="item-title">${esc(n.title)}</div><div class="item-meta">${rules.status(n)} · ${esc(period(n))}</div>
        <div class="notice-body">${esc(n.body)}</div>
        <div class="row-btns" style="margin-top:12px">${n.deleted_at
          ?`<button class="btn btn-ghost mini" data-action="restore" data-id="${n.id}">복원 (숨김)</button>`
          :`<button class="btn btn-ghost mini" data-action="edit" data-id="${n.id}">수정</button>
            <button class="btn btn-ghost mini" data-action="toggle" data-id="${n.id}">${n.is_published?'숨기기':'공개로 설정'}</button>
            <button class="btn btn-ghost mini" data-action="trash" data-id="${n.id}">삭제 · 휴지통</button>`}</div>
      </div></article>`).join('')||'<p class="empty">표시할 공지가 없습니다.</p>';
      el('ntPage').textContent=`${page+1}페이지 · 총 ${count||0}개`;
      el('ntPrev').disabled=busy||page===0;el('ntNext').disabled=busy||(page+1)*size>=(count||0);
    }catch(e){if(seq===generation){list.textContent='공지를 불러오지 못했습니다. 새로고침 버튼으로 다시 시도해 주세요.';message('공지 조회에 실패했습니다. 연결 상태와 관리자 권한을 확인해 주세요.',true);}}
    finally{if(seq===generation)list.setAttribute('aria-busy','false');}
  }
  async function update(n,values){
    const {data,error}=await sb.from('announcements').update(values).eq('id',n.id).eq('updated_at',n.updated_at).select('id');
    if(error)throw error;
    if(!data||data.length!==1)throw Error('다른 창에서 변경된 공지입니다. 목록을 새로고침한 뒤 다시 수정해 주세요.');
  }
  async function save(event){
    event.preventDefault();if(busy)return;
    let values;
    try{values=rules.payload(el('ntTitle').value,el('ntBody').value,el('ntPublished').checked,el('ntStart').value,el('ntEnd').value);}
    catch(e){message(e.message,true);return;}
    lock(true);
    try{
      if(editing)await update(editing,values);
      else {const {error}=await sb.from('announcements').insert(values);if(error)throw error;}
      reset();page=0;message('저장했습니다. 공개 설정과 게시 기간에 따라 홈페이지에 표시됩니다.');
    }catch(e){message(e.message||'저장하지 못했습니다. 입력 내용은 유지됩니다.',true);}
    finally{lock(false);await load();}
  }
  async function action(event){
    const button=event.target.closest('button[data-action]');if(!button||busy)return;
    const n=rows.find(x=>String(x.id)===button.dataset.id);if(!n)return;
    const act=button.dataset.action;
    if(act==='edit'){
      if(editing&&!confirm('현재 편집 중인 내용을 버리고 다른 공지를 열까요?'))return;
      editing=n;el('ntTitle').value=n.title;el('ntBody').value=n.body;el('ntPublished').checked=n.is_published;
      el('ntStart').value=rules.toKstInput(n.starts_at);el('ntEnd').value=rules.toKstInput(n.ends_at);
      el('ntHeading').textContent='공지 수정';el('ntSave').textContent='수정 저장';el('ntCancel').hidden=false;el('ntTitle').focus();return;
    }
    if(act==='trash'&&!confirm(`“${n.title}” 공지를 휴지통으로 이동할까요? 홈페이지에서 내려가며 나중에 복원할 수 있습니다.`))return;
    lock(true);
    try{
      await update(n,act==='trash'?{deleted_at:new Date().toISOString(),is_published:false}:act==='restore'?{deleted_at:null,is_published:false}:{is_published:!n.is_published});
      if(editing&&editing.id===n.id)reset();
      message(act==='restore'?'숨김 상태로 복원했습니다. 기간을 확인한 뒤 공개해 주세요.':act==='trash'?'휴지통으로 이동했습니다.':'공개 설정을 변경했습니다.');
    }catch(e){message(e.message||'변경하지 못했습니다. 다시 시도해 주세요.',true);}
    finally{lock(false);await load();}
  }
  el('ntForm').addEventListener('submit',save);
  el('ntCancel').addEventListener('click',()=>{if(confirm('수정을 취소할까요? 저장하지 않은 변경은 사라집니다.'))reset();});
  el('ntList').addEventListener('click',action);
  el('ntView').addEventListener('change',()=>{page=0;load();});
  el('ntRefresh').addEventListener('click',load);
  el('ntPrev').addEventListener('click',()=>{if(page>0){page--;load();}});
  el('ntNext').addEventListener('click',()=>{page++;load();});
  return {load};
})();
