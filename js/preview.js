/* 공통 미리보기: 실제 태블릿 실행 방식과 별개입니다. */
function previewHttps(value) {
  try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; }
}
function openPlayPreview(play, forceFrame = false) {
  const previous = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'play-preview';
  dialog.innerHTML = '<header><strong></strong><span><button type="button" class="btn btn-ghost" data-full>전체화면</button> <button type="button" class="btn btn-ghost" data-close>닫기 ×</button></span></header><p class="preview-note"></p><div class="preview-content"></div>';
  dialog.querySelector('strong').textContent = (play.title || '놀이 미리보기') + (play.owner?.nickname || play.nickname ? ' · ' + (play.owner?.nickname || play.nickname) : '');
  const content = dialog.querySelector('.preview-content');
  const note = dialog.querySelector('.preview-note');
  if (play.preview_mode === 'gallery' && !forceFrame) {
    note.textContent = '활동 사진으로 놀이 내용을 살펴보세요. 사진은 미리보기용이며 실제 놀이의 실행 가능 여부는 사용할 기기에서 별도로 확인해 주세요.';
    content.classList.add('preview-gallery');
    (play.preview_images || []).forEach((url, i) => {
      if (!previewHttps(url)) return;
      const img = document.createElement('img'); img.src = url; img.alt = `활동 모습 ${i + 1}`; content.append(img);
    });
    if (!content.children.length) content.textContent = '등록된 활동 사진이 없습니다.';
  } else {
    const url = previewHttps(play.url);
    if (!url) { alert('HTTPS 주소를 입력해 주세요.'); return; }
    note.textContent = '화면과 주요 기능을 직접 확인해 주세요. 비어 있거나 연결이 거부되면 내부 실행이 제한된 작품일 수 있습니다. 등록·수정 화면의 미리보기 설정에서 ‘활동 사진으로 보기’를 선택하면 사진으로 소개할 수 있어요. 사진 등록이 실행 오류를 해결하지는 않으며, 자동으로 새 창을 열지는 않습니다.';
    const frame = document.createElement('iframe');
    frame.title = (play.title || '놀이') + ' 미리보기';
    // 외부 작품이 상위 페이지 이동이나 새 창으로 원본 주소를 노출하지 않도록 제한합니다.
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-downloads');
    frame.allow = 'autoplay; camera; microphone; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = url; content.append(frame);
  }
  dialog.querySelector('[data-full]').onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await dialog.requestFullscreen(); }
    catch { note.textContent = '이 환경에서는 전체화면을 사용할 수 없어요. 현재 실행창에서 이용해 주세요.'; }
  };
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { dialog.remove(); previous?.focus(); }, { once: true });
  document.body.append(dialog); dialog.showModal();
}
