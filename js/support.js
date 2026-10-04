// Shared teacher-facing footer; never loaded by tablet.html.
(() => {
  if (document.getElementById('noripopFooter')) return;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('../css/footer.css?v=20261004-2', document.currentScript.src).href;
  document.head.append(stylesheet);
  const footer = document.querySelector('footer') || document.createElement('footer');
  footer.id = 'noripopFooter';
  footer.setAttribute('aria-label', '놀이팝 서비스 안내');
  footer.innerHTML = `
    <div class="np-footer-main">
      <div class="np-footer-brand"><a href="index.html" aria-label="놀이팝 홈">놀이팝<span> by EduPop Lab</span></a>
        <p>선생님의 놀이 아이디어를<br>우리 반의 즐거운 경험으로.</p>
        <p class="np-footer-note">디지털 놀이를 모으고, 연결하고, 나누는<br>유아교사 놀이 플랫폼</p>
      </div>
      <nav aria-label="서비스 안내"><h2>서비스 안내</h2>
        <a href="library.html">놀이 라이브러리</a><a href="index.html#videoSection">처음 이용하는 선생님께</a><a href="guide.html">AI 교육·디지털 역량 안내</a>
      </nav>
      <div id="noripopSupport"><h2>고객지원</h2>
        <a href="https://pf.kakao.com/_xbVUxiX/chat" target="_blank" rel="noopener noreferrer">카카오톡 채널 상담하기 <span aria-hidden="true">↗</span><span class="np-sr-only"> (새 창)</span></a>
        <a href="mailto:edupoplab@gmail.com">edupoplab@gmail.com</a>
        <p class="np-footer-note">문의 시 비밀번호·인증번호와<br>아이의 개인정보는 보내지 마세요.</p>
      </div>
    </div>
    <div class="np-footer-bottom"><nav aria-label="이용정책"><a href="terms.html">이용약관</a><a href="privacy.html"><strong>개인정보 처리방침</strong></a></nav>
      <small>© EduPop Lab. 놀이팝</small>
    </div>`;
  document.body.append(footer);
})();
