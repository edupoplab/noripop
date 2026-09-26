/* 이름 입력 전용 대화상자. 저장 실패 시 입력을 유지한다. */
window.PopNameDialog = {
 choose(title,message,choices=[{label:'확인',value:true}]) {
  return new Promise(resolve=>{
   const previous=document.activeElement,d=document.createElement('dialog');d.className='pop-name-dialog';
   const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=message;
   const actions=document.createElement('div');actions.className='name-dialog-actions';
   d.append(h,p,actions);d.setAttribute('aria-label',title);
   const finish=value=>{d.close();d.remove();previous?.focus();resolve(value);};
   for(const [i,choice] of choices.entries()){const b=document.createElement('button');b.textContent=choice.label;b.className=i===choices.length-1?'name-save':'name-cancel';b.onclick=()=>finish(choice.value);actions.appendChild(b);}
   d.addEventListener('cancel',e=>{e.preventDefault();finish(null);});document.body.appendChild(d);d.showModal();
  });
 },
 open({title,label,value='',hint='',save}) {
  if(document.getElementById('popNameDialog'))return;
  const previous=document.activeElement;
  const dialog=document.createElement('dialog');
  dialog.id='popNameDialog';dialog.className='pop-name-dialog';
  dialog.setAttribute('aria-labelledby','popNameTitle');
  dialog.innerHTML='<form><div class="name-dialog-mark" aria-hidden="true">🍿</div><h2 id="popNameTitle"></h2><p id="popNameHint"></p><label for="popNameInput"></label><input id="popNameInput" maxlength="60" required autocomplete="off" aria-describedby="popNameHint popNameError"><p id="popNameError" role="alert"></p><div class="name-dialog-actions"><button type="button" class="name-cancel">취소</button><button type="submit" class="name-save">저장하기</button></div></form>';
  dialog.querySelector('h2').textContent=title;
  dialog.querySelector('label').textContent=label;
  dialog.querySelector('#popNameHint').textContent=hint;
  const input=dialog.querySelector('input');input.value=value || '';
  const buttons=[...dialog.querySelectorAll('button')];let busy=false;
  function close(){dialog.close();dialog.remove();previous?.focus();}
  dialog.querySelector('.name-cancel').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!busy)close();});
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();if(busy)return;
   const name=input.value.trim();const error=dialog.querySelector('#popNameError');
   if(!name){error.textContent='이름을 입력해주세요.';input.focus();return;}
   busy=true;buttons.forEach(b=>b.disabled=true);input.disabled=true;
   buttons[1].textContent='저장 중…';error.textContent='';
   try{await save(name);close();}
   catch(e){error.textContent='저장하지 못했어요. '+(e.message || '잠시 후 다시 시도해주세요.');}
   finally{busy=false;buttons.forEach(b=>b.disabled=false);input.disabled=false;buttons[1].textContent='저장하기';}
  };
  document.body.appendChild(dialog);dialog.showModal();input.focus();input.select();
 }
};
