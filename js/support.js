// Compact teacher-facing contact; never loaded by tablet.html.
(() => {
  if (document.getElementById('noripopSupport')) return;
  const footer = document.querySelector('footer');
  const contact = document.createElement('div');
  contact.id = 'noripopSupport';
  contact.style.cssText = footer
    ? 'margin-top:8px'
    : 'max-width:1080px;margin:24px auto;padding:0 20px 24px;box-sizing:border-box;font-size:12.5px;color:#64748b;line-height:1.7';
  contact.append('고객센터 : ');
  const link = document.createElement('a');
  link.href = 'https://pf.kakao.com/_xbVUxiX/chat';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '카카오톡 채널 상담하기';
  link.style.color = 'inherit';
  contact.append(link);
  (footer || document.body).append(contact);
})();
