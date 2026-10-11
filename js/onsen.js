/* 新北投：溫泉特別站（沒有主線委託）
 *   - 非付費區旁的「湯之庭」：大浴池（泡湯）、足湯（坐在長椅上泡腳）、石燈籠、竹籬笆、暖簾
 *   - 泡湯：一天第一次有經驗；之後 10 分鐘「溫泉暖身」走路跑步比較快
 *   - 大型支線「湯之庭的舊招牌」：六個步驟、跨四站，完成有專屬稱號與紀念品、成就
 *   - 隱藏任務（觸發前不會顯示）：月光湯（深夜泡湯）、湯癡（五天泡湯）、溫泉蛋（泡湯時吃溫泉蛋）
 */
Object.assign(ITEMS, {
  onsensign: { name: '湯之庭的舊招牌', desc: '木頭做的招牌，「湯」字的最後一筆被雨水沖淡了。', icon: '🪧' },
  oldphoto_onsen: { name: '老照片：開幕那天', desc: '黑白照片，湯之庭剛開幕，門口站著一位年輕的老闆娘。', icon: '🖼️' },
  onsenpass: { name: '湯之庭年票', desc: '老闆娘送的。泡湯的經驗加倍，冬天也不用排隊。', icon: '🎫', cat: 'col' },
});
Object.assign(NPCS, {
  yumei: {
    name: '林秀琴', role: '湯之庭老闆娘', station: '新北投', spot: 'onsen', speed: 0, hours: [[9, 24]],
    look: { girl: true, old: true, skin: '#e8bca4', hair: 'bun', hairColor: '#4a3a30', top: '#2a4a7a', pattern: 'plain', bottom: '#2a2a30', skirt: true, scarf: '#e8e4dc' },
    gives: ['sq_onsen'], likes: ['onsenegg', 'tieguanyin', 'pineapplecake'],
    lines: ['歡迎來湯之庭，先泡個腳吧。', '這裡的水是從地熱谷那邊引過來的，有一點硫磺味。', '泡湯前記得先沖一下身體喔。', '新北投支線只有一站，可是坐過來的人，都是想好好休息的人。'],
    knows: [{ text: '我十九歲就在這裡幫忙了。那時候門口掛著一塊很大的木頭招牌，颱風那年不見了。' }],
    rumors: ['半夜的時候，大浴池偶爾會多一個人。她什麼也不說，泡一下就走了，池子裡留下一片綠色的葉子。'],
    questTalk: { sq_onsen: '「你真的幫我找回來了……就是這塊。你看，『湯』字最後一筆，是我先生當年自己補上去的。」' },
  },
  ahxiong: {
    name: '阿雄伯', role: '那卡西樂手', station: '北投', spot: 'concourse', speed: 0, hours: [[10, 22]],
    look: { old: true, skin: '#c99a80', hair: 'short', hairColor: '#cfcfcf', top: '#a33a3a', pattern: 'shirt', accent: '#1a1a1a', bottom: '#2a2a30', hat: 'cap', hatColor: '#2a2a30' },
    likes: ['tieguanyin', 'sportdrink'],
    lines: ['以前北投的溫泉旅館，每天晚上都有人點歌。', '那卡西就是走唱，一把吉他、一台手風琴，走到哪唱到哪。', '要不要聽一首？……算了，今天喉嚨不好。'],
    questTalk: { sq_onsen: '「湯之庭的招牌？我記得！颱風隔天，有個背相機的年輕人在路邊撿到，說要拿去拍照。後來他搬去淡水開照相館了，大家都叫他老廖。」' },
  },
  laoliao: {
    name: '老廖', role: '老照相館老闆', station: '淡水', spot: 'concourse', speed: 0, hours: [[10, 20]],
    look: { old: true, skin: '#d8b8a8', hair: 'short', hairColor: '#9a9a9a', top: '#5a6a5a', pattern: 'knit', bottom: '#3a3a40', glasses: true, bag: 'tote', bagColor: '#5a4a3a' },
    likes: ['fishcracker', 'coffee'],
    lines: ['淡水的光，下午四點以後最好看。', '底片相機要慢慢拍，一卷只有三十六張。', '我拍了五十年的照片，最喜歡拍人回家的樣子。'],
    questTalk: { sq_onsen: '「那塊招牌啊……我拍完照，本來要還回去，可是湯之庭整修了好幾年。後來我把它寄放在新北投站，月台盡頭的工作間。這張照片你拿去，是開幕那天拍的。」' },
  },
});
QUESTS.sq_onsen = {
  type: 'side', title: '湯之庭的舊招牌', giver: 'yumei', diff: 'story',
  desc: '新北投「湯之庭」的老闆娘秀琴說，門口那塊用了四十年的木頭招牌，在一次颱風之後就不見了。她一直很想再看它一眼。',
  steps: [
    { text: '到北投問問那卡西樂手阿雄伯', goal: { kind: 'talk', npc: 'ahxiong' } },
    { text: '回到新北投，看看湯之庭的大浴池（找找以前招牌掛在哪裡）', goal: { kind: 'inspect', spot: 'onsen', station: '新北投' } },
    { text: '到淡水找老照相館的老廖', goal: { kind: 'talk', npc: 'laoliao' } },
    { text: '在新北投的月台盡頭找到舊招牌', goal: { kind: 'find', item: 'onsensign', station: '新北投' } },
    { text: '把舊招牌交給秀琴', goal: { kind: 'give', npc: 'yumei', item: 'onsensign' } },
  ],
  clues: [
    { id: 'linbo', text: '林伯說：「颱風那年，新北投支線停駛了一天。」', goal: { kind: 'talk', npc: 'linbo' } },
    { id: 'soak', text: '在湯之庭泡過湯，老闆娘說招牌原本掛在大浴池上方。', goal: { kind: 'soak' } },
  ],
  stepReward: [80, 250],
  outcomes: {
    perfect: { name: '湯之記憶', text: '秀琴把招牌擦乾淨，掛回大浴池的上方。「我先生如果看到，一定會很高興。」她送了你一張年票，說以後湯之庭隨時歡迎你。', reward: { money: 800, xp: 450, ixp: 60, gold: 2, title: 't_onsen', items: { onsenpass: 1, oldphoto_onsen: 1 }, friend: { yumei: 30, ahxiong: 10, laoliao: 10 } } },
    normal: { name: '招牌回來了', text: '秀琴把招牌靠在櫃台旁邊，看了很久。「謝謝你。改天，把它掛回去吧。」', reward: { money: 500, xp: 300, ixp: 40, gold: 1, items: { onsenpass: 1 }, friend: { yumei: 20 } } },
  },
};
// 隱藏任務（觸發前不會顯示）
Object.assign(QUESTS, {
    sec_onsen_moon: { type: 'secret', giver: null, title: '月光湯', desc: '深夜的湯之庭，大浴池裡多了一個人。', steps: [{ text: '在深夜泡湯', goal: { kind: 'soak', night: true } }], reward: { money: 450, xp: 300, gold: 2, ixp: 50, title: 't_moonbath' } },
    sec_onsen_days: { type: 'secret', giver: null, title: '湯癡', desc: '你已經是湯之庭的常客了。', steps: [{ text: '在五個不同的日子泡湯', goal: { kind: 'soak', days: 5 } }], reward: { money: 250, xp: 200, gold: 1, ixp: 30, title: 't_onsenfan' } },
    sec_onsen_egg: { type: 'secret', giver: null, title: '溫泉蛋的正確吃法', desc: '泡著湯吃溫泉蛋，是北投人的秘密。', steps: [{ text: '泡湯的時候吃溫泉蛋', goal: { kind: 'soak', egg: true } }], reward: { money: 150, xp: 150, gold: 1, ixp: 20, items: { onsenegg: 2 } } },
});
TITLES.push(
  { id: 't_onsen', name: '新北投的湯守', cond: s => (s.titles || {}).t_onsen },
  { id: 't_moonbath', name: '月光湯客', cond: s => (s.titles || {}).t_moonbath },
  { id: 't_onsenfan', name: '湯癡', cond: s => (s.titles || {}).t_onsenfan },
);
ACHIEVEMENTS.push(
  { id: 'a_onsen_first', name: '第一次泡湯', desc: '在新北投的湯之庭泡湯。', check: s => (s.flags.onsenDays || []).length >= 1 },
  { id: 'a_onsen_story', name: '湯之記憶', desc: '幫湯之庭找回舊招牌。', check: s => Quests.isDone('sq_onsen'), gold: 1 },
  { id: 'a_onsen_all', name: '北投溫泉通', desc: '發現湯之庭所有的秘密。', check: s => ['sec_onsen_moon', 'sec_onsen_days', 'sec_onsen_egg'].every(id => Quests.isDone(id)), gold: 2 },
);

