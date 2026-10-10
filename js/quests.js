/* 任務：主線（每條線一條，可同時接多條）、支線（最多同時 5 個）、限時活動
 * 目標種類（goal.kind）：
 *   reach   到某站（station）
 *   ride    搭某線到某站（line, station）
 *   talk    和某位 NPC 說話（npc）
 *   inspect 查看車站裡的某個東西（spot，在 station）
 *   find    在某站撿到物品（item, station）
 *   give    把物品交給 NPC（npc, item）
 *   buy     在商店買某樣東西（item）
 * 獎勵：money（新台幣）、xp、items（物品 id → 數量）、friend（NPC id → 好感）
 */
const ITEMS = {
  wallet: { name: '黑色皮夾', desc: '裡面有一張悠遊卡和一張舊照片。', icon: '👛' },
  mochi: { name: '小貓麻糬', desc: '一隻橘白相間的貓，抱起來暖暖的。', icon: '🐱' },
  radio: { name: '老收音機', desc: '開關壞了，卻一直發出沙沙聲。', icon: '📻' },
  letter: { name: '粉紅色信封', desc: '封口貼著一張小小的貓咪貼紙。', icon: '💌' },
  umbrella: { name: '透明雨傘', desc: '傘柄上寫著「小晴」。', icon: '☂️' },
  note1: { name: '紙條（一）', desc: '「第七節車廂，只在霧裡停靠。」', icon: '📝' },
  note2: { name: '紙條（二）', desc: '「00:30 以後，時鐘不會走。」', icon: '📝' },
  note3: { name: '紙條（三）', desc: '「找到她，她記得所有路線。」', icon: '📝' },
  bubbletea: { name: '珍珠奶茶', desc: '半糖少冰。可以送人，也可以自己喝。', icon: '🧋', price: 60, shop: true },
  coffee: { name: '美式咖啡', desc: '上班族最需要的東西。', icon: '☕', price: 55, shop: true },
  onigiri: { name: '御飯糰', desc: '鮪魚口味。', icon: '🍙', price: 35, shop: true },
  pineapplecake: { name: '鳳梨酥', desc: '送禮最安全的選擇。', icon: '🍍', price: 120, shop: true },
  keychain: { name: '捷運吊飾', desc: '迷你車廂造型，掛在包包上很可愛。', icon: '🚇', price: 150, shop: true },
  flower: { name: '一小束花', desc: '車站花店的滿天星。', icon: '💐', price: 180, shop: true },
  flag: { name: '小國旗', desc: '雙十節活動的旗子。', icon: '🇹🇼' },
  photo: { name: '舊照片', desc: '兩個年輕人站在圓山的老站牌前。', icon: '🖼️' },
};

