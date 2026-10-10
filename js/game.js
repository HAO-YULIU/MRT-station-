/* 迷霧：遊戲主流程 */
const SAVE_KEY = 'mist-mrt-save-v1';
const START_STATION = '南港展覽館';   // 遊戲起點

const Game = {
  state: null,
  ride: null,          // 搭乘中的狀態
  busy: false,         // 動畫進行中，暫停操作
  service: null,       // open / mist
};

/* ── 存檔 ── */
function newState() {
  return {
    char: null, start: null, current: null, items: {}, visited: {}, rides: 0,
    money: 500, xp: 0, inv: {}, quests: { active: {}, done: {} }, trip: null, friends: {}, linesMet: {}, flags: {},
  };
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s === 'object') { const d = newState(), m = { ...d, ...s }; m.quests = { ...d.quests, ...(s.quests || {}) }; return m; }
  } catch (e) { /* 無存檔 */ }
  return newState();
}
function saveState() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(Game.state)); } catch (e) { /* 無法存檔時仍可遊玩 */ } }
Game.state = loadState();

/* ── 小工具 ── */
const $ = (sel, root = document) => root.querySelector(sel);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOut: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
function animate(dur, fn, e = ease.inOut) {
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      fn(e(t), t);
      t < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.dataset.screen = id;
}

function lineChip(lid, code) {
  const L = LINES[lid];
  return `<span class="chip" style="--c:${L.color};--t:${L.text}">${code || lid}</span>`;
}

/* ── 物品圖示 ── */
function itemIcon(type, color, size = 64) {
  const body = {
    gear: `<circle cx="32" cy="32" r="13" fill="none" stroke="${color}" stroke-width="7"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="29" y="6" width="6" height="11" rx="1.5" fill="${color}" transform="rotate(${a} 32 32)"/>`).join('')}`,
    ticket: `<rect x="8" y="16" width="48" height="32" rx="5" fill="${color}"/><rect x="14" y="22" width="20" height="5" rx="2" fill="#fff" opacity=".85"/><rect x="14" y="31" width="30" height="3" rx="1.5" fill="#fff" opacity=".6"/><circle cx="46" cy="38" r="5" fill="#fff" opacity=".7"/>`,
    leaf: `<path d="M12,52 C12,24 30,10 54,10 C54,36 40,52 12,52 Z" fill="${color}"/><path d="M14,50 C26,38 36,28 48,16" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>`,
    watch: `<rect x="27" y="4" width="10" height="7" rx="2" fill="${color}"/><circle cx="32" cy="36" r="22" fill="${color}"/><circle cx="32" cy="36" r="16" fill="#fff8e6"/><path d="M32,36 L32,24 M32,36 L39,40" stroke="#3a2a00" stroke-width="3" stroke-linecap="round"/>`,
    key: `<circle cx="20" cy="32" r="12" fill="none" stroke="${color}" stroke-width="7"/><path d="M31,32 H56 M48,32 V42 M56,32 V40" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`,
    ring: `<circle cx="32" cy="32" r="21" fill="none" stroke="${color}" stroke-width="8"/><circle cx="32" cy="32" r="21" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 9" opacity=".8"/><circle cx="32" cy="11" r="4" fill="#fff"/>`,
  }[type];
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

/* ── HUD ── */
function updateHud() {
  const t = TaipeiTime.now();
  $('#hudTime').textContent = TaipeiTime.clock(t);
  $('#hudDate').textContent = TaipeiTime.date(t);
  const s = Game.state;
  // 原本的「營運中」改放等級、經驗與新台幣
  const lv = Economy.levelInfo(s.xp || 0);
  const left = TaipeiTime.state(t) === 'open' ? TaipeiTime.minutesToLastTrain(t) : null;
  $('#hudStats').innerHTML = `<span class="lv">Lv ${lv.lv}</span><span class="xpbar"><i style="width:${Math.round(lv.cur / lv.need * 100)}%"></i></span><span class="money">NT$ ${s.money}</span>${left != null && left <= 30 ? `<span class="last">末班車剩 ${left} 分</span>` : ''}`;
  if (s.char) {
    $('#hudName').textContent = CHARACTERS[s.char].name;
    if ($('#hudAvatar').dataset.c !== s.char) { $('#hudAvatar').dataset.c = s.char; $('#hudAvatar').innerHTML = `<img class="avatar" src="${Human3D.snapshot(s.char, 'head')}" alt="">`; }
  }
  $('#hudWhere').textContent = s.current ? s.current : '尚未出發';
  $('#hudItems').textContent = `${Object.keys(s.items).length}/6`;
  $('#hudQuests').textContent = Object.keys(s.quests.active).length;
}

