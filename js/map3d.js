/* 台北捷運全路網 3D 地圖
 *  - 6 條路線、118 站；高架段架高在橋墩上，地下段在半透明地面之下，交界處以坡道銜接
 *  - 淡水河、基隆河、新店溪，北邊陽明山、南邊丘陵
 *  - 還沒去過的車站被霧蓋住，去過就散開；目前位置站著自己的角色
 *  - 操作：拖曳平移、滾輪／雙指縮放、右鍵拖曳或雙指旋轉；點車站看資訊
 * 座標：路網示意座標 (x, y) 0–1000 → 3D (x/10, 高度, y/10)
 */
const Map3D = (() => {
  const T = THREE;
  const S = 10;                       // 座標縮放
  const H_EL = 1.6, H_UG = -1.4, H_GROUND = 0;
  let renderer, scene, camera, container, raf = 0, running = false;
  let stationMeshes = [], labels = [], fogs = [], hero = null, heroRig = null, marker = null;
  const cam = { tx: 50, tz: 47, yaw: 0, pitch: .95, dist: 95 };
  let onPick = null, opts = {};

  const P = id => new T.Vector3(STATIONS[id].x / S, 0, STATIONS[id].y / S);
  // 車站在某線的高度：高架或地下
  const hOn = (id, line) => (MRT.undergroundOn(id, line) ? H_UG : H_EL);

  function textSprite(text, { size = 46, color = '#1c2126', bg = 'rgba(255,255,255,.88)', bold = 700, dots = null, border = null } = {}) {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    const font = `${bold} ${size}px "Noto Sans TC", sans-serif`;
    g.font = font;
    const dw = dots ? dots.length * size * .5 + size * .25 : 0;
    const pad = 8, w = Math.ceil(g.measureText(text).width + size * .8 + dw) + pad * 2, h = Math.ceil(size * 1.5) + pad * 2;
    c.width = w; c.height = h;
    g.font = font;
    const r = (h - pad * 2) / 2.2, x0 = pad, y0 = pad, x1 = w - pad, y1 = h - pad;
    const path = () => { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x1, y0, x1, y1, r); g.arcTo(x1, y1, x0, y1, r); g.arcTo(x0, y1, x0, y0, r); g.arcTo(x0, y0, x1, y0, r); g.closePath(); };
    if (bg !== 'rgba(255,255,255,0)') { g.shadowColor = 'rgba(30,40,50,.28)'; g.shadowBlur = 8; g.shadowOffsetY = 2; }
    g.fillStyle = bg; path(); g.fill();
    g.shadowColor = 'transparent';
    if (border) { g.lineWidth = 4; g.strokeStyle = border; path(); g.stroke(); }
    let tx = x0 + size * .4;
    if (dots) dots.forEach((d, i) => { g.fillStyle = d; g.beginPath(); g.arc(tx + size * .22 + i * size * .5, h / 2, size * .2, 0, 7); g.fill(); });
    tx += dw;
    g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = 'left';
    if (bg === 'rgba(255,255,255,0)') { g.lineWidth = size * .16; g.strokeStyle = 'rgba(255,255,255,.85)'; g.strokeText(text, tx, h / 2 + 1); }
    g.fillText(text, tx, h / 2 + 1);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    sp.userData.aspect = w / h;
    sp.renderOrder = 10;
    return sp;
  }

  /* ── 地形 ── */
  // 河流（示意座標折線）
  const RIVERS = [
    { name: '淡水河', w: 2.4, pts: [[180, 20], [255, 55], [330, 75], [380, 120], [420, 200], [425, 300], [420, 380], [405, 470], [355, 545], [340, 600]] },
    { name: '新店溪', w: 1.9, pts: [[340, 600], [395, 640], [440, 690], [470, 760], [500, 830], [500, 880], [470, 910], [430, 960]] },
    { name: '基隆河', w: 1.7, pts: [[380, 120], [440, 150], [480, 230], [560, 270], [630, 300], [660, 265], [700, 250], [760, 250], [830, 255], [880, 265], [920, 300], [960, 320], [1000, 310]] },
    { name: '大漢溪', w: 1.7, pts: [[340, 600], [290, 640], [230, 700], [160, 760], [80, 830]] },
  ];
  const HILLS = [
    [560, 60, 14, 9], [650, 90, 16, 11], [740, 70, 12, 8], [470, 40, 10, 6], [820, 110, 10, 6],   // 陽明山
    [800, 900, 12, 6], [870, 860, 10, 5], [700, 950, 12, 5],                                          // 南邊丘陵
    [980, 560, 10, 6], [960, 690, 9, 5],                                                              // 東邊（南港山）
  ];

  // 沿曲線做一條平貼地面的帶子
  function ribbon(curve, width, y, n = 120) {
    const pos = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = curve.getPoint(t), tg = curve.getTangent(t);
      const nx = -tg.z, nz = tg.x, l = Math.hypot(nx, nz) || 1, w = width / 2 * (0.85 + 0.15 * Math.sin(t * 17));
      pos.push(p.x + nx / l * w, y, p.z + nz / l * w, p.x - nx / l * w, y, p.z - nz / l * w);
      if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  }
  const curveOf = pts => new T.CatmullRomCurve3(pts.map(([x, y]) => new T.Vector3(x / S, 0, y / S)), false, 'centripetal');
  // 公園綠地（示意座標，半徑）
  const PARKS = [[505, 470, 38], [585, 520, 26], [455, 395, 22], [430, 140, 30], [690, 450, 22], [345, 260, 26], [800, 640, 30], [255, 150, 26], [615, 690, 24]];

  function buildTerrain() {
    const g = new T.Group();
    // 地面：暖色紙張感，帶公園綠地、街廓細紋，邊緣淡出到天色
    const groundTex = (() => {
      const N = 1024, c = document.createElement('canvas'); c.width = c.height = N;
      const x = c.getContext('2d');
      const toPx = v => (v / S + 30) / 160 * N, rPx = r => r / S / 160 * N;   // 地面涵蓋 −30..130
      x.fillStyle = '#ece8da'; x.fillRect(0, 0, N, N);
      // 街廓格紋
      x.strokeStyle = 'rgba(160,150,125,.16)'; x.lineWidth = 1;
      for (let i = 0; i < N; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(N, i); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2.2;
      for (let i = 0; i < N; i += 60) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(N, i); x.stroke(); }
      // 公園
      for (const [px, py, r] of PARKS) {
        const gr = x.createRadialGradient(toPx(px), toPx(py), 0, toPx(px), toPx(py), rPx(r) * 1.2);
        gr.addColorStop(0, 'rgba(150,190,130,.9)'); gr.addColorStop(.75, 'rgba(160,198,140,.75)'); gr.addColorStop(1, 'rgba(160,198,140,0)');
        x.fillStyle = gr; x.beginPath(); x.arc(toPx(px), toPx(py), rPx(r) * 1.2, 0, 7); x.fill();
      }
      // 外圍淡出成丘陵綠
      const ed = x.createRadialGradient(N / 2, N / 2, N * .36, N / 2, N / 2, N * .72);
      ed.addColorStop(0, 'rgba(196,212,180,0)'); ed.addColorStop(1, 'rgba(196,212,180,1)');
      x.fillStyle = ed; x.fillRect(0, 0, N, N);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      return t;
    })();
    const ground = new T.Mesh(new T.PlaneGeometry(160, 160), new T.MeshStandardMaterial({ map: groundTex, transparent: true, opacity: .66, roughness: .95, depthWrite: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(50, H_GROUND, 50); ground.renderOrder = 1;
    g.add(ground);
    // 更外圈：一大片低矮綠地，讓鏡頭怎麼轉都不會看到地圖邊緣
    // 內緣做成漸層透明，和中間的地面自然接起來
    const ringTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 4; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(196,212,180,0)'); gr.addColorStop(.06, 'rgba(196,212,180,1)'); gr.addColorStop(1, 'rgba(196,212,180,1)'); x.fillStyle = gr; x.fillRect(0, 0, 256, 4); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
    const rg = new T.RingGeometry(64, 420, 64, 1), uv = rg.attributes.uv, rp = rg.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (Math.hypot(rp.getX(i), rp.getY(i)) - 64) / 356, .5);
    const outer = new T.Mesh(rg, new T.MeshStandardMaterial({ map: ringTex, transparent: true, roughness: 1, depthWrite: false }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(50, H_GROUND + .01, 50); outer.renderOrder = 1;
    g.add(outer);
    // 河流：平滑曲線＋淺色河岸
    const bankM = new T.MeshStandardMaterial({ color: '#cfe3e6', roughness: .9, transparent: true, opacity: .95, depthWrite: false, side: T.DoubleSide });
    const waterM = new T.MeshStandardMaterial({ color: '#5fa6cf', roughness: .2, metalness: .15, emissive: '#2c6e95', emissiveIntensity: .15, transparent: true, opacity: .95, depthWrite: false, side: T.DoubleSide });
    for (const r of RIVERS) {
      const cv = curveOf(r.pts);
      const bank = new T.Mesh(ribbon(cv, r.w * 1.9, .025), bankM); bank.renderOrder = 2; g.add(bank);
      const w = new T.Mesh(ribbon(cv, r.w * 1.15, .05), waterM); w.renderOrder = 3; g.add(w);
      const mid = cv.getPoint(.5);
      const lab = textSprite(r.name, { size: 34, color: '#1f5f86', bg: 'rgba(255,255,255,0)', bold: 700 });
      lab.position.set(mid.x + 2, .5, mid.z); lab.scale.set(3.2 * lab.userData.aspect / 3, 1.1, 1); lab.userData.river = true;
      g.add(lab);
    }
    // 山丘：起伏的低多邊形，依高度上色（山腳綠→山頂淺）
    for (const [x, y, r, h] of HILLS) {
      const geo = new T.IcosahedronGeometry(1, 3);
      const pos = geo.attributes.position, cols = [], c = new T.Color();
      for (let i = 0; i < pos.count; i++) {
        let vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
        const n = 1 + .18 * Math.sin(vx * 5 + x) * Math.cos(vz * 4 + y);
        vy = Math.max(0, vy) * n;
        pos.setXYZ(i, vx * r * .8 * n, vy * h * .8, vz * r * .65 * n);
        const k = Math.min(1, vy);
        c.setRGB(.36 + k * .2, .52 + k * .12, .32 + k * .14); cols.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
      m.position.set(x / S, -.15, y / S); m.rotation.y = x;
      g.add(m);
    }
    // 樹：公園與山腳
    const trees = [];
    let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (const [px, py, r] of PARKS) for (let i = 0; i < r / 2.2; i++) { const a = rnd() * 7, d = Math.sqrt(rnd()) * r * .85; trees.push([(px + Math.cos(a) * d) / S, (py + Math.sin(a) * d) / S, .5 + rnd() * .4]); }
    for (const [x, y, r] of HILLS) for (let i = 0; i < r * 1.6; i++) { const a = rnd() * 7, d = r * (1 + rnd() * .5); trees.push([x / S + Math.cos(a) * d, y / S + Math.sin(a) * d * .8, .6 + rnd() * .5]); }
    const treeM = new T.InstancedMesh(new T.ConeGeometry(.45, 1.3, 6), new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }), trees.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
    trees.forEach(([tx, tz, s], i) => {
      m4.compose(new T.Vector3(tx, .65 * s, tz), q, new T.Vector3(s, s, s)); treeM.setMatrixAt(i, m4);
      treeM.setColorAt(i, col.setHSL(.27 + (i % 5) * .015, .38, .34 + (i % 4) * .04));
    });
    g.add(treeM);
    // 地底的深色底板，讓地下段看起來在土裡
    const under = new T.Mesh(new T.PlaneGeometry(170, 170), new T.MeshBasicMaterial({ color: '#4a4640' }));
    under.rotation.x = -Math.PI / 2; under.position.set(50, H_UG - 1.2, 50);
    g.add(under);
    return g;
  }

  /* ── 地標與市區 ── */
  function landmarks() {
    const g = new T.Group();
    const at = (id, dx = 0, dz = 0) => new T.Vector3(STATIONS[id].x / S + dx, 0, STATIONS[id].y / S + dz);
    const part = (parent, mesh, y) => { mesh.position.y = y; parent.add(mesh); return mesh; };
    const add = (mesh, p, label) => { mesh.position.add(p); g.add(mesh); if (label) { const l = textSprite(label, { size: 38, color: '#5a3d1e', bg: 'rgba(255,246,226,.92)', bold: 700, border: 'rgba(190,150,90,.6)' }); l.position.copy(p); l.position.y = label.y || 0; l.scale.set(1 * l.userData.aspect, 1, 1); l.userData.landmark = true; g.add(l); return l; } };
    // 台北 101：一節一節往上收
    const t101 = new T.Group(), glassM = new T.MeshStandardMaterial({ color: '#6f9f9a', roughness: .25, metalness: .5 });
    part(t101, new T.Mesh(new T.BoxGeometry(2.6, 3, 2.6), glassM), 1.5);
    for (let i = 0; i < 8; i++) { const m = new T.Mesh(new T.CylinderGeometry(1.0, 1.25, 1.3, 4), glassM); m.rotation.y = Math.PI / 4; m.position.y = 3.6 + i * 1.3; t101.add(m); }
    const spire = new T.Mesh(new T.CylinderGeometry(.08, .2, 3, 6), new T.MeshStandardMaterial({ color: '#c9d2d6', metalness: .8, roughness: .3 })); spire.position.y = 15.4; t101.add(spire);
    const l101 = add(t101, at('台北101/世貿', 2.4, 1.6), '台北 101'); if (l101) l101.position.y = 18;
    // 台北車站：方形大屋頂
    const tms = new T.Group(); const wallM = new T.MeshStandardMaterial({ color: '#e8e2d2', roughness: .8 });
    part(tms, new T.Mesh(new T.BoxGeometry(5, 1.6, 4), wallM), .8);
    const roof = new T.Mesh(new T.CylinderGeometry(2.2, 3.4, 1.2, 4), new T.MeshStandardMaterial({ color: '#8a6a3a', roughness: .7 })); roof.rotation.y = Math.PI / 4; roof.position.y = 2.2; tms.add(roof);
    const lt = add(tms, at('台北車站', -2.8, -1.8), '台鐵台北車站'); if (lt) lt.position.y = 4.2;
    // 圓山大飯店：紅柱金黃屋頂
    const gh = new T.Group();
    part(gh, new T.Mesh(new T.BoxGeometry(4, 2.2, 1.6), new T.MeshStandardMaterial({ color: '#b3262b' })), 1.1);
    const ghRoof = new T.Mesh(new T.CylinderGeometry(1.2, 2.8, 1.2, 4, 1), new T.MeshStandardMaterial({ color: '#d9a62e' })); ghRoof.scale.z = .5; ghRoof.rotation.y = Math.PI / 4; ghRoof.position.y = 2.8; gh.add(ghRoof);
    const lg = add(gh, at('圓山', -3.6, -1.6), '圓山大飯店'); if (lg) lg.position.y = 5;
    // 台北小巨蛋
    const dome = new T.Mesh(new T.SphereGeometry(1.8, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: '#dfe5ea', roughness: .4, metalness: .3 })); dome.scale.set(1.3, .6, 1);
    const ld = add(dome, at('台北小巨蛋', 0, -2.4), '小巨蛋'); if (ld) ld.position.y = 2.6;
    // 國父紀念館：黃色飛簷
    const sy = new T.Group();
    part(sy, new T.Mesh(new T.BoxGeometry(3.2, 1.2, 3.2), new T.MeshStandardMaterial({ color: '#efe8d8' })), .6);
    const syRoof = new T.Mesh(new T.CylinderGeometry(1.2, 2.6, .9, 4), new T.MeshStandardMaterial({ color: '#e0b030' })); syRoof.rotation.y = Math.PI / 4; syRoof.position.y = 1.6; sy.add(syRoof);
    const ls = add(sy, at('國父紀念館', 0, 2.6), '國父紀念館'); if (ls) ls.position.y = 3.6;
    // 松山機場跑道
    const rw = new T.Mesh(new T.PlaneGeometry(26, 1.6), new T.MeshStandardMaterial({ color: '#5d6066', roughness: .9 })); rw.rotation.x = -Math.PI / 2;
    const lr = add(rw, at('松山機場', 6, -1.2).setY(.03), '松山機場'); if (lr) lr.position.y = 1.2;
    const dash = new T.Mesh(new T.PlaneGeometry(24, .12), new T.MeshBasicMaterial({ color: '#ffffff' })); dash.rotation.x = -Math.PI / 2; dash.position.copy(at('松山機場', 6, -1.2)).setY(.04); g.add(dash);
    // 淡水夕照碼頭、象山
    return g;
  }
  // 市區建築群：用路網密度決定高度，避開河流
  function cityBlocks() {
    const pts = Object.values(STATIONS).map(s => [s.x / S, s.y / S]);
    const nearRiver = (x, z) => RIVERS.some(r => r.pts.some((p, i) => {
      if (!r.pts[i + 1]) return false;
      const ax = p[0] / S, az = p[1] / S, bx = r.pts[i + 1][0] / S, bz = r.pts[i + 1][1] / S;
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
      return Math.hypot(x - (ax + t * (bx - ax)), z - (az + t * (bz - az))) < r.w * .9 + .6;
    }));
    const list = [];
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let x = 4; x < 98; x += 1.6) for (let z = 4; z < 92; z += 1.6) {
      let dmin = 1e9, dens = 0;
      for (const [px, pz] of pts) { const d = Math.hypot(px - x, pz - z); dmin = Math.min(dmin, d); if (d < 8) dens++; }
      if (dmin < 2.2 || dmin > 8 || nearRiver(x, z) || rnd() < .55) continue;
      const h = .25 + Math.min(1.4, dens * .07) * (.4 + rnd());
      list.push([x + (rnd() - .5) * .6, z + (rnd() - .5) * .6, .8 + rnd() * .6, h]);
    }
    const inst = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: '#ffffff', roughness: .8 }), list.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
    list.forEach(([x, z, w, h], i) => {
      m4.compose(new T.Vector3(x, h / 2, z), q, new T.Vector3(w, h, w * (.8 + (i % 3) * .15)));
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, col.setHSL([.08, .58, .1, .55, .05][i % 5], .1 + (i % 3) * .05, .7 + (i % 4) * .04));
    });
    return inst;
  }

  /* ── 路線 ── */
  let lineMeshes = {};
  function buildLines() {
    const g = new T.Group();
    const done = new Set();
    lineMeshes = {};
    for (const lid of LINE_ORDER) {
      const L = LINES[lid];
      lineMeshes[lid] = [];
      const mat = new T.MeshStandardMaterial({ color: L.color, roughness: .35, metalness: .05, emissive: L.color, emissiveIntensity: .22 });
      const ugMat = new T.MeshStandardMaterial({ color: L.color, roughness: .5, emissive: L.color, emissiveIntensity: .7 });
      const pierM = new T.MeshStandardMaterial({ color: '#b9b6ad', roughness: .9 });
      const deckM = new T.MeshStandardMaterial({ color: '#e9e6dd', roughness: .8 });
      for (const route of LINES[lid].routes) {
        for (let i = 0; i < route.length - 1; i++) {
          const a = route[i][0], b = route[i + 1][0];
          const key = lid + ':' + [a, b].sort().join('|');
          if (done.has(key)) continue; done.add(key);
          const pa = P(a), pb = P(b);
          const ha = hOn(a, lid), hb = hOn(b, lid);
          pa.y = ha; pb.y = hb;
          // 高架↔地下：在中段用坡道銜接
          const pts = [pa];
          if (ha !== hb) {
            const m1 = pa.clone().lerp(pb, .35); m1.y = ha;
            const m2 = pa.clone().lerp(pb, .65); m2.y = hb;
            pts.push(m1, m2);
          }
          pts.push(pb);
          for (let k = 0; k < pts.length - 1; k++) {
            const s0 = pts[k], s1 = pts[k + 1];
            const len = s0.distanceTo(s1);
            const ug = s0.y < 0 && s1.y < 0;
            const mid = s0.clone().add(s1).multiplyScalar(.5), dir = s1.clone().sub(s0).normalize();
            const tube = new T.Mesh(new T.CylinderGeometry(.55, .55, len, 14, 1), ug ? ugMat : mat);
            tube.position.copy(mid); tube.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
            g.add(tube);
            lineMeshes[lid].push(tube);
            // 關節圓球，讓轉彎處圓滑
            const joint = new T.Mesh(new T.SphereGeometry(.55, 14, 10), ug ? ugMat : mat); joint.position.copy(s1); g.add(joint); lineMeshes[lid].push(joint);
            if (!ug) {
              // 高架：白色軌道梁墊在下面，像真的高架橋
              const deck = new T.Mesh(new T.BoxGeometry(1.5, .22, len + .4), deckM);
              deck.position.copy(mid).add(new T.Vector3(0, -.55, 0));
              deck.lookAt(s1.clone().add(new T.Vector3(0, -.55, 0)));
              g.add(deck); lineMeshes[lid].push(deck);
            } else {
              const halo = new T.Mesh(new T.CylinderGeometry(.85, .85, len, 12, 1, true), new T.MeshBasicMaterial({ color: L.color, transparent: true, opacity: .16, depthWrite: false }));
              halo.position.copy(mid); halo.quaternion.copy(tube.quaternion); g.add(halo); lineMeshes[lid].push(halo);
            }
            // 高架段的橋墩
            if (s0.y > 0 && s1.y > 0) {
              const n = Math.max(1, Math.floor(len / 2.2));
              for (let j = 1; j <= n; j++) {
                const p = s0.clone().lerp(s1, j / (n + 1));
                const pier = new T.Mesh(new T.CylinderGeometry(.16, .22, p.y - .6, 8), pierM);
                pier.position.set(p.x, (p.y - .6) / 2, p.z);
                g.add(pier);
              }
            }
          }
        }
      }
    }
    return g;
  }

  /* ── 隱藏地圖：圓山與劍潭之間，一個未登錄的「霧」站 ── */
  function ghostMarker() {
    const a = P('圓山'), b = P('劍潭'), p = a.clone().lerp(b, .5); p.x += 1.2;
    const g = new T.Group();
    const st = new T.Mesh(new T.CylinderGeometry(.7, .7, .5, 20), new T.MeshStandardMaterial({ color: '#e9e7f0', emissive: '#9fe0c8', emissiveIntensity: .6, transparent: true, opacity: .7 }));
    st.position.set(p.x, .6, p.z); g.add(st);
    const lab = textSprite('霧（未登錄）', { size: 40, color: '#2a5a4a', bg: 'rgba(220,245,235,.85)' }); lab.position.set(p.x, 2.2, p.z); lab.scale.set(1.1 * lab.userData.aspect, 1.1, 1); g.add(lab);
    return g;
  }

  /* ── 車站 ── */
  function buildStations() {
    const g = new T.Group();
    stationMeshes = []; labels = []; fogs = [];
    const visited = opts.visited || {};
    const fogTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, 'rgba(235,240,244,.95)'); gr.addColorStop(.6, 'rgba(225,232,238,.55)'); gr.addColorStop(1, 'rgba(225,232,238,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
      return new T.CanvasTexture(c);
    })();
    for (const id in STATIONS) {
      const lines = MRT.linesAt(id);
      const transfer = lines.length > 1;
      const p = P(id);
      // 有多條線經過時取最高的高度（高架在上）
      const h = Math.max(...lines.map(l => hOn(id, l.line)));
      const grp = new T.Group(); grp.position.set(p.x, h, p.z);
      const r = transfer ? .95 : .62;
      const body = new T.Mesh(new T.CylinderGeometry(r, r * 1.08, .6, 28), new T.MeshStandardMaterial({ color: '#ffffff', roughness: .3, emissive: '#ffffff', emissiveIntensity: .15 }));
      const ring = new T.Mesh(new T.TorusGeometry(r, .17, 10, 32), new T.MeshStandardMaterial({ color: transfer ? '#22282e' : LINES[lines[0].line].color, roughness: .35 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = .3;
      grp.add(body, ring);
      // 轉乘站：上面一圈各線顏色的小點
      if (transfer) lines.forEach((l, i) => {
        const a = i / lines.length * Math.PI * 2, dot = new T.Mesh(new T.CylinderGeometry(.22, .22, .12, 14), new T.MeshStandardMaterial({ color: LINES[l.line].color, emissive: LINES[l.line].color, emissiveIntensity: .25 }));
        dot.position.set(Math.cos(a) * .45, .34, Math.sin(a) * .45); grp.add(dot);
      });
      body.userData.stationId = id;
      stationMeshes.push(body);
      // 地下站：往地面拉一根細柱（出入口）
      if (h < 0) {
        const shaft = new T.Mesh(new T.CylinderGeometry(.18, .18, -h, 8), new T.MeshStandardMaterial({ color: '#6c7178', transparent: true, opacity: .6 }));
        shaft.position.y = -h / 2; grp.add(shaft);
      }
      const zh = lines.map(l => MRT.label(id, l.line).zh).filter((v, i, a) => a.indexOf(v) === i).join('/');
      const lab = textSprite(zh, { size: transfer ? 50 : 42, bold: transfer ? 900 : 700, dots: [...new Set(lines.map(l => LINES[l.line].color))], border: id === opts.current ? '#ff4b6e' : null });
      lab.position.set(0, (h < 0 ? -h : 0) + 1.6, 0);
      const sh = transfer ? 1.35 : 1.05;
      lab.scale.set(sh * lab.userData.aspect, sh, 1);
      lab.userData = { ...lab.userData, transfer, id, base: sh };
      grp.add(lab); labels.push(lab);
      g.add(grp);
      // 迷霧：還沒去過的車站
      if (!visited[id] && id !== opts.current) {
        for (let k = 0; k < 2; k++) {
          const f = new T.Sprite(new T.SpriteMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: .75 }));
          const s = 5 + Math.random() * 3;
          f.scale.set(s, s * .7, 1);
          f.position.set(p.x + (Math.random() - .5) * 2, 2.4 + k * .8, p.z + (Math.random() - .5) * 2);
          f.userData = { ox: f.position.x, oz: f.position.z, ph: Math.random() * 6 };
          f.renderOrder = 8;
          g.add(f); fogs.push(f);
        }
        lab.material.opacity = .45;
      }
    }
    return g;
  }

  function placeHero() {
    if (!opts.current || !STATIONS[opts.current]) return;
    const id = opts.current;
    const lines = MRT.linesAt(id);
    const h = Math.max(...lines.map(l => hOn(id, l.line)));
    const p = P(id);
    if (opts.char) {
      heroRig = Human3D.build(opts.char);
      hero = heroRig.root; hero.scale.setScalar(1.6);
      hero.position.set(p.x + .9, Math.max(h, 0) + .25, p.z + .6);
      scene.add(hero);
    }
    marker = new T.Group();
    const pin = new T.Mesh(new T.ConeGeometry(.5, 1.4, 16), new T.MeshStandardMaterial({ color: '#ff4b6e', emissive: '#ff4b6e', emissiveIntensity: .4 }));
    pin.rotation.x = Math.PI; pin.position.y = .7;
    const ballM = new T.Mesh(new T.SphereGeometry(.45, 16, 12), new T.MeshStandardMaterial({ color: '#ff4b6e', emissive: '#ff4b6e', emissiveIntensity: .4 }));
    ballM.position.y = 1.6;
    marker.add(pin, ballM);
    marker.position.set(p.x, Math.max(h, 0) + 2.8, p.z);
    scene.add(marker);
  }

  let sky = null;
  function skyTex() {
    if (sky) return sky;
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#9cc6e4'); gr.addColorStop(.55, '#d7e8f1'); gr.addColorStop(1, '#f3efe4');
    x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
    sky = new T.CanvasTexture(c); sky.colorSpace = T.SRGBColorSpace;
    return sky;
  }

  /* ── 鏡頭與操作 ── */
  function updateCamera() {
    const { tx, tz, yaw, pitch, dist } = cam;
    camera.position.set(tx + Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, tz + Math.cos(yaw) * Math.cos(pitch) * dist);
    camera.lookAt(tx, 0, tz);
  }
  function pan(dx, dy) {
    const k = cam.dist * .0016;
    const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw);
    cam.tx += (-dx * Math.cos(cam.yaw) - dy * fx) * k * 1.0;
    cam.tz += (dx * Math.sin(cam.yaw) - dy * fz) * k * 1.0;
    cam.tx = Math.min(110, Math.max(-10, cam.tx)); cam.tz = Math.min(105, Math.max(-5, cam.tz));
  }
  const zoom = f => { cam.dist = Math.min(150, Math.max(12, cam.dist * f)); };

  function bind() {
    const el = renderer.domElement;
    const ptrs = new Map();
    let mode = null, moved = false, last = null, pinch = null;
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = false;
      mode = ptrs.size === 2 ? 'pinch' : (e.button === 2 || e.shiftKey ? 'rotate' : 'pan');
      last = { x: e.clientX, y: e.clientY };
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x) };
      }
    });
    el.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === 'pinch' && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
        if (pinch) { zoom(pinch.d / d); cam.yaw -= (ang - pinch.ang); }
        pinch = { d, ang }; moved = true;
        return;
      }
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      if (mode === 'rotate') { cam.yaw -= dx * .006; cam.pitch = Math.min(1.45, Math.max(.35, cam.pitch + dy * .004)); }
      else if (mode === 'pan') pan(dx, dy);
      last = { x: e.clientX, y: e.clientY };
    });
    const up = e => {
      ptrs.delete(e.pointerId);
      if (!moved && mode === 'pan') pick(e);
      if (ptrs.size < 2) pinch = null;
      if (!ptrs.size) mode = null;
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  }

  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(stationMeshes, false)[0];
    if (hit && onPick) onPick(hit.object.userData.stationId);
  }

  function frame(t) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const w = container.clientWidth, h = container.clientHeight;
    if (renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) || renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    }
    updateCamera();
    // 標籤：遠時只顯示轉乘站
    for (const l of labels) {
      const show = l.userData.transfer || cam.dist < 60;
      l.visible = show;
      const k = Math.min(1.6, Math.max(.7, cam.dist / 60));
      l.scale.set(l.userData.base * k * l.userData.aspect, l.userData.base * k, 1);
    }
    for (const f of fogs) {
      const u = f.userData;
      f.position.x = u.ox + Math.sin(t / 2400 + u.ph) * .6;
      f.position.z = u.oz + Math.cos(t / 3100 + u.ph) * .5;
    }
    if (marker) { marker.position.y += Math.sin(t / 300) * .006; marker.rotation.y = t / 900; }
    if (opts.compass) opts.compass.style.transform = `rotate(${cam.yaw}rad)`;
    if (heroRig) heroRig.update(.016, 0, t / 1000);
    renderer.render(scene, camera);
  }

  return {
    open(el, o = {}) {
      container = el; opts = o; onPick = o.onPick || null;
      if (!renderer) {
        renderer = new T.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.domElement.className = 'map3d-canvas';
        camera = new T.PerspectiveCamera(42, 1, .5, 600);
        bind();
      }
      el.appendChild(renderer.domElement);
      // 每次打開都依目前進度重建（迷霧、位置）
      if (scene) scene.traverse(x => { if (x.geometry) x.geometry.dispose(); });
      scene = new T.Scene();
      scene.background = skyTex();
      scene.fog = new T.Fog('#dfeaf0', 140, 300);
      scene.add(new T.HemisphereLight('#f4fbff', '#9a9580', 1.35));
      const d = new T.DirectionalLight('#fff2dc', 1.9); d.position.set(-40, 90, 30); scene.add(d);
      const d2 = new T.DirectionalLight('#cfe2ff', .5); d2.position.set(60, 40, -50); scene.add(d2);
      scene.add(buildTerrain());
      scene.add(cityBlocks());
      scene.add(landmarks());
      scene.add(buildLines());
      scene.add(buildStations());
      if (o.hiddenMap) scene.add(ghostMarker());
      hero = heroRig = marker = null;
      placeHero();
      this._solo = null;
      if (o.current && STATIONS[o.current]) this.focus(o.current, 45);
      running = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
    close() { running = false; cancelAnimationFrame(raf); },
    focus(id, dist = 40) { const p = P(id); cam.tx = p.x; cam.tz = p.z; cam.dist = dist; },
    overview() { cam.tx = 50; cam.tz = 47; cam.dist = 95; cam.yaw = 0; cam.pitch = .95; },
    rotate(a) { cam.yaw += a; },
    // 只看某一條線（其他變淡）；再按一次恢復
    focusLine(lid) {
      const solo = lid && lid !== this._solo ? lid : null;
      this._solo = solo;
      for (const id in lineMeshes) for (const m of lineMeshes[id]) {
        m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = !solo || id === solo ? 1 : .12;
      }
      if (solo) {
        const ids = [...new Set(LINES[solo].routes.flat().map(r => r[0]))];
        const xs = ids.map(i => STATIONS[i].x / S), zs = ids.map(i => STATIONS[i].y / S);
        cam.tx = (Math.min(...xs) + Math.max(...xs)) / 2; cam.tz = (Math.min(...zs) + Math.max(...zs)) / 2;
        cam.dist = Math.max(40, Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) * 1.4);
      }
      return solo;
    },
    zoom(f) { zoom(f); },
  };
})();
