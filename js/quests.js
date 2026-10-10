/* 任務：主線（每條線一條，可同時接多條）、支線（最多同時 5 個）、限時活動
 * 目標種類（goal.kind）：
 *   reach   到某站（station）
 *   ride    搭某線到某站（line, station）
 *   talk    和某位 NPC 說話（npc）
 *   inspect 查看車站裡的某個東西（spot，在 station）
 *   find    在某站撿到物品（item, station）
 *   give    把物品交給 NPC（npc, item）
 *   buy     在商店買某樣東西（item）
 *   puzzles 解開某條線每一站的謎題（line）——主線用
 *   anomaly 在隧道裡看見霧的月台
 *   sit     在車上坐下
 * find 的 station 寫 '@treasure' 表示寶物所在的車站（解完謎題時隨機決定）
 * 獎勵：money（新台幣）、xp、items（物品 id → 數量）、friend（NPC id → 好感）、wear（服裝 id，見 outfits.js）
 * 物品：eat 表示可以吃／喝（捷運裡可以飲食），event 表示只在該活動期間販售
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
  bubbletea: { name: '珍珠奶茶', desc: '半糖少冰。可以送人，也可以自己喝。', icon: '🧋', price: 60, shop: true, eat: '喝' },
  coffee: { name: '美式咖啡', desc: '上班族最需要的東西。', icon: '☕', price: 55, shop: true, eat: '喝' },
  onigiri: { name: '御飯糰', desc: '鮪魚口味。', icon: '🍙', price: 35, shop: true, eat: '吃' },
  water: { name: '礦泉水', desc: '販賣機買的，冰的。', icon: '💧', price: 20, shop: true, eat: '喝' },
  greentea: { name: '無糖綠茶', desc: '販賣機買的。', icon: '🍵', price: 25, shop: true, eat: '喝' },
  sportdrink: { name: '運動飲料', desc: '跑完步最需要的。', icon: '🥤', price: 30, shop: true, eat: '喝' },
  soymilk: { name: '冰豆漿', desc: '早餐店的味道。', icon: '🥛', price: 25, shop: true, eat: '喝' },
  bread: { name: '菠蘿麵包', desc: '外皮酥酥的，還是溫的。', icon: '🍞', price: 35, shop: true, eat: '吃' },
  chicken: { name: '炸雞排', desc: '比臉還大，要切不要辣。', icon: '🍗', price: 80, shop: true, eat: '吃' },
  sausage: { name: '大腸包小腸', desc: '夜市經典，加蒜頭。', icon: '🌭', price: 70, shop: true, eat: '吃' },
  sunnycake: { name: '太陽餅', desc: '台中來的伴手禮，一咬就掉屑。', icon: '🥮', price: 150, shop: true },
  nougat: { name: '牛軋糖', desc: '奶香很濃，送長輩剛好。', icon: '🍬', price: 130, shop: true },
  postcard: { name: '捷運明信片', desc: '畫著六條路線的明信片。', icon: '🖼️', price: 40, shop: true },
  easycard: { name: '造型悠遊卡', desc: '列車造型的限定悠遊卡，收藏用。', icon: '💳', price: 250, shop: true },
  pumpkinlatte: { name: '南瓜拿鐵', desc: '萬聖節限定，上面撒了肉桂粉。', icon: '🎃', price: 75, shop: true, eat: '喝', event: 'event_halloween' },
  xmascookie: { name: '薑餅人', desc: '聖誕節限定，笑得有點詭異。', icon: '🍪', price: 60, shop: true, eat: '吃', event: 'event_xmas' },
  mooncake: { name: '月餅', desc: '中秋節限定，蛋黃酥。', icon: '🥮', price: 90, shop: true, eat: '吃', event: 'event_midautumn' },
  chocolate: { name: '巧克力', desc: '情人節限定，愛心形狀。', icon: '🍫', price: 120, shop: true, event: 'event_valentine' },
  pumpkin: { name: '小南瓜', desc: '萬聖節活動藏起來的南瓜。', icon: '🎃' },
  giftbox: { name: '聖誕禮物盒', desc: '綁著紅色緞帶，搖起來有聲音。', icon: '🎁' },
  redenvelope: { name: '紅包', desc: '新年快樂！裡面有一點零錢。', icon: '🧧' },
  pineapplecake: { name: '鳳梨酥', desc: '送禮最安全的選擇。', icon: '🍍', price: 120, shop: true },
  keychain: { name: '捷運吊飾', desc: '迷你車廂造型，掛在包包上很可愛。', icon: '🚇', price: 150, shop: true },
  flower: { name: '一小束花', desc: '車站花店的滿天星。', icon: '💐', price: 180, shop: true },
  flag: { name: '小國旗', desc: '雙十節活動的旗子。', icon: '🇹🇼' },
  photo: { name: '舊照片', desc: '兩個年輕人站在圓山的老站牌前。', icon: '🖼️' },
  treasure_BL: { name: '藍色車廂鑰匙', desc: '鑰匙上刻著「7」。板南線的寶物。', icon: '🗝️' },
  treasure_BR: { name: '錄音帶', desc: '標籤寫著「BR00」。文湖線的寶物。', icon: '📼' },
  treasure_R: { name: '褪色的票卡', desc: '日期停在某一天的傍晚。淡水信義線的寶物。', icon: '🎫' },
  treasure_G: { name: '壓花書籤', desc: '一片永遠綠著的葉子。松山新店線的寶物。', icon: '🍃' },
  treasure_O: { name: '懷錶的發條', desc: '轉一下，會聽見末班車的廣播。中和新蘆線的寶物。', icon: '⌚' },
  treasure_Y: { name: '指南針的指針', desc: '放上去之後會指向霧最濃的地方。環狀線的寶物。', icon: '🧭' },
  ch_glasses: { name: '老花眼鏡', desc: '鏡腳用膠帶纏過。', icon: '👓' },
  ch_scarf: { name: '格子圍巾', desc: '還帶著一點香水味。', icon: '🧣' },
  ch_card: { name: '學生證', desc: '照片上的人笑得很僵硬。', icon: '🪪' },
  ch_book: { name: '藍色筆記本', desc: '裡面抄滿了捷運站名。', icon: '📘' },
  ch_toy: { name: '小熊玩偶', desc: '左耳縫過好幾次。', icon: '🧸' },
  ch_phone: { name: '手機', desc: '鎖定畫面是一隻柴犬。', icon: '📱' },
  ch_keys: { name: '鑰匙圈', desc: '上面掛著一個迷你月台吊飾。', icon: '🔑' },
  ch_hat: { name: '毛線帽', desc: '手織的，針腳有點歪。', icon: '🧶' },
  ring: { name: '婚戒', desc: '內側刻著兩個名字的縮寫。', icon: '💍' },
  bento: { name: '排骨便當', desc: '還是熱的，要趕快送到。', icon: '🍱' },
  ghostticket: { name: '霧的車票', desc: '站名欄寫著「霧」，票價欄是空白的。', icon: '🎟️' },
};

const QUESTS = {
  /* ── 主線（秀蔅給的）：由 MAIN_STORY 產生，見檔案後段 ── */
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

  /* ── 新增支線 ── */
  ring: {
    type: 'side', title: '月台縫裡的戒指', giver: 'afang',
    desc: '清潔阿姨阿芳說，昨天有位小姐的婚戒掉在西門站，一直找不到。',
    steps: [
      { text: '在西門站的月台或大廳角落找到戒指', goal: { kind: 'find', item: 'ring', station: '西門' } },
      { text: '把戒指交給阿芳', goal: { kind: 'give', npc: 'afang', item: 'ring' } },
    ],
    reward: { money: 250, xp: 150, friend: { afang: 15 } },
  },
  delivery: {
    type: 'side', title: '趕時間的便當', giver: 'ade',
    desc: '外送員阿德手上還有三單，請你幫忙把一個便當送到中山站的捷運警察志明手上。',
    steps: [{ text: '把排骨便當交給中山站的志明', goal: { kind: 'give', npc: 'zhiming', item: 'bento' } }],
    reward: { money: 200, xp: 140, friend: { ade: 10, zhiming: 10 } },
  },
  teacher: {
    type: 'side', title: '三十年前的學生', giver: 'wang',
    desc: '王老師想知道，以前那個上課都在畫畫的學生阿遠，現在過得好不好。',
    steps: [
      { text: '到淡水找街頭畫家阿遠', goal: { kind: 'talk', npc: 'yuan' } },
      { text: '回古亭告訴王老師', goal: { kind: 'talk', npc: 'wang' } },
    ],
    reward: { money: 220, xp: 180, friend: { wang: 20, yuan: 10 } },
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
  event_halloween: {
    type: 'event', title: '萬聖節：搗蛋南瓜', giver: 'eventstaff', month: 10, days: [24, 25, 26, 27, 28, 29, 30, 31],
    desc: '有人把南瓜藏在車站裡，找齊了有限定的南瓜髮箍。',
    steps: [
      { text: '在西門找到小南瓜', goal: { kind: 'find', item: 'pumpkin', station: '西門' } },
      { text: '在中山找到小南瓜', goal: { kind: 'find', item: 'pumpkin', station: '中山' } },
      { text: '在公館找到小南瓜', goal: { kind: 'find', item: 'pumpkin', station: '公館' } },
    ],
    reward: { money: 500, xp: 200, wear: 'acc_pumpkin' },
  },
  event_xmas: {
    type: 'event', title: '聖誕節：送不出去的禮物', giver: 'eventstaff', month: 12, days: [18, 19, 20, 21, 22, 23, 24, 25],
    desc: '聖誕老人把禮物盒掉在三個車站，幫忙撿回來。',
    steps: [
      { text: '在板橋找到禮物盒', goal: { kind: 'find', item: 'giftbox', station: '板橋' } },
      { text: '在市政府找到禮物盒', goal: { kind: 'find', item: 'giftbox', station: '市政府' } },
      { text: '在台北101/世貿找到禮物盒', goal: { kind: 'find', item: 'giftbox', station: '台北101/世貿' } },
    ],
    reward: { money: 600, xp: 250, wear: 'acc_santa' },
  },
  event_newyear: {
    type: 'event', title: '跨年：倒數之前', giver: 'eventstaff', dates: [[0, 12, 30, 31], [0, 1, 1, 1]],
    desc: '跨年夜，大家都往信義區去。搭淡水信義線到台北101/世貿，再去象山看看。',
    steps: [
      { text: '搭淡水信義線到台北101/世貿', goal: { kind: 'ride', line: 'R', station: '台北101/世貿' } },
      { text: '到象山', goal: { kind: 'reach', station: '象山' } },
    ],
    reward: { money: 600, xp: 260 },
  },
  event_lunar: {
    type: 'event', title: '春節：走春拿紅包', giver: 'eventstaff',
    dates: [[2026, 2, 16, 22], [2027, 2, 5, 11], [2028, 1, 25, 31], [2029, 2, 12, 18], [2030, 2, 2, 8]],
    desc: '過年走春，三間廟附近的車站都藏了紅包。',
    steps: [
      { text: '在龍山寺找到紅包', goal: { kind: 'find', item: 'redenvelope', station: '龍山寺' } },
      { text: '在行天宮找到紅包', goal: { kind: 'find', item: 'redenvelope', station: '行天宮' } },
      { text: '在台北車站找到紅包', goal: { kind: 'find', item: 'redenvelope', station: '台北車站' } },
    ],
    reward: { money: 888, xp: 260, wear: 'acc_lantern' },
  },
  event_midautumn: {
    type: 'event', title: '中秋節：一起烤肉', giver: 'eventstaff',
    dates: [[2026, 9, 23, 27], [2027, 9, 13, 17], [2028, 10, 1, 5], [2029, 9, 20, 24], [2030, 9, 10, 14]],
    desc: '活動志工要準備中秋烤肉，幫忙買月餅帶到中正紀念堂。',
    steps: [
      { text: '在商店買一個月餅', goal: { kind: 'buy', item: 'mooncake' } },
      { text: '到中正紀念堂', goal: { kind: 'reach', station: '中正紀念堂' } },
    ],
    reward: { money: 300, xp: 200, items: { mooncake: 2 } },
  },
  event_valentine: {
    type: 'event', title: '情人節：說不出口的話', giver: 'eventstaff', month: 2, days: [13, 14],
    desc: '有人想送花給在捷運上遇見的人，卻不敢開口。幫他把花送到秀蔅手上——她說她認得那個人。',
    steps: [
      { text: '在中山花店買一小束花', goal: { kind: 'buy', item: 'flower' } },
      { text: '把花交給秀蔅', goal: { kind: 'give', npc: 'xiuyu', item: 'flower' } },
    ],
    reward: { money: 300, xp: 200, items: { chocolate: 1 }, friend: { xiuyu: 15 } },
  },
};