function onServiceChange(st) {
  Game.service = st;
  if (st === 'open') { $('#closedOverlay').hidden = true; return; }
  if (Game.ride) { Game.ride.mustAlight = true; return; }   // 搭乘中：到下一站再處理
  if (document.body.dataset.screen === 'game') showClosed();
}

function showClosed() {
  const st = TaipeiTime.state();
  const ov = $('#closedOverlay');
  ov.dataset.s = st;
  const mins = TaipeiTime.minutesToFirstTrain();
  if (st === 'mist') {
    $('#closedTitle').textContent = '迷霧時刻';
    $('#closedRange').textContent = '00:30 – 06:00';
    $('#closedBody').textContent = `末班車已經開走了。整座城市被霧吞沒的這段時間，會有不一樣的玩法——即將開放。首班車 06:00，還有 ${mins} 分鐘。`;
  } else {
    $('#closedTitle').textContent = '車站尚未開放';
    $('#closedRange').textContent = '05:30 – 06:00';
    $('#closedBody').textContent = `霧正在散去。首班車 06:00 發車，還有 ${mins} 分鐘。`;
  }
  ov.hidden = false;
}

/* ── 提示框、獎勵 ── */
function toast(html, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.innerHTML = html;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3800);
}
Game.reward = (r = {}, label = '') => {
  const s = Game.state, parts = [];
  const before = Economy.levelInfo(s.xp).lv;
  if (r.money) { s.money += r.money; parts.push(`NT$ +${r.money}`); }
  if (r.xp) { s.xp += r.xp; parts.push(`經驗 +${r.xp}`); }
  for (const [id, n] of Object.entries(r.items || {})) { s.inv[id] = (s.inv[id] || 0) + n; parts.push(`${ITEMS[id].icon} ${ITEMS[id].name}`); }
  for (const [id, n] of Object.entries(r.friend || {})) s.friends[id] = (s.friends[id] || 0) + n;
  saveState(); updateHud();
  if (label || parts.length) { toast(`<b>${label}</b>${parts.length ? `<span>${parts.join('　')}</span>` : ''}`, 'reward'); Sound.itemGet(); }
  const after = Economy.levelInfo(s.xp).lv;
  if (after > before) setTimeout(() => { toast(`<b>升級！Lv ${after}</b>`, 'level'); Sound.itemGet(); }, 900);
};
Game.onQuestChange = (what, id) => {
  const q = QUESTS[id];
  if (what === 'accept') toast(`<b>接下任務</b><span>${q.title}</span>`);
  updateHud();
};
// 任務事件：完成某步驟時提示
function questEvent(ev) {
  for (const d of Quests.emit(ev)) if (Game.state.quests.active[d.id]) toast(`<b>${QUESTS[d.id].title}</b><span>✓ ${d.text}</span>`);
}

function openQuests() {
  const s = Game.state, act = s.quests.active;
  const card = id => {
    const q = QUESTS[id], st = act[id];
    const tag = { main: '主線', side: '支線', event: '活動' }[q.type];
    return `<li class="quest q-${q.type}">
      <div class="q-head"><span class="q-tag"${q.line ? ` style="--c:${LINES[q.line].color}"` : ''}>${q.line ? q.line + ' ' : ''}${tag}</span><b>${q.title}</b></div>
      <p>${q.desc}</p>
      <ol>${q.steps.map((p, i) => `<li class="${i < st.step ? 'ok' : i === st.step ? 'now' : ''}">${p.text}</li>`).join('')}</ol>
      <div class="q-reward">報酬：${[q.reward.money && `NT$ ${q.reward.money}`, q.reward.xp && `經驗 ${q.reward.xp}`, ...Object.keys(q.reward.items || {}).map(i => ITEMS[i].name)].filter(Boolean).join('、')}</div>
      ${q.type === 'side' ? `<button class="btn ghost small" data-abandon="${id}">放棄</button>` : ''}
    </li>`;
  };
  const ids = Object.keys(act);
  const order = ['main', 'event', 'side'];
  ids.sort((a, b) => order.indexOf(QUESTS[a].type) - order.indexOf(QUESTS[b].type));
  const done = Object.keys(s.quests.done).filter(id => QUESTS[id]);
  $('#questCount').textContent = `支線 ${Quests.sideCount()} / ${SIDE_LIMIT}`;
  $('#questBody').innerHTML = `
    ${ids.length ? `<ul class="quests">${ids.map(card).join('')}</ul>` : '<p class="empty-q">目前沒有任務。到處和人說話，看看誰需要幫忙。</p>'}
    ${done.length ? `<h4 class="q-done-h">已完成</h4><ul class="q-done">${done.map(id => `<li>${QUESTS[id].title}</li>`).join('')}</ul>` : ''}`;
  $('#questBody').onclick = e => { const b = e.target.closest('[data-abandon]'); if (b && confirm(`放棄「${QUESTS[b.dataset.abandon].title}」？`)) { Quests.abandon(b.dataset.abandon); openQuests(); } };
  $('#questLog').hidden = false;
}

