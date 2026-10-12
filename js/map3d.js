/* 台北捷運全路網 3D 地圖
 *  - 6 條路線、118 站；高架段架高在橋墩上，地下段在半透明地面之下，交界處以坡道銜接
 *  - 淡水河、基隆河、新店溪、大漢溪與西北邊的台灣海峽；北邊陽明山、南邊貓空丘陵、東南象山
 *  - 地標：台北 101、台北車站、新光摩天大樓、總統府、中正紀念堂、國父紀念館、小巨蛋、圓山大飯店、
 *          美麗華摩天輪、松山機場、關渡大橋、漁人碼頭情人橋、貓空纜車、北投溫泉；高架線跨河處有橋
 *  - 會動的：各線列車、飄過的雲、河面波光、摩天輪、纜車、起飛的飛機、渡輪、溫泉熱氣
 *  - 天色跟著台灣時間（白天／清晨／黃昏／夜晚）；夜裡窗戶亮燈、路線發光；00:30–06:00 列車停駛
 *  - 還沒去過的車站被霧蓋住，去過就散開；目前位置站著自己的角色
 *  - 操作：拖曳平移、滾輪／雙指縮放、右鍵拖曳或雙指旋轉；點車站看資訊
 * 效能：靜態地標、山、河、路線依材質合併成少數網格；共用材質；不開陰影、不加燈
 * 座標：路網示意座標 (x, y) 0–1000 → 3D (x/10, 高度, y/10)
 */
