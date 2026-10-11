/* 車站額外裝飾（由 Station3D.build 呼叫）：花槽、盆栽、吊籃、綠牆、大廳中央的階梯花台
 * 所有植物、花盆都先在這裡合併成少數幾個「頂點著色」的網格（每站約 4 個 draw call），
 * 不交給 mergeStatic（它會丟掉頂點顏色）。依站名雜湊決定花色、盆器風格與擺放，每站看起來不一樣；
 * 花色也會跟著季節換（春：杜鵑、夏：扶桑、秋：菊花、冬：聖誕紅）。
 */
const Decor = (() => {
  let base = null, mats = null;

  // 葉片：沿 +x 長 1、寬 1 的扁平六邊形，中脈稍微隆起（12 個三角形）
  function leafGeo(T) {
    const o = [[-.5, 0], [-.25, .45], [.15, .5], [.5, 0], [.15, -.5], [-.25, -.45]], pos = [];
    for (const s of [1, -1]) for (let i = 0; i < 6; i++) {
      const a = o[i], c = o[(i + 1) % 6], A = [a[0], 0, a[1]], Cc = [c[0], 0, c[1]], top = [-.05, s * .5, 0];
      if (s > 0) pos.push(...top, ...A, ...Cc); else pos.push(...top, ...Cc, ...A);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  function init(T) {
    if (base) return;
    const prep = geo => {
      const g = geo.index ? geo.toNonIndexed() : geo;
      g.computeBoundingBox();
      return { pos: g.attributes.position.array, nor: g.attributes.normal.array, y0: g.boundingBox.min.y, y1: g.boundingBox.max.y };
    };
    base = {
      box: prep(new T.BoxGeometry(1, 1, 1)),
      cyl: prep(new T.CylinderGeometry(.5, .5, 1, 7, 1, true)),
      pot: prep(new T.CylinderGeometry(.5, .4, 1, 10)),
      disk: prep(new T.CylinderGeometry(.5, .5, 1, 10)),
      ico: prep(new T.IcosahedronGeometry(.5, 0)),
      oct: prep(new T.OctahedronGeometry(.5, 0)),
      blob: prep(new T.IcosahedronGeometry(.5, 1)),
      leaf: prep(leafGeo(T)),
      cone: prep(new T.ConeGeometry(.5, 1, 5)),
      bowl: prep(new T.SphereGeometry(.5, 10, 3, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)),
    };
    const mk = o => { const m = new T.MeshStandardMaterial(Object.assign({ vertexColors: true }, o)); m.userData.shared = true; return m; };
    mats = {
      plant: mk({ roughness: .82 }),
      pot: mk({ roughness: .55 }),
      metal: mk({ roughness: .35, metalness: .6 }),
      bowl: mk({ roughness: .9, side: T.DoubleSide }),
    };
  }

  // 收集幾何：每種材質一桶，最後各合併成一個網格
  function builder(T) {
    const B = {}, stats = {};
    const m4 = new T.Matrix4(), nm = new T.Matrix3(), q = new T.Quaternion(), e = new T.Euler(), S = new T.Vector3(), P = new T.Vector3(), v = new T.Vector3(), c = new T.Color(), c2 = new T.Color();
    function add(cls, kind, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#ffffff', shade = 0) {
      const g = base[kind], b = B[cls] || (B[cls] = { pos: [], nor: [], col: [] });
      stats[kind] = (stats[kind] || 0) + g.pos.length / 3;
      e.set(rx, ry, rz, 'YXZ'); q.setFromEuler(e); m4.compose(P.set(x, y, z), q, S.set(sx, sy, sz)); nm.getNormalMatrix(m4);
      c.set(color);
      const span = g.y1 - g.y0 || 1;
      for (let i = 0; i < g.pos.length; i += 3) {
        const ly = g.pos[i + 1];
        v.set(g.pos[i], ly, g.pos[i + 2]).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z);
        v.set(g.nor[i], g.nor[i + 1], g.nor[i + 2]).applyMatrix3(nm).normalize(); b.nor.push(v.x, v.y, v.z);
        const f = 1 - shade * (1 - (ly - g.y0) / span);
        c2.copy(c).multiplyScalar(f); b.col.push(c2.r, c2.g, c2.b);
      }
    }
    // 葉片／花瓣：從 (ox,oy,oz) 往 yaw 方向長出去，仰角 pitch
    function blade(cls, kind, ox, oy, oz, len, wid, thick, yaw, pitch, color, shade = .35) {
      const dx = Math.cos(pitch) * Math.cos(yaw), dy = Math.sin(pitch), dz = -Math.cos(pitch) * Math.sin(yaw);
      add(cls, kind, ox + dx * len / 2, oy + dy * len / 2, oz + dz * len / 2, len, thick, wid, 0, yaw, pitch, color, shade);
    }
    // 兩點之間的細桿（莖、吊桿）
    function rod(cls, x0, y0, z0, x1, y1, z1, r, color) {
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz) || .001;
      const g = base.cyl, b = B[cls] || (B[cls] = { pos: [], nor: [], col: [] });
      q.setFromUnitVectors(new T.Vector3(0, 1, 0), v.set(dx / L, dy / L, dz / L));
      m4.compose(P.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), q, S.set(r * 2, L, r * 2)); nm.getNormalMatrix(m4); c.set(color);
      for (let i = 0; i < g.pos.length; i += 3) {
        v.set(g.pos[i], g.pos[i + 1], g.pos[i + 2]).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z);
        v.set(g.nor[i], g.nor[i + 1], g.nor[i + 2]).applyMatrix3(nm).normalize(); b.nor.push(v.x, v.y, v.z);
        b.col.push(c.r, c.g, c.b);
      }
    }
    function finish(parent) {
      let n = 0;
      for (const [cls, b] of Object.entries(B)) {
        if (!b.pos.length) continue;
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3));
        geo.setAttribute('normal', new T.Float32BufferAttribute(b.nor, 3));
        geo.setAttribute('color', new T.Float32BufferAttribute(b.col, 3));
        geo.computeBoundingSphere();
        const m = new T.Mesh(geo, mats[cls]);
        m.userData.dynamic = true;   // 不要被 mergeStatic 合併（會丟掉頂點顏色）
        m.name = 'decor-' + cls;
        parent.add(m); n += b.pos.length / 3;
      }
      return n;
    }
    return { add, blade, rod, finish, stats };
  }

  const hash = s => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 2166136261);
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // 季節花色
  function season() {
    let m = new Date().getMonth() + 1;
    try { if (typeof TaipeiTime !== 'undefined') m = TaipeiTime.now().month || m; } catch (e) { /* 用系統時間 */ }
    if (m >= 2 && m <= 4) return { name: 'spring', flowers: ['#e8559a', '#f27fbd', '#ffffff', '#d63a78', '#f7b2d0', '#c84aa0'] };       // 杜鵑
    if (m >= 5 && m <= 8) return { name: 'summer', flowers: ['#e62e45', '#ff7a2a', '#f7c52a', '#c8307e', '#ffffff', '#ff5a8a'] };       // 扶桑、九重葛
    if (m >= 9 && m <= 11) return { name: 'autumn', flowers: ['#f2b51c', '#e8792a', '#c8384a', '#9a5ac8', '#fff1c0', '#f5d04a'] };      // 菊花
    return { name: 'winter', flowers: ['#d0202e', '#ffffff', '#e8557a', '#f2c94a', '#b01828', '#f6e7ea'] };                            // 聖誕紅、山茶
  }
  const GREENS = ['#3e7d3f', '#2f6b36', '#4f8f45', '#5f9e4a', '#2a5e34', '#467f3a'];
  // 盆器風格（每站一種）
  const STYLES = [
    { body: '#3d4248', rim: '#8a5a36', base: '#24272b', pot: '#3d4248', potRim: '#55595e' },   // 炭灰＋木頭
    { body: '#d8d2c4', rim: '#b9b2a2', base: '#8a857a', pot: '#e9e5dc', potRim: '#cfc9bc' },   // 磨石子
    { body: '#2f6f78', rim: '#d8d2c4', base: '#1e464c', pot: '#2f7f86', potRim: '#3f959c' },   // 青瓷釉
    { body: '#b8613a', rim: '#8a4426', base: '#6a3420', pot: '#c06a40', potRim: '#a3532f' },   // 陶土
    { body: '#eeeeea', rim: '#30363c', base: '#9aa0a6', pot: '#f1f1ec', potRim: '#30363c' },   // 白瓷＋黑邊
  ];

  function build(L, g, K) {
    const T = K.T; init(T);
    const b = builder(T), R = rng(hash(L.stationId)), pick = a => a[(R() * a.length) | 0];
    const C = L.concourse, U = L.unpaid, SEA = season();
    const lineC = (typeof LINES !== 'undefined' && LINES[L.platforms[0].line]) ? LINES[L.platforms[0].line].color : '#2a7de1';
    const style = STYLES[hash(L.stationId + 's') % STYLES.length];
    const big = L.platforms.length >= 2 || !!(K.T && typeof Station3D !== 'undefined' && Station3D.SHOPS && Station3D.SHOPS[L.stationId]);
    const art = typeof ART !== 'undefined' ? ART[L.stationId] : null;
    // 這站的花色：季節色裡挑 4 種，偶爾加入路線色
    const flowers = [...SEA.flowers].sort(() => R() - .5).slice(0, 4); if (R() < .5) flowers.push(lineC);
    const twoColors = () => { const a = pick(flowers); let c = pick(flowers); if (c === a) c = '#ffffff'; return [a, c]; };
    const mine = [], items = [];
    const solid = (x, z, w, d, y = 0) => { K.solid(x, z, w, d, y); items.push([+x.toFixed(1), +z.toFixed(1), y]); const o = L.obstacles[L.obstacles.length - 1]; if (o) o.decor = true; mine.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y }); };

    /* ── 零件 ── */
    // 一片花床：低矮葉叢＋花（cy 是土面高度）；round：圓形範圍
    function bed(cx, cy, cz, w, d, cols, opt = {}) {
      const round = !!opt.round, area = round ? Math.PI * w * d / 4 : w * d;
      const inside = () => { for (;;) { const u = R() - .5, v = R() - .5; if (!round || u * u + v * v < .25) return [cx + u * w, cz + v * d]; } };
      const nLeaf = Math.max(3, Math.round(area * 11)), nFl = Math.max(4, Math.round(area * (opt.dense || 34)));
      for (let i = 0; i < nLeaf; i++) { const [x, z] = inside(), r = .09 + R() * .08; b.add('plant', 'ico', x, cy + r * .45, z, r * 2.2, r * 1.5, r * 2.2, 0, R() * 6.28, 0, pick(GREENS), .5); }
      // 邊緣垂下來的葉片（花槽才有）
      if (!round && opt.spill) for (let x = cx - w / 2 + .15; x < cx + w / 2 - .1; x += .32 + R() * .1) for (const s of [-1, 1]) b.blade('plant', 'leaf', x, cy + .02, cz + s * d / 2, .2 + R() * .08, .09, .025, s > 0 ? -Math.PI / 2 + (R() - .5) * .6 : Math.PI / 2 + (R() - .5) * .6, -.7 - R() * .4, pick(GREENS), .3);
      const spikes = opt.spikes ?? R() < .35;
      for (let i = 0; i < nFl; i++) {
        const [x, z] = inside(), col = cols[i % cols.length];
        if (spikes && i % 4 === 0) { const h = .16 + R() * .12; b.add('plant', 'cone', x, cy + .14 + h / 2, z, .05, h, .05, 0, R() * 3, 0, col, .35); continue; }   // 穗狀花（像薰衣草、雞冠花）
        const r = .05 + R() * .035, y = cy + .1 + R() * .16;
        b.add('plant', 'oct', x, y, z, r * 2.3, r * 1.1, r * 2.3, (R() - .5) * .5, R() * 6.28, 0, col, .3);
        if (i % 3 === 0) b.add('plant', 'oct', x, y + r * .45, z, r * .7, r * .5, r * .7, 0, 0, 0, '#f5d04a');   // 花心
      }
    }
    // 長方形花槽
    function trough(x, y, z, w, d, h, opt = {}) {
      b.add('pot', 'box', x, y + .04, z, w - .08, .08, d - .08, 0, 0, 0, style.base);
      b.add('pot', 'box', x, y + .08 + (h - .08) / 2, z, w, h - .08, d, 0, 0, 0, style.body, .25);
      b.add('pot', 'box', x, y + h + .02, z, w + .05, .04, d + .05, 0, 0, 0, style.rim);
      b.add('plant', 'box', x, y + h - .01, z, w - .06, .02, d - .06, 0, 0, 0, '#3b2a1e');
      bed(x, y + h, z, w - .1, d - .1, opt.cols || twoColors(), { spill: true, ...opt });
    }
    // 圓盆（回傳土面高度）
    function pot(x, y, z, r, h, col = style.pot, rimC = style.potRim) {
      b.add('pot', 'pot', x, y + h / 2, z, r * 2, h, r * 2, 0, 0, 0, col, .3);
      b.add('pot', 'disk', x, y + h - .02, z, r * 2 + .05, .05, r * 2 + .05, 0, 0, 0, rimC);
      b.add('plant', 'disk', x, y + h - .03, z, r * 1.9, .02, r * 1.9, 0, 0, 0, '#3b2a1e');
      return y + h - .02;
    }
    // 龜背芋
    function monstera(x, y, z, s = 1) {
      const top = pot(x, y, z, .3 * s, .5 * s);
      const n = 8 + ((R() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const yaw = i / n * 6.28 + R() * .5, len = (.42 + R() * .2) * s, sh = (.35 + R() * .6) * s;
        const sx = x + Math.cos(yaw) * .12 * s, sz = z - Math.sin(yaw) * .12 * s, sy = top + sh;
        b.rod('plant', x, top, z, sx, sy, sz, .012, '#4f7d3a');
        b.blade('plant', 'leaf', sx, sy, sz, len, len * .78, .03, yaw, -.15 - R() * .45, pick(['#2c6b34', '#2f7a3a', '#25602e']), .45);
      }
    }
    // 棕櫚（每根莖頂端長出幾片往外彎的羽葉，每片兩節）
    function palm(x, y, z, s = 1) {
      const top = pot(x, y, z, .3 * s, .55 * s);
      const n = 3 + ((R() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const yaw = i / n * 6.28 + R(), lean = .1 + R() * .15, h = (.75 + R() * .55) * s;
        const tx = x + Math.cos(yaw) * lean * h, tz = z - Math.sin(yaw) * lean * h, ty = top + h;
        b.rod('plant', x, top, z, tx, ty, tz, .022, '#7a7a3a');
        const m = 5 + ((R() * 2) | 0);
        for (let k = 0; k < m; k++) {
          const fy = k / m * 6.28 + yaw + R() * .4, l1 = (.42 + R() * .12) * s, l2 = (.38 + R() * .12) * s, p1 = .55 + R() * .35, col = pick(['#4f8f45', '#5f9e4a', '#3e7d3f', '#467f3a']);
          b.blade('plant', 'leaf', tx, ty, tz, l1, .2 * s, .02, fy, p1, col, .3);
          const ex = tx + Math.cos(p1) * Math.cos(fy) * l1 * .95, ey = ty + Math.sin(p1) * l1 * .95, ez = tz - Math.cos(p1) * Math.sin(fy) * l1 * .95;
          b.blade('plant', 'leaf', ex, ey, ez, l2, .17 * s, .02, fy, p1 - .9 - R() * .3, col, .3);
        }
      }
    }
    // 虎尾蘭
    function snake(x, y, z, s = 1) {
      const top = pot(x, y, z, .24 * s, .45 * s);
      const n = 10 + ((R() * 4) | 0);
      for (let i = 0; i < n; i++) {
        const a = R() * 6.28, r = R() * .12 * s, h = (.55 + R() * .45) * s;
        b.add('plant', 'leaf', x + Math.cos(a) * r, top + h / 2, z + Math.sin(a) * r, .07 * s, h, .025, (R() - .5) * .25, R() * 3.14, (R() - .5) * .25, i % 3 ? '#35673a' : '#7d9a3e', .45);
      }
    }
    // 小樹（榕樹）
    function tree(x, y, z, s = 1) {
      const h = 1.5 * s;
      b.rod('pot', x, y, z, x + .05, y + h * .65, z - .03, .06 * s, '#6a4a32');
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.28 + R(), r = .3 * s * (i ? 1 : 0), cr = (.32 + R() * .14) * s;
        b.add('plant', 'blob', x + Math.cos(a) * r, y + h * .8 + (i ? R() * .3 * s : .3 * s), z + Math.sin(a) * r, cr * 2, cr * 1.7, cr * 2, 0, R() * 6, 0, pick(GREENS), .5);
      }
    }
    // 圓形花台（中間可以種樹）
    function island(x, z, r, opt = {}) {
      b.add('pot', 'disk', x, .03, z, r * 2 - .1, .06, r * 2 - .1, 0, 0, 0, style.base);
      b.add('pot', 'disk', x, .26, z, r * 2, .4, r * 2, 0, 0, 0, style.body, .2);
      b.add('pot', 'disk', x, .47, z, r * 2 + .1, .04, r * 2 + .1, 0, 0, 0, style.rim);
      b.add('plant', 'disk', x, .47, z, r * 2 - .06, .02, r * 2 - .06, 0, 0, 0, '#3b2a1e');
      bed(x, .48, z, r * 2 - .15, r * 2 - .15, opt.cols || twoColors(), { round: true, dense: 30 });
      if (opt.tree) tree(x, .48, z, opt.tree);
      solid(x, z, r * 2, r * 2);
    }
    // 吊籃（ceil：天花板高度）
    function basket(x, y, z, ceil, cols) {
      b.rod('metal', x, ceil, z, x, y + .22, z, .008, '#30363c');
      for (const a of [0, 2.09, 4.19]) b.rod('metal', x, y + .22, z, x + Math.cos(a) * .2, y + .02, z + Math.sin(a) * .2, .005, '#30363c');
      b.add('bowl', 'bowl', x, y + .02, z, .44, .5, .44, 0, 0, 0, '#6b4a2e', .3);
      for (let i = 0; i < 7; i++) { const a = R() * 6.28, r = R() * .14; b.add('plant', 'ico', x + Math.cos(a) * r, y + .05 + R() * .05, z + Math.sin(a) * r, .2, .14, .2, 0, R() * 6, 0, pick(GREENS), .4); }
      for (let k = 0; k < 6; k++) {   // 垂下來的藤蔓
        const a = k / 6 * 6.28 + R() * .4; let px = x + Math.cos(a) * .2, pz = z + Math.sin(a) * .2, py = y;
        const n = 2 + ((R() * 2) | 0);
        for (let j = 0; j < n; j++) { px += Math.cos(a) * .03; pz += Math.sin(a) * .03; py -= .1; b.add('plant', 'ico', px, py, pz, .1, .08, .1, R(), R() * 6, 0, pick(GREENS), .3); if (j % 2) b.add('plant', 'ico', px + .02, py - .03, pz, .07, .05, .07, 0, 0, 0, cols[(j + k) % cols.length], .2); }
      }
      for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = .06 + R() * .16; b.add('plant', 'ico', x + Math.cos(a) * r, y + .1 + R() * .08, z + Math.sin(a) * r, .09, .06, .09, R(), R() * 6, 0, cols[i % cols.length], .2); }
    }
    // 階梯式花台（像車站裡的菊花展）
    function tiers(x, z, r, n) {
      const cols = [...flowers].sort(() => R() - .5);
      for (let t = 0; t < n; t++) {
        const rt = r * (1 - t * .3), h = .42 + t * .3, y0 = t ? .42 + (t - 1) * .3 : 0, hh = h - y0;
        if (!t) b.add('pot', 'disk', x, .03, z, rt * 2 - .1, .06, rt * 2 - .1, 0, 0, 0, style.base);
        b.add('pot', 'disk', x, y0 + hh / 2, z, rt * 2, hh, rt * 2, 0, 0, 0, style.body, .2);
        b.add('pot', 'disk', x, h + .01, z, rt * 2 + .08, .04, rt * 2 + .08, 0, 0, 0, style.rim);
        // 只在露出來的環上種花（上一層蓋住的部分不種）
        const rin = t < n - 1 ? r * (1 - (t + 1) * .3) : 0, col = [cols[t % cols.length], cols[(t + 1) % cols.length]];
        const nf = Math.round(Math.PI * (rt * rt - rin * rin) * 40), nl = Math.round(Math.PI * (rt * rt - rin * rin) * 12);
        for (let i = 0; i < nl + nf; i++) {
          const a = R() * 6.28, rr = Math.sqrt(rin * rin + R() * (Math.max(0, (rt - .1) ** 2 - rin * rin))), px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr;
          if (i < nl) { const q = .1 + R() * .06; b.add('plant', 'ico', px, h + q * .5, pz, q * 2.2, q * 1.5, q * 2.2, 0, R() * 6, 0, pick(GREENS), .5); continue; }
          const q = .055 + R() * .03; b.add('plant', 'oct', px, h + .1 + R() * .12, pz, q * 2.3, q * 1.2, q * 2.3, (R() - .5) * .5, R() * 6, 0, col[i % 2], .3);
          if (i % 3 === 0) b.add('plant', 'oct', px, h + .2, pz, q * .7, q * .5, q * .7, 0, 0, 0, '#f5d04a');
        }
      }
      if (n >= 3) palmTop(x, .42 + (n - 1) * .3, z);
      solid(x, z, r * 2, r * 2);
    }
    // 頂層中央的一叢綠葉
    function palmTop(x, y, z) {
      for (let k = 0; k < 9; k++) { const yaw = k / 9 * 6.28 + R() * .3; b.blade('plant', 'leaf', x, y + .05, z, .45 + R() * .15, .2, .025, yaw, .7 + R() * .4, pick(GREENS), .35); }
    }
    // 綠牆（掛在牆上；nx,nz：牆面朝向）
    let gwMat = null;
    function greenWall(x, y, z, w, h, rotY) {
      if (!gwMat) {
        const tex = K.canvasTex(256, 256, (x2, W, H) => {
          x2.fillStyle = '#24452a'; x2.fillRect(0, 0, W, H);
          const rr = rng(hash(L.stationId + 'gw'));
          for (let i = 0; i < 420; i++) {
            const px = rr() * W, py = rr() * H, s = 6 + rr() * 12;
            x2.fillStyle = GREENS[(rr() * GREENS.length) | 0]; x2.globalAlpha = .75 + rr() * .25;
            x2.beginPath(); x2.ellipse(px, py, s, s * .55, rr() * 3.14, 0, 6.29); x2.fill();
          }
          x2.globalAlpha = 1;
          for (let i = 0; i < 40; i++) { x2.fillStyle = flowers[i % flowers.length]; x2.beginPath(); x2.arc(rr() * W, rr() * H, 2.5 + rr() * 2.5, 0, 6.29); x2.fill(); }
        });
        tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(w / 1.4, h / 1.4);
        gwMat = K.M('#ffffff', { map: tex, r: .9 });
      }
      const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = rotY; g.add(grp);
      const frame = K.M('#30363c', { r: .5, m: .4 });
      K.box(w + .1, .06, .14, frame, 0, h / 2 + .03, .07, grp); K.box(w + .1, .06, .14, frame, 0, -h / 2 - .03, .07, grp);
      for (const s of [-1, 1]) K.box(.06, h + .12, .14, frame, s * (w / 2 + .02), 0, .07, grp);
      const p = K.plane(w, h, gwMat, grp); p.position.z = .03;
      // 立體的葉叢與花（用世界座標放進合併網格）
      const cs = Math.cos(rotY), sn = Math.sin(rotY), W2 = (lx, ly, lz) => [x + lx * cs + lz * sn, y + ly, z - lx * sn + lz * cs];
      for (let i = 0; i < 26; i++) {
        const [px, py, pz] = W2((R() - .5) * (w - .2), (R() - .5) * (h - .2), .08 + R() * .05), r = .1 + R() * .07;
        b.add('plant', 'ico', px, py, pz, r * 2, r * 1.6, r * 2, R(), R() * 6, 0, pick(GREENS), .4);
        if (i % 2) { const [fx, fy, fz] = W2((R() - .5) * (w - .2), (R() - .5) * (h - .2), .16); b.add('plant', 'ico', fx, fy, fz, .1, .1, .1, R(), R(), 0, pick(flowers), .2); }
      }
    }

    /* ── 可以放東西的地方（大廳、非付費區） ── */
    const box2 = (x, z, hw, hd, m) => ({ x0: x - hw - m, x1: x + hw + m, z0: z - hd - m, z1: z + hd + m });
    const hit = (a, o) => a.x0 < o.x1 && a.x1 > o.x0 && a.z0 < o.z1 && a.z1 > o.z0;
    const inHall = (x, z) => (x > C.x0 + .3 && x < C.x1 - .3 && z > C.z0 + .25 && z < L.gateZ - .3) || (x > U.x0 + .3 && x < U.x1 - .3 && z > U.z0 + .2 && z < U.z1 - 1.1);
    const reserved = [];
    const rsv = (x0, x1, z0, z1) => reserved.push({ x0, x1, z0, z1 });
    // 牆上的東西（沒有登記成障礙物的）
    const bz = C.z0;
    for (const [a, w] of [[C.x0 + 4, 1.2], [C.x0 + 8, 1.3], [C.x0 + 14, 2.8], [C.x0 + 22, 1.8], [C.x1 - 15, 1.8], [C.x1 - 10.5, .5], [C.x1 - 8, .5], [C.x1 - 4, 1.3], [0, 4.2], [-5.2, .35], [5.2, .35]]) rsv(a - w, a + w, bz, bz + 1.1);
    for (const wx of [C.x0, C.x1]) rsv(wx - 1.2, wx + 1.2, C.z0 + 7.3, C.z0 + 8.7);              // 消防栓
    rsv(U.x0 - 1, U.x0 + 1.4, U.z0 + 1.4, U.z0 + 3);                                          // 公共電話
    rsv(U.x0 - 1, U.x0 + 1.4, U.z0 + 4.6, U.z0 + 7.4);                                        // 路網圖
    if (big) rsv(U.x0 - 1, U.x0 + 1.6, U.z0 + 5.3, U.z0 + 11.4);                              // 商店櫥窗、置物櫃
    rsv(U.x1 - 1.6, U.x1 + 1, U.z0 + 3.9, U.z0 + 7);                                          // ATM、販賣機
    rsv(U.x1 - 6, U.x1 + 1, U.z0 + 1.6, U.z0 + 4.4); rsv(U.x1 - 10.2, U.x1 - 6.2, U.z0 + 1.6, U.z0 + 4.4);   // 詢問處、失物招領
    for (const x of [-4, 4]) rsv(x - .8, x + .8, U.z1 - 1.3, U.z1);
    for (const x of [U.x0 + 1.5, 0, U.x1 - 1.5]) rsv(x - 2.4, x + 2.4, U.z1 - 4, U.z1);       // 出口前的走道                           // 資源回收桶
    rsv(8.5 - 1.8, 8.5 + 1.8, U.z1 - 1.4, U.z1);                                               // 牆上廣告
    rsv(9.5 - 1, 9.5 + 1, L.gateZ + .6, L.gateZ + 3.2);                                        // 時刻表
    rsv(-8.8, 8.8, L.gateZ - 3.4, L.gateZ + 3.4);                                              // 閘門前後
    for (const P of L.platforms) for (const r of P.ramps) {                                   // 電扶梯口（大廳端外側留 4 公尺）
      const a = Math.min(r.xa, r.xb), c = Math.max(r.xa, r.xb);
      rsv(a - (r.b < 0 ? 4.2 : 1.2), c + (r.b > 0 ? 4.2 : 1.2), r.z - 2.9, r.z + 2.9);
    }
    // 特別場所（在這之後才蓋）
    rsv(C.x1 - 5.5, C.x1, C.z0 + 10.5, C.z0 + 17.5); rsv(C.x0, C.x0 + 5.5, C.z0 + 11.5, C.z0 + 15.5); rsv(C.x1 - 6, C.x1 - 1, C.z0 + 16, C.z0 + 21);
    rsv(C.x0, C.x0 + 2.6, C.z0 + 14.3, C.z0 + 17.7); rsv(C.x1 - 2.6, C.x1, C.z0 + 14.3, C.z0 + 17.7); rsv(U.x1 - 2.6, U.x1, U.z0, U.z0 + 2.4);
    // NPC 固定會站的點、萬聖節南瓜燈
    const pts = [[C.x0 + 1.2, C.z0 + 1.2], [C.x1 - 1.2, C.z0 + 1.2], [C.x0 + 1.2, L.gateZ - 1.2], [C.x1 - 1.2, L.gateZ - 1.2], [C.x0 + 1.5, C.z0 + 1.5], [C.x1 - 1.5, C.z0 + 1.5],
      [C.x0 + 6, L.gateZ - .8], [C.x1 - 6, C.z0 + 1], [U.x0 + 1, U.z1 - 2.6], [U.x0 + 2.2, U.z1 - 2.2], [U.x1 - 2.4, U.z0 + 1.6], [U.x1 - 3.5, U.z0 + 4.4], [U.x1 - 8.2, U.z0 + 4.4], [C.x0 + 5.4, C.z0 + 1.2]];
    for (const [x, z] of pts) rsv(x - .8, x + .8, z - .8, z + .8);
    const hallFree = (x, z, hw, hd) => {
      const a = box2(x, z, hw, hd, 0);
      if (![[a.x0, a.z0], [a.x1, a.z0], [a.x0, a.z1], [a.x1, a.z1]].every(([px, pz]) => inHall(px, pz))) return false;
      if (reserved.some(o => hit(a, o))) return false;
      const am = box2(x, z, hw, hd, .45);
      if ((L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && hit(am, o))) return false;
      if (L.spots.some(s => (s.y || 0) === 0 && hit(box2(x, z, hw, hd, 1.1), { x0: s.x, x1: s.x, z0: s.z, z1: s.z }))) return false;
      if ((L.rooms || []).some(r => Math.abs(r.door.wx - x) < 2.6 && Math.abs(r.door.z - z) < r.door.w / 2 + hd + 1.3)) return false;
      if ((L.ads || []).some(d => Math.abs(d.x - x) < hw + 1.9 && Math.abs(d.z - z) < hd + 1.9)) return false;
      return true;
    };
    const take = (x, z, hw, hd) => rsv(x - hw - .5, x + hw + .5, z - hd - .5, z + hd + .5);

    /* ── 大廳 ── */
    // 1) 站名牆下的長花槽
    {
      let w = 6.6; const z = C.z0 + .42;
      if (!(L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && hit(box2(0, z, w / 2, .3, .05), o))) {
        trough(0, 0, z, w, .5, .45, { cols: twoColors() }); solid(0, z, w, .5);
      }
    }
    // 2) 大廳中央：大站放花朵雕塑，小站放種了小樹的圓形花台
    {
      const cands = [[0, C.z0 + 5.6], [0, C.z0 + 7], [0, (C.z0 + L.gateZ) / 2 - 4.5]];
      const r = big ? 1.15 : .95;
      const at = cands.find(([x, z]) => hallFree(x, z, r, r));
      if (at) {
        if (big || hash(L.stationId) % 3 === 0) tiers(at[0], at[1], r, big ? 3 : 2);
        else island(at[0], at[1], r, { tree: .85 + R() * .2 });
        take(at[0], at[1], r, r);
      }
    }
    // 3) 大廳柱子旁長椅兩端的小花盆
    for (const o of (L.obstacles || []).slice()) {
      if (o.decor || Math.abs(o.y || 0) > .1) continue;
      const w = o.x1 - o.x0, d = o.z1 - o.z0, cx = (o.x0 + o.x1) / 2, cz = (o.z0 + o.z1) / 2;
      if (!(Math.abs(w - .5) < .02 && Math.abs(d - 1.6) < .02 && cz < L.gateZ && Math.abs(Math.abs(cx) - 6.5) < .1)) continue;   // 大廳長椅
      for (const s of [-1, 1]) {
        const pz = cz + s * 1.12;
        if ((L.obstacles || []).some(q => q !== o && Math.abs(q.y || 0) < .5 && hit(box2(cx, pz, .25, .25, .15), q))) continue;
        if (L.platforms.some(P => P.ramps.some(r => hit(box2(cx, pz, .25, .25, .4), { x0: Math.min(r.xa, r.xb), x1: Math.max(r.xa, r.xb), z0: r.z - 1.9, z1: r.z + 1.9 })))) continue;   // 電扶梯開口
        const top = pot(cx, 0, pz, .22, .38); bed(cx, top, pz, .4, .4, twoColors(), { round: true, dense: 60, spikes: false });
        solid(cx, pz, .44, .44);
      }
    }
    // 4) 靠牆的大型盆栽（大廳、非付費區）
    {
      const kinds = [monstera, palm, snake, palm, monstera];
      const cands = [];
      for (let z = C.z0 + 2.4; z < L.gateZ - 1.4; z += .8) { cands.push([C.x0 + .7, z, 'w']); cands.push([C.x1 - .7, z, 'w']); }
      for (let x = C.x0 + 1.2; x < C.x1 - 1; x += .8) cands.push([x, C.z0 + .7, 'b']);
      for (let x = C.x0 + 1.4; x < U.x0 - .5; x += .8) cands.push([x, L.gateZ - .7, 'g']);
      for (let x = U.x1 + .5; x < C.x1 - 1.2; x += .8) cands.push([x, L.gateZ - .7, 'g']);
      for (let z = U.z0 + 1; z < U.z1 - 1.6; z += .8) { cands.push([U.x0 + .7, z, 'u']); cands.push([U.x1 - .7, z, 'u']); }
      for (let x = U.x0 + 1; x < U.x1 - 1; x += .8) cands.push([x, U.z1 - 1.75, 'e']);
      // 洗牌（固定種子）後挑互相距離夠遠的位置
      for (let i = cands.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [cands[i], cands[j]] = [cands[j], cands[i]]; }
      const chosen = [], perWall = {}, maxN = big ? 10 : 8;
      for (const [x, z, wall] of cands) {
        if (chosen.length >= maxN || (perWall[wall] || 0) >= (wall === 'w' || wall === 'u' ? 4 : 2)) continue;
        if (chosen.some(c => Math.hypot(c[0] - x, c[1] - z) < 5)) continue;
        if (!hallFree(x, z, .35, .35)) continue;
        chosen.push([x, z]); perWall[wall] = (perWall[wall] || 0) + 1;
      }
      for (const [x, z] of chosen) { kinds[(hash(L.stationId + x.toFixed(1) + z.toFixed(1))) % kinds.length](x, 0, z, 1 + R() * .15); solid(x, z, .62, .62); take(x, z, .35, .35); }
    }
    // 5) 非付費區的圓形花台（一兩座）
    {
      const cands = [[-9, U.z0 + 6.6], [9.4, U.z0 + 8.2], [-9.2, U.z0 + 9], [9.2, U.z0 + 10.2], [-5.5, U.z0 + 7.5], [5.5, U.z0 + 7.5]];
      let n = 0;
      for (const [x, z] of cands) {
        if (n >= (big ? 2 : 1 + (hash(L.stationId) % 2))) break;
        if (!hallFree(x, z, .9, .9)) continue;
        island(x, z, .85, { tree: n === 0 && R() < .6 ? .8 : 0 }); take(x, z, .9, .9); n++;
      }
    }

    /* ── 月台 ── */
    for (const P of L.platforms) {
      const ox = P.x, oy = P.y, oz = P.z;
      const pFree = (lx, lz, hw) => {
        const a = box2(ox + lx, oz + lz, hw, hw, .12);
        if ((L.obstacles || []).some(o => Math.abs((o.y || 0) - oy) < .5 && hit(a, o))) return false;
        if (P.ramps.some(r => hit(a, { x0: Math.min(r.xa, r.xb) - 1, x1: Math.max(r.xa, r.xb) + 1, z0: r.z - 2, z1: r.z + 2 }))) return false;
        if (Math.abs(lz) + hw > 1.92 && K.DOORS.some(d => Math.abs(d - lx) < hw + 1.2)) return false;   // 車門前留空
        return true;
      };
      const artHere = art && art.level === 'platform' && P === L.platforms[0];
      const fl = twoColors();
      // 中央柱子兩側的小花盆（看路網圖的人站在柱子前後，不擋）
      if (!artHere) for (const sx of [-1, 1]) {
        const lx = sx * 1.25;
        if (!pFree(lx, 0, .25)) continue;
        const top = pot(ox + lx, oy, oz, .24, .42); bed(ox + lx, top, oz, .44, .44, fl, { round: true, dense: 60, spikes: false });
        solid(ox + lx, oz, .48, .48, oy);
      }
      // 電梯與座椅之間、座椅與飲水機之間的盆栽
      for (const [lx, lz, kind] of [[-22.55, 0, 'snake'], [25.3, -.2, 'snake']]) {
        if (!pFree(lx, lz, .22)) continue;
        snake(ox + lx, oy, oz + lz, .9); solid(ox + lx, oz + lz, .44, .44, oy);
      }
      // 月台兩端角落的大盆栽
      for (const ex of [-1, 1]) for (const sz of [-1, 1]) {
        const lx = ex * 32.35, lz = sz * 2.35;
        if (!pFree(lx, lz, .3)) continue;
        (((hash(L.stationId + P.line) + (ex + 1) + (sz + 1) * 2) % 2) ? palm : monstera)(ox + lx, oy, oz + lz, .95);
        solid(ox + lx, oz + lz, .6, .6, oy);
      }
      if (P.under) {
        // 端牆的綠牆（工作門和消防栓之間）
        for (const ex of [-1, 1]) greenWall(ox + ex * (K.LEN / 2 - .01), oy + 1.65, oz - .18, 1.75, 2.1, ex > 0 ? -Math.PI / 2 : Math.PI / 2);
      } else {
        // 高架月台：屋簷下的吊籃
        const cols = [pick(flowers), pick(flowers), '#ffffff'];
        for (const [lx, lz] of [[-26, 1.2], [-21, -1.2], [21, 1.2], [26, -1.2]]) basket(ox + lx, oy + 3.3, oz + lz, oy + 3.81, cols);
      }
    }

    const verts = b.finish(g);
    L.decor = { verts, season: SEA.name, solids: mine.length, stats: b.stats, items };
  }
  return { build };
})();
