/* 迷霧之城：迷霧列車（5 站）與四個特殊事件
 *  迷霧列車：每 10 分鐘一班，進站前一分鐘廣播，但不說目的地。目的地是鬼站：如月／妙典／木場／兩水／清平
 *            到了鬼站會接到任務，很容易死掉；完成任務才能離開（迷霧列車不用開回原站，醒來時人在原站）
 *  南港展覽館《第零展區》（難度 6）：展出的是你自己的遊戲歷程，展品配對＋排序
 *  台北車站《記憶》（難度 10）：特殊 NPC 都說認識你，但每個人描述的你都不一樣——判斷每段記憶的真假
 *  隨機一站《兩個你》（難度 9）：另一個你聲稱自己才是真的，你要用「今晚才發生的事」證明自己
 *  淡水《穿越》（難度 10）：特殊列車、滿車的殭屍，想辦法離開這班列車；死了從淡水重來
 */
Object.assign(ITEMS, {
  expo_piece: { name: '第零展區的展品', desc: '一個小小的玻璃展示盒，裡面是你自己的縮小模型。說明牌寫著：「這位旅客，走過了這座城市。」', icon: '🏛️', cat: 'col' },
  fog_record: { name: '迷霧之城玩家紀錄', desc: '一本屬於你的紀錄，寫著你在這座城市裡做過的每一件事。（紀錄 → 迷霧之城 可以翻閱）', icon: '📕', cat: 'col' },
  twin_mirror: { name: '裂開的小鏡子', desc: '從《兩個你》帶回來的鏡子。鏡子裡的你，偶爾會比你晚一點眨眼。', icon: '🪞', cat: 'col' },
  crossing_badge: { name: '穿越者的徽章', desc: '從《穿越》的列車上活著下來的證明。全台北大概沒幾個人有。', icon: '🎖️', cat: 'col' },
});
TITLES.push(
  { id: 't_crossing', name: '穿越者', cond: s => (s.titles || {}).t_crossing },
  { id: 't_twin', name: '真正的我', cond: s => (s.titles || {}).t_twin },
  { id: 't_memory', name: '城市的記憶', cond: s => (s.titles || {}).t_fogmemory },
  { id: 't_expo', name: '第零展區的展品', cond: s => (s.titles || {}).t_expo },
  { id: 't_fogwalker', name: '霧夜行者', cond: s => ((s.fogStats || {}).escapes || 0) >= 5 },
);
ACHIEVEMENTS.push(
  { id: 'a_fog_first', name: '走進霧裡', desc: '第一次度過迷霧之城的夜晚。', check: s => ((s.fogStats || {}).nights || 0) >= 1 },
  { id: 'a_fog_escape', name: '找到出口', desc: '在 06:00 之前離開迷霧。', check: s => ((s.fogStats || {}).escapes || 0) >= 1, gold: 1 },
  { id: 'a_fog_10', name: '十個霧夜', desc: '解開十個車站的迷霧事件。', check: s => Object.values(s.fogLog || {}).filter(l => l.cleared).length >= 10, gold: 2 },
  { id: 'a_fog_ghost', name: '去過不存在的車站', desc: '搭迷霧列車到過鬼站，並且活著回來。', check: s => Object.keys((s.fogCol || {}).ghost || {}).length >= 1, gold: 1 },
  { id: 'a_fog_ghostall', name: '鬼站巡禮', desc: '如月、妙典、木場、兩水、清平，五個鬼站全部去過。', check: s => Object.keys((s.fogCol || {}).ghost || {}).length >= 5, gold: 3 },
  { id: 'a_fog_expo', name: '第零展區', desc: '解開南港展覽館的第零展區。', check: s => !!(s.titles || {}).t_expo, gold: 2 },
  { id: 'a_fog_memory', name: '每個人記得的你', desc: '解開台北車站的記憶事件。', check: s => !!(s.titles || {}).t_fogmemory, gold: 3 },
  { id: 'a_fog_twin', name: '兩個你', desc: '證明自己才是真正的自己。', check: s => !!(s.titles || {}).t_twin, gold: 3 },
  { id: 'a_fog_crossing', name: '穿越', desc: '從淡水的特殊列車上活著下來。', check: s => !!(s.titles || {}).t_crossing, gold: 5 },
  { id: 'a_fog_hidden', name: '霧裡的秘密', desc: '觸發三個迷霧之城的隱藏任務。', check: s => Object.keys((s.fogCol || {}).hidden || {}).length >= 3, gold: 2 },
);

