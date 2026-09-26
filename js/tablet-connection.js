window.PopConnection = (() => {
 const key='popConnectionDevice';
 async function connect(digits) {
  if(!/^\d{8}$/.test(digits))throw Error('숫자 8자리를 입력해 주세요.');
  let device=localStorage.getItem(key);
  if(!device){device=crypto.randomUUID();localStorage.setItem(key,device);}
  const {data,error}=await sb.rpc('connect_collection',{p_code:'POP-'+digits,p_device:device});
  if(error)throw Error('연결 서버에 접속하지 못했어요. 잠시 후 다시 시도해 주세요.');
  if(data?.status==='blocked')throw Error(`여러 번 틀렸어요. ${data.retry_after || 60}초 후 다시 입력하거나 QR로 연결해 주세요.`);
  if(data?.status!=='ok')throw Error('연결 번호를 찾을 수 없어요. 숫자 8자리를 확인해 주세요.');
  return data.tablet_token;
 }
 return {connect};
})();
