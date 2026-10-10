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
    wardrobe: { own: {}, wear: {} },   // 買過的服裝、身上穿的（沒寫的部位用預設）
  };
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && typeof s === 'object') {
      const d = newState(), m = { ...d, ...s }; m.quests = { ...d.quests, ...(s.quests || {}) };
      // 舊版主線（跨線的步驟）改成新版：從頭解該線每一站的謎題
      for (const id of Object.keys(m.quests.active)) if (/^main_/.test(id) && !m.quests.active[id].v) m.quests.active[id] = { step: 0, v: 2 };
      return m;
    }
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
    const ak = s.char + JSON.stringify(s.wardrobe.wear);
    if ($('#hudAvatar').dataset.c !== ak) { $('#hudAvatar').dataset.c = ak; $('#hudAvatar').innerHTML = `<img class="avatar" src="${Human3D.snapshot(s.char, 'head', s.wardrobe.wear)}" alt="">`; }
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
  if (r.wear && OUTFITS[r.wear]) { s.wardrobe.own[r.wear] = true; parts.push(`限定服裝：${OUTFITS[r.wear].name}（背包 → 換裝）`); }
  saveState(); updateHud();
  if (label || parts.length) { toast(`<b>${label}</b>${parts.length ? `<span>${parts.join('　')}</span>` : ''}`, 'reward'); Sound.itemGet(); }
  const after = Economy.levelInfo(s.xp).lv;
  if (after > before) setTimeout(() => { toast(`<b>升級！Lv ${after}</b>`, 'level'); Sound.itemGet(); }, 900);
};
Game.onQuestChange = (what, id) => {
  const q = QUESTS[id];
  if (what === 'accept') toast(`<b>接下任務</b><span>${q.title}</span>`);
  if (what === 'secret') { toast(`<b>發現秘密任務！</b><span>${q.title}</span>`, 'level'); Sound.itemGet(); }
  if ((what === 'accept' || what === 'done') && ctl) Challenges.spawn(ctl.stationId);
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
    const tag = { main: '主線', side: '支線', event: '活動', secret: '秘密' }[q.type];
    return `<li class="quest q-${q.type}">
      <div class="q-head"><span class="q-tag"${q.line ? ` style="--c:${LINES[q.line].color}"` : ''}>${q.line ? q.line + ' ' : ''}${tag}</span><b>${q.title}</b></div>
      <p>${q.desc}</p>
      <ol>${q.steps.map((p, i) => `<li class="${i < st.step ? 'ok' : i === st.step ? 'now' : ''}">${p.text}${i === st.step ? stepNote(q, st, p) : ''}</li>`).join('')}</ol>
      <div class="q-reward">報酬：${[q.reward.money && `NT$ ${q.reward.money}`, q.reward.xp && `經驗 ${q.reward.xp}`, ...Object.keys(q.reward.items || {}).map(i => ITEMS[i].name)].filter(Boolean).join('、')}</div>
      ${q.type === 'side' ? `<button class="btn ghost small" data-abandon="${id}">放棄</button>` : ''}
    </li>`;
  };
  const ids = Object.keys(act);
  const order = ['main', 'secret', 'event', 'side'];
  ids.sort((a, b) => order.indexOf(QUESTS[a].type) - order.indexOf(QUESTS[b].type));
  const done = Object.keys(s.quests.done).filter(id => QUESTS[id]);
  $('#questCount').textContent = `支線 ${Quests.sideCount()} / ${SIDE_LIMIT}`;
  $('#questBody').innerHTML = `
    ${ids.length ? `<ul class="quests">${ids.map(card).join('')}</ul>` : '<p class="empty-q">目前沒有任務。到處和人說話，看看誰需要幫忙。</p>'}
    ${done.length ? `<h4 class="q-done-h">已完成</h4><ul class="q-done">${done.map(id => `<li>${QUESTS[id].title}</li>`).join('')}</ul>` : ''}`;
  $('#questBody').onclick = e => { const b = e.target.closest('[data-abandon]'); if (b && confirm(`放棄「${QUESTS[b.dataset.abandon].title}」？`)) { Quests.abandon(b.dataset.abandon); openQuests(); } };
  $('#questLog').hidden = false;
}

