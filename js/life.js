/* 城市生活：各區店家與服務、街頭表演、坐下休息（看筆記、看收藏）、海報與廣告、購物清單與生活紀錄 */

/* ── 各區的店家：不同的商品與服務 ── */
Object.assign(ITEMS, {
  agei: { name: '阿給', desc: '淡水名產，油豆腐裡塞冬粉。', icon: '🍢', price: 45, shop: true, eat: '吃' },
  ironegg: { name: '鐵蛋', desc: '淡水的伴手禮，黑黑硬硬的。', icon: '🥚', price: 100, shop: true },
  fishcracker: { name: '魚酥', desc: '淡水老街的魚酥，酥酥脆脆。', icon: '🐟', price: 80, shop: true },
  onsenegg: { name: '溫泉蛋', desc: '在北投溫泉裡煮熟的蛋。', icon: '🥚', price: 30, shop: true, eat: '吃' },
  towel: { name: '溫泉毛巾', desc: '印著北投溫泉的小毛巾。', icon: '🧖', price: 120, shop: true },
  oyster: { name: '蚵仔煎', desc: '士林夜市的味道。', icon: '🍳', price: 70, shop: true, eat: '吃' },
  tieguanyin: { name: '貓空鐵觀音', desc: '木柵山上的茶葉，送長輩很體面。', icon: '🍃', price: 300, shop: true },
  plush: { name: '動物玩偶', desc: '動物園的小貓熊玩偶。', icon: '🧸', price: 250, shop: true },
  pepperbun: { name: '胡椒餅', desc: '饒河街的胡椒餅，小心燙。', icon: '🥟', price: 60, shop: true, eat: '吃' },
  herbaltea: { name: '青草茶', desc: '龍山寺旁邊的老店，退火。', icon: '🍵', price: 30, shop: true, eat: '喝' },
  amulet: { name: '平安符', desc: '在龍山寺求的平安符。', icon: '🧧', price: 100, shop: true },
  douhua: { name: '豆花', desc: '公館的豆花，加花生和粉圓。', icon: '🍮', price: 50, shop: true, eat: '吃' },
  portrait: { name: '淡水畫像', desc: '街頭畫家幫你畫的速寫，背景是夕陽。', icon: '🖼️' },
});
Object.assign(Station3D.SHOPS, {
  淡水: { name: '淡水老街名產', sign: '名產', color: '#e07a3a', items: ['agei', 'ironegg', 'fishcracker', 'bubbletea'], services: ['portrait'] },
  北投: { name: '北投溫泉小舖', sign: '溫泉', color: '#5a8a9a', items: ['onsenegg', 'towel', 'water'], services: ['footbath'] },
  劍潭: { name: '士林夜市小吃', sign: '夜市', color: '#c4162a', items: ['chicken', 'oyster', 'sausage', 'bubbletea'] },
  動物園: { name: '貓空茶舖＆紀念品', sign: '紀念品', color: '#3d7a4a', items: ['tieguanyin', 'plush', 'water'], services: ['gondola'] },
  松山: { name: '饒河街小吃', sign: '小吃', color: '#a33a3a', items: ['pepperbun', 'chicken', 'bubbletea'] },
  龍山寺: { name: '艋舺老店', sign: '老店', color: '#8a5a3a', items: ['herbaltea', 'amulet', 'pineapplecake'], services: ['fortune'] },
  公館: { name: '公館甜品', sign: '甜品', color: '#d06a8a', items: ['douhua', 'bubbletea', 'bread'] },
});
const SERVICES = {
  fortune: { name: '求籤', price: 20, run: () => {
    const f = Game.state.flags, d = TaipeiTime.date();
    if (f.fortune === d) return Dialog.info('求籤', '今天已經求過了。籤詩說：「一天問一次就夠了。」');
    f.fortune = d;
    const r = Math.random(), lucky = r < .1;
    const t = lucky ? '上上籤：「霧中自有引路燈。」今天會遇到好事。' : r < .4 ? '上籤：「行到水窮處，坐看雲起時。」' : r < .8 ? '中籤：「慢慢來，比較快。」' : '下籤：「今天適合搭車回家早點睡。」';
    if (lucky) Game.reward({ gold: 1 }, '上上籤');
    Dialog.info('求籤', t);
  } },
  footbath: { name: '泡腳（10 分鐘內跑得更快）', price: 80, run: () => {
    World.setSpeedMul(1 + ((Game.state.stats || {}).sta || 0) * .03 + .15);
    setTimeout(() => Progress.applySpeed(), 600000);
    Dialog.info('泡腳', '溫泉水熱熱的，腳底的疲勞都散了。接下來十分鐘，你走路輕快很多。');
  } },
  portrait: { name: '請街頭畫家畫像', price: 150, run: () => { Game.state.inv.portrait = (Game.state.inv.portrait || 0) + 1; saveState(); Dialog.info('畫像', '畫家畫得很快，背景是淡水的夕陽。你把畫像收進背包。'); } },
  gondola: { name: '貓空纜車資訊', price: 0, run: () => Dialog.info('貓空纜車', '從動物園站可以轉搭貓空纜車上山喝茶。山上的鐵觀音是這一帶的名產。') },
};
function servicesMenu(st) {
  const shop = Station3D.SHOPS[st], s = Game.state;
  Dialog.show({ name: shop.name, role: '服務' }, `餘額 NT$ ${s.money}。`, shop.services.map(k => {
    const sv = SERVICES[k], price = Progress.price(sv.price);
    return { label: `${sv.name}${price ? `　NT$ ${price}` : '（免費）'}`, disabled: s.money < price, run: () => { s.money -= price; saveState(); updateHud(); Sound.gate(); Life.log(`在${st}：${sv.name}`); sv.run(); } };
  }).concat([{ label: '離開', run: () => Dialog.close() }]));
}

