/* 紀錄：角色等級與能力、城市探索度、案件評價、收藏完成度（含人物檔案、稱號）、區域聲望
 * 能力（每升一級得 1 點，自己分配）：
 *   觀察：到站時感覺得到這一站還藏著幾樣東西
 *   推理：推理時提示線索是否齊全；夠高時線索齊全會標出最合理的答案
 *   人緣：好感漲得比較快、買東西打折
 *   體力：跑得比較快
 * 區域聲望：幫某區居民完成委託就會上升；20 以上 NPC 好感加成、50 以上該區店家打 9 折、100 有稱號
 */
const REGIONS = {
  中正萬華: ['台北車站', '西門', '龍山寺', '中正紀念堂', '台大醫院', '小南門', '北門', '善導寺', '古亭', '台電大樓'],
  中山大同: ['中山', '雙連', '民權西路', '圓山', '大橋頭', '中山國小', '行天宮', '松江南京', '南京復興', '忠孝新生', '台北橋'],
  信義大安: ['市政府', '國父紀念館', '忠孝敦化', '忠孝復興', '大安', '台北101/世貿', '象山', '廣慈/奉天宮', '信義安和', '大安森林公園', '東門', '科技大樓', '六張犁', '永春', '後山埤'],
  士林北投淡水: ['劍潭', '士林', '芝山', '明德', '石牌', '唭哩岸', '奇岩', '北投', '新北投', '復興崗', '忠義', '關渡', '竹圍', '紅樹林', '淡水'],
  松山內湖南港: ['松山', '南京三民', '台北小巨蛋', '中山國中', '松山機場', '大直', '劍南路', '西湖', '港墘', '文德', '內湖', '大湖公園', '葫洲', '東湖', '南港軟體園區', '南港展覽館', '南港', '昆陽'],
  文山新店: ['動物園', '木柵', '萬芳社區', '萬芳醫院', '辛亥', '麟光', '景美', '萬隆', '公館', '新店', '新店區公所', '七張', '小碧潭', '大坪林', '十四張', '秀朗橋'],
  新北: ['板橋', '新埔', '江子翠', '府中', '亞東醫院', '海山', '土城', '永寧', '頂埔', '三重', '菜寮', '先嗇宮', '頭前庄', '新莊', '輔大', '丹鳳', '迴龍', '蘆洲', '三民高中', '徐匯中學', '三和國中', '三重國小', '新北產業園區', '幸福', '板新', '中原', '橋和', '中和', '景安', '景平', '永安市場', '頂溪', '南勢角'],
};
const regionOf = st => Object.keys(REGIONS).find(r => REGIONS[r].includes(st)) || '機場線沿線';

const STATS = [['obs', '觀察', '到站時感覺得到還藏著幾樣東西'], ['ded', '推理', '推理時提示線索，夠高時標出最合理的答案'], ['cha', '人緣', '好感漲得比較快、買東西打折'], ['sta', '體力', '跑得比較快']];
const TITLES = [
  { id: 't_rookie', name: '新手乘客', cond: s => true },
  { id: 't_commuter', name: '通勤達人', cond: s => Economy.levelInfo(s.xp).lv >= 5 },
  { id: 't_detective', name: '城市偵探', cond: s => Object.values(s.quests.grade || {}).filter(g => g === 'S').length >= 5 },
  { id: 't_stamp', name: '集章達人', cond: s => Object.keys((s.col || {}).stamps || {}).length >= 50 },
  { id: 't_friend', name: '大家的朋友', cond: s => Object.values(s.friends).filter(f => f >= 50).length >= 10 },
  { id: 't_explorer', name: '城市探險家', cond: s => Object.keys(s.visited).length >= 60 },
  { id: 't_mist', name: '霧的旅人', cond: s => Quests.isDone('final') },
  ...Object.keys(REGIONS).map(r => ({ id: 't_rep_' + r, name: `${r}的好鄰居`, cond: s => ((s.rep || {})[r] || 0) >= 100 })),
];

