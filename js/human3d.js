/* 3D 人物模型（程式建模＋骨架走路動畫）
 * 單位：公尺。模型正面朝 +z，腳底在 y = 0。
 * 主角（軒宇、愛紜）：分開的網格（換裝靠標籤換材質）；臉為手繪貼圖（軒宇：細長眼、自然眉；愛紜：大眼、眼線、紅唇），會眨眼。
 * 路人／NPC：所有部位合併成一個蒙皮網格（共用頂點色材質＋布料圖集），每人只有身體、臉、影子三個 draw call；
 *   依外觀參數判斷身分（站務員、捷運警察、清潔人員、外送員、學生、上班族、長輩、小朋友……）換上對應的制服細節。
 */
const Human3D = (() => {
  const T = THREE;
  const CACHE = {};
  const once = (k, f) => CACHE[k] || (CACHE[k] = f());

  // 布料雜訊貼圖，讓衣服看起來有材質
  function fabricTexture(base, opts = {}) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    const img = g.getImageData(0, 0, 256, 256), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - .5) * (opts.noise || 14);
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    if (opts.knit) {   // 針織紋
      g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1.4;
      for (let y = 0; y < 256; y += 6) for (let x = 0; x < 256; x += 8) {
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 5); g.lineTo(x + 8, y); g.stroke();
      }
    }
    if (opts.rib) {    // 羅紋
      g.fillStyle = 'rgba(0,0,0,.12)';
      for (let x = 0; x < 256; x += 6) g.fillRect(x, 0, 2, 256);
    }
    if (opts.draw) opts.draw(g);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    t.anisotropy = 4;
    return t;
  }

  // 材質小調整：輪廓邊緣稍微變暗（像淡淡的描邊），不用後製；所有人物材質共用同一段程式碼 → 同一個 shader
  const RIM = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>',
      'float rimF = 1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);\n' +
      'outgoingLight *= 1.0 - 0.3 * rimF * rimF * rimF;\n#include <opaque_fragment>');
  };

  // 換裝用：幫網格標上部位（top、bottom、shoes、hair、hairLong、bag、arm…）
  const tg = (o, ...tags) => { o.userData.tags = tags; return o; };
  const mat = (color, o = {}) => { const m = new T.MeshStandardMaterial({ color, roughness: o.rough ?? .85, metalness: o.metal ?? 0, map: o.map || null, side: o.side || T.FrontSide, transparent: !!o.transparent }); m.onBeforeCompile = RIM; return m; };
  const shared = m => { m.userData.shared = true; return m; };

  // 四肢：頂端在原點，往 -y 延伸（膠囊形的旋轉體，一個網格）
  function capsuleGeo(r1, r2, len, seg = 16) {
    const pts = [];
    for (let i = 0; i <= 3; i++) { const a = -Math.PI / 2 + i * Math.PI / 6; pts.push(new T.Vector2(Math.max(1e-4, r2 * Math.cos(a)), -len + r2 * Math.sin(a))); }
    for (let i = 0; i <= 3; i++) { const a = i * Math.PI / 6; pts.push(new T.Vector2(Math.max(1e-4, r1 * Math.cos(a)), r1 * Math.sin(a))); }
    const g = new T.LatheGeometry(pts, seg), P = g.attributes.position, U = g.attributes.uv;
    for (let i = 0; i < P.count; i++) U.setY(i, (P.getY(i) + len + r2) / (len + r1 + r2));   // 貼圖沿長度均勻分布
    return g;
  }
  function limb(r1, r2, len, material) {
    const grp = new T.Group(); grp.add(new T.Mesh(capsuleGeo(r1, r2, len, 20), material));
    return grp;
  }
  function box(w, h, d, material, x, y, z, parent) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), material); m.position.set(x, y, z); parent.add(m); return m; }
  function joint(x, y, z) { const g = new T.Group(); g.position.set(x, y, z); return g; }

  // 手：連指手套形（掌＋拇指），腕在 y = 0，往 -y
  function mittenGeo(r, seg = 10) {
    const palm = new T.SphereGeometry(r, seg, Math.max(6, seg * .7 | 0)); palm.scale(.78, 1.22, .55); palm.translate(0, -r * 1.05, 0);
    const th = new T.SphereGeometry(r * .42, 8, 6); th.scale(.9, 1.5, .9); th.rotateZ(.5); th.translate(0, -r * .75, r * .38);
    return mergeGeos([palm, th]);
  }
  // 簡單的幾何合併（位置、法線、uv）
  function mergeGeos(list) {
    let nv = 0, ni = 0;
    for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
    let vo = 0, io = 0;
    for (const g of list) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo; else for (let i = 0; i < n; i++) idx[io++] = vo + i;
      vo += n;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); out.setAttribute('uv', new T.BufferAttribute(uv, 2));
    out.setIndex(new T.BufferAttribute(idx, 1));
    return out;
  }

  // 以剖面旋轉出的軀幹（frontU=0.5 為正面）
  function lathe(points, material, scaleZ = .62) {
    const g = new T.LatheGeometry(points.map(([r, y]) => new T.Vector2(r, y)), 40, Math.PI, Math.PI * 2);
    const m = new T.Mesh(g, material);
    m.scale.z = scaleZ;
    return m;
  }

  // 頭髮外殼：完整球面，挖掉臉的部分（keep 決定哪些位置保留）；回傳幾何（只留用到的頂點）
  function shellGeo(r, keep, seg = 56, flare = .12) {
    const g = new T.SphereGeometry(r, seg, seg * .75 | 0);
    g.rotateY(Math.PI / 2);   // 接縫轉到側後方
    const pos = g.attributes.position, idx = g.index.array, out = [];
    const v = i => [pos.getX(i) / r, pos.getY(i) / r, pos.getZ(i) / r];
    for (let i = 0; i < idx.length; i += 3) {
      const a = v(idx[i]), b = v(idx[i + 1]), c = v(idx[i + 2]);
      if (keep((a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3)) out.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    // 髮尾略為外翻、蓬鬆
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / r;
      if (y < .2) { const k = 1 + (.2 - y) * flare; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    }
    // 只留用到的頂點
    const map = new Int32Array(pos.count).fill(-1); let n = 0;
    for (const i of out) if (map[i] < 0) map[i] = n++;
    const ng = new T.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) {
      const a = g.attributes[name], is = a.itemSize, arr = new Float32Array(n * is);
      for (let i = 0; i < map.length; i++) if (map[i] >= 0) for (let k = 0; k < is; k++) arr[map[i] * is + k] = a.array[i * is + k];
      ng.setAttribute(name, new T.BufferAttribute(arr, is));
    }
    ng.setIndex(out.map(i => map[i]));
    return ng;
  }
  function hairShell(r, keep, material, seg = 56) { return new T.Mesh(shellGeo(r, keep, seg), material); }

  /* ── 臉：透明底的手繪五官貼圖，蓋在膚色頭部前面（任何膚色都能共用）；三種狀態：睜眼、閉眼（眨眼）、張嘴（說話） ── */
  const FACE = {
    xuanyu: { eyeDX: 76, eyeW: 46, eyeH: 21, irisR: 20, iris: ['#4a3226', '#241812'], brow: 'rgba(24,20,20,.85)', browW: 11, browArch: 62, liner: 6, lip: '#c9837b', lipMode: 'lips', blush: .14, under: true },
    aiyun: { eyeDX: 78, eyeW: 50, eyeH: 30, irisR: 25, iris: ['#7a4a34', '#3a2018'], brow: 'rgba(74,38,32,.75)', browW: 7, browArch: 66, liner: 7, wing: true, double: true, lip: '#d0565a', lipMode: 'lips', blush: .38, look: 9, under: true, hl: 7 },
    m: { eyeDX: 74, eyeW: 40, eyeH: 21, irisR: 19, iris: ['#4a3226', '#1c120c'], brow: 'rgba(28,22,20,.92)', browW: 13, browArch: 60, liner: 8, lip: '#b8706a', lipMode: 'smile', blush: .12 },
    f: { eyeDX: 76, eyeW: 45, eyeH: 27, irisR: 22, iris: ['#5a3a2a', '#24140e'], brow: 'rgba(60,36,28,.85)', browW: 9, browArch: 64, liner: 9, wing: true, lip: '#c95a64', lipMode: 'lips', blush: .32 },
    k: { eyeDX: 72, eyeW: 42, eyeH: 34, irisR: 25, iris: ['#5a3a2a', '#1c120c'], brow: 'rgba(60,40,30,.7)', browW: 8, browArch: 70, liner: 8, lip: '#d0707a', lipMode: 'small', blush: .42, hl: 8 },
  };
  function faceSpec(id) {
    if (FACE[id]) return FACE[id];
    // NPC 變體：m/f/k ＋ o（年長）＋ l（淺色眉毛）
    const base = { ...FACE[id[0]] };
    if (id.includes('o')) { base.old = true; base.eyeH *= .78; base.irisR *= .9; base.brow = 'rgba(150,146,140,.95)'; base.blush *= .5; if (base.lipMode === 'lips') base.lip = '#b8767a'; }
    if (id.includes('l')) base.brow = 'rgba(150,108,66,.85)';
    return base;
  }
  function paintFace(sp, state, S) {
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    g.scale(S / 512, S / 512);
    g.translate(256, 290); g.scale(1.3, 1.3); g.translate(-256, -290);   // 五官整體放大
    const eyeY = 236, look = sp.look || 0;
    // 腮紅
    for (const sx of [-1, 1]) {
      const gr = g.createRadialGradient(256 + sx * 110, 318, 4, 256 + sx * 110, 318, 58);
      gr.addColorStop(0, `rgba(235,110,110,${sp.blush})`); gr.addColorStop(1, 'rgba(235,110,110,0)');
      g.fillStyle = gr; g.fillRect(100, 200, 312, 240);
    }
    // 眉毛
    g.strokeStyle = sp.brow; g.lineCap = 'round';
    for (const sx of [-1, 1]) {
      g.lineWidth = sp.browW;
      g.beginPath(); g.moveTo(256 + sx * 36, eyeY - 50); g.quadraticCurveTo(256 + sx * 78, eyeY - sp.browArch, 256 + sx * 122, eyeY - 48); g.stroke();
    }
    // 眼睛
    for (const sx of [-1, 1]) {
      const ex = 256 + sx * sp.eyeDX, w = sp.eyeW, h = sp.eyeH;
      if (state === 1) {   // 閉眼：往下彎的睫毛線
        g.strokeStyle = '#1a1210'; g.lineWidth = sp.liner;
        g.beginPath(); g.ellipse(ex, eyeY + h * .1, w * .92, h * .5, 0, Math.PI * .08, Math.PI * .92); g.stroke();
        if (sp.wing) { g.beginPath(); g.moveTo(ex + sx * w * .9, eyeY + h * .2); g.lineTo(ex + sx * (w + 10), eyeY + h * .05); g.stroke(); }
        continue;
      }
      g.save();
      g.beginPath(); g.ellipse(ex, eyeY, w, h, 0, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#fbf8f4'; g.fillRect(ex - w, eyeY - h, w * 2, h * 2);
      const ir = sp.irisR;
      const ig = g.createRadialGradient(ex + look, eyeY - 4, 2, ex + look, eyeY, ir);
      ig.addColorStop(0, sp.iris[0]); ig.addColorStop(.7, sp.iris[1]); ig.addColorStop(1, '#120a08');
      g.fillStyle = ig; g.beginPath(); g.arc(ex + look, eyeY + 2, ir, 0, 7); g.fill();
      g.fillStyle = '#0a0606'; g.beginPath(); g.arc(ex + look, eyeY + 2, ir * .45, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(ex + look + ir * .32, eyeY - ir * .28, sp.hl || Math.max(5, ir * .26), 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(ex + look - ir * .35, eyeY + ir * .4, Math.max(2.5, ir * .12), 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ex - w, eyeY - h, w * 2, 9);   // 上眼瞼陰影
      g.restore();
      // 上眼線（女生帶一點眼尾）
      g.strokeStyle = '#1a1210'; g.lineWidth = sp.liner;
      g.beginPath(); g.ellipse(ex, eyeY, w, h, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      if (sp.wing) { g.beginPath(); g.moveTo(ex + sx * (w - 2), eyeY - 6); g.lineTo(ex + sx * (w + 13), eyeY - 15); g.stroke(); }
      if (sp.double) { g.strokeStyle = 'rgba(120,70,55,.45)'; g.lineWidth = 3; g.beginPath(); g.ellipse(ex, eyeY - 8, w, h + 4, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      if (sp.under) { g.strokeStyle = 'rgba(120,70,55,.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(ex, eyeY + 2, w * .85, h, 0, Math.PI * .2, Math.PI * .8); g.stroke(); }
    }
    // 鼻子（陰影；鼻頭另有立體小凸起）
    g.strokeStyle = 'rgba(140,85,65,.4)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(250, 256); g.quadraticCurveTo(244, 300, 252, 318); g.stroke();
    g.fillStyle = 'rgba(140,85,65,.35)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(256 + sx * 14, 322, 7, 4, 0, 0, 7); g.fill(); }
    // 嘴
    if (state === 2) {   // 說話：張開的嘴
      g.fillStyle = '#5a1e22'; g.beginPath(); g.ellipse(256, 380, 24, 17, 0, 0, 7); g.fill();
      g.fillStyle = '#d06a6e'; g.beginPath(); g.ellipse(256, 390, 13, 6, 0, 0, 7); g.fill();
      g.strokeStyle = sp.lipMode === 'lips' ? sp.lip : 'rgba(120,60,50,.7)'; g.lineWidth = sp.lipMode === 'lips' ? 6 : 3;
      g.beginPath(); g.ellipse(256, 380, 25, 18, 0, 0, 7); g.stroke();
    } else if (sp.lipMode === 'lips') {
      g.fillStyle = sp.lip;
      g.beginPath(); g.moveTo(222, 372); g.quadraticCurveTo(240, 360, 256, 366); g.quadraticCurveTo(272, 360, 290, 372);
      g.quadraticCurveTo(256, 400, 222, 372); g.fill();
      g.strokeStyle = 'rgba(90,30,30,.55)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(224, 372); g.quadraticCurveTo(256, 380, 288, 372); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(262, 384, 10, 3, 0, 0, 7); g.fill();
    } else {   // 一條微笑線＋淡淡的下唇
      const w = sp.lipMode === 'small' ? 20 : 30;
      g.strokeStyle = 'rgba(110,50,45,.85)'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(256 - w, 370); g.quadraticCurveTo(256, 384, 256 + w, 370); g.stroke();
      g.fillStyle = sp.lip; g.globalAlpha = .45; g.beginPath(); g.ellipse(256, 386, w * .55, 5, 0, 0, 7); g.fill(); g.globalAlpha = 1;
    }
    if (sp.old) {   // 皺紋、法令紋
      g.strokeStyle = 'rgba(110,70,55,.4)'; g.lineWidth = 4;
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 128, 232); g.lineTo(256 + sx * 150, 222); g.stroke(); g.beginPath(); g.moveTo(256 + sx * 52, 330); g.quadraticCurveTo(256 + sx * 72, 356, 256 + sx * 64, 384); g.stroke(); }
      g.beginPath(); g.moveTo(206, 150); g.quadraticCurveTo(256, 142, 306, 150); g.stroke();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  // 臉部材質（依變體快取、所有人共用）：[睜眼, 閉眼, 說話]
  function faceMats(id) {
    return once('face:' + id, () => {
      const sp = faceSpec(id), S = FACE[id] && (id === 'xuanyu' || id === 'aiyun') ? 512 : 256;
      return [0, 1, 2].map(st => shared(new T.MeshStandardMaterial({ map: paintFace(sp, st, S), transparent: true, roughness: .7, depthWrite: false })));
    });
  }
  // 臉部貼片幾何（球面一部分，正面中心 u = .5）
  const faceGeo = seg => once('faceGeo' + seg, () => new T.SphereGeometry(.1138, seg, seg * 2 / 3 | 0, Math.PI / 2 - 1.05, 2.1, .62, 1.9));
  const SKULL = [.9, 1.08, .98];

  function face(charId, skin) {
    // 頭：膚色橢球＋五官貼片＋耳朵＋小鼻子
    const head = new T.Group();
    const skinM = mat(skin, { rough: .7 });
    const skull = new T.Mesh(new T.SphereGeometry(.112, 40, 28), skinM);
    head.scale.setScalar(1.12);
    skull.scale.set(...SKULL);
    head.add(skull);
    const fm = faceMats(charId);
    const fmesh = new T.Mesh(faceGeo(48), fm[0]); fmesh.userData.shared = true;
    fmesh.scale.copy(skull.scale);
    fmesh.renderOrder = 2;
    head.add(fmesh);
    head.userData.faceMesh = fmesh; head.userData.faceMats = fm;
    const nose = new T.Mesh(new T.SphereGeometry(.012, 12, 8), skinM); nose.scale.set(.9, 1, .75); nose.position.set(0, -.032, .106); head.add(nose);
    for (const s of [-1, 1]) {
      const ear = new T.Mesh(new T.SphereGeometry(.024, 12, 10), skinM);
      ear.scale.set(.5, 1, .8); ear.position.set(s * .1, -.005, -.005);
      head.add(ear);
    }
    return head;
  }
  // 主角的鞋：鞋面＋鞋底（＋鞋帶／鞋跟）
  function shoeParts(kn, P, o) {
    const shoe = new T.Mesh(new T.SphereGeometry(o.r, 20, 14), o.upper); shoe.scale.set(.85, o.flat, 1.68); shoe.position.set(0, -P.shin + o.dy, o.dz); kn.add(tg(shoe, 'shoes'));
    const sole = new T.Mesh(new T.BoxGeometry(o.r * 1.55, o.sole, o.r * 3.2), o.soleM); sole.position.set(0, -P.shin - .006 + (o.soleY || 0), o.dz); kn.add(sole);
    if (o.lace) { const lc = new T.Mesh(new T.BoxGeometry(.05, .008, .06), o.lace); lc.position.set(0, -P.shin + o.dy + o.r * o.flat * .92, o.dz + .05); lc.rotation.x = -.35; kn.add(lc); }
    if (o.heel) { const hl = new T.Mesh(new T.BoxGeometry(.06, .05, .05), o.soleM); hl.position.set(0, -P.shin - .006, o.dz - .07); kn.add(hl); }
  }

  /* ── 軒宇 ── */
  function xuanyu() {
    // 造型：白色毛海毛衣配黑色波浪條紋、藍色直筒牛仔褲、層次感長版黑髮、皮繩項鍊
    const skin = '#e2b49c', hair = '#111114';
    const stripes = (g, w = 256, h = 256, rows = 7) => {
      g.strokeStyle = '#1b1b1d'; g.lineWidth = h / rows * .32; g.lineCap = 'round';
      for (let r = 0; r < rows; r++) {
        const y0 = (r + .5) * h / rows;
        g.beginPath();
        for (let x = 0; x <= w; x += 4) g.lineTo(x, y0 + Math.sin(x / w * Math.PI * 6 + r) * h / rows * .18);
        g.stroke();
      }
      // 毛海質感
      for (let i = 0; i < 2600; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.08)'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 3 + Math.random() * 4); }
    };
    const sweatM = mat('#ffffff', { rough: .95, map: fabricTexture('#f1efe9', { noise: 18, draw: g => stripes(g, 256, 256, 7) }) });
    const sleeveTex = fabricTexture('#f1efe9', { noise: 18, draw: g => stripes(g, 256, 256, 4) });
    const sleeveM = mat('#ffffff', { rough: .95, map: sleeveTex });
    const ribM = mat('#ffffff', { map: fabricTexture('#ecebe6', { rib: true, noise: 10 }) });
    const pantsM = mat('#ffffff', { rough: .85, map: fabricTexture('#4f6584', { noise: 22, draw: g => { g.fillStyle = 'rgba(200,215,235,.18)'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * 256, Math.random() * 256, 1, 6); } }) });
    const skinM = mat(skin, { rough: .7 });
    const shoeM = mat('#f4f4f1', { rough: .6 }), soleM = mat('#dcdad4', { rough: .8 }), laceM = mat('#ffffff', { rough: .9 });
    const hairM = mat(hair, { rough: .55, side: T.DoubleSide, map: fabricTexture('#16161b', { noise: 30, draw: g => { g.strokeStyle = 'rgba(255,255,255,.06)'; for (let x = 0; x < 256; x += 3) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, 256); g.stroke(); } } }) });
    const cordM = mat('#2a2220', { rough: .6 });
    const silver = mat('#d6d8dc', { rough: .25, metal: .9 });

    const P = { hipY: .93, thigh: .45, shin: .45, torso: .5, shoulderX: .185, upper: .29, fore: .27 };
    const root = new T.Group();
    const hips = joint(0, P.hipY, 0); root.add(hips);
    const spine = joint(0, 0, 0); hips.add(spine);

    // 寬版毛衣
    const torso = lathe([[.0, -.08], [.212, -.08], [.222, .05], [.226, .2], [.228, .36], [.215, .46], [.15, .52], [.075, .55], [.07, .56]], sweatM, .62);
    spine.add(tg(torso, 'top'));
    const hem = lathe([[.214, -.12], [.218, -.12], [.222, -.05], [.215, -.05]], ribM, .62); spine.add(tg(hem, 'top'));
    const collar = new T.Mesh(new T.TorusGeometry(.068, .016, 10, 30), ribM); collar.rotation.x = Math.PI / 2; collar.position.y = .55; collar.scale.y = .62; spine.add(tg(collar, 'top'));
    // 牛仔褲頭
    const waist = lathe([[.0, -.16], [.2, -.16], [.205, -.08], [.0, -.08]], pantsM, .62); spine.add(tg(waist, 'bottom'));
    // 皮繩項鍊＋銀色扣環
    const cord = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(-.06, .55, .02), new T.Vector3(-.035, .44, .135), new T.Vector3(0, .38, .142), new T.Vector3(.035, .44, .135), new T.Vector3(.06, .55, .02),
    ]), 30, .004, 5, false), cordM); spine.add(cord);
    const clip = new T.Mesh(new T.TorusGeometry(.012, .004, 6, 12), silver); clip.position.set(0, .365, .145); spine.add(clip);

    // 脖子與頭
    const neck = limb(.045, .048, .1, skinM); neck.position.y = .62; spine.add(neck);
    const headJ = joint(0, .625, .01); spine.add(headJ);
    const head = face('xuanyu', skin, hair); head.position.y = .1; headJ.add(head);
    // 層次感長髮（狼尾）：瀏海到眉、側邊蓋住耳朵、後面到後頸
    const mush = hairShell(.14, (x, y, z) => {
      if (y > .3) return true;
      if (z < -.1) return y > -.98;
      if (Math.abs(x) > .7) return y > -.62;
      if (Math.abs(x) > .5) return y > .05;
      return false;
    }, hairM, 96);
    mush.scale.set(.95, 1.12, 1.04); mush.position.set(0, .1, -.006); headJ.add(tg(mush, 'hair'));
    // 後頸與側邊的髮尾層次
    for (let i = 0; i < 9; i++) {
      const a2 = Math.PI + (i - 4) * .3;
      const st = new T.Mesh(new T.ConeGeometry(.026, .11, 6), hairM);
      st.position.set(Math.sin(a2) * .125, -.02 - Math.abs(i - 4) * .006, Math.cos(a2) * .12);
      st.rotation.set(Math.PI + Math.cos(a2) * .35, 0, -Math.sin(a2) * .35);
      headJ.add(tg(st, 'hair', 'hairLong'));
    }
    // 瀏海髮束（稍微蓋到眉毛）
    for (let i = -2; i <= 2; i++) {
      const a2 = i * .26;
      const st = new T.Mesh(new T.ConeGeometry(.02, .05, 6), hairM);
      st.position.set(Math.sin(a2) * .133, .158, Math.cos(a2) * .136);
      st.rotation.set(Math.PI + .5, 0, -a2 * .5);
      headJ.add(tg(st, 'hair'));
    }
    // 耳環
    const ring = new T.Mesh(new T.TorusGeometry(.009, .0025, 6, 12), silver); ring.position.set(.112, .07, .0); ring.rotation.y = Math.PI / 2; headJ.add(ring);

    // 手臂
    const arms = [];
    for (const s of [-1, 1]) {
      const sh = joint(s * P.shoulderX, .45, 0); spine.add(sh);
      const up = limb(.07, .062, P.upper, sleeveM); sh.add(tg(up, 'top', 'sleeve'));
      const el = joint(0, -P.upper, 0); sh.add(el);
      const fo = limb(.06, .055, P.fore, sleeveM); el.add(tg(fo, 'top', 'sleeve'));
      const cuff = limb(.056, .052, .06, ribM); cuff.position.y = -P.fore + .04; el.add(tg(cuff, 'top', 'sleeve'));
      const hand = new T.Mesh(mittenGeo(.045, 14), skinM); hand.position.y = -P.fore - .025; el.add(hand);
      sh.rotation.z = s * .1;
      arms.push({ sh, el, s });
    }
    // 腿（直筒牛仔褲）
    const legs = [];
    for (const s of [-1, 1]) {
      const hp = joint(s * .1, 0, 0); hips.add(hp);
      const th = limb(.095, .085, P.thigh, pantsM); hp.add(tg(th, 'bottom', 'thigh'));
      const kn = joint(0, -P.thigh, 0); hp.add(kn);
      const sh = limb(.085, .082, P.shin - .04, pantsM); kn.add(tg(sh, 'bottom', 'shin'));
      shoeParts(kn, P, { r: .07, flat: .55, dy: .022, dz: .045, upper: shoeM, sole: .034, soleM: soleM, lace: laceM });   // 白色厚底球鞋
      legs.push({ hp, kn, s });
    }
    return { root, hips, spine, headJ, arms, legs, P, armSwing: .35, skinM, skin, faceMesh: head.userData.faceMesh, faceMats: head.userData.faceMats };
  }

  /* ── 愛紜 ── */
  function aiyun() {
    // 造型：黑色無袖高領合身上衣、長項鍊、深色刷色喇叭牛仔褲、黑色側背包
    const skin = '#f2cdb9', hair = '#24140f';
    const topM = mat('#ffffff', { rough: .75, map: fabricTexture('#141416', { rib: true, noise: 6 }) });
    // 刷色牛仔：大腿正面刷淡（圓柱貼圖的 u = 0／1 為正面）
    const jeansTex = fabricTexture('#1d1f24', {
      noise: 18,
      draw: g => {
        for (const [x0, x1, flip] of [[0, 56, false], [200, 256, true]]) {
          const gr = g.createLinearGradient(x0, 0, x1, 0);
          gr.addColorStop(flip ? 1 : 0, 'rgba(150,155,165,.55)'); gr.addColorStop(flip ? 0 : 1, 'rgba(150,155,165,0)');
          g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0, 256);
        }
      },
    });
    const jeansM = mat('#ffffff', { map: jeansTex, rough: .8 });
    const jeansDarkM = mat('#ffffff', { map: fabricTexture('#1a1b20', { noise: 16 }), rough: .8 });
    const skinM = mat(skin, { rough: .65 });
    const shoeM = mat('#141212', { rough: .35 }), bootSoleM = mat('#2a2624', { rough: .7 });
    const bagM = mat('#121214', { rough: .3, metal: .1 });
    const silver = mat('#d6d8dc', { rough: .25, metal: .9 });
    const hairM = mat('#ffffff', { rough: .5, side: T.DoubleSide, map: fabricTexture('#25150f', { noise: 22, draw: g => { for (let x = 0; x < 256; x += 2) { g.strokeStyle = `rgba(${Math.random() < .5 ? '90,55,40' : '8,4,3'},.25)`; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, 80, x - 10, 170, x + 4, 256); g.stroke(); } } }) });

    const P = { hipY: .9, thigh: .44, shin: .45, torso: .46, shoulderX: .16, upper: .27, fore: .25 };
    const root = new T.Group();
    const hips = joint(0, P.hipY, 0); root.add(hips);
    const spine = joint(0, 0, 0); hips.add(spine);

    // 低腰牛仔褲頭
    const waist = lathe([[.0, -.1], [.168, -.1], [.165, .02], [.0, .02]], jeansDarkM, .7); spine.add(tg(waist, 'bottom'));
    box(.022, .022, .01, silver, 0, -.02, .118, spine);
    // 合身無袖高領上衣（短版，露出一點腰）
    const torso = lathe([[.0, .06], [.148, .06], [.142, .16], [.152, .3], [.17, .4], [.155, .46], [.09, .5], [.058, .54], [.055, .6]], topM, .7);
    spine.add(tg(torso, 'top'));
    const waistSkin = lathe([[.146, .0], [.15, .0], [.15, .07], [.146, .07]], skinM, .7); spine.add(tg(waistSkin, 'midriff'));
    // 長項鍊與墜飾
    const chain = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(-.05, .56, .03), new T.Vector3(-.03, .45, .118), new T.Vector3(0, .34, .126), new T.Vector3(.03, .45, .118), new T.Vector3(.05, .56, .03),
    ]), 30, .0022, 4, false), silver); spine.add(chain);
    const pend = new T.Mesh(new T.BoxGeometry(.014, .045, .008), silver); pend.position.set(0, .31, .128); spine.add(pend);
    // 黑色側背包（掛在右肩，包在左腰側）
    const strap = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(-.13, .5, 0), new T.Vector3(-.15, .3, .1), new T.Vector3(-.19, .08, .1),
    ]), 20, .008, 5, false), bagM); spine.add(tg(strap, 'bag'));
    const bag = new T.Mesh(new T.CapsuleGeometry(.08, .1, 8, 16), bagM); bag.scale.set(1, 1, .5); bag.position.set(-.2, -.05, .07); bag.rotation.z = .15; spine.add(tg(bag, 'bag'));

    const neck = limb(.04, .043, .09, skinM); neck.position.y = .57; spine.add(neck);
    const headJ = joint(0, .565, .01); spine.add(headJ);
    const head = face('aiyun', skin, hair); head.position.y = .1; head.rotation.y = -.06; headJ.add(head);
    // 頭頂頭髮（中分）、空氣瀏海
    const cap = new T.Mesh(new T.SphereGeometry(.125, 36, 24, 0, Math.PI * 2, 0, 1.3), hairM); cap.scale.set(.96, 1.06, 1.04).multiplyScalar(1.12); cap.position.y = .128; headJ.add(tg(cap, 'hair'));
    const backCap = new T.Mesh(new T.SphereGeometry(.127, 36, 24, Math.PI, Math.PI, 0, 2.3), hairM); backCap.scale.set(.98, 1.06, 1.06).multiplyScalar(1.12); backCap.position.y = .125; headJ.add(tg(backCap, 'hair'));
    // 長捲髮（後）：開口圓柱加波浪
    const longG = new T.CylinderGeometry(.15, .19, .5, 40, 24, true, Math.PI * .32, Math.PI * 1.36);
    const pos = longG.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), x = pos.getX(i), z = pos.getZ(i);
      const a = Math.atan2(x, z);
      const w = 1 + .035 * Math.sin(y * 24 + a * 5) * (0.5 - y);
      pos.setX(i, x * w); pos.setZ(i, z * w);
    }
    longG.computeVertexNormals();
    const longHair = new T.Mesh(longG, hairM); longHair.position.set(0, -.12, -.03); longHair.scale.z = .82; headJ.add(tg(longHair, 'hair', 'hairLong'));
    // 臉旁兩側的長髮（垂到胸前）
    for (const s of [-1, 1]) {
      const g = new T.CylinderGeometry(.05, .065, .5, 16, 16, true);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + .02 * Math.sin(y * 22)); }
      g.computeVertexNormals();
      const lock = new T.Mesh(g, hairM); lock.position.set(s * .13, -.08, .04); lock.rotation.z = s * .08; headJ.add(tg(lock, 'hair', 'hairLong'));
    }
    // 空氣瀏海：前額一片薄髮＋幾束髮絲
    const fringe = new T.Mesh(new T.SphereGeometry(.128, 36, 20, .35, Math.PI - .7, .2, 1.18), hairM);
    fringe.scale.set(.96, 1.06, 1.08).multiplyScalar(1.12); fringe.position.y = .125; headJ.add(tg(fringe, 'hair'));
    for (const s2 of [-1, 1]) {
      const lockG = new T.Mesh(new T.SphereGeometry(.13, 16, 16, s2 > 0 ? .05 : Math.PI - .55, .5, .9, .75), hairM);
      lockG.scale.set(.98, 1.08, 1.1).multiplyScalar(1.12); lockG.position.y = .125; headJ.add(tg(lockG, 'hair'));
    }
    const arms = [];
    for (const s of [-1, 1]) {
      const sh = joint(s * P.shoulderX, .42, 0); spine.add(sh);
      const up = limb(.045, .038, P.upper, skinM); sh.add(tg(up, 'arm'));
      const el = joint(0, -P.upper, 0); sh.add(el);
      const fo = limb(.036, .03, P.fore, skinM); el.add(tg(fo, 'arm'));
      const band = new T.Mesh(new T.TorusGeometry(.034, .005, 6, 16), s > 0 ? silver : bagM); band.rotation.x = Math.PI / 2; band.position.y = -P.fore + .04; el.add(band);
      const hand = new T.Mesh(mittenGeo(.037, 14), skinM); hand.position.y = -P.fore - .01; el.add(hand);
      sh.rotation.z = s * .1;
      arms.push({ sh, el, s });
    }
    const legs = [];
    for (const s of [-1, 1]) {
      const hp = joint(s * .08, 0, 0); hips.add(hp);
      const th = limb(.078, .055, P.thigh, jeansM); hp.add(tg(th, 'bottom', 'thigh'));
      const kn = joint(0, -P.thigh, 0); hp.add(kn);
      const sh = limb(.052, .088, P.shin - .02, jeansDarkM); kn.add(tg(sh, 'bottom', 'shin'));   // 往下展開的喇叭褲管
      shoeParts(kn, P, { r: .056, flat: .48, dy: .02, dz: .05, upper: shoeM, sole: .018, soleY: .004, soleM: bootSoleM, heel: true });   // 黑色亮面短靴＋鞋跟
      legs.push({ hp, kn, s });
    }
    return { root, hips, spine, headJ, arms, legs, P, armSwing: .3, skinM, skin, girl: true, faceMesh: head.userData.faceMesh, faceMats: head.userData.faceMats };
  }


  /* ── 萬聖節裝扮 ── */
  /* ── 一般人物（NPC）：依外觀參數組合 ── */
  // 萬聖節裝扮（玩家的限定服裝與變裝路人共用）：H 頭部關節、S 脊椎關節、top0 頭頂高度
  function costume(kind, H, S, root, top0) {
    const add = (p, m, x, y, z) => { m.position.set(x, y, z); p.add(m); return m; };
    if (kind === 'witch') {   // 魔女帽
      const hm = mat('#2a1a3a', { rough: .8 });
      add(H, new T.Mesh(new T.CylinderGeometry(.27, .27, .015, 28), hm), 0, top0 + .04, 0);
      const cone = add(H, new T.Mesh(new T.ConeGeometry(.14, .36, 20), hm), 0, top0 + .22, -.02); cone.rotation.x = -.18; cone.rotation.z = .12;
      add(H, new T.Mesh(new T.TorusGeometry(.142, .018, 6, 24), mat('#e8741c')), 0, top0 + .07, -.005).rotation.x = Math.PI / 2;
    }
    if (kind === 'pumpkin') {   // 南瓜頭
      const c = document.createElement('canvas'); c.width = 256; c.height = 128;
      const g = c.getContext('2d'); g.fillStyle = '#e8741c'; g.fillRect(0, 0, 256, 128);
      g.strokeStyle = '#c45a10'; g.lineWidth = 6; for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
      g.fillStyle = '#2a1408';   // 臉在 u=.25 的位置（正前方）
      g.beginPath(); g.moveTo(48, 52); g.lineTo(60, 34); g.lineTo(72, 52); g.fill(); g.beginPath(); g.moveTo(56 + 32, 52); g.lineTo(68 + 32, 34); g.lineTo(80 + 32, 52); g.fill();
      g.beginPath(); g.moveTo(44, 72); for (let i = 0; i <= 8; i++) g.lineTo(44 + i * 9.5, 72 + (i % 2 ? 14 : 4)); g.lineTo(120, 72); g.quadraticCurveTo(82, 98, 44, 72); g.fill();
      const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
      const pk = add(H, new T.Mesh(new T.SphereGeometry(.2, 24, 16), mat('#ffffff', { map: tex, rough: .6 })), 0, .1, .01); pk.scale.set(1.08, .92, 1.02);
      add(H, new T.Mesh(new T.CylinderGeometry(.018, .025, .07, 8), mat('#3a6a2a')), 0, .3, 0);
    }
    if (kind === 'vampire') {   // 吸血鬼披風（外黑內紅）＋立領
      const cape = add(S, new T.Mesh(new T.CylinderGeometry(.2, .36, .95, 20, 1, true, Math.PI * .55, Math.PI * .9), mat('#140c10', { rough: .7, side: T.DoubleSide })), 0, .02, -.02);
      cape.rotation.y = Math.PI;
      for (const sx of [-1, 1]) { const col = add(S, new T.Mesh(new T.BoxGeometry(.13, .2, .02), mat('#8a1020', { rough: .6 })), sx * .1, .58, -.06); col.rotation.y = sx * .5; col.rotation.x = -.25; }
    }
    if (kind === 'ghost') {   // 白床單幽靈
      const sh = add(root, new T.Mesh(new T.CylinderGeometry(.22, .4, 1.45, 18, 1, true), mat('#f4f4f2', { rough: .9, side: T.DoubleSide })), 0, .74, 0);
      add(root, new T.Mesh(new T.SphereGeometry(.24, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f4f4f2', { rough: .9 })), 0, 1.46, 0);
      for (const sx of [-1, 1]) add(root, new T.Mesh(new T.SphereGeometry(.035, 10, 8), mat('#151515')), sx * .07, 1.5, .21);
      void sh;
    }
    if (kind === 'bats') {   // 身邊繞著飛的小蝙蝠
      const bm = new T.MeshBasicMaterial({ color: '#1a1420', side: T.DoubleSide });
      const grp = new T.Group(); grp.userData.spin = 1.2; root.add(grp);
      for (let i = 0; i < 4; i++) {
        const b = new T.Group(); b.position.set(Math.cos(i * 1.57) * .55, 1.5 + (i % 2) * .35, Math.sin(i * 1.57) * .55);
        for (const sx of [-1, 1]) { const w = new T.Mesh(new T.CircleGeometry(.07, 3), bm); w.position.x = sx * .06; w.rotation.y = Math.PI / 2; b.add(w); }
        b.add(new T.Mesh(new T.SphereGeometry(.03, 8, 6), bm)); grp.add(b);
      }
    }
  }

  /* ── 一般人物（NPC）：依外觀參數組合成一個蒙皮網格 ── */
  // 布料圖集（1024×512，8 格）：素面、皮膚、針織、條紋、格紋、頭髮、牛仔、羅紋；與頂點色相乘
  const ATLAS = { plain: [0, 0], skin: [1, 0], knit: [2, 0], stripe: [3, 0], check: [0, 1], hair: [1, 1], denim: [2, 1], rib: [3, 1] };
  function clothAtlas() {
    return once('atlas', () => {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
      const g = c.getContext('2d');
      const cell = (k, base, noise, draw) => {
        const [cx, cy] = ATLAS[k], x0 = cx * 256, y0 = cy * 256;
        g.fillStyle = base; g.fillRect(x0, y0, 256, 256);
        const img = g.getImageData(x0, y0, 256, 256), d = img.data;
        for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * noise; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
        g.putImageData(img, x0, y0);
        g.save(); g.beginPath(); g.rect(x0, y0, 256, 256); g.clip(); g.translate(x0, y0); if (draw) draw(g); g.restore();
      };
      cell('plain', '#f4f4f4', 14, g => { g.fillStyle = 'rgba(0,0,0,.035)'; for (let x = 0; x < 256; x += 4) g.fillRect(x, 0, 1, 256); });
      cell('skin', '#ffffff', 4);
      cell('knit', '#f6f6f6', 10, g => { g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1.6; for (let y = 0; y < 256; y += 7) for (let x = 0; x < 256; x += 8) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 5); g.lineTo(x + 8, y); g.stroke(); } });
      cell('stripe', '#f6f6f6', 10, g => { g.fillStyle = '#2a2a2a'; for (let y = 8; y < 256; y += 36) g.fillRect(0, y, 256, 13); });
      cell('check', '#f2f2f2', 10, g => { g.fillStyle = 'rgba(20,20,20,.38)'; for (let i = 0; i < 256; i += 32) { g.fillRect(i, 0, 12, 256); g.fillRect(0, i, 256, 12); } g.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 20; i < 256; i += 32) { g.fillRect(i, 0, 2, 256); g.fillRect(0, i, 256, 2); } });
      cell('hair', '#e8e8e8', 18, g => { for (let x = 0; x < 256; x += 2) { g.strokeStyle = Math.random() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.22)'; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 90, x - 6, 170, x + 2, 256); g.stroke(); } });
      cell('denim', '#f0f0f0', 22, g => { g.strokeStyle = 'rgba(0,0,0,.08)'; for (let i = -256; i < 256; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 300; i++) g.fillRect(Math.random() * 256, Math.random() * 256, 1, 5); });
      cell('rib', '#f4f4f4', 8, g => { g.fillStyle = 'rgba(0,0,0,.14)'; for (let x = 0; x < 256; x += 6) g.fillRect(x, 0, 2, 256); });
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
      return t;
    });
  }
  const npcMat = () => once('npcMat', () => { const m = shared(new T.MeshStandardMaterial({ vertexColors: true, map: clothAtlas(), roughness: .78 })); m.onBeforeCompile = RIM; return m; });

  // 共用的小工具
  const C = c => c instanceof T.Color ? c : new T.Color(c);
  const lum = hex => { const c = new T.Color(hex); c.convertLinearToSRGB(); return .299 * c.r + .587 * c.g + .114 * c.b; };
  const shade = (hex, k) => C(hex).clone().multiplyScalar(k);
  const mix = (a, b, t) => C(a).clone().lerp(C(b), t);
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const seeded = s => () => ((s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6D2B79F5 | 0) >>> 0) / 4294967296;
  const XF = new T.Matrix4(), XQ = new T.Quaternion(), XE = new T.Euler(), XP = new T.Vector3(), XS = new T.Vector3();

  // 有開口的旋轉體（外套、背心：正面的 V 領開口隨高度變寬）；gap(y) 回傳開口半角
  function latheGap(prof, seg, gap, sz = 1, rmod) {
    const n = prof.length, pos = [], uv = [], idx = [];
    for (let i = 0; i < n; i++) {
      const [r, y] = prof[i], g = gap(y);
      for (let j = 0; j <= seg; j++) {
        const phi = g + (Math.PI * 2 - 2 * g) * j / seg, rr = rmod ? rmod(r, phi, i / (n - 1)) : r;
        pos.push(rr * Math.sin(phi), y, rr * Math.cos(phi) * sz); uv.push(j / seg, i / (n - 1));
      }
    }
    const V = (p, a) => p * (seg + 1) + a;
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) { const a = V(i, j), b = V(i, j + 1), d = V(i + 1, j), c = V(i + 1, j + 1); idx.push(a, b, d, c, d, b); }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }
  function taper(geo, kTop, kBot) {   // 盒子上下寬度不同（領帶、外送箱…）
    const p = geo.attributes.position; geo.computeBoundingBox(); const b = geo.boundingBox;
    for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - b.min.y) / (b.max.y - b.min.y || 1); p.setX(i, p.getX(i) * (kBot + (kTop - kBot) * t)); }
    geo.computeVertexNormals(); return geo;
  }

  // 依外觀判斷身分（npcs.js 的路人外觀沒有帶類型，所以看制服顏色等特徵；也可以直接給 look.outfit）
  function roleOf(L) {
    if (L.outfit) return L.outfit;
    const top = String(L.top || '').toLowerCase(), hc = String(L.hatColor || '').toLowerCase();
    if (L.pattern === 'uniform') return lum(top) > .6 ? (L.hat || top === '#e9edf2' ? 'staff' : 'student') : 'conductor';
    if (top === '#1f2f4a' && L.hat === 'cap') return 'police';
    if (L.bag === 'backpack' && (String(L.bagColor).toLowerCase() === '#2fb36a' || top === '#e0447a') && L.hat) return 'delivery';
    if (L.hat === 'cap' && hc === top && ['#5a8a6a', '#3a6a8a'].includes(top)) return 'cleaner';
    if (L.hat === 'cap' && hc === top) { const c = new T.Color(top); c.convertLinearToSRGB(); if (c.r > .75 && c.g > .4 && c.b < .3) return 'worker'; if (lum(top) < .25) return 'guard'; }
    if (L.pattern === 'shirt') return 'office';
    if ((L.height || 1) < .8) return 'kid';
    if (L.old) return 'elder';
    return 'casual';
  }

  function person(look) {
    const L = { skin: '#e2b49c', hairColor: '#1a1a1a', top: '#7a7a80', bottom: '#2a2a2e', ...look };
    if (!L.hair) L.hair = L.girl ? 'long' : 'short';
    const girl = !!L.girl, h = L.height || 1, kid = h < .8, ts = kid ? .72 : h < .95 ? .94 : 1, hs = kid ? .9 : 1;
    const role = roleOf(L), rnd = seeded(hashStr(JSON.stringify(look)));
    const armK = kid ? ts : h;
    const P = { hipY: .9 * h, thigh: .44 * h, shin: .44 * h, upper: .28 * armK, fore: .26 * armK, shoulderX: (girl ? .165 : .185) * ts };
    // 骨架
    const root = new T.Group();
    const bone = (parent, x, y, z) => { const b = new T.Bone(); b.position.set(x, y, z); parent.add(b); return b; };
    const hips = bone(root, 0, P.hipY, 0), spine = bone(hips, 0, 0, 0), headJ = bone(spine, 0, .6 * ts, .01);
    const bones = [hips, spine, headJ], arms = [], legs = [];
    for (const sd of [-1, 1]) { const sh = bone(spine, sd * P.shoulderX, .44 * ts, 0), el = bone(sh, 0, -P.upper, 0); bones.push(sh, el); arms.push({ sh, el, s: sd, bi: bones.length - 2 }); }
    for (const sd of [-1, 1]) { const hp = bone(hips, sd * (girl ? .085 : .09) * ts, 0, 0), kn = bone(hp, 0, -P.thigh, 0); bones.push(hp, kn); legs.push({ hp, kn, s: sd, bi: bones.length - 2 }); }
    const HIP = 0, SPI = 1, HEAD = 2;
    // 部位清單：每個部位在所屬骨頭的座標系裡，最後一起烘焙合併
    const parts = [];
    const add = (bi, geo, color, o = {}) => { parts.push({ bi, geo, color: color && C(color), o }); return geo; };

    // ── 顏色與身分設定 ──
    const skin = C(L.skin), top = L.top, acc = L.accent;
    const W = { sleeve: top, fore: top, cuff: null, collar: 'crew', outer: null, tie: null, bow: null, belt: null, shoes: L.shoes, sole: null, socks: L.socks, hat: L.hat, hatColor: L.hatColor || '#1c2433', topTex: { stripe: 'stripe', knit: 'knit', check: 'check' }[L.pattern] || 'plain', shortSleeve: !!L.short, inner: top, hem: L.coat ? -.62 : L.skirt ? -.05 : -.1 };
    const light = lum(top) > .55;
    const V = (lo, hi, y0, y1) => y => y < y0 ? lo : y > y1 ? hi : lo + (hi - lo) * (y - y0) / (y1 - y0);   // 開口：y0 以下 lo，y1 以上 hi
    if (role === 'staff') {   // 站務員：淺藍短袖襯衫、深藍背心、領帶、名牌、制服帽
      W.inner = '#cfe0f2'; W.sleeve = '#cfe0f2'; W.shortSleeve = true; W.collar = 'shirt'; W.collarC = '#e4eef8';
      W.outer = { c: '#1d2a46', gap: V(.07, .62, .14, .5), cut: .5, buttons: '#c8ccd4' };
      W.tie = acc && lum(acc) > .12 && acc.toLowerCase() !== '#1f3a6b' ? acc : '#2d64b4'; W.belt = '#141414'; W.shoes = W.shoes || '#141414';
      W.badge = '#f4f4f2'; W.patch = '#2d64b4'; if (W.hat) W.hat = 'peak'; W.hatBadge = '#e8e8ea';
    } else if (role === 'student') {   // 高中制服：白襯衫（繡學號）、短袖；女生加領結
      W.collar = 'shirt'; W.shortSleeve = true; W.embro = acc || '#1f3a6b'; W.buttons = '#d8d8d8'; if (girl) W.bow = acc || '#1f3a6b'; else W.belt = '#1a1a1a';
      W.shoes = W.shoes || (rnd() < .5 ? '#f2f2ee' : '#1a1a1c'); if (L.skirt && !W.socks) W.socks = '#f4f4f2';
    } else if (role === 'conductor') {   // 深色制服外套、金扣、白襯衫
      W.inner = '#f2f2ee'; W.collar = 'shirt'; W.collarC = '#f2f2ee'; W.tie = '#1a1a1e';
      W.outer = { c: top, gap: V(.05, .45, .2, .5), cut: .52, buttons: acc || '#c8a040', trim: acc || '#c8a040' }; W.cuff = acc || '#c8a040';
      W.belt = null; W.shoes = W.shoes || '#141414'; if (W.hat) W.hat = 'peak'; W.hatBadge = acc || '#c8a040';
    } else if (role === 'police') {   // 捷運警察：淺藍襯衫、深藍夾克、肩章、警徽、勤務腰帶、無線電、大盤帽
      W.inner = '#bcd2ea'; W.collar = 'shirt'; W.collarC = '#bcd2ea'; W.tie = '#1a2234';
      W.outer = { c: top, gap: V(.03, .4, .3, .5), cut: .52, zip: '#3a4458' };
      W.epaulet = '#2a3a5a'; W.badge = '#d8b048'; W.badgeBig = true; W.radio = true; W.belt = '#141414'; W.duty = true; W.shoes = W.shoes || '#121212';
      W.hat = 'peak'; W.hatBadge = '#d8b048'; W.hatBand = '#141414';
    } else if (role === 'guard') {
      W.inner = '#c8d0dc'; W.collar = 'shirt'; W.collarC = '#c8d0dc'; W.tie = '#1a1a1e';
      W.outer = { c: top, gap: V(.03, .4, .3, .5), cut: .52, buttons: '#b8bcc4' }; W.epaulet = shade(top, .8); W.badge = '#c8ccd4'; W.belt = '#141414'; W.shoes = W.shoes || '#141414'; W.hat = 'peak'; W.hatBadge = '#c8ccd4';
    } else if (role === 'cleaner') {   // 清潔人員：工作服＋反光條、遮陽帽、手上拿拖把
      W.collar = 'polo'; W.reflect = true; W.apron = shade(top, .72); W.shoes = W.shoes || '#2a2a2a'; W.hat = 'capflap'; W.mop = rnd() < .65;
    } else if (role === 'worker') {   // 維修工：反光背心、工程帽
      W.collar = 'polo'; W.reflect = true; W.vest = true; W.hat = 'helmet'; W.hatColor = '#f2c200'; W.shoes = W.shoes || '#3a2a1e'; W.belt = '#2a2a2a';
    } else if (role === 'delivery') {   // 外送員：連帽外套（拉鍊）、保溫箱背包
      W.outer = { c: top, gap: () => .04, cut: .5, zip: '#e8e8e8' }; W.inner = '#2a2a2a'; W.collar = 'hood'; W.box = top; W.cuff = shade(top, .7);
      W.shoes = W.shoes || '#2a2a2e'; W.sole = '#e8e8e4';
    } else if (role === 'office') {
      if (light) { W.collar = 'shirt'; W.collarC = top; W.buttons = '#e0e0dc'; if (!girl) W.tie = acc || '#7a1f2b'; else W.bow = acc; W.belt = '#1a1a1a'; W.hem = L.skirt ? -.05 : -.04; }
      else { W.inner = '#f2f2ee'; W.collar = 'shirt'; W.collarC = '#f2f2ee'; if (!girl) W.tie = acc || '#7a1f2b'; W.outer = { c: top, gap: V(.07, .5, .12, .46), cut: .5, buttons: shade(top, .55), lapel: true }; }
      W.shoes = W.shoes || '#141212'; W.sole = '#0c0c0c';
    } else if (role === 'elder') {   // 長輩：針織開衫、拐杖（部分）
      if (L.pattern === 'knit' || rnd() < .5) { W.inner = girl ? '#efe6d8' : '#e8e4da'; W.collar = girl ? 'crew' : 'shirt'; W.collarC = W.inner; W.outer = { c: top, gap: V(.06, .3, .1, .48), cut: .5, buttons: shade(top, .6), tex: 'knit' }; }
      W.cane = !girl ? rnd() < .5 : rnd() < .3; W.shoes = W.shoes || (girl ? '#4a3a32' : '#2a2420');
    } else if (role === 'kid') {
      W.shortSleeve = true; W.shoes = W.shoes || ['#e04848', '#3aa0c0', '#f2f2ee'][(rnd() * 3) | 0]; W.sole = '#f2f2ee';
    } else {
      if (L.coat) { W.inner = light ? '#3a3a40' : '#ece8e0'; W.outer = { c: top, gap: V(.06, .45, .1, .45), cut: .5, buttons: shade(top, .5), coat: true, lapel: true }; W.collar = 'turtle'; }
      else if (rnd() < .35 && !girl) W.collar = 'hood';
      W.shoes = W.shoes || ['#f2f2ee', '#2a2a2e', '#8a8a90', '#f2f2ee'][(rnd() * 4) | 0];
    }
    if (L.sleeveless) { W.sleeve = null; W.fore = null; }
    else if (W.shortSleeve) W.fore = null;
    else { W.fore = W.outer ? W.outer.c : W.sleeve; if (W.outer) W.sleeve = W.outer.c; }
    if (L.coat && W.outer) { W.outer.hem = -.62; }
    W.sole = W.sole || (lum(W.shoes || '#2a2a2e') > .5 ? '#d8d6d0' : '#e8e6e0');
    if (['office', 'staff', 'police', 'guard', 'conductor'].includes(role)) W.sole = '#0c0c0c';

    // ── 軀幹（脊椎骨）──
    const prof = (girl
      ? [[0, W.hem], [.185, W.hem], [.172, .06], [.165, .16], [.182, .3], [.19, .38], [.175, .45], [.128, .505], [.066, .545], [.058, .56]]
      : [[0, W.hem], [.205, W.hem], [.2, .05], [.212, .22], [.222, .36], [.21, .45], [.15, .515], [.075, .55], [.065, .565]]).map(([r, y]) => [r * ts, y * ts]);
    const SZ = .62;
    const rAt = y => { if (y <= prof[1][1]) return prof[1][0]; for (let i = 2; i < prof.length; i++) if (y <= prof[i][1]) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; return r0 + (r1 - r0) * (y - y0) / ((y1 - y0) || 1); } return prof[prof.length - 1][0]; };
    const chestZ = (y, x = 0, o = 0) => { const r = rAt(y) + o; return SZ * Math.sqrt(Math.max(0, r * r - x * x)) + .004; };
    const torsoG = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), 16, Math.PI, Math.PI * 2);
    torsoG.scale(1, 1, SZ);
    add(SPI, torsoG, W.inner, { t: W.outer ? 'plain' : W.topTex });
    if (W.reflect && !W.vest) for (const y of [.2, .31]) { const r = rAt(y * ts) + .006; add(SPI, new T.CylinderGeometry(r, r, .028 * ts, 16, 1, true), '#d8dce0', { p: [0, y * ts, 0], s: [1, 1, SZ + .02], flip: true }); }
    const yS = ts;   // 高度比例
    // 外套／背心／開衫
    if (W.outer) {
      const O = W.outer, hem = O.hem ?? (W.hem - .02), cut = O.cut * yS;
      const op = prof.filter(([, y]) => y <= cut + 1e-6 && y > hem * yS + 1e-6).map(([r, y]) => [r * 1.06 + .008, y]);
      op.unshift([(rAt(hem * yS) + (O.coat ? .04 : .01)) * 1.06 + .008, hem * yS]); op.push([rAt(cut) * 1.04 + .006, cut]);
      const og = latheGap(op, 18, y => O.gap(y / yS), SZ);
      add(SPI, og, O.c, { t: O.tex || 'plain', flip: true });
      if (O.buttons) for (const y of [.08, .19, .3]) if (y > hem + .03 && O.gap(y) < .2) for (const sx of O.coat ? [-1, 1] : [1]) add(SPI, new T.SphereGeometry(.009 * ts, 6, 4), O.buttons, { p: [Math.sin(O.gap(y) + .06) * (rAt(y * yS) * 1.06 + .01) * sx, y * yS, chestZ(y * yS, Math.sin(O.gap(y) + .06) * rAt(y * yS), .02)] });
      if (O.zip) add(SPI, new T.BoxGeometry(.008, (cut - hem * yS) * .92, .006), O.zip, { p: [0, (cut + hem * yS) / 2, chestZ(.25 * yS, 0, .018)], r: [-.05, 0, 0] });
      if (O.lapel) for (const sx of [-1, 1]) add(SPI, taper(new T.BoxGeometry(.05 * ts, .16 * ts, .012), 1.4, .4), shade(O.c, .82), { p: [sx * .06 * ts, .42 * ts, chestZ(.42 * yS, .06 * ts, .02)], r: [-.35, 0, sx * .32] });
      if (O.trim) add(SPI, new T.CylinderGeometry(rAt(hem * yS) * 1.07 + .01, rAt(hem * yS) * 1.07 + .01, .015, 16, 1, true), O.trim, { p: [0, hem * yS + .01, 0], s: [1, 1, SZ], flip: true });
    }
    if (W.vest) {   // 螢光背心：只有背心（上半身），加兩條反光帶
      const op = prof.filter(([, y]) => y > .02 * yS && y <= .5 * yS).map(([r, y]) => [r * 1.05 + .008, y]);
      add(SPI, latheGap(op, 18, y => y / yS > .38 ? .5 : .1, SZ), '#d8e020', { flip: true });
      for (const y of [.19, .31]) { const r = rAt(y * ts) * 1.05 + .012; add(SPI, latheGap([[r, y * ts - .014], [r, y * ts + .014]], 18, () => .1, SZ), '#e4e8ec', { flip: true }); }
    }
    // 領子
    const neckY = .55 * ts;
    if (W.collar === 'crew' || W.collar === 'turtle') add(SPI, new T.TorusGeometry(.068 * ts, (W.collar === 'turtle' ? .022 : .014) * ts, 5, 14), shade(W.inner, .9), { p: [0, neckY + (W.collar === 'turtle' ? .012 : 0), 0], r: [Math.PI / 2, 0, 0], s: [1, SZ + .12, 1], t: 'rib' });
    if (W.collar === 'shirt' || W.collar === 'polo') {
      const cc = W.collarC || W.inner;
      add(SPI, new T.TorusGeometry(.066 * ts, .012 * ts, 4, 14), cc, { p: [0, neckY - .005, 0], r: [Math.PI / 2, 0, 0], s: [1, SZ + .12, 1] });
      for (const sx of [-1, 1]) add(SPI, taper(new T.BoxGeometry(.07 * ts, .05 * ts, .01), .6, 1.2), cc, { p: [sx * .036 * ts, neckY - .028 * ts, chestZ(neckY - .03 * ts, .036 * ts, .012)], r: [-.55, sx * .15, sx * .75] });
    }
    if (W.collar === 'hood') add(SPI, new T.TorusGeometry(.1 * ts, .04 * ts, 6, 14, Math.PI * 1.3), W.outer ? W.outer.c : top, { p: [0, (neckY - .02 * ts), -.05 * ts], r: [Math.PI / 2 - .3, 0, Math.PI * .85] });
    if (W.tie) {
      add(SPI, taper(new T.BoxGeometry(.042 * ts, .22 * ts, .012), .65, 1.25), W.tie, { p: [0, .41 * ts, chestZ(.41 * ts, 0, .004)], r: [-.14, 0, 0] });
      add(SPI, new T.BoxGeometry(.03 * ts, .025 * ts, .018), shade(W.tie, .85), { p: [0, .525 * ts, chestZ(.52 * ts, 0, .008)], r: [-.3, 0, 0] });
    }
    if (W.bow) for (const sx of [-1, 1]) add(SPI, new T.ConeGeometry(.024 * ts, .05 * ts, 5), W.bow, { p: [sx * .022 * ts, .5 * ts, chestZ(.5 * ts, 0, .012)], r: [0, 0, sx * Math.PI / 2] });
    if (W.buttons && !W.outer) for (const y of [.18, .28, .38, .46]) add(SPI, new T.SphereGeometry(.007 * ts, 5, 3), W.buttons, { p: [0, y * ts, chestZ(y * ts, 0, .002)] });
    if (W.embro) { add(SPI, new T.BoxGeometry(.06 * ts, .01 * ts, .006), W.embro, { p: [.075 * ts, .39 * ts, chestZ(.39 * ts, .075 * ts, .002)], r: [0, .45, 0] }); add(SPI, new T.BoxGeometry(.045 * ts, .008 * ts, .006), W.embro, { p: [.072 * ts, .365 * ts, chestZ(.365 * ts, .072 * ts, .002)], r: [0, .45, 0] }); }
    if (W.badge) { const big = W.badgeBig, ob = W.outer ? .016 : .004; add(SPI, big ? new T.CylinderGeometry(.022, .022, .006, 6) : new T.BoxGeometry(.05 * ts, .022 * ts, .006), W.badge, { p: [.08 * ts, .36 * ts, chestZ(.36 * ts, .08 * ts, ob) + .002], r: big ? [Math.PI / 2, 0, 0] : [0, .45, 0] }); if (big) add(SPI, new T.BoxGeometry(.05, .014, .006), '#e8e8e8', { p: [-.08 * ts, .36 * ts, chestZ(.36 * ts, .08 * ts, ob) + .002], r: [0, -.45, 0] }); }
    if (W.radio) { add(SPI, new T.BoxGeometry(.035, .06, .02), '#1a1a1a', { p: [.1 * ts, .44 * ts, chestZ(.44 * ts, .1 * ts, .02)], r: [-.2, .5, 0] }); add(SPI, new T.CylinderGeometry(.004, .004, .05, 4), '#1a1a1a', { p: [.11 * ts, .5 * ts, chestZ(.44 * ts, .1 * ts, .01)] }); }
    if (W.epaulet) for (const sx of [-1, 1]) add(SPI, new T.BoxGeometry(.11 * ts, .014, .05), W.epaulet, { p: [sx * .12 * ts, .505 * ts, 0], r: [0, 0, -sx * .45] });
    if (W.apron) add(SPI, taper(new T.BoxGeometry(.24 * ts, .36 * ts, .012), .8, 1.05), W.apron, { p: [0, .06 * ts, chestZ(.06 * ts, 0, .012)], r: [.05, 0, 0] });
    // 脖子
    add(SPI, capsuleGeo(.042 * ts, .045 * ts, .09 * ts, 8), skin, { p: [0, .6 * ts, 0], t: 'skin' });
    // 圍巾
    if (L.scarf) { add(SPI, new T.TorusGeometry(.085 * ts, .035 * ts, 6, 14), L.scarf, { p: [0, neckY, 0], r: [Math.PI / 2, 0, 0], s: [1, .7, 1], t: 'knit' }); add(SPI, new T.BoxGeometry(.07, .3 * ts, .025), L.scarf, { p: [.05, .38 * ts, chestZ(.38 * ts, .05, .03)], r: [0, 0, .12], t: 'knit' }); }

    // ── 腰（髖骨）：褲頭、皮帶、裙子 ──
    const pr = (girl ? .185 : .2) * ts;
    add(HIP, new T.LatheGeometry([[0, -.13], [pr * .82, -.13], [pr * .96, -.07], [pr * .97, -.02], [pr * .9, .0], [0, .0]].map(([r, y]) => new T.Vector2(r, y * ts)), 14), L.bottom, { s: [1, 1, .6], t: 'plain' });
    if (W.belt && !L.skirt && !(W.outer && W.outer.cut)) {
      add(HIP, new T.CylinderGeometry(pr * 1.0, pr * 1.0, .03 * ts, 14, 1, true), W.belt, { p: [0, -.035 * ts, 0], s: [1, 1, .64], flip: true });
      add(HIP, new T.BoxGeometry(.04, .026 * ts, .008), '#b8b8b0', { p: [0, -.035 * ts, pr * .64 + .004] });
      if (W.duty) for (const sx of [-1, 1]) { add(HIP, new T.BoxGeometry(.05, .07, .045), '#161616', { p: [sx * .17 * ts, -.04 * ts, .03] }); add(HIP, new T.BoxGeometry(.04, .09, .04), '#1e1e1e', { p: [sx * .16 * ts, -.05 * ts, -.08] }); }
    }
    if (L.skirt) {
      const sk = [[.25, -.36], [.235, -.25], [.21, -.12], [.19, .0]].map(([r, y]) => [r * ts, y * ts]);
      add(HIP, latheGap(sk, 20, () => 0, .72, (r, phi, t) => r * (1 + .045 * (1 - t) * Math.sin(phi * 14))), L.bottom, { p: [0, -.02 * ts, 0], t: L.pattern === 'uniform' || role === 'student' ? 'check' : 'plain', flip: true });
    }

    // ── 頭（頭部骨）──
    const HS = new T.Matrix4().makeScale(hs, hs, hs);
    const headM = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => HS.clone().multiply(XF.compose(XP.set(x, y, z), XQ.setFromEuler(XE.set(rx, ry, rz)), XS.set(sx, sy, sz)).clone());
    const skull = new T.SphereGeometry(.112, 18, 12);
    add(HEAD, skull, skin, { m: headM(0, .1, 0, 0, 0, 0, 1.12 * SKULL[0], 1.12 * SKULL[1], 1.12 * SKULL[2]), t: 'skin' });
    add(HEAD, new T.SphereGeometry(.012, 6, 4), skin, { m: headM(0, .1 - .032 * 1.12, .106 * 1.12, 0, 0, 0, .9 * 1.12, 1.12, .75 * 1.12), t: 'skin' });
    for (const s of [-1, 1]) add(HEAD, new T.SphereGeometry(.024, 6, 5), skin, { m: headM(s * .1 * 1.12, .1 - .005 * 1.12, -.005, 0, 0, 0, .5 * 1.12, 1.12, .8 * 1.12), t: 'skin' });
    // 髮型
    const hc = C(L.hairColor), sheen = mix(L.hairColor, '#b8b0a8', lum(L.hairColor) < .2 ? .22 : .12);
    const hairVC = R => (x, y, z) => { const yn = y / R, base = hc.clone().multiplyScalar(.72 + .28 * Math.min(1, Math.max(0, (yn + .7) / 1.3))); return yn > .42 && yn < .72 && z > 0 ? base.lerp(sheen, .6) : base; };
    const style = L.hair, a = (x, z) => Math.atan2(x, z);
    const keeps = {
      short: (x, y, z) => y > .32 + .05 * Math.abs(Math.sin(a(x, z) * 9)) || (z < -.15 && y > -.42) || (Math.abs(x) > .8 && y > .05 && z < .3),
      mush: (x, y, z) => y > .24 + .08 * Math.abs(Math.sin(a(x, z) * 7)) || (z < -.1 && y > -.65) || (Math.abs(x) > .76 && y > -.15),
      bob: (x, y, z) => y > .26 + .05 * Math.abs(Math.sin(a(x, z) * 8)) || (z < -.05 && y > -.92) || (Math.abs(x) > .68 && y > -.88),
      long: (x, y, z) => y > .3 + .04 * Math.sin(a(x, z) * 6) || z < 0 || Math.abs(x) > .7,
      bun: (x, y, z) => y > .42 || (z < -.1 && y > -.5) || (Math.abs(x) > .85 && y > 0),
      bald: L.old && !girl ? (x, y, z) => (z < -.25 || Math.abs(x) > .82) && y > -.4 && y < .25 : null,
    };
    const keep = style in keeps ? keeps[style] : keeps.short;
    const hatOn = W.hat && W.hat !== 'beret';
    if (keep) {
      const R = .137, flare = style === 'bob' ? .2 : style === 'mush' ? .1 : style === 'short' ? .03 : .08;
      add(HEAD, shellGeo(R, keep, 22, flare), null, { m: headM(0, .1, -.004, 0, 0, 0, .94 * (style === 'mush' ? 1.03 : 1), 1.1, 1.02 * (style === 'mush' ? 1.03 : 1)), vc: hairVC(R), t: 'hair', flip: style === 'bob' || style === 'long' });
      if (style === 'long') {
        const lg = new T.CylinderGeometry(.14, .17, .42, 14, 5, true, Math.PI * .32, Math.PI * 1.36);
        const p = lg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), w = 1 + .03 * Math.sin(y * 24 + Math.atan2(p.getX(i), p.getZ(i)) * 5) * (.5 - y); p.setX(i, p.getX(i) * w); p.setZ(i, p.getZ(i) * w); }
        add(HEAD, lg, null, { m: headM(0, -.13, -.02, 0, 0, 0, 1, 1, .82), vc: (x, y) => hc.clone().multiplyScalar(.85 + .35 * (y + .21) / .42), t: 'hair', flip: true });
        if (girl) for (const s of [-1, 1]) add(HEAD, new T.CylinderGeometry(.045, .06, .3, 8, 3, true), null, { m: headM(s * .128, -.03, .035, 0, 0, s * .1), vc: (x, y) => hc.clone().multiplyScalar(.85 + .3 * (y + .15) / .3), t: 'hair', flip: true });
      }
      if (style === 'bun') { add(HEAD, new T.SphereGeometry(.062, 10, 8), null, { m: headM(0, .215, -.1), vc: hairVC(.06), t: 'hair' }); add(HEAD, new T.TorusGeometry(.04, .012, 4, 10), acc || '#8a2a3a', { m: headM(0, .18, -.075, .9, 0, 0) }); }
    }
    // 帽子
    const hcol = W.hatColor;
    const H = (geo, c, x, y, z, rx, ry, rz, sx, sy, sz, o = {}) => add(HEAD, geo, c, { m: headM(x, y, z, rx, ry, rz, sx, sy, sz), ...o });
    if (W.hat === 'cap' || W.hat === 'capflap') {
      H(new T.SphereGeometry(.15, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), hcol, 0, .17, 0, 0, 0, 0, 1, .7, 1.05);
      H(new T.CylinderGeometry(.1, .1, .012, 10, 1, false, -Math.PI / 2, Math.PI), shade(hcol, .85), 0, .172, .12, .08, 0, 0, 1, 1, 1.45);
      H(new T.SphereGeometry(.014, 5, 3), shade(hcol, .8), 0, .275, 0);
      if (W.hat === 'capflap') H(new T.BoxGeometry(.24, .13, .01), hcol, 0, .12, -.135, .15, 0, 0, 1, 1, 1, { flip: true });
    }
    if (W.hat === 'peak') {   // 大盤帽（制服帽）
      H(new T.CylinderGeometry(.158, .132, .075, 16), hcol, 0, .215, -.005, -.08, 0, 0, 1, 1, 1.02);
      H(new T.CylinderGeometry(.134, .134, .032, 16, 1, true), W.hatBand || shade(hcol, .7), 0, .175, -.005, 0, 0, 0, 1, 1, 1.02, { flip: true });
      H(new T.CylinderGeometry(.105, .105, .01, 10, 1, false, -Math.PI / 2, Math.PI), '#0e0e10', 0, .165, .1, .32, 0, 0, 1, 1, 1.2);
      H(new T.CylinderGeometry(.018, .018, .006, 6), W.hatBadge || '#d8b048', 0, .21, .142, Math.PI / 2 - .08, 0, 0);
    }
    if (W.hat === 'helmet') {
      H(new T.SphereGeometry(.158, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), hcol, 0, .165, 0, 0, 0, 0, 1, .82, 1.08);
      H(new T.CylinderGeometry(.18, .185, .012, 16), hcol, 0, .168, .01, 0, 0, 0, 1, 1, 1.12);
      H(new T.BoxGeometry(.03, .03, .3), shade(hcol, .9), 0, .29, 0);
    }
    if (W.hat === 'beret') { H(new T.SphereGeometry(.16, 14, 7), hcol, -.02, .235, -.01, 0, 0, .18, 1.12, .38, 1.1, { t: 'knit' }); H(new T.CylinderGeometry(.008, .008, .03, 4), hcol, -.02, .3, 0); }
    if (W.hat === 'beanie') { H(new T.SphereGeometry(.148, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), hcol, 0, .15, -.005, 0, 0, 0, 1, 1, 1.05, { t: 'knit' }); H(new T.CylinderGeometry(.152, .152, .05, 14, 1, true), shade(hcol, .9), 0, .165, -.005, 0, 0, 0, 1, 1, 1.05, { t: 'rib', flip: true }); }
    if (W.hat === 'fedora') { H(new T.CylinderGeometry(.1, .125, .12, 12), hcol, 0, .25, -.005); H(new T.CylinderGeometry(.22, .22, .012, 16), hcol, 0, .19, 0, .06, 0, 0); H(new T.CylinderGeometry(.127, .127, .025, 12, 1, true), '#1a1a1a', 0, .2, -.005, 0, 0, 0, 1, 1, 1, { flip: true }); }
    void hatOn;
    // 眼鏡
    if (L.glasses) {
      for (const sx of [-1, 1]) { H(new T.TorusGeometry(.027, .0045, 4, 10), '#1a1a1a', sx * .046, .108, .128); H(new T.BoxGeometry(.005, .005, .12), '#1a1a1a', sx * .078, .112, .07); }
      H(new T.BoxGeometry(.03, .005, .005), '#1a1a1a', 0, .112, .13);
    }

    // ── 手臂 ──
    for (const A of arms) {
      const sb = A.bi, eb = A.bi + 1, sc = W.sleeve;
      add(sb, capsuleGeo(.056 * ts, .05 * ts, P.upper, 10), sc && !W.shortSleeve ? sc : skin, { t: sc && !W.shortSleeve ? W.outer ? W.outer.tex || 'plain' : W.topTex : 'skin' });
      if (sc && W.shortSleeve) add(sb, capsuleGeo(.068 * ts, .062 * ts, P.upper * .42, 10), sc, { t: W.topTex });
      if (W.patch && A.s > 0) add(sb, new T.BoxGeometry(.012, .04, .035), W.patch, { p: [.062 * ts, -.07, 0] });
      add(eb, capsuleGeo(.049 * ts, .043 * ts, P.fore, 10), W.fore || skin, { t: W.fore ? W.outer ? W.outer.tex || 'plain' : W.topTex : 'skin' });
      if (W.fore && W.cuff !== false) add(eb, new T.CylinderGeometry(.047 * ts, .047 * ts, .03, 10, 1, true), W.cuff || shade(W.fore, .85), { p: [0, -P.fore + .015, 0], t: 'rib', flip: true });
      add(eb, mittenGeo(.04 * ts, 8), skin, { p: [0, -P.fore - .005, 0], t: 'skin' });
    }
    const right = arms[1], left = arms[0];
    // 拐杖（左手）、拖把（右手）
    const handY = P.hipY + .44 * ts - P.upper - P.fore - .04;
    if (W.cane) {
      const len = handY - .01;
      add(left.bi + 1, new T.CylinderGeometry(.011, .011, len, 6), '#5a3a22', { p: [0, -P.fore - .04 - len / 2, .02] });
      add(left.bi + 1, new T.TorusGeometry(.035, .011, 4, 8, Math.PI), '#5a3a22', { p: [0, -P.fore - .04, -.015], r: [0, Math.PI / 2, 0] });
      left.cane = true;
    }
    if (W.mop) {
      const len = handY + .35;
      add(right.bi + 1, new T.CylinderGeometry(.012, .012, len, 6), '#c8c8c0', { p: [0, -P.fore - .04 - len / 2 + .35, .02] });
      add(right.bi + 1, new T.BoxGeometry(.2, .06, .09), '#a8b0b8', { p: [0, -P.fore - .04 - handY + .04, .02], t: 'rib' });
      right.cane = true;
    }

    // ── 腿 ──
    for (const G of legs) {
      const hb = G.bi, kb = G.bi + 1;
      const legC = L.skirt ? (L.tights || skin) : L.bottom, shinC = L.skirt ? (W.socks || L.tights || skin) : L.bottom;
      add(hb, capsuleGeo(.085 * ts, .07 * ts, P.thigh, 10), legC, { t: L.skirt ? 'skin' : 'plain' });
      if (L.skirt && W.socks) {   // 小腿一半是襪子
        add(kb, capsuleGeo(.066 * ts, .053 * ts, P.shin - .04, 10), skin, { t: 'skin' });
        add(kb, new T.CylinderGeometry(.06 * ts, .056 * ts, P.shin * .45, 10, 1, true), W.socks, { p: [0, -P.shin * .72, 0], t: 'rib' });
      } else add(kb, capsuleGeo(.068 * ts, .056 * ts, P.shin - .04, 10), shinC, { t: L.skirt ? 'skin' : 'plain' });
      const sc = W.shoes || '#2a2a2e', sy = -P.shin + .02;
      add(kb, new T.SphereGeometry(.062 * ts, 10, 7), sc, { p: [0, sy, .045 * ts], s: [.85, .5, 1.7] });
      add(kb, new T.BoxGeometry(.104 * ts, .022, .21 * ts), W.sole, { p: [0, -P.shin - .004, .045 * ts] });
      if (lum(sc) > .5 || role === 'kid') add(kb, new T.BoxGeometry(.04 * ts, .008, .05 * ts), lum(sc) > .5 ? '#c8c8c8' : '#f2f2ee', { p: [0, sy + .028 * ts, .075 * ts], r: [-.35, 0, 0] });
    }

    // ── 包包 ──
    const bagC = L.bagColor || '#2c3e50';
    if (L.bag === 'backpack' && !W.box) {
      add(SPI, new T.CapsuleGeometry(.12 * ts, .14 * ts, 3, 8), bagC, { p: [0, .28 * ts, -.2 * ts], s: [1.1, 1, .55] });
      add(SPI, new T.BoxGeometry(.17 * ts, .1 * ts, .04), shade(bagC, .82), { p: [0, .2 * ts, -.27 * ts] });
      for (const sx of [-1, 1]) add(SPI, new T.BoxGeometry(.024, .26 * ts, .012), shade(bagC, .7), { p: [sx * .095 * ts, .37 * ts, chestZ(.37 * ts, .095 * ts, .008)], r: [-.12, 0, 0] });
      for (const sx of [-1, 1]) add(SPI, new T.BoxGeometry(.024, .012, .22 * ts), shade(bagC, .7), { p: [sx * .1 * ts, .5 * ts, -.04] });
    }
    if (W.box) {   // 外送保溫箱
      const bx = String(W.box).toLowerCase() === '#e0447a' ? '#e0447a' : bagC;
      add(SPI, new T.BoxGeometry(.38, .38, .27), bx, { p: [0, .32 * ts, -.29 * ts] });
      add(SPI, new T.BoxGeometry(.39, .04, .28), shade(bx, .7), { p: [0, .5 * ts, -.29 * ts] });
      add(SPI, new T.BoxGeometry(.2, .14, .01), '#f4f4f2', { p: [0, .32 * ts, -.43 * ts] });
      add(SPI, new T.BoxGeometry(.12, .07, .012), bx, { p: [0, .33 * ts, -.432 * ts] });
      for (const sx of [-1, 1]) add(SPI, new T.BoxGeometry(.026, .26 * ts, .012), '#2a2a2a', { p: [sx * .095 * ts, .37 * ts, chestZ(.37 * ts, .095 * ts, .02)], r: [-.12, 0, 0] });
    }
    if (L.bag === 'briefcase' || L.bag === 'brief') {
      add(right.bi + 1, new T.BoxGeometry(.3, .23, .07), '#2a1d16', { p: [0, -P.fore - .18, 0], r: [0, Math.PI / 2, 0] });
      add(right.bi + 1, new T.BoxGeometry(.012, .03, .08), '#1a120e', { p: [0, -P.fore - .055, 0] });
      add(right.bi + 1, new T.BoxGeometry(.02, .02, .3), '#c8b070', { p: [0, -P.fore - .1, 0] });
    }
    if (L.bag === 'tote') {
      const tc = L.bagColor || '#d8c9a8';
      add(SPI, new T.BoxGeometry(.28, .3, .1), tc, { p: [-.25 * ts, .02, .02], r: [0, 0, .06] });
      for (const dz of [-.05, .07]) add(SPI, new T.BoxGeometry(.018, .5 * ts, .012), shade(tc, .85), { p: [-.19 * ts, .32 * ts, dz], r: [0, 0, .32] });
    }

    // ── 合併成蒙皮網格 ──
    root.updateMatrixWorld(true);
    let nv = 0, ni = 0;
    for (const p of parts) { const k = p.o.flip ? 2 : 1; nv += p.geo.attributes.position.count * k; ni += p.geo.index.count * k; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3), si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4);
    const idx = nv > 65000 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0;
    const M = new T.Matrix4(), NM = new T.Matrix3(), v = new T.Vector3(), n3 = new T.Vector3();
    for (const p of parts) {
      const g = p.geo, Pp = g.attributes.position, Nn = g.attributes.normal, U = g.attributes.uv, I = g.index.array;
      const local = p.o.m || XF.compose(XP.set(...(p.o.p || [0, 0, 0])), XQ.setFromEuler(XE.set(...(p.o.r || [0, 0, 0]))), XS.set(...(p.o.s || [1, 1, 1])));
      M.multiplyMatrices(bones[p.bi].matrixWorld, local); NM.getNormalMatrix(M);
      const [cx, cy] = ATLAS[p.o.t || 'plain'];
      const copies = p.o.flip ? 2 : 1;
      for (let k = 0; k < copies; k++) {
        const base = vo;
        for (let i = 0; i < Pp.count; i++, vo++) {
          v.fromBufferAttribute(Pp, i);
          const c = p.o.vc ? p.o.vc(v.x, v.y, v.z) : p.color;
          v.applyMatrix4(M); pos[vo * 3] = v.x; pos[vo * 3 + 1] = v.y; pos[vo * 3 + 2] = v.z;
          n3.fromBufferAttribute(Nn, i).applyMatrix3(NM).normalize(); if (k) n3.negate();
          nor[vo * 3] = n3.x; nor[vo * 3 + 1] = n3.y; nor[vo * 3 + 2] = n3.z;
          const uu = U ? U.getX(i) : 0, vv = U ? U.getY(i) : 0;
          uv[vo * 2] = (cx + .02 + Math.min(1, Math.max(0, uu)) * .96) / 4; uv[vo * 2 + 1] = (1 - cy) * .5 + (.02 + Math.min(1, Math.max(0, vv)) * .96) * .5;
          col[vo * 3] = c.r; col[vo * 3 + 1] = c.g; col[vo * 3 + 2] = c.b;
          si[vo * 4] = p.bi; sw[vo * 4] = 1;
        }
        for (let i = 0; i < I.length; i += 3) { if (k) { idx[io++] = I[i] + base; idx[io++] = I[i + 2] + base; idx[io++] = I[i + 1] + base; } else { idx[io++] = I[i] + base; idx[io++] = I[i + 1] + base; idx[io++] = I[i + 2] + base; } }
      }
      g.dispose();
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T.BufferAttribute(sw, 4));
    geo.setIndex(new T.BufferAttribute(idx, 1));
    const body = new T.SkinnedMesh(geo, npcMat());
    root.add(body);
    const skel = new T.Skeleton(bones);
    body.bind(skel);
    body.boundingSphere = new T.Sphere(new T.Vector3(0, .85 * h, 0), 1.25 * Math.max(h, .8));
    geo.boundingSphere = body.boundingSphere.clone();
    // 從場景移除時釋放（再加回來會自動重新上傳）
    root.addEventListener('removed', () => { geo.dispose(); skel.dispose(); });
    // 臉：共用的五官貼片
    const fid = (kid ? 'k' : girl ? 'f' : 'm') + (L.old ? 'o' : '') + (!L.old && lum(L.hairColor) > .42 ? 'l' : '');
    const fm = faceMats(fid);
    const fmesh = new T.Mesh(faceGeo(20), fm[0]); fmesh.userData.shared = true; fmesh.renderOrder = 2;
    fmesh.position.set(0, .1 * hs, 0); fmesh.scale.set(...SKULL).multiplyScalar(1.12 * hs); headJ.add(fmesh);
    if (L.costume) costume(L.costume, headJ, spine, root, .17);
    if (L.lantern) {   // 秀蔅的黃銅提燈
      const lan = new T.Group();
      lan.add(new T.Mesh(new T.CylinderGeometry(.045, .05, .12, 8), mat('#b58a3a', { metal: .7, rough: .3 })));
      lan.add(new T.Mesh(new T.SphereGeometry(.035, 10, 8), new T.MeshBasicMaterial({ color: '#ffe2a0' })));
      lan.position.set(0, -P.fore - .16, .02); right.el.add(lan);
    }
    return { root, hips, spine, headJ, arms, legs, P, armSwing: L.armSwing ?? (role === 'elder' ? .22 : .32), faceMesh: fmesh, faceMats: fm, body, role };
  }

  // 腳下的圓形影子：所有人共用同一個幾何與材質
  function blobShadow() {
    const r = once('shadow', () => {
      const sc = document.createElement('canvas'); sc.width = sc.height = 64;
      const sg = sc.getContext('2d'); const gr = sg.createRadialGradient(32, 32, 2, 32, 32, 32);
      gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 64, 64);
      const geo = new T.PlaneGeometry(.75, .75); geo.rotateX(-Math.PI / 2);
      return { geo, mat: shared(new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false })) };
    });
    const m = new T.Mesh(r.geo, r.mat); m.userData.shared = true; m.position.y = .005;
    return m;
  }

  function finish(rig) {
    rig.root.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    rig.root.add(blobShadow());
    let phase = 0, amt = 0, runA = 0, lastYaw = null, lean = 0, sitS = null;
    let blinkIn = 1 + Math.random() * 4, blinkOn = 0, talkUntil = 0, lastTxt = null;
    rig.sit = 0; rig.faceState = 0;
    // 走路／跑步分開兩種姿勢：跑步時身體前傾、手肘彎、步幅大、彈跳明顯；轉彎時身體往內傾；站著時會慢慢換重心
    rig.update = (dt, speed, t) => {
      for (const c of rig.root.children) if (c.userData.spin) c.rotation.y += dt * c.userData.spin;   // 繞著飛的蝙蝠
      const target = Math.min(1, speed / 1.6), runT = Math.min(1, Math.max(0, (speed - 3) / 2));
      amt += (target - amt) * Math.min(1, dt * 8);
      runA += (runT - runA) * Math.min(1, dt * 6);
      phase += dt * (4 + speed * (3.2 - runA * .9));
      // 坐下／站起來：平滑過渡（剛建好時直接到位）
      sitS = sitS == null || dt === 0 ? rig.sit : sitS + (rig.sit - sitS) * Math.min(1, dt * 9);
      const sw = Math.sin(phase), sit = sitS;
      // 轉彎傾斜：用根節點的旋轉變化估計轉彎速度
      const yaw = rig.root.rotation.y;
      if (lastYaw != null && dt > 0) { let d = yaw - lastYaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; lean += (Math.max(-.18, Math.min(.18, -d / dt * .045 * amt)) - lean) * Math.min(1, dt * 6); }
      lastYaw = yaw;
      const hipAmp = .55 + runA * .35, kneeAmp = .9 + runA * .6;
      for (const L of rig.legs) {
        const p = L.s > 0 ? sw : -sw;
        L.hp.rotation.x = p * hipAmp * amt - runA * .12 * amt - sit * 1.45;
        L.kn.rotation.x = Math.max(0, -Math.sin(phase + (L.s > 0 ? 0 : Math.PI) - .6)) * kneeAmp * amt + runA * .25 * amt + sit * 1.5;
      }
      for (const A of rig.arms) {
        const p = A.s > 0 ? -sw : sw, k = A.cane ? .3 : 1;   // 拿拐杖／拖把的手擺動小
        A.sh.rotation.x = p * (rig.armSwing + runA * .45) * amt * k - sit * .42 - (A.cane ? .12 * (1 - sit) : 0);
        A.sh.rotation.z = A.s * (runA * .12 * amt + .06 * (1 - amt));
        // 手往前擺時手肘多彎一點
        A.el.rotation.x = -.15 - (.22 + runA * .95) * amt - Math.max(0, -p) * .35 * amt * (1 - runA * .5) * k - sit * .5 + (A.cane ? .1 : 0);
      }
      const breath = Math.sin(t * 1.8) * .006, idle = (1 - amt) * (1 - sit);
      rig.hips.position.y = rig.P.hipY + Math.abs(Math.cos(phase)) * (.035 + runA * .045) * amt - (.015 + runA * .02) * amt - sit * (rig.P.hipY - .56);   // 坐下：屁股坐在椅面上（椅面高約 .5）
      rig.hips.rotation.z = Math.sin(t * .7) * .025 * idle + lean * .4;   // 站著換重心；轉彎往內傾
      rig.spine.rotation.y = sw * (.08 + runA * .06) * amt;
      rig.spine.rotation.x = (.05 + runA * .16) * amt - sit * .1;   // 坐著往後靠一點
      rig.spine.rotation.z = lean * .6 - Math.sin(t * .7) * .02 * idle;
      rig.spine.scale.set(1 + breath, 1, 1 + breath);
      rig.headJ.rotation.y = -sw * .05 * amt + Math.sin(t * .37) * .12 * idle;   // 站著時偶爾左右看
      rig.headJ.rotation.x = -runA * .1 * amt - Math.cos(phase * 2) * .025 * amt + Math.sin(t * .5) * .02 * idle;   // 走路時頭穩住（抵消上下彈跳）
      // 眨眼、說話時嘴巴開合（臉的材質被別人換掉——例如幽靈半透明——就不再切換）
      const F = rig.faceMesh, FM = rig.faceMats;
      if (F && FM && dt > 0) {
        if (F.material !== FM[rig.faceState]) { rig.faceMats = null; return; }
        blinkIn -= dt; if (blinkIn <= 0) { blinkOn = .13; blinkIn = 1.8 + Math.random() * 4.5; }
        blinkOn -= dt;
        let talking = !!rig.talking;
        let D = null; try { D = Dialog.with; } catch (e) { /* 對話框還沒載入 */ }
        if (D && D.rig === rig) {
          const el = document.querySelector('#dialog .dlg-text');
          if (el !== lastTxt) { lastTxt = el; talkUntil = t + Math.min(3.2, .8 + (el ? el.textContent.length * .05 : 1)); }
          talking = talking || t < talkUntil;
        } else lastTxt = null;
        const st = blinkOn > 0 ? 1 : talking && Math.sin(t * 16) + Math.sin(t * 7) > -.3 ? 2 : 0;
        if (st !== rig.faceState) { rig.faceState = st; F.material = FM[st]; }
      }
    };
    rig.update(0, 0, 0);
    return rig;
  }

  /* ── 換裝：依 wear（各部位的服裝 id，見 outfits.js）改材質、加配件 ── */
  function clothMat(o) {
    const tex = fabricTexture(o.color, {
      noise: o.pattern === 'denim' ? 22 : 12, knit: o.pattern === 'knit', rib: o.pattern === 'rib',
      draw: g => {
        if (o.pattern === 'check') {
          g.fillStyle = o.accent || '#1b1b1d'; g.globalAlpha = .55;
          for (let i = 0; i < 256; i += 32) { g.fillRect(i, 0, 12, 256); g.fillRect(0, i, 256, 12); }
          g.globalAlpha = 1;
        }
        if (o.pattern === 'denim') { g.fillStyle = 'rgba(230,238,250,.18)'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * 256, Math.random() * 256, 1, 6); }
        if (o.pattern === 'uniform') {
          g.fillStyle = '#e6e6e2'; g.beginPath(); g.moveTo(100, 0); g.lineTo(156, 0); g.lineTo(128, 70); g.fill();
          g.fillStyle = o.accent || '#1f3a6b'; g.fillRect(120, 30, 16, 50);
          g.fillStyle = '#1f3a6b'; g.font = 'bold 16px sans-serif'; g.fillText('高', 60, 120);
        }
        if (o.skirt) { g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 3, 256); }
      },
    });
    return mat('#ffffff', { map: tex, rough: o.rough ?? .85 });
  }
  function hairMatOf(color) {
    return mat('#ffffff', { rough: .5, side: T.DoubleSide, map: fabricTexture(color, { noise: 22, draw: g => { for (let x = 0; x < 256; x += 2) { g.strokeStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},.08)`; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, 90, x - 8, 170, x + 3, 256); g.stroke(); } } }) });
  }
  function dress(rig, charId, wear) {
    if (typeof Outfits === 'undefined') return rig;
    const W = Outfits.wear(charId, wear || {});
    const byTag = t => { const a = []; rig.root.traverse(o => { if (o.userData.tags && o.userData.tags.includes(t)) a.push(o); }); return a; };
    const pc = id => OUTFITS[id] || {};
    const set = (list, m) => list.forEach(o => o.traverse(c => { if (c.isMesh) c.material = m; }));
    const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
    const H = rig.headJ, S = rig.spine;
    // 上衣
    const top = pc(W.top);
    if (!Outfits.isDefault(W.top, charId)) {
      const m = clothMat(top);
      set(byTag('top'), m);
      set(byTag('midriff'), m);
      if (rig.girl && !top.sleeveless) set(byTag('arm'), top.sleeves ? clothMat({ color: top.sleeves }) : m);
      if (!rig.girl && top.sleeves) set(byTag('sleeve'), clothMat({ color: top.sleeves }));
      if (top.hood) {
        const hood = new T.Mesh(new T.TorusGeometry(.1, .045, 10, 24, Math.PI * 1.3), m);
        hood.rotation.set(Math.PI / 2 - .3, 0, Math.PI * .85); add(S, hood, 0, rig.girl ? .52 : .55, -.05);
        for (const sx of [-1, 1]) add(S, new T.Mesh(new T.CylinderGeometry(.004, .004, .14, 5), mat('#e8e8e6')), sx * .035, rig.girl ? .44 : .47, rig.girl ? .13 : .15);
      }
    }
    // 下身
    const bot = pc(W.bottom);
    if (!Outfits.isDefault(W.bottom, charId)) {
      const m = clothMat(bot);
      set(byTag('bottom'), m);
      if (bot.skirt) {
        set(byTag('thigh'), rig.skinM);
        // 小腿換成纖細的腿（原本是喇叭褲管的形狀）
        byTag('shin').forEach(o => { o.visible = false; const leg = limb(.05, .036, rig.P.shin - .02, rig.skinM); o.parent.add(leg); });
        const sk = new T.Mesh(new T.CylinderGeometry(.17, .25, .32, 28, 1, true), m); sk.material.side = T.DoubleSide;
        sk.scale.z = .74; add(rig.hips, sk, 0, -.12, 0);
      }
    }
    // 鞋子
    const sh = pc(W.shoes);
    if (!Outfits.isDefault(W.shoes, charId)) set(byTag('shoes'), mat(sh.color, { rough: sh.rough ?? .55 }));
    // 髮型、髮色
    const hairList = byTag('hair');
    const hc = pc(W.hairColor);
    const hm = hc.color ? hairMatOf(hc.color) : (hairList[0] && hairList[0].material);
    if (hc.color) set(hairList, hm);
    const style = pc(W.hair).style;
    if (style) byTag('hairLong').forEach(o => { o.visible = false; });
    if (style === 'pony') {
      add(H, new T.Mesh(new T.TorusGeometry(.03, .012, 8, 16), mat('#1a1a1a')), 0, .2, -.13).rotation.x = .9;
      const tail = new T.Mesh(new T.CapsuleGeometry(.05, .26, 6, 12), hm); tail.rotation.x = .35; add(H, tail, 0, .04, -.2);
      tail.scale.set(1, 1, .8);
    }
    if (style === 'bun') add(H, new T.Mesh(new T.SphereGeometry(.07, 16, 12), hm), 0, .27, -.07);
    // 包包
    const bag = pc(W.bag);
    byTag('bag').forEach(o => { o.visible = W.bag === 'ay_cross'; });
    if (W.bag === 'bag_backpack' || bag.as === 'bag_backpack') {
      const bp = new T.Mesh(new T.CapsuleGeometry(.13, .14, 6, 12), mat(bag.color, { rough: .7 })); bp.scale.set(1.1, 1, .55); add(S, bp, 0, .28, rig.girl ? -.17 : -.2);
      for (const sx of [-1, 1]) { const st = new T.Mesh(new T.BoxGeometry(.022, .3, .012), mat(bag.color, { rough: .7 })); add(S, st, sx * .1, .32, rig.girl ? .1 : .13); }
    }
    if (W.bag === 'bag_tote') add(S, new T.Mesh(new T.BoxGeometry(.3, .32, .1), mat(bag.color, { rough: .95 })), rig.girl ? -.22 : -.26, .02, 0);
    if (W.bag === 'bag_cross') {
      const bm = mat(bag.color, { rough: .35 });
      add(S, new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.15, .5, 0), new T.Vector3(.05, .36, .16), new T.Vector3(-.14, .08, .16)]), 20, .009, 5, false), bm), 0, 0, 0);
      add(S, new T.Mesh(new T.BoxGeometry(.2, .14, .06), bm), -.18, .02, .14).rotation.z = .2;
    }
    // 飾品
    const ac = pc(W.acc), aid = ac.as || W.acc;
    const top0 = rig.girl ? .15 : .14;   // 頭頂附近的高度
    if (aid === 'acc_cap') {
      const cm = mat(ac.color, { rough: .7 });
      const cap = new T.Mesh(new T.SphereGeometry(.165, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cm); cap.scale.set(1, .74, 1.06); add(H, cap, 0, top0 + .02, 0);
      const brim = new T.Mesh(new T.CylinderGeometry(.11, .11, .015, 18, 1, false, -Math.PI / 2, Math.PI), cm); brim.scale.z = 1.4; add(H, brim, 0, top0 + .03, .14);
    }
    if (aid === 'acc_bucket') {
      const cm = mat(ac.color, { rough: .95 });
      add(H, new T.Mesh(new T.CylinderGeometry(.13, .16, .11, 24), cm), 0, top0 + .1, 0);
      add(H, new T.Mesh(new T.CylinderGeometry(.24, .25, .012, 28), cm), 0, top0 + .045, 0).rotation.x = .08;
    }
    if (aid === 'acc_beret') {
      const b = new T.Mesh(new T.SphereGeometry(.17, 24, 12), mat(ac.color, { rough: .9 })); b.scale.set(1.12, .36, 1.1); b.rotation.z = .2; add(H, b, -.03, top0 + .11, -.01);
    }
    if (aid === 'acc_glasses') {
      const gm = mat('#2a1d16', { rough: .3 });
      for (const sx of [-1, 1]) add(H, new T.Mesh(new T.TorusGeometry(.03, .004, 6, 18), gm), sx * .046, .108, .132);
      add(H, new T.Mesh(new T.BoxGeometry(.03, .004, .004), gm), 0, .112, .134);
      for (const sx of [-1, 1]) add(H, new T.Mesh(new T.BoxGeometry(.004, .004, .13), gm), sx * .078, .11, .07);
    }
    if (aid === 'acc_headphones') {
      const hp = mat(ac.color, { rough: .4 });
      const band = new T.Mesh(new T.TorusGeometry(.165, .012, 8, 30, Math.PI), hp); add(H, band, 0, .1, -.01);
      for (const sx of [-1, 1]) { const cup = new T.Mesh(new T.CylinderGeometry(.05, .05, .04, 18), hp); cup.rotation.z = Math.PI / 2; add(H, cup, sx * .16, .09, 0); }
    }
    if (aid === 'acc_pumpkin') {
      add(H, new T.Mesh(new T.TorusGeometry(.155, .008, 6, 30, Math.PI), mat('#1a1a1a')), 0, .1, .01);
      for (const sx of [-1, 1]) { const pk = new T.Mesh(new T.SphereGeometry(.045, 14, 10), mat('#e8741c', { rough: .6 })); pk.scale.y = .75; add(H, pk, sx * .1, top0 + .1, .02); add(H, new T.Mesh(new T.CylinderGeometry(.006, .006, .03, 5), mat('#3a6a2a')), sx * .1, top0 + .14, .02); }
    }
    if (aid === 'acc_santa') {
      add(H, new T.Mesh(new T.ConeGeometry(.15, .3, 20), mat('#c4162a', { rough: .9 })), 0, top0 + .17, -.03).rotation.x = -.35;
      add(H, new T.Mesh(new T.TorusGeometry(.14, .03, 8, 24), mat('#f6f6f4', { rough: 1 })), 0, top0 + .03, 0).rotation.x = Math.PI / 2;
      add(H, new T.Mesh(new T.SphereGeometry(.035, 10, 8), mat('#f6f6f4', { rough: 1 })), 0, top0 + .27, -.16);
    }
    if (aid === 'acc_lantern') {
      const ln = new T.Mesh(new T.SphereGeometry(.035, 12, 10), new T.MeshBasicMaterial({ color: '#e0302a' })); ln.scale.y = .8; add(H, ln, .11, top0 + .03, .04);
      add(H, new T.Mesh(new T.CylinderGeometry(.012, .012, .015, 8), mat('#d8a830', { metal: .6 })), .11, top0 + .065, .04);
    }
    // 其他節慶的限定飾品
    if (aid === 'acc_rabbit') for (const sx of [-1, 1]) { const e = new T.Mesh(new T.CapsuleGeometry(.03, .16, 4, 8), mat('#f6f6f4', { rough: .9 })); e.position.set(sx * .06, top0 + .16, -.02); e.rotation.z = -sx * .2; H.add(e); const n = new T.Mesh(new T.CapsuleGeometry(.015, .1, 4, 6), mat('#f2b8c8')); n.position.set(sx * .06, top0 + .16, .008); n.rotation.z = -sx * .2; H.add(n); }
    if (aid === 'acc_heart') for (const sx of [-1, 1]) { const b = new T.Mesh(new T.SphereGeometry(.025, 10, 8), mat('#e0447a', { rough: .4 })); b.position.set(.1 + sx * .018, top0 + .02, .05); H.add(b); }
    if (aid === 'acc_flagpin') { const f = new T.Mesh(new T.BoxGeometry(.07, .05, .006), mat('#c4162a')); f.position.set(.11, top0 + .02, .05); f.rotation.y = .4; H.add(f); const b = new T.Mesh(new T.BoxGeometry(.03, .025, .007), mat('#1f3a8a')); b.position.set(.095, top0 + .03, .056); b.rotation.y = .4; H.add(b); }
    if (aid === 'acc_party') { const c = new T.Mesh(new T.ConeGeometry(.08, .22, 16), mat('#f2c200', { rough: .6 })); c.position.set(.05, top0 + .13, 0); c.rotation.z = -.25; H.add(c); const p = new T.Mesh(new T.SphereGeometry(.025, 8, 6), mat('#e0447a')); p.position.set(.08, top0 + .24, 0); H.add(p); }
    // 萬聖節限定
    if (aid === 'acc_witch') costume('witch', H, S, rig.root, top0);
    if (aid === 'acc_pumpkinhead') costume('pumpkin', H, S, rig.root, top0);
    if (W.top === 'top_vampire') costume('vampire', H, S, rig.root, top0);
    if (W.fx === 'fx_bats') costume('bats', H, S, rig.root, top0);
    // 特效
    if (W.fx === 'fx_mist') {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      gr.addColorStop(0, 'rgba(200,240,225,.75)'); gr.addColorStop(1, 'rgba(200,240,225,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      const aura = new T.Mesh(new T.PlaneGeometry(1.8, 1.8), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
      aura.rotation.x = -Math.PI / 2; aura.position.y = .02; rig.root.add(aura);
    }
    if (W.fx === 'fx_sparkle') for (let i = 0; i < 6; i++) {
      const s = new T.Mesh(new T.OctahedronGeometry(.03), new T.MeshBasicMaterial({ color: '#fff3b0' }));
      s.position.set(Math.sin(i) * .35, .4 + i * .22, Math.cos(i) * .35); rig.root.add(s);
    }
    rig.wearKey = JSON.stringify(W);
    return rig;
  }

  function buildPerson(look) { return finish(person(look)); }

  function build(charId, wear) {
    const rig = charId === 'aiyun' ? aiyun() : xuanyu();
    return finish(dress(rig, charId, wear));
  }

  // 角色快照：用 3D 模型拍一張圖（選角畫面、頭像）
  let snapR = null;
  const snapCache = {};
  function snapshot(charId, kind = 'full', wear) {
    const key = charId + kind + (wear ? JSON.stringify(wear) : '');
    if (snapCache[key]) return snapCache[key];
    const w = kind === 'full' ? 600 : 256, h = kind === 'full' ? 1000 : 256;
    if (!snapR) { snapR = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); snapR.outputColorSpace = T.SRGBColorSpace; snapR.toneMapping = T.ACESFilmicToneMapping; }
    snapR.setSize(w, h, false);
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight('#ffffff', '#5a6068', 1.5));
    const d = new T.DirectionalLight('#fff4e6', 2.2); d.position.set(1.5, 3, 4); scene.add(d);
    const rig = build(charId, wear); rig.root.rotation.y = -.35; scene.add(rig.root);
    const cam = new T.PerspectiveCamera(kind === 'full' ? 26 : 22, w / h, .05, 50);
    if (kind === 'full') { cam.position.set(0, 1.0, 4.6); cam.lookAt(0, .88, 0); }
    else { cam.position.set(0, 1.55, 1.2); cam.lookAt(0, 1.5, 0); }
    snapR.setClearColor(0x000000, 0);
    snapR.render(scene, cam);
    return (snapCache[key] = snapR.domElement.toDataURL('image/png'));
  }

  return { build, buildPerson, fabricTexture, snapshot };
})();
