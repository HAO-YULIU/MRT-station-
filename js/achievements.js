/* 成就與收集：遊戲裡不會事先告訴玩家有哪些，解鎖了才會出現在「任務 → 成就」
 * 收集品：紀念章、舊車票、照片碎片、椅子下的紙條、安靜時才看得到的東西、相機才拍得到的符號、城市景色、NPC 留言
 * 時段：只在 07:00–08:00 出現的雨晨、每天換通勤路線的張先生、只在上午營業的早餐攤、會被清潔人員收走的失物
 */

// 新角色
Object.assign(NPCS, {
  yuchen: {
    name: '雨晨', role: '清晨的旅人', station: '中山', spot: 'platform', hours: [[7, 8]], speed: .6,
    look: { girl: true, skin: '#f2d6c8', hair: 'long', hairColor: '#3a2a20', top: '#c8d8e8', coat: true, bottom: '#3a3a40', scarf: '#e8b8c8', bag: 'tote', bagColor: '#e6dcc6' },
    likes: ['soymilk', 'flower'],
    lines: ['你也這麼早？這個時間的月台，好像整座城市都還沒醒。', '我只有這個小時有空。等一下就要去很遠的地方上班了。'],
    rumors: [],
  },
  yuchen2: {
    name: '雨晨', role: '下班的旅人', station: '淡水', spot: 'platform', hours: [[20, 23]], speed: .5, onlyQuest: ['sec_dawn'],
    look: { girl: true, skin: '#f2d6c8', hair: 'long', hairColor: '#3a2a20', top: '#c8d8e8', coat: true, bottom: '#3a3a40', scarf: '#e8b8c8', bag: 'tote', bagColor: '#e6dcc6' },
    likes: ['soymilk', 'flower'], lines: ['……你真的來了。'], rumors: [],
  },
  zhang: {
    name: '張先生', role: '固定通勤的乘客', spot: 'concourse', speed: 1.6,
    // 每天的通勤路線不一樣（星期幾決定）
    routes: [
      [[7, 9, '景安'], [9, 18, '忠孝復興'], [18, 20, '景安']],
      [[7, 9, '新店'], [9, 18, '中山'], [18, 20, '新店']],
      [[7, 9, '蘆洲'], [9, 18, '行天宮'], [18, 20, '蘆洲']],
      [[7, 9, '頂埔'], [9, 18, '市政府'], [18, 20, '頂埔']],
    ],
    look: { skin: '#e2b49c', hair: 'short', hairColor: '#2a2a2a', top: '#3a4250', pattern: 'shirt', accent: '#7a1f2b', bottom: '#2a2e36', bag: 'briefcase', glasses: true },
    likes: ['coffee'], lines: ['每天搭的線都不太一樣，看公司派我去哪裡。', '你又遇到我了？'], rumors: [],
  },
});
// 每天換通勤路線
const _npcStation0 = npcStation;
npcStation = def => {
  if (def.routes) { const t = TaipeiTime.now(), r = def.routes[(t.year * 372 + t.month * 31 + t.day) % def.routes.length]; const s = r.find(([a, b]) => t.hour >= a && t.hour < b); return s ? s[2] : null; }
  return _npcStation0(def);
};

// 清晨偶遇的後續（秘密任務）
QUESTS.sec_dawn = {
  type: 'secret', giver: null, title: '清晨的偶遇',
  desc: '早上 7 點在中山站月台遇見的雨晨說，她下班後會在淡水看海。',
  steps: [{ text: '晚上 8 點到 11 點，去淡水站月台找雨晨', goal: { kind: 'talk', npc: 'yuchen2' } }],
  reward: { money: 200, xp: 250 },
};
NPCS.yuchen2.questTalk = { sec_dawn: '早上那一面，我以為只是擦肩而過。謝謝你記得。……下次，換我去找你。' };

