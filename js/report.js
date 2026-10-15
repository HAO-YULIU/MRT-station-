/* 回報問題：玩家遇到卡住、錯誤時，一鍵把狀況送到 Supabase 的 bug_reports（只能新增、不能讀）
 * 自動附上：所在站與位置、台灣時間、裝置與畫面、畫質與幀率、最近的錯誤訊息（最多 10 筆）
 * 這個檔案最先載入，才收得到一開始發生的錯誤
 */
const Report = (() => {
  const VERSION = '2026.10.15c';   // 跟 version.json 一起改：玩家手機上是舊版時會提示更新
  const errs = [];
  const push = m => { errs.push({ t: new Date().toISOString().slice(11, 19), m: String(m).slice(0, 300) }); if (errs.length > 10) errs.shift(); };
  addEventListener('error', e => push(`${e.message} @ ${(e.filename || '').split('/').pop()}:${e.lineno}`));
  addEventListener('unhandledrejection', e => push('promise: ' + ((e.reason && e.reason.message) || e.reason)));

  function info() {
    const g = typeof Game !== 'undefined' ? Game.state : null, W = typeof World !== 'undefined' ? World : null;
    let pos = null, zone = null; try { const p = W && W.player; if (p) pos = [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1)]; zone = W && W.zone ? W.zone().kind : null; } catch (e) { /* 還沒進遊戲 */ }
    return {
      v: VERSION, screen: document.body.dataset.screen, pos, zone, ride: !!(typeof Game !== 'undefined' && Game.ride),
      time: typeof TaipeiTime !== 'undefined' ? `${TaipeiTime.date()} ${TaipeiTime.clockSec ? TaipeiTime.clockSec() : ''}` : '',
      ua: navigator.userAgent.slice(0, 200), vp: [innerWidth, innerHeight, devicePixelRatio], touch: matchMedia('(pointer: coarse)').matches,
      quality: W ? W.quality : null, fps: W ? W.fps : null, strained: W ? W.strained : null,
      lv: g && typeof Economy !== 'undefined' ? Economy.levelInfo(g.xp || 0).lv : null, tut: g && g.flags ? g.flags.tutorial : null,
      errors: errs.slice(),
    };
  }
  function open() {
    let m = document.getElementById('reportModal');
    if (!m) {
      m = document.createElement('div'); m.className = 'modal'; m.id = 'reportModal'; m.hidden = true;
      m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="repTitle"><header><h3 id="repTitle">🐞 回報問題</h3><button class="x" aria-label="關閉">×</button></header>
        <div class="set-body"><p class="set-note" style="margin-top:0">遇到卡住、看不到東西、任務解不了……告訴我們發生了什麼事。會自動附上你現在在哪一站、時間和裝置資訊，不會附上帳號密碼。</p>
        <textarea id="repMsg" class="rep-msg" maxlength="2000" rows="5" placeholder="例如：在中山站的月台往下走，角色卡在電扶梯旁邊動不了"></textarea>
        <p class="set-note" id="repWhere"></p>
        <div class="cloud-btns"><button type="button" class="btn primary" id="repSend">送出</button><button type="button" class="btn ghost" id="repCancel">取消</button></div><p class="set-note" id="repStatus"></p></div></div>`;
      document.body.appendChild(m);
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.x') || e.target.closest('#repCancel')) m.hidden = true; });
      m.querySelector('#repMsg').addEventListener('keydown', e => e.stopPropagation());   // 打字時不要動到角色
      m.querySelector('#repSend').onclick = send;
    }
    const g = typeof Game !== 'undefined' ? Game.state : null, i = info();
    m.querySelector('#repWhere').textContent = `會一起送出：${g && g.current ? g.current : '標題畫面'}${i.zone ? '・' + i.zone : ''}・${i.time}・${i.vp[0]}×${i.vp[1]}・畫質 ${i.quality || '-'}・最近錯誤 ${i.errors.length} 筆`;
    m.querySelector('#repStatus').textContent = ''; m.querySelector('#repSend').disabled = false;
    m.hidden = false; setTimeout(() => m.querySelector('#repMsg').focus(), 50);
  }
  async function send() {
    const m = document.getElementById('reportModal'), msg = m.querySelector('#repMsg').value.trim(), st = m.querySelector('#repStatus'), btn = m.querySelector('#repSend');
    if (!msg) { st.textContent = '請寫一下發生了什麼事'; return; }
    btn.disabled = true; st.textContent = '送出中……';
    const g = typeof Game !== 'undefined' ? Game.state : null;
    const ok = typeof Cloud !== 'undefined' ? await Cloud.report({ message: msg.slice(0, 2000), station: g && g.current ? String(g.current).slice(0, 40) : null, info: info() }) : false;
    if (ok) { st.textContent = ''; m.querySelector('#repMsg').value = ''; m.hidden = true; if (typeof toast === 'function') toast('<b>🐞 已送出，謝謝你</b><span>我們會盡快看看發生了什麼事</span>'); }
    else { btn.disabled = false; st.textContent = '現在送不出去（可能沒有網路），等一下再試一次。'; }
  }
  return { open, info, VERSION, get errors() { return errs.slice(); } };
})();
