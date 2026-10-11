/* 節慶活動的限定內容
 * 萬聖節（10/15–10/31）：
 *   - 車站布置：南瓜燈、蝙蝠、蜘蛛網、橘紫色燈串；很多路人變裝（魔女帽、南瓜頭、吸血鬼、幽靈）
 *   - 糖果：和變裝的路人說話（Trick or treat）、找紫色南瓜、遇見幽靈都拿得到；拿去活動志工那裡換限定服裝
 *   - 晚上 20:00 以後，十個車站的月台會出現幽靈（幽靈卡收藏）
 *   - 限定任務：搗蛋南瓜、月台上的幽靈、走丟的小南瓜、變裝遊行
 *   - 限定服裝：魔女帽、吸血鬼披風、南瓜頭套、小蝙蝠（特效）；限定飲食：南瓜拿鐵、糖葫蘆蘋果
 * 其他節慶：完成活動任務會得到「活動紀念章」，並各有一件限定飾品。
 */
const HW = 'event_halloween';
const HW_DAYS = Array.from({ length: 17 }, (_, i) => 15 + i);   // 10/15–10/31

Object.assign(ITEMS, {
  candy: { name: '萬聖節糖果', desc: '活動期間的貨幣，可以向台北車站的活動志工換限定服裝。', icon: '🍬', cat: 'col' },
  candybag: { name: '南瓜糖果袋', desc: '橘色的南瓜造型提袋，裡面的糖果快滿出來了。', icon: '🎃' },
  candyapple: { name: '糖葫蘆蘋果', desc: '萬聖節限定，外面裹著紅色的糖衣。', icon: '🍎', price: 60, shop: true, eat: '吃', event: HW },
  hw_badge: { name: '萬聖節紀念徽章', desc: '用糖果換來的徽章，背面刻著今年的日期。', icon: '🦇', cat: 'col' },
});
Object.assign(OUTFITS, {
  acc_witch: { slot: 'acc', name: '魔女帽', event: HW },
  acc_pumpkinhead: { slot: 'acc', name: '南瓜頭套', event: HW },
  top_vampire: { slot: 'top', name: '吸血鬼披風', color: '#1a1418', event: HW },
  fx_bats: { slot: 'fx', name: '小蝙蝠', event: HW },
  acc_flagpin: { slot: 'acc', name: '國旗髮夾', event: 'event_double10' },
  acc_rabbit: { slot: 'acc', name: '玉兔耳朵', event: 'event_midautumn' },
  acc_heart: { slot: 'acc', name: '愛心髮夾', event: 'event_valentine' },
  acc_party: { slot: 'acc', name: '跨年派對帽', event: 'event_newyear' },
});
const HW_OUTFITS = ['acc_pumpkin', 'acc_witch', 'acc_pumpkinhead', 'top_vampire', 'fx_bats'];

