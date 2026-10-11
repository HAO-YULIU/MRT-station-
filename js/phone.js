/* 遊戲手機：訊息、任務、地圖、新聞、傳聞、照片、人物、案件筆記、收藏圖鑑、網購與商店通知、我的房間
 * 存在 Game.state.phone：msgs（訊息）、rumors（聽過的傳聞）、album（照片）、notes（錄音筆記）、follow（隔天才會收到的後續消息）
 */
const PHONE_CONTACTS = { lin: '林姐（委託所）', shop: '捷運購物', news: '台北新聞', system: '系統通知' };
const PHONE_APPS = [
  ['msg', '💬', '訊息'], ['quest', '📋', '任務'], ['map', '🗺️', '地圖'], ['news', '📰', '新聞'],
  ['rumor', '🗣️', '傳聞'], ['photo', '📷', '照片'], ['people', '👥', '人物'], ['case', '🗂️', '案件筆記'],
  ['collect', '📖', '收藏圖鑑'], ['shop', '🛍️', '網購'], ['room', '🏠', '我的房間'],
];
// 虛構的城市新聞（每天依日期挑三則）
const NEWS_POOL = [
  ['市政', '北市府宣布明年起增設十座捷運站共享單車站點。'],
  ['交通', '捷運公司：上週末運量創今年新高，信義區人潮最多。'],
  ['生活', '大稻埕老店傳承三代的手工麵線，今年起改由孫女接手。'],
  ['天氣', '氣象署：鋒面接近，北部午後可能出現短暫陣雨，出門記得帶傘。'],
  ['文化', '中正紀念堂廣場週末有露天電影，入場免費。'],
  ['交通', '文湖線部分列車進行例行維修，班距可能稍微拉長。'],
  ['社會', '失物招領中心統計：最常遺失的東西是雨傘，其次是悠遊卡。'],
  ['生活', '公館商圈新開一家只在深夜營業的豆花店，網友排隊打卡。'],
  ['文化', '淡水老街藝術節開幕，街頭畫家聚集河岸。'],
  ['怪談', '網路論壇熱議：有人聲稱在凌晨的月台看見一班「沒有路線號碼」的列車。捷運公司回應：查無此事。'],
  ['市政', '新北市將在板橋車站前增設徒步區，假日限定。'],
  ['生活', '動物園宣布：小貓熊寶寶本月開始與遊客見面。'],
  ['交通', '捷運局提醒：電扶梯請站穩扶好，不要奔跑。'],
  ['怪談', '北投溫泉區居民說，最近深夜常聽到不知道哪裡傳來的報站聲。'],
  ['社會', '一名乘客在捷運上撿到裝有現金的皮夾，交給站務員後默默離開。'],
  ['文化', '台北車站地下街舉辦老車票特展，展出 1996 年第一代磁卡票。'],
];
const NEWS_EVENT = {
  event_double10: ['節慶', '國慶連假首日，總統府前廣場湧入大批人潮，捷運加開班次。'],
  event_halloween: ['節慶', '萬聖節活動開跑！西門町變裝遊行吸引上千人參加。'],
  event_xmas: ['節慶', '板橋耶誕城點燈，捷運板橋站出口人潮擁擠。'],
  event_newyear: ['節慶', '跨年夜捷運延長營運的傳言不實，請民眾注意末班車時間。'],
  event_lunar: ['節慶', '春節走春人潮湧入龍山寺、行天宮，捷運站外大排長龍。'],
  event_midautumn: ['節慶', '中秋連假河濱公園烤肉人潮多，請注意垃圾帶走。'],
  event_valentine: ['節慶', '情人節花價上漲，中山站花店一束玫瑰要價破千。'],
};
const NEWS_STORY = {
  main_BL: ['怪談', '板南線乘客投訴：列車明明只有六節車廂，廣播卻說「第七節車廂即將開門」。'],
  main_BR: ['交通', '文湖線無人駕駛系統出現不明廣播，工程單位調查中。'],
  main_R: ['文化', '一張 1997 年的淡水線首日車票出現在拍賣網站，賣家身分不明。'],
  main_G: ['生活', '碧潭居民說，河邊有一棵樹的葉子一年四季都是綠的。'],
  main_O: ['社會', '中和新蘆線有乘客說，有人一路跟著他換了三次車。'],
  main_Y: ['交通', '環狀線某站的時鐘被發現慢了三十秒，原因不明。'],
};