/* ── 街頭表演（依車站與時段） ── */
const PERFORMERS = [
  { station: '西門', hours: [14, 22], kind: 'dance', name: '街舞團 Zero', text: '一群年輕人跟著節奏跳舞，圍觀的人越來越多。' },
  { station: '台北車站', hours: [11, 20], kind: 'violin', name: '小提琴手安娜', text: '小提琴的聲音在大廳裡迴盪，好幾個趕車的人停下了腳步。' },
  { station: '中山', hours: [15, 21], kind: 'guitar', name: '吉他手阿杰', text: '他唱著一首老歌，副歌的時候有人跟著哼。' },
  { station: '市政府', hours: [17, 22], kind: 'magic', name: '魔術師莫比', text: '他把一張撲克牌變成了一張捷運車票，大家都笑了。' },
  { station: '淡水', hours: [15, 20], kind: 'guitar', name: '海邊的歌手小海', text: '他唱著關於夕陽的歌，窗外的天空剛好開始變橘。' },
  { station: '公館', hours: [18, 22], kind: 'violin', name: '大學生樂手', text: '幾個學生在練習四重奏，偶爾拉錯音就互相笑。' },
  { station: '板橋', hours: [16, 21], kind: 'dance', name: '街舞少女小莓', text: '她一個人跳完一整首，喘著氣對大家鞠躬。' },
];

