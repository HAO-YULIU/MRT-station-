/* 3D 建造：多樓層車站（大廳＋各路線島式月台＋電扶梯／樓梯＋車站設施）、列車、站間隧道／高架
 * 座標（公尺）：軌道沿 x 軸。大廳地板 y = 0；地下月台在大廳下方（-6、-11…），高架月台在上方（+6、+11…）。
 * 每條線一座島式月台，兩側各一條軌道：+z 側往路線「順向」（站碼遞增），-z 側往「逆向」。
 * 不同路線的月台放在不同樓層、不同位置，轉乘必須經過大廳。
 */
const Station3D = (() => {
  const T = THREE;
  const CAR_LEN = 20, CAR_GAP = .5, CARS = 3;
  const CAR_X = [-(CAR_LEN + CAR_GAP), 0, CAR_LEN + CAR_GAP];
  const DOOR_OFF = [-7.2, -2.4, 2.4, 7.2];
  const DOORS = CAR_X.flatMap(c => DOOR_OFF.map(o => c + o));
  const HALF_W = 1.5;          // 車身半寬
  const TRACK = 4.6;           // 軌道中心距月台中心
  const PLAT_HALF = 2.85;      // 月台可走範圍半寬
  const PSD = 3.12;            // 月台門距月台中心
  const LEN = 66;              // 月台長
  const RAMP_START = 9;        // 電扶梯底（或頂）距月台中心
  const LANES = [-1.25, 0, 1.25];   // 電扶梯（往大廳）、樓梯、電扶梯（往月台）

  /* ── 貼圖工具 ── */
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    t.userData.own = true;
    return t;
  }
  const noise = (g, w, h, amt) => {
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(img, 0, 0);
  };
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  const TEX = {};
  function textures() {
    if (TEX.floor) return;
    TEX.floor = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#c9c5bc'; g.fillRect(0, 0, w, h); noise(g, w, h, 16);
      g.strokeStyle = '#9d988e'; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); }
    });
    TEX.hall = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#d6d3cc'; g.fillRect(0, 0, w, h); noise(g, w, h, 12);
      g.strokeStyle = '#b4afa5'; g.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
    });
    TEX.wall = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#e4e0d6'; g.fillRect(0, 0, w, h); noise(g, w, h, 8);
      g.strokeStyle = '#c9c3b6'; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
      for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); }
    });
    TEX.tactile = canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = '#e8b800'; g.fillRect(0, 0, w, h); g.fillStyle = '#c99c00';
      for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
    });
    TEX.gravel = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3b3a38'; g.fillRect(0, 0, w, h); noise(g, w, h, 60); });
    TEX.concrete = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#6d6c69'; g.fillRect(0, 0, w, h); noise(g, w, h, 30); });
    TEX.steps = canvasTex(64, 256, (g, w, h) => {
      g.fillStyle = '#5d6166'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) { g.fillStyle = '#3e4246'; g.fillRect(0, y, w, 3); g.fillStyle = '#e8b800'; g.fillRect(0, y + 13, 3, 3); g.fillRect(w - 3, y + 13, 3, 3); }
    });
    TEX.stairs = canvasTex(64, 256, (g, w, h) => {
      g.fillStyle = '#bdb9b0'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) { g.fillStyle = '#8f8a80'; g.fillRect(0, y, w, 3); g.fillStyle = '#d9b100'; g.fillRect(0, y + 3, w, 2); }
    });
    TEX.door = canvasTex(128, 320, (g, w, h) => {
      g.fillStyle = '#e8ebee'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#26323b'; roundRect(g, 18, 40, w - 36, 150, 12); g.fill();
      g.fillStyle = 'rgba(255,255,255,.15)'; roundRect(g, 22, 44, 20, 140, 8); g.fill();
      g.strokeStyle = '#9aa3aa'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    });
  }
  function tiled(tex, rx, ry) { const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); return t; }

  // 相同參數的材質共用同一個（沒有貼圖時），合併網格才有效
  const matCache = new Map();
  const M = (color, o = {}) => {
    if (!o.map && !o.em) { const k = JSON.stringify([color, o]); if (!matCache.has(k)) matCache.set(k, M0(color, o)); return matCache.get(k); }
    return M0(color, o);
  };
  const M0 = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: o.r ?? .7, metalness: o.m ?? 0, map: o.map || null, transparent: !!o.t, opacity: o.o ?? 1, side: o.side || T.FrontSide, emissive: o.e || '#000', emissiveIntensity: o.ei ?? 1, emissiveMap: o.em || null, depthWrite: o.dw ?? true });
  function box(w, h, d, mat, x, y, z, parent) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent && parent.add(m); return m; }
  function plane(w, h, mat, parent) { const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); parent && parent.add(m); return m; }
  // 兩面都看得到的看板
  function sign(tex, w, h, x, y, z, parent, rotY = 0) {
    const mat = new T.MeshBasicMaterial({ map: tex });
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = rotY;
    box(w + .06, h + .06, .04, M('#2a2e33'), 0, 0, 0, g);
    const front = plane(w, h, mat, g); front.position.z = .025;
    const back = plane(w, h, mat, g); back.position.z = -.025; back.rotation.y = Math.PI;
    parent.add(g);
    return g;
  }

  // 矩形扣掉洞，切成多個矩形（給地板／天花板挖洞）
  function rectsMinus(o, holes) {
    const xs = new Set([o.x0, o.x1]), zs = new Set([o.z0, o.z1]);
    for (const h of holes) { for (const x of [h.x0, h.x1]) if (x > o.x0 && x < o.x1) xs.add(x); for (const z of [h.z0, h.z1]) if (z > o.z0 && z < o.z1) zs.add(z); }
    const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
    const out = [];
    for (let j = 0; j < Z.length - 1; j++) {
      let run = null;
      for (let i = 0; i < X.length - 1; i++) {
        const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
        const inHole = holes.some(h => cx > h.x0 && cx < h.x1 && cz > h.z0 && cz < h.z1);
        if (!inHole) { if (run) run.x1 = X[i + 1]; else run = { x0: X[i], x1: X[i + 1], z0: Z[j], z1: Z[j + 1] }; }
        else if (run) { out.push(run); run = null; }
      }
      if (run) out.push(run);
    }
    return out;
  }
  function slab(rects, y, mat, parent, thick = .3, up = true) {
    for (const r of rects) {
      const w = r.x1 - r.x0, d = r.z1 - r.z0;
      const m = box(w, thick, d, mat, (r.x0 + r.x1) / 2, y - (up ? thick / 2 : -thick / 2), (r.z0 + r.z1) / 2, parent);
      if (mat.map) { m.material = mat.clone(); m.material.map = tiled(mat.map, w / 2.4, d / 2.4); }
    }
  }

  /* ── 效能：把靜態網格依材質合併，大幅減少繪製次數 ── */
  function mergeStatic(root, skip) {
    root.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(root.matrixWorld).invert();
    const groups = new Map(), victims = [];
    root.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || o.isSprite) return;
      for (let p = o; p && p !== root; p = p.parent) if (p.userData && (p.userData.dynamic || p.userData.leaf) || (skip && skip(p))) return;
      const m = Array.isArray(o.material) ? null : o.material; if (!m) return;
      const key = m.uuid;
      if (!groups.has(key)) groups.set(key, { mat: m, parts: [] });
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      groups.get(key).parts.push(g);
      victims.push(o);
    });
    for (const o of victims) o.parent.remove(o);
    for (const { mat, parts } of groups.values()) {
      let n = 0; for (const g of parts) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o3 = 0, o2 = 0;
      for (const g of parts) {
        pos.set(g.attributes.position.array, o3);
        if (g.attributes.normal) nor.set(g.attributes.normal.array, o3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o2);
        o3 += g.attributes.position.count * 3; o2 += g.attributes.position.count * 2;
        g.dispose();
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const mesh = new T.Mesh(geo, mat);
      if (mat.transparent) mesh.renderOrder = 1;
      root.add(mesh);
    }
    return root;
  }

  /* ── 看板貼圖 ── */
  function drawBadge(g, lineId, code, x, y, s) {
    const m = code.match(/^([A-Z]+)(\d+[A-Z]?)$/);
    g.fillStyle = '#fff'; g.strokeStyle = LINES[lineId].color; g.lineWidth = s * .09;
    roundRect(g, x, y, s, s, s * .18); g.fill(); g.stroke();
    g.fillStyle = '#1c2126'; g.textAlign = 'center';
    g.font = `700 ${s * .36}px "Barlow Semi Condensed", sans-serif`; g.fillText(m[1], x + s / 2, y + s * .44);
    g.fillText(m[2], x + s / 2, y + s * .84); g.textAlign = 'left';
  }
  function lineBlock(g, lineId, x, y, s) {
    const L = LINES[lineId];
    g.fillStyle = L.color; roundRect(g, x, y, s, s, s * .17); g.fill();
    g.fillStyle = L.text; g.textAlign = 'center'; g.font = `700 ${lineId.length > 1 ? s * .48 : s * .62}px "Barlow Semi Condensed", sans-serif`;
    g.fillText(lineId, x + s / 2, y + s * .7); g.textAlign = 'left';
  }
  function stationSignTex(stationId, lineId) {
    const lines = MRT.linesAt(stationId), name = MRT.label(stationId, lineId);
    return canvasTex(1024, 256, (g) => {
      g.fillStyle = '#f8f8f6'; g.fillRect(0, 0, 1024, 256);
      g.fillStyle = LINES[lineId].color; g.fillRect(0, 0, 1024, 22);
      lines.forEach((l, i) => drawBadge(g, l.line, l.code, 40 + i * 132, 66, 116));
      const tx = 40 + lines.length * 132 + 24;
      g.fillStyle = '#1c2126'; g.font = `900 ${name.zh.length > 5 ? 84 : 104}px "Noto Sans TC", sans-serif`;
      g.fillText(name.zh, tx, 158);
      g.fillStyle = '#3d454d'; g.font = '600 44px "Barlow Semi Condensed", sans-serif'; g.fillText(name.en, tx + 4, 216);
    });
  }
  // 深色指標：色塊＋主要文字＋英文＋箭頭
  function guideTex(lineIds, zh, en, arrow) {
    return canvasTex(1024, 256, (g) => {
      g.fillStyle = '#23272b'; g.fillRect(0, 0, 1024, 256);
      let x = 34;
      for (const l of lineIds) { lineBlock(g, l, x, 52, 150); x += 166; }
      g.fillStyle = '#fff'; g.font = `700 ${zh.length > 9 ? 64 : 84}px "Noto Sans TC", sans-serif`; g.fillText(zh, x + 18, 134);
      g.fillStyle = '#c8cdd2'; g.font = '500 42px "Barlow Semi Condensed", sans-serif'; g.fillText(en, x + 22, 200);
      if (arrow) {
        g.save(); g.translate(950, 128); g.rotate({ up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0, upleft: -Math.PI * .75, upright: -Math.PI / 4 }[arrow] || 0);
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-44, -16); g.lineTo(6, -16); g.lineTo(6, -44); g.lineTo(52, 0); g.lineTo(6, 44); g.lineTo(6, 16); g.lineTo(-44, 16); g.fill(); g.restore();
      }
    });
  }
  function plainSign(zh, en, bg = '#23272b', fg = '#fff', icon) {
    return canvasTex(1024, 256, (g) => {
      g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
      let x = 50;
      if (icon) { g.fillStyle = icon.bg; roundRect(g, 36, 52, 150, 150, 26); g.fill(); g.fillStyle = icon.fg; g.font = '700 92px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.fillText(icon.text, 111, 160); g.textAlign = 'left'; x = 220; }
      g.fillStyle = fg; g.font = `700 ${zh.length > 9 ? 66 : 86}px "Noto Sans TC", sans-serif`; g.fillText(zh, x, 136);
      g.globalAlpha = .75; g.font = '500 42px "Barlow Semi Condensed", sans-serif'; g.fillText(en, x + 4, 200); g.globalAlpha = 1;
    });
  }
  // 路網圖看板
  function routeMapTex() {
    return canvasTex(1024, 1024, (g) => {
      g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, 1024, 1024);
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const lid of LINE_ORDER) for (const r of LINES[lid].routes) {
        g.strokeStyle = LINES[lid].color; g.lineWidth = 10; g.beginPath();
        r.forEach(([id], i) => { const s = STATIONS[id]; i ? g.lineTo(s.x, s.y + 20) : g.moveTo(s.x, s.y + 20); }); g.stroke();
      }
      for (const id in STATIONS) {
        const s = STATIONS[id], tr = MRT.linesAt(id).length > 1;
        g.fillStyle = '#fff'; g.strokeStyle = '#1c2126'; g.lineWidth = tr ? 4 : 2.5;
        g.beginPath(); g.arc(s.x, s.y + 20, tr ? 8 : 5, 0, 7); g.fill(); g.stroke();
      }
      g.fillStyle = '#1c2126'; g.font = '900 40px "Noto Sans TC", sans-serif'; g.fillText('台北捷運路網圖', 30, 1000);
    });
  }

  // 大站的商店（只在大站出現，賣該站對應的東西）
  const SHOPS = {
    台北車站: { name: '捷運便利商店・地下街', sign: '便利商店', color: '#2a9d8f', items: ['onigiri', 'coffee', 'soymilk', 'bread', 'bubbletea', 'pineapplecake', 'keychain', 'postcard', 'easycard'] },
    西門: { name: '西門町服飾＆小吃', sign: '服飾', color: '#e07a3a', items: ['bubbletea', 'coffee', 'chicken', 'sausage', 'camera'] },
    南港: { name: '南港伴手禮', sign: '伴手禮', color: '#8a5a3a', items: ['pineapplecake', 'sunnycake', 'nougat', 'keychain', 'postcard', 'easycard'] },
    中山: { name: '中山花店＆選物', sign: '花店', color: '#d06a8a', items: ['flower', 'postcard'] },
    市政府: { name: '信義百貨', sign: '百貨', color: '#5a4030', items: ['coffee', 'onigiri', 'nougat'] },
    板橋: { name: '板橋便利商店', sign: '便利商店', color: '#2a9d8f', items: ['onigiri', 'coffee', 'soymilk', 'bubbletea', 'chicken'] },
    忠孝復興: { name: '東區選物＆麵包坊', sign: '選物', color: '#c08a3a', items: ['bread', 'onigiri', 'coffee', 'pineapplecake'] },
  };

  // 任務需要的特別場所：咖啡店（市政府）、街頭表演舞台（東門）；收藏品商人的攤車由 STATION_EXTRAS 決定在哪一站
  const PLACES = { 市政府: ['cafe'], 東門: ['stage'], 圓山: ['oldmap'], 國父紀念館: ['tiles'] };
  const placesOf = id => (PLACES[id] || []).concat(typeof STATION_EXTRAS === 'function' ? STATION_EXTRAS(id) : []);
  // 場所的位置（NPC 站的位置也用這個）
  function placeAt(L, kind) {
    const C = L.concourse, U = L.unpaid;
    if (kind === 'cafe') return { x: C.x1 - .65, y: 0, z: C.z0 + 14, buy: { x: C.x1 - 2.6, z: C.z0 + 14 } };
    if (kind === 'stage') return { x: C.x0 + 3, y: 0, z: C.z0 + 13.5 };
    if (kind === 'stall' || kind === 'breakfast' || kind === 'mistshop') return { x: C.x1 - 3.4, y: 0, z: C.z0 + 18.5 };
    if (kind === 'oldmap') return { x: C.x0 + .1, y: 0, z: C.z0 + 16 };
    if (kind === 'tiles') return { x: C.x1 - .1, y: 0, z: C.z0 + 16 };
    if (kind === 'stamp') return { x: U.x1 - .6, y: 0, z: U.z0 + 1.0 };
    if (kind === 'shop') return { x: U.x0 + 1.9, y: 0, z: U.z0 + 7 };
    return null;
  }

  // 有「霧」塗鴉的車站
  const GRAFFITI = ['龍山寺', '西門', '南港', '古亭', '中山', '頂埔', '淡水', '大直'];

  /* ── 方向與版面 ── */
  // 某站某線的兩側：+1 側為順向（站碼遞增方向），-1 側為逆向；終點站兩側都開往同一方向
  function sides(stationId, lineId) {
    const fwd = [], back = [];
    const seen = new Set();
    for (const route of LINES[lineId].routes) {
      const ids = route.map(r => r[0]); const i = ids.indexOf(stationId);
      if (i < 0) continue;
      for (const step of [1, -1]) {
        const stops = [];
        for (let j = i + step; j >= 0 && j < ids.length; j += step) stops.push(ids[j]);
        if (!stops.length) continue;
        const terminal = stops[stops.length - 1];
        if (seen.has(terminal)) continue; seen.add(terminal);
        (step > 0 ? fwd : back).push({ line: lineId, terminal, stops, travel: step });
      }
    }
    return { 1: fwd.length ? fwd : back, '-1': back.length ? back : fwd };
  }

  function layout(stationId) {
    const lines = MRT.linesAt(stationId);
    let ug = 0, el = 0;
    const platforms = lines.map((l, k) => {
      const under = MRT.undergroundOn(stationId, l.line);
      const y = under ? -6 - 5 * ug++ : 6 + 5 * el++;
      const x = [0, 10, -10][k] || 0;
      const z = k * 22;
      const run = Math.abs(y) * 1.65;
      const ramps = [-1, 1].map(b => ({ b, xa: x + b * RAMP_START, xb: x + b * (RAMP_START + run), ya: y, yb: 0, z }));
      return { k, line: l.line, code: l.code, y, x, z, under, run, ramps, sides: sides(stationId, l.line) };
    });
    const maxX = Math.max(...platforms.flatMap(p => p.ramps.map(r => Math.abs(r.xb)))) + 4;
    const cz1 = platforms[platforms.length - 1].z + 10;
    const concourse = { x0: -Math.max(maxX, 18), x1: Math.max(maxX, 18), z0: -10, z1: cz1, y: 0 };
    const gateZ = cz1;
    const unpaid = { x0: -16, x1: 16, z0: gateZ + 1.2, z1: gateZ + 14 };
    const gates = [-6, -3.6, -1.2, 1.2, 3.6, 6];
    const spots = [{ kind: 'notice', x: concourse.x0 + 8, y: 0, z: concourse.z0 + .9 }];
    spots.push({ kind: 'elevator', x: concourse.x0 + 4, y: 0, z: concourse.z0 + 1.2, level: 'hall' });
    for (const P of platforms) spots.push({ kind: 'elevator', x: P.x - 24, y: P.y, z: P.z + 1.4, level: P.k });
    spots.push({ kind: 'ticket', x: unpaid.x0 + 4.4, y: 0, z: unpaid.z1 - 1.6 });
    spots.push({ kind: 'toilet', x: unpaid.x1 - 1.4, y: 0, z: unpaid.z0 + 9 });
    if (SHOPS[stationId]) spots.push({ kind: 'shop', x: unpaid.x0 + 2, y: 0, z: unpaid.z0 + 7 });
    if (GRAFFITI.includes(stationId)) spots.push({ kind: 'graffiti', x: concourse.x1 - 4, y: 0, z: concourse.z0 + .9 });
    const L0 = { concourse, unpaid };
    for (const k of placesOf(stationId)) {
      const p = placeAt(L0, k);
      if (k === 'cafe') spots.push({ kind: 'cafe', x: p.buy.x, y: 0, z: p.buy.z });
      if (k === 'stage') spots.push({ kind: 'stage', x: p.x + 1.6, y: 0, z: p.z });
      if (k === 'breakfast') spots.push({ kind: 'breakfast', x: p.x, y: 0, z: p.z + 1.3 });
      if (k === 'oldmap') spots.push({ kind: 'oldmap', x: p.x + 1.2, y: 0, z: p.z });
      if (k === 'tiles') spots.push({ kind: 'tiles', x: p.x - 1.2, y: 0, z: p.z });
    }
    { const p = placeAt(L0, 'stamp'); spots.push({ kind: 'stamp', x: p.x - .9, y: 0, z: p.z }); }   // 每站服務台旁的紀念章
    for (const P of platforms) for (const s of [-1, 1]) spots.push({ kind: 'map', x: P.x, y: P.y, z: P.z + s * .9, line: P.line });
    // 其他車站設施（可以查看）
    const C = concourse, U = unpaid, big = !!SHOPS[stationId];
    spots.push({ kind: 'fountain', x: C.x1 - 8, y: 0, z: C.z0 + .9 });
    spots.push({ kind: 'aed', x: C.x1 - 10.5, y: 0, z: C.z0 + .9 });
    spots.push({ kind: 'art', x: C.x0 + 14, y: 0, z: C.z0 + 1.1 });
    spots.push({ kind: 'nursing', x: C.x1 - 1, y: 0, z: C.z0 + 5 });
    spots.push({ kind: 'office', x: C.x0 + 1, y: 0, z: C.z0 + 5 });
    spots.push({ kind: 'vending', x: U.x1 - 1.2, y: 0, z: U.z0 + 6.2 });
    spots.push({ kind: 'areamap', x: -7.5, y: 0, z: U.z1 - 2.7 });
    spots.push({ kind: 'timetable', x: 9.5, y: 0, z: gateZ + 2.4 });
    spots.push({ kind: 'phone', x: U.x0 + 1.1, y: 0, z: U.z0 + 2.2 });
    if (big) { spots.push({ kind: 'locker', x: U.x0 + 1.3, y: 0, z: U.z0 + 10.1 }); spots.push({ kind: 'atm', x: U.x1 - 1.3, y: 0, z: U.z0 + 4.7 }); }
    for (const P of platforms) {
      spots.push({ kind: 'fountain', x: P.x + 26.4, y: P.y, z: P.z + .9 });
      spots.push({ kind: 'women', x: P.x - 12, y: P.y, z: P.z + 2.2, line: P.line });
    }
    return { stationId, platforms, concourse, gateZ, unpaid, gates, spots, hasElevated: platforms.some(p => !p.under), allUnder: platforms.every(p => p.under) };
  }

  /* ── 建造車站 ── */
  // 擋路的設施（世界座標，玩家不能穿過）
  let curL = null;
  const solid = (cx, cz, w, d, y = 0) => { if (curL) curL.obstacles.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, y }); };
  function build(L, skyName) {
    textures();
    clocks.length = 0;
    curL = L; L.obstacles = [];
    const g = new T.Group();
    const night = skyName === 'night';
    const frame = M('#4a5259', { r: .5, m: .4 });
    const steel = M('#c8cdd2', { r: .25, m: .9 });
    const glass = M('#cfe3ec', { t: true, o: .16, r: .05, m: .1, dw: false });
    const lightM = M('#ffffff', { e: '#fff6e0', ei: 1.4 });
    const red = M('#c8202a', { r: .5 });
    const psd = {};

    /* 月台 */
    for (const P of L.platforms) {
      const pg = new T.Group(); pg.position.set(P.x, P.y, P.z); g.add(pg);
      const Lc = LINES[P.line].color;
      const fullPSD = P.under || P.line === 'BR';
      // 地板（扣掉電扶梯口）
      const holes = P.ramps.map(r => { const a = Math.min(r.xa, r.xb) - P.x, b = Math.max(r.xa, r.xb) - P.x; return r.b > 0 ? { x0: a + .25, x1: b, z0: -1.85, z1: 1.85 } : { x0: a, x1: b - .25, z0: -1.85, z1: 1.85 }; });
      slab(rectsMinus({ x0: -LEN / 2, x1: LEN / 2, z0: -3.05, z1: 3.05 }, holes), 0, M('#ffffff', { map: TEX.floor, r: .45 }), pg, .4);
      // 軌道、月台邊
      for (const s of [-1, 1]) {
        const bed = plane(LEN + 400, 3.4, M('#ffffff', { map: tiled(TEX.gravel, 40, 1) }), pg); bed.rotation.x = -Math.PI / 2; bed.position.set(0, -1.15, s * TRACK);
        for (const rz of [-.72, .72]) box(LEN + 400, .14, .08, M('#8d9196', { m: .8, r: .35 }), 0, -1.05, s * TRACK + rz, pg);
        box(LEN, 1.2, .2, M('#8a8883', { map: TEX.concrete }), 0, -.6, s * 3.05, pg);
        const tac = plane(LEN, .3, M('#ffffff', { map: tiled(TEX.tactile, LEN / 1.2, 1) }), pg); tac.rotation.x = -Math.PI / 2; tac.position.set(0, .004, s * 2.7);
        for (const d of DOORS) for (const sx of [-1, 1]) {
          const mk = plane(.32, .8, M('#2f9e5a'), pg); mk.rotation.x = -Math.PI / 2; mk.rotation.z = sx * .35; mk.position.set(d + sx * 1.05, .005, s * 2.15);
        }
        // 博愛候車區
        const prio = plane(1.2, .7, M('#2a5fb0', { o: .9, t: true }), pg); prio.rotation.x = -Math.PI / 2; prio.position.set(DOORS[0], .006, s * 2.2);
        // 月台門
        const psdH = fullPSD ? 2.3 : 1.45;
        psd[`${P.k}:${s}`] = [];
        for (const d of DOORS) {
          for (const sx of [-1, 1]) {
            const leaf = new T.Group();
            box(.7, psdH, .04, glass, sx * .35, psdH / 2, 0, leaf);
            box(.05, psdH, .07, frame, sx * .68, psdH / 2, 0, leaf);
            leaf.position.set(d, 0, s * PSD); leaf.userData = { sx, base: d, dynamic: true };
            pg.add(leaf); psd[`${P.k}:${s}`].push(leaf);
          }
          box(.12, psdH, .14, frame, d - .76, psdH / 2, s * PSD, pg); box(.12, psdH, .14, frame, d + .76, psdH / 2, s * PSD, pg);
        }
        const edges = [-LEN / 2, ...DOORS.flatMap(d => [d - .82, d + .82]), LEN / 2];
        for (let i = 0; i < edges.length; i += 2) box(edges[i + 1] - edges[i], psdH, .04, glass, (edges[i] + edges[i + 1]) / 2, psdH / 2, s * PSD, pg);
        if (fullPSD) {
          box(LEN, .38, .3, M('#30363c'), 0, psdH + .19, s * PSD, pg);
          box(LEN, .06, .31, M(Lc, { e: Lc, ei: .25 }), 0, psdH + .03, s * PSD, pg);
        } else box(LEN, .06, .14, M(Lc), 0, psdH + .03, s * PSD, pg);
        // 方向指標（掛在月台兩側上方）
        const dirs = P.sides[s];
        const terms = dirs.map(d => MRT.label(d.terminal, P.line));
        const dtex = guideTex([P.line], '往 ' + terms.map(t => t.zh).join('／'), 'To ' + terms.map(t => t.en).join(' / '), null);
        for (const x of [-22, 22]) sign(dtex, 2.4, .6, x, 2.95, s * 2.1, pg);
        // 下一班列車 LED 看板（內容由遊戲更新）
        const led = document.createElement('canvas'); led.width = 512; led.height = 128;
        const ledTex = new T.CanvasTexture(led); ledTex.colorSpace = T.SRGBColorSpace;
        for (const x of [-4, 4]) sign(ledTex, 1.9, .48, x, 2.55, s * 2.1, pg);
        pg.userData[`led${s}`] = { canvas: led, tex: ledTex };
        // 軌道外側
        if (P.under) {
          const wall = plane(LEN + 300, 5, M('#ffffff', { map: tiled(TEX.wall, (LEN + 300) / 1.2, 5 / 1.2), r: .5 }), pg);
          wall.position.set(0, 1.0, s * 6.9); wall.rotation.y = s > 0 ? Math.PI : 0;
          const st = M('#ffffff', { map: stationSignTex(L.stationId, P.line) });
          for (let x = -30; x <= 30; x += 12) { const p = plane(2.6, .65, st, pg); p.position.set(x, 2.9, s * 6.86); p.rotation.y = s > 0 ? Math.PI : 0; }
        } else {
          box(LEN + 300, .8, 2.6, M('#77736d', { map: TEX.concrete }), 0, -1.6, s * TRACK, pg);
          box(LEN, 1.1, .05, M('#cfe3ec', { t: true, o: .3 }), 0, .55 - 1.15 + 1.15, s * 6.9, pg);
        }
      }
      // 端牆、天花板
      if (P.under) {
        for (const ex of [-1, 1]) box(.3, 3.4, 6.2, M('#ffffff', { map: tiled(TEX.wall, 5, 3) }), ex * (LEN / 2 + .15), 1.7, 0, pg);
        const ceilHoles = P.ramps.map(r => { const a = Math.min(r.xa, r.xb) - P.x, b = Math.max(r.xa, r.xb) - P.x; return { x0: a - .2, x1: b + .2, z0: -1.9, z1: 1.9 }; });
        slab(rectsMinus({ x0: -LEN / 2 - 150, x1: LEN / 2 + 150, z0: -7, z1: 7 }, ceilHoles), 3.4, M('#d9d9d4', { r: .9 }), pg, .2, false);
        for (const z of [-4.6, -2, 2, 4.6]) for (let x = -LEN / 2 + 2; x < LEN / 2; x += 3) if (!(Math.abs(z) < 2.1 && P.ramps.some(r => (x + P.x - r.xa) * (x + P.x - r.xb) < 0))) box(2.2, .04, .14, lightM, x, 3.37, z, pg);
      } else {
        box(LEN + 4, .18, 14.5, M(night ? '#2a2f35' : '#5b6168'), 0, 3.9, 0, pg);
        for (let x = -LEN / 2 + 2; x < LEN / 2; x += 3) box(2.2, .04, .14, M('#ffffff', { e: '#fff6e0', ei: night ? 1.4 : .6 }), x, 3.8, 0, pg);
        for (let x = -30; x <= 30; x += 15) for (const s of [-1, 1]) box(.3, 3.9, .3, M('#6c737a', { m: .4 }), x, 1.95, s * 7.2, pg);
        for (let x = -150; x <= 150; x += 30) box(2.6, Math.max(2, P.y - 1), 2.6, M('#77736d'), x, -(P.y - 1) / 2 - 1.2, 0, pg);
      }
      // 柱子（中央）＋滅火器、緊急對講機、路網圖
      for (const x of [-28, 0, 28]) {
        solid(P.x + x, P.z, .7, .7, P.y);
        box(.7, 3.4, .7, M('#ffffff', { map: tiled(TEX.wall, .6, 3) }), x, 1.7, 0, pg);
        box(.22, .36, .14, red, x + .36, .9, 0, pg);                               // 滅火器箱
        box(.2, .28, .1, M('#f2c200'), x - .36, 1.3, 0, pg);                        // 緊急對講機
      }
      const map = M('#ffffff', { map: routeMapTex() });
      for (const s of [-1, 1]) { const p = plane(.66, .66, map, pg); p.position.set(0, 1.6, s * .36); p.rotation.y = s > 0 ? 0 : Math.PI; }
      // 月台電梯
      box(1.6, 2.6, 1.4, M('#9aa3aa', { m: .6, r: .3 }), -24, 1.3, 0, pg); solid(P.x - 24, P.z, 1.6, 1.4, P.y);
      for (const sz of [-1, 1]) box(1.2, 2.2, .04, M('#c9cfd4', { m: .8, r: .2 }), -24, 1.1, sz * .72, pg);
      sign(plainSign('電梯', 'Elevator', '#23272b', '#fff', { bg: '#2a7de1', fg: '#fff', text: '⇅' }), 1.4, .35, -24, 2.85, .75, pg);
      // 座椅
      for (const x of [-31, 31, -21, 23.5]) { box(1.8, .08, .45, M('#8a9097', { m: .5 }), x, .45, 0, pg); box(1.8, .4, .06, M('#8a9097', { m: .5 }), x, .68, -.2, pg); for (const lx of [-.8, .8]) box(.06, .45, .4, M('#5d6368', { m: .5 }), x + lx, .225, 0, pg); solid(P.x + x, P.z, 1.8, .5, P.y); }
      // 站名吊牌
      const stn = stationSignTex(L.stationId, P.line);
      for (const x of [-15, 15]) sign(stn, 2.4, .6, x, 2.95, 0, pg);
      // 電扶梯與樓梯
      for (const r of P.ramps) buildRamp(pg, P, r, L);
    }

    /* 大廳 */
    const C = L.concourse;
    const hallHoles = L.platforms.flatMap(P => P.ramps.map(r => {
      const a = Math.min(r.xa, r.xb), b = Math.max(r.xa, r.xb);
      return r.b > 0 ? { x0: a, x1: b - .25, z0: r.z - 1.85, z1: r.z + 1.85 } : { x0: a + .25, x1: b, z0: r.z - 1.85, z1: r.z + 1.85 };
    }));
    slab(rectsMinus({ x0: C.x0, x1: C.x1, z0: C.z0, z1: L.unpaid.z1 }, hallHoles.concat([{ x0: C.x0 - 1, x1: L.unpaid.x0, z0: L.gateZ + .01, z1: L.unpaid.z1 + 1 }, { x0: L.unpaid.x1, x1: C.x1 + 1, z0: L.gateZ + .01, z1: L.unpaid.z1 + 1 }])), 0, M('#ffffff', { map: TEX.hall, r: .5 }), g, .4);
    // 大廳牆與天花板
    const wallM = M('#ffffff', { map: tiled(TEX.wall, 20, 3), r: .6 });
    const hallH = 4.2;
    box(C.x1 - C.x0, hallH, .3, wallM, (C.x0 + C.x1) / 2, hallH / 2, C.z0 - .15, g);
    for (const x of [C.x0, C.x1]) box(.3, hallH, L.gateZ - C.z0, wallM, x + (x > 0 ? .15 : -.15), hallH / 2, (C.z0 + L.gateZ) / 2, g);
    for (const x of [L.unpaid.x0, L.unpaid.x1]) box(.3, hallH, L.unpaid.z1 - L.gateZ, wallM, x + (x > 0 ? .15 : -.15), hallH / 2, (L.gateZ + L.unpaid.z1) / 2, g);
    for (const [a, b] of [[C.x0, L.unpaid.x0], [L.unpaid.x1, C.x1]]) box(b - a, hallH, .3, wallM, (a + b) / 2, hallH / 2, L.gateZ, g);
    const ceilHoles = L.platforms.filter(P => !P.under).flatMap(P => P.ramps.map(r => ({ x0: Math.min(r.xa, r.xb) - .2, x1: Math.max(r.xa, r.xb) + .2, z0: r.z - 1.9, z1: r.z + 1.9 })));
    slab(rectsMinus({ x0: C.x0, x1: C.x1, z0: C.z0, z1: L.unpaid.z1 }, ceilHoles), hallH, M('#e3e3df', { r: .9 }), g, .2, false);
    for (let x = C.x0 + 3; x < C.x1 - 2; x += 6) for (let z = C.z0 + 3; z < L.unpaid.z1 - 1; z += 5) {
      if (ceilHoles.some(h => x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1)) continue;
      box(1.6, .04, .4, lightM, x, hallH - .03, z, g);
    }
    // 大廳站名牆
    const stnBig = M('#ffffff', { map: stationSignTex(L.stationId, L.platforms[0].line) });
    const big = plane(8, 2, stnBig, g); big.position.set(0, 2.4, C.z0 + .02);
    // 電扶梯口的指標：往哪條線、哪個方向
    for (const P of L.platforms) {
      const terms = [...new Set([...P.sides[1], ...P.sides[-1]].map(d => MRT.label(d.terminal, P.line).zh))];
      const tx = guideTex([P.line], `${LINES[P.line].zh}月台 往 ${terms.join('／')}`, `${LINES[P.line].en} · Platform`, P.under ? 'down' : 'up');
      for (const r of P.ramps) sign(tx, 3.2, .8, r.xb + r.b * 1.6, 3.1, r.z, g, Math.PI / 2);
    }
    // 大廳中央：各線月台方向總指標
    L.platforms.forEach((P, i) => {
      const toward = P.z > (C.z0 + L.gateZ) / 2 ? 'right' : 'left';
      const t = guideTex([P.line], `${LINES[P.line].zh} 月台`, `${LINES[P.line].en}`, toward);
      sign(t, 3, .75, 0, 3.4 - i * .85, (C.z0 + L.gateZ) / 2 + 2, g);
    });
    // 電梯（付費區）
    box(1.8, 2.6, .4, M('#9aa3aa', { m: .6, r: .3 }), C.x0 + 4, 1.3, C.z0 + .3, g);
    box(1.4, 2.2, .05, M('#c9cfd4', { m: .8, r: .2 }), C.x0 + 4, 1.1, C.z0 + .52, g);
    sign(plainSign('電梯', 'Elevator', '#23272b', '#fff', { bg: '#2a7de1', fg: '#fff', text: '⇅' }), 1.6, .4, C.x0 + 4, 3, C.z0 + .7, g);
    // 閘門
    const gateM = M('#b9c0c6', { m: .6, r: .35 });
    for (let i = 0; i <= L.gates.length; i++) {
      const x = i === 0 ? L.gates[0] - 1.2 : i === L.gates.length ? L.gates[i - 1] + 1.2 : (L.gates[i - 1] + L.gates[i]) / 2;
      box(.45, 1.0, 1.3, gateM, x, .5, L.gateZ + .6, g);
      box(.47, .05, .5, M('#2a7de1', { e: '#2a7de1', ei: .6 }), x, 1.03, L.gateZ + .3, g);   // 感應區
    }
    for (const gx of L.gates) for (const sx of [-1, 1]) box(.3, .45, .03, M('#e04848', { t: true, o: .55 }), gx + sx * .15, .75, L.gateZ + .6, g);
    sign(plainSign('閘門　請刷卡進出', 'Fare gates', '#23272b', '#fff'), 3.2, .8, 0, 3.3, L.gateZ - .2, g);
    // 非付費區：售票機、加值機、詢問處、出口、廁所
    const U = L.unpaid;
    for (let i = 0; i < 4; i++) {
      const x = U.x0 + 2 + i * 1.6;
      box(1.2, 1.8, .7, M('#e6e8ea', { m: .3 }), x, .9, U.z1 - .6, g); solid(x, U.z1 - .6, 1.2, .7);
      box(.8, .5, .02, M('#1d6fb8', { e: '#1d6fb8', ei: .5 }), x, 1.35, U.z1 - .96, g);
    }
    sign(plainSign('售票機・加值機', 'Ticket & Add-value', '#23272b', '#fff'), 3, .75, U.x0 + 4.5, 3.1, U.z1 - 1.2, g);
    box(4, 1.1, 1.6, M('#d8d4cc'), U.x1 - 3.5, .55, U.z0 + 3, g); solid(U.x1 - 3.5, U.z0 + 3, 4, 1.6);
    box(4, .1, 1.7, M('#f0ede6'), U.x1 - 3.5, 1.12, U.z0 + 3, g);
    sign(plainSign('詢問處', 'Information', '#23272b', '#fff', { bg: '#f2c200', fg: '#23272b', text: '?' }), 2.6, .65, U.x1 - 3.5, 2.9, U.z0 + 3, g);
    sign(plainSign('廁所', 'Restrooms', '#23272b', '#fff', { bg: '#7fb2cf', fg: '#23272b', text: '♿' }), 2, .5, U.x1 - 3.5, 3.2, U.z1 - 1, g);
    const exits = [['出口 1', 'Exit 1', U.x0 + 1.5], ['出口 2', 'Exit 2', 0], ['出口 3', 'Exit 3', U.x1 - 1.5]];
    for (const [zh, en, x] of exits) {
      box(2.4, 2.6, .2, M('#1e2a22'), x, 1.3, U.z1 + .05, g);
      sign(plainSign(zh, en, '#f2c200', '#1c2126'), 2.2, .55, x, 3.1, U.z1 - .2, g);
    }
    sign(plainSign('付費區 → 月台', 'To platforms', '#23272b', '#fff'), 3, .75, 0, 3.3, L.gateZ + 1.6, g, Math.PI);
    // 告示牌
    const nb = L.spots.find(sp => sp.kind === 'notice');
    box(2.2, 1.4, .08, M('#3a4148'), nb.x, 1.5, C.z0 + .05, g);
    const noticeTex = canvasTex(512, 320, (x) => {
      x.fillStyle = '#f6f3ea'; x.fillRect(0, 0, 512, 320);
      x.fillStyle = '#1f3a6b'; x.fillRect(0, 0, 512, 52);
      x.fillStyle = '#fff'; x.font = '700 32px "Noto Sans TC", sans-serif'; x.fillText('車站公告 Notice', 18, 38);
      x.fillStyle = '#3a3a3a'; for (let i = 0; i < 6; i++) x.fillRect(24, 80 + i * 36, 300 + (i * 53) % 160, 12);
      x.fillStyle = '#c4162a'; x.fillRect(380, 90, 100, 130);
    });
    const np = plane(2, 1.25, M('#ffffff', { map: noticeTex }), g); np.position.set(nb.x, 1.5, C.z0 + .1);
    // 塗鴉
    const gf = L.spots.find(sp => sp.kind === 'graffiti');
    if (gf) {
      const gt = canvasTex(512, 512, (x) => {
        x.clearRect(0, 0, 512, 512);
        x.strokeStyle = 'rgba(40,40,60,.85)'; x.lineWidth = 10; x.lineCap = 'round';
        x.beginPath(); x.ellipse(256, 200, 120, 40, -.15, 0, 7); x.stroke();                    // 貝雷帽
        x.fillStyle = 'rgba(196,22,42,.85)'; x.beginPath(); x.ellipse(256, 190, 110, 32, -.15, 0, 7); x.fill();
        x.strokeStyle = 'rgba(60,60,80,.8)'; x.lineWidth = 6;
        for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(170 + i * 20, 240); x.quadraticCurveTo(160 + i * 22, 330, 180 + i * 18, 420); x.stroke(); }
        x.fillStyle = 'rgba(40,40,60,.9)'; x.font = '900 72px "Noto Serif TC", serif'; x.fillText('霧', 380, 470);
      });
      const gp = plane(2.2, 2.2, new T.MeshBasicMaterial({ map: gt, transparent: true }), g); gp.position.set(gf.x, 1.8, C.z0 + .02);
    }
    // 商店（大站才有）
    const shop = SHOPS[L.stationId];
    if (shop) {
      box(1.2, 3, 5, M('#e8e4dc'), U.x0 + .6, 1.5, U.z0 + 7, g); solid(U.x0 + .6, U.z0 + 7, 1.2, 5);
      box(.05, 2.2, 4.2, M('#cfe3ec', { t: true, o: .35 }), U.x0 + 1.22, 1.3, U.z0 + 7, g);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) box(.3, .3, .3, M(['#c4162a', '#2a9d8f', '#f2c200'][(i + j) % 3]), U.x0 + .7, .7 + i * .6, U.z0 + 5.6 + j * 1.2, g);
      sign(plainSign(shop.sign, shop.name, shop.color, '#fff'), 3, .75, U.x0 + 1.3, 3.3, U.z0 + 7, g, Math.PI / 2);
    }
    // 廁所：男廁、女廁、無障礙廁所三個入口
    box(.18, 3, 3.2, M('#e8e4dc'), U.x1 - .12, 1.5, U.z0 + 9.2, g);
    for (const [dz, col, icon, zh] of [[-1, '#2a5fb0', '🚹', '男'], [0, '#c4162a', '🚺', '女'], [1, '#2a7de1', '♿', '無障礙']]) {
      const d = plane(.8, 2.1, M(col === '#c4162a' ? '#d87a84' : '#7a9ac8'), g); d.position.set(U.x1 - .22, 1.05, U.z0 + 9.2 + dz); d.rotation.y = -Math.PI / 2;
      sign(plainSign(zh, '', col, '#fff', { bg: '#fff', fg: col, text: icon }), .75, .3, U.x1 - .25, 2.3, U.z0 + 9.2 + dz, g, -Math.PI / 2);
    }
    sign(plainSign('廁所', 'Restrooms', '#23272b', '#fff', { bg: '#7fb2cf', fg: '#23272b', text: 'WC' }), 2.4, .55, U.x1 - .3, 3.05, U.z0 + 9.2, g, -Math.PI / 2);
    sign(plainSign('廁所 →', 'Restrooms', '#23272b', '#fff', { bg: '#7fb2cf', fg: '#23272b', text: 'WC' }), 1.8, .42, U.x1 - 6, 3.4, U.z0 + 9, g, Math.PI / 2);
    // 失物招領（詢問處旁）
    box(3, 1.1, 1.6, M('#d8d4cc'), U.x1 - 8.2, .55, U.z0 + 3, g); solid(U.x1 - 8.2, U.z0 + 3, 3, 1.6);
    box(3, .1, 1.7, M('#f0ede6'), U.x1 - 8.2, 1.12, U.z0 + 3, g);
    for (let i = 0; i < 4; i++) box(.4, .3, .3, M(['#c4162a', '#2a7de1', '#f2c200', '#3a3a3a'][i]), U.x1 - 9.2 + i * .65, 1.32, U.z0 + 3.3, g);
    sign(plainSign('失物招領', 'Lost & Found', '#23272b', '#fff', { bg: '#e08a2a', fg: '#fff', text: '?' }), 2.6, .65, U.x1 - 8.2, 2.9, U.z0 + 3, g);
    const mapBig = plane(2.4, 2.4, M('#ffffff', { map: routeMapTex() }), g); mapBig.position.set(U.x0 + .02 + 0, 1.7, U.z0 + 6); mapBig.rotation.y = Math.PI / 2; mapBig.position.x = U.x0 + .02;

    furnish(L, g, night);
    decorate(L, g);
    for (const k of placesOf(L.stationId)) buildPlace(L, g, k);
    buildPlace(L, g, 'stamp');
    g.userData = { psd, layout: L };
    mergeStatic(g);
    return g;
  }


  /* ── 讓車站不要太空：柱子、長椅、盆栽、列車資訊螢幕、地面導引色帶、天花板管線、愛心傘架、
   *    月台的通風管、電纜槽、號誌燈、月台端的工作門 ── */
  function decorate(L, g) {
    const C = L.concourse, U = L.unpaid, hallH = 4.2;
    const dark = M('#30363c', { r: .5 }), steel = M('#b9c0c6', { m: .6, r: .35 }), colM = M('#f0eee8', { r: .6 });
    const nearRamp = (x, z, m) => L.platforms.some(P => P.ramps.some(r => Math.abs(z - r.z) < 1.85 + m && x > Math.min(r.xa, r.xb) - m && x < Math.max(r.xa, r.xb) + m));
    const free = (x, z, m = .6) => !nearRamp(x, z, m) && !L.spots.some(s => s.y === 0 && Math.hypot(s.x - x, s.z - z) < 1.6);
    // 大廳柱子＋旁邊的長椅
    for (const x of [-5.5, 5.5]) for (let z = C.z0 + 5; z < L.gateZ - 3; z += 8) {
      if (!free(x, z, 1)) continue;
      box(.8, hallH, .8, colM, x, hallH / 2, z, g); solid(x, z, .8, .8);
      box(.82, .12, .82, M('#c8cdd2', { m: .5 }), x, .06, z, g);
      const bx = x + Math.sign(x) * 1.0;
      if (free(bx, z, .4)) { box(.45, .08, 1.6, M('#8a9097', { m: .5 }), bx, .45, z, g); box(.06, .4, 1.6, M('#8a9097', { m: .5 }), bx + Math.sign(x) * .2, .68, z, g); solid(bx, z, .5, 1.6); }
    }
    // 盆栽
    const planter = (x, z) => { if (!free(x, z, .4)) return; box(.7, .55, .7, M('#6a6e72', { r: .7 }), x, .275, z, g); solid(x, z, .7, .7); for (let i = 0; i < 5; i++) { const s = new T.Mesh(new T.SphereGeometry(.32 - i * .03, 10, 8), M(['#3d7a4a', '#4a8a52', '#2f6a3c'][i % 3], { r: .9 })); s.position.set(x + Math.sin(i * 2.3) * .14, .75 + i * .14, z + Math.cos(i * 2.3) * .14); g.add(s); } };
    for (const x of [-9.2, 9.2]) planter(x, L.gateZ - 1.2);
    planter(U.x0 + 3.2, U.z0 + 1); planter(U.x1 - 12.5, U.z1 - .8);
    // 列車資訊螢幕（閘門內側，吊在天花板）
    const info = canvasTex(512, 256, x => {
      x.fillStyle = '#0d1b2a'; x.fillRect(0, 0, 512, 256); x.fillStyle = '#f2c200'; x.font = 'bold 26px "Noto Sans TC", sans-serif'; x.fillText('列車資訊 Train Info', 18, 38);
      L.platforms.slice(0, 3).forEach((P, i) => { const y = 92 + i * 56; x.fillStyle = LINES[P.line].color; x.fillRect(18, y - 30, 70, 40); x.fillStyle = '#fff'; x.font = 'bold 24px sans-serif'; x.fillText(P.line, 30, y - 2); x.font = '24px "Noto Sans TC", sans-serif'; x.fillText(`${LINES[P.line].zh}　約每 3 分鐘一班`, 104, y - 2); });
    });
    for (const x of [-3, 3]) { box(.04, .5, .04, dark, x, hallH - .25, L.gateZ - 2.2, g); box(1.5, .8, .08, dark, x, hallH - .9, L.gateZ - 2.2, g); for (const s of [-1, 1]) { const p = plane(1.4, .7, M('#ffffff', { map: info, e: '#ffffff', ei: .5 }), g); p.position.set(x, hallH - .9, L.gateZ - 2.2 + s * .05); p.rotation.y = s > 0 ? 0 : Math.PI; } }
    // 地面導引色帶：從閘門到各線的電扶梯口
    L.platforms.forEach((P, i) => {
      const r = P.ramps.find(r => r.b > 0) || P.ramps[0], col = M(LINES[P.line].color, { r: .6 });
      const off = (i - (L.platforms.length - 1) / 2) * .4, zEnd = P.z + 2.3 + i * .35;
      const a = plane(.22, L.gateZ - 1 - zEnd, col, g); a.rotation.x = -Math.PI / 2; a.position.set(off, .012, (L.gateZ - 1 + zEnd) / 2);
      const bx = r.xb - r.b * .2, b = plane(Math.abs(bx - off), .22, col, g); b.rotation.x = -Math.PI / 2; b.position.set((bx + off) / 2, .012, zEnd);
    });
    // 天花板：線槽、通風口
    box(C.x1 - C.x0 - 1, .12, .4, M('#9aa0a6', { m: .5 }), (C.x0 + C.x1) / 2, hallH - .25, C.z0 + 1.6, g);
    for (let x = C.x0 + 4; x < C.x1 - 3; x += 7) for (let z = C.z0 + 6; z < L.gateZ - 1; z += 9) box(.9, .03, .9, M('#5d6368'), x, hallH - .02, z, g);
    // 愛心傘架
    box(1.2, .9, .35, steel, -11, .45, U.z1 - .45, g); solid(-11, U.z1 - .45, 1.2, .4);
    for (let i = 0; i < 6; i++) { const u = new T.Mesh(new T.CylinderGeometry(.05, .04, .9, 8), M(['#c4162a', '#2a5fb0', '#f2c200', '#3d7a4a', '#e07a3a', '#6a3a8a'][i])); u.position.set(-11.45 + i * .18, 1.0, U.z1 - .45); g.add(u); }
    sign(plainSign('愛心傘', 'Umbrella sharing', '#2a9d8f', '#fff'), 1.2, .3, -11, 1.75, U.z1 - .3, g, Math.PI);
    // ── 月台 ──
    for (const P of L.platforms) {
      const pg = new T.Group(); pg.position.set(P.x, P.y, P.z); g.add(pg);
      if (P.under) {
        // 天花板通風管、軌道外牆的電纜槽
        for (const z of [-3.6, 3.6]) { const d = new T.Mesh(new T.CylinderGeometry(.22, .22, LEN, 12), M('#b9c0c6', { m: .6, r: .4 })); d.rotation.z = Math.PI / 2; d.position.set(0, 3.12, z); pg.add(d); }
        for (const s of [-1, 1]) for (const y of [-.3, .1]) box(LEN + 300, .08, .14, M('#3a3e44', { r: .6 }), 0, y, s * 6.78, pg);
        // 月台端的工作門
        for (const ex of [-1, 1]) {
          const d = plane(1.1, 2.1, M('#7a8590'), pg); d.position.set(ex * (LEN / 2 - .02), 1.05, 1.4); d.rotation.y = ex > 0 ? -Math.PI / 2 : Math.PI / 2;
          sign(plainSign('非工作人員禁止進入', 'Staff only', '#c4162a', '#fff'), 1.6, .38, ex * (LEN / 2 - .05), 2.45, 1.4, pg, ex > 0 ? -Math.PI / 2 : Math.PI / 2);
        }
      }
      // 隧道口／軌道旁的號誌燈
      for (const s of [-1, 1]) for (const ex of [-1, 1]) {
        const x = ex * (LEN / 2 + 4), z = s * (TRACK + 1.35);
        box(.12, 1.4, .12, dark, x, -.4, z, pg); box(.3, .6, .22, M('#1c2126'), x, .5, z, pg);
        const lit = new T.Mesh(new T.SphereGeometry(.08, 10, 8), new T.MeshBasicMaterial({ color: ex * s > 0 ? '#3ad06a' : '#e84040' })); lit.position.set(x, .62, z - s * .12); pg.add(lit);
      }
      // 軌道旁的設備箱
      for (const s of [-1, 1]) for (const x of [-LEN / 2 - 10, LEN / 2 + 12]) box(.8, .6, .5, M('#8a9097', { m: .4 }), x, -.85, s * (TRACK + 1.6), pg);
    }
  }

  /* ── 特別場所 ── */
  function buildPlace(L, g, kind) {
    const p = placeAt(L, kind), wood = M('#8a5a3a', { r: .7 }), dark = M('#30363c', { r: .5 }), cream = M('#efe6d6', { r: .8 });
    if (kind === 'cafe') {
      const x1 = L.concourse.x1;
      box(1.2, 1.05, 4.2, wood, x1 - 1.6, .525, p.z, g); solid(x1 - 1.6, p.z, 1.2, 4.2);   // 吧台
      box(1.3, .06, 4.3, M('#2a2a2a', { r: .3 }), x1 - 1.6, 1.08, p.z, g);
      box(.45, .5, .4, M('#c8cdd2', { m: .8, r: .25 }), x1 - 1.6, 1.36, p.z - 1.2, g);   // 咖啡機
      box(.12, .18, .12, dark, x1 - 1.6, 1.2, p.z - .7, g);
      for (let i = 0; i < 4; i++) box(.1, .12, .1, M(['#f4f4f2', '#c4162a', '#2a9d8f', '#f4f4f2'][i]), x1 - 1.55, 1.17, p.z + .3 + i * .3, g);
      box(.15, 2.2, 4.6, cream, x1 - .08, 1.4, p.z, g);                        // 背牆
      for (const dz of [-1.4, 0, 1.4]) box(.3, .04, .9, wood, x1 - .2, 1.6 + Math.abs(dz) * .1, p.z + dz, g);   // 層架
      sign(plainSign('Leo 咖啡', 'Café', '#5a4030', '#fff'), 2.6, .6, x1 - 1.6, 2.9, p.z, g, -Math.PI / 2);
      for (const [dx, dz] of [[-4.2, -1.2], [-4.2, 1.4]]) {                       // 小圓桌、椅子
        const t = new T.Mesh(new T.CylinderGeometry(.38, .38, .04, 18), wood); t.position.set(x1 + dx, .74, p.z + dz); g.add(t);
        box(.06, .72, .06, dark, x1 + dx, .36, p.z + dz, g);
        for (const s of [-1, 1]) { box(.34, .04, .34, dark, x1 + dx + s * .62, .45, p.z + dz, g); box(.04, .45, .04, dark, x1 + dx + s * .62, .22, p.z + dz, g); }
      }
    }
    if (kind === 'stage') {
      box(2.6, .16, 2.2, M('#3a3a42', { r: .8 }), p.x, .08, p.z, g); solid(p.x - .3, p.z, 1.9, 2.2);   // 舞台
      box(.04, 1.4, .04, dark, p.x + .7, .86, p.z, g); box(.1, .14, .1, dark, p.x + .7, 1.6, p.z, g);   // 麥克風架
      box(.5, .6, .35, M('#1d1d20', { r: .6 }), p.x - .8, .46, p.z - .6, g);    // 音箱
      box(1.0, .12, .36, M('#1d1d20', { r: .6 }), p.x + .2, .22, p.z + .8, g);  // 吉他盒
      box(.9, .02, .3, M('#c4162a', { r: .9 }), p.x + .2, .29, p.z + .8, g);
      sign(plainSign('街頭藝人表演區', 'Street performance', '#e07a3a', '#fff'), 2.2, .5, p.x, 2.6, p.z - 1.2, g);
    }
    if (kind === 'stamp') {   // 紀念章桌
      box(.6, .9, .5, wood, p.x, .45, p.z, g); solid(p.x, p.z, .6, .5);
      box(.18, .12, .18, M('#c4162a', { r: .5 }), p.x - .1, .96, p.z, g); box(.16, .02, .12, M('#1c2126'), p.x + .14, .91, p.z, g);
      sign(plainSign('紀念章', 'Station stamp', '#c4162a', '#fff'), 1.1, .28, p.x, 1.55, p.z, g, -Math.PI / 2);
    }
    if (kind === 'breakfast') {   // 早餐推車（只有早上）
      box(1.8, .9, .9, M('#e8e4dc'), p.x, .45, p.z, g); solid(p.x, p.z, 1.8, .9);
      for (let i = 0; i < 3; i++) { const st = new T.Mesh(new T.CylinderGeometry(.22, .22, .25, 14), M('#c8cdd2', { m: .6 })); st.position.set(p.x - .5 + i * .5, 1.03, p.z); g.add(st); }
      box(2.0, .05, 1.1, M('#e07a3a', { r: .8 }), p.x, 2.4, p.z, g); box(.04, 1.5, .04, dark, p.x - .9, 1.65, p.z - .4, g); box(.04, 1.5, .04, dark, p.x + .9, 1.65, p.z - .4, g);
      sign(plainSign('阿桃早餐', '只賣到上午 10 點', '#e07a3a', '#fff'), 1.8, .45, p.x, 2.15, p.z + .6, g);
    }
    if (kind === 'oldmap') {   // 圓山懷舊展：1987 年的舊路網圖
      const t = canvasTex(512, 320, x => {
        x.fillStyle = '#e9dcc0'; x.fillRect(0, 0, 512, 320); x.strokeStyle = '#8a6a3a'; x.lineWidth = 6; x.strokeRect(6, 6, 500, 308);
        x.fillStyle = '#5a3a1a'; x.font = 'bold 26px "Noto Serif TC", serif'; x.fillText('臺北鐵路淡水線　1987', 24, 44);
        x.strokeStyle = '#7a3a2a'; x.lineWidth = 8; x.beginPath(); x.moveTo(60, 270); x.lineTo(200, 200); x.lineTo(300, 150); x.lineTo(450, 70); x.stroke();
        [['臺北', 60, 270], ['圓山', 200, 200], ['？', 250, 175], ['士林', 300, 150], ['北投', 380, 110], ['淡水', 450, 70]].forEach(([n, a, b]) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(a, b, 9, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#3a2a1a'; x.font = '20px "Noto Serif TC", serif'; x.fillText(n, a + 12, b + 24); });
      });
      const m = plane(3, 1.9, M('#ffffff', { map: t }), g); m.position.set(p.x + .03, 1.8, p.z); m.rotation.y = Math.PI / 2;
      box(.1, 2.1, 3.2, M('#5a3a2a'), p.x, 1.8, p.z, g);
      sign(plainSign('懷舊展　舊路網圖', 'Old map exhibition', '#5a3a2a', '#fff'), 2, .4, p.x + .12, 3.1, p.z, g, Math.PI / 2);
    }
    if (kind === 'tiles') {   // 國父紀念館：牆上的四塊圖案磁磚
      ['🌙', '☀️', '🌫️', '⭐'].forEach((ic, i) => {
        const t = canvasTex(128, 128, x => { x.fillStyle = ['#2a3a5a', '#f2c200', '#c8ccd8', '#1c2126'][i]; x.fillRect(0, 0, 128, 128); x.font = '72px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ic, 64, 70); });
        const m = plane(.7, .7, M('#ffffff', { map: t }), g); m.position.set(p.x - .03, 1.6, p.z - 1.2 + i * .8); m.rotation.y = -Math.PI / 2;
      });
      sign(plainSign('磁磚壁畫', '「從夜晚到早晨」', '#23272b', '#fff'), 2.2, .45, p.x - .1, 2.4, p.z, g, -Math.PI / 2);
    }
    if (kind === 'mistshop') {   // 霧商人的攤位
      box(1.8, .9, .9, M('#3a3a4a', { r: .6 }), p.x, .45, p.z, g); solid(p.x, p.z, 1.8, .9);
      for (let i = 0; i < 5; i++) box(.22, .22, .22, M(['#c8ccd8', '#9aa0c8', '#e9e7f0', '#c4162a', '#f2c200'][i], { e: i < 3 ? '#9aa0c8' : '#000', ei: i < 3 ? .4 : 0 }), p.x - .7 + i * .35, 1.01, p.z, g);
      box(2.0, .05, 1.1, M('#4a4a5a', { r: .8 }), p.x, 2.5, p.z, g); box(.04, 1.6, .04, dark, p.x - .9, 1.7, p.z - .4, g); box(.04, 1.6, .04, dark, p.x + .9, 1.7, p.z - .4, g);
      sign(plainSign('霧商人', '只收黃金', '#3a3a4a', '#e9e7f0'), 1.8, .45, p.x, 2.25, p.z + .6, g);
    }
    if (kind === 'stall') {
      box(1.8, .9, .9, wood, p.x, .45, p.z, g); solid(p.x, p.z, 1.8, .9);   // 攤車
      for (const s of [-1, 1]) { const w = new T.Mesh(new T.CylinderGeometry(.18, .18, .08, 14), dark); w.rotation.x = Math.PI / 2; w.position.set(p.x + s * .6, .18, p.z + .48); g.add(w); }
      for (let i = 0; i < 5; i++) box(.28, .06, .2, M(['#e6dcc6', '#c4162a', '#2a5fb0', '#f2c200', '#3d7a4a'][i]), p.x - .7 + i * .35, .93, p.z, g);
      box(.04, 1.6, .04, dark, p.x - .85, 1.7, p.z - .4, g); box(.04, 1.6, .04, dark, p.x + .85, 1.7, p.z - .4, g);
      box(2.0, .05, 1.1, M('#c4162a', { r: .8 }), p.x, 2.5, p.z, g);
      sign(plainSign('老 K 的收藏攤', 'Collectibles', '#5a3a2a', '#fff'), 1.8, .45, p.x, 2.25, p.z + .6, g);
    }
  }

  /* ── 車站設施：飲水機、AED、哺集乳室、站務室、公共藝術、廣告燈箱、時鐘、監視器、消防栓、
   *    販賣機、資源回收桶、周邊地圖、首末班車時刻表、公共電話、置物櫃、ATM、緊急按鈕、夜間婦女候車區 ── */
  const clocks = [];
  function clockTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    const ck = { c, t, last: -1 }; clocks.push(ck); drawClock(ck, true);
    return t;
  }
  function drawClock(ck, force) {
    const now = TaipeiTime.now(), m = now.hour * 60 + now.minute;
    if (!force && m === ck.last) return;
    ck.last = m;
    const g = ck.c.getContext('2d');
    g.fillStyle = '#1c2126'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#fbfbf8'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#23272b';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(64 + Math.sin(a) * 48 - 2, 64 - Math.cos(a) * 48 - 2, 4, 4); }
    const hand = (a, len, w) => { g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(a) * len, 64 - Math.cos(a) * len); g.stroke(); };
    g.strokeStyle = '#23272b'; hand((now.hour % 12 + now.minute / 60) / 12 * Math.PI * 2, 30, 6); hand(now.minute / 60 * Math.PI * 2, 44, 4);
    g.fillStyle = '#c4162a'; g.beginPath(); g.arc(64, 64, 4, 0, Math.PI * 2); g.fill();
    ck.t.needsUpdate = true;
  }
  function tickClocks() { for (const ck of clocks) drawClock(ck); }
  // 公益、活動廣告（虛構，不是真實品牌）
  const ADS = [
    { bg: '#c4162a', fg: '#fff', zh: '捐血一袋　救人一命', en: 'Donate blood, save lives' },
    { bg: '#1f6f8b', fg: '#fff', zh: '淡水夕照攝影展', en: 'Tamsui Sunset Photo Exhibition' },
    { bg: '#f2c200', fg: '#23272b', zh: '搭電扶梯　請緊握扶手', en: 'Hold the handrail' },
    { bg: '#2a9d8f', fg: '#fff', zh: '台北城市散步　週末導覽', en: 'Taipei city walks' },
    { bg: '#3a2a5a', fg: '#e9e7f0', zh: '霧——你看見了嗎？', en: 'Have you seen the mist?' },
    { bg: '#e07a3a', fg: '#fff', zh: '夜市小吃節　開跑', en: 'Night market food festival' },
    { bg: '#23272b', fg: '#f2c200', zh: '請勿在月台奔跑', en: 'Please do not run on the platform' },
  ];
  function adTex(i) {
    const a = ADS[((i % ADS.length) + ADS.length) % ADS.length];
    return canvasTex(512, 256, g => {
      g.fillStyle = a.bg; g.fillRect(0, 0, 512, 256);
      g.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(420 - k * 30, 60 + k * 25, 80 - k * 8, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = a.fg; g.font = 'bold 44px "Noto Sans TC", sans-serif'; g.fillText(a.zh, 30, 130);
      g.font = '24px "Barlow Semi Condensed", sans-serif'; g.fillText(a.en, 32, 180);
    });
  }
  // 公共藝術：每站不同的抽象畫
  function artTex(stationId, color) {
    const seed = [...stationId].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
    let x = seed % 2147483647 || 1; const r = () => (x = x * 16807 % 2147483647) / 2147483647;
    return canvasTex(512, 256, g => {
      const gr = g.createLinearGradient(0, 0, 512, 256); gr.addColorStop(0, '#f4efe6'); gr.addColorStop(1, '#dcd6ca'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
      const pal = [color, '#c4162a', '#f2c200', '#2a5fb0', '#3d7a4a', '#23272b'];
      for (let i = 0; i < 14; i++) {
        g.globalAlpha = .55 + r() * .4; g.fillStyle = pal[(r() * pal.length) | 0];
        if (r() < .5) { g.beginPath(); g.arc(r() * 512, r() * 256, 10 + r() * 60, 0, Math.PI * 2); g.fill(); }
        else { g.save(); g.translate(r() * 512, r() * 256); g.rotate(r() * 3); g.fillRect(-60, -6, 120 + r() * 120, 8 + r() * 18); g.restore(); }
      }
      g.globalAlpha = 1; g.strokeStyle = color; g.lineWidth = 6; g.beginPath();
      for (let i = 0; i <= 512; i += 8) g.lineTo(i, 200 + Math.sin(i / 40 + seed) * 24); g.stroke();
      g.fillStyle = '#23272b'; g.font = '16px "Noto Sans TC", sans-serif'; g.fillText(`公共藝術　${stationId}`, 14, 244);
    });
  }
  function furnish(L, g, night) {
    const C = L.concourse, U = L.unpaid, hallH = 4.2, sp = k => L.spots.filter(x => x.kind === k);
    const red = M('#c8202a', { r: .5 }), steelM = M('#c8cdd2', { r: .3, m: .8 }), darkM = M('#30363c', { r: .5 });
    const domeM = M('#1c2126', { r: .2, m: .3 });
    const cam = (x, y, z) => { box(.06, .2, .06, darkM, x, y - .1, z, g); const d = new T.Mesh(new T.SphereGeometry(.09, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), domeM); d.position.set(x, y - .2, z); g.add(d); };
    const speaker = (x, y, z) => box(.3, .06, .3, M('#e8e8e4'), x, y - .03, z, g);
    const hydrant = (x, y, z, rot) => { const b = box(.7, 1.2, .2, red, x, y + .9, z, g); b.rotation.y = rot; const w = box(.5, .3, .21, M('#f6f6f4'), x, y + 1.15, z, g); w.rotation.y = rot; };
    const fountain = (x, y, z, rot) => {
      const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = rot; g.add(grp);
      box(.5, .85, .4, steelM, 0, .425, 0, grp); box(.46, .06, .36, M('#e8ecf0', { m: .9, r: .15 }), 0, .88, .02, grp);
      box(.08, .12, .06, steelM, 0, .97, -.1, grp);
      sign(plainSign('飲水機', 'Drinking water', '#23272b', '#fff', { bg: '#2a7de1', fg: '#fff', text: '💧' }), .9, .22, 0, 1.55, -.19, grp);
    };
    // ── 大廳（付費區）──
    const fz = C.z0 + .3;
    fountain(C.x1 - 8, 0, C.z0 + .25, 0); solid(C.x1 - 8, C.z0 + .3, .5, .45);
    // AED
    box(.5, .6, .18, M('#2f9e5a'), C.x1 - 10.5, 1.4, fz, g);
    sign(plainSign('AED', '自動體外心臟電擊去顫器', '#2f9e5a', '#fff', { bg: '#fff', fg: '#c4162a', text: '♥' }), 1.2, .3, C.x1 - 10.5, 1.95, fz + .05, g);
    // 廣告燈箱
    for (const [x, i] of [[C.x1 - 15, 0], [C.x0 + 22, 3]]) if (x > 5 || x < -5) { box(3.2, 1.7, .12, M('#e8e8e4'), x, 1.7, fz, g); const p = plane(3, 1.5, M('#ffffff', { map: adTex(i + L.stationId.length), e: '#ffffff', ei: .15 }), g); p.position.set(x, 1.7, fz + .07); }
    // 公共藝術（牆面大畫）
    const art = plane(5, 2.5, M('#ffffff', { map: artTex(L.stationId, LINES[L.platforms[0].line].color) }), g); art.position.set(C.x0 + 14, 2.1, C.z0 + .03);
    box(5.2, .08, .1, darkM, C.x0 + 14, .82, C.z0 + .05, g);
    // 哺集乳室、站務室（側牆上的門）
    for (const [x, zh, en, col, rot] of [[C.x1 - .02, '哺集乳室', 'Nursing room', '#e08aa8', -Math.PI / 2], [C.x0 + .02, '站務室', 'Staff only', '#5d6b7a', Math.PI / 2]]) {
      const d = plane(1.2, 2.2, M(col === '#5d6b7a' ? '#7a8590' : '#f2d6de'), g); d.position.set(x, 1.1, C.z0 + 5); d.rotation.y = rot;
      sign(plainSign(zh, en, '#23272b', '#fff', { bg: col, fg: '#fff', text: zh === '站務室' ? '⚙' : '♡' }), 1.8, .45, x + (rot < 0 ? -.05 : .05), 2.6, C.z0 + 5, g, rot);
    }
    hydrant(C.x1 - .15, 0, C.z0 + 8, -Math.PI / 2); hydrant(C.x0 + .15, 0, C.z0 + 8, Math.PI / 2);
    // 時鐘、監視器、喇叭
    const ct = M('#ffffff', { map: clockTex() });
    for (const z of [L.gateZ - 2.5]) { box(.04, .4, .04, darkM, 0, hallH - .2, z, g); for (const s of [-1, 1]) { const c = plane(.7, .7, ct, g); c.position.set(0, hallH - .75, z + s * .03); c.rotation.y = s > 0 ? 0 : Math.PI; } }
    for (const [x, z] of [[C.x0 + 3, C.z0 + 3], [C.x1 - 3, C.z0 + 3], [0, L.gateZ - 1.5], [C.x0 + 3, L.gateZ - 3], [C.x1 - 3, L.gateZ - 3]]) cam(x, hallH, z);
    for (let x = C.x0 + 6; x < C.x1 - 3; x += 12) speaker(x, hallH, (C.z0 + L.gateZ) / 2);
    // 無障礙寬閘門標示
    sign(plainSign('寬閘門', 'Wide gate', '#2a5fb0', '#fff', { bg: '#fff', fg: '#2a5fb0', text: '♿' }), 1.4, .35, L.gates[L.gates.length - 1] + 1.2, 1.6, L.gateZ + .6, g);
    // ── 非付費區 ──
    // 自動販賣機
    box(.9, 1.9, .8, M('#e8e8e4'), U.x1 - .5, .95, U.z0 + 6.2, g); solid(U.x1 - .5, U.z0 + 6.2, .9, .8);
    const vt = canvasTex(128, 256, x => { x.fillStyle = '#1f6f8b'; x.fillRect(0, 0, 128, 256); x.fillStyle = '#fff'; x.font = 'bold 18px sans-serif'; x.fillText('飲料', 40, 26); const cs = ['#e04848', '#f2c200', '#2a9d8f', '#f4f4f2', '#3a6a3a', '#a86a2a']; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { x.fillStyle = cs[(r + c) % 6]; x.fillRect(12 + c * 28, 44 + r * 46, 18, 34); } });
    const vp = plane(.8, 1.6, M('#ffffff', { map: vt, e: '#ffffff', ei: .25 }), g); vp.position.set(U.x1 - .94, 1.05, U.z0 + 6.2); vp.rotation.y = -Math.PI / 2;
    // 資源回收桶
    for (const x of [-4, 4]) { box(.4, .8, .4, M('#2f9e5a'), x - .22, .4, U.z1 - .5, g); box(.4, .8, .4, M('#2a7de1'), x + .22, .4, U.z1 - .5, g); box(.86, .05, .42, darkM, x, .82, U.z1 - .5, g); }
    // 周邊地圖
    box(2, 1.4, .1, darkM, -7.5, 1.5, U.z1 - .15, g);
    const am = canvasTex(512, 360, x => {
      x.fillStyle = '#f6f3ea'; x.fillRect(0, 0, 512, 360); x.strokeStyle = '#d8d0bf'; x.lineWidth = 10;
      for (let i = 40; i < 512; i += 90) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 30, 360); x.stroke(); } for (let i = 50; i < 360; i += 80) { x.beginPath(); x.moveTo(0, i); x.lineTo(512, i - 20); x.stroke(); }
      x.fillStyle = '#3d7a4a'; x.globalAlpha = .4; x.fillRect(300, 210, 120, 90); x.globalAlpha = 1;
      x.fillStyle = '#c4162a'; x.beginPath(); x.arc(256, 180, 12, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#23272b'; x.font = 'bold 26px "Noto Sans TC", sans-serif'; x.fillText(`${L.stationId}${L.stationId.endsWith('站') ? '' : '站'} 周邊地圖`, 16, 34);
      x.font = '18px "Noto Sans TC", sans-serif'; ['1', '2', '3'].forEach((n, i) => { x.fillStyle = '#f2c200'; x.fillRect(150 + i * 90, 220, 30, 26); x.fillStyle = '#23272b'; x.fillText(n, 160 + i * 90, 240); });
    });
    const amp = plane(1.9, 1.3, M('#ffffff', { map: am }), g); amp.position.set(-7.5, 1.5, U.z1 - .21); amp.rotation.y = Math.PI;
    // 首末班車時刻表
    box(1.4, 1.8, .1, darkM, 9.5, 1.6, L.gateZ + 1.4, g); box(.1, .7, .1, darkM, 9.5, .35, L.gateZ + 1.4, g);
    const tt = canvasTex(256, 330, x => {
      x.fillStyle = '#fbfbf8'; x.fillRect(0, 0, 256, 330); x.fillStyle = '#23272b'; x.font = 'bold 22px "Noto Sans TC", sans-serif'; x.fillText('首末班車時刻', 14, 32);
      x.font = '15px "Noto Sans TC", sans-serif'; let y = 64;
      for (const P of L.platforms) for (const s of [1, -1]) for (const d of P.sides[s]) { if (y > 310) break; x.fillStyle = LINES[P.line].color; x.fillRect(14, y - 14, 8, 18); x.fillStyle = '#23272b'; x.fillText(`往 ${MRT.label(d.terminal, P.line).zh}　首班 06:00`, 28, y); y += 26; }
    });
    const ttp = plane(1.3, 1.67, M('#ffffff', { map: tt }), g); ttp.position.set(9.5, 1.6, L.gateZ + 1.46);
    // 公共電話
    box(.4, .6, .25, M('#2f9e5a'), U.x0 + .2, 1.4, U.z0 + 2.2, g); box(.1, .2, .1, darkM, U.x0 + .35, 1.45, U.z0 + 2.05, g);
    sign(plainSign('公共電話', 'Public phone', '#23272b', '#fff'), 1.2, .3, U.x0 + .1, 2.05, U.z0 + 2.2, g, Math.PI / 2);
    // 大站：置物櫃、ATM
    if (SHOPS[L.stationId]) {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) box(.62, .5, .02, M(['#f2c200', '#e8e8e4'][(i + j) % 2]), U.x0 + .72, .4 + j * .55, U.z0 + 9.45 + i * .66, g).rotation.y = Math.PI / 2;
      box(.7, 2.3, 2.1, M('#b9c0c6', { m: .5 }), U.x0 + .35, 1.15, U.z0 + 10.1, g); solid(U.x0 + .35, U.z0 + 10.1, .8, 2.1);
      sign(plainSign('置物櫃', 'Lockers', '#23272b', '#fff'), 1.4, .35, U.x0 + .8, 2.6, U.z0 + 10.1, g, Math.PI / 2);
      box(.8, 1.7, .7, M('#3a4a5a', { m: .4 }), U.x1 - .45, .85, U.z0 + 4.7, g); solid(U.x1 - .45, U.z0 + 4.7, .8, .7);
      const atm = plane(.4, .3, M('#2a7de1', { e: '#2a7de1', ei: .6 }), g); atm.position.set(U.x1 - .86, 1.3, U.z0 + 4.7); atm.rotation.y = -Math.PI / 2;
      sign(plainSign('ATM', '提款機', '#23272b', '#fff'), 1, .3, U.x1 - .9, 2.1, U.z0 + 4.7, g, -Math.PI / 2);
    }
    for (const [x, z] of [[U.x0 + 3, U.z0 + 2], [U.x1 - 3, U.z1 - 3], [0, U.z0 + 6]]) cam(x, hallH, z);
    // 更多垃圾桶、廣告、指標
    const bin = (x, y, z) => { solid(x, z, .42, .42, y); box(.42, .75, .42, M('#5d6b7a', { m: .4, r: .4 }), x, y + .375, z, g); box(.44, .06, .44, darkM, x, y + .78, z, g); box(.16, .02, .2, M('#1c2126'), x, y + .81, z, g); };
    for (const x of [-5.2, 5.2]) bin(x, 0, C.z0 + .45);                                   // 大廳站名牆兩側
    bin(U.x0 + .5, 0, U.z0 + 3.4); bin(U.x1 - 5.8, 0, U.z1 - .5);                         // 非付費區
    const adW = (x, z, rot, i) => { const b = box(.12, 1.7, 3.2, M('#e8e8e4'), x, 1.7, z, g); b.rotation.y = rot; const p = plane(3, 1.5, M('#ffffff', { map: adTex(i), e: '#ffffff', ei: .15 }), g); p.position.set(x + Math.sin(rot) * .07, 1.7, z + Math.cos(rot) * .07); p.rotation.y = rot; };
    for (const [k, z] of [C.z0 + 12, C.z0 + 20].entries()) if (z < L.gateZ - 2.5) { adW(C.x0 + .08, z, Math.PI / 2, k + 1); if (!placesOf(L.stationId).includes('cafe')) adW(C.x1 - .08, z, -Math.PI / 2, k + 4); }
    { const p = plane(3, 1.5, M('#ffffff', { map: adTex(5), e: '#ffffff', ei: .15 }), g); p.position.set(8.5, 1.7, U.z1 - .16); p.rotation.y = Math.PI; box(3.2, 1.7, .1, M('#e8e8e4'), 8.5, 1.7, U.z1 - .08, g); }
    // 吊掛的出口指標（付費區往閘門）
    const exitSign = plainSign('出口 Exit ↓', '往閘門 To fare gates', '#f2c200', '#1c2126');
    for (const x of [-8, 8]) { box(.04, .5, .04, darkM, x, hallH - .25, L.gateZ - 4, g); sign(exitSign, 2.4, .55, x, hallH - .8, L.gateZ - 4, g); }
    // ── 月台 ──
    const gapM = M('#ffffff', { t: true, map: canvasTex(256, 74, x => { x.fillStyle = '#f2c200'; x.fillRect(0, 0, 256, 74); x.fillStyle = '#1c2126'; x.font = 'bold 28px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText('小心月台間隙', 128, 34); x.font = '18px "Barlow Semi Condensed", sans-serif'; x.fillText('Mind the gap', 128, 62); }) });
    for (const P of L.platforms) {
      const pg = new T.Group(); pg.position.set(P.x, P.y, P.z); g.add(pg);
      const top = P.under ? 3.4 : 3.8;
      // 飲水機（靠近端點的柱子）
      const f = new T.Group(); f.position.set(26.4, 0, .45); pg.add(f); solid(P.x + 26.4, P.z + .45, .5, .4, P.y);
      box(.5, .85, .4, steelM, 0, .425, 0, f); box(.46, .06, .36, M('#e8ecf0', { m: .9, r: .15 }), 0, .88, 0, f);
      // 柱子上的緊急停止按鈕、消防栓
      for (const x of [-28, 0, 28]) {
        box(.2, .2, .08, M('#f2c200'), x, 1.5, .39, pg); box(.1, .1, .04, red, x, 1.5, .44, pg);
        box(.22, .2, .08, M('#f2c200'), x, 1.5, -.39, pg); box(.1, .1, .04, red, x, 1.5, -.44, pg);
      }
      if (P.under) for (const ex of [-1, 1]) { const h = box(.2, 1.2, .7, red, ex * (LEN / 2 - .05), .9, -1.6, pg); void h; }
      // 垃圾桶、地上的「小心月台間隙」貼紙
      for (const ex of [-1, 1]) bin(P.x + ex * 29.4, P.y, P.z - .9);
      for (const s of [-1, 1]) for (const d of DOORS) { const st = plane(1.1, .32, gapM, pg); st.rotation.x = -Math.PI / 2; st.rotation.z = s > 0 ? 0 : Math.PI; st.position.set(d, .006, s * 2.45); }
      if (!P.under) for (const s of [-1, 1]) for (const [k, x] of [-15, 15].entries()) {   // 高架月台：屋簷下的廣告看板
        const p = plane(2.4, 1.2, M('#ffffff', { map: adTex(k + s + 3), e: '#ffffff', ei: .2 }), pg); p.position.set(x, 2.9, s * 2.75); p.rotation.y = s > 0 ? Math.PI : 0;
      }
      // 時鐘
      const pct = M('#ffffff', { map: clockTex() });
      for (const x of [-10, 10]) { box(.04, .35, .04, darkM, x, top - .17, 0, pg); for (const s of [-1, 1]) { const c = plane(.6, .6, pct, pg); c.position.set(x, top - .65, s * .03); c.rotation.y = s > 0 ? 0 : Math.PI; } }
      // 監視器、喇叭
      for (const x of [-30, -16, 2, 16, 30]) { cam(P.x + x, P.y + top, P.z + 1.4); cam(P.x + x + 2, P.y + top, P.z - 1.4); }
      for (const x of [-20, 0, 20]) speaker(P.x + x + 4, P.y + top, P.z);
      // 夜間婦女候車區（+1 側地面＋吊牌）
      const wz = plane(3, .9, M('#d870a0', { t: true, o: .55 }), pg); wz.rotation.x = -Math.PI / 2; wz.position.set(-12, .007, 2.2);
      sign(plainSign('夜間婦女候車區', 'Women\'s waiting zone (night)', '#d870a0', '#fff'), 2, .45, -12, 2.4, 2.35, pg);
      // 軌道外牆的廣告燈箱（地下月台）
      if (P.under) for (const s of [-1, 1]) for (const [k, x] of [-24, -12, 0, 12, 24].entries()) {
        const p = plane(3.2, 1.6, M('#ffffff', { map: adTex(k + s + P.k), e: '#ffffff', ei: .2 }), pg); p.position.set(x, 1.4, s * 6.86); p.rotation.y = s > 0 ? Math.PI : 0;
      }
      // 車門編號（全高月台門上方）
      if (P.under || P.line === 'BR') for (const s of [-1, 1]) DOORS.forEach((d, i) => {
        const nt = canvasTex(64, 32, x => { x.fillStyle = '#23272b'; x.fillRect(0, 0, 64, 32); x.fillStyle = '#fff'; x.font = 'bold 20px "Barlow Semi Condensed", sans-serif'; x.textAlign = 'center'; x.fillText(`${Math.floor(i / DOOR_OFF.length) + 1}-${i % DOOR_OFF.length + 1}`, 32, 24); });
        const p = plane(.4, .2, M('#ffffff', { map: nt }), pg); p.position.set(d, 2.52, s * (PSD - .17)); p.rotation.y = s > 0 ? Math.PI : 0;
      });
    }
  }

  // 電扶梯（往大廳、往月台）＋中間樓梯
  function buildRamp(pg, P, r, L) {
    const x0 = r.xa - P.x, x1 = r.xb - P.x;     // 月台區域座標（月台端 → 大廳端）
    const y0 = 0, y1 = -P.y;                      // 月台地板 → 大廳地板（相對）
    const len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, Math.abs(x1 - x0));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    LANES.forEach((lz, i) => {
      const stair = i === 1;
      const tex = tiled(stair ? TEX.stairs : TEX.steps, 1, len / 1.5);
      const m = new T.Mesh(new T.BoxGeometry(len, .12, stair ? 1.3 : .95), M('#ffffff', { map: tex, r: .6 }));
      m.position.set(cx, cy, lz);
      m.rotation.z = (x1 > x0 ? 1 : -1) * ang;
      m.material.map.rotation = Math.PI / 2;
      pg.add(m);
      // 側欄（玻璃＋扶手）
      for (const sz of [-1, 1]) {
        const w = stair ? .7 : .52;
        const rail = new T.Mesh(new T.BoxGeometry(len, .9, .04), M('#cfe3ec', { t: true, o: .25 }));
        rail.position.set(cx, cy + .5, lz + sz * w); rail.rotation.z = m.rotation.z; pg.add(rail);
        const hand = new T.Mesh(new T.BoxGeometry(len, .06, .1), M(stair ? '#9aa1a8' : '#1c1c1e', { r: .4 }));
        hand.position.set(cx, cy + .97, lz + sz * w); hand.rotation.z = m.rotation.z; pg.add(hand);
      }
    });
    // 電扶梯方向指示（綠色箭頭＝可進入）
    const dirSign = (lz, toHall) => {
      const t = canvasTex(128, 128, g => { g.fillStyle = '#111'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#31d07a'; g.font = '700 96px sans-serif'; g.textAlign = 'center'; g.fillText(toHall === (P.y < 0) ? '↑' : '↓', 64, 98); });
      const p = plane(.3, .3, new T.MeshBasicMaterial({ map: t }), pg); p.position.set(x0 - r.b * .2, 1.2, lz); p.rotation.y = r.b > 0 ? -Math.PI / 2 : Math.PI / 2;
    };
    dirSign(LANES[0], true); dirSign(LANES[2], false);
    // 月台端：往大廳／轉乘指標
    const others = L.platforms.filter(o => o.line !== P.line).map(o => o.line);
    const zh = others.length ? `大廳・出口・轉乘 ${others.map(o => LINES[o].zh).join('、')}` : '大廳・出口';
    const tex = guideTex(others, zh, others.length ? 'Concourse · Exit · Transfer' : 'Concourse · Exit', P.y < 0 ? 'up' : 'down');
    sign(tex, 2.4, .6, x0 - r.b * 1.2, P.under ? 3.05 : 3.4, 0, pg, Math.PI / 2);
  }

  /* ── 列車 ── */
  const trainCache = {};
  let lcdTex, lcdCanvas, stripTex, stripCanvas;
  function sharedScreens() {
    if (lcdCanvas) return;
    lcdCanvas = document.createElement('canvas'); lcdCanvas.width = 512; lcdCanvas.height = 128;
    lcdTex = new T.CanvasTexture(lcdCanvas); lcdTex.colorSpace = T.SRGBColorSpace;
    stripCanvas = document.createElement('canvas'); stripCanvas.width = 1024; stripCanvas.height = 128;
    stripTex = new T.CanvasTexture(stripCanvas); stripTex.colorSpace = T.SRGBColorSpace;
  }
  function trainTemplate(lineId) {
    if (trainCache[lineId]) return trainCache[lineId];
    textures(); sharedScreens();
    const g = new T.Group();
    const L = LINES[lineId];
    const body = M('#e6e9ec', { r: .35, m: .35 });
    const inner = M('#eceeec', { r: .8 });
    const glassM = M('#24313a', { t: true, o: .35, r: .05, m: .3 });
    const stripe = M(L.color, { r: .5 });
    const doorM = M('#ffffff', { map: TEX.door, r: .5, m: .2 });
    const seatM = M(lineId === 'BR' ? '#5a6b7b' : '#2f5d9e', { r: .6 });
    const steel = M('#c8cdd2', { r: .25, m: .9 });
    const lightM = M('#ffffff', { e: '#fffbea', ei: 1.6 });
    const floorM = M('#8f9498', { r: .8 });
    const lcdM = new T.MeshBasicMaterial({ map: lcdTex });
    const stripM = new T.MeshBasicMaterial({ map: stripTex });
    for (let ci = 0; ci < CARS; ci++) {
      const cx = CAR_X[ci];
      const car = new T.Group(); car.position.x = cx; g.add(car);
      const x0 = -CAR_LEN / 2, x1 = CAR_LEN / 2;
      box(CAR_LEN, .14, HALF_W * 2, floorM, 0, -.07, 0, car);
      box(CAR_LEN, .5, HALF_W * 2, M('#4c5156'), 0, -.45, 0, car);
      const roof = new T.Mesh(new T.CylinderGeometry(HALF_W + .04, HALF_W + .04, CAR_LEN, 24, 1, true, -Math.PI / 2, Math.PI), body);
      roof.rotation.z = Math.PI / 2; roof.scale.set(.32, 1, 1); roof.position.y = 2.3; car.add(roof);
      const ceil = plane(CAR_LEN, HALF_W * 2, inner, car); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2.3;
      for (const z of [-.55, .55]) box(CAR_LEN - .6, .04, .2, lightM, 0, 2.27, z, car);
      for (const side of [-1, 1]) {
        const z = side * HALF_W;
        const segs = []; let prev = x0;
        for (const d of DOOR_OFF) { segs.push([prev, d - .7]); prev = d + .7; }
        segs.push([prev, x1]);
        for (const [a, b] of segs) {
          const w = b - a, c = (a + b) / 2;
          box(w, .95, .08, body, c, .475, z, car);
          box(w, .4, .08, body, c, 2.1, z, car);
          box(w, .12, .085, stripe, c, .82, z, car);
          box(w - .3, .95, .03, glassM, c, 1.42, z, car).renderOrder = 1;
          box(.15, .95, .08, body, a + .075, 1.42, z, car); box(.15, .95, .08, body, b - .075, 1.42, z, car);
          const sl = w - .6;
          if (sl > 1) {
            box(sl, .12, .48, seatM, c, .45, z - side * .3, car);
            box(sl, .5, .08, seatM, c, .75, z - side * .1, car);
            box(.08, .5, .5, steel, a + .3, .6, z - side * .3, car); box(.08, .5, .5, steel, b - .3, .6, z - side * .3, car);
          }
          if (side < 0 && w > 3) { const p = plane(Math.min(3, w - 1), .38, stripM, car); p.position.set(c, 2.05, z + .05); }
        }
        for (const d of DOOR_OFF) {
          box(1.4, .2, .09, body, d, 2.2, z, car);
          const lcd = plane(.9, .22, lcdM, car); lcd.position.set(d, 2.08, z - side * .06); lcd.rotation.y = side > 0 ? Math.PI : 0;
          for (const sx of [-1, 1]) {
            const leaf = new T.Mesh(new T.BoxGeometry(.65, 2.05, .05), doorM);
            leaf.position.set(cx + d + sx * .325, 1.03, z + side * .01);
            leaf.userData = { leaf: true, base: cx + d + sx * .325, sx, side };
            g.add(leaf);
            box(.05, 2.25, .05, steel, d + sx * .78, 1.12, z - side * .25, car);
          }
        }
      }
      for (const z of [-.8, .8]) {
        const bar = new T.Mesh(new T.CylinderGeometry(.018, .018, CAR_LEN - .5, 8), steel); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.95, z); car.add(bar);
        for (let x = x0 + .6; x < x1 - .4; x += .45) {
          if (DOOR_OFF.some(d => Math.abs(x - d) < .7)) continue;
          box(.03, .2, .015, M('#d9dcdf'), x, 1.84, z, car);
          const ring = new T.Mesh(new T.TorusGeometry(.06, .012, 6, 12), M('#eceeef')); ring.position.set(x, 1.68, z); car.add(ring);
        }
      }
      if (ci === 0 || ci === CARS - 1) {
        const sx = ci === 0 ? -1 : 1;
        box(.12, 2.4, HALF_W * 2, body, sx * CAR_LEN / 2, 1.1, 0, car);
        box(.9, 1.9, HALF_W * 2 - .1, body, sx * (CAR_LEN / 2 + .45), .95, 0, car);
        box(.05, .8, 2.4, M('#14191d', { r: .1 }), sx * (CAR_LEN / 2 + .92), 1.45, 0, car);
        for (const z of [-.9, .9]) box(.05, .12, .3, M('#fff6d0', { e: '#fff6d0', ei: 2 }), sx * (CAR_LEN / 2 + .92), .55, z, car);
        box(.06, .14, HALF_W * 2 - .2, stripe, sx * (CAR_LEN / 2 + .91), .82, 0, car);
      }
    }
    for (const gx of [CAR_X[0] + CAR_LEN / 2 + CAR_GAP / 2, CAR_X[1] + CAR_LEN / 2 + CAR_GAP / 2]) {
      for (const z of [-HALF_W + .1, HALF_W - .1]) box(CAR_GAP + .2, 2.3, .1, M('#2b2f33'), gx, 1.1, z, g);
      box(CAR_GAP + .2, .1, HALF_W * 2, M('#2b2f33'), gx, 2.25, 0, g);
      box(CAR_GAP + .2, .05, HALF_W * 2 - .2, floorM, gx, -.03, 0, g);
    }
    mergeStatic(g);
    g.userData.lightM = lightM;
    trainCache[lineId] = g;
    return g;
  }
  // 每次進站複製一列（共用幾何與材質）
  function makeTrain(lineId) {
    const tpl = trainTemplate(lineId), g = tpl.clone(true);
    const leaves = [];
    g.traverse(o => { if (o.userData && o.userData.leaf) leaves.push(o); });
    g.userData = { leaves, line: lineId, lightM: tpl.userData.lightM };
    return g;
  }

  function drawLcd(head, zh, en, color, textColor) {
    sharedScreens();
    const g = lcdCanvas.getContext('2d');
    g.fillStyle = '#07090b'; g.fillRect(0, 0, 512, 128);
    g.fillStyle = color; g.fillRect(8, 8, 496, 30);
    g.fillStyle = textColor; g.font = '700 22px "Noto Sans TC", sans-serif'; g.fillText(head, 18, 31);
    g.fillStyle = '#ffd36b'; g.textAlign = 'center'; g.font = `900 ${zh.length > 6 ? 40 : 48}px "Noto Sans TC", sans-serif`; g.fillText(zh, 256, 88);
    g.fillStyle = '#e8e2c9'; g.font = '500 22px "Barlow Semi Condensed", sans-serif'; g.fillText(en, 256, 116); g.textAlign = 'left';
    lcdTex.needsUpdate = true;
  }
  function drawStrip(lineId, list, cur) {
    sharedScreens();
    const g = stripCanvas.getContext('2d'), L = LINES[lineId];
    g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, 1024, 128);
    const from = Math.max(0, cur - 1), shown = list.slice(from, from + 7);
    const step = shown.length > 1 ? 900 / (shown.length - 1) : 0;
    g.strokeStyle = L.color; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(60, 44); g.lineTo(964, 44); g.stroke();
    shown.forEach((id, i) => {
      const gi = from + i, x = 62 + i * step;
      g.beginPath(); g.arc(x, 44, gi === cur ? 18 : 12, 0, 7);
      g.fillStyle = gi < cur ? '#bbb' : gi === cur ? L.color : '#fff'; g.fill();
      g.lineWidth = 5; g.strokeStyle = '#1c2126'; g.stroke();
      g.fillStyle = gi < cur ? '#999' : '#1c2126'; g.textAlign = 'center';
      const zh = MRT.label(id, lineId).zh;
      g.font = `${gi === cur ? 900 : 500} ${zh.length > 4 ? 22 : 28}px "Noto Sans TC", sans-serif`; g.fillText(zh, x, 104);
    });
    g.textAlign = 'left';
    stripTex.needsUpdate = true;
  }
  // 月台 LED：兩班車
  function drawLed(led, lineId, rows) {
    const g = led.canvas.getContext('2d'), L = LINES[lineId];
    g.fillStyle = '#050607'; g.fillRect(0, 0, 512, 128);
    g.fillStyle = L.color; g.fillRect(0, 0, 10, 128);
    g.font = '700 40px "Noto Sans TC", sans-serif';
    rows.slice(0, 2).forEach((r, i) => {
      const y = 52 + i * 56;
      g.fillStyle = '#ffb347'; g.textAlign = 'left'; g.fillText(r.text, 26, y);
      g.textAlign = 'right'; g.fillText(r.eta, 496, y);
    });
    g.textAlign = 'left';
    led.tex.needsUpdate = true;
  }

  /* ── 站間：隧道或高架（沿 x 從 xa 到 xb，軌道高度 y、軌道中心 zc） ── */
  const SKY_CITY = { day: { night: false }, dusk: { night: false }, dawn: { night: false }, night: { night: true } };
  function city(x0, x1, seed, parent, y, zc, night) {
    let sd = seed;
    const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const winTex = canvasTex(64, 128, (g, w, h) => {
      g.fillStyle = night ? '#141b26' : '#8e9aa6'; g.fillRect(0, 0, w, h);
      for (let yy = 6; yy < h; yy += 12) for (let x = 5; x < w; x += 12) {
        g.fillStyle = night && Math.random() < .45 ? '#ffd890' : (night ? '#1e2836' : '#b9c7d3');
        g.fillRect(x, yy, 7, 8);
      }
    });
    const mat = new T.MeshStandardMaterial({ map: winTex, emissiveMap: night ? winTex : null, emissive: night ? '#ffffff' : '#000', emissiveIntensity: night ? .9 : 0, roughness: .8 });
    const n = Math.max(20, Math.round((x1 - x0) / 9));
    const inst = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mat, n * 2);
    const m4 = new T.Matrix4(), q = new T.Quaternion();
    let k = 0;
    for (const side of [-1, 1]) for (let i = 0; i < n; i++) {
      const w = 8 + rnd() * 14, d = 8 + rnd() * 12, h = 10 + rnd() * 45;
      m4.compose(new T.Vector3(x0 + (i + rnd()) * (x1 - x0) / n, y - 13 + h / 2, zc + side * (18 + rnd() * 50)), q, new T.Vector3(w, h, d));
      inst.setMatrixAt(k++, m4);
    }
    parent.add(inst);
    const ground = plane(x1 - x0 + 200, 260, M(night ? '#1b2027' : '#7b7f78'), parent);
    ground.rotation.x = -Math.PI / 2; ground.position.set((x0 + x1) / 2, y - 13, zc);
  }
  function segment(xa, xb, y, zc, ugA, ugB, lineId, seed, night, anomaly) {
    textures();
    const g = new T.Group();
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), mid = (x0 + x1) / 2;
    const ugLow = xa < xb ? ugA : ugB, ugHigh = xa < xb ? ugB : ugA;
    const parts = ugLow === ugHigh ? [[x0, x1, ugLow]] : [[x0, mid, ugLow], [mid, x1, ugHigh]];
    for (const [a, b, ug] of parts) {
      const len = b - a, cx = (a + b) / 2;
      if (ug) {
        const wallM = M('#3a3b3c', { map: tiled(TEX.concrete, len / 4, 1), r: .95 });
        for (const s of [-1, 1]) { const w = plane(len, 5, wallM, g); w.position.set(cx, y + 1, zc + s * 2.4); w.rotation.y = s > 0 ? Math.PI : 0; }
        const top = plane(len, 4.8, wallM, g); top.rotation.x = Math.PI / 2; top.position.set(cx, y + 3.2, zc);
        const bed = plane(len, 4.8, M('#2a2a28'), g); bed.rotation.x = -Math.PI / 2; bed.position.set(cx, y - 1.15, zc);
        const n = Math.floor(len / 9);
        const hue = (seed % 360) / 360;   // 每段隧道的燈色略有不同
        const tc = new T.Color().setHSL(.1 + Math.sin(hue * 6.28) * .06, .55, .75);
        const li = new T.InstancedMesh(new T.BoxGeometry(.5, .08, .06), M('#ffffff', { e: tc, ei: 2 }), n * 2);
        const m4 = new T.Matrix4(); let k = 0;
        for (let i = 0; i < n; i++) for (const s of [-1, 1]) { m4.makeTranslation(a + 4 + i * 9, y + 2.1, zc + s * 2.35); li.setMatrixAt(k++, m4); }
        g.add(li);
        for (const s of [-1, 1]) for (const yy of [1.2, 1.32, 1.44]) box(len, .04, .04, M('#111'), cx, y + yy, zc + s * 2.32, g);
        for (let x = a + 30; x < b; x += 60) box(.3, .15, .05, M('#31d07a', { e: '#31d07a', ei: 2 }), x, y + .6, zc - 2.35, g);
        if (parts.length > 1) box(1.2, 6, 6, M('#55585b'), ug === ugLow ? b : a, y + 1.4, zc, g);
      } else {
        box(len, .8, 6, M('#77736d', { map: TEX.concrete }), cx, y - 1.6, zc, g);
        for (const s of [-1, 1]) box(len, .9, .2, M('#8c8a85', { map: TEX.concrete }), cx, y - .7, zc + s * 2.3, g);
        for (let x = a; x < b; x += 30) box(2, 11, 2, M('#77736d'), x, y - 7, zc, g);
        if (lineId !== 'BR') for (let x = a + 10; x < b; x += 40) { box(.18, 5, .18, M('#4c5258', { m: .5 }), x, y + 1.2, zc - 2.2, g); box(.1, .1, 2.4, M('#4c5258'), x, y + 3.4, zc - 1.1, g); }
      }
    }
    if (parts.some(p => !p[2])) city(x0 - 60, x1 + 60, seed, g, y, zc, night);
    mergeStatic(g);
    // 異常：隧道中間出現一座不存在的月台
    if (anomaly && parts.some(p => p[2])) {
      const ax = mid, gm = M('#7fae9a', { e: '#3a6a5a', ei: .6, t: true, o: .85 });
      box(60, .4, 3.5, gm, ax, y - .2, zc + 4.2, g);
      for (let x = -24; x <= 24; x += 12) box(.4, 3, .4, M('#4a6a60', { t: true, o: .7 }), ax + x, y + 1.3, zc + 5.4, g);
      const st = canvasTex(1024, 256, (c) => {
        c.fillStyle = '#e8f2ee'; c.fillRect(0, 0, 1024, 256); c.fillStyle = '#5a8a7a'; c.fillRect(0, 0, 1024, 22);
        c.fillStyle = '#1c2126'; c.font = '900 120px "Noto Serif TC", serif'; c.fillText('霧', 80, 170);
        c.font = '600 54px "Barlow Semi Condensed", sans-serif'; c.fillText('Mist · M00', 260, 160);
      });
      for (const x of [-14, 14]) { const p = plane(2.6, .65, new T.MeshBasicMaterial({ map: st, transparent: true, opacity: .9 }), g); p.position.set(ax + x, y + 2.2, zc + 2.5); }
      // 月台上的人影（紅帽子）
      const sil = new T.Group(); sil.position.set(ax + 6, y, zc + 3.2);
      sil.add(box(.4, 1.3, .25, M('#e8ecf0', { t: true, o: .55 }), 0, .9, 0, null));
      sil.add(box(.36, .1, .36, M('#c4162a', { e: '#c4162a', ei: .5 }), 0, 1.75, 0, null));
      sil.add(box(.22, .26, .22, M('#e8ecf0', { t: true, o: .55 }), 0, 1.65, 0, null));
      g.add(sil);
      // 不用點光源（光源數量一變就要重編所有材質），改用發光的霧面板
      const glow = plane(30, 4, M('#9fe0c8', { e: '#9fe0c8', ei: 1.2, t: true, o: .35 }), g); glow.position.set(ax, y + 2.2, zc + 1.2);
      g.userData.anomalyX = ax;
    }
    return g;
  }

  // 高架車站周圍的城市
  function surroundings(L, night) {
    const g = new T.Group();
    const el = L.platforms.filter(p => !p.under);
    if (el.length) city(-260, 260, L.stationId.charCodeAt(0) * 7 + 3, g, el[0].y, el[0].z, night);
    return g;
  }

  return {
    CAR_X, DOORS, HALF_W, TRACK, PLAT_HALF, PSD, LEN, LANES, SHOPS, tickClocks, placeAt,
    layout, build, makeTrain, segment, surroundings, sides,
    drawLcd, drawStrip, drawLed, SKY_CITY,
  };
})();
