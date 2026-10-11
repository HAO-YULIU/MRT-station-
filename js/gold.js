/* 黃金與好感度
 * 黃金：秘密任務、稀有探索事件、特殊案件、活動取得；向隱藏店家「霧商人」購買特殊外觀、稀有收藏、特殊道具、迷霧時刻（00:30–06:00）用品
 * 好感度：陌生 0、認識 20、朋友 50、信任 80（隱藏人物檔案）、摯友 120（他的店打折）；每升一級有專屬對話與小禮物
 */

/* ── 好感度 ── */
const FRIEND_TIERS = [[0, '陌生'], [20, '認識'], [50, '朋友'], [80, '信任'], [120, '摯友']];
const friendTier = v => FRIEND_TIERS.filter(([t]) => (v || 0) >= t).pop()[1];
// 信任以上才會說出來的過去（隱藏人物檔案）
const NPC_PAST = {
  chen: '老陳年輕時是捷運第一批站務員。通車那天他值夜班，看見一個提燈的女孩在月台上哭。他一直沒跟別人說過。',
  meiling: '美玲小時候在捷運上走失過，是一位站務員把她送到失物招領處等媽媽。她說：「所以我想當那個等人來領的人。」',
  yulan: '玉蘭阿嬤等的那個人，五十年前在圓山車站說「我去去就回」。那是舊的鐵路圓山站，捷運還沒蓋。',
  kai: '阿凱原本是工程師，因為一次系統錯誤差點釀成事故，自願調去現場當維修工。「機器不會說謊，人會。」',
  linbo: '林伯退休前最後一班車，在新北投支線上多停了一站——那一站不在任何紀錄裡。',
  zhou: '老周年輕時是夜店樂手，四十歲後才當保全。「晚上是我最熟的時間，換個方式陪它而已。」',
  afang: '阿芳的兒子以前也在捷運工作，十年前調去南部。她每天拖地拖到月台盡頭，說那裡是「離他最近的地方」。',
  wang: '王老師教書時，有一個學生每天在作文裡寫「霧」。那個學生後來搬走了，作文本還在老師家。',
  xiaohei: '小黑的試聽帶裡有一首沒發表的歌，叫〈00:30〉。他說那是他在末班車上聽見有人哼的旋律。',
  qiuyue: '秋月剛開始做夜班，是為了照顧白天要上學的女兒。現在女兒都結婚了，她還是習慣晚上醒著。',
  leo: 'Leo 的咖啡店以前是他爸爸的書報攤。每天點兩杯咖啡只喝一杯的那位客人，就是他爸爸的老朋友。',
  peiqi: '佩琪當站務員是因為大學時有一次在捷運上暈倒，是一位站務員救了她。她到現在都還在找那個人。',
  xiuyu: '秀蔅說，她只記得 1987 年的一個晚上，她搭上末班車，車窗外起了霧。等她再醒來，城市已經長出了好多條新的路線。',
};
const Friends = (() => {
  const S = () => Game.state;
  const today = () => TaipeiTime.date();
  function add(id, n, quiet) {
    const s = S(), before = s.friends[id] || 0, after = before + n;
    s.friends[id] = after; saveState();
    if (n <= 0 || !NPCS[id]) return;
    const crossed = FRIEND_TIERS.filter(([t]) => t > 0 && before < t && after >= t).map(([, name]) => name);
    if (crossed.length) setTimeout(() => tierUp(id, crossed[crossed.length - 1]), quiet ? 1800 : 600);
  }
  function tierUp(id, name) {
    const n = NPCS[id], s = S();
    const gifts = { 認識: 'postcard', 朋友: (n.likes || [])[0] || 'bread', 信任: 'pineapplecake', 摯友: 'keychain' };
    const g = gifts[name]; if (g && ITEMS[g]) s.inv[g] = (s.inv[g] || 0) + 1;
    if (name === '信任' && NPC_PAST[id]) { (s.hiddenProfiles = s.hiddenProfiles || {})[id] = NPC_PAST[id]; }
    saveState();
    Sound.itemGet();
    toast(`<b>💗 和${esc(n.name)}的關係：${name}</b><span>${{ 認識: '他記住你了。', 朋友: '他把你當朋友了。', 信任: '他願意告訴你一些過去的事（紀錄 → 人物）。', 摯友: '在他那裡買東西有折扣了。' }[name]}${g && ITEMS[g] ? `　收到 ${ITEMS[g].icon} ${ITEMS[g].name}` : ''}</span>`, 'level');
  }
  // 每天第一次聊天加比較多
  function chatGain(id) { const f = (S().flags.chatDay = S().flags.chatDay || {}); if (f[id] === today()) return 1; f[id] = today(); return 5; }
  // 同一個人一天只能送一次禮
  function canGift(id) { const f = S().flags.giftDay || {}; return f[id] !== today(); }
  function markGift(id) { (S().flags.giftDay = S().flags.giftDay || {})[id] = today(); saveState(); }
  // 摯友的店打折
  const SHOP_OWNER = { cafe: 'leo', shop: 'xiaofen', breakfast: 'atao', stall: 'oldk' };
  function shopDiscount(kind) { const id = SHOP_OWNER[kind]; return id && (S().friends[id] || 0) >= 120 ? .15 : 0; }
  return { add, chatGain, canGift, markGift, shopDiscount, tierUp };
})();

