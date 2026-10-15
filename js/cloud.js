/* 雲端存檔：用夜語工作室（大廳）的帳號。大廳和遊戲都在 hao-yuliu.github.io 底下，
 * 所以在大廳登入過，這裡就讀得到同一個登入狀態（Supabase 的 session 存在同一個網域的 localStorage）。
 * - 存檔表：game_saves（user_id, game = 'mist', data, level, station, updated_at），只能讀寫自己的
 * - 每次存檔後 4 秒上傳一次（離開頁面時馬上上傳）
 * - 打開遊戲時：雲端的比這台裝置的新 → 問玩家要不要用雲端的進度
 */
const Cloud = (() => {
  const URL = 'https://umlnwzpmjxktfzjvcbts.supabase.co', KEY = 'sb_publishable_8J3VI8dijlCccHQbXPfCQQ_v_O0Au3w', GAME = 'mist';
  const HUB = 'https://hao-yuliu.github.io/escape-room/';
  let readyRes = null; const ready = new Promise(r => { readyRes = r; });   // Supabase 用戶端準備好（沒登入也可以用來回報問題）
  let sb = null, user = null, name = '', state = 'off', lastSync = 0, timer = null, busy = false, remote = null;
  // state：off（還沒連上）／guest（沒登入）／on（已登入）／error
  async function init() {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb = mod.createClient(URL, KEY); readyRes(sb);
      const { data } = await sb.auth.getSession();
      user = data && data.session ? data.session.user : null;
      if (!user) { state = 'guest'; return refresh(); }
      state = 'on';
      try { const { data: p } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle(); name = (p && p.username) || ''; } catch (e) { /* 沒有角色資料也沒關係 */ }
      await pull();
    } catch (e) { state = 'error'; readyRes(sb); }
    refresh();
  }
  const local = () => (typeof Game !== 'undefined' && Game.state) || null;
  // 比較雲端和這台裝置：雲端比較新就問要不要用
  async function pull() {
    const { data, error } = await sb.from('game_saves').select('data, updated_at, level, station').eq('user_id', user.id).eq('game', GAME).maybeSingle();
    if (error) { state = 'error'; return; }
    remote = data || null;
    const s = local();
    if (!remote) { if (s && s.char) push(); return; }
    const rAt = (remote.data && remote.data.savedAt) || 0, lAt = (s && s.savedAt) || 0;
    if (!s || !s.char) return useRemote(true);                 // 這台裝置還沒開始玩：直接用雲端的
    let applied = 0; try { applied = +localStorage.getItem('cloudApplied') || 0; } catch (e) { /* 無法存取 */ }
    if (rAt && rAt === applied) { if (lAt > rAt + 2000) push(); else lastSync = Date.now(); return; }   // 剛剛套用過這一份：不要再問（裝置時鐘不準也不會一直問）
    if (rAt > lAt + 2000) ask(); else if (lAt > rAt + 2000) push();
    else lastSync = Date.now();
  }
  function ask() {
    const r = remote.data || {}, s = local(), when = t => t ? new Date(t).toLocaleString('zh-TW', { hour12: false }) : '—';
    const lv = x => (typeof Economy !== 'undefined' ? Economy.levelInfo(x.xp || 0).lv : '?');
    modal('☁️ 雲端有比較新的進度', `<p>雲端：<b>${esc(playerName(r))}</b>・Lv ${lv(r)}・${esc(r.current || '')}<br><small>${when(r.savedAt)}</small></p><p>這台裝置：<b>${esc(playerName(s))}</b>・Lv ${lv(s)}・${esc(s.current || '')}<br><small>${when(s.savedAt)}</small></p>`,
      [['用雲端的進度', () => useRemote(false)], ['保留這台裝置的（上傳覆蓋雲端）', () => push(true)]]);
  }
  function useRemote(silent) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(remote.data)); localStorage.setItem('cloudApplied', String((remote.data && remote.data.savedAt) || 0)); } catch (e) { return; }
    lastSync = Date.now();
    if (silent && document.body.dataset.screen !== 'title') return;
    location.reload();   // 重新載入，所有系統都從雲端的存檔開始
  }
  async function push(force) {
    if (state !== 'on' || !sb || busy) return;
    const s = local(); if (!s || !s.char) return;
    busy = true;
    try {
      const lv = typeof Economy !== 'undefined' ? Economy.levelInfo(s.xp || 0).lv : null;
      const { error } = await sb.from('game_saves').upsert({ user_id: user.id, game: GAME, data: s, level: lv, station: s.current, updated_at: new Date().toISOString() });
      if (!error) { lastSync = Date.now(); remote = { data: s }; if (force) toast('<b>☁️ 已上傳</b><span>雲端進度已經更新成這台裝置的</span>'); }
      else state = 'error';
    } catch (e) { state = 'error'; }
    busy = false; refresh();
  }
  function queue() { if (state !== 'on') return; clearTimeout(timer); timer = setTimeout(push, 4000); }
  addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); push(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && timer) { clearTimeout(timer); push(); } });

  function statusHtml() {
    if (state === 'on') return `<p>已連結夜語工作室帳號${name ? `（<b>${esc(name)}</b>）` : ''}，進度會自動同步到雲端。<br><small>${lastSync ? '上次同步：' + new Date(lastSync).toLocaleTimeString('zh-TW', { hour12: false }) : '還沒同步'}</small></p><button type="button" class="btn small ghost" data-cloud="push">立即同步</button>`;
    if (state === 'guest') return `<p>登入夜語工作室帳號，就能在不同裝置繼續旅程。</p><a class="btn small primary" href="${HUB}#login" target="_blank" rel="noopener">到大廳登入</a> <button type="button" class="btn small ghost" data-cloud="retry">我登入好了</button>`;
    if (state === 'error') return '<p>雲端暫時連不上，進度先存在這台裝置。</p><button type="button" class="btn small ghost" data-cloud="retry">再試一次</button>';
    return '<p>正在連線……</p>';
  }
  function action(a) { if (a === 'push') push(true); if (a === 'retry') { state = 'off'; refresh(); init(); } }
  // 標題畫面的一行狀態＋設定頁
  function refresh() {
    const t = document.getElementById('titleCloud');
    if (t) t.innerHTML = state === 'on' ? `☁️ 已連結帳號${name ? '：' + esc(name) : ''}・進度自動同步` : state === 'guest' ? `☁️ <a href="${HUB}#login" target="_blank" rel="noopener">登入夜語工作室帳號</a>，換裝置也能繼續` : '';
    const sc = document.getElementById('setCloud'); if (sc) sc.innerHTML = statusHtml();
  }
  function modal(title, html, buttons) {
    const m = document.createElement('div'); m.className = 'modal'; m.style.zIndex = 40;
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><header><h3>${title}</h3></header><div class="set-body">${html}<div class="cloud-btns">${buttons.map(([t], i) => `<button type="button" class="btn ${i ? 'ghost' : 'primary'}" data-i="${i}">${t}</button>`).join('')}</div></div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { m.remove(); buttons[+b.dataset.i][1](); } });
  }
  // 回報問題：沒登入也能送（user_id 留空）
  async function report(row) {
    const c = await Promise.race([ready, new Promise(r => setTimeout(() => r(null), 8000))]);
    if (!c) return false;
    try { const { error } = await c.from('bug_reports').insert({ game: GAME, user_id: user ? user.id : null, ...row }); return !error; } catch (e) { return false; }
  }
  setTimeout(init, 300);
  return { report, queue, push, statusHtml, action, refresh, get state() { return state; }, get user() { return user; } };
})();
