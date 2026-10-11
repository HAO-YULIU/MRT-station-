/* 大量路人（不能對話、只會走路和擋路）
 * 用 InstancedMesh 一次畫完所有人，數量多也不會太吃效能。
 * 依時段決定人數（尖峰最多）；會在大廳、非付費區、月台之間走動，
 * 走樓梯上下月台、穿過閘門、在月台上等車。玩家擋在前面時會停下來。
 */
const Crowd = (() => {
  const T = THREE;
  const PARTS = ['torso', 'head', 'hair', 'back', 'legL', 'legR', 'armL', 'armR', 'bag'];
  const SKIN = ['#f2d0bc', '#e8bca4', '#d9a98e', '#c99278', '#f5dccf', '#b7856a'];
  const HAIR = ['#151515', '#2a1d18', '#3a2a1a', '#4a2a1a', '#6a4a30', '#8a7458', '#cfcfcf'];
  const TOPS = ['#f4f4f2', '#2a2a2a', '#3a4250', '#d8c3a5', '#4a5a7a', '#a33a3a', '#3d6b5a', '#e07a3a', '#3aa0c0', '#f2c200', '#7a5a7a', '#85888d', '#1f2d55', '#c8a888', '#e9edf2'];
  const BOTS = ['#2a3a5a', '#1a1a1a', '#6a5a4a', '#2a2e36', '#3a3a40', '#8fa7c4', '#b49c74'];
  const BAGS = ['#18181a', '#2c3e50', '#d8c9a8', '#8a6a4a', '#e07a8a', '#3a6a9a'];
  let meshes = null, people = [], L = null, root = null;
  const MAX = 130;
  const tmp = new T.Matrix4(), base = new T.Matrix4(), part = new T.Matrix4(), rot = new T.Matrix4(), col = new T.Color();
  const ZERO = new T.Matrix4().makeScale(0, 0, 0);

  function build() {
    const mat = () => new T.MeshStandardMaterial({ color: '#ffffff', roughness: .85 });
    const geo = {
      torso: new T.CylinderGeometry(.16, .19, .62, 10).translate(0, 1.12, 0),
      head: new T.SphereGeometry(.115, 12, 10).translate(0, 1.6, 0),
      hair: new T.SphereGeometry(.125, 12, 8, 0, Math.PI * 2, 0, Math.PI * .55).translate(0, 1.62, -.01),
      back: new T.BoxGeometry(.22, .34, .08).translate(0, 1.44, -.1),
      legL: new T.BoxGeometry(.12, .82, .14).translate(0, -.41, 0),
      legR: new T.BoxGeometry(.12, .82, .14).translate(0, -.41, 0),
      armL: new T.BoxGeometry(.08, .6, .09).translate(0, -.3, 0),
      armR: new T.BoxGeometry(.08, .6, .09).translate(0, -.3, 0),
      bag: new T.BoxGeometry(.26, .32, .12).translate(0, 1.15, -.2),
    };
    root = new T.Group();
    meshes = {};
    for (const k of PARTS) {
      const m = new T.InstancedMesh(geo[k], mat(), MAX);
      m.instanceMatrix.setUsage(T.DynamicDrawUsage);
      m.frustumCulled = false; m.count = 0;
      m.setColorAt(0, col.set('#ffffff'));
      meshes[k] = m; root.add(m);
    }
  }

  /* ── 位置 ── */
  const inObstacle = (x, z, y) => (L.obstacles || []).some(o => Math.abs((o.y || 0) - y) < .6 && x > o.x0 - .25 && x < o.x1 + .25 && z > o.z0 - .25 && z < o.z1 + .25);
  const ok = (x, z, y) => { const h = World.groundAt(x, z, y); return h != null && Math.abs(h - y) < .1 && !inObstacle(x, z, y); };
  function randIn(area) {
    const C = L.concourse, U = L.unpaid;
    for (let i = 0; i < 12; i++) {
      let x, z, y = 0;
      if (area === 'hall') { x = C.x0 + 1 + Math.random() * (C.x1 - C.x0 - 2); z = C.z0 + 1 + Math.random() * (L.gateZ - C.z0 - 2); }
      else if (area === 'unpaid') { x = U.x0 + 1 + Math.random() * (U.x1 - U.x0 - 2); z = U.z0 + 1 + Math.random() * (U.z1 - U.z0 - 3); }
      else { const P = L.platforms[area]; y = P.y; x = P.x - 31 + Math.random() * 62; z = P.z + (Math.random() * 2 - 1) * 2.3; }
      if (ok(x, z, y)) return { x, y, z };
    }
    return null;
  }
  // 往月台／往大廳的樓梯（中間那條是樓梯，兩邊是電扶梯）
  function stairs(P) {
    const r = P.ramps[(Math.random() * P.ramps.length) | 0], lz = r.z + (S_LANES()[1] || 0);
    return { bottom: { x: r.xa - r.b * .8, y: P.y, z: lz }, top: { x: r.xb + r.b * .9, y: 0, z: lz } };
  }
  const S_LANES = () => Station3D.LANES || [-.9, 0, .9];
  function gateLane() { const g = L.gates[(Math.random() * L.gates.length) | 0]; return { inside: { x: g, y: 0, z: L.gateZ - .9 }, outside: { x: g, y: 0, z: L.gateZ + 2.2 } }; }

  // 下一段行程
  function plan(p) {
    const r = Math.random();
    p.route = [];
    if (p.area === 'hall') {
      if (r < .2) { const g = gateLane(); p.route.push(g.inside, g.outside); p.next = 'unpaid'; }
      else if (r < .45) { const k = (Math.random() * L.platforms.length) | 0, s = stairs(L.platforms[k]); p.route.push(s.top, s.bottom); p.next = k; }
      else { const q = randIn('hall'); if (q) p.route.push(q); p.next = 'hall'; }
    } else if (p.area === 'unpaid') {
      if (r < .35) { const g = gateLane(); p.route.push(g.outside, g.inside); p.next = 'hall'; }
      else { const q = randIn('unpaid'); if (q) p.route.push(q); p.next = 'unpaid'; }
    } else {
      const P = L.platforms[p.area];
      if (r < .15) { const s = stairs(P); p.route.push(s.bottom, s.top); p.next = 'hall'; }
      else if (r < .75) { const side = Math.random() < .5 ? -1 : 1, d = Station3D.DOORS || [0]; const dx = d[(Math.random() * d.length) | 0]; p.door = P.x + dx; p.route.push({ x: P.x + dx + (Math.random() < .5 ? -.6 : .6) + (Math.random() - .5) * .3, y: P.y, z: P.z + side * (1.7 + Math.random() * .5) }); p.next = p.area; p.waitAfter = 6 + Math.random() * 20; }   // 在車門前候車
      else { const q = randIn(p.area); if (q) p.route.push(q); p.next = p.area; }
    }
    if (!p.waitAfter) p.waitAfter = Math.random() < .3 ? 1 + Math.random() * 6 : 0;
  }

  function count() {
    const h = TaipeiTime.now().hour, st = TaipeiTime.state();
    if (st !== 'open') return 0;
    let n = h >= 7 && h < 9 ? 95 : h >= 17 && h < 20 ? 100 : h >= 12 && h < 14 ? 65 : h >= 9 && h < 17 ? 55 : h >= 20 && h < 23 ? 45 : 18;
    n *= .75 + .25 * L.platforms.length;
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) n *= .8;   // 手機稍微少一點
    return Math.min(MAX, Math.round(n));
  }

  function spawn(layout) {
    if (!meshes) build();
    L = layout; people = [];
    if (!root.parent) World.scene.add(root);
    const n = count();
    for (let i = 0; i < n; i++) {
      const r = Math.random(), area = r < .32 ? 'hall' : r < .44 ? 'unpaid' : (Math.random() * L.platforms.length) | 0;
      const pos = randIn(area); if (!pos) continue;
      const girl = Math.random() < .5, old = Math.random() < .12, kid = !old && Math.random() < .06;
      const p = {
        ...pos, area, face: Math.random() * 6.28, speed: (kid ? 1.4 : old ? .8 : 1.1) + Math.random() * .5, speedNow: 0, phase: Math.random() * 6,
        h: kid ? .62 : (girl ? .93 : 1) * (.95 + Math.random() * .1), girl, wait: Math.random() * 3,
        bag: Math.random() < .45, phoneLook: Math.random() < .25,
      };
      people.push(p);
      const k = people.length - 1;
      meshes.torso.setColorAt(k, col.set(TOPS[(Math.random() * TOPS.length) | 0]));
      meshes.armL.setColorAt(k, col); meshes.armR.setColorAt(k, col);
      meshes.head.setColorAt(k, col.set(SKIN[(Math.random() * SKIN.length) | 0]));
      const hc = old ? '#cfcfcf' : HAIR[(Math.random() * (HAIR.length - 1)) | 0];
      meshes.hair.setColorAt(k, col.set(hc)); meshes.back.setColorAt(k, col);
      meshes.legL.setColorAt(k, col.set(BOTS[(Math.random() * BOTS.length) | 0])); meshes.legR.setColorAt(k, col);
      meshes.bag.setColorAt(k, col.set(BAGS[(Math.random() * BAGS.length) | 0]));
    }
    for (const k of PARTS) { meshes[k].count = people.length; if (meshes[k].instanceColor) meshes[k].instanceColor.needsUpdate = true; }
    draw();
  }
  function clear() { people = []; if (meshes) for (const k of PARTS) meshes[k].count = 0; }

  function step(p, dt, pl) {
    if (p.wait > 0) { p.wait -= dt; p.speedNow = 0; return; }
    if (p.hidden) return;
    if (!p.route || !p.route.length) {
      if (p.board) { p.board = false; p.hidden = true; p.hiddenK = p.area; return; }   // 上車了
      if (p.next != null) { p.area = p.next; p.next = null; if (p.waitAfter) { p.wait = p.waitAfter; p.waitAfter = 0; return; } }
      plan(p); if (!p.route.length) { p.wait = 1; return; }
    }
    const t = p.route[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
    if (d < .25) { p.route.shift(); return; }
    // 玩家擋在前面：停下來
    const toP = Math.hypot(pl.x - p.x, pl.z - p.z);
    if (toP < 1.05 && Math.abs(pl.y - p.y) < .6 && ((pl.x - p.x) * dx + (pl.z - p.z) * dz) > 0) { p.speedNow = 0; p.face = Math.atan2(dx, dz); return; }
    const st = Math.min(d, p.speed * dt), nx = p.x + dx / d * st, nz = p.z + dz / d * st;
    // 前面有人：稍微讓開
    for (const o of people) {
      if (o === p || o.hidden || Math.abs(o.y - p.y) > .5) continue;
      const ox = o.x - nx, oz = o.z - nz;
      if (ox * ox + oz * oz < .2 && (ox * dx + oz * dz) > 0) { p.speedNow = 0; p.wait = .2 + Math.random() * .4; if (Math.random() < .3) p.route.unshift({ x: p.x + (Math.random() - .5) * 1.4, y: p.y, z: p.z + (Math.random() - .5) * 1.4 }); return; }
    }
    if (p.board && p.route.length === 1) { p.x = nx; p.z = nz; p.face = Math.atan2(dx, dz); p.speedNow = p.speed; return; }
    const h = World.groundAt(nx, nz, p.y);
    if (h == null || (Math.abs(h - p.y) < .05 && inObstacle(nx, nz, h))) { p.route = []; p.next = null; p.wait = .3; return; }
    p.x = nx; p.z = nz; p.y = h; p.face = Math.atan2(dx, dz); p.speedNow = p.speed;
  }

  function draw() {
    const now = performance.now() / 1000;
    people.forEach((p, k) => {
      if (p.hidden) { for (const n of PARTS) meshes[n].setMatrixAt(k, ZERO); return; }
      base.makeRotationY(p.face).setPosition(p.x, p.y, p.z);
      base.multiply(tmp.makeScale(p.h, p.h, p.h));
      const sw = p.speedNow > 0 ? Math.sin(p.phase) * .5 : 0, bob = p.speedNow > 0 ? Math.abs(Math.cos(p.phase)) * .03 : Math.sin(now * 1.3 + k) * .006;
      const up = tmp.makeTranslation(0, bob, 0), B = part.copy(base).multiply(up), Bc = B.clone();
      meshes.torso.setMatrixAt(k, Bc); meshes.head.setMatrixAt(k, p.phoneLook && !p.speedNow ? part.copy(Bc).multiply(rot.makeTranslation(0, 1.6, 0)).multiply(tmp.makeRotationX(.35)).multiply(rot.makeTranslation(0, -1.6, 0)) : Bc);
      meshes.hair.setMatrixAt(k, Bc);
      meshes.back.setMatrixAt(k, p.girl ? Bc : ZERO);
      meshes.bag.setMatrixAt(k, p.bag ? Bc : ZERO);
      for (const [m, sx, a] of [[meshes.legL, -.085, sw], [meshes.legR, .085, -sw]]) m.setMatrixAt(k, part.copy(Bc).multiply(tmp.makeTranslation(sx, .82, 0)).multiply(rot.makeRotationX(a)));
      for (const [m, sx, a] of [[meshes.armL, -.22, -sw * .8], [meshes.armR, .22, sw * .8]]) m.setMatrixAt(k, part.copy(Bc).multiply(tmp.makeTranslation(sx, 1.4, 0)).multiply(rot.makeRotationX(a + (p.phoneLook && !p.speedNow && sx > 0 ? -1.1 : 0))));
    });
    for (const k of PARTS) meshes[k].instanceMatrix.needsUpdate = true;
  }

  function tick(dt) {
    if (!meshes || !L) return;
    root.visible = !World.riding;
    if (World.riding || !people.length) return;
    dt = Math.min(dt, .1);
    const pl = World.player;
    for (const p of people) { step(p, dt, pl); if (p.speedNow) p.phase += dt * p.speed * 5.5; }
    draw();
  }
  // 列車開門：在這一側候車的人上車；車上下來幾個人走向樓梯
  function doors(k, side) {
    if (!L || World.riding) return;
    const P = L.platforms[k], zDoor = P.z + side * 2.1, D = Station3D.DOORS || [0];
    for (const p of people) {
      if (p.area !== k || p.hidden || Math.abs(p.y - P.y) > .3 || Math.abs(p.z - zDoor) > .7 || Math.random() < .2) continue;
      const x = p.door != null ? p.door : p.x; p.route = [{ x, y: P.y, z: P.z + side * 2.0 }, { x, y: P.y, z: P.z + side * 2.8 }]; p.wait = Math.random() * 1.5; p.board = true; p.next = null;
    }
    let n = 3 + ((Math.random() * 6) | 0);
    for (const p of people) {
      if (!n || !p.hidden || p.hiddenK !== k) continue; n--;
      const dx = D[(Math.random() * D.length) | 0] * (Math.random() < .5 ? 1 : -1);
      Object.assign(p, { hidden: false, x: P.x + dx, y: P.y, z: P.z + side * 2.4, wait: .5 + Math.random() * 2, route: [] });
      const s = stairs(P); p.route.push({ x: p.x, y: P.y, z: P.z + side * 1.2 }, s.bottom, s.top); p.next = 'hall';
    }
  }
  // 玩家不能穿過路人
  function blocks(x, z, y) { for (const p of people) if (!p.hidden && Math.abs(p.y - y) < .6 && (p.x - x) ** 2 + (p.z - z) ** 2 < .2) return true; return false; }
  return { spawn, clear, tick, blocks, doors, get count() { return people.filter(p => !p.hidden).length; } };
})();