/* ── 黃金 ── */
// 秘密任務的報酬（依類型：隱藏物品／隱藏房間／隱藏謎題／NPC 的另一面／跨站秘密調查／整條秘密故事）
Object.assign(QUESTS.sec_ghost.reward, { money: 400, xp: 300, gold: 2, flag: 'hiddenMap' });
Object.assign(QUESTS.sec_lasttrain.reward, { money: 300, xp: 220, gold: 2, title: 't_lasttrain' });
Object.assign(QUESTS.sec_firsttrain.reward, { money: 150, xp: 160, gold: 1, title: 't_firsttrain' });
Object.assign(QUESTS.sec_branch.reward, { money: 300, xp: 240, gold: 2, items: { branchstamp: 1 } });
Object.assign(QUESTS.sec_circle.reward, { money: 300, xp: 240, gold: 2 });
Object.assign(QUESTS.sec_maxfare.reward, { money: 150, xp: 200, gold: 1, title: 't_farthest' });
Object.assign(QUESTS.sec_seat.reward, { money: 250, xp: 200, gold: 1, profile: 'yulan' });
Object.assign(QUESTS.sec_midnight.reward, { money: 250, xp: 260, gold: 2, title: 't_unregistered' });
Object.assign(QUESTS.sec_friend.reward, { money: 300, xp: 300, gold: 2, profile: 'xiuyu', flag: 'xiuyuTalk' });
Object.assign(QUESTS.sec_dawn.reward, { money: 250, xp: 250, gold: 1, profile: 'yuchen' });
NPC_PAST.yuchen = '雨晨在機場工作，每天早上 7 點從中山出發，晚上在淡水看海。她說：「我在等一班飛機，帶我回到某一年。」';

