/* 設定頁：畫質、音量（總音量／音效／環境音／廣播）、字體大小、減少晃動、雲端存檔、新手教學
 * 存在 localStorage 的 mrtSettings（跟存檔分開，清除進度也不會不見）
 */
const Settings = (() => {
  const KEY = 'mrtSettings';
  const DEF = { vol: { main: 1, sfx: 1, amb: 1, voice: 1 }, font: 'normal', calm: false };
  let cur = JSON.parse(JSON.stringify(DEF));
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); cur = { ...cur, ...s, vol: { ...cur.vol, ...(s.vol || {}) } }; } catch (e) { /* 無法存取 */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) { /* 無法存取 */ } };
  const get = k => cur[k];
  function apply() {
    document.body.classList.toggle('font-l', cur.font === 'large');
    document.body.classList.toggle('font-xl', cur.font === 'xlarge');
    if (typeof World !== 'undefined' && World.setCalm) World.setCalm(cur.calm);
    if (typeof Sound !== 'undefined' && Sound.setVolumes) Sound.setVolumes(cur.vol);
  }
  function set(k, v) { cur[k] = v; save(); apply(); }

  const QNAME = { auto: '自動', high: '高', low: '省電' };
  const QDESC = { auto: '依裝置效能自動調整解析度，太吃力時會減少人潮', high: '最清楚，比較耗電', low: '解析度低一點、最多 30 fps、人少一點，比較省電' };
  const FONTS = [['normal', '標準'], ['large', '大'], ['xlarge', '特大']];
  const VOLS = [['main', '總音量'], ['sfx', '音效（按鈕、腳步、車門）'], ['amb', '環境音（車站、列車行駛）'], ['voice', '廣播（到站廣播、進站音樂）']];
  function open() {
    let m = document.getElementById('settingsModal');
    if (!m) {
      m = document.createElement('div'); m.className = 'modal'; m.id = 'settingsModal'; m.hidden = true;
      m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="setTitle"><header><h3 id="setTitle">⚙️ 設定</h3><button class="x" aria-label="關閉">×</button></header><div class="set-body" id="setBody"></div></div>`;
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.x')) m.hidden = true; });
    }
    render(); m.hidden = false;
  }
  function render() {
    const b = document.getElementById('setBody'), q = typeof World !== 'undefined' ? World.quality : 'auto';
    const seg = (name, opts, val) => `<div class="seg" data-seg="${name}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${v === val}">${t}</button>`).join('')}</div>`;
    const cloud = typeof Cloud !== 'undefined' ? Cloud.statusHtml() : '';
    b.innerHTML = `
      <section><h4>畫質</h4>${seg('quality', Object.entries(QNAME), q)}<p class="set-note">${QDESC[q] || ''}${typeof World !== 'undefined' && World.strained ? '<br>（這台裝置有點吃力，已經自動減少人潮）' : ''}</p></section>
      <section><h4>音量</h4>${VOLS.map(([k, t]) => `<label class="set-vol"><span>${t}</span><input type="range" min="0" max="100" step="5" data-vol="${k}" value="${Math.round(cur.vol[k] * 100)}"><b>${Math.round(cur.vol[k] * 100)}</b></label>`).join('')}
        <p class="set-note">${typeof Sound !== 'undefined' && !Sound.enabled ? '目前音效是「關」，可以在選單裡打開。' : ''}</p></section>
      <section><h4>字體大小</h4>${seg('font', FONTS, cur.font)}<p class="set-note">放大上方欄位、資訊框、對話和視窗裡的字。</p></section>
      <section><h4>減少晃動</h4>${seg('calm', [['0', '關'], ['1', '開']], cur.calm ? '1' : '0')}<p class="set-note">鏡頭上下移動比較平順、不會自動轉向、特效少一點。容易暈的話建議打開。</p></section>
      <section><h4>雲端存檔</h4><div id="setCloud">${cloud}</div></section>
      <section><h4>新手教學</h4><button type="button" class="btn small ghost" id="setTut">重新開始新手教學</button><p class="set-note">從南港展覽館大廳重新走一次：搭車、下車、傳送、接委託。</p></section>`;
    b.onclick = e => {
      const btn = e.target.closest('[data-seg] button');
      if (btn) {
        const k = btn.parentNode.dataset.seg, v = btn.dataset.v;
        if (k === 'quality') World.setQuality(v);
        else if (k === 'font') set('font', v);
        else if (k === 'calm') set('calm', v === '1');
        if (typeof Sound !== 'undefined') Sound.click();
        if (typeof updateQualityLabel === 'function') updateQualityLabel();
        return render();
      }
      if (e.target.closest('#setTut')) { document.getElementById('settingsModal').hidden = true; if (typeof Tutorial !== 'undefined') Tutorial.restart(); return; }
      const cb = e.target.closest('[data-cloud]'); if (cb && typeof Cloud !== 'undefined') Cloud.action(cb.dataset.cloud);
    };
    b.oninput = e => {
      const r = e.target.closest('[data-vol]'); if (!r) return;
      cur.vol[r.dataset.vol] = +r.value / 100; r.nextElementSibling.textContent = r.value; save(); apply();
    };
  }
  // 頁面載入時就套用（字體、減少晃動、音量）
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  return { get, set, open, apply, render, get isOpen() { const m = document.getElementById('settingsModal'); return !!(m && !m.hidden); } };
})();
