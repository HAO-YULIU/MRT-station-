/* 3D 世界：月台、列車、隧道／高架、鏡頭、碰撞與操控
 * 座標（公尺）：軌道沿 x 軸；月台在 +z 側；列車停妥時車身中心在原點、地板 y = 0。
 * 「停站座標系」：列車停妥時，列車與月台在同一個座標系。
 *   進出站時移動列車（train.position.x），搭乘行駛時改為移動環境（env.position.x）。
 */
const World = (() => {
  const T = THREE;
  const CAR_LEN = 20, CAR_GAP = .5, CARS = 3;
  const CAR_X = [-(CAR_LEN + CAR_GAP), 0, CAR_LEN + CAR_GAP];
  const DOOR_OFF = [-7.2, -2.4, 2.4, 7.2];
  const DOORS = CAR_X.flatMap(c => DOOR_OFF.map(o => c + o));
  const HALF_W = 1.5;            // 車身半寬
  const PSD_Z = 1.95;            // 月台門位置
  const PLAT = { x0: -32.5, x1: 32.5, z0: 2.2, z1: 6.1 };
  const INNER_X = CAR_X[2] + CAR_LEN / 2 - .4;

  let renderer, scene, camera, container;
  let env, stationGroup, nextGroup, segGroup, train, trainParts;
  let rig = null, charId = null;
  let hemi, sun;
  const st = {
    trainPresent: false, trainX: 0, doorAmt: 0, riding: false, platformActive: true,
    ug: true, lineId: 'R',
  };
  const player = { x: 0, z: 4, face: Math.PI, speed: 0, inputOn: true, auto: null };
  const cam = { yaw: 0, pitch: .3, dist: 4.4, pos: new T.Vector3(0, 2.2, 8) };
  let interactions = [];
  let last = 0, shake = 0;

  /* ── 貼圖工具 ── */
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  const noise = (g, w, h, amt) => {
    const img = g.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(img, 0, 0);
  };
  const TEX = {};
  function textures() {
    TEX.floor = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#c9c5bc'; g.fillRect(0, 0, w, h); noise(g, w, h, 16);
      g.strokeStyle = '#9d988e'; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); }
    }, [1, 1]);
    TEX.wall = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#e4e0d6'; g.fillRect(0, 0, w, h); noise(g, w, h, 8);
      g.strokeStyle = '#c9c3b6'; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
      for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); }
    }, [1, 1]);
    TEX.tactile = canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = '#e8b800'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c99c00';
      for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
    }, [1, 1]);
    TEX.gravel = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3b3a38'; g.fillRect(0, 0, w, h); noise(g, w, h, 60); }, [1, 1]);
    TEX.concrete = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#6d6c69'; g.fillRect(0, 0, w, h); noise(g, w, h, 30); }, [1, 1]);
    TEX.door = canvasTex(128, 320, (g, w, h) => {
      g.fillStyle = '#e8ebee'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#26323b'; roundRect(g, 18, 40, w - 36, 150, 12); g.fill();
      g.fillStyle = 'rgba(255,255,255,.15)'; roundRect(g, 22, 44, 20, 140, 8); g.fill();
      g.strokeStyle = '#9aa3aa'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    });
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function tiled(tex, rx, ry) { const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); return t; }

  // 台北捷運站名牌
  function stationSignTex(stationId, lineId) {
    const lines = MRT.linesAt(stationId), name = MRT.label(stationId, lineId);
    return canvasTex(1024, 256, (g, w, h) => {
      g.fillStyle = '#f8f8f6'; g.fillRect(0, 0, w, h);
      g.fillStyle = LINES[lineId].color; g.fillRect(0, 0, w, 22);
      lines.forEach((l, i) => drawBadge(g, l.line, l.code, 40 + i * 132, 66, 116));
      const tx = 40 + lines.length * 132 + 24;
      g.fillStyle = '#1c2126'; g.font = `900 ${name.zh.length > 5 ? 84 : 104}px "Noto Sans TC", sans-serif`; g.textBaseline = 'alphabetic';
      g.fillText(name.zh, tx, 158);
      g.fillStyle = '#3d454d'; g.font = '600 44px "Barlow Semi Condensed", sans-serif'; g.fillText(name.en, tx + 4, 216);
    });
  }
  function drawBadge(g, lineId, code, x, y, s) {
    const m = code.match(/^([A-Z]+)(\d+[A-Z]?)$/);
    g.fillStyle = '#fff'; g.strokeStyle = LINES[lineId].color; g.lineWidth = s * .09;
    roundRect(g, x, y, s, s, s * .18); g.fill(); g.stroke();
    g.fillStyle = '#1c2126'; g.textAlign = 'center';
    g.font = `700 ${s * .36}px "Barlow Semi Condensed", sans-serif`; g.fillText(m[1], x + s / 2, y + s * .44);
    g.fillText(m[2], x + s / 2, y + s * .84); g.textAlign = 'left';
  }
  function dirSignTex(lineId, terminal) {
    const L = LINES[lineId], t = MRT.label(terminal, lineId);
    return canvasTex(1024, 256, (g, w, h) => {
      g.fillStyle = '#23272b'; g.fillRect(0, 0, w, h);
      g.fillStyle = L.color; roundRect(g, 36, 52, 152, 152, 26); g.fill();
      g.fillStyle = L.text; g.font = `700 ${lineId.length > 1 ? 72 : 96}px "Barlow Semi Condensed", sans-serif`; g.textAlign = 'center'; g.fillText(lineId, 112, 162); g.textAlign = 'left';
      g.fillStyle = '#fff'; g.font = `700 ${t.zh.length > 5 ? 76 : 92}px "Noto Sans TC", sans-serif`; g.fillText('往 ' + t.zh, 230, 140);
      g.fillStyle = '#c8cdd2'; g.font = '500 44px "Barlow Semi Condensed", sans-serif'; g.fillText('To ' + t.en, 236, 204);
    });
  }

  const M = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: o.r ?? .7, metalness: o.m ?? 0, map: o.map || null, transparent: !!o.t, opacity: o.o ?? 1, side: o.side || T.FrontSide, emissive: o.e || '#000', emissiveIntensity: o.ei ?? 1, emissiveMap: o.em || null, depthWrite: o.dw ?? true });
  function box(w, h, d, mat, x, y, z, parent) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent && parent.add(m); return m; }
  function plane(w, h, mat, parent) { const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); parent && parent.add(m); return m; }

  function dispose(obj) {
    obj.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach(m => { for (const k of ['map', 'emissiveMap']) if (m[k] && m[k].userData.own) m[k].dispose(); m.dispose(); });
    });
  }

  /* ── 天色 ── */
  const SKY = {
    day: { bg: '#a9c6dc', fog: '#c7d6df', hemi: 1.25, sun: 1.6, night: false },
    dusk: { bg: '#c98a6e', fog: '#b99a8e', hemi: .9, sun: 1.0, night: false },
    dawn: { bg: '#8f97ad', fog: '#a4a8b6', hemi: .8, sun: .7, night: false },
    night: { bg: '#0d1626', fog: '#1a2436', hemi: .45, sun: .15, night: true },
  };
  function applySky(ug) {
    const s = SKY[TaipeiTime.sky()];
    if (ug) {
      scene.background = new T.Color('#1a1c1e');
      scene.fog = new T.Fog('#2a2e33', 30, 95);
      hemi.intensity = 1.15; sun.intensity = .35;
    } else {
      scene.background = new T.Color(s.bg);
      scene.fog = new T.Fog(s.fog, 40, 220);
      hemi.intensity = s.hemi; sun.intensity = s.sun;
    }
    return s;
  }

  /* ── 城市（高架段） ── */
  function city(x0, x1, seed, parent) {
    const s = SKY[TaipeiTime.sky()];
    let sd = seed;
    const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const winTex = canvasTex(64, 128, (g, w, h) => {
      g.fillStyle = s.night ? '#141b26' : '#8e9aa6'; g.fillRect(0, 0, w, h);
      for (let y = 6; y < h; y += 12) for (let x = 5; x < w; x += 12) {
        const lit = Math.random() < (s.night ? .45 : .0);
        g.fillStyle = lit ? '#ffd890' : (s.night ? '#1e2836' : '#b9c7d3');
        g.fillRect(x, y, 7, 8);
      }
    });
    const mat = new T.MeshStandardMaterial({ map: winTex, emissiveMap: s.night ? winTex : null, emissive: s.night ? '#ffffff' : '#000', emissiveIntensity: s.night ? .9 : 0, roughness: .8 });
    const geo = new T.BoxGeometry(1, 1, 1);
    const n = Math.max(20, Math.round((x1 - x0) / 9));
    const inst = new T.InstancedMesh(geo, mat, n * 2);
    const m4 = new T.Matrix4(), q = new T.Quaternion();
    let k = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        const w = 8 + rnd() * 14, d = 8 + rnd() * 12, h = 10 + rnd() * 45;
        const x = x0 + (i + rnd()) * (x1 - x0) / n;
        const z = side * (18 + rnd() * 50);
        m4.compose(new T.Vector3(x, -12 + h / 2, z), q, new T.Vector3(w, h, d));
        inst.setMatrixAt(k++, m4);
      }
    }
    parent.add(inst);
    const ground = plane(x1 - x0 + 200, 260, M(s.night ? '#1b2027' : '#7b7f78'), parent);
    ground.rotation.x = -Math.PI / 2; ground.position.set((x0 + x1) / 2, -12, 0);
    // 遠山
    const mtn = new T.Mesh(new T.CylinderGeometry(260, 260, 60, 48, 1, true), M(s.night ? '#0f1520' : '#7f94a4', { side: T.BackSide }));
    mtn.position.set((x0 + x1) / 2, 0, 0); parent.add(mtn);
  }

  /* ── 車站 ── */
  function buildStation(stationId, lineId, dir) {
    const g = new T.Group();
    const ug = MRT.undergroundOn(stationId, lineId);
    const fullPSD = ug || lineId === 'BR';
    const L = LINES[lineId];
    const s = SKY[TaipeiTime.sky()];
    const len = 72;

    // 月台地板
    const floor = plane(len, 4.9, M('#ffffff', { map: tiled(TEX.floor, len / 2.4, 4.9 / 2.4), r: .45 }), g);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 4.05);
    // 月台邊緣與軌道
    box(len, 1.2, .2, M('#8a8883', { map: TEX.concrete }), 0, -.6, 1.6, g);
    const bed = plane(len + 400, 4.8, M('#ffffff', { map: tiled(TEX.gravel, 40, 1) }), g); bed.rotation.x = -Math.PI / 2; bed.position.set(0, -1.15, -.8);
    for (const rz of [-.72, .72]) box(len + 400, .14, .08, M('#8d9196', { m: .8, r: .35 }), 0, -1.05, rz, g);
    // 警戒線與候車標線
    const tac = plane(len, .32, M('#ffffff', { map: tiled(TEX.tactile, len / 1.2, 1) }), g); tac.rotation.x = -Math.PI / 2; tac.position.set(0, .004, 2.22);
    const green = M('#2f9e5a', { r: .6 });
    for (const d of DOORS) for (const sx of [-1, 1]) {
      const p = plane(.38, 1.0, green, g); p.rotation.x = -Math.PI / 2; p.rotation.z = sx * .35; p.position.set(d + sx * 1.15, .005, 2.95);
    }
    for (const d of DOORS) { const a = plane(.5, .5, M('#f5c400'), g); a.rotation.x = -Math.PI / 2; a.rotation.z = Math.PI / 4; a.scale.y = .5; a.position.set(d, .005, 2.7); }

    // 月台門
    const psdH = fullPSD ? 2.3 : 1.45;
    const glass = M('#cfe3ec', { t: true, o: .16, r: .05, m: .1, dw: false });
    const frame = M('#4a5259', { r: .5, m: .4 });
    const psdLeaves = [];
    for (let i = 0; i < DOORS.length; i++) {
      const d = DOORS[i];
      for (const sx of [-1, 1]) {
        const leaf = new T.Group();
        box(.7, psdH, .04, glass, sx * .35, psdH / 2, 0, leaf);
        box(.05, psdH, .07, frame, sx * .68, psdH / 2, 0, leaf);
        box(.7, .05, .07, frame, sx * .35, .025, 0, leaf);
        leaf.position.set(d, 0, PSD_Z); leaf.userData = { sx, base: d };
        g.add(leaf); psdLeaves.push(leaf);
      }
      box(.12, psdH, .14, frame, d - .76, psdH / 2, PSD_Z, g);
      box(.12, psdH, .14, frame, d + .76, psdH / 2, PSD_Z, g);
    }
    // 固定玻璃面板
    const edges = [-len / 2, ...DOORS.flatMap(d => [d - .82, d + .82]), len / 2];
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i], b = edges[i + 1];
      box(b - a, psdH, .04, glass, (a + b) / 2, psdH / 2, PSD_Z, g);
      for (let x = a + 2.4; x < b - .5; x += 2.4) box(.08, psdH, .1, frame, x, psdH / 2, PSD_Z, g);
    }
    if (fullPSD) {
      box(len, .38, .3, M('#30363c', { r: .6 }), 0, psdH + .19, PSD_Z, g);
      box(len, .06, .31, M(L.color, { e: L.color, ei: .25 }), 0, psdH + .03, PSD_Z, g);
      // 門楣上的站名
      const lab = M('#ffffff', { map: stationSignTex(stationId, lineId) });
      for (const d of [-20, 0, 20]) { const p = plane(1.1, .275, lab, g); p.position.set(d + 4.8, psdH + .2, PSD_Z + .16); }
    } else {
      box(len, .06, .14, M(L.color), 0, psdH + .03, PSD_Z, g);
    }

    if (ug) {
      // 牆面、天花板、燈
      const wallM = M('#ffffff', { map: tiled(TEX.wall, len / 1.2, 3.4 / 1.2), r: .5 });
      const back = plane(len, 3.4, wallM, g); back.position.set(0, 1.7, 6.5); back.rotation.y = Math.PI;
      const far = plane(len + 60, 4.6, M('#ffffff', { map: tiled(TEX.wall, (len + 60) / 1.2, 4.6 / 1.2), r: .5 }), g); far.position.set(0, 1.1, -3.3);
      const ceil = plane(len + 60, 9.8, M('#d9d9d4', { r: .9 }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.4, 1.6);
      const lightM = M('#ffffff', { e: '#fff6e0', ei: 1.4 });
      for (const lz of [-1.4, 3.2, 5.2]) for (let x = -len / 2 + 2; x < len / 2; x += 3) box(2.2, .04, .14, lightM, x, 3.37, lz, g);
      // 軌道側牆上的站名牌
      const sign = M('#ffffff', { map: stationSignTex(stationId, lineId) });
      for (let x = -30; x <= 30; x += 12) { const p = plane(2.6, .65, sign, g); p.position.set(x, 2.95, -3.27); }
      // 柱子
      for (let x = -30; x <= 30; x += 12) box(.7, 3.4, .5, M('#ffffff', { map: tiled(TEX.wall, .5, 3), r: .5 }), x, 1.7, 6.3, g);   // 貼牆的半柱，不擋走道
      // 隧道口外延（讓進站時看得到黑暗）
      for (const sx of [-1, 1]) {
        const tw = plane(200, 4.6, M('#202224', { r: .95 }), g); tw.position.set(sx * (len / 2 + 130), 1.1, -3.2);
      }
    } else {
      // 雨遮、柱子、欄杆
      box(len, .15, 5.6, M(s.night ? '#2a2f35' : '#5b6168', { r: .7 }), 0, 3.6, 4.0, g);
      const lightM = M('#ffffff', { e: '#fff6e0', ei: s.night ? 1.4 : .6 });
      for (let x = -len / 2 + 2; x < len / 2; x += 3) box(2.2, .04, .14, lightM, x, 3.52, 4.0, g);
      for (let x = -30; x <= 30; x += 10) box(.3, 3.6, .3, M('#6c737a', { m: .4 }), x, 1.8, 6.3, g);
      box(len, 1.1, .05, M('#cfe3ec', { t: true, o: .25 }), 0, .55, 6.5, g);
      box(len, .05, .1, M('#7c838a', { m: .5 }), 0, 1.1, 6.5, g);
      // 高架橋
      box(len + 400, .8, 13, M('#77736d', { map: TEX.concrete }), 0, -1.6, 1.5, g);
      for (let x = -200; x <= 200; x += 30) box(2.2, 11, 2.2, M('#77736d'), x, -7, 0, g);
      city(-260, 260, stationId.charCodeAt(0) * 7 + 3, g);
    }

    // 懸吊指標：站名與方向
    const hangY = ug ? 2.85 : 3.0;
    const sn = M('#ffffff', { map: stationSignTex(stationId, lineId) });
    for (const x of [-12, 12]) {
      const p = plane(2.8, .7, sn, g); p.position.set(x, hangY, 4.2);
      const p2 = plane(2.8, .7, sn, g); p2.position.set(x, hangY, 4.19); p2.rotation.y = Math.PI;
      box(.03, .5, .03, frame, x - 1.1, hangY + .55, 4.2, g); box(.03, .5, .03, frame, x + 1.1, hangY + .55, 4.2, g);
    }
    if (dir) {
      const dm = M('#ffffff', { map: dirSignTex(lineId, dir.terminal) });
      for (const x of [0]) {
        const p = plane(2.8, .7, dm, g); p.position.set(x, hangY, 4.2);
        const p2 = plane(2.8, .7, dm, g); p2.position.set(x, hangY, 4.19); p2.rotation.y = Math.PI;
      }
    }
    // 月台燈光
    if (ug) for (let x = -24; x <= 24; x += 16) { const pl = new T.PointLight('#fff2dc', 6, 14, 1.6); pl.position.set(x, 3, 3.8); g.add(pl); }
    g.userData = { psdLeaves, ug, stationId, lineId };
    return g;
  }

  /* ── 站間：隧道或高架 ── */
  function buildSegment(x0, x1, ugA, ugB, lineId, seed) {
    const g = new T.Group();
    const mid = (x0 + x1) / 2;
    const parts = ugA === ugB ? [[x0, x1, ugA]] : [[x0, mid, ugA], [mid, x1, ugB]];
    for (const [a, b, ug] of parts) {
      const len = b - a, cx = (a + b) / 2;
      if (ug) {
        const wallM = M('#3a3b3c', { map: tiled(TEX.concrete, len / 4, 1), r: .95 });
        for (const z of [-2.4, 2.4]) { const w = plane(len, 5, wallM, g); w.position.set(cx, 1, z); w.rotation.y = z > 0 ? Math.PI : 0; }
        const top = plane(len, 4.8, wallM, g); top.rotation.x = Math.PI / 2; top.position.set(cx, 3.2, 0);
        const lightM = M('#ffffff', { e: '#ffe8b8', ei: 2 });
        const n = Math.floor(len / 9);
        const li = new T.InstancedMesh(new T.BoxGeometry(.5, .08, .06), lightM, n * 2);
        const m4 = new T.Matrix4(); let k = 0;
        for (let i = 0; i < n; i++) for (const z of [-2.35, 2.35]) { m4.makeTranslation(a + 4 + i * 9, 2.1, z); li.setMatrixAt(k++, m4); }
        g.add(li);
        const cable = M('#111');
        for (const z of [-2.32, 2.32]) for (const y of [1.2, 1.32, 1.44]) box(len, .04, .04, cable, cx, y, z, g);
        const em = M('#31d07a', { e: '#31d07a', ei: 2 });
        for (let x = a + 30; x < b; x += 60) box(.3, .15, .05, em, x, .6, -2.35, g);
        // 隧道口
        if (parts.length > 1) box(1.2, 6, 6, M('#55585b'), ugA ? b : a, 1.4, 0, g);
      } else {
        box(len, .8, 13, M('#77736d', { map: TEX.concrete }), cx, -1.6, 1.5, g);
        for (const z of [-2.3, 2.3]) box(len, .9, .2, M('#8c8a85', { map: TEX.concrete }), cx, -.7, z, g);
        for (let x = a; x < b; x += 30) box(2, 11, 2, M('#77736d'), x, -7, 0, g);
        if (lineId !== 'BR') for (let x = a + 10; x < b; x += 40) { box(.18, 5, .18, M('#4c5258', { m: .5 }), x, 1.2, -2.2, g); box(.1, .1, 2.4, M('#4c5258'), x, 3.4, -1.1, g); }
      }
    }
    if (parts.some(p => !p[2])) city(x0 - 60, x1 + 60, seed, g);
    return g;
  }

  /* ── 列車 ── */
  let lcdTex, lcdCanvas, stripTex, stripCanvas;
  function buildTrain(lineId) {
    const g = new T.Group();
    const L = LINES[lineId];
    const body = M('#e6e9ec', { r: .35, m: .35 });
    const inner = M('#eceeec', { r: .8 });
    const glassM = M('#24313a', { t: true, o: .35, r: .05, m: .3 });
    const stripe = M(L.color, { r: .5 });
    const doorM = M('#ffffff', { map: TEX.door, r: .5, m: .2 });
    const seatM = M(lineId === 'BR' ? '#5a6b7b' : '#2f5d9e', { r: .6 });
    const prioM = M('#22407a', { r: .6 });
    const steel = M('#c8cdd2', { r: .25, m: .9 });
    const lightM = M('#ffffff', { e: '#fffbea', ei: 1.6 });
    const floorM = M('#8f9498', { r: .8 });

    lcdCanvas = document.createElement('canvas'); lcdCanvas.width = 512; lcdCanvas.height = 128;
    lcdTex = new T.CanvasTexture(lcdCanvas); lcdTex.colorSpace = T.SRGBColorSpace;
    stripCanvas = document.createElement('canvas'); stripCanvas.width = 1024; stripCanvas.height = 128;
    stripTex = new T.CanvasTexture(stripCanvas); stripTex.colorSpace = T.SRGBColorSpace;
    const lcdM = new T.MeshBasicMaterial({ map: lcdTex });
    const stripM = new T.MeshBasicMaterial({ map: stripTex });

    const leaves = [];
    for (let ci = 0; ci < CARS; ci++) {
      const cx = CAR_X[ci];
      const car = new T.Group(); car.position.x = cx; g.add(car);
      const x0 = -CAR_LEN / 2, x1 = CAR_LEN / 2;
      box(CAR_LEN, .14, HALF_W * 2, floorM, 0, -.07, 0, car);
      box(CAR_LEN, .5, HALF_W * 2, M('#4c5156'), 0, -.45, 0, car);   // 車底
      // 車頂（外殼＋內部天花板）
      const roof = new T.Mesh(new T.CylinderGeometry(HALF_W + .04, HALF_W + .04, CAR_LEN, 24, 1, true, -Math.PI / 2, Math.PI), body);
      roof.rotation.z = Math.PI / 2; roof.scale.set(1, 1, .32); roof.scale.set(.32, 1, 1); roof.position.y = 2.3; car.add(roof);
      const ceil = plane(CAR_LEN, HALF_W * 2, inner, car); ceil.rotation.x = Math.PI / 2; ceil.position.y = 2.3;
      for (const z of [-.55, .55]) box(CAR_LEN - .6, .04, .2, lightM, 0, 2.27, z, car);
      // 側牆：每段門之間
      const doorX = DOOR_OFF;
      for (const side of [-1, 1]) {
        const z = side * HALF_W;
        const segs = [];
        let prev = x0;
        for (const d of doorX) { segs.push([prev, d - .7]); prev = d + .7; }
        segs.push([prev, x1]);
        for (const [a, b] of segs) {
          const w = b - a, c = (a + b) / 2;
          box(w, .95, .08, body, c, .475, z, car);           // 窗下
          box(w, .4, .08, body, c, 2.1, z, car);              // 窗上
          box(w, .12, .085, stripe, c, .82, z, car);          // 路線色帶
          const gl = box(w - .3, .95, .03, glassM, c, 1.42, z, car);
          gl.renderOrder = 1;
          box(.15, .95, .08, body, a + .075, 1.42, z, car); box(.15, .95, .08, body, b - .075, 1.42, z, car);
          // 座椅（縱向）
          const sl = w - .6;
          if (sl > 1) {
            box(sl, .12, .48, seatM, c, .45, z - side * .3, car);
            box(sl, .5, .08, seatM, c, .75, z - side * .1, car);
            box(.08, .5, .5, steel, a + .3, .6, z - side * .3, car); box(.08, .5, .5, steel, b - .3, .6, z - side * .3, car);
          }
          // 窗上方路線圖條
          if (side < 0 && w > 3) { const p = plane(Math.min(3, w - 1), .38, stripM, car); p.position.set(c, 2.05, z + .05); }
        }
        // 門框與門
        for (const d of doorX) {
          box(1.4, .2, .09, body, d, 2.2, z, car);
          const lcd = plane(.9, .22, lcdM, car); lcd.position.set(d, 2.08, z - side * .06); lcd.rotation.y = side > 0 ? Math.PI : 0;
          for (const sx of [-1, 1]) {
            const leaf = new T.Mesh(new T.BoxGeometry(.65, 2.05, .05), doorM);
            leaf.position.set(cx + d + sx * .325, 1.03, z + side * .01);
            leaf.userData = { base: cx + d + sx * .325, sx, side };
            g.add(leaf); leaves.push(leaf);
            box(.05, 2.25, .05, steel, d + sx * .78, 1.12, z - side * .25, car);   // 門邊扶桿
          }
        }
      }
      // 拉環桿與拉環
      for (const z of [-.8, .8]) {
        const bar = new T.Mesh(new T.CylinderGeometry(.018, .018, CAR_LEN - .5, 8), steel); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.95, z); car.add(bar);
        for (let x = x0 + .6; x < x1 - .4; x += .45) {
          if (doorX.some(d => Math.abs(x - d) < .7)) continue;
          box(.03, .2, .015, M('#d9dcdf'), x, 1.84, z, car);
          const ring = new T.Mesh(new T.TorusGeometry(.06, .012, 6, 12), M('#eceeef')); ring.position.set(x, 1.68, z); car.add(ring);
        }
      }
      // 車頭／車尾
      if (ci === 0 || ci === CARS - 1) {
        const sx = ci === 0 ? -1 : 1;
        box(.12, 2.4, HALF_W * 2, body, sx * CAR_LEN / 2, 1.1, 0, car);
        const nose = box(.9, 1.9, HALF_W * 2 - .1, body, sx * (CAR_LEN / 2 + .45), .95, 0, car); nose.scale.y = 1;
        box(.05, .8, 2.4, M('#14191d', { r: .1 }), sx * (CAR_LEN / 2 + .92), 1.45, 0, car);
        for (const z of [-.9, .9]) box(.05, .12, .3, M('#fff6d0', { e: '#fff6d0', ei: 2 }), sx * (CAR_LEN / 2 + .92), .55, z, car);
        box(.06, .14, HALF_W * 2 - .2, stripe, sx * (CAR_LEN / 2 + .91), .82, 0, car);
      } else {
        // 車廂連結（外側蛇腹）
        for (const sx of [-1, 1]) box(.4, 2.3, .05, M('#2b2f33'), sx * (CAR_LEN / 2 + .2), 1.1, sx > 0 ? HALF_W - .05 : -HALF_W + .05, car);
      }
    }
    // 車廂間的蛇腹（內部通道）
    for (const gx of [CAR_X[0] + CAR_LEN / 2 + CAR_GAP / 2, CAR_X[1] + CAR_LEN / 2 + CAR_GAP / 2]) {
      for (const z of [-HALF_W + .1, HALF_W - .1]) box(CAR_GAP + .2, 2.3, .1, M('#2b2f33'), gx, 1.1, z, g);
      box(CAR_GAP + .2, .1, HALF_W * 2, M('#2b2f33'), gx, 2.25, 0, g);
      box(CAR_GAP + .2, .05, HALF_W * 2 - .2, floorM, gx, -.03, 0, g);
    }
    g.userData = { leaves };
    return g;
  }

  function drawLcd(head, zh, en, color, textColor) {
    if (!lcdCanvas) return;
    const g = lcdCanvas.getContext('2d');
    g.fillStyle = '#07090b'; g.fillRect(0, 0, 512, 128);
    g.fillStyle = color; g.fillRect(8, 8, 496, 30);
    g.fillStyle = textColor; g.font = '700 22px "Noto Sans TC", sans-serif'; g.fillText(head, 18, 31);
    g.fillStyle = '#ffd36b'; g.textAlign = 'center'; g.font = `900 ${zh.length > 6 ? 40 : 48}px "Noto Sans TC", sans-serif`; g.fillText(zh, 256, 88);
    g.fillStyle = '#e8e2c9'; g.font = '500 22px "Barlow Semi Condensed", sans-serif'; g.fillText(en, 256, 116); g.textAlign = 'left';
    lcdTex.needsUpdate = true;
  }
  function drawStrip(lineId, list, cur) {
    if (!stripCanvas) return;
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

  /* ── 門 ── */
  function applyDoors() {
    const a = st.doorAmt;
    if (stationGroup) for (const leaf of stationGroup.userData.psdLeaves) leaf.position.x = leaf.userData.base + leaf.userData.sx * .68 * a;
    if (train) for (const leaf of train.userData.leaves) if (leaf.userData.side > 0) leaf.position.x = leaf.userData.base + leaf.userData.sx * .62 * a;
  }
  function setDoors(open, ms = 1100) {
    const from = st.doorAmt, to = open ? 1 : 0;
    return tween(ms, k => { st.doorAmt = from + (to - from) * k; applyDoors(); });
  }
  function tween(ms, fn, ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) {
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => { const t = Math.min(1, (now - t0) / ms); fn(ease(t)); t < 1 ? requestAnimationFrame(step) : res(); };
      requestAnimationFrame(step);
    });
  }

  /* ── 可行走區域 ── */
  const nearDoor = (x, w) => DOORS.some(d => Math.abs(x - d) < w);
  function walkable(x, z) {
    const trainHere = st.trainPresent && Math.abs(st.trainX) < .01;
    if (st.platformActive && !st.riding && x > PLAT.x0 && x < PLAT.x1 && z > PLAT.z0 && z < PLAT.z1) return true;
    if (trainHere || st.riding) {
      if (Math.abs(x) < INNER_X && Math.abs(z) < .72) return true;
      if (Math.abs(z) < 1.38 && nearDoor(x, .58)) return true;
      if (!st.riding && st.doorAmt > .85 && z > 0 && z < 2.3 && nearDoor(x, .5)) return true;
    }
    return false;
  }
  const inside = () => player.z < 1.6;

  /* ── 輸入 ── */
  const keys = {};
  const KEYMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd' };
  const joy = { x: 0, y: 0 };
  function bindInput() {
    window.addEventListener('keydown', e => {
      if (!container || e.target.closest('input, textarea')) return;
      if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
      if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.target.closest('button')) {
        const it = currentInteraction(); if (it) { e.preventDefault(); it.run(); }
      }
    });
    window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

    // 拖曳轉視角
    let drag = null;
    container.addEventListener('pointerdown', e => {
      if (e.target.closest('.joystick')) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      container.setPointerCapture(e.pointerId);
    });
    container.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      cam.yaw -= (e.clientX - drag.x) * .006;
      cam.pitch = Math.min(.9, Math.max(.05, cam.pitch + (e.clientY - drag.y) * .004));
      drag.x = e.clientX; drag.y = e.clientY;
    });
    const end = e => { if (drag && drag.id === e.pointerId) drag = null; };
    container.addEventListener('pointerup', end); container.addEventListener('pointercancel', end);
    container.addEventListener('wheel', e => { cam.dist = Math.min(7, Math.max(2.2, cam.dist + e.deltaY * .003)); e.preventDefault(); }, { passive: false });
  }

  // 手機虛擬搖桿
  function bindJoystick(el) {
    const knob = el.querySelector('.knob');
    let id = null, cx = 0, cy = 0;
    const R = 50;
    el.addEventListener('pointerdown', e => {
      id = e.pointerId; el.setPointerCapture(id);
      const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      move(e); e.stopPropagation();
    });
    const move = e => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      joy.x = dx / R; joy.y = -dy / R;
    };
    el.addEventListener('pointermove', move);
    const up = e => { if (e.pointerId !== id) return; id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  function currentInteraction() {
    if (!player.inputOn || player.auto) return null;
    return interactions.find(it => it.when(player)) || null;
  }
  function updateActionBtn() {
    const btn = document.getElementById('actionBtn');
    const it = currentInteraction();
    if (!it) { if (!btn.hidden) { btn.hidden = true; btn.dataset.id = ''; } return; }
    if (btn.dataset.id !== it.id) {
      btn.dataset.id = it.id;
      btn.innerHTML = `${it.label}<kbd>E</kbd>`;
      btn.onclick = () => { const c = currentInteraction(); if (c) c.run(); };
    }
    btn.hidden = false;
  }

  /* ── 每格更新 ── */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!renderer || !container.offsetParent) { last = now; return; }
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    // 移動
    let ix = 0, iy = 0;
    if (player.auto) {
      const tgt = player.auto.points[0];
      const dx = tgt.x - player.x, dz = tgt.z - player.z, d = Math.hypot(dx, dz);
      if (d < .06) { player.auto.points.shift(); if (!player.auto.points.length) { const r = player.auto.resolve; player.auto = null; r(); } }
      else { const sp = Math.min(d, 1.5 * dt); player.x += dx / d * sp; player.z += dz / d * sp; player.face = Math.atan2(dx, dz); player.speed = 1.5; }
    } else if (player.inputOn) {
      if (keys.l) ix -= 1; if (keys.r) ix += 1; if (keys.u) iy += 1; if (keys.d) iy -= 1;
      ix += joy.x; iy += joy.y;
      const mag = Math.min(1, Math.hypot(ix, iy));
      if (mag > .08) {
        const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
        let mx = rx * ix + fx * iy, mz = rz * ix + fz * iy;
        const n = Math.hypot(mx, mz); mx /= n; mz /= n;
        const sp = 2.4 * mag * dt;
        const nx = player.x + mx * sp, nz = player.z + mz * sp;
        if (walkable(nx, nz)) { player.x = nx; player.z = nz; }
        else if (walkable(nx, player.z)) player.x = nx;
        else if (walkable(player.x, nz)) player.z = nz;
        player.face = lerpAngle(player.face, Math.atan2(mx, mz), Math.min(1, dt * 12));
        player.speed = 2.4 * mag;
      } else player.speed = 0;
    } else player.speed = 0;

    if (rig) {
      rig.root.position.set(player.x, 0, player.z);
      rig.root.rotation.y = player.auto ? lerpAngle(rig.root.rotation.y, player.face, .3) : player.face;
      rig.update(dt, player.speed, now / 1000);
    }
    // 鏡頭
    const inTrain = inside();
    const dist = inTrain ? Math.min(cam.dist, 2.6) : cam.dist;
    const tx = player.x, ty = 1.45, tz = player.z;
    let px = tx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist;
    let py = ty + Math.sin(cam.pitch) * dist;
    let pz = tz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist;
    if (inTrain) { pz = Math.min(1.3, Math.max(-1.3, pz)); py = Math.min(2.15, py); px = Math.min(INNER_X, Math.max(-INNER_X, px)); }
    else { pz = Math.min(st.ug ? 5.95 : 7.5, pz); py = Math.min(st.ug ? 3.2 : 3.4, py); }
    const k = Math.min(1, dt * 7);
    cam.pos.x += (px - cam.pos.x) * k; cam.pos.y += (py - cam.pos.y) * k; cam.pos.z += (pz - cam.pos.z) * k;
    camera.position.copy(cam.pos);
    if (shake) camera.position.y += Math.sin(now / 45) * .006 * shake + Math.sin(now / 97) * .008 * shake;
    camera.lookAt(tx, ty, tz);
    updateActionBtn();
    renderer.render(scene, camera);
  }
  function lerpAngle(a, b, t) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; }

  function resize() {
    if (!renderer) return;
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 70 : 55;
    camera.updateProjectionMatrix();
  }

  /* ── 對外介面 ── */
  return {
    DOORS,
    init(el) {
      container = el;
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.className = 'world-canvas';
      el.appendChild(renderer.domElement);
      scene = new T.Scene();
      camera = new T.PerspectiveCamera(55, 1, .05, 600);
      hemi = new T.HemisphereLight('#ffffff', '#6b6d70', 1.1); scene.add(hemi);
      sun = new T.DirectionalLight('#fff4e0', 1); sun.position.set(20, 40, 25); scene.add(sun);
      env = new T.Group(); scene.add(env);
      textures();
      bindInput();
      window.addEventListener('resize', resize);
      new ResizeObserver(resize).observe(el);
      resize();
      requestAnimationFrame(frame);
    },
    bindJoystick,
    setCharacter(id) {
      if (rig && charId === id) return;
      if (rig) { scene.remove(rig.root); dispose(rig.root); }
      charId = id; rig = Human3D.build(id); scene.add(rig.root);
    },
    // 建立（或切換）目前的月台
    setStation(stationId, lineId, dir) {
      if (stationGroup) { env.remove(stationGroup); dispose(stationGroup); }
      if (segGroup) { env.remove(segGroup); dispose(segGroup); segGroup = null; }
      if (nextGroup) { env.remove(nextGroup); dispose(nextGroup); nextGroup = null; }
      env.position.x = 0;
      st.ug = MRT.undergroundOn(stationId, lineId);
      st.lineId = lineId;
      applySky(st.ug);
      stationGroup = buildStation(stationId, lineId, dir);
      env.add(stationGroup);
      st.platformActive = true;
      applyDoors();
    },
    setTrain(lineId, visible) {
      if (!train || train.userData.line !== lineId) {
        if (train) { scene.remove(train); dispose(train); }
        train = buildTrain(lineId); train.userData.line = lineId; scene.add(train);
      }
      train.visible = visible; st.trainPresent = visible;
      train.position.x = st.trainX = visible ? 0 : 400;
      applyDoors();
    },
    // 列車進站（由 -x 方向駛入，減速停妥）
    trainArrive(ms = 6500) {
      train.visible = true; st.trainPresent = true;
      const from = -160;
      return tween(ms, k => { st.trainX = from * (1 - k); train.position.x = st.trainX; }, t => 1 - Math.pow(1 - t, 3));
    },
    trainDepart(ms = 6000) {
      return tween(ms, k => { st.trainX = 200 * k; train.position.x = st.trainX; }, t => t * t * t).then(() => { train.visible = false; st.trainPresent = false; });
    },
    setDoors,
    get doorsOpen() { return st.doorAmt > .85; },
    // 行駛到下一站：env 往後移，下一站從前方接近
    async ride(cfg, opts) {
      const { fromId, toId, lineId, nextDir } = cfg;
      const D = 520;
      st.riding = true; st.platformActive = false;
      segGroup = buildSegment(38, D - 38, MRT.undergroundOn(fromId, lineId), MRT.undergroundOn(toId, lineId), lineId, toId.charCodeAt(0));
      nextGroup = buildStation(toId, lineId, nextDir);
      nextGroup.position.x = D;
      env.add(segGroup); env.add(nextGroup);
      const T0 = opts.duration || 20, ta = T0 * .25, td = T0 * .3, tc = T0 - ta - td;
      const vmax = D / (ta / 2 + tc + td / 2);
      const posAt = t => {
        if (t < ta) return .5 * vmax / ta * t * t;
        if (t < ta + tc) return .5 * vmax * ta + vmax * (t - ta);
        const u = Math.min(t - ta - tc, td);
        return .5 * vmax * ta + vmax * tc + vmax * u - .5 * vmax / td * u * u;
      };
      const speedAt = t => (t < ta ? t / ta : t < ta + tc ? 1 : Math.max(0, 1 - (t - ta - tc) / td));
      const midUg = MRT.undergroundOn(toId, lineId);
      let skyDone = false;
      await new Promise(res => {
        const t0 = performance.now(); let offset = 0;
        const step = now => {
          if (opts.skip && opts.skip()) offset = Math.max(offset, T0 - 2.5 - (now - t0) / 1000);
          const t = Math.min(T0, (now - t0) / 1000 + offset);
          const p = posAt(t), v = speedAt(t);
          env.position.x = -p;
          shake = v;
          if (!skyDone && p > D / 2) { skyDone = true; applySky(midUg); }
          opts.onSpeed && opts.onSpeed(v);
          t < T0 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });
      shake = 0;
      // 重新以新車站為原點
      env.remove(stationGroup); dispose(stationGroup);
      env.remove(segGroup); dispose(segGroup); segGroup = null;
      stationGroup = nextGroup; nextGroup = null;
      stationGroup.position.x = 0; env.position.x = 0;
      st.ug = midUg; st.lineId = lineId;
      applySky(st.ug);
      st.riding = false; st.platformActive = true;
      applyDoors();
    },
    setLcd: drawLcd,
    setStrip: drawStrip,
    setInteractions(list) { interactions = list; const b = document.getElementById('actionBtn'); if (b) b.dataset.id = ''; },
    setInput(on) { player.inputOn = on; if (!on) { for (const k in keys) keys[k] = false; } },
    placePlayer(x, z, face = Math.PI) { player.x = x; player.z = z; player.face = face; cam.yaw = 0; cam.pos.set(x, 2.6, z + 4); },
    // 依序走到幾個點（上下車用）
    walkPath(points) { return new Promise(resolve => { player.auto = { points: points.map(p => ({ ...p })), resolve }; }); },
    get player() { return { x: player.x, z: player.z, inside: inside() }; },
    nearestDoor(x) { return DOORS.reduce((a, d) => (Math.abs(d - x) < Math.abs(a - x) ? d : a), DOORS[0]); },
    nearDoor,
    // 列車開走前，若玩家卡在門口就推回月台
    clearDoorway() { if (player.z > 1.5 && player.z < 2.25) player.z = 2.3; else if (player.z > 1.38 && player.z <= 1.5) player.z = 1.3; },
    refreshSky() { applySky(st.ug); },
  };
})();