/* ── 進出站扣款 ── */
function onGate(side) {
  const s = Game.state, here = ctl ? ctl.stationId : s.current;
  if (side < 0) {                     // 進站
    if (s.money < 20) { toast('<b>餘額不足</b><span>至少要 NT$ 20 才能進站</span>', 'warn'); return false; }
    s.trip = { from: here }; saveState();
    toast(`<b>進站</b><span>${esc(here)}</span>`);
    return true;
  }
  // 出站：依進站站與出站站的距離扣款
  const from = s.trip ? s.trip.from : here;
  const fare = Economy.fare(from, here);
  s.money -= fare; s.trip = null; saveState(); updateHud();
  toast(`<b>出站扣款 NT$ ${fare}</b><span>${esc(from)} → ${esc(here)}　餘額 NT$ ${s.money}</span>`, s.money < 0 ? 'warn' : '');
  return true;
}

/* ── 標題畫面 ── */
function renderTitle() {
  const s = Game.state;
  const lines = MRT.segments().map(g => `<line x1="${STATIONS[g.a].x}" y1="${STATIONS[g.a].y}" x2="${STATIONS[g.b].x}" y2="${STATIONS[g.b].y}" stroke="${LINES[g.line].color}" stroke-width="6" stroke-linecap="round"/>`).join('');
  $('#titleMap').innerHTML = `<svg viewBox="20 10 1000 930" preserveAspectRatio="xMidYMid slice">${lines}</svg>`;
  const hasSave = s.char && s.current;
  $('#titleActions').innerHTML = hasSave
    ? `<button class="btn primary" id="btnContinue">繼續旅程<small>${CHARACTERS[s.char].name}・目前在 ${s.current}</small></button>
       <button class="btn ghost" id="btnNew">重新開始</button>`
    : `<button class="btn primary" id="btnStart">開始</button>`;
  const go = () => { Sound.unlock(); goFullscreen(); renderCharSelect(); showScreen('charSelect'); };
  $('#btnStart') && ($('#btnStart').onclick = go);
  $('#btnNew') && ($('#btnNew').onclick = () => {
    if (!confirm('重新開始會清除目前的進度與收集到的物品，確定嗎？')) return;
    Game.state = newState(); saveState(); go();
  });
  $('#btnContinue') && ($('#btnContinue').onclick = () => { Sound.unlock(); goFullscreen(); enterGame(s.current); });
}

/* ── 選角色 ── */
function renderCharSelect() {
  let pick = Game.state.char;
  const wrap = $('#charCards');
  wrap.innerHTML = Object.values(CHARACTERS).map(c => `
    <button class="char-card${pick === c.id ? ' on' : ''}" data-id="${c.id}" aria-pressed="${pick === c.id}">
      <div class="char-stage"><img class="char-img" src="${Human3D.snapshot(c.id, 'full')}" alt="${c.name}" draggable="false"></div>
      <div class="char-info">
        <div class="char-name">${c.name}<span>${c.en}</span></div>
        <div class="char-meta">${c.gender}　${c.age} 歲　${c.role}</div>
        <p>${c.bio}</p>
      </div>
    </button>`).join('');
  const confirmBtn = $('#charConfirm');
  const sync = () => {
    wrap.querySelectorAll('.char-card').forEach(b => { b.classList.toggle('on', b.dataset.id === pick); b.setAttribute('aria-pressed', b.dataset.id === pick); });
    confirmBtn.disabled = !pick;
    confirmBtn.textContent = pick ? `以${CHARACTERS[pick].name}從南港展覽館出發` : '選一位主角';
  };
  wrap.onclick = e => { const b = e.target.closest('.char-card'); if (!b) return; Sound.click(); pick = b.dataset.id; sync(); };
  confirmBtn.onclick = () => {
    // 每一位玩家都從南港展覽館出發
    const s = Game.state;
    Object.assign(s, newState(), { char: pick, start: START_STATION, current: START_STATION, visited: { [START_STATION]: true }, trip: { from: START_STATION } });
    saveState();
    enterGame(START_STATION);
  };
  sync();
}

