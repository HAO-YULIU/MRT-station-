/* 站內導航：樓層、月台方向、轉乘路線、任務指引、尋物羅盤
 * - 樓層：大廳／非付費區同一層，各線月台依高度排 B2、B3… 或 2F、3F…（資訊框標題一直看得到）
 * - 路線：以「站＋線（支線分開）」做最短路徑，轉乘一次算多 3 公里，避免繞來繞去換車
 * - 任務指引：玩家在導航裡自己打開才顯示，只給主線／支線這類任務，秘密任務、隱藏任務、迷霧之城都不給；
 *   指引只說「在哪一層、哪一區」，不給箭頭，保留自己找的樂趣
 * - 尋物羅盤（消耗品）：找不到時用一個，目標上方會亮起光柱，畫面邊緣出現方向箭頭（兩分鐘）
 */
const Nav = (() => {
  const T = THREE;
  const GUIDE_TYPES = ['main', 'side', 'timed', 'event', 'daily', 'weekly'];
  const S = () => Game.state;
  const esc2 = x => (typeof esc === 'function' ? esc(x) : String(x));
  const chip = l => (typeof lineChip === 'function' ? lineChip(l) : l);

  /* ── 路線規劃 ── */
  let graph = null;
  function build() {
    graph = {};
    for (const lid of LINE_ORDER) LINES[lid].routes.forEach((r, ri) => {
      const km = 1.2;
      for (let i = 0; i < r.length; i++) {
        const n = `${r[i][0]}|${lid}|${ri}`; graph[n] = graph[n] || [];
        if (i > 0) graph[n].push([`${r[i - 1][0]}|${lid}|${ri}`, km]);
        if (i < r.length - 1) graph[n].push([`${r[i + 1][0]}|${lid}|${ri}`, km]);
      }
    });
    // 同一站不同線（或同線的支線）之間轉乘
    const at = {};
    for (const n of Object.keys(graph)) (at[n.split('|')[0]] = at[n.split('|')[0]] || []).push(n);
    for (const list of Object.values(at)) for (const a of list) for (const b of list) if (a !== b) graph[a].push([b, 3]);
  }
  const cache = {};
  function route(from, to) {
    if (!from || !to || from === to || !STATIONS[from] || !STATIONS[to]) return null;
    const key = from + '>' + to; if (cache[key] !== undefined) return cache[key];
    if (!graph) build();
    const dist = {}, prev = {}, done = new Set(), open = [];
    for (const n of Object.keys(graph)) if (n.startsWith(from + '|')) { dist[n] = 0; open.push(n); }
    let end = null;
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (dist[open[i]] < dist[open[bi]]) bi = i;
      const u = open.splice(bi, 1)[0]; if (done.has(u)) continue; done.add(u);
      if (u.startsWith(to + '|')) { end = u; break; }
      for (const [v, w] of graph[u]) { const d = dist[u] + w; if (dist[v] == null || d < dist[v]) { dist[v] = d; prev[v] = u; open.push(v); } }
    }
    if (!end) return (cache[key] = null);
    const path = []; for (let n = end; n; n = prev[n]) path.unshift(n);
    // 把同一條（支）線連續的站合成一段
    const legs = [];
    for (const n of path) {
      const [st, line, ri] = n.split('|'), last = legs[legs.length - 1];
      if (last && last.line === line && last.ri === +ri) { last.stops.push(st); continue; }
      if (last && last.stops.length < 2) legs.pop();   // 只是在同一站換月台
      legs.push({ line, ri: +ri, stops: [st] });
    }
    const out = legs.filter(l => l.stops.length > 1).map(l => {
      const ids = LINES[l.line].routes[l.ri].map(r => r[0]), a = ids.indexOf(l.stops[0]), b = ids.indexOf(l.stops[l.stops.length - 1]);
      return { line: l.line, from: l.stops[0], to: l.stops[l.stops.length - 1], toward: b > a ? ids[ids.length - 1] : ids[0], n: l.stops.length - 1 };
    });
    return (cache[key] = { legs: out, stops: out.reduce((a, l) => a + l.n, 0), km: Economy.distance(from, to), fare: Economy.fare(from, to) });
  }

  /* ── 樓層 ── */
  function floors(L) {
    L = L || World.layout; if (!L) return null;
    if (L._floors) return L._floors;
    const under = L.platforms.filter(P => P.under).sort((a, b) => b.y - a.y), el = L.platforms.filter(P => !P.under).sort((a, b) => a.y - b.y);
    const hall = under.length && !el.length ? 'B1' : '1F', byK = {};
    under.forEach((P, i) => { byK[P.k] = 'B' + (i + (hall === 'B1' ? 2 : 1)); });
    el.forEach((P, i) => { byK[P.k] = (i + 2) + 'F'; });
    return (L._floors = { hall, byK });
  }
  function floorOf(z) {
    const f = floors(); if (!f || !z) return '';
    if ((z.kind === 'platform' || z.kind === 'train') && z.P) return f.byK[z.P.k];
    if (z.kind === 'concourse' || z.kind === 'unpaid') return f.hall;
    return '';
  }
  const termName = (P, side) => { const d = P.sides[side] && P.sides[side][0]; return d ? MRT.label(d.terminal, P.line).zh : ''; };
  // 資訊框標題用：「B2 淡水信義線月台」
  function floorChip(z) {
    const fl = floorOf(z);
    if (z.kind === 'ramp') return '<span class="floor-chip ramp">⇅</span>';
    return fl ? `<span class="floor-chip">${fl}</span>` : '';
  }
  // 月台上：玩家站在哪一側（+1／-1）
  const sideOf = (P, z) => (z > P.z ? 1 : -1);

  /* ── 描述一個位置在站內哪裡 ── */
  function describe(t) {
    const L = World.layout, f = floors(); if (!L || !f) return '';
    const P = L.platforms.find(P => Math.abs(t.y - P.y) < .8 && Math.abs(t.z - P.z) < 4.5);
    if (P) {
      const dx = t.x - P.x, end = Math.abs(dx) > 20 ? (dx < 0 ? '・靠電梯那一端' : '・月台另一端') : Math.abs(dx) < 9 ? '・中段' : '';
      const side = Math.abs(t.z - P.z) > .6 ? `・往${termName(P, sideOf(P, t.z))}那側` : '';
      return `${f.byK[P.k]} ${LINES[P.line].zh}月台${side}${end}`;
    }
    if (Math.abs(t.y) < .8) {
      const room = (L.rooms || []).find(r => t.x > Math.min(r.x0, r.x1) && t.x < Math.max(r.x0, r.x1) && t.z > r.z0 && t.z < r.z1);
      const area = t.z > L.gateZ + .6 ? '非付費區（閘門外）' : '大廳（閘門內）';
      if (room) return `${f.hall} ${area}・${{ toilet_m: '男廁', toilet_f: '女廁', toilet_a: '無障礙廁所', nursing: '哺集乳室', office: '站務室', store: '便利商店', onsen: '湯之庭', lab: '研究室' }[room.kind] || '房間'}裡`;
      let near = null, bd = 6;
      for (const sp of L.spots) { if (Math.abs(sp.y) > .5 || !SPOT_NAME[sp.kind]) continue; const d = Math.hypot(sp.x - t.x, sp.z - t.z); if (d < bd) { bd = d; near = sp; } }
      return `${f.hall} ${area}${near ? `・${SPOT_NAME[near.kind]}附近` : ''}`;
    }
    return '電扶梯上';
  }

  /* ── 任務指引 ── */
  const eligible = id => !!(QUESTS[id] && GUIDE_TYPES.includes(QUESTS[id].type) && !QUESTS[id].hidden);
  function guideQuest() {
    const act = S().quests.active, t = typeof trackedQuest === 'function' ? trackedQuest() : null;
    if (t && act[t] && eligible(t)) return t;
    const order = ['main', 'timed', 'weekly', 'event', 'side', 'daily'];
    return Object.keys(act).filter(eligible).sort((a, b) => order.indexOf(QUESTS[a].type) - order.indexOf(QUESTS[b].type))[0] || null;
  }
  const VISIBLE = ['note', 'giver', 'story', 'storyLocked', 'suspect', 'friend', 'lost', 'coin'];
  const nearestSt = list => { const here = S().current; return list.slice().sort((a, b) => Economy.distance(here, a) - Economy.distance(here, b))[0]; };
  // 目前這一步要去哪一站、在這一站的哪裡（exact：可以用羅盤精確標出；hidden：謎題要自己找，只給區域）
  function target(id) {
    const q = QUESTS[id], st = S().quests.active[id], step = q && q.steps[st.step]; if (!step) return null;
    const g = step.goal || {}, L = World.layout, here = L && L.stationId;
    const v = x => (typeof x === 'string' && x[0] === '@' ? st[x.slice(1)] : x);
    let station = g.station != null ? v(g.station) : g.npc && NPCS[g.npc] ? npcStation(NPCS[g.npc]) : null;
    if (Array.isArray(station)) station = station.includes(here) ? here : nearestSt(station);
    const out = { q, step, station, pts: [], hidden: false };
    // 主線：沿線每一站的委託
    if (g.kind === 'puzzles' && g.line) {
      const left = Puzzles.mainStations(g.line).filter(x => !(st.solved && st.solved[x]));
      out.station = left.includes(here) ? here : nearestSt(left) || null;
      out.left = left.length;
    }
    if (!L || (out.station && out.station !== here)) return out;
    const add = (p, label) => p && out.pts.push({ x: p.x, y: p.y || 0, z: p.z, label });
    // 主線委託（紙條、委託人、零錢、走失的東西……）；隱藏的謎題只給區域
    if (q.type === 'main' && q.line) {
      const f = S().flags.follow;
      if (f && f.line === q.line && f.station === here) {
        const c = Puzzles.challenge(f.line, f.station);
        const sp = c && c.spot && L.spots.find(x => x.kind === c.spot && (c.spot !== 'elevator' || x.level === 'hall'));
        if (sp) add(sp, '要帶他去的地方');
      }
      for (const e of Challenges.ents) {
        if (e.line !== q.line || (e.station && e.station !== here)) continue;
        if (VISIBLE.includes(e.type)) add(e, e.type === 'coin' ? '零錢' : '委託');
        else if (e.type === 'hidden' || e.type === 'storyHidden') { out.hidden = true; out.pts.push({ x: e.x, y: e.y, z: e.z, hidden: true }); }
      }
      const so = (S().story || {})[q.line];
      if (so && so.escape) add(L.spots.find(x => x.kind === 'office'), '站務室');
    }
    if (g.kind === 'find' && g.item) for (const it of Pickups.items) if (it.item === g.item) add(it, ITEMS[g.item].name);
    if ((g.kind === 'talk' || g.kind === 'give') && g.npc) { const n = NPCManager.list.find(n => n.id === g.npc); if (n) add(n, NPCS[g.npc].name); }
    if (g.kind === 'inspect' && g.spot) add(L.spots.find(x => x.kind === g.spot), SPOT_NAME[g.spot]);
    if (g.kind === 'buy') {
      const kinds = ['vending', 'shop', 'cafe', 'breakfast'], p = World.player;
      const sp = L.spots.filter(x => kinds.includes(x.kind)).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
      add(sp, sp && SPOT_NAME[sp.kind]);
    }
    if ((g.kind === 'ride' || g.kind === 'terminal') && g.line) { const P = L.platforms.find(P => P.line === g.line); if (P) add(P, `${LINES[g.line].zh}月台`); }
    if (g.kind === 'handin' && L.lab) add({ x: L.lab.x, y: 0, z: L.lab.z }, '傳送裝置');
    return out;
  }
  // 依目前位置排：先給同一層、近的
  function bestPt(t) {
    const p = World.player; if (!t || !t.pts.length) return null;
    return t.pts.slice().sort((a, b) => (Math.abs(a.y - p.y) - Math.abs(b.y - p.y)) * 50 + Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
  }
  function legsHtml(r, from) {
    const f = floors();
    return r.legs.map((l, i) => {
      const P = i === 0 && from === S().current && World.layout && World.layout.platforms.find(P => P.line === l.line);
      return `<li>${i === 0 ? (P ? `到 <b>${f.byK[P.k]}</b> ` : '') + '搭' : `在 <b>${esc2(l.from)}</b> 轉乘`} ${chip(l.line)} ${LINES[l.line].zh}（往 ${esc2(MRT.label(l.toward, l.line).zh)}），坐 ${l.n} 站到 <b>${esc2(l.to)}</b></li>`;
    }).join('');
  }
  const enabled = () => !!S().flags.navGuide && !(typeof FogCity !== 'undefined' && FogCity.locked());
  // 資訊框裡的一行指引
  function panelHtml() {
    if (!enabled() || !World.layout) return '';
    const id = guideQuest(); if (!id) return '';
    const t = target(id), here = World.layout.stationId; if (!t) return '';
    if (t.station && t.station !== here) {
      const r = route(here, t.station), l = r && r.legs[0];
      return `<span class="g-ico">🧭</span><span>下一步去 <b>${esc2(t.station)}</b>${l ? `：${(() => { const P = World.layout.platforms.find(P => P.line === l.line); return P ? `到 ${floors().byK[P.k]} ` : ''; })()}搭${LINES[l.line].zh}往${esc2(MRT.label(l.toward, l.line).zh)}${r.legs.length > 1 ? `，在${esc2(l.to)}轉乘` : `，坐 ${l.n} 站`}` : ''}</span>`;
    }
    const pt = bestPt(t);
    if (!pt) return `<span class="g-ico">🧭</span><span>${t.station === here ? '就在這一站，' : ''}到處看看、找人問問吧</span>`;
    if (pt.hidden) return `<span class="g-ico">🧭</span><span>謎題的答案藏在這一站（${esc2(floors().byK[(World.layout.platforms.find(P => Math.abs(P.y - pt.y) < .8) || {}).k] || floors().hall)}），要自己找</span>`;
    const mine = floorOf(World.zone()), tf = describe(pt).split(' ')[0];
    return `<span class="g-ico">🧭</span><span>${pt.label ? `${esc2(pt.label)}：` : ''}${esc2(describe(pt))}${mine && tf && /^(B\d|\dF)$/.test(tf) && mine !== tf ? `<em class="g-floor">你在 ${mine}</em>` : ''}</span>`;
  }

  /* ── 尋物羅盤：光柱＋方向箭頭 ── */
  let beacon = null, arrow = null;
  function clearBeacon() { if (beacon) { World.scene.remove(beacon.mesh); beacon = null; } if (arrow) arrow.hidden = true; }
  function makeBeacon(pt) {
    const g = new T.Group();
    const beam = new T.Mesh(new T.CylinderGeometry(.18, .32, 6, 16, 1, true), new T.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    beam.position.y = 3; g.add(beam);
    const ring = new T.Mesh(new T.RingGeometry(.45, .6, 32), new T.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: .7, depthWrite: false, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .03; g.add(ring);
    g.position.set(pt.x, pt.y, pt.z); g.renderOrder = 5;
    World.scene.add(g);
    return { mesh: g, ring, beam, pt, until: performance.now() + 120000 };
  }
  function useClue() {
    const s = S();
    if (!(s.inv.clue > 0)) return toast('<b>沒有尋物羅盤</b><span>手機「網購」可以買</span>', 'warn');
    if (typeof FogCity !== 'undefined' && FogCity.locked()) return toast('<b>羅盤的指針一直亂轉</b><span>霧裡好像不能用</span>', 'warn');
    const id = guideQuest();
    if (!id) return toast('<b>羅盤沒有反應</b><span>只對主線、支線這類任務有用（秘密任務不行）</span>');
    const t = target(id), here = World.layout.stationId;
    if (t.station && t.station !== here) return Dialog.info('🧭 尋物羅盤', `指針指向遠方：「${esc2(QUESTS[id].title)}」要去的是 <b>${esc2(t.station)}</b>。<br><small>到了那一站再用，會指出確切的位置（這次沒有消耗）。</small>`);
    const pt = bestPt(t);
    if (!pt) return Dialog.info('🧭 尋物羅盤', `「${esc2(QUESTS[id].title)}」這一步不是要找東西，羅盤幫不上忙（這次沒有消耗）。<br><small>${esc2(t.step.text.replace(/<[^>]+>/g, ''))}</small>`);
    s.inv.clue--; saveState(); updateHud(); Sound.itemGet();
    if (pt.hidden) {   // 謎題：不直接標出來，只給更明確的區域
      Dialog.info('🧭 尋物羅盤', `指針微微發熱……答案在 <b>${esc2(describe(pt))}</b>。<br><small>謎題的確切位置還是要自己找。</small>`);
      return;
    }
    clearBeacon(); beacon = makeBeacon(pt);
    toast(`<b>🧭 ${esc2(pt.label || '目標')}</b><span>${esc2(describe(pt))}・光柱和箭頭會維持兩分鐘</span>`, 'level');
  }
  function tick(now) {
    if (!beacon) return;
    if (now > beacon.until || World.riding) { clearBeacon(); return; }
    const k = .5 + Math.sin(now / 300) * .5;
    beacon.beam.material.opacity = .22 + k * .2; beacon.ring.scale.setScalar(1 + k * .25);
    if (!arrow) { arrow = document.createElement('div'); arrow.className = 'nav-arrow'; arrow.innerHTML = '<i>➤</i><b></b>'; document.getElementById('game').appendChild(arrow); }
    const p = World.player, dx = beacon.pt.x - p.x, dz = beacon.pt.z - p.z, d = Math.hypot(dx, dz), dy = beacon.pt.y - p.y;
    if (d < 1.5 && Math.abs(dy) < 1) { arrow.hidden = true; return; }
    const cam = World.camera, fwd = new T.Vector3(); cam.getWorldDirection(fwd);
    const ang = Math.atan2(dx, dz) - Math.atan2(fwd.x, fwd.z);   // 0 = 正前方
    arrow.hidden = false;
    arrow.firstChild.style.transform = `rotate(${-ang - Math.PI / 2}rad)`;
    arrow.lastChild.textContent = `${Math.round(d)} m${Math.abs(dy) > 2 ? (dy < 0 ? '・往下一層' : '・往上一層') : ''}`;
  }

  /* ── 導航視窗 ── */
  function open() {
    const L = World.layout; if (!L) return;
    const s = S(), f = floors(), z = World.zone(), here = L.stationId, mine = floorOf(z);
    const lines = MRT.linesAt(here);
    const rows = [{ fl: f.hall, y: 0, html: `<b>大廳・閘門・出入口</b><small>售票機、服務台、廁所在閘門外的非付費區；刷卡進閘門到付費區，再搭電扶梯或電梯到月台</small>` }]
      .concat(L.platforms.map(P => ({ fl: f.byK[P.k], y: P.y, html: `${chip(P.line)} <b>${LINES[P.line].zh}月台</b><small>${[1, -1].map(sd => termName(P, sd)).filter((x, i, a) => x && a.indexOf(x) === i).map(x => `往 ${esc2(x)}`).join('　｜　')}</small>` })))
      .sort((a, b) => b.y - a.y);
    const zname = { platform: '月台', train: '車廂裡', concourse: '大廳（付費區）', unpaid: '非付費區', ramp: '電扶梯' }[z.kind] || '';
    let side = '';
    if (z.kind === 'platform') side = `，你站在 <b>往 ${esc2(termName(z.P, sideOf(z.P, World.player.z)))}</b> 那一側`;
    const transfer = lines.length > 1 ? `<h4 class="bag-h">轉乘</h4><ul class="nav-list">${lines.map(l => { const P = L.platforms.find(P => P.line === l.line); const onIt = z.P && z.P.line === l.line; return `<li>${chip(l.line)} ${LINES[l.line].zh}：${onIt ? '<em>你在這裡</em>' : `到 <b>${f.byK[P.k]}</b>${z.kind === 'platform' || z.kind === 'train' ? `（先搭電扶梯回 ${f.hall} 大廳，跟著${LINES[l.line].zh}的指標走）` : '（跟著大廳的指標搭電扶梯）'}`}</li>`; }).join('')}</ul>` : '';
    const gid = guideQuest(), on = !!s.flags.navGuide, fog = typeof FogCity !== 'undefined' && FogCity.locked();
    let guide = '';
    if (on && gid && !fog) {
      const t = target(gid);
      guide = `<div class="nav-guide"><b>${esc2(QUESTS[gid].title)}</b><p>${esc2(t.step.text.replace(/<[^>]+>/g, ''))}</p>${t.station && t.station !== here ? (() => { const r = route(here, t.station); return r ? `<p>要去 <b>${esc2(t.station)}</b>（${r.stops} 站・車資 NT$ ${r.fare}）</p><ol class="nav-route">${legsHtml(r, here)}</ol>` : ''; })() : `<p>${panelHtml().replace(/<span class="g-ico">🧭<\/span>/, '')}</p>`}</div>`;
    }
    $('#navBody').innerHTML = `
      <p class="nav-here"><span class="floor-chip big">${mine || '⇅'}</span><span><b>${esc2(here)}</b>・${zname}${side}</span></p>
      <h4 class="bag-h">樓層</h4>
      <ul class="nav-floors">${rows.map(r => `<li class="${r.fl === mine ? 'here' : ''}"><span class="floor-chip">${r.fl}</span><div>${r.html}</div>${r.fl === mine ? '<em>你在這層</em>' : ''}</li>`).join('')}</ul>
      ${transfer}
      <h4 class="bag-h">任務指引</h4>
      <p class="nav-note">打開後，資訊框會告訴你目前任務要去哪一站、在站內哪一層哪一區。只有主線、支線、活動、每日／每週委託會顯示；秘密任務和隱藏任務不會出現${fog ? '；迷霧裡指引不能用' : ''}。</p>
      <button class="btn small ${on ? 'primary' : 'ghost'}" id="navToggle" aria-pressed="${on}">${on ? '🧭 指引：開' : '🧭 指引：關'}</button>
      ${guide || (on && !gid ? '<p class="nav-note">目前沒有可以指引的任務。</p>' : '')}
      <div class="nav-clue"><span>🧭 尋物羅盤 ×${s.inv.clue || 0}</span><small>找不到任務要的東西或人時用一個：會標出確切位置（謎題只給區域）。</small><button class="btn small ghost" id="navClue" ${s.inv.clue > 0 && !fog ? '' : 'disabled'}>使用</button></div>
      <h4 class="bag-h">查路線</h4>
      <div class="nav-plan"><input id="navTo" list="navStations" placeholder="輸入要去的車站" autocomplete="off"><button class="btn small primary" id="navGo">查詢</button></div>
      <datalist id="navStations">${Object.keys(STATIONS).map(x => `<option value="${esc2(x)}">`).join('')}</datalist>
      <div id="navRoute"></div>`;
    $('#navToggle').onclick = () => { s.flags.navGuide = !on; saveState(); Sound.click(); if (typeof panelCache !== 'undefined') panelCache.pGuide = null; open(); };
    $('#navClue').onclick = () => { $('#navModal').hidden = true; useClue(); };
    const go = () => {
      const to = $('#navTo').value.trim(), r = route(here, to);
      $('#navRoute').innerHTML = to === here ? '<p class="nav-note">你就在這一站。</p>' : !STATIONS[to] ? '<p class="nav-note">找不到這個車站，請從清單裡選。</p>' : r ? `<p>${esc2(here)} → <b>${esc2(to)}</b>：${r.stops} 站・約 ${Math.round(r.km * 10) / 10} 公里・車資 NT$ ${r.fare}${r.legs.length > 1 ? `・轉乘 ${r.legs.length - 1} 次` : ''}</p><ol class="nav-route">${legsHtml(r, here)}</ol>` : '<p class="nav-note">找不到路線。</p>';
    };
    $('#navGo').onclick = go; $('#navTo').onkeydown = e => { if (e.key === 'Enter') go(); };
    $('#navModal').hidden = false;
  }

  // 第一次：送三個尋物羅盤
  function onStation() {
    clearBeacon();
    const s = S(); if (!s || s.flags.navGift) return;
    s.flags.navGift = true; s.inv.clue = (s.inv.clue || 0) + 3; saveState();
    setTimeout(() => toast('<b>🧭 新功能：站內導航</b><span>點資訊框上的 🧭 看樓層、月台方向和轉乘；送你 3 個尋物羅盤</span>', 'level'), 2500);
  }
  return { route, floors, floorOf, floorChip, describe, panelHtml, guideQuest, target, useClue, tick, open, onStation, sideOf, termName, clearBeacon };
})();

Object.assign(ITEMS, {
  clue: { name: '尋物羅盤', desc: '找不到任務要的東西或人時使用：在站內標出確切位置兩分鐘（只對主線、支線這類任務有用；謎題只會給區域）。', icon: '🧭', cat: 'use', price: 80, shop: true },
});
