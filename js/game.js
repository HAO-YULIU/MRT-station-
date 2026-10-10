/* 迷霧：遊戲主流程 */
const SAVE_KEY = 'mist-mrt-save-v1';
const START_STATION = '南港展覽館';   // 遊戲起點

const Game = {
  state: null,
  ride: null,          // 搭乘中的狀態
  busy: false,         // 動畫進行中，暫停操作
  service: null,       // open / mist / dawn
};

/* ── 存檔 ── */
function newState() { return { char: null, start: null, current: null, items: {}, visited: {}, rides: 0 }; }
function loadState() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s === 'object') return { ...newState(), ...s }; } catch (e) { /* 無存檔 */ }
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
  const st = TaipeiTime.state(t);
  const pill = $('#hudStatus');
  if (st === 'open') {
    const left = TaipeiTime.minutesToLastTrain(t);
    pill.textContent = left <= 30 ? `末班車 00:30，剩 ${left} 分` : '營運中 06:00–00:30';
    pill.dataset.s = left <= 30 ? 'warn' : 'open';
  } else if (st === 'mist') { pill.textContent = '迷霧時刻'; pill.dataset.s = 'mist'; }
  else { pill.textContent = '首班車 06:00'; pill.dataset.s = 'closed'; }
  const s = Game.state;
  if (s.char) {
    $('#hudName').textContent = CHARACTERS[s.char].name;
    if ($('#hudAvatar').dataset.c !== s.char) { $('#hudAvatar').dataset.c = s.char; $('#hudAvatar').innerHTML = `<img class="avatar" src="${Human3D.snapshot(s.char, 'head')}" alt="">`; }
  }
  $('#hudWhere').textContent = s.current ? s.current : '尚未出發';
  $('#hudItems').textContent = `${Object.keys(s.items).length}/6`;
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
    $('#closedRange').textContent = '00:30 – 05:30';
    $('#closedBody').textContent = '末班車已經開走了。整座城市被霧吞沒的這段時間，會有不一樣的玩法——即將開放。';
  } else {
    $('#closedTitle').textContent = '車站尚未開放';
    $('#closedRange').textContent = '05:30 – 06:00';
    $('#closedBody').textContent = `霧正在散去。首班車 06:00 發車，還有 ${mins} 分鐘。`;
  }
  ov.hidden = false;
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
    s.char = pick; s.start = START_STATION; s.current = START_STATION;
    s.visited = { [START_STATION]: true }; s.items = {}; s.rides = 0;
    saveState();
    enterGame(START_STATION);
  };
  sync();
}

/* ── 遊戲場景容器（3D） ── */
const sceneEl = () => $('#scene');
const DWELL = 20;   // 停站開門秒數
let worldReady = false;

function setPanel(html) {
  $('#panel').innerHTML = html;
}
function layoutScene() {
  const h = $('.hud').offsetHeight;
  document.body.style.setProperty('--hud-h', h + 'px');
}
function ensureWorld() {
  if (worldReady) return;
  World.init(sceneEl());
  World.bindJoystick($('#joystick'));
  worldReady = true;
}
function enterGame(stationId) {
  showScreen('game');
  layoutScene();
  ensureWorld();
  World.setCharacter(Game.state.char);
  updateHud();
  if (TaipeiTime.state() !== 'open') showClosed();
  showPlatform(stationId);
}

// 手機：開始遊戲時進入全螢幕（直式、橫式都可以玩）
function goFullscreen() {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req && !document.fullscreenElement) { try { const p = req.call(el); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 不支援全螢幕 */ } }
}

// 每次切換場景都開一個新的 session，舊的非同步流程看到 session 不同就會停止
let session = 0;
const newSession = () => ++session;
const alive = id => id === session;

function countdown(sec, onTick, id) {
  return new Promise(res => {
    const end = performance.now() + sec * 1000;
    const tick = () => {
      if (!alive(id)) return res('stale');
      const left = Math.ceil((end - performance.now()) / 1000);
      if (onTick(Math.max(0, left)) === 'stop') return res('stop');
      if (left <= 0) return res('done');
      setTimeout(tick, 200);
    };
    tick();
  });
}

function fmtEta(sec) {
  if (sec == null) return '今日已無班次';
  if (sec <= 10) return '即將進站';
  return `${Math.floor(sec / 60)} 分 ${String(sec % 60).padStart(2, '0')} 秒`;
}
function setPlatformTimer(fn) {
  clearInterval(Game.platformTimer);
  Game.platformTimer = fn ? setInterval(fn, 500) : null;
}

