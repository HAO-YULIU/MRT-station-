/* 3D 主角模型（程式建模＋骨架走路動畫）
 * 單位：公尺。模型正面朝 +z，腳底在 y = 0。
 * 臉部為手繪貼圖，依兩人特徵設計（軒宇：細長眼、自然眉；愛紜：大眼、眼線、紅唇）。
 */
const Human3D = (() => {
  const T = THREE;

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

  // 換裝用：幫網格標上部位（top、bottom、shoes、hair、hairLong、bag、arm…）
  const tg = (o, ...tags) => { o.userData.tags = tags; return o; };
  const mat = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: o.rough ?? .85, metalness: o.metal ?? 0, map: o.map || null, side: o.side || T.FrontSide, transparent: !!o.transparent });

  // 四肢：頂端在原點，往 -y 延伸
  function limb(r1, r2, len, material) {
    const g = new T.CylinderGeometry(r1, r2, len, 20, 1);
    g.translate(0, -len / 2, 0);
    const m = new T.Mesh(g, material);
    const capTop = new T.Mesh(new T.SphereGeometry(r1, 20, 12), material);
    const capBot = new T.Mesh(new T.SphereGeometry(r2, 20, 12), material); capBot.position.y = -len;
    const grp = new T.Group(); grp.add(m, capTop, capBot);
    return grp;
  }
  function box(w, h, d, material, x, y, z, parent) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), material); m.position.set(x, y, z); parent.add(m); return m; }
  function joint(x, y, z) { const g = new T.Group(); g.position.set(x, y, z); return g; }

  // 以剖面旋轉出的軀幹（frontU=0.5 為正面）
  function lathe(points, material, scaleZ = .62) {
    const g = new T.LatheGeometry(points.map(([r, y]) => new T.Vector2(r, y)), 40, Math.PI, Math.PI * 2);
    const m = new T.Mesh(g, material);
    m.scale.z = scaleZ;
    return m;
  }

  // 頭髮外殼：完整球面，挖掉臉的部分（keep 決定哪些位置保留）
  function hairShell(r, keep, material, seg = 56) {
    const g = new T.SphereGeometry(r, seg, seg * .75 | 0);
    const pos = g.attributes.position, idx = g.index.array, out = [];
    const v = i => [pos.getX(i) / r, pos.getY(i) / r, pos.getZ(i) / r];
    for (let i = 0; i < idx.length; i += 3) {
      const a = v(idx[i]), b = v(idx[i + 1]), c = v(idx[i + 2]);
      const m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      if (keep(m[0], m[1], m[2])) out.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    g.setIndex(out);
    // 髮尾略為外翻、蓬鬆
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / r;
      if (y < .2) { const k = 1 + (.2 - y) * .12; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    }
    g.computeVertexNormals();
    return new T.Mesh(g, material);
  }

  // 手繪臉部：在膚色底上畫眉、眼、鼻、唇（貼圖中心為臉的正中）
  function faceTexture(charId, skin, opt = {}) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = skin; g.fillRect(0, 0, 512, 512);
    const girl = opt.girl ?? charId === 'aiyun';
    const old = !!opt.old;
    g.translate(256, 290); g.scale(1.3, 1.3); g.translate(-256, -290);   // 五官整體放大
    const eyeY = 236, eyeDX = girl ? 78 : 76, look = girl ? 9 : 0;
    // 腮紅
    for (const sx of [-1, 1]) {
      const gr = g.createRadialGradient(256 + sx * 112, 318, 4, 256 + sx * 112, 318, 62);
      gr.addColorStop(0, girl ? 'rgba(240,120,120,.38)' : 'rgba(210,120,100,.14)'); gr.addColorStop(1, 'rgba(240,120,120,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    }
    // 眉毛
    g.strokeStyle = girl ? 'rgba(74,38,32,.75)' : 'rgba(24,20,20,.85)'; g.lineCap = 'round';
    for (const sx of [-1, 1]) {
      g.lineWidth = girl ? 7 : 11;
      g.beginPath(); g.moveTo(256 + sx * 36, eyeY - 52); g.quadraticCurveTo(256 + sx * 78, eyeY - (girl ? 66 : 62), 256 + sx * 122, eyeY - 50); g.stroke();
    }
    // 眼睛
    for (const sx of [-1, 1]) {
      const ex = 256 + sx * eyeDX;
      const w = girl ? 50 : 46, h = girl ? 30 : 21;
      g.save();
      g.beginPath(); g.ellipse(ex, eyeY, w, h, 0, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#fbf8f4'; g.fillRect(ex - w, eyeY - h, w * 2, h * 2);
      const ir = girl ? 25 : 20;
      const ig = g.createRadialGradient(ex + look, eyeY - 4, 2, ex + look, eyeY, ir);
      ig.addColorStop(0, girl ? '#7a4a34' : '#4a3226'); ig.addColorStop(.7, girl ? '#3a2018' : '#241812'); ig.addColorStop(1, '#120a08');
      g.fillStyle = ig; g.beginPath(); g.arc(ex + look, eyeY + 2, ir, 0, 7); g.fill();
      g.fillStyle = '#0a0606'; g.beginPath(); g.arc(ex + look, eyeY + 2, ir * .45, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(ex + look + 7, eyeY - 6, girl ? 7 : 5, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ex - w, eyeY - h, w * 2, 9);   // 上眼瞼陰影
      g.restore();
      // 上眼線（女生帶一點眼尾）
      g.strokeStyle = '#1a1210'; g.lineWidth = girl ? 7 : 6;
      g.beginPath(); g.ellipse(ex, eyeY, w, h, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      if (girl) { g.beginPath(); g.moveTo(ex + sx * (w - 2), eyeY - 6); g.lineTo(ex + sx * (w + 14), eyeY - 16); g.stroke(); }
      // 雙眼皮／單眼皮
      g.strokeStyle = 'rgba(120,70,55,.45)'; g.lineWidth = 3;
      if (girl) { g.beginPath(); g.ellipse(ex, eyeY - 8, w, h + 4, 0, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      g.strokeStyle = 'rgba(120,70,55,.35)'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(ex, eyeY + 2, w * .85, h, 0, Math.PI * .2, Math.PI * .8); g.stroke();
    }
    // 鼻子
    g.strokeStyle = 'rgba(140,85,65,.45)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(250, 250); g.quadraticCurveTo(244, 300, 252, 318); g.stroke();
    g.fillStyle = 'rgba(140,85,65,.35)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(256 + sx * 14, 322, 7, 4, 0, 0, 7); g.fill(); }
    // 嘴唇
    const lip = girl ? '#d0565a' : '#c9837b';
    g.fillStyle = lip;
    g.beginPath(); g.moveTo(222, 372); g.quadraticCurveTo(240, 360, 256, 366); g.quadraticCurveTo(272, 360, 290, 372);
    g.quadraticCurveTo(256, 400, 222, 372); g.fill();
    g.strokeStyle = 'rgba(90,30,30,.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(224, 372); g.quadraticCurveTo(256, 380, 288, 372); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(262, 384, 10, 3, 0, 0, 7); g.fill();
    if (old) {   // 皺紋
      g.strokeStyle = 'rgba(120,80,60,.35)'; g.lineWidth = 3;
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 140, 236); g.lineTo(256 + sx * 160, 228); g.stroke(); g.beginPath(); g.moveTo(256 + sx * 60, 330); g.quadraticCurveTo(256 + sx * 80, 360, 256 + sx * 70, 390); g.stroke(); }
      g.beginPath(); g.moveTo(200, 150); g.lineTo(312, 150); g.stroke();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // 邊緣淡出成透明，讓貼圖與頭部膚色無縫接合
    const fade = g.createRadialGradient(256, 270, 150, 256, 270, 256);
    fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = fade; g.fillRect(0, 0, 512, 512);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }

  function face(charId, skin, hair, opt) {
    // 頭：膚色橢球＋照片臉部貼圖
    const head = new T.Group();
    const skull = new T.Mesh(new T.SphereGeometry(.112, 40, 28), mat(skin, { rough: .7 }));
    head.scale.setScalar(1.12);
    skull.scale.set(.9, 1.08, .98);
    head.add(skull);
    // 臉部貼圖：覆蓋頭部正面，眼睛對齊頭部中線
    const tex = faceTexture(charId, skin, opt);
    const fm = new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: .7, depthWrite: false });
    const fg = new T.SphereGeometry(.1138, 48, 32, Math.PI / 2 - 1.05, 2.1, .62, 1.9);
    const fmesh = new T.Mesh(fg, fm);
    fmesh.scale.copy(skull.scale);
    fmesh.renderOrder = 2;
    head.add(fmesh);
    // 耳朵
    for (const s of [-1, 1]) {
      const ear = new T.Mesh(new T.SphereGeometry(.024, 12, 10), mat(skin, { rough: .7 }));
      ear.scale.set(.5, 1, .8); ear.position.set(s * .1, -.005, -.005);
      head.add(ear);
    }
    return head;
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
    const shoeM = mat('#f4f4f1', { rough: .6 });
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
      const hand = new T.Mesh(new T.SphereGeometry(.045, 16, 12), skinM); hand.scale.set(.8, 1.2, .55); hand.position.y = -P.fore - .07; el.add(hand);
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
      const shoe = new T.Mesh(new T.SphereGeometry(.07, 20, 14), shoeM); shoe.scale.set(.85, .55, 1.65); shoe.position.set(0, -P.shin + .02, .045); kn.add(tg(shoe, 'shoes'));
      const sole = new T.Mesh(new T.BoxGeometry(.11, .025, .22), mat('#d9d9d4')); sole.position.set(0, -P.shin - .005, .045); kn.add(sole);
      legs.push({ hp, kn, s });
    }
    return { root, hips, spine, headJ, arms, legs, P, armSwing: .35, skinM, skin };
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
    const shoeM = mat('#141212', { rough: .35 });
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
      const hand = new T.Mesh(new T.SphereGeometry(.036, 16, 12), skinM); hand.scale.set(.8, 1.25, .55); hand.position.y = -P.fore - .045; el.add(hand);
      sh.rotation.z = s * .1;
      arms.push({ sh, el, s });
    }
    const legs = [];
    for (const s of [-1, 1]) {
      const hp = joint(s * .08, 0, 0); hips.add(hp);
      const th = limb(.078, .055, P.thigh, jeansM); hp.add(tg(th, 'bottom', 'thigh'));
      const kn = joint(0, -P.thigh, 0); hp.add(kn);
      const sh = limb(.052, .088, P.shin - .02, jeansDarkM); kn.add(tg(sh, 'bottom', 'shin'));   // 往下展開的喇叭褲管
      const shoe = new T.Mesh(new T.SphereGeometry(.055, 20, 14), shoeM); shoe.scale.set(.8, .45, 1.7); shoe.position.set(0, -P.shin + .015, .05); kn.add(tg(shoe, 'shoes'));
      legs.push({ hp, kn, s });
    }
    return { root, hips, spine, headJ, arms, legs, P, armSwing: .3, skinM, skin, girl: true };
  }

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

  function person(look) {
    const L = look, girl = !!L.girl;
    const skinM = mat(L.skin, { rough: .65 });
    const topTex = fabricTexture(L.top, {
      noise: 10, knit: L.pattern === 'knit',
      draw: g => {
        if (L.pattern === 'stripe') { g.fillStyle = L.accent || '#1b1b1d'; for (let y = 0; y < 256; y += 40) g.fillRect(0, y, 256, 12); }
        if (L.pattern === 'shirt') {   // 白襯衫＋領帶
          g.fillStyle = '#f4f4f2'; g.beginPath(); g.moveTo(98, 0); g.lineTo(158, 0); g.lineTo(128, 110); g.fill();
          g.fillStyle = L.accent || '#7a1f2b'; g.beginPath(); g.moveTo(122, 10); g.lineTo(134, 10); g.lineTo(138, 120); g.lineTo(128, 135); g.lineTo(118, 120); g.fill();
        }
        if (L.pattern === 'uniform') { g.fillStyle = '#f4f4f2'; g.beginPath(); g.moveTo(100, 0); g.lineTo(156, 0); g.lineTo(128, 70); g.fill(); g.fillStyle = L.accent || '#1f3a6b'; g.fillRect(118, 40, 20, 40); }
      },
    });
    const topM = mat('#ffffff', { map: topTex, rough: .85 });
    const botM = mat('#ffffff', { map: fabricTexture(L.bottom, { noise: 14 }), rough: .85 });
    const hairM = mat(L.hairColor, { rough: .55, side: T.DoubleSide });
    const shoeM = mat(L.shoes || '#2a2a2e', { rough: .5 });
    const h = L.height || 1;
    const P = { hipY: .9 * h, thigh: .44 * h, shin: .44 * h, upper: .28 * h, fore: .26 * h, shoulderX: girl ? .165 : .185 };
    const root = new T.Group();
    const hips = joint(0, P.hipY, 0); root.add(hips);
    const spine = joint(0, 0, 0); hips.add(spine);
    const w = girl ? .19 : .21, coatLen = L.coat ? -.62 : (L.skirt ? -.05 : -.1);
    const torso = lathe([[0, coatLen], [w + (L.coat ? .03 : 0), coatLen], [w, .05], [w + .01, .25], [w + .015, .38], [w - .01, .46], [.14, .52], [.07, .55], [.065, .56]], topM, .62);
    spine.add(torso);
    if (L.skirt) { const sk = new T.Mesh(new T.CylinderGeometry(.19, .25, .36, 24, 1, true), botM); sk.position.y = -.14; sk.scale.z = .7; hips.add(sk); }
    if (L.scarf) {
      const sc = new T.Mesh(new T.TorusGeometry(.085, .035, 8, 20), mat(L.scarf, { rough: .9 })); sc.rotation.x = Math.PI / 2; sc.position.y = .55; sc.scale.y = .7; spine.add(sc);
      const tail = new T.Mesh(new T.BoxGeometry(.07, .3, .025), mat(L.scarf, { rough: .9 })); tail.position.set(.05, .38, .13); tail.rotation.z = .12; spine.add(tail);
    }
    const neck = limb(.042, .045, .09, skinM); neck.position.y = .6; spine.add(neck);
    const headJ = joint(0, .6, .01); spine.add(headJ);
    const head = face('npc', L.skin, L.hairColor, { girl, old: L.old }); head.position.y = .1; headJ.add(head);
    // 髮型
    const style = L.hair;
    if (style !== 'bald') {
      const keep = {
        short: (x, y, z) => y > .3 || (z < -.1 && y > -.4) || (Math.abs(x) > .8 && y > .05),
        mush: (x, y, z) => y > .32 || (z < -.1 && y > -.7) || (Math.abs(x) > .78 && y > -.1),
        bob: (x, y, z) => y > .3 || (z < -.05 && y > -.95) || (Math.abs(x) > .7 && y > -.9),
        long: (x, y, z) => y > .3 || (z < 0) || (Math.abs(x) > .7),
        bun: (x, y, z) => y > .2 || (z < -.1 && y > -.5) || (Math.abs(x) > .85 && y > 0),
      }[style] || ((x, y) => y > .3);
      const shell = hairShell(.137, keep, hairM, 64);
      shell.scale.set(.94, 1.1, 1.02); shell.position.set(0, .1, -.004); headJ.add(shell);
      if (style === 'long') {
        const back = new T.Mesh(new T.CylinderGeometry(.14, .17, .42, 24, 1, true, Math.PI * .32, Math.PI * 1.36), hairM);
        back.position.set(0, -.13, -.02); back.scale.z = .82; headJ.add(back);
      }
      if (style === 'bun') { const bun = new T.Mesh(new T.SphereGeometry(.06, 14, 10), hairM); bun.position.set(0, .2, -.1); headJ.add(bun); }
    }
    if (L.hat === 'cap') {
      const cap = new T.Mesh(new T.SphereGeometry(.15, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(L.hatColor || '#1c2433')); cap.position.y = .17; cap.scale.set(1, .7, 1.05); headJ.add(cap);
      const brim = new T.Mesh(new T.CylinderGeometry(.1, .1, .015, 16, 1, false, -Math.PI / 2, Math.PI), mat(L.hatColor || '#1c2433')); brim.position.set(0, .17, .12); brim.scale.z = 1.4; headJ.add(brim);
    }
    if (L.hat === 'beret') {
      const b = new T.Mesh(new T.SphereGeometry(.16, 24, 12), mat(L.hatColor || '#c4162a', { rough: .9 })); b.scale.set(1.12, .38, 1.1); b.position.set(-.02, .235, -.01); b.rotation.z = .18; headJ.add(b);
      const nub = new T.Mesh(new T.CylinderGeometry(.008, .008, .03, 6), mat(L.hatColor || '#c4162a')); nub.position.set(-.02, .3, 0); headJ.add(nub);
    }
    if (L.glasses) {
      const gm = mat('#1a1a1a', { rough: .3 });
      for (const sx of [-1, 1]) { const r = new T.Mesh(new T.TorusGeometry(.026, .004, 6, 16), gm); r.position.set(sx * .045, .105, .118); headJ.add(r); }
    }
    if (L.costume) costume(L.costume, headJ, spine, root, .17);
    // 手臂與腿
    const arms = [];
    for (const sd of [-1, 1]) {
      const sh = joint(sd * P.shoulderX, .44, 0); spine.add(sh);
      sh.add(limb(.058, .052, P.upper, L.sleeveless ? skinM : topM));
      const el = joint(0, -P.upper, 0); sh.add(el);
      el.add(limb(.05, .045, P.fore, L.sleeveless || L.short ? skinM : topM));
      const hand = new T.Mesh(new T.SphereGeometry(.04, 12, 10), skinM); hand.scale.set(.8, 1.2, .55); hand.position.y = -P.fore - .05; el.add(hand);
      sh.rotation.z = sd * .1;
      arms.push({ sh, el, s: sd });
    }
    const legs = [];
    for (const sd of [-1, 1]) {
      const hp = joint(sd * .09, 0, 0); hips.add(hp);
      hp.add(limb(.085, .07, P.thigh, L.skirt ? skinM : botM));
      const kn = joint(0, -P.thigh, 0); hp.add(kn);
      kn.add(limb(.068, .055, P.shin - .04, L.skirt ? (L.socks ? mat(L.socks) : skinM) : botM));
      const shoe = new T.Mesh(new T.SphereGeometry(.062, 14, 10), shoeM); shoe.scale.set(.85, .5, 1.7); shoe.position.set(0, -P.shin + .02, .045); kn.add(shoe);
      legs.push({ hp, kn, s: sd });
    }
    // 包包
    if (L.bag === 'backpack') { const bp = new T.Mesh(new T.CapsuleGeometry(.13, .14, 6, 12), mat(L.bagColor || '#2c3e50')); bp.scale.set(1.1, 1, .55); bp.position.set(0, .28, -.2); spine.add(bp); }
    if (L.bag === 'briefcase') { const bc = new T.Mesh(new T.BoxGeometry(.32, .24, .07), mat('#2a1d16', { rough: .4 })); bc.position.set(0, -.42 * h, 0); arms[1].el.add(bc); bc.position.set(0, -P.fore - .18, 0); }
    if (L.bag === 'tote') { const tb = new T.Mesh(new T.BoxGeometry(.28, .3, .1), mat(L.bagColor || '#d8c9a8', { rough: .9 })); tb.position.set(-.24, .02, 0); spine.add(tb); }
    if (L.lantern) {   // 秀蔅的黃銅提燈
      const lan = new T.Group();
      lan.add(new T.Mesh(new T.CylinderGeometry(.045, .05, .12, 8), mat('#b58a3a', { metal: .7, rough: .3 })));
      const glow = new T.Mesh(new T.SphereGeometry(.035, 10, 8), new T.MeshBasicMaterial({ color: '#ffe2a0' })); lan.add(glow);
      
      lan.position.set(0, -P.fore - .16, .02); arms[1].el.add(lan);
    }
    return { root, hips, spine, headJ, arms, legs, P, armSwing: L.armSwing ?? .32 };
  }

  function finish(rig) {
    rig.root.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    const sc = document.createElement('canvas'); sc.width = sc.height = 64;
    const sg = sc.getContext('2d'); const gr = sg.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 64, 64);
    const shadow = new T.Mesh(new T.PlaneGeometry(.75, .75), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = .005;
    rig.root.add(shadow);
    let phase = 0, amt = 0;
    rig.sit = 0;
    rig.update = (dt, speed, t) => {
      for (const c of rig.root.children) if (c.userData.spin) c.rotation.y += dt * c.userData.spin;   // 繞著飛的蝙蝠
      const target = Math.min(1, speed / 1.6);
      amt += (target - amt) * Math.min(1, dt * 8);
      phase += dt * (4 + speed * 3.2);
      const sw = Math.sin(phase);
      for (const L of rig.legs) {
        const p = L.s > 0 ? sw : -sw;
        L.hp.rotation.x = p * .55 * amt - rig.sit * 1.45;
        L.kn.rotation.x = Math.max(0, -Math.sin(phase + (L.s > 0 ? 0 : Math.PI) - .6)) * .9 * amt + rig.sit * 1.5;
      }
      for (const A of rig.arms) {
        const p = A.s > 0 ? -sw : sw;
        A.sh.rotation.x = p * rig.armSwing * amt - rig.sit * .3;
        A.el.rotation.x = -.15 - .25 * amt - rig.sit * .5;
      }
      const breath = Math.sin(t * 1.8) * .006;
      rig.hips.position.y = rig.P.hipY + Math.abs(Math.cos(phase)) * .035 * amt - .015 * amt - rig.sit * (rig.P.hipY - .48);
      rig.spine.rotation.y = sw * .08 * amt;
      rig.spine.rotation.x = .05 * amt;
      rig.spine.scale.set(1 + breath, 1, 1 + breath);
      rig.headJ.rotation.y = -sw * .05 * amt;
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
