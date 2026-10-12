/* 調查經驗、背包分類與調查工具、家具、每日委託、每週案件、委託所的林姐
 * 調查經驗：和角色經驗分開。找到證據、線索、收集品、查看設施、完成案件都會增加；
 *   調查等級越高，委託的報酬越多，也會得到稱號。
 * 每日委託：每天 3 件（依日期產生），完成可以在林姐那裡領「今日全勤」獎勵；連續 7 天另有黃金。
 * 每週案件：每週一件，報酬較高，附罕見道具或霧之碎片；碎片可以向林姐兌換限定外觀與稱號。
 * 家具：在手機的「網購」買，擺在「我的房間」，每樣都有一點小效果。
 */

/* ── 互動選單的擴充點：(npc) => [按鈕] ── */
const NPC_MENU_HOOKS = [];

/* ── 調查經驗 ── */
const INV_RANKS = [[0, '見習調查員'], [150, '調查員'], [450, '正式調查員'], [1000, '資深調查員'], [2000, '城市偵探'], [4000, '王牌偵探'], [7000, '霧的偵探']];
const Investigate = (() => {
  const S = () => { const s = Game.state; if (s.ixp == null) s.ixp = 0; return s; };
  function info(ixp = S().ixp) {
    let lv = 0; for (let i = 0; i < INV_RANKS.length; i++) if (ixp >= INV_RANKS[i][0]) lv = i;
    const next = INV_RANKS[lv + 1];
    return { lv: lv + 1, name: INV_RANKS[lv][1], cur: ixp - INV_RANKS[lv][0], need: next ? next[0] - INV_RANKS[lv][0] : 0, max: !next };
  }
  // quiet：不跳提示（由呼叫的地方自己顯示）
  function add(n, why, quiet) {
    if (!n) return 0;
    const s = S(), before = info().lv;
    if (Furniture.has('f_lamp')) n = Math.ceil(n * 1.1);
    s.ixp += n; saveState();
    if (!quiet && why) toast(`<b>🔍 調查經驗 +${n}</b><span>${why}</span>`);
    const after = info();
    if (after.lv > before) setTimeout(() => {
      toast(`<b>🔍 調查等級 ${after.lv}：${after.name}</b><span>委託報酬提高了</span>`, 'level'); Sound.itemGet();
      if (typeof Phone !== 'undefined') Phone.msg('lin', `恭喜升上「${after.name}」！之後的委託報酬我會幫你多爭取一點。`);
    }, 700);
    return n;
  }
  const bonus = () => 1 + (info().lv - 1) * .08;   // 委託報酬加成
  return { info, add, bonus };
})();
TITLES.push(...INV_RANKS.slice(1).map(([, name], i) => ({ id: 't_inv' + (i + 2), name, cond: s => Investigate.info(s.ixp || 0).lv >= i + 2 })));