// 任務目前這一步的補充說明：謎題進度、寶物感應
function stepNote(q, st, step) {
  const g = step.goal;
  if (g.kind === 'puzzles') {
    const all = Puzzles.stations(g.line), left = all.filter(x => !(st.solved && st.solved[x]));
    const doing = Object.keys(st.ch || {}).map(x => `${esc(x)}（${esc((Puzzles.challenge(g.line, x).giver || {}).name || '')}）`);
    return `<small class="q-note">已完成 ${all.length - left.length} / ${all.length} 站　還沒完成：${left.slice(0, 8).map(esc).join('、')}${left.length > 8 ? `…等 ${left.length} 站` : ''}${doing.length ? `<br>進行中的委託：${doing.join('、')}` : ''}</small>`;
  }
  if (g.station === '@treasure' && st.treasure) return `<small class="q-note">${treasureSense(q.line, Game.state.current, st.treasure)}</small>`;
  return '';
}
// 寶物感應：只說遠近，不說是哪一站
function treasureSense(line, here, at) {
  if (!here || !MRT.linesAt(here).some(l => l.line === line)) return `寶物感應：你不在${LINES[line].zh}上，感應不到。`;
  const n = Puzzles.hops(line, here, at);
  if (n === 0) return '寶物感應：就在這一站！找找大廳和月台的角落。';
  if (n <= 2) return '寶物感應：非常近，就在附近一兩站。';
  if (n <= 5) return '寶物感應：有點近了。';
  if (n <= 10) return '寶物感應：還有一段距離。';
  return '寶物感應：很遠很遠。';
}
// 秘密任務的時間、好感條件（每秒檢查一次）
function checkSecrets() {
  if (document.body.dataset.screen !== 'game' || !Game.state.char) return;
  const s = Game.state, t = TaipeiTime.now();
  if (t.hour === 6 && t.minute < 15) Quests.secret('sec_firsttrain');
  if (t.hour === 0 && t.minute === 0 && TaipeiTime.state(t) === 'open') Quests.secret('sec_midnight');
  if (Object.values(s.friends).some(f => f >= 100)) Quests.secret('sec_friend');
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
  if (fare >= 65) Quests.secret('sec_maxfare');
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
  World.blocker = (x, z, y) => NPCManager.blocks(x, z, y) || Passengers.blocks(x, z, y);
  World.onRecenter(W => Passengers.shift(W));
  World.addTicker((dt, now) => { NPCManager.tick(dt, now); Passengers.tick(dt, now); Pickups.tick(now); Challenges.tick(dt, now); Secrets.tick(); });
  worldReady = true;
}
function enterGame(stationId) {
  if (document.activeElement) document.activeElement.blur();
  showScreen('game');
  layoutScene();
  ensureWorld();
  World.setCharacter(Game.state.char, Game.state.wardrobe.wear);
  buildPanel();
  updateHud();
  if (TaipeiTime.state() !== 'open') showClosed();
  World.loadStation(stationId);
  World.spawnInConcourse();
  Game.state.current = stationId; Game.state.visited[stationId] = true; saveState();
  startStation(stationId);
  // 開場：秀蔅出現在旁邊，一定要選板南線或文湖線
  if (!Game.state.flags.xiuyuIntro) {
    const xy = NPCManager.list.find(n => n.id === 'xiuyu');
    if (xy) { const p = World.player; xy.x = p.x - 1.6; xy.z = p.z; xy.y = p.y; setTimeout(() => Dialog.open(xy), 900); }
  }
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
  Xiuyu.arrive(stationId);
  NPCManager.enter(stationId, World.layout);
  Pickups.spawn(stationId);
  Challenges.spawn(stationId);
  Secrets.spawn(stationId);
  arriveChecks(stationId);
  Sound.ambience(World.layout.allUnder ? 'underground' : 'elevated');
  Game.ctlTimer = setInterval(tickStation, 400);
  doorInteractions();
  tickStation();
}
// 到站時：支線秘密任務、寶物感應
function arriveChecks(stationId) {
  const other = { 新北投: '小碧潭', 小碧潭: '新北投' }[stationId];
  if (other) Quests.secret('sec_branch', { target: other });
  const act = Game.state.quests.active;
  for (const id of Object.keys(act)) {
    const q = QUESTS[id], st = act[id];
    if (q.type === 'main' && st.step === 1 && st.treasure && MRT.linesAt(stationId).some(l => l.line === q.line)) {
      toast(`<b>${LINES[q.line].zh}的寶物</b><span>${treasureSense(q.line, stationId, st.treasure)}</span>`);
    }
  }
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
  list.push(exitInteraction(), puzzleInteraction, npcInteraction, spotInteraction, pickupInteraction, secretInteraction, seatInteraction, dropInteraction);
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
    Passengers.board(tr);
    // 玩家在車上：出發
    const r = ride || { line: dir.line, terminal: dir.terminal, stops: dir.stops, idx: 0, from: ctl.stationId };
    return doRide(tr, r);
  }
  if (ride) { Game.ride = null; }
  if (Passengers.train === tr) Passengers.clear();
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
  Passengers.board(tr);
  World.setInteractions([npcInteraction, seatInteraction, dropInteraction]);   // 行駛中：可以和乘客聊天、坐下、撿東西
  setTimeout(() => Passengers.maybeDrop(tr), 3000);
  const anomaly = Math.random() < .2;   // 偶爾在隧道裡看到不該存在的月台
  if (TaipeiTime.now().hour === 0) Quests.secret('sec_lasttrain');
  Sound.ambience(null);
  Sound.startRumble();
  await World.ride(tr, { toId: to, duration: reduceMotion() ? 4 : 22, onSpeed: v => Sound.setSpeed(v), skip: () => skip, anomaly });
  if (anomaly && MRT.undergroundOn(to, line)) {
    toast('<b>剛剛窗外……</b><span>好像有一座綠色的月台，站名寫著「霧」。</span>');
    questEvent({ kind: 'anomaly' });
    Quests.secret('sec_ghost');
  }
  Sound.stopRumble();
  setPart('pBtns', '');
  ride.moving = false;
  // 到站
  ride.idx++;
  const s = Game.state;
  s.visited[to] = true; s.current = to; s.rides++;
  saveState(); updateHud();
  questEvent({ kind: 'ride', line, station: to });
  if (MRT.terminals(line).has(to)) {
    questEvent({ kind: 'terminal', line, station: to });
    if (line === 'Y') Quests.secret('sec_circle', { target: to === '大坪林' ? '新北產業園區' : '大坪林' });
  }
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

