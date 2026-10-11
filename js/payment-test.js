/* Test-only checkout. Secrets and payment approval stay on the server. */
(() => {
  const button = document.getElementById('testPayment');
  const status = document.getElementById('paymentStatus');
  const endpoint = POP_CONFIG.SUPABASE_URL + '/functions/v1/payment-test';
  const format = value => new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'long',timeStyle:'short'}).format(new Date(value));
  async function showPasses() {
    const target = document.getElementById('testPasses');
    target.textContent = '시험 이용권을 확인하고 있습니다…';
    try {
      const data = await call({action:'status'});
      target.replaceChildren();
      if (!data.items.length) { target.textContent = '아직 승인된 시험 이용권이 없습니다.'; return; }
      for (const item of data.items) {
        const p = document.createElement('p');
        p.textContent = `시험 30일권 · ${format(item.startsAt)}부터 ${format(item.endsAt)}까지 · 실제 플러스 기능에는 적용되지 않아요.`;
        target.append(p);
      }
    } catch (e) {target.textContent = e.message || '시험 내역을 불러오지 못했습니다.';}
  }
  async function call(body) {
    const {data:{session}} = await sb.auth.getSession();
    if (!session) throw new Error('먼저 회원 계정으로 로그인해주세요.');
    const res = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:POP_CONFIG.SUPABASE_ANON_KEY,Authorization:'Bearer '+session.access_token},body:JSON.stringify(body)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '시험 연결을 확인해주세요.');
    return data;
  }
  button.disabled = false;
  button.textContent = '청구 없는 시험 결제 시작';
  button.addEventListener('click',async () => {
    button.disabled = true;
    status.textContent = '시험 주문을 준비하고 있습니다…';
    try {
      const order = await call({action:'create'});
      if (!order.clientKey.startsWith('test_ck_')) throw new Error('시험 키 확인에 실패했습니다.');
      await TossPayments(order.clientKey).payment({customerKey:order.customerKey}).requestPayment({
        method:'CARD',amount:{currency:'KRW',value:order.amount},orderId:order.orderId,orderName:order.orderName,
        successUrl:location.origin+'/checkout.html?result=success',failUrl:location.origin+'/checkout.html?result=fail'
      });
      status.textContent = '시험이 중단됐습니다. 다시 시작할 수 있습니다.';
    } catch(e) { status.textContent = e.message || '시험을 중단했습니다.'; }
    finally {button.disabled = false;}
  });
  const query = new URLSearchParams(location.search);
  if (query.get('result') === 'fail') status.textContent = '시험 결제가 취소되었거나 실패했습니다. 실제 청구는 없습니다.';
  if (query.get('result') === 'success') {
    button.disabled = true;
    status.textContent = '서버에서 시험 승인 결과를 확인하고 있습니다…';
    call({action:'confirm',orderId:query.get('orderId'),paymentKey:query.get('paymentKey'),amount:Number(query.get('amount'))})
      .then(async () => {status.textContent = '시험 결제 승인과 시험용 30일권 발급이 완료되었습니다. 실제 청구·운영 이용권 변경·자동 결제 등록은 없습니다.';history.replaceState(null,'','checkout.html');await showPasses();})
      .catch(e => {status.textContent = e.message;})
      .finally(() => {button.disabled = false;});
  }
  document.getElementById('testPassesRefresh').addEventListener('click',showPasses);
  if (query.get('result') !== 'success') showPasses();
})();