const Map3D = (() => {
  const T = THREE;
  const S = 10;                       // 座標縮放
  const H_EL = 1.6, H_UG = -1.4, H_GROUND = 0;
  let renderer, scene, camera, container, raf = 0, running = false;
  let stationMeshes = [], labels = [], fogs = [], hero = null, heroRig = null, marker = null;
  let lmLabels = [], live = null, look = null, solo = null, lastT = 0, R = {};
  const cam = { tx: 50, tz: 47, yaw: 0, pitch: .95, dist: 95 };
  let onPick = null, opts = {};

  const P = id => new T.Vector3(STATIONS[id].x / S, 0, STATIONS[id].y / S);
  // 車站在某線的高度：高架或地下
  const hOn = (id, line) => (MRT.undergroundOn(id, line) ? H_UG : H_EL);
  const UP = new T.Vector3(0, 1, 0);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const rng = seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

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
  const canvasTex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace; return t; };
  const puffTex = () => canvasTex(64, 64, (x) => { const gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.6, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });

  /* ── 合併工具：很多小零件 → 一個網格（同材質、頂點色），一次畫完 ── */
  function Merger(colored = true) {
    const pos = [], nor = [], col = [], idx = [];
    const base = new T.Matrix4(), m = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), c3 = new T.Color(), o = new T.Object3D();
    const api = {
      at(x = 0, y = 0, z = 0, ry = 0, s = 1) { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.setScalar(s); o.updateMatrix(); base.copy(o.matrix); return api; },
      add(geo, c, x = 0, y = 0, z = 0, { rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
        o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix();
        return api.addM(geo, c, m.multiplyMatrices(base, o.matrix));
      },
      // 兩點之間的細長方塊（纜線、吊索、斜撐），a、b 在目前座標系
      beam(a, b, th, c) {
        const d = new T.Vector3().subVectors(b, a), len = d.length();
        o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(UP, d.divideScalar(len || 1)); o.scale.set(1, 1, 1); o.updateMatrix();
        return api.addM(new T.BoxGeometry(th, len, th), c, m.multiplyMatrices(base, o.matrix));
      },
      addM(geo, c, mat) {
        const p = geo.attributes.position, n = geo.attributes.normal, o0 = pos.length / 3;
        nm.getNormalMatrix(mat); if (colored) c3.set(c);
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(mat); pos.push(v.x, v.y, v.z);
          if (n) { v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); } else nor.push(0, 1, 0);
          if (colored) col.push(c3.r, c3.g, c3.b);
        }
        if (geo.index) { const a = geo.index.array; for (let i = 0; i < a.length; i++) idx.push(o0 + a[i]); }
        else for (let i = 0; i < p.count; i++) idx.push(o0 + i);
        geo.dispose();
        return api;
      },
      build() {
        if (!pos.length) return null;
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
        if (colored) g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
        g.setIndex(idx); g.computeBoundingSphere();
        return g;
      },
      mesh(mat) { const g = api.build(); return g ? new T.Mesh(g, mat) : null; },
    };
    return api;
  }
  const box = (w, h, d) => new T.BoxGeometry(w, h, d);
  const cyl = (rt, rb, h, n = 10, hs = 1) => new T.CylinderGeometry(rt, rb, h, n, hs);
  // 有弧度的屋頂（四坡或八角），中段往內收，像飛簷
  function roofG(hx, hz, h, top = .35, sag = .85, sides = 4) {
    const r = sides === 4 ? Math.SQRT2 : 1;
    const g = new T.CylinderGeometry(r * top, r, h, sides, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i)) < 1e-4) p.setXYZ(i, p.getX(i) * sag, 0, p.getZ(i) * sag);
    g.rotateY(Math.PI / sides); g.scale(hx, 1, hz); g.computeVertexNormals();
    return g;
  }

  /* ── 地形 ── */
  // 河流（示意座標折線）
  const RIVERS = [
    { name: '淡水河', w: 2.4, pts: [[180, 20], [255, 55], [330, 75], [380, 120], [420, 200], [425, 300], [420, 380], [405, 470], [355, 545], [340, 600]] },
    { name: '新店溪', w: 1.9, pts: [[340, 600], [395, 640], [440, 690], [470, 760], [500, 830], [500, 880], [470, 910], [430, 960]] },
    { name: '基隆河', w: 1.7, pts: [[380, 120], [440, 150], [480, 230], [560, 270], [630, 300], [660, 265], [700, 250], [760, 250], [830, 255], [880, 265], [920, 300], [960, 320], [1000, 310]] },
    { name: '大漢溪', w: 1.7, pts: [[340, 600], [290, 640], [230, 700], [160, 760], [80, 830]] },
  ];
  // 海岸線（3D 座標，由西南到東北）：淡水河口外是台灣海峽
  const COAST = [[-260, 95], [-200, 80], [-120, 52], [-60, 34], [-30, 25], [-15, 20], [-4, 15.5], [6, 10.5], [13, 6.5], [17.5, 3.4], [19.8, 1.0], [21.8, -1.6], [25, -4.8], [30, -8], [38, -12.5], [50, -17], [65, -21], [90, -30], [130, -45], [220, -70]];
  const coastZ = x => { for (let i = 0; i < COAST.length - 1; i++) { const [ax, az] = COAST[i], [bx, bz] = COAST[i + 1]; if (x >= ax && x <= bx) return az + (bz - az) * (x - ax) / (bx - ax); } return -999; };
  const inSea = (x, z, m = 0) => z < coastZ(x) + m;
  // 山丘 [x, y, 半徑, 高, 名稱]
  const HILLS = [
    [575, 20, 14, 10], [655, 62, 15, 10], [745, 55, 12, 8], [455, -10, 11, 8], [830, 100, 10, 6], [615, -40, 15, 14, '陽明山'],   // 陽明山、大屯山、七星山
    [800, 905, 12, 6], [880, 865, 10, 5.5], [700, 960, 12, 5],                                                               // 南邊丘陵（貓空）
    [990, 560, 10, 6], [985, 705, 9, 5], [915, 684, 5.2, 4.4, '象山'],                                                       // 南港山、四獸山、象山
    [552, 292, 4.2, 1.7],                                                                                                    // 圓山（大飯店）
  ];
  // 公園綠地（示意座標，半徑）
  const PARKS = [[505, 470, 38], [585, 520, 26], [455, 395, 22], [430, 140, 30], [690, 450, 22], [345, 260, 26], [800, 640, 30], [255, 150, 26], [615, 690, 24], [790, 540, 20], [628, 605, 20]];

  const curveOf = pts => new T.CatmullRomCurve3(pts.map(([x, y]) => new T.Vector3(x / S, 0, y / S)), false, 'centripetal');
  let riverPl = [], segs = [];
  // 點到線段距離（2D）
  const segD = (x, z, s) => { const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (z - s[1]) * dz) / l2)); return Math.hypot(x - s[0] - t * dx, z - s[1] - t * dz); };
  const lineDist = (x, z, list = segs) => { let d = 1e9; for (const s of list) d = Math.min(d, segD(x, z, s)); return d; };
  function nearRiver(x, z, pad = .6) {
    for (const { r, pl } of riverPl) for (let i = 0; i < pl.length - 1; i += 2) { const a = pl[i], b = pl[Math.min(pl.length - 1, i + 2)]; if (segD(x, z, [a.x, a.z, b.x, b.z]) < r.w * .9 + pad) return true; }
    return false;
  }
  // 河上離某點最近的位置與流向
  function riverAt(name, x, z) {
    const { r, pl } = riverPl.find(o => o.r.name === name);
    let bi = 0, bd = 1e9; pl.forEach((p, i) => { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; bi = i; } });
    const a = pl[Math.max(0, bi - 1)], b = pl[Math.min(pl.length - 1, bi + 1)], tg = new T.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    return { p: pl[bi].clone(), tg, w: r.w };
  }
  // 山的高度（解析近似，與網格一致）：放建築、纜車、樹用
  function hillY(x, z) {
    let best = -1;
    for (const [hx, hy, r, h] of HILLS) {
      const dx = x - hx / S, dz = z - hy / S, cs = Math.cos(hx), sn = Math.sin(hx);
      let ux = (dx * cs - dz * sn) / (r * .8), uz = (dx * sn + dz * cs) / (r * .65);
      if (ux * ux + uz * uz > 1.6) continue;
      const n = 1 + .18 * Math.sin(ux * 5 + hx) * Math.cos(uz * 4 + hy); ux /= n; uz /= n;
      const d2 = ux * ux + uz * uz; if (d2 >= 1) continue;
      best = Math.max(best, Math.sqrt(1 - d2) * n * h * .8 * smooth(1.3, 3.6, lineDist(x, z)) - .15);
    }
    return best;
  }

  // 沿曲線做一條平貼地面的帶子（三角形直接寫進 sink）
  function ribbon(sink, curve, width, y, color, wob = true) {
    const n = Math.max(40, Math.round(curve.getLength() * 1.6)), c = new T.Color(color);
    let prev = null, u = 0, last = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = curve.getPoint(t), tg = curve.getTangent(t);
      if (last) u += p.distanceTo(last) / 4; last = p;
      const nx = -tg.z, nz = tg.x, l = Math.hypot(nx, nz) || 1, w = width / 2 * (wob ? .85 + .15 * Math.sin(t * 17) : 1);
      const cur = [p.x + nx / l * w, p.z + nz / l * w, p.x - nx / l * w, p.z - nz / l * w, u];
      if (prev) {
        const q = [[prev[0], prev[1], prev[4], 0], [cur[0], cur[1], u, 0], [prev[2], prev[3], prev[4], 1], [prev[2], prev[3], prev[4], 1], [cur[0], cur[1], u, 0], [cur[2], cur[3], u, 1]];
        for (const [x, z, uu, vv] of q) { sink.P.push(x, y, z); sink.U.push(uu, vv); sink.C.push(c.r, c.g, c.b); }
      }
      prev = cur;
    }
  }
  const sinkMesh = (sink, mat) => {
    const g = new T.BufferGeometry(), n = sink.P.length / 3;
    g.setAttribute('position', new T.Float32BufferAttribute(sink.P, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(new Array(n).fill(0).flatMap(() => [0, 1, 0]), 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(sink.U, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(sink.C, 3));
    return new T.Mesh(g, mat);
  };

  function buildTerrain() {
    const g = new T.Group();
    // 地面：暖色紙張感，帶公園綠地、街廓細紋，邊緣淡出到天色
    const groundTex = canvasTex(1024, 1024, (x, N) => {
      const toPx = v => (v / S + 30) / 160 * N, rPx = r => r / S / 160 * N;   // 地面涵蓋 −30..130
      x.fillStyle = '#ece8da'; x.fillRect(0, 0, N, N);
      x.strokeStyle = 'rgba(160,150,125,.16)'; x.lineWidth = 1;
      for (let i = 0; i < N; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(N, i); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2.2;
      for (let i = 0; i < N; i += 60) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(N, i); x.stroke(); }
      for (const [px, py, r] of PARKS) {
        const gr = x.createRadialGradient(toPx(px), toPx(py), 0, toPx(px), toPx(py), rPx(r) * 1.2);
        gr.addColorStop(0, 'rgba(150,190,130,.9)'); gr.addColorStop(.75, 'rgba(160,198,140,.75)'); gr.addColorStop(1, 'rgba(160,198,140,0)');
        x.fillStyle = gr; x.beginPath(); x.arc(toPx(px), toPx(py), rPx(r) * 1.2, 0, 7); x.fill();
      }
      const ed = x.createRadialGradient(N / 2, N / 2, N * .36, N / 2, N / 2, N * .72);
      ed.addColorStop(0, 'rgba(196,212,180,0)'); ed.addColorStop(1, 'rgba(196,212,180,1)');
      x.fillStyle = ed; x.fillRect(0, 0, N, N);
    });
    groundTex.anisotropy = 8;
    const ground = new T.Mesh(new T.PlaneGeometry(160, 160), new T.MeshStandardMaterial({ map: groundTex, transparent: true, opacity: .66, roughness: .95, depthWrite: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(50, H_GROUND, 50); ground.renderOrder = 1;
    g.add(ground);
    // 更外圈：一大片低矮綠地，內緣漸層透明
    const ringTex = canvasTex(256, 4, x => { const gr = x.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(196,212,180,0)'); gr.addColorStop(.06, 'rgba(196,212,180,1)'); gr.addColorStop(1, 'rgba(196,212,180,1)'); x.fillStyle = gr; x.fillRect(0, 0, 256, 4); });
    const rg = new T.RingGeometry(64, 420, 64, 1), uv = rg.attributes.uv, rp = rg.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (Math.hypot(rp.getX(i), rp.getY(i)) - 64) / 356, .5);
    const outer = new T.Mesh(rg, new T.MeshStandardMaterial({ map: ringTex, transparent: true, roughness: 1, depthWrite: false }));
    outer.rotation.x = -Math.PI / 2; outer.position.set(50, H_GROUND + .01, 50); outer.renderOrder = 1;
    g.add(outer);

    // 河流＋海：全部合併成「河岸」「水面」兩個網格；水面貼一張會流動的波紋
    const bank = { P: [], U: [], C: [] }, water = { P: [], U: [], C: [] };
    for (const r of RIVERS) {
      const cv = curveOf(r.pts);
      ribbon(bank, cv, r.w * 1.9, .025, '#cfe3e6');
      ribbon(water, cv, r.w * 1.15, .05, '#ffffff');
      const mid = cv.getPoint(.5);
      const lab = textSprite(r.name, { size: 34, color: '#1f5f86', bg: 'rgba(255,255,255,0)', bold: 700 });
      lab.position.set(mid.x + 2, .5, mid.z); lab.scale.set(3.2 * lab.userData.aspect / 3, 1.1, 1); lab.userData.river = true;
      g.add(lab);
    }
    ribbon(bank, new T.CatmullRomCurve3(COAST.map(([x, z]) => new T.Vector3(x, 0, z))), 1.6, .03, '#eadfbd', false);   // 沙灘
    const seaShape = new T.Shape([...COAST.map(([x, z]) => new T.Vector2(x, -z)), new T.Vector2(300, 260), new T.Vector2(-300, 260)]);
    const sea = new T.ShapeGeometry(seaShape).toNonIndexed(); sea.rotateX(-Math.PI / 2);
    const sp = sea.attributes.position;
    for (let i = 0; i < sp.count; i++) { water.P.push(sp.getX(i), .055, sp.getZ(i)); water.U.push(sp.getX(i) / 4, sp.getZ(i) / 4); water.C.push(.92, .97, 1); }
    const seaLab = textSprite('台灣海峽', { size: 34, color: '#1f5f86', bg: 'rgba(255,255,255,0)', bold: 700 });
    seaLab.position.set(-2, .6, -6); seaLab.scale.set(1.2 * seaLab.userData.aspect, 1.2, 1); g.add(seaLab);
    const bankMesh = sinkMesh(bank, new T.MeshStandardMaterial({ vertexColors: true, roughness: .9, transparent: true, opacity: .95, depthWrite: false, side: T.DoubleSide }));
    bankMesh.renderOrder = 2; g.add(bankMesh);
    const waveTex = canvasTex(128, 64, (x, w, h) => {
      x.fillStyle = 'rgb(222,233,241)'; x.fillRect(0, 0, w, h);
      const rr = rng(5);
      for (let i = 0; i < 70; i++) { const lit = rr() < .55; x.fillStyle = lit ? 'rgba(255,255,255,.95)' : 'rgba(178,200,218,.8)'; x.beginPath(); x.ellipse(rr() * w, rr() * h, 4 + rr() * 10, .8 + rr() * 1.2, 0, 0, 7); x.fill(); }
    });
    waveTex.wrapS = waveTex.wrapT = T.RepeatWrapping;
    R.waterMat = new T.MeshStandardMaterial({ color: '#5fa6cf', map: waveTex, emissiveMap: waveTex, vertexColors: true, roughness: .2, metalness: .15, emissive: '#2c6e95', emissiveIntensity: .15, transparent: true, opacity: .95, depthWrite: false, side: T.DoubleSide });
    const waterMesh = sinkMesh(water, R.waterMat); waterMesh.renderOrder = 3; g.add(waterMesh);

    // 山丘：起伏的低多邊形，依高度上色（山腳綠→山頂淺；陽明山頂秋天的芒草），靠近路線的地方挖出山谷，不會埋住車站
    const HP = [], HC = [], c = new T.Color(), grass = new T.Color('#cfc08c');
    for (const [x, y, r, h] of HILLS) {
      const geo = new T.IcosahedronGeometry(1, r >= 9 ? 3 : 2), p = geo.attributes.position;
      const cx = x / S, cz = y / S, cs = Math.cos(x), sn = Math.sin(x);
      const near = segs.filter(s => segD(cx, cz, s) < r + 4);
      const tmp = [], tc = [];
      for (let i = 0; i < p.count; i++) {
        const vx = p.getX(i), vz = p.getZ(i); let vy = p.getY(i);
        const n = 1 + .18 * Math.sin(vx * 5 + x) * Math.cos(vz * 4 + y);
        const lx = vx * r * .8 * n, lz = vz * r * .65 * n;
        const wx = cx + lx * cs + lz * sn, wz = cz - lx * sn + lz * cs;
        const k = near.length ? smooth(1.3, 3.6, lineDist(wx, wz, near)) : 1;
        vy = Math.max(0, vy) * n * k;
        tmp.push(wx, vy * h * .8 - .15, wz);
        const kk = Math.min(1, vy);
        c.setRGB(.36 + kk * .2, .52 + kk * .12, .32 + kk * .14);
        if (h >= 9 && kk > .55) c.lerp(grass, (kk - .55) * 1.2);
        tc.push(c.r, c.g, c.b);
      }
      for (let f = 0; f < p.count; f += 3) {
        if (tmp[f * 3 + 1] < -.14 && tmp[f * 3 + 4] < -.14 && tmp[f * 3 + 7] < -.14) continue;   // 埋在地下的底面不要
        for (let j = 0; j < 3; j++) { HP.push(tmp[(f + j) * 3], tmp[(f + j) * 3 + 1], tmp[(f + j) * 3 + 2]); HC.push(tc[(f + j) * 3], tc[(f + j) * 3 + 1], tc[(f + j) * 3 + 2]); }
      }
      geo.dispose();
    }
    const hg = new T.BufferGeometry(); hg.setAttribute('position', new T.Float32BufferAttribute(HP, 3)); hg.setAttribute('color', new T.Float32BufferAttribute(HC, 3)); hg.computeVertexNormals();
    g.add(new T.Mesh(hg, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
    // 樹：公園、山腳一圈、山坡上
    const trees = [], rnd = rng(11);
    const ok = (x, z) => !nearRiver(x, z, .2) && lineDist(x, z) > 1.1 && !inSea(x, z, .6);
    for (const [px, py, r] of PARKS) for (let i = 0; i < r / 2.2; i++) { const a = rnd() * 7, d = Math.sqrt(rnd()) * r * .85, x = (px + Math.cos(a) * d) / S, z = (py + Math.sin(a) * d) / S; if (ok(x, z)) trees.push([x, 0, z, .5 + rnd() * .4]); }
    for (const [x, y, r] of HILLS) {
      for (let i = 0; i < r * 1.6; i++) { const a = rnd() * 7, d = r * (1 + rnd() * .5), tx = x / S + Math.cos(a) * d, tz = y / S + Math.sin(a) * d * .8; if (ok(tx, tz)) trees.push([tx, Math.max(0, hillY(tx, tz)), tz, .6 + rnd() * .5]); }
      for (let i = 0; i < r * 2; i++) { const a = rnd() * 7, d = Math.sqrt(rnd()) * r * .7, tx = x / S + Math.cos(a) * d, tz = y / S + Math.sin(a) * d * .7, hy = hillY(tx, tz); if (hy > .3 && ok(tx, tz)) trees.push([tx, hy - .1, tz, .55 + rnd() * .45]); }
    }
    const treeM = new T.InstancedMesh(new T.ConeGeometry(.45, 1.3, 6), new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }), trees.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
    trees.forEach(([tx, ty, tz, s], i) => {
      m4.compose(new T.Vector3(tx, ty + .65 * s, tz), q, new T.Vector3(s, s, s)); treeM.setMatrixAt(i, m4);
      treeM.setColorAt(i, col.setHSL(.27 + (i % 5) * .015, .38, .34 + (i % 4) * .04));
    });
    g.add(treeM);
    // 地底的深色底板，讓地下段看起來在土裡
    R.under = new T.MeshBasicMaterial({ color: '#4a4640' });
    const under = new T.Mesh(new T.PlaneGeometry(170, 170), R.under);
    under.rotation.x = -Math.PI / 2; under.position.set(50, H_UG - 1.2, 50);
    g.add(under);
    // 夜裡的城市光暈（加色混合，白天隱藏）
    const glowTex = canvasTex(512, 512, (x, N) => {
      const toPx = v => (v / S + 30) / 160 * N;
      x.fillStyle = '#000'; x.fillRect(0, 0, N, N);
      const big = x.createRadialGradient(toPx(620), toPx(500), 0, toPx(620), toPx(500), N * .2); big.addColorStop(0, 'rgba(255,170,90,.35)'); big.addColorStop(1, 'rgba(255,170,90,0)'); x.fillStyle = big; x.fillRect(0, 0, N, N);
      x.strokeStyle = 'rgba(255,190,120,.22)'; x.lineWidth = 5; x.lineCap = 'round';
      for (const s of segs) { x.beginPath(); x.moveTo(toPx(s[0] * S), toPx(s[1] * S)); x.lineTo(toPx(s[2] * S), toPx(s[3] * S)); x.stroke(); }
      for (const id in STATIONS) { const px = toPx(STATIONS[id].x), py = toPx(STATIONS[id].y), gr = x.createRadialGradient(px, py, 0, px, py, 12); gr.addColorStop(0, 'rgba(255,205,140,.6)'); gr.addColorStop(1, 'rgba(255,205,140,0)'); x.fillStyle = gr; x.fillRect(px - 12, py - 12, 24, 24); }
    });
    R.nightGlow = new T.Mesh(new T.PlaneGeometry(160, 160), new T.MeshBasicMaterial({ map: glowTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }));
    R.nightGlow.rotation.x = -Math.PI / 2; R.nightGlow.position.set(50, .09, 50); R.nightGlow.renderOrder = 4;
    g.add(R.nightGlow);
    return g;
  }

  /* ── 地標 ── */
  const WEEKDAY_101 = { 一: '#ff3b3b', 二: '#ff8a1f', 三: '#ffd21f', 四: '#3fd46b', 五: '#3f9bff', 六: '#6a5bff', 日: '#b04bff' };
  function lmLabel(g, text, x, y, z, always = false) {
    const l = textSprite(text, { size: 38, color: '#5a3d1e', bg: 'rgba(255,246,226,.92)', bold: 700, border: 'rgba(190,150,90,.6)' });
    l.position.set(x, y, z); l.userData.landmark = true; l.userData.always = always; l.userData.base = .95;
    l.scale.set(l.userData.aspect, 1, 1); g.add(l); lmLabels.push(l); return l;
  }
  function planeParts(B, s = 1) {   // 機頭朝 +x
    B.add(cyl(.16 * s, .16 * s, 1.7 * s, 8), '#f4f6f8', 0, 0, 0, { rz: Math.PI / 2 });
    B.add(cyl(.02 * s, .16 * s, .35 * s, 8), '#f4f6f8', 1.02 * s, 0, 0, { rz: -Math.PI / 2 });
    B.add(cyl(.05 * s, .16 * s, .45 * s, 8), '#f4f6f8', -1.07 * s, .02 * s, 0, { rz: Math.PI / 2 });
    B.add(box(.45 * s, .04 * s, 2.1 * s), '#d4d9df', .05 * s, -.05 * s, 0);
    B.add(box(.25 * s, .03 * s, .8 * s), '#d4d9df', -1.08 * s, .03 * s, 0);
    B.add(box(.38 * s, .45 * s, .04 * s), '#2f6fd0', -1.08 * s, .28 * s, 0);
    for (const z of [-.5, .5]) B.add(cyl(.07 * s, .07 * s, .32 * s, 6), '#9aa3ad', .18 * s, -.14 * s, z * s, { rz: Math.PI / 2 });
  }

  function buildLandmarks() {
    const g = new T.Group();
    const B = Merger(), GL = Merger(), TW = Merger();   // 一般、窗戶燈光、台北 101
    const at = (id, dx = 0, dz = 0) => [STATIONS[id].x / S + dx, STATIONS[id].y / S + dz];

    // 台北 101：裙樓、收分的基座、八節往外撐的「花瓣」、頂部與尖塔、基座上的如意圓章
    {
      const [x, z] = at('台北101/世貿', 2.4, 1.8);
      B.at(x, 0, z); GL.at(x, 0, z); TW.at(x, 0, z);
      B.add(box(3.6, .9, 3.0), '#c9ccc4', 0, .45, 0);
      GL.add(box(3.64, .22, 3.04), '#ffe3a6', 0, .55, 0);
      TW.add(cyl(1.16, 1.63, 3.2, 4), '#5f948c', 0, 2.5, 0, { ry: Math.PI / 4 });
      for (const [dx, dz, ry] of [[0, -1, 0], [0, 1, 0], [-1, 0, Math.PI / 2], [1, 0, Math.PI / 2]]) TW.add(cyl(.34, .34, .06, 12), '#d8b04a', dx * .98, 3.4, dz * .98, { rx: Math.PI / 2, rz: ry });
      for (let i = 0; i < 8; i++) TW.add(cyl(1.27, 1.0, 1.2, 4), i % 2 ? '#74ada4' : '#68a198', 0, 4.7 + i * 1.2, 0, { ry: Math.PI / 4 });
      TW.add(cyl(.66, .8, .7, 4), '#7fb3aa', 0, 14.05, 0, { ry: Math.PI / 4 });
      TW.add(cyl(.42, .54, .5, 4), '#86b9b0', 0, 14.65, 0, { ry: Math.PI / 4 });
      TW.add(cyl(.05, .14, 2.6, 6), '#d5dde0', 0, 16.2, 0);
      lmLabel(g, '台北 101', x, 18.6, z, true);
    }
    // 台北車站：方正的大樓＋大屋頂，前面廣場；南邊新光摩天大樓
    {
      const [x, z] = at('台北車站', -3.0, -1.7);
      B.at(x, 0, z); GL.at(x, 0, z);
      B.add(box(5.6, .04, 4.4), '#d9d3c4', 0, .02, .2);
      B.add(box(4.4, 1.15, 3.3), '#e9dfcb', 0, .575, 0);
      GL.add(box(4.46, .32, 3.36), '#ffd890', 0, .72, 0);
      B.add(box(4.6, .1, 3.5), '#cfc2a8', 0, 1.2, 0);
      B.add(roofG(2.45, 1.9, 1.05, .42, .9), '#a2683a', 0, 1.77, 0);
      B.add(box(2.06, .08, 1.6), '#8a5730', 0, 2.33, 0);
      lmLabel(g, '台鐵台北車站', x, 4, z);
      const [sx, sz] = at('台北車站', 1.8, 2.4);
      B.at(sx, 0, sz); GL.at(sx, 0, sz);
      B.add(box(1.3, 6.4, .95), '#b8925a', 0, 3.2, 0);
      for (let k = 0; k < 7; k++) GL.add(box(1.34, .1, .99), '#ffe7a8', 0, 1 + k * .8, 0);
      B.add(box(1.0, .4, .7), '#a98450', 0, 6.6, 0);
      B.add(cyl(.03, .05, 1, 5), '#cccccc', 0, 7.3, 0);
    }
    // 總統府：紅磚白飾帶，東側中央高塔，前面凱達格蘭大道
    {
      const x = 46.6, z = 54.4;
      B.at(x, 0, z); GL.at(x, 0, z);
      B.add(box(1.3, .75, 2.4), '#b4553d', 0, .375, 0);
      for (const y of [.3, .72]) B.add(box(1.34, .07, 2.44), '#f1ebe0', 0, y, 0);
      GL.add(box(1.33, .14, 2.2), '#ffe0a0', 0, .52, 0);
      for (const dz of [-1, 1]) B.add(box(.4, .75, .45), '#b4553d', .75, .375, dz);
      B.add(box(.55, 1.6, .55), '#b4553d', .62, .8, 0);
      for (const y of [.75, 1.25, 1.6]) B.add(box(.59, .06, .59), '#f1ebe0', .62, y, 0);
      B.add(box(.4, .45, .4), '#c46a50', .62, 1.82, 0);
      B.add(roofG(.24, .24, .32, .1, .9), '#5c4a42', .62, 2.2, 0);
      B.add(box(2.4, .03, .45), '#d2cdc2', 2.1, .03, 0);
      lmLabel(g, '總統府', x, 3.4, z);
    }
    // 中正紀念堂：白色殿堂、藍色八角雙層屋頂、自由廣場牌樓、兩側國家戲劇院與音樂廳
    {
      B.at(0, 0, 0); GL.at(0, 0, 0);
      B.add(box(6.2, .04, 3.4), '#ece6da', 54.2, .02, 60.6);
      B.at(55.6, 0, 60.6); GL.at(55.6, 0, 60.6);
      B.add(box(2.6, .25, 2.6), '#f4f2ee', 0, .125, 0);
      B.add(box(2.1, .25, 2.1), '#f4f2ee', 0, .375, 0);
      B.add(box(1.7, .2, 1.7), '#f4f2ee', 0, .6, 0);
      B.add(box(1.45, 1.1, 1.45), '#fbfaf7', 0, 1.25, 0);
      GL.add(box(1.48, .14, 1.48), '#ffe7b0', 0, 1.55, 0);
      B.add(roofG(1.18, 1.18, .45, .55, .9, 8), '#2c58b0', 0, 2.03, 0);
      B.add(cyl(.55, .6, .35, 8), '#fbfaf7', 0, 2.42, 0);
      B.add(roofG(.85, .85, .55, .15, .88, 8), '#2c58b0', 0, 2.87, 0);
      B.add(cyl(.02, .1, .35, 6), '#d8b040', 0, 3.3, 0);
      B.at(51.6, 0, 60.6);
      B.add(box(.35, .75, 2.2), '#f6f4f0', 0, .375, 0);
      B.add(box(.45, .08, 2.3), '#2c58b0', 0, .79, 0);
      B.add(roofG(.3, 1.25, .25, .3), '#2c58b0', 0, .97, 0);
      for (const dz of [-1.5, 1.5]) {
        B.at(53.8, 0, 60.6 + dz); GL.at(53.8, 0, 60.6 + dz);
        B.add(box(1.3, .5, .7), '#f2e6d0', 0, .25, 0);
        GL.add(box(1.32, .12, .72), '#ffd890', 0, .3, 0);
        B.add(roofG(.8, .5, .45, .3, .85), '#e0a830', 0, .72, 0);
      }
      lmLabel(g, '中正紀念堂', 55.6, 4.6, 60.6);
    }
    // 國父紀念館：黃色飛簷大屋頂、灰柱廊、方形廣場
    {
      const [x, z] = at('國父紀念館', .3, 3.4);
      B.at(x, 0, z); GL.at(x, 0, z);
      B.add(box(4.8, .04, 4.8), '#e5dfd2', 0, .02, 0);
      B.add(box(3.2, .3, 3.2), '#f5f1e8', 0, .15, 0);
      B.add(box(2.6, 1.0, 2.6), '#efe4cf', 0, .8, 0);
      GL.add(box(2.64, .2, 2.64), '#ffe0a0', 0, .95, 0);
      for (let i = 0; i < 6; i++) B.add(cyl(.07, .07, 1.0, 6), '#8f8f8a', -1.1 + i * .44, .8, -1.42);
      B.add(roofG(1.95, 1.95, .95, .45, .82), '#e6b02c', 0, 1.77, 0);
      B.add(box(1.9, .16, .32), '#d29a1c', 0, 2.3, 0);
      B.add(box(1.7, .1, .7), '#e6b02c', 0, 1.95, -1.55, { rx: -.42 });
      lmLabel(g, '國父紀念館', x, 3.8, z);
    }
    // 台北小巨蛋
    {
      const [x, z] = at('台北小巨蛋', 0, -2.6);
      B.at(x, 0, z); GL.at(x, 0, z);
      B.add(cyl(1.9, 2.0, .35, 20), '#cfd6dc', 0, .175, 0, { sx: 1.35 });
      GL.add(cyl(1.93, 1.93, .1, 20), '#9fd8ff', 0, .32, 0, { sx: 1.35 });
      B.add(new T.SphereGeometry(1.85, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#eef1f4', 0, .35, 0, { sx: 1.35, sy: .5 });
      lmLabel(g, '小巨蛋', x, 2.7, z);
    }
    // 圓山大飯店：坐在圓山上，米色牆紅柱、紅色宮殿屋頂、金色簷
    {
      const x = 55.0, z = 29.4, y = Math.max(0, hillY(x, z)) - .05;
      B.at(x, y, z); GL.at(x, y, z);
      B.add(box(4.0, .9, 1.7), '#e8e2d6', 0, -.1, 0);
      B.add(box(3.6, 1.3, 1.1), '#efe2c6', 0, 1.0, 0);
      GL.add(box(3.62, .1, 1.12), '#ffd890', 0, .8, 0); GL.add(box(3.62, .1, 1.12), '#ffd890', 0, 1.15, 0);
      for (let i = 0; i < 10; i++) for (const dz of [-.57, .57]) B.add(box(.1, 1.3, .06), '#c4302a', -1.62 + i * .36, 1.0, dz);
      B.add(box(4.0, .08, 1.5), '#e0b040', 0, 1.69, 0);
      B.add(roofG(2.05, .8, .75, .5, .8), '#c9302a', 0, 2.1, 0);
      B.add(box(2.1, .06, .1), '#e0b040', 0, 2.5, 0);
      B.add(box(.9, .5, .7), '#efe2c6', 0, 2.75, 0);
      B.add(roofG(.65, .5, .45, .3, .8), '#c9302a', 0, 3.2, 0);
      B.add(cyl(.02, .07, .3, 6), '#e0b040', 0, 3.55, 0);
      lmLabel(g, '圓山大飯店', x, y + 4.6, z);
    }
    // 美麗華摩天輪（輪子另外做，會轉）
    let wheel = null;
    {
      const [x, z] = at('劍南路', -2.6, -2.6);
      B.at(x, 0, z); GL.at(x, 0, z);
      B.add(box(2.6, 1.0, 1.8), '#e4dccf', 0, .5, 0);
      GL.add(box(2.64, .22, 1.84), '#ffe2a8', 0, .55, 0);
      const hub = new T.Vector3(.2, 3.3, 0);
      for (const dz of [-.25, .25]) for (const dx of [-.8, 1.2]) B.beam(new T.Vector3(dx, 1, dz), hub.clone().setZ(dz), .08, '#c9ccd2');
      const W = Merger();
      W.add(new T.TorusGeometry(2.0, .06, 4, 28), '#eef0f6');
      W.add(new T.TorusGeometry(1.55, .03, 3, 24), '#d8dce6');
      for (let i = 0; i < 12; i++) W.add(box(.03, 2.0, .03), '#cfd4de', 0, 0, 0, { rz: i / 12 * Math.PI });
      const cc = ['#e84a5f', '#ffd23f', '#3fa7d6', '#7bd389'];
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; W.add(box(.22, .24, .22), cc[i % 4], Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0); }
      W.add(cyl(.12, .12, .6, 8), '#b0b4bc', 0, 0, 0, { rx: Math.PI / 2 });
      R.wheelMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, flatShading: true, emissive: '#ff9ac0', emissiveIntensity: 0 });
      const wm = W.mesh(R.wheelMat), wg = new T.Group();
      wg.position.set(x + hub.x, hub.y, z); wg.rotation.y = -.35; wg.add(wm); g.add(wg);
      wheel = wm;
      lmLabel(g, '美麗華摩天輪', x, 6.2, z);
    }
    // 松山機場：跑道、滑行道、航廈、塔台、停機坪上的飛機（另一架會起飛）
    {
      const rx = 78.2, rz = 33.4;
      B.at(0, 0, 0); GL.at(0, 0, 0);
      B.add(box(15, .04, 1.2), '#5d6066', rx, .03, rz);
      for (let i = 0; i < 14; i++) B.add(box(.55, .01, .07), '#f4f4f4', rx - 6.5 + i * 1, .055, rz);
      for (const e of [-1, 1]) for (let k = 0; k < 4; k++) B.add(box(.5, .01, .09), '#f4f4f4', rx + e * 7.0, .055, rz - .36 + k * .24);
      for (let i = 0; i <= 15; i++) for (const e of [-.62, .62]) GL.add(box(.08, .06, .08), '#ffd27a', rx - 7.5 + i, .06, rz + e);
      B.add(box(14, .03, .35), '#6a6d72', rx, .025, rz + 1.25);
      B.add(box(4.6, .03, 1.6), '#8a8d92', 72.6, .025, 35.9);
      B.at(72.6, 0, 37.3); GL.at(72.6, 0, 37.3);
      B.add(box(4.0, .7, 1.1), '#e7e9ec', 0, .35, 0);
      GL.add(box(4.04, .28, 1.14), '#ffe2a8', 0, .4, 0);
      B.add(box(4.2, .08, 1.3), '#9aa3ad', 0, .74, 0);
      B.at(75.8, 0, 36.6); GL.at(75.8, 0, 36.6);
      B.add(cyl(.14, .2, 2.2, 8), '#e9ecef', 0, 1.1, 0);
      GL.add(cyl(.42, .32, .4, 8), '#bfe4ff', 0, 2.4, 0);
      B.add(cyl(.46, .46, .08, 8), '#9aa3ad', 0, 2.64, 0);
      B.at(73.6, .2, 35.6, -Math.PI / 2); planeParts(B, .8);
      lmLabel(g, '松山機場', rx + 3, 2.2, rz);
    }
    // 關渡大橋：紅色雙拱，跨淡水河
    {
      const { p, tg, w } = riverAt('淡水河', 37.6, 10.2), ry = Math.atan2(-tg.z, tg.x) + Math.PI / 2;
      const len = w * 1.9 + .8, dy = .55;
      B.at(p.x, 0, p.z, ry);
      B.add(box(len, .12, .8), '#8f9196', 0, dy, 0);
      for (const e of [-1, 1]) B.add(box(.45, dy, .9), '#a8a9ad', e * len / 2, dy / 2, 0);
      for (const zz of [-.34, .34]) {
        const cv = new T.QuadraticBezierCurve3(new T.Vector3(-len * .47, dy, zz), new T.Vector3(0, dy + 4.0, zz), new T.Vector3(len * .47, dy, zz));
        B.add(new T.TubeGeometry(cv, 16, .08, 4), '#d7392e');
        for (let k = 1; k < 8; k++) { const q = cv.getPoint(k / 8); B.beam(new T.Vector3(q.x, dy, zz), q, .025, '#e8e8e8'); }
        if (zz < 0) for (const f of [.35, .5, .65]) { const q = cv.getPoint(f); B.add(box(.05, .05, .7), '#d7392e', q.x, q.y, 0); }
      }
      lmLabel(g, '關渡大橋', p.x, 3.6, p.z);
    }
    // 淡水漁人碼頭：木棧道、白色情人橋（斜塔＋斜張索）、停泊的小船
    {
      const { p, tg } = riverAt('淡水河', 21.0, 1.6), nx = tg.z, nz = -tg.x;   // nx/nz：往北岸
      const ry = Math.atan2(-tg.z, tg.x);
      const cx = p.x + nx * 1.9, cz = p.z + nz * 1.9;
      B.at(cx, 0, cz, ry);
      B.add(box(3.8, .06, .5), '#a77b52', 0, .06, .1);
      const deck = new T.QuadraticBezierCurve3(new T.Vector3(-1.6, .12, -.35), new T.Vector3(0, .9, -.55), new T.Vector3(1.6, .12, -.35));
      B.add(new T.TubeGeometry(deck, 12, .1, 4), '#f6f6f8');
      const top = new T.Vector3(-.15, 2.6, .25);
      B.beam(new T.Vector3(-.6, .1, -.1), top, .12, '#f6f6f8');
      for (const f of [.2, .35, .5, .65, .8]) B.beam(top, deck.getPoint(f), .025, '#dcdcdc');
      for (let i = 0; i < 3; i++) { B.add(box(.5, .14, .2), '#f3f1ea', -1.2 + i * .9, .08, .95); B.add(box(.2, .14, .14), ['#3a78b8', '#d24b3e', '#3a9b6b'][i], -1.25 + i * .9, .2, .95); }
      lmLabel(g, '漁人碼頭・情人橋', cx, 3.6, cz);
    }
    // 北投溫泉（地熱谷，熱氣另外做）
    const [bx, bz] = at('新北投', 1.6, 1.2);
    B.at(bx, 0, bz); B.add(cyl(.8, .9, .08, 12), '#8fd0c8', 0, .05, 0, { sx: 1.3 });
    lmLabel(g, '北投溫泉', bx, 3.4, bz);

    // 貓空纜車：動物園 → 動物園南 → 指南宮 → 貓空，纜車廂沿纜線上下
    // 解開動物園的「貓纜重新運轉」之前不顯示（opts.gondola）
    let gondola = null;
    const gg = new T.Group(), GB = Merger(), GGL = Merger(); gg.visible = !!opts.gondola; g.add(gg);
    {
      const ptsXZ = [[76.4, 89.0, 1], [78.6, 91.0, 0], [80.8, 92.8, 1], [83.0, 93.6, 0], [85.2, 93.0, 1], [87.0, 90.8, 0], [88.6, 88.4, 1]];
      const tops = ptsXZ.map(([x, z, st]) => { const gy = Math.max(0, hillY(x, z)); return { x, z, gy, st, y: gy + (st ? 1.0 : 1.9) }; });
      GB.at(0, 0, 0); GGL.at(0, 0, 0);
      for (const t of tops) {
        if (t.st) { GB.add(box(.9, .45 + .4, .7), '#ece6d8', t.x, t.gy + .02, t.z); GB.add(box(1.05, .08, .85), '#3e8e5a', t.x, t.gy + .48, t.z); GGL.add(box(.92, .1, .72), '#ffe2a8', t.x, t.gy + .25, t.z); }
        else { GB.add(cyl(.05, .09, t.y - t.gy, 6), '#c8c8c8', t.x, (t.y + t.gy) / 2, t.z); GB.add(box(.55, .05, .05), '#c8c8c8', t.x, t.y, t.z); }
      }
      const t2 = tops[4];
      GB.add(box(.9, .35, .55), '#c4402e', t2.x + .9, t2.gy + .15, t2.z + .6); GB.add(roofG(.6, .4, .35, .3, .8), '#e0a62a', t2.x + .9, t2.gy + .5, t2.z + .6);
      // 纜線（上行／下行各一條），中間有一點下垂
      const line = (off) => { const out = []; for (let i = 0; i < tops.length - 1; i++) { const a = tops[i], b = tops[i + 1], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz), ox = -dz / l * off, oz = dx / l * off; for (let k = 0; k < 8; k++) { const f = k / 8; out.push(new T.Vector3(a.x + dx * f + ox, a.y + (b.y - a.y) * f - Math.sin(f * Math.PI) * .25, a.z + dz * f + oz)); } } const a = tops[tops.length - 1], b = tops[tops.length - 2], dx = a.x - b.x, dz = a.z - b.z, l = Math.hypot(dx, dz); out.push(new T.Vector3(a.x - dz / l * off, a.y, a.z + dx / l * off)); return out; };
      const up = line(.17), down = line(-.17), loop = [...up, ...down.reverse(), up[0]];
      const lv = []; for (const L of [up, down]) for (let i = 0; i < L.length - 1; i++) lv.push(L[i].x, L[i].y, L[i].z, L[i + 1].x, L[i + 1].y, L[i + 1].z);
      const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lv, 3));
      gg.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color: '#3d3d3d' })));
      const cum = [0]; for (let i = 1; i < loop.length; i++) cum.push(cum[i - 1] + loop[i].distanceTo(loop[i - 1]));
      const n = 18, im = new T.InstancedMesh(box(.2, .24, .2), new T.MeshStandardMaterial({ color: '#fff', roughness: .5 }), n);
      const cc = ['#efe7cc', '#7bb6d9', '#f0b84a'], col = new T.Color();
      for (let i = 0; i < n; i++) im.setColorAt(i, col.set(cc[i % 3]));
      im.frustumCulled = false; gg.add(im);
      gondola = { im, loop, cum, n };
      gondola.label = lmLabel(gg, '貓空纜車', tops[6].x, tops[6].y + 2.4, tops[6].z);
    }
    // 河上的車行橋（台北橋、忠孝橋、華江橋、中正橋、福和橋、百齡橋、大直橋）
    for (const [rn, x, z] of [['淡水河', 41.6, 38.8], ['淡水河', 41.4, 46.2], ['淡水河', 37.6, 52.4], ['新店溪', 44.6, 67.8], ['新店溪', 48.3, 76.6], ['基隆河', 46.2, 19.2], ['基隆河', 60.6, 28.8], ['基隆河', 79, 25.2]]) {
      const { p, tg, w } = riverAt(rn, x, z), len = w * 1.9 + .5;
      B.at(p.x, 0, p.z, Math.atan2(-tg.z, tg.x) + Math.PI / 2);
      B.add(box(len, .1, .5), '#b9b7b0', 0, .32, 0);
      for (const f of [-.25, .25]) B.add(box(.14, .3, .4), '#a3a19a', f * len, .15, 0);
      GL.add(box(len, .04, .04), '#ffd890', 0, .4, .24); GL.add(box(len, .04, .04), '#ffd890', 0, .4, -.24);
    }
    R.solidMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .75, flatShading: true });
    R.glowMat = new T.MeshBasicMaterial({ vertexColors: true, color: '#5f7181' });
    R.t101Mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: .45, flatShading: true, emissive: '#000000' });
    for (const [M, mat] of [[B, R.solidMat], [GL, R.glowMat], [TW, R.t101Mat]]) { const ms = M.mesh(mat); if (ms) g.add(ms); }
    for (const [M, mat] of [[GB, R.solidMat], [GGL, R.glowMat]]) { const ms = M.mesh(mat); if (ms) gg.add(ms); }   // 貓空纜車（解鎖後才看得到）
    // 會起飛的飛機
    const PB = Merger(); planeParts(PB, 1);
    const plane = PB.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, flatShading: true }));
    g.add(plane);
    // 渡輪與遊船
    const BB = Merger(); BB.add(box(.7, .16, .28), '#f4f1ea', 0, .08, 0); BB.add(box(.18, .16, .2), '#f4f1ea', .4, .08, 0, { ry: Math.PI / 4, sz: .9 }); BB.add(box(.32, .18, .22), '#3a78b8', -.08, .25, 0);
    const boats = new T.InstancedMesh(BB.build(), new T.MeshStandardMaterial({ vertexColors: true, roughness: .6, flatShading: true }), 3);
    boats.frustumCulled = false; g.add(boats);
    const ferry = riverAt('淡水河', 24, 4.6), cruise = riverPl.find(o => o.r.name === '淡水河').pl, blue = riverPl.find(o => o.r.name === '基隆河').pl;
    // 溫泉熱氣
    const pt = puffTex(), steam = [];
    for (let k = 0; k < 3; k++) { const s = new T.Sprite(new T.SpriteMaterial({ map: pt, transparent: true, depthWrite: false, opacity: 0 })); s.position.set(bx, 1, bz); g.add(s); steam.push(s); }
    return { g, wheel, gondola, plane, boats, ferry, cruise, blue, steam, bx, bz };
  }

  // 市區建築群：用路網密度決定高度，避開河流、海、山、地標
  const RESERVED = [[47, 46.6, 3.2], [51.8, 52.4, 1.3], [46.6, 54.4, 1.8], [54.2, 60.6, 3.6], [78.8, 53.4, 3.2], [83.4, 65.8, 2.6], [74.5, 40.4, 2.9], [62.4, 22.4, 2.4], [22, 2, 3]];
  function cityBlocks() {
    const pts = Object.values(STATIONS).map(s => [s.x / S, s.y / S]);
    const list = [], rnd = rng(7);
    for (let x = 4; x < 98; x += 1.6) for (let z = 4; z < 92; z += 1.6) {
      let dmin = 1e9, dens = 0;
      for (const [px, pz] of pts) { const d = Math.hypot(px - x, pz - z); dmin = Math.min(dmin, d); if (d < 8) dens++; }
      if (dmin < 2.2 || dmin > 8 || nearRiver(x, z) || rnd() < .55) continue;
      if (inSea(x, z, 1) || hillY(x, z) > .1 || RESERVED.some(([rx, rz, r]) => Math.hypot(x - rx, z - rz) < r) || (x > 69 && x < 87.5 && z > 31.8 && z < 38.5)) continue;
      const h = .25 + Math.min(1.4, dens * .07) * (.4 + rnd());
      list.push([x + (rnd() - .5) * .6, z + (rnd() - .5) * .6, .8 + rnd() * .6, h]);
    }
    // 窗戶：白天是淡淡的格子，晚上隨機亮燈（屋頂不畫窗）
    const win = night => canvasTex(64, 64, (x) => {
      x.fillStyle = night ? '#000' : '#fff'; x.fillRect(0, 0, 64, 64);
      const rr = rng(night ? 3 : 9);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
        const v = rr();
        x.fillStyle = night ? (v < .62 ? '#ffd890' : v < .72 ? '#d5ecff' : '#141414') : '#c4ced8';
        x.fillRect(6 + c * 14, 6 + r * 11.5, 9, 6);
      }
    });
    const geo = new T.BoxGeometry(1, 1, 1), uv = geo.attributes.uv;
    for (let i = 8; i < 16; i++) uv.setXY(i, .02, .02);
    R.cityMat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .8, map: win(false), emissiveMap: win(true), emissive: '#ffffff', emissiveIntensity: 0 });
    const inst = new T.InstancedMesh(geo, R.cityMat, list.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion(), col = new T.Color();
    list.forEach(([x, z, w, h], i) => {
      m4.compose(new T.Vector3(x, h / 2, z), q, new T.Vector3(w, h, w * (.8 + (i % 3) * .15)));
      inst.setMatrixAt(i, m4);
      inst.setColorAt(i, col.setHSL([.08, .58, .1, .55, .05][i % 5], .1 + (i % 3) * .05, .7 + (i % 4) * .04));
    });
    return inst;
  }

  /* ── 路線：每條線依材質合併成幾個網格；同時記下列車要走的路徑、跨河處加橋 ── */
  let lineMeshes = {};
  function buildLines() {
    const g = new T.Group(), done = new Set(), paths = [], BR = Merger();
    lineMeshes = {}; R.lineMats = [];
    const m4 = new T.Matrix4(), q = new T.Quaternion(), one = new T.Vector3(1, 1, 1), o = new T.Object3D();
    for (const lid of LINE_ORDER) {
      const L = LINES[lid];
      lineMeshes[lid] = [];
      const mat = new T.MeshStandardMaterial({ color: L.color, roughness: .35, metalness: .05, emissive: L.color, emissiveIntensity: .22 });
      const ugMat = new T.MeshStandardMaterial({ color: L.color, roughness: .5, emissive: L.color, emissiveIntensity: .7 });
      const pierM = new T.MeshStandardMaterial({ color: '#b9b6ad', roughness: .9 });
      const deckM = new T.MeshStandardMaterial({ color: '#e9e6dd', roughness: .8 });
      const haloM = new T.MeshBasicMaterial({ color: L.color, transparent: true, opacity: .16, depthWrite: false });
      R.lineMats.push([mat, .22, .8], [ugMat, .7, 1.05]);
      const mT = Merger(false), mU = Merger(false), mD = Merger(false), mH = Merger(false), mP = Merger(false);
      for (const route of L.routes) {
        const pts = [], stops = [];
        for (let i = 0; i < route.length; i++) {
          const a = route[i][0], pa = P(a); pa.y = hOn(a, lid);
          if (i > 0) {
            const pb = pts[pts.length - 1];
            if (pb.y !== pa.y) { const m1 = pb.clone().lerp(pa, .35); m1.y = pb.y; const m2 = pb.clone().lerp(pa, .65); m2.y = pa.y; pts.push(m1, m2); }
          }
          stops.push(pts.length); pts.push(pa);
        }
        paths.push({ lid, pts, stops, color: L.color });
        for (let i = 0; i < route.length - 1; i++) {
          const key = lid + ':' + [route[i][0], route[i + 1][0]].sort().join('|');
          if (done.has(key)) continue; done.add(key);
          for (let k = stops[i]; k < stops[i + 1]; k++) {
            const s0 = pts[k], s1 = pts[k + 1];
            const len = s0.distanceTo(s1);
            const ug = s0.y < 0 && s1.y < 0;
            const mid = s0.clone().add(s1).multiplyScalar(.5), dir = s1.clone().sub(s0).normalize();
            q.setFromUnitVectors(UP, dir);
            (ug ? mU : mT).addM(new T.CylinderGeometry(.55, .55, len, 10, 1, true), null, m4.compose(mid, q, one));
            (ug ? mU : mT).addM(new T.SphereGeometry(.55, 10, 6), null, m4.compose(s1, q.identity(), one));
            if (k === stops[i]) (ug ? mU : mT).addM(new T.SphereGeometry(.55, 10, 6), null, m4.compose(s0, q, one));
            if (!ug) {
              o.position.copy(mid).y -= .55; o.lookAt(s1.x, s1.y - .55, s1.z); o.updateMatrix();
              mD.addM(new T.BoxGeometry(1.5, .22, len + .4), null, o.matrix);
            } else {
              mH.addM(new T.CylinderGeometry(.85, .85, len, 10, 1, true), null, m4.compose(mid, q.setFromUnitVectors(UP, dir), one));
            }
            if (s0.y > 0 && s1.y > 0) {
              const n = Math.max(1, Math.floor(len / 2.2));
              for (let j = 1; j <= n; j++) {
                const p = s0.clone().lerp(s1, j / (n + 1));
                mP.addM(new T.CylinderGeometry(.16, .22, p.y - .6, 6), null, m4.compose(new T.Vector3(p.x, (p.y - .6) / 2, p.z), q.identity(), one));
              }
            }
            // 高架跨河：橋下加白色拱圈與主梁
            if (s0.y > 0 || s1.y > 0) for (const { r, pl } of riverPl) for (let j = 0; j < pl.length - 1; j++) {
              const a = pl[j], b = pl[j + 1], rx = s1.x - s0.x, rz = s1.z - s0.z, sx = b.x - a.x, sz = b.z - a.z, den = rx * sz - rz * sx;
              if (Math.abs(den) < 1e-9) continue;
              const t = ((a.x - s0.x) * sz - (a.z - s0.z) * sx) / den, u = ((a.x - s0.x) * rz - (a.z - s0.z) * rx) / den;
              if (t < 0 || t > 1 || u < 0 || u > 1) continue;
              const C = s0.clone().lerp(s1, t); if (C.y < .6) continue;
              const d2 = new T.Vector3(rx, 0, rz).normalize(), sl = Math.hypot(sx, sz), sin = Math.abs(d2.x * sz / sl - d2.z * sx / sl);
              const span = Math.min(7, r.w * 1.9 / Math.max(.35, sin)), nx = -d2.z, nz = d2.x;
              BR.at(0, 0, 0);
                            o.position.copy(C).y -= .82; o.lookAt(C.x + d2.x, C.y - .82, C.z + d2.z); o.updateMatrix();
              BR.addM(new T.BoxGeometry(1.2, .28, span), '#d8d4ca', o.matrix);
              for (const e of [-.42, .42]) {
                const A = C.clone().addScaledVector(d2, -span / 2).add(new T.Vector3(nx * e, 0, nz * e)).setY(.05), Bp = C.clone().addScaledVector(d2, span / 2).add(new T.Vector3(nx * e, 0, nz * e)).setY(.05);
                const ctl = C.clone().add(new T.Vector3(nx * e, 0, nz * e)).setY(2 * (C.y - .95) - .05), cv = new T.QuadraticBezierCurve3(A, ctl, Bp);
                BR.add(new T.TubeGeometry(cv, 12, .09, 5), '#f2efe8');
                for (const f of [.2, .35, .65, .8]) { const pp = cv.getPoint(f); BR.beam(pp, pp.clone().setY(C.y - .95), .06, '#f2efe8'); }
              }
            }
          }
        }
      }
      for (const [M, mm] of [[mT, mat], [mU, ugMat], [mD, deckM], [mH, haloM], [mP, pierM]]) {
        const ms = M.mesh(mm); if (!ms) continue;
        if (mm === haloM) ms.renderOrder = 2;
        g.add(ms); lineMeshes[lid].push(ms);
      }
    }
    const bm = BR.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: .8, flatShading: true })); if (bm) g.add(bm);
    return { g, paths };
  }

  /* ── 列車：各線幾班，來回開、進站停一下 ── */
  function buildTrains(paths) {
    const list = [], V = 2.6, DW = 1.4;
    for (const pa of paths) {
      const cum = [0]; for (let i = 1; i < pa.pts.length; i++) cum.push(cum[i - 1] + pa.pts[i].distanceTo(pa.pts[i - 1]));
      const st = pa.stops.map(i => cum[i]), seq = [...st, ...st.slice(0, -1).reverse()], legs = [];
      let tt = 0;
      for (let k = 0; k < seq.length - 1; k++) {
        legs.push({ t0: tt, s0: seq[k], s1: seq[k], d: DW }); tt += DW;
        const d = Math.abs(seq[k + 1] - seq[k]) / V + .6;
        legs.push({ t0: tt, s0: seq[k], s1: seq[k + 1], d }); tt += d;
      }
      const L = cum[cum.length - 1], n = Math.max(2, Math.round(L / 11));
      for (let k = 0; k < n; k++) list.push({ pa, cum, legs, Tc: tt, ph: (k + .37 * paths.indexOf(pa)) / n * tt, lid: pa.lid, len: pa.lid === 'BR' ? .7 : 1 });
    }
    R.trainMat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .35, metalness: .1, emissive: '#fff6dc', emissiveIntensity: .15 });
    const im = new T.InstancedMesh(new T.CapsuleGeometry(.3, 1.2, 3, 8), R.trainMat, list.length);
    const col = new T.Color(), white = new T.Color('#ffffff');
    list.forEach((tr, i) => im.setColorAt(i, col.set(LINES[tr.lid].color).lerp(white, .42)));
    im.frustumCulled = false;
    return { im, list };
  }
  const _p = new T.Vector3(), _d = new T.Vector3(), _q = new T.Quaternion(), _s = new T.Vector3(), _m = new T.Matrix4();
  function tickTrains(tr, time) {
    const { im, list } = tr;
    list.forEach((o, i) => {
      if (solo && o.lid !== solo) { im.setMatrixAt(i, _m.makeScale(0, 0, 0)); return; }
      const u = (time + o.ph) % o.Tc, legs = o.legs;
      let lo = 0, hi = legs.length - 1; while (lo < hi) { const md = (lo + hi + 1) >> 1; if (legs[md].t0 <= u) lo = md; else hi = md - 1; }
      const lg = legs[lo]; let f = Math.min(1, (u - lg.t0) / lg.d); f = f * f * (3 - 2 * f);
      const s = lg.s0 + (lg.s1 - lg.s0) * f, cum = o.cum, pts = o.pa.pts;
      let a = 0, b = cum.length - 1; while (b - a > 1) { const md = (a + b) >> 1; if (cum[md] <= s) a = md; else b = md; }
      _p.lerpVectors(pts[a], pts[b], (s - cum[a]) / Math.max(1e-6, cum[b] - cum[a])); _p.y += .82;
      _d.subVectors(pts[b], pts[a]).normalize();
      im.setMatrixAt(i, _m.compose(_p, _q.setFromUnitVectors(UP, _d), _s.set(1, o.len, 1)));
    });
    im.instanceMatrix.needsUpdate = true;
  }

  /* ── 雲：只在北邊陽明山與南邊丘陵上空飄，不擋市中心 ── */
  function buildClouds() {
    const C = Merger(false);
    for (const [x, y, z, r] of [[0, 0, 0, 1.6], [1.5, .2, .3, 1.2], [-1.4, .1, -.2, 1.25], [.5, .7, -.3, 1.0], [-.4, .5, .5, .9]]) C.add(new T.IcosahedronGeometry(r, 0), null, x, y, z);
    const geo = C.build(); geo.scale(1.3, .6, 1);
    R.cloudMat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, transparent: true, opacity: .85, depthWrite: false, emissive: '#ffffff', emissiveIntensity: .25 });
    const spots = [[10, 19, -12, 1.3], [45, 22, -6, 1.6], [80, 20, -14, 1.2], [115, 24, 2, 1.4], [5, 18, 98, 1.2], [55, 21, 104, 1.5], [95, 19, 96, 1.1], [-20, 23, 50, 1.3]];
    const im = new T.InstancedMesh(geo, R.cloudMat, spots.length); im.frustumCulled = false;
    return { im, list: spots.map(([x, y, z, s], i) => ({ x, y, z, s, v: .35 + (i % 3) * .12 })) };
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

  /* ── 車站（幾何與材質共用） ── */
  function buildStations() {
    const g = new T.Group();
    stationMeshes = []; labels = []; fogs = [];
    const visited = opts.visited || {};
    const fogTex = canvasTex(128, 128, (x) => {
      const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
      gr.addColorStop(0, 'rgba(235,240,244,.95)'); gr.addColorStop(.6, 'rgba(225,232,238,.55)'); gr.addColorStop(1, 'rgba(225,232,238,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    }, false);
    const G = {
      bodyT: new T.CylinderGeometry(.95, .95 * 1.08, .6, 16), bodyN: new T.CylinderGeometry(.62, .62 * 1.08, .6, 16),
      ringT: new T.TorusGeometry(.95, .17, 6, 24), ringN: new T.TorusGeometry(.62, .17, 6, 24),
      dot: new T.CylinderGeometry(.22, .22, .12, 10), shaft: new T.CylinderGeometry(.18, .18, -H_UG, 8),
    };
    R.bodyMat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .3, emissive: '#ffffff', emissiveIntensity: .15 });
    const shaftM = new T.MeshStandardMaterial({ color: '#6c7178', transparent: true, opacity: .6 });
    const RM = Merger();   // 各站的色環與轉乘色點合併成一個網格（車站本體留著給點選）
    R.fogMats = [];
    for (const id in STATIONS) {
      const lines = MRT.linesAt(id);
      if (!lines.length) continue;
      const transfer = lines.length > 1;
      const p = P(id);
      const h = Math.max(...lines.map(l => hOn(id, l.line)));
      const grp = new T.Group(); grp.position.set(p.x, h, p.z);
      const body = new T.Mesh(transfer ? G.bodyT : G.bodyN, R.bodyMat);
      grp.add(body);
      RM.at(p.x, h, p.z);
      RM.add((transfer ? G.ringT : G.ringN).clone(), transfer ? '#22282e' : LINES[lines[0].line].color, 0, .3, 0, { rx: Math.PI / 2 });
      if (transfer) lines.forEach((l, i) => { const a = i / lines.length * Math.PI * 2; RM.add(G.dot.clone(), LINES[l.line].color, Math.cos(a) * .45, .34, Math.sin(a) * .45); });
      body.userData.stationId = id;
      stationMeshes.push(body);
      if (h < 0) { const shaft = new T.Mesh(G.shaft, shaftM); shaft.position.y = -h / 2; grp.add(shaft); }
      const zh = lines.map(l => MRT.label(id, l.line).zh).filter((v, i, a) => a.indexOf(v) === i).join('/');
      const lab = textSprite(zh, { size: transfer ? 50 : 42, bold: transfer ? 900 : 700, dots: [...new Set(lines.map(l => LINES[l.line].color))], border: id === opts.current ? '#ff4b6e' : null });
      lab.position.set(0, (h < 0 ? -h : 0) + 1.6, 0);
      const sh = transfer ? 1.35 : 1.05;
      lab.scale.set(sh * lab.userData.aspect, sh, 1);
      lab.userData = { ...lab.userData, transfer, id, base: sh };
      grp.add(lab); labels.push(lab);
      g.add(grp);
      if (!visited[id] && id !== opts.current) {
        for (let k = 0; k < 2; k++) {
          const f = new T.Sprite(new T.SpriteMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: .75 }));
          const s = 5 + Math.random() * 3;
          f.scale.set(s, s * .7, 1);
          f.position.set(p.x + (Math.random() - .5) * 2, 2.4 + k * .8, p.z + (Math.random() - .5) * 2);
          f.userData = { ox: f.position.x, oz: f.position.z, ph: Math.random() * 6 };
          f.renderOrder = 8;
          g.add(f); fogs.push(f); R.fogMats.push(f.material);
        }
        lab.material.opacity = .45;
      }
    }
    const rm = RM.mesh(new T.MeshStandardMaterial({ vertexColors: true, roughness: .35 })); if (rm) g.add(rm);
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

  /* ── 天色：跟著台灣時間 ── */
  const LOOKS = {
    day: { sky: ['#8fc0e6', '#d4e7f2', '#f3efe4'], fog: '#dfeaf0', hemi: ['#f4fbff', '#9a9580', 1.35], sun: ['#fff2dc', 1.9, -40, 90, 30], fill: ['#cfe2ff', .5], glow: 0, win: '#5f7181', under: '#4a4640', water: ['#5fa6cf', '#2c6e95', .15], cloud: '#ffffff', fogTint: '#ffffff' },
    dawn: { sky: ['#7f9fd0', '#f2c2b8', '#fbe6cc'], fog: '#efdcd2', hemi: ['#ffe9df', '#857a8a', 1.1], sun: ['#ffc59c', 1.5, 90, 35, 20], fill: ['#b0c0f0', .45], glow: .3, win: '#a39684', under: '#3e3836', water: ['#6e9fc6', '#7a6f9a', .2], cloud: '#ffe4dc', fogTint: '#fff0ea' },
    dusk: { sky: ['#4b5c96', '#e8977a', '#f8cc8e'], fog: '#e9bc98', hemi: ['#ffd8b4', '#6d5c6a', 1.0], sun: ['#ffa463', 1.6, -95, 28, -15], fill: ['#8e9de0', .45], glow: .6, win: '#e0b67e', under: '#3a302c', water: ['#6a8fb8', '#c0704a', .25], cloud: '#ffd2b4', fogTint: '#f6dccb' },
    night: { sky: ['#070d24', '#16224a', '#2c3458'], fog: '#1b2340', hemi: ['#6b7fc0', '#2a2833', .62], sun: ['#a4b8ff', .55, -30, 90, 40], fill: ['#5868b0', .3], glow: 1, win: '#ffffff', under: '#161513', water: ['#2a4f78', '#3b6fae', .35], cloud: '#7d88aa', fogTint: '#8d97b8' },
  };
  function phaseNow() {
    let sky = 'day', mist = false, wd = '一';
    try { const t = TaipeiTime.now(); sky = TaipeiTime.sky(t); mist = TaipeiTime.state(t) === 'mist'; wd = t.weekday; } catch (e) { /* 沒有時間模組就用白天 */ }
    return { sky, mist, wd };
  }
  function applyLook(ph) {
    const L = LOOKS[ph.sky] || LOOKS.day, gl = L.glow;
    look = { sky: ph.sky, mist: ph.mist, checked: performance.now(), L };
    if (scene.background && scene.background.dispose) scene.background.dispose();
    scene.background = canvasTex(4, 256, (x) => { const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, L.sky[0]); gr.addColorStop(.55, L.sky[1]); gr.addColorStop(1, L.sky[2]); x.fillStyle = gr; x.fillRect(0, 0, 4, 256); });
    scene.fog.color.set(L.fog); scene.fog.near = ph.mist ? 80 : 140; scene.fog.far = ph.mist ? 230 : 300;
    R.hemi.color.set(L.hemi[0]); R.hemi.groundColor.set(L.hemi[1]); R.hemi.intensity = L.hemi[2];
    R.sun.color.set(L.sun[0]); R.sun.intensity = L.sun[1]; R.sun.position.set(L.sun[2], L.sun[3], L.sun[4]);
    R.fill.color.set(L.fill[0]); R.fill.intensity = L.fill[1];
    R.cityMat.emissiveIntensity = gl;
    R.glowMat.color.set(L.win);
    R.t101Mat.emissive.set(gl > .25 ? WEEKDAY_101[ph.wd] || '#3fd46b' : '#000000'); R.t101Mat.emissiveIntensity = gl * .32;
    R.solidMat.emissive.set('#8a6a48'); R.solidMat.emissiveIntensity = gl * .3;   // 夜裡地標打上暖色投光
    R.wheelMat.emissiveIntensity = gl * .6;
    for (const [m, d, n] of R.lineMats) m.emissiveIntensity = d + (n - d) * gl;
    R.bodyMat.emissiveIntensity = .15 + gl * .4;
    R.trainMat.emissiveIntensity = .15 + gl * .7;
    R.waterMat.color.set(L.water[0]); R.waterMat.emissive.set(L.water[1]); R.waterMat.userData.e = L.water[2];
    R.under.color.set(L.under);
    R.cloudMat.color.set(L.cloud);
    for (const m of R.fogMats) m.color.set(L.fogTint);
    R.nightGlow.material.opacity = gl * .9; R.nightGlow.visible = gl > 0;
    R.stars.visible = ph.sky === 'night';
    R.sunSprite.visible = ph.sky === 'dusk' || ph.sky === 'dawn';
    R.sunSprite.position.set(ph.sky === 'dawn' ? 280 : -180, 16, ph.sky === 'dawn' ? 60 : -40);
    if (live) live.trains.im.visible = !ph.mist;   // 00:30–06:00 停駛
  }
  function skyExtras() {
    const g = new T.Group(), rnd = rng(23), sp = [];
    for (let i = 0; i < 320; i++) { const a = rnd() * Math.PI * 2, e = .12 + rnd() * 1.3, r = 380; sp.push(50 + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, 50 + Math.sin(a) * Math.cos(e) * r); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    R.stars = new T.Points(sg, new T.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: .85, depthWrite: false }));
    const sunTex = canvasTex(64, 64, (x) => { const gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(.25, 'rgba(255,190,120,.9)'); gr.addColorStop(1, 'rgba(255,150,90,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
    R.sunSprite = new T.Sprite(new T.SpriteMaterial({ map: sunTex, fog: false, transparent: true, depthWrite: false })); R.sunSprite.scale.set(70, 70, 1);
    g.add(R.stars, R.sunSprite);
    return g;
  }

  /* ── 每幀：會動的東西 ── */
  function tick(t, dt) {
    const L = live;
    if (!look.mist) tickTrains(L.trains, t);
    // 雲
    const co = .82 * smooth(36, 72, cam.dist) * (look.sky === 'night' ? .6 : 1);
    L.clouds.im.visible = co > .02; R.cloudMat.opacity = co;
    if (co > .02) { L.clouds.list.forEach((c, i) => { c.x += c.v * dt; if (c.x > 150) c.x = -50; L.clouds.im.setMatrixAt(i, _m.compose(_p.set(c.x, c.y, c.z), _q.identity(), _s.setScalar(c.s))); }); L.clouds.im.instanceMatrix.needsUpdate = true; }
    // 水面波光
    R.waterMat.map.offset.set((t * .045) % 1, Math.sin(t * .3) * .04);
    R.waterMat.emissiveIntensity = (R.waterMat.userData.e || .15) * (1 + .25 * Math.sin(t * 1.7));
    // 摩天輪
    if (L.wheel) L.wheel.rotation.z = t * .12;
    // 纜車
    const gd = L.gondola, tot = gd.cum[gd.cum.length - 1];
    for (let i = 0; i < gd.n; i++) {
      const s = ((i / gd.n) * tot + t * .35) % tot; let a = 0, b = gd.cum.length - 1; while (b - a > 1) { const md = (a + b) >> 1; if (gd.cum[md] <= s) a = md; else b = md; }
      _p.lerpVectors(gd.loop[a], gd.loop[b], (s - gd.cum[a]) / Math.max(1e-6, gd.cum[b] - gd.cum[a])); _p.y -= .2;
      gd.im.setMatrixAt(i, _m.compose(_p, _q.identity(), _s.setScalar(1)));
    }
    gd.im.instanceMatrix.needsUpdate = true;
    // 飛機：滑行、起飛、往東北爬升，消失後下一班
    const pl = L.plane, c = t % 34;
    pl.visible = c < 25;
    if (c < 4) { pl.position.set(71.2, .22, 33.4); pl.rotation.set(0, 0, 0); }
    else if (c < 12) { const u = (c - 4) / 8, lift = Math.max(0, u - .65) / .35; pl.position.set(71.2 + 11.5 * u * u, .22 + lift * .6, 33.4); pl.rotation.set(0, 0, lift * .18); }
    else { const v = (c - 12) / 13; pl.position.set(82.7 + v * 28, .82 + v * 13, 33.4 - v * v * 9); pl.rotation.set(-v * .25, v * .35, .18); }
    // 船
    const bt = L.boats, f = (Math.sin(t * .2) + 1) / 2, fp = L.ferry, nx = fp.tg.z, nz = -fp.tg.x;
    bt.setMatrixAt(0, _m.compose(_p.set(fp.p.x + nx * (f - .5) * 2, .05, fp.p.z + nz * (f - .5) * 2), _q.setFromAxisAngle(UP, Math.atan2(-nz, nx)), _s.setScalar(1)));
    const along = (pl2, u, side, i) => { const k = Math.min(pl2.length - 2, Math.floor(u)), a = pl2[k], b = pl2[k + 1], fr = u - k, dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; bt.setMatrixAt(i, _m.compose(_p.set(a.x + dx * fr - dz / l * side, .05, a.z + dz * fr + dx / l * side), _q.setFromAxisAngle(UP, Math.atan2(-dz, dx)), _s.setScalar(.9))); };
    along(L.cruise, 4 + (Math.sin(t * .04) + 1) * 14, .35, 1);
    along(L.blue, 12 + (Math.sin(t * .05 + 2) + 1) * 18, -.3, 2);
    bt.instanceMatrix.needsUpdate = true;
    // 溫泉熱氣
    L.steam.forEach((s, k) => { const p = (t * .22 + k / 3) % 1; s.position.set(L.bx + Math.sin(t * .7 + k) * .3, .4 + p * 3, L.bz); s.scale.setScalar(1 + p * 2.2); s.material.opacity = .55 * (1 - p) * Math.min(1, p * 5); });
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
    const dt = Math.min(.1, Math.max(0, (t - (lastT || t)) / 1000)); lastT = t;
    const w = container.clientWidth, h = container.clientHeight;
    if (renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) || renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    }
    updateCamera();
    const k = Math.min(1.6, Math.max(.7, cam.dist / 60));
    // 標籤：遠時只顯示轉乘站
    for (const l of labels) {
      l.visible = l.userData.transfer || cam.dist < 60;
      l.scale.set(l.userData.base * k * l.userData.aspect, l.userData.base * k, 1);
    }
    // 地標名牌：拉近才出現（101 一直在）
    for (const l of lmLabels) {
      l.visible = l.userData.always || cam.dist < 70;
      l.scale.set(l.userData.base * k * l.userData.aspect, l.userData.base * k, 1);
    }
    for (const f of fogs) {
      const u = f.userData;
      f.position.x = u.ox + Math.sin(t / 2400 + u.ph) * .6;
      f.position.z = u.oz + Math.cos(t / 3100 + u.ph) * .5;
    }
    if (live) tick(t / 1000, dt);
    if (t - look.checked > 30000) { const ph = phaseNow(); look.checked = t; if (ph.sky !== look.sky || ph.mist !== look.mist) applyLook(ph); }
    if (marker) { marker.position.y += Math.sin(t / 300) * .006; marker.rotation.y = t / 900; }
    if (opts.compass) opts.compass.style.transform = `rotate(${cam.yaw}rad)`;
    if (heroRig) heroRig.update(.016, 0, t / 1000);
    renderer.render(scene, camera);
  }

  function disposeScene() {
    if (!scene) return;
    if (hero) { hero.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach(m => m.dispose()); }); scene.remove(hero); }
    scene.traverse(x => {
      if (x.geometry) x.geometry.dispose();
      if (x.isInstancedMesh) x.dispose();
      if (x.material) [].concat(x.material).forEach(m => { if (m.map) m.map.dispose(); if (m.emissiveMap) m.emissiveMap.dispose(); m.dispose(); });
    });
    if (scene.background && scene.background.dispose) scene.background.dispose();
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
      // 每次打開都依目前進度重建（迷霧、位置、路網、天色）
      disposeScene();
      hero = heroRig = marker = null; live = null; lmLabels = []; R = {};
      scene = new T.Scene();
      scene.fog = new T.Fog('#dfeaf0', 140, 300);
      R.hemi = new T.HemisphereLight('#f4fbff', '#9a9580', 1.35); scene.add(R.hemi);
      R.sun = new T.DirectionalLight('#fff2dc', 1.9); R.sun.position.set(-40, 90, 30); scene.add(R.sun);
      R.fill = new T.DirectionalLight('#cfe2ff', .5); R.fill.position.set(60, 40, -50); scene.add(R.fill);
      segs = []; for (const s of MRT.segments()) { const a = STATIONS[s.a], b = STATIONS[s.b]; segs.push([a.x / S, a.y / S, b.x / S, b.y / S]); }
      riverPl = RIVERS.map(r => ({ r, pl: curveOf(r.pts).getSpacedPoints(160) }));
      scene.add(buildTerrain());
      scene.add(cityBlocks());
      const lm = buildLandmarks(); scene.add(lm.g);
      const ln = buildLines(); scene.add(ln.g);
      const trains = buildTrains(ln.paths); scene.add(trains.im);
      const clouds = buildClouds(); scene.add(clouds.im);
      scene.add(skyExtras());
      scene.add(buildStations());
      if (o.hiddenMap) scene.add(ghostMarker());
      live = { trains, clouds, wheel: lm.wheel, gondola: lm.gondola, plane: lm.plane, boats: lm.boats, ferry: lm.ferry, cruise: lm.cruise, blue: lm.blue, steam: lm.steam, bx: lm.bx, bz: lm.bz };
      applyLook(phaseNow());
      placeHero();
      this._solo = solo = null;
      if (o.current && STATIONS[o.current]) this.focus(o.current, 45);
      running = true; lastT = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
    close() { running = false; cancelAnimationFrame(raf); },
    focus(id, dist = 40) { const p = P(id); cam.tx = p.x; cam.tz = p.z; cam.dist = dist; },
    overview() { cam.tx = 50; cam.tz = 47; cam.dist = 95; cam.yaw = 0; cam.pitch = .95; },
    rotate(a) { cam.yaw += a; },
    // 只看某一條線（其他變淡、其他線的列車隱藏）；再按一次恢復
    focusLine(lid) {
      const s = lid && lid !== this._solo ? lid : null;
      this._solo = solo = s;
      for (const id in lineMeshes) for (const m of lineMeshes[id]) {
        const mt = m.material, u = mt.userData;
        if (u.op == null) { u.op = mt.opacity; u.tr = mt.transparent; }
        const dim = s && id !== s;
        mt.transparent = !!(dim || u.tr); mt.opacity = dim ? Math.min(u.op, .12) : u.op; mt.needsUpdate = true;
      }
      if (s) {
        const ids = [...new Set(LINES[s].routes.flat().map(r => r[0]))];
        const xs = ids.map(i => STATIONS[i].x / S), zs = ids.map(i => STATIONS[i].y / S);
        cam.tx = (Math.min(...xs) + Math.max(...xs)) / 2; cam.tz = (Math.min(...zs) + Math.max(...zs)) / 2;
        cam.dist = Math.max(40, Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) * 1.4);
      }
      return s;
    },
    zoom(f) { zoom(f); },
  };
})();
