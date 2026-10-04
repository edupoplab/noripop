window.initAccountPanel = function({getProfile,setProfile,getSettings}) {
  const el=id=>document.getElementById(id), modal=el('passModal'), rules=AccountRules;
  let opened=false,opener=null,oldOverflow='',inertNodes=[],epoch=0;
  let events=[],offset=0,eventsBusy=false,eventsStarted=false,more=false,eventRequest=0;
  const pending=new Set();
  function msg(id,text,bad=false){el(id).textContent=text;el(id).className=text?'msg '+(bad?'bad':'ok'):'msg';}
  function render(){
    const p=getProfile();if(!p)return;
    const state=rules.status(p.plus_expires_at);el('pmStatus').textContent=state.title;el('pmExpiry').textContent=state.expiry;
    const lv=levelOf(p.points,getSettings().level_thresholds);
    el('pmLevel').textContent=`${lv.emoji||'🍿'} ${lv.name} · 활동 점수 ${p.points}점`;
    el('pmJoined').textContent=`가입일 ${rules.kstDate(p.created_at)}`;
  }
  function tab(name,focus=false){
    modal.querySelectorAll('[data-account-tab]').forEach(b=>{const on=b.dataset.accountTab===name;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
    ['info','pass','help'].forEach(n=>el('pmPanel-'+n).hidden=n!==name);
    modal.querySelector('.account-body').scrollTop=0;
    if(name==='pass'&&!eventsStarted)loadEvents();
  }
  function paintEvents(){
    el('pmEvents').innerHTML=events.length?events.map(ev=>`<div class="pass-row"><div><span>${esc(rules.labels[ev.kind]||'기타 이용기간 내역')}</span><span class="event-detail">${esc(rules.kstDate(ev.created_at))}${ev.note?' · '+esc(ev.note):''}</span></div><span class="pass-days ${Number(ev.days)<0?'negative':''}">${esc(rules.days(ev.days))}</span></div>`).join(''):'<p class="account-hint">아직 적립·조정 내역이 없습니다. 이용권을 등록하거나 놀이를 공유해 보세요.</p>';
    el('pmEventsMore').hidden=!more;el('pmEventsMore').disabled=eventsBusy;
  }
  async function loadEvents(reset=false){
    if(eventsBusy&&!reset)return;
    const stamp=epoch,request=++eventRequest;if(reset){events=[];offset=0;more=false;}
    eventsBusy=true;eventsStarted=true;el('pmEvents').setAttribute('aria-busy','true');
    el('pmEventsMore').disabled=true;el('pmEventsRetry').hidden=true;msg('pmEventsMsg','');
    if(!offset)el('pmEvents').innerHTML='<div class="account-loading" aria-label="내역 불러오는 중"></div>';
    try{
      const {data,error}=await sb.from('pass_events').select('id,kind,days,note,created_at').eq('user_id',getProfile().id).order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+5);
      if(stamp!==epoch||request!==eventRequest||!opened)return;if(error)throw error;
      more=data.length>5;const next=data.slice(0,5);events.push(...next.filter(n=>!events.some(e=>e.id===n.id)));offset+=next.length;paintEvents();
    }catch(e){if(stamp!==epoch||request!==eventRequest||!opened)return;if(!events.length)el('pmEvents').textContent='';msg('pmEventsMsg','이용 내역을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.',true);el('pmEventsRetry').hidden=false;}
    finally{if(stamp===epoch&&request===eventRequest){eventsBusy=false;el('pmEvents').setAttribute('aria-busy','false');el('pmEventsMore').disabled=false;}}
  }
  async function refresh(){
    const stamp=epoch;let verified=false;el('pmRefresh').disabled=true;
    ['pmNickSave','pmRedeem','reqSend'].forEach(id=>el(id).disabled=true);
    try{
      const p=await loadMyProfile(getProfile().id);
      if(stamp!==epoch||!opened)return;if(!p)throw Error('profile');setProfile(p);render();el('pmNick').value=p.nickname;
      const {data,error}=await sb.auth.getUser();if(stamp!==epoch||!opened)return;if(error||!data.user||data.user.id!==p.id)throw Error('session');
      el('pmEmail').textContent=data.user.email||'이메일 정보 없음';msg('pmRefreshMsg','');el('pmRefresh').hidden=true;verified=true;
    }catch(e){if(stamp===epoch&&opened){msg('pmRefreshMsg','최신 계정 정보를 불러오지 못했습니다. 아래 정보는 이전에 확인한 내용일 수 있습니다.',true);el('pmRefresh').hidden=false;}}
    finally{if(stamp===epoch){el('pmRefresh').disabled=false;[['pmNickSave','nick'],['pmRedeem','redeem'],['reqSend','request']].forEach(([id,key])=>el(id).disabled=!verified||pending.has(key));}}
  }
  function open(){
    if(!getProfile()||opened)return;
    opened=true;epoch++;opener=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    inertNodes=[...document.body.children].filter(n=>n!==modal&&!n.contains(modal)&&!['SCRIPT','STYLE','LINK'].includes(n.tagName)).map(n=>[n,n.inert]);inertNodes.forEach(([n])=>n.inert=true);
    modal.classList.add('open');events=[];offset=0;eventsBusy=false;eventsStarted=false;more=false;
    ['pmRefreshMsg','pmNickMsg','pmMsg','reqMsg','pmEventsMsg'].forEach(id=>msg(id,''));
    el('pmEmail').textContent='확인 중…';el('pmNick').value=getProfile().nickname;render();tab('info');el('pmClose').focus();refresh();
  }
  function close(){
    if(pending.size){msg('pmRefreshMsg','처리 중입니다. 완료된 뒤 닫아 주세요.');return;}
    opened=false;epoch++;modal.classList.remove('open');document.body.style.overflow=oldOverflow;inertNodes.forEach(([n,value])=>n.inert=value);inertNodes=[];if(opener?.isConnected)opener.focus();
  }
  async function run(name,button,output,action){
    if(pending.has(name))return;pending.add(name);el(button).disabled=true;
    try{await action();}catch(e){msg(output,e.message||'처리하지 못했습니다. 다시 시도해 주세요.',true);}
    finally{pending.delete(name);el(button).disabled=false;}
  }
  el('passBtn').addEventListener('click',open);el('pmClose').addEventListener('click',close);
  modal.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='Tab'){
      const nodes=[...modal.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(n=>n.getClientRects().length&&n.tabIndex>=0);
      const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  modal.querySelectorAll('[data-account-tab]').forEach((b,i)=>{
    b.addEventListener('click',()=>tab(b.dataset.accountTab));
    b.addEventListener('keydown',e=>{const names=['info','pass','help'];let n;if(e.key==='ArrowRight')n=(i+1)%3;if(e.key==='ArrowLeft')n=(i+2)%3;if(e.key==='Home')n=0;if(e.key==='End')n=2;if(n!==undefined){e.preventDefault();tab(names[n],true);}});
  });
  el('pmEventsMore').addEventListener('click',()=>loadEvents());el('pmEventsRetry').addEventListener('click',()=>loadEvents());el('pmRefresh').addEventListener('click',refresh);
  el('pmNickSave').addEventListener('click',()=>run('nick','pmNickSave','pmNickMsg',async()=>{
    const nick=el('pmNick').value.trim();if(!nick||nick.length>12)throw Error('닉네임은 1~12자로 입력해 주세요.');
    const {data,error}=await sb.from('profiles').update({nickname:nick}).eq('id',getProfile().id).select('id');
    if(error)throw Error(String(error.message).includes('duplicate')?'이미 사용 중인 닉네임입니다.':'닉네임을 변경하지 못했습니다. 다시 시도해 주세요.');
    if(!data?.length)throw Error('계정 권한을 확인하지 못했습니다. 다시 로그인해 주세요.');
    setProfile({...getProfile(),nickname:nick});msg('pmNickMsg','닉네임을 변경했습니다.');
  }));
  el('pmRedeem').addEventListener('click',()=>run('redeem','pmRedeem','pmMsg',async()=>{
    const code=el('pmCode').value.trim();if(!code)throw Error('이용권 코드를 입력해 주세요.');
    const {data:days,error}=await sb.rpc('redeem_code',{p_code:code});if(error)throw Error(error.message||'이용권을 등록하지 못했습니다.');
    el('pmCode').value='';msg('pmMsg',`${rules.days(days)}이 적립되었습니다.`);
    // Registration already succeeded; a subsequent read failure must not suggest redeeming again.
    await refresh();await loadEvents(true);
  }));
  el('reqSend').addEventListener('click',()=>run('request','reqSend','reqMsg',async()=>{
    const content=el('reqContent').value.trim();if(!content||content.length>2000)throw Error('제안을 1~2,000자로 입력해 주세요.');
    const {error}=await sb.from('requests').insert({user_id:getProfile().id,content});if(error)throw Error('제안을 보내지 못했습니다. 입력 내용은 유지됩니다.');
    el('reqContent').value='';msg('reqMsg','제안을 접수했습니다. 개선 검토에 참고하겠습니다.');
  }));
};