const QUESTS = {
  /* ── 主線（秀蔅給的） ── */
  main_BL: {
    type: 'main', line: 'BL', title: '第七節車廂', giver: 'xiuyu',
    desc: '秀蔅說板南線有一節不存在的車廂，只在霧裡停靠。',
    steps: [
      { text: '搭板南線到市政府，查看月台上的遺失物公告', goal: { kind: 'inspect', spot: 'notice', station: '市政府' } },
      { text: '到台北車站找站務員老陳問問', goal: { kind: 'talk', npc: 'chen' } },
      { text: '到龍山寺，找出大廳角落的奇怪塗鴉', goal: { kind: 'inspect', spot: 'graffiti', station: '龍山寺' } },
      { text: '搭板南線坐到終點站頂埔', goal: { kind: 'ride', line: 'BL', station: '頂埔' } },
    ],
    reward: { money: 300, xp: 220, friend: { xiuyu: 20 } },
  },
  main_BR: {
    type: 'main', line: 'BR', title: '無人駕駛的聲音', giver: 'xiuyu',
    desc: '文湖線的列車沒有司機，可是有人說在大直聽見有人在駕駛室說話。',
    steps: [
      { text: '搭文湖線到大直（地下段），在月台聽聽看', goal: { kind: 'ride', line: 'BR', station: '大直' } },
      { text: '到松山機場站大廳，查看機場告示牌', goal: { kind: 'inspect', spot: 'notice', station: '松山機場' } },
      { text: '到科技大樓找維修工阿凱', goal: { kind: 'talk', npc: 'kai' } },
      { text: '搭文湖線坐到終點站動物園', goal: { kind: 'ride', line: 'BR', station: '動物園' } },
    ],
    reward: { money: 300, xp: 220, friend: { xiuyu: 20 } },
  },
  main_R: {
    type: 'main', line: 'R', title: '淡水夕照', giver: 'xiuyu',
    desc: '有一張被夕陽染紅的舊票卡，日期停在某一天。',
    steps: [
      { text: '到中正紀念堂，查看月台的路線圖', goal: { kind: 'inspect', spot: 'map', station: '中正紀念堂' } },
      { text: '到北投，查看大廳的告示牌', goal: { kind: 'inspect', spot: 'notice', station: '北投' } },
      { text: '搭淡水信義線坐到淡水', goal: { kind: 'ride', line: 'R', station: '淡水' } },
    ],
    reward: { money: 350, xp: 240, friend: { xiuyu: 20 } },
  },
  main_G: {
    type: 'main', line: 'G', title: '碧潭綠葉', giver: 'xiuyu',
    desc: '一片永遠不會枯黃的葉子，葉脈像縮小的路線圖。',
    steps: [
      { text: '到西門，查看大廳角落的塗鴉', goal: { kind: 'inspect', spot: 'graffiti', station: '西門' } },
      { text: '到公館，查看月台路線圖', goal: { kind: 'inspect', spot: 'map', station: '公館' } },
      { text: '搭松山新店線坐到新店', goal: { kind: 'ride', line: 'G', station: '新店' } },
    ],
    reward: { money: 300, xp: 220, friend: { xiuyu: 20 } },
  },
  main_O: {
    type: 'main', line: 'O', title: '停在 00:30 的懷錶', giver: 'xiuyu',
    desc: '一只懷錶的指針停在末班車的時間。',
    steps: [
      { text: '到古亭，查看大廳的告示牌', goal: { kind: 'inspect', spot: 'notice', station: '古亭' } },
      { text: '到民權西路，找出角落的紙條', goal: { kind: 'find', item: 'note2', station: '民權西路' } },
      { text: '搭中和新蘆線坐到蘆洲或迴龍', goal: { kind: 'ride', line: 'O', station: ['蘆洲', '迴龍'] } },
    ],
    reward: { money: 300, xp: 220, friend: { xiuyu: 20 } },
  },
  main_Y: {
    type: 'main', line: 'Y', title: '沒有指針的指南針', giver: 'xiuyu',
    desc: '指南針沒有指針，外圈卻會慢慢朝某個方向發光。',
    steps: [
      { text: '到板橋，查看月台的路線圖', goal: { kind: 'inspect', spot: 'map', station: '板橋' } },
      { text: '到景安，查看大廳的告示牌', goal: { kind: 'inspect', spot: 'notice', station: '景安' } },
      { text: '搭環狀線坐到大坪林或新北產業園區', goal: { kind: 'ride', line: 'Y', station: ['大坪林', '新北產業園區'] } },
    ],
    reward: { money: 300, xp: 220, friend: { xiuyu: 20 } },
  },
  find_xiuyu: {
    type: 'main', title: '找到秀蔅', giver: null,
    desc: '你第一次來到這條線。秀蔅好像也在附近，找到她就能接下這條線的主線。',
    steps: [{ text: '在這條線的車站裡找到秀蔅（她戴著紅色貝雷帽、穿白色長大衣）', goal: { kind: 'talk', npc: 'xiuyu' } }],
    reward: { xp: 30 },
  },

  /* ── 支線 ── */
  wallet: {
    type: 'side', title: '遺失的皮夾', giver: 'lin',
    desc: '上班族林先生早上趕車時，皮夾掉在車上了。',
    steps: [
      { text: '到台北車站的失物招領處問問', goal: { kind: 'talk', npc: 'meiling' }, gain: { wallet: 1 } },
      { text: '把皮夾還給林先生', goal: { kind: 'give', npc: 'lin', item: 'wallet' } },
    ],
    reward: { money: 200, xp: 60, friend: { lin: 15 } },
  },
  cat: {
    type: 'side', title: '走失的麻糬', giver: 'xiaoyu',
    desc: '學生小雨的貓溜進了捷運站，最後有人在龍山寺看到牠。',
    steps: [
      { text: '到龍山寺的大廳角落找找看', goal: { kind: 'find', item: 'mochi', station: '龍山寺' } },
      { text: '把麻糬帶回西門給小雨', goal: { kind: 'give', npc: 'xiaoyu', item: 'mochi' } },
    ],
    reward: { money: 150, xp: 80, friend: { xiaoyu: 20 } },
  },
  sound: {
    type: 'side', title: '月台下的聲音', giver: 'chen',
    desc: '站務員老陳說，台北車站的月台每天晚上都傳出沙沙聲。',
    steps: [
      { text: '在台北車站的淡水信義線月台找出聲音的來源', goal: { kind: 'find', item: 'radio', station: '台北車站' } },
      { text: '把老收音機交給老陳', goal: { kind: 'give', npc: 'chen', item: 'radio' } },
    ],
    reward: { money: 120, xp: 90, friend: { chen: 15 } },
  },
  bench: {
    type: 'side', title: '同一張椅子', giver: 'yulan',
    desc: '玉蘭阿嬤每天坐在中山站的同一張椅子上，等一個五十年前約好的人。',
    steps: [
      { text: '到圓山站的大廳，查看那面老告示牌', goal: { kind: 'inspect', spot: 'notice', station: '圓山' } },
      { text: '到北投找一位叫建國的老先生', goal: { kind: 'talk', npc: 'jianguo' }, gain: { photo: 1 } },
      { text: '把舊照片交給玉蘭阿嬤', goal: { kind: 'give', npc: 'yulan', item: 'photo' } },
    ],
    reward: { money: 100, xp: 150, friend: { yulan: 30, jianguo: 20 } },
  },
  letter: {
    type: 'side', title: '一封信', giver: 'jiaying',
    desc: '市政府站的佳穎想把一封信交給在公館讀書的學長，可是自己不敢去。',
    steps: [{ text: '把信送到公館給學長俊宏', goal: { kind: 'give', npc: 'junhong', item: 'letter' } }],
    reward: { money: 150, xp: 70, friend: { jiaying: 15, junhong: 10 } },
  },
  sametrain: {
    type: 'side', title: '每天同一班車', giver: 'chen',
    desc: '老陳注意到，有位西裝男子每天都搭同一班車，下車後卻不出站。',
    steps: [
      { text: '在忠孝復興找到那位西裝男子', goal: { kind: 'talk', npc: 'suit' } },
      { text: '到台大醫院站看看他要去哪裡', goal: { kind: 'reach', station: '台大醫院' } },
      { text: '回台北車站把你看到的告訴老陳', goal: { kind: 'talk', npc: 'chen' } },
    ],
    reward: { money: 180, xp: 140, friend: { chen: 10, suit: 20 } },
  },
  couple: {
    type: 'side', title: '替他們傳話', giver: 'azhe',
    desc: '板橋的阿哲和景安的小晴吵架了，兩個人都要你幫忙傳一句話。',
    steps: [
      { text: '到景安把阿哲的話告訴小晴', goal: { kind: 'talk', npc: 'xiaoqing' } },
      { text: '回板橋把小晴的回覆告訴阿哲', goal: { kind: 'talk', npc: 'azhe' } },
    ],
    reward: { money: 120, xp: 100, friend: { azhe: 15, xiaoqing: 15 } },
  },
  umbrella: {
    type: 'side', title: '透明雨傘', giver: 'meiling',
    desc: '失物招領的美玲說，常常有人把傘忘在車廂裡。',
    steps: [
      { text: '在搭車時撿到一把遺落的雨傘', goal: { kind: 'find', item: 'umbrella', station: null } },
      { text: '交給台北車站失物招領處的美玲', goal: { kind: 'give', npc: 'meiling', item: 'umbrella' } },
    ],
    reward: { money: 80, xp: 60, friend: { meiling: 15 } },
  },
  graffiti: {
    type: 'side', title: '霧的塗鴉', giver: 'ahua',
    desc: '西門的街頭藝人阿華說，城裡出現了署名「霧」的塗鴉。',
    steps: [
      { text: '找到南港站的塗鴉', goal: { kind: 'inspect', spot: 'graffiti', station: '南港' } },
      { text: '找到古亭站的塗鴉', goal: { kind: 'inspect', spot: 'graffiti', station: '古亭' } },
      { text: '找到中山站的塗鴉', goal: { kind: 'inspect', spot: 'graffiti', station: '中山' } },
      { text: '回西門告訴阿華', goal: { kind: 'talk', npc: 'ahua' } },
    ],
    reward: { money: 200, xp: 160, items: { keychain: 1 }, friend: { ahua: 20 } },
  },
  busker: {
    type: 'side', title: '街頭藝人的飲料', giver: 'ahua',
    desc: '阿華唱了一下午，口好渴。',
    steps: [
      { text: '在商店買一杯珍珠奶茶', goal: { kind: 'buy', item: 'bubbletea' } },
      { text: '送給西門的阿華', goal: { kind: 'give', npc: 'ahua', item: 'bubbletea' } },
    ],
    reward: { money: 100, xp: 50, friend: { ahua: 15 } },
  },
  tourist: {
    type: 'side', title: '往淡水的路', giver: 'tom',
    desc: '觀光客 Tom 想去淡水看夕陽，但看不懂中文站名。',
    steps: [{ text: '在淡水和 Tom 會合', goal: { kind: 'talk', npc: 'tom' } }],
    reward: { money: 150, xp: 90, items: { pineapplecake: 1 }, friend: { tom: 20 } },
  },
  lategirl: {
    type: 'side', title: '末班車前', giver: 'yating',
    desc: '晚上在市政府加班的雅婷說，最近回家的路上總覺得有人跟著。',
    steps: [{ text: '陪她搭到永春，在永春跟她說話', goal: { kind: 'talk', npc: 'yating' } }],
    reward: { money: 120, xp: 110, friend: { yating: 25 } },
  },
  notes: {
    type: 'side', title: '三張紙條', giver: null,
    desc: '你在角落撿到一張奇怪的紙條，好像還有其他張。',
    steps: [
      { text: '在南港展覽館找到紙條（一）', goal: { kind: 'find', item: 'note1', station: '南港展覽館' } },
      { text: '在民權西路找到紙條（二）', goal: { kind: 'find', item: 'note2', station: '民權西路' } },
      { text: '在淡水找到紙條（三）', goal: { kind: 'find', item: 'note3', station: '淡水' } },
    ],
    reward: { money: 250, xp: 200 },
  },

  /* ── 限時活動 ── */
  event_double10: {
    type: 'event', title: '雙十節：找國旗', giver: 'eventstaff', month: 10, days: [8, 9, 10, 11, 12],
    desc: '國慶日活動期間，三個車站藏了小國旗。',
    steps: [
      { text: '在中正紀念堂找到小國旗', goal: { kind: 'find', item: 'flag', station: '中正紀念堂' } },
      { text: '在台北車站找到小國旗', goal: { kind: 'find', item: 'flag', station: '台北車站' } },
      { text: '在市政府找到小國旗', goal: { kind: 'find', item: 'flag', station: '市政府' } },
    ],
    reward: { money: 1010, xp: 250 },
  },
};
const SIDE_LIMIT = 5;