/* ── 月台 ── */
function showPlatform(stationId) {
  newSession();
  const s = Game.state;
  s.current = stationId; s.visited[stationId] = true; saveState();
  updateHud();
  const dirs = MRT.directionsAt(stationId);
  World.setStation(stationId, dirs[0].line, null);
  World.setTrain(dirs[0].line, false);
  Sound.ambience(MRT.undergroundOn(stationId, dirs[0].line) ? 'underground' : 'elevated');
  World.placePlayer(0, 4.2);
  World.setInput(true);
  renderPlatformPanel(stationId);
}

function renderPlatformPanel(stationId) {
  const dirs = MRT.directionsAt(stationId);
  const groups = {};
  dirs.forEach((d, i) => (groups[d.line] = groups[d.line] || []).push({ d, i }));
  const open = TaipeiTime.state() === 'open';
  const lines = MRT.linesAt(stationId);
  setPanel(`
    <div class="panel-head">
      <div class="here">${lines.map(l => lineChip(l.line, l.code)).join('')}<b>${esc(stationId)}</b><small>${esc(STATIONS[stationId].en)}</small></div>
      <div class="panel-hint">${open ? (lines.length > 1 ? '轉乘站：選擇要前往的月台' : '選擇要去的月台') : '目前沒有列車行駛'}</div>
    </div>
    <div class="dirs">
      ${Object.entries(groups).map(([lid, arr]) => arr.map(({ d, i }) => {
        const t = MRT.label(d.terminal, lid), n = MRT.label(d.stops[0], lid);
        return `<button class="dir" data-i="${i}" ${open ? '' : 'disabled'} style="--c:${LINES[lid].color};--t:${LINES[lid].text}">
          <span class="dir-line">${lid}</span>
          <span class="dir-main"><b>往 ${esc(t.zh)}</b><small>To ${esc(t.en)}</small></span>
          <span class="dir-next">下一站<b>${esc(n.zh)}</b><span class="eta" data-i="${i}"></span></span>
        </button>`;
      }).join('')).join('')}
    </div>`);
  const tickEta = () => {
    document.querySelectorAll('#panel .eta').forEach(el => {
      const d = dirs[+el.dataset.i];
      el.textContent = fmtEta(TaipeiTime.nextTrainIn(stationId, d.line, d.terminal));
    });
  };
  tickEta();
  setPlatformTimer(tickEta);
  World.setInteractions([]);
  $('#panel .dirs').onclick = e => {
    const b = e.target.closest('.dir');
    if (!b) return;
    if (TaipeiTime.state() !== 'open') { showClosed(); return; }
    Sound.click();
    setPlatformTimer(null);
    goToPlatform(stationId, dirs[+b.dataset.i]);
  };
}