const Onsen = (() => {
  const T = THREE;
  let steam = [], group = null, soaking = null;
  const S = () => Game.state;
  const day = () => TaipeiTime.date();
  const isNight = () => { const t = TaipeiTime.now(); return t.hour >= 23 || (t.hour === 0 && t.minute < 30); };
  function spawn() {
    clear();
    const L = World.layout; if (!L || !L.onsen) return;
    group = new T.Group(); World.scene.add(group);
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const tex = new T.CanvasTexture(c);
    const { pool, foot } = L.onsen;
    for (let i = 0; i < 26; i++) {
      const fromFoot = i >= 20, sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: .5 }));
      const bx = fromFoot ? foot.x : pool.x, bz = fromFoot ? foot.z + .2 : pool.z, rw = fromFoot ? 1.8 : pool.w / 2 - .4, rd = fromFoot ? .2 : pool.d / 2 - .4;
      sp.userData = { bx: bx + (Math.random() * 2 - 1) * rw, bz: bz + (Math.random() * 2 - 1) * rd, t: Math.random() * 4 };
      group.add(sp); steam.push(sp);
    }
  }
  function clear() { if (group) World.scene.remove(group); group = null; steam = []; soaking = null; }
  function tick(dt) {
    if (!group) return;
    group.visible = !World.riding;
    for (const s of steam) {
      const u = s.userData; u.t += dt * .35; if (u.t > 4) u.t = 0;
      s.position.set(u.bx + Math.sin(u.t * 2) * .1, .4 + u.t * .55, u.bz); const k = .5 + u.t * .45; s.scale.set(k, k, 1); s.material.opacity = .45 * (1 - u.t / 4);
    }
    // 溫泉暖身：走路跑步比較快
    const f = S().flags;
    if (f.onsenUntil && Date.now() < f.onsenUntil) World.setSpeedMul((1 + ((S().stats || {}).sta || 0) * .03) * 1.15);
    else if (f.onsenUntil) { f.onsenUntil = 0; Progress.applySpeed(); toast('<b>溫泉暖身結束了</b><span>身體還是暖暖的</span>'); }
  }
  // 泡湯／泡腳
  function soak(kind) {
    const s = S(), f = s.flags, today = day();
    f.onsenDays = f.onsenDays || [];
    const firstToday = !f.onsenDays.includes(today);
    if (firstToday) f.onsenDays.push(today);
    f.onsenUntil = Date.now() + 10 * 60000;
    saveState();
    const pass = s.inv.onsenpass > 0;
    if (firstToday) Game.reward({ xp: (kind === 'pool' ? 40 : 20) * (pass ? 2 : 1) }, kind === 'pool' ? '♨ 泡湯：全身都暖起來了' : '♨ 泡腳：腳底暖暖的');
    else toast(`<b>♨ ${kind === 'pool' ? '泡湯' : '泡腳'}</b><span>溫泉暖身：10 分鐘內走路比較快</span>`);
    Friends.add('yumei', 1, true);
    const ev = { kind: 'soak', night: isNight(), days: f.onsenDays.length };
    if (ev.night) Quests.secret('sec_onsen_moon');
    if (ev.days >= 5) Quests.secret('sec_onsen_days');
    questEvent(ev);
    Achievements.check();
    soaking = kind;
    menu(kind);
  }
  function menu(kind) {
    const s = S(), btns = [];
    if (s.inv.onsenegg > 0) btns.push({ label: '🥚 吃一顆溫泉蛋', run: () => {
      s.inv.onsenegg--; saveState(); updateHud();
      Quests.secret('sec_onsen_egg'); questEvent({ kind: 'soak', egg: true, night: isNight() });
      toast('<b>🥚 溫泉蛋</b><span>泡著湯吃，蛋黃軟軟的，剛剛好。</span>'); menu(kind);
    } });
    btns.push({ label: '起來', primary: true, run: () => { Dialog.close(); World.sit(null); soaking = null; } });
    Dialog.show({ name: kind === 'pool' ? '♨ 大浴池' : '♨ 足湯', role: '湯之庭' }, isNight() ? '夜裡的湯之庭很安靜，只聽得到水聲。熱氣慢慢往上飄。' : '熱氣慢慢往上飄，硫磺的味道淡淡的。', btns);
  }
  const nearPool = p => { const L = World.layout; if (!L || !L.onsen || Math.abs(p.y) > .3) return false; const P = L.onsen.pool; return Math.abs(p.x - P.x) < P.w / 2 + 1.3 && Math.abs(p.z - P.z) < P.d / 2 + 1.3; };
  const interaction = {
    id: 'onsen:pool', label: '♨ 泡湯',
    when: p => !Dialog.with && !World.sitting && nearPool(p),
    run: () => {
      const P = World.layout.onsen.pool, p = World.player;
      const sx = Math.max(P.x - P.w / 2 + .8, Math.min(P.x + P.w / 2 - .8, p.x)), sz = Math.max(P.z - P.d / 2 + .8, Math.min(P.z + P.d / 2 - .8, p.z));
      World.sit({ x: sx, z: sz, face: Math.atan2(P.x - sx, P.z - sz) + Math.PI, stand: { x: p.x, z: p.z } });
      soak('pool');
    },
  };
  // 坐在足湯長椅上：泡腳
  function footSeat() { const L = World.layout, p = World.player; return L && (L.seats || []).find(s => s.onsen === 'foot' && Math.hypot(s.x - p.x, s.z - p.z) < .3); }
  return { spawn, clear, tick, interaction, soak, footSeat, menu, get soaking() { return soaking; } };
})();
// 足湯長椅：坐下時直接泡腳
{
  const _sitMenu = Life.sitMenu;
  Life.sitMenu = (...a) => (Onsen.footSeat() ? Onsen.soak('foot') : _sitMenu(...a));
}