/* ── 任務進度 ── */
const Quests = (() => {
  const S = () => Game.state;
  const active = () => S().quests.active;
  const isActive = id => !!active()[id];
  const isDone = id => !!S().quests.done[id];
  const sideCount = () => Object.keys(active()).filter(id => QUESTS[id].type === 'side').length;
  function canAccept(id) {
    const q = QUESTS[id];
    if (!q || isActive(id) || isDone(id)) return false;
    if (q.type === 'side' && sideCount() >= SIDE_LIMIT) return false;
    return true;
  }
  function accept(id) {
    if (!canAccept(id)) return false;
    active()[id] = { step: 0 };
    saveState();
    Game.onQuestChange && Game.onQuestChange('accept', id);
    return true;
  }
  function abandon(id) {
    if (QUESTS[id].type === 'main') return false;
    delete active()[id]; saveState();
    Game.onQuestChange && Game.onQuestChange('abandon', id);
    return true;
  }
  const match = (want, got) => (Array.isArray(want) ? want.includes(got) : want === got);
  // 事件：{kind, station, line, npc, item, spot}；回傳完成的步驟描述
  function emit(ev) {
    const done = [];
    for (const id of Object.keys(active())) {
      const q = QUESTS[id], st = active()[id], step = q.steps[st.step];
      if (!step) continue;
      const g = step.goal;
      let ok = false;
      if (g.kind !== ev.kind) {
        // 搭到某站也算「到達」
        if (g.kind === 'reach' && ev.kind === 'ride') ok = match(g.station, ev.station);
      } else if (g.kind === 'reach') ok = match(g.station, ev.station);
      else if (g.kind === 'ride') ok = g.line === ev.line && match(g.station, ev.station);
      else if (g.kind === 'talk') ok = g.npc === ev.npc;
      else if (g.kind === 'inspect') ok = g.spot === ev.spot && match(g.station, ev.station);
      else if (g.kind === 'find') ok = g.item === ev.item && (g.station == null || match(g.station, ev.station));
      else if (g.kind === 'give') ok = g.npc === ev.npc && g.item === ev.item;
      else if (g.kind === 'buy') ok = g.item === ev.item;
      if (!ok) continue;
      st.step++;
      if (step.gain) for (const [it, n] of Object.entries(step.gain)) S().inv[it] = (S().inv[it] || 0) + n;
      done.push({ id, text: step.text });
      if (st.step >= q.steps.length) finish(id);
    }
    if (done.length) saveState();
    return done;
  }
  function finish(id) {
    const q = QUESTS[id];
    delete active()[id];
    S().quests.done[id] = Date.now();
    Game.reward(q.reward, `完成任務「${q.title}」`);
    Game.onQuestChange && Game.onQuestChange('done', id);
  }
  // 某個步驟現在需要的 NPC／物品／查看點（給 NPC 與場景判斷用）
  function wants(kind, pred) {
    for (const id of Object.keys(active())) {
      const step = QUESTS[id].steps[active()[id].step];
      if (step && step.goal.kind === kind && pred(step.goal, id)) return { id, step };
    }
    return null;
  }
  // 限時活動：依真實日期
  function eventsNow() {
    const t = TaipeiTime.now();
    return Object.keys(QUESTS).filter(id => QUESTS[id].type === 'event' && QUESTS[id].month === t.month && QUESTS[id].days.includes(t.day));
  }
  return { accept, abandon, canAccept, isActive, isDone, emit, wants, sideCount, eventsNow };
})();