const Life = (() => {
  const T = THREE;
  const S = () => { const s = Game.state; s.lifelog = s.lifelog || []; s.col = s.col || {}; return s; };
  let perf = null, audience = [], buskTimer = 0;

  /* 生活紀錄 */
  function log(text) {
    const s = S(); s.lifelog.push({ d: TaipeiTime.date(), t: TaipeiTime.clock(), text });
    if (s.lifelog.length > 300) s.lifelog.splice(0, s.lifelog.length - 300);
    saveState();
  }
  function onEvent(ev) {
    if (ev.kind === 'buy' && ITEMS[ev.item]) log(`買了 ${ITEMS[ev.item].icon} ${ITEMS[ev.item].name}`);
    if (ev.kind === 'ride') log(`搭${LINES[ev.line] ? LINES[ev.line].zh : ''}到 ${ev.station}`);
  }
  // 購物清單：任務需要買、需要送的東西
  function shoppingList() {
    const s = S(), out = [];
    for (const [id, st] of Object.entries(s.quests.active)) {
      const q = QUESTS[id], step = q.steps[st.step]; if (!step) continue;
      const g = step.goal;
      if ((g.kind === 'buy' || g.kind === 'give') && g.item && ITEMS[g.item] && !(g.kind === 'give' && s.inv[g.item] > 0)) {
        const where = Object.entries(Station3D.SHOPS).filter(([, sh]) => sh.items.includes(g.item)).map(([k]) => k);
        if (['water', 'greentea', 'sportdrink'].includes(g.item)) where.push('各站的販賣機');
        if (['coffee', 'bread', 'greentea'].includes(g.item)) where.push('市政府 Leo 咖啡');
        out.push({ item: g.item, quest: q.title, where: [...new Set(where)].slice(0, 5) });
      }
    }
    return out;
  }

  /* 街頭表演 */
  function spawn(stationId) {
    clear();
    const h = TaipeiTime.now().hour, pf = PERFORMERS.find(x => x.station === stationId && h >= x.hours[0] && h < x.hours[1]);
    if (!pf) return;
    const C = World.layout.concourse, pos = { x: 0, y: 0, z: C.z0 + 3.2 };
    if (World.groundAt(pos.x, pos.z, 0) == null) return;
    const look = { skin: '#e2b49c', hair: pf.kind === 'dance' ? 'mush' : 'long', hairColor: '#1a1a1a', top: { dance: '#e04848', violin: '#1d1d20', guitar: '#3a5a7a', magic: '#2a2a3a' }[pf.kind], pattern: 'plain', bottom: '#1d1d20', girl: /安娜|小莓/.test(pf.name), hat: pf.kind === 'magic' ? 'cap' : null, hatColor: '#1d1d20' };
    const rig = Human3D.buildPerson(look); rig.root.position.set(pos.x, 0, pos.z); World.scene.add(rig.root);
    if (pf.kind === 'guitar' || pf.kind === 'violin') { const ins = new T.Mesh(new T.BoxGeometry(pf.kind === 'guitar' ? .34 : .2, pf.kind === 'guitar' ? .5 : .32, .08), new T.MeshStandardMaterial({ color: '#8a5a3a', roughness: .5 })); ins.position.set(.05, 1.05, .22); ins.rotation.z = .6; rig.root.add(ins); }
    const caseM = new T.Mesh(new T.BoxGeometry(.9, .1, .32), new T.MeshStandardMaterial({ color: '#1d1d20' })); caseM.position.set(.9, .05, .5); rig.root.add(caseM);
    perf = { ...pf, ...pos, rig, t: 0 };
    // 圍觀的路人
    for (let i = 0; i < 4; i++) {
      const a = -1 + i * .66, ax = Math.sin(a) * 2.8, az = pos.z + 2.4 + Math.cos(a) * .8;
      if (World.groundAt(ax, az, 0) == null) continue;
      const g = ['office', 'student', 'casual', 'tourist'][i], Cc = CROWD_TYPES[g];
      const lk = { skin: '#e2b49c', hairColor: '#1a1a1a', ...Cc.gen(Math.random) }; lk.hair = lk.girl ? 'long' : 'short';
      const r = Human3D.buildPerson(lk); r.root.position.set(ax, 0, az); r.root.rotation.y = Math.atan2(pos.x - ax, pos.z - az); World.scene.add(r.root); audience.push(r);
    }
  }
  function clear() { if (perf) World.scene.remove(perf.rig.root); for (const r of audience) World.scene.remove(r.root); perf = null; audience = []; }
  function tick(dt, now) {
    for (const r of audience) r.update(dt, 0, now / 1000);
    if (!perf) return;
    perf.rig.root.visible = !World.riding;
    perf.rig.update(dt, perf.kind === 'dance' ? 1.6 + Math.sin(now / 300) : 0, now / 1000);
    if (perf.kind === 'dance') perf.rig.root.rotation.y = Math.sin(now / 700) * .8;
    const p = World.player, d = Math.hypot(p.x - perf.x, p.z - perf.z);
    buskTimer -= dt;
    if (buskTimer <= 0 && d < 12 && Math.abs(p.y) < 1 && !World.riding) { Sound.busk(perf.kind, .14 * (1 - d / 14)); buskTimer = perf.kind === 'violin' ? 2.6 : 2.1; }
  }
  const nearPerformer = p => perf && Math.abs(p.y) < 1 && Math.hypot(p.x - perf.x, p.z - perf.z) < 2.2 ? perf : null;
  function watch() {
    const s = S(), pf = perf;
    Dialog.show({ name: pf.name, role: '街頭表演' }, pf.text, [
      { label: '打賞 NT$ 20', disabled: s.money < 20, run: () => {
        s.money -= 20; s.col.tips = s.col.tips || {}; s.col.tips[pf.name] = true; saveState(); updateHud(); Sound.gate();
        log(`打賞了${pf.station}的${pf.name}`);
        Dialog.show({ name: pf.name, role: '街頭表演' }, '表演者對你點頭致意：「謝謝你！」', [{ label: '繼續欣賞', run: () => Dialog.close() }]);
        if (Object.keys(s.col.tips).length >= 5) Achievements.unlock('a_patron');
      } },
      { label: '繼續欣賞', run: () => Dialog.close() },
    ]);
  }

  /* 坐下休息：看調查筆記、看收藏 */
  function nearSeat(p) { const L = World.layout; return L && L.seats && !World.sitting ? L.seats.find(s => Math.abs(s.y - p.y) < .6 && Math.hypot(s.x - p.x, s.z - p.z) < .9) : null; }
  function sitMenu() {
    Dialog.show({ name: '坐下休息', role: World.layout.stationId }, '你在長椅上坐下來，看著來來往往的人。', [
      { label: '閱讀調查筆記', run: notebook },
      { label: '查看收藏', run: () => { Dialog.close(); Progress.open('collect'); } },
      { label: '發一下呆', run: rest },
      { label: '起身', run: () => { Dialog.close(); World.sit(null); } },
      { label: '繼續坐著', run: () => Dialog.close() },
    ]);
  }
  function rest() {
    const s = S(), last = s.flags.restAt || 0;
    const h = TaipeiTime.now().hour, mood = h < 9 ? '早上的光從出口斜斜照進來。' : h < 17 ? '中午的車站有點懶洋洋的。' : h < 21 ? '下班的人潮一波一波經過。' : '夜深了，車站慢慢安靜下來。';
    if (Date.now() - last > 600000) { s.flags.restAt = Date.now(); saveState(); Game.reward({ xp: 15 }, '休息了一下'); }
    Dialog.show({ name: '發呆', role: '' }, `${mood}<br>你什麼都沒想，只是坐著。`, [{ label: '回到選單', run: sitMenu }]);
  }
  function notebook() {
    const s = S(), lines = [];
    for (const [id, st] of Object.entries(s.quests.active)) {
      const q = QUESTS[id], step = q.steps[st.step]; if (!step) continue;
      const cl = (q.clues || []).filter(c => st.clues && st.clues[c.id]).map(c => c.text);
      lines.push(`<b>${esc(q.title)}</b>：${esc(step.text)}${cl.length ? `<br><small>線索：${cl.map(esc).join('；')}</small>` : ''}`);
    }
    for (const [l, so] of Object.entries(s.story || {})) {
      const ev = STORY[l] ? STORY[l].chapters.flatMap(c => [c.evidence, ...((c.choice || {}).options || []).map(o => o.evidence)]).filter(e => e && so.ev && so.ev[e.id]) : [];
      if (ev.length) lines.push(`<b>${LINES[l].zh}的證據</b><br><small>${ev.map(e => `${e.icon} ${esc(e.name)}：${esc(e.desc)}`).join('<br>')}</small>`);
    }
    const recent = s.lifelog.slice(-5).reverse().map(x => `${x.t} ${esc(x.text)}`).join('<br>');
    Dialog.show({ name: '調查筆記', role: '' }, `${lines.length ? lines.join('<br><br>') : '目前沒有進行中的調查。'}${recent ? `<br><br><small>最近：<br>${recent}</small>` : ''}`, [{ label: '回到選單', run: sitMenu }]);
  }

  /* 海報與廣告 */
  function nearAd(p) { const L = World.layout; return L && L.ads ? L.ads.find(a => Math.abs(p.y) < 1 && Math.hypot(a.x - p.x, a.z - p.z) < 1.3) : null; }
  const AD_TEXT = ['捐血中心就在車站出口旁，捐一袋血，救一條命。', '淡水夕照攝影展，在淡水站附近的藝文中心展出。', '搭電扶梯請緊握扶手，不要在電扶梯上行走。', '台北城市散步：每週末都有免費的導覽，從大稻埕走到艋舺。', '海報上只有一團白霧，和一行小字：「你看見了嗎？」右下角印著一頂紅色的貝雷帽。', '夜市小吃節開跑！集滿五個攤位的章，可以換一杯青草茶。', '請勿在月台上奔跑。（海報上的小人跑得很開心。）'];
  function lookAd(a) {
    const s = S(); s.col.posters = s.col.posters || {}; const first = !s.col.posters[a.ad]; s.col.posters[a.ad] = true; saveState();
    const ad = Station3D.ADS[a.ad];
    Dialog.info(`廣告：${ad.zh}`, `${AD_TEXT[a.ad] || ''}${first ? `<br><small>（海報圖鑑：${Object.keys(s.col.posters).length} / ${Station3D.ADS.length}）</small>` : ''}`);
    if (Object.keys(s.col.posters).length >= Station3D.ADS.length) Achievements.unlock('a_posters');
  }
  // 路線指南
  function guide() {
    const rows = LINE_ORDER.map(l => {
      const ids = Puzzles.stations(l), tr = ids.filter(x => MRT.linesAt(x).length > 1).slice(0, 6).map(x => MRT.label(x, l).zh);
      return `${lineChip(l)} <b>${LINES[l].zh}</b>　${MRT.label(ids[0], l).zh} ⇄ ${MRT.label(ids[ids.length - 1], l).zh}<br><small>轉乘站：${tr.join('、')}</small>`;
    }).join('<br>');
    Dialog.info('路線指南 Route guide', rows);
  }

  /* 紀錄頁：生活（購物清單＋生活紀錄） */
  function html() {
    const list = shoppingList(), s = S();
    const days = {}; for (const e of s.lifelog.slice(-60).reverse()) (days[e.d] = days[e.d] || []).push(e);
    return `<h4 class="bag-h">🛒 購物清單</h4>${list.length ? `<ul class="rc-rows">${list.map(x => `<li><b>${ITEMS[x.item].icon} ${esc(ITEMS[x.item].name)}</b><span></span><em></em><small>${esc(x.quest)}${x.where.length ? `　哪裡買：${x.where.map(esc).join('、')}` : ''}</small></li>`).join('')}</ul>` : '<p class="empty-q">目前沒有要買的東西。</p>'}
      <h4 class="bag-h">📔 生活紀錄</h4>${Object.keys(days).length ? Object.entries(days).map(([d, es]) => `<p class="rc-note"><b>${esc(d)}</b><br>${es.map(e => `${e.t}　${esc(e.text)}`).join('<br>')}</p>`).join('') : '<p class="empty-q">還沒有紀錄。</p>'}`;
  }
  return { log, onEvent, shoppingList, spawn, clear, tick, nearPerformer, watch, nearSeat, sitMenu, nearAd, lookAd, guide, html };
})();

ACHIEVEMENTS.push(
  { id: 'a_patron', name: '街頭藝術的支持者', desc: '打賞過五組不同的街頭表演。' },
  { id: 'a_posters', name: '海報圖鑑', desc: '看過所有種類的廣告海報。' },
);