/* ── 調查工具與消耗品 ── */
Object.assign(ITEMS, {
  magnifier: { name: '放大鏡', desc: '查看設施和收集東西時，多得一點調查經驗。帶著就有效。', icon: '🔍', cat: 'tool', price: 450, shop: true },
  recorder: { name: '錄音筆', desc: '和有名字的人聊天時，會把重要的話記進手機的「案件筆記」。', icon: '🎙️', cat: 'tool', price: 980, shop: true },
  tracker: { name: '追蹤器', desc: '使用時消耗一顆電池，告訴你任務要找的人現在在哪一站。', icon: '📍', cat: 'tool' },
  battery: { name: '電池', desc: '追蹤器用的。', icon: '🔋', cat: 'use', price: 40, shop: true },
  hint: { name: '提示券', desc: '使用後，告訴你每個進行中的任務下一步該去哪裡。', icon: '🎟️', cat: 'use' },
  firstaid: { name: '急救包', desc: '救援類的劇情裡，就算選錯也能讓對方平安（會自動使用）。', icon: '🩹', cat: 'use', price: 150, shop: true },
  fragment: { name: '霧之碎片', desc: '每週案件的報酬。拿去委託所找林姐，可以換限定的東西。', icon: '🧩', cat: 'col' },
  lintea: { name: '林姐的烏龍茶', desc: '委託所的招待，喝了精神很好。', icon: '🍵', eat: '喝', cat: 'use' },
});
const TOOL_IDS = ['camera', 'detector', 'notebook', 'magnifier', 'recorder', 'tracker', 'mistlamp', 'mistticket', 'mistmap'];
const ITEM_CATS = [['tool', '🔧 工具'], ['use', '🥤 消耗品'], ['col', '🗃️ 收藏品'], ['story', '📜 劇情物品']];
function itemCat(id) {
  const it = ITEMS[id] || {};
  if (it.cat) return it.cat;
  if (TOOL_IDS.includes(id)) return 'tool';
  if (it.eat) return 'use';
  if (/^(casefile_|ch_)/.test(id) || ['oldticket', 'branchstamp', 'firstticket', 'signmodel', 'portrait', 'postcard', 'easycard', 'keychain', 'plush', 'towel', 'amulet', 'flag'].includes(id)) return 'col';
  if (it.shop) return 'col';   // 伴手禮
  return 'story';
}

/* ── 家具（手機 → 網購；手機 → 我的房間） ── */
const FURNITURE = {
  f_lamp: { name: '閱讀檯燈', icon: '💡', price: 890, effect: '調查經驗多 10%' },
  f_board: { name: '案件軟木板', icon: '📌', price: 990, effect: '案件筆記會標出每個任務下一步的地點' },
  f_coffee: { name: '手沖咖啡組', icon: '☕', price: 1190, effect: '每天可以沖一杯咖啡帶出門' },
  f_radio: { name: '老收音機', icon: '📻', price: 690, effect: '每天可以聽一則城市傳聞' },
  f_plant: { name: '小盆栽', icon: '🪴', price: 390, effect: '每天澆水，心情好（經驗 +10）' },
  f_sofa: { name: '懶骨頭沙發', icon: '🛋️', price: 1590, effect: '每天休息一次（經驗 +30）' },
  f_shelf: { name: '書架', icon: '📚', price: 1290, effect: '每天整理一次筆記（調查經驗 +15）' },
  f_poster: { name: '捷運路網海報', icon: '🗺️', price: 290, effect: '純裝飾。看起來很懂捷運。' },
};
const Furniture = (() => {
  const S = () => { const s = Game.state; s.room = s.room || { own: {}, used: {} }; return s.room; };
  const has = id => !!(Game.state && S().own[id]);
  function buy(id) {
    const f = FURNITURE[id], s = Game.state; if (!f || has(id) || s.money < f.price) return false;
    s.money -= f.price; S().own[id] = TaipeiTime.date(); saveState(); updateHud();
    Sound.itemGet(); toast(`<b>${f.icon} ${f.name} 送到了</b><span>擺在「手機 → 我的房間」</span>`);
    if (typeof Life !== 'undefined') Life.log(`買了家具：${f.name}`);
    return true;
  }
  const usedToday = id => S().used[id] === TaipeiTime.date();
  // 房間裡每天能做的事
  function use(id) {
    if (!has(id) || usedToday(id)) return null;
    S().used[id] = TaipeiTime.date();
    const s = Game.state;
    if (id === 'f_coffee') { s.inv.coffee = (s.inv.coffee || 0) + 1; saveState(); updateHud(); return '沖了一杯咖啡，裝進隨行杯帶著走。（☕ 美式咖啡 +1）'; }
    if (id === 'f_radio') { const r = RUMORS[(Math.random() * RUMORS.length) | 0]; if (typeof Phone !== 'undefined') Phone.rumor(r.replace('今日傳聞：', ''), '收音機'); saveState(); return '收音機沙沙地響：<br>' + r; }
    if (id === 'f_plant') { Game.reward({ xp: 10 }); return '幫盆栽澆了水。新的葉子長出來了。'; }
    if (id === 'f_sofa') { Game.reward({ xp: 30 }); return '在懶骨頭上躺了一下，整個人恢復了。'; }
    if (id === 'f_shelf') { Investigate.add(15, '整理筆記'); return '把這幾天的筆記整理好，放上書架。'; }
    saveState(); return null;
  }
  return { has, buy, use, usedToday, owned: () => Object.keys(S().own) };
})();