const Phone = (() => {
  const S = () => {
    const s = Game.state;
    s.phone = s.phone || {};
    const p = s.phone; p.msgs = p.msgs || []; p.rumors = p.rumors || []; p.album = p.album || []; p.notes = p.notes || []; p.follow = p.follow || [];
    return p;
  };
  const nowText = () => { const t = TaipeiTime.now(); return `${t.month}/${t.day} ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`; };
  const ymd = () => { const t = TaipeiTime.now(); return `${t.year}-${t.month}-${t.day}`; };
  const who = id => PHONE_CONTACTS[id] || (NPCS[id] ? NPCS[id].name : id);
  let app = null;

  /* ── 對外：收訊息、記傳聞、拍照、錄音筆記 ── */
  function msg(from, text, quiet) {
    const p = S();
    p.msgs.push({ from, text, t: nowText(), unread: true });
    if (p.msgs.length > 80) p.msgs.splice(0, p.msgs.length - 80);
    saveState(); badge();
    if (!quiet) toast(`<b>📱 ${esc(who(from))}</b><span>${text.length > 34 ? esc(text.slice(0, 34)) + '……' : esc(text)}</span>`);
  }
  function rumor(text, src) {
    const p = S(); if (p.rumors.some(r => r.text === text)) return;
    p.rumors.push({ text, src, t: nowText() }); saveState();
  }
  function addPhoto(ev) {
    const p = S();
    let img = null; try { img = World.snap ? World.snap(180) : null; } catch (e) { img = null; }
    p.album.unshift({ st: ev.station, spot: ev.spot, t: nowText(), img });
    if (p.album.length > 24) p.album.length = 24;
    saveState();
  }
  function note(npcId, text) {
    const p = S(); if (p.notes.some(n => n.text === text)) return;
    p.notes.unshift({ npc: npcId, text, t: nowText() }); if (p.notes.length > 40) p.notes.length = 40; saveState();
  }
  // 任務完成：委託人傳訊息道謝，隔天再收到後續消息
  const FOLLOW = [
    '昨天真的謝謝你。後來事情順利多了，有空再來找我聊天。',
    '跟你說，昨天那件事之後，我想了很多。下次見面再告訴你。',
    '昨天的事我跟家人說了，他們也想謝謝你。',
    '後來我又去了那一站一次。感覺不太一樣了。',
  ];
  function onQuestDone(id) {
    const q = QUESTS[id]; if (!q) return;
    if (q.type === 'side' && q.giver && NPCS[q.giver]) {
      S().follow.push({ npc: q.giver, title: q.title, day: ymd() }); saveState();
    }
    if (/^daily_/.test(id)) msg('lin', `「${q.title}」收到了，報酬已經匯進你的悠遊卡。`, true);
    if (id === 'weekly') msg('lin', '這週的案子辦得很漂亮。碎片收好，攢夠了來換東西。');
  }
  function deliverFollowups() {
    const p = S(), today = ymd(), keep = [];
    for (const f of p.follow) {
      if (f.day === today) { keep.push(f); continue; }
      const h = [...f.title].reduce((a, c) => a + c.charCodeAt(0), 0);
      msg(f.npc, `（關於「${f.title}」）${FOLLOW[h % FOLLOW.length]}`, true);
      if (Game.state.friends) Friends.add(f.npc, 2, true);
    }
    if (keep.length !== p.follow.length) { p.follow = keep; saveState(); toast('<b>📱 有新訊息</b><span>昨天幫過的人傳了後續消息</span>'); }
  }
  function unread() { return S().msgs.filter(m => m.unread).length; }
  function badge() { const b = document.getElementById('hudPhone'); if (b) b.textContent = unread() ? unread() : ''; }

  /* ── 任務的下一步在哪裡 ── */
  function whereOf(g, st) {
    const v = x => (typeof x === 'string' && x[0] === '@' ? st[x.slice(1)] : x);
    if (g.npc && NPCS[g.npc]) { const where = npcStation(NPCS[g.npc]); return where ? `${NPCS[g.npc].name}現在在 ${where}` : `${NPCS[g.npc].name}現在不在任何車站`; }
    if (g.station) { const x = v(g.station); return Array.isArray(x) ? x.join('、') : x || '（不明）'; }
    if (g.line) return LINES[g.line] ? LINES[g.line].zh : g.line;
    if (g.kind === 'buy') return '商店或販賣機';
    return '（線索不足）';
  }
  function useHint() {
    const s = Game.state; if (!(s.inv.hint > 0)) return;
    const rows = Object.entries(s.quests.active).map(([id, st]) => { const q = QUESTS[id], step = q && q.steps[st.step]; return step ? `<b>${esc(q.title)}</b><br><small>${esc(step.text)} → ${esc(whereOf(step.goal, st))}</small>` : ''; }).filter(Boolean);
    if (!rows.length) return toast('<b>現在沒有進行中的任務</b><span>提示券先留著</span>');
    s.inv.hint--; saveState(); updateHud();
    Dialog.info('🎟️ 提示', rows.join('<br><br>'));
  }
  function useTracker() {
    const s = Game.state;
    if (!(s.inv.tracker > 0)) return;
    if (!(s.inv.battery > 0)) return toast('<b>追蹤器沒電了</b><span>需要 🔋 電池（網購或商店）</span>', 'warn');
    const rows = Object.entries(s.quests.active).map(([id, st]) => { const q = QUESTS[id], step = q && q.steps[st.step]; return step && step.goal.npc ? `<b>${esc(q.title)}</b>：${esc(whereOf(step.goal, st))}` : ''; }).filter(Boolean);
    if (!rows.length) return toast('<b>追蹤器</b><span>目前的任務沒有要找的人</span>');
    s.inv.battery--; saveState(); updateHud();
    Dialog.info('📍 追蹤器', rows.join('<br>'));
  }

  /* ── 畫面 ── */
  function open(a) {
    Daily.refresh && Daily.refresh();
    app = a || null;
    render();
    document.getElementById('phone').hidden = false;
  }
  function close() { document.getElementById('phone').hidden = true; }
  function render() {
    const t = TaipeiTime.now(), body = app ? appHtml(app) : home();
    const title = app ? PHONE_APPS.find(x => x[0] === app)[2] : '';
    document.getElementById('phoneBody').innerHTML = `
      <div class="ph-bar"><span>${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}</span><span>${app ? `<button class="ph-back" data-home="1">‹ 返回</button>` : ''}</span><span>🔋 ${100 - (t.hour * 3) % 60}%</span></div>
      ${app ? `<h3 class="ph-title">${title}</h3>` : ''}
      <div class="ph-scroll">${body}</div>`;
    if (app === 'msg') { S().msgs.forEach(m => { m.unread = false; }); saveState(); badge(); }
  }
  function home() {
    const s = Game.state, inv = Investigate.info(), d = Daily.status ? Daily.status() : { n: 0 };
    return `<div class="ph-widget">
        <b>${esc(CHARACTERS[s.char].name)}</b><small>Lv ${Economy.levelInfo(s.xp).lv}　🔍 ${inv.name}（調查 Lv ${inv.lv}）</small>
        <small>NT$ ${s.money}　🪙 ${s.gold || 0}　今日委託 ${Math.min(3, d.n)} / 3</small>
      </div>
      <div class="ph-grid">${PHONE_APPS.map(([id, ic, name]) => `<button class="ph-app" data-app="${id}"><span>${ic}${id === 'msg' && unread() ? `<i>${unread()}</i>` : ''}</span>${name}</button>`).join('')}</div>`;
  }
  const empty = t => `<p class="ph-empty">${t}</p>`;
  function appHtml(a) {
    const s = Game.state, p = S();
    if (a === 'msg') {
      const fromNpc = Object.entries((s.col || {}).msgs || {}).map(([id, text]) => ({ from: id, text, t: '留言' }));
      const all = p.msgs.slice().reverse().concat(fromNpc);
      return all.length ? all.map(m => `<div class="ph-msg${m.unread ? ' new' : ''}"><b>${esc(who(m.from))}</b><small>${m.t}</small><p>${esc(m.text)}</p></div>`).join('') : empty('還沒有訊息。');
    }
    if (a === 'quest') {
      const d = Daily.status(), act = Object.entries(s.quests.active);
      const tag = { main: '主線', side: '支線', event: '活動', secret: '秘密', timed: '限時', daily: '每日', weekly: '每週' };
      return `<div class="ph-card"><b>今日委託 ${Math.min(3, d.n)} / 3</b><small>${d.claimed ? '全勤獎勵已領取' : d.n >= 3 ? '可以去找林姐領全勤獎勵' : '台北車站大廳的林姐'}　連續 ${d.streak} 天</small>
        <small>每週案件：${d.weeklyDone ? '本週已完成' : Quests.isActive('weekly') ? '進行中' : '還沒接'}</small></div>
        ${act.length ? act.map(([id, st]) => { const q = QUESTS[id], step = q && q.steps[st.step]; return q ? `<div class="ph-card"><b><em class="ph-tag">${tag[q.type] || ''}</em>${esc(q.title)}</b><small>${step ? esc(step.text) : ''}</small>${Furniture.has('f_board') && step ? `<small>📌 ${esc(whereOf(step.goal, st))}</small>` : ''}</div>` : ''; }).join('') : empty('沒有進行中的任務。')}
        <p class="ph-note">已完成 ${Object.keys(s.quests.done).length} 個任務</p>`;
    }
    if (a === 'map') {
      const vis = Object.keys(s.visited).length, tot = Object.keys(STATIONS).length;
      const regions = Object.entries(REGIONS).map(([r, sts]) => { const n = sts.filter(x => s.visited[x]).length; return `<li><b>${r}</b><span class="rc-bar"><i style="width:${n / sts.length * 100}%"></i></span><em>${n}/${sts.length}</em></li>`; }).join('');
      const places = Object.entries(s.places || {}).map(([k, v]) => `<li>📍 ${esc(k)}<small>${esc(v)}</small></li>`).join('');
      return `<button class="btn primary small" data-openmap="1">打開捷運路網圖</button>
        <p class="ph-note">走過 ${vis} / ${tot} 站　現在在 ${esc(s.current || '')}</p>
        <ul class="rc-rows ph-rows">${regions}</ul>
        <h4 class="bag-h">已知地點</h4><ul class="ph-list">${places || '<li>還沒有發現特別的地點。</li>'}</ul>`;
    }
    if (a === 'news') {
      const t = TaipeiTime.now(), seed = t.year * 372 + t.month * 31 + t.day, out = [];
      for (const e of Quests.eventsNow()) if (NEWS_EVENT[e]) out.push(NEWS_EVENT[e]);
      for (const [q, n] of Object.entries(NEWS_STORY)) if (Quests.isActive(q) && (seed + q.length) % 3 === 0) out.push(n);
      for (let i = 0; i < 3; i++) out.push(NEWS_POOL[(seed * 7 + i * 5) % NEWS_POOL.length]);
      return out.map(([k, n]) => `<div class="ph-card"><em class="ph-tag">${k}</em><p>${esc(n)}</p></div>`).join('');
    }
    if (a === 'rumor') {
      const t = TaipeiTime.now(), today = RUMORS[(t.year * 372 + t.month * 31 + t.day) % RUMORS.length].replace('今日傳聞：', '');
      return `<div class="ph-card"><em class="ph-tag">今天</em><p>${esc(today)}</p></div>` + (p.rumors.length ? p.rumors.slice().reverse().map(r => `<div class="ph-card"><em class="ph-tag">${esc(r.src || '聽說')}</em><p>${esc(r.text)}</p><small>${r.t}</small></div>`).join('') : empty('和熟人聊天、聽收音機，會聽到更多傳聞。'));
    }
    if (a === 'photo') {
      return p.album.length ? `<div class="ph-album">${p.album.map(ph => `<figure>${ph.img ? `<img src="${ph.img}" alt="">` : '<div class="ph-noimg">📷</div>'}<figcaption>${esc(ph.st)}${ph.spot && SPOT_NAME[ph.spot] ? '・' + SPOT_NAME[ph.spot] : ''}<br><small>${ph.t}</small></figcaption></figure>`).join('')}</div>` : empty(s.inv.camera ? '用背包裡的相機拍照，照片會存在這裡。' : '有了相機之後，拍的照片會存在這裡。');
    }
    if (a === 'people') {
      const ids = Object.keys(s.friends).filter(id => NPCS[id] && id !== 'xiuyu').sort((x, y) => s.friends[y] - s.friends[x]);
      return ids.length ? ids.map(id => {
        const n = NPCS[id], f = s.friends[id] || 0, tier = friendTier(f), next = FRIEND_TIERS.find(([t]) => t > f);
        const un = [f >= 20 ? '工作與興趣' : null, f >= 50 && n.knows ? '他知道的事' : null, f >= 80 && n.rumors && n.rumors.length ? '私下的傳聞' : null, (s.hiddenProfiles || {})[id] ? '隱藏檔案' : null].filter(Boolean);
        return `<div class="ph-card"><b>${esc(n.name)}</b><small>${esc(n.role || '')}　${esc(npcStation(n) || '行蹤不定')}</small>
          <small>信任 ${f}（${tier}）${next ? `　再 ${next[0] - f} 點到「${next[1]}」` : ''}</small>
          <span class="rc-bar"><i style="width:${Math.min(100, f / 1.2)}%"></i></span>
          <small>已解鎖：${un.length ? un.join('、') : '還不熟'}</small></div>`;
      }).join('') : empty('還沒有認識的人。');
    }
    if (a === 'case') {
      const inv = Investigate.info(), out = [];
      out.push(`<div class="ph-card"><b>🔍 ${inv.name}（調查 Lv ${inv.lv}）</b><small>調查經驗 ${s.ixp || 0}${inv.max ? '' : `　下一級還差 ${inv.need - inv.cur}`}</small><span class="rc-bar"><i style="width:${inv.max ? 100 : inv.cur / inv.need * 100}%"></i></span></div>`);
      for (const [id, st] of Object.entries(s.quests.active)) {
        const q = QUESTS[id]; if (!q || !q.clues) continue;
        const got = q.clues.filter(c => st.clues && st.clues[c.id]);
        out.push(`<div class="ph-card"><em class="ph-tag">調查中</em><b>${esc(q.title)}</b><small>線索 ${got.length} / ${q.clues.length}</small>${got.map(c => `<small>・${esc(c.text)}</small>`).join('')}</div>`);
      }
      for (const [l, so] of Object.entries(s.story || {})) {
        if (!STORY[l]) continue;
        const ev = STORY[l].chapters.flatMap(c => [c.evidence, ...((c.choice || {}).options || []).map(o => o.evidence)]).filter(e => e && so.ev && so.ev[e.id]);
        const ch = Object.values(so.choice || {});
        out.push(`<div class="ph-card"><em class="ph-tag">主線</em><b>${esc(MAIN_STORY[l].title)}</b><small>第 ${so.ch} / ${STORY[l].chapters.length} 章　證據 ${ev.length} 件${ch.length ? `　做過 ${ch.length} 個決定` : ''}</small>${ev.map(e => `<small>${e.icon} ${esc(e.name)}：${esc(e.desc)}</small>`).join('')}</div>`);
      }
      const g = s.quests.grade || {}, done = Object.keys(g).filter(id => QUESTS[id]).slice(-12).reverse();
      if (done.length) out.push(`<div class="ph-card"><b>案件評價</b>${done.map(id => `<small><b class="grade g${g[id]}">${g[id]}</b> ${esc(QUESTS[id].title)}${(s.quests.outcome || {})[id] ? `（${Quests.OUTCOME_NAME[s.quests.outcome[id]] || ''}）` : ''}</small>`).join('')}</div>`);
      if (p.notes.length) out.push(`<div class="ph-card"><b>🎙️ 錄音筆記</b>${p.notes.map(n => `<small>${esc(NPCS[n.npc] ? NPCS[n.npc].name : n.npc)}：「${esc(n.text)}」</small>`).join('')}</div>`);
      return out.join('');
    }
    if (a === 'collect') return `<button class="btn primary small" data-record="collect">打開收藏圖鑑</button><button class="btn ghost small" data-record="explore">探索紀錄</button><button class="btn ghost small" data-record="case">案件評價</button>`;
    if (a === 'shop') {
      const t = TaipeiTime.now(), deals = Object.keys(Station3D.SHOPS || {}), deal = deals.length ? deals[(t.day * 3 + t.month) % deals.length] : null;
      const goods = ['magnifier', 'recorder', 'battery', 'firstaid'].map(id => ({ id, it: ITEMS[id] }));
      return `<div class="ph-card"><em class="ph-tag">商店通知</em><p>${deal ? `今天 ${esc(deal)} 站的商店有新貨上架，路過可以看看。` : '今天沒有特別的優惠。'}</p>${Quests.eventsNow().length ? '<p>節慶限定商品販售中！</p>' : ''}</div>
        <h4 class="bag-h">家具</h4>
        ${Object.entries(FURNITURE).map(([id, f]) => { const own = Furniture.has(id), price = Progress.price(f.price); return `<div class="ph-card ph-row"><span class="ph-ic">${f.icon}</span><div><b>${f.name}</b><small>${f.effect}</small></div><button class="btn small ${own ? 'ghost' : 'primary'}" data-buyf="${id}" ${own || s.money < price ? 'disabled' : ''}>${own ? '已擁有' : 'NT$ ' + price}</button></div>`; }).join('')}
        <h4 class="bag-h">調查用品</h4>
        ${goods.map(({ id, it }) => { const price = Progress.price(it.price), owned = it.cat === 'tool' && s.inv[id] > 0; return `<div class="ph-card ph-row"><span class="ph-ic">${it.icon}</span><div><b>${it.name}</b><small>${esc(it.desc)}</small></div><button class="btn small ${owned ? 'ghost' : 'primary'}" data-buyi="${id}" ${owned || s.money < price ? 'disabled' : ''}>${owned ? '已擁有' : 'NT$ ' + price}</button></div>`; }).join('')}`;
    }
    if (a === 'room') {
      const own = Furniture.owned();
      return `<div class="ph-room">${Object.entries(FURNITURE).map(([id, f]) => `<div class="ph-slot${own.includes(id) ? ' got' : ''}">${own.includes(id) ? f.icon : ''}</div>`).join('')}</div>
        ${own.length ? own.map(id => { const f = FURNITURE[id], usable = ['f_coffee', 'f_radio', 'f_plant', 'f_sofa', 'f_shelf'].includes(id); return `<div class="ph-card ph-row"><span class="ph-ic">${f.icon}</span><div><b>${f.name}</b><small>${f.effect}</small></div>${usable ? `<button class="btn small ${Furniture.usedToday(id) ? 'ghost' : 'primary'}" data-usef="${id}" ${Furniture.usedToday(id) ? 'disabled' : ''}>${Furniture.usedToday(id) ? '今天用過了' : '使用'}</button>` : ''}</div>`; }).join('') : empty('房間空空的。到「網購」買幾樣家具吧。')}`;
    }
    return '';
  }
  function onClick(e) {
    const t = e.target.closest('button'); if (!t) return;
    Sound.click();
    if (t.dataset.home) { app = null; return render(); }
    if (t.dataset.app) { app = t.dataset.app; return render(); }
    if (t.dataset.openmap) { close(); return openMap(); }
    if (t.dataset.record) { close(); return Progress.open(t.dataset.record); }
    if (t.dataset.buyf) { Furniture.buy(t.dataset.buyf); return render(); }
    if (t.dataset.buyi) {
      const id = t.dataset.buyi, s = Game.state, price = Progress.price(ITEMS[id].price);
      if (s.money < price) return;
      s.money -= price; s.inv[id] = (s.inv[id] || 0) + 1; saveState(); updateHud();
      toast(`<b>${ITEMS[id].icon} ${ITEMS[id].name} 送到了</b><span>餘額 NT$ ${s.money}</span>`);
      return render();
    }
    if (t.dataset.usef) { const r = Furniture.use(t.dataset.usef); render(); if (r) Dialog.info(FURNITURE[t.dataset.usef].icon + ' ' + FURNITURE[t.dataset.usef].name, r); }
  }
  function init() {
    document.getElementById('phoneBody').onclick = onClick;
    document.getElementById('phoneClose').onclick = close;
    badge();
  }
  return { msg, rumor, addPhoto, note, onQuestDone, deliverFollowups, open, close, init, badge, useHint, useTracker, whereOf };
})();

