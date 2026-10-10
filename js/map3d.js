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

  function textSprite(text, { size = 46, color = '#1c2126', bg = 'rgba(255,255,255,.88)', bold = 700 } = {}) {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    g.font = `${bold} ${size}px "Noto Sans TC", sans-serif`;
    const w = Math.ceil(g.measureText(text).width) + size * .8, h = Math.ceil(size * 1.5);
    c.width = w; c.height = h;
    g.font = `${bold} ${size}px "Noto Sans TC", sans-serif`;
    g.fillStyle = bg; const r = h / 2.6;
    g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.fill();
    g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, w / 2, h / 2 + 1);
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

  function buildTerrain() {
    const g = new T.Group();
    // 地面：半透明，看得到下面的地下段
    const groundTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const x = c.getContext('2d');
      x.fillStyle = '#d8dcd2'; x.fillRect(0, 0, 512, 512);
      x.strokeStyle = 'rgba(120,130,120,.18)'; x.lineWidth = 1;
      for (let i = 0; i < 512; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
      const t = new T.CanvasTexture(x.canvas); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(8, 8); t.colorSpace = T.SRGBColorSpace;
      return t;
    })();
    const ground = new T.Mesh(new T.PlaneGeometry(160, 150), new T.MeshStandardMaterial({ map: groundTex, transparent: true, opacity: .72, roughness: .95, depthWrite: false }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(50, H_GROUND, 47); ground.renderOrder = 1;
    g.add(ground);
    // 河流
    const water = new T.MeshStandardMaterial({ color: '#7fb2cf', roughness: .3, metalness: .1, transparent: true, opacity: .9 });
    for (const r of RIVERS) {
      for (let i = 0; i < r.pts.length - 1; i++) {
        const a = new T.Vector3(r.pts[i][0] / S, .02, r.pts[i][1] / S), b = new T.Vector3(r.pts[i + 1][0] / S, .02, r.pts[i + 1][1] / S);
        const len = a.distanceTo(b);
        const m = new T.Mesh(new T.PlaneGeometry(len + r.w * .9, r.w), water);
        m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(b.z - a.z, b.x - a.x);
        m.position.copy(a.clone().add(b).multiplyScalar(.5)); m.renderOrder = 2;
        g.add(m);
      }
      const mid = r.pts[Math.floor(r.pts.length / 2)];
      const lab = textSprite(r.name, { size: 34, color: '#2f6f93', bg: 'rgba(255,255,255,0)', bold: 500 });
      lab.position.set(mid[0] / S + 2, .4, mid[1] / S); lab.scale.set(3.2 * lab.userData.aspect / 3, 1.1, 1); lab.userData.river = true;
      g.add(lab);
    }
    // 山丘
    const hillM = new T.MeshStandardMaterial({ color: '#9fb09a', roughness: 1, flatShading: true });
    for (const [x, y, r, h] of HILLS) {
      const m = new T.Mesh(new T.ConeGeometry(r, h, 7, 2), hillM);
      m.position.set(x / S, h / 2 - .2, y / S); m.rotation.y = x;
      g.add(m);
    }
    // 地底的深色底板，讓地下段看起來在土裡
    const under = new T.Mesh(new T.PlaneGeometry(160, 150), new T.MeshBasicMaterial({ color: '#3a3f44' }));
    under.rotation.x = -Math.PI / 2; under.position.set(50, H_UG - 1.2, 47);
    g.add(under);
    return g;
  }

  /* ── 路線 ── */
  function buildLines() {
    const g = new T.Group();
    const done = new Set();
    for (const lid of LINE_ORDER) {
      const L = LINES[lid];
      const mat = new T.MeshStandardMaterial({ color: L.color, roughness: .45, emissive: L.color, emissiveIntensity: .12 });
      const ugMat = new T.MeshStandardMaterial({ color: L.color, roughness: .5, emissive: L.color, emissiveIntensity: .45, transparent: true, opacity: .9 });
      const pierM = new T.MeshStandardMaterial({ color: '#9a9a96', roughness: .9 });
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
            const tube = new T.Mesh(new T.CylinderGeometry(.32, .32, len, 10, 1), ug ? ugMat : mat);
            tube.position.copy(s0.clone().add(s1).multiplyScalar(.5));
            tube.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), s1.clone().sub(s0).normalize());
            g.add(tube);
            // 高架段的橋墩
            if (s0.y > 0 && s1.y > 0) {
              const n = Math.max(1, Math.floor(len / 2.2));
              for (let j = 1; j <= n; j++) {
                const p = s0.clone().lerp(s1, j / (n + 1));
                const pier = new T.Mesh(new T.CylinderGeometry(.12, .16, p.y, 6), pierM);
                pier.position.set(p.x, p.y / 2, p.z);
                g.add(pier);
              }
            }
          }
        }
      }
    }
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
      const body = new T.Mesh(new T.CylinderGeometry(r, r, .5, 24), new T.MeshStandardMaterial({ color: '#ffffff', roughness: .4 }));
      const ring = new T.Mesh(new T.TorusGeometry(r, .14, 8, 28), new T.MeshStandardMaterial({ color: transfer ? '#1c2126' : LINES[lines[0].line].color, roughness: .4 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = .25;
      grp.add(body, ring);
      body.userData.stationId = id;
      stationMeshes.push(body);
      // 地下站：往地面拉一根細柱（出入口）
      if (h < 0) {
        const shaft = new T.Mesh(new T.CylinderGeometry(.18, .18, -h, 8), new T.MeshStandardMaterial({ color: '#6c7178', transparent: true, opacity: .6 }));
        shaft.position.y = -h / 2; grp.add(shaft);
      }
      const zh = lines.map(l => MRT.label(id, l.line).zh).filter((v, i, a) => a.indexOf(v) === i).join('/');
      const lab = textSprite(zh, { size: transfer ? 50 : 42, bold: transfer ? 900 : 700 });
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
      scene.background = new T.Color('#eef1f2');
      scene.fog = new T.Fog('#eef1f2', 120, 260);
      scene.add(new T.HemisphereLight('#ffffff', '#8a8f86', 1.5));
      const d = new T.DirectionalLight('#fff6e8', 1.6); d.position.set(30, 80, 40); scene.add(d);
      scene.add(buildTerrain());
      scene.add(buildLines());
      scene.add(buildStations());
      hero = heroRig = marker = null;
      placeHero();
      if (o.current && STATIONS[o.current]) this.focus(o.current, 45);
      running = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    },
    close() { running = false; cancelAnimationFrame(raf); },
    focus(id, dist = 40) { const p = P(id); cam.tx = p.x; cam.tz = p.z; cam.dist = dist; },
    overview() { cam.tx = 50; cam.tz = 47; cam.dist = 95; cam.yaw = 0; cam.pitch = .95; },
    rotate(a) { cam.yaw += a; },
    zoom(f) { zoom(f); },
  };
})();
