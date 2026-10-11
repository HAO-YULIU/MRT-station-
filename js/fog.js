/* 迷霧之城（00:30–06:00）
 *  規則 1：進入迷霧後，本站成為封閉世界——不能前往其他車站（傳送、搭車都不行），但站內可以自由走動
 *  規則 2：每個車站有自己的異常主題，同一個車站一次只會有一個事件；不會告訴玩家這是哪一種事件
 *  規則 3：有生命值與死亡（被列車撞、被鬼抓到、被奇怪的人攻擊……）；死亡度：普通
 *          死亡後可以支付 NT$ 200 復活，或等到 06:00 自動復活
 *  規則 4：05:30 開始消散；06:00 還沒離開迷霧，直接判定死亡。清晨結算獎勵、記錄未解線索
 *  規則 5：06:00 一到，迷霧之城消失，恢復正常的捷運
 *  迷霧裡新台幣不能買東西，只能用黃金。
 * 各車站的事件在 fogevents.js（八大類）與 fogspecial.js（迷霧列車、四個特殊事件）。
 */
const FOG_REVIVE_COST = 200;
const FOG_MAX_HP = 100;

Object.assign(ITEMS, {
  fog_tea: { name: '熱薑茶', desc: '迷霧之城用品。喝了恢復 40 點生命值。', icon: '🫖', cat: 'tool' },
  fog_charm: { name: '平安符', desc: '迷霧之城用品。帶在身上，下一次受到的傷害會被擋掉。', icon: '🧧', cat: 'tool' },
  fog_salt: { name: '一包鹽', desc: '迷霧之城用品。撒出去，附近的鬼會退開 15 秒。', icon: '🧂', cat: 'tool' },
  fog_battery: { name: '霧燈電池', desc: '迷霧之城用品。霧燈的電量補滿。', icon: '🔋', cat: 'tool' },
});
ITEMS.mistlamp.desc = '迷霧之城用品。打開以後照亮身邊，看得到藏在暗處的東西；電量有限。';
ITEMS.mistticket.desc = '迷霧之城用品。倒下的時候，車票會燒掉，讓你帶著 50 點生命值站起來（一次）。';
ITEMS.mistmap.desc = '迷霧之城用品。打開以後，這一站重要的東西和出口會被標出來 60 秒（一個晚上一次）。';

const FOG_SHOP = [
  { id: 'fog_tea', gold: 1 }, { id: 'fog_salt', gold: 1 }, { id: 'fog_charm', gold: 2 }, { id: 'fog_battery', gold: 1 },
  { id: 'mistlamp', gold: 3, once: true }, { id: 'mistticket', gold: 2 }, { id: 'mistmap', gold: 3 },
];

