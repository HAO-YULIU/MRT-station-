/* NPC：有名字的角色（任務、好感、傳話）＋依時段出現的人群；秀蔅與主線
 * 好感：0–19 陌生、20–49 認識、50–79 朋友、80 以上信任（信任後會說出傳聞）
 */
const XIUYU_LOOK = {
  girl: true, skin: '#f3d6c8', hair: 'long', hairColor: '#e9e7f0', top: '#f6f4ee', coat: true, bottom: '#2a2a31',
  hat: 'beret', hatColor: '#c4162a', scarf: '#c4162a', shoes: '#5a1a1a', lantern: true, armSwing: .15,
};

const NPCS = {
  xiuyu: {
    name: '秀蔅', role: '提著燈的女孩', look: XIUYU_LOOK, speed: .8,
    lines: ['霧又變濃了。每條路線的盡頭，都有一樣東西在等人去拿。', '我記得所有的路線……可是我想不起來，我是從哪一站上車的。', '你身上有末班車的味道。'],
    rumors: ['00:30 以後，有些月台會亮起不存在的站名。', '聽說第七節車廂的門，只對記得自己名字的人打開。'],
  },
  chen: {
    name: '老陳', role: '站務員', station: '台北車站', spot: 'service', hours: [[6, 24]], speed: 0,
    look: { skin: '#d8a88e', hair: 'short', hairColor: '#55534f', top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b', old: true },
    gives: ['sound', 'sametrain'], likes: ['coffee', 'pineapplecake'],
    lines: ['在台北車站做了二十八年，什麼怪事沒見過。', '要轉板南線的話，搭電扶梯上大廳再往右走。', '有東西掉了就去失物招領，找美玲。'],
    rumors: ['以前末班車開走以後，我常聽見月台下面有人在數站名。', '那位每天搭同一班車的先生，看起來好累。'],
    questTalk: { main_BL: '第七節車廂？……我年輕的時候也聽過。去龍山寺看看，那裡大廳角落有一個怪塗鴉。', sametrain: '原來他是去看住院的女兒啊……謝謝你，下次我會多跟他打聲招呼。' },
    knows: [{ npc: 'meiling', text: '美玲人很好，就是記性太好了，每一把傘她都記得是誰的。' }],
  },
  meiling: {
    name: '美玲', role: '失物招領', station: '台北車站', spot: 'lostfound', hours: [[8, 21]], speed: 0,
    look: { girl: true, skin: '#efc6b2', hair: 'bun', hairColor: '#2a1d18', top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', glasses: true },
    gives: ['umbrella'], likes: ['bubbletea', 'flower'],
    lines: ['今天又收到七把雨傘，台北人真的很常忘記帶傘回家。', '撿到東西的話可以拿來這裡喔。'],
    rumors: ['有一張舊車票一直沒人來領，上面的日期是三十年前的。'],
    questTalk: { wallet: '黑色皮夾？有，早上有人送來。裡面有張舊照片……你幫我拿給失主吧。' },
  },
  lin: {
    name: '林先生', role: '上班族', station: '台北車站', spot: 'concourse', hours: [[7, 10], [17, 21]], speed: 1.8,
    look: { skin: '#dcae95', hair: 'short', hairColor: '#151515', top: '#2c3440', pattern: 'shirt', accent: '#7a1f2b', bottom: '#2a2e36', bag: 'briefcase', glasses: true },
    gives: ['wallet'], likes: ['coffee', 'onigiri'],
    lines: ['抱歉，我在趕車……', '每天早上都是這班車，晚一班就要被主管念。'],
    rumors: ['下班的時候，我常在車窗上看到不是自己的倒影。'],
    give: { wallet: '我的皮夾！裡面那張照片是我爸媽的……真的太感謝你了。' },
  },
  xiaoyu: {
    name: '小雨', role: '高中生', station: '西門', spot: 'concourse', hours: [[7, 9], [15, 20]], speed: 1.4,
    look: { girl: true, skin: '#f1cdb9', hair: 'bob', hairColor: '#2a1a14', top: '#f4f4f2', pattern: 'uniform', accent: '#2a4a8a', bottom: '#2a3a5a', skirt: true, socks: '#f4f4f2', bag: 'backpack', bagColor: '#e07a8a' },
    gives: ['cat'], likes: ['bubbletea', 'keychain'],
    lines: ['你有看到一隻橘白色的貓嗎？牠叫麻糬。', '放學後我都會在西門等朋友。'],
    give: { mochi: '麻糬！你跑去哪裡了啦……謝謝你，真的謝謝！' },
    knows: [{ npc: 'ahua', text: '阿華哥常在出口那邊唱歌，他說他看過很多奇怪的塗鴉。' }],
  },
  ahua: {
    name: '阿華', role: '街頭藝人', station: '西門', spot: 'concourse', hours: [[11, 23]], speed: 0,
    look: { skin: '#c99278', hair: 'mush', hairColor: '#3a2a1a', top: '#3d6b5a', pattern: 'plain', bottom: '#2a2a2a', hat: 'cap', hatColor: '#d9b44a' },
    gives: ['graffiti', 'busker'], likes: ['bubbletea', 'coffee'],
    lines: ['要不要聽一首？這首叫〈末班車〉。', '唱一整天，喉嚨快燒起來了。'],
    rumors: ['署名「霧」的塗鴉，每一個都畫著同一個女孩的帽子。'],
    give: { bubbletea: '珍奶！你是天使吧。這首送你。' },
    questTalk: { graffiti: '三個都找到了？那個「霧」……一定是在找什麼人。' },
  },
  yulan: {
    name: '玉蘭阿嬤', role: '每天在同一張椅子等人', station: '中山', spot: 'bench', hours: [[8, 19]], speed: 0, sit: true,
    look: { girl: true, old: true, skin: '#d6a88e', hair: 'bun', hairColor: '#cfcfcf', top: '#7a5a7a', pattern: 'knit', bottom: '#3a3a40', skirt: true, bag: 'tote', bagColor: '#8a6a4a' },
    gives: ['bench'], likes: ['flower', 'pineapplecake'],
    lines: ['五十年前，有人跟我約在這裡。那時候這裡還是火車站喔。', '他說會回來。我每天都來，萬一他記錯日子呢？'],
    rumors: ['以前圓山有一個老站牌，我們在那裡拍過一張照片。'],
    give: { photo: '……這是我們。他還記得。謝謝你，孩子。明天我還是會來，不過是來看看他了。' },
    knows: [{ npc: 'jianguo', text: '他叫建國。聽說後來住到北投去了。' }],
  },
  jianguo: {
    name: '建國伯', role: '退休老師', station: '北投', spot: 'concourse', hours: [[8, 18]], speed: .7,
    look: { old: true, skin: '#c99a80', hair: 'short', hairColor: '#d8d8d8', top: '#6b7a5a', pattern: 'plain', bottom: '#4a4a4a', glasses: true, hat: 'cap', hatColor: '#6b5a3a' },
    likes: ['coffee', 'pineapplecake'],
    lines: ['北投的溫泉，泡了五十年還是泡不膩。'],
    questTalk: { bench: '玉蘭……她還在等？我以為她早就忘了。這張照片，幫我拿給她。告訴她，我明天會去中山。' },
    knows: [{ npc: 'yulan', text: '我年輕時候在中山的車站，等過一個人。' }],
  },
  jiaying: {
    name: '佳穎', role: '上班族', station: '市政府', spot: 'concourse', hours: [[8, 20]], speed: 1.5,
    look: { girl: true, skin: '#f0c8b4', hair: 'long', hairColor: '#3a2016', top: '#d8c3a5', pattern: 'plain', bottom: '#2a2a33', skirt: true, bag: 'tote', bagColor: '#2a2a2a' },
    gives: ['letter'], likes: ['flower', 'bubbletea'],
    lines: ['信義區的人走路都好快。', '你說……喜歡一個人，要寫信還是傳訊息？'],
  },
  junhong: {
    name: '俊宏', role: '大學生', station: '公館', spot: 'concourse', hours: [[10, 22]], speed: 1.3,
    look: { skin: '#d9a98e', hair: 'mush', hairColor: '#1a1a1a', top: '#4a5a7a', pattern: 'plain', bottom: '#2a3a4a', bag: 'backpack', bagColor: '#3a3a3a', glasses: true },
    likes: ['coffee', 'onigiri'],
    lines: ['期中考週，圖書館根本搶不到位子。'],
    give: { letter: '這是……佳穎寫的？我、我會回信的。謝謝你。' },
  },
  suit: {
    name: '西裝男子', role: '每天搭同一班車', station: '忠孝復興', spot: 'platform', hours: [[7, 10]], speed: 1.1,
    look: { skin: '#d6a48a', hair: 'short', hairColor: '#2a2a2a', top: '#2a2f3a', pattern: 'shirt', accent: '#1f3a6b', bottom: '#2a2f3a', bag: 'briefcase' },
    likes: ['coffee'],
    lines: ['……嗯？抱歉，我在想事情。'],
    questTalk: { sametrain: '我女兒住在台大醫院，每天上班前我都去看她一眼，可是我不敢進病房。' },
  },
  azhe: {
    name: '阿哲', role: '高中生', station: '板橋', spot: 'concourse', hours: [[15, 22]], speed: 1.5,
    look: { skin: '#d4a084', hair: 'short', hairColor: '#111', top: '#f4f4f2', pattern: 'uniform', accent: '#2a6a3a', bottom: '#2a3a2a', bag: 'backpack', bagColor: '#2a6a3a' },
    gives: ['couple'], likes: ['bubbletea'],
    lines: ['女生到底在想什麼啊……'],
    questTalk: { couple: '她說「明天板橋見」？好！我、我會準時到！' },
    knows: [{ npc: 'xiaoqing', text: '小晴在景安。跟她說……昨天是我不對。' }],
  },
  xiaoqing: {
    name: '小晴', role: '高中生', station: '景安', spot: 'concourse', hours: [[15, 22]], speed: 1.4,
    look: { girl: true, skin: '#f2cdb9', hair: 'long', hairColor: '#2a1a12', top: '#f4f4f2', pattern: 'uniform', accent: '#2a6a3a', bottom: '#2a3a2a', skirt: true, socks: '#f4f4f2', bag: 'backpack', bagColor: '#f2c200' },
    likes: ['bubbletea', 'keychain'],
    lines: ['我在等環狀線。'],
    questTalk: { couple: '阿哲說他錯了？……哼，那你跟他說，明天板橋見。' },
    knows: [{ npc: 'azhe', text: '阿哲那個笨蛋，連道歉都要別人傳。' }],
  },
  tom: {
    name: 'Tom', role: '觀光客', station: '台北車站', spot: 'concourse', hours: [[9, 18]], speed: 1.0,
    look: { skin: '#f2d2c0', hair: 'short', hairColor: '#b8862a', top: '#e07a3a', pattern: 'plain', bottom: '#6a7a5a', bag: 'backpack', bagColor: '#3a6a9a', hat: 'cap', hatColor: '#3a3a3a', height: 1.06 },
    gives: ['tourist'], likes: ['pineapplecake', 'bubbletea'],
    lines: ['Hello! 淡水……how do I go to Tamsui?', 'Taipei Metro is so clean!'],
    questTalk: { tourist: 'You made it! The sunset is beautiful. 謝謝你！This is for you.' },
  },
  yating: {
    name: '雅婷', role: '加班的上班族', station: '市政府', spot: 'concourse', hours: [[20, 24]], speed: 1.3,
    look: { girl: true, skin: '#eec4b0', hair: 'bob', hairColor: '#1a1210', top: '#3a3a4a', pattern: 'plain', bottom: '#2a2a2a', bag: 'tote', bagColor: '#6a5a4a' },
    gives: ['lategirl'], likes: ['coffee', 'flower'],
    lines: ['又加班到這麼晚……'],
    questTalk: { lategirl: '到了。有人陪著，好像就沒那麼可怕了。謝謝你。' },
  },
  kai: {
    name: '阿凱', role: '文湖線維修工', station: '科技大樓', spot: 'platform', hours: [[9, 18]], speed: .9,
    look: { skin: '#c89070', hair: 'short', hairColor: '#1a1a1a', top: '#e08a2a', pattern: 'plain', bottom: '#3a3a3a', hat: 'cap', hatColor: '#e08a2a' },
    likes: ['coffee', 'onigiri'],
    lines: ['文湖線的車是自動駕駛的，但我們還是每天要巡。'],
    questTalk: { main_BR: '駕駛室有人說話？……我們的紀錄器確實錄到一段聲音，在報站名，報的是一個不存在的站。' },
  },
  eventstaff: {
    name: '活動志工', role: '雙十節活動', station: '台北車站', spot: 'concourse', hours: [[9, 21]], speed: 0, event: 'event_double10',
    look: { girl: true, skin: '#efc4ae', hair: 'bun', hairColor: '#1a1a1a', top: '#c4162a', pattern: 'plain', bottom: '#f4f4f2', hat: 'cap', hatColor: '#1f3a8a' },
    gives: ['event_double10'], likes: [],
    lines: ['國慶日快樂！中正紀念堂、台北車站、市政府都藏了小國旗喔！'],
  },
};
// 任務需要時，NPC 會出現在另一個地方
const NPC_QUEST_PLACES = { tom: { quest: 'tourist', station: '淡水' }, yating: { quest: 'lategirl', station: '永春' } };

/* 人群：依時段出現的路人 */
const CROWD_TYPES = {
  office: { speed: [1.6, 2.1], gen: r => ({ girl: r() < .45, top: r() < .5 ? '#f4f4f2' : '#3a4250', pattern: 'shirt', accent: ['#7a1f2b', '#1f3a6b', '#2a2a2a'][r() * 3 | 0], bottom: '#2a2e36', bag: 'briefcase' }) },
  student: { speed: [1.3, 1.7], gen: r => ({ girl: r() < .5, top: '#f4f4f2', pattern: 'uniform', accent: ['#2a4a8a', '#2a6a3a', '#8a2a3a'][r() * 3 | 0], bottom: '#2a3a5a', bag: 'backpack', bagColor: ['#e07a8a', '#3a6a9a', '#f2c200', '#2a2a2a'][r() * 4 | 0] }) },
  elder: { speed: [.6, .9], gen: r => ({ girl: r() < .5, old: true, top: ['#7a5a7a', '#6b7a5a', '#8a7a6a'][r() * 3 | 0], pattern: 'knit', bottom: '#3a3a40', hat: r() < .4 ? 'cap' : null, hatColor: '#6b5a3a' }) },
  tourist: { speed: [.9, 1.2], gen: r => ({ girl: r() < .5, top: ['#e07a3a', '#3aa0c0', '#f2c200', '#c03a6a'][r() * 4 | 0], pattern: 'plain', bottom: '#6a7a5a', bag: r() < .6 ? 'backpack' : 'tote', hat: r() < .5 ? 'cap' : null }) },
  casual: { speed: [1.1, 1.5], gen: r => ({ girl: r() < .5, top: ['#2a2a2a', '#d8c3a5', '#4a5a7a', '#a33a3a', '#3d6b5a'][r() * 5 | 0], pattern: r() < .3 ? 'stripe' : 'plain', bottom: ['#2a3a5a', '#1a1a1a', '#6a5a4a'][r() * 3 | 0], bag: r() < .4 ? 'tote' : null }) },
};
const CROWD_TALK = {
  office: ['要遲到了要遲到了……', '今天又要開一整天的會。', '捷運上睡著，差點坐過站。'],
  student: ['明天要小考，我完全沒讀。', '放學要不要去西門？', '你也是這個學校的嗎？'],
  elder: ['年輕人，走慢一點啦。', '以前這裡都是稻田喔。', '敬老卡真好用。'],
  tourist: ['這站要怎麼轉車啊？', '台北的捷運好乾淨！', '聽說淡水的夕陽很漂亮。'],
  casual: ['今天人好多。', '你有聽說嗎？末班車開走以後，有人在月台上看到霧。', '最近常在車窗外看到奇怪的燈。'],
};
function crowdMix(hour) {
  if (hour >= 7 && hour < 9) return { n: 11, w: { office: 6, student: 4, casual: 1 } };
  if (hour >= 9 && hour < 12) return { n: 7, w: { elder: 3, tourist: 2, casual: 2, office: 1 } };
  if (hour >= 12 && hour < 15) return { n: 7, w: { casual: 3, tourist: 2, elder: 1, office: 1 } };
  if (hour >= 15 && hour < 17) return { n: 9, w: { student: 5, casual: 2, elder: 1, tourist: 1 } };
  if (hour >= 17 && hour < 20) return { n: 11, w: { office: 6, student: 2, casual: 3 } };
  if (hour >= 20 && hour < 23) return { n: 6, w: { casual: 4, office: 2 } };
  return { n: 3, w: { casual: 2, office: 1 } };
}

/* ── NPC 管理 ── */
const NPCManager = (() => {
  const T = THREE;
  let list = [], stationId = null, layout = null;
  let seed = 1;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const SKINS = ['#e9c0a8', '#dcae95', '#cf9f86', '#f2cdb9', '#c99278'];
  const HAIRS = ['#151515', '#2a1d18', '#3a2a1a', '#1a1210'];

  function inHours(n) {
    const h = TaipeiTime.now().hour;
    return !n.hours || n.hours.some(([a, b]) => h >= a && h < b);
  }
  // 某個樓層的隨機可走點
  function randomPoint(area) {
    const L = layout;
    for (let i = 0; i < 30; i++) {
      let x, y, z;
      if (area.kind === 'platform') { const P = area.P; x = P.x + (rnd() - .5) * 60; z = P.z + (rnd() - .5) * 4.6; y = P.y; }
      else { const C = L.concourse; x = C.x0 + 2 + rnd() * (C.x1 - C.x0 - 4); z = C.z0 + 2 + rnd() * (L.gateZ - C.z0 - 4); y = 0; }
      const h = World.groundAt(x, z, y);
      if (h != null && Math.abs(h - y) < .1) return { x, y, z };
    }
    return null;
  }
  function addNpc(def) {
    const rig = Human3D.buildPerson(def.look);
    World.scene.add(rig.root);
    const n = { ...def, rig, x: def.pos.x, y: def.pos.y, z: def.pos.z, face: rnd() * 6.28, target: null, wait: rnd() * 3, speedNow: 0 };
    rig.root.position.set(n.x, n.y, n.z);
    if (def.sit) rig.sit = 1;
    if (def.id === 'xiuyu') {   // 秀蔅：腳邊淡淡的霧光
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      gr.addColorStop(0, 'rgba(230,236,255,.75)'); gr.addColorStop(1, 'rgba(230,236,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      const aura = new T.Mesh(new T.PlaneGeometry(2.2, 2.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
      aura.rotation.x = -Math.PI / 2; aura.position.y = .02; rig.root.add(aura); n.aura = aura;
    }
    list.push(n);
    return n;
  }
  function areaOf(spot) {
    const L = layout;
    if (spot === 'platform' || spot === 'bench') return { kind: 'platform', P: L.platforms[0] };
    return { kind: 'concourse' };
  }
  function placeFor(def) {
    const L = layout, U = L.unpaid;
    if (def.spot === 'service') return { x: U.x1 - 3.5, y: 0, z: U.z0 + 4.4 };
    if (def.spot === 'lostfound') return { x: U.x1 - 8.2, y: 0, z: U.z0 + 4.4 };
    if (def.spot === 'bench') { const P = L.platforms[0]; return { x: P.x + 31, y: P.y, z: P.z + .15 }; }
    return randomPoint(areaOf(def.spot));
  }

  function enter(id, L) {
    clear();
    stationId = id; layout = L;
    seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) + TaipeiTime.now().hour * 31;
    const s = Game.state;
    // 有名字的 NPC
    for (const [nid, def] of Object.entries(NPCS)) {
      if (nid === 'xiuyu') continue;
      const qp = NPC_QUEST_PLACES[nid];
      const forced = qp && Quests.isActive(qp.quest) && qp.station === id;
      if (!forced && (def.station !== id || !inHours(def))) continue;
      if (def.event && !Quests.eventsNow().includes(def.event)) continue;
      const pos = placeFor(def); if (!pos) continue;
      addNpc({ id: nid, ...def, pos, named: true, area: areaOf(def.spot), speed: forced ? .9 : def.speed });
    }
    // 秀蔅
    const xs = Xiuyu.here(id);
    if (xs) {
      const pos = xs.hidden ? hiddenSpot() : (randomPoint({ kind: 'concourse' }) || { x: 0, y: 0, z: 0 });
      addNpc({ id: 'xiuyu', ...NPCS.xiuyu, pos, named: true, area: xs.hidden ? xs.area : { kind: 'concourse' }, speed: xs.hidden ? 0 : .8 });
    }
    // 人群
    const mix = crowdMix(TaipeiTime.now().hour);
    const types = Object.entries(mix.w).flatMap(([k, n]) => Array(n).fill(k));
    for (let i = 0; i < mix.n; i++) {
      const type = types[(rnd() * types.length) | 0], C = CROWD_TYPES[type];
      const look = { skin: SKINS[(rnd() * SKINS.length) | 0], hairColor: HAIRS[(rnd() * HAIRS.length) | 0], height: .94 + rnd() * .12, ...C.gen(rnd) };
      look.hair = look.girl ? ['long', 'bob', 'bun'][(rnd() * 3) | 0] : ['short', 'mush', 'short'][(rnd() * 3) | 0];
      if (look.old) look.hairColor = '#cfcfcf';
      if (look.girl && type !== 'student' && rnd() < .4) look.skirt = true;
      const area = rnd() < .5 ? { kind: 'concourse' } : { kind: 'platform', P: L.platforms[(rnd() * L.platforms.length) | 0] };
      const pos = randomPoint(area); if (!pos) continue;
      addNpc({ id: 'crowd' + i, name: { office: '上班族', student: '學生', elder: '長輩', tourist: '觀光客', casual: '路人' }[type], type, look, pos, area, speed: C.speed[0] + rnd() * (C.speed[1] - C.speed[0]) });
    }
  }
  // 秀蔅藏身處：某個月台的端點附近，或大廳角落
  function hiddenSpot() {
    const L = layout, opts = [];
    for (const P of L.platforms) for (const ex of [-1, 1]) opts.push({ x: P.x + ex * 29.5, y: P.y, z: P.z + .9 });
    const C = L.concourse; opts.push({ x: C.x0 + 1.5, y: 0, z: C.z0 + 1.5 }, { x: C.x1 - 1.5, y: 0, z: C.z0 + 1.5 });
    return opts[(rnd() * opts.length) | 0];
  }
  function clear() { for (const n of list) World.scene.remove(n.rig.root); list = []; }

  // 每幀更新：走向目標點；前方有玩家就停下
  function tick(dt, now) {
    if (World.riding) { for (const n of list) n.rig.root.visible = false; return; }
    const p = World.player;
    for (const n of list) {
      n.rig.root.visible = true;
      if (n.speed > 0) {
        if (n.wait > 0) { n.wait -= dt; n.speedNow = 0; }
        else {
          if (!n.target) n.target = randomPoint(n.area || { kind: 'concourse' });
          if (n.target) {
            const dx = n.target.x - n.x, dz = n.target.z - n.z, d = Math.hypot(dx, dz);
            const toP = Math.hypot(p.x - n.x, p.z - n.z);
            const ahead = toP < 1.1 && Math.abs(p.y - n.y) < .6 && ((p.x - n.x) * dx + (p.z - n.z) * dz) > 0;
            if (d < .2) { n.target = null; n.wait = 1 + Math.random() * 4; n.speedNow = 0; }
            else if (ahead) { n.speedNow = 0; n.face = Math.atan2(p.x - n.x, p.z - n.z); }
            else {
              const st = Math.min(d, n.speed * dt), nx = n.x + dx / d * st, nz = n.z + dz / d * st;
              const h = World.groundAt(nx, nz, n.y);
              if (h == null) { n.target = null; n.wait = .5; }
              else { n.x = nx; n.z = nz; n.y = h; n.face = Math.atan2(dx, dz); n.speedNow = n.speed; }
            }
          }
        }
      }
      // 說話時面向玩家
      if (Dialog.with === n) n.face = Math.atan2(p.x - n.x, p.z - n.z);
      n.rig.root.position.set(n.x, n.y, n.z);
      n.rig.root.rotation.y = n.face;
      n.rig.update(dt, n.speedNow, now / 1000);
      if (n.aura) n.aura.material.opacity = .6 + Math.sin(now / 500) * .25;
    }
  }
  // 玩家不能穿過 NPC
  function blocks(x, z, y) { return list.some(n => n.rig.root.visible && Math.abs(n.y - y) < .6 && Math.hypot(n.x - x, n.z - z) < .5); }
  function nearest(p, r = 1.6) {
    let best = null, bd = r;
    for (const n of list) { if (Math.abs(n.y - p.y) > .6) continue; const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  return { enter, clear, tick, blocks, nearest, get list() { return list; } };
})();

/* ── 秀蔅：主線的引導者 ── */
const Xiuyu = (() => {
  // 在這個站會不會出現、是否藏起來
  function here(stationId) {
    const s = Game.state;
    if (!s.flags.xiuyuIntro) return stationId === START_STATION ? { hidden: false } : null;
    for (const [line, m] of Object.entries(s.linesMet)) {
      if (m.station !== stationId) continue;
      if (Quests.isActive('main_' + line) || Quests.isDone('main_' + line)) continue;
      const L = World.layout, P = L && L.platforms.find(p => p.line === line);
      return { hidden: !m.found, area: P ? { kind: 'platform', P } : { kind: 'concourse' } };
    }
    return null;
  }
  // 第一次來到某條線：秀蔅會出現在這一站，要自己找
  function arrive(stationId) {
    const s = Game.state;
    if (!s.flags.xiuyuIntro) return;
    for (const l of MRT.linesAt(stationId)) {
      if (s.linesMet[l.line]) continue;
      s.linesMet[l.line] = { station: stationId, found: false };
      Quests.accept('find_xiuyu_' + l.line);
      toast(`<b>第一次來到${LINES[l.line].zh}</b><span>秀蔅好像就在這一站的某個地方……</span>`);
    }
    saveState();
  }
  return { here, arrive };
})();
// 每條線一個「找到秀蔅」任務
for (const l of LINE_ORDER) {
  QUESTS['find_xiuyu_' + l] = { ...QUESTS.find_xiuyu, line: l, title: `找到秀蔅（${LINES[l].zh}）` };
}

/* ── 對話框 ── */
const Dialog = (() => {
  let current = null;
  const tier = v => (v >= 80 ? '信任' : v >= 50 ? '朋友' : v >= 20 ? '認識' : '陌生');
  function hearts(v) { const n = Math.min(5, Math.floor((v || 0) / 20)); return '♥'.repeat(n) + '♡'.repeat(5 - n); }
  function close() { current = null; $('#dialog').hidden = true; World.setInput(true); }
  function show(npc, text, buttons) {
    current = npc;
    const f = Game.state.friends[npc.id] || 0;
    $('#dialog').innerHTML = `<div class="dlg">
      <div class="dlg-head"><b>${esc(npc.name)}</b><span>${esc(npc.role || '')}</span>${npc.named ? `<span class="hearts" title="好感 ${f}（${tier(f)}）">${hearts(f)}</span>` : ''}</div>
      <p class="dlg-text">${text}</p>
      <div class="dlg-btns">${buttons.map((b, i) => `<button class="btn ${b.primary ? 'primary' : 'ghost'} small" data-i="${i}" ${b.disabled ? 'disabled' : ''}>${b.label}</button>`).join('')}</div>
    </div>`;
    $('#dialog').hidden = false;
    $('#dialog').onclick = e => { const b = e.target.closest('[data-i]'); if (b) { Sound.click(); buttons[+b.dataset.i].run(); } };
    World.setInput(false);
  }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function open(npc) {
    if (npc.id === 'xiuyu') return xiuyu(npc);
    if (!npc.named) return show(npc, pick(CROWD_TALK[npc.type] || CROWD_TALK.casual), [{ label: '再見', run: close }]);
    const s = Game.state, f = s.friends[npc.id] || 0;
    // 先處理任務步驟（和他說話）
    const done = Quests.emit({ kind: 'talk', npc: npc.id });
    let text = '';
    if (done.length) {
      const d = done[0];
      text = (npc.questTalk && npc.questTalk[d.id]) || `（你把事情告訴了${npc.name}。）`;
      toast(`<b>${QUESTS[d.id].title}</b><span>✓ ${d.text}</span>`);
    } else text = pick(npc.lines);
    menu(npc, text);
    void f;
  }
  function menu(npc, text) {
    const s = Game.state, f = s.friends[npc.id] || 0;
    const btns = [];
    for (const qid of npc.gives || []) {
      const q = QUESTS[qid];
      if (Quests.isActive(qid) || Quests.isDone(qid)) continue;
      if (q.type === 'event' && !Quests.eventsNow().includes(qid)) continue;
      const full = q.type === 'side' && Quests.sideCount() >= SIDE_LIMIT;
      btns.push({ label: full ? `支線已滿（${SIDE_LIMIT}/${SIDE_LIMIT}）` : `接任務：${q.title}`, primary: !full, disabled: full, run: () => { Quests.accept(qid); onAccept(qid); menu(npc, q.desc); } });
    }
    btns.push({ label: '聊天', run: () => chat(npc) });
    btns.push({ label: '送禮', run: () => gift(npc) });
    btns.push({ label: '再見', run: close });
    show(npc, text, btns);
  }
  function onAccept(qid) {
    // 部分任務接下時會拿到東西
    if (qid === 'letter') { Game.state.inv.letter = (Game.state.inv.letter || 0) + 1; toast('<b>拿到 💌 粉紅色信封</b>'); }
    saveState(); updateHud();
  }
  function chat(npc) {
    const s = Game.state, f = s.friends[npc.id] || 0;
    s.friends[npc.id] = f + 2; saveState();
    let pool = [...npc.lines];
    if (f >= 50 && npc.knows) pool = pool.concat(npc.knows.map(k => k.text));
    if (f >= 80 && npc.rumors) pool = pool.concat(npc.rumors.map(r => '（小聲）' + r));
    menu(npc, pick(pool));
  }
  function gift(npc) {
    const s = Game.state;
    const inv = Object.entries(s.inv).filter(([, n]) => n > 0);
    if (!inv.length) return menu(npc, '（你的背包是空的。）');
    show(npc, '要送什麼給' + esc(npc.name) + '？', [
      ...inv.map(([id]) => ({
        label: `${ITEMS[id].icon} ${ITEMS[id].name}`, run: () => {
          s.inv[id]--;
          const done = Quests.emit({ kind: 'give', npc: npc.id, item: id });
          const liked = (npc.likes || []).includes(id);
          s.friends[npc.id] = (s.friends[npc.id] || 0) + (done.length ? 10 : liked ? 15 : 5);
          saveState(); updateHud();
          const text = (npc.give && npc.give[id]) || (liked ? '這個我很喜歡！謝謝你。' : '謝謝，你人真好。');
          if (done.length) toast(`<b>${QUESTS[done[0].id].title}</b><span>✓ ${done[0].text}</span>`);
          menu(npc, text);
        },
      })),
      { label: '算了', run: () => menu(npc, '……') },
    ]);
  }
  // 秀蔅
  function xiuyu(npc) {
    const s = Game.state;
    if (!s.flags.xiuyuIntro) {
      // 開場：一定要選板南線或文湖線
      return show(npc, '你也看得到霧嗎？……太好了。我叫秀蔅。這座城的每條路線盡頭，都藏著一樣東西，集齊了，霧才會散。<br>先從這裡開始吧——你想先走哪一條？', [
        { label: '板南線主線：第七節車廂', primary: true, run: () => introChoose('BL') },
        { label: '文湖線主線：無人駕駛的聲音', primary: true, run: () => introChoose('BR') },
      ]);
    }
    // 找到她：完成「找到秀蔅」並提供這一站各線的主線
    const done = Quests.emit({ kind: 'talk', npc: 'xiuyu' });
    const here = MRT.linesAt(NPCManager && World.layout.stationId);
    for (const l of here) if (s.linesMet[l.line]) s.linesMet[l.line].found = true;
    saveState();
    const offers = here.map(l => 'main_' + l.line).filter(id => QUESTS[id] && !Quests.isActive(id) && !Quests.isDone(id));
    const text = done.length ? '被你找到了。……你比我想的還要快。' : pick(npc.lines);
    show(npc, text, [
      ...offers.map(id => ({ label: `接主線：${LINES[QUESTS[id].line].zh}・${QUESTS[id].title}`, primary: true, run: () => { Quests.accept(id); close(); } })),
      { label: '聊天', run: () => { s.friends.xiuyu = (s.friends.xiuyu || 0) + 2; saveState(); xiuyuChat(npc); } },
      { label: '再見', run: close },
    ]);
  }
  function xiuyuChat(npc) {
    const f = Game.state.friends.xiuyu || 0;
    const pool = f >= 60 ? npc.lines.concat(npc.rumors) : npc.lines;
    show(npc, pick(pool), [{ label: '再見', run: close }]);
  }
  function introChoose(line) {
    const s = Game.state;
    s.flags.xiuyuIntro = true;
    s.linesMet.BL = { station: START_STATION, found: true };
    s.linesMet.BR = { station: START_STATION, found: true };
    Quests.accept('main_' + line);
    saveState();
    const other = line === 'BL' ? 'BR' : 'BL';
    show(NPCS.xiuyu, `好。我會在這裡等你。如果你也想走${LINES[other].zh}，再來找我。<br>之後每到一條新的路線，我都會在那裡——不過，你要自己找到我。`, [{ label: '出發', primary: true, run: close }]);
    current = null;
  }
  // 單純顯示資訊（告示牌等）
  function info(title, text) { show({ name: title, role: '' }, text, [{ label: '關閉', run: close }]); }
  return { open, close, info, show, get with() { return current; } };
})();

/* ── 任務物品：會出現在車站某個角落 ── */
const Pickups = (() => {
  const T = THREE;
  let items = [];
  const hash = str => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  function spotFor(item, stationId) {
    const L = World.layout, C = L.concourse, opts = [
      { x: C.x0 + 1.3, y: 0, z: C.z0 + 1.3 }, { x: C.x1 - 1.3, y: 0, z: C.z0 + 1.3 },
      { x: C.x0 + 1.3, y: 0, z: L.gateZ - 1.3 }, { x: C.x1 - 1.3, y: 0, z: L.gateZ - 1.3 },
    ];
    for (const P of L.platforms) for (const ex of [-1, 1]) opts.push({ x: P.x + ex * 29.8, y: P.y, z: P.z - 1.6 });
    // 收音機一定在淡水信義線月台
    if (item === 'radio') { const P = L.platforms.find(p => p.line === 'R') || L.platforms[0]; return { x: P.x - 29.8, y: P.y, z: P.z + 1.6 }; }
    for (let i = 0; i < opts.length; i++) {
      const o = opts[(hash(item + stationId) + i) % opts.length];
      if (World.groundAt(o.x, o.z, o.y) != null) return o;
    }
    return opts[0];
  }
  function wanted(stationId) {
    const s = Game.state, out = [];
    for (const id of Object.keys(s.quests.active)) {
      const step = QUESTS[id].steps[s.quests.active[id].step];
      if (!step || step.goal.kind !== 'find' || step.goal.station == null) continue;
      const st = step.goal.station;
      if ((Array.isArray(st) ? st.includes(stationId) : st === stationId) && !out.includes(step.goal.item)) out.push(step.goal.item);
    }
    // 第一張紙條：沒人給，自己會在南港展覽館發現
    if (stationId === '南港展覽館' && !Quests.isActive('notes') && !Quests.isDone('notes') && !s.inv.note1) out.push('note1');
    return out;
  }
  function makeMesh(item) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,190,.9)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.font = '72px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ITEMS[item].icon, 64, 70);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    sp.scale.set(.55, .55, 1);
    return sp;
  }
  function spawn(stationId) {
    clear();
    for (const item of wanted(stationId)) {
      const pos = spotFor(item, stationId), mesh = makeMesh(item);
      mesh.position.set(pos.x, pos.y + .45, pos.z);
      World.scene.add(mesh);
      items.push({ item, ...pos, mesh, station: stationId });
    }
  }
  function clear() { for (const it of items) World.scene.remove(it.mesh); items = []; }
  function tick(now) { if (World.riding) { for (const it of items) it.mesh.visible = false; return; } for (const it of items) { it.mesh.visible = true; it.mesh.position.y = it.y + .45 + Math.sin(now / 400) * .06; } }
  function near(p) { return items.find(it => Math.abs(it.y - p.y) < .6 && Math.hypot(it.x - p.x, it.z - p.z) < 1.3); }
  function take(it) {
    const s = Game.state;
    World.scene.remove(it.mesh); items = items.filter(x => x !== it);
    s.inv[it.item] = (s.inv[it.item] || 0) + 1;
    if (it.item === 'note1' && !Quests.isActive('notes') && !Quests.isDone('notes')) {
      if (!Quests.accept('notes')) toast('<b>支線已滿</b><span>紙條先收在背包裡</span>', 'warn');
    }
    Sound.itemGet();
    toast(`<b>撿到 ${ITEMS[it.item].icon} ${ITEMS[it.item].name}</b><span>${ITEMS[it.item].desc}</span>`);
    for (const d of Quests.emit({ kind: 'find', item: it.item, station: it.station })) toast(`<b>${QUESTS[d.id].title}</b><span>✓ ${d.text}</span>`);
    saveState(); updateHud();
    spawn(it.station);   // 下一步可能要在同一站找別的東西
  }
  return { spawn, clear, tick, near, take };
})();

/* ── 車站裡的秘密：紙條、塗鴉、被遺忘的東西（有些只在特定時段出現） ── */
const SECRETS = [
  { id: 'n_fog', icon: '📄', name: '紙條', text: '「如果你看到這張紙條，代表霧還沒散。——S」', xp: 10 },
  { id: 'n_729', icon: '📄', name: '紙條', text: '「第七節車廂的門，在 00:29 打開。」', xp: 10 },
  { id: 'n_wait', icon: '📄', name: '紙條', text: '「我在月台上等了一千班車。下一班一定是你。」', xp: 10 },
  { id: 'n_tired', icon: '📄', name: '紙條', text: '「今天的你，也辛苦了。」字跡很工整，好像是寫給陌生人的。', xp: 10 },
  { id: 's_station', icon: '✏️', name: '牆角塗鴉', text: '用鉛筆寫著：「這裡曾經有一站」，旁邊畫了一個不存在的站碼。', xp: 10 },
  { id: 's_arrow', icon: '✏️', name: '牆角塗鴉', text: '一個小小的箭頭，旁邊寫著「霧 →」，指向月台盡頭。', xp: 10 },
  { id: 's_love', icon: '✏️', name: '刻痕', text: '柱子上刻著「S♡J 1975」，被重新油漆過好幾次，還是看得到。', xp: 15 },
  { id: 'i_coin10', icon: '🪙', name: '十元硬幣', text: '地上有一枚十元硬幣。', money: 10 },
  { id: 'i_coin50', icon: '🪙', name: '五十元硬幣', text: '椅子底下有一枚五十元硬幣。', money: 50 },
  { id: 'i_lunch', icon: '🍙', name: '沒拆封的御飯糰', text: '有人忘了帶走一個御飯糰，還是今天的日期。', item: 'onigiri' },
  { id: 'i_card', icon: '💳', name: '舊悠遊卡', text: '一張圖案是舊版的悠遊卡，裡面還有一點餘額。', money: 100 },
  { id: 't_cat', icon: '🐈', name: '睡覺的貓', text: '一隻虎斑貓縮在椅子邊睡覺。早上的車站，好像只有牠不趕時間。', xp: 15, hours: [6, 9] },
  { id: 't_light', icon: '💡', name: '一閃一閃的燈', text: '天花板的燈閃了三下，停住，又閃了三下。牆上有人用筆寫：「燈閃三下，就是有人在叫你。」', xp: 20, hours: [21, 25] },
  { id: 't_sunset', icon: '🌇', name: '夕陽', text: '傍晚的光從出口斜斜照進來，整個大廳變成橘色的。', xp: 15, hours: [16, 19] },
];
const Secrets = (() => {
  const T = THREE;
  let list = [];
  const hash = s => [...s].reduce((a, c) => (a * 37 + c.charCodeAt(0)) % 10007, 3);
  function spawn(stationId) {
    clear();
    const L = World.layout, C = L.concourse, U = L.unpaid, h = TaipeiTime.now().hour, hh = h < 6 ? h + 24 : h;
    const spots = [{ x: C.x0 + 6, y: 0, z: L.gateZ - .8 }, { x: C.x1 - 6, y: 0, z: C.z0 + 1 }, { x: U.x0 + 1, y: 0, z: U.z1 - 2.6 }];
    for (const P of L.platforms) spots.push({ x: P.x + 15, y: P.y, z: P.z - 2.4 }, { x: P.x - 12, y: P.y, z: P.z + 2.4 }, { x: P.x + 31, y: P.y, z: P.z + .6 });
    const avail = SECRETS.filter(sc => !sc.hours || (hh >= sc.hours[0] && hh < sc.hours[1]));
    const n = 2 + hash(stationId) % 2;
    for (let i = 0; i < n; i++) {
      const sc = avail[(hash(stationId + i) + i * 5) % avail.length];
      if (list.some(x => x.sc === sc)) continue;
      const pos = spots[(hash(stationId) + i * 3) % spots.length];
      if (World.groundAt(pos.x, pos.z, pos.y) == null) continue;
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const g = c.getContext('2d'); g.font = '60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = .9; g.fillText(sc.icon, 48, 52);
      const mesh = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
      mesh.scale.set(.38, .38, 1); mesh.position.set(pos.x, pos.y + .22, pos.z);
      World.scene.add(mesh);
      list.push({ sc, ...pos, mesh, station: stationId });
    }
  }
  function clear() { for (const s of list) World.scene.remove(s.mesh); list = []; }
  function tick() { for (const s of list) s.mesh.visible = !World.riding; }
  function near(p) { return list.find(s => Math.abs(s.y - p.y) < .6 && Math.hypot(s.x - p.x, s.z - p.z) < 1.2); }
  function look(s) {
    const st = Game.state, key = s.station + ':' + s.sc.id;
    st.flags.found = st.flags.found || {};
    const first = !st.flags.found[key];
    let extra = '';
    if (first) {
      st.flags.found[key] = Date.now();
      const r = {};
      if (s.sc.xp) r.xp = s.sc.xp;
      if (s.sc.money) r.money = s.sc.money;
      if (s.sc.item) r.items = { [s.sc.item]: 1 };
      Game.reward(r, '發現：' + s.sc.name);
      extra = `<br><small>（這是你在 ${Object.keys(st.flags.found).length} 個地方的發現）</small>`;
      if (s.sc.money || s.sc.item) { World.scene.remove(s.mesh); list = list.filter(x => x !== s); }
    }
    saveState();
    Dialog.info(s.sc.name, s.sc.text + extra);
  }
  return { spawn, clear, tick, near, look };
})();
