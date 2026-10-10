/* 玩家操控
 *  鍵盤：← → / A D 左右走，↑ ↓ / W S 前後（遠近），E / 空白鍵 / Enter 互動
 *  觸控／滑鼠：點畫面地板，角色就走過去；互動按鈕出現在右下角
 * 座標使用場景的 1600×900 座標；z 為遠近：0 = 靠近軌道（遠），1 = 靠近鏡頭（近）
 */
const Player = (() => {
  const keys = {};
  let cfg = null;          // 目前場景的設定
  let raf = 0, last = 0;
  let x = 800, z = .75, facing = 1, target = null, walkT = 0, frozen = false;
  let interactions = [];
  let camX = 0;

  const KEYMAP = {
    ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r',
    ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd',
  };

  window.addEventListener('keydown', e => {
    if (!cfg || e.target.closest('input, textarea')) return;
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; target = null; e.preventDefault(); }
    if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.target.closest('button')) {
      const it = current(); if (it) { e.preventDefault(); it.run(); }
    }
  });
  window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  function depth(zz) {
    const d = cfg.depth;
    return { y: d.yFar + (d.yNear - d.yFar) * zz, k: d.kFar + (d.kNear - d.kFar) * zz };
  }

  // 螢幕座標 → 場景座標（考慮 xMidYMin slice 與鏡頭位移）
  function toScene(clientX, clientY) {
    const r = cfg.scene.getBoundingClientRect();
    const s = Math.max(r.width / W, r.height / H);
    const ox = (r.width - W * s) / 2;
    return { x: (clientX - r.left - ox) / s + camX, y: (clientY - r.top) / s };
  }

  function onPointer(e) {
    if (!cfg || frozen || e.button > 0) return;
    const p = toScene(e.clientX, e.clientY);
    const d = cfg.depth;
    const zz = Math.min(1, Math.max(0, (p.y - d.yFar) / (d.yNear - d.yFar)));
    target = { x: p.x, z: p.y < d.yFar - 60 ? z : Math.min(cfg.bounds.z1, Math.max(cfg.bounds.z0, zz)) };
    showTapMark(e.clientX - cfg.scene.getBoundingClientRect().left, e.clientY - cfg.scene.getBoundingClientRect().top);
  }

  function showTapMark(px, py) {
    const m = document.createElement('span');
    m.className = 'tap-mark'; m.style.left = px + 'px'; m.style.top = py + 'px';
    cfg.scene.appendChild(m);
    setTimeout(() => m.remove(), 600);
  }

  function updateCamera() {
    const r = cfg.scene.getBoundingClientRect();
    const s = Math.max(r.width / W, r.height / H);
    const vis = r.width / s;
    const slack = Math.max(0, (W - vis) / 2);
    camX = Math.min(slack, Math.max(-slack, x - 800));
    cfg.svg.setAttribute('viewBox', `${camX} 0 ${W} ${H}`);
  }

  function render(now) {
    const { y, k } = depth(z);
    const moving = walkT > 0;
    const bob = moving ? Math.abs(Math.sin(now / 105)) * 9 : Math.sin(now / 900) * 1.5;
    const sway = moving ? Math.sin(now / 210) * 1.6 : 0;
    cfg.hero.setAttribute('transform', `translate(${x.toFixed(1)},${(y - 935 * k).toFixed(1)}) scale(${(k * facing).toFixed(3)},${k.toFixed(3)})`);
    cfg.body.setAttribute('transform', `translate(0,${(-bob).toFixed(1)}) rotate(${sway.toFixed(2)} 0 935)`);
    if (cfg.shadow) cfg.shadow.setAttribute('opacity', (0.4 + 0.3 * z).toFixed(2));
  }

  function current() {
    if (!cfg || frozen) return null;
    return interactions.find(it => it.when({ x, z })) || null;
  }

  function updateAction() {
    const btn = document.getElementById('actionBtn');
    const it = current();
    if (!it) { btn.hidden = true; btn.dataset.id = ''; return; }
    if (btn.dataset.id !== it.id) {
      btn.dataset.id = it.id;
      btn.innerHTML = `${it.label}<kbd>E</kbd>`;
      btn.onclick = () => { const c = current(); if (c) c.run(); };
    }
    btn.hidden = false;
  }

  function loop(now) {
    if (!cfg) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    let vx = 0, vz = 0;
    if (!frozen) {
      if (keys.l) vx -= 1; if (keys.r) vx += 1;
      if (keys.u) vz -= 1; if (keys.d) vz += 1;
      if (!vx && !vz && target) {
        const dx = target.x - x, dz = target.z - z;
        if (Math.abs(dx) < 6 && Math.abs(dz) < 0.02) target = null;
        else { vx = Math.abs(dx) < 6 ? 0 : Math.sign(dx) * Math.min(1, Math.abs(dx) / 40); vz = Math.abs(dz) < .02 ? 0 : Math.sign(dz) * Math.min(1, Math.abs(dz) / .1); }
      }
    }
    const speed = cfg.speed || 430;
    if (vx || vz) {
      x = Math.min(cfg.bounds.x1, Math.max(cfg.bounds.x0, x + vx * speed * dt * (0.75 + 0.25 * z)));
      z = Math.min(cfg.bounds.z1, Math.max(cfg.bounds.z0, z + vz * 0.9 * dt));
      if (vx) facing = vx > 0 ? 1 : -1;   // 往左走時把照片鏡像，讓角色面向前進方向
      walkT = 0.15;
    } else walkT = Math.max(0, walkT - dt);
    updateCamera();
    render(now);
    updateAction();
    if (cfg.onFrame) cfg.onFrame(now, dt);
    raf = requestAnimationFrame(loop);
  }

  return {
    /* 掛到一個場景：
     * { scene, svg, hero, body, shadow, bounds:{x0,x1,z0,z1}, depth:{yFar,yNear,kFar,kNear}, x, z, onFrame } */
    attach(c) {
      this.detach();
      cfg = c; x = c.x ?? 800; z = c.z ?? .75; target = null; frozen = false; interactions = []; last = 0;
      c.scene.addEventListener('pointerdown', onPointer);
      raf = requestAnimationFrame(loop);
    },
    detach() {
      if (cfg) cfg.scene.removeEventListener('pointerdown', onPointer);
      cancelAnimationFrame(raf); cfg = null; interactions = [];
      const btn = document.getElementById('actionBtn'); if (btn) btn.hidden = true;
    },
    setInteractions(list) { interactions = list; const b = document.getElementById('actionBtn'); if (b) b.dataset.id = ''; },
    freeze(v) { frozen = v; target = null; for (const k in keys) keys[k] = false; },
    get x() { return x; }, get z() { return z; }, get camX() { return camX; },
    place(nx, nz) { x = nx; if (nz != null) z = nz; },
    // 自動走到某處（上下車動畫用），opacity 可同時淡出淡入
    walkTo(tx, tz, ms, fade) {
      return new Promise(res => {
        const x0 = x, z0 = z, t0 = performance.now();
        frozen = true;
        if (tx !== x0) facing = tx > x0 ? 1 : -1;
        const step = now => {
          if (!cfg) return res();
          const t = Math.min(1, (now - t0) / ms);
          x = x0 + (tx - x0) * t; z = z0 + (tz - z0) * t;
          walkT = 0.15;
          if (fade) cfg.hero.style.opacity = fade === 'out' ? 1 - t : t;
          t < 1 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });
    },
    get active() { return !!cfg; },
  };
})();