/* ── 遊戲場景容器（3D） ── */
const sceneEl = () => $('#scene');
const DWELL = 20;   // 停站開門秒數
let worldReady = false;

function layoutScene() {
  document.body.style.setProperty('--hud-h', $('.hud').offsetHeight + 'px');
}
function ensureWorld() {
  if (worldReady) return;
  World.init(sceneEl());
  World.bindJoystick($('#joystick'));
  World.onGate = onGate;
  worldReady = true;
}
function enterGame(stationId) {
  if (document.activeElement) document.activeElement.blur();
  showScreen('game');
  layoutScene();
  ensureWorld();
  World.setCharacter(Game.state.char);
  buildPanel();
  updateHud();
  if (TaipeiTime.state() !== 'open') showClosed();
  World.loadStation(stationId);
  World.spawnInConcourse();
  Game.state.current = stationId; Game.state.visited[stationId] = true; saveState();
  startStation(stationId);
}

// 手機：開始遊戲時進入全螢幕（直式、橫式都可以玩）
function goFullscreen() {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req && !document.fullscreenElement) { try { const p = req.call(el); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 不支援全螢幕 */ } }
}

// 每次換站都開新的 session，舊的非同步流程看到 session 不同就停止
let session = 0;
const newSession = () => ++session;
const alive = id => id === session;

