/* 迷霧：遊戲主流程 */
const SAVE_KEY = 'mist-mrt-save-v1';

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
    $('#hudAvatar').innerHTML = CharArt.img(s.char, 'avatar');
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
  const go = () => { Sound.unlock(); renderCharSelect(); showScreen('charSelect'); };
  $('#btnStart') && ($('#btnStart').onclick = go);
  $('#btnNew') && ($('#btnNew').onclick = () => {
    if (!confirm('重新開始會清除目前的進度與收集到的物品，確定嗎？')) return;
    Game.state = newState(); saveState(); go();
  });
  $('#btnContinue') && ($('#btnContinue').onclick = () => { Sound.unlock(); enterGame(s.current, 'start'); });
}

/* ── 選角色 ── */
function renderCharSelect() {
  let pick = Game.state.char;
  const wrap = $('#charCards');
  wrap.innerHTML = Object.values(CHARACTERS).map(c => `
    <button class="char-card${pick === c.id ? ' on' : ''}" data-id="${c.id}" aria-pressed="${pick === c.id}">
      <div class="char-stage">${CharArt.img(c.id)}</div>
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
    confirmBtn.textContent = pick ? `以${CHARACTERS[pick].name}出發` : '選一位主角';
  };
  wrap.onclick = e => { const b = e.target.closest('.char-card'); if (!b) return; Sound.click(); pick = b.dataset.id; sync(); };
  confirmBtn.onclick = () => {
    Game.state.char = pick; saveState();
    renderStationSelect(); showScreen('stationSelect');
  };
  sync();
}

/* ── 選出發站 ── */
let selectMap = null;
function renderStationSelect() {
  let picked = null, tab = 'R';
  const mapBox = $('#selectMap');
  selectMap = MapView(mapBox, { onPick: id => choose(id) });

  const tabs = $('#lineTabs');
  tabs.innerHTML = LINE_ORDER.map(l => `<button class="ltab" data-l="${l}" style="--c:${LINES[l].color};--t:${LINES[l].text}">${LINES[l].zh}</button>`).join('');
  const list = $('#stationList');
  const renderList = () => {
    tabs.querySelectorAll('.ltab').forEach(b => b.classList.toggle('on', b.dataset.l === tab));
    const q = $('#stationSearch').value.trim();
    let items = [];
    if (q) {
      items = Object.keys(STATIONS).filter(id => id.includes(q) || STATIONS[id].en.toLowerCase().includes(q.toLowerCase()));
    } else {
      const seen = new Set();
      for (const r of LINES[tab].routes) for (const [id] of r) if (!seen.has(id)) { seen.add(id); items.push(id); }
    }
    list.innerHTML = items.map(id => `
      <li><button class="srow${id === picked ? ' on' : ''}" data-id="${esc(id)}">
        <span class="chips">${MRT.linesAt(id).map(l => lineChip(l.line, l.code)).join('')}</span>
        <span class="sname">${esc(id)}<small>${esc(STATIONS[id].en)}</small></span>
      </button></li>`).join('') || '<li class="empty">找不到這個站名，試試其他關鍵字。</li>';
  };
  tabs.onclick = e => { const b = e.target.closest('.ltab'); if (!b) return; tab = b.dataset.l; $('#stationSearch').value = ''; renderList(); };
  $('#stationSearch').oninput = renderList;
  list.onclick = e => { const b = e.target.closest('.srow'); if (b) { choose(b.dataset.id); selectMap.focus(b.dataset.id); } };

  function choose(id) {
    Sound.click();
    picked = id;
    selectMap.select(id);
    renderList();
    const conf = $('#startConfirm');
    conf.hidden = false;
    $('#startName').innerHTML = `${MRT.linesAt(id).map(l => lineChip(l.line, l.code)).join('')}<b>${esc(id)}</b><small>${esc(STATIONS[id].en)}</small>`;
  }
  $('#startGo').onclick = () => {
    if (!picked) return;
    const s = Game.state;
    s.start = picked; s.current = picked; s.visited = { [picked]: true }; s.items = {}; s.rides = 0;
    saveState();
    enterGame(picked, 'start');
  };
  $('#startConfirm').hidden = true;
  $('#zoomIn').onclick = () => selectMap.zoom(1 / 1.4);
  $('#zoomOut').onclick = () => selectMap.zoom(1.4);
  renderList();
}

/* ── 遊戲場景容器 ── */
const sceneEl = () => $('#scene');
const DWELL = 20;   // 停站開門秒數
function sliceTransform() {
  const r = sceneEl().getBoundingClientRect();
  const s = Math.max(r.width / W, r.height / H);
  return { s, ox: (r.width - W * s) / 2, oy: 0, vw: r.width, vh: r.height };   // 對應 xMidYMin slice
}

function setPanel(html) {
  $('#panel').innerHTML = html;
  document.body.style.setProperty('--panel-h', $('#panel').offsetHeight + 'px');
}

// 場景放在 HUD 下方，避免擋住站名牌
function layoutScene() {
  const h = $('.hud').offsetHeight;
  sceneEl().style.top = h + 'px';
  document.body.style.setProperty('--hud-h', h + 'px');
  document.body.style.setProperty('--panel-h', $('#panel').offsetHeight + 'px');
}
function enterGame(stationId, mode, from) {
  showScreen('game');
  layoutScene();
  updateHud();
  if (TaipeiTime.state() !== 'open') showClosed();
  showPlatform(stationId, mode, from);
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
      setTimeout(tick, 250);
    };
    tick();
  });
}

/* ── 月台 ── */
function directionInfo(stationId, d) {
  const a = STATIONS[stationId], b = STATIONS[d.stops[0]];
  return { ...d, goesRight: b.x !== a.x ? b.x > a.x : b.y > a.y };
}

function attachPlatformPlayer(x, z) {
  Player.attach({
    scene: sceneEl(), svg: $('#scene svg'), hero: $('#hero'), body: $('#hero .hero-body'), shadow: $('#hero .hero-shadow'),
    bounds: { x0: 90, x1: 1510, z0: 0, z1: 1 },
    depth: { yFar: 700, yNear: 935, kFar: .6, kNear: 1 },
    x, z,
  });
}

function trainTransform(dx, goesRight) {
  // 列車圖形車頭朝右；反方向時以 x=850 為軸鏡像（車門位置仍對齊月台門）
  return goesRight ? `translate(${dx},0)` : `translate(${dx},0) translate(1700,0) scale(-1,1)`;
}

function openDoors(open, train = true) {
  document.querySelectorAll('#scene .psd-l').forEach(g => g.style.transform = open ? 'translateX(-64px)' : '');
  document.querySelectorAll('#scene .psd-r').forEach(g => g.style.transform = open ? 'translateX(64px)' : '');
  if (train) {
    document.querySelectorAll('#scene .tdoor-l').forEach(g => g.style.transform = open ? 'translateX(-62px)' : '');
    document.querySelectorAll('#scene .tdoor-r').forEach(g => g.style.transform = open ? 'translateX(62px)' : '');
  }
}

async function trainDepart(goesRight, id) {
  const train = $('#train');
  const dist = goesRight ? 2600 : -2600;
  await animate(reduceMotion() ? 10 : 3600, k => alive(id) && train.setAttribute('transform', trainTransform(dist * k, goesRight)), ease.inCubic);
  if (alive(id)) train.style.visibility = 'hidden';
}

async function showPlatform(stationId, mode, from) {
  const id = newSession();
  const s = Game.state;
  s.current = stationId; s.visited[stationId] = true; saveState();
  updateHud();
  const dirs = MRT.directionsAt(stationId).map(d => directionInfo(stationId, d));
  const lineId = from ? from.line : dirs[0].line;
  const signDir = from ? (from.stops.length ? directionInfo(stationId, from) : null) : dirs[0];
  sceneEl().innerHTML = Platform.build(stationId, lineId, signDir);
  const hero = $('#hero');

  if (mode === 'arrive') {
    const train = $('#train');
    train.style.visibility = 'visible';
    train.setAttribute('transform', trainTransform(0, from.goesRight));
    openDoors(true, true);
    attachPlatformPlayer(650, 0);
    hero.style.opacity = 0;
    setPanel(`<div class="panel-note">${esc(stationId)}　到了</div>`);
    await sleep(250);
    await Player.walkTo(650, .8, reduceMotion() ? 10 : 1100, 'in');
    if (!alive(id)) return;
    Player.freeze(false);
    renderPlatformPanel(stationId, dirs);
    // 列車關門離站（玩家已可自由走動）
    (async () => {
      await sleep(1500); if (!alive(id)) return;
      Sound.doorClose();
      await sleep(1900); if (!alive(id)) return;
      openDoors(false, true);
      await sleep(900); if (!alive(id)) return;
      trainDepart(from.goesRight, id);
    })();
    return;
  }
  attachPlatformPlayer(820, .8);
  renderPlatformPanel(stationId, dirs);
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

function renderPlatformPanel(stationId, dirs) {
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
  Player.setInteractions([]);
  $('#panel .dirs').onclick = e => {
    const b = e.target.closest('.dir');
    if (!b) return;
    if (TaipeiTime.state() !== 'open') { showClosed(); return; }
    Sound.click();
    setPlatformTimer(null);
    goToPlatform(stationId, dirs[+b.dataset.i]);
  };
}

// 走到某方向的月台，等車、上車
async function goToPlatform(stationId, dir) {
  const id = newSession();
  const px = Player.active ? Player.x : 820, pz = Player.active ? Player.z : .8;
  sceneEl().innerHTML = Platform.build(stationId, dir.line, dir);
  attachPlatformPlayer(px, pz);
  const t = MRT.label(dir.terminal, dir.line);
  const L = LINES[dir.line];
  const backToDirs = () => { newSession(); renderPlatformPanel(stationId, MRT.directionsAt(stationId).map(d => directionInfo(stationId, d))); };

  for (;;) {
    // 1) 等車：依台灣時間每 3 分鐘一班
    setPanel(`<div class="wait">
        <div class="wait-board" role="timer">
          <span class="chip" style="--c:${L.color};--t:${L.text}">${dir.line}</span>
          <span class="lbl">往 ${esc(t.zh)}<b id="waitMsg">下一班列車</b></span>
          <span class="eta" id="waitEta"></span>
        </div>
        <span class="panel-hint">可以在月台上走動，車來了走到車門前上車</span>
        <button class="btn ghost small" id="changePlatform">換月台</button>
      </div>`);
    $('#changePlatform').onclick = () => { Sound.click(); backToDirs(); };
    Player.setInteractions([]);
    let chimed = false;
    const r = await new Promise(res => {
      const tick = () => {
        if (!alive(id)) return res('stale');
        const eta = TaipeiTime.nextTrainIn(stationId, dir.line, dir.terminal);
        if (eta == null) return res('closed');
        const el = $('#waitEta'); if (!el) return res('stale');
        el.textContent = eta <= 10 ? '進站中' : `${Math.floor(eta / 60)}:${String(eta % 60).padStart(2, '0')}`;
        if (eta <= 9 && !chimed) {
          chimed = true;
          $('#waitMsg').textContent = '列車即將進站';
          Sound.arrivalChime(dir.line);
          setTimeout(() => alive(id) && Sound.announce(`往${t.zh}的列車即將進站，請勿超越月台警戒線。`, `The train to ${t.en} is now arriving.`), 4200);
        }
        if (eta <= 4 || (chimed && eta > 170)) return res('train');
        setTimeout(tick, 400);
      };
      tick();
    });
    if (r === 'stale') return;
    if (r === 'closed') { backToDirs(); return showClosed(); }

    // 2) 列車進站
    const train = $('#train');
    train.style.visibility = 'visible';
    setPanel(`<div class="panel-note"><span class="blink"></span>往 ${esc(t.zh)} 的列車進站中，請勿超越月台警戒線</div>`);
    const start = dir.goesRight ? -2600 : 2600;
    await animate(reduceMotion() ? 10 : 4400, k => alive(id) && train.setAttribute('transform', trainTransform(start * (1 - k), dir.goesRight)), ease.outCubic);
    if (!alive(id)) return;
    await sleep(300);
    Sound.doorOpen();
    openDoors(true);

    // 3) 開門停站：走到任一車門按 E 上車
    let boarded = false, closing = false;
    Player.setInteractions(DOOR_X.map((d, i) => ({
      id: 'board' + i, label: '上車',
      when: p => !closing && Math.abs(p.x - d) < 85,
      run: () => { boarded = true; boardAt(d); },
    })));
    const boardAt = async d => {
      Sound.click();
      Player.setInteractions([]);
      Player.freeze(true);
      await Player.walkTo(d, 0, 300, null);
      await Player.walkTo(d, 0, reduceMotion() ? 10 : 700, 'out');
      if (!alive(id)) return;
      newSession();
      startRide({ line: dir.line, terminal: dir.terminal, stops: dir.stops, idx: 0, from: stationId, goesRight: dir.goesRight, boardX: d });
    };
    setPanel(`<div class="wait">
        <div class="wait-board"><span class="chip" style="--c:${L.color};--t:${L.text}">${dir.line}</span>
          <span class="lbl">往 ${esc(t.zh)}<b>車門開啟中</b></span><span class="eta" id="dwellLeft"></span></div>
        <span class="panel-hint">走到任一車門前，按 <kbd>E</kbd> 或點「上車」</span>
      </div>`);
    const res = await countdown(DWELL, left => {
      if (boarded) return 'stop';
      const el = $('#dwellLeft'); if (el) el.textContent = left;
    }, id);
    if (res !== 'done' || boarded) return;

    // 4) 沒上車：關門、列車離站，等下一班
    closing = true;
    Player.setInteractions([]);
    Sound.doorClose();
    setPanel(`<div class="panel-note"><span class="blink"></span>車門即將關閉</div>`);
    await sleep(1900); if (!alive(id) || boarded) return;
    openDoors(false);
    await sleep(900); if (!alive(id)) return;
    setPanel(`<div class="panel-note">列車已經開走了。下一班 3 分鐘後進站。</div>`);
    await trainDepart(dir.goesRight, id);
    if (!alive(id)) return;
    await sleep(1500);
  }
}

/* ── 車廂 ── */
async function startRide(ride) {
  setPlatformTimer(null);
  Game.ride = ride;
  const id = newSession();
  sceneEl().innerHTML = `<canvas id="outside"></canvas>${Cabin.build(ride.line)}`;
  const canvas = $('#outside');
  const fit = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = sceneEl().getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
    ride.dpr = dpr;
  };
  fit();
  ride.fit = fit;
  window.addEventListener('resize', fit);
  Player.attach({
    scene: sceneEl(), svg: $('#scene svg'), hero: $('#hero'), body: $('#hero .hero-body'), shadow: $('#hero .hero-shadow'),
    bounds: { x0: 140, x1: 1460, z0: .35, z1: 1 },
    depth: { yFar: 770, yNear: 935, kFar: .74, kNear: 1 },
    x: 800, z: .35, speed: 380,
  });
  $('#hero').style.opacity = 0;
  cabinDoors(true, true);
  // 從車門走進車廂
  ride.outsideDraw = null;
  drawOutsideStatic(ride, 0);
  await Player.walkTo(800, .7, reduceMotion() ? 10 : 800, 'in');
  if (!alive(id)) return;
  Player.freeze(false);
  rideSegment(id);
}

function cabinDoors(open, instant) {
  const l = $('.cdoor-l'), r = $('.cdoor-r');
  if (!l) return;
  [l, r].forEach(g => g.style.transition = instant ? 'none' : '');
  l.style.transform = open ? 'translateX(-96px)' : '';
  r.style.transform = open ? 'translateX(96px)' : '';
}

function stationCfg(id, line) {
  const name = MRT.label(id, line);
  return { zh: name.zh, en: name.en, code: MRT.code(id, line), color: LINES[line].color };
}

function setLcd(head, id, line) {
  const n = MRT.label(id, line);
  $('#lcdHead').textContent = head;
  $('#lcdZh').textContent = n.zh;
  $('#lcdEn').textContent = n.en;
}

function segmentCfg(ride) {
  const from = ride.idx === 0 ? ride.from : ride.stops[ride.idx - 1];
  const to = ride.stops[ride.idx];
  const line = ride.line;
  return {
    D: 7200, line, sky: TaipeiTime.sky(),
    dep: stationCfg(from, line), arr: stationCfg(to, line),
    depUg: MRT.undergroundOn(from, line), arrUg: MRT.undergroundOn(to, line),
  };
}

// 窗外畫面（含鏡頭位移）
function paintOutside(ride, cfg, pos, v) {
  const canvas = $('#outside'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { s, ox } = sliceTransform();
  ctx.setTransform(s * ride.dpr, 0, 0, s * ride.dpr, (ox - Player.camX * s) * ride.dpr, 0);
  Outside.draw(ctx, pos, cfg, v);
}
// 停站時持續重畫（鏡頭會跟著玩家移動）
function drawOutsideStatic(ride, pos, cfg = segmentCfg(ride)) {
  const id = session;
  const loop = () => {
    if (!alive(id) || Game.ride !== ride || ride.moving) return;
    paintOutside(ride, cfg, pos, 0);
    requestAnimationFrame(loop);
  };
  loop();
}

async function rideSegment(id) {
  const ride = Game.ride;
  const to = ride.stops[ride.idx];
  const line = ride.line;
  const fullList = [ride.from, ...ride.stops];
  $('#routeStrip').innerHTML = Cabin.routeStrip(line, fullList, ride.idx + 1);
  setLcd('下一站 Next Station', to, line);
  const n = MRT.label(to, line);
  const isTerminal = ride.idx === ride.stops.length - 1;
  Player.setInteractions([]);
  setPanel(`<div class="ride-bar">
      <div class="ride-info">${lineChip(line)}<span>往 ${esc(MRT.label(ride.terminal, line).zh)}</span><span class="sep"></span><span>下一站 <b>${esc(n.zh)}</b></span></div>
      <button class="btn small ghost" id="skipBtn">略過行駛</button>
    </div>`);

  // 關門
  Sound.doorClose();
  await sleep(1900); if (!alive(id)) return;
  cabinDoors(false);
  await sleep(700); if (!alive(id)) return;
  const transfers = MRT.linesAt(to).filter(l => l.line !== line).map(l => LINES[l.line].zh);
  Sound.announce(
    `下一站，${n.zh}。${isTerminal ? '本列車終點站。' : ''}${transfers.length ? `轉乘${transfers.join('、')}的旅客，請在本站換車。` : ''}`,
    `Next station, ${n.en}.${transfers.length ? ' Transfer station.' : ''}`,
  );

  // 行駛
  const cfg = segmentCfg(ride);
  const T = reduceMotion() ? 2.5 : 13, ta = T * .27, td = T * .33, tc = T - ta - td;
  const vmax = cfg.D / (ta / 2 + tc + td / 2);
  const posAt = t => {
    if (t < ta) return .5 * vmax / ta * t * t;
    if (t < ta + tc) return .5 * vmax * ta + vmax * (t - ta);
    const u = Math.min(t - ta - tc, td);
    return .5 * vmax * ta + vmax * tc + vmax * u - .5 * vmax / td * u * u;
  };
  const speedAt = t => (t < ta ? t / ta : t < ta + tc ? 1 : Math.max(0, 1 - (t - ta - tc) / td));
  const shake = $('#cabinShake');
  ride.moving = true;
  Sound.startRumble();
  let skip = false;
  $('#skipBtn').onclick = () => { skip = true; };
  await new Promise(res => {
    const t0 = performance.now(); let offset = 0;
    const frame = now => {
      if (!alive(id)) return res();
      if (skip) { offset = Math.max(offset, T - 1.6 - (now - t0) / 1000); skip = false; }
      const t = Math.min(T, (now - t0) / 1000 + offset);
      const v = speedAt(t);
      paintOutside(ride, cfg, posAt(t), v);
      Sound.setSpeed(v);
      const wob = Math.sin(now / 90) * v * 1.6 + Math.sin(now / 37) * v * .6;
      shake.setAttribute('transform', `translate(0,${wob.toFixed(2)})`);
      t < T ? requestAnimationFrame(frame) : res();
    };
    requestAnimationFrame(frame);
  });
  Sound.stopRumble();
  ride.moving = false;
  if (!alive(id)) return;

  // 到站
  ride.idx++;
  Game.state.visited[to] = true;
  Game.state.current = to;
  Game.state.rides++;
  saveState();
  updateHud();
  drawOutsideStatic(ride, cfg.D, cfg);
  $('#routeStrip').innerHTML = Cabin.routeStrip(line, fullList, ride.idx);
  setLcd(isTerminal ? '終點站 Terminal' : '本站 This Stop', to, line);
  Sound.announce(isTerminal ? `${n.zh}到了，本列車終點站，請全部旅客下車。` : `${n.zh}到了。`, `${n.en}.`);
  await sleep(500); if (!alive(id)) return;
  Sound.doorOpen();
  cabinDoors(true);
  await sleep(600); if (!alive(id)) return;

  // 終點站：獲得該路線的物品
  if (MRT.terminals(line).has(to) && !Game.state.items[line]) {
    Game.state.items[line] = { at: to, time: `${TaipeiTime.date()} ${TaipeiTime.clock()}` };
    saveState(); updateHud();
    await showItemGet(line);
  }

  const mustAlight = isTerminal || ride.mustAlight || TaipeiTime.state() !== 'open';
  let leaving = false, stay = false;
  Player.setInteractions([{
    id: 'alight', label: '下車',
    when: p => !leaving && Math.abs(p.x - 800) < 150,
    run: () => { leaving = true; alight(to, id); },
  }]);
  const head = `${lineChip(line, MRT.code(to, line))}<b>${esc(n.zh)}</b><small>${esc(n.en)}</small>`;
  if (mustAlight) {
    setPanel(`<div class="arrive"><div class="arrive-msg">${head}
        <span class="tag${isTerminal ? '' : ' warn'}">${isTerminal ? '終點站，請下車' : '今日營運已結束，請下車'}</span></div>
        <span class="panel-hint">走到中間的車門，按 <kbd>E</kbd> 或點「下車」</span></div>`);
    return;
  }
  const next = MRT.label(ride.stops[ride.idx], line);
  setPanel(`<div class="arrive">
      <div class="arrive-msg">${head}<span class="tag">車門開啟 <span id="dwellLeft"></span> 秒</span></div>
      <span class="panel-hint">要下車就走到中間的車門按 <kbd>E</kbd>；不動就會繼續開往 ${esc(next.zh)}</span>
      <button class="btn ghost small" id="stayBtn">留在車上</button>
    </div>`);
  $('#stayBtn').onclick = () => { Sound.click(); stay = true; };
  const r = await countdown(DWELL, left => {
    if (leaving || stay) return 'stop';
    const el = $('#dwellLeft'); if (el) el.textContent = left;
  }, id);
  if (leaving || r === 'stale') return;
  rideSegment(id);
}

async function alight(stationId, id) {
  const ride = Game.ride;
  Sound.click();
  Player.setInteractions([]);
  Player.freeze(true);
  await Player.walkTo(800, .35, 400, null);
  await Player.walkTo(800, .35, reduceMotion() ? 10 : 600, 'out');
  if (!alive(id)) return;
  window.removeEventListener('resize', ride.fit);
  Game.ride = null;
  const remaining = ride.stops.slice(ride.idx);
  await showPlatform(stationId, 'arrive', {
    line: ride.line, terminal: ride.terminal, stops: remaining, goesRight: ride.goesRight,
  });
  if (TaipeiTime.state() !== 'open') showClosed();
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

let viewMap = null;
function openMap() {
  $('#mapModal').hidden = false;
  const s = Game.state;
  $('#mapStats').textContent = `已走過 ${Object.keys(s.visited).length} / ${Object.keys(STATIONS).length} 站　搭乘 ${s.rides} 次`;
  viewMap = MapView($('#viewMap'), { visited: () => s.visited, current: () => s.current });
  if (s.current) viewMap.focus(s.current, 520);
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
  $('#btnSound').onclick = () => { const on = Sound.toggle(); $('#btnSound').setAttribute('aria-pressed', on); $('#btnSound').textContent = on ? '音效 開' : '音效 關'; };
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { $('#' + b.dataset.close).hidden = true; });
  $('#closedMap').onclick = openMap;
  $('#closedTitleBtn').onclick = () => { $('#closedOverlay').hidden = true; newSession(); Player.detach(); renderTitle(); showScreen('title'); };
  $('#mapZoomIn').onclick = () => viewMap && viewMap.zoom(1 / 1.4);
  $('#mapZoomOut').onclick = () => viewMap && viewMap.zoom(1.4);
  $('#mapHere').onclick = () => viewMap && Game.state.current && viewMap.focus(Game.state.current, 420);
  $('#charBack').onclick = () => { renderTitle(); showScreen('title'); };
  $('#stationBack').onclick = () => { renderCharSelect(); showScreen('charSelect'); };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') ['bag', 'mapModal'].forEach(id => { $('#' + id).hidden = true; });
  });
  window.addEventListener('resize', () => {
    if (document.body.dataset.screen === 'game') layoutScene();
  });
}
document.addEventListener('DOMContentLoaded', init);
