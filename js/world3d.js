/* 3D 世界執行：渲染、角色、鏡頭、多樓層碰撞、電扶梯、列車進出站與搭乘
 * 車站幾何由 Station3D 建造。座標：大廳地板 y = 0，各線月台在不同樓層與位置。
 * 列車停在月台某一側（side = ±1）的軌道上；搭乘時改為移動整個車站環境（env）。
 */
const World = (() => {
  const T = THREE;
  const S = Station3D;
  let renderer, scene, camera, container;
  let env, stationGroup, nextGroup, segGroup, surround;
  let layout = null;
  let rig = null, charId = null, hemi, sun;
  const trains = new Set();   // 目前場上的列車
  let riding = null;          // 正在搭乘的列車
  const player = { x: 0, y: 0, z: 0, face: Math.PI, speed: 0, inputOn: true, auto: null, sitting: false };
  const cam = { yaw: 0, pitch: .32, dist: 4.4, pos: new T.Vector3(0, 2.4, 6) };
  let interactions = [];
  let last = 0, shake = 0, lastGateSide = 0;
  let onZoneChange = null, lastZoneKey = '';
  let gateCheck = null, blocked = null, speedMul = 1;
  // 車站裡的固定設施（柱子、椅子、櫃台……）
  const hitObstacle = (x, z, y) => !!(layout && layout.obstacles && layout.obstacles.some(o => Math.abs(y - o.y) < 1 && x > o.x0 - .28 && x < o.x1 + .28 && z > o.z0 - .28 && z < o.z1 + .28));
  const tickers = [], recenterHooks = [];

  const SKY = {
    day: { bg: '#a9c6dc', fog: '#c7d6df', hemi: 1.25, sun: 1.6 },
    dusk: { bg: '#c98a6e', fog: '#b99a8e', hemi: .9, sun: 1.0 },
    dawn: { bg: '#8f97ad', fog: '#a4a8b6', hemi: .8, sun: .7 },
    night: { bg: '#0d1626', fog: '#1a2436', hemi: .45, sun: .15 },
  };
  function applySky(open) {
    const s = SKY[TaipeiTime.sky()];
    if (!open) {
      scene.background = new T.Color('#1a1c1e'); scene.fog = new T.Fog('#2a2e33', 35, 110);
      hemi.intensity = 1.75; sun.intensity = .45;
    } else {
      scene.background = new T.Color(s.bg); scene.fog = new T.Fog(s.fog, 50, 240);
      hemi.intensity = Math.max(1.3, s.hemi + .4); sun.intensity = s.sun;
    }
  }
  const night = () => TaipeiTime.sky() === 'night';

  function dispose(obj) {
    obj.traverse(o => {
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach(m => { if (m.map && m.map.userData.own && !m.userData.shared) m.map.dispose(); });
    });
  }

  /* ── 可行走區域 ── */
  // 回傳該點地面高度（最接近目前高度且落差 < 0.55 的區域），走不到回傳 null
  function groundAt(x, z, y) {
    let best = null, bestD = .55;
    const consider = h => { const d = Math.abs(h - y); if (d < bestD) { bestD = d; best = h; } };
    const inR = (r, x0, x1, z0, z1) => x > x0 && x < x1 && z > z0 && z < z1;
    if (layout && !riding) {
      const C = layout.concourse, U = layout.unpaid;
      // 大廳付費區（扣掉電扶梯開口）
      if (inR(null, C.x0 + .3, C.x1 - .3, C.z0 + .3, layout.gateZ - .05)) {
        const hole = layout.platforms.some(P => P.ramps.some(r => {
          const a = Math.min(r.xa, r.xb), b = Math.max(r.xa, r.xb);
          const hx0 = r.b > 0 ? a : a + .3, hx1 = r.b > 0 ? b - .3 : b;
          return x > hx0 && x < hx1 && Math.abs(z - r.z) < 1.9;
        }));
        if (!hole) consider(0);
      }
      // 閘門通道
      if (z >= layout.gateZ - .05 && z <= layout.gateZ + 1.25 && layout.gates.some(g => Math.abs(x - g) < .32)) consider(0);
      // 非付費區（扣掉售票機、詢問處）
      if (inR(null, U.x0 + .3, U.x1 - .3, U.z0 - .05, U.z1 - 1.1) && !(x > U.x1 - 5.6 && z > U.z0 + 2 && z < U.z0 + 4) && !(x > U.x1 - 9.8 && x < U.x1 - 6.6 && z > U.z0 + 2 && z < U.z0 + 4) && !(S.SHOPS[layout.stationId] && x < U.x0 + 1.4 && z > U.z0 + 4.4 && z < U.z0 + 9.6)) consider(0);
      for (const P of layout.platforms) {
        // 月台（扣掉電扶梯、柱子、座椅）
        if (Math.abs(z - P.z) < S.PLAT_HALF && Math.abs(x - P.x) < S.LEN / 2 - .4) {
          const lx = x - P.x, lz = z - P.z;
          const onRamp = P.ramps.some(r => { const a = Math.min(r.xa, r.xb) - P.x, b = Math.max(r.xa, r.xb) - P.x; const hx0 = r.b > 0 ? a + .3 : a, hx1 = r.b > 0 ? b : b - .3; return lx > hx0 && lx < hx1 && Math.abs(lz) < 1.9; });
          const pillar = [-28, 0, 28].some(px => Math.abs(lx - px) < .6 && Math.abs(lz) < .55);
          const bench = [-31, 31].some(bx => Math.abs(lx - bx) < 1 && Math.abs(lz) < .4) || (Math.abs(lx + 24) < .9 && Math.abs(lz) < .8);   // 座椅、電梯
          if (!onRamp && !pillar && !bench) consider(P.y);
        }
        // 電扶梯、樓梯（斜面）
        for (const r of P.ramps) {
          const a = Math.min(r.xa, r.xb), b = Math.max(r.xa, r.xb);
          if (x < a - .05 || x > b + .05) continue;
          for (const lz of S.LANES) {
            if (Math.abs(z - (P.z + lz)) > (lz === 0 ? .62 : .44)) continue;
            const t = (x - r.xa) / (r.xb - r.xa);
            consider(r.ya + (r.yb - r.ya) * Math.min(1, Math.max(0, t)));
          }
        }
      }
    }
    // 列車內部與開著的車門
    for (const tr of trains) {
      if (!tr.group.visible) continue;
      const P = tr.P, tx = P.x + tr.x, tz = P.z + tr.side * S.TRACK, ty = P.y;
      const stopped = Math.abs(tr.x) < .01;
      if (!stopped && tr !== riding) continue;
      if (Math.abs(x - tx) < S.CAR_X[2] + 9.6 && Math.abs(z - tz) < .72) consider(ty);
      if (Math.abs(z - tz) < 1.38 && S.DOORS.some(d => Math.abs(x - (tx + d)) < .58)) consider(ty);
      if (!riding && stopped && tr.doorAmt > .85) {
        const zA = P.z + tr.side * 2.1, zB = tz - tr.side * 1.2;
        if (z > Math.min(zA, zB) && z < Math.max(zA, zB) && S.DOORS.some(d => Math.abs(x - (tx + d)) < .5)) consider(ty);
      }
    }
    return best;
  }
  // 電扶梯輸送：回傳 x 方向速度
  function conveyorAt(x, z) {
    if (!layout || riding) return 0;
    for (const P of layout.platforms) for (const r of P.ramps) {
      const a = Math.min(r.xa, r.xb), b = Math.max(r.xa, r.xb);
      if (x < a || x > b) continue;
      if (Math.abs(z - (P.z + S.LANES[0])) < .44) return Math.sign(r.xb - r.xa) * 1.1;   // 往大廳
      if (Math.abs(z - (P.z + S.LANES[2])) < .44) return -Math.sign(r.xb - r.xa) * 1.1;  // 往月台
    }
    return 0;
  }
  function trainOf(px, pz, py) {
    for (const tr of trains) {
      if (!tr.group.visible) continue;
      const tx = tr.P.x + tr.x, tz = tr.P.z + tr.side * S.TRACK;
      if (Math.abs(py - tr.P.y) < .5 && Math.abs(px - tx) < S.CAR_X[2] + 9.6 && Math.abs(pz - tz) < 1.42) return tr;
    }
    return null;
  }
  // 玩家目前所在區域
  function zone() {
    if (riding) return { kind: 'train', train: riding, P: riding.P };
    const tr = trainOf(player.x, player.z, player.y);
    if (tr) return { kind: 'train', train: tr, P: tr.P };
    if (!layout) return { kind: 'none' };
    for (const P of layout.platforms) if (Math.abs(player.y - P.y) < .3 && Math.abs(player.z - P.z) < 3.3 && Math.abs(player.x - P.x) < S.LEN / 2) return { kind: 'platform', P };
    if (Math.abs(player.y) < .3) return { kind: player.z > layout.gateZ + .6 ? 'unpaid' : 'concourse' };
    return { kind: 'ramp' };
  }

  /* ── 輸入 ── */
  const keys = {};
  const KEYMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ShiftLeft: 'run', ShiftRight: 'run' };
  let runToggle = false;
  const joy = { x: 0, y: 0 };
  function bindInput() {
    window.addEventListener('keydown', e => {
      if (!container || e.target.closest('input, textarea')) return;
      if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
      // E 一律是互動；空白鍵／Enter 在按鈕上時保留給按鈕
      if (e.code === 'KeyE' || ((e.code === 'Space' || e.code === 'Enter') && !e.target.closest('button'))) {
        const it = currentInteraction(); if (it) { e.preventDefault(); it.run(); }
      }
    });
    window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    // 單指拖曳轉視角；雙指捏合縮放（拉近／拉遠鏡頭）
    const pts = new Map();
    let pinch = null;
    const zoomTo = d => { cam.dist = Math.min(9, Math.max(1.2, d)); };
    const spread = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    container.addEventListener('pointerdown', e => {
      if (e.target.closest('.joystick')) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { container.setPointerCapture(e.pointerId); } catch (_) {}
      if (pts.size === 2) pinch = { d: spread(), dist: cam.dist };
    });
    container.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size >= 2) { if (pinch) zoomTo(pinch.dist * pinch.d / Math.max(20, spread())); return; }
      cam.yaw -= dx * .006;
      cam.pitch = Math.min(.9, Math.max(.05, cam.pitch + dy * .004));
    });
    const end = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
    container.addEventListener('pointerup', end); container.addEventListener('pointercancel', end);
    container.addEventListener('wheel', e => { zoomTo(cam.dist + e.deltaY * .003); e.preventDefault(); }, { passive: false });
  }
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
  function pstate() { return { x: player.x, y: player.y, z: player.z, zone: zone() }; }
  function currentInteraction() {
    if (!player.inputOn || player.auto) return null;
    const p = pstate();
    return interactions.find(it => it.when(p)) || null;
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
    const dt = Math.min(.12, (now - (last || now)) / 1000); last = now;   // 低幀率裝置也不會變慢動作
    let moved = false;
    if (player.auto) {
      const tgt = player.auto.points[0];
      const dx = tgt.x - player.x, dz = tgt.z - player.z, d = Math.hypot(dx, dz);
      if (d < .06) { player.auto.points.shift(); if (!player.auto.points.length) { const r = player.auto.resolve; player.auto = null; r(); } }
      else {
        const sp = Math.min(d, 1.6 * dt);
        player.x += dx / d * sp; player.z += dz / d * sp; player.face = Math.atan2(dx, dz); player.speed = 1.6; moved = true;
        const h = groundAt(player.x, player.z, player.y); if (h != null) player.y = h;
      }
    } else if (player.inputOn && !player.sitting) {
      let ix = 0, iy = 0;
      if (keys.l) ix -= 1; if (keys.r) ix += 1; if (keys.u) iy += 1; if (keys.d) iy -= 1;
      ix += joy.x; iy += joy.y;
      const mag = Math.min(1, Math.hypot(ix, iy));
      if (mag > .08) {
        const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
        let mx = rx * ix + fx * iy, mz = rz * ix + fz * iy;
        const n = Math.hypot(mx, mz); mx /= n; mz /= n;
        const v = (keys.run || runToggle ? 5.2 : 2.6) * mag * speedMul;   // 跑步 5.2 m/s、走路 2.6 m/s（體力越高越快）
        const sp = v * dt;
        const bx = player.x, bz = player.z;
        tryMove(player.x + mx * sp, player.z + mz * sp);
        // 撞到柱子、椅子、櫃台等設施：沿著邊滑過去
        if (hitObstacle(player.x, player.z, player.y) && !hitObstacle(bx, bz, player.y)) {
          player.x = bx; player.z = bz;
          tryMove(bx + mx * sp, bz); if (hitObstacle(player.x, player.z, player.y)) { player.x = bx; player.z = bz; tryMove(bx, bz + mz * sp); if (hitObstacle(player.x, player.z, player.y)) { player.x = bx; player.z = bz; } }
        }
        if (blocked && blocked(player.x, player.z, player.y)) { player.x = bx; player.z = bz; }   // 不能穿過 NPC
        player.face = lerpAngle(player.face, Math.atan2(mx, mz), Math.min(1, dt * 12));
        player.speed = v; moved = true;
      } else player.speed = 0;
      // 電扶梯會自己把人往上／往下帶
      const cv = conveyorAt(player.x, player.z);
      if (cv) { tryMove(player.x + cv * dt, player.z); if (!moved) player.speed = 0; }
    } else player.speed = 0;
    // 閘門「嗶」
    if (layout && Math.abs(player.y) < .3) {
      const side = player.z > layout.gateZ + .6 ? 1 : -1;
      if (lastGateSide && side !== lastGateSide && layout.gates.some(g => Math.abs(player.x - g) < .4)) {
        // side = 1 出站、-1 進站；遊戲可以拒絕（例如餘額不足）
        if (gateCheck && !gateCheck(side)) { player.z = layout.gateZ + (side > 0 ? .2 : 1.1); player.auto = null; }
        else { Sound.gate(); lastGateSide = side; }
      } else lastGateSide = side;
    }
    if (rig) {
      rig.root.position.set(player.x, player.y, player.z);
      rig.root.rotation.y = player.face;
      rig.sit += ((player.sitting ? 1 : 0) - rig.sit) * Math.min(1, dt * 6);
      rig.update(dt, player.speed, now / 1000);
    }
    // 區域變化通知
    const z = zone();
    const key = z.kind + (z.P ? ':' + z.P.k : '') + (z.train ? ':t' : '');
    if (key !== lastZoneKey) { lastZoneKey = key; onZoneChange && onZoneChange(z); }
    // 鏡頭
    const inTrain = z.kind === 'train';
    const dist = inTrain ? Math.min(cam.dist, 2.6) : cam.dist;
    const pitch = inTrain ? Math.min(cam.pitch, .12) : cam.pitch;
    const tx = player.x, ty = player.y + 1.5, tz = player.z;
    let px = tx + Math.sin(cam.yaw) * Math.cos(pitch) * dist;
    let py = ty + Math.sin(pitch) * dist;
    let pz = tz + Math.cos(cam.yaw) * Math.cos(pitch) * dist;
    if (inTrain) {
      const tr = z.train, ctx = tr.P.x + tr.x, ctz = tr.P.z + tr.side * S.TRACK;
      px = Math.min(ctx + 30, Math.max(ctx - 30, px)); pz = Math.min(ctz + 1.3, Math.max(ctz - 1.3, pz)); py = Math.min(player.y + 2.15, py);
    } else if (z.kind === 'platform') {
      pz = Math.min(z.P.z + 6.5, Math.max(z.P.z - 6.5, pz)); py = Math.min(player.y + (z.P.under ? 3.2 : 3.6), py);
    } else if (z.kind === 'unpaid') {
      const U = layout.unpaid;
      px = Math.min(U.x1 - .5, Math.max(U.x0 + .5, px)); pz = Math.min(U.z1 - .5, Math.max(layout.gateZ + .6, pz)); py = Math.min(3.9, py);
    } else if (z.kind === 'concourse') {
      const C = layout.concourse;
      px = Math.min(C.x1 - .5, Math.max(C.x0 + .5, px)); pz = Math.min(layout.gateZ - .3, Math.max(C.z0 + .5, pz)); py = Math.min(3.9, py);
    } else py = Math.min(player.y + 3, py);
    const k = Math.min(1, dt * 7);
    cam.pos.x += (px - cam.pos.x) * k; cam.pos.y += (py - cam.pos.y) * k; cam.pos.z += (pz - cam.pos.z) * k;
    camera.position.copy(cam.pos);
    if (shake) camera.position.y += Math.sin(now / 45) * .006 * shake + Math.sin(now / 97) * .008 * shake;
    camera.lookAt(tx, ty, tz);
    for (const fn of tickers) fn(dt, now);
    updateActionBtn();
    renderer.render(scene, camera);
  }
  function tryMove(nx, nz) {
    let h = groundAt(nx, nz, player.y);
    if (h != null) { player.x = nx; player.z = nz; player.y = h; return; }
    h = groundAt(nx, player.z, player.y); if (h != null) { player.x = nx; player.y = h; return; }
    h = groundAt(player.x, nz, player.y); if (h != null) { player.z = nz; player.y = h; }
  }
  function lerpAngle(a, b, t) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
  function tween(ms, fn, ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) {
    return new Promise(res => {
      const t0 = performance.now();
      const step = n => { const t = Math.min(1, (n - t0) / ms); fn(ease(t)); t < 1 ? requestAnimationFrame(step) : res(); };
      requestAnimationFrame(step);
    });
  }
  function resize() {
    if (!renderer) return;
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h); camera.fov = w < h ? 70 : 55; camera.updateProjectionMatrix();
  }

  /* ── 列車 ── */
  function placeTrain(tr) {
    tr.group.position.set(tr.P.x + tr.x, tr.P.y, tr.P.z + tr.side * S.TRACK);
    tr.group.rotation.y = tr.side > 0 ? Math.PI : 0;   // 車門朝月台
  }
  function applyDoors(tr) {
    const a = tr.doorAmt;
    for (const leaf of tr.group.userData.leaves) if (leaf.userData.side > 0) leaf.position.x = leaf.userData.base + leaf.userData.sx * .62 * a;
    const psd = stationGroup && stationGroup.userData.psd[`${tr.P.k}:${tr.side}`];
    if (psd && Math.abs(tr.x) < .01) for (const leaf of psd) leaf.position.x = leaf.userData.base + leaf.userData.sx * .68 * a;
  }

  /* ── 對外介面 ── */
  return {
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
      camera = new T.PerspectiveCamera(55, 1, .05, 700);
      hemi = new T.HemisphereLight('#ffffff', '#8a8c90', 1.7); scene.add(hemi);
      sun = new T.DirectionalLight('#fff4e0', 1); sun.position.set(20, 40, 25); scene.add(sun);
      env = new T.Group(); scene.add(env);
      bindInput();
      window.addEventListener('resize', resize);
      new ResizeObserver(resize).observe(el);
      resize();
      requestAnimationFrame(frame);
    },
    bindJoystick,
    set onZone(fn) { onZoneChange = fn; lastZoneKey = ''; },
    set onGate(fn) { gateCheck = fn; },
    set blocker(fn) { blocked = fn; },
    setSpeedMul(v) { speedMul = v; },
    get scene() { return scene; },
    get env() { return env; },
    get camera() { return camera; },
    setRun(on) { runToggle = on; },
    // 坐下／起身
    sit(pos) {
      if (pos) { player.sitting = true; player.stand = pos.stand || null; player.x = pos.x; player.z = pos.z; player.face = pos.face; player.speed = 0; }
      else if (player.stand) { player.sitting = false; player.x = player.stand.x; player.z = player.stand.z; player.stand = null; }
      else { player.sitting = false; const tr = trainOf(player.x, player.z, player.y); if (tr) { const tz = tr.P.z + tr.side * S.TRACK; player.z = tz + Math.sign(player.z - tz) * .5; } }
    },
    get sitting() { return player.sitting; },
    trainOf: (x, z, y) => trainOf(x, z, y),
    addTicker(fn) { tickers.push(fn); },
    onRecenter(fn) { recenterHooks.push(fn); },
    get running() { return runToggle; },
    groundAt: (x, z, y) => groundAt(x, z, y),
    // 拍照：把目前的畫面縮小成一張圖
    snap: (w = 200) => { renderer.render(scene, camera); const c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * renderer.domElement.height / renderer.domElement.width); c.getContext('2d').drawImage(renderer.domElement, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .6); },
    setCharacter(id, wear) {
      const key = id + JSON.stringify(wear ? Outfits.wear(id, wear) : Outfits.wear(id));
      if (rig && rig.key === key) return;
      const sit = rig ? rig.sit : 0;
      if (rig) { scene.remove(rig.root); dispose(rig.root); }
      charId = id; rig = Human3D.build(id, wear); rig.key = key; rig.sit = sit; scene.add(rig.root);
    },
    // 載入車站（整座：大廳＋各線月台）
    loadStation(stationId) {
      for (const tr of [...trains]) this.removeTrain(tr);
      for (const grp of [stationGroup, segGroup, nextGroup, surround]) if (grp) { env.remove(grp); dispose(grp); }
      segGroup = nextGroup = null;
      env.position.set(0, 0, 0);
      layout = S.layout(stationId);
      stationGroup = S.build(layout, TaipeiTime.sky());
      surround = S.surroundings(layout, night());
      env.add(stationGroup); env.add(surround);
      applySky(layout.hasElevated);
      lastZoneKey = '';
      return layout;
    },
    get layout() { return layout; },
    // 把玩家放在大廳（付費區，靠近第一條線的電扶梯）
    spawnInConcourse() {
      const P = layout.platforms[0], r = P.ramps[1];
      player.x = r.xb + 2.5; player.y = 0; player.z = P.z + 3.2; player.face = Math.PI;
      cam.yaw = Math.PI / 2; cam.pos.set(player.x + 4, 2.6, player.z);
    },
    placePlayer(x, y, z, face = Math.PI) { player.x = x; player.y = y; player.z = z; player.face = face; cam.pos.set(x, y + 2.6, z + 4); },
    get player() { return pstate(); },
    zone,
    // 列車
    spawnTrain(k, side, line, travel, livery) {
      const P = layout.platforms[k];
      const tr = { P, side, travel, line, livery, x: -travel * 170, doorAmt: 0, group: S.makeTrain(line, livery) };
      tr.group.traverse(o => { if (o.geometry) o.userData.shared = true; });
      scene.add(tr.group); placeTrain(tr); trains.add(tr);
      return tr;
    },
    removeTrain(tr) { scene.remove(tr.group); trains.delete(tr); },
    trainArrive(tr, ms = 6500) {
      const from = tr.x;
      return tween(ms, k => { tr.x = from * (1 - k); placeTrain(tr); }, t => 1 - Math.pow(1 - t, 3));
    },
    trainDepart(tr, ms = 6000) {
      return tween(ms, k => { tr.x = tr.travel * 200 * k; placeTrain(tr); }, t => t * t * t).then(() => this.removeTrain(tr));
    },
    setDoors(tr, open, ms = 1100) {
      const from = tr.doorAmt, to = open ? 1 : 0;
      return tween(ms, k => { tr.doorAmt = from + (to - from) * k; applyDoors(tr); });
    },
    isInside(tr) { return trainOf(player.x, player.z, player.y) === tr; },
    nearestDoor(tr, x) { const tx = tr.P.x + tr.x; return S.DOORS.map(d => tx + d).reduce((a, d) => (Math.abs(d - x) < Math.abs(a - x) ? d : a)); },
    // 卡在門口時推回月台或車內
    clearDoorway(tr) {
      const tz = tr.P.z + tr.side * S.TRACK, rel = (player.z - tr.P.z) * tr.side;
      if (Math.abs(player.y - tr.P.y) > .5) return;
      if (rel > S.PLAT_HALF - .1 && rel < S.TRACK - 1.3) player.z = rel < (S.PSD + .2) ? tr.P.z + tr.side * (S.PLAT_HALF - .2) : tz - tr.side * 1.25;
    },
    // 搭乘：從目前車站開到 toId，回傳新車站版面；列車會停在新車站同一條線、同一側
    async ride(tr, { toId, duration = 22, onSpeed, skip, anomaly }) {
      const P = tr.P, travel = tr.travel, D = 520;
      const tx0 = P.x + tr.x, tz = P.z + tr.side * S.TRACK, ty = P.y;
      for (const o of [...trains]) if (o !== tr) this.removeTrain(o);
      riding = tr;
      const nextL = S.layout(toId);
      const P2 = nextL.platforms.find(p => p.line === tr.line);
      nextGroup = S.build(nextL, TaipeiTime.sky());
      const nextSur = S.surroundings(nextL, night());
      const off = new T.Vector3(tx0 + travel * D - P2.x, ty - P2.y, tz - (P2.z + tr.side * S.TRACK));
      nextGroup.position.copy(off); nextSur.position.copy(off);
      segGroup = S.segment(tx0 + travel * 38, tx0 + travel * (D - 38), ty, tz, P.under, P2.under, tr.line, toId.charCodeAt(0) + toId.length * 17, night(), anomaly);
      env.add(nextGroup); env.add(nextSur); env.add(segGroup);
      const T0 = duration, ta = T0 * .25, td = T0 * .3, tc = T0 - ta - td;
      const vmax = D / (ta / 2 + tc + td / 2);
      const posAt = t => {
        if (t < ta) return .5 * vmax / ta * t * t;
        if (t < ta + tc) return .5 * vmax * ta + vmax * (t - ta);
        const u = Math.min(t - ta - tc, td);
        return .5 * vmax * ta + vmax * tc + vmax * u - .5 * vmax / td * u * u;
      };
      const speedAt = t => (t < ta ? t / ta : t < ta + tc ? 1 : Math.max(0, 1 - (t - ta - tc) / td));
      let skyDone = false;
      await new Promise(res => {
        const t0 = performance.now(); let offset = 0;
        const step = now => {
          if (skip && skip()) offset = Math.max(offset, T0 - 2.5 - (now - t0) / 1000);
          const t = Math.min(T0, (now - t0) / 1000 + offset);
          const p = posAt(t), v = speedAt(t);
          env.position.x = -travel * p;
          shake = v;
          if (!skyDone && p > D / 2) { skyDone = true; applySky(!P2.under || nextL.hasElevated); }
          // 經過幽靈月台時車廂燈閃爍
          const lm = tr.group.userData.lightM;
          if (lm) lm.emissiveIntensity = anomaly && Math.abs(p - D / 2) < 45 ? (Math.sin(now / 37) > .2 ? 1.6 : .15) : 1.6;
          onSpeed && onSpeed(v);
          t < T0 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });
      shake = 0;
      // 以新車站為原點重新對齊
      for (const grp of [stationGroup, segGroup, surround]) { env.remove(grp); dispose(grp); }
      stationGroup = nextGroup; surround = nextSur; nextGroup = segGroup = null;
      const W = new T.Vector3(env.position.x + off.x, off.y, off.z);
      stationGroup.position.set(0, 0, 0); surround.position.set(0, 0, 0); env.position.set(0, 0, 0);
      player.x -= W.x; player.y -= W.y; player.z -= W.z;
      cam.pos.sub(W);
      for (const fn of recenterHooks) fn(W);
      layout = nextL;
      tr.P = P2; tr.x = 0; placeTrain(tr); applyDoors(tr);
      riding = null;
      applySky(layout.hasElevated);
      lastZoneKey = '';
      return layout;
    },
    get riding() { return riding; },
    setLcd: S.drawLcd,
    setStrip: S.drawStrip,
    setLed(k, side, rows) {
      const pg = stationGroup && stationGroup.children.find(c => c.userData && c.userData[`led${side}`] && c.position.z === layout.platforms[k].z && c.position.y === layout.platforms[k].y);
      if (pg) S.drawLed(pg.userData[`led${side}`], layout.platforms[k].line, rows);
    },
    setInteractions(list) { interactions = list; const b = document.getElementById('actionBtn'); if (b) b.dataset.id = ''; },
    setInput(on) { player.inputOn = on; if (!on) for (const k in keys) keys[k] = false; },
    walkPath(points) { return new Promise(resolve => { player.auto = { points: points.map(p => ({ ...p })), resolve }; }); },
    refreshSky() { if (layout) applySky(layout.hasElevated); },
  };
})();