function fmtEta(sec) {
  if (sec == null) return '今日已無班次';
  if (sec <= 10) return '即將進站';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/* ── 小資訊框（畫面左下角） ── */
function buildPanel() {
  $('#panel').innerHTML = `<div class="mini">
      <div class="mini-title" id="pTitle"></div>
      <div class="mini-rows" id="pRows"></div>
      <div class="mini-hint" id="pHint"></div>
      <div class="mini-btns" id="pBtns"></div>
    </div>`;
}
const panelCache = {};
function setPart(id, html) { if (panelCache[id] !== html) { panelCache[id] = html; $('#' + id).innerHTML = html; } }

/* ── 車站控制：各月台兩側依 3 分鐘班距自動進車 ── */
let ctl = null;
function startStation(stationId, carry) {
  const id = newSession();
  clearInterval(Game.ctlTimer);
  ctl = { id, stationId, busy: new Set(), chimed: new Set(), doors: new Map() };
  if (carry) ctl.busy.add(carry.key);
  World.onZone = () => tickStation();
  Sound.ambience(World.layout.allUnder ? 'underground' : 'elevated');
  Game.ctlTimer = setInterval(tickStation, 400);
  doorInteractions();
  tickStation();
}
const trackKey = (k, side) => `${k}:${side}`;
function sideDirs(P, side) {
  const dirs = P.sides[side];
  // 終點站兩側開往同一方向：兩側錯開半個班距
  const dup = P.sides[1] === P.sides[-1] || (P.sides[1][0] && P.sides[-1][0] && P.sides[1][0].terminal === P.sides[-1][0].terminal);
  return dirs.map(d => {
    let eta = TaipeiTime.nextTrainIn(ctl.stationId, d.line, d.terminal);
    if (eta != null && dup && side < 0) eta = (eta + 90) % TaipeiTime.HEADWAY;
    return { ...d, eta };
  }).sort((a, b) => (a.eta ?? 1e9) - (b.eta ?? 1e9));
}

function tickStation() {
  if (!ctl) return;
  const id = ctl.id, L = World.layout, z = World.zone();
  const open = TaipeiTime.state() === 'open';
  // 玩家所在的月台：兩側 LED 更新，並安排進站
  const P = z.P && !Game.ride ? z.P : null;
  if (P) {
    for (const side of [-1, 1]) {
      const dirs = sideDirs(P, side);
      World.setLed(P.k, side, dirs.map(d => ({ text: '往 ' + MRT.label(d.terminal, d.line).zh, eta: open ? fmtEta(d.eta) : '--' })));
      const key = trackKey(P.k, side);
      if (!open || ctl.busy.has(key) || !dirs[0] || dirs[0].eta == null) continue;
      const d = dirs[0];
      if (d.eta <= 12 && !ctl.chimed.has(key)) {
        ctl.chimed.add(key);
        Sound.arrivalChime(d.line);
        const t = MRT.label(d.terminal, d.line);
        setTimeout(() => alive(id) && Sound.announce(`往${t.zh}的列車即將進站，請勿超越月台警戒線。`, `The train to ${t.en} is now arriving.`), 4200);
      }
      if (d.eta <= 7 || (ctl.chimed.has(key) && d.eta > 170)) {
        ctl.busy.add(key);
        trainCycle(P.k, side, d, id);
      }
    }
  }
  renderPanel(z, L);
}

function renderPanel(z, L) {
  const st = ctl.stationId, lines = MRT.linesAt(st);
  const head = `${lines.map(l => lineChip(l.line, l.code)).join('')}<b>${esc(st)}</b>`;
  if (Game.ride && Game.ride.moving) return;   // 行駛中由搭乘流程顯示
  let rows = '', hint = '';
  if (z.kind === 'platform' || (z.kind === 'train' && !Game.ride)) {
    const P = z.P;
    const ln = `${lineChip(P.line)} ${LINES[P.line].zh}月台`;
    rows = [-1, 1].map(side => {
      const d = sideDirs(P, side)[0];
      return d ? `<div class="mini-row"><span>往 ${esc(MRT.label(d.terminal, d.line).zh)}</span><b>${TaipeiTime.state() === 'open' ? fmtEta(d.eta) : '--'}</b></div>` : '';
    }).join('');
    setPart('pTitle', `${head}<span class="mini-sub">${ln}</span>`);
    hint = z.kind === 'train' ? '在車廂裡，車門關上就會出發' : (lines.length > 1 ? '搭電扶梯上大廳可以轉乘' : '走到月台哪一側，就搭往那個方向的車');
  } else if (z.kind === 'concourse') {
    setPart('pTitle', `${head}<span class="mini-sub">大廳</span>`);
    hint = lines.length > 1 ? `跟著指標走：${lines.map(l => LINES[l.line].zh).join('、')}月台` : '跟著指標搭電扶梯到月台';
  } else if (z.kind === 'unpaid') {
    setPart('pTitle', `${head}<span class="mini-sub">非付費區</span>`);
    hint = '刷卡進閘門才能到月台';
  } else if (z.kind === 'ramp') {
    setPart('pTitle', `${head}<span class="mini-sub">電扶梯</span>`);
  }
  setPart('pRows', rows);
  if (!ctl.doorHint) setPart('pHint', hint);
}

// 一班列車：進站 → 開門停站 → 關門 → 玩家在車上就出發，不在就離站
async function trainCycle(k, side, dir, id) {
  const tr = World.spawnTrain(k, side, dir.line, dir.travel);
  await World.trainArrive(tr);
  if (!alive(id)) return;
  await dwell(tr, dir, id, null);
}

function doorInteractions() {
  const list = [];
  for (const [tr, info] of ctl.doors) {
    list.push({
      id: 'board' + info.n, label: '上車',
      when: p => p.zone.kind === 'platform' && p.zone.P === tr.P && Math.sign(p.z - tr.P.z) === tr.side && Math.abs(p.z - tr.P.z) > 1 && Math.abs(World.nearestDoor(tr, p.x) - p.x) < 1,
      run: () => { const d = World.nearestDoor(tr, World.player.x); Sound.click(); World.walkPath([{ x: d, z: tr.P.z + tr.side * 2.4 }, { x: d, z: tr.P.z + tr.side * (Station3D.TRACK - .2) }]); },
    });
    list.push({
      id: 'alight' + info.n, label: '下車',
      when: p => p.zone.kind === 'train' && p.zone.train === tr && Math.abs(World.nearestDoor(tr, p.x) - p.x) < 1,
      run: () => { const d = World.nearestDoor(tr, World.player.x); Sound.click(); World.walkPath([{ x: d, z: tr.P.z + tr.side * 3.6 }, { x: d, z: tr.P.z + tr.side * 1.6 }]); },
    });
  }
  list.push(exitInteraction());
  World.setInteractions(list);
}
let doorSeq = 0;

async function dwell(tr, dir, id, ride) {
  const key = trackKey(tr.P.k, tr.side);
  Sound.doorOpen();
  await World.setDoors(tr, true);
  if (!alive(id)) return;
  ctl.doors.set(tr, { n: ++doorSeq });
  doorInteractions();
  const isTerminal = ride && ride.idx >= ride.stops.length;
  const mustAlight = ride && (isTerminal || ride.mustAlight || TaipeiTime.state() !== 'open');
  const t = MRT.label(dir.terminal, dir.line);
  const end = performance.now() + DWELL * 1000;
  // 停站：倒數，或（終點站）等玩家下車
  for (;;) {
    await sleep(250);
    if (!alive(id)) return;
    const inside = World.isInside(tr), left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
    const near = inside || (World.zone().P === tr.P);
    if (!near && ctl.doorHint === tr) { ctl.doorHint = false; setPart('pHint', ''); }
    if (near) {
      ctl.doorHint = tr;
      if (inside && ride && mustAlight) setPart('pHint', `<span class="tag">${isTerminal ? '終點站，請下車' : '今日營運已結束，請下車'}</span>`);
      else if (inside && ride) setPart('pHint', `車門開啟 ${left} 秒・走出車門下車，留在車上開往 ${esc(MRT.label(ride.stops[ride.idx], ride.line).zh)}`);
      else setPart('pHint', `往 ${esc(t.zh)} 車門開啟 ${left} 秒・走進車門上車`);
    }
    if (mustAlight) { if (!inside) break; continue; }
    if (left <= 0) break;
  }
  if (ctl.doorHint === tr) ctl.doorHint = false;
  // 關門
  Sound.doorClose();
  await sleep(1900); if (!alive(id)) return;
  ctl.doors.delete(tr); doorInteractions();
  World.clearDoorway(tr);
  await World.setDoors(tr, false);
  if (!alive(id)) return;
  if (World.isInside(tr) && !mustAlight) {
    // 玩家在車上：出發
    const r = ride || { line: dir.line, terminal: dir.terminal, stops: dir.stops, idx: 0, from: ctl.stationId };
    return doRide(tr, r);
  }
  if (ride) { Game.ride = null; }
  await World.trainDepart(tr);
  if (!alive(id)) return;
  ctl.busy.delete(key); ctl.chimed.delete(key);
}

/* ── 搭乘 ── */
function setLcd(head, stationId, line) {
  const n = MRT.label(stationId, line), L = LINES[line];
  World.setLcd(head, n.zh, n.en, L.color, L.text);
}
async function doRide(tr, ride) {
  newSession(); clearInterval(Game.ctlTimer);
  Game.ride = ride; ride.moving = true;
  World.setInteractions([]);
  const to = ride.stops[ride.idx], line = ride.line;
  const fullList = [ride.from, ...ride.stops];
  World.setStrip(line, fullList, ride.idx + 1);
  setLcd('下一站 Next Station', to, line);
  const n = MRT.label(to, line);
  const isTerminal = ride.idx === ride.stops.length - 1;
  const transfers = MRT.linesAt(to).filter(l => l.line !== line).map(l => LINES[l.line].zh);
  let skip = false;
  setPart('pTitle', `${lineChip(line)}<b>往 ${esc(MRT.label(ride.terminal, line).zh)}</b>`);
  setPart('pRows', `<div class="mini-row"><span>下一站</span><b>${esc(n.zh)}</b></div>`);
  setPart('pHint', transfers.length ? `可轉乘 ${transfers.join('、')}` : '');
  setPart('pBtns', '<button class="btn small ghost" id="skipBtn">略過行駛</button>');
  $('#skipBtn').onclick = () => { skip = true; };
  Sound.announce(
    `下一站，${n.zh}。${isTerminal ? '本列車終點站。' : ''}${transfers.length ? `轉乘${transfers.join('、')}的旅客，請在本站換車。` : ''}`,
    `Next station, ${n.en}.${transfers.length ? ' Transfer station.' : ''}`, { chime: true });
  Sound.ambience(null);
  Sound.startRumble();
  await World.ride(tr, { toId: to, duration: reduceMotion() ? 4 : 22, onSpeed: v => Sound.setSpeed(v), skip: () => skip });
  Sound.stopRumble();
  setPart('pBtns', '');
  ride.moving = false;
  // 到站
  ride.idx++;
  const s = Game.state;
  s.visited[to] = true; s.current = to; s.rides++;
  saveState(); updateHud();
  questEvent({ kind: 'ride', line, station: to });
  startStation(to, { key: trackKey(tr.P.k, tr.side) });
  const id = ctl.id;
  World.setStrip(line, fullList, ride.idx);
  setLcd(isTerminal ? '終點站 Terminal' : '本站 This Stop', to, line);
  Sound.announce(isTerminal ? `${n.zh}到了，本列車終點站，請全部旅客下車。` : `${n.zh}到了。`, `${n.en}.`, { chime: true });
  await sleep(1200); if (!alive(id)) return;
  // 終點站：獲得該路線的物品
  if (MRT.terminals(line).has(to) && !s.items[line]) {
    s.items[line] = { at: to, time: `${TaipeiTime.date()} ${TaipeiTime.clock()}` };
    saveState(); updateHud();
    World.setInput(false);
    await showItemGet(line);
    World.setInput(true);
    if (!alive(id)) return;
  }
  if (TaipeiTime.state() !== 'open') ride.mustAlight = true;
  const dir = { line, terminal: ride.terminal, stops: ride.stops.slice(ride.idx), travel: tr.travel };
  await dwell(tr, dir, id, ride);
  if (!World.isInside(tr)) { Game.ride = null; if (TaipeiTime.state() !== 'open') showClosed(); }
}

// 出口（地面世界之後開放）
function exitInteraction() {
  return {
    id: 'exit', label: '出站',
    when: p => p.zone.kind === 'unpaid' && p.z > World.layout.unpaid.z1 - 2.2,
    run: () => { setPart('pHint', '<span class="tag warn">地面世界尚未開放</span>'); Sound.click(); },
  };
}

/* ── 物品 ── */
function showItemGet(line) {
  const L = LINES[line], it = L.item;
  Sound.itemGet();
  const ov = $('#itemOverlay');
  ov.innerHTML = `<div class="item-card" style="--c:${L.color}" role="dialog" aria-modal="true" aria-labelledby="itemName">
    <div class="item-line">${lineChip(line)}${L.zh}　坐到終點了</div>
    <div class="item-icon">${itemIcon(it.icon, L.color, 120)}</div>
    <h2 id="itemName">${it.name}</h2>
    <p>${it.desc}</p>
    <div class="item-count">已收集 ${Object.keys(Game.state.items).length} / 6</div>
    <button class="btn primary" id="itemOk">收進背包</button>
  </div>`;
  ov.hidden = false;
  return new Promise(res => { $('#itemOk').onclick = () => { ov.hidden = true; res(); }; $('#itemOk').focus(); });
}

function openBag() {
  const s = Game.state;
  const n = Object.keys(s.items).length;
  const inv = Object.entries(s.inv).filter(([, n]) => n > 0);
  $('#bagBody').innerHTML = `
    <div class="wallet"><span>悠遊卡餘額</span><b>NT$ ${s.money}</b></div>
    <h4 class="bag-h">物品</h4>
    ${inv.length ? `<ul class="inv">${inv.map(([id, n]) => `<li title="${esc(ITEMS[id].desc)}"><span class="ic">${ITEMS[id].icon}</span><b>${ITEMS[id].name}</b><small>×${n}</small><p>${ITEMS[id].desc}</p></li>`).join('')}</ul>` : '<p class="empty-q">背包是空的。</p>'}
    <h4 class="bag-h">路線收藏</h4>
    <ul class="slots">
      ${LINE_ORDER.map(l => {
        const L = LINES[l], got = s.items[l];
        const ends = [...MRT.terminals(l)].join('、');
        return `<li class="slot${got ? ' got' : ''}" style="--c:${L.color}">
          <div class="slot-icon">${got ? itemIcon(L.item.icon, L.color, 56) : '<span>?</span>'}</div>
          <div class="slot-text">
            <b>${got ? L.item.name : '尚未取得'}</b>
            <small>${got ? `${got.at}　${got.time}` : `${L.zh}：坐到 ${ends} 任一終點站`}</small>
          </div>
        </li>`;
      }).join('')}
    </ul>
    <div class="gate${n === 6 ? ' ready' : ''}">
      <b>迷霧之門</b>
      <p>${n === 6 ? '六件物品都到齊了。指定地點即將開放，放入物品就能打開新的地圖。' : `集齊六條路線的物品，放到指定地點，就能打開新的地圖（尚未開放）。還差 ${6 - n} 件。`}</p>
    </div>`;
  $('#bag').hidden = false;
}

function openMap() {
  $('#mapModal').hidden = false;
  const s = Game.state;
  $('#mapStats').textContent = `已走過 ${Object.keys(s.visited).length} / ${Object.keys(STATIONS).length} 站　搭乘 ${s.rides} 次`;
  $('#mapCard').hidden = true;
  $('#mapLines').innerHTML = LINE_ORDER.map(l => `<button class="ml" data-l="${l}" style="--c:${LINES[l].color};--t:${LINES[l].text}" aria-pressed="false">${l}<span>${LINES[l].zh}</span></button>`).join('');
  $('#mapLines').onclick = e => {
    const b = e.target.closest('.ml'); if (!b) return;
    const solo = Map3D.focusLine(b.dataset.l);
    document.querySelectorAll('#mapLines .ml').forEach(x => x.setAttribute('aria-pressed', x.dataset.l === solo));
  };
  Map3D.open($('#map3d'), {
    visited: s.visited, current: s.current, char: s.char, compass: $('#compassN').parentElement,
    onPick: id => {
      const lines = MRT.linesAt(id);
      const here = id === s.current, been = !!s.visited[id];
      const card = $('#mapCard');
      card.innerHTML = `<div class="here">${lines.map(l => lineChip(l.line, l.code)).join('')}<b>${esc(id)}</b></div>
        <small>${esc(STATIONS[id].en)}</small>
        <p>${here ? '你現在在這裡' : been ? '去過了，可以傳送' : '還沒去過，藏在霧裡'}${lines.length > 1 ? '　轉乘站' : ''}${lines.some(l => MRT.terminals(l.line).has(id)) ? '　終點站' : ''}</p>
        ${been && !here ? `<button class="btn primary small" id="tpBtn">傳送到這裡</button>` : ''}
        ${been && !here && Game.ride ? '<p class="warn-text">搭車中不能傳送，請先下車</p>' : ''}`;
      card.hidden = false;
      Sound.click();
      const tp = $('#tpBtn');
      if (tp) { tp.disabled = !!Game.ride; tp.onclick = () => teleport(id); }
    },
  });
}
function closeMap() { $('#mapModal').hidden = true; Map3D.close(); }

// 傳送：只能去已經到過的車站，出現在該站大廳
async function teleport(id) {
  const s = Game.state;
  if (Game.ride || !s.visited[id] || id === s.current) return;
  closeMap();
  newSession(); clearInterval(Game.ctlTimer);
  const fx = $('#tpFx'); fx.hidden = false; fx.classList.remove('out');
  Sound.teleport();
  await sleep(450);
  World.loadStation(id);
  World.spawnInConcourse();
  s.current = id; s.trip = { from: id }; saveState(); updateHud();
  startStation(id);
  fx.classList.add('out');
  await sleep(600);
  fx.hidden = true;
}

/* ── 初始化 ── */
function init() {
  renderTitle();
  showScreen('title');
  updateHud();
  Game.service = TaipeiTime.state();
  setInterval(() => {
    updateHud();
    const st = TaipeiTime.state();
    if (st !== Game.service) onServiceChange(st);
    if (!$('#closedOverlay').hidden && st !== 'open') showClosed();
    $('#titleClock').textContent = `台灣時間 ${TaipeiTime.date()} ${TaipeiTime.clockSec()}`;
  }, 1000);
  $('#titleClock').textContent = `台灣時間 ${TaipeiTime.date()} ${TaipeiTime.clockSec()}`;

  $('#btnMap').onclick = openMap;
  $('#btnBag').onclick = openBag;
  $('#btnQuest').onclick = openQuests;
  $('#runBtn').onclick = () => { const on = !World.running; World.setRun(on); $('#runBtn').setAttribute('aria-pressed', on); };
  $('#btnSound').onclick = () => { const on = Sound.toggle(); $('#btnSound').setAttribute('aria-pressed', on); $('#btnSound').textContent = on ? '音效 開' : '音效 關'; };
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { $('#' + b.dataset.close).hidden = true; });
  $('#closedMap').onclick = openMap;
  $('#closedTitleBtn').onclick = () => { $('#closedOverlay').hidden = true; newSession(); Game.ride = null; renderTitle(); showScreen('title'); };
  $('#mapZoomIn').onclick = () => Map3D.zoom(1 / 1.3);
  $('#mapZoomOut').onclick = () => Map3D.zoom(1.3);
  $('#mapRotL').onclick = () => Map3D.rotate(-.4);
  $('#mapRotR').onclick = () => Map3D.rotate(.4);
  $('#mapHere').onclick = () => Game.state.current && Map3D.focus(Game.state.current, 40);
  $('#mapAll').onclick = () => Map3D.overview();
  $('#mapModal [data-close]').onclick = closeMap;
  $('#charBack').onclick = () => { renderTitle(); showScreen('title'); };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { $('#bag').hidden = true; $('#questLog').hidden = true; if (!$('#mapModal').hidden) closeMap(); }
  });
  window.addEventListener('resize', () => {
    if (document.body.dataset.screen === 'game') layoutScene();
  });
}
document.addEventListener('DOMContentLoaded', init);