const FogSpecial = (() => {
  const S = () => Game.state;
  const me = () => (S().char === 'aiyun' ? '愛紜' : '軒宇');
  const bye = [{ label: '……', run: () => Dialog.close() }];
  const title = id => { const s = S(); (s.titles = s.titles || {})[id] = TaipeiTime.date(); saveState(); };

  /* ════════ 迷霧列車 ════════ */
  const GHOSTS = {
    kisaragi: { zh: '如月', en: 'Kisaragi', mood: 'ghost' },
    myoden: { zh: '妙典', en: 'Myōden', mood: 'ghost' },
    kiba: { zh: '木場', en: 'Kiba', mood: 'dark' },
    ryosui: { zh: '兩水', en: 'Ryōsui', mood: 'ghost' },
    seihei: { zh: '清平', en: 'Seihei', mood: 'fog' },
  };
  function ghostTrain(K) {
    const ev = K.ev;
    K.hint('廣播說，每十分鐘會有一班列車進站。可是沒有說要去哪裡。');
    K.clue('迷霧列車：每 10 分鐘一班，進站前一分鐘會廣播。');
    let lastSlot = -1, busy = false;
    K.every(() => {
      if (busy || K.dead || K.r.escaped) return;
      const t = TaipeiTime.now(), slot = Math.floor((t.hour * 60 + t.minute) / 10);
      if (t.minute % 10 === 9 && t.second < 2 && ev.ann !== slot) { ev.ann = slot; announce(K); }
      if (t.minute % 10 === 0 && slot !== lastSlot && t.second < 3) { lastSlot = slot; busy = true; arrive(K).then(() => { busy = false; }); }
    });
    K.forceTrain = () => { if (!busy) { busy = true; announce(K); setTimeout(() => arrive(K).then(() => { busy = false; }), 4000); } };
  }
  function announce(K) {
    K.sound('radio');
    const P = platformFor(K);
    K.toast(`<b>📢 「${LINES[P.line].zh}月台，列車即將進站」</b><span>廣播沒有說目的地。月台的看板只顯示「往 ――」。</span>`, 'warn');
  }
  function platformFor(K) { const z = World.zone(); return z.P || K.L.platforms[0]; }
  async function arrive(K) {
    const L = K.L, P = platformFor(K), k = L.platforms.indexOf(P), side = 1;
    const tr = World.spawnTrain(k, side, P.line, 1, null); tr.fog = true;
    K.tintTrain(tr, '#222', '#ff4030');
    Sound.trainArrive();
    await World.trainArrive(tr, 7000);
    if (!FogCity.started) return;
    Sound.doorOpen(); await World.setDoors(tr, true);
    const dest = Object.keys(GHOSTS)[(Math.random() * 5) | 0];
    K.toast('<b>🚃 迷霧列車到了</b><span>車門開著，車廂裡的燈是紅色的。45 秒後關門。</span>', 'level');
    const end = performance.now() + 45000;
    while (performance.now() < end) {
      await sleep(400);
      if (!FogCity.started || K.dead) break;
      const left = Math.ceil((end - performance.now()) / 1000);
      K.hint(`🚃 往 ―― 車門開啟 ${left} 秒・走進車廂上車`);
    }
    Sound.doorClose(); await sleep(1500);
    K.hint('廣播說，每十分鐘會有一班列車進站。可是沒有說要去哪裡。');
    World.clearDoorway(tr); await World.setDoors(tr, false);
    if (World.isInside(tr) && !K.dead) return ride(K, tr, dest);
    await World.trainDepart(tr);
  }
  async function ride(K, tr, dest) {
    const g = GHOSTS[dest], st = K.station, r = K.r;
    clearInterval(Game.ctlTimer); World.setInteractions([]);
    Sound.announce('下一站……', 'Next station...');
    K.setMood('ghost');
    Sound.startRumble();
    setTimeout(() => toast('<b>🚃 車廂裡</b><span>窗外沒有隧道，只有霧。坐在對面的人，全部低著頭。</span>'), 4000);
    await World.ride(tr, { toId: st, alias: { zh: g.zh, en: g.en }, duration: 24, onSpeed: v => Sound.setSpeed(v) });
    Sound.stopRumble();
    r.ghostAt = dest; saveState();
    Sound.announce(`${g.zh}，到了。`, `${g.en}.`, { chime: true });
    startStation(st, { key: 'fog' });
    tr.fog = true;
    setTimeout(async () => { await World.setDoors(tr, true); await sleep(20000); World.clearDoorway(tr); await World.setDoors(tr, false); if (!World.isInside(tr)) World.trainDepart(tr); }, 800);
  }

  // 鬼站的任務
  function ghostStation(K) {
    const dest = K.r.ghostAt, g = GHOSTS[dest], ev = K.ev.ghost = K.ev.ghost || {};
    K.noPhantom = true;
    K.setMood(g.mood);
    if (g.mood === 'dark' && !(S().inv.mistlamp > 0)) { S().inv.mistlamp = 1; K.r.lamp = Math.max(K.r.lamp, 60); saveState(); }
    if (g.mood === 'dark') K.setLamp(true);
    const P0 = K.L.platforms[0];
    K.onRevive = () => { World.placePlayer(P0.x - 20, P0.y, P0.z); for (const c of K.chasers) c.sleep = 8; };
    K.onEscape = () => {
      setTimeout(() => {
        const c = (S().fogCol = S().fogCol || {}); (c.ghost = c.ghost || {})[g.zh] = K.r.night; K.r.ghostAt = null; saveState();
        World.loadStation(K.station); World.spawnInConcourse(); startStation(K.station);
        toast(`<b>🌫 你在${esc(K.station)}醒來</b><span>手裡握著一張車票，站名是「${g.zh}」。</span>`, 'level');
        Achievements.check();
      }, 2200);
    };
    K.toast(`<b>🚉 ${g.zh}</b><span>這個站不在任何一張路線圖上。</span>`, 'warn');
    const far = () => { for (let i = 0; i < 20; i++) { const p = FogEvents.at(K, K.rnd() < .5 ? 'c' : 'p'); if (K.dist(p, World.player) > 14) return p; } return FogEvents.at(K, 'pend'); };
    const finishGhost = (text) => K.done('good', { title: `逃離${g.zh}`, text, escape: true, delay: 2500, gold: 1 });
    const pieces = (n, label, name, kind, texts, onAll, o = {}) => {
      ev.got = ev.got || 0;
      K.spread(n, { rnd: K.rnd, minD: 10 }).forEach((pt, i) => {
        if (ev['p' + i]) return;
        const p = K.prop(kind, pt, { label, tag: 'goal', hidden: o.hidden, use: () => { ev['p' + i] = 1; ev.got++; saveState(); K.removeProp(p); K.sound('bell'); K.toast(`<b>${name}（${ev.got} / ${n}）</b><span>${texts[i] || ''}</span>`); if (texts[i]) K.clue(texts[i]); if (o.onEach) o.onEach(ev.got); if (ev.got >= n) onAll(); } });
      });
    };
    if (dest === 'kisaragi') {   // 如月：太鼓聲、追人的鬼、要你上車的陌生人
      K.clue('如月站：找到回程車票的碎片。不要上任何人的車。');
      for (let i = 0; i < 3; i++) K.chaser('ghost', far(), { speed: 2.5, dmg: 24, range: 16, why: '太鼓聲裡的東西抓住了你', sleep: 6 + i * 5, color: '#f0d0d0' });
      let drumT = 8; K.every(dt => { drumT -= dt; if (drumT <= 0) { drumT = 14 + Math.random() * 8; K.sound('drum'); } });
      const man = K.person(K.look({ top: '#e8e8e4', pattern: 'shirt', bottom: '#2a2a2a' }), FogEvents.at(K, 'u'), { name: '親切的男人', role: '說要載你回家', behavior: 'watch', speed: 0 });
      man.data.key = true;
      man.talk = () => K.say(man, '「這麼晚了，這裡沒有車了。我開車送你回去吧。車就停在出口外面。」他的笑容很好看，眼睛卻一下都沒有眨。', [
        { label: '上他的車', run: () => { Dialog.close(); K.hurt(45, '那台車沒有駕駛座。你差一點就回不來了'); K.clue('不要上那個男人的車。'); } },
        { label: '「不用了，謝謝。」', run: () => { Dialog.close(); K.clue('拒絕了陌生人的便車。'); ev.refused = 1; saveState(); } },
      ]);
      pieces(3, '撿起車票碎片', '回程車票碎片', 'ticket', ['碎片上寫著「往」。', '碎片上寫著「回」。', '碎片上寫著「家」。'], () => finishGhost('三片碎片拼成一張車票：「往 回家」。車票燒了起來，四周的太鼓聲停了。'));
    } else if (dest === 'myoden') {   // 妙典：站名和指標都倒過來；你動它才動
      K.clue('妙典站：收集四頁經文。月台上的東西只有你在動的時候才會動。');
      for (let i = 0; i < 3; i++) K.chaser('shadow', far(), { speed: 3.4, dmg: 22, mode: 'statue', why: '你一動，它就站在你面前了', sleep: 4 + i * 3 });
      pieces(4, '撿起經文', '經文', 'paper', ['「莫回首」', '「莫應聲」', '「莫停步」', '「莫忘歸」'], () => finishGhost('四頁經文拼在一起，月台上所有的影子都低下頭，讓出一條路。'));
    } else if (dest === 'kiba') {   // 木場：漆黑，靠霧燈
      K.clue('木場站：一片漆黑。用霧燈找到四根蠟燭。');
      for (let i = 0; i < 4; i++) K.chaser('shadow', far(), { speed: 2.2, dmg: 20, why: '黑暗裡的手抓住了你', sleep: 8 + i * 4 });
      pieces(4, '點亮蠟燭', '蠟燭', 'lamp', ['一根。黑暗退了一步。', '兩根。', '三根。你聽見木頭裂開的聲音。', ''], () => finishGhost('四根蠟燭都點亮了。你看見木場站的全貌——是一座用木頭搭起來的舊車站，月台上坐滿了等車的人。他們對你點頭。'), { hidden: true });
    } else if (dest === 'ryosui') {   // 兩水：兩個一模一樣的女人，一個是真的
      K.clue('兩水站：兩個一模一樣的女人。只有一個是真的引路人。');
      for (let i = 0; i < 2; i++) K.chaser('ghost', far(), { speed: 2.3, dmg: 22, sleep: 10 + i * 6, color: '#c8e0f0' });
      const real = (Math.random() * 2) | 0;
      K.spread(2, { areas: ['concourse'], rnd: K.rnd, minD: 10 }).forEach((pt, i) => {
        const w = K.person(K.look({ girl: true, hair: 'long', hairColor: '#0a0a0a', top: '#3a5a7a', bottom: '#2a3a4a', skirt: true }), pt, { name: '穿藍衣的女人', role: '引路人？', behavior: 'watch', speed: 0, ghostly: .85 });
        w.data.key = true;
        w.talk = () => K.say(w, i === real ? '「跟我來。左邊的水是活的，右邊的水是死的。」她的衣角是濕的，地上有一小攤水。' : '「跟我來。右邊的水是活的，左邊的水是死的。」她的衣角是乾的。', [
          { label: '跟她走', run: () => { Dialog.close(); if (i === real) finishGhost('她帶你走過一條很窄的走道，兩邊都是水聲。走到盡頭，她說：「回去吧。」'); else { K.hurt(40, '你跟錯了人，掉進了「死的水」'); K.removeNpc(w); } } }, ...bye]);
      });
      pieces(2, '調查水痕', '水痕', 'stain', ['真正的引路人，衣角是濕的。', '假的那個，身上沒有水。'], () => {});
    } else {   // 清平：一開始什麼都沒有，倒數結束後鬼一起出來
      K.clue('清平站：看起來很平靜。……太平靜了。');
      let left = 90, wave = false;
      K.every(dt => {
        if (K.dead || K.r.escaped) return; left -= dt;
        if (!wave) { K.hint(`站裡很安靜。牆上的時鐘在倒數：${Math.ceil(left)}`); if (left <= 0) { wave = true; K.sound('sting'); K.toast('<b>🌫 時鐘歸零</b><span>所有的門同時打開了。撐到下一個鐘響。</span>', 'warn'); for (let i = 0; i < 6; i++) K.chaser(i % 2 ? 'ghost' : 'shadow', far(), { speed: 2.0 + i * .1, dmg: 18, sleep: i * 2 }); left = 120; } }
        else { K.hint(`撐住：${Math.ceil(left)} 秒`); if (left <= 0) { for (const c of [...K.chasers]) K.removeChaser(c); finishGhost('鐘聲響起，所有的東西都回到門後。清平站又安靜了下來，真的安靜了。'); left = 1e9; } }
      });
    }
  }
  for (let i = 1; i <= 5; i++) FogEvents.def('train', 'ft' + i, { base: 'ghosttrain' });
  FogEvents.def('special', 'ghost_station', { base: 'ghoststation' });

  /* ════════ 南港展覽館《第零展區》 ════════ */
  function specialCount() {
    const s = S(), c = s.fogCol || {};
    let n = Object.values(c).reduce((a, x) => a + Object.keys(x).length, 0);
    n += ['firstticket', 'signmodel', 'mistticket', 'branchstamp', 'oldphoto_onsen', 'onsenpass', 'hw_badge'].filter(id => s.inv[id] > 0).length;
    n += Object.keys((s.col || {}).ticket || {}).length;
    return n;
  }
  function expo(K) {
    const s = S(), ev = K.ev, need = 6, have = specialCount();
    const C = K.L.concourse, cx = 0, cz = C.z0 + 7;
    // 展區入口
    const arch = K.canvasSprite(g => { g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, 768, 160); g.fillStyle = '#e8e0c8'; g.font = '900 72px "Noto Serif TC", serif'; g.textAlign = 'center'; g.fillText('第 零 展 區', 384, 92); g.font = '600 32px sans-serif'; g.fillStyle = '#9a9488'; g.fillText('EXHIBITION HALL 0', 384, 138); }, 768, 160, 1.2);
    arch.position.set(cx, 3.4, cz - 3.5); K.group.add(arch);
    const guide = K.person(K.look({ top: '#1a1a1e', bottom: '#1a1a1e', hair: 'bun', girl: true, glasses: true }), { x: cx - 2.5, y: 0, z: cz - 2 }, { name: '展區的導覽員', role: '第零展區', behavior: 'watch', speed: 0 });
    guide.data.key = true;
    if (have < need) {
      guide.talk = () => K.say(guide, `「第零展區還沒有準備好。展品不夠。」她翻了翻手上的名冊。「你帶來的特別的東西：<b>${have} / ${need}</b>。」<br><small>（迷霧裡的收藏、特別的車票、稀有物品都算。）</small>`, bye);
      K.hint('大廳中央多了一道拱門，上面寫著「第零展區」。');
      return;
    }
    // 展品：依照玩家的歷程
    const log = s.fogLog || {}, fogSt = Object.keys(log)[0];
    const friend = Object.entries(s.friends || {}).filter(([id]) => NPCS[id]).sort((a, b) => b[1] - a[1])[0];
    const doneQ = Object.keys(s.quests.done || {}).filter(id => QUESTS[id] && QUESTS[id].title)[0];
    const pairs = [
      { a: { name: '一張普通的悠遊卡', text: `卡片背面用鉛筆寫著：「第一天，${START_STATION}。」` }, b: { name: `${START_STATION}的站名牌`, text: '你旅程開始的地方。' }, when: 1, why: '你從這裡出發。' },
      { a: { name: '一盒糖果', text: friend ? `盒子上寫著「給${me()}，${NPCS[friend[0]].name}」。` : '一盒沒有署名的糖果。' }, b: { name: friend ? `${NPCS[friend[0]].name}的照片` : '一張空白的照片', text: friend ? `照片裡的${NPCS[friend[0]].name}在笑。好感 ${friend[1]}。` : '照片上沒有人。你在這座城市還沒有真正的朋友。' }, when: 3, why: friend ? `你和${NPCS[friend[0]].name}成為了朋友。` : '你還在認識這座城市。' },
      { a: { name: '一張任務單', text: doneQ ? `「${QUESTS[doneQ].title}」——已完成。` : '一張空白的任務單。' }, b: { name: '一枚小小的勳章', text: '背面刻著你的名字。' }, when: 2, why: doneQ ? `你完成了「${QUESTS[doneQ].title}」。` : '你接下了第一件委託。' },
      { a: { name: '一團霧', text: fogSt ? `玻璃罐裡封著一團霧，標籤寫著「${fogSt}」。` : '玻璃罐裡封著一團霧，標籤寫著「今晚」。' }, b: { name: '一盞小燈', text: '你在霧裡走路的時候，手裡一直握著的東西。' }, when: 4, why: fogSt ? `你在${fogSt}度過了霧夜。` : '你走進了迷霧之城。' },
    ];
    const items = pairs.flatMap((p, i) => [{ ...p.a, pair: i }, { ...p.b, pair: i }]);
    const order = FogEvents.shuffle(items.map((_, i) => i), K.rnd);
    ev.matched = ev.matched || {}; ev.wrong = ev.wrong || 0;
    order.forEach((idx, k) => {
      const it = items[idx], col = k % 4, row = (k / 4) | 0;
      const pos = { x: cx - 6 + col * 4, y: 0, z: cz + row * 3.5 };
      const p = K.prop('exhibit', pos, { label: `看展品：${it.name}`, tag: 'goal', r: 1.6, use: () => look(idx) });
      it.prop = p;
    });
    function look(idx) {
      const it = items[idx];
      if (ev.matched[it.pair]) return K.say({ name: it.name, role: '已配對' }, `${it.text}<br><small>說明牌：「${pairs[it.pair].why}」</small>`, bye);
      K.say({ name: it.name, role: '第零展區' }, `${it.text}<br><small>這件展品的說明牌是空白的。它應該和哪一件放在一起？</small>`, items.map((x, j) => ({ x, j })).filter(({ x, j }) => j !== idx && !ev.matched[x.pair]).map(({ x, j }) => ({ label: `和「${x.name}」放在一起`, run: () => {
        if (x.pair === it.pair) { ev.matched[it.pair] = 1; saveState(); K.sound('good'); K.say({ name: '說明牌', role: '浮現了' }, `「${pairs[it.pair].why}」`, [{ label: '好', run: () => { Dialog.close(); if (Object.keys(ev.matched).length === pairs.length) step2(); } }]); }
        else { ev.wrong++; saveState(); K.hurt(10, '展示櫃的玻璃裂開，碎片劃過你的手'); Dialog.close(); }
      } })).concat(bye));
    }
    function step2() {
      K.toast('<b>🏛️ 所有展品都配對好了</b><span>導覽員在等你。</span>', 'level');
      guide.talk = () => {
        if (ev.done) return K.say(guide, '「這是你的展覽。你可以常常回來看。」', bye);
        const picked = [], sorted = pairs.slice().sort((a, b) => a.when - b.when);
        const step = () => {
          const left = pairs.filter(p => !picked.includes(p));
          if (!left.length) {
            ev.done = 1; saveState(); title('t_expo');
            return K.say(guide, `「最後一件展品，是你自己。」<br>導覽員把一個小小的玻璃盒交給你：裡面是一個縮小的你，站在${START_STATION}的月台上。<br>「這座展覽展示的不是城市的歷史，是你的。」`, [{ label: '收下', run: () => { Dialog.close(); K.done(ev.wrong ? 'good' : 'perfect', { title: '第零展區', items: { expo_piece: 1 }, gold: 2, col: [['expo', '第零展區收藏圖鑑']] }); } }]);
          }
          K.say(guide, `「最後一步：照時間的順序，介紹你的展覽。」<br><small>${picked.map(p => p.why).join(' → ') || '（從最早的開始）'}</small>`, FogEvents.shuffle(left, K.rnd).map(p => ({ label: p.why, run: () => { if (p !== sorted[picked.length]) { ev.wrong++; saveState(); K.hurt(12, '展區的燈全滅了一瞬間，有東西撞了你'); return Dialog.close(); } picked.push(p); step(); } })).concat(bye));
        };
        step();
      };
    }
    guide.talk = guide.talk || (() => K.say(guide, '「歡迎來到第零展區。這裡的每件展品，都來自同一位旅客。」她看著你。「把屬於彼此的展品放在一起，說明牌才會出現。」', bye));
    if (Object.keys(ev.matched).length === pairs.length) step2();
    K.hint('大廳中央出現了一個展區：「第零展區」。');
  }
  FogEvents.def('special', 'sp_expo', { base: 'expo' });

  /* ════════ 台北車站《記憶》 ════════ */
  function memory(K) {
    const s = S(), ev = K.ev;
    const pick = (arr, i) => arr[(i * 7 + s.fogSeed) % Math.max(1, arr.length)];
    const visited = Object.keys(s.visited || {}), notVisited = Object.keys(STATIONS).filter(id => !s.visited[id]);
    const friends = Object.entries(s.friends || {}).filter(([id, v]) => v > 0 && NPCS[id]).map(([id]) => id);
    const strangers = Object.keys(NPCS).filter(id => !(s.friends || {})[id] && NPCS[id].look && !['xiuyu', 'ferryman', 'wushang'].includes(id));
    const done = Object.keys(s.quests.done || {}).filter(id => QUESTS[id] && QUESTS[id].title && QUESTS[id].type !== 'secret');
    const notDone = Object.keys(QUESTS).filter(id => !(s.quests.done || {})[id] && QUESTS[id].title && QUESTS[id].type === 'side');
    const fog = Object.entries(s.fogLog || {}).flatMap(([st, l]) => l.results.filter(r => r.choice).map(r => ({ st, ...r })));
    // 每段記憶：說法、真假（true＝真的發生過；false＝沒發生過；'fog'＝發生在霧夜）
    const mems = [];
    if (visited.length > 1) mems.push({ text: `「你在${pick(visited, 1)}下過車吧？我看到你了。」`, truth: true });
    if (notVisited.length) mems.push({ text: `「你上次在${pick(notVisited, 2)}幫了我一個大忙，我一直記得。」`, truth: false });
    if (friends.length) mems.push({ text: `「你跟${NPCS[pick(friends, 3)].name}很熟，對吧？他常常提到你。」`, truth: true });
    if (strangers.length) mems.push({ text: `「${NPCS[pick(strangers, 4)].name}說，你拿走了他的東西。」`, truth: false });
    if (done.length) mems.push({ text: `「是你解決了『${QUESTS[pick(done, 5)].title}』那件事，對吧？謝謝你。」`, truth: true });
    if (notDone.length) mems.push({ text: `「『${QUESTS[pick(notDone, 6)].title}』那件事，你處理得真好。」`, truth: false });
    mems.push({ text: `「你搭了 ${s.rides} 次捷運。我每一次都數著。」`, truth: true });
    mems.push({ text: `「你搭了 ${s.rides + 13} 次捷運。我每一次都數著。」`, truth: false });
    if (fog.length) { const f = pick(fog, 7); mems.push({ text: `「在${f.st}的霧裡，你選了『${f.choice}』。」`, truth: 'fog' }); }
    mems.push({ text: '「你從來沒有來過這裡。我從來沒見過你。」', truth: false });
    const use = FogEvents.shuffle(mems, K.rnd).slice(0, 6);
    const who = FogEvents.shuffle(Object.keys(NPCS).filter(id => NPCS[id].look && NPCS[id].name && !['wushang'].includes(id)), K.rnd).slice(0, use.length);
    ev.judged = ev.judged || {}; ev.wrong = ev.wrong || 0;
    const pts = K.spread(use.length, { areas: ['concourse', 'unpaid'], rnd: K.rnd, minD: 6 });
    K.clue('台北車站：每個人都說認識你，但說法都不一樣。判斷每段記憶是真的、假的，還是發生在霧裡。');
    use.forEach((m, i) => {
      if (ev.judged[i] != null) return;
      const id = who[i], d = NPCS[id];
      const n = K.person(d.look, pts[i], { name: d.name, role: d.role || '', behavior: 'watch', speed: 0 });
      n.data.key = true; n.greeted = false;
      n.talk = () => {
        if (ev.judged[i] != null) return K.say(n, '「……原來是這樣啊。」', bye);
        K.say(n, `${m.text}<br><small>這段記憶是——</small>`, [
          { label: '真的，那是我', run: () => judge(i, n, true) },
          { label: '假的，沒有發生過', run: () => judge(i, n, false) },
          ...(fog.length ? [{ label: '那是霧裡的我', run: () => judge(i, n, 'fog') }] : []),
          ...bye]);
      };
    });
    // 主動打招呼
    K.every(() => { for (const n of K.npcs) if (n.data.key && !n.greeted && K.dist(n, World.player) < 4) { n.greeted = true; K.toast(`<b>${esc(n.name)}</b><span>「${me()}！好久不見！」</span>`); } });
    function judge(i, n, ans) {
      Dialog.close();
      const ok = ans === use[i].truth;
      ev.judged[i] = ok ? 1 : 0; saveState();
      if (!ok) { ev.wrong++; saveState(); K.hurt(22, `${n.name}的記憶像刀一樣刺進你的腦袋`); }
      else K.sound('good');
      K.toast(ok ? `<b>${esc(n.name)}</b><span>「……對，就是這樣。」他的輪廓變清楚了。</span>` : `<b>${esc(n.name)}</b><span>「你在說謊。」他的臉模糊了。</span>`, ok ? '' : 'warn');
      if (ev.wrong >= 3 && !ev.over) { ev.over = 1; saveState(); return K.done('fail'); }
      if (Object.keys(ev.judged).length === use.length && !ev.over) {
        ev.over = 1; saveState(); title('t_fogmemory');
        const rec = record();
        s.fogRecord = rec; s.inv.fog_record = 1; saveState();
        K.say({ name: '台北車站', role: '所有人的記憶' }, `所有人同時安靜下來，轉頭看著你。<br>「原來你是這樣的人。」<br>大廳的地上，出現了一本紅色的書：<b>迷霧之城玩家紀錄</b>。<br><small>${rec.split('\n').slice(0, 4).join('<br>')}……</small>`, [{ label: '收下', run: () => { Dialog.close(); K.done(ev.wrong ? 'good' : 'perfect', { title: '每個人記得的你', gold: 3 }); } }]);
      }
    }
    K.hint('台北車站的大廳裡，很多人在等你。');
  }
  function record() {
    const s = S(), st = s.fogStats || {}, log = s.fogLog || {};
    return [
      `旅客：${me()}`,
      `走過的車站：${Object.keys(s.visited || {}).length} / ${Object.keys(STATIONS).length}`,
      `搭乘次數：${s.rides}`,
      `完成的委託：${Object.keys(s.quests.done || {}).length}`,
      `朋友：${Object.entries(s.friends || {}).filter(([, v]) => v >= 50).map(([id]) => (NPCS[id] || {}).name).filter(Boolean).join('、') || '還沒有'}`,
      `霧夜：${st.nights || 0} 晚，離開迷霧 ${st.escapes || 0} 次，倒下 ${st.deaths || 0} 次`,
      `解開的霧：${Object.entries(log).filter(([, l]) => l.cleared).map(([k, l]) => `${k}（${l.best}）`).join('、') || '還沒有'}`,
      `收藏：${Object.values(s.fogCol || {}).reduce((a, x) => a + Object.keys(x).length, 0)} 件`,
      `紀錄的日期：${TaipeiTime.date()}`,
    ].join('\n');
  }
  FogEvents.def('special', 'sp_memory', { base: 'tpememory' });

  /* ════════ 《兩個你》 ════════ */
  function twin(K) {
    const ev = K.ev; ev.proof = ev.proof || {}; ev.wrong = ev.wrong || 0;
    const words = ['燈', '橋', '雨', '海', '霧', '鐘'], times = ['02:17', '03:44', '01:58', '04:06'], marks = ['鳥', '鑰匙', '星星', '月亮'];
    ev.word = ev.word ?? null; ev.time = ev.time ?? times[(K.rnd() * 4) | 0]; ev.mark = ev.mark ?? marks[(K.rnd() * 4) | 0]; saveState();
    // 只有今晚的你才知道的三件事
    const wall = K.prop('note', FogEvents.at(K, 'spot:notice'), { label: '在牆上寫一個字', glint: false, tag: 'goal', use: () => {
      if (ev.word) return K.say({ name: '牆', role: '' }, `牆上是你寫的字：「${ev.word}」。`, bye);
      K.say({ name: '牆', role: '只有你知道' }, '牆上有一支粉筆。寫一個字吧。', words.map(w => ({ label: w, run: () => { ev.word = w; saveState(); Dialog.close(); K.clue('今晚，我在牆上寫了一個字。'); } })));
    } });
    const clock = K.prop('clock', FogEvents.at(K, 'p'), { label: '看時鐘', glint: false, tag: 'goal', use: () => { ev.sawTime = 1; saveState(); K.say({ name: '月台的時鐘', role: '' }, `時鐘停在 <b>${ev.time}</b>。<br><small>（記住它。）</small>`, bye); K.clue('今晚，我看了月台的時鐘。'); } });
    const coin = K.prop('coin', FogEvents.at(K, 'u'), { label: '撿起一枚硬幣', tag: 'goal', hidden: false, use: () => { ev.sawMark = 1; saveState(); K.removeProp(coin); K.say({ name: '霧裡的硬幣', role: '' }, `硬幣的背面刻著一個圖案：<b>${ev.mark}</b>。`, bye); K.clue('今晚，我撿到了一枚刻著圖案的硬幣。'); } });
    void wall; void clock;
    // 另一個你
    const pos = FogEvents.at(K, 'c');
    const tw = FogEvents.selfPerson(K, pos);
    tw.name = me(); tw.role = '另一個你'; tw.behavior = 'follow'; tw.speed = 1.6; tw.data.key = true;
    const s = S();
    const claims = [`「我叫${me()}。我從${START_STATION}出發，搭了 ${s.rides} 次車。」`, `「我背包裡有 ${Object.values(s.inv).reduce((a, b) => a + b, 0)} 樣東西。不信你數。」`, `「我認識 ${Object.keys(s.friends || {}).length} 個人。你呢？」`, '「你看，我們穿著一樣的衣服。誰能證明你才是真的？」'];
    let ci = 0, grabT = 30;
    tw.talk = () => {
      if (ev.over) return K.say(tw, ev.won ? '……' : '「現在，我就是你了。」', bye);
      const opts = [];
      if (ev.word && !ev.proof.word) opts.push({ label: '「我今晚在牆上寫了什麼字？」', run: () => ask('word', '牆上的字是？', words, ev.word) });
      if (ev.sawTime && !ev.proof.time) opts.push({ label: '「月台的時鐘停在幾點？」', run: () => ask('time', '月台的時鐘停在幾點？', times, ev.time) });
      if (ev.sawMark && !ev.proof.mark) opts.push({ label: '「我撿到的硬幣上刻著什麼？」', run: () => ask('mark', '硬幣上刻著什麼？', marks, ev.mark) });
      K.say(tw, `${claims[ci++ % claims.length]}<br><small>（他知道你過去的一切。可是今晚的事，他不知道。已證明 ${Object.keys(ev.proof).length} / 3）</small>`, opts.concat(bye));
    };
    function ask(k, q, opts, ans) {
      K.say(tw, `另一個你想了想，回答：「${opts[(opts.indexOf(ans) + 1 + ((K.rnd() * (opts.length - 1)) | 0)) % opts.length]}。」<br>現在換你回答：${q}`, FogEvents.shuffle(opts, K.rnd).map(o => ({ label: o, run: () => {
        Dialog.close();
        if (o === ans) { ev.proof[k] = 1; saveState(); K.sound('good'); K.toast(`<b>證明 ${Object.keys(ev.proof).length} / 3</b><span>另一個你的臉，模糊了一點。</span>`); if (Object.keys(ev.proof).length >= 3) win(); }
        else { ev.wrong++; saveState(); K.hurt(20, '你答錯了。另一個你的輪廓變得更清楚'); if (ev.wrong >= 3) lose(); }
      } })));
    }
    function win() {
      ev.over = 1; ev.won = 1; saveState(); title('t_twin');
      K.say(tw, '另一個你看著你，表情一點一點崩落。「……原來，我只是你昨天的樣子。」它碎成了一面小鏡子，掉在地上。', [{ label: '撿起鏡子', run: () => { Dialog.close(); K.removeNpc(tw); K.done(ev.wrong ? 'good' : 'perfect', { title: '真正的我', items: { twin_mirror: 1 }, gold: 2 }); } }]);
    }
    function lose() {
      ev.over = 1; saveState();
      K.hurt(30, '另一個你把你推進了鏡子裡');
      K.done('fail');
    }
    // 它會時不時抓你
    K.every(dt => {
      if (ev.over || K.dead) return;
      grabT -= dt;
      if (grabT <= 0 && K.dist(tw, World.player) < 1.4) { grabT = 25 + K.rnd() * 15; K.hurt(12, '另一個你抓住了你的手：「把位置還給我。」'); }
    });
    K.hint('……有人跟你穿著一模一樣的衣服。');
  }
  FogEvents.def('special', 'sp_twin', { base: 'twin' });

  /* ════════ 淡水《穿越》 ════════ */
  function crossing(K) {
    const ev = K.ev, L = K.L, P = L.platforms[0], k = 0, side = 1;
    K.noPhantom = true;
    ev.tries = ev.tries || 0;
    let tr = null, running = false;
    function spawnTrain() {
      tr = World.spawnTrain(k, side, P.line, 1, null); tr.fog = true;
      tr.group.traverse(o => { if (o.isMesh && o.material) { const m = o.material.clone(); if (m.color) m.color.lerp(new THREE.Color('#5a1010'), .55); if (m.emissive && m.emissiveIntensity > .5) { m.emissive.set('#ffe0a0'); m.emissiveIntensity = .8; } o.material = m; } });
      tr.x = 0; tr.group.position.x = P.x; tr.doorAmt = 0; World.setDoors(tr, true, 400);
      K.cleanup = () => { if (tr) World.removeTrain(tr); };
      const sign = K.canvasSprite(g => { g.fillStyle = '#100404'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#ff4a3a'; g.font = '900 46px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.fillText('往 穿越', 256, 64); }, 512, 96, .5);
      sign.position.set(P.x, P.y + 2.8, P.z + 2.4); K.group.add(sign);
    }
    spawnTrain();
    // 列車長：上車就會遇到
    const conductor = K.person(K.look({ top: '#2a1a1a', pattern: 'uniform', accent: '#8a1a1a', bottom: '#1a1010', hat: 'cap', hatColor: '#3a0a0a', old: true }), { x: P.x - 12, y: P.y, z: P.z + side * Station3D.TRACK }, { name: '列車長', role: '特殊列車', behavior: 'watch', speed: 0 });
    conductor.data.key = true;
    conductor.talk = () => {
      if (running) return K.say(conductor, '「還不快走？第一節車廂的駕駛室，有緊急煞車。鑰匙在某一節車廂裡。」', bye);
      K.say(conductor, `「……你不應該搭上這班車的。」<br>列車長看著你，帽簷下的臉很蒼白。「這班車一旦開出去，車上的乘客就會醒過來。他們不是人了。」<br>「如果你一定要搭——任務只有一個：<b>逃離這班列車</b>。找到緊急煞車的鑰匙，到最前面的駕駛室拉下煞車。」<br><small>難度：幾乎不可能。死了可以重來，從淡水重新上車。</small>`, [
        { label: '「我要搭。」', primary: true, run: () => { Dialog.close(); depart(); } },
        { label: '「我還沒準備好。」', run: () => Dialog.close() },
      ]);
    };
    K.hint('淡水的月台上，停著一班從沒見過的列車。車頭寫著「穿越」。');
    async function depart() {
      if (running) return;
      if (!World.isInside(tr)) { const p = World.player; World.placePlayer(P.x - 10, P.y, P.z + side * Station3D.TRACK, Math.PI / 2); void p; }
      running = true; ev.tries++; saveState();
      Sound.doorClose(); await sleep(1200);
      await World.setDoors(tr, false);
      clearInterval(Game.ctlTimer); World.setInteractions([FogCity.interaction]);
      K.setMood('ghost'); Sound.startRumble(); K.sound('sting');
      // 殭屍、鑰匙、煞車
      const tx = P.x, tz = P.z + side * Station3D.TRACK, ty = P.y;
      const zpos = () => ({ x: tx + (K.rnd() - .5) * 56, y: ty, z: tz + (K.rnd() - .5) * 1.1 });
      for (let i = 0; i < 14; i++) { const p = zpos(); if (Math.abs(p.x - World.player.x) < 6) p.x += 12; K.chaser('zombie', p, { speed: 1.7 + K.rnd() * 1.4, dmg: 26, range: 9, why: '被殭屍咬了一口', sleep: 2 + K.rnd() * 3 }); }
      const keyX = [-24, -12, 12, 24][(K.rnd() * 4) | 0];
      let hasKey = false, pulling = 0, spawnT = 18, escaped = false;
      const key = K.prop('coin', { x: tx + keyX, y: ty, z: tz + .3 }, { label: '撿起：緊急煞車鑰匙', tag: 'goal', use: () => { hasKey = true; K.removeProp(key); K.sound('bell'); K.toast('<b>🔑 拿到鑰匙了</b><span>去最前面的駕駛室！（列車的最前端）</span>', 'level'); } });
      const front = { x: tx + 29.5, y: ty, z: tz };
      const brake = K.prop('console', front, { label: '拉下緊急煞車', glint: false, tag: 'goal', r: 1.8, use: () => {
        if (!hasKey) return K.say({ name: '緊急煞車', role: '' }, '煞車把手上了鎖。鑰匙在某一節車廂裡。', bye);
        if (pulling) return;
        pulling = 6; K.toast('<b>拉住煞車！</b><span>撐住 6 秒，不要離開駕駛室。</span>', 'warn');
      } });
      K.every(dt => {
        if (!running || escaped) return;
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = 14; const p = zpos(); K.chaser('zombie', p, { speed: 2.4, dmg: 26, range: 12, why: '被殭屍咬了一口', sleep: 1 }); K.toast('<b>🧟 又有乘客醒過來了</b>', 'warn'); }
        if (pulling) {
          if (K.dist(front, World.player) > 2.2) { pulling = 0; K.toast('<b>煞車彈回去了</b><span>你離開了駕駛室。</span>', 'warn'); return; }
          pulling -= dt; K.hint(`拉住煞車：${Math.max(0, pulling).toFixed(1)} 秒`);
          if (pulling <= 0) { escaped = true; win(); }
        }
      });
      K.onDeath = () => { running = false; };
      K.onRevive = () => { restart(); };
      await World.ride(tr, { toId: K.station, duration: escaped ? 6 : 240, onSpeed: v => Sound.setSpeed(v), onTick: () => (escaped ? undefined : undefined) });
      Sound.stopRumble();
      if (!escaped && !K.dead) {   // 開回淡水：失敗
        K.toast('<b>🚃 列車開回了淡水</b><span>你沒能逃出去。車門打開，車上的乘客又睡著了。</span>', 'warn');
        K.hurt(20, '列車到站時的劇烈晃動');
        restart();
      }
      void brake;
    }
    function restart() {
      running = false;
      for (const c of [...K.chasers]) K.removeChaser(c);
      for (const p of [...K.props]) if (p.tag === 'goal') K.removeProp(p);
      World.loadStation(K.station);
      const P2 = World.layout.platforms[0]; World.placePlayer(P2.x - 6, P2.y, P2.z - 1.5);
      startStation(K.station);
    }
    function win() {
      ev.won = 1; saveState(); title('t_crossing');
      K.sound('good');
      for (const c of [...K.chasers]) K.removeChaser(c);
      K.say(conductor, '列車發出刺耳的聲音，慢慢停了下來。所有的乘客同時倒下，安靜地睡著了。<br>列車長出現在你身後：「……三十年來，你是第一個。」他摘下帽子，向你鞠躬。<br>列車慢慢倒退，開回淡水。', [{ label: '下車', run: () => { Dialog.close(); K.done(ev.tries <= 2 ? 'perfect' : 'good', { title: '穿越', items: { crossing_badge: 1 }, gold: 3, escape: true, delay: 1500 }); } }]);
    }
  }
  FogEvents.def('special', 'sp_crossing', { base: 'crossing' });

  // 引擎登記到 FogEvents
  Object.assign(FogEvents, { ghosttrain: ghostTrain, ghoststation: ghostStation, expo, tpememory: memory, twin, crossing });
  return { GHOSTS, record, specialCount };
})();
