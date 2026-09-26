window.PopInstall = (()=>{
 let promptEvent=null, offered=false, installDialog=null, completionShown=false;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;});
 window.addEventListener('appinstalled',()=>{
  if(completionShown || /NoriPopKiosk\//.test(navigator.userAgent))return;
  completionShown=true; offered=true; promptEvent=null;
  if(installDialog?.isConnected)installDialog.close();
  const d=document.createElement('dialog');d.className='teacher-sheet';
  d.innerHTML='<img src="icons/webapp-teal.png" alt="청록색 놀이팝 아이콘" style="width:64px;height:64px;border-radius:16px;margin-bottom:16px"><h2>이제 홈 화면에서 놀이팝을 열어보세요!</h2><p>청록색 팝콘 아이콘을 누르면 연결한 놀이 모음이 열려요.</p><p>홈 화면에 없다면 앱 목록에서 ‘놀이팝’을 길게 눌러 홈 화면에 추가해 주세요.</p><button type="button">확인, 계속하기</button>';
  d.querySelector('button').onclick=()=>d.close();
  d.onclose=()=>d.remove();document.body.append(d);d.showModal();
 });
 function offer(){
  if(offered || /NoriPopKiosk\//.test(navigator.userAgent) || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone || sessionStorage.getItem('popInstallDismissed'))return;
  offered=true;
  const d=document.createElement('dialog');d.className='teacher-sheet';installDialog=d;
  d.innerHTML='<h2>홈 화면에 놀이팝 설치</h2><p>설치하면 다음부터 태블릿 홈 화면의 청록색 팝콘 아이콘으로 바로 열 수 있어요.</p><button data-install>설치하기</button><button data-later>나중에</button><p data-help></p>';
  d.querySelector('[data-install]').onclick=async()=>{
   if(promptEvent){const ev=promptEvent;promptEvent=null;try{await ev.prompt();const choice=await ev.userChoice;if(choice.outcome==='accepted' && d.isConnected)d.close();}catch{d.querySelector('[data-help]').textContent='설치창을 열지 못했어요. 브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택해 주세요.';}}
   else d.querySelector('[data-help]').textContent=/iPad|iPhone/.test(navigator.userAgent)?'Safari의 공유 버튼 → 홈 화면에 추가를 선택해 주세요. 추가한 뒤 홈 화면의 청록색 팝콘 아이콘을 눌러 실행하세요.':'브라우저 메뉴(⋮)에서 앱 설치 또는 홈 화면에 추가를 선택해 주세요. 설치 후 홈 화면에 아이콘이 없다면 앱 목록에서 ‘놀이팝’을 길게 눌러 홈 화면에 추가해 주세요. 설치 항목이 없으면 이미 설치되어 있는지 확인해 주세요.';
  };
  d.querySelector('[data-later]').onclick=()=>d.close();d.onclose=()=>{sessionStorage.setItem('popInstallDismissed','1');d.remove();};document.body.append(d);d.showModal();
 }
 return {offer};
})();
