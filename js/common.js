/* ══════════════ 놀이팝 공통 스크립트 ══════════════
 * 모든 페이지에서 config.js 다음에 불러옵니다.
 * Supabase 클라이언트 생성 + 자주 쓰는 도우미 함수 모음.
 * ═══════════════════════════════════════════════════ */

// Supabase 클라이언트 (supabase-js v2 CDN이 먼저 로드돼 있어야 함)
const sb = window.supabase.createClient(POP_CONFIG.SUPABASE_URL, POP_CONFIG.SUPABASE_ANON_KEY);

// HTML 이스케이프 (XSS 방지 — 사용자 입력을 화면에 넣을 때 항상 사용)
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// app_settings 전체를 { key: value } 형태로 로드
async function loadSettings() {
  const { data, error } = await sb.from('app_settings').select('key, value');
  if (error) throw error;
  const out = {};
  (data || []).forEach(r => { out[r.key] = r.value; });
  return out;
}

// 점수 → 레벨 (level_thresholds 설정과 대조)
function levelOf(points, thresholds) {
  const list = (thresholds || []).slice().sort((a, b) => a.min - b.min);
  let cur = list[0] || { name: '알맹이', emoji: '🌽', min: 0 };
  for (const t of list) if (points >= t.min) cur = t;
  return cur;
}

// 레벨 뱃지 HTML
function levelBadge(points, thresholds) {
  const lv = levelOf(points, thresholds);
  return `<span class="lv-badge" title="${points}점">${lv.emoji || '🍿'} ${esc(lv.name)}</span>`;
}

// 플러스 여부 (만료일이 오늘 이후면 플러스)
function isPlusDate(plusExpiresAt) {
  if (!plusExpiresAt) return false;
  return new Date(plusExpiresAt + 'T23:59:59') >= new Date();
}

// 날짜를 "2026년 7월 9일"로
function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
}

// 로그인 필수 페이지 가드 — 미로그인이면 auth.html로 보냄. 세션 반환.
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = 'auth.html'; return null; }
  return session;
}

// 내 프로필 로드
async function loadMyProfile(userId) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

// 출석 체크 (하루 1회 — 실패해도 화면 흐름은 막지 않음)
async function checkIn() {
  try { await sb.rpc('check_in'); } catch (e) { console.warn('출석 체크 실패', e); }
}

// 로그아웃
async function logout() {
  await sb.auth.signOut();
  location.href = 'auth.html';
}