/* ── 主線：每條線的每一站都有一題（只能在該線月台作答），全部解開後，寶物會出現在該線隨機一站 ── */
const MAIN_STORY = {
  BL: { title: '第七節車廂', desc: '秀蔅說板南線有一節不存在的車廂，只在霧裡停靠。她在板南線每一站的月台都留了一張紙條。' },
  BR: { title: '無人駕駛的聲音', desc: '文湖線的列車沒有司機，可是有人在駕駛室聽見報站的聲音。秀蔅把線索藏在文湖線每一站的月台。' },
  R: { title: '淡水夕照', desc: '一張被夕陽染紅的舊票卡，日期停在某一天。淡水信義線每一站的月台都有秀蔅的紙條。' },
  G: { title: '碧潭綠葉', desc: '一片永遠不會枯黃的葉子，葉脈像縮小的路線圖。線索在松山新店線每一站的月台。' },
  O: { title: '停在 00:30 的懷錶', desc: '一只懷錶的指針停在末班車的時間。線索在中和新蘆線每一站的月台，兩條支線都要走。' },
  Y: { title: '沒有指針的指南針', desc: '指南針沒有指針，外圈卻會慢慢朝某個方向發光。線索在環狀線每一站的月台。' },
};
for (const [line, m] of Object.entries(MAIN_STORY)) {
  QUESTS['main_' + line] = {
    type: 'main', line, title: m.title, giver: 'xiuyu', desc: m.desc,
    steps: [
      { text: `完成${LINES[line].zh}每一站月台上的委託（紙條上的謎題，或需要幫忙的人）`, goal: { kind: 'puzzles', line } },
      { text: `寶物出現在${LINES[line].zh}的某一站，搭${LINES[line].zh}去找出來`, goal: { kind: 'find', item: 'treasure_' + line, station: '@treasure' } },
    ],
    reward: { money: 800, xp: 600, friend: { xiuyu: 25 } },
  };
}

