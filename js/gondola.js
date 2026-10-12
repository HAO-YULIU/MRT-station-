/* 貓空纜車
 * - 解鎖：動物園站的專屬任務「貓纜重新運轉」（林站長）。完成前地圖上看不到纜車、連通道關著
 * - 四個纜車站：動物園、動物園內、指南宮、貓空。山上的開放式車站（木構屋頂、大轉輪、車廂在站內繞圈），跟捷運站不一樣
 * - 從捷運動物園站 2F（動物園遊客中心）盡頭的連通道進去；搭纜車：車廂裡看山景、茶園、遠方的台北市
 * - 票價：1 段 70、2 段 100、3 段 120；營運 09:00–21:00（迷霧時段停駛，工作人員會帶你回捷運站）
 * 狀態：flags.gondola（解鎖）、state.gondolaAt（目前在哪個纜車站；null＝不在纜車）、col.gondola（去過的纜車站）
 */
const Gondola = (() => {
  const T = THREE;
  const ST = [
    { key: 'g_zoo', zh: '動物園', en: 'Taipei Zoo', color: '#2f8f5b', deco: 'zoo', exit: '回捷運動物園站', h: 0 },
    { key: 'g_zooin', zh: '動物園內', en: 'Taipei Zoo South', color: '#d08a20', deco: 'animals', exit: '動物園園區（之後開放）', h: 60 },
    { key: 'g_zhinan', zh: '指南宮', en: 'Zhinan Temple', color: '#c4402e', deco: 'temple', exit: '指南宮參道（之後開放）', h: 170 },
    { key: 'g_maokong', zh: '貓空', en: 'Maokong', color: '#5a8a3a', deco: 'tea', exit: '貓空茶園步道（之後開放）', h: 270 },
  ];
  const byKey = k => ST.find(s => s.key === k);
  const idx = k => ST.findIndex(s => s.key === k);
  const FARE = [0, 70, 100, 120];
  const fare = (a, b) => FARE[Math.abs(idx(a) - idx(b))];
  const S = () => Game.state;
  const unlocked = () => !!(S() && S().flags.gondola);
  const running = () => { const t = TaipeiTime.now(); return TaipeiTime.state() === 'open' && t.hour >= 9 && t.hour < 21; };
  const esc2 = x => (typeof esc === 'function' ? esc(x) : String(x));
  let mode = null;   // { key, scene: 'station' | 'ride', ... }

  /* ── 小工具 ── */
  const mat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: o.r ?? .7, metalness: o.m ?? 0, emissive: o.e || '#000000', emissiveIntensity: o.ei ?? 0, transparent: !!o.t, opacity: o.o ?? 1, depthWrite: o.dw ?? true, side: o.side || T.FrontSide, map: o.map || null });
  const box = (g, w, h, d, m, x, y, z) => { const b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  const cyl = (g, r0, r1, h, m, x, y, z, seg = 12) => { const c = new T.Mesh(new T.CylinderGeometry(r0, r1, h, seg), m); c.position.set(x, y, z); g.add(c); return c; };
  function tex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
  function signTex(zh, en, col) {
    return tex(1024, 256, (x) => {
      x.fillStyle = '#f6f1e6'; x.fillRect(0, 0, 1024, 256); x.fillStyle = col; x.fillRect(0, 0, 1024, 26); x.fillRect(0, 230, 1024, 26);
      x.fillStyle = col; x.beginPath(); x.arc(110, 128, 70, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '700 80px sans-serif'; x.textAlign = 'center'; x.fillText('🚡', 110, 156);
      x.textAlign = 'left'; x.fillStyle = '#23272b'; x.font = '700 92px "Noto Sans TC", sans-serif'; x.fillText(zh, 210, 132); x.fillStyle = '#6a6f74'; x.font = '44px "Barlow Semi Condensed", sans-serif'; x.fillText(en, 214, 194);
    });
  }
  function routeTex(hereKey) {
    return tex(1024, 320, (x) => {
      x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, 1024, 320); x.fillStyle = '#23272b'; x.font = '700 40px "Noto Sans TC", sans-serif'; x.fillText('貓空纜車路線圖  Maokong Gondola', 40, 60);
      x.strokeStyle = '#7a9a3a'; x.lineWidth = 14; x.beginPath(); x.moveTo(110, 190); x.lineTo(910, 190); x.stroke();
      ST.forEach((s, i) => {
        const cx = 110 + i * 266; x.fillStyle = s.key === hereKey ? '#e8452e' : '#fff'; x.strokeStyle = '#3a5a2a'; x.lineWidth = 6; x.beginPath(); x.arc(cx, 190, 26, 0, 7); x.fill(); x.stroke();
        x.fillStyle = '#23272b'; x.font = '700 34px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText(s.zh, cx, 262); x.font = '24px sans-serif'; x.fillStyle = '#6a6f74'; x.fillText(s.en, cx, 296);
        if (s.key === hereKey) { x.fillStyle = '#e8452e'; x.font = '700 26px "Noto Sans TC", sans-serif'; x.fillText('你在這裡', cx, 140); }
      });
      x.textAlign = 'left'; x.fillStyle = '#6a6f74'; x.font = '24px "Noto Sans TC", sans-serif'; x.fillText('票價：1 段 70・2 段 100・3 段 120　營運 09:00–21:00', 40, 110);
    });
  }
  // 遠山與樹（車站四周、搭乘時的景色都用）
  function hillHeight(x, z, seed) { return Math.sin(x * .011 + seed) * 18 + Math.sin(z * .017 + seed * 2) * 14 + Math.sin((x + z) * .006 + seed * .5) * 26; }
  function terrain(g, { w, d, cx = 0, cz = 0, base, seed = 1, tea = null, seg = 90 }) {
    const geo = new T.PlaneGeometry(w, d, seg, Math.round(seg * d / w)); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = [], c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
      const y = base(x, z);
      pos.setY(i, y);
      const terr = tea && tea(x, z);
      if (terr) c.set(Math.floor(y / 2.2) % 2 ? '#6f9a3c' : '#4f7a2c');   // 茶園梯田：一層亮一層暗
      else c.set(y > 40 ? '#3f6a34' : '#4c7a3a').offsetHSL(0, 0, Math.sin(x * .05 + z * .07) * .03);
      col.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    m.position.set(cx, 0, cz); g.add(m); return m;
  }
  function trees(g, n, rnd, place) {
    const im = new T.InstancedMesh(new T.ConeGeometry(2.2, 6.5, 6), new T.MeshStandardMaterial({ color: '#2f5a2a', roughness: 1, flatShading: true }), n);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), p = new T.Vector3();
    let k = 0;
    for (let i = 0; i < n * 3 && k < n; i++) { const r = place(rnd); if (!r) continue; const s = .6 + rnd() * .9; p.set(r[0], r[1] + 3 * s, r[2]); sc.set(s, s, s); im.setMatrixAt(k++, m4.compose(p, q, sc)); }
    im.count = k; g.add(im); return im;
  }
  const rng = seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  function cityline(g, z, rnd) {   // 遠方的台北市（貓空、指南宮看得到）
    const m = new T.MeshStandardMaterial({ color: '#9aa6b4', roughness: 1, flatShading: true });
    for (let i = 0; i < 70; i++) { const h = 10 + rnd() * 40; box(g, 8 + rnd() * 14, h, 8 + rnd() * 14, m, -600 + i * 18 + rnd() * 8, -40 + h / 2, z - rnd() * 60); }
    const t = new T.Group(); t.position.set(80, -40, z - 30); g.add(t);   // 台北 101
    for (let i = 0; i < 8; i++) box(t, 16 - i * .6, 22, 16 - i * .6, mat('#7f9a96', { r: .4, m: .3 }), 0, 30 + i * 22, 0);
    box(t, 22, 30, 22, mat('#8a9a96'), 0, 15, 0); cyl(t, .6, 1, 40, mat('#9aa'), 0, 226, 0, 6);
  }

  /* ── 纜車車廂 ── */
  function cabin(color, crystal) {
    const c = new T.Group();
    const body = mat(color, { r: .4, m: .2 }), glass = mat('#cfe8f2', { t: true, o: .28, dw: false, r: .05 });
    box(c, 2.0, .12, 2.0, crystal ? glass : body, 0, .06, 0);                 // 地板（水晶車廂是玻璃）
    box(c, 2.0, .35, 2.0, body, 0, 2.15, 0);                                  // 車頂
    for (const [x, z, w, d] of [[0, 1, 2, .06], [0, -1, 2, .06], [1, 0, .06, 2], [-1, 0, .06, 2]]) { box(c, w, .5, d, body, x, .37, z); box(c, w, 1.45, d, glass, x, 1.27, z); }
    for (const x of [-.97, .97]) for (const z of [-.97, .97]) box(c, .08, 2.2, .08, body, x, 1.1, z);
    box(c, .1, 1.6, .1, mat('#8a9097', { m: .7 }), 0, 3.1, 0);               // 吊臂
    box(c, .5, .2, .3, mat('#5a6068', { m: .7 }), 0, 3.95, 0);
    for (const z of [-.68, .68]) box(c, 1.8, .42, .5, mat('#3a4048', { r: .6 }), 0, .45, z);   // 兩排座椅
    return c;
  }

  /* ── 纜車站 ── */
  function buildStation(key) {
    const st = byKey(key), g = new T.Group(), rnd = rng(idx(key) * 97 + 13);
    const accent = mat(st.color, { r: .5 }), wood = mat('#8a6440', { r: .8 }), stone = mat('#d9d4c8', { r: .9 }), dark = mat('#2b2f34', { r: .5 }), steel = mat('#9aa3ab', { m: .7, r: .35 });
    const floorT = tex(256, 256, x => { x.fillStyle = st.deco === 'tea' ? '#a4825a' : '#cfc8b8'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 3; for (let i = 0; i <= 256; i += st.deco === 'tea' ? 32 : 64) { x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); if (st.deco !== 'tea') { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); } } });
    floorT.wrapS = floorT.wrapT = T.RepeatWrapping; floorT.repeat.set(8, 8);
    // 地板：月台（上下車）＋大廳（售票、出口）
    box(g, 30, .4, 14, mat('#ffffff', { map: floorT, r: .8 }), 0, -.2, -2.5);
    box(g, 22, .4, 12, mat('#ffffff', { map: floorT, r: .8 }), 0, -.2, 10.5);
    box(g, 30, 30, 14, stone, 0, -15.4, -2.5);   // 站體下方的基座（往山下看是實心的）
    box(g, 22, 30, 12, stone, 0, -15.4, 10.5);
    // 柱子＋大屋頂（指南宮站：紅柱、金色屋脊；貓空站：木頭）
    const colM = st.deco === 'temple' ? mat('#b8322a', { r: .5 }) : st.deco === 'tea' ? wood : mat('#e8e4dc', { r: .6 });
    for (const x of [-14.5, -5, 5, 14.5]) for (const z of [-9, 3]) box(g, .5, 6.2, .5, colM, x, 3.1, z);
    for (const x of [-10.5, 10.5]) box(g, .5, 6.2, .5, colM, x, 3.1, 16);
    const roofM = st.deco === 'temple' ? mat('#2f6a4a', { r: .6 }) : st.deco === 'tea' ? mat('#5a4a3a', { r: .8 }) : mat('#5d6a72', { r: .6, m: .2 });
    for (const s of [-1, 1]) { const r = box(g, 17, .25, 29, roofM, s * 7.6, 7.1, 3); r.rotation.z = s * -.2; }
    box(g, 1, .3, 29.5, st.deco === 'temple' ? mat('#e0a62a', { m: .4, r: .4 }) : accent, 0, 8.65, 3);   // 屋脊
    if (st.deco === 'temple') for (const z of [-11.5, 17.5]) for (const s of [-1, 1]) { const tip = box(g, .4, 1.2, .4, mat('#e0a62a', { m: .4 }), s * 15.5, 6.2, z); tip.rotation.z = s * .5; }
    box(g, 30, .5, .3, accent, 0, 6.05, -9.2);   // 屋簷飾帶
    // 後牆（大廳那一端）＋出口
    box(g, 22, 6.2, .3, stone, 0, 3.1, 16.7);
    box(g, 3, 2.6, .1, dark, 0, 1.3, 16.5);
    const exitT = tex(512, 128, x => { x.fillStyle = '#1d6a3a'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#fff'; x.font = '700 54px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText('出口  Exit', 256, 84); });
    const ex = new T.Mesh(new T.PlaneGeometry(2.6, .65), new T.MeshBasicMaterial({ map: exitT })); ex.position.set(0, 3, 16.5); ex.rotation.y = Math.PI; g.add(ex);
    // 大廳兩側的牆（有窗）
    for (const s of [-1, 1]) { box(g, .3, 1.1, 12, stone, s * 11, .55, 10.5); box(g, .3, 1, 12, stone, s * 11, 5.7, 10.5); box(g, .05, 4.1, 12, mat('#cfe8f2', { t: true, o: .2, dw: false }), s * 11, 3.15, 10.5); }
    // 月台邊的欄杆（往山谷看）
    const railM = mat('#cfe8f2', { t: true, o: .3, dw: false }), topM = steel;
    box(g, 30, 1.1, .05, railM, 0, .55, -9.4); box(g, 30, .06, .1, topM, 0, 1.12, -9.4);
    for (const s of [-1, 1]) { box(g, .05, 1.1, 12.2, railM, s * 15, .55, -3.4); box(g, .1, .06, 12.2, topM, s * 15, 1.12, -3.4); }
    // 站名、路線圖、票價
    const nameM = new T.MeshBasicMaterial({ map: signTex(st.zh + '站', st.en + ' Station', st.color) });
    for (const [x, z, ry] of [[0, 5.4, 0], [0, 15.6, Math.PI]]) { const p = new T.Mesh(new T.PlaneGeometry(6, 1.5), nameM); p.position.set(x, 4.9, z); p.rotation.y = ry; g.add(p); box(g, 6.2, 1.7, .1, dark, x, 4.9, z + (ry ? .06 : -.06)); }
    const rp = new T.Mesh(new T.PlaneGeometry(4, 1.25), new T.MeshBasicMaterial({ map: routeTex(key) })); rp.position.set(-10.83, 2.3, 10.5); rp.rotation.y = Math.PI / 2; g.add(rp);
    // 售票櫃台、票閘
    box(g, 4, 1.1, .8, wood, 6, .55, 12.5); box(g, 4.2, .08, 1, accent, 6, 1.14, 12.5);
    for (const x of [-6, -3.6, -1.2, 1.2, 3.6, 6]) box(g, .3, 1, 1.2, steel, x + 1.2, .5, 6.6);
    // 大轉輪（車廂在站內繞一圈）
    const wheel = new T.Group(); wheel.position.set(0, 5.2, -4); g.add(wheel);
    const wr = new T.Mesh(new T.TorusGeometry(3, .14, 8, 40), steel); wr.rotation.x = Math.PI / 2; wheel.add(wr);
    for (let i = 0; i < 6; i++) { const sp = box(wheel, 6, .1, .1, steel, 0, 0, 0); sp.rotation.y = i * Math.PI / 6; }
    cyl(g, .5, .7, 5.2, mat('#6a7078', { m: .5 }), 0, 2.6, -4);
    box(g, 7.6, .9, 9, mat('#c9cfd4', { m: .4 }), 0, .45, -4.6);   // 中間的機房（車廂繞著它走）
    // 纜線：往山谷延伸（兩條：出發、到達）
    const cableM = new T.LineBasicMaterial({ color: '#2a2a2a' });
    for (const x of [-3, 3]) { const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(x, 4.3, -4), new T.Vector3(x, 4.3 + (idx(key) < 3 ? 40 : -40), -420)]); g.add(new T.Line(geo, cableM)); }
    // 車廂在站內繞圈（只是畫面；上車用互動）
    const loop = [];
    for (let z = -60; z <= -4; z += 2) loop.push([-3, z]);
    for (let a = 0; a <= 20; a++) { const t = Math.PI + a / 20 * Math.PI; loop.push([Math.cos(t) * 3, -4 - Math.sin(t) * 3]); }
    for (let z = -4; z >= -60; z -= 2) loop.push([3, z]);
    const cum = [0]; for (let i = 1; i < loop.length; i++) cum.push(cum[i - 1] + Math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]));
    const cabins = [], cols = ['#f2efe6', '#7bb6d9', '#f0b84a', '#e98aa0'];
    for (let i = 0; i < 9; i++) { const c = cabin(cols[i % 4], i % 4 === 2); g.add(c); cabins.push({ g: c, off: i / 9 }); }
    // 景色：四周的山、樹（車站在山坡上）
    const base = (x, z) => -30 + hillHeight(x, z, idx(key) + 1) * .9 - Math.max(0, -z - 30) * .25;
    terrain(g, { w: 900, d: 900, cz: -300, base: (x, z) => Math.min(base(x, z), -2 - Math.abs(x) * .02), seed: idx(key), tea: st.deco === 'tea' ? (x, z) => z < -40 && z > -260 : null, seg: 70 });
    trees(g, 420, rnd, r => { const x = (r() - .5) * 800, z = -40 - r() * 600; if (Math.abs(x) < 10) return null; return [x, Math.min(base(x, z), -2 - Math.abs(x) * .02), z]; });
    if (st.deco === 'tea' || st.deco === 'temple') cityline(g, -700, rnd);
    // 主題裝飾
    if (st.deco === 'temple') for (let i = 0; i < 6; i++) { const l = new T.Mesh(new T.SphereGeometry(.35, 10, 8), mat('#e8452e', { e: '#ff6a3a', ei: .6 })); l.scale.y = 1.25; l.position.set(-12.5 + i * 5, 5.4, 3.2); g.add(l); }
    if (st.deco === 'zoo' || st.deco === 'animals') ['🐼', '🦒', '🐨', '🐘'].forEach((e, i) => { const t = tex(256, 256, x => { x.fillStyle = '#fbf3e0'; x.fillRect(0, 0, 256, 256); x.font = '190px sans-serif'; x.textAlign = 'center'; x.fillText(e, 128, 200); }); const p = new T.Mesh(new T.PlaneGeometry(1.4, 1.4), new T.MeshStandardMaterial({ map: t, side: T.DoubleSide })); p.position.set(-9 + i * 6, 3.6, 16.45); p.rotation.y = Math.PI; g.add(p); });
    if (st.deco === 'tea') { box(g, 3.4, 1.1, .8, wood, -6, .55, 12.5); const t = tex(512, 128, x => { x.fillStyle = '#3a5a2a'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#fff'; x.font = '700 60px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText('貓空茶坊', 256, 86); }); const p = new T.Mesh(new T.PlaneGeometry(3, .75), new T.MeshBasicMaterial({ map: t })); p.position.set(-6, 2.6, 12.9); p.rotation.y = Math.PI; g.add(p); }
    // 長椅
    for (const x of [-11, 11]) { box(g, 2.2, .45, .55, wood, x, .23, -1.5); }
    // 版面
    const L = {
      stationId: `${st.zh}（貓空纜車）`, gondola: key,
      levels: [
        { id: 'gplat', kind: 'gondola', name: '纜車月台', y: 0, h: 6, x0: -14.8, x1: 14.8, z0: -9.2, z1: 4.4, holes: [] },
        { id: 'ghall', kind: 'gondola', name: '纜車站大廳', y: 0, h: 5.8, x0: -10.8, x1: 10.8, z0: 4.4, z1: 16.4, holes: [] },
      ],
      obstacles: [
        { x0: -3.8, x1: 3.8, z0: -9.4, z1: -.2, y: 0 },       // 車廂繞圈的地方（中間是機房）
        { x0: 4, x1: 8, z0: 12.1, z1: 12.9, y: 0 },           // 售票櫃台
        ...[-6, -3.6, -1.2, 1.2, 3.6, 6].map(x => ({ x0: x + 1.05, x1: x + 1.35, z0: 6, z1: 7.2, y: 0 })),   // 票閘（中間可以過）
        ...[-14.5, -5, 5, 14.5].flatMap(x => [-9, 3].map(z => ({ x0: x - .25, x1: x + .25, z0: z - .25, z1: z + .25, y: 0 }))),
        ...[-11, 11].map(x => ({ x0: x - 1.1, x1: x + 1.1, z0: -1.8, z1: -1.2, y: 0 })),
        ...(st.deco === 'tea' ? [{ x0: -7.7, x1: -4.3, z0: 12.1, z1: 12.9, y: 0 }] : []),
      ],
      board: { x: -4.7, z: -5.5 }, arrive: { x: 4.7, z: -5.5 }, exit: { x: 0, z: 15.6 }, ticket: { x: 6, z: 11.6 }, map: { x: -10.2, z: 10.5 }, shop: st.deco === 'tea' ? { x: -6, z: 11.6 } : null,
    };
    const tick = (dt, now) => {
      const tot = cum[cum.length - 1];
      for (const c of cabins) {
        const s = ((c.off * tot) + now / 1000 * .9) % tot;
        let a = 0, b = cum.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (cum[m] <= s) a = m; else b = m; }
        const f = (s - cum[a]) / Math.max(1e-6, cum[b] - cum[a]), x = loop[a][0] + (loop[b][0] - loop[a][0]) * f, z = loop[a][1] + (loop[b][1] - loop[a][1]) * f;
        const out = z < -9.4;   // 出了車站：沿纜線往山下／山上
        c.g.position.set(x, out ? (z + 9.4) * (idx(key) < 3 ? -.096 : .096) : 0, z);   // 纜線往山上（終點站往山下）
        c.g.rotation.y = Math.atan2(loop[b][0] - loop[a][0], loop[b][1] - loop[a][1]);
      }
      wheel.rotation.y = now / 1000 * .3;
    };
    return { L, group: g, tick };
  }

  /* ── 搭乘：車廂固定在原點，景色往後退 ── */
  function buildRide(fromKey, toKey) {
    const g = new T.Group(), a = idx(fromKey), b = idx(toKey), dir = Math.sign(b - a), n = Math.abs(b - a);
    const SEG = 520, Ltot = SEG * n, rnd = rng(a * 31 + b * 7 + 5);
    const hAt = s => { const k = s / SEG, i = Math.min(n - 1, Math.floor(k)), f = k - i; const h0 = ST[a + dir * i].h, h1 = ST[a + dir * (i + 1)].h; return h0 + (h1 - h0) * f; };   // 纜線高度
    const scenery = new T.Group(); g.add(scenery);
    const cab = cabin(['#f2efe6', '#7bb6d9', '#f0b84a'][(a + b) % 3], false); cab.position.y = 0; g.add(cab);
    // 地形：纜線下方保持 18–45 公尺的距離
    const clear = s => 26 + Math.sin(s * .02) * 12;
    const base = (x, z) => {
      const s = Math.max(0, Math.min(Ltot, x)), under = hAt(s) - clear(s) - 3;
      const hills = hillHeight(x, z, 3) * 1.4 + Math.abs(z) * .18;
      return Math.min(under + Math.abs(z) * .12 + hills * .35, hAt(s) - 12 + Math.abs(z) * .5) - 3;
    };
    const teaFrom = Ltot - SEG * .8;
    terrain(scenery, { w: Ltot + 900, d: 900, cx: Ltot / 2, cz: 0, base, seed: 3, tea: (x, z) => (ST[b].deco === 'tea' || ST[a].deco === 'tea') && (dir > 0 ? x > teaFrom : x < SEG * .8) && Math.abs(z) > 14, seg: 120 });
    trees(scenery, 900, rnd, r => { const x = -300 + r() * (Ltot + 600), z = (r() - .5) * 800; if (Math.abs(z) < 12) return null; return [x, base(x, z), z]; });
    if (dir > 0 && b >= 2) cityline(scenery, -650, rnd);
    else cityline(scenery, 650, rnd);
    // 纜線、鐵塔、對向車廂
    const cableM = new T.LineBasicMaterial({ color: '#2a2a2a' });
    for (const z of [0, 7]) { const pts = []; for (let s = -200; s <= Ltot + 200; s += 20) pts.push(new T.Vector3(s, hAt(Math.max(0, Math.min(Ltot, s))) + 3.95, z)); scenery.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), cableM)); }
    const towerM = mat('#8a949c', { m: .5, r: .5 });
    for (let s = 90; s < Ltot - 40; s += 150) {
      const top = hAt(s) + 4.3, bot = base(s, 3.5), h = top - bot;
      for (const z of [-1.5, 8.5]) box(scenery, .6, h, .6, towerM, s, bot + h / 2, z);
      box(scenery, .5, .5, 11, towerM, s, top, 3.5);
    }
    // 中途的車站（指南宮、動物園內：慢慢穿過去）
    for (let i = 1; i < n; i++) {
      const s = SEG * i, y = hAt(s), stn = ST[a + dir * i];
      box(scenery, 16, .4, 22, mat('#d9d4c8'), s, y - .2, 3.5); box(scenery, 16, 30, 22, mat('#cfc8b8'), s, y - 15.4, 3.5);
      for (const [dx, dz] of [[-7, -7], [7, -7], [-7, 14], [7, 14]]) box(scenery, .4, 6, .4, mat(stn.color), s + dx, y + 3, dz);
      const r = box(scenery, 18, .3, 24, mat(stn.deco === 'temple' ? '#2f6a4a' : '#5d6a72'), s, y + 6.4, 3.5); void r;
      const p = new T.Mesh(new T.PlaneGeometry(6, 1.5), new T.MeshBasicMaterial({ map: signTex(stn.zh + '站', stn.en, stn.color), side: T.DoubleSide })); p.position.set(s, y + 4.6, -6.8); scenery.add(p);
      if (stn.deco === 'temple') { const t = new T.Group(); t.position.set(s + 40, base(s + 40, -60) , -60); scenery.add(t); box(t, 16, 6, 10, mat('#b8322a'), 0, 3, 0); const rf = box(t, 19, 1, 12, mat('#e0a62a', { m: .3 }), 0, 6.6, 0); void rf; }
    }
    const opp = []; for (let i = 0; i < 6; i++) { const c = cabin(['#7bb6d9', '#f2efe6', '#e98aa0'][i % 3], i === 2); scenery.add(c); opp.push({ g: c, off: i / 6 }); }
    // 車廂內部的版面：一塊小地板
    const L = { stationId: '貓空纜車車廂', gondola: 'ride', levels: [{ id: 'cabin', kind: 'cabin', name: '纜車車廂', y: .12, h: 2, x0: -.95, x1: .95, z0: -.95, z1: .95, holes: [] }] };
    const dur = 15 * n * 1000;
    return { L, group: g, scenery, Ltot, hAt, opp, dur };
  }

  /* ── 進出纜車模式 ── */
  function clearStationStuff() {
    newSession(); clearInterval(Game.ctlTimer); ctl = null;
    for (const m of [NPCManager, Crowd, Pickups, Challenges, Secrets, Life, Festival, Achievements, ArtInstall, Onsen, Teleporter, Passengers]) try { m.clear(); } catch (e) { /* 這個模組沒東西可清 */ }
    try { FogCity.teardown(); } catch (e) { /* 沒有迷霧 */ }
    World.setMood && World.setMood(null);
  }
  function enter(key, how) {
    const st = byKey(key); if (!st) return;
    clearStationStuff();
    const s = S(); s.gondolaAt = key; (s.col = s.col || {}).gondola = s.col.gondola || {}; s.col.gondola[key] = true; saveState();
    const built = buildStation(key);
    World.loadCustom(built.L, built.group, { open: true, fogNear: 80, fogFar: 900 });
    mode = { key, scene: 'station', tick: built.tick };
    const L = World.layout;
    if (how === 'arrive') World.placePlayer(L.arrive.x, 0, L.arrive.z + 1, 0);
    else World.placePlayer(L.exit.x, 0, L.exit.z - 1.4, Math.PI);
    World.setInput(true);
    World.setInteractions(stationInteractions());
    panel();
    Sound.ambience && Sound.ambience('elevated');
    updateHud();
  }
  function exitMode() { if (mode) { mode = null; } const s = S(); if (s && s.gondolaAt) { s.gondolaAt = null; saveState(); } }
  // 回到捷運動物園站（2F 遊客中心的連通道口）
  function backToMRT() {
    exitMode();
    World.loadStation('動物園');
    const lv = (World.layout.levels || [])[0];
    if (lv) World.placePlayer(lv.x1 - 2.6, lv.y, (lv.z0 + lv.z1) / 2, -Math.PI / 2); else World.spawnInConcourse();
    S().current = '動物園'; saveState();
    startStation('動物園');
  }
  function ride(toKey) {
    const s = S(), from = mode.key, f = fare(from, toKey);
    if (s.money < f) return toast(`<b>餘額不足</b><span>到 ${byKey(toKey).zh} 要 NT$ ${f}，悠遊卡只剩 NT$ ${s.money}</span>`, 'warn');
    s.money -= f; s.gondolaRides = (s.gondolaRides || 0) + 1; saveState(); updateHud(); Sound.gate();
    toast(`<b>扣款 NT$ ${f}</b><span>貓空纜車 ${byKey(from).zh} → ${byKey(toKey).zh}　餘額 NT$ ${s.money}</span>`);
    Dialog.close();
    const r = buildRide(from, toKey);
    World.loadCustom(r.L, r.group, { open: true, fogNear: 120, fogFar: 1400 });
    World.placePlayer(0, .12, .55, Math.PI);
    World.sit({ x: 0, z: .55, face: Math.PI });
    World.setInput(false);
    World.setInteractions([]);
    mode = { key: from, to: toKey, scene: 'ride', r, t0: performance.now(), skip: false };
    setPart('pTitle', `<span class="g-chip">🚡</span><b>貓空纜車</b><span class="mini-sub">${esc2(byKey(from).zh)} → ${esc2(byKey(toKey).zh)}</span>`);
    setPart('pRows', '');
    setPart('pHint', '拖曳畫面可以轉頭看風景');
    setPart('pBtns', '<button class="btn small ghost" id="gSkip">略過</button>');
    const b = document.getElementById('gSkip'); if (b) b.onclick = () => { if (mode && mode.scene === 'ride') mode.skip = true; };
    if (typeof questEvent === 'function') questEvent({ kind: 'gondola', from, to: toKey });
  }
  function tick(dt, now) {
    if (!mode) return;
    if (mode.scene === 'station') { mode.tick(dt, now); if (TaipeiTime.state() !== 'open' && !Dialog.with) { toast('<b>纜車停駛</b><span>工作人員帶你回到捷運動物園站。</span>', 'warn'); backToMRT(); } return; }
    const r = mode.r, k = mode.skip ? 1 : Math.min(1, (now - mode.t0) / r.dur);
    const e = k < .08 ? k * k / .16 : k > .92 ? 1 - (1 - k) * (1 - k) / .16 : k - .04;   // 出站慢慢加速、進站慢慢減速
    const sPos = e * r.Ltot;
    r.scenery.position.set(-sPos, -r.hAt(Math.min(r.Ltot, Math.max(0, sPos))), 0);
    for (const o of r.opp) { const x = ((o.off * r.Ltot * 1.4) - now / 1000 * 18) % (r.Ltot + 300); const xx = (x + r.Ltot + 300) % (r.Ltot + 300) - 150; o.g.position.set(xx, r.hAt(Math.min(r.Ltot, Math.max(0, xx))), 7); }
    if (k >= 1) { const to = mode.to; World.sit(null); enter(to, 'arrive'); toast(`<b>🚡 到站：${esc2(byKey(to).zh)}站</b><span>${byKey(to).en}</span>`, 'level'); }
  }

  /* ── 纜車站裡的互動 ── */
  const near = (p, q, r = 1.6) => q && Math.hypot(p.x - q.x, p.z - q.z) < r;
  function stationInteractions() {
    const L = () => World.layout;
    return [
      { id: 'g:board', label: '🚡 搭纜車', when: p => !Dialog.with && near(p, L().board, 2), run: boardMenu },
      { id: 'g:exit', get label() { return byKey(mode.key).deco === 'zoo' ? '回捷運動物園站' : '出站'; }, when: p => !Dialog.with && near(p, L().exit, 1.8), run: () => { Sound.click(); if (byKey(mode.key).deco === 'zoo') backToMRT(); else Dialog.info('出口', `外面是${byKey(mode.key).exit.replace('（之後開放）', '')}。<br><small>這裡之後會開放。先搭纜車逛逛其他站吧。</small>`); } },
      { id: 'g:ticket', label: '查看票價', when: p => !Dialog.with && near(p, L().ticket, 1.4), run: () => Dialog.info('🎫 貓空纜車票價', `${ST.map(s => s.zh).join(' → ')}<br>1 段 NT$ 70・2 段 NT$ 100・3 段 NT$ 120（刷悠遊卡）<br>營運時間 09:00–21:00<br><small>從這一站出發：${ST.filter(s => s.key !== mode.key).map(s => `${s.zh} NT$ ${fare(mode.key, s.key)}`).join('、')}</small>`) },
      { id: 'g:map', label: '看纜車路線圖', when: p => !Dialog.with && near(p, L().map, 1.4), run: () => Dialog.info('🗺️ 貓空纜車', `全長約 4 公里，從動物園一路爬到貓空的茶園。<br>${ST.map(s => `<b>${s.zh}</b>`).join(' → ')}<br><small>坐水晶車廂的話，腳底下是透明的。</small>`) },
      { id: 'g:shop', label: '逛：貓空茶坊', when: p => !Dialog.with && near(p, L().shop, 1.4), run: teaShop },
    ];
  }
  function boardMenu() {
    if (!running()) return Dialog.info('🚡 纜車', '現在不是營運時間（09:00–21:00）。車廂一台一台停在轉輪下面休息。');
    const s = S(), here = mode.key;
    Dialog.show({ name: '貓空纜車', role: `${byKey(here).zh}站` }, `要去哪一站？悠遊卡餘額 NT$ ${s.money}。`, ST.filter(x => x.key !== here).map(x => ({
      label: `往 ${x.zh}　NT$ ${fare(here, x.key)}`, primary: true, disabled: s.money < fare(here, x.key), run: () => ride(x.key),
    })).concat([{ label: '先不要', run: () => Dialog.close() }]));
  }
  function teaShop() {
    const s = S(), items = ['maokongtea', 'teaicecream'];
    Dialog.show({ name: '貓空茶坊', role: '貓空站' }, `山上的茶，自己種、自己焙的。餘額 NT$ ${s.money}。`, items.map(id => ({
      label: `${ITEMS[id].icon} ${ITEMS[id].name}　NT$ ${ITEMS[id].price}`, disabled: s.money < ITEMS[id].price,
      run: () => { s.money -= ITEMS[id].price; s.inv[id] = (s.inv[id] || 0) + 1; saveState(); updateHud(); Sound.gate(); toast(`<b>買了 ${ITEMS[id].icon} ${ITEMS[id].name}</b><span>餘額 NT$ ${s.money}</span>`); if (typeof questEvent === 'function') questEvent({ kind: 'buy', item: id }); teaShop(); },
    })).concat([{ label: '離開', run: () => Dialog.close() }]));
  }
  function panel() {
    const st = byKey(mode.key);
    setPart('pTitle', `<span class="g-chip" style="--c:${st.color}">🚡</span><b>${esc2(st.zh)}</b><span class="mini-sub">貓空纜車</span>`);
    setPart('pQuest', typeof trackerHtml === 'function' ? trackerHtml() : '');
    setPart('pGuide', '');
    setPart('pRows', `<div class="mini-row"><span>營運時間</span><b>${running() ? '09:00–21:00' : '停駛中'}</b></div>`);
    setPart('pHint', st.deco === 'zoo' ? '走到月台左邊的上車處搭纜車；大廳出口回捷運站' : '月台左邊上車；右邊是下車的地方');
    setPart('pBtns', '');
  }

  /* ── 捷運動物園站 2F 盡頭的連通道 ── */
  const mrtDoor = () => { const L = World.layout; if (!L || L.stationId !== '動物園' || !L.levels || !L.levels[0]) return null; const lv = L.levels[0]; return { x: lv.x1 - 1.2, y: lv.y, z: (lv.z0 + lv.z1) / 2 }; };
  const interaction = {
    get id() { return unlocked() ? 'g:door' : 'g:door:closed'; },
    get label() { return unlocked() ? '🚡 往貓空纜車' : '纜車連通道（暫停開放）'; },
    when: p => { const d = mrtDoor(); return !!d && !Dialog.with && Math.abs(p.y - d.y) < .5 && Math.hypot(p.x - d.x, p.z - d.z) < 2; },
    run: () => {
      Sound.click();
      if (!unlocked()) return Dialog.info('纜車連通道', '玻璃門關著，門上貼著告示：「貓空纜車暫停營運，恢復日期另行公告。」<br><small>也許可以去問問站裡的纜車站長。</small>');
      if (!running()) return Dialog.info('纜車連通道', '纜車的營運時間是 09:00–21:00，現在連通道關著。');
      enter('g_zoo', 'mrt');
    },
  };

  /* ── 解鎖任務、站長、道具 ── */
  Object.assign(ITEMS, {
    ropekey: { name: '纜車控制室鑰匙', desc: '銅製的老鑰匙，掛著一張寫著「貓纜 機房」的小木牌。', icon: '🗝️', cat: 'story' },
    maokongtea: { name: '貓空鐵觀音', desc: '貓空山上的茶園種的，焙火的香味很重。', icon: '🍵', cat: 'col', price: 280 },
    teaicecream: { name: '包種茶霜淇淋', desc: '淡淡的茶香，吃完嘴裡是甜的。', icon: '🍦', cat: 'use', price: 60, eat: '吃' },
  });
  QUESTS.gondola_open = {
    type: 'side', title: '貓纜重新運轉', giver: 'linzhang',
    desc: '動物園站的林站長說，貓空纜車的控制室鑰匙不見了，纜車只好停在轉輪下面。',
    steps: [
      { text: '在動物園站裡找到掉落的控制室鑰匙', goal: { kind: 'find', item: 'ropekey', station: '動物園' } },
      { text: '到 2F 動物園遊客中心看樓層指南，找到往纜車的連通道', goal: { kind: 'inspect', spot: 'malldir', station: '動物園' } },
      { text: '把鑰匙交給林站長', goal: { kind: 'give', npc: 'linzhang', item: 'ropekey' } },
    ],
    reward: { money: 300, xp: 220, friend: { linzhang: 30 } },
  };
  NPCS.linzhang = {
    name: '林站長', role: '貓空纜車站長', station: '動物園', spot: 'unpaid', hours: [[8, 22]], speed: .8,
    look: { old: true, skin: '#d8a888', hair: 'short', hairColor: '#6a6a66', top: '#2a5a3a', pattern: 'plain', bottom: '#2a2f38', hat: 'cap', hatColor: '#2a5a3a', glasses: true },
    gives: ['gondola_open'], likes: ['coffee', 'maokongtea', 'greentea'],
    lines: ['貓纜我開了二十年，從來沒停這麼久過。', '晴天的時候，從車廂裡看得到 101。', '水晶車廂的腳底下是透明的，膽子小的別坐。'],
    rumors: ['以前末班車開完，有一台車廂會自己繞一圈才停。我們都叫它「最後一位客人」。'],
  };
  function onQuestDone(id) {
    if (id !== 'gondola_open') return;
    S().flags.gondola = true; saveState();
    setTimeout(() => {
      if (typeof FX !== 'undefined' && FX.banner) FX.banner('貓空纜車恢復營運', '地圖上出現了貓空纜車；從 2F 動物園遊客中心盡頭的連通道去搭', 'secret');
      toast('<b>🚡 貓空纜車開放了</b><span>從 2F 動物園遊客中心盡頭的連通道過去；地圖上也看得到纜車了</span>', 'level');
    }, 1200);
  }

  return { ST, enter, exitMode, backToMRT, tick, interaction, onQuestDone, unlocked, fare, get mode() { return mode; } };
})();