/* ── 限定任務 ── */
Object.assign(QUESTS[HW], { days: HW_DAYS, desc: '有人把南瓜藏在車站裡，找齊了有限定的南瓜髮箍。', reward: { money: 500, xp: 200, wear: 'acc_pumpkin', items: { candy: 5 } } });
Object.assign(QUESTS, {
  event_hw_ghost: {
    type: 'event', title: '萬聖夜：月台上的幽靈', giver: 'eventstaff', month: 10, days: HW_DAYS,
    desc: '活動志工說，晚上八點以後，有些車站的月台會出現幽靈。去見見牠們，聽牠們說話。',
    steps: [1, 2, 3].map(n => ({ text: `遇見幽靈（${n} / 3）`, goal: { kind: 'ghost' } })),
    reward: { money: 600, xp: 300, ixp: 40, gold: 1, wear: 'fx_bats', items: { candy: 10 } },
  },
  event_hw_lost: {
    type: 'event', title: '萬聖節：走丟的小南瓜', giver: 'eventstaff', month: 10, days: HW_DAYS,
    desc: '西門站有一個戴南瓜頭套的小朋友在哭，他的糖果袋不見了。',
    steps: [
      { text: '到西門找戴南瓜頭套的小朋友', goal: { kind: 'talk', npc: 'pumpkinkid' } },
      { text: '到中山找回南瓜糖果袋', goal: { kind: 'find', item: 'candybag', station: '中山' } },
      { text: '把糖果袋還給小南瓜', goal: { kind: 'give', npc: 'pumpkinkid', item: 'candybag' } },
    ],
    reward: { money: 400, xp: 220, ixp: 20, items: { candy: 8 }, friend: { pumpkinkid: 20 } },
  },
  event_hw_parade: {
    type: 'event', title: '萬聖節：變裝遊行', giver: 'eventstaff', month: 10, days: HW_DAYS,
    desc: '穿上任何一件萬聖節裝扮，到西門和中山參加變裝遊行。',
    steps: [
      { text: '穿著萬聖節裝扮到西門', goal: { kind: 'costume', station: '西門' } },
      { text: '穿著萬聖節裝扮到中山', goal: { kind: 'costume', station: '中山' } },
    ],
    reward: { money: 300, xp: 200, gold: 1, title: 't_hw_costume', items: { candy: 6 } },
  },
});
NPCS.eventstaff.gives.push('event_hw_ghost', 'event_hw_lost', 'event_hw_parade');
NPCS.eventstaff.hours = [[9, 23]];   // 活動期間晚上也在（幽靈 20:00 以後才出現）
NPCS.pumpkinkid = {
  name: '小南瓜', role: '走丟的小朋友', station: '西門', spot: 'concourse', speed: 0, event: HW,
  look: { girl: false, skin: '#f2cdb9', hair: 'mush', hairColor: '#151515', top: '#e8741c', pattern: 'plain', bottom: '#2a2a2a', height: .62, costume: 'pumpkin' },
  likes: ['candy', 'candyapple'],
  lines: ['Trick or treat！', '媽媽說萬聖節可以吃三顆糖。', '你的裝扮好酷！'],
  questTalk: { event_hw_lost: '「嗚……我的南瓜糖果袋不見了。剛剛在中山站的時候還在……」' },
};
// 其他節慶的限定飾品
QUESTS.event_double10.reward.wear = 'acc_flagpin';
QUESTS.event_midautumn.reward.wear = 'acc_rabbit';
QUESTS.event_valentine.reward.wear = 'acc_heart';
QUESTS.event_newyear.reward.wear = 'acc_party';
TITLES.push(
  { id: 't_hw_costume', name: '最佳變裝', cond: s => (s.titles || {}).t_hw_costume },
  { id: 't_hw_ghost', name: '捉鬼達人', cond: s => Object.keys((s.col || {}).hw_ghosts || {}).length >= 10 },
);

/* ── 幽靈（晚上才出現）與紫色南瓜 ── */
const HW_GHOSTS = {
  台北車站: { name: '找不到月台的旅客', text: '「請問……往基隆的火車在哪裡？」他手上拿著一張 1989 年的火車票。' },
  西門: { name: '排隊的幽靈', text: '牠排在一間早就收掉的冰店門口，說：「快輪到我了。」' },
  中山: { name: '迷路的新娘', text: '白紗拖在月台上，她在找一束遺落的捧花。' },
  龍山寺: { name: '提燈小鬼', text: '牠提著小燈籠說要帶你去拜拜，然後自己先害羞地飄走了。' },
  公館: { name: '熬夜的學生', text: '「明天期中考……」牠抱著一本永遠讀不完的原文書。' },
  北投: { name: '泡湯的幽靈', text: '頭上頂著小毛巾，身上冒著熱氣。「這裡的水，比以前冷了一點。」' },
  淡水: { name: '等夕陽的人', text: '牠說每天都在等最後一道夕陽，可是天黑以後才出得來。' },
  市政府: { name: '加班的幽靈', text: '領帶歪一邊，牠說今天也是十點才下班。' },
  動物園: { name: '熊貓布偶', text: '一隻會飄的熊貓布偶，看到你就躲到柱子後面，只露出一隻耳朵。' },
  圓山: { name: '舊站的站長', text: '牠穿著舊鐵路的制服，向你敬了一個禮。「圓山站，到了。」' },
};
const HW_PURPLE = ['南港展覽館', '松山', '板橋', '新店', '淡水', '動物園', '南勢角', '迴龍'];
const HW_TREAT = ['「Trick or treat！不給糖就搗蛋！……開玩笑的，這個給你。」', '「你也有變裝嗎？來，分你一顆。」', '「我今天收到好多糖，分你！」', '「噓——這顆是最好吃的口味。」', '「萬聖節快樂！」'];