// 早餐攤：只在景美、早上 6–10 點
const _extras0 = STATION_EXTRAS;
STATION_EXTRAS = id => { const h = TaipeiTime.now().hour; return _extras0(id).concat(id === '景美' && h >= 6 && h < 10 ? ['breakfast'] : []); };
NPCS.atao.spot = 'breakfast'; NPCS.atao.speed = 0;
Object.assign(ITEMS, {
  turnipcake: { name: '蘿蔔糕', desc: '煎得外酥內軟，加一點醬油膏。', icon: '🍳', price: 40, shop: true, eat: '吃' },
  danbing: { name: '蛋餅', desc: '阿桃的招牌，加起司。', icon: '🌯', price: 45, shop: true, eat: '吃' },
  oldticket: { name: '舊車票', desc: '磁卡式的舊車票。', icon: '🎫' },
});

/* ── 收集品的位置 ── */
const COLLECT = {
  ticket: { icon: '🎫', name: '舊車票', stations: ['台北車站', '西門', '龍山寺', '中山', '雙連', '圓山', '劍潭', '北投', '淡水', '古亭', '公館', '景美', '新店', '忠孝復興', '市政府', '南港', '板橋', '頂埔', '大安', '動物園'], text: '一張磁卡式的舊車票，背面印著發行年份。' },
  photo: { icon: '🖼️', name: '照片碎片', stations: ['南京三民', '松江南京', '行天宮', '大橋頭', '迴龍'], text: '一張被撕成五片的照片的其中一片。' },
  bench: { icon: '📝', name: '椅子下的紙條', stations: ['芝山', '萬芳醫院', '永春', '輔大'], text: '黏在月台椅子底下的紙條。' },
  quiet: { icon: '🔑', name: '安靜時才看得到的東西', stations: ['善導寺', '六張犁', '台電大樓'], hours: [[10, 16], [20, 24]], text: '人少的時候，你注意到地上有一把小小的鑰匙，掛著寫了字的牌子。' },
};
const BENCH_TEXT = { 芝山: '「第一張：如果你找到這張，代表你也會在等車時發呆。」', 萬芳醫院: '「第二張：文湖線坐第一節，可以看到司機的視野——雖然沒有司機。」', 永春: '「第三張：每一張椅子都記得坐過的人。」', 輔大: '「最後一張：謝謝你一直找。——S」' };
const QUIET_TEXT = { 善導寺: '牌子寫著：「早上太吵了，你聽不到我。」', 六張犁: '牌子寫著：「霧也喜歡安靜。」', 台電大樓: '牌子寫著：「第三把。拿著它們去問擺渡人。」' };
const SYMBOL_STATIONS = ['台北車站', '中山', '東門', '大安', '板橋', '南港展覽館'];
const VIEW_SPOTS = { 淡水: { hours: [16, 19], text: '河口的夕陽' }, 劍潭: { text: '劍潭山的稜線' }, 動物園: { text: '貓空的山' }, 大湖公園: { text: '大湖的湖面' }, 竹圍: { text: '關渡平原' } };
const RUMORS = [
  '今日傳聞：有人在信義安和站看到一隻白色的貓，自己搭電扶梯。',
  '今日傳聞：聽說末班車之後，北投站的月台會飄出溫泉的味道。',
  '今日傳聞：據說每週三，環狀線的第一班車會多停一站。',
  '今日傳聞：有乘客說，在文湖線的窗外看到一盞提燈在空中移動。',
  '今日傳聞：西門站的某個出口，凌晨時會多出一道樓梯。',
  '今日傳聞：昨天台北車站的時鐘慢了三十秒，沒人知道為什麼。',
  '今日傳聞：有人在小碧潭撿到一枚 1987 年的捷運代幣——可是那時候還沒有捷運。',
];