/* ── 掛到既有系統上 ── */
{
  // 拍照存進手機相簿
  const _photo = Achievements.onPhoto;
  Achievements.onPhoto = ev => { Phone.addPhoto(ev); return _photo(ev); };
  // 收集品、查看設施 → 調查經驗
  const _take = Achievements.take;
  Achievements.take = it => { const r = _take(it); if (it.kind !== 'drop') Investigate.add(Game.state.inv.magnifier > 0 ? 12 : 8, '發現隱藏的東西'); return r; };
  const _ins = Achievements.onInspect;
  Achievements.onInspect = (sp, st) => {
    const ins = (Game.state.col || {}).inspected || {}, first = !(ins[st] && ins[st][sp.kind]);
    const r = _ins(sp, st);
    if (first) Investigate.add(Game.state.inv.magnifier > 0 ? 4 : 2, null, true);
    return r;
  };
  // 和人說話：錄音筆
  const _talk = Progress.onTalk;
  Progress.onTalk = id => {
    const r = _talk(id), n = NPCS[id];
    if (n && Game.state.inv.recorder > 0) {
      const f = Game.state.friends[id] || 0, pool = (f >= 50 && n.knows ? n.knows.map(k => k.text) : []).concat(n.lines || []);
      if (pool.length) Phone.note(id, pool[(Math.random() * pool.length) | 0]);
    }
    return r;
  };
  // 任務完成：調查經驗、每日進度、後續訊息
  const _done = Progress.onQuestDone;
  const IXP = { main: 60, side: 30, secret: 50, event: 20, timed: 25 };
  Progress.onQuestDone = (id, o, k) => {
    const r = _done(id, o, k), q = QUESTS[id];
    if (q && IXP[q.type]) Investigate.add(IXP[q.type] + (['perfect', 'hidden', 'special'].includes(k) ? 20 : 0), `案件「${q.title}」結案`);
    Daily.onDone(id);
    Phone.onQuestDone(id);
    return r;
  };
}
