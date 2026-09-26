window.PopInstall = (()=>{
 let promptEvent=null, offered=false;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;});
 function offer(){
  if(offered || /NoriPopKiosk\//.test(navigator.userAgent) || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone || sessionStorage.getItem('popInstallDismissed'))return;
  offered=true;
  const d=document.createElement('dialog');d.className='teacher-sheet';
  d.innerHTML='<h2>홈 화면에 놀이팝 설치</h2><p>설치하면 다음부터 태블릿 홈 화면의 청록색 팝콘 아이콘으로 바로 열 수 있어요.</p><button data-install>설치하기</button><button data-later>나중에</button><p data-help></p>';
  d.querySelector('[data-install]').onclick=async()=>{
   if(promptEvent){const ev=promptEvent;promptEvent=null;await ev.prompt();const choice=await ev.userChoice;if(choice.outcome==='accepted')d.close();}
   else d.querySelector('[data-help]').textContent=/iPad|iPhone/.test(navigator.userAgent)?'Safari의 공유 버튼 → 홈 화면에 추가를 선택해 주세요.':'브라우저 메뉴(⋮)에서 앱 설치 또는 홈 화면에 추가를 선택해 주세요. 설치 항목이 없으면 이미 설치되어 있는지 확인해 주세요.';
  };
  d.querySelector('[data-later]').onclick=()=>d.close();d.onclose=()=>{sessionStorage.setItem('popInstallDismissed','1');d.remove();};document.body.append(d);d.showModal();
 }
 return {offer};
})();