/* ── 成就清單（解鎖前不會顯示） ── */
const ACHIEVEMENTS = [
  { id: 'a_dawn', name: '清晨的相遇', desc: '遇見只在早上 7 點出現的雨晨。' },
  { id: 'a_zhang', name: '掌握通勤路線', desc: '在三個不同的車站遇見張先生。', check: s => Object.keys(s.col.zhang || {}).length >= 3 },
  { id: 'a_breakfast', name: '早起的鳥兒', desc: '在只開到上午 10 點的早餐攤買早餐。' },
  { id: 'a_quick', name: '手腳很快', desc: '在清潔人員收走之前撿回失物。' },
  { id: 'a_rumor', name: '晨間傳聞', desc: '在三個不同的早上看過公告欄的城市傳聞。', check: s => Object.keys(s.col.rumors || {}).length >= 3 },
  { id: 'a_commute', name: '通勤時間的朋友', desc: '和只在通勤時段有空的文華變熟。', check: s => (s.friends.wenhua || 0) >= 30 },
  { id: 'a_quiet', name: '安靜的時候', desc: '找到三件只有人少時才看得到的東西。', check: s => Object.keys(s.col.quiet || {}).length >= 3 },
  { id: 'a_allhere', name: '一個都不漏', desc: '找出某一站裡所有隱藏的東西。' },
  { id: 'a_finder', name: '城市觀察家', desc: '在城市各處發現 20 個隱藏的東西。', check: s => Object.keys(s.flags.found || {}).length >= 20 },
  { id: 'a_rare', name: '奇怪的告示', desc: '看到一張平常不會出現的告示。' },
  { id: 'a_bench', name: '椅子下的秘密', desc: '找到四張藏在月台椅子下的紙條。', check: s => Object.keys(s.col.bench || {}).length >= 4 },
  { id: 'a_views', name: '城市風景', desc: '拍下三處城市景色。', check: s => Object.keys(s.col.views || {}).length >= 3 },
  { id: 'a_stamp10', name: '集章新手', desc: '蓋了 10 個車站的紀念章。', check: s => Object.keys(s.col.stamps || {}).length >= 10 },
  { id: 'a_stamp50', name: '集章達人', desc: '蓋了 50 個車站的紀念章。', check: s => Object.keys(s.col.stamps || {}).length >= 50 },
  { id: 'a_stampall', name: '全線制霸', desc: '蓋齊所有車站的紀念章。', check: s => Object.keys(s.col.stamps || {}).length >= Object.keys(STATIONS).length },
  { id: 'a_photoset', name: '拼起來的照片', desc: '找齊五片照片碎片。', check: s => Object.keys(s.col.photo || {}).length >= 5 },
  { id: 'a_oldmap', name: '新舊對照', desc: '看出舊地圖和現在的路線圖哪裡不一樣。' },
  { id: 'a_symbols', name: '看得見霧的相機', desc: '用相機在六個車站拍到隱藏的符號。', check: s => Object.keys(s.col.symbols || {}).length >= 6 },
  { id: 'a_tiles', name: '從夜晚到早晨', desc: '把牆上的圖案排成正確的順序。' },
  { id: 'a_tickets10', name: '舊車票收藏家', desc: '收集 10 張舊車票。', check: s => Object.keys(s.col.ticket || {}).length >= 10 },
  { id: 'a_ticketsall', name: '時光的票根', desc: '收集全部 20 張舊車票。', check: s => Object.keys(s.col.ticket || {}).length >= 20 },
  { id: 'a_notices', name: '公告收藏家', desc: '看過告示牌、時刻表、周邊地圖、公共藝術和舊地圖。', check: s => ['notice', 'timetable', 'areamap', 'art', 'oldmap'].every(k => (s.col.kinds || {})[k]) },
  { id: 'a_survey', name: '地毯式調查', desc: '查看某一站裡所有可以查看的東西。' },
  { id: 'a_passage', name: '秘密入口', desc: '找到五條神秘通道。', check: s => (s.col.passages || 0) >= 5 },
  { id: 'a_msgs', name: '留言本', desc: '收到五個人留給你的話。', check: s => Object.keys(s.col.msgs || {}).length >= 5 },
  { id: 'a_photos', name: '隨手拍', desc: '拍了 30 張照片。', check: s => (s.flags.photos || 0) >= 30 },
  ...['BR', 'R', 'G', 'O', 'BL', 'Y'].map(l => ({ id: 'a_line_' + l, name: `${LINES[l].zh}探索完成`, desc: `走過${LINES[l].zh}的每一站。`, check: s => Puzzles.stations(l).every(x => s.visited[x]) })),
];

