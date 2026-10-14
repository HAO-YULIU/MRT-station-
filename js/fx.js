/* 互動與畫面效果（FX）
 *  3D：
 *   - 三組共用粒子（光暈、星芒、灰塵），各是一個 THREE.Points（一次 draw call）、固定容量，每幀不配置新物件
 *   - 閘門：人靠近時翼片收進機箱；刷卡「嗶」時感應區亮綠光、浮出「嗶！ 餘額 NT$…」
 *   - 月台門：開關門時門楣上的紅色警示燈閃爍（每側一組 InstancedMesh）；關門前畫面提示
 *   - 月台 LED：列車即將進站時「列車即將進站」閃爍
 *   - 列車：白色車頭燈、紅色車尾燈；在隧道裡進站時車頭有光暈
 *   - 互動：可以互動的目標腳下有光圈；有委託的人頭上「！」、任務要找的人頭上「？」；地上的東西會閃光
 *   - 跑步時腳邊揚起灰塵
 *  介面（DOM＋Web Animations，用完就移除，pointer-events: none，不會擋操作）：
 *   - 撿東西：星芒＋圖示飛進背包；獎勵：硬幣飛進餘額；餘額變動時浮出 +/−
 *   - 任務完成、升級：橫幅＋捷運路線色彩帶
 *  所有對外函式都包了 try/catch：效果出錯也不會影響遊戲本身。
 */