/* ── 委託所的林姐 ──
 * 林姐沿用 id 'lin'（每日委託、手機聯絡人都用它），原本 npcs.js 的上班族林先生改用 'linsir'，
 * 否則「遺失的皮夾」接不到、也交不回去。 */
if (NPCS.lin && NPCS.lin.name === '林先生') NPCS.linsir = NPCS.lin;
Object.assign(NPCS, {
  lin: {
    name: '林姐', role: '城市委託所', station: '台北車站', spot: 'concourse', hours: [[7, 23]], speed: 0,
    look: { girl: true, skin: '#e8bca4', hair: 'bob', hairColor: '#3a2418', top: '#3a4a5a', pattern: 'shirt', accent: '#d8a830', bottom: '#2a2e36', glasses: true, bag: 'tote', bagColor: '#8a6a4a' },
    gives: ['daily_0', 'daily_1', 'daily_2', 'weekly'], likes: ['coffee', 'pineapplecake'],
    lines: ['委託所今天也很忙。', '每天都有小事要人幫忙，報酬不多，但很穩定。', '每週會有一件比較麻煩的案子，報酬好很多。', '我在這裡二十年了，台北的大小事都會經過這張桌子。'],
    knows: [{ text: '我以前也是調查員。有一次追一個案子追到末班車之後……後來就不跑現場了。' }],
    rumors: ['有人來委託找「霧裡的車站」，我說我們不接這種案子。可是他留下的訂金是一枚很舊的代幣。'],
  },
});