// 走到某方向的月台：等車 → 列車進站 → 開門 → 自己走進車廂
async function goToPlatform(stationId, dir) {
  const id = newSession();
  World.setStation(stationId, dir.line, dir);
  World.setTrain(dir.line, false);
  Sound.ambience(MRT.undergroundOn(stationId, dir.line) ? 'underground' : 'elevated');
  World.placePlayer(0, 4.2);
  World.setInput(true);
  const t = MRT.label(dir.terminal, dir.line);
  const L = LINES[dir.line];
  const backToDirs = () => { newSession(); World.setInteractions([]); renderPlatformPanel(stationId); };

  for (;;) {
    // 1) 等車：依台灣時間每 3 分鐘一班
    setPanel(`<div class="wait">
        <div class="wait-board" role="timer">
          <span class="chip" style="--c:${L.color};--t:${L.text}">${dir.line}</span>
          <span class="lbl">往 ${esc(t.zh)}<b id="waitMsg">下一班列車</b></span>
          <span class="eta" id="waitEta"></span>
        </div>
        <span class="panel-hint">可以在月台上走動，車來了走進車門</span>
        <button class="btn ghost small" id="changePlatform">換月台</button>
      </div>`);
    $('#changePlatform').onclick = () => { Sound.click(); backToDirs(); };
    World.setInteractions([]);
    let chimed = false;
    const r = await new Promise(res => {
      const tick = () => {
        if (!alive(id)) return res('stale');
        const eta = TaipeiTime.nextTrainIn(stationId, dir.line, dir.terminal);
        if (eta == null) return res('closed');
        const el = $('#waitEta'); if (!el) return res('stale');
        el.textContent = eta <= 10 ? '進站中' : `${Math.floor(eta / 60)}:${String(eta % 60).padStart(2, '0')}`;
        if (eta <= 12 && !chimed) {
          chimed = true;
          $('#waitMsg').textContent = '列車即將進站';
          Sound.arrivalChime(dir.line);
          setTimeout(() => alive(id) && Sound.announce(`往${t.zh}的列車即將進站，請勿超越月台警戒線。`, `The train to ${t.en} is now arriving.`), 4200);
        }
        // 進站動畫約 6.5 秒，提前開始讓車門剛好在整點打開
        if (eta <= 7 || (chimed && eta > 170)) return res('train');
        setTimeout(tick, 400);
      };
      tick();
    });
    if (r === 'stale') return;
    if (r === 'closed') { backToDirs(); return showClosed(); }

    // 2) 列車進站
    setPanel(`<div class="panel-note"><span class="blink"></span>往 ${esc(t.zh)} 的列車進站中，請勿超越月台警戒線</div>`);
    await World.trainArrive();
    if (!alive(id)) return;
    await sleep(300);
    Sound.doorOpen();
    await World.setDoors(true);
    if (!alive(id)) return;

    // 3) 開門停站：走進任一車門（或按 E 自動走進去）
    World.setInteractions([{
      id: 'board', label: '上車',
      when: p => !p.inside && p.z < 3.3 && World.nearDoor(p.x, .9),
      run: () => { const d = World.nearestDoor(World.player.x); Sound.click(); World.walkPath([{ x: d, z: 2.4 }, { x: d, z: .2 }]); },
    }]);
    setPanel(`<div class="wait">
        <div class="wait-board"><span class="chip" style="--c:${L.color};--t:${L.text}">${dir.line}</span>
          <span class="lbl">往 ${esc(t.zh)}<b>車門開啟中</b></span><span class="eta" id="dwellLeft"></span></div>
        <span class="panel-hint">走進任一車門就上車了（靠近車門按 <kbd>E</kbd> 也可以）</span>
      </div>`);
    await countdown(DWELL, left => { const el = $('#dwellLeft'); if (el) el.textContent = left; }, id);
    if (!alive(id)) return;

    // 4) 關門
    World.setInteractions([]);
    Sound.doorClose();
    setPanel(`<div class="panel-note"><span class="blink"></span>車門即將關閉</div>`);
    await sleep(1900); if (!alive(id)) return;
    World.clearDoorway();
    await World.setDoors(false);
    if (!alive(id)) return;
    if (World.player.inside) {
      return startRide({ line: dir.line, terminal: dir.terminal, stops: dir.stops, idx: 0, from: stationId });
    }
    // 沒上車：列車離站，等下一班
    setPanel(`<div class="panel-note">列車已經開走了。下一班 3 分鐘後進站。</div>`);
    await World.trainDepart();
    if (!alive(id)) return;
    await sleep(1500);
  }
}

/* ── 搭乘 ── */
async function startRide(ride) {
  setPlatformTimer(null);
  Game.ride = ride;
  const id = newSession();
  rideSegment(id);
}

function setLcd(head, stationId, line) {
  const n = MRT.label(stationId, line), L = LINES[line];
  World.setLcd(head, n.zh, n.en, L.color, L.text);
}

