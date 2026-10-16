/* 從後台（夜語工作室的資料庫）讀進來的東西：公告、活動開關、經驗倍數；還有匿名的遊玩數據
 * - game_announcements：管理員發的公告。標題畫面列出來，進遊戲後沒看過的跳一次
 * - game_config：events（節慶活動強制開／關，例如 {"event_halloween": true}）、xp_mult（經驗倍數，2 = 雙倍經驗）
 * - play_events：開遊戲、到站、任務、迷霧短篇、錯誤（不含任何個人資料；有登入才附帳號 id）。只有管理員讀得到
 * 連不上雲端時全部照原本的規則，不影響遊玩
 */
const Remote = (() => {
  let events = {}, xpMult = 1, anns = [];
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* 無法存取 */ } return null; };
  const client = () => (typeof Cloud !== 'undefined' && Cloud.ready ? Promise.race([Cloud.ready, new Promise(r => setTimeout(() => r(null), 8000))]) : Promise.resolve(null));
  async function load() {
    const c = await client(); if (!c) return;
    try {
      const { data } = await c.from('game_config').select('key, value').eq('game', 'mist');
      for (const row of data || []) {
        if (row.key === 'events' && row.value && typeof row.value === 'object') events = row.value;
        if (row.key === 'xp_mult') xpMult = Math.min(5, Math.max(1, +row.value || 1));
      }
    } catch (e) { /* 沒有設定就用預設 */ }
    try {
      const { data } = await c.from('game_announcements').select('id, title, body, starts_at').eq('game', 'mist').order('starts_at', { ascending: false }).limit(5);
      anns = data || [];
    } catch (e) { anns = []; }
    renderTitle();
    if (document.body.dataset.screen === 'game') showNew();
  }
  // 標題畫面：最新公告
  function renderTitle() {
    const el = document.getElementById('titleNews'); if (!el) return;
    const bits = anns.slice(0, 2).map(a => `<p class="title-news-item">📢 <b>${esc(a.title)}</b>${a.body ? `<span>${esc(a.body)}</span>` : ''}</p>`);
    if (xpMult > 1) bits.unshift(`<p class="title-news-item">✨ <b>現在是 ${xpMult} 倍經驗時段</b></p>`);
    el.innerHTML = bits.join(''); el.hidden = !bits.length;
  }
  // 遊戲中：還沒看過的公告跳一次
  function showNew() {
    let seen = []; try { seen = JSON.parse(ls('annSeen') || '[]'); } catch (e) { seen = []; }
    const fresh = anns.filter(a => !seen.includes(a.id));
    if (!fresh.length || typeof Dialog === 'undefined') return;
    const a = fresh[0];
    Dialog.show({ name: '📢 公告', role: '夜語工作室' }, `<b>${esc(a.title)}</b>${a.body ? `<br>${esc(a.body).replace(/\n/g, '<br>')}` : ''}`, [{ label: '知道了', primary: true, run: () => Dialog.close() }]);
    ls('annSeen', JSON.stringify(seen.concat(fresh.map(x => x.id)).slice(-50)));
  }
  document.addEventListener('mist-enter-game', () => setTimeout(showNew, 2500));
  setTimeout(load, 1200);
  setInterval(load, 10 * 60 * 1000);   // 開著遊戲的時候，每 10 分鐘看一次有沒有新公告、活動

  /* 遊玩數據：先排隊，每 20 秒或切到背景時一起送 */
  let q = [], lastArrive = '';
  function ev(kind, station, detail) {
    if (kind === 'arrive') { if (station === lastArrive) return; lastArrive = station; }
    q.push({ game: 'mist', kind, station: station || null, detail: detail || null, device: typeof Cloud !== 'undefined' ? Cloud.device : null, user_id: typeof Cloud !== 'undefined' && Cloud.user ? Cloud.user.id : null });
    if (q.length > 40) q = q.slice(-40);
  }
  async function flush() {
    if (!q.length) return;
    const rows = q; q = [];
    const c = await client(); if (!c) return;
    try { await c.from('play_events').insert(rows); } catch (e) { /* 送不出去就算了，不影響遊玩 */ }
  }
  setInterval(flush, 20000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  addEventListener('error', e => ev('error', null, { m: String(e.message || '').slice(0, 160) }));

  return {
    load, ev, flush,
    get xpMult() { return xpMult; },
    // 節慶活動：後台可以強制開（true）或關（false）；沒設定就照日期
    eventOverride: id => (Object.prototype.hasOwnProperty.call(events, id) ? !!events[id] : null),
    get events() { return events; },
  };
})();
const Track = { ev: (...a) => Remote.ev(...a) };