// 隱藏房間 → 霧商人（隱藏店家）
QUESTS.sec_room = {
  type: 'secret', giver: null, title: '小南門的另一扇門',
  desc: '晚上的小南門站，站務室旁邊有一扇平常鎖著的門，今天是開著的。',
  steps: [{ text: '走進那扇門', goal: { kind: 'inspect', spot: 'office', station: '小南門' } }],
  reward: { money: 220, xp: 220, gold: 1, flag: 'mistShop', place: '小南門・霧的檔案室' },
};
// 整條秘密故事：霧的檔案室
QUESTS.sec_story = {
  type: 'secret', giver: null, title: '霧的檔案室',
  desc: '不存在的月台、小南門的另一扇門、零點……這些事好像都連在一起。霧商人說他知道答案。',
  steps: [{ text: '晚上去小南門找霧商人', goal: { kind: 'talk', npc: 'wushang' } }],
  reward: { money: 900, xp: 600, gold: 6, wear: 'fx_mist', flag: 'mistArchive', title: 't_archive' },
};
Object.assign(NPCS, {
  wushang: {
    name: '霧商人', role: '隱藏店家', station: '小南門', spot: 'mistshop', hours: [[21, 24], [0, 1]], speed: 0, onlyFlag: 'mistShop',
    look: { skin: '#d8c8c0', hair: 'long', hairColor: '#c8c8d0', top: '#3a3a4a', coat: true, bottom: '#2a2a30', hat: 'beret', hatColor: '#4a4a5a', lantern: true },
    likes: ['kcollect', 'ghostticket'],
    lines: ['用黃金交易。新台幣在這裡沒有用。', '這些東西，大部分都是從霧裡撿回來的。'],
    rumors: ['每一條路線的終點後面，都還有一站。'],
    questTalk: { sec_story: '你把三件事連起來了？……好。不存在的月台，是 1987 年那班末班車停下的地方；那扇門後面，是當年沒寄出的站名牌；而零點，是霧唯一會打開的時間。帶著這個，你會在迷霧時刻看見它。' },
  },
});
const WUSHANG_GOODS = [
  { id: 'hc_silver', kind: 'wear', gold: 3 }, { id: 'acc_redberet', kind: 'wear', gold: 4 }, { id: 'bag_lanternbag', kind: 'wear', gold: 5 },
  { id: 'fx_sparkle', kind: 'wear', gold: 6 }, { id: 'top_oldstaff', kind: 'wear', gold: 5 },
  { id: 'firstticket', kind: 'item', gold: 2 }, { id: 'signmodel', kind: 'item', gold: 4 },
  { id: 'detector', kind: 'item', gold: 3 }, { id: 'inspiretea', kind: 'item', gold: 1 },
  { id: 'mistlamp', kind: 'item', gold: 3 }, { id: 'mistticket', kind: 'item', gold: 2 }, { id: 'mistmap', kind: 'item', gold: 4 },
];
Object.assign(ITEMS, {
  branchstamp: { name: '支線紀念章', desc: '新北投與小碧潭兩條支線的合印。', icon: '🔖' },
  firstticket: { name: '1997 首日紀念票', desc: '淡水線通車第一天的紀念票，背面有一個鉛筆寫的「霧」。', icon: '🎫' },
  signmodel: { name: '霧站站牌模型', desc: '一個沒有站碼的站牌模型，站名只有一個字：霧。', icon: '🪧' },
  detector: { name: '探測器', desc: '在背包按「使用」，會標出這一站藏著的東西（調查捷徑）。', icon: '📡' },
  inspiretea: { name: '靈感之茶', desc: '喝了以後，腦袋特別清楚。', icon: '🍵', eat: '喝' },
  mistlamp: { name: '霧燈', desc: '迷霧時刻（00:30–06:00）的隱藏區域用品。迷霧時刻開放後才能使用。', icon: '🏮' },
  mistticket: { name: '霧中車票', desc: '迷霧時刻的隱藏區域用品。站名欄會在霧裡浮現。迷霧時刻開放後才能使用。', icon: '🎟️' },
  mistmap: { name: '霧之地圖', desc: '迷霧時刻的隱藏區域地圖。迷霧時刻開放後才能使用。', icon: '🗺️' },
});
Object.assign(OUTFITS, {
  hc_silver: { slot: 'hairColor', name: '銀白髮色', color: '#d8d8e0', event: 'gold' },
  acc_redberet: { slot: 'acc', name: '紅色貝雷帽', color: '#c4162a', event: 'gold', as: 'acc_beret' },
  bag_lanternbag: { slot: 'bag', name: '提燈背包', color: '#5a3a2a', event: 'gold', as: 'bag_backpack' },
  top_oldstaff: { slot: 'top', name: '舊式站務制服', color: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', event: 'gold' },
  fx_none: { slot: 'fx', name: '無', def: true, free: true },
  fx_mist: { slot: 'fx', name: '腳邊的霧光', event: 'sec_story' },
  fx_sparkle: { slot: 'fx', name: '星光', event: 'gold' },
});
OUTFIT_SLOTS.push(['fx', '特效']);
// 稀有探索事件、隱藏稱號
for (const [id, g] of Object.entries({ a_rare: 1, a_tiles: 1, a_oldmap: 1, a_symbols: 2, a_ticketsall: 3, a_photoset: 2, a_quiet: 1, a_bench: 1, a_quick: 1 })) { const a = ACHIEVEMENTS.find(x => x.id === id); if (a) a.gold = g; }
TITLES.push(
  { id: 't_lasttrain', name: '末班車常客', cond: s => (s.titles || {}).t_lasttrain },
  { id: 't_firsttrain', name: '第一班車的乘客', cond: s => (s.titles || {}).t_firsttrain },
  { id: 't_farthest', name: '最遠的旅人', cond: s => (s.titles || {}).t_farthest },
  { id: 't_unregistered', name: '未登錄旅客', cond: s => (s.titles || {}).t_unregistered },
  { id: 't_archive', name: '霧的檔案管理員', cond: s => (s.titles || {}).t_archive },
  { id: 't_silent', name: '無聲的觀察者', cond: s => Object.keys(s.flags.found || {}).length >= 15 && ((s.stats || {}).obs || 0) >= 3 },
  { id: 't_memory', name: '城市拾憶者', cond: s => Object.keys((s.col || {}).ticket || {}).length >= 10 && Object.keys((s.col || {}).photo || {}).length >= 5 },
  { id: 't_bestie', name: '摯友滿天下', cond: s => Object.values(s.friends).filter(f => f >= 120).length >= 5 },
);
// 特殊案件、活動也給黃金
for (const id of Object.keys(QUESTS)) { const q = QUESTS[id]; if (q.type === 'event') q.reward.gold = q.reward.gold || 1; }

const Gold = (() => {
  const S = () => { const s = Game.state; if (s.gold == null) s.gold = 0; return s; };
  // 霧商人
  function shop() {
    const s = S(), own = s.wardrobe.own;
    const items = WUSHANG_GOODS.filter(g => g.kind === 'item' || Outfits.fits(OUTFITS[g.id].as || g.id, s.char) || !OUTFITS[g.id].as);
    Dialog.show({ name: '霧商人', role: `你的黃金：🪙 ${s.gold}` }, '「用黃金交易。」<br><small>標著「迷霧時刻」的東西，要等 00:30–06:00 的霧打開以後才用得到。</small>', items.map(g => {
      const isWear = g.kind === 'wear', o = isWear ? OUTFITS[g.id] : ITEMS[g.id], have = isWear && own[g.id];
      return { label: `${isWear ? '👕' : o.icon} ${o.name}　🪙 ${g.gold}${have ? '（已擁有）' : ''}`, disabled: have || s.gold < g.gold, run: () => {
        s.gold -= g.gold;
        if (isWear) own[g.id] = true; else s.inv[g.id] = (s.inv[g.id] || 0) + 1;
        saveState(); updateHud(); Sound.itemGet(); toast(`<b>買了 ${o.name}</b><span>剩下 🪙 ${s.gold}</span>`); shop();
      } };
    }).concat([{ label: '離開', run: () => Dialog.close() }]));
  }
  // 探測器：標出這一站藏著的東西（30 秒）
  function detect() {
    const marks = [];
    for (const it of Achievements.items || []) marks.push(it);
    const n = (Achievements.count() || 0) + (Secrets.count() || 0);
    Achievements.reveal && Achievements.reveal(30000);
    Secrets.reveal && Secrets.reveal(30000);
    Sound.click();
    toast(`<b>📡 探測器</b><span>${n ? `這一站還藏著 ${n} 樣東西，已經標出來了（30 秒）。` : '這一站沒有偵測到藏起來的東西。'}</span>`);
  }
  return { shop, detect };
})();

// 霧商人的攤位（只有找到小南門那扇門之後才會出現）
const _extras1 = STATION_EXTRAS;
STATION_EXTRAS = id => _extras1(id).concat(id === '小南門' && typeof Game !== 'undefined' && Game.state && Game.state.flags.mistShop ? ['mistshop'] : []);