ACHIEVEMENTS.push(
  { id: 'a_hw_candy', name: '甜食收集家', desc: '萬聖節活動中累計拿到 30 顆糖果。', check: s => (s.flags.candyTotal || 0) >= 30 },
  { id: 'a_hw_ghost5', name: '不怕鬼', desc: '遇見五隻月台上的幽靈。', check: s => Object.keys((s.col || {}).hw_ghosts || {}).length >= 5, gold: 1 },
  { id: 'a_hw_ghostall', name: '幽靈圖鑑', desc: '遇見全部十隻幽靈。', check: s => Object.keys((s.col || {}).hw_ghosts || {}).length >= 10, gold: 3 },
  { id: 'a_hw_purple', name: '紫色的南瓜', desc: '找到所有藏起來的紫色南瓜。', check: s => Object.keys((s.col || {}).hw_purple || {}).length >= HW_PURPLE.length, gold: 2 },
  { id: 'a_hw_dress', name: '萬聖節衣櫃', desc: '收齊魔女帽、吸血鬼披風和南瓜頭套。', check: s => ['acc_witch', 'top_vampire', 'acc_pumpkinhead'].every(id => s.wardrobe.own[id]) },
  { id: 'a_hw_train', name: '南瓜列車', desc: '看見萬聖節南瓜列車。', check: s => !!((s.col || {}).trains || {}).se_halloween },
  { id: 'a_events3', name: '節慶常客', desc: '收集三枚活動紀念章。', check: s => Object.keys((s.col || {}).events || {}).length >= 3, gold: 1 },
);

