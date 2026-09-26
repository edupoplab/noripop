/* Web-only child setting guard. Account passwords and sessions are never persisted. */
window.TeacherWeb = (() => {
  const KEY = 'popWebTeacherV1';
  const read = () => JSON.parse(localStorage.getItem(KEY) || 'null');
  const save = value => localStorage.setItem(KEY, JSON.stringify(value));
  const bytes = text => new TextEncoder().encode(text);
  async function digest(pin, salt) {
    const key = await crypto.subtle.importKey('raw', bytes(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt:bytes(salt),iterations:210000,hash:'SHA-256'}, key, 256);
    return Array.from(new Uint8Array(bits), n => n.toString(16).padStart(2,'0')).join('');
  }
  function sheet(title, body, action) {
    return new Promise(resolve => {
      const d = document.createElement('dialog'); d.className='teacher-sheet';
      d.innerHTML='<form><h2></h2>'+body+'<p class="teacher-error" role="alert"></p><button type="submit">확인</button><button type="button" data-cancel>닫기</button></form>';
      d.querySelector('h2').textContent=title;
      let busy=false;
      d.querySelector('[data-cancel]').onclick=()=>{if(!busy)d.close();};
      d.oncancel=e=>{if(busy)e.preventDefault();};
      d.onclose=()=>{d.remove();resolve(false);};
      d.querySelector('form').onsubmit=async e=>{
        e.preventDefault(); if(busy)return; busy=true;
        const buttons=d.querySelectorAll('button'); buttons.forEach(b=>b.disabled=true);
        try { const result=await action(d); if(result!==false){resolve(result);d.close();} }
        catch(err){d.querySelector('.teacher-error').textContent=err.message || '다시 시도해 주세요.';}
        finally {busy=false;buttons.forEach(b=>b.disabled=false);}
      };
      document.body.append(d);d.showModal();
    });
  }
  async function verifyOwner(boundToken) {
    if(!boundToken) throw Error('먼저 우리 반을 연결해 주세요.');
    return sheet('반을 만든 선생님 확인', '<p>이 반을 만든 놀이팝 계정으로 확인해 주세요. 비밀번호는 이 기기에 저장하지 않아요.</p><label>교사 계정 이메일<input name="email" type="email" autocomplete="off" required></label><label>놀이팝 로그인 비밀번호<input name="password" type="password" autocomplete="off" required></label>', async d=>{
      const client=window.supabase.createClient(POP_CONFIG.SUPABASE_URL,POP_CONFIG.SUPABASE_ANON_KEY,{
        auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'pop-recovery-transient'},
        global:{fetch:async (url,options)=>{
          const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
          try{return await fetch(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
        }}});
      try {
        const password=d.querySelector('[name=password]').value;
        d.querySelector('[name=password]').value='';
        const {data,error}=await client.auth.signInWithPassword({email:d.querySelector('[name=email]').value.trim(),password});
        if(error||!data.user) throw Error('이메일과 비밀번호를 확인해 주세요.');
        const result=await client.from('classes').select('id').eq('tablet_token',boundToken).eq('owner_id',data.user.id).limit(1);
        if(result.error||!result.data?.length) throw Error('이 반을 만든 교사 계정으로 확인해 주세요.');
        return true;
      } finally {try {await client.auth.signOut({scope:'local'});}catch {}}
    });
  }
  async function setPin(boundToken) {
    return sheet('교사 PIN 설정','<p>이 웹앱에서 사용할 숫자 4~8자리를 정해 주세요. 반 연결 번호나 APK의 PIN과는 별개예요. 잊으면 이 반의 교사 계정으로 복구할 수 있어요.</p><label>새 PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required></label><label>새 PIN 다시 입력<input name="repeat" type="password" inputmode="numeric" minlength="4" maxlength="8" required></label>',async d=>{
      const pin=d.querySelector('[name=pin]').value;
      if(!/^\d{4,8}$/.test(pin)||pin!==d.querySelector('[name=repeat]').value) throw Error('같은 숫자 4~8자리를 두 번 입력해 주세요.');
      const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
      save({salt,hash:await digest(pin,salt),boundToken,failures:0,until:0});return true;
    });
  }
  async function unlock() {
    const saved=read();
    if(!saved){const bound=localStorage.getItem('popTabletToken'); if(await verifyOwner(bound))return setPin(bound);return false;}
    const ok=await sheet('교사 PIN 입력','<label>숫자 4~8자리<input name="pin" type="password" inputmode="numeric" maxlength="8" required></label><button type="button" data-recover>PIN을 잊었나요?</button>',async d=>{
      const current=read();
      if(Date.now()<current.until)throw Error('입력을 여러 번 틀렸어요. 1분 후 다시 시도해 주세요.');
      if(await digest(d.querySelector('[name=pin]').value,current.salt)!==current.hash){current.failures=(current.failures||0)+1;if(current.failures>=5){current.until=Date.now()+60000;current.failures=0;}save(current);throw Error('PIN이 맞지 않아요.');}
      save({...current,failures:0,until:0});return true;
    // Recovery deliberately closes the PIN prompt before opening account verification.
    });
    return ok;
  }
  document.addEventListener('click',async e=>{
    if(!e.target.matches('[data-recover]'))return;
    const d=e.target.closest('dialog');d.close();
    try{const saved=read();if(saved&&await verifyOwner(saved.boundToken)){if(await setPin(saved.boundToken))alert('새 PIN을 저장했어요. 교사 설정을 다시 열어 주세요.');}}catch(err){alert(err.message);}
  });
  async function menu() {
    try{
      if(!await unlock())return;
      await sheet('교사 설정','<p>PIN은 이 브라우저에 저장돼요. 사이트 데이터를 지우면 PIN도 초기화됩니다.</p><button type="button" data-change>PIN 변경</button><button type="button" data-disconnect>반 연결 해제</button><p>카메라·마이크 권한은 브라우저 또는 기기 설정에서 변경할 수 있어요.</p>',()=>true);
    }catch(err){alert(err.message || '교사 설정을 열지 못했어요.');}
  }
  document.addEventListener('click',async e=>{
    if(e.target.matches('[data-change]')){const bound=read()?.boundToken;e.target.closest('dialog').close();try{await setPin(bound);}catch(err){alert(err.message);}}
    if(e.target.matches('[data-disconnect]')&&confirm('반 연결을 해제할까요? 새 반 연결 시 교사 확인과 PIN을 다시 설정합니다.')){localStorage.removeItem('popTabletToken');localStorage.removeItem(KEY);location.href=location.pathname;}
  });
  async function allowConnection(nextToken){
    if(/NoriPopKiosk\//.test(navigator.userAgent))return true;
    const saved=read();if(!saved||saved.boundToken===nextToken)return true;
    if(!await unlock())return false;
    // Verify ownership of the new class before replacing recovery binding.
    if(!await verifyOwner(nextToken))return false;
    save({...read(),boundToken:nextToken});return true;
  }
  return {menu,allowConnection};
})();