/* ── 每日委託、每週案件 ── */
const Daily = (() => {
  const S = () => { const s = Game.state; s.daily = s.daily || { day: '', n: 0, claimed: false, streak: 0, last: '' }; s.weekly = s.weekly || { week: '', claimed: false }; return s; };
  // 依日期產生的亂數
  const rng = seed => { let x = [...seed].reduce((a, c) => (a * 131 + c.charCodeAt(0)) >>> 0, 2166136261); return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const pick = (r, a) => a[(r() * a.length) | 0];
  const ymd = t => `${t.year}-${t.month}-${t.day}`;
  const dayKey = () => ymd(TaipeiTime.now());
  function weekKey() {
    const t = TaipeiTime.now(), d = new Date(Date.UTC(t.year, t.month - 1, t.day)), wd = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - wd);
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  }
  const allStations = () => [...new Set(LINE_ORDER.flatMap(l => Puzzles.stations(l)))].filter(st => st !== '小碧潭');
  // 可以傳話的人：固定在某一站、白天都在
  function messengers() {
    return Object.entries(NPCS).filter(([id, d]) => typeof d.station === 'string' && STATIONS[d.station] && !d.onlyQuest && !d.onlyFlag && !d.event && !d.schedule && !d.rotate && !d.routes
      && !['xiuyu', 'ferryman', 'lin', 'wushang'].includes(id) && (!d.hours || d.hours.some(([a, b]) => a <= 10 && b >= 19)));
  }
  const SPOT_TASK = { ticket: '檢查售票機有沒有故障', elevator: '確認電梯運作正常', timetable: '核對時刻表有沒有更新', areamap: '看周邊地圖有沒有貼錯', notice: '幫忙看公告欄上的新公告', aed: '確認 AED 的位置標示' };
  const DRINKS = ['water', 'greentea', 'sportdrink'];
  // 一件每日委託
  function makeDaily(r, i, visited, kinds) {
    const sts = allStations(), known = sts.filter(s => visited[s]), fresh = sts.filter(s => !visited[s]);
    const st = pick(r, i === 2 && fresh.length ? fresh : known.length ? known : sts);
    const kind = kinds[i];
    const base = { type: 'daily', giver: 'lin', daily: true };
    if (kind === 'inspect') { const sp = pick(r, Object.keys(SPOT_TASK)); return { ...base, title: `${st}：${SPOT_TASK[sp]}`, desc: `站務那邊人手不夠，請你去${st}${SPOT_TASK[sp]}。`, steps: [{ text: `到${st}${SPOT_TASK[sp]}`, goal: { kind: 'inspect', spot: sp, station: st } }] }; }
    if (kind === 'talk') { const [nid, d] = pick(r, messengers()); return { ...base, title: `傳話給${d.name}`, desc: `有人留了口信給${d.name}，他通常在${d.station}。`, steps: [{ text: `到${d.station}把口信帶給${d.name}`, goal: { kind: 'talk', npc: nid } }] }; }
    if (kind === 'ride') { const l = pick(r, LINE_ORDER); return { ...base, title: `${LINES[l].zh}乘車回報`, desc: `幫忙搭一趟${LINES[l].zh}，回報車廂狀況。`, steps: [{ text: `搭一趟${LINES[l].zh}（坐到任何一站）`, goal: { kind: 'ride', line: l } }] }; }
    if (kind === 'buy') { const it = pick(r, DRINKS); return { ...base, title: `補給：${ITEMS[it].name}`, desc: `委託所的冰箱空了。隨便哪一站的販賣機買一瓶${ITEMS[it].name}，再到${st}看看。`, steps: [{ text: `在販賣機買一瓶${ITEMS[it].name}`, goal: { kind: 'buy', item: it } }, { text: `到${st}`, goal: { kind: 'reach', station: st } }] }; }
    return { ...base, title: `${st}人潮觀察`, desc: `委託所在做人潮統計，請你到${st}走一趟。`, steps: [{ text: `到${st}`, goal: { kind: 'reach', station: st } }] };
  }
  // 每週案件：從幾種案子裡挑一種，地點與證人依週次決定
  const CASES = [
    { title: '末班車的遺失物', desc: '有人在末班車上掉了一個公事包，裡面有重要的文件。', steps: (a, b, w) => [[`到${a}問問看有沒有人看到`, { kind: 'reach', station: a }], [`查看${a}的公告欄`, { kind: 'inspect', spot: 'notice', station: a }], [`找${w.name}（${w.station}）確認`, { kind: 'talk', npc: w.id }], [`搭到${b}，公事包可能被送去那裡`, { kind: 'reach', station: b }]] },
    { title: '售票機的怪聲', desc: '好幾站的售票機半夜會發出怪聲，站務找不出原因。', steps: (a, b, w) => [[`檢查${a}的售票機`, { kind: 'inspect', spot: 'ticket', station: a }], [`檢查${b}的售票機`, { kind: 'inspect', spot: 'ticket', station: b }], [`問${w.name}（${w.station}）有沒有聽過`, { kind: 'talk', npc: w.id }]] },
    { title: '消失的時刻表', desc: '有人一直把車站的時刻表換成一張很舊的版本。', steps: (a, b, w) => [[`核對${a}的時刻表`, { kind: 'inspect', spot: 'timetable', station: a }], [`核對${b}的時刻表`, { kind: 'inspect', spot: 'timetable', station: b }], [`把舊時刻表拿給${w.name}（${w.station}）看`, { kind: 'talk', npc: w.id }], ['回台北車站向林姐回報', { kind: 'talk', npc: 'lin' }]] },
    { title: '貼錯的地圖', desc: '周邊地圖上多了一個不存在的出口。', steps: (a, b, w) => [[`查看${a}的周邊地圖`, { kind: 'inspect', spot: 'areamap', station: a }], [`到${b}找那個出口`, { kind: 'reach', station: b }], [`問${w.name}（${w.station}）`, { kind: 'talk', npc: w.id }]] },
    { title: '誰在搭最遠的車', desc: '有一張悠遊卡每天從一端坐到另一端，卡的主人卻從來沒有出站。', steps: (a, b, w) => [[`搭到${a}`, { kind: 'reach', station: a }], [`再搭到${b}`, { kind: 'reach', station: b }], [`把紀錄拿給${w.name}（${w.station}）看`, { kind: 'talk', npc: w.id }], ['回台北車站向林姐回報', { kind: 'talk', npc: 'lin' }]] },
  ];
  const RARE = ['tracker', 'magnifier', 'recorder', 'detector', 'firstaid', 'hint'];
  function makeWeekly(wk) {
    const r = rng('w' + wk), c = pick(r, CASES), sts = allStations();
    const a = pick(r, sts); let b = pick(r, sts); if (b === a) b = sts[(sts.indexOf(a) + 7) % sts.length];
    const [wid, wd] = pick(r, messengers());
    const rare = pick(r, RARE);
    const m = Investigate.bonus();
    return {
      type: 'weekly', giver: 'lin', title: `每週案件：${c.title}`, desc: c.desc + '<br><small>報酬：較高的報酬、霧之碎片、罕見道具。</small>',
      steps: c.steps(a, b, { id: wid, name: wd.name, station: wd.station }).map(([text, goal]) => ({ text, goal })),
      reward: { money: Math.round(1500 * m), xp: 500, ixp: 120, gold: 2, items: { fragment: 1, [rare]: 1 } },
    };
  }
  // 換日／換週：重新產生委託，舊的進行中委託作廢
  function refresh() {
    if (!Game.state) return;
    const s = S(), q = s.quests, day = dayKey(), wk = weekKey();
    if (s.daily.day !== day) {
      if (s.daily.day) for (const id of ['daily_0', 'daily_1', 'daily_2']) { delete q.active[id]; delete q.done[id]; if (q.outcome) delete q.outcome[id]; if (q.grade) delete q.grade[id]; }
      const had = !!s.daily.day;
      s.daily = { day, n: 0, claimed: false, streak: s.daily.streak || 0, last: s.daily.last || '' };
      if (typeof Phone !== 'undefined') Phone.msg('lin', had ? '今天的委託貼出來了，有空來台北車站大廳找我。' : '你好，我是城市委託所的林姐，在台北車站大廳。每天都有小委託，每週有一件大案子，有空來找我。', !had);
    }
    if (s.weekly.week !== wk) {
      if (s.weekly.week) { delete q.active.weekly; delete q.done.weekly; if (q.grade) delete q.grade.weekly; }
      s.weekly = { week: wk, claimed: false };
    }
    // 今天的委託產生一次就存起來（不會因為之後去過哪些站而改變）
    if (!s.daily.defs) {
      const r = rng('d' + day), m = Investigate.bonus(), kinds = ['inspect', 'talk', 'ride', 'buy', 'reach'];
      for (let i = kinds.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
      s.daily.defs = [0, 1, 2].map(i => { const d = makeDaily(r, i, s.visited || {}, kinds); d.reward = { money: Math.round((140 + i * 40) * m), xp: 60 + i * 20, ixp: 15 }; return d; });
    }
    if (!s.weekly.def) s.weekly.def = makeWeekly(wk);
    s.daily.defs.forEach((d, i) => { QUESTS['daily_' + i] = d; });
    QUESTS.weekly = s.weekly.def;
    saveState();
  }
  function onDone(id) {
    if (/^daily_/.test(id)) {
      const s = S(); s.daily.n++; saveState();
      if (s.daily.n >= 3) setTimeout(() => toast('<b>今日委託全部完成</b><span>去台北車站找林姐領全勤獎勵</span>', 'level'), 1500);
    }
  }
  // 林姐的選單
  function claimDaily() {
    const s = S();
    if (s.daily.claimed || s.daily.n < 3) return;
    const t = TaipeiTime.now(), y = new Date(Date.UTC(t.year, t.month - 1, t.day) - 864e5), yk = `${y.getUTCFullYear()}-${y.getUTCMonth() + 1}-${y.getUTCDate()}`;
    s.daily.streak = s.daily.last === yk ? (s.daily.streak || 0) + 1 : 1;
    s.daily.last = s.daily.day; s.daily.claimed = true;
    const seven = s.daily.streak % 7 === 0;
    Game.reward({ money: Math.round(300 * Investigate.bonus()), ixp: 20, items: { [['hint', 'battery', 'lintea'][s.daily.streak % 3]]: 1 }, gold: seven ? 1 : 0 }, `今日全勤（連續 ${s.daily.streak} 天）${seven ? '——一週全勤！' : ''}`);
  }
  const FRAG_SHOP = [
    { n: 3, wear: 'top_trench', label: '卡其偵探風衣' },
    { n: 5, wear: 'acc_detective', label: '偵探帽', title: 't_ace' },
    { n: 2, items: { tracker: 1, battery: 3 }, label: '追蹤器＋電池 ×3' },
    { n: 1, items: { hint: 2 }, label: '提示券 ×2' },
  ];
  function fragShop() {
    const s = Game.state, have = s.inv.fragment || 0;
    Dialog.show({ name: '林姐', role: `霧之碎片 🧩 ${have}` }, '「碎片都是那些案子裡留下來的。拿來換點有用的東西吧。」', FRAG_SHOP.map(g => {
      const owned = g.wear && s.wardrobe.own[g.wear];
      return { label: `${g.label}　🧩 ${g.n}${owned ? '（已擁有）' : ''}`, disabled: owned || have < g.n, run: () => {
        s.inv.fragment -= g.n; saveState();
        Game.reward({ wear: g.wear, items: g.items, title: g.title }, `用霧之碎片換了 ${g.label}`); fragShop();
      } };
    }).concat([{ label: '離開', run: () => Dialog.close() }]));
  }
  NPC_MENU_HOOKS.push(npc => {
    if (npc.id !== 'lin') return [];
    const s = S(), out = [];
    out.push({ label: s.daily.claimed ? '今日全勤獎勵（已領取）' : `領取今日全勤獎勵（${Math.min(3, s.daily.n)} / 3）`, primary: !s.daily.claimed && s.daily.n >= 3, disabled: s.daily.claimed || s.daily.n < 3, run: () => { Dialog.close(); claimDaily(); } });
    out.push({ label: '霧之碎片兌換', run: fragShop });
    if (!s.inv.lintea && !s.flags.linTea) out.push({ label: '喝杯茶', run: () => { s.flags.linTea = true; Game.reward({ items: { lintea: 1 } }, '林姐倒了一杯烏龍茶給你'); Dialog.close(); } });
    return out;
  });
  function status() {
    const s = S();
    return { day: s.daily.day, n: s.daily.n, claimed: s.daily.claimed, streak: s.daily.streak || 0, weeklyDone: Quests.isDone('weekly') };
  }
  return { refresh, onDone, status, weekKey };
})();

/* 限定外觀 */
Object.assign(OUTFITS, {
  top_trench: { slot: 'top', name: '卡其偵探風衣', color: '#a88a62', pattern: 'knit', rare: true },
  acc_detective: { slot: 'acc', name: '偵探帽', as: 'acc_bucket', color: '#5a4a3a', rare: true },
});
TITLES.push({ id: 't_ace', name: '委託所的王牌', cond: s => (s.titles || {}).t_ace });