async function rideSegment(id) {
  const ride = Game.ride;
  const from = ride.idx === 0 ? ride.from : ride.stops[ride.idx - 1];
  const to = ride.stops[ride.idx];
  const line = ride.line;
  const fullList = [ride.from, ...ride.stops];
  World.setStrip(line, fullList, ride.idx + 1);
  setLcd('下一站 Next Station', to, line);
  const n = MRT.label(to, line);
  const isTerminal = ride.idx === ride.stops.length - 1;
  World.setInteractions([]);
  let skip = false;
  setPanel(`<div class="ride-bar">
      <div class="ride-info">${lineChip(line)}<span>往 ${esc(MRT.label(ride.terminal, line).zh)}</span><span class="sep"></span><span>下一站 <b>${esc(n.zh)}</b></span></div>
      <button class="btn small ghost" id="skipBtn">略過行駛</button>
    </div>`);
  $('#skipBtn').onclick = () => { skip = true; };

  if (World.doorsOpen) {
    Sound.doorClose();
    await sleep(1900); if (!alive(id)) return;
    World.clearDoorway();
    await World.setDoors(false); if (!alive(id)) return;
  }
  const transfers = MRT.linesAt(to).filter(l => l.line !== line).map(l => LINES[l.line].zh);
  Sound.announce(
    `下一站，${n.zh}。${isTerminal ? '本列車終點站。' : ''}${transfers.length ? `轉乘${transfers.join('、')}的旅客，請在本站換車。` : ''}`,
    `Next station, ${n.en}.${transfers.length ? ' Transfer station.' : ''}`,
    { chime: true },
  );

  // 行駛
  Sound.ambience(null);
  Sound.startRumble();
  await World.ride(
    { fromId: from, toId: to, lineId: line, nextDir: isTerminal ? null : { terminal: ride.terminal } },
    { duration: reduceMotion() ? 4 : 22, onSpeed: v => Sound.setSpeed(v), skip: () => skip },
  );
  Sound.stopRumble();
  if (!alive(id)) return;

  // 到站
  ride.idx++;
  Game.state.visited[to] = true;
  Game.state.current = to;
  Game.state.rides++;
  saveState();
  updateHud();
  World.setStrip(line, fullList, ride.idx);
  setLcd(isTerminal ? '終點站 Terminal' : '本站 This Stop', to, line);
  Sound.ambience(MRT.undergroundOn(to, line) ? 'underground' : 'elevated');
  Sound.announce(isTerminal ? `${n.zh}到了，本列車終點站，請全部旅客下車。` : `${n.zh}到了。`, `${n.en}.`, { chime: true });
  await sleep(1200); if (!alive(id)) return;
  Sound.doorOpen();
  await World.setDoors(true); if (!alive(id)) return;

  // 終點站：獲得該路線的物品
  if (MRT.terminals(line).has(to) && !Game.state.items[line]) {
    Game.state.items[line] = { at: to, time: `${TaipeiTime.date()} ${TaipeiTime.clock()}` };
    saveState(); updateHud();
    World.setInput(false);
    await showItemGet(line);
    World.setInput(true);
    if (!alive(id)) return;
  }

  const mustAlight = isTerminal || ride.mustAlight || TaipeiTime.state() !== 'open';
  World.setInteractions([{
    id: 'alight', label: '下車',
    when: p => p.inside && World.nearDoor(p.x, .9),
    run: () => { const d = World.nearestDoor(World.player.x); Sound.click(); World.walkPath([{ x: d, z: .6 }, { x: d, z: 3.0 }]); },
  }]);
  const head = `${lineChip(line, MRT.code(to, line))}<b>${esc(n.zh)}</b><small>${esc(n.en)}</small>`;
  const next = mustAlight ? null : MRT.label(ride.stops[ride.idx], line);
  setPanel(`<div class="arrive">
      <div class="arrive-msg">${head}${mustAlight
        ? `<span class="tag${isTerminal ? '' : ' warn'}">${isTerminal ? '終點站，請下車' : '今日營運已結束，請下車'}</span>`
        : '<span class="tag">車門開啟 <span id="dwellLeft"></span> 秒</span>'}</div>
      <span class="panel-hint">${mustAlight ? '走出車門下車' : `走出車門就下車了；留在車上會繼續開往 ${esc(next.zh)}`}</span>
      ${mustAlight ? '' : '<button class="btn ghost small" id="stayBtn">留在車上</button>'}
    </div>`);
  let stay = false;
  $('#stayBtn') && ($('#stayBtn').onclick = () => { Sound.click(); stay = true; });

  // 等玩家下車，或開門時間結束
  const r = await countdown(mustAlight ? 99999 : DWELL, left => {
    if (!World.player.inside && World.player.z > 2.25) return 'stop';   // 已經走到月台
    if (stay) return 'stop';
    const el = $('#dwellLeft'); if (el) el.textContent = left;
  }, id);
  if (r === 'stale') return;
  if (!World.player.inside) return alighted(to, id);
  rideSegment(id);   // 留在車上，繼續開往下一站
}

// 下車後：列車關門離站，玩家留在這個月台
async function alighted(stationId, id) {
  const ride = Game.ride;
  Game.ride = null;
  World.setInteractions([]);
  renderPlatformPanel(stationId);
  if (TaipeiTime.state() !== 'open') showClosed();
  await sleep(2500); if (!alive(id)) return;
  Sound.doorClose();
  await sleep(1900); if (!alive(id)) return;
  World.clearDoorway();
  await World.setDoors(false); if (!alive(id)) return;
  await World.trainDepart();
  void ride;
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
  $('#bagBody').innerHTML = `
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
  Map3D.open($('#map3d'), {
    visited: s.visited, current: s.current, char: s.char,
    onPick: id => {
      const lines = MRT.linesAt(id);
      const here = id === s.current, been = !!s.visited[id];
      const card = $('#mapCard');
      card.innerHTML = `<div class="here">${lines.map(l => lineChip(l.line, l.code)).join('')}<b>${esc(id)}</b></div>
        <small>${esc(STATIONS[id].en)}</small>
        <p>${here ? '你現在在這裡' : been ? '去過了' : '還沒去過，藏在霧裡'}${lines.length > 1 ? '　轉乘站' : ''}${lines.some(l => MRT.terminals(l.line).has(id)) ? '　終點站' : ''}</p>`;
      card.hidden = false;
      Sound.click();
    },
  });
}
function closeMap() { $('#mapModal').hidden = true; Map3D.close(); }

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
    if (e.key === 'Escape') { $('#bag').hidden = true; if (!$('#mapModal').hidden) closeMap(); }
  });
  window.addEventListener('resize', () => {
    if (document.body.dataset.screen === 'game') layoutScene();
  });
}
document.addEventListener('DOMContentLoaded', init);