const Progress = (() => {
  const S = () => { const s = Game.state; s.stats = s.stats || { obs: 0, ded: 0, cha: 0, sta: 0 }; s.rep = s.rep || {}; s.met = s.met || {}; s.quests.grade = s.quests.grade || {}; if (s.points == null) s.points = Math.max(0, Economy.levelInfo(s.xp || 0).lv - 1); return s; };
  const stat = k => S().stats[k] || 0;

  /* 能力效果 */
  function discount() { const s = S(); const r = (s.rep[regionOf(s.current)] || 0) >= 50 ? .1 : 0; return Math.min(.3, stat('cha') * .01 + r); }
  const price = base => Math.max(1, Math.round(base * (1 - discount())));
  const friendBonus = npcId => Math.floor(stat('cha') / 2) + (((S().rep[regionOf(npcStation(NPCS[npcId] || {}) || S().current)] || 0) >= 20) ? 2 : 0);
  function applySpeed() { World.setSpeedMul && World.setSpeedMul(1 + stat('sta') * .03); }
  function onArrive(stationId) {
    applySpeed();
    if (stat('obs') < 3) return;
    setTimeout(() => {
      const n = (Achievements.count ? Achievements.count() : 0) + (Secrets.count ? Secrets.count() : 0);
      if (n) toast(`<b>👀 觀察 ${stat('obs')}</b><span>你感覺這一站還藏著 ${n} 樣東西。</span>`);
    }, 3200);
  }
  // 推理提示：線索是否齊全；推理 6 以上、線索齊全時標出答案
  function deduceHint(haveAll, nHave, nTotal) {
    if (stat('ded') < 3) return '';
    return `<br><small>🔎 推理 ${stat('ded')}：${haveAll ? '線索已經齊全了。' : `還缺 ${nTotal - nHave} 條線索。`}</small>`;
  }
  const markAnswer = haveAll => stat('ded') >= 6 && haveAll;

  /* 升級：得到能力點 */
  function onLevel(before, after) { S().points += after - before; saveState(); toast(`<b>得到 ${after - before} 點能力點</b><span>到「紀錄 → 角色」分配</span>`); }
  function addPoint(k) { const s = S(); if (s.points <= 0) return; s.points--; s.stats[k] = (s.stats[k] || 0) + 1; saveState(); applySpeed(); }

  /* 區域聲望 */
  function addRep(station, n) {
    if (!station) return;
    const s = S(), r = regionOf(station), before = s.rep[r] || 0;
    s.rep[r] = before + n; saveState();
    for (const t of [20, 50, 100]) if (before < t && s.rep[r] >= t) toast(`<b>🏅 ${r} 聲望 ${t}</b><span>${t === 20 ? '這一帶的人開始認得你了（好感加成）' : t === 50 ? '這一帶的店家給你打 9 折' : `得到稱號「${r}的好鄰居」`}</span>`, 'level');
  }
  // 任務完成：聲望＋案件評價
  function questStation(q) { return (q.giver && NPCS[q.giver] && npcStation(NPCS[q.giver])) || S().current; }
  const GRADE_OF = { perfect: 'S', special: 'S', hidden: 'S', normal: 'B', surprise: 'A', wrong: 'C' };
  function onQuestDone(id, o, k) {
    const s = S(), q = QUESTS[id];
    if (['side', 'timed', 'event', 'daily', 'weekly'].includes(q.type)) addRep(q.type === 'daily' || q.type === 'weekly' ? S().current : questStation(q), q.type === 'side' ? 10 : q.type === 'weekly' ? 20 : q.type === 'daily' ? 4 : 8);
    if (q.type === 'secret') addRep(s.current, 5);
    let g = null;
    if (q.type === 'main' && q.line && STORY[q.line]) { const so = (s.story || {})[q.line] || {}; g = so.ending === 'true' ? 'S' : so.ending === 'normal' ? 'B' : so.ending === 'bad' ? 'C' : 'B'; }
    else if (k) {
      g = GRADE_OF[k] || 'A';                                                        // 自訂名稱的「選擇不同」結局算 A
      const hurt = o && o.reward && Object.values(o.reward.friend || {}).some(v => v < 0);
      if (hurt) g = { S: 'A', A: 'B', B: 'C', C: 'C' }[g];                           // 有人因此受傷：降一級
    }
    if (g === 'S' && (q.diff === 'hard' || q.type === 'main')) Game.reward({ gold: q.type === 'main' ? 2 : 1 }, '特殊案件獎勵');
    if (g) { s.quests.grade[id] = g; saveState(); setTimeout(() => toast(`<b>案件評價：${g}</b><span>${q.title}</span>`, g === 'S' ? 'level' : ''), 1400); }
  }
  function onTalk(npcId) { const s = S(); if (NPCS[npcId] && !s.met[npcId]) { s.met[npcId] = TaipeiTime.date(); saveState(); Life.log(`認識了${NPCS[npcId].name}（${NPCS[npcId].role || ''}）`); } }

  /* 數值 */
  function exploration() {
    const s = S(), ins = (s.col || {}).inspected || {}, all = Object.keys(STATIONS);
    const rows = Object.entries(REGIONS).map(([r, list]) => {
      const ids = list.filter(x => STATIONS[x]);
      const v = ids.filter(x => s.visited[x]).length, i = ids.filter(x => ins[x] && Object.keys(ins[x]).length >= 5).length;
      return { r, v, i, n: ids.length, pct: Math.round((v / ids.length * .7 + i / ids.length * .3) * 100) };
    });
    const v = all.filter(x => s.visited[x]).length, i = all.filter(x => ins[x] && Object.keys(ins[x]).length >= 5).length;
    return { rows, pct: Math.round((v / all.length * .7 + i / all.length * .3) * 100), v, n: all.length, found: Object.keys(s.flags.found || {}).length };
  }
  function collection() {
    const s = S(), c = k => Object.keys((s.col || {})[k] || {}).length;
    const named = Object.keys(NPCS).filter(id => !['eventstaff'].includes(id) && !NPCS[id].event);
    const parts = [
      ['成就', Object.keys(s.ach || {}).length, ACHIEVEMENTS.length],
      ['紀念章', c('stamps'), Object.keys(STATIONS).length],
      ['舊車票', c('ticket'), COLLECT.ticket.stations.length],
      ['照片碎片', c('photo'), COLLECT.photo.stations.length],
      ['人物檔案', named.filter(id => s.met[id]).length, named.length],
      ['路線收藏', Object.keys(s.items).length, LINE_ORDER.length],
      ['海報圖鑑', c('posters'), Station3D.ADS.length],
      ['列車圖鑑', c('trains'), Object.keys(LIVERIES).length],
    ];
    const pct = Math.round(parts.reduce((a, [, h, n]) => a + Math.min(1, h / n), 0) / parts.length * 100);
    return { parts, pct };
  }
  const titles = () => TITLES.filter(t => { try { return t.cond(S()); } catch (e) { return false; } });
  function titleName() { const s = S(), t = TITLES.find(t => t.id === s.title); let ok = false; try { ok = !!t && t.cond(s); } catch (e) { /* 條件壞掉 */ } return ok ? t.name : '新手乘客'; }

  /* 畫面 */
  let tab = 'char';
  function open(t) { if (t) tab = t; render(); document.getElementById('record').hidden = false; }
  function render() {
    const s = S(), lv = Economy.levelInfo(s.xp || 0), el = document.getElementById('recordBody');
    const tabs = [['char', '角色'], ['life', '生活'], ['explore', '探索'], ['case', '評價'], ['collect', '收藏'], ['rep', '聲望'], ['people', '人物']];
    let body = '';
    if (tab === 'char') {
      body = `<div class="rc-hero"><b>${esc(CHARACTERS[s.char].name)}</b><span class="rc-title">「${esc(titleName())}」</span>
        <p>Lv ${lv.lv}　調查經驗 ${lv.cur} / ${lv.need}　能力點：<b>${s.points}</b></p></div>
        <ul class="rc-stats">${STATS.map(([k, n, d]) => `<li><b>${n}</b><span class="rc-bar"><i style="width:${Math.min(100, stat(k) * 10)}%"></i></span><em>${stat(k)}</em>${s.points > 0 ? `<button class="btn small" data-pt="${k}">＋</button>` : ''}<small>${d}</small></li>`).join('')}</ul>
        <h4 class="bag-h">稱號</h4>${typeof Titles !== 'undefined' ? Titles.html(s.title || 't_rookie') : `<div class="rc-titles">${titles().map(t => `<button class="wd-chip" data-title="${t.id}" aria-pressed="${titleName() === t.name}">${esc(t.name)}</button>`).join('')}</div>`}`;
    }
    if (tab === 'life') body = Life.html();
    if (tab === 'explore') {
      const e = exploration();
      body = `<div class="rc-big">城市探索度 <b>${e.pct}%</b><small>去過 ${e.v} / ${e.n} 站　發現 ${e.found} 個秘密</small></div>
        <ul class="rc-rows">${e.rows.map(r => `<li><b>${r.r}</b><span class="rc-bar"><i style="width:${r.pct}%"></i></span><em>${r.pct}%</em><small>去過 ${r.v}/${r.n} 站・仔細調查過 ${r.i} 站</small></li>`).join('')}</ul>`;
    }
    if (tab === 'case') {
      const g = s.quests.grade, ids = Object.keys(g);
      const cnt = l => ids.filter(id => g[id] === l).length;
      body = `<div class="rc-big">案件評價<small>S ${cnt('S')}　A ${cnt('A')}　B ${cnt('B')}　C ${cnt('C')}</small></div>
        <p class="rc-note">找齊證據、推理正確、沒有讓相關的人受傷，評價就會比較高。</p>
        ${ids.length ? `<ul class="rc-rows">${ids.map(id => `<li><b class="grade g${g[id]}">${g[id]}</b><span>${esc(QUESTS[id] ? QUESTS[id].title : id)}</span></li>`).join('')}</ul>` : '<p class="empty-q">還沒有完成的案件。</p>'}`;
    }
    if (tab === 'collect') {
      const c = collection();
      const tr = (s.col || {}).trains || {};
      body = `<div class="rc-big">收藏完成度 <b>${c.pct}%</b></div>
        <ul class="rc-rows">${c.parts.map(([n, h, t]) => `<li><b>${n}</b><span class="rc-bar"><i style="width:${Math.min(100, h / t * 100)}%"></i></span><em>${h} / ${t}</em></li>`).join('')}</ul>
        <h4 class="bag-h">🚆 列車圖鑑</h4><div class="rc-titles">${Object.keys(LIVERIES).map(id => tr[id] ? `<span class="wd-chip" aria-pressed="${!!tr[id].rode}" title="${tr[id].rode ? '搭乘過' : '看過'}">${esc(LIVERIES[id].name)}</span>` : '<span class="wd-chip">？？？</span>').join('')}</div>
        <p class="rc-note">亮起來的是搭乘過的列車。</p>${typeof ArtInstall !== 'undefined' ? ArtInstall.collectHtml() : ''}${typeof Festival !== 'undefined' ? Festival.collectHtml() : ''}`;
    }
    if (tab === 'rep') {
      body = `<p class="rc-note">幫某一區的居民完成委託，聲望就會上升。20：好感加成　50：店家 9 折　100：稱號</p>
        <ul class="rc-rows">${Object.keys(REGIONS).map(r => { const v = s.rep[r] || 0; return `<li><b>${r}</b><span class="rc-bar"><i style="width:${Math.min(100, v)}%"></i></span><em>${v}</em><small>${v >= 100 ? '好鄰居' : v >= 50 ? '受歡迎' : v >= 20 ? '認識' : '陌生'}</small></li>`; }).join('')}</ul>`;
    }
    if (tab === 'people') {
      const ids = Object.keys(s.met).filter(id => NPCS[id]);
      body = ids.length ? `<ul class="rc-people">${ids.map(id => {
        const n = NPCS[id], f = s.friends[id] || 0, where = n.station || (n.rotate ? '每天在不同的站' : n.schedule ? n.schedule.map(([a, b, st]) => `${a}–${b} 點 ${st}`).join('、') : n.routes ? '每天的通勤路線不同' : '');
        return `<li><b>${esc(n.name)}</b><small>${esc(n.role || '')}　${esc(where)}${n.hours ? `　${n.hours.map(([a, b]) => `${a}–${b} 點`).join('、')}` : ''}</small>
          <p>好感 ${f}（${friendTier(f)}）${f >= 20 && n.likes && n.likes.length ? `　喜歡：${n.likes.map(i => ITEMS[i] ? ITEMS[i].name : i).join('、')}` : '　（再熟一點才知道他喜歡什麼）'}</p>
          ${f >= 50 && n.rumors && n.rumors[0] ? `<p class="rc-note">「${esc(n.rumors[0])}」</p>` : ''}
          ${(s.hiddenProfiles || {})[id] ? `<p class="rc-note">🔒 隱藏檔案：${esc(s.hiddenProfiles[id])}</p>` : ''}</li>`;
      }).join('')}</ul>` : '<p class="empty-q">還沒有認識任何人。</p>';
    }
    el.innerHTML = `<nav class="rc-tabs">${tabs.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</nav>${body}`;
    el.onclick = e => {
      const t = e.target.closest('[data-tab]'), pt = e.target.closest('[data-pt]'), ti = e.target.closest('[data-title]');
      if (t) { tab = t.dataset.tab; render(); }
      if (pt) { addPoint(pt.dataset.pt); Sound.click(); render(); }
      if (ti) { S().title = ti.dataset.title; saveState(); Sound.click(); toast(`<b>🎖️ 換上稱號「${esc(titleName())}」</b>`); updateHud(); render(); }
    };
  }
  return { price, friendBonus, applySpeed, onArrive, deduceHint, markAnswer, onLevel, addRep, onQuestDone, onTalk, open, titleName, regionOf };
})();

