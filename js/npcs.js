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
    lines: ['霧又變濃了。每條路線的盡頭，都有一個零件在等人去拿。', '在我的時代，這條線已經延伸到山的另一邊了。', '小碧潭的傳送裝置，你放上幾個零件了？', '你身上有末班車的味道。'],
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
    gives: ['t_school'], likes: ['bubbletea', 'keychain'],
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
  afang: {
    name: '阿芳', role: '清潔阿姨', station: '西門', spot: 'concourse', hours: [[6, 14]], speed: .9,
    look: { girl: true, old: true, skin: '#d8a888', hair: 'bun', hairColor: '#5a4a40', top: '#5a8a6a', pattern: 'plain', bottom: '#2a3a3a', hat: 'cap', hatColor: '#5a8a6a' },
    gives: ['ring'], likes: ['soymilk', 'bread'],
    lines: ['地板剛拖過，小心滑喔。', '西門站假日的垃圾，比平常多三倍。', '每天第一班車以前，這裡安靜得像另一個地方。'],
    rumors: ['清晨五點多拖月台的時候，常常看到地上有濕濕的腳印，一路走到軌道那邊就不見了。'],
    questTalk: { ring: '就是這個！我昨天聽到那位小姐一直哭……我會好好交給她。謝謝你，孩子。' },
    knows: [{ npc: 'zhiming', text: '中山站的志明是好警察，有事可以找他。' }],
  },
  zhiming: {
    name: '志明', role: '捷運警察', station: '中山', spot: 'concourse', hours: [[8, 22]], speed: 1.0,
    look: { skin: '#d8a888', hair: 'short', hairColor: '#151515', top: '#1f2f4a', pattern: 'plain', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f2f4a', height: 1.05 },
    likes: ['coffee', 'bento'],
    lines: ['有需要幫忙可以跟我說。', '搭電扶梯請站穩扶好。', '最近扒手比較多，包包要背前面。'],
    rumors: ['監視器有一段畫面，凌晨一點，有個戴紅色貝雷帽的女孩站在月台上。可是那時候車站早就關了。'],
    questTalk: { delivery: '我的便當！我還以為今天要餓肚子了，謝謝。' },
  },
  wang: {
    name: '王老師', role: '退休國文老師', station: '古亭', spot: 'platform', hours: [[9, 17]], speed: .7,
    look: { old: true, skin: '#e2b49c', hair: 'short', hairColor: '#cfcfcf', top: '#6a5a4a', pattern: 'knit', bottom: '#3a3a40', glasses: true },
    gives: ['teacher'], likes: ['nougat', 'sunnycake', 'greentea'],
    lines: ['年輕人，坐捷運也要記得看看窗外。', '我教了三十年書，記得每一個學生的名字。'],
    rumors: ['以前有個學生跟我說，她在霧裡看過一座車站，站名只有一個字。'],
    questTalk: { teacher: '阿遠？他還在畫畫……那就好，那就好。' },
    knows: [{ npc: 'yuan', text: '阿遠以前上課都在課本上畫畫，現在聽說在淡水。' }],
  },
  ade: {
    name: '阿德', role: '外送員', station: '忠孝復興', spot: 'concourse', hours: [[11, 14], [17, 22]], speed: 1.8,
    look: { skin: '#c89070', hair: 'short', hairColor: '#151515', top: '#2fb36a', pattern: 'plain', bottom: '#2a2a2a', bag: 'backpack', bagColor: '#2fb36a', hat: 'cap', hatColor: '#2fb36a' },
    gives: ['delivery', 't_lunch'], likes: ['chicken', 'sportdrink'],
    lines: ['快快快，還有三單！', '騎車太危險了，今天下雨我改坐捷運送。'],
    rumors: ['有一單地址寫「霧站 1 號出口」，我找了一晚上都找不到。'],
    knows: [{ npc: 'zhiming', text: '中山站的志明每天都點同一家便當。' }],
  },
  lily: {
    name: 'Lily', role: '交換學生', station: '公館', spot: 'concourse', hours: [[10, 20]], speed: 1.2,
    look: { girl: true, skin: '#f2d2c0', hair: 'long', hairColor: '#c8a060', top: '#3aa0c0', pattern: 'plain', bottom: '#2a3a5a', bag: 'tote', bagColor: '#e6dcc6' },
    likes: ['bubbletea', 'postcard', 'pineapplecake'],
    lines: ['我在這裡交換一年，中文還在學……', '台灣的珍珠奶茶 is the best!', '捷運上大家都好安靜。'],
    rumors: ['My roommate said 半夜的捷運廣播會說一個 station name 她查不到。'],
  },
  grandma: {
    name: '陳奶奶', role: '帶孫子出門', station: '木柵', spot: 'platform', hours: [[9, 12], [15, 18]], speed: .6,
    look: { girl: true, old: true, skin: '#e2b49c', hair: 'bun', hairColor: '#d8d8d4', top: '#8a4a5a', pattern: 'knit', bottom: '#3a3a40' },
    likes: ['bread', 'pineapplecake'],
    lines: ['帶孫子去動物園。', '文湖線看得到外面，孫子最喜歡坐第一節。'],
    rumors: ['我先生以前在文湖線工作。他說有一次試車，車子自己停在一個不存在的站。'],
  },
  xiaojie: {
    name: '小傑', role: '街舞少年', station: '劍潭', spot: 'concourse', hours: [[16, 23]], speed: 1.6,
    look: { skin: '#d8a888', hair: 'mush', hairColor: '#151515', top: '#1d1d20', pattern: 'plain', bottom: '#4a4a52', hat: 'cap', hatColor: '#c4162a' },
    likes: ['sausage', 'sportdrink'],
    lines: ['晚上大家都在這附近練舞。', '下個月比賽，我一定要贏。'],
    rumors: ['練到很晚的時候，玻璃上的倒影會多一個人跟著我們跳。'],
  },
  zhou: {
    name: '老周', role: '夜班保全', station: '南港展覽館', spot: 'concourse', hours: [[19, 24]], speed: .8,
    look: { old: true, skin: '#cf9f86', hair: 'short', hairColor: '#9a9a96', top: '#2a3a4a', pattern: 'plain', bottom: '#1f2a3a', hat: 'cap', hatColor: '#2a3a4a' },
    gives: ['t_patrol'], likes: ['coffee', 'water'],
    lines: ['展覽散場的時候人最多。', '我巡夜巡了十幾年。'],
    rumors: ['收班以後我巡到月台，看到一個提著燈的女孩。我叫她，她回頭笑了一下，就不見了。'],
    knows: [{ npc: 'xiuyu', text: '那個提燈的女孩……如果你看到她，幫我問她冷不冷。' }],
  },
  xiaomei: {
    name: '小梅', role: '花店老闆娘', station: '中山', spot: 'concourse', hours: [[10, 21]], speed: .9,
    look: { girl: true, skin: '#f2cdb9', hair: 'bob', hairColor: '#4a2a1a', top: '#f4e6d8', pattern: 'plain', bottom: '#6a5a48', glasses: true },
    gives: ['t_flower'], likes: ['pineapplecake', 'greentea'],
    lines: ['今天的滿天星很漂亮喔。', '常常有人買花，卻不知道要送誰。'],
    rumors: ['有位老先生每天都來買一朵白玫瑰，說要送給「在霧裡等他的人」。'],
  },
  yuan: {
    name: '阿遠', role: '街頭畫家', station: '淡水', spot: 'concourse', hours: [[13, 20]], speed: .5,
    look: { skin: '#d8a888', hair: 'mush', hairColor: '#2a1a12', top: '#d8c3a5', pattern: 'plain', bottom: '#3a3a40', hat: 'beret', hatColor: '#3a3a3a' },
    gives: ['t_sunset'], likes: ['greentea', 'postcard'],
    lines: ['淡水的夕陽，每天顏色都不一樣。', '要不要幫你畫一張？'],
    rumors: ['我畫過一張捷運路網圖，畫完才發現多畫了一條線，灰色的。'],
    questTalk: { teacher: '王老師？他還記得我？……幫我跟他說，我現在每天都在畫畫，叫他不要擔心。' },
  },
  jiahao: {
    name: '嘉豪', role: '晨跑族', station: '大安森林公園', spot: 'concourse', hours: [[6, 9]], speed: 2.2,
    look: { skin: '#c89070', hair: 'short', hairColor: '#151515', top: '#e04848', pattern: 'plain', bottom: '#1d1d20', height: 1.04 },
    gives: ['t_coffee'], likes: ['sportdrink', 'water'],
    lines: ['早上在公園跑一圈，再坐捷運上班。', '你也要一起跑嗎？'],
    rumors: ['清晨跑步的時候，常看到一個穿白大衣的女孩坐在公園長椅上，好像在等第一班車。'],
  },
  linbo: {
    name: '林伯', role: '退休司機', station: '北投', spot: 'platform', hours: [[8, 16]], speed: .7,
    look: { old: true, skin: '#cf9f86', hair: 'short', hairColor: '#cfcfcf', top: '#4a5a6a', pattern: 'plain', bottom: '#2a2a30', hat: 'cap', hatColor: '#4a5a6a' },
    likes: ['coffee', 'onigiri'],
    lines: ['我以前在捷運開車。', '新北投支線只有一站，可是很多人專程來坐。'],
    rumors: ['我最後一次開末班車，到站以後回頭看，車廂裡還坐著一個人。可是我明明清過車了。'],
  },
  atao: {
    name: '阿桃', role: '早餐店老闆娘', station: '景美', spot: 'concourse', hours: [[6, 10]], speed: .9,
    look: { girl: true, skin: '#e2b49c', hair: 'bun', hairColor: '#2a1a12', top: '#f4f4f2', pattern: 'plain', bottom: '#3a3a40', scarf: '#e07a3a' },
    gives: ['t_breakfast'], likes: ['soymilk', 'bread'],
    lines: ['早安！今天也要吃早餐喔。', '我每天四點就起來煎蘿蔔糕。', '十點以後就收攤了。'],
    rumors: ['天還沒亮的時候，有一位穿白大衣的女孩來買過一次豆漿。她付的是一枚很舊的硬幣。'],
  },
  ferryman: {
    name: '擺渡人', role: '小碧潭的渡口', station: '小碧潭', spot: 'platform', speed: 0,
    look: { old: true, skin: '#d8b8a8', hair: 'short', hairColor: '#e8e8e4', top: '#4a5a6a', pattern: 'knit', bottom: '#2a2a30', coat: true, hat: 'cap', hatColor: '#2a2a30', lantern: true },
    lines: ['這條支線只有一站。很多人以為這裡是終點。', '大廳牆後那間「時空研究室」？秀蔅說裡面是傳送裝置。我替她顧了很久了。', '找到零件就放上去吧，一個一個來也可以。'],
    rumors: [],
  },
  eventstaff: {
    name: '活動志工', role: '節慶活動', station: '台北車站', spot: 'concourse', hours: [[9, 21]], speed: 0, event: '*',
    look: { girl: true, skin: '#efc4ae', hair: 'bun', hairColor: '#1a1a1a', top: '#c4162a', pattern: 'plain', bottom: '#f4f4f2', hat: 'cap', hatColor: '#1f3a8a' },
    gives: ['event_double10', 'event_halloween', 'event_xmas', 'event_newyear', 'event_lunar', 'event_midautumn', 'event_valentine'], likes: ['bubbletea', 'coffee'],
    get lines() {
      const T = {
        event_double10: '國慶日快樂！中正紀念堂、台北車站、市政府都藏了小國旗喔！',
        event_halloween: 'Trick or treat！西門、中山、公館都藏了南瓜。變裝的路人會分你糖果，晚上月台還會出現幽靈喔。糖果可以拿來找我換限定服裝！',
        event_xmas: '聖誕快樂！板橋車站前面的聖誕城你去過了嗎？',
        event_newyear: '今天晚上捷運會延長營運……開玩笑的，這裡還是 00:30 收班。',
        event_lunar: '新年快樂！走春記得去廟裡拜拜，紅包就藏在附近。',
        event_midautumn: '中秋節要烤肉！可是我忘了買月餅……',
        event_valentine: '情人節快樂。有人託我一件事，可以幫忙嗎？',
      };
      const now = Quests.eventsNow();
      return now.length ? now.map(id => T[id]).filter(Boolean) : ['最近沒有活動，下次節日再來找我。'];
    },
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
  staff: { speed: [.9, 1.2], gen: r => ({ girl: r() < .4, top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b' }) },
  cleaner: { speed: [.6, .9], gen: r => ({ girl: r() < .7, old: r() < .6, top: '#5a8a6a', pattern: 'plain', bottom: '#2a3a3a', hat: 'cap', hatColor: '#5a8a6a' }) },
  police: { speed: [1.0, 1.2], gen: r => ({ girl: r() < .2, top: '#1f2f4a', pattern: 'plain', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f2f4a', height: 1.04 }) },
  delivery: { speed: [1.8, 2.3], gen: r => ({ girl: r() < .2, top: ['#2fb36a', '#e0447a'][r() * 2 | 0], pattern: 'plain', bottom: '#2a2a2a', bag: 'backpack', bagColor: '#2fb36a', hat: 'cap', hatColor: '#2a2a2a' }) },
  kid: { speed: [1.3, 1.8], gen: r => ({ girl: r() < .5, top: ['#f2c200', '#e07a8a', '#3aa0c0', '#7ac04a'][r() * 4 | 0], pattern: r() < .4 ? 'stripe' : 'plain', bottom: '#2a3a5a', height: .62, bag: r() < .5 ? 'backpack' : null, bagColor: '#e04848' }) },
  runner: { speed: [2.2, 2.8], gen: r => ({ girl: r() < .4, top: ['#e04848', '#2a7de1', '#f2c200'][r() * 3 | 0], pattern: 'plain', bottom: '#1d1d20' }) },
  foreigner: { speed: [1.0, 1.3], gen: r => ({ girl: r() < .5, top: ['#f4f4f2', '#3a6a9a', '#a86a2a'][r() * 3 | 0], pattern: 'plain', bottom: '#6a7a5a', bag: 'backpack', bagColor: '#5a5a5a', height: 1.06, foreign: true }) },
};
const CROWD_TALK = {
  staff: ['列車進站，請勿超越黃色警戒線。', '需要幫忙嗎？', '轉乘請往電扶梯上大廳。'],
  cleaner: ['小心地滑喔。', '垃圾請帶走，謝謝。', '這站的地板我拖了十年。'],
  police: ['包包請背在前面。', '有任何問題可以找我們。', '晚上回家注意安全。'],
  delivery: ['不好意思借過！', '還有兩單要送……', '電梯呢電梯在哪？'],
  kid: ['我要坐第一節車廂！', '媽媽說不可以在月台跑。', '你看！列車來了！'],
  runner: ['呼……呼……再一站。', '早上空氣比較好。', '借過借過！'],
  foreigner: ['Excuse me, where is the exit?', '謝謝！Thank you!', 'This station is so clean.'],
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
// 依時段的人群之外，再加上站務、清潔、警察、外送、小孩、跑步、外國旅客
function crowdExtra(hour) {
  const w = { staff: 2, cleaner: hour < 10 ? 2 : 1, police: 1, foreigner: hour >= 9 && hour < 21 ? 2 : 0, delivery: (hour >= 11 && hour < 14) || (hour >= 17 && hour < 21) ? 2 : 0, kid: (hour >= 9 && hour < 19) ? 2 : 0, runner: hour >= 6 && hour < 9 ? 2 : 0 };
  return { n: hour >= 6 && hour < 23 ? 4 : 2, w };
}

// NPC 今天在哪一站：固定車站、依時段的行程（schedule）、每天換一站（rotate）
function npcStation(def) {
  const t = TaipeiTime.now();
  if (def.schedule) { const s = def.schedule.find(([a, b]) => t.hour >= a && t.hour < b); return s ? s[2] : null; }
  if (def.rotate) return def.rotate[(t.year * 372 + t.month * 31 + t.day) % def.rotate.length];
  return def.station;
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
      else if (area.kind === 'unpaid') { const U = L.unpaid; x = U.x0 + 2 + rnd() * (U.x1 - U.x0 - 4); z = U.z0 + 1.5 + rnd() * (U.z1 - U.z0 - 4); y = 0; }
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
    if (['cafe', 'stage', 'stall', 'shop', 'breakfast', 'mistshop', 'onsen'].includes(def.spot)) return Station3D.placeAt(L, def.spot);
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
      if (!forced && (npcStation(def) !== id || !inHours(def))) continue;
      if (def.onlyQuest && !def.onlyQuest.some(q => Quests.isActive(q))) continue;   // 只在任務進行時出現
      if (def.onlyFlag && !Game.state.flags[def.onlyFlag]) continue;                // 只在達成秘密條件後出現
      if (def.event && !(def.event === '*' ? Quests.eventsNow().length : Quests.eventsNow().includes(def.event))) continue;
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
    const hr = TaipeiTime.now().hour, mix = crowdMix(hr), ex = crowdExtra(hr);
    const types = Object.entries(mix.w).flatMap(([k, n]) => Array(n).fill(k));
    const extra = Object.entries(ex.w).flatMap(([k, n]) => Array(n).fill(k));
    for (let i = 0; i < mix.n + ex.n; i++) {
      const type = i < mix.n ? types[(rnd() * types.length) | 0] : extra[(rnd() * extra.length) | 0], C = CROWD_TYPES[type];
      const look = { skin: SKINS[(rnd() * SKINS.length) | 0], hairColor: HAIRS[(rnd() * HAIRS.length) | 0], height: .94 + rnd() * .12, ...C.gen(rnd) };
      look.hair = look.girl ? ['long', 'bob', 'bun'][(rnd() * 3) | 0] : ['short', 'mush', 'short'][(rnd() * 3) | 0];
      if (look.old) look.hairColor = '#cfcfcf';
      if (typeof Festival !== 'undefined') Festival.dress(look, rnd);   // 萬聖節：路人變裝
      if (look.foreign) { look.skin = ['#f2d6c8', '#f5dccf', '#8a5a40'][(rnd() * 3) | 0]; look.hairColor = ['#c8a060', '#8a5a30', '#1a1a1a'][(rnd() * 3) | 0]; }
      if (look.girl && type !== 'student' && type !== 'kid' && rnd() < .4) look.skirt = true;
      const area = rnd() < .5 ? { kind: 'concourse' } : { kind: 'platform', P: L.platforms[(rnd() * L.platforms.length) | 0] };
      const pos = randomPoint(area); if (!pos) continue;
      addNpc({ id: 'crowd' + i, name: { office: '上班族', student: '學生', elder: '長輩', tourist: '觀光客', casual: '路人', staff: '站務員', cleaner: '清潔人員', police: '捷運警察', delivery: '外送員', kid: '小朋友', runner: '晨跑的人', foreigner: '外國旅客' }[type], type, look, pos, area, speed: C.speed[0] + rnd() * (C.speed[1] - C.speed[0]) });
    }
    assignBehaviors(L, hr);
  }
  // 秀蔅藏身處：某個月台的端點附近，或大廳角落
  function hiddenSpot() {
    const L = layout, opts = [];
    for (const P of L.platforms) for (const ex of [-1, 1]) opts.push({ x: P.x + ex * 29.5, y: P.y, z: P.z + .9 });
    const C = L.concourse; opts.push({ x: C.x0 + 1.5, y: 0, z: C.z0 + 1.5 }, { x: C.x1 - 1.5, y: 0, z: C.z0 + 1.5 });
    return opts[(rnd() * opts.length) | 0];
  }
  function clear() { for (const n of list) World.scene.remove(n.rig.root); list = []; queues = []; }

  /* ── 日常動作：排隊（售票機、販賣機、商店）、在月台車門前候車、通勤、買東西 ── */
  let queues = [];
  function addQueuer(L, look, q, k) {
    const pos = { x: q.x + q.dx * k, y: q.y, z: q.z + q.dz * k };
    if (World.groundAt(pos.x, pos.z, pos.y) == null) return;
    const n = addNpc({ id: 'q' + queues.length + k + q.name, name: q.who || '排隊的人', type: 'casual', look, pos, area: { kind: q.z > layout.gateZ ? 'unpaid' : 'concourse' }, speed: 1.1 });
    n.behavior = 'queue'; n.queue = q; n.slot = k; n.target = null; n.wait = 0; n.face = Math.atan2(-q.dx, -q.dz);
    q.members.push(n);
  }
  function crowdLook() {
    const C = CROWD_TYPES[['office', 'casual', 'student', 'tourist'][(rnd() * 4) | 0]];
    const look = { skin: SKINS[(rnd() * SKINS.length) | 0], hairColor: HAIRS[(rnd() * HAIRS.length) | 0], height: .94 + rnd() * .12, ...C.gen(rnd) };
    look.hair = look.girl ? ['long', 'bob', 'bun'][(rnd() * 3) | 0] : ['short', 'mush'][(rnd() * 2) | 0];
    return look;
  }
  function assignBehaviors(L, hr) {
    const U = L.unpaid, C = L.concourse, rush = (hr >= 7 && hr < 9) || (hr >= 17 && hr < 20);
    // 排隊的地方：售票機前、販賣機前、商店／咖啡店櫃台前
    const spots = [{ name: '售票機', x: U.x0 + 2, y: 0, z: U.z1 - 1.5, dx: 0, dz: -.8 }, { name: '販賣機', x: U.x1 - 1.4, y: 0, z: U.z0 + 6.2, dx: -.8, dz: 0 }];
    if (Station3D.SHOPS[L.stationId]) spots.push({ name: '商店', x: U.x0 + 1.9, y: 0, z: U.z0 + 7, dx: .8, dz: 0 });
    const cafe = L.spots.find(s => s.kind === 'cafe'); if (cafe) spots.push({ name: '咖啡店', x: cafe.x, y: 0, z: cafe.z, dx: -.8, dz: 0 });
    for (const q of spots) {
      q.members = []; q.timer = 6 + rnd() * 5; queues.push(q);
      const n = (rush ? 3 : 1) + ((rnd() * 2) | 0);
      for (let k = 0; k < n; k++) addQueuer(L, crowdLook(), q, k);
    }
    // 其他人群：月台上在車門前排隊候車、尖峰時段快步通勤、偶爾去買東西
    for (const n of list) {
      if (n.named || n.behavior) continue;
      if (n.area && n.area.kind === 'platform' && rnd() < .7) {
        const P = n.area.P, side = rnd() < .5 ? 1 : -1, d = Station3D.DOORS[(rnd() * Station3D.DOORS.length) | 0];
        n.behavior = 'platformWait'; n.target = { x: P.x + d + (rnd() < .5 ? -1.05 : 1.05), y: P.y, z: P.z + side * (1.9 + rnd() * .4) }; n.lookZ = side;
      } else if (n.area && n.area.kind === 'concourse') {
        if (rush && rnd() < .6) { n.behavior = 'commute'; n.speed *= 1.25; }
        else if (rnd() < .3) n.behavior = 'shopping';
      }
    }
  }
  function nextTarget(n) {
    const L = layout;
    if (n.behavior === 'commute') {   // 閘門 ↔ 電扶梯口
      n.leg = !n.leg;
      if (n.leg) return { x: -5 + rnd() * 10, y: 0, z: L.gateZ - 1.4 };
      const P = L.platforms[(rnd() * L.platforms.length) | 0], r = P.ramps[(rnd() * P.ramps.length) | 0];
      return { x: r.xb + r.b * 1.2, y: 0, z: r.z + (rnd() - .5) * 2 };
    }
    if (n.behavior === 'shopping' && !n.bought) {   // 去最近的販賣機或商店
      const sp = L.spots.find(s => ['cafe', 'vending', 'shop', 'breakfast'].includes(s.kind) && s.z < L.gateZ) || null;
      if (sp) return { x: sp.x, y: 0, z: sp.z };
      n.behavior = null;
    }
    return randomPoint(n.area || { kind: 'concourse' });
  }
  function arrived(n) {
    if (n.behavior === 'platformWait') { n.wait = 1e9; n.face = n.lookZ > 0 ? 0 : Math.PI; return; }   // 面向軌道等車
    if (n.behavior === 'shopping' && !n.bought) {
      n.bought = true; n.wait = 3;
      const bag = new THREE.Mesh(new THREE.BoxGeometry(.22, .26, .1), new THREE.MeshStandardMaterial({ color: ['#e8e4dc', '#2a9d8f', '#c4162a'][(rnd() * 3) | 0], roughness: .9 }));
      bag.position.set(.28, .62, .05); n.rig.root.add(bag);
      return;
    }
    if (n.behavior === 'queue') { n.wait = 1e9; n.face = Math.atan2(-n.queue.dx, -n.queue.dz); return; }
    n.wait = n.behavior === 'commute' ? .2 : 1 + Math.random() * 4;
  }
  // 排隊：最前面的人辦完就離開（買東西的會提著袋子走），後面的人往前一格
  function tickQueues(dt) {
    for (const q of queues) {
      q.timer -= dt; if (q.timer > 0 || !q.members.length) continue;
      q.timer = 6 + rnd() * 6;
      const first = q.members.shift();
      if (q.name !== '售票機') { const bag = new THREE.Mesh(new THREE.BoxGeometry(.22, .26, .1), new THREE.MeshStandardMaterial({ color: ['#e8e4dc', '#2a9d8f', '#c4162a'][(rnd() * 3) | 0], roughness: .9 })); bag.position.set(.28, .62, .05); first.rig.root.add(bag); }
      first.behavior = null; first.wait = 0; first.area = { kind: 'unpaid' };
      q.members.forEach((m, k) => { m.slot = k; m.target = { x: q.x + q.dx * k, y: q.y, z: q.z + q.dz * k }; m.wait = 0; });
    }
  }


  // 每幀更新：走向目標點；前方有玩家就停下
  function tick(dt, now) {
    if (World.riding) { for (const n of list) n.rig.root.visible = false; return; }
    tickQueues(dt);
    const p = World.player;
    for (const n of list) {
      n.rig.root.visible = true;
      const talking = Dialog.with === n;
      if (talking) n.speedNow = 0;   // 說話時停下來
      else if (n.speed > 0) {
        if (n.wait > 0) { n.wait -= dt; n.speedNow = 0; }
        else {
          if (!n.target) n.target = nextTarget(n);
          if (n.target) {
            const dx = n.target.x - n.x, dz = n.target.z - n.z, d = Math.hypot(dx, dz);
            const toP = Math.hypot(p.x - n.x, p.z - n.z);
            const ahead = toP < 1.1 && Math.abs(p.y - n.y) < .6 && ((p.x - n.x) * dx + (p.z - n.z) * dz) > 0;
            if (d < .2) { n.target = null; n.speedNow = 0; arrived(n); }
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
      if (s.linesMet[l.line] || !MAIN_STORY[l.line]) continue;
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
  const tier = v => friendTier(v);
  function hearts(v) { const n = Math.min(5, Math.floor((v || 0) / 24)); return `${'♥'.repeat(n)}${'♡'.repeat(5 - n)} ${friendTier(v)}`; }
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
    if (npc.id === 'ferryman') return ferryman(npc);
    if (npc.id === 'wushang') {   // 霧商人：先處理秘密故事，再開店
      const d = Quests.emit({ kind: 'talk', npc: 'wushang' });
      if (d.length) return show(npc, npc.questTalk[d[0].id] || '……', [{ label: '看看商品', primary: true, run: () => Gold.shop() }, { label: '再見', run: close }]);
      return show(npc, pick(npc.lines), [{ label: '看看商品', primary: true, run: () => Gold.shop() }, { label: '聊天', run: () => chat(npc) }, { label: '再見', run: close }]);
    }
    if (!npc.named) {
      if (typeof Festival !== 'undefined' && Festival.treat(npc, show, close)) return;
      const pool = npc.role === '乘客' ? (TRAIN_TALK[npc.type] || TRAIN_TALK.office) : (CROWD_TALK[npc.type] || CROWD_TALK.casual);
      return show(npc, pick(pool), [{ label: '再聊一下', run: () => open(npc) }, { label: '再見', run: close }]);
    }
    const s = Game.state, f = s.friends[npc.id] || 0;
    if (typeof Achievements !== 'undefined') Achievements.onTalk(npc.id);
    if (typeof Progress !== 'undefined') Progress.onTalk(npc.id);
    // 需要做選擇或打工的任務步驟
    const want = Quests.wants('decide', g => g.npc === npc.id) || Quests.wants('work', g => g.npc === npc.id);
    if (want) {
      const pre = Quests.emit({ kind: 'talk', npc: npc.id });   // 同時算作和他說過話（線索）
      for (const d of pre) toast(`<b>${QUESTS[d.id].title}</b><span>✓ ${d.text}</span>`);
      return SideQuests.run(npc, want);
    }
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
    for (const qid of (npc.gives || []).concat(SideQuests.itemOffers(npc.id))) {
      const q = QUESTS[qid];
      if (Quests.isActive(qid) || Quests.isDone(qid)) continue;
      if (q.type === 'event' && !Quests.eventsNow().includes(qid)) continue;
      if (Quests.failedToday(qid)) { btns.push({ label: `限時任務：${q.title}（今天來不及了，請之後或明天再來）`, disabled: true, run: () => {} }); continue; }
      const full = q.type === 'side' && Quests.sideCount() >= SIDE_LIMIT;
      btns.push({ label: full ? `支線已滿（${SIDE_LIMIT}/${SIDE_LIMIT}）` : q.limit ? `限時任務：${q.title}（${q.limit} 分鐘）` : `接任務：${q.title}`, primary: !full, disabled: full, run: () => { Quests.accept(qid); onAccept(qid); menu(npc, q.desc); } });
    }
    if (typeof NPC_MENU_HOOKS !== 'undefined') for (const h of NPC_MENU_HOOKS) btns.push(...h(npc));
    btns.push({ label: '聊天', run: () => chat(npc) });
    btns.push({ label: '送禮', run: () => gift(npc) });
    btns.push({ label: '再見', run: close });
    show(npc, text, btns);
  }
  function onAccept(qid) {
    // 部分任務接下時會拿到東西
    if (qid === 'letter') { Game.state.inv.letter = (Game.state.inv.letter || 0) + 1; toast('<b>拿到 💌 粉紅色信封</b>'); }
    const got = { delivery: 'bento', t_lunch: 'bento', t_breakfast: 'breakfast', t_flower: 'flower' }[qid];
    if (got) { Game.state.inv[got] = (Game.state.inv[got] || 0) + 1; toast(`<b>拿到 ${ITEMS[got].icon} ${ITEMS[got].name}</b>`); }
    if (QUESTS[qid].limit) toast(`<b>限時任務開始</b><span>${QUESTS[qid].limit} 分鐘內完成</span>`, 'warn');
    saveState(); updateHud();
  }
  function chat(npc) {
    const s = Game.state, f = s.friends[npc.id] || 0;
    Friends.add(npc.id, Friends.chatGain(npc.id) + Math.ceil(Progress.friendBonus(npc.id) / 2));
    let pool = [...npc.lines];
    if (f >= 50 && npc.knows) pool = pool.concat(npc.knows.map(k => k.text));
    if (f >= 80 && npc.rumors) pool = pool.concat(npc.rumors.map(r => '（小聲）' + r));
    menu(npc, pick(pool));
  }
  function gift(npc) {
    const s = Game.state;
    const inv = Object.entries(s.inv).filter(([id, n]) => n > 0 && !/^treasure_/.test(id));   // 主線寶物不能送人
    if (!inv.length) return menu(npc, '（你的背包是空的。）');
    if (!Friends.canGift(npc.id) && !Quests.wants('give', g => g.npc === npc.id)) return menu(npc, '「今天已經收過你的禮物了，明天再說吧。」');
    show(npc, '要送什麼給' + esc(npc.name) + '？', [
      ...inv.map(([id]) => ({
        label: `${ITEMS[id].icon} ${ITEMS[id].name}`, run: () => {
          s.inv[id]--;
          const done = Quests.emit({ kind: 'give', npc: npc.id, item: id });
          const liked = (npc.likes || []).includes(id);
          if (!done.length) Friends.markGift(npc.id);
          Friends.add(npc.id, (done.length ? 10 : liked ? 15 : 5) + Progress.friendBonus(npc.id));
          updateHud();
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
      return show(npc, '你來了……謝謝你接下我的委託。我叫秀蔅，從 2087 年來。<br>水晶、羅盤、懷錶、懸鏡、石環、星圖——六個零件散在六條路線上。每條線解開到最後，零件就會出現。<br>先從這裡開始吧——你想先走哪一條？', [
        { label: '板南線：第七節車廂的懸鏡', primary: true, run: () => introChoose('BL') },
        { label: '文湖線：會說話的水晶', primary: true, run: () => introChoose('BR') },
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
      ...(npc.gives || []).filter(id => Quests.canAccept(id)).map(id => ({ label: `接任務：${QUESTS[id].title}`, run: () => { Quests.accept(id); close(); } })),
      { label: '聊天', run: () => { s.friends.xiuyu = (s.friends.xiuyu || 0) + 2; saveState(); xiuyuChat(npc); } },
      { label: '送禮', run: () => gift(npc) },
      ...(s.flags.xiuyuTalk ? [{ label: '問她：未來的台北是什麼樣子？', run: () => show(npc, '……2087 年的台北，捷運已經有十五條線，最遠到宜蘭。可是我最喜歡的，還是這個時代的末班車。<br>車廂裡的人都很累，可是每一個人都在回家的路上。<br>你是第一個問我這件事的人。', [{ label: '再見', run: close }]) }] : []),
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
    s.inv.notebook = 1;
    saveState();
    setTimeout(() => { Game.reward({ money: 150, xp: 80 }, '秀蔅送你一本調查筆記本'); toast('<b>📓 小提示</b><span>背包裡有物品和換裝；「紀錄」裡有你的能力、探索、案件評價和人物檔案</span>'); }, 1200);
    const other = line === 'BL' ? 'BR' : 'BL';
    show(NPCS.xiuyu, `好。我會在這裡等你。如果你也想走${LINES[other].zh}，再來找我。<br>之後每到一條新的路線，我都會在那裡——不過，你要自己找到我。`, [{ label: '出發', primary: true, run: close }]);
    current = null;
  }
  // 小碧潭的擺渡人：收下六件寶物後，路網圖上會出現新路線
  function ferryman(npc) {
    const s = Game.state;
    if (s.flags.mistLine) return show(npc, '她回去了。走之前，她把傳送裝置的光留在這裡，往西照出了一條新路線——桃園機場捷運。剩下的路，要你自己去走。', [{ label: '再見', run: close }]);
    const n = Teleporter.placed().length, t = Teleporter.total();
    show(npc, `${pick(npc.lines)}<br><small>（傳送裝置上已經放了 ${n} / 6 個零件${t > n ? `，你身上還有 ${t - n} 個可以放` : ''}。）</small>`, [
      ...(t > n ? [{ label: '去放零件', primary: true, run: () => Teleporter.menu() }] : []),
      { label: '再見', run: close },
    ]);
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
      const st = step.goal.station === '@treasure' ? s.quests.active[id].treasure : step.goal.station;
      if ((Array.isArray(st) ? st.includes(stationId) : st === stationId) && !out.includes(step.goal.item)) out.push(step.goal.item);
    }
    // 撿到就會觸發支線的物品
    for (const it of SideQuests.pickupItems(stationId)) if (!out.includes(it)) out.push(it);
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
    SideQuests.onPickup(it.item);
    for (const d of Quests.emit({ kind: 'find', item: it.item, station: it.station })) toast(`<b>${QUESTS[d.id].title}</b><span>✓ ${d.text}</span>`);
    saveState(); updateHud();
    spawn(it.station);   // 下一步可能要在同一站找別的東西
  }
  return { spawn, clear, tick, near, take };
})();

/* ── 主線站點委託：該線主線進行中、這一站還沒完成時，月台上會有紙條或委託人
 * 種類見 puzzles.js（問答、找東西、帶路、找人、買東西、神秘通道、撿零錢、迷路）
 * 進度存在主線進度的 ch[站名]；帶著走的人存在 flags.follow
 */
const Challenges = (() => {
  const T = THREE;
  let ents = [], follower = null;
  const S = () => Game.state;
  const mainOf = line => S().quests.active['main_' + line];
  const chState = (line, st) => { const m = mainOf(line); if (!m) return null; m.ch = m.ch || {}; return m.ch[st] || null; };
  const setCh = (line, st, v) => { const m = mainOf(line); if (!m) return; m.ch = m.ch || {}; if (v) m.ch[st] = v; else delete m.ch[st]; saveState(); };
  const unsolved = (line, st) => { const m = mainOf(line); return m && m.step === 0 && !(m.solved && m.solved[st]); };
  const title = (line, st) => `${LINES[line].zh}・${st}`;

  function noteTex(glyph, col) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#fffaf0'; g.fillRect(36, 30, 56, 68);
    g.fillStyle = '#c4162a'; g.font = 'bold 44px "Noto Serif TC", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(glyph, 64, 66);
    return new T.CanvasTexture(c);
  }
  function iconSprite(icon, size, glow) {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d');
    if (glow) { const gr = g.createRadialGradient(48, 48, 6, 48, 48, 48); gr.addColorStop(0, 'rgba(255,240,190,.6)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); }
    g.font = '56px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 48, 52);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    sp.scale.set(size, size, 1);
    return sp;
  }
  const ok = p => p && World.groundAt(p.x, p.z, p.y) != null;
  const platformOf = line => World.layout.platforms.find(p => p.line === line);
  function standPos(P) { for (const dx of [8, -8, 14, -14, 3]) { const q = { x: P.x + dx, y: P.y, z: P.z }; if (ok(q)) return q; } return null; }
  // 角落：大廳四角、各月台兩端
  function corners(onlyLine) {
    const L = World.layout, C = L.concourse, out = [];
    if (!onlyLine) for (const [x, z] of [[C.x0 + 1.2, C.z0 + 1.2], [C.x1 - 1.2, C.z0 + 1.2], [C.x0 + 1.2, L.gateZ - 1.2], [C.x1 - 1.2, L.gateZ - 1.2]]) out.push({ x, y: 0, z });
    for (const P of L.platforms) if (!onlyLine || P.line === onlyLine) for (const ex of [-1, 1]) for (const sz of [-1.6, 1.6]) out.push({ x: P.x + ex * 30.2, y: P.y, z: P.z + sz });
    return out.filter(ok);
  }
  const hsh = str => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

  function addEnt(e, mesh, yOff = 0) { if (mesh) { mesh.position.set(e.x, e.y + yOff, e.z); World.scene.add(mesh); e.mesh = mesh; e.yOff = yOff; } ents.push(e); return e; }
  function addPerson(e, look) {
    const rig = Human3D.buildPerson(look);
    rig.root.position.set(e.x, e.y, e.z); rig.root.rotation.y = e.face || 0;
    World.scene.add(rig.root); e.rig = rig; ents.push(e); return e;
  }


  /* ── 主線劇情（story.js）：劇情站取代原本的委託，依章節順序 ── */
  const storyOf = line => { const s = S(); s.story = s.story || {}; return (s.story[line] = s.story[line] || { ch: 0, ev: {}, choice: {} }); };
  const chapterAt = (line, st) => { const d = STORY[line]; if (!d) return null; const i = d.chapters.findIndex(c => c.station === st); return i < 0 ? null : { i, c: d.chapters[i] }; };
  const evTotal = line => new Set(STORY[line].chapters.flatMap(c => [c.evidence && c.evidence.id, ...((c.choice && c.choice.options) || []).map(o => o.evidence && o.evidence.id)]).filter(Boolean)).size;
  const storyLook = c => c.npc.npcId ? NPCS[c.npc.npcId].look : c.npc.look === 'xiuyu' ? XIUYU_LOOK : STORY_LOOKS[c.npc.look];
  function spawnStory(line, stationId, P, pos) {
    const sc = chapterAt(line, stationId), so = storyOf(line);
    if (sc.i > so.ch) {   // 前面的章節還沒解開
      const sp = new T.Sprite(new T.SpriteMaterial({ map: noteTex('…', 'rgba(150,150,170,.6)'), transparent: true, depthWrite: false })); sp.scale.set(.55, .55, 1);
      addEnt({ type: 'storyLocked', line, station: stationId, ...pos }, sp, 1.3);
      return;
    }
    const c = sc.c;
    if (!c.npc.look && !c.npc.npcId) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: noteTex('秘', 'rgba(160,120,255,.85)'), transparent: true, depthWrite: false })); sp.scale.set(.75, .75, 1);
      addEnt({ type: 'story', line, station: stationId, i: sc.i, sc: c, ...pos }, sp, 1.3);
    } else {
      const e = addPerson({ type: 'story', line, station: stationId, i: sc.i, sc: c, ...pos, face: Math.PI / 2 }, storyLook(c));
      const ex = iconSprite('📖', .45, true); ex.position.set(0, 2.2, 0); e.rig.root.add(ex);
    }
    if (c.kind === 'hidden') { const hp = hiddenSpot(c.hidden.at, P, stationId); if (hp) addEnt({ type: 'storyHidden', line, station: stationId, i: sc.i, sc: c, ...hp }); }
  }
  // 追捕的嫌疑人、逃脫時的跟蹤者
  function spawnStoryTargets(stationId) {
    for (const line of STORY_LINES) {
      const so = (S().story || {})[line]; if (!so) continue;
      const P = platformOf(line);
      if (so.chase && so.chase.station === stationId && P) {   // 嫌疑人往大廳跑，在出站前攔住他
        const c = STORY[line].chapters[so.chase.i], C = World.layout.concourse, sd = hsh(stationId) % 2 ? 1 : -1;
        const q = [{ x: sd * (C.x1 - 5), y: 0, z: C.z0 + 3 }, { x: -sd * (C.x1 - 5), y: 0, z: C.z0 + 3 }, ...[-26, 24, -18, 6].map(dx => ({ x: P.x + dx, y: P.y, z: P.z + 1.4 }))].find(ok);
        if (q) addPerson({ type: 'suspect', line, station: stationId, i: so.chase.i, sc: c, ...q, face: Math.PI }, STORY_LOOKS[c.chase.suspect.look]);
      }
      if (so.escape) {
        const c = STORY[line].chapters[so.escape.i];
        { const L = World.layout, C = L.concourse, q = { x: C.x1 - 3, y: 0, z: C.z0 + 3 }; if (ok(q)) addPerson({ type: 'stalker', line, station: stationId, ...q, face: -Math.PI / 2 }, STORY_LOOKS[c.escape.stalker.look]); }
      }
    }
  }
  function storyReward(line, so, c, ev) {
    if (ev && !so.ev[ev.id]) { so.ev[ev.id] = true; toast(`<b>取得證據：${ev.icon} ${ev.name}</b><span>${ev.desc}</span>`, 'level'); Investigate.add(25, '取得關鍵證據', true); }
  }
  // 完成一章：記錄證據、下一章，並完成這一站
  function finishChapter(line, station, i, ev, msg) {
    const so = storyOf(line);
    storyReward(line, so, null, ev);
    so.ch = Math.max(so.ch, i + 1);
    const first = ev && !S().flags.firstEvidence;
    if (first) S().flags.firstEvidence = true;
    saveState();
    const [m, x] = MAIN_REWARD[STORY[line].chapters[i].kind] || [200, 110];
    Progress.addRep(station, 5);
    solve(line, station, { money: m, xp: x, ixp: 20 }, msg || `劇情：第 ${i + 1} 章`);
    if (first) setTimeout(() => toast('<b>📓 第一件關鍵證據</b><span>證據和人物都記在「紀錄」裡了</span>', 'level'), 1500);
  }
  function pages(e, list, k, done) {
    const c = e.sc, who = { name: c.npc.name, role: c.npc.role };
    if (k < list.length - 1) return Dialog.show(who, list[k], [{ label: '繼續', primary: true, run: () => pages(e, list, k + 1, done) }, { label: '等一下再來', run: () => Dialog.close() }]);
    done(who, list[k]);
  }
  function storyInteract(e) {
    const c = e.sc, line = e.line, so = storyOf(line);
    if (e.type === 'storyLocked') return Dialog.info(`${LINES[line].zh}・${e.station}`, '這裡好像還藏著什麼，但現在還看不出來。<br><small>（先解開這條線前面的劇情）</small>');
    if (e.type === 'storyHidden') {
      return Dialog.show({ name: '……', role: e.station }, c.hidden.text, [{ label: '記下來', primary: true, run: () => { Dialog.close(); finishChapter(line, e.station, e.i, c.evidence, '找到隱藏的線索！'); } }]);
    }
    if (e.type === 'suspect') {
      return Dialog.show({ name: c.chase.suspect.name, role: '' }, c.chase.caught, [{ label: '收下', primary: true, run: () => { Dialog.close(); so.chase = null; storyReward(line, so, null, c.evidence); so.ch = Math.max(so.ch, e.i + 1); saveState(); Game.reward({ money: MAIN_REWARD.chase[0], xp: MAIN_REWARD.chase[1], ixp: 20 }, '追到了！'); spawn(World.layout.stationId); } }]);
    }
    pages(e, c.pages, 0, (who, text) => {
      if (c.kind === 'evidence') return Dialog.show(who, text, [{ label: '收下', primary: true, run: () => { Dialog.close(); finishChapter(line, e.station, e.i, c.evidence); } }]);
      if (c.kind === 'hidden') return Dialog.show(who, text, [{ label: '去找找看', primary: true, run: () => Dialog.close() }]);
      if (c.kind === 'choice' || c.kind === 'rescue' || c.kind === 'deduce') {
        const opts = (c.choice || c.rescue || c.deduce).options;
        const prompt = (c.choice || c.rescue || c.deduce).prompt;
        const allEv = Object.keys(so.ev).length >= evTotal(line);
        const hint = c.kind === 'deduce' ? Progress.deduceHint(allEv, Object.keys(so.ev).length, evTotal(line)) : '';
        return Dialog.show(who, `${text}<br><b>${prompt}</b>${hint}`, opts.map(o => ({
          label: (c.kind === 'deduce' && o.correct && Progress.markAnswer(allEv) ? '★ ' : '') + o.label, run: () => {
            let ev = null;
            if (c.kind === 'choice') { so.choice[c.choice.key] = o.value; ev = o.evidence || null; if (o.friend) for (const [k, v] of Object.entries(o.friend)) S().friends[k] = (S().friends[k] || 0) + v; }
            if (c.kind === 'rescue') { if (!o.ok && S().inv.firstaid > 0) { S().inv.firstaid--; o = { ...o, ok: true, text: o.text + '<br><br>🩹 還好你帶了急救包，對方沒事了。' }; } ev = o.ok ? c.evidence : null; }
            if (c.kind === 'deduce') { so.deduce = !!o.correct; so.deduceLabel = o.label; }
            saveState();
            const after = c.kind === 'deduce' ? `你說出了你的推理。秀蔅靜靜地聽完，點了點頭。<br><small>（證據 ${Object.keys(so.ev).length} / ${evTotal(line)}。結局會在找到寶物時揭曉。）</small>` : o.text;
            Dialog.show(who, after, [{ label: '繼續', primary: true, run: () => { Dialog.close(); finishChapter(line, e.station, e.i, ev); } }]);
          },
        })));
      }
      if (c.kind === 'chase') {
        return Dialog.show(who, text, [{ label: `追！（${c.chase.minutes} 分鐘內）`, primary: true, run: () => {
          so.chase = { i: e.i, station: e.station, deadline: Date.now() + c.chase.minutes * 60000 }; saveState(); Dialog.close();
          toast(`<b>追捕開始</b><span>${c.chase.minutes} 分鐘內在大廳攔住他</span>`, 'warn');
          solve(line, e.station, { xp: 20 }, '');
        } }]);
      }
      if (c.kind === 'escape') {
        return Dialog.show(who, text, [{ label: `快跑（${c.escape.minutes} 分鐘內）`, primary: true, run: () => {
          so.escape = { i: e.i, station: e.station, deadline: Date.now() + c.escape.minutes * 60000 }; saveState(); Dialog.close();
          toast('<b>有人在跟蹤你</b><span>跑到大廳的站務室求救</span>', 'warn');
          solve(line, e.station, { xp: 20 }, '');
        } }]);
      }
    });
  }
  function resolveEscape(line, safe) {
    const so = storyOf(line); if (!so.escape) return;
    const c = STORY[line].chapters[so.escape.i], i = so.escape.i;
    so.escape = null; so.ch = Math.max(so.ch, i + 1);
    if (safe) storyReward(line, so, null, c.evidence);
    saveState();
    Dialog.show({ name: safe ? '甩掉了' : '……', role: '' }, safe ? c.escape.safe : c.escape.caught, [{ label: '繼續', primary: true, run: () => Dialog.close() }]);
    if (safe) Game.reward({ money: MAIN_REWARD.escape[0], xp: MAIN_REWARD.escape[1], ixp: 20 }, '成功甩掉跟蹤者！');
    if (World.layout) spawn(World.layout.stationId);
  }
  // 每秒檢查：追捕、逃脫的時間
  function storyTick() {
    const st = S().story || {}, now = Date.now();
    for (const line of Object.keys(st)) {
      const so = st[line];
      if (so.chase && now > so.chase.deadline) {
        const c = STORY[line].chapters[so.chase.i]; so.ch = Math.max(so.ch, so.chase.i + 1); so.chase = null; saveState();
        toast(`<b>${c.chase.suspect.name}不見了</b><span>${c.chase.lost}</span>`, 'warn');
        if (World.layout) spawn(World.layout.stationId);
      }
      if (so.escape && now > so.escape.deadline) resolveEscape(line, false);
    }
  }
  // 任務列表：劇情進度
  function storyNote(line) {
    const d = STORY[line]; if (!d) return '';
    const so = storyOf(line), next = d.chapters[so.ch];
    const extra = so.chase ? `　⏱ 追捕中：${fmtLeft(so.chase.deadline)}` : so.escape ? `　⏱ 逃脫中：${fmtLeft(so.escape.deadline)}` : '';
    return `劇情（${d.form}）：${so.ch} / ${d.chapters.length} 章${next ? `，下一章在 ${next.station}` : '，已全部解開'}　證據 ${Object.keys(so.ev).length} / ${evTotal(line)}${extra}`;
  }
  // 找到寶物時揭曉結局
  function ending(line) {
    const d = STORY[line]; if (!d) return null;
    const so = storyOf(line), ev = Object.keys(so.ev).length, total = evTotal(line);
    const kind = so.deduce ? (ev >= total ? 'true' : 'normal') : 'bad';
    so.ending = kind; saveState();
    return { kind, ev, total, ...d.endings[kind] };
  }
  const storyBusy = () => Object.values(S().story || {}).some(so => so.escape || so.chase);

  function spawn(stationId) {
    clear();
    const s = S(), f = s.flags.follow;
    spawnStoryTargets(stationId);
    // 1) 這一站各線的委託（紙條或委託人）
    for (const l of MRT.linesAt(stationId)) {
      const line = l.line; if (Puzzles.NO_MAIN.has(stationId) || !unsolved(line, stationId)) continue;
      const P = platformOf(line), pos = P && standPos(P); if (!pos) continue;
      if (chapterAt(line, stationId)) { spawnStory(line, stationId, P, pos); continue; }
      const c = Puzzles.challenge(line, stationId), st = chState(line, stationId);
      if (c.kind === 'quiz' || c.kind === 'passage') {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: noteTex('謎', 'rgba(255,90,90,.85)'), transparent: true, depthWrite: false })); sp.scale.set(.7, .7, 1);
        addEnt({ type: 'note', line, station: stationId, c, ...pos }, sp, 1.3);
        if (c.kind === 'passage') { const hp = hiddenSpot(c.at, P, stationId); if (hp) addEnt({ type: 'hidden', line, station: stationId, c, ...hp }); }
      } else if (!(f && f.line === line && f.station === stationId)) {
        const e = addPerson({ type: 'giver', line, station: stationId, c, ...pos, face: Math.PI / 2 }, c.giver.look);
        // 頭上的「！」：還沒接下時顯示
        if (!st) { const ex = iconSprite('❗', .45, true); ex.position.set(0, 2.15, 0); e.rig.root.add(ex); }
        if (c.kind === 'coins' && st) {
          const spots = corners();
          const own = corners(line);
          const pick = [own[hsh(stationId + 'a') % own.length], spots[hsh(stationId + 'b') % spots.length], spots[hsh(stationId + 'c') % spots.length]];
          if (pick[2] === pick[1]) pick[2] = spots[(hsh(stationId + 'c') + 1) % spots.length];
          pick.forEach((q, i) => { if (q && !st.coins[i]) addEnt({ type: 'coin', line, station: stationId, i, ...q }, iconSprite('🪙', .2, false), .08); });
        }
      }
    }
    // 2) 其他站接下的委託，目標在這一站
    for (const [qid, m] of Object.entries(s.quests.active)) {
      const q = QUESTS[qid]; if (q.type !== 'main' || m.step !== 0 || !m.ch) continue;
      for (const [from, st] of Object.entries(m.ch)) {
        const c = Puzzles.challenge(q.line, from);
        if (c.target !== stationId) continue;
        if (c.kind === 'lost' && !(s.inv[c.item] > 0)) {
          const list = corners(q.line); const q2 = list[hsh(from + c.item) % list.length];
          if (q2) addEnt({ type: 'lost', line: q.line, station: from, c, ...q2 }, iconSprite(ITEMS[c.item].icon, .32, false), .15);
        }
        if (c.kind === 'person' && !st.told) {   // 朋友在同一站的大廳（或別的樓層）
          const L = World.layout, C = L.concourse, side = hsh(from) % 2 ? 1 : -1;
          const cands = [{ x: side * (C.x1 - 6), y: 0, z: C.z0 + 4 }, { x: -side * (C.x1 - 9), y: 0, z: L.gateZ - 3 }, ...corners()];
          const q2 = cands.find(ok);
          if (q2) addPerson({ type: 'friend', line: q.line, station: from, c, ...q2, face: 0 }, c.friend.look);
        }
      }
    }
    // 3) 帶著的人
    if (f) {
      const c = Puzzles.challenge(f.line, f.station);
      if (!mainOf(f.line) || !c.giver) { s.flags.follow = null; saveState(); }
      else {
        ensureFollower(c);
        if ((c.kind === 'way' || c.kind === 'escort') && f.station !== stationId) {   // 迷路／帶路的人只在原本那一站
          toast(`<b>${esc(c.giver.name)}</b><span>「我還是自己在${esc(f.station)}問問別人好了，謝謝你。」</span>`);
          setCh(f.line, f.station, null); s.flags.follow = null; saveState(); dropFollower();
        }
      }
    } else dropFollower();
  }
  function hiddenSpot(at, P, stationId) {
    const L = World.layout, sp = k => L.spots.find(x => x.kind === k && (k !== 'elevator' || x.level === (at === 'elevator' ? P.k : 'hall')));
    let q = null;
    if (at === 'elevator' || at === 'hallElevator') { const e = sp('elevator'); if (e) q = { x: e.x + 1.4, y: e.y, z: e.z }; }
    if (at === 'ticket') { const e = sp('ticket'); if (e) q = { x: e.x, y: e.y, z: e.z }; }
    if (at === 'toilet') { const e = sp('toilet'); if (e) q = { x: e.x - .6, y: e.y, z: e.z + 1.2 }; }
    if (!ok(q)) { const ex = hsh(stationId) % 2 ? 1 : -1; q = { x: P.x + ex * 30.4, y: P.y, z: P.z }; }
    return ok(q) ? q : null;
  }
  function clear() { for (const e of ents) { if (e.mesh) World.scene.remove(e.mesh); if (e.rig) World.scene.remove(e.rig.root); } ents = []; }

  // 跟在主角後面的人
  function ensureFollower(c) {
    if (follower && follower.key === c.giver.name + c.kind) return;
    dropFollower();
    const rig = Human3D.buildPerson(c.giver.look);
    const p = World.player;
    rig.root.position.set(p.x - 1, p.y, p.z);
    World.scene.add(rig.root);
    follower = { rig, x: p.x - 1, y: p.y, z: p.z, key: c.giver.name + c.kind, name: c.giver.name };
  }
  // 帶著的人有沒有跟在身邊（3 公尺內、同一層）
  function followerNear() { const p = World.player; return !!follower && !follower.lost && Math.hypot(follower.x - p.x, follower.z - p.z) < 3.2 && Math.abs(follower.y - p.y) < 1.2; }
  function dropFollower() { if (follower) { World.scene.remove(follower.rig.root); follower = null; } }

  function tick(dt, now) {
    for (const e of ents) {
      if (e.mesh) { e.mesh.visible = !World.riding || e.type === 'note'; if (e.type === 'note') e.mesh.position.y = e.y + e.yOff + Math.sin(now / 500) * .07; }
      if (e.rig) e.rig.update(dt, 0, now / 1000);
    }
    if (follower) {
      // 跟在主角斜後方（World.player 沒有朝向，用 World.facing）
      const p = World.player, fa = World.facing || 0, fx = Math.sin(fa), fz = Math.cos(fa);
      const tx = p.x - fx * 1.1 + fz * .4, tz = p.z - fz * 1.1 - fx * .4;
      const dx = tx - follower.x, dz = tz - follower.z, d = Math.hypot(dx, dz);
      let sp = 0;
      // 跟著走（不會瞬間移動）：離太遠就跟丟，停在原地等你回來找他
      const far = Math.hypot(p.x - follower.x, p.z - follower.z);
      if (follower.lost) { if (far < 3 && Math.abs(follower.y - p.y) < 1.5) { follower.lost = false; toast(`<b>${esc(follower.name)}</b><span>「啊，你回來了！我跟緊一點。」</span>`); } }
      else if (far > 12 && !World.riding) { follower.lost = true; toast(`<b>${esc(follower.name)}跟丟了</b><span>走太快了！回頭去找他，要他跟在旁邊才算帶到。</span>`, 'warn'); }
      else if (Math.abs(follower.y - p.y) > 2.5 && (World.riding || World.zone().kind !== 'ramp')) { follower.x = tx; follower.z = tz; follower.y = p.y; }   // 搭電梯、上車：一起移動
      else if (d > .15) { sp = Math.min(d * 2.2, World.running ? 4.6 : 3.2); const k = Math.min(1, sp * dt / d); follower.x += dx * k; follower.z += dz * k; follower.rig.root.rotation.y = Math.atan2(dx, dz); }
      follower.y += (p.y - follower.y) * Math.min(1, dt * 8);
      follower.rig.root.position.set(follower.x, follower.y, follower.z);
      follower.rig.update(dt, sp, now / 1000);
    }
  }
  function near(p) {
    let best = null, bd = 9;
    for (const e of ents) {
      if (Math.abs(e.y - p.y) > .8 || e.type === 'stalker') continue;
      const r = e.type === 'hidden' || e.type === 'storyHidden' ? 1.3 : e.type === 'coin' || e.type === 'lost' ? 1.2 : 1.7;
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d < r && d < bd) { best = e; bd = d; }
    }
    // 被跟蹤：跑到這一站大廳的站務室就安全
    for (const [line, so] of Object.entries(S().story || {})) {
      if (!so.escape || (so.escape.station && so.escape.station !== World.layout.stationId)) continue;   // 舊存檔沒有記站名：任何一站的站務室都可以
      const sp = World.layout.spots.find(x => x.kind === 'office');
      if (sp && Math.abs(p.y) < 1 && Math.hypot(sp.x - p.x, sp.z - p.z) < 2.8) return { type: 'escapeHere', line };
    }
    // 迷路的人：帶到月台某一側
    const f = S().flags.follow;
    if (!best && f && follower) {
      const c = Puzzles.challenge(f.line, f.station), z = World.zone();
      if (c.kind === 'escort' && World.layout.stationId === f.station) {
        const sp = World.layout.spots.find(x => x.kind === c.spot && (c.spot !== 'elevator' || x.level === 'hall'));
        if (sp && Math.abs(sp.y - p.y) < 1 && Math.hypot(sp.x - p.x, sp.z - p.z) < 2.6) return followerNear() ? { type: 'escortHere', f, c } : { type: 'waitFollower', f, c };
      }
      if (c.kind === 'way' && z.kind === 'platform' && z.P.line === f.line && World.layout.stationId === f.station && Math.abs(p.z - z.P.z) > 1.2) return followerNear() ? { type: 'wayHere', f, c, P: z.P } : { type: 'waitFollower', f, c };
    }
    return best;
  }
  function label(e) {
    switch (e.type) {
      case 'note': return `解謎：${LINES[e.line].zh}`;
      case 'story': return e.sc.npc.look || e.sc.npc.npcId ? `說話：${e.sc.npc.name}` : `查看：${e.sc.npc.name}`;
      case 'storyLocked': return '查看';
      case 'storyHidden': return '調查：這裡怪怪的';
      case 'suspect': return `抓住：${e.sc.chase.suspect.name}`;
      case 'giver': return `說話：${e.c.giver.name}`;
      case 'coin': return '撿起：硬幣';
      case 'lost': return `撿起：${ITEMS[e.c.item].name}`;
      case 'friend': return `說話：${e.c.friend.name}`;
      case 'hidden': return '調查：這面牆怪怪的';
      case 'wayHere': return '「在這一邊等車」';
      case 'escortHere': return `「就是這裡」`;
      case 'escapeHere': return '敲站務室的門求救';
      case 'waitFollower': return `等等${e.c.giver.name}`;
    }
    return '查看';
  }
  function solve(line, station, rw, msg) {
    setCh(line, station, null);
    Progress.addRep(station, 3);
    const f = S().flags.follow;
    if (f && f.line === line && f.station === station) { S().flags.follow = null; dropFollower(); }
    saveState();
    Sound.itemGet();
    Game.reward(rw, msg || '委託完成！');
    questEvent({ kind: 'puzzle', line, station });
    spawn(World.layout.stationId);
    Pickups.spawn(World.layout.stationId);   // 完成最後一站時，寶物可能就在這裡
  }
  function say(e, text, btns) { Dialog.show({ name: e.name || title(e.line, e.station), role: e.role || '' }, text, btns || [{ label: '好', run: () => Dialog.close() }]); }

  function interact(e) {
    if (/^story|^suspect/.test(e.type)) return storyInteract(e);
    const s = S(), c = e.c;
    if (e.type === 'note' && c.kind === 'quiz') return ask(e);
    if (e.type === 'note' && c.kind === 'passage') return say({ line: e.line, station: e.station, role: '秀蔅留下的紙條' }, c.ask);
    if (e.type === 'hidden') {
      return say({ name: '……', role: title(e.line, e.station) }, '你把手貼上牆面。磁磚像霧一樣慢慢散開，後面是一條很窄的通道，盡頭的牆上用粉筆寫著：「你找到了。下一站見。——S」', [
        { label: '走進去看看', primary: true, run: () => { Dialog.close(); if (typeof Achievements !== 'undefined') Achievements.onPassage(); solve(e.line, e.station, { xp: 55, money: 100 }, '找到神秘通道！'); } },
      ]);
    }
    if (e.type === 'coin') {
      const st = chState(e.line, e.station); if (!st) return;
      st.coins[e.i] = true; setCh(e.line, e.station, st);
      World.scene.remove(e.mesh); ents = ents.filter(x => x !== e);
      Sound.gate(); toast(`<b>撿到一枚硬幣</b><span>${st.coins.filter(Boolean).length} / 3</span>`);
      return;
    }
    if (e.type === 'lost') {
      s.inv[c.item] = (s.inv[c.item] || 0) + 1; saveState(); updateHud();
      World.scene.remove(e.mesh); ents = ents.filter(x => x !== e);
      Sound.itemGet(); toast(`<b>找到 ${ITEMS[c.item].icon} ${ITEMS[c.item].name}</b><span>拿回${esc(e.station)}還給${esc(c.giver.name)}</span>`);
      return;
    }
    if (e.type === 'friend') {
      const st = chState(e.line, e.station);
      return say({ name: c.friend.name, role: '' }, `咦？${esc(c.giver.name)}在月台等我？我還以為約在大廳！謝謝你特地來告訴我，我現在就過去。`, [
        { label: '不客氣', primary: true, run: () => { Dialog.close(); if (st) { st.told = true; setCh(e.line, e.station, st); } solve(e.line, e.station, { xp: 40, money: 70 }, '幫忙找到人了！'); } },
      ]);
    }
    if (e.type === 'escortHere') return arrived(e.f, e.c);
    if (e.type === 'waitFollower') return say({ name: '……', role: '' }, follower && follower.lost ? `${esc(e.c.giver.name)}不在你身邊。剛剛走太快，他跟丟了——回頭去找他，帶他一起過來。` : `${esc(e.c.giver.name)}還在後面，等他走過來再說。`);
    if (e.type === 'escapeHere') return resolveEscape(e.line, true);
    if (e.type === 'wayHere') {
      const side = Math.sign(World.player.z - e.P.z);
      const good = (e.P.sides[side] || []).some(d => d.stops.includes(c.dest));
      if (good) return say({ name: c.giver.name }, `「往${esc(MRT.label((e.P.sides[side][0] || {}).terminal || c.dest, e.f.line).zh)}……對，有經過${esc(c.dest)}！謝謝你，我在這裡等車就好。」`, [
        { label: '路上小心', primary: true, run: () => { Dialog.close(); solve(e.f.line, e.f.station, { xp: 35, money: 50 }, '幫迷路的人找到路了！'); } },
      ]);
      const wrong = (e.P.sides[side] || [])[0];
      return say({ name: c.giver.name }, `他看了看月台上的 LED 看板：「這邊是往${esc(wrong ? MRT.label(wrong.terminal, e.f.line).zh : '……')}的……好像不會到${esc(c.dest)}耶？」`);
    }
    if (e.type === 'giver') return giver(e);
  }
  function giver(e) {
    const s = S(), c = e.c, st = chState(e.line, e.station);
    const who = { name: c.giver.name, role: '需要幫忙' };
    const busy = s.flags.follow && (c.kind === 'escort' || c.kind === 'way');
    if (!st) {
      return Dialog.show(who, c.ask, [
        { label: busy ? '（你已經在幫別人帶路了）' : '好，交給我', primary: true, disabled: busy, run: () => {
          const v = { acc: true };
          if (c.kind === 'coins') v.coins = [false, false, false];
          setCh(e.line, e.station, v);
          if (c.kind === 'escort' || c.kind === 'way') { s.flags.follow = { line: e.line, station: e.station }; saveState(); }
          Dialog.close();
          toast(`<b>接下委託</b><span>${esc(c.giver.name)}（${esc(title(e.line, e.station))}）</span>`);
          spawn(World.layout.stationId);
        } },
        { label: '等一下', run: () => Dialog.close() },
      ]);
    }
    if (c.kind === 'coins') {
      const n = st.coins.filter(Boolean).length;
      if (n < 3) return Dialog.show(who, `找到 ${n} 枚了……還差 ${3 - n} 枚。有的可能滾到別的樓層去了。`, [{ label: '再找找', run: () => Dialog.close() }]);
      return Dialog.show(who, '三枚都找到了！真的太感謝你了，這是一點心意。', [{ label: '收下', primary: true, run: () => { Dialog.close(); solve(e.line, e.station, { xp: 50, money: 90 }, '幫忙找回零錢了！'); } }]);
    }
    if (c.kind === 'lost') {
      if (s.inv[c.item] > 0) return Dialog.show(who, `啊！這就是我的${ITEMS[c.item].name}！你在哪裡找到的？太謝謝你了。`, [{ label: '還給他', primary: true, run: () => { s.inv[c.item]--; Dialog.close(); solve(e.line, e.station, { xp: 45, money: 80 }, '幫忙找回失物了！'); } }]);
      return Dialog.show(who, c.ask, [{ label: '我再去找找', run: () => Dialog.close() }]);
    }
    if (c.kind === 'buy') {
      const it = ITEMS[c.item];
      if (s.inv[c.item] > 0) return Dialog.show(who, `是${it.name}！謝謝你跑這一趟，錢還你，多的是跑腿費。`, [{ label: `交給他（拿回 NT$ ${it.price + 60}）`, primary: true, run: () => { s.inv[c.item]--; Dialog.close(); solve(e.line, e.station, { xp: 30, money: it.price + 60 }, '幫忙買到東西了！'); } }]);
      return Dialog.show(who, c.ask, [{ label: '我這就去買', run: () => Dialog.close() }]);
    }
    if (c.kind === 'person') {
      if (st.told) return solve(e.line, e.station, { xp: 10 }, '');
      return Dialog.show(who, c.ask, [{ label: '我去找找', run: () => Dialog.close() }]);
    }
    return Dialog.show(who, c.ask, [{ label: '好', run: () => Dialog.close() }]);
  }
  // 帶路的人到站了
  function arrived(f, c) {
    if (S().flags.follow !== f) return;
    Dialog.show({ name: c.giver.name, role: '' }, `找到了！就是這裡。謝謝你帶我過來，第一次來這一站就遇到你，真好。`, [
      { label: '不客氣', primary: true, run: () => { Dialog.close(); solve(f.line, f.station, { xp: 40, money: 60 }, '帶路完成！'); } },
    ]);
  }
  // 問答
  function ask(e) {
    const L = LINES[e.line], Q = Puzzles.question(e.line, e.station);
    const who = { name: title(e.line, e.station), role: '秀蔅留下的紙條' };
    Dialog.show(who, esc(Q.q), Q.options.map((o, i) => ({
      label: esc(o),
      run: () => {
        if (i !== Q.answer) {
          Sound.click();
          return Dialog.show(who, '紙條上的字慢慢淡掉了……答案好像不是這個。看看四周的站名牌、路線圖、LED 看板，再想一想。', [
            { label: '再試一次', primary: true, run: () => ask(e) }, { label: '等一下再來', run: () => Dialog.close() },
          ]);
        }
        Dialog.close();
        solve(e.line, e.station, { xp: 25, money: 40 }, '答對了！');
      },
    })).concat([{ label: '等一下再來', run: () => Dialog.close() }]));
    void L;
  }
  // 帶著人時不能傳送
  const escorting = () => !!S().flags.follow || storyBusy();
  // 某線還沒完成的站（任務列表用）
  function pending(stationId) { return MRT.linesAt(stationId).map(l => l.line).filter(l => unsolved(l, stationId)); }
  return { spawn, clear, tick, near, label, interact, escorting, pending, storyTick, storyNote, ending, get follower() { return follower; }, get ents() { return ents; } };
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
      if (typeof Achievements !== 'undefined') Achievements.onSecret(s.station, list.filter(x => x.station === s.station).every(x => st.flags.found[x.station + ':' + x.sc.id]));
    }
    saveState();
    Dialog.info(s.sc.name, s.sc.text + extra);
  }
  const count = () => { const f = Game.state.flags.found || {}; return list.filter(s => !f[s.station + ':' + s.sc.id]).length; };
  return { spawn, clear, tick, near, look, count };
})();

/* ── 車廂裡的乘客：不同車廂遇到不同的人；可以聊天、聽傳聞，撿到遺落的東西 ── */
const TRAIN_TALK = {
  student: ['你也是坐到終點嗎？', '剛剛窗外是不是閃過一個月台？', '這班車好像比平常多一節……我數錯了嗎？'],
  office: ['（打瞌睡中）……下一站？喔，還沒到。', '每天都在車上補眠。', '你聽說了嗎，有人在車窗上看到戴紅帽子的女生。'],
  elder: ['年輕人，坐這裡吧。', '我搭這條線搭了三十年，從來沒看過那個月台。'],
  tourist: ['Is this the right train?', '台北的捷運好安靜喔。'],
  storyteller: [
    '我跟你說，末班車開走以後，有一班車會繼續開。沒有站名，只有霧。',
    '有個女孩每天都在找自己上車的那一站。她提著一盞燈，從來不坐下。',
    '第七節車廂？我年輕的時候坐過一次。裡面的人，都在等一個不會來的人。',
    '如果你在隧道裡看到綠色的月台，千萬別下車。',
  ],
};
const Passengers = (() => {
  const T = THREE, S = Station3D;
  let list = [], drop = null, tr = null;
  const CAR_TYPES = [['student', 'student', 'casual'], ['office', 'elder', 'office'], ['tourist', 'casual', 'storyteller']];
  function board(train) {
    if (tr === train && list.length) return;
    clear(); tr = train;
    const P = train.P, tx = P.x + train.x, tz = P.z + train.side * S.TRACK;
    const hour = TaipeiTime.now().hour, busy = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 20);
    let r = (hour * 97 + P.x * 13 + 7) % 233280;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    S.CAR_X.forEach((cx, ci) => {
      const n = busy ? 4 : 2;
      for (let i = 0; i < n; i++) {
        let type = CAR_TYPES[ci][(rnd() * 3) | 0];
        if (type === 'storyteller' && list.some(p => p.type === 'storyteller')) type = 'casual';
        const sitting = rnd() < .6;
        let x = tx + cx + (rnd() - .5) * 16;
        if (S.DOORS.some(d => Math.abs(x - (tx + d)) < .9)) x += 1.4;
        const sideZ = rnd() < .5 ? -1 : 1;
        const z = sitting ? tz + sideZ * 1.12 : tz + (rnd() - .5) * .9;
        const C = CROWD_TYPES[type === 'storyteller' ? 'elder' : type];
        const look = { skin: ['#e9c0a8', '#dcae95', '#cf9f86', '#f2cdb9'][(rnd() * 4) | 0], hairColor: '#1a1a1a', height: .94 + rnd() * .1, ...C.gen(rnd) };
        look.hair = look.girl ? ['long', 'bob', 'bun'][(rnd() * 3) | 0] : ['short', 'mush'][(rnd() * 2) | 0];
        if (look.old) look.hairColor = '#cfcfcf';
        if (type === 'storyteller') Object.assign(look, { old: true, girl: false, hat: 'cap', hatColor: '#3a3a3a', top: '#5a4a3a', glasses: true, hairColor: '#d8d8d8' });
        const rig = Human3D.buildPerson(look);
        rig.sit = sitting ? 1 : 0;
        rig.root.position.set(x, P.y, z);
        rig.root.rotation.y = sitting ? (sideZ > 0 ? Math.PI : 0) : rnd() * 6.28;
        World.scene.add(rig.root);
        list.push({ id: 'pax' + list.length, type, rig, x, y: P.y, z, sitting, named: false, name: type === 'storyteller' ? '說故事的老伯' : { student: '學生', office: '上班族', elder: '長輩', tourist: '觀光客', casual: '乘客' }[type], role: '乘客', car: ci });
      }
    });
  }
  // 行駛中可能有人遺落東西
  function maybeDrop(train) {
    if (drop) return;
    const umbrellaQuest = Quests.wants('find', g => g.item === 'umbrella');
    if (!umbrellaQuest && Math.random() > .35) return;
    const pool = ['coin', 'onigiri', 'keychain'];
    const item = umbrellaQuest ? 'umbrella' : pool[(Math.random() * pool.length) | 0];
    const P = train.P, tx = P.x + train.x, tz = P.z + train.side * S.TRACK;
    const x = tx + S.CAR_X[(Math.random() * 3) | 0] + (Math.random() - .5) * 12, z = tz + (Math.random() < .5 ? -.6 : .6);
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d'); g.font = '60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(item === 'coin' ? '🪙' : ITEMS[item].icon, 48, 52);
    const mesh = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    mesh.scale.set(.36, .36, 1); mesh.position.set(x, P.y + .2, z);
    World.scene.add(mesh);
    drop = { item, x, y: P.y, z, mesh };
  }
  function takeDrop() {
    const s = Game.state, d = drop; if (!d) return;
    World.scene.remove(d.mesh); drop = null;
    if (d.item === 'coin') { Game.reward({ money: 50 }, '撿到 50 元硬幣'); return; }
    s.inv[d.item] = (s.inv[d.item] || 0) + 1; saveState(); updateHud();
    Sound.itemGet();
    toast(`<b>撿到 ${ITEMS[d.item].icon} ${ITEMS[d.item].name}</b><span>好像是哪位乘客忘記帶走的。</span>`);
    for (const q of Quests.emit({ kind: 'find', item: d.item, station: null })) toast(`<b>${QUESTS[q.id].title}</b><span>✓ ${q.text}</span>`);
  }
  function clear() { for (const p of list) World.scene.remove(p.rig.root); list = []; if (drop) World.scene.remove(drop.mesh); drop = null; tr = null; }
  function tick(dt, now) { for (const p of list) { if (Dialog.with === p && !p.sitting) p.rig.root.rotation.y = Math.atan2(World.player.x - p.x, World.player.z - p.z); p.rig.update(dt, 0, now / 1000); } }
  function blocks(x, z, y) { return list.some(p => Math.abs(p.y - y) < .6 && Math.hypot(p.x - x, p.z - z) < .45); }
  function nearest(pp, r = 1.5) { let b = null, bd = r; for (const p of list) { const d = Math.hypot(p.x - pp.x, p.z - pp.z); if (Math.abs(p.y - pp.y) < .6 && d < bd) { bd = d; b = p; } } return b; }
  function dropNear(pp) { return drop && Math.abs(drop.y - pp.y) < .6 && Math.hypot(drop.x - pp.x, drop.z - pp.z) < 1.2 ? drop : null; }
  // 找空位：玩家附近、靠牆、沒有人坐、不在門口
  function freeSeat(pp) {
    const t = World.trainOf(pp.x, pp.z, pp.y); if (!t) return null;
    const tx = t.P.x + t.x, tz = t.P.z + t.side * S.TRACK;
    if (S.DOORS.some(d => Math.abs(pp.x - (tx + d)) < 1)) return null;
    const sideZ = pp.z >= tz ? 1 : -1, z = tz + sideZ * 1.12;
    if (list.some(p => p.sitting && Math.abs(p.z - z) < .3 && Math.abs(p.x - pp.x) < .6)) return null;
    return { x: pp.x, z, face: sideZ > 0 ? Math.PI : 0 };
  }
  // 到站後世界重新對齊時，乘客跟著列車移動
  function shift(W) {
    for (const p of list) { p.x -= W.x; p.y -= W.y; p.z -= W.z; p.rig.root.position.set(p.x, p.y, p.z); }
    if (drop) { drop.x -= W.x; drop.y -= W.y; drop.z -= W.z; drop.mesh.position.set(drop.x, drop.y + .2, drop.z); }
  }
  return { board, maybeDrop, takeDrop, clear, tick, blocks, nearest, dropNear, freeSeat, shift, get train() { return tr; } };
})();