// 和附近的人說話
const nearPerson = p => (p.zone.kind === 'train' ? Passengers.nearest(p, 1.5) : null) || NPCManager.nearest(p, 2.4);
const npcInteraction = {
  get id() { const n = nearPerson(World.player); return n ? 'npc:' + n.id : 'npc'; },
  get label() { const n = nearPerson(World.player); return n ? `說話：${n.name}` : '說話'; },
  when: p => !Dialog.with && !World.sitting && !!nearPerson(p),
  run: () => { const n = nearPerson(World.player); if (n) Dialog.open(n); },
};
// 車廂裡坐下／起身
const seatInteraction = {
  get id() { return World.sitting ? 'stand' : 'sit'; },
  get label() { return World.sitting ? '起身' : '坐下'; },
  when: p => !Dialog.with && p.zone.kind === 'train' && (World.sitting || !!Passengers.freeSeat(p)),
  run: () => {
    if (World.sitting) return World.sit(null);
    const seat = Passengers.freeSeat(World.player); if (!seat) return;
    World.sit(seat);
    const f = Game.state.flags; f.sits = (f.sits || 0) + 1; saveState();
    questEvent({ kind: 'sit' });
    if (f.sits >= 5) Quests.secret('sec_seat');
  },
};
// 撿起乘客遺落的東西
const dropInteraction = {
  get id() { const d = Passengers.dropNear(World.player); return d ? 'drop:' + d.item : 'drop'; },
  get label() { const d = Passengers.dropNear(World.player); return d ? `撿起：${d.item === 'coin' ? '硬幣' : ITEMS[d.item].name}` : '撿起'; },
  when: p => !World.sitting && !!Passengers.dropNear(p),
  run: () => Passengers.takeDrop(),
};
// 查看告示牌、塗鴉、路線圖
const SPOT_NAME = { notice: '告示牌', graffiti: '塗鴉', map: '路線圖', elevator: '電梯', ticket: '售票機', toilet: '廁所', shop: '商店' };
const SPOT_VERB = { elevator: '搭電梯', ticket: '查看售票機', toilet: '上廁所', shop: '逛商店' };
function nearSpot(p) { const L = World.layout; return L && L.spots.find(sp => Math.abs(sp.y - p.y) < .6 && Math.hypot(sp.x - p.x, sp.z - p.z) < 1.6); }
const spotInteraction = {
  get id() { const sp = nearSpot(World.player); return sp ? 'spot:' + sp.kind + sp.x + sp.z : 'spot'; },
  get label() { const sp = nearSpot(World.player); return sp ? (SPOT_VERB[sp.kind] || '查看' + SPOT_NAME[sp.kind]) : '查看'; },
  when: p => !Dialog.with && !!nearSpot(p) && !NPCManager.nearest(p, 1.2),
  run: () => {
    const sp = nearSpot(World.player), st = ctl.stationId;
    if (sp.kind === 'elevator') return elevatorMenu(sp);
    if (sp.kind === 'ticket') return Dialog.info('售票機・票價表', fareTable(st));
    if (sp.kind === 'toilet') return restroom();
    if (sp.kind === 'shop') return shopMenu(st);
    const done = Quests.emit({ kind: 'inspect', spot: sp.kind, station: st });
    Dialog.info(SPOT_NAME[sp.kind], spotText(sp, st, done.length > 0));
    for (const d of done) toast(`<b>${QUESTS[d.id].title}</b><span>✓ ${d.text}</span>`);
  },
};
function spotText(sp, st, questHit) {
  const h = TaipeiTime.now().hour;
  if (sp.kind === 'map') {
    const L = LINES[sp.line], i = MRT.linesAt(st).find(l => l.line === sp.line);
    return `${L.zh}路線圖。你在 ${i ? i.code : ''} ${esc(st)}。${questHit ? '<br>路線圖上有一站被人用鉛筆圈起來，旁邊寫著「這裡以前有一站」。' : ''}`;
  }
  if (sp.kind === 'graffiti') return `牆角用噴漆畫著一頂紅色的貝雷帽和一個長髮女孩，右下角寫著一個字：「霧」。${questHit ? '<br>你把它記了下來。' : ''}`;
  // 告示牌：依時段變化
  const special = {
    市政府: '遺失物公告：一把刻著「第七節車廂」的鑰匙，請失主至服務台領取。（日期欄是空白的。）',
    松山機場: '本站銜接松山機場。夜間最後一班飛機起飛後，月台廣播偶爾會報出不存在的站名，請旅客勿驚慌。',
    北投: '溫泉季開跑！另：近日有旅客反映新北投支線末班車後仍聽見列車聲，本公司正在調查中。',
    古亭: '本站時鐘校正公告：大廳時鐘於每日 00:30 會停止三十秒，屬正常現象。',
    景安: '環狀線指南針造型裝置藝術募集中。作品主題：「沒有方向的時候，你往哪走？」',
    圓山: '懷舊展：「圓山站的老站牌」——五十年前的站牌照片展示中。',
  }[st];
  const timely = h < 9 ? '早上 07:00–09:00 為尖峰時段，請多利用列車中段車廂。' : h >= 22 ? '末班車將於 00:30 前開出，請留意時間。' : '本站設有詢問處、失物招領與電梯。';
  return `<b>車站公告</b><br>${special ? esc(special) + '<br>' : ''}${timely}`;
}
// 電梯：選樓層
function floorName(y, allUnder) {
  if (Math.abs(y) < .1) return (allUnder ? 'B1' : '1F') + ' 大廳';
  return y < 0 ? `B${1 + Math.round(-y / 5)}` : `${1 + Math.round(y / 5)}F`;
}
function elevatorMenu(sp) {
  const L = World.layout;
  const floors = [{ label: floorName(0, L.allUnder) + '（閘門・出口）', x: L.concourse.x0 + 4, y: 0, z: L.concourse.z0 + 2.3, here: sp.level === 'hall' }]
    .concat(L.platforms.map(P => ({ label: `${floorName(P.y)} ${LINES[P.line].zh}月台`, x: P.x - 24, y: P.y, z: P.z + 1.7, here: sp.level === P.k })));
  Dialog.show({ name: '電梯', role: '請選擇樓層' }, '叮——電梯門打開了。', floors.map(f => ({
    label: f.here ? `${f.label}（目前樓層）` : f.label, disabled: f.here, primary: !f.here,
    run: async () => {
      Dialog.close();
      const fx = $('#tpFx'); fx.hidden = false; fx.classList.remove('out');
      Sound.onboardChime();
      await sleep(700);
      World.placePlayer(f.x, f.y, f.z, 0);
      fx.classList.add('out'); await sleep(500); fx.hidden = true;
    },
  })).concat([{ label: '不搭了', run: () => Dialog.close() }]));
}
// 售票機：從這站到各大站的票價
function fareTable(st) {
  const dests = ['台北車站', '西門', '市政府', '南港展覽館', '淡水', '動物園', '新店', '頂埔', '蘆洲', '大坪林'].filter(d => d !== st);
  return `<table class="fares">${dests.map(d => `<tr><td>${esc(d)}</td><td>NT$ ${Economy.fare(st, d)}</td></tr>`).join('')}</table><small>依台北捷運計費規則估算。悠遊卡出站時扣款。</small>`;
}
async function restroom() {
  const fx = $('#tpFx'); fx.hidden = false; fx.classList.remove('out');
  await sleep(600); fx.classList.add('out'); await sleep(500); fx.hidden = true;
  Dialog.info('廁所', ['洗手台的鏡子裡，你身後好像站著一個戴紅帽子的人。回頭，什麼都沒有。', '牆上貼著「請節約用水」。整理一下頭髮，繼續出發。', '有人在門板上寫：「我在等的人，今天也沒來。」'][Math.floor(Math.random() * 3)]);
}
// 商店
function shopMenu(st) {
  const shop = Station3D.SHOPS[st]; if (!shop) return;
  const wear = (OUTFIT_SHOPS[st] || []).filter(id => Outfits.fits(id, Game.state.char));
  if (!wear.length) return foodMenu(st);
  Dialog.show({ name: shop.name, role: '歡迎光臨' }, '想看什麼？', [
    { label: '飲食、伴手禮', primary: true, run: () => foodMenu(st) },
    { label: st === '台北車站' ? '地下街髮廊（髮型、染髮）' : '服飾、配件', primary: true, run: () => wearMenu(st) },
    { label: '離開', run: () => Dialog.close() },
  ]);
}
// 依時節：活動限定的商品只在活動期間賣
function shopItems(shop) {
  const ev = Quests.eventsNow();
  const extra = Object.keys(ITEMS).filter(id => ITEMS[id].event && ev.includes(ITEMS[id].event) && !shop.items.includes(id));
  return shop.items.concat(extra).filter(id => !ITEMS[id].event || ev.includes(ITEMS[id].event));
}
function foodMenu(st) {
  const shop = Station3D.SHOPS[st];
  const s = Game.state;
  Dialog.show({ name: shop.name, role: '歡迎光臨' }, `悠遊卡餘額 NT$ ${s.money}。要買什麼？`, shopItems(shop).map(id => ({
    label: `${ITEMS[id].icon} ${ITEMS[id].name}　NT$ ${ITEMS[id].price}${ITEMS[id].event ? '（限定）' : ''}`, disabled: s.money < ITEMS[id].price,
    run: () => {
      s.money -= ITEMS[id].price; s.inv[id] = (s.inv[id] || 0) + 1; saveState(); updateHud();
      Sound.gate();
      toast(`<b>買了 ${ITEMS[id].icon} ${ITEMS[id].name}</b><span>餘額 NT$ ${s.money}</span>`);
      questEvent({ kind: 'buy', item: id });
      foodMenu(st);
    },
  })).concat([{ label: '離開', run: () => Dialog.close() }]));
}
function wearMenu(st) {
  const shop = Station3D.SHOPS[st], s = Game.state;
  const ids = (OUTFIT_SHOPS[st] || []).filter(id => Outfits.fits(id, s.char));
  const slotName = Object.fromEntries(OUTFIT_SLOTS);
  Dialog.show({ name: shop.name, role: '服飾、配件' }, `悠遊卡餘額 NT$ ${s.money}。買了可以在「背包 → 換裝」隨時換。`, ids.map(id => {
    const o = OUTFITS[id], own = !!s.wardrobe.own[id];
    return {
      label: own ? `${slotName[o.slot]}｜${o.name}　已擁有` : `${slotName[o.slot]}｜${o.name}　NT$ ${o.price}`,
      disabled: own || s.money < o.price,
      run: () => {
        s.money -= o.price; s.wardrobe.own[id] = true; saveState(); updateHud();
        Sound.gate();
        questEvent({ kind: 'buy', item: id });
        Dialog.show({ name: shop.name, role: '服飾、配件' }, `買了「${esc(o.name)}」。要現在換上嗎？`, [
          { label: '現在換上', primary: true, run: () => { putOn(id); wearMenu(st); } },
          { label: '先不用', run: () => wearMenu(st) },
        ]);
      },
    };
  }).concat([{ label: '離開', run: () => Dialog.close() }]));
}
// 換上某件服裝
function putOn(id) {
  const s = Game.state, o = OUTFITS[id]; if (!o) return;
  s.wardrobe.wear = { ...Outfits.wear(s.char, s.wardrobe.wear), [o.slot]: id };
  saveState();
  World.setCharacter(s.char, s.wardrobe.wear);
  updateHud();
  toast(`<b>換上了 ${o.name}</b>`);
}
// 角落的秘密
const secretInteraction = {
  get id() { const s = Secrets.near(World.player); return s ? 'sec:' + s.sc.id : 'sec'; },
  get label() { const s = Secrets.near(World.player); return s ? `查看：${s.sc.name}` : '查看'; },
  when: p => !Dialog.with && !!Secrets.near(p) && !Pickups.near(p),
  run: () => { const s = Secrets.near(World.player); if (s) Secrets.look(s); },
};