const FogCity = (() => {
  const T = THREE;
  const S = () => Game.state;
  let group = null, props = [], npcs = [], chasers = [], timers = [], tickers = [], marks = [];
  let started = null;          // 這次 startStation 的 session id
  let hintText = '';           // 事件給的提示（顯示在左下角）
  let K = null;                // 目前事件的工具箱
  let phantomT = 0, regenT = 0, hurtCD = 0, lastHurt = 0, lampOn = false, saltUntil = 0, lastPhase = '';
  const hsh = s => [...String(s)].reduce((a, c) => (a * 31 + c.codePointAt(0)) % 1000003, 7);

  /* ── 時間 ── */
  const active = () => TaipeiTime.state() === 'mist';
  const minuteOfDay = () => { const t = TaipeiTime.now(); return t.hour * 60 + t.minute + t.second / 60; };
  const phase = () => (minuteOfDay() >= 330 && minuteOfDay() < 360 ? 'fade' : 'fog');
  // 這一夜的代號：00:30 之後的日期
  const nightKey = () => TaipeiTime.date();
  function rec() {
    const s = S();
    if (!s.fog || s.fog.night !== nightKey()) return null;
    return s.fog;
  }
  function newRec(stationId) {
    const s = S();
    s.fog = { night: nightKey(), station: stationId, hp: FOG_MAX_HP, dead: false, deaths: 0, dmg: 0, escaped: false, settled: false, ev: {}, clues: [], result: null, t0: Date.now(), lamp: 100, map: false };
    saveState();
    return s.fog;
  }

  /* ── 事件分配：118 站，每站一個事件（存檔第一次進迷霧時決定，之後固定） ── */
  const CAT_COUNT = { train: 5, npc: 20, puzzle: 12, survive: 15, rescue: 15, collect: 10, challenge: 15, hidden: 12, trainev: 10 };
  const FIXED = { 南港展覽館: 'sp_expo', 台北車站: 'sp_memory', 淡水: 'sp_crossing' };
  function seeded(seed) { let x = seed % 2147483647 || 1; return () => (x = (x * 16807) % 2147483647) / 2147483647; }
  function assignment() {
    const s = S();
    if (s.fogMap && Object.keys(s.fogMap).length === Object.keys(STATIONS).length) return s.fogMap;
    s.fogSeed = s.fogSeed || (1 + Math.floor(Math.random() * 2e9));
    const rnd = seeded(s.fogSeed);
    const ids = Object.keys(STATIONS).filter(id => !FIXED[id]);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const map = { ...FIXED };
    map[ids.shift()] = 'sp_twin';   // 《兩個你》：隨機一個車站
    for (const [cat, n] of Object.entries(CAT_COUNT)) {
      const keys = FogEvents.keysOf(cat);
      for (let i = 0; i < n; i++) map[ids.shift()] = keys[i % keys.length];
    }
    s.fogMap = map; saveState();
    return map;
  }
  const eventKey = st => assignment()[st];

  /* ── 氣氛 ── */
  const MOODS = {
    fog: { bg: '#0b0f11', fog: '#1a2321', near: 4, far: 44, hemi: 1.0, sun: .15, tint: '#b9d2c9' },
    fade: { bg: '#3d474c', fog: '#7d8a8e', near: 8, far: 90, hemi: 1.35, sun: .5, tint: '#e6eef0' },
    dark: { bg: '#030405', fog: '#050708', near: 1.5, far: 13, hemi: .32, sun: 0, tint: '#8aa0a8' },
    ghost: { bg: '#120607', fog: '#2a0c0e', near: 3, far: 34, hemi: .85, sun: .1, tint: '#e0a0a0' },
    safe: { bg: '#2a3336', fog: '#5f6d70', near: 10, far: 120, hemi: 1.45, sun: .4, tint: '#dfe8ea' },
  };
  let moodName = 'fog';
  function setMood(name) { moodName = name; World.setMood(MOODS[name] || MOODS.fog); }

  /* ── 場景物件 ── */
  const mats = {};
  const M = (c, o = {}) => { const k = c + JSON.stringify(o); return mats[k] || (mats[k] = new T.MeshStandardMaterial({ color: c, roughness: o.r ?? .8, emissive: o.e || '#000', emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.o ?? 1, depthWrite: o.t ? false : true, side: o.ds ? T.DoubleSide : T.FrontSide })); };
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  function canvasSprite(draw, w = 256, h = 128, sc = 1) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(sc * w / h, sc, 1);
    return sp;
  }
  // 各種道具的樣子
  const PROP_MESH = {
    note: () => { const g = new T.Group(); const p = box(.28, .01, .2, M('#efe6cf')); p.position.y = .02; p.rotation.y = .4; g.add(p); return g; },
    paper: () => { const g = new T.Group(); for (let i = 0; i < 3; i++) { const p = box(.26, .01, .34, M('#e8e0c8')); p.position.set((i - 1) * .08, .02 + i * .01, i * .05); p.rotation.y = i * .5; g.add(p); } return g; },
    ticket: () => { const g = new T.Group(); const p = box(.2, .01, .1, M('#d8c890', { e: '#665a20', ei: .3 })); p.position.y = .02; g.add(p); return g; },
    photo: () => { const g = new T.Group(); const p = box(.16, .01, .2, M('#f4f4f0')); p.position.y = .02; p.rotation.y = -.5; g.add(p); const i = box(.13, .012, .14, M('#3a4a52')); i.position.set(0, .022, .02); i.rotation.y = -.5; g.add(i); return g; },
    coin: () => { const g = new T.Group(); const c = new T.Mesh(new T.CylinderGeometry(.07, .07, .015, 18), M('#c8a040', { e: '#806010', ei: .5, r: .3 })); c.position.y = .02; g.add(c); return g; },
    recorder: () => { const g = new T.Group(); const b = box(.18, .06, .1, M('#2a2a2e', { r: .4 })); b.position.y = .03; g.add(b); const l = box(.02, .02, .02, M('#ff3030', { e: '#ff2020', ei: 2 })); l.position.set(.06, .07, 0); g.add(l); return g; },
    box: () => { const g = new T.Group(); const b = box(.5, .4, .4, M('#6a5038')); b.position.y = .2; g.add(b); return g; },
    locker: () => { const g = new T.Group(); const b = box(.8, 1.8, .5, M('#7a8a94', { r: .4 })); b.position.y = .9; g.add(b); for (let i = 0; i < 3; i++) { const d = box(.7, .5, .02, M('#9aa8b0', { r: .35 })); d.position.set(0, .4 + i * .58, .26); g.add(d); } const k = box(.12, .08, .03, M('#20ff80', { e: '#20ff80', ei: 1.5 })); k.position.set(.25, 1.0, .28); g.add(k); return g; },
    console: () => { const g = new T.Group(); const b = box(.9, 1.1, .5, M('#30363c', { r: .5 })); b.position.y = .55; g.add(b); const s = box(.7, .4, .02, M('#3080ff', { e: '#2060ff', ei: 1.2 })); s.position.set(0, .85, .26); g.add(s); return g; },
    clock: () => { const g = new T.Group(); const c = new T.Mesh(new T.CylinderGeometry(.3, .3, .06, 24), M('#f4f4f0', { e: '#fff', ei: .25 })); c.rotation.x = Math.PI / 2; c.position.y = 1.6; g.add(c); const h = box(.02, .22, .02, M('#111')); h.position.set(0, 1.68, .04); g.add(h); const pole = box(.05, 1.3, .05, M('#333')); pole.position.y = .65; g.add(pole); return g; },
    radio: () => { const g = new T.Group(); const b = box(.36, .22, .14, M('#5a3a2a')); b.position.y = .11; g.add(b); const sp = box(.2, .14, .01, M('#222')); sp.position.set(-.04, .12, .075); g.add(sp); return g; },
    flower: () => { const g = new T.Group(); for (let i = 0; i < 5; i++) { const f = new T.Mesh(new T.SphereGeometry(.06, 8, 6), M(['#f0f0f0', '#e8d0e0', '#f4f0c8'][i % 3])); f.position.set((i - 2) * .05, .32 + (i % 2) * .05, 0); g.add(f); } const st = box(.02, .3, .02, M('#3a6a2a')); st.position.y = .15; g.add(st); return g; },
    bag: () => { const g = new T.Group(); const b = box(.36, .3, .16, M('#4a3a5a')); b.position.y = .15; g.add(b); return g; },
    umbrella: () => { const g = new T.Group(); const u = new T.Mesh(new T.ConeGeometry(.08, .9, 8), M('#1a1a2a')); u.position.y = .45; g.add(u); return g; },
    door: () => {
      const g = new T.Group(); const f = box(1.3, 2.3, .12, M('#2a2e33')); f.position.y = 1.15; g.add(f);
      const d = box(1.1, 2.1, .05, M('#e8f4ff', { e: '#bfe8ff', ei: 1.6, t: true, o: .85 })); d.position.set(0, 1.07, .06); g.add(d);
      const glow = new T.Mesh(new T.PlaneGeometry(2.4, 3), M('#bfe8ff', { e: '#bfe8ff', ei: 1, t: true, o: .18, ds: true })); glow.position.set(0, 1.3, .1); g.add(glow); g.userData.pulse = glow;
      return g;
    },
    reddoor: () => { const g = new T.Group(); const f = box(1.2, 2.2, .1, M('#3a0c0c')); f.position.y = 1.1; g.add(f); const d = box(1.0, 2.0, .05, M('#8a1a1a', { e: '#5a0808', ei: .8 })); d.position.set(0, 1.0, .06); g.add(d); return g; },
    symbol: () => { const sp = canvasSprite(g => { g.strokeStyle = '#9fe0c8'; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 40, 0, 6.3); g.moveTo(64, 14); g.lineTo(64, 114); g.moveTo(24, 64); g.lineTo(104, 64); g.stroke(); }, 128, 128, .6); sp.position.y = 1.4; const g = new T.Group(); g.add(sp); return g; },
    stain: () => { const g = new T.Group(); const p = new T.Mesh(new T.CircleGeometry(.5, 18), M('#3a2a2a', { t: true, o: .6 })); p.rotation.x = -Math.PI / 2; p.position.y = .012; g.add(p); return g; },
    seatmark: () => { const g = new T.Group(); for (const x of [-.3, .3]) { const p = new T.Mesh(new T.PlaneGeometry(.4, .4), M('#2a2a2a', { t: true, o: .45 })); p.rotation.x = -Math.PI / 2; p.position.set(x, .012, 0); g.add(p); } return g; },
    tv: () => { const g = new T.Group(); const b = box(.9, .6, .12, M('#1a1a1a')); b.position.y = 2.2; g.add(b); const s = box(.8, .5, .02, M('#9ab0c0', { e: '#6a90a8', ei: 1.3 })); s.position.set(0, 2.2, .07); g.add(s); return g; },
    lamp: () => { const g = new T.Group(); const l = new T.Mesh(new T.SphereGeometry(.14, 12, 8), M('#ffd890', { e: '#ffb840', ei: 2 })); l.position.y = .3; g.add(l); return g; },
    exhibit: () => { const g = new T.Group(); const b = box(.8, 1, .8, M('#e8e6e0', { r: .5 })); b.position.y = .5; g.add(b); const gl = box(.7, .6, .7, M('#cfe8f0', { t: true, o: .25, r: .1 })); gl.position.y = 1.3; g.add(gl); return g; },
    shard: () => { const g = new T.Group(); const m = new T.Mesh(new T.OctahedronGeometry(.12), M('#c8e8ff', { e: '#88c8ff', ei: 1.2 })); m.position.y = .5; g.add(m); g.userData.spin = m; return g; },
  };
  function ensureGroup() { if (!group) { group = new T.Group(); World.scene.add(group); } return group; }
  // 道具：靠近按互動鍵；hidden 的要開霧燈才看得到
  function prop(kind, pos, o = {}) {
    const mesh = (PROP_MESH[kind] || PROP_MESH.note)();
    mesh.position.set(pos.x, pos.y, pos.z); if (o.rot != null) mesh.rotation.y = o.rot;
    ensureGroup().add(mesh);
    const p = { kind, x: pos.x, y: pos.y, z: pos.z, mesh, label: o.label || '調查', r: o.r || 1.3, use: o.use || (() => {}), hidden: !!o.hidden, on: true, tag: o.tag, data: o.data || {} };
    if (p.hidden) mesh.visible = false;
    if (o.glint !== false && !['door', 'reddoor', 'locker', 'console', 'clock', 'tv', 'exhibit'].includes(kind)) {   // 地上的小東西會閃一下
      const sp = canvasSprite(g => { const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,230,.9)'); gr.addColorStop(1, 'rgba(255,255,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, 64, 64, .35);
      sp.position.y = .25; mesh.add(sp); p.glint = sp;
    }
    props.push(p);
    return p;
  }
  function removeProp(p) { if (!p) return; p.on = false; group && group.remove(p.mesh); props = props.filter(x => x !== p); }

  /* ── 人物 ── */
  const SKINS = ['#d8c8c0', '#cdb8a8', '#c0b0a8', '#e0d4cc', '#b8a898'];
  function look(base = {}) {
    const r = Math.random;
    return { skin: SKINS[(r() * SKINS.length) | 0], hair: ['short', 'mush', 'long', 'bob'][(r() * 4) | 0], hairColor: ['#151515', '#2a2420', '#5a5a5a', '#c8c8c8'][(r() * 4) | 0], top: ['#3a3e44', '#4a4038', '#2a3038', '#5a5048'][(r() * 4) | 0], bottom: ['#22252a', '#2e2a26', '#383838'][(r() * 3) | 0], height: .95 + r() * .1, ...base };
  }
  function person(lk, pos, o = {}) {
    const rig = Human3D.buildPerson(lk);
    if (o.ghostly) rig.root.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = o.ghostly; m.material.depthWrite = false; } });
    if (o.shadow) rig.root.traverse(m => { if (m.isMesh && m.material) { m.material = new T.MeshBasicMaterial({ color: '#050505', transparent: true, opacity: .82 }); } });
    rig.root.position.set(pos.x, pos.y, pos.z);
    ensureGroup().add(rig.root);
    const n = { id: o.id || 'fn' + npcs.length, name: o.name || '？？？', role: o.role || '', rig, x: pos.x, y: pos.y, z: pos.z, face: o.face ?? Math.random() * 6.28, behavior: o.behavior || 'idle', speed: o.speed ?? .8, talk: o.talk || null, hostile: o.hostile || null, home: { ...pos }, target: null, wait: 0, cd: 0, data: o.data || {}, label: o.label, hidden: !!o.hidden, lie: !!o.lie, armsUp: !!o.armsUp };
    if (o.sit) rig.sit = 1;
    if (n.lie) { rig.root.rotation.z = Math.PI / 2; }
    if (n.hidden) rig.root.visible = false;
    npcs.push(n);
    return n;
  }
  function removeNpc(n) { if (!n) return; group && group.remove(n.rig.root); npcs = npcs.filter(x => x !== n); }

  // 幽靈、影子之類追人的東西
  function ghostMesh(color = '#f0f2f8', op = .75) {
    const g = new T.Group(), m = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .3, transparent: true, opacity: op, roughness: .9, side: T.DoubleSide, depthWrite: false });
    const body = new T.Mesh(new T.CylinderGeometry(.25, .45, 1.3, 16, 1, true), m); body.position.y = .65; g.add(body);
    const head = new T.Mesh(new T.SphereGeometry(.27, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m); head.position.y = 1.3; g.add(head);
    for (const sx of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.045, 8, 6), new T.MeshBasicMaterial({ color: '#000' })); e.position.set(sx * .09, 1.38, .24); g.add(e); }
    return g;
  }
  function chaser(kind, pos, o = {}) {
    let mesh, rig = null;
    if (kind === 'ghost') mesh = ghostMesh(o.color, o.op);
    else {
      const lk = kind === 'zombie' ? look({ skin: '#8aa080', top: ['#4a4038', '#3a4a5a', '#5a3a3a'][(Math.random() * 3) | 0], hair: 'mush', hairColor: '#2a2a20' }) : look({ top: '#000', bottom: '#000' });
      rig = Human3D.buildPerson(lk); mesh = rig.root;
      if (kind === 'shadow') mesh.traverse(m => { if (m.isMesh && m.material) m.material = new T.MeshBasicMaterial({ color: '#020202', transparent: true, opacity: .85, depthWrite: false }); });
    }
    mesh.position.set(pos.x, pos.y, pos.z); ensureGroup().add(mesh);
    const c = { kind, mesh, rig, x: pos.x, y: pos.y, z: pos.z, face: 0, speed: o.speed ?? 2.0, dmg: o.dmg ?? 20, range: o.range ?? 14, cd: 0, on: true, mode: o.mode || 'chase', home: { ...pos }, why: o.why || '被抓到了', sleep: o.sleep || 0, onHit: o.onHit, data: o.data || {}, wanderT: 0 };
    chasers.push(c);
    return c;
  }
  function removeChaser(c) { if (!c) return; c.on = false; group && group.remove(c.mesh); chasers = chasers.filter(x => x !== c); }

  /* ── 站內的點 ── */
  function pointIn(area, rnd = Math.random) {
    const L = World.layout;
    for (let i = 0; i < 40; i++) {
      let x, y, z;
      if (area.kind === 'platform') { const P = area.P || L.platforms[(rnd() * L.platforms.length) | 0]; x = P.x + (rnd() - .5) * 58; z = P.z + (rnd() - .5) * 4.4; y = P.y; }
      else if (area.kind === 'unpaid') { const U = L.unpaid; x = U.x0 + 1.5 + rnd() * (U.x1 - U.x0 - 3); z = U.z0 + 1.2 + rnd() * (U.z1 - U.z0 - 3.5); y = 0; }
      else { const C = L.concourse; x = C.x0 + 1.5 + rnd() * (C.x1 - C.x0 - 3); z = C.z0 + 1.5 + rnd() * (L.gateZ - C.z0 - 3); y = 0; }
      const h = World.groundAt(x, z, y);
      if (h != null && Math.abs(h - y) < .1 && !(L.obstacles || []).some(o => Math.abs(y - o.y) < 1 && x > o.x0 - .5 && x < o.x1 + .5 && z > o.z0 - .5 && z < o.z1 + .5)) return { x, y, z };
    }
    return { x: 0, y: 0, z: L.gateZ - 3 };
  }
  // 分散在大廳、非付費區、各月台的 n 個點（彼此至少相距 minD）
  function spread(n, { areas, minD = 6, rnd = Math.random } = {}) {
    const L = World.layout, out = [];
    const pool = areas || ['concourse', 'unpaid', ...L.platforms.map((P, i) => 'p' + i)];
    for (let k = 0; k < n * 30 && out.length < n; k++) {
      const a = pool[(out.length + k) % pool.length];
      const area = a[0] === 'p' ? { kind: 'platform', P: L.platforms[+a.slice(1)] } : { kind: a };
      const pt = pointIn(area, rnd);
      if (out.every(o => Math.hypot(o.x - pt.x, o.z - pt.z) > minD || Math.abs(o.y - pt.y) > 1)) out.push(pt);
    }
    while (out.length < n) out.push(pointIn({ kind: 'concourse' }, rnd));
    return out;
  }
  const near = (o, p, r) => o && Math.abs(o.y - p.y) < .9 && Math.hypot(o.x - p.x, o.z - p.z) < r;
  const dist = (o, p) => (Math.abs(o.y - p.y) < .9 ? Math.hypot(o.x - p.x, o.z - p.z) : 1e9);

  /* ── 生命值 ── */
  function hurt(n, why) {
    const r = rec(); if (!r || r.dead || r.escaped || hurtCD > 0) return false;
    if (S().inv.fog_charm > 0) { S().inv.fog_charm--; hurtCD = 1.2; saveState(); toast('<b>🧧 平安符替你擋下了</b><span>符紙變成灰，飄走了。</span>'); hud(); return false; }
    r.hp = Math.max(0, r.hp - n); r.dmg += n; hurtCD = .9; lastHurt = performance.now();
    if (K && K.onHurt) K.onHurt(n, why);
    saveState(); Sound.fog('hit');
    flash('#c00', .45);
    toast(`<b>💔 −${n}　${esc(why)}</b><span>生命值 ${r.hp} / ${FOG_MAX_HP}</span>`, 'warn');
    if (r.hp <= 0) die(why);
    hud();
    return true;
  }
  function heal(n, quiet) {
    const r = rec(); if (!r || r.dead) return;
    r.hp = Math.min(FOG_MAX_HP, r.hp + n); saveState(); hud();
    if (!quiet) toast(`<b>❤ +${n}</b><span>生命值 ${r.hp} / ${FOG_MAX_HP}</span>`);
  }
  function flash(color, a) {
    const el = $('#fogFlash'); if (!el) return;
    el.style.background = color; el.style.opacity = a; el.hidden = false;
    clearTimeout(flash.t); flash.t = setTimeout(() => { el.style.opacity = 0; }, 120);
  }
  function die(why) {
    const r = rec(); if (!r) return;
    if (S().inv.mistticket > 0) {   // 霧中車票：自動復活一次
      S().inv.mistticket--; r.hp = 50; saveState(); hud();
      toast('<b>🎟️ 霧中車票燒掉了</b><span>你帶著 50 點生命值站了起來。</span>', 'level');
      return;
    }
    r.dead = true; r.deaths++; r.hp = 0; saveState();
    Sound.fog('die');
    for (const c of chasers) c.sleep = 1e9;
    World.setInput(false); Dialog.close();
    if (K && K.onDeath) K.onDeath(why);
    setTimeout(showDeath, 900);
  }
  function showDeath() {
    const r = rec(); if (!r || !r.dead) return;
    const s = S(), mins = TaipeiTime.minutesToFirstTrain();
    overlay(`<div class="fog-card dead">
      <p class="fog-kicker">迷霧之城</p><h2>你倒下了</h2>
      <p>霧把你吞了進去。<br>06:00 首班車的時候，你會在月台上醒來。</p>
      <p class="fog-sub">距離 06:00 還有 ${Math.floor(mins / 60)} 小時 ${mins % 60} 分　本夜倒下 ${r.deaths} 次</p>
      <div class="fog-btns">
        <button class="btn primary" id="fogRevive" ${s.money < FOG_REVIVE_COST ? 'disabled' : ''}>支付 NT$ ${FOG_REVIVE_COST} 復活（餘額 NT$ ${s.money}）</button>
        <button class="btn ghost" id="fogWait">等待 06:00 自動復活</button>
      </div></div>`);
    $('#fogRevive').onclick = () => revive(true);
    $('#fogWait').onclick = () => waitDawn();
  }
  function revive(paid) {
    const r = rec(); if (!r) return;
    const s = S();
    if (paid) { if (s.money < FOG_REVIVE_COST) return; s.money -= FOG_REVIVE_COST; toast(`<b>扣款 NT$ ${FOG_REVIVE_COST}</b><span>復活費用　餘額 NT$ ${s.money}</span>`); }
    r.dead = false; r.hp = paid ? 60 : FOG_MAX_HP; saveState(); updateHud();
    closeOverlay(); World.setInput(true);
    if (K && K.onRevive) K.onRevive(); else respawnSafe();
    for (const c of chasers) { c.sleep = 4; c.x = c.home.x; c.y = c.home.y; c.z = c.home.z; }
    hurtCD = 3; hud();
  }
  function respawnSafe() {
    const L = World.layout; if (!L || L.alias) return;
    World.spawnInConcourse();
  }
  function waitDawn() {
    const mins = TaipeiTime.minutesToFirstTrain();
    overlay(`<div class="fog-card dead"><p class="fog-kicker">迷霧之城</p><h2>等待黎明</h2>
      <p>你躺在冰冷的地板上，聽著霧裡的聲音。</p><p class="fog-sub" id="fogWaitLeft">距離 06:00 還有 ${Math.floor(mins / 60)} 小時 ${mins % 60} 分</p>
      <div class="fog-btns"><button class="btn primary" id="fogRevive2" ${S().money < FOG_REVIVE_COST ? 'disabled' : ''}>還是付 NT$ ${FOG_REVIVE_COST} 復活</button><button class="btn ghost" id="fogTitle">回到標題</button></div></div>`);
    $('#fogRevive2').onclick = () => revive(true);
    $('#fogTitle').onclick = () => { closeOverlay(); newSession(); Game.ride = null; renderTitle(); showScreen('title'); };
  }

  /* ── 畫面：HUD、遮罩 ── */
  function overlay(html) { const o = $('#fogOverlay'); o.innerHTML = html; o.hidden = false; }
  function closeOverlay() { $('#fogOverlay').hidden = true; }
  function hud() {
    const el = $('#fogHud'); if (!el) return;
    const r = rec();
    if (!r || !started || !active()) { el.hidden = true; return; }
    el.hidden = false;
    const mins = TaipeiTime.minutesToFirstTrain(), m = minuteOfDay(), toFade = Math.max(0, Math.ceil(330 - m));
    const s = S(), inv = s.inv;
    const quick = [['fog_tea', '🫖'], ['firstaid', '🩹'], ['fog_salt', '🧂'], ['mistmap', '🗺️'], ['fog_battery', '🔋']].filter(([id]) => inv[id] > 0);
    const html = `<div class="fh-hp" title="生命值"><i style="width:${r.hp}%"></i><span>❤ ${r.hp} / ${FOG_MAX_HP}</span></div>
      <div class="fh-row"><b>🌫 迷霧之城</b><span>${r.escaped ? '已離開迷霧，等待首班車' : phase() === 'fade' ? '霧正在消散' : `消散 ${Math.floor(toFade / 60)}:${String(toFade % 60).padStart(2, '0')}`}・首班車 ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}</span></div>
      <div class="fh-btns"><button data-fh="notes">📓 筆記 ${r.clues.length}</button>${inv.mistlamp > 0 ? `<button data-fh="lamp" aria-pressed="${lampOn}">🏮 ${Math.round(r.lamp)}%</button>` : ''}${quick.map(([id, ic]) => `<button data-fh="${id}">${ic}×${inv[id]}</button>`).join('')}</div>`;
    if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html; }
  }
  function onHudClick(e) {
    const b = e.target.closest('[data-fh]'); if (!b) return;
    const k = b.dataset.fh, s = S(), r = rec(); if (!r || r.dead) return;
    Sound.click();
    if (k === 'notes') return notes();
    if (k === 'lamp') { if (r.lamp <= 0) return toast('<b>🏮 霧燈沒電了</b><span>霧裡的攤販有賣電池。</span>', 'warn'); setLamp(!lampOn); }
    if (k === 'fog_tea' || k === 'firstaid') { s.inv[k]--; heal(k === 'fog_tea' ? 40 : 25); }
    if (k === 'fog_salt') { s.inv.fog_salt--; saltUntil = performance.now() + 15000; toast('<b>🧂 撒了一把鹽</b><span>附近的東西退開了（15 秒）。</span>'); for (const c of chasers) if (dist(c, World.player) < 8) { c.sleep = 15; } }
    if (k === 'fog_battery') { s.inv.fog_battery--; r.lamp = 100; toast('<b>🔋 霧燈電量補滿了</b>'); }
    if (k === 'mistmap') {
      if (r.map) return toast('<b>🗺️ 霧之地圖</b><span>今天晚上已經用過了，地圖上的字都糊掉了。</span>', 'warn');
      s.inv.mistmap--; r.map = true; reveal(60000);
    }
    saveState(); hud();
  }
  function setLamp(on) {
    lampOn = on; World.setPlayerLight(on ? 2.2 : 0, moodName === 'dark' ? 11 : 9);
    for (const p of props) if (p.hidden) p.mesh.visible = on && dist(p, World.player) < 7;
    hud();
  }
  function reveal(ms) {
    for (const m of marks) group && group.remove(m); marks = [];
    const tgt = [...props.filter(p => p.on && (p.tag || p.kind === 'door')), ...npcs.filter(n => n.data.key)];
    for (const o of tgt) {
      const sp = canvasSprite(g => { g.fillStyle = '#9fe0c8'; g.beginPath(); g.moveTo(32, 60); g.lineTo(8, 20); g.lineTo(56, 20); g.fill(); }, 64, 64, .6);
      sp.position.set(o.x, o.y + 2.6, o.z); sp.material.depthTest = false; ensureGroup().add(sp); marks.push(sp);
    }
    toast(`<b>🗺️ 霧之地圖</b><span>標出了 ${tgt.length} 個地方（${ms / 1000} 秒）。</span>`, 'level');
    setTimeout(() => { for (const m of marks) group && group.remove(m); marks = []; }, ms);
  }
  function notes() {
    const r = rec(); if (!r) return;
    Dialog.show({ name: '霧中筆記', role: `本站：${r.station}` }, r.clues.length ? r.clues.map(c => `・${c}`).join('<br>') : '還沒有記下任何東西。<br><small>調查到的線索、聽到的話，會自動記在這裡。</small>', [{ label: '關閉', run: () => Dialog.close() }]);
  }

  /* ── 環境：霧中的人、攤販、穿越月台的列車、小小的異常 ── */
  const WEIRD = [
    { name: '睡在紙箱上的人', role: '流浪漢', lk: { top: '#4a4238', bottom: '#3a342c', hair: 'mush', hairColor: '#3a3a3a', old: true }, beh: 'lie', area: 'unpaid',
      lines: ['「……別踩到我的箱子。」', '「霧來的時候，不要靠近月台邊。上次有個年輕人……算了。」', '「你也回不去了？那就坐下來等吧。天總會亮的。」', '「我在這裡睡了十年，第一次看到霧這麼濃。」'] },
    { name: '面對牆壁的女人', role: '？？？', lk: { girl: true, hair: 'long', hairColor: '#0a0a0a', top: '#d8d8d4', bottom: '#d8d8d4', skirt: true }, beh: 'wall', area: 'concourse',
      lines: ['她沒有回頭。「你聽到了嗎？牆裡面有列車的聲音。」', '「不要看我的臉。」', '她小聲地數著：「……三百一十二、三百一十三……」'] },
    { name: '數硬幣的老人', role: '？？？', lk: { old: true, hair: 'short', hairColor: '#cfcfcf', top: '#5a4a3a' }, beh: 'sit', area: 'concourse',
      lines: ['「一塊、兩塊……又少一塊。」他抬頭看你：「是不是你拿的？」', '「以前的車票是硬紙板，剪票員會剪一個洞。現在連洞都沒有了。」', '「這些硬幣，等天亮就會變成葉子。」'] },
    { name: '沒有臉的站務員', role: '站務員？', lk: { top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b', skin: '#e8e4e0' }, beh: 'watch', area: 'concourse',
      lines: ['「本站……已經……結束營運。」聲音像是從很遠的廣播傳來。', '「請旅客……不要……離開……本站。」', '他把頭轉向你，但帽簷下什麼都沒有。'] },
    { name: '拿著氣球的小孩', role: '？？？', lk: { height: .62, hair: 'bob', girl: true, top: '#c84040', bottom: '#2a2a2a' }, beh: 'flee', area: 'concourse',
      lines: ['「你要跟我玩捉迷藏嗎？你當鬼。」', '「媽媽說在這裡等她。她已經去了好久好久。」', '咯咯咯的笑聲，從你背後傳過來。'] },
    { name: '一直看錶的上班族', role: '？？？', lk: { top: '#2a2e36', pattern: 'shirt', accent: '#6a1a2a', bottom: '#1e2128' }, beh: 'pace', area: 'platform',
      lines: ['「末班車呢？末班車怎麼還沒來？」他的錶停在 00:29。', '「我明天還要開會……明天……今天是哪一天？」', '「你看到我的公事包嗎？黑色的，上面有我的名字。……我叫什麼名字？」'] },
    { name: '穿雨衣的男人', role: '奇怪的人', lk: { top: '#d8c020', coat: true, bottom: '#2a2a2a', hat: 'beanie', hatColor: '#d8c020' }, beh: 'stalk', area: 'concourse', hostile: { dmg: 12, why: '被穿雨衣的男人推倒' },
      lines: ['「外面在下雨。一直在下。」雨衣上的水滴到地上，地上卻是乾的。', '他靠得太近了。'] },
    { name: '抱著娃娃的女人', role: '奇怪的人', lk: { girl: true, hair: 'long', hairColor: '#3a2a20', top: '#6a4a5a', bottom: '#2a2a2a' }, beh: 'stalk', area: 'unpaid', hostile: { dmg: 10, why: '被抱著娃娃的女人抓傷' },
      lines: ['「噓，寶寶在睡覺。你吵醒他了。」', '「你要不要抱抱看？」她把娃娃遞過來，娃娃的眼睛眨了一下。'] },
    { name: '撿東西的清潔工', role: '清潔人員', lk: { top: '#3a6a8a', bottom: '#2a3a4a', hat: 'cap', hatColor: '#3a6a8a', old: true }, beh: 'wander', area: 'concourse',
      lines: ['「這個時間還有人？……霧裡撿到的東西，天亮就不見了。你要的話自己拿。」', '「月台上那些不是人。別跟他們說話。」', '「拖把拖過的地方，會留下腳印。不是我的。」'] },
  ];
  function spawnAmbient(stationId, rnd) {
    const L = World.layout;
    const n = 3 + ((rnd() * 3) | 0);
    const pool = WEIRD.slice().sort(() => rnd() - .5);
    let hostiles = 0;
    for (let i = 0; i < n && i < pool.length; i++) {
      const w = pool[i];
      if (w.hostile && (hostiles >= 1 || rnd() < .4)) continue;
      if (w.hostile) hostiles++;
      const area = w.area === 'platform' ? { kind: 'platform', P: L.platforms[(rnd() * L.platforms.length) | 0] } : { kind: w.area };
      const pos = pointIn(area, rnd);
      const nn = person(look(w.lk), pos, { name: w.name, role: w.role, behavior: w.beh, speed: w.beh === 'stalk' ? 1.1 : .7, sit: w.beh === 'sit', lie: w.beh === 'lie', hostile: w.hostile ? { ...w.hostile, range: 4.5 } : null,
        talk: npc => say(npc, w.lines[(Math.random() * w.lines.length) | 0], [{ label: '……', run: () => Dialog.close() }]) });
      nn.ambient = true;
      if (w.beh === 'wall') nn.face = 0;
    }
    // 夜行攤販：用黃金買迷霧用品
    const C = L.concourse, mp = { x: C.x0 + 2.2, y: 0, z: C.z0 + 2.2 };
    const mpos = World.groundAt(mp.x, mp.z, 0) != null ? mp : pointIn({ kind: 'concourse' }, rnd);
    const m = person(look({ top: '#3a3a4a', coat: true, bottom: '#2a2a30', hat: 'beret', hatColor: '#4a4a5a', lantern: true, hair: 'long', hairColor: '#c8c8d0' }), mpos, { name: '提燈的攤販', role: '迷霧裡的商人', behavior: 'watch', speed: 0, talk: () => shop() });
    m.data.merchant = true;
    const lampP = prop('lamp', { x: mpos.x + .7, y: 0, z: mpos.z + .3 }, { glint: false, label: '看看攤位', use: () => shop() });
    lampP.r = 1.0;
  }
  function shop() {
    const s = S(), r = rec();
    say({ name: '提燈的攤販', role: `你的黃金：🪙 ${s.gold || 0}` }, '「霧裡新台幣沒有用。黃金，只收黃金。」', FOG_SHOP.map(g => {
      const it = ITEMS[g.id], owned = g.once && s.inv[g.id] > 0;
      return { label: `${it.icon} ${it.name}　🪙 ${g.gold}${owned ? '（已擁有）' : s.inv[g.id] ? `（有 ${s.inv[g.id]}）` : ''}`, disabled: owned || (s.gold || 0) < g.gold, run: () => {
        s.gold -= g.gold; s.inv[g.id] = (s.inv[g.id] || 0) + 1; if (g.id === 'mistlamp' && r) r.lamp = 100;
        saveState(); updateHud(); hud(); Sound.itemGet(); toast(`<b>買了 ${it.icon} ${it.name}</b><span>剩下 🪙 ${s.gold}</span>`); shop();
      } };
    }).concat([{ label: '離開', run: () => Dialog.close() }]));
  }
  // 新台幣不能用：店家、販賣機
  function cashBlocked(kind) {
    if (!active() || !started) return false;
    if (kind === 'vending') say({ name: '自動販賣機', role: '迷霧之城' }, '螢幕閃了幾下，跳出一行字：<b>「本機只收黃金」</b>。投幣口變成了一道細細的縫，邊緣泛著金光。', [{ label: '用黃金買', primary: true, run: shop }, { label: '離開', run: () => Dialog.close() }]);
    else Dialog.info('鐵門拉下來了', '店的鐵門拉下來了，門上用粉筆寫著：「霧裡不收新台幣」。<br><small>大廳角落有個提燈的攤販，只收黃金。</small>');
    return true;
  }

  // 穿越月台的列車：廣播後幾秒高速通過，站在月台邊緣（黃線外）會被撞
  async function phantom() {
    const L = World.layout, p = World.player;
    const z = World.zone(); if (z.kind !== 'platform' || !rec() || rec().dead) return;
    const P = z.P, side = Math.random() < .5 ? 1 : -1, k = L.platforms.indexOf(P);
    Sound.fog('radio');
    toast('<b>📢 「通過列車，請勿靠近月台邊緣」</b><span>廣播的聲音斷斷續續，月台門不知道什麼時候打開了。</span>', 'warn');
    await sleep(6000);
    if (!started || World.zone().P !== P) return;
    const tr = World.spawnTrain(k, side, P.line, 1, null);
    tintTrain(tr, '#2a2a2a', '#ff3030');
    tr.x = -200; Sound.fog('rush');
    const t0 = performance.now(); let hit = false;
    await new Promise(res => {
      const step = now => {
        const u = Math.min(1, (now - t0) / 2600); tr.x = -200 + 400 * u; tr.group.position.x = tr.P.x + tr.x;
        const pp = World.player, edge = (pp.z - P.z) * side;
        if (!hit && Math.abs(pp.y - P.y) < .5 && edge > 2.45 && Math.abs(pp.x - (tr.P.x + tr.x)) < 32) { hit = true; hurt(35, '被通過的列車撞到'); World.pushPlayer(0, -side * .9); }
        u < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    });
    World.removeTrain(tr);
    if (!hit && Math.abs(p.z - P.z) > 2.2) toast('<b>好險</b><span>列車擦過你身邊，車窗裡每個人都轉頭看著你。</span>');
  }
  function tintTrain(tr, body, light) {
    tr.group.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const m = o.material.clone();
      if (m.color) m.color.multiplyScalar(.28);
      if (m.emissive && m.emissiveIntensity > .5) { m.emissive.set(light); m.emissiveIntensity = 1.2; }
      o.material = m;
    });
  }

  /* ── 迷霧時段的車站風格：褪色、發霉、鏽蝕，燈管閃爍，紅色緊急照明，積水、紙屑、封鎖線、塗鴉 ── */
  let flickers = [], styledGroup = null;
  const GRAFFITI = ['不要回頭', '00:30', '他還在月台上', '下一站 霧', '出口不是出口', '數到一百再走', '你看到我了嗎', '不要上那班車', '天亮以前', '別相信廣播'];
  function restyle(stationId) {
    const g = World.stationGroup; if (!g) return;
    styledGroup = g;
    if (g.userData.fogFlickers) { flickers = g.userData.fogFlickers.slice(); decay(stationId); return; }   // 已經換過風格（同一座車站重新進入）
    flickers = [];
    const cache = new Map(), hsl = {};
    g.traverse(o => {
      if (!o.isMesh || !o.material) return;
      const conv = m => {
        if (cache.has(m)) return cache.get(m);
        const c = m.clone();
        const lit = c.emissive && c.emissiveIntensity > .5 && (c.emissive.r + c.emissive.g + c.emissive.b) > .6;
        if (c.color) { c.color.getHSL(hsl); c.color.setHSL(hsl.h * .9 + .38 * .1, hsl.s * .3, hsl.l * (lit ? .8 : .5)); }
        if (lit) { const red = flickers.length % 7 === 3; c.emissive.set(red ? '#ff2a1a' : '#cfe8d8'); c.emissiveIntensity = red ? 1.4 : 1.0; flickers.push({ m: c, base: c.emissiveIntensity, ph: Math.random() * 100, dead: Math.random() < .18 }); }
        else if (c.emissive && c.emissiveIntensity > 0) c.emissiveIntensity *= .35;
        if ('roughness' in c) c.roughness = Math.min(1, (c.roughness || .7) + .25);
        if ('metalness' in c) c.metalness = (c.metalness || 0) * .5;
        cache.set(m, c); return c;
      };
      o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    });
    g.userData.fogFlickers = flickers.slice();
    decay(stationId);
  }
  function decay(stationId) {
    const L = World.layout, grp = ensureGroup(), rnd = seeded(hsh(stationId + 'decay'));
    // 積水（會反光的深色水窪）
    const water = new T.MeshStandardMaterial({ color: '#0a0f10', roughness: .05, metalness: .6, transparent: true, opacity: .75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const stainM = new T.MeshStandardMaterial({ color: '#2a2a1e', roughness: 1, transparent: true, opacity: .45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const paperM = new T.MeshStandardMaterial({ color: '#8a8470', roughness: 1, side: T.DoubleSide });
    for (let i = 0; i < 26; i++) {
      const area = i % 3 === 0 ? { kind: 'unpaid' } : i % 3 === 1 ? { kind: 'concourse' } : { kind: 'platform' };
      const pt = pointIn(area, rnd);
      const pud = new T.Mesh(new T.CircleGeometry(.4 + rnd() * .9, 20), i % 2 ? water : stainM);
      pud.rotation.x = -Math.PI / 2; pud.scale.set(1, .5 + rnd() * .6, 1); pud.position.set(pt.x, pt.y + .02, pt.z); grp.add(pud);
      for (let j = 0; j < 3; j++) { const pp = new T.Mesh(new T.PlaneGeometry(.22, .3), paperM); pp.rotation.set(-Math.PI / 2, 0, rnd() * 6); pp.position.set(pt.x + (rnd() - .5) * 3, pt.y + .025 + j * .002, pt.z + (rnd() - .5) * 3); grp.add(pp); }
    }
    // 牆上的霉斑和塗鴉（大廳後牆）
    const C = L.concourse;
    for (let i = 0; i < 9; i++) {
      const x = C.x0 + 4 + rnd() * (C.x1 - C.x0 - 8);
      const mold = canvasSprite(g => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(20,28,16,.7)'); gr.addColorStop(.6, 'rgba(30,40,22,.35)'); gr.addColorStop(1, 'rgba(30,40,22,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }, 128, 128, 1.6 + rnd() * 1.4);
      mold.position.set(x, 1 + rnd() * 2.4, C.z0 + .08); grp.add(mold);
    }
    GRAFFITI.slice(0, 5).forEach((t, i) => {
      const w = GRAFFITI[(hsh(stationId) + i * 3) % GRAFFITI.length];
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const g2 = c.getContext('2d'); g2.font = '900 76px "Noto Sans TC", sans-serif'; g2.fillStyle = ['#a82020', '#d8d8d0', '#3a8a5a'][i % 3]; g2.globalAlpha = .85; g2.translate(20, 96); g2.rotate(-.04 + rnd() * .08); g2.fillText(w, 0, 0);
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      const pl = new T.Mesh(new T.PlaneGeometry(2.6, .65), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      pl.position.set(C.x0 + 6 + i * (C.x1 - C.x0 - 12) / 5 + rnd() * 3, 1.3 + rnd() * .8, C.z0 + .06); grp.add(pl);
    });
    // 封鎖膠帶（月台盡頭）、紅色緊急燈
    const tapeTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g2 = c.getContext('2d'); for (let x = 0; x < 256; x += 32) { g2.fillStyle = (x / 32) % 2 ? '#1a1a1a' : '#e8c020'; g2.beginPath(); g2.moveTo(x, 0); g2.lineTo(x + 32, 0); g2.lineTo(x + 16, 32); g2.lineTo(x - 16, 32); g2.fill(); } const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; t.repeat.set(4, 1); t.colorSpace = T.SRGBColorSpace; return t; })();
    const tapeM = new T.MeshBasicMaterial({ map: tapeTex, side: T.DoubleSide });
    for (const P of L.platforms) for (const ex of [-1, 1]) {
      for (const y of [.8, 1.25]) { const tp = new T.Mesh(new T.PlaneGeometry(5.2, .1), tapeM); tp.rotation.y = Math.PI / 2; tp.rotation.x = (rnd() - .5) * .2; tp.position.set(P.x + ex * 32.4, P.y + y, P.z); grp.add(tp); }
      const em = new T.Mesh(new T.BoxGeometry(.3, .14, .14), new T.MeshStandardMaterial({ color: '#400', emissive: '#ff1a0a', emissiveIntensity: 2 }));
      em.position.set(P.x + ex * 20, P.y + (P.under ? 3.2 : 3.5), P.z); grp.add(em); flickers.push({ m: em.material, base: 2, ph: rnd() * 100, slow: true });
    }
    for (let x = C.x0 + 8; x < C.x1 - 6; x += 16) { const em = new T.Mesh(new T.BoxGeometry(.3, .14, .14), new T.MeshStandardMaterial({ color: '#400', emissive: '#ff1a0a', emissiveIntensity: 2 })); em.position.set(x, 4.05, (C.z0 + L.gateZ) / 2); grp.add(em); flickers.push({ m: em.material, base: 2, ph: x, slow: true }); }
    // 天花板垂下來的電線
    const wireM = new T.MeshBasicMaterial({ color: '#111' });
    for (let i = 0; i < 8; i++) { const pt = pointIn({ kind: 'concourse' }, rnd), len = .6 + rnd() * 1.2; const w = new T.Mesh(new T.CylinderGeometry(.012, .012, len, 4), wireM); w.position.set(pt.x, 4.2 - len / 2, pt.z); w.rotation.z = (rnd() - .5) * .3; grp.add(w); }
  }
  function tickStyle(now) {
    for (const f of flickers) {
      if (f.dead) { f.m.emissiveIntensity = Math.sin(now / 53 + f.ph) > .93 ? f.base : .05; continue; }
      if (f.slow) { f.m.emissiveIntensity = f.base * (.35 + .65 * Math.abs(Math.sin(now / 900 + f.ph))); continue; }
      const n = Math.sin(now / 97 + f.ph) + Math.sin(now / 41 + f.ph * 2);
      f.m.emissiveIntensity = n > 1.75 ? f.base * .1 : f.base;
    }
  }

  /* ── 互動 ── */
  function say(who, text, buttons) { Dialog.show({ name: who.name, role: who.role || '' }, text, buttons); }
  function nearest() {
    const p = World.player; let best = null, bd = 1e9;
    for (const o of props) if (o.on && (!o.hidden || o.mesh.visible)) { const d = dist(o, p); if (d < o.r && d < bd) { bd = d; best = { t: 'prop', o }; } }
    for (const n of npcs) if ((n.talk) && n.rig.root.visible) { const d = dist(n, p); if (d < 2 && d < bd) { bd = d; best = { t: 'npc', o: n }; } }
    return best;
  }
  const interaction = {
    get id() { const n = nearest(); return n ? 'fog:' + (n.o.label || n.o.name) + n.o.x.toFixed(1) : 'fog'; },
    get label() { const n = nearest(); if (!n) return '調查'; return n.t === 'npc' ? (n.o.label || `說話：${n.o.name}`) : n.o.label; },
    when: p => started && !Dialog.with && !!rec() && !rec().dead && !!nearest(),
    run: () => { const n = nearest(); if (!n) return; Sound.click(); if (n.t === 'npc') n.o.talk(n.o); else n.o.use(n.o); },
  };

  /* ── 每格更新 ── */
  function tickNpc(n, dt, p) {
    const rig = n.rig;
    if (Dialog.with && Dialog.with.name === n.name) { n.face = Math.atan2(p.x - n.x, p.z - n.z); rig.root.rotation.y = n.face; rig.update(dt, 0, performance.now() / 1000); return; }
    let sp = 0;
    const go = (tx, tz, speed) => {
      const dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz); if (d < .15) return true;
      const st = Math.min(d, speed * dt), nx = n.x + dx / d * st, nz = n.z + dz / d * st, h = World.groundAt(nx, nz, n.y);
      if (h == null) { n.target = null; return true; }
      n.x = nx; n.z = nz; n.y = h; n.face = Math.atan2(dx, dz); sp = speed; return false;
    };
    const d = dist(n, p);
    switch (n.behavior) {
      case 'watch': n.face = Math.atan2(p.x - n.x, p.z - n.z); break;
      case 'wander': case 'pace':
        if (n.wait > 0) n.wait -= dt;
        else { if (!n.target) n.target = n.behavior === 'pace' ? (n.leg = !n.leg, { x: n.home.x + (n.leg ? 6 : -6), z: n.home.z }) : pointIn({ kind: n.y > .3 || n.y < -.3 ? 'platform' : 'concourse', P: World.layout.platforms.find(P => Math.abs(P.y - n.y) < .4) }); if (go(n.target.x, n.target.z, n.speed)) { n.target = null; n.wait = 1 + Math.random() * 3; } }
        break;
      case 'flee':
        if (d < 3.5) { const a = Math.atan2(n.x - p.x, n.z - p.z); go(n.x + Math.sin(a) * 2, n.z + Math.cos(a) * 2, 2.4); }
        else if (d < 9) n.face = Math.atan2(p.x - n.x, p.z - n.z);
        break;
      case 'follow':
        if (d > 2.6 && d < 30) go(p.x, p.z, Math.max(n.speed, d > 6 ? 3 : 1.5));
        else if (d <= 2.6) n.face = Math.atan2(p.x - n.x, p.z - n.z);
        break;
      case 'stalk': {
        const h = n.hostile; n.cd = Math.max(0, n.cd - dt);
        if (h && d < h.range && !n.calm && rec() && !rec().dead && !rec().escaped) {
          if (d > .75) go(p.x, p.z, 2.3);
          else if (n.cd <= 0) { n.cd = 3; if (hurt(h.dmg, h.why)) { n.calm = 6; } }
        } else if (n.calm) { n.calm -= dt; if (n.calm <= 0) n.calm = 0; if (n.calm && go(n.home.x, n.home.z, 1)) n.calm = 0; }
        else if (Math.hypot(n.x - n.home.x, n.z - n.home.z) > .5) go(n.home.x, n.home.z, .8);
        break;
      }
      case 'goto': if (n.target && go(n.target.x, n.target.z, n.speed)) { n.target = null; n.behavior = n.after || 'idle'; n.onArrive && n.onArrive(n); } break;
      default: break;
    }
    rig.root.position.set(n.x, n.y + (n.lie ? .25 : 0), n.z);
    if (!n.lie) rig.root.rotation.y = n.face;
    rig.update(dt, sp, performance.now() / 1000);
    if (n.armsUp) for (const A of rig.arms) A.sh.rotation.x = -1.35;
  }
  function tickChaser(c, dt, p) {
    if (!c.on) return;
    const r = rec();
    c.cd = Math.max(0, c.cd - dt);
    let sp = 0;
    if (c.sleep > 0) c.sleep -= dt;
    else if (r && !r.dead && !r.escaped && Math.abs(c.y - p.y) < .9) {
      const d = Math.hypot(p.x - c.x, p.z - c.z);
      let chase = d < c.range;
      if (c.mode === 'statue') chase = chase && (World.moving);   // 只有你動的時候它才動
      if (c.mode === 'sound') chase = chase && (World.running || d < 3) && World.moving;
      if (c.mode === 'watcher') chase = false;
      if (chase && d > .6) {
        const sx = (p.x - c.x) / d, sz = (p.z - c.z) / d, st = c.speed * dt;
        let nx = c.x + sx * st, nz = c.z + sz * st;
        if (World.groundAt(nx, nz, c.y) == null) { if (World.groundAt(nx, c.z, c.y) != null) nz = c.z; else if (World.groundAt(c.x, nz, c.y) != null) nx = c.x; else { nx = c.x; nz = c.z; } }
        c.x = nx; c.z = nz; c.face = Math.atan2(sx, sz); sp = c.speed;
      }
      if (d < .85 && c.cd <= 0) { c.cd = 1.6; if (hurt(c.dmg, c.why)) { World.pushPlayer((p.x - c.x) * .8, (p.z - c.z) * .8); c.onHit && c.onHit(c); } }
    } else if (c.mode === 'wander' || Math.abs(c.y - p.y) >= .9) {
      c.wanderT -= dt;
      if (c.wanderT <= 0) { c.wanderT = 3 + Math.random() * 3; c.wt = { x: c.home.x + (Math.random() - .5) * 10, z: c.home.z + (Math.random() - .5) * 4 }; }
      if (c.wt) { const dx = c.wt.x - c.x, dz = c.wt.z - c.z, d = Math.hypot(dx, dz); if (d > .2) { const nx = c.x + dx / d * dt * .8, nz = c.z + dz / d * dt * .8; if (World.groundAt(nx, nz, c.y) != null) { c.x = nx; c.z = nz; c.face = Math.atan2(dx, dz); sp = .8; } } }
    }
    c.mesh.position.set(c.x, c.y + (c.kind === 'ghost' ? .15 + Math.sin(performance.now() / 400) * .08 : 0), c.z);
    c.mesh.rotation.y = c.face;
    if (c.rig) { c.rig.update(dt, sp, performance.now() / 1000); if (c.kind === 'zombie') for (const A of c.rig.arms) A.sh.rotation.x = -1.4; }
  }
  function tick(dt, now) {
    if (!started) return;
    if (!active()) return;
    tickStyle(now);
    const r = rec(); if (!r) return;
    const p = World.player;
    hurtCD = Math.max(0, hurtCD - dt);
    for (const n of npcs) tickNpc(n, dt, p);
    for (const c of [...chasers]) tickChaser(c, dt, p);
    for (const o of props) {
      if (o.glint) o.glint.material.opacity = .35 + Math.sin(now / 300 + o.x) * .3;
      if (o.mesh.userData.pulse) o.mesh.userData.pulse.material.opacity = .14 + Math.sin(now / 400) * .08;
      if (o.mesh.userData.spin) o.mesh.userData.spin.rotation.y += dt * 1.5;
      if (o.hidden) o.mesh.visible = lampOn && dist(o, p) < 7;
    }
    for (const t of [...timers]) { t.left -= dt; if (t.left <= 0) { timers = timers.filter(x => x !== t); t.fn(); } }
    for (const f of tickers) f(dt, now);
    // 霧燈耗電
    if (lampOn) { r.lamp = Math.max(0, r.lamp - dt * .55); if (r.lamp <= 0) { setLamp(false); toast('<b>🏮 霧燈熄了</b><span>沒電了。</span>', 'warn'); } }
    // 慢慢回血：20 秒沒受傷後，每 6 秒 +2
    if (!r.dead && r.hp < FOG_MAX_HP && performance.now() - lastHurt > 20000) { regenT += dt; if (regenT > 6) { regenT = 0; heal(2, true); } }
    // 穿越月台的列車（逃離迷霧後就不會了）
    if (!r.escaped && !r.dead && !(K && K.noPhantom)) { phantomT -= dt; if (phantomT <= 0) { phantomT = 150 + Math.random() * 120; phantom(); } }
    // 05:30 開始消散
    const ph = phase();
    if (ph !== lastPhase) {
      lastPhase = ph;
      if (ph === 'fade' && !r.escaped) {
        setMood(moodName === 'dark' ? 'dark' : 'fade');
        toast('<b>🌫 霧開始散了</b><span>05:30。站裡某個地方，出現了一扇發光的門。06:00 前沒有離開，就會被留在霧裡。</span>', 'level');
        fadeExit();
      }
    }
    if ((now | 0) % 1000 < 20) hud();
  }

  /* ── 出口、離開迷霧 ── */
  let exitProp = null;
  function exitDoor(pos, why) {
    if (exitProp) return exitProp;
    const L = World.layout;
    const pt = pos || pointIn({ kind: Math.random() < .5 ? 'unpaid' : 'concourse' });
    exitProp = prop('door', pt, { label: '推開發光的門', r: 1.6, tag: 'exit', rot: Math.random() * 6, use: () => escape(why || 'door') });
    void L;
    return exitProp;
  }
  function fadeExit() {
    const r = rec(); if (!r || r.escaped) return;
    const ev = K && K.fadeExit; if (ev === false) return;
    exitDoor(null, 'fade');
  }
  function escape(how) {
    const r = rec(); if (!r || r.escaped || r.dead) return;
    r.escaped = true; r.escapedAt = Date.now(); r.how = how; saveState();
    Sound.fog('good');
    flash('#fff', .8);
    if (K && K.onEscape) K.onEscape(how);
    for (const c of [...chasers]) removeChaser(c);
    for (const n of [...npcs]) if (n.hostile) n.hostile = null;
    removeProp(exitProp); exitProp = null;
    setMood('safe'); setLamp(false);
    overlay(`<div class="fog-card"><p class="fog-kicker">迷霧之城</p><h2>你離開了迷霧</h2>
      <p>門的另一邊還是同一座車站，只是霧淡了很多，空氣裡有早餐店蒸籠的味道。</p>
      <p class="fog-sub">清晨 06:00 首班車發車時結算獎勵。你可以留在站裡等，也可以先回到標題。</p>
      <div class="fog-btns"><button class="btn primary" id="fogOk">好</button></div></div>`);
    $('#fogOk').onclick = closeOverlay;
    hud();
  }

  /* ── 結算（06:00） ── */
  function score(r) {
    const base = { perfect: 100, good: 72, bad: 45, fail: 25 }[r.result] ?? 12;
    let sc = base - r.deaths * 15 - Math.round(r.dmg / 8) + Math.min(20, r.clues.length * 3) + (r.escaped ? 20 : -30);
    return Math.max(0, Math.min(150, sc));
  }
  const RANKS = [[130, 'S', 4], [100, 'A', 3], [70, 'B', 2], [40, 'C', 1], [0, 'D', 0]];
  function settle() {
    const s = S(), r = s.fog;
    if (!r || r.settled) return null;
    const judged = !r.escaped;
    if (judged && !r.dead) r.deaths++;
    const sc = score(r), [, rank, gold] = RANKS.find(([t]) => sc >= t);
    const key = eventKey(r.station), log = (s.fogLog = s.fogLog || {}), L0 = log[r.station] || { nights: 0, best: null, results: [] };
    const first = r.result && r.result !== 'fail' && !L0.cleared;
    const g = gold + (first ? 1 : 0) + (r.bonusGold || 0);
    const reward = { money: sc * 4, xp: sc * 3, ixp: Math.round(sc / 2), gold: g };
    L0.nights++; L0.results.push({ night: r.night, result: r.result || 'none', rank, choice: r.choice || null }); L0.results = L0.results.slice(-6);
    if (r.result && r.result !== 'fail') L0.cleared = true;
    L0.best = !L0.best || 'SABCD'.indexOf(rank) < 'SABCD'.indexOf(L0.best) ? rank : L0.best;
    log[r.station] = L0;
    // 未解線索
    if (!r.result || r.result === 'fail') (s.fogUnsolved = s.fogUnsolved || {})[r.station] = { night: r.night, clues: r.clues.slice(-5) };
    else if (s.fogUnsolved) delete s.fogUnsolved[r.station];
    s.fogStats = s.fogStats || { nights: 0, deaths: 0, escapes: 0 };
    s.fogStats.nights++; s.fogStats.deaths += r.deaths; if (r.escaped) s.fogStats.escapes++;
    r.settled = true; r.rank = rank; r.score = sc;
    saveState();
    Game.reward(reward, '迷霧之城結算');
    if (typeof Life !== 'undefined') Life.log(`迷霧之城（${r.station}）：評價 ${rank}${judged ? '（未離開，判定死亡）' : ''}`);
    Achievements.check();
    void key;
    return { r, sc, rank, reward, judged, first };
  }
  function showResult(res) {
    if (!res) return;
    const { r, sc, rank, reward, judged } = res;
    const unsolved = !r.result || r.result === 'fail';
    overlay(`<div class="fog-card result"><p class="fog-kicker">清晨 06:00・迷霧之城結算</p>
      <h2>${esc(r.station)}　評價 <span class="rank r${rank}">${rank}</span></h2>
      ${judged ? '<p class="warn-text">06:00 前沒有離開迷霧——判定死亡。首班車的燈亮起時，你在月台上醒來。</p>' : '<p>霧散了。第一班車的燈從隧道深處亮起來。</p>'}
      <table class="fog-tbl">
        <tr><td>事件</td><td>${{ perfect: '完美解決', good: '解決', bad: '勉強收場', fail: '失敗' }[r.result] || '沒有解開'}</td></tr>
        <tr><td>倒下次數</td><td>${r.deaths}</td></tr><tr><td>受到傷害</td><td>${r.dmg}</td></tr>
        <tr><td>記下的線索</td><td>${r.clues.length}</td></tr><tr><td>分數</td><td>${sc}</td></tr>
      </table>
      <p class="fog-sub">報酬：NT$ ${reward.money}、經驗 ${reward.xp}、調查經驗 ${reward.ixp}${reward.gold ? `、🪙 黃金 ${reward.gold}` : ''}${res.first ? '（第一次解開本站事件 +1）' : ''}</p>
      ${unsolved && r.clues.length ? `<p class="fog-sub">未解的線索已記錄在「紀錄 → 迷霧之城」，下一次霧夜可以接著調查。</p>` : ''}
      <div class="fog-btns"><button class="btn primary" id="fogOk">迎接早晨</button></div></div>`);
    $('#fogOk').onclick = closeOverlay;
  }
  // 06:00：迷霧之城消失
  function dawn() {
    const was = started;
    const res = settle();
    teardown();
    World.setMood(null); World.setPlayerLight(0);
    $('#fogHud').hidden = true;
    if (was && document.body.dataset.screen === 'game') {
      const st = S().current;
      World.loadStation(st); World.spawnInConcourse();
      startStation(st);
    }
    if (res) setTimeout(() => showResult(res), 600);
  }
  // 開遊戲時：上一晚還沒結算的（玩家沒留到 06:00）
  function catchUp() {
    const s = S(); const r = s.fog;
    if (!r || r.settled) return;
    if (active() && r.night === nightKey()) return;
    const res = settle(); if (res) setTimeout(() => showResult(res), 1200);
  }

  /* ── 進入／離開本站的迷霧 ── */
  function teardown() {
    started = null;
    if (K && K.cleanup) try { K.cleanup(); } catch (e) { /* 事件清理失敗也要繼續 */ }
    K = null;
    if (group) { World.scene.remove(group); group = null; }
    for (const tr of [...World.trains]) if (tr.fog) World.removeTrain(tr);
    props = []; npcs = []; chasers = []; timers = []; tickers = []; marks = []; exitProp = null; lampOn = false; lastPhase = ''; flickers = []; styledGroup = null; hintText = '';
  }
  // startStation 在迷霧時段呼叫：生成本站的迷霧
  function spawn(stationId, sid) {
    teardown();
    if (!active()) return false;
    let r = rec();
    if (!r) r = newRec(stationId);
    if (r.settled) return false;
    started = sid;
    if (r.station !== stationId && !r.ghost) { r.station = stationId; saveState(); }   // 換到別站（例如搭末班車剛到）
    phantomT = 90 + Math.random() * 60;
    const rnd = seeded(hsh(stationId + r.night));
    restyle(stationId);
    setMood(r.escaped ? 'safe' : phase() === 'fade' ? 'fade' : 'fog');
    if (r.ghostAt && !(World.layout && World.layout.alias)) { r.ghostAt = null; saveState(); }   // 重新整理後回到原站
    if (!r.escaped) {
      if (!r.ghostAt) spawnAmbient(stationId, rnd);
      const key = r.ghostAt ? 'ghost_station' : eventKey(stationId);
      K = kit(stationId, r, rnd);
      try { FogEvents.start(key, K); } catch (e) { console.error('fog event', key, e); }
      if (phase() === 'fade' && !r.result) fadeExit();
    } else spawnAmbient(stationId, rnd);
    if (!r.seenIntro) { r.seenIntro = true; saveState(); intro(); }
    if (r.dead) setTimeout(showDeath, 500);
    hud();
    return true;
  }
  function intro() {
    Sound.fog('sting');
    overlay(`<div class="fog-card intro"><p class="fog-kicker">00:30 – 06:00</p><h2>迷霧之城</h2>
      <p>末班車開走了。霧從隧道裡湧上來，把整座車站封了起來。</p>
      <ul class="fog-rules">
        <li>🚫 今晚離不開這一站：不能傳送、不能搭車，但站內可以自由走動。</li>
        <li>❤ 你有 ${FOG_MAX_HP} 點生命值。列車、鬼、奇怪的人都會傷害你；倒下時可以付 NT$ ${FOG_REVIVE_COST} 復活，或等 06:00。</li>
        <li>🪙 霧裡新台幣不能用，只收黃金。提燈的攤販在大廳角落。</li>
        <li>🌫 每一站都藏著一件事。調查、解開它，或找到離開的方法。</li>
        <li>⏰ 05:30 霧開始消散；06:00 還沒離開迷霧，就判定死亡。</li>
      </ul>
      <div class="fog-btns"><button class="btn primary" id="fogOk">走進霧裡</button></div></div>`);
    $('#fogOk').onclick = closeOverlay;
  }
  // 時段切換到迷霧時（玩家在站內）
  function enter() {
    if (Game.ride) return;
    const st = S().current; if (!st) return;
    newSession();
    World.loadStation(st); World.spawnInConcourse();
    startStation(st);
  }

  /* ── 事件工具箱 ── */
  function kit(stationId, r, rnd) {
    const k = {
      station: stationId, r, rnd, ev: r.ev, L: World.layout,
      prop, removeProp, person, removeNpc, chaser, removeChaser, look, ghostMesh, pointIn, spread, near, dist, say, hurt, heal, flash, setMood, setLamp, sound: kind => Sound.fog(kind), canvasSprite, M, tintTrain,
      get npcs() { return npcs; }, get props() { return props; }, get chasers() { return chasers; }, get lamp() { return lampOn; }, get group() { return ensureGroup(); },
      clue(text) { if (!r.clues.includes(text)) { r.clues.push(text); saveState(); toast(`<b>📓 記下了</b><span>${text}</span>`); hud(); } },
      timer(sec, fn) { const t = { left: sec, fn }; timers.push(t); return t; },
      cancel(t) { timers = timers.filter(x => x !== t); },
      every(fn) { tickers.push(fn); },
      hint(text) { hintText = text; setPart('pHint', `<span class="tag fogtag">🌫 ${text}</span>`); },
      toast,
      choice(c) { r.choice = c; saveState(); },
      // 事件結束：result = perfect / good / bad / fail；出口門出現（或直接離開）
      done(result, o = {}) {
        if (r.result && r.result !== 'fail') return;
        r.result = result; saveState();
        if (o.gold) r.bonusGold = (r.bonusGold || 0) + o.gold;
        if (o.items) for (const [id, n] of Object.entries(o.items)) S().inv[id] = (S().inv[id] || 0) + n;
        if (o.col) for (const [cat, id] of o.col) { const c = (S().fogCol = S().fogCol || {}); (c[cat] = c[cat] || {})[id] = r.night; }
        saveState();
        Sound.fog(result === 'fail' ? 'sting' : 'good');
        if (result !== 'fail') toast(`<b>🌫 ${o.title || '霧裡的事情結束了'}</b><span>${o.text || '某個地方出現了一扇發光的門。'}</span>`, 'level');
        if (o.escape) setTimeout(() => escape('event'), o.delay || 1200);
        else if (result !== 'fail') exitDoor(o.exitAt || null, 'event');
        else toast('<b>🌫 失敗了</b><span>霧沒有放過這一站。也許 05:30 霧散的時候，還找得到出去的門。</span>', 'warn');
        Achievements.check();
      },
      escape: how => escape(how),
      exitDoor,
      get dead() { return r.dead; },
      get phase() { return phase(); },
      noPhantom: false,
    };
    return k;
  }

  function locked() { return active() && !!started && !!rec(); }
  return {
    active, phase, rec, spawn, tick, interaction, hurt, heal, enter, dawn, catchUp, locked, cashBlocked, shop, eventKey, assignment, setMood, teardown, hud, onHudClick, closeOverlay, escape, overlay, setLamp,
    get started() { return started; }, get K() { return K; },
    get hint() { const r = rec(); return !started || !r ? '' : r.escaped ? '已經離開迷霧了。等首班車吧。' : r.dead ? '' : hintText; }, CAT_COUNT, FIXED, MOODS, nightKey,
  };
})();