const FX = (() => {
  const T = THREE;
  let ready = false, scene = null, layer = null, actionBtn = null, canvasEl = null;
  let warned = false;
  const safe = fn => function () { try { return fn.apply(this, arguments); } catch (e) { if (!warned) { warned = true; console.warn('[FX]', e); } } };
  const reduced = () => (typeof calmFx === 'function' ? calmFx() : typeof reduceMotion === 'function' ? reduceMotion() : false);
  const rnd = () => Math.random();
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = () => Station3D;

  /* ── 貼圖（畫在 canvas 上，只做一次） ── */
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  function radial(g, s, stops) {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  }
  let TX = null;
  function textures() {
    if (TX) return TX;
    TX = {
      glow: canvasTex(64, 64, (g, s) => radial(g, s, [[0, 'rgba(255,255,255,1)'], [.2, 'rgba(255,255,255,.75)'], [.5, 'rgba(255,255,255,.2)'], [1, 'rgba(255,255,255,0)']])),
      // 四角星芒
      spark: canvasTex(64, 64, (g, s) => {
        radial(g, s, [[0, 'rgba(255,255,255,1)'], [.14, 'rgba(255,255,255,.85)'], [.35, 'rgba(255,255,255,.15)'], [1, 'rgba(255,255,255,0)']]);
        g.globalCompositeOperation = 'lighter';
        const ray = (x0, y0, x1, y1, w) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; if (x0 === x1) g.fillRect(s / 2 - w / 2, 0, w, s); else g.fillRect(0, s / 2 - w / 2, s, w); };
        ray(0, s / 2, s, s / 2, 3); ray(s / 2, 0, s / 2, s, 3);
      }),
      // 灰塵：邊緣不規則的軟圓
      puff: canvasTex(64, 64, (g, s) => {
        for (let i = 0; i < 6; i++) {
          const x = s / 2 + (rnd() - .5) * 14, y = s / 2 + (rnd() - .5) * 14, r = 14 + rnd() * 12;
          const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = gr; g.fillRect(0, 0, s, s);
        }
      }),
      // 地上的光圈
      ring: canvasTex(128, 128, (g, s) => {
        radial(g, s, [[0, 'rgba(255,255,255,.0)'], [.55, 'rgba(255,255,255,.10)'], [.74, 'rgba(255,255,255,.35)'], [.8, 'rgba(255,255,255,1)'], [.86, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
      }),
    };
    TX.ring.colorSpace = T.NoColorSpace;
    return TX;
  }
  // 頭上的對話泡泡（！／？）
  function badgeTex(ch, bg) {
    return canvasTex(128, 128, g => {
      const path = () => { g.beginPath(); g.arc(64, 54, 40, Math.PI / 2 + .36, Math.PI / 2 - .36 + Math.PI * 2); g.lineTo(64, 116); g.closePath(); };
      g.save(); g.translate(0, 4); path(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); g.restore();
      path(); g.fillStyle = bg; g.fill(); g.lineWidth = 6; g.strokeStyle = '#1c2126'; g.stroke();
      g.fillStyle = '#1c2126'; g.font = '900 60px "Noto Sans TC", "Barlow Semi Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 58);
    });
  }

  /* ── 粒子系統：固定容量的 Points；每個粒子可以有自己的大小與透明度 ── */
  function makeSystem(cap, map, additive, fog, order) {
    const geo = new T.BufferGeometry();
    const pos = new Float32Array(cap * 3), col = new Float32Array(cap * 4), siz = new Float32Array(cap);
    const aPos = new T.BufferAttribute(pos, 3), aCol = new T.BufferAttribute(col, 4), aSiz = new T.BufferAttribute(siz, 1);
    aPos.setUsage(T.DynamicDrawUsage); aCol.setUsage(T.DynamicDrawUsage); aSiz.setUsage(T.DynamicDrawUsage);
    geo.setAttribute('position', aPos); geo.setAttribute('color', aCol); geo.setAttribute('psize', aSiz);
    const mat = new T.PointsMaterial({ size: 1, map, vertexColors: true, transparent: true, depthWrite: false, fog, sizeAttenuation: true, blending: additive ? T.AdditiveBlending : T.NormalBlending });
    mat.toneMapped = false;
    mat.onBeforeCompile = sh => { sh.vertexShader = 'attribute float psize;\n' + sh.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * psize;'); };
    mat.customProgramCacheKey = () => 'fx-points-psize';
    const obj = new T.Points(geo, mat);
    obj.frustumCulled = false; obj.renderOrder = order; obj.userData.fx = true;
    const vel = new Float32Array(cap * 3), age = new Float32Array(cap), life = new Float32Array(cap);
    const s0 = new Float32Array(cap), s1 = new Float32Array(cap), alpha = new Float32Array(cap), grav = new Float32Array(cap), drag = new Float32Array(cap);
    let alive = 0, cur = 0, dirty = false;
    function slot() {
      for (let k = 0; k < cap; k++) { const j = (cur + k) % cap; if (life[j] === 0) { cur = (j + 1) % cap; alive++; return j; } }
      // 滿了：覆蓋游標位置的一般粒子（不覆蓋常駐的燈）
      for (let k = 0; k < cap; k++) { const j = (cur + k) % cap; if (life[j] > 0) { cur = (j + 1) % cap; return j; } }
      return -1;
    }
    return {
      obj,
      // 一般粒子：會動、會淡出
      emit(x, y, z, vx, vy, vz, lf, a, b, r, g, bl, al, gr = 0, dr = 0) {
        const i = slot(); if (i < 0) return -1;
        const i3 = i * 3, i4 = i * 4;
        pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z;
        vel[i3] = vx; vel[i3 + 1] = vy; vel[i3 + 2] = vz;
        col[i4] = r; col[i4 + 1] = g; col[i4 + 2] = bl; col[i4 + 3] = 0;
        age[i] = 0; life[i] = lf; s0[i] = a; s1[i] = b; alpha[i] = al; grav[i] = gr; drag[i] = dr; siz[i] = a;
        dirty = true; return i;
      },
      // 常駐的點（例如車頭燈）：由呼叫者每幀設定位置
      fixed() { const i = slot(); if (i < 0) return -1; life[i] = -1; siz[i] = 0; col[i * 4 + 3] = 0; dirty = true; return i; },
      set(i, x, y, z, size, r, g, bl, al) {
        if (i < 0) return;
        const i3 = i * 3, i4 = i * 4;
        pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z; siz[i] = size;
        col[i4] = r; col[i4 + 1] = g; col[i4 + 2] = bl; col[i4 + 3] = al; dirty = true;
      },
      kill(i) { if (i < 0 || life[i] === 0) return; life[i] = 0; siz[i] = 0; col[i * 4 + 3] = 0; alive = Math.max(0, alive - 1); dirty = true; },
      shift(dx, dy, dz) { for (let i = 0; i < cap; i++) if (life[i] > 0) { pos[i * 3] -= dx; pos[i * 3 + 1] -= dy; pos[i * 3 + 2] -= dz; } dirty = true; },
      clear() { for (let i = 0; i < cap; i++) if (life[i] > 0) { life[i] = 0; siz[i] = 0; col[i * 4 + 3] = 0; } alive = 0; for (let i = 0; i < cap; i++) if (life[i] < 0) alive++; dirty = true; },
      update(dt) {
        if (!alive && !dirty) return;
        let n = 0;
        for (let i = 0; i < cap; i++) {
          const L = life[i];
          if (L === 0) continue;
          n++;
          if (L < 0) continue;
          const a = (age[i] += dt), t = a / L;
          if (t >= 1) { life[i] = 0; siz[i] = 0; col[i * 4 + 3] = 0; n--; continue; }
          const i3 = i * 3;
          vel[i3 + 1] -= grav[i] * dt;
          const d = drag[i] ? Math.max(0, 1 - drag[i] * dt) : 1;
          vel[i3] *= d; vel[i3 + 1] *= d; vel[i3 + 2] *= d;
          pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;
          siz[i] = s0[i] + (s1[i] - s0[i]) * t;
          col[i * 4 + 3] = alpha[i] * (t < .12 ? t / .12 : 1 - (t - .12) / .88);
        }
        alive = n;
        aPos.needsUpdate = true; aCol.needsUpdate = true; aSiz.needsUpdate = true;
        dirty = false;
      },
    };
  }
  let GLOW = null, SPARK = null, DUST = null;
  const SYS = [];

  /* ── 共用的幾何與材質 ── */
  const tmpM = new T.Matrix4(), tmpQ = new T.Quaternion(), tmpP = new T.Vector3(), tmpS = new T.Vector3(1, 1, 1), UP = new T.Vector3(0, 1, 0), tmpC = new T.Color();
  let G = null;
  function shared() {
    if (G) return G;
    const flapR = new T.BoxGeometry(.94, .45, .03); flapR.translate(-.47, 0, 0);   // 從機箱面往通道中間伸出
    G = {
      flap: flapR,
      flapM: new T.MeshStandardMaterial({ color: '#e04848', transparent: true, opacity: .62, roughness: .45, metalness: .1 }),
      lampFull: new T.BoxGeometry(.46, .11, .04),     // 全高月台門：門楣上的長條燈
      lampPost: new T.BoxGeometry(.13, .08, .16),      // 半高月台門：門柱頂端的燈
      lampOff: new T.MeshStandardMaterial({ color: '#4a1d1d', roughness: .35, metalness: .2 }),
      lampOn: new T.MeshBasicMaterial({ color: '#ff1e12', toneMapped: false }),
      halo: new T.PlaneGeometry(1.2, .62),
      haloM: new T.MeshBasicMaterial({ map: textures().glow, color: '#ff3020', transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }),
      ringGeo: new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    };
    return G;
  }
  // 放進車站群組的物件：車站卸載時 World 會 dispose 幾何，共用的要標記起來
  function own(o) { o.userData.shared = true; o.userData.fx = true; o.frustumCulled = false; return o; }

  /* ── 車站切換：重建閘門翼片與月台門警示燈 ── */
  let curL = null, curGroup = null;
  const gate = { mesh: null, hidden: null, xs: [], z: 0, open: null, hold: null, npc: null, npcT: 0 };
  const lamps = new Map();   // `${k}:${side}` → { lit, halo, until, t0 }
  const stationObjs = [];
  function onLayout(L) {
    for (const o of stationObjs) { if (o.parent) o.parent.remove(o); if (o.isInstancedMesh) o.dispose(); }
    stationObjs.length = 0; lamps.clear();
    if (gate.hidden) gate.hidden.visible = true;
    gate.mesh = gate.hidden = null;
    curL = L; curGroup = World.stationGroup;
    if (!L || !curGroup) return;
    buildGates(L, curGroup);
    buildLamps(L, curGroup);
    if (GLOW) { GLOW.clear(); SPARK.clear(); DUST.clear(); }
    glintT = 0; markT = 0;
  }
  function buildGates(L, grp) {
    if (!L.gates || !L.gates.length) return;
    // 找出原本靜態的紅色翼片（合併成一個網格），藏起來，換成會動的
    const want = tmpC.set('#e04848'), zc = L.gateZ + .6;
    let found = null;
    grp.traverse(o => {
      if (found || !o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return;
      const m = o.material;
      if (!m.transparent || Math.abs(m.opacity - .55) > .01 || !m.color || !m.color.equals(want)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      if (bb.min.y > .4 && bb.max.y < 1.1 && Math.abs((bb.min.z + bb.max.z) / 2 - zc) < .15) found = o;
    });
    if (!found) return;
    found.visible = false; gate.hidden = found;
    const n = L.gates.length, g = shared();
    const mesh = own(new T.InstancedMesh(g.flap, g.flapM, n * 2));
    gate.mesh = mesh; gate.xs = L.gates.slice(); gate.z = zc;
    gate.open = new Float32Array(n); gate.hold = new Float32Array(n); gate.npc = new Uint8Array(n); gate.npcT = 0;
    for (let i = 0; i < n; i++) setFlaps(i, 0);
    mesh.instanceMatrix.needsUpdate = true;
    grp.add(mesh); stationObjs.push(mesh);
  }
  function setFlaps(i, k) {
    const gx = gate.xs[i], sc = Math.max(.07, 1 - .93 * k);
    for (let s = 0; s < 2; s++) {
      const sx = s ? 1 : -1;
      tmpP.set(gx + sx * .975, .75, gate.z);
      tmpQ.setFromAxisAngle(UP, sx > 0 ? 0 : Math.PI);
      tmpS.set(sc, 1, 1);
      tmpM.compose(tmpP, tmpQ, tmpS);
      gate.mesh.setMatrixAt(i * 2 + s, tmpM);
    }
  }
  function gatesTick(dt, p) {
    if (!gate.mesh) return;
    const n = gate.xs.length;
    // NPC 也會刷卡過閘門（每 0.15 秒檢查一次）
    if ((gate.npcT -= dt) <= 0) {
      gate.npcT = .15; gate.npc.fill(0);
      const list = typeof NPCManager !== 'undefined' ? NPCManager.list : null;
      if (list) for (let j = 0; j < list.length; j++) {
        const q = list[j]; if (Math.abs(q.y) > .4 || Math.abs(q.z - gate.z) > 1.3) continue;
        for (let i = 0; i < n; i++) if (Math.abs(q.x - gate.xs[i]) < .6) gate.npc[i] = 1;
      }
    }
    let dirty = false;
    for (let i = 0; i < n; i++) {
      if (gate.hold[i] > 0) gate.hold[i] -= dt;
      const want = gate.hold[i] > 0 || gate.npc[i] || (Math.abs(p.y) < .4 && Math.abs(p.x - gate.xs[i]) < .55 && Math.abs(p.z - gate.z) < 1.35);
      const tgt = want ? 1 : 0, o = gate.open[i];
      if (Math.abs(tgt - o) < .002) { if (o !== tgt) { gate.open[i] = tgt; setFlaps(i, tgt); dirty = true; } continue; }
      gate.open[i] = o + (tgt - o) * Math.min(1, dt * (want ? 11 : 5));
      setFlaps(i, gate.open[i]); dirty = true;
    }
    if (dirty) gate.mesh.instanceMatrix.needsUpdate = true;
  }

  // 月台門上方的警示燈：全高月台門在門楣上，半高月台門在門柱頂端（規則和 Station3D 一樣）
  function buildLamps(L, grp) {
    const st = S(), g = shared(), dummy = new T.Object3D();
    for (const P of L.platforms) {
      const full = P.under || P.line === 'BR', psdH = full ? 2.3 : 1.45;
      for (const s of [-1, 1]) {
        const pts = [];
        if (full) for (const d of st.DOORS) pts.push([P.x + d, P.y + psdH + .21, P.z + s * (st.PSD - .17)]);
        else for (const d of st.DOORS) for (const sx of [-1, 1]) pts.push([P.x + d + sx * .76, P.y + psdH + .03, P.z + s * st.PSD]);
        const off = own(new T.InstancedMesh(full ? g.lampFull : g.lampPost, g.lampOff, pts.length));
        const lit = own(new T.InstancedMesh(full ? g.lampFull : g.lampPost, g.lampOn, pts.length));
        const halo = own(new T.InstancedMesh(g.halo, g.haloM, pts.length));
        pts.forEach(([x, y, z], i) => {
          dummy.position.set(x, y, z); dummy.rotation.set(0, s > 0 ? Math.PI : 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
          off.setMatrixAt(i, dummy.matrix);
          dummy.position.set(x, y, z - s * .012); dummy.scale.set(1.02, 1.1, 1.1); dummy.updateMatrix(); lit.setMatrixAt(i, dummy.matrix);
          dummy.position.set(x, y, z - s * (full ? .05 : .1)); dummy.scale.set(full ? 1 : .55, full ? 1 : .8, 1); dummy.updateMatrix(); halo.setMatrixAt(i, dummy.matrix);
        });
        lit.visible = halo.visible = false; halo.renderOrder = 6;
        grp.add(off); grp.add(lit); grp.add(halo); stationObjs.push(off, lit, halo);
        lamps.set(`${P.k}:${s}`, { lit, halo, until: 0, t0: 0 });
      }
    }
  }
  let lampNow = 0;
  function lampsTick(now) { lampNow = now; lamps.forEach(lampTick); }
  function lampTick(e) {
    const now = lampNow, on = e.until > now && ((now - e.t0) % 520) < 300;
    if (e.lit.visible !== on) e.lit.visible = e.halo.visible = on;
  }
  function flashLamps(tr, ms) {
    if (World.layout !== curL) onLayout(World.layout);
    const e = tr && tr.P && lamps.get(`${tr.P.k}:${tr.side}`); if (!e) return;
    const now = performance.now();
    if (e.until < now) e.t0 = now;
    e.until = Math.max(e.until, now + ms);
  }

  /* ── 列車頭燈、尾燈 ── */
  const trainLights = new Map();
  let tickNow = 0;
  function trainsTick(now) {
    tickNow = now;
    trainLights.forEach(dropGone);
    if (World.trains) World.trains.forEach(trainTick);
  }
  function dropGone(ids, tr) { if (!World.trains.has(tr)) { for (let i = 0; i < ids.length; i++) GLOW.kill(ids[i]); trainLights.delete(tr); } }
  function trainTick(tr) {
    let ids = trainLights.get(tr);
    if (!ids) {
      ids = [GLOW.fixed(), GLOW.fixed(), GLOW.fixed(), GLOW.fixed(), GLOW.fixed(), GLOW.fixed()];
      // 車頭位置：量一次列車的長度（車廂模板可能改變，不寫死）
      tr.group.updateMatrixWorld(true);
      const b = new T.Box3().setFromObject(tr.group), gx = tr.group.position.x;
      ids.half = Math.max(20, Math.max(b.max.x - gx, gx - b.min.x)) + .08;
      trainLights.set(tr, ids);
    }
    const st = S(), hide = World.riding === tr || !tr.group.visible || !tr.P;
    if (hide) { for (let i = 0; i < ids.length; i++) GLOW.set(ids[i], 0, -999, 0, 0, 0, 0, 0, 0); return; }
    const dir = tr.travel >= 0 ? 1 : -1, cx = tr.P.x + tr.x, cz = tr.P.z + tr.side * st.TRACK, y = tr.P.y;
    const end = ids.half, far = Math.min(1, Math.abs(tr.x) / 50), fk = tr.fog ? .55 : 1;
    const hx = cx + dir * end, tx = cx - dir * end;
    GLOW.set(ids[0], hx, y + .25, cz - .82, .62, 1, .96, .82, fk);
    GLOW.set(ids[1], hx, y + .25, cz + .82, .62, 1, .96, .82, fk);
    GLOW.set(ids[2], hx + dir * .6, y + .4, cz, 3.2 + far * 2.5, .9, .92, 1, (.16 + far * .34) * fk);   // 頭燈照在隧道裡的光暈
    GLOW.set(ids[3], hx + dir * 7, y - .5, cz, 4.5, .9, .92, 1, far * .16 * fk);                      // 照在前方軌道上
    GLOW.set(ids[4], tx, y + .25, cz - .82, .42, 1, .12, .08, .95 * fk);
    GLOW.set(ids[5], tx, y + .25, cz + .82, .42, 1, .12, .08, .95 * fk);
  }

  /* ── NPC 頭上的「！」「？」 ── */
  const marks = [];       // { sp, n, h, ph }
  let markMat = null, markT = 0;
  function markStatus(n) {
    if (!n.named || typeof Quests === 'undefined') return null;
    const id = n.id;
    const need = g => g.npc === id;
    if (Quests.wants('talk', need) || Quests.wants('give', need) || Quests.wants('decide', need) || Quests.wants('work', need)) return '?';
    if (id === 'xiuyu') return null;
    const offers = (n.gives || []).concat(typeof SideQuests !== 'undefined' ? SideQuests.itemOffers(id) : []);
    for (const qid of offers) {
      const q = QUESTS[qid]; if (!q) continue;
      if (Quests.isActive(qid) || Quests.isDone(qid) || Quests.failedToday(qid)) continue;
      if (q.type === 'event' && !Quests.eventsNow().includes(qid)) continue;
      if (q.type === 'side' && Quests.sideCount() >= SIDE_LIMIT) continue;
      return '!';
    }
    return null;
  }
  function refreshMarks() {
    if (!markMat) markMat = { '!': new T.SpriteMaterial({ map: badgeTex('!', '#ffd23f'), depthWrite: false, fog: false, transparent: true }), '?': new T.SpriteMaterial({ map: badgeTex('?', '#8fe3ff'), depthWrite: false, fog: false, transparent: true }) };
    const list = typeof NPCManager !== 'undefined' && !World.riding ? NPCManager.list : [];
    let k = 0;
    for (const n of list) {
      if (!n.named || k >= 10) continue;
      const st = markStatus(n); if (!st) continue;
      let m = marks[k];
      if (!m) { const sp = new T.Sprite(markMat[st]); sp.scale.set(.42, .42, 1); sp.renderOrder = 9; sp.userData.fx = true; scene.add(sp); m = marks[k] = { sp, n: null, h: 2.1, ph: k * 1.7 }; }
      m.sp.material = markMat[st]; m.n = n;
      m.h = 1.2 + .95 * Math.min(1.1, Math.max(.6, (n.look && n.look.height) || 1));
      k++;
    }
    for (let i = k; i < marks.length; i++) { marks[i].n = null; marks[i].sp.visible = false; }
  }
  function markersTick(dt, now) {
    if ((markT -= dt) <= 0) { markT = .8; refreshMarks(); }
    const talking = typeof Dialog !== 'undefined' ? Dialog.with : null;
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i], n = m.n;
      if (!n) continue;
      const vis = !!(n.rig && n.rig.root.visible && n.rig.root.parent) && talking !== n;
      m.sp.visible = vis;
      if (vis) { m.sp.position.set(n.x, n.y + m.h + Math.sin(now / 320 + m.ph) * .06, n.z); const s = .42 * (1 + Math.max(0, Math.sin(now / 160 + m.ph)) * .06); m.sp.scale.set(s, s, 1); }
    }
  }

  /* ── 可以互動的目標：腳下光圈 ── */
  let ring = null, ring2 = null, ringId = '', ringAt = 0, tgt = null, tgtKind = '', burstT = 9;
  const doorTgt = { x: 0, y: 0, z: 0 };
  function doorTarget(p, board) {
    const st = S(); let best = null;
    if (board) World.trains.forEach(tr => { if (!best && p.zone.P === tr.P && Math.abs(tr.x) < .01 && Math.sign(p.z - tr.P.z) === tr.side) best = tr; });
    else best = p.zone.train || null;
    if (!best) return null;
    doorTgt.x = World.nearestDoor(best, p.x); doorTgt.y = best.P.y;
    doorTgt.z = best.P.z + best.side * (board ? st.PSD - .3 : st.TRACK - 1.05);
    return doorTgt;
  }
  function resolveTarget(id) {
    const p = World.player, k = id.split(':')[0];
    tgtKind = k;
    if (k === 'npc') return typeof nearPerson === 'function' ? nearPerson(p) : null;
    if (k === 'pick') return Pickups.near(p);
    if (k === 'col') return Achievements.near(p);
    if (k === 'ch') return Challenges.near(p);
    if (k === 'sec') return Secrets.near(p);
    if (k === 'spot') return typeof nearSpot === 'function' ? nearSpot(p) : null;
    if (k === 'perf') return Life.nearPerformer(p);
    if (k === 'drop') return Passengers.dropNear(p);
    if (k === 'sit') return Passengers.freeSeat(p);
    if (k === 'bench') return Life.nearSeat(p);
    if (/^board/.test(id)) { tgtKind = 'door'; return doorTarget(p, true); }
    if (/^alight/.test(id)) { tgtKind = 'door'; return doorTarget(p, false); }
    return null;
  }
  function ringTick(dt, now) {
    if (!ring) {
      const mk = () => { const m = new T.Mesh(shared().ringGeo, new T.MeshBasicMaterial({ map: textures().ring, color: '#5dffa0', transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 })); m.renderOrder = 7; m.userData.fx = true; m.visible = false; scene.add(m); return m; };
      ring = mk(); ring2 = mk();
    }
    const id = actionBtn && !actionBtn.hidden ? actionBtn.dataset.id : '';
    if (id !== ringId || now - ringAt > 300) {
      if (id !== ringId) burstT = 0;
      ringId = id; ringAt = now;
      try { tgt = id ? resolveTarget(id) : null; } catch (e) { tgt = null; }
      if (tgt && (tgt.x == null || tgt.z == null)) tgt = null;
    }
    if (!tgt) { ring.visible = ring2.visible = false; return; }
    const ty = (tgt.y || 0) + .03, base = tgtKind === 'npc' ? 1.15 : tgtKind === 'door' ? 1.35 : tgtKind === 'spot' ? 1.2 : .95;
    const pulse = 1 + Math.sin(now / 260) * .06;
    ring.visible = true; ring.position.set(tgt.x, ty, tgt.z); ring.scale.set(base * pulse, 1, base * pulse);
    ring.material.opacity = .75 + Math.sin(now / 260) * .2;
    // 外圈：一圈一圈往外擴散
    burstT += dt; const t = (burstT % 1.3) / 1.3;
    ring2.visible = !reduced(); ring2.position.set(tgt.x, ty + .002, tgt.z);
    const s2 = base * (1 + t * .9); ring2.scale.set(s2, 1, s2); ring2.material.opacity = (1 - t) * .55;
    // 物品：周圍冒出星芒
    if ((tgtKind === 'pick' || tgtKind === 'col' || tgtKind === 'drop' || tgtKind === 'ch') && rnd() < dt * 7) {
      const a = rnd() * 6.283, r = .2 + rnd() * .25;
      SPARK.emit(tgt.x + Math.cos(a) * r, ty + .1 + rnd() * .5, tgt.z + Math.sin(a) * r, 0, .5 + rnd() * .4, 0, .8, .2, 0, 1, .92, .55, 1, 0, 1);
    }
  }
  function ripple() {
    if (!tgt || !ring) return;
    burstT = 0;
    burst(tgt.x, (tgt.y || 0) + .15, tgt.z, 14, .45, 1, .6, tgtKind === 'npc' ? [1, .95, .6] : [.45, 1, .7]);
  }

  /* ── 地上的東西閃閃發亮 ── */
  const glints = [];
  let glintT = 0;
  function scanGlints() {
    glints.length = 0;
    const L = World.layout; if (!L) return;
    const ch = scene.children;
    for (let i = 0; i < ch.length; i++) {
      const o = ch[i];
      if (!o.isSprite || o.userData.fx || o.scale.x > .8) continue;
      const y = o.position.y;
      let ok = y > .02 && y < .75;   // 大廳地板 y = 0
      if (!ok) for (const P of L.platforms) { const d = y - P.y; if (d > .02 && d < .75) { ok = true; break; } }
      if (ok) glints.push(o);
    }
  }
  function glintTick(dt, p) {
    if ((glintT -= dt) <= 0) { glintT = 1.5; scanGlints(); }
    if (World.riding) return;
    for (let i = 0; i < glints.length; i++) {
      const o = glints[i];
      if (!o.visible || !o.parent) continue;
      const dx = o.position.x - p.x, dz = o.position.z - p.z;
      if (dx * dx + dz * dz > 400 || Math.abs(o.position.y - p.y) > 3) continue;
      if (rnd() < dt * 2.4) {
        const s = o.scale.x;
        SPARK.emit(o.position.x + (rnd() - .5) * s * 1.2, o.position.y + (rnd() - .3) * s, o.position.z + (rnd() - .5) * s * 1.2, 0, .12, 0, .9, .26, 0, 1, .93, .62, 1, 0, 0);
      }
    }
  }

  /* ── 跑步揚塵 ── */
  let dustT = 0, foot = 1;
  function dustTick(dt, p) {
    if (!p || p.speed < 3.7 || p.sitting || World.riding || reduced()) { dustT = Math.min(dustT, .05); return; }
    if ((dustT -= dt) > 0) return;
    dustT = .2; foot = -foot;
    const fa = World.facing || 0, fx = Math.sin(fa), fz = Math.cos(fa), ox = fz * .13 * foot, oz = -fx * .13 * foot;   // World.player 沒有朝向，用 World.facing
    const dark = World.mood ? .55 : .8;
    for (let k = 0; k < 3; k++) {
      DUST.emit(p.x - fx * .18 + ox + (rnd() - .5) * .12, p.y + .07, p.z - fz * .18 + oz + (rnd() - .5) * .12,
        -fx * .5 + (rnd() - .5) * .7, .25 + rnd() * .3, -fz * .5 + (rnd() - .5) * .7, .55 + rnd() * .3, .16, .62 + rnd() * .2, dark, dark * .96, dark * .9, .5, -.15, 2.6);
    }
  }

  /* ── 浮在空中的字（閘門「嗶！」） ── */
  const pops = [];
  function popSprite() {
    let p = pops.find(q => q.t >= q.life);
    if (!p) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 128;
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      const sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
      sp.renderOrder = 20; sp.userData.fx = true; sp.visible = false; scene.add(sp);
      p = { c, tx, sp, t: 1, life: 1, x: 0, y: 0, z: 0 }; pops.push(p);
    }
    return p;
  }
  function popText(x, y, z, big, small, ok) {
    const p = popSprite(), g = p.c.getContext('2d');
    g.clearRect(0, 0, 256, 128);
    const r = 22; g.beginPath(); g.moveTo(r + 8, 8); g.arcTo(248, 8, 248, 120, r); g.arcTo(248, 120, 8, 120, r); g.arcTo(8, 120, 8, 8, r); g.arcTo(8, 8, 248, 8, r); g.closePath();
    g.fillStyle = ok ? 'rgba(8,42,26,.9)' : 'rgba(60,10,10,.9)'; g.fill(); g.lineWidth = 6; g.strokeStyle = ok ? '#5dffa0' : '#ff6a5a'; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff'; g.font = '900 50px "Noto Sans TC", sans-serif'; g.fillText(big, 128, small ? 50 : 64);
    if (small) { g.fillStyle = ok ? '#b8ffd2' : '#ffc8c0'; g.font = '700 26px "Barlow Semi Condensed", "Noto Sans TC", sans-serif'; g.fillText(small, 128, 95); }
    p.tx.needsUpdate = true;
    p.x = x; p.y = y; p.z = z; p.t = 0; p.life = 1.5;
    p.sp.position.set(x, y, z); p.sp.scale.set(.56, .28, 1); p.sp.material.opacity = 0; p.sp.visible = true;
  }
  function popsTick(dt) {
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i]; if (p.t >= p.life) continue;
      p.t += dt; const k = Math.min(1, p.t / p.life);
      if (k >= 1) { p.sp.visible = false; continue; }
      p.sp.position.y = p.y + (1 - Math.pow(1 - k, 3)) * .45;
      p.sp.material.opacity = k < .1 ? k / .1 : k > .65 ? 1 - (k - .65) / .35 : 1;
      const s = k < .12 ? .7 + k / .12 * .3 : 1; p.sp.scale.set(.56 * s, .28 * s, 1);
    }
  }

  // 一團星芒＋光暈
  function burst(x, y, z, n, speed, up, life, c) {
    if (!SPARK) return;
    GLOW.emit(x, y, z, 0, 0, 0, .45, .5, 1.6, c[0], c[1], c[2], .8, 0, 0);
    const m = reduced() ? Math.ceil(n / 3) : n;
    for (let i = 0; i < m; i++) {
      const a = rnd() * 6.283, v = speed * (.5 + rnd());
      SPARK.emit(x, y, z, Math.cos(a) * v, up * (.4 + rnd() * .9), Math.sin(a) * v, life * (.6 + rnd() * .6), .22 + rnd() * .12, 0, c[0], c[1], c[2], 1, 1.6, 1.4);
    }
  }

  /* ── 畫面座標與 DOM 效果 ── */
  const v3 = new T.Vector3();
  function toScreen(x, y, z) {
    if (!canvasEl) canvasEl = document.querySelector('#scene canvas');
    const r = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    v3.set(x, y, z).project(World.camera);
    if (v3.z > 1 || Math.abs(v3.x) > 1.3 || Math.abs(v3.y) > 1.3) return { x: r.left + r.width / 2, y: r.top + r.height * .55 };
    return { x: r.left + (v3.x + 1) / 2 * r.width, y: r.top + (1 - v3.y) / 2 * r.height };
  }
  function center(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.closest('[hidden]')) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  const moneyEl = () => document.querySelector('#hudStats .money:not(.gold)');
  const goldEl = () => document.querySelector('#hudStats .money.gold');
  const bagEl = () => document.getElementById('btnBag');
  function bump(el) { if (!el) return; el.classList.remove('fx-bump'); void el.offsetWidth; el.classList.add('fx-bump'); setTimeout(() => el.classList.remove('fx-bump'), 500); }
  // 從 from 飛到 toEl（弧線），落地時目標彈一下
  function fly(html, cls, from, toEl, delay = 0, dur = 820) {
    if (!layer) return;
    const to = center(toEl) || center(bagEl()) || { x: innerWidth - 60, y: 40 };
    const el = document.createElement('div'); el.className = 'fx-fly ' + cls; el.innerHTML = html;
    el.style.left = from.x + 'px'; el.style.top = from.y + 'px';
    layer.appendChild(el);
    const dx = to.x - from.x, dy = to.y - from.y, jx = (rnd() - .5) * 90, jy = -30 - rnd() * 60;
    const a = el.animate([
      { transform: 'translate(-50%,-50%) translate(0px,0px) scale(.4)', opacity: 0 },
      { transform: `translate(-50%,-50%) translate(${jx}px,${jy}px) scale(1.15)`, opacity: 1, offset: .22 },
      { transform: `translate(-50%,-50%) translate(${jx + (dx - jx) * .55}px,${Math.min(jy, dy) - 40 + (dy - jy) * .3}px) scale(1)`, opacity: 1, offset: .62 },
      { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.5)`, opacity: .85 },
    ], { duration: dur, delay, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'both' });
    a.onfinish = () => { el.remove(); bump(toEl && toEl.isConnected ? toEl : bagEl()); };
  }
  function floatLabel(el, text, cls) {
    if (!layer) return;
    const c = center(el) || center(bagEl()); if (!c) return;
    const d = document.createElement('div'); d.className = 'fx-float ' + cls; d.textContent = text;
    d.style.left = c.x + 'px'; d.style.top = (c.y + 14) + 'px';
    layer.appendChild(d);
    const a = d.animate([{ transform: 'translate(-50%,0) scale(.7)', opacity: 0 }, { transform: 'translate(-50%,6px) scale(1.08)', opacity: 1, offset: .18 }, { transform: 'translate(-50%,22px) scale(1)', opacity: 0 }], { duration: 1500, easing: 'ease-out' });
    a.onfinish = () => d.remove();
  }
  // 彩帶：用捷運各線的顏色
  const CONF = ['#e3002c', '#008659', '#f8b61c', '#0070bd', '#c48c31', '#ffdb00', '#8246af', '#ffffff'];
  function confetti(n = 46, ox, oy) {
    if (!layer || reduced()) return;
    const W = innerWidth, H = innerHeight, cx = ox ?? W / 2, cy = oy ?? H * .34;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i'); el.className = 'fx-conf' + (i % 3 === 0 ? ' r' : '');
      el.style.background = CONF[i % CONF.length]; el.style.left = cx + 'px'; el.style.top = cy + 'px';
      layer.appendChild(el);
      const a = rnd() * Math.PI - Math.PI, v = 160 + rnd() * Math.min(340, W * .45);
      const vx = Math.cos(a) * v * 1.25, vy = Math.sin(a) * v, rot = (rnd() - .5) * 1440, dur = 1500 + rnd() * 900;
      const an = el.animate([
        { transform: 'translate(-50%,-50%) translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(-50%,-50%) translate(${vx * .6}px,${vy * .6}px) rotate(${rot * .4}deg)`, opacity: 1, offset: .3 },
        { transform: `translate(-50%,-50%) translate(${vx}px,${vy * .55 + H * .55}px) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', delay: rnd() * 120, fill: 'both' });
      an.onfinish = () => el.remove();
    }
  }
  // 橫幅：一次一個，排隊播放
  const bq = []; let bBusy = false;
  function banner(title, sub, kind) { bq.push({ title, sub, kind }); if (!bBusy) nextBanner(); }
  function nextBanner() {
    const b = bq.shift(); if (!b || !layer) { bBusy = false; return; }
    bBusy = true;
    const el = document.createElement('div'); el.className = 'fx-banner ' + (b.kind || '');
    el.innerHTML = `<b>${escH(b.title)}</b>${b.sub ? `<span>${escH(b.sub)}</span>` : ''}`;
    layer.appendChild(el);
    const rm = reduced();
    const a = el.animate(rm ? [{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .85 }, { opacity: 0 }] : [
      { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0, letterSpacing: '.5em' },
      { transform: 'translate(-50%,-50%) scale(1.06)', opacity: 1, offset: .1 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, letterSpacing: '.12em', offset: .2 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .82 },
      { transform: 'translate(-50%,-60%) scale(.96)', opacity: 0 },
    ], { duration: 2300, easing: 'ease-out' });
    a.onfinish = () => { el.remove(); nextBanner(); };
  }
  // 關門提示
  let warnEl = null, warnTimer = 0;
  function doorPill(ms) {
    if (!layer) return;
    if (!warnEl) { warnEl = document.createElement('div'); warnEl.className = 'fx-doorwarn'; warnEl.innerHTML = '<i></i>車門即將關閉<small>Doors closing</small>'; layer.appendChild(warnEl); }
    warnEl.classList.add('on'); clearTimeout(warnTimer);
    warnTimer = setTimeout(() => warnEl.classList.remove('on'), ms);
  }

  /* ── 餘額變動：浮出 +/− ── */
  let lastMoney = null, lastGold = null, lastState = null, moneyT = 0, coinsLandAt = 0;
  function moneyTick(dt) {
    if ((moneyT -= dt) > 0) return;
    moneyT = .2;
    const s = typeof Game !== 'undefined' && Game.state; if (!s) return;
    if (s !== lastState) { lastState = s; lastMoney = s.money; lastGold = s.gold || 0; return; }
    const delay = Math.max(0, coinsLandAt - performance.now());
    if (s.money !== lastMoney) {
      const d = s.money - lastMoney; lastMoney = s.money;
      setTimeout(() => floatLabel(moneyEl(), `${d > 0 ? '+' : '−'}NT$ ${Math.abs(d)}`, d > 0 ? 'gain' : 'loss'), d > 0 ? delay : 0);
    }
    const g = s.gold || 0;
    if (g !== lastGold) { const d = g - lastGold; lastGold = g; setTimeout(() => floatLabel(goldEl() || moneyEl(), `${d > 0 ? '+' : '−'}${Math.abs(d)} 黃金`, d > 0 ? 'gold' : 'loss'), d > 0 ? delay : 0); }
  }

  /* ── 每幀 ── */
  function tick(dt, now) {
    if (World.layout !== curL || World.stationGroup !== curGroup) onLayout(World.layout);
    const p = World.raw;
    gatesTick(dt, p);
    lampsTick(now);
    trainsTick(now);
    markersTick(dt, now);
    ringTick(dt, now);
    glintTick(dt, p);
    dustTick(dt, p);
    popsTick(dt);
    moneyTick(dt);
    for (let i = 0; i < SYS.length; i++) SYS[i].update(dt);
  }

  /* ── 對外 ── */
  const api = {
    // World.init 之後呼叫一次
    init() {
      if (ready || typeof World === 'undefined' || !World.scene) return;
      ready = true; scene = World.scene;
      const tx = textures();
      GLOW = makeSystem(96, tx.glow, true, false, 8);
      SPARK = makeSystem(220, tx.spark, true, false, 9);
      DUST = makeSystem(72, tx.puff, false, true, 6);
      SYS.push(GLOW, SPARK, DUST);
      for (const s of SYS) scene.add(s.obj);
      layer = document.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
      actionBtn = document.getElementById('actionBtn');
      if (actionBtn) actionBtn.addEventListener('click', () => ripple());
      window.addEventListener('keydown', e => { if (e.code === 'KeyE' && actionBtn && !actionBtn.hidden) ripple(); });
      World.addTicker(safe(tick));
      World.onRecenter(W => { for (const s of SYS) s.shift(W.x, W.y, W.z); });
    },
    // 刷卡過閘門（world3d）：side 1 出站、-1 進站；ok = false 是被擋下
    gate(side, x, ok = true) {
      const L = World.layout; if (!ready || !L || !L.gates) return;
      let i = 0; for (let j = 1; j < L.gates.length; j++) if (Math.abs(L.gates[j] - x) < Math.abs(L.gates[i] - x)) i = j;
      const gx = L.gates[i], rx = gx + (side < 0 ? 1.2 : -1.2), ry = 1.07, rz = L.gateZ + .3;   // 右手邊的感應區
      const c = ok ? [.3, 1, .5] : [1, .25, .18];
      GLOW.emit(rx, ry + .02, rz, 0, 0, 0, .6, .7, 1.5, c[0], c[1], c[2], 1, 0, 0);
      GLOW.emit(rx, ry + .02, rz, 0, 0, 0, .35, .35, .6, 1, 1, 1, .9, 0, 0);
      for (let k = 0; k < 10; k++) SPARK.emit(rx + (rnd() - .5) * .3, ry + .05, rz + (rnd() - .5) * .3, (rnd() - .5) * .5, .7 + rnd() * .6, (rnd() - .5) * .5, .7, .16, 0, c[0], c[1], c[2], 1, 1.2, 1.5);
      const s = Game.state || {};
      popText(gx + (rx - gx) * .35, 1.62, rz, ok ? '嗶！' : '嗶嗶', ok ? `餘額 NT$ ${s.money ?? ''}` : '請洽詢服務台', ok);
      if (ok && gate.mesh && gate.xs[i] === gx) gate.hold[i] = .9;
    },
    // 車門開關（world3d.setDoors）
    doors(tr, open, ms = 1100) { if (ready) flashLamps(tr, Math.max(1300, ms + 250)); },
    // 關門警示（game.js：關門音響起時）
    doorWarn(tr) {
      if (!ready) return;
      flashLamps(tr, 3300);
      const z = World.zone();
      if (!Game.ride && (z.P === tr.P || z.train === tr)) doorPill(3000);
      else if (Game.ride && World.isInside(tr)) doorPill(3000);
    },
    // 月台 LED：列車即將進站時兩種畫面交替閃爍
    led(k, side, eta, rows) {
      if (eta == null || eta > 12 || !rows || !rows[0]) return rows;
      const key = k + ':' + side; ledFlip[key] = !ledFlip[key];
      if (ledFlip[key]) rows[0] = { text: '列車即將進站', eta: 'Arriving' };
      return rows;
    },
    // 撿起東西：星芒＋圖示飛進背包
    pickup(it, icon) {
      if (!ready || !it) return;
      const y = (it.y || 0) + .35;
      burst(it.x, y, it.z, 26, 1.1, 1.6, .9, [1, .88, .45]);
      if (reduced()) return;
      const from = toScreen(it.x, y, it.z);
      fly(icon ? `<span>${icon}</span>` : '<span class="coin"></span>', 'item', from, bagEl(), 60, 900);
    },
    // Game.reward：硬幣飛進餘額、物品飛進背包
    reward(r) {
      if (!ready || !r || reduced() || document.body.dataset.screen !== 'game') return;
      const ts = document.getElementById('toasts'), last = ts && ts.lastElementChild;
      const from = center(last) || { x: innerWidth / 2, y: innerHeight * .25 };
      let delay = 0;
      if (r.money > 0) {
        const n = Math.min(10, 3 + (r.money / 40 | 0)), me = moneyEl();
        for (let i = 0; i < n; i++) fly('<span class="coin"></span>', 'coin', from, me, i * 55, 760);
        delay = n * 55 + 760;
      }
      if (r.gold > 0) { const ge = goldEl() || moneyEl(); for (let i = 0; i < Math.min(6, 2 + r.gold); i++) fly('<span class="bar"></span>', 'coin', from, ge, 120 + i * 70, 820); delay = Math.max(delay, 900); }
      for (const id of Object.keys(r.items || {})) if (typeof ITEMS !== 'undefined' && ITEMS[id]) fly(`<span>${ITEMS[id].icon}</span>`, 'item', from, bagEl(), 150, 900);
      coinsLandAt = performance.now() + delay;
    },
    questDone(title) { if (!ready) return; banner('任務完成', title, 'quest'); confetti(36); },
    levelUp(lv) { if (!ready) return; banner(`升級！ Lv ${lv}`, '到「紀錄 → 角色」分配能力點', 'level'); confetti(60); },
    banner(title, sub, kind) { if (ready) banner(title, sub, kind); },
    confetti(n) { if (ready) confetti(n); },
  };
  const ledFlip = {};
  for (const k of Object.keys(api)) if (typeof api[k] === 'function') api[k] = safe(api[k]);
  return api;
})();