const Achievements = (() => {
  const T = THREE;
  const S = () => { const s = Game.state; s.ach = s.ach || {}; s.col = s.col || {}; return s; };
  const col = k => (S().col[k] = S().col[k] || {});
  let items = [], drop = null;
  function unlock(id) {
    const s = S(); if (s.ach[id]) return;
    const a = ACHIEVEMENTS.find(x => x.id === id); if (!a) return;
    s.ach[id] = TaipeiTime.date(); saveState();
    Sound.itemGet();
    toast(`<b>🏆 成就解鎖：${a.name}</b><span>${a.desc}</span>`, 'level');
    Game.reward({ xp: 50 });
  }
  function check() { const s = S(); for (const a of ACHIEVEMENTS) if (a.check && !s.ach[a.id]) { try { if (a.check(s)) unlock(a.id); } catch (e) { /* 資料還沒準備好 */ } } }

  /* 收集品 */
  function sprite(icon, size) {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d'); g.font = '60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 48, 52);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false })); sp.scale.set(size, size, 1); return sp;
  }
  const hsh = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 11);
  function spawn(stationId) {
    clear();
    const L = World.layout, C = L.concourse, h = TaipeiTime.now().hour;
    const add = (kind, pos, size) => { if (World.groundAt(pos.x, pos.z, pos.y) == null) return; const m = sprite(COLLECT[kind] ? COLLECT[kind].icon : '👜', size); m.position.set(pos.x, pos.y + .15, pos.z); World.scene.add(m); items.push({ kind, station: stationId, ...pos, mesh: m }); };
    const P = L.platforms[(hsh(stationId) % L.platforms.length)];
    for (const [kind, c] of Object.entries(COLLECT)) {
      if (!c.stations.includes(stationId) || col(kind)[stationId]) continue;
      if (c.hours && !c.hours.some(([a, b]) => h >= a && h < b)) continue;
      if (kind === 'bench') add(kind, { x: P.x - 21, y: P.y, z: P.z + .05 }, .26);
      else if (kind === 'ticket') add(kind, hsh(stationId) % 2 ? { x: C.x0 + 1, y: 0, z: C.z0 + 3 + hsh(stationId) % 6 } : { x: P.x + (hsh(stationId) % 2 ? 30 : -30), y: P.y, z: P.z - 1.5 }, .24);
      else add(kind, { x: P.x + 5 - hsh(stationId) % 10, y: P.y, z: P.z + (hsh(stationId) % 2 ? 2.5 : -2.5) }, .28);
    }
    // 會被清潔人員收走的失物（偶爾出現，3 分鐘後就不見）
    if (Math.random() < .18) {
      const q = { x: P.x + 12 - Math.random() * 24, y: P.y, z: P.z + (Math.random() < .5 ? 2.4 : -2.4) };
      if (World.groundAt(q.x, q.z, q.y) != null) { const m = sprite('👜', .32); m.position.set(q.x, q.y + .18, q.z); World.scene.add(m); drop = { ...q, mesh: m, until: Date.now() + 180000, station: stationId }; items.push({ kind: 'drop', ...q, mesh: m }); }
    }
  }
  function clear() { for (const it of items) World.scene.remove(it.mesh); items = []; drop = null; }
  function tick() {
    for (const it of items) it.mesh.visible = !World.riding;
    if (drop && Date.now() > drop.until) {
      World.scene.remove(drop.mesh); items = items.filter(x => x.mesh !== drop.mesh); drop = null;
      toast('<b>剛剛月台上的包包不見了</b><span>好像被清潔人員收走，送去失物招領了。</span>');
    }
    if (Math.random() < .05) { checkMessages(); check(); }
  }
  function near(p) { return items.find(it => Math.abs(it.y - p.y) < .6 && Math.hypot(it.x - p.x, it.z - p.z) < 1.1); }
  function take(it) {
    World.scene.remove(it.mesh); items = items.filter(x => x !== it);
    Sound.itemGet();
    if (it.kind === 'drop') { drop = null; Game.reward({ money: 50, xp: 30 }, '撿到一個包包，交給站務員'); unlock('a_quick'); return; }
    const c = COLLECT[it.kind]; col(it.kind)[it.station] = TaipeiTime.date(); saveState();
    const n = Object.keys(col(it.kind)).length;
    let text = c.text;
    if (it.kind === 'bench') text += '<br>' + BENCH_TEXT[it.station];
    if (it.kind === 'quiet') text += '<br>' + QUIET_TEXT[it.station];
    if (it.kind === 'ticket') { S().inv.oldticket = (S().inv.oldticket || 0) + 1; text += `<br>發行年份：${1996 + hsh(it.station) % 12}。`; }
    if (it.kind === 'photo' && n >= 5) text += '<br><b>五片拼起來了：</b>照片裡是 1987 年的圓山站，兩個女孩並肩站著。其中一個戴著紅色的貝雷帽。';
    Dialog.info(`${c.icon} ${c.name}（${n}）`, text);
    check();
  }
  // NPC 好感到 50 會留言
  function checkMessages() {
    const s = S(), m = col('msgs');
    for (const [id, f] of Object.entries(s.friends)) {
      if (f < 50 || m[id] || !NPCS[id] || id === 'xiuyu') continue;
      m[id] = `「謝謝你常常來找我。下次經過${npcStation(NPCS[id]) || '這裡'}，記得再來打聲招呼。」——${NPCS[id].name}`;
      saveState(); toast(`<b>✉️ 收到留言</b><span>${NPCS[id].name}留了一段話給你（任務 → 成就）</span>`);
    }
  }

  /* 事件 */
  function onInspect(sp, st) {
    const s = S(); col('kinds')[sp.kind] = true;
    const ins = col('inspected'); ins[st] = ins[st] || {}; ins[st][sp.kind] = true;
    const kinds = new Set(World.layout.spots.map(x => x.kind));
    if ([...kinds].every(k => ins[st][k])) unlock('a_survey');
    saveState(); check();
  }
  function onTalk(npcId) {
    if (npcId === 'yuchen') { unlock('a_dawn'); Quests.secret('sec_dawn'); }
    if (npcId === 'zhang') { col('zhang')[World.layout.stationId] = true; saveState(); check(); }
  }
  function onPhoto(ev) {
    if (SYMBOL_STATIONS.includes(ev.station) && ev.spot === 'art' && !col('symbols')[ev.station]) {
      col('symbols')[ev.station] = true; saveState();
      setTimeout(() => Dialog.info('📷 照片洗出來了', '公共藝術的角落，多了一個肉眼看不到的符號：一個圓圈，中間一條往外延伸的線。'), 900);
    }
    const v = VIEW_SPOTS[ev.station];
    if (v && ev.zone === 'platform' && (!v.hours || (ev.hour >= v.hours[0] && ev.hour < v.hours[1])) && !col('views')[ev.station]) {
      const P = World.layout.platforms.find(p => !p.under);
      if (P) { col('views')[ev.station] = true; saveState(); toast(`<b>📷 拍下了${v.text}</b>`); }
    }
    check();
  }
  function onSecret(stationId, allFound) { if (allFound) unlock('a_allhere'); check(); }
  function onPassage() { S().col.passages = (S().col.passages || 0) + 1; saveState(); check(); }
  // 公告欄：早上的傳聞、偶爾出現的奇怪告示
  function noticeExtra(st) {
    const t = TaipeiTime.now(), day = TaipeiTime.date();
    let out = '';
    if (t.hour >= 6 && t.hour < 10) { out += `<br><br>📰 ${RUMORS[(t.year * 372 + t.month * 31 + t.day) % RUMORS.length]}`; col('rumors')[day] = true; }
    if (Math.random() < .06) { out += '<br><br><b>【公告】本站將於 00:30 增開一班往「霧」的列車。請持有六件寶物的旅客至小碧潭月台候車。</b><br><small>（再看一次，這張公告就不見了。）</small>'; unlock('a_rare'); }
    saveState(); check();
    return out;
  }
  // 特別的查看點
  function spot(sp) {
    if (sp.kind === 'stamp') {
      const st = World.layout.stationId, s = col('stamps'), first = !s[st];
      s[st] = TaipeiTime.date(); saveState();
      const n = Object.keys(s).length;
      Sound.gate();
      Dialog.info('紀念章', `${first ? '你在集章本蓋上了' : '你又蓋了一次'}「${esc(st)}」的紀念章。<br><small>（集章本：${n} 站）</small>`);
      check(); return true;
    }
    if (sp.kind === 'oldmap') {
      Dialog.show({ name: '懷舊展：1987 年的舊路網圖', role: '圓山' }, '泛黃的地圖上，臺北到淡水的鐵路經過圓山、士林、北投……可是圓山和士林之間，有一個沒有名字的站，只畫了一個「？」。<br>和現在的路線圖比，那裡現在是哪一站？', [
        { label: '劍潭', run: () => { Dialog.close(); toast('<b>沒錯</b><span>舊地圖上的「？」，就在現在的劍潭。可是地圖的說明寫著：「該站從未設置。」</span>'); unlock('a_oldmap'); } },
        { label: '士林', run: () => Dialog.info('懷舊展', '不對，士林在地圖上已經有了。再看看現在的路線圖？') },
        { label: '雙連', run: () => Dialog.info('懷舊展', '雙連在圓山的另一邊喔。') },
      ]);
      return true;
    }
    if (sp.kind === 'tiles') {
      const opts = ['🌙 ⭐ 🌫️ ☀️', '☀️ 🌫️ ⭐ 🌙', '⭐ 🌙 ☀️ 🌫️', '🌫️ 🌙 ⭐ ☀️'];
      Dialog.show({ name: '磁磚壁畫', role: '「從夜晚到早晨」' }, '牆上四塊磁磚可以轉動：🌙、☀️、🌫️、⭐。說明牌寫著「從夜晚到早晨」。要怎麼排？', opts.map((o, i) => ({ label: o, run: () => {
        if (i === 0) { Dialog.close(); Sound.itemGet(); Dialog.info('磁磚壁畫', '磁磚「喀」的一聲卡住了。月亮、星星、霧、太陽——夜晚過去，霧散了，天就亮了。牆後面傳來很輕的列車聲。'); unlock('a_tiles'); }
        else Dialog.info('磁磚壁畫', '磁磚轉了一圈又回到原位。好像不是這個順序。');
      } })));
      return true;
    }
    if (sp.kind === 'breakfast') {
      const s = S(), list = ['soymilk', 'turnipcake', 'danbing', 'bread'];
      const menu = () => Dialog.show({ name: '阿桃早餐', role: '只賣到上午 10 點' }, `餘額 NT$ ${s.money}。`, list.map(id => ({
        label: `${ITEMS[id].icon} ${ITEMS[id].name}　NT$ ${ITEMS[id].price}`, disabled: s.money < ITEMS[id].price,
        run: () => { s.money -= ITEMS[id].price; s.inv[id] = (s.inv[id] || 0) + 1; saveState(); updateHud(); Sound.gate(); questEvent({ kind: 'buy', item: id }); unlock('a_breakfast'); menu(); },
      })).concat([{ label: '離開', run: () => Dialog.close() }]));
      menu(); return true;
    }
    return false;
  }
  // 任務列表：成就與收集
  function html() {
    const s = S(), got = ACHIEVEMENTS.filter(a => s.ach[a.id]);
    const c = k => Object.keys(s.col[k] || {}).length;
    const stats = [['紀念章', c('stamps') + ' 站'], ['舊車票', c('ticket') + ' 張'], ['照片碎片', c('photo') + ' 片'], ['發現的秘密', Object.keys(s.flags.found || {}).length + ' 個'], ['照片', (s.flags.photos || 0) + ' 張']].filter(([, v]) => !/^0 /.test(v));
    const msgs = Object.values(s.col.msgs || {});
    return `<h4 class="q-done-h">🏆 成就（${got.length}）</h4>
      ${got.length ? `<ul class="q-done">${got.map(a => `<li><b>${a.name}</b>　<small>${a.desc}</small></li>`).join('')}</ul>` : '<p class="empty-q">還沒有解鎖任何成就。到處走走、看看、拍拍照吧。</p>'}
      ${stats.length ? `<p class="q-note" style="margin:6px 18px">${stats.map(([k, v]) => `${k}：${v}`).join('　')}</p>` : ''}
      ${msgs.length ? `<h4 class="q-done-h">✉️ 留言本</h4><ul class="q-done">${msgs.map(m => `<li><small>${m}</small></li>`).join('')}</ul>` : ''}`;
  }
  return { spawn, clear, tick, near, take, onInspect, onTalk, onPhoto, onSecret, onPassage, noticeExtra, spot, html, check, unlock };
})();
