/* Read-only admin display. Never use service-role keys in the browser. */
let paymentOffset = 0;
let paymentBusy = false;
const adminDate = value => value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '—';
async function loadAdminPayments(reset = true) {
  if (paymentBusy || me?.role !== 'admin') return;
  paymentBusy = true;
  const status = document.getElementById('paymentStatus');
  const table = document.getElementById('paymentTable');
  const more = document.getElementById('paymentMore');
  if (reset) { paymentOffset = 0; table.replaceChildren(); }
  more.hidden = true;
  status.textContent = '조회 중…';
  try {
    const { data, error } = await sb.rpc('admin_test_payment_list', { p_offset: paymentOffset });
    if (error) throw error;
    const rows = data || [];
    if (reset) table.innerHTML = '<tr><th>주문</th><th>회원</th><th>시험 금액</th><th>승인 상태</th><th>이용권 발급</th><th>생성일 · 한국시간</th></tr>';
    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${esc(r.order_id)}</td><td>${esc(r.nickname || '탈퇴·미확인 회원')}</td><td>${esc(Number(r.amount).toLocaleString('ko-KR'))}원</td><td>${r.status === 'approved' ? '시험 승인' : '생성됨 · 미승인'}</td><td>${r.entitlement_created_at ? '시험 이용권 발급됨' : r.status === 'approved' ? '발급 확인 필요' : '미발급'}</td><td>${esc(adminDate(r.created_at))}</td>`;
      table.appendChild(tr);
    }
    paymentOffset += rows.length;
    more.hidden = rows.length < 50;
    status.textContent = paymentOffset ? `시험 주문 ${paymentOffset}건 표시 · 실제 매출 제외` : '아직 시험 주문이 없습니다.';
  } catch {
    status.textContent = '전체 시험 내역 조회 연결을 확인해야 합니다. 권한 또는 서버 연결을 확인해 주세요. 조회 실패를 0건으로 표시하지 않습니다.';
  } finally { paymentBusy = false; }
}
async function loadGrantHistory() {
  if (me?.role !== 'admin') return;
  const status = document.getElementById('grantStatus');
  const table = document.getElementById('grantTable');
  table.replaceChildren(); status.textContent = '지급 내역 조회 중…';
  try {
    const { data, error } = await sb.from('pass_events').select('user_id,kind,days,note,created_at').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const labels = { founding: '오픈 멤버', contribute: '공개 놀이 보상', editor_pick: '에디터 픽', code: '코드 등록', admin: '운영자 지급', info: '추가 정보 보상' };
    table.innerHTML = '<tr><th>회원 식별번호</th><th>지급 근거</th><th>기간</th><th>메모</th><th>지급일 · 한국시간</th></tr>' + (data || []).map(r => `<tr><td>${esc(String(r.user_id).slice(0,8))}…</td><td>${esc(labels[r.kind] || r.kind)}</td><td>${esc(r.days)}일</td><td>${esc(r.note)}</td><td>${esc(adminDate(r.created_at))}</td></tr>`).join('');
    status.textContent = data?.length ? '최근 지급 내역 최대 100건 · 결제 승인 여부와 별개입니다.' : '아직 이용권 지급 내역이 없습니다.';
  } catch { status.textContent = '지급 내역을 조회하지 못했습니다. 연결·권한을 확인해 주세요.'; }
}
document.getElementById('paymentRefresh').addEventListener('click', () => loadAdminPayments(true));
document.getElementById('paymentMore').addEventListener('click', () => loadAdminPayments(false));
