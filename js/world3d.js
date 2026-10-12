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
  let rig = null, charId = null, hemi, sun, plight;
  const trains = new Set();   // 目前場上的列車
  let riding = null;          // 正在搭乘的列車
  const player = { x: 0, y: 0, z: 0, face: Math.PI, speed: 0, inputOn: true, auto: null, sitting: false };
  const cam = { yaw: 0, pitch: .32, dist: 4.4, pos: new T.Vector3(0, 2.4, 6), mode: 0, lastDrag: 0, roomKey: '' };
  // 視角：標準、遠景、近景、第一人稱、俯視
  const VIEWS = [{ name: '標準', dist: 4.4, pitch: .32 }, { name: '遠景', dist: 7.5, pitch: .45 }, { name: '近景', dist: 2.2, pitch: .2 }, { name: '第一人稱', fp: true, pitch: .3 }, { name: '俯視', dist: 9, pitch: .85 }];
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
  let mood = null;   // 迷霧之城等特殊氣氛：覆蓋天色、霧、光
  function applySky(open) {
    const s = SKY[TaipeiTime.sky()];
    if (mood) {
      scene.background = new T.Color(mood.bg); scene.fog = new T.Fog(mood.fog, mood.near, mood.far);
      hemi.intensity = mood.hemi; sun.intensity = mood.sun; hemi.color.set(mood.tint || '#ffffff');
      return;
    }
    hemi.color.set('#ffffff');
    if (!open) {
      scene.background = new T.Color('#1a1c1e'); scene.fog = new T.Fog('#2a2e33', 35, 110);
      hemi.intensity = 1.5; sun.intensity = .45;
    } else {
      scene.background = new T.Color(s.bg); scene.fog = new T.Fog(s.fog, 50, 240);
      hemi.intensity = Math.max(1.1, s.hemi + .2); sun.intensity = s.sun;
    }
  }
  const night = () => TaipeiTime.sky() === 'night';

  let loadSeq = 0;
  let pre = null;   // 預先建好的下一站
  // 分幀上傳貼圖（每幀 4 張），避免第一次看到新車站時卡頓
  const warmQ = [];
  function warm(obj) {
    if (!obj || !renderer) return;
    const seen = new Set();
    obj.traverse(o => { if (o.material) for (const m of [].concat(o.material)) for (const k of ['map', 'emissiveMap']) if (m[k] && !seen.has(m[k])) { seen.add(m[k]); warmQ.push(m[k]); } });
  }
  function warmStep() { for (let i = 0; i < 4 && warmQ.length; i++) { const t = warmQ.shift(); try { renderer.initTexture(t); } catch (e) { /* 舊瀏覽器沒有 initTexture */ } } }   // 每次載入車站 +1；搭車中途被換場（例如 06:00）時，搭乘流程就不再對齊
  function dispose(obj) {
    if (!obj) return;
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
      // 房間（廁所、哺集乳室、站務室、便利商店）與門口
      for (const r of layout.rooms || []) {
        if (inR(null, r.x0 + .3, r.x1 - .3, r.z0 + .25, r.z1 - .25)) consider(0);
        if (Math.abs(z - r.door.z) < r.door.w / 2 - .12 && Math.abs(x - r.door.wx) < .7) consider(0);
      }
      // 閘門通道
      if (z >= layout.gateZ - .05 && z <= layout.gateZ + 1.25 && layout.gates.some(g => Math.abs(x - g) < .32)) consider(0);
      // 非付費區（扣掉售票機、詢問處）
      if (inR(null, U.x0 + .3, U.x1 - .3, U.z0 - .05, U.z1 - 1.1) && !(x > U.x1 - 5.6 && z > U.z0 + 2 && z < U.z0 + 4) && !(x > U.x1 - 9.8 && x < U.x1 - 6.6 && z > U.z0 + 2 && z < U.z0 + 4)) consider(0);
      for (const P of layout.platforms) {
        // 月台（扣掉電扶梯、柱子、座椅）
        if (Math.abs(z - P.z) < S.PLAT_HALF && Math.abs(x - P.x) < S.LEN / 2 - .4) {
          const lx = x - P.x, lz = z - P.z;
          // 電扶梯底下：地下月台的電扶梯往上走，離地夠高（頭頂碰不到）的那一段可以從下面走過去
          const onRamp = P.ramps.some(r => { const a = Math.min(r.xa, r.xb) - P.x, b = Math.max(r.xa, r.xb) - P.x; const hx0 = r.b > 0 ? a + .3 : a, hx1 = r.b > 0 ? b : b - .3; return lx > hx0 && lx < hx1 && Math.abs(lz) < 1.9 && !(P.y < 0 && underRampH(r, x) > 2.3); });
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
    if (Math.abs(player.y) < .3) {
      const kind = player.z > layout.gateZ + .6 ? 'unpaid' : 'concourse';
      const room = (layout.rooms || []).find(r => player.x > Math.min(r.x0, r.x1) && player.x < Math.max(r.x0, r.x1) && player.z > r.z0 && player.z < r.z1 && Math.abs(player.x - r.door.wx) > .15);
      return room ? { kind, room } : { kind };
    }
    return { kind: 'ramp' };
  }

  /* ── 輸入 ── */
  const keys = {};
  const KEYMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ShiftLeft: 'run', ShiftRight: 'run' };
  let runToggle = false, joyEdge = 0, joyRun = false, stuckT = 0;
  const onRampNow = () => !!layout && Math.abs(player.y) > .05 && !layout.platforms.some(P => Math.abs(player.y - P.y) < .05);
  const onFloor = () => !!layout && (Math.abs(player.y) < .05 || layout.platforms.some(P => Math.abs(player.y - P.y) < .05));
  // 脫離卡住：找最近、可以站的地板（大廳或月台，不在柱子、設施裡），把玩家放過去
  function unstuck(auto) {
    if (!layout || riding) return false;
    const levels = [0, ...layout.platforms.map(P => P.y)].sort((a, b) => Math.abs(a - player.y) - Math.abs(b - player.y));
    let best = null, bd = 1e9;
    for (let r = .4; r <= 16 && !best; r += .4) {
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2, x = player.x + Math.cos(a) * r, z = player.z + Math.sin(a) * r;
        for (const y of levels) {
          const h = groundAt(x, z, y);
          if (h == null || Math.abs(h - y) > .02 || hitObstacle(x, z, h) || (blocked && blocked(x, z, h))) continue;
          const d = r + Math.abs(h - player.y) * 1.5;
          if (d < bd) { bd = d; best = { x, y: h, z }; }
        }
      }
    }
    player.auto = null; player.vnow = 0; player.sitting = false;
    if (best) { player.x = best.x; player.y = best.y; player.z = best.z; }
    else { const C = layout.concourse; player.x = (C.x0 + C.x1) / 2; player.y = 0; player.z = layout.gateZ - 3; }
    cam.pos.set(player.x, player.y + 2.4, player.z + 4);
    if (typeof toast === 'function') toast(auto ? '<b>好像卡住了</b><span>已經把你移到旁邊的地板</span>' : '<b>已脫離卡住</b><span>移到最近可以走的地方</span>');
    return true;
  }
  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  /* ── 畫質：自動（依幀率調整解析度）／高／省電（解析度低、30 fps、人少一點） ── */
  let quality = 'auto'; try { quality = localStorage.getItem('quality') || 'auto'; } catch (e) { /* 無法存取 */ }
  const DPR = window.devicePixelRatio || 1;
  const capFor = q => (q === 'high' ? Math.min(2, DPR) : q === 'low' ? Math.max(.6, Math.min(1, DPR) * .75) : Math.min(coarse ? 1.5 : 2, DPR));
  let pr = capFor(quality), lastRender = 0, lastBtn = 0;
  const perf = { t0: 0, n: 0, fps: 60, changed: 0 };
  function setPR(v) { pr = v; if (renderer) { renderer.setPixelRatio(v); resize(); } }
  function adapt(now) {
    perf.n++;
    if (!perf.t0) { perf.t0 = now; return; }
    const el = now - perf.t0; if (el < 2000) return;
    perf.fps = perf.n * 1000 / el; perf.t0 = now; perf.n = 0;
    if (quality !== 'auto') return;
    const cap = capFor('auto'), min = coarse ? .6 : .75;
    if (perf.fps < 40 && pr > min + .01) { setPR(Math.max(min, pr - .15)); perf.changed = now; }
    else if (perf.fps > 57 && pr < cap - .01 && now - perf.changed > 8000) { setPR(Math.min(cap, pr + .1)); perf.changed = now; }
  }
  const joy = { x: 0, y: 0 };
  function bindInput() {
    window.addEventListener('keydown', e => {
      if (!container || e.target.closest('input, textarea')) return;
      if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); }
      if (e.code === 'KeyV') { cycleView(); e.preventDefault(); }
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
    let lastTap = null;
    container.addEventListener('pointerdown', e => {
      if (e.target.closest('.joystick')) return;
      // 手機：左下角任何地方按下去就是搖桿（搖桿跟著手指出現）
      if (e.pointerType === 'touch' && joyFloat && !pts.size && e.clientX < innerWidth * .45 && e.clientY > innerHeight * .42 && joyFloat(e)) return;
      // 點兩下：鏡頭轉回角色背後
      if (e.pointerType === 'touch' && !pts.size) {
        const t = e.timeStamp;
        if (lastTap && t - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) { cam.yaw = player.face + Math.PI; cam.lastDrag = 0; lastTap = null; }
        else lastTap = { t, x: e.clientX, y: e.clientY };
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' });
      try { container.setPointerCapture(e.pointerId); } catch (_) {}
      if (pts.size === 2) pinch = { d: spread(), dist: cam.dist };
    });
    container.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size >= 2) { if (pinch) zoomTo(pinch.dist * pinch.d / Math.max(20, spread())); return; }
      const k = p.touch ? Math.min(1.6, Math.max(1.1, 900 / Math.max(320, Math.min(innerWidth, innerHeight * 1.6)))) : 1;   // 手機螢幕小：轉得快一點
      cam.yaw -= dx * .006 * k;
      cam.pitch = Math.min(.9, Math.max(VIEWS[cam.mode].fp ? -.5 : .05, cam.pitch + dy * .004 * k));
      cam.lastDrag = performance.now();
    });
    const end = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
    container.addEventListener('pointerup', end); container.addEventListener('pointercancel', end);
    container.addEventListener('wheel', e => { zoomTo(cam.dist + e.deltaY * .003); e.preventDefault(); }, { passive: false });
  }
  let joyFloat = null;
  function bindJoystick(el) {
    const knob = el.querySelector('.knob');
    let id = null, cx = 0, cy = 0;
    const R = 50;
    el.addEventListener('pointerdown', e => {
      id = e.pointerId; el.setPointerCapture(id);
      const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      move(e); e.stopPropagation();
    });
    // 浮動搖桿：在手指按下的地方出現
    joyFloat = e => {
      if (id != null) return false;
      const box = el.offsetParent ? el.offsetParent.getBoundingClientRect() : { left: 0, top: 0 }, w = el.offsetWidth || 132;
      el.classList.add('floating');
      el.style.left = (e.clientX - box.left - w / 2) + 'px'; el.style.top = (e.clientY - box.top - w / 2) + 'px'; el.style.bottom = 'auto';
      id = e.pointerId; try { el.setPointerCapture(id); } catch (_) { /* 有些瀏覽器不能轉移 */ }
      cx = e.clientX; cy = e.clientY; move(e);
      return true;
    };
    const move = e => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      joy.x = dx / R; joy.y = -dy / R;
    };
    el.addEventListener('pointermove', move);
    const up = e => { if (e.pointerId !== id) return; id = null; joy.x = joy.y = 0; knob.style.transform = ''; el.classList.remove('floating', 'run'); el.style.left = el.style.top = el.style.bottom = ''; };
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
      btn.onclick = () => { const c = currentInteraction(); if (c) { if (navigator.vibrate && coarse) try { navigator.vibrate(12); } catch (e) { /* 不支援 */ } c.run(); } };
    }
    btn.hidden = false;
  }

  /* ── 每格更新 ── */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!renderer || !container.offsetParent) { last = now; return; }
    if (quality === 'low' && now - lastRender < 1000 / 31) return;   // 省電：最多 30 fps
    lastRender = now; adapt(now);
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
      // 搖桿推到底超過半秒：自動跑步（放開就恢復走路）
      const jm = Math.hypot(joy.x, joy.y);
      joyEdge = jm > .96 ? joyEdge + dt : 0;
      if (joyRun !== joyEdge > .5) { joyRun = joyEdge > .5; const j = document.getElementById('joystick'); if (j) j.classList.toggle('run', joyRun); }
      // 起步加速、放開減速（不會一按就全速、一放就急停）
      const want = mag > .08 ? (keys.run || runToggle || joyRun ? 5.2 : 2.6) * mag * speedMul : 0;   // 跑步 5.2 m/s、走路 2.6 m/s（體力越高越快）
      player.vnow = (player.vnow || 0) + (want - (player.vnow || 0)) * Math.min(1, dt * (want > (player.vnow || 0) ? 7 : 11));
      if (mag > .08) {
        const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
        let mx = rx * ix + fx * iy, mz = rz * ix + fz * iy;
        const n = Math.hypot(mx, mz); mx /= n; mz /= n;
        player.mdir = { x: mx, z: mz };
        const v = Math.max(player.vnow, .4);
        const sp = v * dt;
        const bx = player.x, bz = player.z;
        tryMove(player.x + mx * sp, player.z + mz * sp);
        // 撞到柱子、椅子、櫃台等設施：沿著邊滑過去
        if (hitObstacle(player.x, player.z, player.y) && !hitObstacle(bx, bz, player.y)) {
          player.x = bx; player.z = bz;
          tryMove(bx + mx * sp, bz); if (hitObstacle(player.x, player.z, player.y)) { player.x = bx; player.z = bz; tryMove(bx, bz + mz * sp); if (hitObstacle(player.x, player.z, player.y)) { player.x = bx; player.z = bz; } }
        }
        if (blocked && !onRampNow() && blocked(player.x, player.z, player.y)) { player.x = bx; player.z = bz; }   // 不能穿過 NPC（手扶梯上例外，免得前後互等卡住）
        player.face = lerpAngle(player.face, Math.atan2(mx, mz), Math.min(1, dt * (v > 4 ? 9 : 12)));
        player.speed = v; moved = true;
      } else if (player.vnow > .15 && player.mdir) {   // 放開搖桿：再滑一小步停下來
        const bx = player.x, bz = player.z;
        tryMove(player.x + player.mdir.x * player.vnow * dt, player.z + player.mdir.z * player.vnow * dt);
        if (hitObstacle(player.x, player.z, player.y) || (blocked && !onRampNow() && blocked(player.x, player.z, player.y))) { player.x = bx; player.z = bz; player.vnow = 0; }
        player.speed = player.vnow; moved = true;
      } else { player.speed = 0; player.vnow = 0; }
      // 卡住偵測：在手扶梯中間按著方向卻 2 秒都沒動，自動放到最近的地板
      if (mag > .3 && !player.auto) {
        const d = Math.hypot(player.x - (player.lastX ?? player.x), player.z - (player.lastZ ?? player.z));
        stuckT = d < .01 && onRampNow() && !onFloor() ? stuckT + dt : 0;
        if (stuckT > 2) { stuckT = 0; unstuck(true); }
      } else stuckT = 0;
      player.lastX = player.x; player.lastZ = player.z;
      // 電扶梯會自己把人往上／往下帶
      const cv = conveyorAt(player.x, player.z);
      if (cv) { tryMove(player.x + cv * dt, player.z); if (!moved) player.speed = 0; }
    } else player.speed = 0;
    // 閘門「嗶」
    if (layout && Math.abs(player.y) < .3) {
      const side = player.z > layout.gateZ + .6 ? 1 : -1;
      if (lastGateSide && side !== lastGateSide && layout.gates.some(g => Math.abs(player.x - g) < .4)) {
        // side = 1 出站、-1 進站；遊戲可以拒絕（例如餘額不足）
        if (gateCheck && !gateCheck(side)) { player.z = layout.gateZ + (side > 0 ? .2 : 1.1); player.auto = null; if (typeof FX !== 'undefined') FX.gate(side, player.x, false); }
        else { Sound.gate(); lastGateSide = side; if (typeof FX !== 'undefined') FX.gate(side, player.x, true); }   // FX：感應區亮燈、浮出「嗶！」
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
    // 鏡頭：在手扶梯／樓梯、車廂、房間、和人說話時自動轉到好看的角度（玩家剛拖曳過就不自動）
    autoCamera(z, dt);
    const inTrain = z.kind === 'train';
    let sitLook = false;
    const dist = inTrain ? Math.min(cam.dist, 2.6) : z.room ? Math.min(cam.dist, 2.2) : cam.dist;
    const pitch = inTrain ? Math.min(cam.pitch, .12) : cam.pitch;
    const tx = player.x, ty = player.y + 1.5, tz = player.z;
    let px = tx + Math.sin(cam.yaw) * Math.cos(pitch) * dist;
    let py = ty + Math.sin(pitch) * dist;
    let pz = tz + Math.cos(cam.yaw) * Math.cos(pitch) * dist;
    if (inTrain) {
      // 車廂裡：沿著視線把鏡頭拉近（不要被推到牆邊、整個畫面貼著牆），太窄就從頭頂斜看
      const tr = z.train, ctx = tr.P.x + tr.x, ctz = tr.P.z + tr.side * S.TRACK, lim = 1.25;
      const dzc = pz - tz;
      if (Math.abs(pz - ctz) > lim && Math.abs(dzc) > 1e-3) {
        const k = Math.max(0, Math.min(1, (Math.sign(dzc) * lim + ctz - tz) / dzc));
        px = tx + (px - tx) * k; pz = tz + dzc * k; py = ty + (py - ty) * k;
      }
      px = Math.min(ctx + 30, Math.max(ctx - 30, px)); pz = Math.min(ctz + lim, Math.max(ctz - lim, pz)); py = Math.min(player.y + 2.15, py);
      if (Math.hypot(px - tx, pz - tz) < .9) { py = player.y + 2.1; const b = Math.atan2(px - tx, pz - tz); px = tx + Math.sin(b) * .9; pz = Math.min(ctz + lim, Math.max(ctz - lim, tz + Math.cos(b) * .9)); }
      if (player.sitting) {   // 坐著：鏡頭在走道對面、稍微偏一點，看著坐在椅子上的自己（不會跟椅背重疊）
        const fx = Math.sin(player.face), fz = Math.cos(player.face), drag = performance.now() - cam.lastDrag < 1500;
        const side = Math.sin(cam.yaw - player.face) >= 0 ? 1 : -1, off = drag ? side * 1.2 : .7;   // 玩家拖曳過：照拖曳的方向偏左或偏右
        px = tx + fx * 2.0 + fz * off; pz = Math.min(ctz + lim, Math.max(ctz - lim, tz + fz * 2.0 - fx * off)); py = player.y + 1.45;
        sitLook = true;
      }
    } else if (z.kind === 'platform') {
      pz = Math.min(z.P.z + 6.5, Math.max(z.P.z - 6.5, pz)); py = Math.min(player.y + (z.P.under ? 3.2 : 3.6), py);
      if (z.P.under) for (const r of z.P.ramps) {   // 在電扶梯底下：鏡頭壓低，不穿過電扶梯
        if (Math.abs(player.z - r.z) < 1.95 && player.x > Math.min(r.xa, r.xb) && player.x < Math.max(r.xa, r.xb)) {
          py = Math.min(py, player.y + underRampH(r, player.x) - .35);
          pz = Math.min(r.z + 1.7, Math.max(r.z - 1.7, pz));
        }
      }
    } else if (z.room) {   // 在房間裡：鏡頭拉近、不穿牆；靠近門口時鏡頭可以退到門外（沿著門洞），太擠就改從上面往下看
      const r = z.room, out = r.door.wx === r.x0 ? -1 : 1;
      const halfDoor = r.door.w / 2 - .12, nearDoor = Math.abs(player.z - r.door.z) < halfDoor + .5 && Math.abs(player.x - r.door.wx) < 3.5;
      if (nearDoor && (px - r.door.wx) * out > -.4) {
        px = out > 0 ? Math.min(r.door.wx + 2.6, px) : Math.max(r.door.wx - 2.6, px);
        pz = Math.min(r.door.z + halfDoor, Math.max(r.door.z - halfDoor, pz)); py = Math.min(2.1, py);
      } else { px = Math.min(r.x1 - .4, Math.max(r.x0 + .4, px)); pz = Math.min(r.z1 - .3, Math.max(r.z0 + .3, pz)); py = Math.min(2.55, py); }
      if (Math.hypot(px - player.x, pz - player.z) < 1.1) py = Math.max(py, player.y + 2.4);   // 太近：從頭頂往下看，不會卡進角色裡
    } else if (z.kind === 'unpaid') {
      const U = layout.unpaid;
      px = Math.min(U.x1 - .5, Math.max(U.x0 + .5, px)); pz = Math.min(U.z1 - .5, Math.max(layout.gateZ + .6, pz)); py = Math.min(3.9, py);
    } else if (z.kind === 'concourse') {
      const C = layout.concourse;
      px = Math.min(C.x1 - .5, Math.max(C.x0 + .5, px)); pz = Math.min(layout.gateZ - .3, Math.max(C.z0 + .5, pz)); py = Math.min(3.9, py);
    } else {   // 手扶梯／樓梯：鏡頭留在電扶梯井裡面，不穿過牆和樓板
      const rr = rampAt(player.x, player.z);
      if (rr) {
        const { P, r } = rr, a = Math.min(r.xa, r.xb), b = Math.max(r.xa, r.xb);
        px = Math.min(b + 3, Math.max(a - 3, px)); pz = Math.min(r.z + 1.6, Math.max(r.z - 1.6, pz));
        const t = Math.min(1, Math.max(0, (px - r.xa) / (r.xb - r.xa))), floor = r.ya + (r.yb - r.ya) * t;
        const dir = Math.sign(r.xb - r.xa), outA = (px - r.xa) * dir < 0, outB = (px - r.xb) * dir > 0;   // 超出月台端／大廳端
        const top = outA ? P.y + 3.2 : outB ? 3.9 : (P.y < 0 ? 3.9 : P.y + 3.2);
        py = Math.min(top, Math.max(floor + .7, py));
      } else py = Math.min(player.y + 3, py);
    }
    const k = Math.min(1, dt * 7);
    cam.pos.x += (px - cam.pos.x) * k; cam.pos.y += (py - cam.pos.y) * k; cam.pos.z += (pz - cam.pos.z) * k;
    camera.position.copy(cam.pos);
    // 搭車時鏡頭不再上下晃（手機上看會暈）
    const fp = VIEWS[cam.mode].fp && !player.sitting;
    if (rig) rig.root.visible = !fp;
    if (fp) {   // 第一人稱：鏡頭在眼睛的位置，往前看
      const ey = player.y + (charId === 'aiyun' ? 1.52 : 1.62), fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw);
      cam.pos.set(player.x + fx * .12, ey, player.z + fz * .12);
      camera.position.copy(cam.pos);
      camera.lookAt(player.x + fx * 3, ey - (cam.pitch - .3) * 3, player.z + fz * 3);
    } else if (sitLook) camera.lookAt(tx, player.y + .95, tz);
    else camera.lookAt(tx, ty, tz);
    if (plight && plight.intensity > 0) plight.position.set(player.x + Math.sin(player.face) * .4, player.y + 1.7, player.z + Math.cos(player.face) * .4);
    for (const fn of tickers) fn(dt, now);
    if (warmQ.length) warmStep();
    if (now - lastBtn > 90) { lastBtn = now; updateActionBtn(); }   // 互動按鈕不用每一幀檢查
    renderer.render(scene, camera);
  }
  function tryMove(nx, nz) {
    let h = groundAt(nx, nz, player.y);
    if (h != null) { player.x = nx; player.z = nz; player.y = h; return; }
    h = groundAt(nx, player.z, player.y); if (h != null) { player.x = nx; player.y = h; return; }
    h = groundAt(player.x, nz, player.y); if (h != null) { player.z = nz; player.y = h; }
  }
  function autoCamera(z, dt) {
    if (player.auto) return;
    const free = performance.now() - cam.lastDrag > 1500;
    let yaw = null, pitch = null, rate = 2.2;
    const behind = face => face + Math.PI;   // 鏡頭在玩家背後
    const talk = typeof Dialog !== 'undefined' && Dialog.with && Dialog.with.rig && Dialog.with.x != null ? Dialog.with : null;
    if (talk) {   // 說話：從玩家肩膀後面看著對方
      yaw = Math.atan2(-(talk.x - player.x), -(talk.z - player.z)) + .35; pitch = .2; rate = 3;
    } else if (z.kind === 'ramp' && player.speed > .1) {   // 手扶梯、樓梯：轉到行進方向，下樓時從高一點往下看
      const goingDown = Math.sin(player.face) * (rampSlope(player.x, player.z) || 0) < 0;
      yaw = behind(Math.abs(Math.sin(player.face)) > .5 ? Math.sign(Math.sin(player.face)) * Math.PI / 2 : player.face); pitch = goingDown ? .5 : .14; rate = 3;
    } else if (z.kind === 'ramp') {   // 站在電扶梯上不動：跟著電扶梯的方向
      const cv = conveyorAt(player.x, player.z);
      if (cv) { yaw = behind(Math.sign(cv) * Math.PI / 2); pitch = (rampSlope(player.x, player.z) || 0) * cv < 0 ? .5 : .14; }
    } else if (z.kind === 'train' && !free) {
      // 剛拖過：不動
    } else if (z.kind === 'train') {   // 車廂：沿著車廂長邊看
      const s = Math.sin(cam.yaw) >= 0 ? 1 : -1; yaw = s * Math.PI / 2; pitch = Math.min(cam.pitch, .12); rate = 1.5;
    } else if (z.room) {   // 剛走進房間：轉向房間裡面
      const key = z.room.kind;
      if (cam.roomKey !== key) { cam.roomKey = key; cam.roomT = 1.4; }
      if (cam.roomT > 0) { cam.roomT -= dt; const dir = z.room.door.wx === z.room.x0 ? 1 : -1; yaw = behind(dir * Math.PI / 2); }
    }
    if (!z.room) cam.roomKey = '';
    if (!free && !talk) return;
    if (yaw != null) cam.yaw = lerpAngle(cam.yaw, yaw, Math.min(1, dt * rate));
    if (pitch != null && !VIEWS[cam.mode].fp) cam.pitch += (pitch - cam.pitch) * Math.min(1, dt * rate);
  }
  // 玩家所在的電扶梯（含兩端一點點）
  // 地下月台：電扶梯在 x 處離月台地板多高
  function underRampH(r, x) { return (r.yb - r.ya) * Math.min(1, Math.max(0, (x - r.xa) / (r.xb - r.xa))); }
  function rampAt(x, z) {
    if (!layout) return null;
    for (const P of layout.platforms) for (const r of P.ramps) if (Math.abs(z - r.z) < 2 && x > Math.min(r.xa, r.xb) - 1 && x < Math.max(r.xa, r.xb) + 1) return { P, r };
    return null;
  }
  // 電扶梯斜率：往 +x 走時高度增加為正
  function rampSlope(x, z) {
    if (!layout) return 0;
    for (const P of layout.platforms) for (const r of P.ramps) {
      if (x < Math.min(r.xa, r.xb) - .1 || x > Math.max(r.xa, r.xb) + .1 || Math.abs(z - r.z) > 1.9) continue;
      return Math.sign((r.yb - r.ya) / (r.xb - r.xa));
    }
    return 0;
  }
  function cycleView(i) {
    cam.mode = i != null ? i : (cam.mode + 1) % VIEWS.length;
    const v = VIEWS[cam.mode];
    if (v.dist) cam.dist = v.dist;
    cam.pitch = v.pitch;
    const b = document.getElementById('viewBtn'); if (b) b.textContent = '視角：' + v.name;
    return v.name;
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
      // 高解析度手機螢幕本身就很細，不開反鋸齒省下很多效能
      renderer = new T.WebGLRenderer({ antialias: !(coarse && DPR >= 2), powerPreference: 'high-performance' });
      renderer.setPixelRatio(pr);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = .94;
      renderer.domElement.className = 'world-canvas';
      el.appendChild(renderer.domElement);
      scene = new T.Scene();
      camera = new T.PerspectiveCamera(55, 1, .1, 700);
      hemi = new T.HemisphereLight('#ffffff', '#8a8c90', 1.7); scene.add(hemi);
      sun = new T.DirectionalLight('#fff4e0', 1); sun.position.set(20, 40, 25); scene.add(sun);
      env = new T.Group(); scene.add(env);
      // 環境反射：一個簡單的「室內燈箱」場景做成環境貼圖，讓金屬、玻璃、磁磚有柔和的反光
      {
        const envScene = new T.Scene(), pm = new T.PMREMGenerator(renderer);
        envScene.background = new T.Color('#5a6068');
        const room = new T.Mesh(new T.BoxGeometry(20, 8, 20), new T.MeshBasicMaterial({ color: '#7d848c', side: T.BackSide })); envScene.add(room);
        const floor = new T.Mesh(new T.PlaneGeometry(20, 20), new T.MeshBasicMaterial({ color: '#4a4f55' })); floor.rotation.x = -Math.PI / 2; floor.position.y = -3.9; envScene.add(floor);
        for (let i = -2; i <= 2; i++) { const l = new T.Mesh(new T.PlaneGeometry(2.6, .7), new T.MeshBasicMaterial({ color: '#ffffff' })); l.rotation.x = Math.PI / 2; l.position.set(i * 3.6, 3.9, 0); envScene.add(l); l.material.color.multiplyScalar(3); }
        const warm = new T.Mesh(new T.PlaneGeometry(6, 3), new T.MeshBasicMaterial({ color: '#ffd8a0' })); warm.position.set(0, 1, -9.9); envScene.add(warm);
        scene.environment = pm.fromScene(envScene, .02).texture;
        scene.environmentIntensity = .55;
        pm.dispose();
      }
      // 玩家身上的光（迷霧之城的暗區用；平常強度 0，光源數量固定，不會重編材質）
      plight = new T.PointLight('#ffe6b0', 0, 9, 1.6); scene.add(plight);
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
    get speedMul() { return speedMul; },
    setMood(m) { mood = m; if (layout) applySky(layout.hasElevated); },
    get mood() { return mood; },
    setPlayerLight(intensity, distance = 9) { plight.intensity = intensity; plight.distance = distance; },
    get facing() { return player.face; },
    get camYaw() { return cam.yaw; },
    get moving() { return player.speed > .1; },
    pushPlayer(dx, dz) { tryMove(player.x + dx, player.z + dz); },
    cycleView,
    // 鏡頭轉向某個點（例如欣賞作品時）
    lookToward(x, z) { cam.yaw = Math.atan2(-(x - player.x), -(z - player.z)); cam.lastDrag = performance.now(); },
    get view() { return VIEWS[cam.mode].name; },
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
    get running() { return runToggle || joyRun || !!keys.run; },
    get quality() { return quality; },
    unstuck() { return unstuck(false); },
    get camYaw() { return cam.yaw; },
    get fps() { return Math.round(perf.fps); },
    get pixelRatio() { return pr; },
    setQuality(q) { quality = q; try { localStorage.setItem('quality', q); } catch (e) { /* 無法存取 */ } setPR(capFor(q)); perf.changed = performance.now(); },
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
    loadStation(stationId, alias = null) {
      loadSeq++; riding = null; shake = 0;
      if (pre) { dispose(pre.group); dispose(pre.sur); pre = null; }
      for (const tr of [...trains]) this.removeTrain(tr);
      for (const grp of [stationGroup, segGroup, nextGroup, surround]) if (grp) { env.remove(grp); dispose(grp); }
      segGroup = nextGroup = null;
      env.position.set(0, 0, 0);
      layout = S.layout(stationId);
      layout.alias = alias;
      S.setAlias(alias); stationGroup = S.build(layout, TaipeiTime.sky()); S.setAlias(null);
      surround = S.surroundings(layout, night());
      env.add(stationGroup); env.add(surround);
      applySky(layout.hasElevated);
      lastZoneKey = '';
      return layout;
    },
    get layout() { return layout; },
    get trains() { return trains; },
    get stationGroup() { return stationGroup; },
    // 把玩家放在大廳（付費區，靠近第一條線的電扶梯）
    spawnInConcourse() {
      const P = layout.platforms[0], r = P.ramps[1];
      player.x = r.xb + 2.5; player.y = 0; player.z = P.z + 3.2; player.face = Math.PI; player.vnow = 0;
      cam.yaw = Math.PI / 2; cam.pos.set(player.x + 4, 2.6, player.z);
    },
    placePlayer(x, y, z, face = Math.PI) { player.x = x; player.y = y; player.z = z; player.face = face; player.vnow = 0; cam.pos.set(x, y + 2.6, z + 4); },
    get player() { return pstate(); },
    get raw() { return player; },   // FX：每幀讀位置、速度（唯讀，不配置新物件）
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
      if (typeof FX !== 'undefined') FX.doors(tr, open, ms);   // FX：月台門上方警示燈閃爍
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
    async ride(tr, { toId, duration = 22, onSpeed, skip, anomaly, alias = null, onTick }) {
      const P = tr.P, travel = tr.travel, D = 520, seq = loadSeq;
      const tx0 = P.x + tr.x, tz = P.z + tr.side * S.TRACK, ty = P.y;
      for (const o of [...trains]) if (o !== tr) this.removeTrain(o);
      riding = tr;
      // 下一站：上車時已經預先建好（prepareRide）就直接用，出發那一刻不會卡
      const key = toId + '|' + (alias ? alias.zh : '') + '|' + TaipeiTime.sky();
      let nextL, nextSur;
      if (pre && pre.key === key) { nextL = pre.layout; nextGroup = pre.group; nextSur = pre.sur; pre = null; }
      else {
        if (pre) { dispose(pre.group); dispose(pre.sur); pre = null; }
        nextL = S.layout(toId); nextL.alias = alias;
        S.setAlias(alias); nextGroup = S.build(nextL, TaipeiTime.sky()); S.setAlias(null);
        nextSur = S.surroundings(nextL, night());
        warm(nextGroup); warm(nextSur);
      }
      const P2 = nextL.platforms.find(p => p.line === tr.line);
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
          if (seq !== loadSeq) return res();
          if (onTick && onTick(t, p) === 'stop') return res();
          t < T0 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });
      shake = 0;
      if (seq !== loadSeq) return layout;   // 中途換場了：新車站已經載入，不用再對齊
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
    // 預先建好下一站（玩家走進車廂、車門還開著時呼叫），並分好幾幀把貼圖送進顯示卡
    prepareRide(toId, alias = null) {
      const key = toId + '|' + (alias ? alias.zh : '') + '|' + TaipeiTime.sky();
      if (pre && pre.key === key) return;
      if (pre) { dispose(pre.group); dispose(pre.sur); }
      const layout2 = S.layout(toId); layout2.alias = alias;
      S.setAlias(alias); const group = S.build(layout2, TaipeiTime.sky()); S.setAlias(null);
      const sur = S.surroundings(layout2, night());
      pre = { key, layout: layout2, group, sur };
      warm(group); warm(sur);
    },
    setLcd: S.drawLcd,
    setStrip: S.drawStrip,
    setLed(k, side, rows) {
      const pg = stationGroup && stationGroup.children.find(c => c.userData && c.userData[`led${side}`] && c.position.z === layout.platforms[k].z && c.position.y === layout.platforms[k].y);
      if (pg) S.drawLed(pg.userData[`led${side}`], layout.platforms[k].line, rows);
    },
    setInteractions(list) { interactions = list; const b = document.getElementById('actionBtn'); if (b) b.dataset.id = ''; },
    setInput(on) { player.inputOn = on; if (!on) { for (const k in keys) keys[k] = false; player.vnow = 0; } },
    walkPath(points) { return new Promise(resolve => { player.auto = { points: points.map(p => ({ ...p })), resolve }; }); },
    refreshSky() { if (layout) applySky(layout.hasElevated); },
  };
})();
