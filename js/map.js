/* 路網圖：可拖曳、縮放（滑鼠滾輪／雙指），點車站可選取 */
function MapView(container, opts = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const full = { x: 20, y: 10, w: 1000, h: 930 };
  let vb = { ...full };
  let selected = null;

  // 標籤放置：依所在路段方向決定放在上方或右側
  const labelPos = {};
  for (const id in STATIONS) {
    const segs = MRT.segments().filter(s => s.a === id || s.b === id);
    let dx = 0, dy = 0;
    for (const s of segs) {
      const o = STATIONS[s.a === id ? s.b : s.a];
      dx += Math.abs(o.x - STATIONS[id].x); dy += Math.abs(o.y - STATIONS[id].y);
    }
    labelPos[id] = dx > dy * 1.3 ? 'top' : 'right';
  }

  function render() {
    const visited = opts.visited ? opts.visited() : null;
    const current = opts.current ? opts.current() : null;
    let lines = '';
    for (const lid of LINE_ORDER) {
      for (const route of LINES[lid].routes) {
        const pts = route.map(([id]) => `${STATIONS[id].x},${STATIONS[id].y}`).join(' ');
        lines += `<polyline points="${pts}" fill="none" stroke="${LINES[lid].color}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`;
      }
    }
    let dots = '';
    for (const id in STATIONS) {
      const s = STATIONS[id];
      const ls = MRT.linesAt(id);
      const transfer = ls.length > 1;
      const fogged = visited && !visited[id] && id !== current;
      const lp = labelPos[id];
      const tx = lp === 'top' ? s.x : s.x + (transfer ? 11 : 8);
      const ty = lp === 'top' ? s.y - (transfer ? 13 : 10) : s.y + 4;
      const anchor = lp === 'top' ? 'middle' : 'start';
      const zh = ls.map(l => MRT.label(id, l.line).zh).filter((v, i, a) => a.indexOf(v) === i).join('/');
      dots += `<g class="st${fogged ? ' fog' : ''}${id === selected ? ' sel' : ''}" data-id="${esc(id)}" tabindex="0" role="button" aria-label="${esc(zh)}">
        <circle cx="${s.x}" cy="${s.y}" r="14" fill="transparent"/>
        <circle cx="${s.x}" cy="${s.y}" r="${transfer ? 7.5 : 4.6}" fill="#fff" stroke="${transfer ? '#1c2126' : LINES[ls[0].line].color}" stroke-width="${transfer ? 2.6 : 2.4}"/>
        <text x="${tx}" y="${ty}" text-anchor="${anchor}" class="st-label">${esc(zh)}</text>
      </g>`;
    }
    let me = '';
    if (current) {
      const s = STATIONS[current];
      me = `<g class="me" pointer-events="none">
        <circle cx="${s.x}" cy="${s.y}" r="12" class="me-pulse"/>
        <circle cx="${s.x}" cy="${s.y}" r="9" fill="#ff4b6e" stroke="#fff" stroke-width="3"/>
      </g>`;
    }
    container.innerHTML = `<svg class="mapsvg" xmlns="${NS}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}">
      <defs>
        <filter id="mistBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
      </defs>
      <rect x="-500" y="-500" width="2000" height="2000" fill="transparent"/>
      ${lines}${dots}${me}
    </svg>`;
    svg = container.querySelector('svg');
  }

  let svg;
  render();

  const applyVB = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  function zoomAt(f, cx, cy) {
    const nw = Math.min(full.w * 1.2, Math.max(140, vb.w * f));
    const k = nw / vb.w;
    vb.x = cx - (cx - vb.x) * k; vb.y = cy - (cy - vb.y) * k;
    vb.w = nw; vb.h = vb.w * full.h / full.w;
    applyVB();
  }
  function toMap(clientX, clientY) {
    const r = svg.getBoundingClientRect();
    // viewBox 以 meet 方式置中
    const s = Math.min(r.width / vb.w, r.height / vb.h);
    const ox = (r.width - vb.w * s) / 2, oy = (r.height - vb.h * s) / 2;
    return { x: vb.x + (clientX - r.left - ox) / s, y: vb.y + (clientY - r.top - oy) / s, s };
  }

  container.addEventListener('wheel', e => {
    e.preventDefault();
    const p = toMap(e.clientX, e.clientY);
    zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, p.x, p.y);
  }, { passive: false });

  const pointers = new Map();
  let dragMoved = false, pinchDist = 0;
  container.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragMoved = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  container.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const cur = { x: e.clientX, y: e.clientY };
    if (pointers.size === 1) {
      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragMoved = true;
      if (dragMoved) {
        const s = toMap(0, 0).s;
        vb.x -= dx / s; vb.y -= dy / s; applyVB();
        container.setPointerCapture(e.pointerId);
      }
    } else if (pointers.size === 2) {
      pointers.set(e.pointerId, cur);
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist) {
        const m = toMap((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomAt(pinchDist / d, m.x, m.y);
      }
      pinchDist = d; dragMoved = true;
      return;
    }
    pointers.set(e.pointerId, cur);
  });
  const up = e => { pointers.delete(e.pointerId); if (pointers.size < 2) pinchDist = 0; };
  container.addEventListener('pointerup', e => {
    const wasDrag = dragMoved;
    up(e);
    if (wasDrag) return;
    const g = e.target.closest && e.target.closest('.st');
    if (g && opts.onPick) { selected = g.dataset.id; render(); opts.onPick(selected); }
  });
  container.addEventListener('pointercancel', up);
  container.addEventListener('keydown', e => {
    const g = e.target.closest && e.target.closest('.st');
    if (g && (e.key === 'Enter' || e.key === ' ') && opts.onPick) { e.preventDefault(); selected = g.dataset.id; render(); opts.onPick(selected); }
  });

  return {
    render,
    zoom(f) { zoomAt(f, vb.x + vb.w / 2, vb.y + vb.h / 2); },
    reset() { vb = { ...full }; applyVB(); },
    focus(id, w = 360) {
      const s = STATIONS[id];
      vb.w = w; vb.h = w * full.h / full.w; vb.x = s.x - vb.w / 2; vb.y = s.y - vb.h / 2; applyVB();
    },
    select(id) { selected = id; render(); },
  };
}
