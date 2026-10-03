// Teacher-facing pages only; intentionally not loaded by tablet.html.
(() => {
  if (document.getElementById('noripopSupport')) return;
  const panel = document.createElement('aside');
  panel.id = 'noripopSupport';
  panel.setAttribute('aria-label', '놀이팝 고객센터');
  panel.style.cssText = 'max-width:1080px;margin:28px auto;padding:20px;box-sizing:border-box;line-height:1.7;color:#1E3A5F;background:#FFF4D6;border-radius:16px;font:14px/1.7 sans-serif';
  panel.innerHTML = `<strong>놀이팝 고객센터</strong>
    <p>평일 오후 1~5시 · 영업일 기준 1~2일 이내 답변을 목표로 합니다.</p>
    <p><a href="https://pf.kakao.com/_xbVUxiX/chat" target="_blank" rel="noopener noreferrer">카카오톡으로 상담하기 ↗</a>
    · <a href="https://pf.kakao.com/_xbVUxiX" target="_blank" rel="noopener noreferrer">채널 홈 ↗</a></p>
    <p>채널 심사 중으로 상담 연결이 제한될 수 있습니다. 연결되지 않으면 잠시 후 다시 시도해 주세요.</p>
    <p>문의할 때 기기 종류와 발생 상황을 알려주세요. 비밀번호·인증번호·아이의 개인정보는 보내지 마세요.</p>`;
  document.body.appendChild(panel);
})();
