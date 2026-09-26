(() => {
 const request=document.getElementById('request'),change=document.getElementById('change'),status=document.getElementById('status');
 // Isolate the recovery session from the teacher's normal browser login.
 const client=window.supabase.createClient(POP_CONFIG.SUPABASE_URL,POP_CONFIG.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,storageKey:'pop-password-recovery'}});
 let ready=false,busy=false;
 client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY' && session){ready=true;request.hidden=true;change.hidden=false;document.getElementById('title').textContent='새 비밀번호 설정';document.getElementById('help').textContent='새 비밀번호를 저장한 뒤 다시 로그인해 주세요. 태블릿 PIN 복구 중이었다면 태블릿으로 돌아가 확인해 주세요.';history.replaceState(null,'',location.pathname);}
 });
 if(new URLSearchParams(location.hash.slice(1)).has('error')){status.textContent='링크가 만료되었거나 사용할 수 없어요. 새 변경 링크를 요청해 주세요.';history.replaceState(null,'',location.pathname);}
 request.onsubmit=async e=>{
  e.preventDefault();if(busy)return;busy=true;const button=request.querySelector('button');button.disabled=true;status.textContent='메일을 요청하고 있어요…';
  try{const {error}=await client.auth.resetPasswordForEmail(document.getElementById('email').value.trim(),{redirectTo:new URL('reset-password.html',location.href).href});if(error)throw error;status.textContent='가입된 이메일이면 변경 링크가 발송됩니다. 스팸함도 확인해 주세요. 링크는 한 번만 사용해 주세요.';}
  catch(e){status.textContent='메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 edupoplab@gmail.com으로 문의해 주세요.';}
  finally{busy=false;button.disabled=false;}
 };
 change.onsubmit=async e=>{
  e.preventDefault();if(busy||!ready)return;
  const password=document.getElementById('password').value;
  if(password.length<6||password!==document.getElementById('repeat').value){status.textContent='6자 이상인 같은 비밀번호를 두 번 입력해 주세요.';return;}
  busy=true;const button=change.querySelector('button');button.disabled=true;
  try{const {error}=await client.auth.updateUser({password});if(error)throw error;ready=false;change.reset();change.hidden=true;status.textContent='비밀번호를 변경했어요. 로그인으로 돌아가 새 비밀번호를 입력해 주세요.';try{await client.auth.signOut({scope:'local'});}catch{/* Password was already changed; this isolated session is not persisted. */}}
  catch(e){status.textContent='변경하지 못했어요. 링크가 만료되었거나 비밀번호 조건에 맞지 않을 수 있어요. 다시 시도하거나 새 링크를 요청해 주세요.';request.hidden=false;}
  finally{busy=false;button.disabled=false;}
 };
})();
