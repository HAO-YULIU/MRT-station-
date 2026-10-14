/* 新手教學：剛建立角色時，一步一步帶玩家搭第一班車（可以隨時跳過）
 *  1 搭電扶梯到月台 → 2 走進列車 → 3 坐到下一站下車 → 4 用地圖免費傳送回南港展覽館 → 5 找林姐接一個每日委託
 *  完成送 NT$100、經驗 80；結束（完成或跳過）後才開始序章與秀蔅的委託，不會一次全部擠在一起
 *  已經玩過序章的舊存檔：不會出現教學（設定頁可以重新開始）
 */
const Tutorial = (() => {
  const HOME = '南港展覽館';
  const STEPS = [
    { t: '跟著「月台」指標，搭電扶梯下到月台', ok: z => z.kind === 'platform' },
    { t: '走到月台任一側等車；車門打開後，走進車廂', ok: z => z.kind === 'train' || !!Game.ride },
    { t: '坐到下一站。車門打開後，走出車廂', ok: z => Game.state.current !== HOME && (z.kind === 'platform' || z.kind === 'concourse') },
    { t: '打開「地圖」，點南港展覽館，用免費傳送回去（教學這次不算次數）', ok: () => Game.state.current === HOME && !Game.ride },
    { t: '在大廳找委託所的林姐，接一個每日委託', ok: () => Object.keys(Game.state.quests.active).concat(Object.keys(Game.state.quests.done)).some(id => /^daily_/.test(id)) || !linHere() },
  ];
  const S = () => Game.state;
  const linHere = () => { const h = TaipeiTime.now().hour; return h >= 7 && h < 23; };   // 林姐 07–23 在；其他時間這步直接算完成
  let timer = null, bar = null;
  const tut = () => S().flags.tutorial;   // undefined（還沒開始）／數字（進行中的步驟）／'done'／'skip'
  // 進遊戲時呼叫：要接手（顯示教學）就回傳 true，開場劇情等教學結束再說
  function gate() {
    const s = S();
    if (s.flags.prologue || s.flags.xiuyuIntro) { if (tut() == null) { s.flags.tutorial = 'done'; saveState(); } }
    const v = tut();
    if (v === 'done' || v === 'skip') { hideBar(); return false; }
    if (FogCity.active()) return false;          // 迷霧時段不教學，天亮後再說
    if (typeof v === 'number') { start(v); return true; }
    offer(); return true;
  }
  function offer() {
    Dialog.show({ name: '📘 新手教學', role: '大約 3 分鐘・隨時可以跳過' },
      `歡迎來到台北捷運，${esc(playerName())}。<br>要不要跟著走一遍：搭電扶梯到月台 → 搭第一班車 → 到下一站下車 → 傳送回來 → 接第一個委託？<br><small>完成會拿到 NT$ 100 和一點經驗。</small>`,
      [{ label: '開始教學', primary: true, run: () => { Dialog.close(); start(0); } }, { label: '跳過教學', run: () => { Dialog.close(); skip(); } }]);
  }
  function start(i) {
    S().flags.tutorial = i; saveState();
    showBar(); clearInterval(timer); timer = setInterval(tick, 500); tick();
  }
  function tick() {
    const v = tut(); if (typeof v !== 'number') return stop();
    if (document.body.dataset.screen !== 'game' || FogCity.active()) return;
    const z = World.zone();
    if (STEPS[v].ok(z)) {
      Sound.gate && Sound.gate();
      if (v + 1 >= STEPS.length) return finish();
      S().flags.tutorial = v + 1; saveState();
      toast(`<b>✓ 教學 ${v + 1} / ${STEPS.length}</b><span>${STEPS[v + 1].t}</span>`);
    }
    showBar();
  }
  function showBar() {
    const v = tut(); if (typeof v !== 'number') return hideBar();
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'tut-bar'; bar.id = 'tutBar';
      bar.addEventListener('click', e => { if (e.target.closest('[data-skip]')) { Sound.click(); confirmSkip(); } });
      document.getElementById('game').appendChild(bar);
    }
    const html = `<span class="tut-n">📘 ${v + 1} / ${STEPS.length}</span><span class="tut-t">${STEPS[v].t}</span><button type="button" data-skip="1">跳過</button>`;
    if (bar.dataset.v !== String(v)) { bar.innerHTML = html; bar.dataset.v = String(v); }
    bar.hidden = false;
  }
  function hideBar() { if (bar) bar.hidden = true; }
  function confirmSkip() {
    Dialog.show({ name: '📘 新手教學', role: '' }, '要跳過剩下的教學嗎？之後可以在「選單 → 設定」重新開始。', [
      { label: '跳過', primary: true, run: () => { Dialog.close(); skip(); } }, { label: '繼續教學', run: () => Dialog.close() }]);
  }
  function stop() { clearInterval(timer); timer = null; hideBar(); }
  function after() { if (typeof opening === 'function' && S().current === HOME) setTimeout(opening, 600); }
  function skip() { S().flags.tutorial = 'skip'; saveState(); stop(); toast('<b>已跳過新手教學</b><span>迷路了可以點資訊框上的 🧭，或看大廳的新手指南看板</span>'); after(); }
  function finish() {
    S().flags.tutorial = 'done'; saveState(); stop();
    Game.reward({ money: 100, xp: 80 }, '新手教學完成！');
    after();
  }
  function restart() {
    if (Game.ride) return toast('<b>搭車中</b><span>下車之後再重新開始教學</span>', 'warn');
    if (FogCity.locked()) return toast('<b>迷霧之城</b><span>06:00 以後再重新開始教學</span>', 'warn');
    const s = S();
    if (s.current !== HOME) { if (typeof teleport === 'function') { s.visited[HOME] = true; freeHop = true; teleport(HOME).then(() => start(0)); return; } }
    start(0);
  }
  // 教學的第 4 步（傳送回南港展覽館）、重新開始時的傳送：不算今天的免費次數
  let freeHop = false;
  function freeTeleport() { if (freeHop) { freeHop = false; return true; } return tut() === 3; }
  return { gate, restart, freeTeleport, get step() { return tut(); }, STEPS };
})();
