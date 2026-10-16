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
  let admin = false;   // 管理員（資料庫的 admins 表；權限都在資料庫檢查，這裡只是決定要不要顯示管理員工具）
  async function checkAdmin() { try { const { data } = await sb.rpc('is_admin'); admin = !!data; } catch (e) { admin = false; } if (admin) document.dispatchEvent(new CustomEvent('mist-admin')); }
  let sb = null, user = null, name = '', state = 'off', lastSync = 0, timer = null, busy = false, remote = null;
  // state：off（還沒連上）／guest（沒登入）／on（已登入）／error
  async function init() {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb = mod.createClient(URL, KEY); readyRes(sb);
      // 從大廳帶過來的一次性登入碼（#sd=…）：從主畫面 App 打開時，登入狀態不一定跟 Safari 共用，用它登入；用完立刻從網址拿掉
      const sdm = location.hash.match(/(?:^#|&)sd=([^&]+)/);
      if (sdm) {
        history.replaceState(null, '', location.pathname + location.search);
        try { await sb.auth.verifyOtp({ token_hash: decodeURIComponent(sdm[1]), type: 'magiclink' }); } catch (e) { /* 碼過期就照原本的登入狀態 */ }
      }
      const { data } = await sb.auth.getSession();
      user = data && data.session ? data.session.user : null;
      if (!user) { state = 'guest'; return refresh(); }
      state = 'on'; checkAdmin();
      try { const { data: p } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle(); name = (p && p.username) || ''; } catch (e) { /* 沒有角色資料也沒關係 */ }
      await pull();
    } catch (e) { state = 'error'; readyRes(sb); }
    refresh();
  }
  const local = () => (typeof Game !== 'undefined' && Game.state) || null;
  // 每台裝置（每個瀏覽器、加到主畫面的 App 各算一台）有自己的代號，上傳時一起存；
  // base = 這台裝置最後一次知道的雲端版本（自己上傳的、或套用下來的）。
  // 雲端被「別台裝置」改過、跟 base 不一樣 → 不能直接覆蓋，要問玩家用哪一份（以前會互相蓋掉）
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, String(v)); } catch (e) { /* 無法存取 */ } return null; };
  let DEV = ls('cloudDev'); if (!DEV) { DEV = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); ls('cloudDev', DEV); }
  const base = () => +ls('cloudApplied') || 0;
  let asking = false;
  async function fetchRemote() {
    const { data, error } = await sb.from('game_saves').select('data, updated_at, level, station').eq('user_id', user.id).eq('game', GAME).maybeSingle();
    if (error) { state = 'error'; return undefined; }
    remote = data || null; return remote;
  }
  // 雲端是不是被別台裝置改過（跟這台知道的版本不一樣）
  const changedElsewhere = r => { const d = r && r.data; if (!d) return false; return d._dev !== DEV && (d.savedAt || 0) !== base(); };
  async function pull() {
    const r = await fetchRemote(); if (r === undefined) return;
    const s = local();
    if (!r) { if (s && s.char) push(); return; }
    if (!s || !s.char) return useRemote(true);                 // 這台裝置還沒開始玩：直接用雲端的
    if (changedElsewhere(r)) return ask();
    const rAt = (r.data && r.data.savedAt) || 0, lAt = s.savedAt || 0;
    if (lAt > rAt + 2000) push(); else lastSync = Date.now();
  }
  function ask() {
    if (asking) return; asking = true;
    const r = remote.data || {}, s = local(), when = t => t ? new Date(t).toLocaleString('zh-TW', { hour12: false }) : '—';
    const lv = x => (typeof Economy !== 'undefined' ? Economy.levelInfo(x.xp || 0).lv : '?');
    const visited = x => Object.keys(x.visited || {}).length;
    modal('☁️ 另一台裝置有新的進度', `<p>你在別的地方（另一支手機、瀏覽器或加到主畫面的 App）玩過，雲端的進度跟這台不一樣。要用哪一份？</p><p>雲端：<b>${esc(playerName(r))}</b>・Lv ${lv(r)}・${esc(r.current || '')}・去過 ${visited(r)} 站・NT$ ${r.money ?? '?'}<br><small>${when(r.savedAt)}</small></p><p>這台裝置：<b>${esc(playerName(s))}</b>・Lv ${lv(s)}・${esc(s.current || '')}・去過 ${visited(s)} 站・NT$ ${s.money ?? '?'}<br><small>${when(s.savedAt)}</small></p>`,
      [['用雲端的進度', () => { asking = false; useRemote(false); }], ['保留這台裝置的（上傳覆蓋雲端）', () => { asking = false; push(true); }]]);
  }
  let switching = false;   // 正在換成雲端的進度：重新載入前不要再把舊進度存回去
  function useRemote(silent) {
    switching = true;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(remote.data)); localStorage.setItem('cloudApplied', String((remote.data && remote.data.savedAt) || 0)); } catch (e) { return; }
    lastSync = Date.now();
    if (silent && document.body.dataset.screen !== 'title') { switching = false; return; }
    location.reload();   // 重新載入，所有系統都從雲端的存檔開始
  }
  async function push(force) {
    if (state !== 'on' || !sb || busy || (asking && !force)) return;
    const s = local(); if (!s || !s.char) return;
    busy = true;
    try {
      if (!force) {   // 上傳前先看雲端有沒有被別台裝置改過
        const r = await fetchRemote();
        if (r === undefined) { busy = false; return refresh(); }
        if (changedElsewhere(r)) { busy = false; if (!document.hidden) ask(); return; }
      }
      const lv = typeof Economy !== 'undefined' ? Economy.levelInfo(s.xp || 0).lv : null;
      const data = { ...s, _dev: DEV };
      const { error } = await sb.from('game_saves').upsert({ user_id: user.id, game: GAME, data, level: lv, station: s.current, updated_at: new Date().toISOString() });
      if (!error) { lastSync = Date.now(); remote = { data }; ls('cloudApplied', s.savedAt || 0); if (force) toast('<b>☁️ 已上傳</b><span>雲端進度已經更新成這台裝置的</span>'); }
      else state = 'error';
    } catch (e) { state = 'error'; }
    busy = false; refresh();
  }
  // 切回這個 App／分頁：先看雲端有沒有別台裝置的新進度（舊的分頁醒來時不會把新進度蓋掉）
  let lastCheck = 0;
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden || state !== 'on' || !sb || Date.now() - lastCheck < 3000) return; lastCheck = Date.now();
    const r = await fetchRemote(); if (r && changedElsewhere(r) && local() && local().char) ask();
  });
  function queue() { if (state !== 'on') return; clearTimeout(timer); timer = setTimeout(push, 4000); }
  // 切到背景、關掉 App：先存在這台裝置，再馬上上傳（手機上滑掉 App 時不會再等 4 秒）
  const flush = () => { if (switching) return; const s = local(); if (s && s.char && typeof saveState === 'function') { clearTimeout(timer); try { s.savedAt = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* 無法存取 */ } push(); } };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  document.addEventListener('click', e => { const a = e.target.closest('#titleCloud [data-cloud]'); if (a) { e.preventDefault(); action(a.dataset.cloud); } });

  function statusHtml() {
    if (state === 'on') return `<p>已連結夜語工作室帳號${name ? `（<b>${esc(name)}</b>）` : ''}，進度會自動同步到雲端。<br><small>${lastSync ? '上次同步：' + new Date(lastSync).toLocaleTimeString('zh-TW', { hour12: false }) : '還沒同步'}</small></p><button type="button" class="btn small ghost" data-cloud="push">立即同步</button>`;
    if (state === 'guest') return `<p>登入夜語工作室帳號，就能在不同裝置繼續旅程。<br><small>iPhone「加到主畫面」的迷霧和 Safari 是分開的，兩邊都要登入同一個帳號才會同步。</small></p><button type="button" class="btn small primary" data-cloud="login">登入</button> <a class="btn small ghost" href="${HUB}#login" target="_blank" rel="noopener">還沒有帳號？到大廳註冊</a>`;
    if (state === 'error') return '<p>雲端暫時連不上，進度先存在這台裝置。</p><button type="button" class="btn small ghost" data-cloud="retry">再試一次</button>';
    return '<p>正在連線……</p>';
  }
  // 在遊戲裡直接登入（加到主畫面的 App 跟 Safari 的登入狀態是分開的，不能靠大廳登入）
  function login() {
    const m = document.createElement('div'); m.className = 'modal'; m.style.zIndex = 40;
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><header><h3>☁️ 登入夜語工作室</h3></header><div class="set-body">
      <p class="set-note">用大廳的帳號（電子郵件＋密碼）登入，進度會自動同步到雲端。</p>
      <input class="rep-msg login-in" id="lgEmail" type="email" autocomplete="username" placeholder="電子郵件">
      <input class="rep-msg login-in" id="lgPass" type="password" autocomplete="current-password" placeholder="密碼">
      <p class="set-note" id="lgMsg"></p>
      <div class="cloud-btns"><button type="button" class="btn primary" id="lgGo">登入</button><button type="button" class="btn ghost" id="lgNo">取消</button></div>
      <p class="set-note"><a href="${HUB}#login" target="_blank" rel="noopener">還沒有帳號？到大廳註冊</a></p></div></div>`;
    document.body.appendChild(m);
    m.querySelectorAll('input').forEach(el => el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go(); }));
    const msg = t => { m.querySelector('#lgMsg').textContent = t; };
    m.querySelector('#lgNo').onclick = () => m.remove();
    async function go() {
      const email = m.querySelector('#lgEmail').value.trim(), password = m.querySelector('#lgPass').value;
      if (!email || !password) return msg('請輸入電子郵件和密碼');
      const c = await Promise.race([ready, new Promise(r => setTimeout(() => r(null), 8000))]);
      if (!c) return msg('雲端連不上，請稍後再試');
      msg('登入中……');
      try {
        const { data, error } = await c.auth.signInWithPassword({ email, password });
        if (error || !data || !data.user) return msg(error && /invalid/i.test(error.message) ? '電子郵件或密碼不對' : '登入失敗：' + ((error && error.message) || ''));
        user = data.user; state = 'on'; m.remove(); checkAdmin();
        try { const { data: p } = await c.from('profiles').select('username').eq('id', user.id).maybeSingle(); name = (p && p.username) || ''; } catch (e) { /* 沒有角色資料也沒關係 */ }
        toast(`<b>☁️ 已登入</b><span>${name ? esc(name) + '，' : ''}進度會自動同步到雲端</span>`);
        await pull(); refresh();
      } catch (e) { msg('登入失敗，請稍後再試'); }
    }
    m.querySelector('#lgGo').onclick = go;
    setTimeout(() => m.querySelector('#lgEmail').focus(), 50);
  }
  function action(a) { if (a === 'login') login(); if (a === 'push') push(true); if (a === 'retry') { state = 'off'; refresh(); init(); } }
  // 標題畫面的一行狀態＋設定頁
  function refresh() {
    const t = document.getElementById('titleCloud');
    if (t) t.innerHTML = state === 'on' ? `☁️ 已連結帳號${name ? '：' + esc(name) : ''}・進度自動同步` : state === 'guest' ? `☁️ <a href="#" data-cloud="login">登入夜語工作室帳號</a>，換裝置也能繼續` : '';
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
  return { report, queue, push, statusHtml, action, refresh, ready, get state() { return state; }, get user() { return user; }, get isAdmin() { return admin; }, get device() { return DEV; } };
})();
