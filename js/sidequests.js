/* 支線擴充：新角色、各種觸發方式、多種結局、打工小遊戲、相機
 * 觸發方式（trigger.kind）：
 *   npc（預設，找委託人說話）、overhear 聽見路人對話、pa 車站廣播、phone 手機訊息、notice 查看公告欄、
 *   map 查看路線圖、pickup 撿到物品、tool 用相機拍到特殊資訊、after 前置任務完成、time 特定時段、
 *   place 走到特定角落、item 持有某樣東西、choice 先前的選擇
 * 結局（outcomes）：perfect 完整成功、normal 一般成功、surprise 意外結果、選擇不同（自訂名稱）、
 *   hidden 隱藏成功、special 特殊結局；限時任務失敗可接 remedy（補救）；任務會一直保留，可以先離開之後再回來
 */

/* ── 新角色（依類型：通勤族、學生、清潔、站務、店員、特殊、目擊者、可疑人物、消息來源、收藏品商人、旅客） ── */
Object.assign(NPCS, {
  wenhua: {
    name: '文華', role: '通勤上班族', station: '板橋', spot: 'concourse', hours: [[7, 9], [18, 20]], speed: 1.8,
    look: { skin: '#e2b49c', hair: 'short', hairColor: '#151515', top: '#f4f4f2', pattern: 'shirt', accent: '#1f3a6b', bottom: '#2a2e36', bag: 'briefcase' },
    gives: ['sq_docs'], likes: ['coffee', 'onigiri'],
    lines: ['每天 7:42 那班車，我已經坐了八年。', '通勤時間才有空說兩句，其他時候我都在開會。'],
    rumors: ['我每天同一節車廂，對面坐的人十年都沒變——直到上個月，他沒有出現。'],
  },
  xiaoyun: {
    name: '曉芸', role: '高中生', station: '古亭', spot: 'concourse', hours: [[15, 19]], speed: 1.4,
    look: { girl: true, skin: '#f2cdb9', hair: 'long', hairColor: '#2a1a12', top: '#f4f4f2', pattern: 'uniform', accent: '#8a2a3a', bottom: '#2a3a5a', skirt: true, bag: 'backpack', bagColor: '#e07a8a' },
    likes: ['bubbletea', 'keychain'],
    lines: ['我在等朋友一起去補習。', '月考考完了！'],
    rumors: ['學校在傳，古亭站的時鐘每天 00:30 會停三十秒。'],
  },
  peiqi: {
    name: '佩琪', role: '站務員', station: '忠孝新生', spot: 'service', hours: [[7, 22]], speed: 0,
    look: { girl: true, skin: '#efc6b2', hair: 'bob', hairColor: '#2a1d18', top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a' },
    gives: ['sq_guide', 'sq_employee'], likes: ['coffee', 'bread'],
    lines: ['需要幫忙嗎？', '站內紀錄都在我們這裡，不過不能隨便給人看喔。'],
    rumors: ['監視器有時候會拍到不存在的列車進站，畫面上的時間都是 00:30。'],
  },
  xiaofen: {
    name: '小芬', role: '便利商店店員', station: '台北車站', spot: 'shop', hours: [[8, 22]], speed: 0,
    look: { girl: true, skin: '#f2cdb9', hair: 'bun', hairColor: '#2a1a12', top: '#2a9d8f', pattern: 'plain', bottom: '#2a2a2a' },
    gives: ['sq_store', 'sq_restock'], likes: ['pineapplecake', 'greentea'],
    lines: ['歡迎光臨！', '早上補貨補到手好痠。'],
    rumors: ['半夜收銀機常常多出一枚很舊的硬幣，上面的年份是 1997。'],
  },
  leo: {
    name: 'Leo', role: '咖啡店店長', station: '市政府', spot: 'cafe', hours: [[8, 20]], speed: 0,
    look: { skin: '#e2b49c', hair: 'mush', hairColor: '#3a2a1a', top: '#5a4030', pattern: 'plain', bottom: '#2a2a2a', glasses: true },
    gives: ['sq_cafe', 'sq_route', 'sq_who'], likes: ['pineapplecake', 'nougat'],
    lines: ['今天的豆子是衣索比亞的。', '咖啡要趁熱喝。'],
    rumors: ['有位客人每天點兩杯咖啡，只喝一杯。另一杯放到冷掉。'],
  },
  ajie: {
    name: '阿傑', role: '工讀生', station: '台北車站', spot: 'concourse', hours: [[16, 23]], speed: 1.0,
    look: { skin: '#d8a888', hair: 'mush', hairColor: '#151515', top: '#2a9d8f', pattern: 'plain', bottom: '#2a2a2a' },
    gives: ['sq_misunderstood'], likes: ['chicken', 'sausage'],
    lines: ['……沒事，我在等下班。'],
    rumors: [],
  },
  heiyi: {
    name: '黑衣男', role: '可疑人物', station: '中山', spot: 'concourse', hours: [[19, 23]], speed: .6, onlyQuest: ['sq_stalker'],
    look: { skin: '#cf9f86', hair: 'short', hairColor: '#151515', top: '#1d1d20', coat: true, bottom: '#1d1d20', hat: 'cap', hatColor: '#1d1d20' },
    likes: [], lines: ['……'], rumors: [],
  },
  ashu: {
    name: '阿鼠', role: '消息來源', station: '象山', spot: 'concourse', hours: [[21, 24]], speed: .5,
    look: { skin: '#c89070', hair: 'mush', hairColor: '#2a2a2a', top: '#3a3a40', pattern: 'plain', bottom: '#2a2a30', hat: 'cap', hatColor: '#3a3a40', glasses: true },
    likes: ['coffee', 'sausage'],
    lines: ['想知道什麼？消息不是免費的。', '晚上九點以後我才在。'],
    rumors: ['你知道每條線的終點都多了一站嗎？只有在霧裡才看得到。', '小碧潭的擺渡人，在那裡等了三十年。'],
  },
  oldk: {
    name: '老 K', role: '收藏品商人', rotate: ['台北車站', '西門', '中山', '淡水', '板橋', '南港展覽館', '動物園'], spot: 'stall', hours: [[10, 20]], speed: 0,
    look: { old: true, skin: '#d8b8a8', hair: 'short', hairColor: '#cfcfcf', top: '#7a5a3a', pattern: 'knit', bottom: '#3a3a40', hat: 'beret', hatColor: '#5a3a2a', bag: 'tote', bagColor: '#a86a2a' },
    gives: ['sq_exchange'], likes: ['postcard', 'easycard', 'keychain'],
    lines: ['我每天都在不同的站擺攤，能遇到我算你運氣好。', '舊車票、紀念章、明信片……你有什麼好東西？'],
    rumors: ['我收過一張車票，站名欄寫著「霧」。那是我唯一不賣的東西。'],
  },
  mrswang: {
    name: '王太太', role: '目擊者', schedule: [[8, 12, '景美'], [13, 18, '西門']], spot: 'concourse', speed: .9,
    look: { girl: true, skin: '#eec4b0', hair: 'bob', hairColor: '#3a2a1a', top: '#8a6a9a', pattern: 'plain', bottom: '#3a3a40', bag: 'tote', bagColor: '#c08a5a' },
    likes: ['bread', 'flower'],
    lines: ['上午在景美市場買菜，下午去西門找姊妹聊天。', '我記性很好的，什麼都記得。'],
    rumors: ['我看過一個穿白大衣的女孩，在景美站的月台上一直往隧道裡看。'],
  },
  xiaohei: {
    name: '小黑', role: '失意的音樂人', station: '東門', spot: 'stage', hours: [[18, 23]], speed: 0,
    look: { skin: '#d8a888', hair: 'mush', hairColor: '#151515', top: '#2a2a2a', pattern: 'plain', bottom: '#3a3a40', bag: 'backpack', bagColor: '#1d1d20' },
    gives: ['sq_musician'], likes: ['greentea', 'sausage'],
    lines: ['……以前我在這裡唱歌。現在只是坐著。'],
    rumors: [],
  },
  qiuyue: {
    name: '秋月', role: '夜班清潔員', station: '台北車站', spot: 'concourse', hours: [[21, 24]], speed: .8,
    look: { girl: true, old: true, skin: '#d8a888', hair: 'bun', hairColor: '#7a6a60', top: '#5a8a6a', pattern: 'plain', bottom: '#2a3a3a', hat: 'cap', hatColor: '#5a8a6a' },
    gives: ['sq_nightwish'], likes: ['soymilk', 'bread'],
    lines: ['白天你找不到我的，我都在睡覺。', '收班以後的車站，安靜得能聽到自己的心跳。'],
    rumors: ['凌晨拖地的時候，有一次我看見月台上站滿了人，全都穿著二十年前的衣服。'],
  },
  mia: {
    name: 'Mia', role: '要離開台北的人', station: '台北車站', spot: 'concourse', hours: [[10, 18]], speed: .9,
    look: { girl: true, skin: '#f2cdb9', hair: 'long', hairColor: '#4a2a1a', top: '#e6dcc6', pattern: 'plain', bottom: '#2a3a5a', bag: 'backpack', bagColor: '#6a5a4a' },
    gives: ['sq_leave'], likes: ['bubbletea', 'postcard'],
    lines: ['下禮拜我就要搬去國外了。', '在台北住了七年，好多地方都還沒去過。'],
    rumors: [],
  },
  kevin: {
    name: 'Kevin', role: '不想回家的人', station: '忠孝敦化', spot: 'concourse', hours: [[19, 24]], speed: .4,
    look: { skin: '#e2b49c', hair: 'short', hairColor: '#2a2a2a', top: '#f4f4f2', pattern: 'shirt', accent: '#3a3a3a', bottom: '#2a2e36', bag: 'briefcase' },
    gives: ['sq_nohome'], likes: ['coffee', 'chicken'],
    lines: ['……我再坐一下就走。'],
    rumors: [],
  },
  xiaoan: {
    name: '小安', role: '找朋友的人', station: '劍潭', spot: 'concourse', hours: [[12, 22]], speed: 1.1,
    look: { girl: true, skin: '#f2cdb9', hair: 'bob', hairColor: '#151515', top: '#3aa0c0', pattern: 'plain', bottom: '#2a3a5a' },
    gives: ['sq_friend'], likes: ['bubbletea', 'sausage'],
    lines: ['我朋友 Ray 已經一個月沒回訊息了。'],
    rumors: [],
  },
  ray: {
    name: 'Ray', role: '失聯的人', station: '淡水', spot: 'platform', hours: [[17, 23]], speed: .4, onlyQuest: ['sq_friend'],
    look: { skin: '#d8a888', hair: 'mush', hairColor: '#2a1a12', top: '#4a5a6a', pattern: 'plain', bottom: '#2a2a30' },
    likes: ['greentea'], lines: ['……你怎麼找到這裡的？'], rumors: [],
  },
  linnai: {
    name: '林奶奶', role: '老照片裡的人', station: '圓山', spot: 'concourse', hours: [[9, 17]], speed: .5,
    look: { girl: true, old: true, skin: '#e2b49c', hair: 'bun', hairColor: '#e0e0dc', top: '#5a6a8a', pattern: 'knit', bottom: '#3a3a40' },
    likes: ['pineapplecake', 'flower'],
    lines: ['圓山站以前是火車站，你知道嗎？'],
    rumors: [],
  },
  ming: {
    name: '阿明', role: '消失的維修員', station: '南港', spot: 'platform', hours: [[20, 24]], speed: .6, onlyQuest: ['sq_employee'],
    look: { skin: '#c89070', hair: 'short', hairColor: '#151515', top: '#e08a2a', pattern: 'plain', bottom: '#3a3a3a', hat: 'cap', hatColor: '#e08a2a' },
    likes: ['coffee'], lines: ['噓……不要讓公司知道我在這裡。'], rumors: [],
  },
  doudou: {
    name: '小豆', role: '走失的孩子', station: '西門', spot: 'platform', speed: 0, onlyQuest: ['sq_kid'],
    look: { skin: '#f2cdb9', hair: 'mush', hairColor: '#151515', top: '#f2c200', pattern: 'stripe', bottom: '#2a3a5a', height: .62, bag: 'backpack', bagColor: '#e04848' },
    likes: ['bread', 'bubbletea'], lines: ['嗚……媽媽呢？'], rumors: [],
  },
});

/* ── 新物品 ── */
Object.assign(ITEMS, {
  camera: { name: '底片相機', desc: '可以在背包裡按「拍照」。有些東西只有拍下來才看得到。', icon: '📷', price: 800, shop: true },
  lostcard: { name: '印著小熊的悠遊卡', desc: '背面用奇異筆寫著「曉芸」。', icon: '💳' },
  wallet2: { name: '黑色長夾', desc: '裡面有一張名片：文華。', icon: '👛' },
  phone2: { name: '粉紅色手機', desc: '鎖定畫面是一張和朋友在機場的合照。', icon: '📱' },
  earphone: { name: '白色無線耳機', desc: '左耳的那一顆。', icon: '🎧' },
  redumbrella: { name: '紅色摺疊傘', desc: '傘柄掛著一個古亭國小的書籤。', icon: '☂️' },
  docs: { name: '牛皮紙袋', desc: '封口寫著「機密，請勿拆封」。', icon: '📁' },
  docs2: { name: '會議文件', desc: '佩琪今天開會要用的。', icon: '📑' },
  beans: { name: '咖啡豆', desc: '一袋剛烘好的豆子，要送到台北車站。', icon: '🫘' },
  parcel: { name: '沒寫清楚的包裹', desc: '收件人：林先生（北投）。寄件人欄是空白的。', icon: '📦' },
  envelope: { name: '神秘信封', desc: '委託人說：不能拆開。', icon: '✉️' },
  oldstamp: { name: '舊郵票', desc: '1997 年淡水線通車紀念郵票。', icon: '🏷️' },
  bookmark: { name: '書籤', desc: '王老師親手寫的書法書籤。', icon: '🔖' },
  kcollect: { name: '老 K 的收藏', desc: '一張霧色的舊車票，站名欄是空白的。', icon: '🎫' },
  testimony: { name: '證詞筆記', desc: '你記下的證詞。', icon: '📝' },
  oldletters: { name: '一疊沒寄出的信', desc: '三封信，收件人都是「圓山的林小姐」。', icon: '💌' },
  oldletter1: { name: '沒寄出的信（一）', desc: '日期：1985 年。「我在南港等你。」', icon: '💌' },
  oldletter2: { name: '沒寄出的信（二）', desc: '日期：1986 年。「昆陽的櫻花開了。」', icon: '💌' },
  oldletter3: { name: '沒寄出的信（三）', desc: '日期：1987 年。「我要去很遠的地方了。」', icon: '💌' },
  demotape: { name: '小黑的試聽帶', desc: '標籤寫著「月台之歌 demo」。', icon: '📼' },
  oldphoto2: { name: '泛黃的合照', desc: '圓山站前兩個少女，背面寫著「秀……與惠，1987」。', icon: '🖼️' },
  can: { name: '空鋁罐', desc: '要拿去回收。', icon: '🥫' },
  wrapper: { name: '零食包裝', desc: '要拿去回收。', icon: '🍬' },
  bottle: { name: '寶特瓶', desc: '要拿去回收。', icon: '🧴' },
  miakey: { name: 'Mia 的鑰匙圈', desc: '「謝謝你陪我看完這座城市。」', icon: '🗝️' },
  concert: { name: '小黑的演出門票', desc: '東門站，晚上八點。', icon: '🎟️' },
});

/* ── 支線 ── */
const SIDE2 = {
  /* 找東西 */
  sq_card: {
    title: '遺失的悠遊卡', trigger: { kind: 'pickup', item: 'lostcard', station: '板橋' },
    desc: '板橋站的月台角落掉了一張悠遊卡，背面寫著「曉芸」。',
    steps: [{ text: '把悠遊卡還給古亭的曉芸（她下午 3 點到 7 點在）', goal: { kind: 'give', npc: 'xiaoyun', item: 'lostcard' } }],
    outcomes: { normal: { text: '曉芸鬆了一口氣：「我以為要重辦了！」', reward: { money: 80, xp: 60, friend: { xiaoyun: 15 } } } },
  },
  sq_wallet2: {
    title: '找回黑色皮夾', trigger: { kind: 'overhear', station: '忠孝復興', hours: [7, 20], from: '兩個上班族', text: '「文華的皮夾好像掉在板南線上了，聽說站務員有看到監視器……」「他今天急死了。」' },
    desc: '聽說上班族文華的皮夾掉在板南線上。',
    steps: [
      { text: '在忠孝新生站找到皮夾', goal: { kind: 'find', item: 'wallet2', station: '忠孝新生' } },
      { text: '還給板橋的文華（早上 7–9 點、晚上 6–8 點）', goal: { kind: 'give', npc: 'wenhua', item: 'wallet2' } },
    ],
    clues: [{ id: 'cctv', text: '佩琪說監視器拍到皮夾掉在忠孝新生站的月台盡頭', goal: { kind: 'talk', npc: 'peiqi' } }],
    outcomes: {
      perfect: { text: '文華說：「你還特地去問了站務員？太細心了。」', reward: { money: 220, xp: 140, friend: { wenhua: 20 } } },
      normal: { text: '文華收下皮夾，匆匆道謝就去趕車了。', reward: { money: 150, xp: 90, friend: { wenhua: 10 } } },
    },
  },
  sq_phone: {
    title: '找不到的手機', trigger: { kind: 'pa', station: '台北車站', hours: [9, 18], text: '旅客廣播：一位旅客遺失粉紅色手機，最後出現在淡水信義線上，拾獲者請交給站務人員。' },
    desc: '廣播在找一支粉紅色手機，最後出現在淡水信義線上。',
    steps: [
      { text: '在淡水信義線的中山站找到手機', goal: { kind: 'find', item: 'phone2', station: '中山' } },
      { text: '手機亮了，螢幕上有未讀訊息……要怎麼做？（找 Mia）', goal: { kind: 'decide', npc: 'mia' } },
    ],
    decide: { npc: 'mia', prompt: '你把手機交還時……', options: [
      { label: '直接還給她，什麼都沒看', outcome: 'normal' },
      { label: '告訴她，你不小心看到她朋友傳來的「機場見」訊息', outcome: 'special' },
    ] },
    outcomes: {
      normal: { text: 'Mia 收下手機，笑著說謝謝。', reward: { money: 120, xp: 80, friend: { mia: 10 } } },
      special: { name: '特殊資訊', text: 'Mia 愣了一下，然後紅了眼眶：「原來她會來送我……」她告訴你一個秘密：「台北車站的機場線月台，以前在霧裡出現過一次。」', reward: { money: 120, xp: 160, friend: { mia: 20 } } },
    },
  },
  sq_kid: {
    title: '找走失的孩子', trigger: { kind: 'pa', station: '西門', hours: [10, 19], text: '尋人廣播：一位穿黃色條紋上衣、背紅色書包的小男孩小豆與家人走散，請看到的旅客協助。' },
    desc: '廣播在找一個穿黃色條紋衣服的小男孩。',
    steps: [{ text: '在西門站找到小豆，和他說話', goal: { kind: 'talk', npc: 'doudou' } }],
    clues: [{ id: 'afang', text: '清潔阿姨阿芳說，看到孩子往板南線月台跑', goal: { kind: 'talk', npc: 'afang' } }],
    outcomes: {
      perfect: { text: '你直接去了板南線月台，很快就找到小豆。媽媽趕到時抱著他哭了：「謝謝你，真的謝謝。」', reward: { money: 200, xp: 150 } },
      normal: { text: '你找了好一陣子才找到他，小豆的媽媽一直跟你道謝。', reward: { money: 150, xp: 100 } },
    },
  },
  sq_earphone: {
    title: '尋找遺失的耳機', giver: 'lily',
    desc: 'Lily 的耳機掉了一顆，她記得在公館上車前還戴著，下車時已經不見了——「我坐了兩三站……往新店的方向。」',
    steps: [
      { text: '沿著松山新店線往新店方向找（萬隆或景美）', goal: { kind: 'find', item: 'earphone', station: ['萬隆', '景美'] } },
      { text: '還給公館的 Lily', goal: { kind: 'give', npc: 'lily', item: 'earphone' } },
    ],
    outcomes: { normal: { text: 'Lily：「Thank you！我還以為要買新的了。」她送你一張她自己畫的明信片。', reward: { money: 100, xp: 90, items: { postcard: 1 }, friend: { lily: 15 } } } },
  },
  sq_owner: {
    title: '無人承認的物品', trigger: { kind: 'notice', station: '台北車站', text: '失物公告：紅色摺疊傘一把，傘柄掛著古亭國小書籤。已公告兩週，無人認領。' },
    desc: '一把紅色摺疊傘公告了兩週都沒人領。傘柄的書籤是古亭國小的。',
    steps: [
      { text: '找美玲拿傘', goal: { kind: 'talk', npc: 'meiling' }, gain: { redumbrella: 1 } },
      { text: '判斷這把傘是誰的，交給他', goal: { kind: 'decide', npc: 'meiling' } },
    ],
    clues: [
      { id: 'xy', text: '曉芸說她的傘是藍色的', goal: { kind: 'talk', npc: 'xiaoyun' } },
      { id: 'wang', text: '王老師說他退休前在古亭國小教書，上個月掉了一把傘', goal: { kind: 'talk', npc: 'wang' } },
    ],
    decide: { npc: 'meiling', prompt: '這把傘應該是誰的？', options: [
      { label: '古亭的王老師', outcome: 'perfect', correct: true },
      { label: '古亭的曉芸', outcome: 'wrong' },
      { label: '板橋的文華', outcome: 'wrong' },
    ] },
    outcomes: {
      perfect: { text: '王老師拿到傘，高興地說：「這是我最後一屆學生送的！」', reward: { money: 150, xp: 160, friend: { wang: 20, meiling: 10 } } },
      normal: { text: '你猜對了，王老師很開心，但你其實沒有確認過。', reward: { money: 100, xp: 100, friend: { wang: 10 } } },
      wrong: { text: '傘交錯人了。過了幾天，美玲說真正的主人自己來領走了。', reward: { xp: 40 } },
    },
  },

  /* 送件 */
  sq_docs: {
    title: '幫忙送文件', giver: 'wenhua', gain: { docs: 1 },
    desc: '文華早上趕不及，請你把一袋文件送到市政府站的 Leo 那裡。「拜託不要拆開。」',
    steps: [{ text: '把牛皮紙袋交給市政府站的 Leo', goal: { kind: 'give', npc: 'leo', item: 'docs' } }],
    outcomes: { normal: { text: 'Leo 收下文件：「文華又把東西忘在我店裡……這是要給他客戶的合約。謝了。」', reward: { money: 160, xp: 100, friend: { wenhua: 10, leo: 10 } } } },
  },
  sq_lostdocs: {
    title: '尋找遺漏的文件', trigger: { kind: 'phone', hours: [8, 11], from: '佩琪', text: '📱「我是忠孝新生站的佩琪！今天開會的文件好像忘在國父紀念館站了……20 分鐘內能幫我拿回來嗎？」' },
    desc: '佩琪的會議文件掉在國父紀念館站，20 分鐘內要拿回來。', limit: 20, remedy: 'sq_lostdocs_fix',
    steps: [
      { text: '在國父紀念館站找到文件', goal: { kind: 'find', item: 'docs2', station: '國父紀念館' } },
      { text: '交給忠孝新生站的佩琪', goal: { kind: 'give', npc: 'peiqi', item: 'docs2' } },
    ],
    outcomes: { normal: { text: '佩琪接過文件衝進會議室：「趕上了！你是我的救星！」', reward: { money: 200, xp: 150, friend: { peiqi: 20 } } } },
  },
  sq_lostdocs_fix: {
    title: '補救：會議之後',
    desc: '文件沒趕上。佩琪被主管念了一頓……也許可以買點東西安慰她。',
    steps: [
      { text: '買一杯美式咖啡', goal: { kind: 'buy', item: 'coffee' } },
      { text: '拿給忠孝新生站的佩琪', goal: { kind: 'give', npc: 'peiqi', item: 'coffee' } },
    ],
    outcomes: { normal: { name: '暫時失敗・補救', text: '佩琪笑了：「沒關係啦，主管念一念就過了。謝謝你的咖啡。」', reward: { xp: 60, friend: { peiqi: 10 } } } },
  },
  sq_route: {
    title: '指定路線送達', giver: 'leo', gain: { beans: 1 },
    desc: 'Leo 要把咖啡豆送給台北車站的小芬。「豆子怕晃，只能坐板南線過去，不要轉車、不要用傳送。」',
    steps: [
      { text: '從市政府搭板南線到台北車站', goal: { kind: 'ride', line: 'BL', station: '台北車站' } },
      { text: '把咖啡豆交給小芬', goal: { kind: 'give', npc: 'xiaofen', item: 'beans' } },
    ],
    outcomes: { normal: { text: '小芬聞了聞：「好香！Leo 的豆子每次都這麼好。」', reward: { money: 150, xp: 100, friend: { leo: 10, xiaofen: 10 } } } },
  },
  sq_multi: {
    title: '多站配送', giver: 'ade', gain: { bento: 3 },
    desc: '阿德今天三張單同時來，請你幫忙依序送：科技大樓的阿凱、中山的志明、古亭的王老師。',
    steps: [
      { text: '送到科技大樓的阿凱', goal: { kind: 'give', npc: 'kai', item: 'bento' } },
      { text: '送到中山的志明', goal: { kind: 'give', npc: 'zhiming', item: 'bento' } },
      { text: '送到古亭的王老師', goal: { kind: 'give', npc: 'wang', item: 'bento' } },
    ],
    outcomes: { normal: { text: '阿德傳訊息：「三張單都五星好評！分你一半小費。」', reward: { money: 300, xp: 180, friend: { ade: 15 } } } },
  },
  sq_wrong: {
    title: '錯誤收件人', trigger: { kind: 'pickup', item: 'parcel', station: '南京復興' },
    desc: '撿到一個包裹，收件人只寫「林先生（北投）」。認識的林先生有好幾位……',
    steps: [{ text: '判斷真正的收件人（可以先問美玲）', goal: { kind: 'decide', npc: 'meiling' } }],
    clues: [{ id: 'lin', text: '上班族林先生說他住在板橋，不是北投', goal: { kind: 'talk', npc: 'linsir' } }],   // 上班族林先生（'lin' 是委託所的林姐）
    decide: { npc: 'meiling', prompt: '包裹應該寄給誰？', options: [
      { label: '北投的退休司機林伯', outcome: 'perfect' },
      { label: '上班族林先生', outcome: 'wrong' },
    ] },
    outcomes: {
      perfect: { text: '美玲把包裹轉寄到北投。幾天後，林伯託人帶話：「是我女兒從國外寄來的，謝謝你。」', reward: { money: 160, xp: 140, friend: { linbo: 15, meiling: 10 } } },
      normal: { text: '包裹寄到了北投。', reward: { money: 100, xp: 80 } },
      wrong: { text: '林先生打開包裹，一臉困惑：「這不是我的……」包裹被退回，晚了一個禮拜才送到。', reward: { xp: 30 } },
    },
  },
  sq_mystery: {
    title: '神秘委託', trigger: { kind: 'phone', hours: [20, 24], from: '匿名', text: '📱 匿名訊息：「把信封帶到象山站，交給晚上九點以後才出現的人。暗號是——你應該知道。」' },
    desc: '匿名委託：把信封帶到象山站。對方會問暗號。', gain: { envelope: 1 },
    steps: [{ text: '到象山站找晚上才出現的人，說出暗號', goal: { kind: 'decide', npc: 'ashu' } }],
    decide: { npc: 'ashu', prompt: '阿鼠：「暗號？」', options: [
      { label: '「霧」', outcome: 'special' },
      { label: '「末班車」', outcome: 'normal' },
      { label: '「我不知道」', outcome: 'normal' },
    ] },
    outcomes: {
      special: { name: '特殊結局', text: '阿鼠笑了，收下信封：「你果然知道。」他塞給你一張紙條：「小碧潭的擺渡人在等的，不只是寶物。」', reward: { money: 250, xp: 200, friend: { ashu: 25 } }, next: 'sq_contact' },
      normal: { text: '阿鼠聳聳肩，還是收下了信封：「算了，東西到了就好。」', reward: { money: 150, xp: 100, friend: { ashu: 5 } } },
    },
  },
  sq_contact: {
    title: '尋找中途聯絡人', giver: 'ashu',
    desc: '阿鼠說，還有一個人在等消息：每天早上坐在南港展覽館大廳的夜班保全老周。',
    steps: [{ text: '把阿鼠的話帶給南港展覽館的老周（晚上 7 點以後）', goal: { kind: 'talk', npc: 'zhou' } }],
    outcomes: { normal: { text: '老周聽完沉默了很久：「……那個提燈的女孩，原來真的在等。」', reward: { money: 150, xp: 160, friend: { zhou: 15 } } } },
  },
  sq_exchange: {
    title: '物品交換', giver: 'oldk',
    desc: '老 K 想要王老師的書法書籤，可是王老師只願意用舊郵票交換。老 K 願意先拿一張明信片換你的舊郵票……',
    steps: [
      { text: '給老 K 一張捷運明信片', goal: { kind: 'give', npc: 'oldk', item: 'postcard' }, gain: { oldstamp: 1 } },
      { text: '把舊郵票給古亭的王老師', goal: { kind: 'give', npc: 'wang', item: 'oldstamp' }, gain: { bookmark: 1 } },
      { text: '找到老 K，把書籤交給他（他每天在不同的站）', goal: { kind: 'give', npc: 'oldk', item: 'bookmark' } },
    ],
    outcomes: { normal: { name: '收藏品', text: '老 K 小心收好書籤，從箱子裡拿出一樣東西給你：「這個，我本來不賣的。」', reward: { money: 100, xp: 200, items: { kcollect: 1 }, friend: { oldk: 20 } } } },
  },
  sq_schedule: {
    title: '跨站拜訪', giver: 'xiuyu',
    desc: '秀蔅想請三個人幫她記住一件事。可是他們只在特定時段出現：嘉豪（早上 6–9 點，大安森林公園）、阿桃（早上 6–10 點，景美）、林伯（早上 8 點到下午 4 點，北投）。',
    steps: [
      { text: '找嘉豪', goal: { kind: 'talk', npc: 'jiahao' } },
      { text: '找阿桃', goal: { kind: 'talk', npc: 'atao' } },
      { text: '找林伯', goal: { kind: 'talk', npc: 'linbo' } },
    ],
    outcomes: { normal: { text: '三個人都說，他們記得一個穿白大衣的女孩，在某個清晨對他們說過「謝謝」。', reward: { money: 200, xp: 200, friend: { xiuyu: 15 } } } },
  },

  /* 推理 */
  sq_who: {
    title: '誰拿走了文件', giver: 'leo',
    desc: 'Leo 放在櫃檯的合約不見了。早上來過店裡的有三個人：文華、小芬、阿傑。',
    steps: [{ text: '問過可能的人以後，回來告訴 Leo 你的推理', goal: { kind: 'decide', npc: 'leo' } }],
    clues: [
      { id: 'wh', text: '文華：「我 8 點來拿咖啡，那時候合約還在櫃檯上。」', goal: { kind: 'talk', npc: 'wenhua' } },
      { id: 'xf', text: '小芬：「我 8 點半來送貨，看到阿傑在櫃檯邊，可是他手上沒拿東西。」', goal: { kind: 'talk', npc: 'xiaofen' } },
      { id: 'aj', text: '阿傑：「我 8 點 40 分到，合約已經不在了。我看到文華的公事包在椅子上。」', goal: { kind: 'talk', npc: 'ajie' } },
    ],
    decide: { npc: 'leo', prompt: '合約是誰拿走的？', options: [
      { label: '文華——他回來拿公事包時，順手把合約收進包包了', outcome: 'perfect', correct: true },
      { label: '阿傑——他那時候在櫃檯邊', outcome: 'wrong' },
      { label: '小芬——她來送貨', outcome: 'wrong' },
    ] },
    outcomes: {
      perfect: { text: 'Leo 打給文華，文華在公事包裡翻出了合約：「抱歉抱歉！我以為是我的！」阿傑鬆了一口氣。', reward: { money: 220, xp: 200, friend: { leo: 15, ajie: 10 } } },
      normal: { text: '你猜對了，但沒有問完所有人。Leo 打電話確認後，事情解決了。', reward: { money: 150, xp: 120, friend: { leo: 10 } } },
      wrong: { text: '你的推理錯了，讓無辜的人被懷疑。幾天後合約在文華的包包裡找到。', reward: { xp: 40 }, friend: { ajie: -10 } },
    },
  },
  sq_misunderstood: {
    title: '被誤會的人', giver: 'ajie',
    desc: '便利商店的收銀機少了 500 元，店長懷疑是工讀生阿傑。他說他沒有。',
    steps: [{ text: '蒐集證據後，找小芬說明真相', goal: { kind: 'decide', npc: 'xiaofen' } }],
    clues: [
      { id: 'cam', text: '在台北車站的站務室，監視器畫面顯示收銀機那天被打開時，阿傑在倉庫', goal: { kind: 'inspect', spot: 'office', station: '台北車站' } },
      { id: 'mei', text: '美玲說那天有人送來一張 500 元鈔票，說是在收銀台下面撿到的', goal: { kind: 'talk', npc: 'meiling' } },
    ],
    decide: { npc: 'xiaofen', prompt: '錢去哪裡了？', options: [
      { label: '找零時掉到收銀台下面，被客人撿到送去失物招領了', outcome: 'perfect', correct: true },
      { label: '其實是阿傑拿的', outcome: 'wrong' },
    ] },
    outcomes: {
      perfect: { text: '小芬去失物招領領回了 500 元，跟阿傑道歉。阿傑第一次笑了：「謝謝你相信我。」', reward: { money: 200, xp: 200, friend: { ajie: 25, xiaofen: 10 } } },
      normal: { text: '你說對了，但證據不夠，店長半信半疑。', reward: { money: 120, xp: 120, friend: { ajie: 15 } } },
      wrong: { text: '阿傑被辭退了。後來大家才知道錢是掉在收銀台下面。', reward: { xp: 30 } },
    },
  },
  sq_liar: {
    title: '誰說了謊', trigger: { kind: 'overhear', station: '西門', hours: [12, 21], from: '路人', text: '「西門站的販賣機被人踹壞了！」「聽說有三個人看到，可是說法都不一樣。」' },
    desc: '西門站的販賣機被弄壞了。三個目擊者的說法互相矛盾。',
    steps: [{ text: '比對證詞後，找捷運警察志明說出誰在說謊（中山站）', goal: { kind: 'decide', npc: 'zhiming' } }],
    clues: [
      { id: 'w1', text: '阿芳：「下午兩點，我看到一個穿紅衣服的人在販賣機前面。」', goal: { kind: 'talk', npc: 'afang' } },
      { id: 'w2', text: '王太太：「我下午一點到西門，一直在那裡，根本沒看到穿紅衣服的人。」', goal: { kind: 'talk', npc: 'mrswang' } },
      { id: 'w3', text: '小傑：「我兩點在劍潭練舞，聽朋友說是穿紅衣服的人弄的。」', goal: { kind: 'talk', npc: 'xiaojie' } },
    ],
    decide: { npc: 'zhiming', prompt: '誰的說法有問題？', options: [
      { label: '王太太——她說一點就到西門，可是她上午在景美、下午才到；而且她說「一直在」卻沒看到別人都看到的人', outcome: 'perfect', correct: true },
      { label: '阿芳說謊', outcome: 'wrong' },
      { label: '小傑說謊', outcome: 'wrong' },
    ] },
    outcomes: {
      perfect: { text: '志明調了監視器：王太太其實是兩點半才到，她不想承認自己遲到被姊妹念。穿紅衣服的人後來主動來賠了販賣機。', reward: { money: 220, xp: 220, friend: { zhiming: 15 } } },
      normal: { text: '你的推理方向是對的，但證詞沒問齊。', reward: { money: 120, xp: 120 } },
      wrong: { text: '志明搖搖頭：「證詞對不起來。」案子最後不了了之。', reward: { xp: 30 } },
    },
  },
  sq_impossible: {
    title: '不可能的目擊', trigger: { kind: 'after', after: 'sq_liar' },
    desc: '志明又遇到怪事：早上 8:15，文華說在板橋看到一個穿白大衣的女孩；同一時間，林伯說在北投也看到她。',
    steps: [{ text: '找志明說出你的看法', goal: { kind: 'decide', npc: 'zhiming' } }],
    clues: [
      { id: 'wh', text: '文華：「8:15，板橋站月台，提著一盞燈。」', goal: { kind: 'talk', npc: 'wenhua' } },
      { id: 'lb', text: '林伯：「8:15，北投站月台，提著一盞燈。我看得很清楚。」', goal: { kind: 'talk', npc: 'linbo' } },
    ],
    decide: { npc: 'zhiming', prompt: '怎麼可能同時在兩個地方？', options: [
      { label: '其中一個人看錯時間', outcome: 'normal' },
      { label: '那不是普通人——是秀蔅，她在霧裡移動', outcome: 'special' },
    ] },
    outcomes: {
      normal: { text: '志明把它記成「時間紀錄錯誤」，結案了。', reward: { money: 120, xp: 120 } },
      special: { name: '特殊結局', text: '志明看著你很久，最後把紀錄撕掉：「這件事，我們就當沒發生過吧。」秀蔅後來對你說：「謝謝你沒有說出去。」', reward: { money: 150, xp: 220, friend: { xiuyu: 20, zhiming: 10 } } },
    },
  },
  sq_rumor: {
    title: '假消息來源', trigger: { kind: 'overhear', station: '公館', hours: [10, 21], from: '兩個學生', text: '「聽說板南線下個月要停駛一年耶！」「真的假的？誰說的？」' },
    desc: '一則「板南線要停駛一年」的謠言正在流傳。是誰開始的？',
    steps: [{ text: '追到消息源頭後，決定怎麼處理（找阿鼠，晚上在象山）', goal: { kind: 'decide', npc: 'ashu' } }],
    clues: [
      { id: 'lily', text: 'Lily：「我是聽劍潭的小傑說的。」', goal: { kind: 'talk', npc: 'lily' } },
      { id: 'jie', text: '小傑：「我是聽象山那個晚上才出現的人說的。」', goal: { kind: 'talk', npc: 'xiaojie' } },
    ],
    decide: { npc: 'ashu', prompt: '阿鼠承認是他亂說的，「只是想看看消息能傳多快」。你要……', options: [
      { label: '請他自己去澄清', outcome: 'perfect' },
      { label: '告訴志明，讓警察處理', outcome: 'police' },
      { label: '算了，下次別這樣', outcome: 'normal' },
    ] },
    outcomes: {
      perfect: { text: '阿鼠嘆了口氣，第二天在每個站的公告欄貼了更正。「你這人……挺有意思的。」', reward: { money: 180, xp: 200, friend: { ashu: 15 } } },
      police: { name: '選擇不同', text: '志明找阿鼠談了話。謠言停了，但阿鼠從此不太想跟你說話。', reward: { money: 180, xp: 180, friend: { ashu: -20, zhiming: 15 } } },
      normal: { text: '阿鼠笑笑。謠言慢慢自己消失了。', reward: { money: 100, xp: 100 } },
    },
  },
  sq_parcel: {
    title: '消失的包裹', giver: 'ade',
    desc: '阿德說，有一個包裹送到西門站後就不見了，系統顯示「已送達」。',
    steps: [{ text: '在西門站找到包裹', goal: { kind: 'find', item: 'parcel', station: '西門' } }, { text: '交給阿德（忠孝復興）', goal: { kind: 'give', npc: 'ade', item: 'parcel' } }],
    clues: [
      { id: 'cctv', text: '西門站的站務室監視器：包裹被放在月台的長椅旁', goal: { kind: 'inspect', spot: 'office', station: '西門' } },
      { id: 'afang', text: '阿芳：「長椅旁那個箱子？我以為是垃圾，先收到月台盡頭了。」', goal: { kind: 'talk', npc: 'afang' } },
    ],
    outcomes: {
      perfect: { text: '阿德：「原來是阿芳姐收走了！你連監視器都去看了？」', reward: { money: 200, xp: 160, friend: { ade: 15 } } },
      normal: { text: '阿德鬆了一口氣：「找到就好！」', reward: { money: 150, xp: 100, friend: { ade: 10 } } },
    },
  },
  sq_stalker: {
    title: '神祕的跟蹤者', trigger: { kind: 'time', station: '中山', hours: [18, 22], from: '小梅', text: '花店的小梅小聲對你說：「這幾天晚上，有個穿黑衣服的男人一直在我店門口附近……」' },
    desc: '小梅覺得有人在跟蹤她。晚上 7 點以後，中山站大廳有個穿黑衣的男人。',
    steps: [{ text: '晚上在中山站找到黑衣男，決定怎麼處理', goal: { kind: 'decide', npc: 'heiyi' } }],
    clues: [{ id: 'zm', text: '志明說，黑衣男每天都站在同一個位置，從不靠近小梅', goal: { kind: 'talk', npc: 'zhiming' } }],
    decide: { npc: 'heiyi', prompt: '你要……', options: [
      { label: '先跟他聊聊，問他為什麼在這裡', outcome: 'surprise' },
      { label: '直接請志明來處理', outcome: 'police' },
    ] },
    outcomes: {
      surprise: { name: '意外結果', text: '男人沉默了很久，說：「我是她哥哥。十年前吵架以後就沒說過話……我只是想看看她過得好不好。」你帶他去找小梅。兩個人都哭了。', reward: { money: 200, xp: 250, friend: { xiaomei: 25 } } },
      police: { name: '選擇不同', text: '志明把男人帶走問話，才知道他是小梅失聯多年的哥哥。小梅知道後很複雜：「……你應該先問他的。」', reward: { money: 150, xp: 150, friend: { xiaomei: 5, zhiming: 10 } } },
    },
  },
  sq_employee: {
    title: '消失的員工', giver: 'peiqi',
    desc: '佩琪的同事、維修員阿明已經三天沒來上班，電話也不接。',
    steps: [{ text: '找到阿明（晚上，南港站月台），決定怎麼處理他的秘密', goal: { kind: 'decide', npc: 'ming' } }],
    clues: [
      { id: 'doc', text: '南港站站務室的排班表：阿明最後三天都排在「夜間設備檢查」，卻沒有簽退', goal: { kind: 'inspect', spot: 'office', station: '南港' } },
      { id: 'kai', text: '阿凱：「阿明說他在南港的隧道裡發現一扇以前沒看過的門。」', goal: { kind: 'talk', npc: 'kai' } },
    ],
    decide: { npc: 'ming', prompt: '阿明說他發現隧道裡有一扇奇怪的門，公司叫他不要說出去，他不想再隱瞞了。你要……', options: [
      { label: '陪他一起去跟佩琪說清楚', outcome: 'perfect' },
      { label: '幫他保守秘密', outcome: 'secret' },
    ] },
    outcomes: {
      perfect: { text: '佩琪聽完，把事情往上報。那扇門被封了起來，但阿明保住了工作：「謝謝你沒讓我一個人扛。」', reward: { money: 220, xp: 240, friend: { peiqi: 20, ming: 15 } } },
      normal: { text: '你找到了阿明，他答應明天回去上班。', reward: { money: 150, xp: 150 } },
      secret: { name: '選擇不同', text: '阿明點點頭：「那就當我們都沒看過那扇門。」佩琪後來問你，你什麼都沒說。', reward: { money: 150, xp: 180, friend: { ming: 25, peiqi: -10 } } },
    },
  },

  /* 人物故事 */
  sq_letters: {
    title: '沒有寄出的信', trigger: { kind: 'pickup', item: 'oldletter1', station: '南港' },
    desc: '南港站的長椅下有一封三十年前沒寄出的信，信裡提到還有兩封。',
    steps: [
      { text: '在昆陽站找到第二封信', goal: { kind: 'find', item: 'oldletter2', station: '昆陽' } },
      { text: '在後山埤站找到第三封信', goal: { kind: 'find', item: 'oldletter3', station: '後山埤' } },
      { text: '信的收件人是「圓山的林小姐」……要交給她嗎？', goal: { kind: 'decide', npc: 'linnai' } },
    ],
    decide: { npc: 'linnai', prompt: '林奶奶就在眼前。你要……', options: [
      { label: '把三封信交給她', outcome: 'give' },
      { label: '只說「有人一直記得妳」，把信留在自己身上', outcome: 'keep' },
    ] },
    outcomes: {
      give: { name: '交還收件人', text: '林奶奶讀完信，眼淚掉了下來：「他說要去很遠的地方……原來他不是不要我。」', reward: { money: 150, xp: 220, friend: { linnai: 30 } } },
      keep: { name: '選擇不同', text: '林奶奶笑了笑：「被記得就好。」你把信收進背包。有些話，也許留在信裡比較好。', reward: { money: 100, xp: 180, friend: { linnai: 15 } } },
    },
  },
  sq_friend: {
    title: '失聯的朋友', giver: 'xiaoan',
    desc: '小安的好朋友 Ray 一個月前突然不回訊息。最後一次聯絡時，他說想去「看得到海的地方」。',
    steps: [{ text: '找到 Ray（傍晚以後，淡水站月台），決定要怎麼做', goal: { kind: 'decide', npc: 'ray' } }],
    clues: [{ id: 'yuan', text: '阿遠：「每天傍晚都有個年輕人坐在月台上看海，一句話也不說。」', goal: { kind: 'talk', npc: 'yuan' } }],
    decide: { npc: 'ray', prompt: 'Ray：「我被公司裁員了，不知道怎麼跟小安說……」你要……', options: [
      { label: '勸他自己打給小安', outcome: 'perfect' },
      { label: '直接告訴小安他在哪裡', outcome: 'tell' },
      { label: '尊重他，什麼都不說', outcome: 'privacy' },
    ] },
    outcomes: {
      perfect: { text: '那天晚上，小安傳訊息給你：「他打給我了。我們約好週末一起去淡水。」', reward: { money: 200, xp: 240, friend: { xiaoan: 25, ray: 20 } } },
      tell: { name: '選擇不同', text: '小安衝去淡水找他。兩個人大吵一架，又和好了。只是 Ray 後來不太跟你說話。', reward: { money: 180, xp: 180, friend: { xiaoan: 20, ray: -10 } } },
      privacy: { name: '選擇不同', text: '你只告訴小安：「他沒事，他需要一點時間。」一個月後，Ray 自己回訊息了。', reward: { money: 150, xp: 200, friend: { xiaoan: 10, ray: 25 } } },
    },
  },
  sq_leave: {
    title: '離開這座城市', giver: 'mia', gain: { camera: 1 },
    desc: 'Mia 下禮拜要出國了。她把舊相機送給你，請你幫她完成「離開前的願望清單」。',
    steps: [
      { text: '在淡水站拍一張照片（背包 → 相機 → 拍照）', goal: { kind: 'photo', station: '淡水' } },
      { text: '在象山站拍一張照片', goal: { kind: 'photo', station: '象山' } },
      { text: '買一杯珍珠奶茶給她', goal: { kind: 'give', npc: 'mia', item: 'bubbletea' } },
    ],
    outcomes: { normal: { name: '特別紀念品', text: 'Mia 看著照片笑了：「這樣我就把台北帶走了。」她把鑰匙圈送給你。', reward: { money: 200, xp: 250, items: { miakey: 1 }, friend: { mia: 30 } } } },
  },
  sq_photoperson: {
    title: '舊照片中的人物', trigger: { kind: 'pickup', item: 'oldphoto2', station: '圓山' },
    desc: '一張 1987 年的合照：兩個少女在圓山站前。背面寫著「秀……與惠」。另一個人是誰？',
    steps: [
      { text: '問圓山的林奶奶認不認得照片', goal: { kind: 'talk', npc: 'linnai' } },
      { text: '把照片拿給秀蔅看（找不到她的話，她會在小碧潭站等你）', goal: { kind: 'give', npc: 'xiuyu', item: 'oldphoto2' } },
    ],
    outcomes: { normal: { name: '特殊結局', text: '林奶奶說：「這是我，林惠。另一個是我最好的朋友，叫秀蔅……她在 1987 年的末班車上不見了。」秀蔅看著照片，很久很久，才說：「……原來我有朋友。」', reward: { money: 150, xp: 300, friend: { xiuyu: 30, linnai: 20 } } } },
  },
  sq_reconcile: {
    title: '重新聯絡', trigger: { kind: 'after', after: 'sq_stalker' },
    desc: '小梅和哥哥見面以後，還是有一些話說不出口。',
    steps: [{ text: '再去找小梅', goal: { kind: 'decide', npc: 'xiaomei' } }],
    decide: { npc: 'xiaomei', prompt: '小梅：「我想跟他說，十年前那件事不是他的錯……可是我說不出口。」', options: [
      { label: '幫她把話轉達給哥哥', outcome: 'relay' },
      { label: '幫她約哥哥到花店，讓她自己說', outcome: 'perfect' },
      { label: '這是他們之間的事，不插手', outcome: 'privacy' },
    ] },
    outcomes: {
      perfect: { text: '那天晚上，花店早早拉下鐵門。隔天小梅送你一束滿天星。', reward: { money: 150, xp: 200, items: { flower: 1 }, friend: { xiaomei: 20 } } },
      relay: { name: '選擇不同', text: '你把話帶到了。哥哥聽完點點頭，第二天就去花店幫忙了。', reward: { money: 120, xp: 160, friend: { xiaomei: 15 } } },
      privacy: { name: '選擇不同', text: '你沒有插手。幾週後，你看到兄妹倆一起在中山站吃晚餐。', reward: { money: 100, xp: 150, friend: { xiaomei: 10 } } },
    },
  },
  sq_nohome: {
    title: '不想回家的人', giver: 'kevin',
    desc: 'Kevin 每天晚上都在忠孝敦化站坐到很晚。',
    steps: [{ text: '聽他說完，決定怎麼幫他', goal: { kind: 'decide', npc: 'kevin' } }],
    clues: [{ id: 'peiqi', text: '佩琪說，Kevin 以前是附近公司的主管，最近好像沒在上班了', goal: { kind: 'talk', npc: 'peiqi' } }],
    decide: { npc: 'kevin', prompt: 'Kevin：「我失業三個月了，每天還是穿西裝出門……不敢讓老婆知道。」', options: [
      { label: '「回家跟她說吧。她會想跟你一起想辦法的。」', outcome: 'perfect' },
      { label: '「佩琪說站上在找夜班人手，要不要問問？」', outcome: 'job' },
    ] },
    outcomes: {
      perfect: { text: '那天 Kevin 搭了最早的一班車回家。一週後他傳訊息：「她說，早知道就好了。」', reward: { money: 150, xp: 220, friend: { kevin: 25 } } },
      job: { name: '選擇不同', text: 'Kevin 去應徵了夜班工作。他還是沒告訴老婆，但至少，他不用再假裝了。', reward: { money: 150, xp: 180, friend: { kevin: 15, peiqi: 10 } } },
      normal: { text: 'Kevin 說他會再想想。', reward: { money: 100, xp: 120 } },
    },
  },
  sq_musician: {
    title: '失去夢想的音樂人', giver: 'xiaohei',
    desc: '小黑以前在東門站唱歌。他的試聽帶在古亭站弄丟以後，就不再唱了。',
    steps: [
      { text: '在古亭站找到試聽帶', goal: { kind: 'find', item: 'demotape', station: '古亭' } },
      { text: '還給小黑，跟他說說話', goal: { kind: 'decide', npc: 'xiaohei' } },
    ],
    decide: { npc: 'xiaohei', prompt: '小黑握著試聽帶：「……就算找回來，也沒人想聽吧。」', options: [
      { label: '「我想聽。下週三晚上，在這裡唱給我聽。」', outcome: 'perfect' },
      { label: '「那就為自己唱吧。」', outcome: 'normal' },
    ] },
    outcomes: {
      perfect: { name: '解鎖表演', text: '下週三晚上八點，東門站大廳響起了吉他聲。圍觀的人越來越多。小黑唱完，對你比了一個讚。', reward: { money: 200, xp: 250, items: { concert: 1 }, friend: { xiaohei: 30 } } },
      normal: { text: '小黑笑了一下，把試聽帶收進口袋。', reward: { money: 120, xp: 150, friend: { xiaohei: 15 } } },
    },
  },
  sq_nightwish: {
    title: '夜班工作者的願望', giver: 'qiuyue',
    desc: '秋月做了二十年夜班，從來沒看過淡水的日出。她請你幫她拍一張。',
    steps: [{ text: '早上 6 點到 8 點，在淡水站拍一張照片', goal: { kind: 'photo', station: '淡水', hours: [6, 8] } }, { text: '晚上拿給台北車站的秋月看', goal: { kind: 'talk', npc: 'qiuyue' } }],
    outcomes: { normal: { text: '秋月看著照片看了很久：「原來天亮是這個顏色。」她說，有一年冬天的凌晨，她在月台上看見一個提燈的女孩，也在等天亮。', reward: { money: 180, xp: 220, friend: { qiuyue: 30 } } } },
  },
  sq_apology: {
    title: '無法說出口的道歉', giver: 'wenhua',
    desc: '文華上次把佩琪的電話打錯、害她被主管罵，一直想道歉，卻開不了口。',
    steps: [{ text: '去找佩琪', goal: { kind: 'decide', npc: 'peiqi' } }],
    decide: { npc: 'peiqi', prompt: '你要怎麼幫文華？', options: [
      { label: '幫他傳話', outcome: 'relay' },
      { label: '約他們一起在忠孝新生站見面', outcome: 'perfect' },
    ] },
    outcomes: {
      perfect: { text: '兩個人見面後尷尬地笑了。佩琪說：「早說嘛，請我喝咖啡就好了。」', reward: { money: 150, xp: 180, friend: { wenhua: 15, peiqi: 15 } } },
      relay: { name: '選擇不同', text: '佩琪聽完笑了：「叫他自己來說啦！」不過她看起來沒在生氣了。', reward: { money: 120, xp: 140, friend: { wenhua: 10, peiqi: 10 } } },
    },
  },

  /* 打工、生活 */
  sq_store: {
    title: '便利商店短期工作', giver: 'xiaofen',
    desc: '晚班有人請假，小芬請你來幫忙一下。',
    steps: [{ text: '幫小芬顧店（回答客人的問題）', goal: { kind: 'work', npc: 'xiaofen' } }],
    work: { npc: 'xiaofen', pass: 2, questions: [
      { q: '客人：「有沒有熱的？」', options: ['御飯糰', '關東煮', '冰淇淋'], answer: 1 },
      { q: '客人要加值悠遊卡 500 元，給你一張 1000 元。要找多少？', options: ['400 元', '500 元', '600 元'], answer: 1 },
      { q: '牛奶快過期了，要放在哪裡？', options: ['最前面', '最後面', '藏起來'], answer: 0 },
    ] },
    outcomes: {
      perfect: { text: '小芬：「你比正職的還厲害！」', reward: { money: 300, xp: 150, friend: { xiaofen: 15 } } },
      normal: { text: '小芬：「辛苦了！今天的時薪給你。」', reward: { money: 200, xp: 100, friend: { xiaofen: 10 } } },
    },
  },
  sq_cafe: {
    title: '咖啡店幫忙', giver: 'leo',
    desc: 'Leo 的店員請假。三位客人點完咖啡：穿西裝的先生點美式、戴眼鏡的小姐點拿鐵、背書包的學生點熱可可。',
    steps: [{ text: '把飲料送給正確的客人', goal: { kind: 'work', npc: 'leo' } }],
    work: { npc: 'leo', pass: 2, questions: [
      { q: '拿鐵要給誰？', options: ['穿西裝的先生', '戴眼鏡的小姐', '背書包的學生'], answer: 1 },
      { q: '熱可可要給誰？', options: ['穿西裝的先生', '戴眼鏡的小姐', '背書包的學生'], answer: 2 },
      { q: '美式要給誰？', options: ['穿西裝的先生', '戴眼鏡的小姐', '背書包的學生'], answer: 0 },
    ] },
    outcomes: {
      perfect: { text: 'Leo：「全對！要不要考慮來打工？」他請你喝了一杯。', reward: { money: 250, xp: 140, items: { coffee: 1 }, friend: { leo: 15 } } },
      normal: { text: 'Leo：「有一杯送錯了，不過客人沒生氣。」', reward: { money: 150, xp: 90, friend: { leo: 5 } } },
    },
  },
  sq_guide: {
    title: '車站服務協助', giver: 'peiqi',
    desc: '尖峰時段旅客很多，佩琪請你幫忙回答旅客問路。',
    steps: [{ text: '回答旅客的問題', goal: { kind: 'work', npc: 'peiqi' } }],
    work: { npc: 'peiqi', pass: 3, questions: [
      { q: '旅客：「我要去淡水看夕陽，要搭哪條線？」', options: ['淡水信義線', '板南線', '文湖線'], answer: 0 },
      { q: '旅客：「動物園怎麼去？」', options: ['松山新店線', '文湖線', '環狀線'], answer: 1 },
      { q: '旅客：「從忠孝新生要轉哪條線去行天宮？」', options: ['中和新蘆線', '淡水信義線', '環狀線'], answer: 0 },
      { q: '旅客：「小碧潭要從哪一站轉支線？」', options: ['新店', '七張', '大坪林'], answer: 1 },
    ] },
    outcomes: {
      perfect: { text: '佩琪：「你根本是活地圖！」', reward: { money: 220, xp: 160, friend: { peiqi: 15 } } },
      normal: { text: '佩琪：「謝謝你！有一兩題我再幫你補充。」', reward: { money: 150, xp: 100, friend: { peiqi: 10 } } },
    },
  },
  sq_translate: {
    title: '翻譯協助', giver: 'tom',
    desc: 'Tom 看不懂站內的中文公告，請你幫他翻譯。',
    steps: [{ text: '幫 Tom 翻譯公告', goal: { kind: 'work', npc: 'tom' } }],
    work: { npc: 'tom', pass: 2, questions: [
      { q: '「請勿超越黃色警戒線」是什麼意思？', options: ['Do not cross the yellow line', 'Yellow line for priority', 'Exit is yellow'], answer: 0 },
      { q: '「博愛座」是？', options: ['Love seat', 'Priority seat', 'VIP seat'], answer: 1 },
      { q: '「轉乘」是？', options: ['Exit', 'Transfer', 'Ticket'], answer: 1 },
    ] },
    outcomes: {
      perfect: { text: 'Tom：「Perfect！謝謝你！」他送你一張他國家的明信片。', reward: { money: 150, xp: 120, items: { postcard: 1 }, friend: { tom: 15 } } },
      normal: { text: 'Tom：「I think I got it, thanks!」', reward: { money: 100, xp: 80, friend: { tom: 10 } } },
    },
  },
  sq_sort: {
    title: '物品分類', giver: 'meiling',
    desc: '失物招領的箱子滿了，美玲請你幫忙分類。',
    steps: [{ text: '幫美玲分類失物', goal: { kind: 'work', npc: 'meiling' } }],
    work: { npc: 'meiling', pass: 2, questions: [
      { q: '一把黑色雨傘，要放哪一箱？', options: ['雨具', '證件', '電子產品'], answer: 0 },
      { q: '一張學生證？', options: ['雨具', '證件（優先通知）', '衣物'], answer: 1 },
      { q: '一副耳機？', options: ['電子產品', '衣物', '食物'], answer: 0 },
    ] },
    outcomes: {
      perfect: { text: '美玲：「分得比我還整齊！」', reward: { money: 180, xp: 120, friend: { meiling: 15 } } },
      normal: { text: '美玲：「謝謝，剩下的我來就好。」', reward: { money: 120, xp: 80, friend: { meiling: 10 } } },
    },
  },
  sq_repair: {
    title: '簡單維修', giver: 'kai',
    desc: '科技大樓站的閘門感應器壞了，阿凱一個人忙不過來。',
    steps: [{ text: '照阿凱的提示修好閘門', goal: { kind: 'work', npc: 'kai' } }],
    work: { npc: 'kai', pass: 3, questions: [
      { q: '第一步要先做什麼？', options: ['直接拆開', '切到維修模式、放下圍欄', '用力拍一下'], answer: 1 },
      { q: '感應區沒反應，先檢查？', options: ['電源和接線', '換一台新的', '貼一張紙'], answer: 0 },
      { q: '修好以後要？', options: ['直接開放', '用測試卡刷三次確認', '關掉電源'], answer: 1 },
    ] },
    outcomes: {
      perfect: { text: '阿凱：「你很有天分！要不要考慮來當維修工？」', reward: { money: 220, xp: 160, friend: { kai: 15 } } },
      normal: { text: '阿凱：「差不多了，剩下我來。」', reward: { money: 150, xp: 100, friend: { kai: 10 } } },
    },
  },
  sq_clean: {
    title: '清潔委託', giver: 'afang',
    desc: '假日的西門站垃圾特別多，阿芳請你幫忙撿三樣東西拿去回收。',
    steps: [
      { text: '在西門站撿到空鋁罐', goal: { kind: 'find', item: 'can', station: '西門' } },
      { text: '在西門站撿到零食包裝', goal: { kind: 'find', item: 'wrapper', station: '西門' } },
      { text: '在西門站撿到寶特瓶', goal: { kind: 'find', item: 'bottle', station: '西門' } },
    ],
    outcomes: { normal: { text: '阿芳：「乖孩子，這個給你。」她塞給你一個菠蘿麵包。', reward: { money: 120, xp: 100, items: { bread: 1 }, friend: { afang: 15 } } } },
  },
  sq_restock: {
    title: '店家補貨', giver: 'xiaofen',
    desc: '台北車站的便利商店缺貨了，小芬請你去其他站的店幫忙買：太陽餅、牛軋糖。',
    steps: [
      { text: '在南港的伴手禮店買太陽餅', goal: { kind: 'buy', item: 'sunnycake' } },
      { text: '買牛軋糖（南港或市政府）', goal: { kind: 'buy', item: 'nougat' } },
      { text: '交給小芬（太陽餅）', goal: { kind: 'give', npc: 'xiaofen', item: 'sunnycake' } },
    ],
    outcomes: { normal: { name: '商店折扣', text: '小芬：「錢還你，另外送你一張集點卡！」', reward: { money: 400, xp: 120, friend: { xiaofen: 15 } } } },
  },
  sq_photojob: {
    title: '攝影委託', giver: 'yuan', trigger: { kind: 'item', item: 'camera', npc: 'yuan' },
    desc: '阿遠看到你帶著相機：「幫我拍三個車站的公共藝術好嗎？我想畫成系列。」',
    steps: [
      { text: '拍台北車站的公共藝術', goal: { kind: 'photo', station: '台北車站', spot: 'art' } },
      { text: '拍西門站的公共藝術', goal: { kind: 'photo', station: '西門', spot: 'art' } },
      { text: '拍中山站的公共藝術', goal: { kind: 'photo', station: '中山', spot: 'art' } },
      { text: '拿給淡水的阿遠看', goal: { kind: 'talk', npc: 'yuan' } },
    ],
    outcomes: { normal: { name: '收藏品', text: '阿遠把三張照片排在一起：「你看，三幅畫裡都有同一個小人影。」他送你一張速寫。', reward: { money: 200, xp: 200, items: { postcard: 1 }, friend: { yuan: 20 } } } },
  },
  sq_hiddenmsg: {
    title: '底片上的字', trigger: { kind: 'tool', station: '古亭', spot: 'notice' },
    desc: '你用相機拍古亭站的告示牌，洗出來的照片上多了一行字：「去行天宮，找沒有影子的人。」',
    steps: [{ text: '到行天宮站', goal: { kind: 'reach', station: '行天宮' } }, { text: '告訴秀蔅你看到了什麼（找不到她的話，她會在小碧潭站等你）', goal: { kind: 'talk', npc: 'xiuyu' } }],
    outcomes: { normal: { name: '隱藏資訊', text: '秀蔅看著照片：「你的相機看得到霧。好好收著它。」', reward: { money: 150, xp: 250, friend: { xiuyu: 15 } } } },
  },
};
for (const [id, q] of Object.entries(SIDE2)) QUESTS[id] = { type: 'side', giver: null, reward: {}, ...q };
// 有委託人的支線：加到 NPC 的 gives
for (const [id, q] of Object.entries(SIDE2)) {
  if (!q.giver || q.trigger) continue;
  const n = NPCS[q.giver]; if (!n) continue;
  n.gives = n.gives || []; if (!n.gives.includes(id)) n.gives.push(id);
}

// 收藏品商人老 K 今天擺攤的車站，蓋一台攤車
function STATION_EXTRAS(stationId) { return npcStation(NPCS.oldk) === stationId ? ['stall'] : []; }

/* ── 執行：觸發、選擇、打工、相機 ── */
const SideQuests = (() => {
  const S = () => Game.state;
  const today = () => TaipeiTime.date();
  const hourOk = h => { if (!h) return true; const x = TaipeiTime.now().hour; return x >= h[0] && x < h[1]; };
  const KIND = { overhear: '你聽見旁邊的人在說話', pa: '📢 車站廣播', phone: '📱 手機訊息', notice: '公告欄', map: '路線圖', tool: '📷 相機', time: '偶遇', pickup: '撿到東西', after: '後續委託', item: '委託', choice: '後續' };
  function offerable(id) {
    const q = QUESTS[id], f = S().flags;
    return q && Quests.canAccept(id) && !(f.offered && f.offered[id] === today());
  }
  function offer(id) {
    const q = QUESTS[id], t = q.trigger || {}, f = S().flags;
    (f.offered = f.offered || {})[id] = today(); saveState();
    if (t.kind === 'pa') Sound.announce(t.text.replace(/^[^：]*：/, ''), '', { chime: true });
    if (t.kind === 'phone') { Sound.itemGet(); toast('<b>📱 收到一則訊息</b>'); }
    const full = q.type === 'side' && Quests.sideCount() >= SIDE_LIMIT;
    Dialog.show({ name: t.from || KIND[t.kind] || '委託', role: t.from ? (KIND[t.kind] || '') : '' }, `${t.text || q.desc}<br><small>${esc(q.desc)}</small>`, [
      { label: full ? `支線已滿（${SIDE_LIMIT}/${SIDE_LIMIT}）` : `接下：${q.title}`, primary: !full, disabled: full, run: () => { Quests.accept(id); Dialog.close(); } },
      { label: '不理會', run: () => Dialog.close() },
    ]);
    return true;
  }
  const trig = kind => Object.keys(QUESTS).filter(id => QUESTS[id].trigger && QUESTS[id].trigger.kind === kind);
  // 到站：聽見對話、廣播、手機訊息、偶遇（每次到站最多一則）
  function onArrive(stationId) {
    // 補救：支線滿了時撿到的東西（紙條、撿到就觸發的物品），或錯過的後續委託——有空位後再問一次（一天一次）
    const pending = trig('pickup').filter(id => S().inv[QUESTS[id].trigger.item] > 0)
      .concat(S().inv.note1 > 0 ? ['notes'] : [])
      .concat(trig('after').filter(id => Quests.isDone(QUESTS[id].trigger.after)))
      .find(id => offerable(id) && Quests.sideCount() < SIDE_LIMIT);
    if (pending) { setTimeout(() => { if (!Dialog.with && ctl && ctl.stationId === stationId) offer(pending); }, 2500); return; }
    for (const kind of ['pa', 'overhear', 'time', 'phone']) for (const id of trig(kind)) {
      const t = QUESTS[id].trigger;
      if (t.station && t.station !== stationId) continue;
      if (!hourOk(t.hours) || !offerable(id)) continue;
      if (kind === 'phone' && Math.random() < .5) continue;   // 手機訊息不一定馬上來
      setTimeout(() => { if (!Dialog.with && ctl && ctl.stationId === stationId) offer(id); }, 2500);
      return;
    }
  }
  // 查看公告欄、路線圖
  function onInspect(spot, stationId) {
    const kind = spot === 'notice' ? 'notice' : spot === 'map' ? 'map' : null; if (!kind) return false;
    const id = trig(kind).find(id => QUESTS[id].trigger.station === stationId && offerable(id));
    return id ? offer(id) : false;
  }
  // 撿到觸發任務的物品：直接接下
  function pickupItems(stationId) {
    return trig('pickup').filter(id => { const t = QUESTS[id].trigger; return t.station === stationId && Quests.canAccept(id) && !(S().inv[t.item] > 0); }).map(id => QUESTS[id].trigger.item);
  }
  function onPickup(item) {
    const id = trig('pickup').find(id => QUESTS[id].trigger.item === item); if (!id) return;
    if (Quests.canAccept(id)) { Quests.accept(id); toast(`<b>${QUESTS[id].title}</b><span>${QUESTS[id].desc}</span>`); }
    else if (QUESTS[id].type === 'side' && Quests.sideCount() >= SIDE_LIMIT) toast('<b>支線已滿</b><span>東西先收在背包裡，之後再處理</span>', 'warn');
  }
  // 前置任務完成 → 後續委託
  function onDone(id) {
    for (const nid of trig('after')) if (QUESTS[nid].trigger.after === id && Quests.canAccept(nid)) setTimeout(() => offer(nid), 2200);
  }
  // NPC 選單：持有特定物品才出現的委託
  function itemOffers(npcId) { return trig('item').filter(id => { const t = QUESTS[id].trigger; return t.npc === npcId && S().inv[t.item] > 0 && Quests.canAccept(id); }); }

  // 相機
  function photo() {
    const p = World.player, L = World.layout; if (!L) return;
    let sp = null, bd = 4;
    for (const s of L.spots) { const d = Math.hypot(s.x - p.x, s.z - p.z); if (Math.abs(s.y - p.y) < 1 && d < bd) { bd = d; sp = s; } }
    const ev = { kind: 'photo', station: L.stationId, spot: sp ? sp.kind : null, zone: World.zone().kind, hour: TaipeiTime.now().hour };
    const fx = document.getElementById('tpFx'); fx.hidden = false; fx.classList.remove('out'); setTimeout(() => { fx.classList.add('out'); setTimeout(() => { fx.hidden = true; }, 500); }, 120);
    Sound.click();
    toast(`<b>喀嚓！</b><span>拍下了${esc(L.stationId)}${sp && SPOT_NAME[sp.kind] ? `的${SPOT_NAME[sp.kind]}` : ''}</span>`);
    S().flags.photos = (S().flags.photos || 0) + 1; saveState();
    questEvent(ev);
    const id = trig('tool').find(id => { const t = QUESTS[id].trigger; return t.station === ev.station && t.spot === ev.spot && offerable(id); });
    if (id) setTimeout(() => offer(id), 900);
    if (typeof Achievements !== 'undefined') Achievements.onPhoto(ev);
  }

  // 對話中的選擇（decide）與打工（work）
  function run(npc, want) {
    const q = QUESTS[want.id], g = want.step.goal;
    if (g.kind === 'decide') {
      const d = q.decide;
      const nHave = (q.clues || []).filter(c => (Quests.state(want.id).clues || {})[c.id]).length, nAll = (q.clues || []).length;
      const clues = nAll ? `<br><small>（線索 ${nHave} / ${nAll}）</small>${Progress.deduceHint(nHave >= nAll, nHave, nAll)}` : '';
      return Dialog.show({ name: npc.name, role: q.title }, `${d.prompt}${clues}`, d.options.map(o => ({ label: (nAll && o.correct && Progress.markAnswer(nHave >= nAll) ? '★ ' : '') + o.label, run: () => { Dialog.close(); Quests.resolve(want.id, o.outcome); } })).concat([{ label: '等一下再說', run: () => Dialog.close() }]));
    }
    if (g.kind === 'work') {
      const w = q.work; let k = 0, score = 0;
      const ask = () => {
        if (k >= w.questions.length) {
          if (score < w.pass) return Dialog.show({ name: npc.name, role: q.title }, `答對 ${score} / ${w.questions.length}。「嗯……再練習一下，等等再來試一次吧。」`, [{ label: '好', run: () => Dialog.close() }]);
          return Dialog.show({ name: npc.name, role: q.title }, `答對 ${score} / ${w.questions.length}。`, [{ label: '完成', primary: true, run: () => { Dialog.close(); Quests.resolve(want.id, score === w.questions.length ? 'perfect' : 'normal'); } }]);
        }
        const Q = w.questions[k];
        Dialog.show({ name: npc.name, role: `${q.title}（${k + 1}/${w.questions.length}）` }, Q.q, Q.options.map((o, i) => ({ label: o, run: () => { if (i === Q.answer) { score++; Sound.click(); } k++; ask(); } })));
      };
      return ask();
    }
  }
  return { onArrive, onInspect, pickupItems, onPickup, onDone, itemOffers, photo, run, offer };
})();