// 主線謎題
const puzzleInteraction = {
  get id() { const e = Challenges.near(World.player); return e ? 'ch:' + e.type + (e.line || '') + (e.i ?? '') : 'ch'; },
  get label() { const e = Challenges.near(World.player); return e ? Challenges.label(e) : '查看'; },
  when: p => !Dialog.with && !World.sitting && !!Challenges.near(p),
  run: () => { const e = Challenges.near(World.player); if (e) Challenges.interact(e); },
};
// 撿起任務物品
function nearPickup(p) { return Pickups.near(p); }
const pickupInteraction = {
  get id() { const it = nearPickup(World.player); return it ? 'pick:' + it.item : 'pick'; },
  get label() { const it = nearPickup(World.player); return it ? `撿起：${ITEMS[it.item].name}` : '撿起'; },
  when: p => !!nearPickup(p),
  run: () => { const it = nearPickup(World.player); if (it) Pickups.take(it); },
};

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
    ${inv.length ? `<ul class="inv">${inv.map(([id, n]) => `<li title="${esc(ITEMS[id].desc)}"><span class="ic">${ITEMS[id].icon}</span><b>${ITEMS[id].name}</b><small>×${n}${ITEMS[id].eat ? ` <button class="btn small ghost eat" data-eat="${id}">${ITEMS[id].eat}掉</button>` : ''}</small><p>${ITEMS[id].desc}</p></li>`).join('')}</ul>` : '<p class="empty-q">背包是空的。</p>'}
    <h4 class="bag-h">換裝</h4>
    ${wardrobeHtml()}
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
  $('#bagBody').onclick = e => {
    const w = e.target.closest('[data-wear]'), f = e.target.closest('[data-eat]');
    if (w) { Sound.click(); putOn(w.dataset.wear); openBag(); }
    if (f) { Sound.click(); eat(f.dataset.eat); openBag(); }
  };
}
// 捷運裡可以吃東西：吃喝一點點經驗
const EAT_TEXT = { 喝: ['好喝。', '整個人醒過來了。', '冰冰涼涼的。'], 吃: ['好吃！', '吃飽了，可以再走一站。', '肚子不餓了。'] };
function eat(id) {
  const s = Game.state, it = ITEMS[id];
  if (!it || !it.eat || !(s.inv[id] > 0)) return;
  s.inv[id]--;
  const pool = EAT_TEXT[it.eat];
  Game.reward({ xp: 5 }, `${it.eat}掉了 ${it.icon} ${it.name}　${pool[(Math.random() * pool.length) | 0]}`);
}
function wardrobeHtml() {
  const s = Game.state, wear = Outfits.wear(s.char, s.wardrobe.wear), own = Outfits.owned(s.char, s.wardrobe.own);
  return `<div class="wardrobe">
    <img class="wd-look" src="${Human3D.snapshot(s.char, 'full', s.wardrobe.wear)}" alt="目前的造型">
    <div class="wd-slots">${OUTFIT_SLOTS.map(([slot, name]) => {
      const list = own.filter(id => OUTFITS[id].slot === slot);
      return `<div class="wd-row"><span>${name}</span><div>${list.map(id => `<button class="wd-chip" data-wear="${id}" aria-pressed="${wear[slot] === id}">${esc(OUTFITS[id].name)}</button>`).join('')}</div></div>`;
    }).join('')}
      <p class="wd-hint">衣服可以在西門、忠孝復興、市政府、中山、板橋的商店買；髮型和染髮在台北車站。節慶活動有限定配件。</p>
    </div>
  </div>`;
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
      if (tp) { tp.disabled = !!Game.ride || Challenges.escorting(); tp.onclick = () => teleport(id); }
    },
  });
}
function closeMap() { $('#mapModal').hidden = true; Map3D.close(); }

// 傳送：只能去已經到過的車站，出現在該站大廳
async function teleport(id) {
  const s = Game.state;
  if (Game.ride || !s.visited[id] || id === s.current) return;
  if (Challenges.escorting()) { toast('<b>帶著人不能傳送</b><span>先陪他把路走完吧</span>', 'warn'); return; }
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
    checkSecrets();
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