const Festival = (() => {
  const T = THREE;
  let group = null, bats = [], ghost = null, purple = null, glow = [];
  const S = () => Game.state;
  const col = k => { const s = S(); s.col = s.col || {}; return (s.col[k] = s.col[k] || {}); };
  const on = () => Quests.eventsNow().includes(HW);
  const night = () => { const h = TaipeiTime.now().hour; return h >= 20 || h < 1; };
  const hsh = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

  function addCandy(n, why) {
    const s = S(); s.inv.candy = (s.inv.candy || 0) + n; s.flags.candyTotal = (s.flags.candyTotal || 0) + n;
    saveState(); updateHud(); Sound.itemGet();
    toast(`<b>🍬 糖果 +${n}</b><span>${why}　（現在 ${s.inv.candy} 顆）</span>`);
    Achievements.check();
  }

  /* 路人變裝（NPCManager 產生路人時呼叫） */
  function dress(look, rnd) {
    if (!on() || rnd() > .32) return;
    look.costume = ['witch', 'pumpkin', 'vampire', 'ghost', 'witch'][(rnd() * 5) | 0];
    if (look.costume === 'vampire') { look.top = '#1a1418'; look.bottom = '#1a1418'; }
  }
  // 和變裝的路人說話：Trick or treat（每個人一天一次，一天最多 12 顆）
  function treat(npc, show, close) {
    if (!on() || !npc.look || !npc.look.costume) return false;
    const s = S(), day = TaipeiTime.date(), f = s.flags;
    f.treat = f.treat && f.treat.day === day ? f.treat : { day, got: {}, n: 0 };
    const key = (World.layout ? World.layout.stationId : '') + npc.id;
    const line = HW_TREAT[hsh(key) % HW_TREAT.length];
    if (f.treat.got[key] || f.treat.n >= 12) { show(npc, '「萬聖節快樂！」', [{ label: '再見', run: close }]); return true; }
    show(npc, line, [{ label: '收下糖果', primary: true, run: () => { f.treat.got[key] = true; f.treat.n++; close(); addCandy(1 + (hsh(key) % 2), 'Trick or treat！'); } }, { label: '再見', run: close }]);
    return true;
  }

  /* ── 車站布置 ── */
  let faceTex = null, webTex = null, batTex = null;
  function textures() {
    if (faceTex) return;
    const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
    faceTex = mk(256, 128, g => {   // 南瓜燈：橘色＋發光的臉（臉在 u=.25）
      g.fillStyle = '#e8741c'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#b8500c'; g.lineWidth = 5;
      for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
      g.fillStyle = '#ffd34a';
      g.beginPath(); g.moveTo(46, 54); g.lineTo(58, 34); g.lineTo(70, 54); g.fill(); g.beginPath(); g.moveTo(90, 54); g.lineTo(102, 34); g.lineTo(114, 54); g.fill();
      g.beginPath(); g.moveTo(42, 72); for (let i = 0; i <= 8; i++) g.lineTo(42 + i * 10, 72 + (i % 2 ? 14 : 4)); g.lineTo(122, 72); g.quadraticCurveTo(82, 100, 42, 72); g.fill();
    });
    webTex = mk(256, 256, g => {
      g.strokeStyle = 'rgba(240,240,240,.85)'; g.lineWidth = 2;
      for (let a = 0; a <= 8; a++) { const t = a / 8 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(t) * 256, Math.sin(t) * 256); g.stroke(); }
      for (let r = 30; r < 256; r += 34) { g.beginPath(); for (let a = 0; a <= 8; a++) { const t = a / 8 * Math.PI / 2, rr = r - (a % 2) * 6; const x = Math.cos(t) * rr, y = Math.sin(t) * rr; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    });
    batTex = mk(128, 64, g => {
      g.fillStyle = '#1a1420'; g.beginPath(); g.moveTo(64, 26);
      g.quadraticCurveTo(40, 4, 4, 18); g.quadraticCurveTo(18, 26, 14, 40); g.quadraticCurveTo(30, 30, 40, 44); g.quadraticCurveTo(52, 34, 64, 46);
      g.quadraticCurveTo(76, 34, 88, 44); g.quadraticCurveTo(98, 30, 114, 40); g.quadraticCurveTo(110, 26, 124, 18); g.quadraticCurveTo(88, 4, 64, 26); g.fill();
      g.beginPath(); g.arc(64, 30, 9, 0, 7); g.fill();
    });
  }
  function lantern(x, y, z, s = 1, rot = 0) {
    const m = new T.Mesh(new T.SphereGeometry(.28 * s, 18, 12), new T.MeshStandardMaterial({ map: faceTex, emissive: '#ff8a20', emissiveIntensity: .35, roughness: .6 }));
    m.scale.y = .82; m.position.set(x, y + .23 * s, z); m.rotation.y = rot; group.add(m); glow.push(m);
    const st = new T.Mesh(new T.CylinderGeometry(.025 * s, .035 * s, .1 * s, 6), new T.MeshStandardMaterial({ color: '#3a6a2a' })); st.position.set(x, y + .47 * s, z); group.add(st);
  }
  function web(x, y, z, rotY, flip) {
    const p = new T.Mesh(new T.PlaneGeometry(1.2, 1.2), new T.MeshBasicMaterial({ map: webTex, transparent: true, depthWrite: false, side: T.DoubleSide }));
    p.position.set(x, y, z); p.rotation.y = rotY; if (flip) p.rotation.z = Math.PI / 2; group.add(p);
  }
  function bat(x, y, z) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: batTex, transparent: true, depthWrite: false })); sp.scale.set(.5, .25, 1); sp.position.set(x, y, z);
    sp.userData = { y, ph: Math.random() * 6 }; group.add(sp); bats.push(sp);
  }
  function lights(x0, x1, y, z) {   // 橘紫色燈串（垂下來的弧線）
    const n = Math.max(4, Math.round((x1 - x0) / .7));
    const geo = new T.SphereGeometry(.05, 8, 6);
    for (const [c, k0] of [['#ff8a20', 0], ['#a050ff', 1]]) {
      const im = new T.InstancedMesh(geo, new T.MeshBasicMaterial({ color: c }), Math.ceil(n / 2)); let k = 0;
      const m = new T.Matrix4();
      for (let i = k0; i < n; i += 2) { const t = i / (n - 1), x = x0 + (x1 - x0) * t, sag = Math.sin(((t * 6) % 1) * Math.PI) * .35; im.setMatrixAt(k++, m.makeTranslation(x, y - sag, z)); }
      im.count = k; group.add(im);
    }
  }
  function decorate(L) {
    textures();
    const C = L.concourse, U = L.unpaid, hallH = 4.2;
    for (const x of [-8.2, 8.2]) lantern(x, 0, L.gateZ - 1.9, 1.1, Math.PI);
    lantern(U.x0 + 2.2, 0, U.z1 - 2.2, 1, Math.PI); lantern(U.x1 - 2.4, 0, U.z0 + 1.6, 1.2, Math.PI);
    lantern(C.x0 + 1.2, 0, C.z0 + 1.2, 1.3, .6); lantern(C.x1 - 1.2, 0, C.z0 + 1.2, 1.3, -.6);
    lights(C.x0 + 1, C.x1 - 1, hallH - .2, C.z0 + .3);
    lights(-6, 6, hallH - .25, L.gateZ - .4);
    // 大廳中央的橫幅、柱子旁的南瓜燈
    const banner = document.createElement('canvas'); banner.width = 1024; banner.height = 256;
    { const g = banner.getContext('2d'); const gr = g.createLinearGradient(0, 0, 1024, 0); gr.addColorStop(0, '#3a1a5a'); gr.addColorStop(1, '#5a2a7a'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 256);
      g.fillStyle = '#ff9a2a'; g.font = '900 96px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.fillText('🎃 萬聖節快樂 🦇', 512, 120);
      g.fillStyle = '#f4e8ff'; g.font = '700 48px sans-serif'; g.fillText('Happy Halloween · 10/15–10/31', 512, 200); }
    const bt = new T.CanvasTexture(banner); bt.colorSpace = T.SRGBColorSpace;
    for (const [z, r] of [[(C.z0 + L.gateZ) / 2 - 3, 0], [(C.z0 + L.gateZ) / 2 - 3.02, Math.PI]]) { const b = new T.Mesh(new T.PlaneGeometry(6, 1.5), new T.MeshBasicMaterial({ map: bt })); b.position.set(0, hallH - 1.1, z); b.rotation.y = r; group.add(b); }
    for (const x of [-5.5, 5.5]) for (let z = C.z0 + 5; z < L.gateZ - 3; z += 8) { const px = x - Math.sign(x) * .75; if (World.groundAt(px, z + .75, 0) != null) lantern(px, 0, z + .75, .8, Math.random() * 6); }
    for (const [x, z, r] of [[C.x0 + .2, C.z0 + .2, Math.PI / 4], [C.x1 - .2, C.z0 + .2, -Math.PI / 4]]) web(x, hallH - .6, z, r);
    for (let i = 0; i < 10; i++) bat(C.x0 + 3 + (i * 7.3) % (C.x1 - C.x0 - 6), hallH - .7 - (i % 3) * .3, C.z0 + 3 + (i * 5.1) % Math.max(4, L.gateZ - C.z0 - 6));
    for (const P of L.platforms) {
      for (const ex of [-1, 1]) { lantern(P.x + ex * 29.6, P.y, P.z + .9, 1, ex > 0 ? -Math.PI / 2 : Math.PI / 2); lantern(P.x + ex * 30.4, P.y, P.z - .9, .8, ex > 0 ? -Math.PI / 2 : Math.PI / 2); }
      lights(P.x - 26, P.x + 26, P.y + 3.1, P.z);
      for (let i = 0; i < 5; i++) bat(P.x - 24 + i * 12, P.y + 2.7 - (i % 2) * .3, P.z + (i % 2 ? .8 : -.8));
      web(P.x - 28, P.y + 2.9, P.z + .5, Math.PI / 2);
    }
  }

  /* ── 幽靈、紫色南瓜 ── */
  function ghostMesh() {
    const g = new T.Group(), m = new T.MeshStandardMaterial({ color: '#f4f6fa', emissive: '#c8e8ff', emissiveIntensity: .35, transparent: true, opacity: .78, roughness: .9 });
    const body = new T.Mesh(new T.CylinderGeometry(.25, .42, .9, 18, 1, true), m); body.position.y = .45; m.side = T.DoubleSide; g.add(body);
    const head = new T.Mesh(new T.SphereGeometry(.27, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); head.position.y = .9; g.add(head);
    for (const sx of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.04, 8, 6), new T.MeshBasicMaterial({ color: '#151515' })); e.position.set(sx * .08, .95, .24); g.add(e); }
    return g;
  }
  function spawn(stationId) {
    clear();
    const L = World.layout; if (!L || !on()) return;
    group = new T.Group(); World.scene.add(group);
    decorate(L);
    // 幽靈：晚上，還沒遇見過
    const gd = HW_GHOSTS[stationId];
    if (gd && night() && !col('hw_ghosts')[stationId]) {
      const P = L.platforms[hsh(stationId) % L.platforms.length], ex = hsh(stationId) % 2 ? 1 : -1;
      const m = ghostMesh(); const pos = { x: P.x + ex * 22, y: P.y + .25, z: P.z + .6 };
      m.position.set(pos.x, pos.y, pos.z); m.rotation.y = ex > 0 ? -Math.PI / 2 : Math.PI / 2; group.add(m);
      ghost = { ...pos, y: P.y, mesh: m, station: stationId, ...gd };
    }
    // 紫色南瓜
    if (HW_PURPLE.includes(stationId) && !col('hw_purple')[stationId]) {
      const C = L.concourse;
      for (let i = 0; i < 10; i++) {
        const x = C.x0 + 3 + (hsh(stationId + i) % Math.max(1, Math.round(C.x1 - C.x0 - 6))), z = C.z0 + 1.2 + (hsh(i + stationId) % 4);
        if (World.groundAt(x, z, 0) == null) continue;
        const m = new T.Mesh(new T.SphereGeometry(.2, 16, 10), new T.MeshStandardMaterial({ color: '#7a3ab8', emissive: '#5a1a98', emissiveIntensity: .3, roughness: .6 })); m.scale.y = .8; m.position.set(x, .16, z); group.add(m);
        purple = { x, y: 0, z, mesh: m, station: stationId }; break;
      }
    }
    // 穿著萬聖節裝扮到站：變裝遊行
    const w = Outfits.wear(S().char, S().wardrobe.wear);
    if (Object.values(w).some(id => HW_OUTFITS.includes(id))) questEvent({ kind: 'costume', station: stationId });
  }
  function clear() { if (group) { World.scene.remove(group); group = null; } bats = []; glow = []; ghost = null; purple = null; }
  function tick(dt, now) {
    if (!group) return;
    group.visible = !World.riding;
    const t = now / 1000;
    for (const b of bats) { b.position.y = b.userData.y + Math.sin(t * 2 + b.userData.ph) * .12; b.scale.x = .5 * (.55 + Math.abs(Math.sin(t * 9 + b.userData.ph)) * .45); }
    for (const g of glow) g.material.emissiveIntensity = .3 + Math.sin(t * 3 + g.position.x) * .08;
    if (ghost) { ghost.mesh.position.y = ghost.y + .3 + Math.sin(t * 1.6) * .12; ghost.mesh.rotation.z = Math.sin(t * 1.1) * .06; }
  }
  const nearP = (o, p, r) => o && Math.abs(o.y - p.y) < .9 && Math.hypot(o.x - p.x, o.z - p.z) < r;
  const interaction = {
    get id() { return ghost && nearP(ghost, World.player, 1.8) ? 'hw:ghost' : 'hw:purple'; },
    get label() { return ghost && nearP(ghost, World.player, 1.8) ? '靠近：幽靈' : '撿起：紫色南瓜'; },
    when: p => !Dialog.with && (nearP(ghost, p, 1.8) || nearP(purple, p, 1.2)),
    run: () => {
      const p = World.player;
      if (ghost && nearP(ghost, p, 1.8)) {
        const g = ghost;
        return Dialog.show({ name: g.name, role: '👻 幽靈' }, g.text, [{ label: '聽牠說完', primary: true, run: () => {
          Dialog.close(); col('hw_ghosts')[g.station] = TaipeiTime.date(); saveState();
          group && group.remove(g.mesh); ghost = null;
          if (typeof Life !== 'undefined') Life.log(`遇見了幽靈「${g.name}」（${g.station}）`);
          toast(`<b>👻 幽靈卡：${g.name}</b><span>收進「紀錄 → 收藏 → 萬聖節」（${Object.keys(col('hw_ghosts')).length} / 10）</span>`, 'level');
          questEvent({ kind: 'ghost', station: g.station });
          addCandy(3, '幽靈留下了糖果');
        } }]);
      }
      if (purple && nearP(purple, p, 1.2)) {
        col('hw_purple')[purple.station] = TaipeiTime.date(); saveState();
        group && group.remove(purple.mesh); purple = null;
        toast(`<b>🟣 紫色南瓜（${Object.keys(col('hw_purple')).length} / ${HW_PURPLE.length}）</b><span>藏得很好，被你找到了</span>`);
        addCandy(2, '紫色南瓜裡有糖果');
      }
    },
  };

  /* ── 糖果兌換（活動志工） ── */
  const CANDY_SHOP = [
    { id: 'candyapple', n: 3, item: true }, { id: 'acc_witch', n: 12 }, { id: 'top_vampire', n: 18 }, { id: 'acc_pumpkinhead', n: 25 }, { id: 'hw_badge', n: 30, item: true, once: true },
  ];
  function candyShop() {
    const s = S(), have = s.inv.candy || 0;
    Dialog.show({ name: '活動志工', role: `🍬 糖果 ${have}` }, '「用糖果換限定的東西！活動結束就沒有了喔。」', CANDY_SHOP.filter(g => g.item || Outfits.fits(g.id, s.char)).map(g => {
      const o = g.item ? ITEMS[g.id] : OUTFITS[g.id], owned = g.item ? (g.once && s.inv[g.id] > 0) : s.wardrobe.own[g.id];
      return { label: `${g.item ? o.icon : '👕'} ${o.name}　🍬 ${g.n}${owned ? '（已擁有）' : ''}`, disabled: owned || have < g.n, run: () => {
        s.inv.candy -= g.n;
        if (g.item) s.inv[g.id] = (s.inv[g.id] || 0) + 1; else s.wardrobe.own[g.id] = true;
        saveState(); updateHud(); Sound.itemGet(); toast(`<b>換到了 ${o.name}</b><span>${g.item ? '收進背包' : '背包 → 換裝'}</span>`);
        Achievements.check(); candyShop();
      } };
    }).concat([{ label: '離開', run: () => Dialog.close() }]));
  }
  NPC_MENU_HOOKS.push(npc => (npc.id === 'eventstaff' && on() ? [{ label: `🍬 糖果兌換（${S().inv.candy || 0}）`, primary: true, run: candyShop }] : []));

  /* ── 活動紀念章：完成任何一個節慶任務 ── */
  function onQuestDone(id) {
    const q = QUESTS[id]; if (!q || q.type !== 'event') return;
    const c = col('events'); if (c[id]) return;
    c[id] = TaipeiTime.date(); saveState();
    setTimeout(() => toast(`<b>🎟️ 活動紀念章：${q.title}</b><span>收進「紀錄 → 收藏」</span>`, 'level'), 1800);
    Achievements.check();
  }
  // 收藏頁：萬聖節與活動紀念章（沒拿到的顯示 ？？？）
  function collectHtml() {
    const s = S(), gh = col('hw_ghosts'), pu = col('hw_purple'), ev = col('events');
    const evIds = Object.keys(QUESTS).filter(id => QUESTS[id].type === 'event');
    const any = Object.keys(gh).length || Object.keys(pu).length || s.flags.candyTotal || on();
    return `${any ? `<h4 class="bag-h">🎃 萬聖節</h4>
      <p class="rc-note">幽靈卡 ${Object.keys(gh).length} / 10　紫色南瓜 ${Object.keys(pu).length} / ${HW_PURPLE.length}　累計糖果 ${s.flags.candyTotal || 0}</p>
      <div class="rc-titles">${Object.keys(HW_GHOSTS).map(st => gh[st] ? `<span class="wd-chip" aria-pressed="true" title="${esc(st)}">👻 ${esc(HW_GHOSTS[st].name)}</span>` : '<span class="wd-chip">？？？</span>').join('')}</div>` : ''}
      <h4 class="bag-h">🎟️ 活動紀念章</h4>
      <div class="rc-titles">${evIds.map(id => ev[id] ? `<span class="wd-chip" aria-pressed="true">${esc(QUESTS[id].title)}</span>` : '<span class="wd-chip">？？？</span>').join('')}</div>`;
  }
  return { on, dress, treat, spawn, clear, tick, interaction, onQuestDone, collectHtml, addCandy };
})();