/* ── 支線難度與獎勵（玩家看不到難度，只會感覺到報酬不同） ──
 * 普通支線（簡單、普通）30–100＋少量經驗、消耗品
 * 跨站支線（進階、困難）150–350，黃金 0–1＋收藏品、NPC 信任
 * 多階段人物支線 300–800，黃金 0–2＋特殊對話、專屬紀念品（每階段另有 80–250）
 */
const QUEST_DIFF = {
  easy: ['sq_card', 'sq_earphone', 'sq_guide', 'sq_translate', 'sq_sort', 'sq_clean', 'wallet', 'umbrella', 'cat', 'sound'],
  normal: ['sq_docs', 'sq_route', 'sq_kid', 'sq_phone', 'sq_store', 'sq_cafe', 'sq_repair', 'sq_restock', 'sq_photojob', 'delivery', 'ring', 'letter', 'graffiti', 'busker', 'tourist', 'sq_lostdocs', 'sq_lostdocs_fix', 'sq_contact', 't_coffee', 't_breakfast', 't_lunch', 't_flower', 't_sunset', 't_school'],
  adv: ['sq_wallet2', 'sq_multi', 'sq_wrong', 'sq_exchange', 'sq_schedule', 'sq_parcel', 'sq_owner', 'sq_rumor', 'teacher', 'sametrain', 'couple', 'lategirl', 'sq_hiddenmsg', 'sq_mystery', 't_patrol'],
  hard: ['sq_who', 'sq_misunderstood', 'sq_liar', 'sq_impossible', 'sq_employee', 'sq_stalker'],
  story: ['sq_letters', 'sq_friend', 'sq_leave', 'sq_photoperson', 'sq_reconcile', 'sq_nohome', 'sq_musician', 'sq_nightwish', 'sq_apology', 'bench', 'notes'],
};
const DIFF_RANGE = { easy: [30, 60, 30, 50], normal: [60, 100, 50, 90], adv: [150, 280, 110, 180], hard: [250, 350, 160, 260], story: [300, 800, 200, 400] };
const DIFF_IXP = { easy: 10, normal: 15, adv: 30, hard: 45, story: 60 };
const SIDE_SUPPLY = ['onigiri', 'greentea', 'battery', 'hint'];
// 人物故事完結的專屬稱號
const STORY_TITLES = { sq_musician: '最忠實的聽眾', sq_leave: '帶走台北的人', sq_letters: '三十年的信差', sq_friend: '找得到人的人', sq_nightwish: '看過日出的夜班', sq_photoperson: '記得秀蔅的人', sq_nohome: '陪人回家的人', bench: '長椅上的約定' };
(() => {
  const factor = k => ({ perfect: 1, special: 1, hidden: 1, surprise: .8, normal: .5, wrong: 0 }[k] ?? .8);
  for (const [diff, ids] of Object.entries(QUEST_DIFF)) for (const id of ids) {
    const q = QUESTS[id]; if (!q) continue;
    const [m0, m1, x0, x1] = DIFF_RANGE[diff];
    q.diff = diff;
    const fix = (r, f) => {
      r = r || {};
      r.money = f === 0 ? Math.round(m0 * .3) : Math.round(m0 + (m1 - m0) * f);
      r.xp = f === 0 ? Math.round(x0 * .3) : Math.round(x0 + (x1 - x0) * f);
      if ((diff === 'hard' || diff === 'adv') && f === 1 && q.giver) r.friend = { ...(r.friend || {}), [q.giver]: ((r.friend || {})[q.giver] || 0) + (diff === 'hard' ? 10 : 5) };   // 跨站任務：NPC 信任
      if (diff === 'hard' && f === 1) r.gold = 1;
      if (diff === 'story') r.gold = f === 1 ? 2 : f >= .8 ? 1 : 0;
      if (diff === 'normal' && f === 1) { const it = SIDE_SUPPLY[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % SIDE_SUPPLY.length]; r.items = { ...(r.items || {}), [it]: 1 }; }   // 消耗品
      r.ixp = f === 0 ? 0 : Math.round(DIFF_IXP[diff] * Math.max(.5, f));
      return r;
    };
    if (q.outcomes) for (const [k, o] of Object.entries(q.outcomes)) o.reward = fix(o.reward, Object.keys(q.outcomes).length === 1 ? 1 : factor(k));
    else q.reward = fix(q.reward, 1);
    if (diff === 'story') q.stepReward = [80, 250];   // 人物故事：每完成一個階段就有獎勵
  }
  for (const [id, name] of Object.entries(STORY_TITLES)) TITLES.push({ id: 't_story_' + id, name, cond: s => Quests.isDone(id) });
})();

