/* 등록 사진은 기존 thumbs 저장소의 본인 폴더에 저장합니다. */
const previewForm = (() => {
  let images = [], testedUrl = '', busy = false, generation = 0;
  const box = document.createElement('details'); box.className = 'preview-fields';
  box.innerHTML = `<summary>미리보기 설정 <span id="previewSummary">직접 실행</span></summary><div class="preview-settings">
    <p>공개할 때 확인해 주세요. 실행이 안 되면 사진으로 대신할 수 있어요.</p>
    <label for="previewMode">보여줄 방식</label><select id="previewMode"><option value="iframe">직접 실행해 보기</option><option value="gallery">활동 사진으로 보기</option></select>
    <div id="previewRunFields"><button type="button" class="btn btn-ghost" id="previewTest">실행해 보기</button>
    <label class="preview-check"><input type="checkbox" id="previewChecked"> 직접 실행해 보니 잘 작동해요</label>
    <details><summary>내부 실행이 안 되나요? AI에게 수정 요청하기</summary>
    <p>아래 내용을 복사해 제작 AI에게 요청한 뒤 다시 배포하고 테스트해 주세요. 주소의 직접 노출을 줄이는 기능이며 주소 추출을 완전히 막지는 못합니다.</p>
    <textarea readonly aria-label="AI 수정 요청문">제가 만든 웹 활동을 ${location.origin} 의 놀이팝 iframe 안에서 실행할 수 있게 점검해 주세요. X-Frame-Options와 CSP frame-ancestors 등 배포 설정, 상위 창 이동과 팝업 의존 여부를 확인해 주세요. 필요한 출처만 허용하고 기존 인증과 접근 권한은 유지해 주세요. 놀이팝 미리보기는 allow-scripts allow-same-origin allow-forms allow-downloads sandbox를 사용하며 카메라·마이크·전체화면을 허용합니다. 로그인·저장·카메라 등 주요 기능을 이 환경에서 확인하고, 서버 설정 변경이 필요하면 방법을 안내해 주세요.</textarea></details>
    </div><div id="previewPhotoFields" hidden><label for="activityFiles">활동 사진 3~8장</label><p>시작·활동·결과 화면을 올려 주세요. 이름과 얼굴은 가려 주세요.</p>
    <input id="activityFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple><small>JPG·PNG·WebP / 장당 10MB 이하</small><div class="activity-images"></div></div><p id="activityStatus" role="status"></p></div>`;
  document.getElementById('fUrl').after(box);
  const mode = box.querySelector('#previewMode'), checked = box.querySelector('#previewChecked'), status = box.querySelector('#activityStatus');
  function updateMode() {
    const photos = mode.value === 'gallery';
    box.querySelector('#previewRunFields').hidden = photos;
    box.querySelector('#previewPhotoFields').hidden = !photos;
    box.querySelector('#previewSummary').textContent = photos ? `활동 사진 ${images.length}장` : (checked.checked ? '확인 완료' : '직접 실행');
    const msg = document.getElementById('formMsg');
    if (msg?.dataset.previewError) { msg.textContent = ''; msg.className = 'msg'; delete msg.dataset.previewError; }
  }
  mode.addEventListener('change', updateMode);
  checked.addEventListener('change', updateMode);
  function invalid(message) {
    box.open = true; box.scrollIntoView({behavior:'smooth',block:'center'});
    document.getElementById('formMsg')?.setAttribute('data-preview-error','true');
    throw new Error(message);
  }
  function render() {
    const list = box.querySelector('.activity-images'); list.replaceChildren();
    images.forEach((item, index) => {
      const fig = document.createElement('figure'), img = document.createElement('img'), remove = document.createElement('button');
      img.src = item.url; img.alt = `활동 사진 ${index + 1}`; remove.type = 'button'; remove.textContent = '삭제';
      remove.onclick = () => { if (busy) return; if (item.blob) URL.revokeObjectURL(item.url); images.splice(index, 1); render(); };
      fig.append(img, remove); list.append(fig);
    });
    updateMode();
  }
  box.querySelector('#previewTest').onclick = () => {
    const url = document.getElementById('fUrl').value.trim();
    if (!previewHttps(url)) return alert('HTTPS 주소를 먼저 입력해 주세요.');
    testedUrl = url; checked.checked = false; updateMode();
    openPlayPreview({ url, title: document.getElementById('fTitle').value }, true);
  };
  document.getElementById('fUrl').addEventListener('input', () => { testedUrl = ''; checked.checked = false; updateMode(); });
  box.querySelector('#activityFiles').onchange = async event => {
    if (busy) { event.target.value = ''; return; }
    const currentGeneration = generation;
    const files = [...event.target.files]; event.target.value = '';
    if (images.length + files.length > 8) return alert('사진은 최대 8장입니다.');
    busy = true; status.textContent = '사진 준비 중…';
    try {
      for (const file of files) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error('JPEG·PNG·WebP, 장당 10MB 이하만 올려 주세요.');
        const bitmap = await createImageBitmap(file), canvas = document.createElement('canvas');
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
        const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',.85));
        if (!blob) throw new Error('사진을 변환하지 못했습니다.');
        if (currentGeneration !== generation) return;
        images.push({blob,url:URL.createObjectURL(blob)});
      }
      status.textContent = '사진이 준비됐어요. 등록하기를 누르면 저장됩니다.';
    } catch(error) { status.textContent = error.message; }
    finally { busy = false; render(); }
  };
  return {
    reset(play = {}) {
      generation++;
      images.forEach(i => { if (i.blob) URL.revokeObjectURL(i.url); });
      images = (play.preview_images || []).map(url => ({url})); mode.value = play.preview_mode || 'iframe';
      testedUrl = ''; checked.checked = false; status.textContent = ''; box.open = false; render();
    },
    async prepare(owner, requireTest) {
      if (busy) throw new Error('사진 처리가 끝난 뒤 저장해 주세요.');
      if (mode.value === 'gallery' && images.length < 3) invalid('활동 사진을 3장 이상 올려 주세요. 실행 확인은 필요 없어요.');
      if (requireTest && mode.value === 'iframe' && (!checked.checked || testedUrl !== document.getElementById('fUrl').value.trim())) invalid('주소 아래에서 실행해 본 뒤 “잘 작동해요”를 체크해 주세요.');
      const uploaded = [];
      try {
        for (const item of images) {
          if (!item.blob) continue;
          const path = `${owner}/activity_${crypto.randomUUID()}.jpg`;
          const {error} = await sb.storage.from('thumbs').upload(path,item.blob,{contentType:'image/jpeg'});
          if (error) throw error;
          uploaded.push({item,path,url:sb.storage.from('thumbs').getPublicUrl(path).data.publicUrl});
        }
      } catch(error) { if (uploaded.length) await sb.storage.from('thumbs').remove(uploaded.map(x=>x.path)); throw error; }
      return { values: {preview_mode:mode.value,preview_images:images.map(item=>uploaded.find(x=>x.item===item)?.url || item.url)},
        async rollback() { if (uploaded.length) await sb.storage.from('thumbs').remove(uploaded.map(x=>x.path)); } };
    }
  };
})();
