/* 分享截圖＋加到主畫面（PWA）
 * - 分享截圖：拍下現在的畫面，下面加一條站名框（路線、站名、角色、迷霧標誌），可以直接分享（手機）或下載
 * - PWA：註冊 sw.js（快取檔案，第二次開很快）；Android 可以一鍵安裝，iPhone 顯示「分享 → 加入主畫面」的說明
 */
const Share = (() => {
  const URL_TXT = 'hao-yuliu.github.io/MRT-station-';
  let installEvt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
  addEventListener('appinstalled', () => { installEvt = null; if (typeof toast === 'function') toast('<b>已加到主畫面</b><span>之後可以從桌面直接打開迷霧</span>'); });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  const standalone = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone === true;
  const ios = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

  // 截圖卡片
  async function card() {
    const src = World.snap(1280);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const W = img.width, H = img.height, band = Math.round(W * .1), c = document.createElement('canvas'); c.width = W; c.height = H + band;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const grd = g.createLinearGradient(0, H, 0, H + band); grd.addColorStop(0, '#0d1620'); grd.addColorStop(1, '#05080d'); g.fillStyle = grd; g.fillRect(0, H, W, band);
    const s = Game.state, st = s.current || '', lines = STATIONS[st] ? MRT.linesAt(st) : [], pad = band * .28, cy = H + band / 2;
    let x = pad;
    for (const l of lines) {   // 站碼方塊
      const L = LINES[l.line], tw = band * .62, th = band * .42;
      g.fillStyle = L.color; g.beginPath(); g.roundRect ? g.roundRect(x, cy - th / 2, tw, th, 6) : g.rect(x, cy - th / 2, tw, th); g.fill();
      g.fillStyle = L.text || '#fff'; g.font = `700 ${Math.round(band * .2)}px "Barlow Semi Condensed", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l.code || l.line, x + tw / 2, cy + 1); x += tw + 8;
    }
    g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = `900 ${Math.round(band * .38)}px "Noto Sans TC", sans-serif`; g.fillText(st, x + 8, cy - band * .08);
    g.fillStyle = '#9fb3c4'; g.font = `500 ${Math.round(band * .17)}px "Noto Sans TC", sans-serif`;
    g.fillText(`${playerName(s)}・${TaipeiTime.date()} ${TaipeiTime.clock ? TaipeiTime.clock() : ''}`, x + 10, cy + band * .27);
    g.textAlign = 'right'; g.fillStyle = '#eef3f8'; g.font = `900 ${Math.round(band * .34)}px "Noto Serif TC", serif`; g.fillText('迷霧', W - pad, cy - band * .1);
    g.fillStyle = '#7fb4e6'; g.font = `600 ${Math.round(band * .14)}px "Barlow Semi Condensed", sans-serif`; g.fillText(`MRT × Mystery × You · ${URL_TXT}`, W - pad, cy + band * .25);
    return c;
  }
  async function shot() {
    if (typeof World === 'undefined' || document.body.dataset.screen !== 'game') return;
    let c; try { c = await card(); } catch (e) { return toast('<b>截圖失敗</b><span>等畫面載入好再試一次</span>', 'warn'); }
    if (typeof Sound !== 'undefined') Sound.click();
    const url = c.toDataURL('image/jpeg', .9), name = `迷霧-${Game.state.current || 'MRT'}-${Date.now()}.jpg`;
    let m = document.getElementById('shareModal');
    if (!m) {
      m = document.createElement('div'); m.className = 'modal'; m.id = 'shareModal';
      m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><header><h3>📷 分享截圖</h3><button class="x" aria-label="關閉">×</button></header><div class="set-body"><img class="share-img" id="shareImg" alt="截圖"><div class="cloud-btns"><button type="button" class="btn primary" id="shareGo">分享</button><a class="btn ghost" id="shareDl">下載圖片</a></div></div></div>`;
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.x')) m.hidden = true; });
    }
    m.querySelector('#shareImg').src = url;
    const dl = m.querySelector('#shareDl'); dl.href = url; dl.download = name;
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .9)), file = blob && new File([blob], name, { type: 'image/jpeg' });
    const go = m.querySelector('#shareGo'), canShare = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
    go.hidden = !canShare;
    go.onclick = () => navigator.share({ files: [file], title: '迷霧', text: `我在台北捷運「${Game.state.current}」站。#迷霧 ${URL_TXT}` }).catch(() => {});
    m.hidden = false;
  }
  // 設定頁的「加到主畫面」區塊
  function installHtml() {
    if (standalone()) return '<p class="set-note" style="margin-top:0">已經是從主畫面打開的。</p>';
    if (installEvt) return '<button type="button" class="btn small primary" data-install="1">加到主畫面</button><p class="set-note">像 App 一樣全螢幕打開，也不會被誤關。</p>';
    if (ios()) return '<p class="set-note" style="margin-top:0">iPhone／iPad：用 Safari 打開，按下方的「分享」⎙，選「加入主畫面」。</p>';
    return '<p class="set-note" style="margin-top:0">用瀏覽器選單裡的「安裝應用程式」或「加到主畫面」，就能像 App 一樣打開。</p>';
  }
  async function install() { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) { /* 取消 */ } installEvt = null; if (typeof Settings !== 'undefined' && Settings.isOpen) Settings.render(); }
  return { shot, installHtml, install, card };
})();