/* ── 主線報酬（依階段） ── */
const MAIN_REWARD = { evidence: [200, 110], choice: [200, 110], rescue: [220, 120], hidden: [220, 120], chase: [260, 130], escape: [260, 130], deduce: [400, 200] };
for (const l of Object.keys(MAIN_STORY)) { QUESTS['main_' + l].reward = { money: 800, xp: 350, gold: 1, ixp: 120, items: { ['casefile_' + l]: 1 }, friend: { xiuyu: 25 } }; }
Object.assign(ITEMS, Object.fromEntries(Object.keys(MAIN_STORY).map(l => ['casefile_' + l, { name: `案件卷宗：${MAIN_STORY[l].title}`, desc: `${LINES[l].zh}主線的完整紀錄。獨一無二的收藏。`, icon: '🗂️' }])));
ITEMS.notebook = { name: '調查筆記本', desc: '秀蔅送的。證據、線索和人物都會記在「紀錄」裡。', icon: '📓' };
QUESTS.final.reward = { money: 1000, xp: 700, gold: 2, ixp: 200, wear: 'top_mistcoat', friend: { xiuyu: 30 } };
OUTFITS.top_mistcoat = { slot: 'top', name: '秀蔅的白色長大衣', color: '#f6f4ee', pattern: 'knit', event: 'final' };