/* ── 秘密任務：遊戲裡不給任何提示，玩家碰巧達成隱藏條件時才會出現（不佔支線名額）
 * 觸發條件寫在 game.js（checkSecrets、arriveChecks、doRide、onGate、seatInteraction） ── */
const SECRET_QUESTS = {
  sec_ghost: {
    title: '不存在的月台',
    desc: '剛剛窗外那座綠色的月台……站名寫著「霧」。也許有人也看過。',
    steps: [
      { text: '到科技大樓找文湖線維修工阿凱問問', goal: { kind: 'talk', npc: 'kai' } },
      { text: '搭車穿過隧道，再看見一次霧的月台', goal: { kind: 'anomaly' } },
    ],
    reward: { money: 300, xp: 250, items: { ghostticket: 1 } },
  },
  sec_lasttrain: {
    title: '末班車',
    desc: '已經過了午夜，車廂裡只剩幾個人。趕在 00:30 收班前坐到終點吧。',
    steps: [{ text: '00:30 以前坐到任一條線的終點站', goal: { kind: 'terminal' } }],
    reward: { money: 200, xp: 200 },
  },
  sec_firsttrain: {
    title: '第一班車',
    desc: '霧剛散，第一班車就要進站了。整座城市好像只有你醒著。',
    steps: [{ text: '搭上任何一班車，坐到下一站', goal: { kind: 'ride' } }],
    reward: { money: 200, xp: 200 },
  },
  sec_branch: {
    title: '支線旅人',
    desc: '台北捷運有兩條很短的支線：新北投支線和小碧潭支線。你已經走了其中一條。',
    steps: [
      { text: '到另一條支線的盡頭', goal: { kind: 'reach', station: '@target' } },
    ],
    reward: { money: 250, xp: 220 },
  },
  sec_circle: {
    title: '環狀線的兩端',
    desc: '環狀線現在還不是一個圈。兩端都走過，才知道它想繞到哪裡。',
    steps: [
      { text: '搭環狀線坐到另一端的終點', goal: { kind: 'ride', line: 'Y', station: '@target' } },
    ],
    reward: { money: 250, xp: 220 },
  },
  sec_maxfare: {
    title: '最遠的旅程',
    desc: '65 元，是台北捷運最貴的一張票。坐了那麼遠，也該回到起點了。',
    steps: [{ text: '回到南港展覽館', goal: { kind: 'reach', station: '南港展覽館' } }],
    reward: { money: 130, xp: 200 },
  },
  sec_seat: {
    title: '老位子',
    desc: '你好像也有了自己習慣坐的位置。台北車站的玉蘭阿姨每天都坐同一張長椅，她一定懂。',
    steps: [{ text: '去找每天坐在長椅上的玉蘭阿姨', goal: { kind: 'talk', npc: 'yulan' } }],
    reward: { money: 150, xp: 180, friend: { yulan: 20 } },
  },
  sec_midnight: {
    title: '零點',
    desc: '日期換了。秀蔅說過，霧最濃的地方在河的出海口。',
    steps: [{ text: '00:30 以前搭到淡水', goal: { kind: 'reach', station: '淡水' } }],
    reward: { money: 200, xp: 260 },
  },
  sec_friend: {
    title: '知心',
    desc: '有人把你當成真正的朋友了。秀蔅好像有話想跟你說。',
    steps: [{ text: '去找秀蔅', goal: { kind: 'talk', npc: 'xiuyu' } }],
    reward: { money: 200, xp: 300, friend: { xiuyu: 20 } },
  },
};
for (const [id, q] of Object.entries(SECRET_QUESTS)) QUESTS[id] = { type: 'secret', giver: null, ...q };
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
    active()[id] = { step: 0, v: 2 };
    saveState();
    Game.onQuestChange && Game.onQuestChange('accept', id);
    return true;
  }
  function abandon(id) {
    if (QUESTS[id].type === 'main' || QUESTS[id].type === 'secret') return false;
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
      if (g.kind === 'puzzles') {   // 主線謎題：每一站各一題
        if (ev.kind !== 'puzzle' || ev.line !== g.line) continue;
        st.solved = st.solved || {};
        if (st.solved[ev.station]) continue;
        st.solved[ev.station] = true;
        const all = Puzzles.stations(g.line), n = all.filter(x => st.solved[x]).length;
        done.push({ id, text: `${ev.station}的委託（${n}/${all.length}）` });
        if (n < all.length) continue;
        st.treasure = all[(Math.random() * all.length) | 0];
        st.step++;
        done.push({ id, text: `${LINES[g.line].zh}每一站的委託都完成了！寶物出現在${LINES[g.line].zh}的某一站` });
        continue;
      }
      const where = x => (typeof x === 'string' && x[0] === '@' ? st[x.slice(1)] : x);
      if (g.kind !== ev.kind) {
        // 搭到某站也算「到達」
        if (g.kind === 'reach' && ev.kind === 'ride') ok = match(where(g.station), ev.station);
      } else if (g.kind === 'reach') ok = match(where(g.station), ev.station);
      else if (g.kind === 'ride') ok = (g.line == null || g.line === ev.line) && (g.station == null || match(where(g.station), ev.station));
      else if (g.kind === 'terminal' || g.kind === 'anomaly' || g.kind === 'sit') ok = true;
      else if (g.kind === 'talk') ok = g.npc === ev.npc;
      else if (g.kind === 'inspect') ok = g.spot === ev.spot && match(g.station, ev.station);
      else if (g.kind === 'find') ok = g.item === ev.item && (g.station == null || match(where(g.station), ev.station));
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
    const on = q => (q.month ? q.month === t.month && q.days.includes(t.day) : false)
      || (q.dates || []).some(([y, m, d0, d1]) => (!y || y === t.year) && m === t.month && t.day >= d0 && t.day <= d1);
    return Object.keys(QUESTS).filter(id => QUESTS[id].type === 'event' && on(QUESTS[id]));
  }
  // 秘密任務：達成隱藏條件時觸發（extra 會存進任務進度，例如 target）
  function secret(id, extra) {
    if (!QUESTS[id] || QUESTS[id].type !== 'secret' || !canAccept(id)) return false;
    active()[id] = { step: 0, v: 2, ...(extra || {}) };
    saveState();
    Game.onQuestChange && Game.onQuestChange('secret', id);
    return true;
  }
  return { accept, abandon, canAccept, isActive, isDone, emit, wants, sideCount, eventsNow, secret };
})();
