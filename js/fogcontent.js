/* 迷霧之城：事件內容（第一部分）——NPC 特殊遭遇 20、救援與選擇 15
 * 每個事件用 FogEvents.def(類別, 代號, 資料) 登記；資料可以是函式（依車站、存檔產生內容）。
 */
(() => {
  const D = FogEvents.def;
  const ST = st => st;   // 站名
  const S = () => Game.state;
  const me = () => (S().char === 'aiyun' ? '愛紜' : '軒宇');
  const lastFog = () => { const log = S().fogLog || {}; const e = Object.entries(log).flatMap(([st, l]) => l.results.map(r => ({ st, ...r }))).sort((a, b) => (a.night < b.night ? 1 : -1)); return e[0] || null; };

  /* ══════════ 第二大類：迷霧 NPC 特殊遭遇（20） ══════════ */
  D('npc', 'n01', K => ({
    base: 'story', title: '不肯離開的乘客', hint: '月台的長椅上坐著一個人，好像坐了很久。',
    npc: { name: '坐著的老先生', at: 'p', behavior: 'sit', look: { old: true, hairColor: '#d8d8d8', top: '#5a4a3a', coat: true },
      intro: `「我在等人。她說末班車到${ST(K.station)}，叫我在這裡等。」<br>他的膝蓋上放著一張摺得很整齊的車票。`,
      lines: ['「她會來的。她從來不遲到。」', '「你有看到一個綁馬尾、穿黃色雨衣的女孩嗎？」', '「這張車票是她買的，她說留著當紀念。」'], clueLine: '（站裡也許有什麼能說明他在等誰。）' },
    clues: [
      { kind: 'ticket', at: 'c', title: '褪色的車票存根', text: `1996 年 3 月 28 日，木柵線通車那天的車票存根，背面用原子筆寫著：「爸，我先回家，你慢慢來。」`, note: '車票存根：1996 年，「爸，我先回家」' },
      { kind: 'photo', at: 'u', title: '掉在售票機下的照片', text: '一張泛黃的照片：一個綁馬尾、穿黃色雨衣的小女孩，牽著一個中年男人的手，背後是剛蓋好的車站。', note: '照片：黃色雨衣的小女孩牽著父親' },
      { kind: 'note', at: 'p', title: '長椅背面的刻字', text: '長椅背面有人用鑰匙刻了一行字：「小晴，對不起，爸爸那天沒有等妳。」', note: '刻字：「小晴，對不起，爸爸那天沒有等妳」' },
    ],
    final: { text: '他抬頭看你：「你知道她在哪裡，對不對？」', options: [
      { label: '「你等的是你的女兒小晴。她已經先回家了。」', result: 'perfect', text: '老先生愣了很久，把車票按在胸口。「……對，她先回家了。我該回去了。」<br>他站起來，走進霧裡，背影慢慢變淡。', doneText: '長椅上只剩下那張車票。', items: { fog_tea: 1 } },
      { label: '「她不會來了。」', result: 'bad', text: '他的臉皺了起來，霧一下子變得很冷。「你怎麼知道？你又知道什麼？」', hurt: 15, why: '老先生的悲傷化成了冰冷的霧' },
      { label: '「我陪你一起等。」', result: 'good', text: '你在他旁邊坐下。過了很久，他小聲地說：「謝謝你。其實……我知道她不會來了。」' },
    ] },
  }));

  D('npc', 'n02', K => ({
    base: 'story', title: '沒有目的地的人', hint: '大廳有個人一直在繞圈子。',
    npc: { name: '迷路的女人', at: 'c', behavior: 'wander', speed: .9, look: { girl: true, hair: 'bob', top: '#8a6a5a', bottom: '#2a2a2a' },
      intro: '「請問……我要去哪裡？」她看著你，眼神很空。「我只記得幾件事：下雨、紅色的傘、還有一間會響鈴的麵包店。」',
      lines: ['「下雨……那天有下雨。」', '「紅色的傘，是我借給別人的，還是別人借給我的？」', '「麵包店的鈴，叮鈴、叮鈴……」'], clueLine: '（站裡也許散落著她記憶的碎片。）' },
    clues: [
      { kind: 'umbrella', at: 'u', title: '一把紅色的傘', text: '傘柄上貼著標籤：「景美・林記麵包店　借用請歸還」。', note: '紅傘：景美・林記麵包店' },
      { kind: 'note', at: 'c', title: '溼掉的收據', text: '麵包店的收據，品項是「菠蘿麵包 ×2」，地址被雨水暈開，只看得到「景美街」三個字。', note: '收據：景美街的麵包店' },
      { kind: 'recorder', at: 'p', title: '一支舊手機', text: '螢幕裂了。最後一則簡訊：「媽，雨好大，我在麵包店等妳，傘我先借走囉。」', note: '簡訊：「媽，我在麵包店等妳」' },
    ],
    final: { text: '「你找到了嗎？我要去哪裡？」', options: [
      { label: '「去景美，麵包店，妳的孩子在那裡等妳。」', result: 'perfect', text: '她的眼睛亮了一下。「對……我要去接她。她怕打雷。」她把紅傘接過去，撐開，走進霧裡。' },
      { label: '「去台北車站，那裡什麼車都有。」', result: 'bad', text: '「台北車站……」她茫然地點點頭，又開始繞圈子。霧更濃了。', hurt: 8 },
      { label: '「妳不用去任何地方。」', result: 'good', text: '她安靜下來，坐在地上。「也是。等雨停就好了。」' },
    ] },
  }));

  D('npc', 'n03', K => ({
    base: 'story', title: '重複搭車的人', hint: '月台上有個人在來回踱步，等一班不會來的車。',
    npc: { name: '提公事包的男人', at: 'p', behavior: 'pace', speed: 1.0, look: { top: '#2a2e36', pattern: 'shirt', accent: '#3a5a8a', bottom: '#1e2128', bag: 'brief' },
      intro: '「這班車我已經搭了 214 次。每次都在同一個地方醒來。」他看了一下手錶。「你也是嗎？」',
      lines: ['「第 215 次。車門打開，車門關上。」', '「每次車上都坐著同一個穿綠色外套的人，他看著我，好像要說什麼。」', '「我不能下車。下車就會錯過她。」'], clueLine: '（他留下的東西也許能告訴你為什麼。）' },
    clues: [
      { kind: 'ticket', at: 'p', title: '一疊一模一樣的車票', text: '214 張車票，日期全部都是同一天：2003 年 10 月 11 日，晚上 11 點 58 分。', note: '214 張同一天的車票：2003/10/11 23:58' },
      { kind: 'paper', at: 'c', title: '社會版剪報', text: '「深夜捷運站，一名男子為了趕末班車和女友吵架後分手……」剪報被揉得很皺。', note: '剪報：趕末班車，和女友吵架分手' },
      { kind: 'note', at: 'u', title: '沒寄出的信', text: '「如果那天我沒有搭上那班車，我們是不是就不會分開？——綠外套的那天」', note: '信：「如果那天沒搭上那班車」' },
    ],
    final: { text: '「下一班車快來了。我要再上去一次。」', options: [
      { label: '「這次不要上車。在月台上等她。」', result: 'perfect', text: '他握著公事包的手鬆開了。車門打開又關上，他沒有動。「……原來，我只要留下來就好了。」他慢慢變淡。' },
      { label: '「上去吧，也許這次會不一樣。」', result: 'bad', text: '他衝進霧裡，你聽見一聲急促的關門聲。背後有什麼東西撞了你一下。', hurt: 18, why: '被衝出去的人撞倒' },
      { label: '「綠外套的人是誰？」', result: 'good', text: '「……是我自己。那天的我。」他苦笑。「謝謝你問。我好像知道該怎麼辦了。」' },
    ] },
  }));

  D('npc', 'n04', K => ({
    base: 'story', title: '不記得名字的人', hint: '有個人站在路線圖前面，喃喃自語。',
    npc: { name: '沒有名字的人', at: 'c', behavior: 'idle', look: { top: '#4a5a4a', bottom: '#2a2a2a', glasses: true },
      intro: '「不好意思，你知道我叫什麼名字嗎？我想不起來了。」他摸了摸口袋，什麼都沒有。',
      lines: ['「我記得我在銀行上班，每天搭這條線。」', '「我的名字……好像是兩個字。」', '「如果找不回名字，天亮的時候我就會消失。」'], clueLine: '（站裡也許有寫著他名字的東西。）' },
    clues: [
      { kind: 'note', at: 'c', title: '員工識別證（破掉一半）', text: '「○○銀行　營業部　___ 宏」，前面的字被撕掉了。', note: '識別證：名字最後一個字是「宏」' },
      { kind: 'umbrella', at: 'u', title: '雨傘上的縮寫', text: '黑色雨傘的握把上刻著兩個字母：「C.W.H.」', note: '雨傘縮寫：C.W.H.' },
      { kind: 'paper', at: 'p', title: '掛號信的信封', text: '收件人：「陳＿宏 先生」，中間的字被水暈開，只看得出有「文」字旁。', note: '信封：陳＿宏，中間的字有「文」' },
    ],
    final: { text: '「你知道我的名字了嗎？」', options: [
      { label: '「你叫陳文宏。」', result: 'perfect', text: '「陳文宏……陳文宏。」他重複了好幾次，臉上的輪廓慢慢清楚起來。「對！就是我！謝謝你。」' },
      { label: '「你叫陳偉宏。」', result: 'bad', text: '「陳偉宏……？」他搖頭，表情扭曲。「不是。不是不是不是——」霧裡有什麼東西撲了過來。', hurt: 15 },
      { label: '「名字不重要。」', result: 'good', text: '「……也許吧。」他笑了一下，「至少有人陪我想了一會兒。」' },
    ] },
  }));

  D('npc', 'n05', K => ({
    base: 'story', title: '一直問時間的人', hint: '有個聲音一直在問：「現在幾點？」', need: 2,
    npc: { name: '一直問時間的少年', at: 'c', behavior: 'watch', look: { height: .9, hair: 'mush', top: '#3a6a8a', bottom: '#2a2a2a', bag: 'backpack' },
      intro: '「請問現在幾點？」你還沒回答，他又問：「現在幾點？」',
      lines: ['「現在幾點？補習班要遲到了。」', '「現在幾點？媽媽說十一點以前要到家。」', '「現在……幾點？」'], clueLine: '（他問的好像不是現在的時間。）' },
    clues: [
      { kind: 'clock', at: 'c', label: '看時鐘', title: '停住的時鐘', text: '大廳的時鐘停在 22:47，秒針一直在原地抖動。', note: '時鐘停在 22:47' },
      { kind: 'paper', at: 'u', title: '補習班的點名單', text: '「最後一堂 21:50 下課」——有個名字旁邊打了一個問號：「當天未到家」。', note: '點名單：21:50 下課，當天未到家' },
      { kind: 'note', at: 'p', title: '月台上的紙條', text: '「22:47 往新店的車，我搭錯方向了。」', hidden: true, note: '紙條：22:47 搭錯方向' },
    ],
    final: { text: '「現在幾點？」他直直看著你。', options: [
      { label: '「22:47。你搭錯方向了，沒關係，我們回頭。」', result: 'perfect', text: '少年愣住，然後哭了出來。「我好怕……我一直在等有人告訴我。」他背起書包，往反方向的月台走去。' },
      { label: `「現在是 ${TaipeiTime.clock()}。」`, result: 'good', text: '「……這麼晚了啊。」他看著自己的手，好像第一次發現自己是透明的。' },
      { label: '「不要再問了。」', result: 'bad', text: '「現在幾點現在幾點現在幾點——」他的聲音越來越大，整座大廳的燈一起閃了一下。', hurt: 14, why: '尖叫聲震得你頭痛欲裂' },
    ] },
  }));

  D('npc', 'n06', K => ({
    base: 'story', title: '不願意上車的人', hint: '月台上，所有人都在等車，只有一個人往後退。',
    npc: { name: '退到牆邊的女孩', at: 'p', behavior: 'idle', look: { girl: true, hair: 'long', top: '#d8d0c0', bottom: '#4a4a5a', skirt: true },
      intro: '「不行，我不能上車。」她抓著你的袖子。「那班車上有我不想見的人。」',
      lines: ['「你看，大家都在等。可是車來了以後，沒有人會下車。」', '「我上次上車，就再也找不到下車的門。」', '「拜託，不要讓他們把我推上去。」'], clueLine: '（調查一下，那班車到底是什麼。）' },
    clues: [
      { kind: 'note', at: 'p', title: '月台柱子上的告示', text: '手寫的告示：「本站 03:00 之後的列車，請勿搭乘。——值班站務員」', note: '告示：03:00 後的列車請勿搭乘' },
      { kind: 'photo', at: 'c', title: '監視器截圖', text: '月台上排隊的人，每一個都沒有腳。只有一個女孩站在最後面，有腳。', note: '截圖：排隊的人都沒有腳，只有她有' },
    ],
    final: { text: '「我該怎麼辦？」', options: [
      { label: '「妳是活著的人，不要上車，跟我一起等天亮。」', result: 'perfect', text: '她用力點頭，緊緊跟在你後面。車來了，車門打開，裡面黑漆漆的。你們都沒有動。車門關上，列車消失在霧裡。' },
      { label: '「上車吧，大家都上了。」', result: 'bad', text: '她看你的眼神像是被背叛了。排隊的人一起轉頭看你。', hurt: 20, why: '排隊的人一起向你伸出手' },
      { label: '「我去看看那班車。」', result: 'good', text: '你走到月台邊，車廂裡的人全都對你笑。你退了回來，女孩鬆了一口氣。' },
    ] },
  }));

  D('npc', 'n07', K => ({
    base: 'story', title: '沒有影子的旅客', hint: '有個旅客在燈下走來走去……他腳下好像少了什麼。',
    npc: { name: '戴帽子的旅客', at: 'c', behavior: 'wander', speed: .7, look: { top: '#5a3a2a', coat: true, bottom: '#2a2a2a', hat: 'fedora', hatColor: '#2a2a2a' },
      intro: '「晚安。你也在等霧散嗎？」他禮貌地脫帽。燈光從他頭頂照下來，地上什麼都沒有。',
      lines: ['「我在這座車站已經很久了。久到記不得是哪一年。」', '「你在看我的腳下？……很少人注意到。」', '「光照不到的東西，是不是就不存在？」'], clueLine: '（用霧燈照照看，或是找找別的證據。）' },
    clues: [
      { kind: 'photo', at: 'c', title: '拍立得照片', text: '照片上是空蕩蕩的大廳。可是拍照的時間，那個旅客明明就站在那裡。', note: '拍立得：照不到他' },
      { kind: 'stain', at: 'u', label: '用霧燈照地上', hidden: true, title: '地上的影子', text: '霧燈照過去，地上浮出一個人的影子——戴著帽子，站在你身後。可是你身後沒有人。', note: '霧燈：他的影子留在非付費區的地上' },
    ],
    final: { text: '「你發現了？」他戴回帽子。「那你打算怎麼做？」', options: [
      { label: '「你的影子還留在非付費區。去把它找回來吧。」', result: 'perfect', text: '他沉默很久，然後笑了。「原來掉在那裡。我一直以為是被誰拿走了。」他往閘門走去，地上慢慢長出一個影子，跟著他。' },
      { label: '「你是鬼。」', result: 'bad', text: '「是嗎。」他的臉暗了下來，燈泡啪地一聲爆掉。', hurt: 12, why: '燈泡爆裂的碎片' },
      { label: '什麼都不說，點點頭。', result: 'good', text: '「謝謝你沒有大叫。」他輕輕點頭，消失在柱子後面。' },
    ] },
  }));

  D('npc', 'n08', K => ({
    base: 'story', title: '看不見玩家的人', hint: '有個人在大廳裡，你跟他說話，他完全沒反應。',
    npc: { name: '看著空氣的女人', at: 'c', behavior: 'watch', ignore: 1, ignoreText: '她看著你身後的某個地方，好像你不存在。你在她眼前揮手，她連眨眼都沒有。<br><small>（也許需要什麼東西，才能讓她「看見」你。）</small>', look: { girl: true, hair: 'bun', top: '#6a7a8a', bottom: '#3a3a3a' },
      intro: '她突然轉頭：「……你看得到我？你是從哪一年來的？」',
      lines: ['「我在這裡等我的同事，她說會帶鈴鐺來。」', '「我們以前是站務員，一起值大夜班。」'], clueLine: '' },
    clues: [
      { kind: 'coin', at: 'p', label: '撿起：一個小鈴鐺', title: '生鏽的小鈴鐺', text: '你撿起鈴鐺，輕輕搖了一下。大廳裡有個人猛然轉頭看向你。', note: '鈴鐺：搖一下，她就看見你了' },
      { kind: 'note', at: 'u', title: '值班表', text: '1999 年的大夜班值班表，兩個名字：「阿梅、阿娟」。阿娟的名字旁邊寫著「調職」。', note: '值班表：阿梅、阿娟（調職）' },
    ],
    final: { text: '「你看到阿娟了嗎？她說會帶鈴鐺來找我。」', options: [
      { label: '把鈴鐺交給她：「阿娟調職了，可是她把鈴鐺留下來了。」', result: 'perfect', text: '她接過鈴鐺，聲音哽咽。「她沒有忘記我。」叮——鈴聲在大廳裡迴盪，她慢慢消失。' },
      { label: '「阿娟不會來了。」', result: 'good', text: '「我知道。我只是想聽到有人這樣說。」' },
      { label: '把鈴鐺丟掉。', result: 'bad', text: '鈴鐺落地的瞬間，她尖叫起來，整個大廳的玻璃都在震動。', hurt: 16 },
    ] },
  }));

  D('npc', 'n09', K => ({
    base: 'story', title: '認錯人的乘客', hint: '有人在叫一個不是你的名字。',
    npc: { name: '拉住你的阿姨', at: 'c', behavior: 'follow', speed: 1.2, look: { girl: true, old: true, hair: 'bun', hairColor: '#8a8a8a', top: '#7a4a5a', bottom: '#2a2a2a' },
      intro: `「阿德！你終於來了！」她緊緊抓住你的手。「我就知道你會來接我。」<br>你說你叫${me()}，她好像沒聽到。`,
      lines: ['「阿德，你答應過我要帶我去看海。」', '「你小時候最喜歡坐捷運，每次都要坐第一節車廂。」', '「阿德，你的手怎麼這麼冰？」'], clueLine: '（找找看「阿德」是誰。）' },
    clues: [
      { kind: 'photo', at: 'p', title: '第一節車廂的照片', text: '一個小男孩趴在第一節車廂的窗前，背面寫著：「阿德，七歲，第一次坐捷運」。', note: '照片：阿德七歲，第一次坐捷運' },
      { kind: 'note', at: 'u', title: '醫院的掛號單', text: '「家屬：林德（兒子）」——旁邊用鉛筆寫：「已通知，在路上」。日期是十年前。', note: '掛號單：兒子林德「在路上」，十年前' },
      { kind: 'ticket', at: 'c', title: '兩張往淡水的車票', text: '兩張沒用過的車票，終點淡水。', note: '兩張沒用過的往淡水車票' },
    ],
    final: { text: '「阿德，我們走吧，去看海。」', options: [
      { label: '「我不是阿德。但我陪妳走到月台，阿德會在那裡等妳。」', result: 'perfect', text: '她看著你，好像第一次看清楚你的臉。「……你不是阿德。」她笑了，「可是你很像他小時候。謝謝你。」她拿著車票，一個人往月台走去。' },
      { label: '「好，我是阿德。」', result: 'good', text: '她高興得像個孩子。你陪她走了一段，她說：「好了，我自己去就好。」然後放開你的手。', ok: '……' },
      { label: '用力甩開她的手。', result: 'bad', text: '她的手指像冰一樣扣進你的手腕。「阿德，你又要丟下我了嗎？」', hurt: 14, why: '被冰冷的手抓傷' },
    ] },
  }));

  D('npc', 'n10', K => ({
    base: 'story', title: '未來的自己', hint: '月台盡頭站著一個人，背影看起來很眼熟。',
    npc: { self: true, name: '另一個你', role: '未來的你？', at: 'pend',
      intro: `那個人轉過身來——是你。一樣的臉，一樣的衣服，只是眼睛下面多了很深的黑眼圈。<br>「${me()}，我是十年後的你。我只能告訴你一件事。」`,
      lines: ['「我在霧裡待了很久。久到忘記自己為什麼要留下來。」', '「不要問我未來會怎樣。問了，就不是你的未來了。」'], clueLine: '（他說的話，和你的經歷對得上嗎？）' },
    clues: [
      { kind: 'ticket', at: 'p', title: '一張未來的車票', text: '日期是十年後的今天。站名欄寫著：「霧」。', note: '未來的車票，站名「霧」' },
      { kind: 'note', at: 'c', title: '你的筆跡', text: `一張紙條，是你的字：「如果你看到另一個我，不要答應他任何事。——${me()}」`, note: '你自己的字：「不要答應他任何事」' },
    ],
    final: { text: '「跟我交換吧。你留在霧裡，我回去。這樣你就不用經歷我經歷過的事。」', options: [
      { label: '「不換。我的未來，我自己走。」', result: 'perfect', text: '另一個你笑了，笑得很輕鬆。「我就知道你會這樣說。因為我當年也是這樣說的。」他像霧一樣散開。' },
      { label: '「好，我們交換。」', result: 'bad', text: '他抓住你的手——一陣劇痛，你看見自己的手變得透明。紙條上的字在你腦中響起：不要答應。你用力掙脫。', hurt: 30, why: '差點被另一個自己取代' },
      { label: '「你為什麼留在霧裡？」', result: 'good', text: '「為了等一個人。」他看著隧道。「不過那是你以後的事了。」' },
    ] },
  }));

  D('npc', 'n11', K => ({
    base: 'story', title: '反覆道歉的人', hint: '大廳的角落傳來不停的「對不起」。',
    npc: { name: '道歉的男人', at: 'c', behavior: 'wall', look: { top: '#4a4a4a', bottom: '#2a2a2a', hair: 'short' },
      intro: '「對不起、對不起、對不起……」他面對牆壁，一直鞠躬。牆上什麼都沒有。',
      lines: ['「對不起，我不是故意的。」', '「如果那天我有看一眼月台……」', '「對不起，對不起……」'], clueLine: '（他在跟誰道歉？）' },
    clues: [
      { kind: 'note', at: 'p', title: '事故報告（影本）', text: '「旅客甲於月台候車時跌倒，列車駕駛及時煞車，無人受傷。駕駛員自請調離。」', note: '報告：旅客跌倒，列車及時煞車，無人受傷' },
      { kind: 'flower', at: 'p', title: '月台邊的花', text: '一小束白花，卡片上寫：「謝謝你那天踩了煞車。我現在很好。——那天跌倒的人」', note: '花束卡片：「謝謝你踩了煞車，我現在很好」' },
    ],
    final: { text: '他還在道歉：「對不起……」', options: [
      { label: '「那天沒有人受傷。她還送了花謝謝你。」', result: 'perfect', text: '他停下來，慢慢轉身。「……沒有人受傷？」你把卡片給他，他讀了一遍又一遍，然後終於站直了身體。' },
      { label: '「你道歉夠了。」', result: 'good', text: '他停了一下。「是嗎……」然後很小聲地，又說了一次對不起。' },
      { label: '「都是你的錯。」', result: 'bad', text: '他的道歉變成哀號，大廳的燈全滅了三秒。黑暗中有什麼東西擦過你的臉。', hurt: 16 },
    ] },
  }));

  D('npc', 'n12', K => ({
    base: 'story', title: '不會說話的旅客', hint: '有人在月台上比手畫腳。',
    npc: { name: '比手勢的女孩', at: 'p', behavior: 'watch', look: { girl: true, hair: 'bob', top: '#e8b8a8', bottom: '#4a5a6a' },
      intro: '她張開嘴，沒有聲音。她指指自己的喉嚨，搖搖頭，然後指向大廳，比了一個「寫字」的動作。',
      lines: ['她把手放在耳邊，又指指月台的喇叭。', '她在地上畫了一個方框，裡面畫了一隻鳥。', '她雙手合十，對你鞠躬。'], clueLine: '（她留下的紙條在站裡各處。）' },
    clues: [
      { kind: 'note', at: 'c', title: '紙條一', text: '「我的聲音被廣播拿走了。每次廣播響，就會用我的聲音說話。」', note: '紙條一：聲音被廣播拿走了' },
      { kind: 'note', at: 'u', title: '紙條二', text: '「要拿回來，要在喇叭下面說出我的名字。我叫小鳥。」（旁邊畫了一隻鳥）', note: '紙條二：在喇叭下說她的名字「小鳥」' },
      { kind: 'recorder', at: 'p', title: '紙條三（塞在錄音筆裡）', text: '錄音筆裡只有一句女孩的聲音：「下一站……」然後被廣播的雜音蓋過。', note: '錄音筆：她的聲音在廣播裡' },
    ],
    final: { text: '她指著頭頂的喇叭，看著你。', options: [
      { label: '對著喇叭喊：「把聲音還給小鳥！」', result: 'perfect', text: '喇叭爆出一陣雜音，然後安靜了。女孩摸著喉嚨，小聲地說：「……謝謝。」那是她的聲音。' },
      { label: '用手勢比「我不懂」。', result: 'good', text: '她嘆了一口氣，把紙條塞回你手裡，指了指喇叭，慢慢走開。' },
      { label: '把喇叭線扯斷。', result: 'bad', text: '線一斷，所有的喇叭同時尖叫起來，是她的聲音。', hurt: 18, why: '喇叭的尖叫聲' },
    ] },
  }));

  D('npc', 'n13', K => ({
    base: 'story', title: '失聯乘客', hint: '布告欄上貼著一張尋人啟事。',
    npc: { name: '穿登山外套的青年', at: 'p', behavior: 'pace', look: { top: '#3a6a3a', coat: true, bottom: '#3a3a2a', bag: 'backpack', hat: 'beanie', hatColor: '#c84a2a' },
      intro: '「你好！請問往陽明山的公車在哪裡搭？」他背著很大的登山包，看起來很興奮。「我約了朋友明天早上爬七星山。」',
      lines: ['「我朋友說他會在劍潭等我。」', '「好奇怪，手機一直沒有訊號。」', '「現在幾月？……我怎麼覺得好冷。」'], clueLine: '（你在哪裡看過他的臉？）' },
    clues: [
      { kind: 'paper', at: 'c', title: '尋人啟事', text: '「協尋：張志遠，25 歲，身穿綠色登山外套、紅色毛帽。2014 年 1 月最後出現在捷運站。」照片上的人，就是月台上那個青年。', note: '尋人啟事：張志遠，2014 年失聯' },
      { kind: 'note', at: 'u', title: '朋友的留言', text: '「志遠，我們每年都會去七星山等你。你沒爬完的那段，我們幫你爬完了。——山社的大家」', note: '朋友留言：每年都去七星山等他' },
    ],
    final: { text: '「你知道公車在哪裡嗎？」', options: [
      { label: '「你的朋友們幫你把山爬完了。他們一直在等你。」', result: 'perfect', text: '他的表情慢慢凝固。「……原來已經過了這麼久。」他摘下毛帽，交給你。「幫我跟他們說，我到了。」', items: { fog_charm: 1 } },
      { label: '「公車不會來了。」', result: 'good', text: '「是嗎……那我走路去好了。」他背起包包，走進霧裡。' },
      { label: '把尋人啟事撕下來給他看。', result: 'bad', text: '他看著照片，開始發抖，四周的溫度一下子降到冰點。', hurt: 15, why: '凍傷' },
    ] },
  }));

  D('npc', 'n14', K => ({
    base: 'story', title: '只在廣播中出現的人', hint: '廣播裡有人在說話，但不像是預錄的。',
    npc: { name: '廣播裡的聲音', role: '只聽得到聲音', at: 'c', behavior: 'idle', hidden: true,
      intro: '喇叭裡傳來一個年輕男人的聲音：「喂？有人嗎？我是夜班的廣播員，我被關在廣播室裡出不去。」',
      lines: ['「廣播室的門是從外面鎖的。鑰匙應該掉在站裡某個地方。」', '「你聽得到我，對吧？太好了，三十年來第一次有人回答。」', '「門外有東西在走來走去。不要讓它發現你在找鑰匙。」'], clueLine: '（找鑰匙，還有他是誰。）' },
    clues: [
      { kind: 'coin', at: 'p', label: '撿起：一把舊鑰匙', title: '舊鑰匙', text: '鑰匙圈上掛著塑膠牌：「廣播室」。', note: '廣播室的鑰匙' },
      { kind: 'paper', at: 'u', title: '舊報紙', text: '「捷運站夜間停電，廣播員獨守廣播室安撫旅客整夜。」報導旁是一張模糊的照片。', note: '舊報紙：停電那晚，廣播員整夜安撫旅客' },
    ],
    final: { text: '「找到鑰匙了嗎？」', button: '對著喇叭說話', options: [
      { label: '「找到了。我來開門。不過……你已經不用待在裡面了。」', result: 'perfect', text: '喇叭安靜了很久。「……也是。那天晚上大家都平安回家了，對吧？」最後一段廣播響起：「各位旅客，晚安。」然後再也沒有聲音。' },
      { label: '「我找不到鑰匙。」', result: 'good', text: '「沒關係。謝謝你陪我說話。」' },
      { label: '「你是什麼東西？」', result: 'bad', text: '喇叭爆出刺耳的回授聲。', hurt: 12, why: '刺耳的回授聲' },
    ] },
    setup: (K, ppl) => { const v = ppl[0]; const pos = FogEvents.at(K, 'spot:office'); K.prop('radio', pos, { label: '對著喇叭說話', glint: false, tag: 'clue', use: () => v.talk(v) }); },
  }));

  D('npc', 'n15', K => ({
    base: 'story', title: '說法矛盾的求助者', hint: '有人急著請你幫忙。',
    npc: { name: '焦急的男人', at: 'c', behavior: 'follow', speed: 1.3, look: { top: '#6a3a3a', bottom: '#2a2a2a', glasses: true },
      intro: '「拜託你！我女兒在月台上走丟了，穿紅色衣服，五歲！」他抓著你的肩膀，「快幫我找！」',
      lines: ['「她叫小美！不對……小芳？」', '「她穿……藍色的衣服，對，藍色的。」', '「快點！她一個人會怕！」'], clueLine: '（他的說法前後不一，查查看。）' },
    clues: [
      { kind: 'bag', at: 'p', title: '小孩的背包', text: '黃色小背包，名牌寫著「王小芳」，裡面有一張全家福：爸爸、媽媽和小芳。爸爸的臉被剪掉了。', note: '背包：王小芳，全家福裡爸爸的臉被剪掉' },
      { kind: 'note', at: 'u', title: '站務員的筆記', text: '「注意：有一名男子自稱家長，四處詢問小孩下落。家長本人已在服務台等候。」', note: '站務筆記：真正的家長在服務台' },
      { kind: 'photo', at: 'c', title: '監視器畫面', text: '畫面上的男人一個人走進車站。沒有帶小孩。', note: '監視器：他一個人進站' },
    ],
    final: { text: '「找到了嗎？她在哪？告訴我！」', options: [
      { label: '「你不是她爸爸。」', result: 'perfect', text: '男人的臉一瞬間變得像一張白紙，然後整個人散成了霧。遠處，一個小女孩在服務台前喊：「媽媽！」' },
      { label: '「她在月台盡頭。」', result: 'bad', text: '他咧嘴一笑，嘴角裂到耳朵，然後撲向你。', hurt: 22, why: '被假家長抓住', hostile: 10 },
      { label: '「我們一起去服務台問。」', result: 'good', text: '他停下腳步，猶豫了一下，轉身走進霧裡，沒有再回來。' },
    ] },
  }));

  D('npc', 'n16', K => ({
    base: 'story', title: '重複回答的站務人員', hint: '服務台裡有個站務員，一直說著同一句話。', need: 2,
    npc: { name: '服務台的站務員', at: 'u', behavior: 'watch', look: { top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b' },
      intro: '「您好，本站末班車已經開走了，請明天再來。」',
      lines: ['「您好，本站末班車已經開走了，請明天再來。」', '「您好，本站末班車已經開走了，請……救救我。」', '「您好，本站……我被困在這句話裡面了……請明天再來。」', '「您好，請找到我的名牌和我的錶。」'], clueLine: '（他的台詞每次都變一點。）' },
    clues: [
      { kind: 'note', at: 'c', title: '站務員的名牌', text: '「站務員　黃志明」，背面貼著一張便條：「明天是女兒的生日，記得早點下班」。', note: '名牌：黃志明，女兒生日' },
      { kind: 'coin', at: 'p', label: '撿起：一支手錶', title: '停住的手錶', text: '錶停在 00:29，就是末班車開走前一分鐘。', note: '手錶停在 00:29' },
    ],
    final: { text: '「您好，本站末班車已經……」他停下來，看著你。', options: [
      { label: '「黃先生，已經下班了。今天是你女兒的生日。」', result: 'perfect', text: '他的嘴停住了。過了很久，他脫下帽子：「……下班了。」第一次說出不一樣的話。他摘下名牌放在台上，走出服務台。' },
      { label: '「末班車已經開走了。」', result: 'good', text: '「……是的，末班車已經開走了。」他重複你的話，語氣裡第一次有了一點輕鬆。' },
      { label: '「你是錄音機嗎？」', result: 'bad', text: '「您好您好您好您好您好您好——」聲音疊在一起變成噪音。', hurt: 12 },
    ] },
  }));

  D('npc', 'n18', K => {
    const last = lastFog();
    return {
      base: 'story', title: '記得你的人', hint: '有人在等你。好像等了好幾個晚上。', need: 1,
      npc: { name: '撐黑傘的少女', at: 'c', behavior: 'watch', look: { girl: true, hair: 'long', hairColor: '#0a0a0a', top: '#1a1a22', bottom: '#1a1a22', skirt: true },
        intro: last ? `「又見面了，${me()}。上次在${last.st}，你選擇了『${last.choice || '沉默'}』。」她轉著傘。「我一直記得。」` : `「你是第一次來吧，${me()}。我記得每一個走進霧裡的人。從今天開始，我也會記得你。」`,
        lines: ['「你每一次的選擇，霧都記得。」', last ? `「${last.st}那一晚，評價是 ${last.rank}。不錯嘛。」` : '「你還沒有在霧裡做過任何選擇。真乾淨。」', '「我的傘，是為了遮住那些看著你的眼睛。」'], clueLine: '（她到底是誰？）' },
      clues: [
        { kind: 'umbrella', at: 'p', title: '另一把黑傘', text: '傘骨上綁著很多小紙條，每一張都寫著一個名字和一個日期。最新的一張是你的名字。', note: '黑傘上綁著寫了你名字的紙條' },
      ],
      final: { text: '「你想知道我為什麼記得你嗎？」', options: [
        { label: '「謝謝妳記得我。」', result: 'perfect', text: '她愣了一下，然後第一次笑了。「從來沒有人跟我道謝。」她把一張紙條塞給你：上面寫著你的名字，和一句「下次見」。' },
        { label: '「請妳忘了我。」', result: 'good', text: '「辦不到。不過，我會假裝不認識你。」' },
        { label: '搶走她的傘。', result: 'bad', text: '傘一離手，無數雙眼睛從霧裡睜開，全部看著你。', hurt: 20, why: '被霧裡的眼睛盯住' },
      ] },
    };
  });

  D('npc', 'n21', K => ({
    base: 'story', title: '只有一次機會的證人', hint: '有個證人願意回答一個問題。只有一個。', need: 2,
    npc: { name: '戴口罩的證人', at: 'c', behavior: 'idle', look: { top: '#5a5a6a', bottom: '#2a2a2a', glasses: true, hat: 'cap', hatColor: '#2a2a2a' },
      intro: '「我看到了那晚發生的事。但我只回答一個問題，問完我就走。」',
      lines: ['「想清楚再問。」', '「你手上的線索夠了嗎？」'], clueLine: '（先蒐集線索，才知道該問什麼。）' },
    clues: [
      { kind: 'note', at: 'p', title: '月台上的粉筆字', text: '「有人在 1:13 把一個盒子丟進軌道。」', note: '1:13 有人把盒子丟進軌道' },
      { kind: 'box', at: 'u', title: '空的鞋盒', text: '鞋盒裡只有一張字條：「還給你，我們兩清了。」沒有署名。', note: '空鞋盒：「還給你，兩清了」' },
      { kind: 'photo', at: 'c', title: '模糊的照片', text: '兩個人在閘門前爭吵，其中一個人手裡拿著鞋盒。', note: '兩個人在閘門前爭吵' },
    ],
    final: { text: '「問吧。只有一次。」', noLeave: true, options: [
      { label: '「盒子裡原本裝的是什麼？」', result: 'perfect', text: '「一雙舊球鞋。他們高中一起打球時穿的。」證人停了一下，「丟掉它的人，後來每天晚上都回來找。」<br>你終於懂了那張字條的意思。' },
      { label: '「那兩個人是誰？」', result: 'good', text: '「一對很久沒聯絡的朋友。」證人轉身離開。你知道了是誰，卻不知道為什麼。' },
      { label: '「你為什麼戴口罩？」', result: 'bad', text: '證人拉下口罩——口罩下面什麼都沒有。他走了，再也不會回來。', hurt: 8 },
    ] },
  }));

  D('npc', 'n22', K => ({
    base: 'story', title: '會改變故事的乘客', hint: '有個人搖搖晃晃地向你走來。', need: 1,
    npc: { name: '喝醉的大叔', at: 'c', behavior: 'wander', speed: .6, look: { top: '#8a7a6a', bottom: '#3a3a3a', old: true },
      intro: '「小朋友……幫個忙，我的錢包不見了，回不了家……」他身上有濃濃的酒味，還有一股鐵鏽味。',
      lines: ['「我只是想回家……」', '「你有沒有看到一個咖啡色的錢包？」'], clueLine: '（幫他？拒絕他？還是先查查他是誰？）' },
    clues: [
      { kind: 'bag', at: 'p', title: '咖啡色錢包', text: '錢包裡有一張身分證，和一張全家福。還有一張當鋪的收據：「金項鍊一條」。', note: '錢包：身分證、全家福、當鋪收據' },
    ],
    final: { text: '「找到我的錢包了嗎？」', options: [
      { label: '把錢包還給他，順便說：「你的家人在等你。」', result: 'perfect', text: '他打開錢包，看到全家福，酒好像一下子醒了。「……我該回家了。」他把當鋪收據撕掉，走向閘門。' },
      { label: '「先告訴我，你身上為什麼有鐵鏽味？」', result: 'good', text: '「我在工地上班啊。」他攤開手，掌心都是老繭。「怎樣，不像嗎？」' },
      { label: '「自己找。」', result: 'bad', text: '他的臉色一沉，突然撲過來搶你的背包。', hurt: 14, why: '被醉漢推倒', hostile: 8 },
    ] },
  }));

  D('npc', 'n24', K => ({
    base: 'story', title: '清潔人員的秘密', hint: '清潔推車停在大廳，主人好像在等人。', need: 2,
    npc: { name: '夜班清潔員阿琴', at: 'c', behavior: 'wander', speed: .5, look: { girl: true, old: true, top: '#3a6a8a', bottom: '#2a3a4a', hat: 'cap', hatColor: '#3a6a8a' },
      intro: '「這麼晚了，你在找什麼？」她推著清潔車。「我在這座站掃了二十年地，什麼東西都撿過。」',
      lines: ['「有些東西，不是誰都可以拿的。」', '「你幫我做點事，我就給你看一樣好東西。」', '「月台盡頭、廁所旁邊，我都掃過了。」'], clueLine: '（幫她把散落的東西撿回來，她才會信任你。）' },
    clues: [
      { kind: 'paper', at: 'p', title: '散落的垃圾袋', text: '你把垃圾撿回袋子裡。袋子底下壓著一張紙：「阿琴姐，謝謝妳每天幫我留一盞燈。——末班車司機」', note: '紙條：末班車司機謝謝阿琴留燈' },
      { kind: 'umbrella', at: 'u', title: '倒掉的拖把', text: '拖把的柄上貼著一張小小的貼紙，是一張捷運通車紀念貼紙，1996。', note: '拖把上的通車紀念貼紙' },
    ],
    final: { text: '「謝謝你幫忙。好吧，給你看。」她從推車最下層拿出一個鐵盒子。「這是我二十年來在霧裡撿到的東西。」', options: [
      { label: '「這些東西應該還給它們的主人。」', result: 'perfect', text: '阿琴看了你很久，然後點點頭。「你說得對。」她拿出一枚生鏽的鑰匙給你：「這個主人，我找了二十年。你也幫我留意吧。」', items: { fog_salt: 2 } },
      { label: '「可以給我一樣嗎？」', result: 'good', text: '「拿去吧，這個你用得到。」她給你一包鹽。「霧裡的東西怕鹽。」', items: { fog_salt: 1 } },
      { label: '直接伸手去拿。', result: 'bad', text: '盒子裡的東西全部發出尖叫，阿琴啪地蓋上蓋子：「我就知道。」', hurt: 12 },
    ] },
  }));

  /* ══════════ 第五大類：救援、選擇與人物故事（15） ══════════ */
  D('rescue', 'c01', K => ({
    base: 'story', title: '找不到出口的旅客', hint: '有個人在大廳裡一直撞到同一面牆。', need: 2,
    npc: { name: '找不到出口的上班族', at: 'c', behavior: 'pace', look: { girl: true, hair: 'bob', top: '#e8e8e4', pattern: 'shirt', accent: '#2a4a8a', bottom: '#2a2a2a', skirt: true },
      intro: '「出口呢？我明明從這裡進來的。每個出口都通回大廳。」她的鞋跟斷了一隻，腳踝在流血。',
      lines: ['「我已經繞了一百圈了。」', '「你是真的人嗎？拜託，帶我出去。」', '「我男朋友在出口等我，他一定很擔心。」'], clueLine: '（先幫她？先調查她？還是不要管？）' },
    clues: [
      { kind: 'note', at: 'u', title: '出口旁的貼紙', text: '每個出口旁邊都貼著一模一樣的貼紙：「本出口通往 1 號出口」。', note: '每個出口都寫著「通往 1 號出口」' },
      { kind: 'recorder', at: 'p', title: '她掉的手機', text: '最後一通未接來電：「男友」，時間是三年前。', note: '手機：男友的未接來電，三年前' },
    ],
    final: { text: '「你要帶我出去嗎？」', options: [
      { label: '幫她：扶著她，一起找真正的出口。', result: 'perfect', text: '你扶著她，閉上眼睛走。不看貼紙，只聽風的方向。走了很久，她鬆開你的手：「我感覺到風了。謝謝你。」' },
      { label: '先調查她：「妳在這裡多久了？」', result: 'good', text: '「……三年？」她自己說出來的時候，也嚇了一跳。然後她慢慢冷靜下來，不再找出口了。' },
      { label: '不介入：「我也出不去。」', result: 'bad', text: '她的哭聲在大廳裡迴盪，一整夜都沒停。', hurt: 6, why: '哭聲讓你頭痛' },
    ] },
  }));

  D('rescue', 'c02', K => ({
    base: 'story', title: '失去記憶的人', hint: '有人坐在階梯上，抱著膝蓋發呆。', need: 3,
    npc: { name: '失去記憶的青年', at: 'p', behavior: 'sit', look: { top: '#4a4a5a', bottom: '#2a2a3a', hair: 'mush' },
      intro: '「我不記得我是誰。可是我記得，有件事我不想想起來。」',
      lines: ['「每次快要想起來，頭就好痛。」', '「你手上拿的那是什麼？跟我有關嗎？」', '「如果想起來會很痛，還要想嗎？」'], clueLine: '（他的記憶散在站裡。要不要幫他拼回去，由你決定。）' },
    clues: [
      { kind: 'photo', at: 'c', title: '畢業照', text: '大學畢業照，他站在中間，旁邊的人都被劃掉了。', note: '畢業照：旁邊的人都被劃掉' },
      { kind: 'note', at: 'u', title: '道歉信（沒寄出）', text: '「對不起，是我提議那天去溪邊的。」', note: '道歉信：「是我提議去溪邊的」' },
      { kind: 'flower', at: 'p', title: '溪邊撿的石頭和花', text: '一顆光滑的石頭，用麥克筆寫著四個名字。其中三個畫了小小的翅膀。', note: '石頭上四個名字，三個畫了翅膀' },
    ],
    final: { text: '「你知道我是誰了，對不對？要告訴我嗎？」', options: [
      { label: '告訴他：「那天的事不是你的錯。你的朋友們希望你好好活著。」', result: 'perfect', text: '他哭了很久。哭完以後，他說：「我叫阿哲。我想起來了。……謝謝你沒有讓我一個人想起來。」' },
      { label: '保護他：「有些事不用想起來。你現在很好。」', result: 'good', text: '他鬆了一口氣，靠著牆睡著了。他會在霧散的時候醒來，什麼都不記得，但是可以繼續往前走。' },
      { label: '把畢業照直接拿給他看。', result: 'bad', text: '他看著照片尖叫，月台上所有的燈一起爆裂。', hurt: 18, why: '燈管爆裂' },
    ] },
  }));

  D('rescue', 'c03', K => ({
    base: 'story', title: '被誤解的人', hint: '大廳裡，大家都避開一個人。', need: 3,
    npcs: [
      { name: '被指責的少年', role: '被說是小偷', at: 'c', behavior: 'wall', decides: true, look: { height: .9, top: '#2a2a2a', bottom: '#2a2a2a', hat: 'beanie', hatColor: '#3a3a3a' },
        intro: '「我沒有偷東西。可是沒有人相信我。」他的聲音在發抖。', lines: ['「那個阿姨說她的戒指不見了，大家就說是我。」', '「我只是剛好站在她旁邊。」'], clueLine: '（找證據替他澄清，或把資訊交給阿姨。）' },
      { name: '丟了戒指的阿姨', role: '失主', at: 'u', behavior: 'pace', look: { girl: true, old: true, top: '#8a3a5a', bottom: '#2a2a2a' },
        intro: '「就是那個戴毛帽的小孩！我的戒指一定是他拿的！」', lines: ['「那是我先生留給我的戒指。」', '「你幫我把它拿回來，我給你黃金。」'] },
    ],
    clues: [
      { kind: 'coin', at: 'p', label: '撿起：一枚戒指', title: '卡在排水溝的戒指', text: '戒指卡在月台的排水溝蓋縫裡，旁邊還有一截斷掉的手鍊。', note: '戒指在月台排水溝裡，手鍊斷了' },
      { kind: 'photo', at: 'c', title: '監視器畫面', text: '阿姨在月台上整理手鍊，手鍊斷了，戒指滾了出去。少年當時在大廳。', note: '監視器：戒指是自己掉的，少年在大廳' },
      { kind: 'note', at: 'u', title: '少年的口袋', text: '他掉在地上的筆記本：「今天也沒有人跟我說話。」', note: '少年的筆記：「今天也沒有人跟我說話」' },
    ],
    final: { text: '少年看著你：「你找到什麼了嗎？」', options: [
      { label: '帶著戒指和監視器畫面，當著大家的面替他澄清。', result: 'perfect', text: '阿姨愣住了，接過戒指，紅著眼睛對少年說對不起。少年第一次抬起頭，笑了一下。' },
      { label: '把戒指偷偷交給阿姨就好。', result: 'good', text: '阿姨拿回戒指，很高興。可是她沒有向少年道歉，大家還是避開他。', gold: 1 },
      { label: '告訴阿姨：「戒指確實在他身上。」', result: 'bad', text: '少年看著你，眼神一下子空了。他消失之前，霧裡響起一聲長長的嘆息。', hurt: 15, why: '良心刺痛（霧化成了實體）' },
    ] },
  }));

  D('rescue', 'c04', K => ({
    base: 'story', title: '不願被救的人', hint: '月台盡頭，有人坐在黃線外面。', need: 2,
    npc: { name: '坐在月台邊的女人', at: 'pend', behavior: 'sit', look: { girl: true, hair: 'long', top: '#4a4a5a', bottom: '#2a2a2a' },
      intro: '「不用管我。我只是想在這裡坐一下。」她的腳懸在月台外面。',
      lines: ['「你不懂。我已經很累了。」', '「你要說『加油』嗎？不用了。」', '「……你為什麼還不走？」'], clueLine: '（先理解她。）' },
    clues: [
      { kind: 'note', at: 'c', title: '請假單', text: '連續請了三十天的照顧假，事由：「母親住院」。最後一張寫著「離職」。', note: '請假單：照顧住院的母親，後來離職' },
      { kind: 'recorder', at: 'u', title: '語音留言', text: '一個老婦人的聲音：「女兒啊，媽媽沒事了。妳不要再那麼累了，回家睡覺。」', note: '語音留言：「媽媽沒事了，回家睡覺」' },
    ],
    final: { text: '「你還想說什麼？」', options: [
      { label: '在她旁邊坐下，播放那段語音留言。', result: 'perfect', text: '她聽了三遍，然後把腳收回月台上。「……我好久沒有聽她的聲音了。」她站起來，「我想回家睡覺。」' },
      { label: '「我陪妳坐一下就好。」', result: 'good', text: '你們安靜地坐了很久。天快亮的時候，她說：「謝謝你沒有說加油。」' },
      { label: '用力把她拉起來。', result: 'bad', text: '她尖叫著掙扎，你們一起跌倒，她甩開你跑進霧裡。', hurt: 14, why: '跌倒' },
    ] },
  }));

  D('rescue', 'c05', K => ({
    base: 'story', title: '兩人的求助', hint: '兩個人同時在叫你。', need: 0,
    npcs: [
      { name: '月台上的小孩', role: '在哭', at: 'p', behavior: 'sit', decides: true, look: { height: .6, hair: 'bob', girl: true, top: '#e8c040', bottom: '#2a2a2a' },
        intro: '「哥哥姊姊，我的媽媽不見了，月台好黑，我好怕……」', lines: ['「媽媽說去買水，就沒有回來了。」'] },
      { name: '大廳的老爺爺', role: '跌倒了', at: 'c', behavior: 'sit', decides: true, look: { old: true, hairColor: '#e0e0e0', top: '#6a5a4a', bottom: '#3a3a3a' },
        intro: '「哎喲……年輕人，扶我一下，我的腳扭到了，藥在背包裡……」', lines: ['「我有心臟病，藥……」'] },
    ],
    clues: [],
    final: { text: '兩邊都在叫你。你只能先去一邊。', options: [
      { label: '先幫老爺爺拿藥。', result: 'good', text: '你幫老爺爺吃了藥，他緩過氣來，拍拍你的手。等你跑到月台，小孩已經不見了——只留下一張畫：一個大人牽著小孩的手。你希望那是她媽媽。', after: K2 => K2.npcs.filter(n => n.name === '月台上的小孩').forEach(n => K2.removeNpc(n)) },
      { label: '先去陪小孩。', result: 'good', text: '你陪著小孩，直到一個女人跑過來抱住她。等你回到大廳，老爺爺已經自己站起來了，對你揮揮手，慢慢走進霧裡。', after: K2 => K2.npcs.filter(n => n.name === '大廳的老爺爺').forEach(n => K2.removeNpc(n)) },
      { label: '大喊：「站務員！這裡有人需要幫忙！」', result: 'perfect', text: '霧裡傳來腳步聲——那個沒有臉的站務員出現了，他抱起小孩，走向老爺爺。三個人一起消失在霧裡。也許這是霧裡唯一能做到的「兩個都救」。' },
    ] },
  }));

  D('rescue', 'c06', K => ({
    base: 'story', title: '無人領取的遺物', hint: '失物招領處的櫃台上，放著一個沒有人認領的盒子。', need: 3,
    npc: { name: '失物招領處的老伯', at: 'u', behavior: 'watch', look: { old: true, top: '#5a6a7a', bottom: '#2a2a2a', glasses: true },
      intro: '「這個盒子放在這裡十五年了，沒有人來領。」盒子裡是一封信、一枚戒指和一張車票。「你要幫它找主人，還是先查查它的故事？」',
      lines: ['「主人一定還在找它。」', '「也可能，主人不想找到它。」'], clueLine: '（追查物品背後的故事。）' },
    clues: [
      { kind: 'ticket', at: 'p', title: '盒子裡的車票', text: '單程票，終點是機場。日期是十五年前的平安夜。', note: '平安夜往機場的單程票' },
      { kind: 'note', at: 'c', title: '盒子裡的信', text: '「如果你今天來了，我就不走了。如果你沒來，這枚戒指就留給車站吧。」', note: '信：「如果你沒來，戒指就留給車站」' },
      { kind: 'photo', at: 'p', title: '月台柱子後的照片', text: '一對情侶，背面寫著：「我那天加班，趕到的時候車已經開了。我每年平安夜都來。」', note: '照片背面：他每年平安夜都來' },
    ],
    final: { text: '「查到了嗎？要怎麼處理它？」', options: [
      { label: '「留在失物招領處。他每年平安夜都會來，總有一天會問。」', result: 'perfect', text: '老伯把盒子擺回最顯眼的位置，貼上一張紙條：「平安夜來的先生，這是給你的。」' },
      { label: '「把戒指留給車站吧，就像信上說的。」', result: 'good', text: '老伯把戒指掛在服務台的鑰匙圈上。「好，車站收下了。」' },
      { label: '把戒指收進自己口袋。', result: 'bad', text: '口袋突然變得像冰一樣冷。戒指自己滾了出來，回到盒子裡。', hurt: 10 },
    ] },
  }));

  D('rescue', 'c07', K => ({
    base: 'story', title: '道歉的機會', hint: '有人托你傳話。', need: 2,
    npcs: [
      { name: '想道歉的少女', at: 'c', behavior: 'idle', decides: true, look: { girl: true, hair: 'long', top: '#c8a8d8', bottom: '#3a3a4a', bag: 'tote' },
        intro: '「我跟我最好的朋友吵架了，她在月台上。可是我不敢過去。你可以幫我傳話嗎？」', lines: ['「我說了很過分的話。」', '「你先去找找看，我們以前的東西。」'], clueLine: '（傳話能不能成功，要看你蒐集到什麼。）' },
      { name: '月台上的少女', at: 'p', behavior: 'wall', look: { girl: true, hair: 'bun', top: '#a8c8d8', bottom: '#3a3a4a' },
        intro: '「如果是她叫你來的，你可以回去了。」她背對著你。', lines: ['「她說我是假朋友。」', '「……她還好嗎？」'] },
    ],
    clues: [
      { kind: 'photo', at: 'u', title: '大頭貼', text: '兩個女孩擠在一起扮鬼臉，下面寫著「永遠的 BFF」。', note: '大頭貼：「永遠的 BFF」' },
      { kind: 'note', at: 'p', title: '摺成愛心的紙條', text: '「對不起，那天我說妳是假朋友，其實我是怕妳要搬家以後就不理我了。」', note: '紙條：她怕朋友搬家後就不理她' },
    ],
    final: { text: '「她……怎麼說？」', options: [
      { label: '把大頭貼和紙條都交給月台上的女孩，再帶她回大廳。', result: 'perfect', text: '兩個女孩面對面站著，不知道誰先哭的。她們抱在一起，像大頭貼上那樣。' },
      { label: '只轉述：「她說對不起。」', result: 'good', text: '月台上的女孩沉默了很久，點點頭：「……我知道了。」可是她沒有走過來。' },
      { label: '「她說妳本來就是假朋友。」', result: 'bad', text: '兩個女孩都哭了。霧裡響起很多人的竊笑聲。', hurt: 12, why: '霧裡的嘲笑' },
    ] },
  }));

  D('rescue', 'c09', K => ({
    base: 'story', title: '留下來的人', hint: '有人在霧最濃的地方蓋了一個小窩。', need: 2,
    npc: { name: '住在霧裡的畫家', at: 'pend', behavior: 'sit', look: { top: '#8a6a4a', bottom: '#3a3a3a', hat: 'beret', hatColor: '#8a3a2a', glasses: true },
      intro: '「這裡很好啊。沒有房租，沒有截稿日，每天晚上都有新的風景。」他在畫月台上的霧。',
      lines: ['「外面的世界不需要我的畫。」', '「你要幫我嗎？還是要勸我走？」', '「這幅畫畫完，我就決定要不要離開。」'], clueLine: '（他的畫，和他的過去。）' },
    clues: [
      { kind: 'paper', at: 'c', title: '畫展邀請卡', text: '「新銳畫家個展——《霧中車站》」，展期是下個月。展出者：就是他。', note: '邀請卡：他下個月有個展' },
      { kind: 'note', at: 'u', title: '母親的訊息', text: '「兒子，你的畫我都收著。你不用成功，回家吃飯就好。」', note: '母親：「回家吃飯就好」' },
    ],
    final: { text: '「你覺得呢？我該留下來嗎？」', options: [
      { label: '「你的畫展在等你。帶著這幅畫回去吧。」', result: 'perfect', text: '他看著畫，看了很久，然後把畫捲起來夾在腋下。「好。這幅就叫《留下來的人》。」' },
      { label: '「如果你想留下來，我幫你把畫完成。」', result: 'good', text: '你幫他調了顏色。他畫完最後一筆，滿意地笑了，和畫一起淡進霧裡。這是他的選擇。', choice: 'stay' },
      { label: '把畫撕掉：「醒醒吧。」', result: 'bad', text: '畫被撕開的瞬間，霧從畫裡湧出來，淹過你的口鼻。', hurt: 20, why: '被畫裡的霧淹沒' },
    ] },
  }));

  D('rescue', 'c10', K => ({
    base: 'story', title: '記憶交換', hint: '有人說，可以用一樣東西換一個秘密。', need: 0,
    npc: { name: '收集回憶的人', at: 'c', behavior: 'watch', look: { top: '#2a2a3a', coat: true, bottom: '#1a1a2a', hat: 'fedora', hatColor: '#1a1a1a' },
      intro: '「給我一樣你身上的普通東西，我就告訴你這座車站的秘密。東西越有回憶，秘密越重要。」' },
    clues: [],
    final: { button: '交換', text: '「你要拿什麼來換？」', options: K2 => {
      const s = S(), inv = Object.keys(s.inv).filter(id => s.inv[id] > 0 && ITEMS[id] && !ITEMS[id].cat && !['fog_tea', 'fog_charm', 'fog_salt'].includes(id)).slice(0, 4);
      const opts = inv.map(id => ({ label: `交出 ${ITEMS[id].icon} ${ITEMS[id].name}`, result: ITEMS[id].price ? 'good' : 'perfect', text: `他接過${ITEMS[id].name}，閉上眼睛聞了聞。「……${ITEMS[id].price ? '普通的回憶。好吧，給你一個普通的秘密：這座車站的第一班車，司機總是會在這裡多停兩秒，因為他女兒在這站上車。' : '這個有很深的回憶。那我告訴你一個真正的秘密：霧不是從隧道來的，是從等待的人心裡來的。每一個不肯離開的人，都會讓霧濃一點。'}」`, after: () => { s.inv[id]--; saveState(); } }));
      if (!opts.length) opts.push({ label: '「我身上沒有東西可以給你。」', result: 'good', text: '「那就給我一個你的回憶吧。」他碰了碰你的額頭，你忘記了今天早餐吃什麼。「……很好。秘密是：天亮以前，所有的鬼都會回到他們等待的地方。」' });
      return opts.concat([{ label: '「我不換。」', result: 'bad', text: '「真小氣。」他的帽子底下伸出一隻手，把你推開。', hurt: 6 }]);
    } },
  }));

  D('rescue', 'c11', K => ({
    base: 'story', title: '失去的聲音', hint: '有個老奶奶在找一卷錄音帶。', need: 3,
    npc: { name: '找錄音帶的奶奶', at: 'c', behavior: 'sit', look: { girl: true, old: true, hairColor: '#e0e0e0', hair: 'bun', top: '#6a4a3a', bottom: '#3a3a3a' },
      intro: '「我先生以前是捷運的廣播員。站名的錄音都是他錄的。現在都換成新的聲音了……我好想再聽一次。」',
      lines: ['「他的聲音很溫柔，會把『終點站』唸得很慢。」', '「錄音帶有三卷，散在站裡。」'], clueLine: '（找到三卷錄音帶。）' },
    clues: [
      { kind: 'recorder', at: 'p', title: '錄音帶一', text: '「下一站……」溫柔的男聲，唸得很慢。', note: '錄音帶一：「下一站」' },
      { kind: 'recorder', at: 'u', title: '錄音帶二', text: '「……本列車終點站，請全部旅客下車。」', note: '錄音帶二：「終點站」' },
      { kind: 'recorder', at: 'c', title: '錄音帶三', text: '錄音的最後，有一段沒剪掉的聲音：「好了，錄完了，回家陪老婆吃飯。」', note: '錄音帶三：「回家陪老婆吃飯」' },
    ],
    final: { text: '「找到了嗎？」她的手在發抖。', options: [
      { label: '把三卷都給她，從第三卷開始放。', result: 'perfect', text: '「……回家陪老婆吃飯。」奶奶聽到這句，笑著哭了。「他每次都這樣說。」' },
      { label: '只給她站名的錄音。', result: 'good', text: '奶奶聽著站名，一站一站地跟著唸，好像在搭一班很長的車。' },
      { label: '「錄音帶壞掉了。」', result: 'bad', text: '奶奶的臉一下子垮了，四周響起嘈雜的廣播聲，全是陌生人的聲音。', hurt: 10 },
    ] },
  }));

  D('rescue', 'c12', K => ({
    base: 'story', title: '誤會的真相', hint: '兩個人隔著閘門對峙。', need: 3,
    npcs: [
      { name: '閘門內的哥哥', at: 'c', behavior: 'watch', decides: true, look: { top: '#3a4a5a', bottom: '#2a2a2a' }, intro: '「他把爸爸留下來的錶賣掉了。我不會原諒他。」', lines: ['「那是爸爸唯一的東西。」'], clueLine: '（真相是什麼？要不要告訴他們？）' },
      { name: '閘門外的弟弟', at: 'u', behavior: 'watch', look: { top: '#5a4a3a', bottom: '#2a2a2a', hair: 'mush' }, intro: '「隨便他怎麼想。」', lines: ['「我有我的理由。」', '「不要告訴他。」'] },
    ],
    clues: [
      { kind: 'paper', at: 'u', title: '當鋪收據', text: '「手錶一只，典當金額三萬元」——日期是爸爸住院那一週。', note: '當鋪收據：爸爸住院那週' },
      { kind: 'note', at: 'p', title: '醫院繳費單', text: '「住院費用：三萬元整，已繳清。繳款人：弟弟的名字」', note: '繳費單：弟弟繳了三萬元住院費' },
      { kind: 'coin', at: 'c', label: '撿起：當鋪的贖回單', title: '贖回單', text: '「手錶已贖回」——弟弟每個月存一點錢，上週剛把錶贖回來。', note: '贖回單：弟弟上週把錶贖回來了' },
    ],
    final: { text: '哥哥看著你：「你查到什麼了？」', options: [
      { label: '告訴哥哥全部的真相。', result: 'perfect', text: '哥哥聽完，看向閘門外。弟弟從口袋裡拿出那支錶。哥哥走過閘門，什麼都沒說，抱住了他。' },
      { label: '尊重弟弟，什麼都不說。', result: 'good', text: '你什麼都沒說。弟弟對你點點頭，把錶放在閘門上，轉身走了。哥哥撿起錶，愣在原地。' },
      { label: '「是弟弟的錯。」', result: 'bad', text: '弟弟看了你一眼，那一眼像刀子。閘門啪地關上，夾住了你的手。', hurt: 14, why: '被閘門夾到' },
    ] },
  }));

  D('rescue', 'c13', K => ({
    base: 'story', title: '不完整的告別', hint: '有人說，她來不及說再見。', need: 3,
    npc: { name: '穿制服的女學生', at: 'p', behavior: 'idle', look: { girl: true, hair: 'long', top: '#f0f0ec', pattern: 'shirt', accent: '#2a4a8a', bottom: '#2a3a6a', skirt: true, bag: 'backpack' },
      intro: '「畢業那天，我跟大家說『明天見』。可是我沒有明天了。」她很平靜。「我想好好說再見。」',
      lines: ['「我的同學，今年應該大學畢業了。」', '「幫我找三樣東西，我就可以好好說再見。」'], clueLine: '（找到她想留下的東西。）' },
    clues: [
      { kind: 'note', at: 'c', title: '畢業紀念冊的一頁', text: '大家的簽名，「明天見！」寫了好多次。', note: '紀念冊：很多「明天見」' },
      { kind: 'ticket', at: 'u', title: '學生定期票', text: '定期票的照片是她，有效期限停在六年前的六月。', note: '學生定期票：停在六年前六月' },
      { kind: 'flower', at: 'p', title: '畢業花束', text: '乾掉的花束，卡片寫著：「給永遠十八歲的妳。——全班」', note: '花束：「給永遠十八歲的妳」' },
    ],
    final: { text: '「都找到了嗎？那我要怎麼說再見呢？」', options: [
      { label: '「說『謝謝大家』，然後放下它們。」', result: 'perfect', text: '她把三樣東西排在月台上，鞠了一個很深的躬。「謝謝大家。再見。」第一班車的燈從隧道裡亮起來，她不見了。' },
      { label: '「還是說『明天見』吧。」', result: 'good', text: '她笑了：「好啊，明天見。」也許這樣比較像她。' },
      { label: '「妳不需要說再見。」', result: 'bad', text: '她的笑容僵住了。月台的燈一盞一盞熄滅。', hurt: 10 },
    ] },
  }));

  D('rescue', 'c15', K => ({
    base: 'story', title: '相信誰', hint: '三個人說了三個不同的故事。', need: 3,
    npcs: [
      { name: '戴眼鏡的男人', at: 'c', behavior: 'idle', decides: true, look: { top: '#3a3a4a', bottom: '#2a2a2a', glasses: true }, intro: '「是那個穿紅衣服的女人推他下去的，我親眼看到。」', lines: ['「我不會說謊。」'], clueLine: '（三個人的說法互相矛盾，你要相信誰？）' },
      { name: '穿紅衣服的女人', at: 'p', behavior: 'wall', look: { girl: true, hair: 'long', top: '#a82020', bottom: '#2a2a2a' }, intro: '「我沒有推他。我是想拉住他。」', lines: ['「他是自己往前走的，像在追什麼。」'] },
      { name: '值班的站務員', at: 'u', behavior: 'watch', look: { top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b' }, intro: '「月台上沒有發生任何事。那天晚上沒有人掉下去。」', lines: ['「是霧讓大家看到了不一樣的東西。」'] },
    ],
    clues: [
      { kind: 'photo', at: 'p', title: '監視器的最後一格', text: '紅衣女人伸出手——方向是往回拉，不是往前推。', note: '監視器：紅衣女人是在往回拉' },
      { kind: 'note', at: 'c', title: '眼鏡男的病歷', text: '「視力：右眼 0.1，左眼失明。」', note: '病歷：眼鏡男左眼失明' },
      { kind: 'paper', at: 'u', title: '值班日誌', text: '「00:47　月台有旅客跌倒，已被路人拉回，無大礙。」——站務員把這行劃掉了。', note: '值班日誌：有人跌倒被拉回（被劃掉）' },
    ],
    final: { text: '眼鏡男：「所以，你相信誰？」', options: [
      { label: '相信紅衣女人：她救了人。', result: 'perfect', text: '紅衣女人轉過身，第一次看著大家。站務員嘆了口氣，承認他劃掉了紀錄，「我怕被追究。」眼鏡男低下頭：「……我看錯了。」' },
      { label: '相信站務員：什麼事都沒發生。', result: 'good', text: '大家沉默下來。也許什麼都沒發生，比較好。可是紅衣女人的背影看起來很孤單。' },
      { label: '相信眼鏡男：是她推的。', result: 'bad', text: '紅衣女人的頭髮像潮水一樣湧向你。', hurt: 20, why: '被紅衣女人的頭髮纏住' },
    ] },
  }));

  D('rescue', 'c16', K => ({
    base: 'story', title: '交換命運', hint: '有人被霧纏住了，動彈不得。', need: 1,
    npc: { name: '被霧纏住的女孩', at: 'p', behavior: 'idle', look: { girl: true, hair: 'bob', top: '#7a8a9a', bottom: '#3a3a3a' },
      intro: '「霧纏在我腳上，我走不了。」她的腳踝被一圈灰色的霧緊緊綁住。「除非有人願意分走一半。」',
      lines: ['「分走一半，你會很痛。」', '「不用勉強，我等天亮就好。……天會亮吧？」'], clueLine: '（你可以替她承擔一部分。）' },
    clues: [
      { kind: 'note', at: 'c', title: '霧的規則（刻在柱子上）', text: '「被霧纏住的人，若有人自願承擔，霧便會一分為二。承擔的人會痛，但霧帶不走兩個人。」', note: '霧的規則：有人承擔，霧就帶不走兩個人' },
    ],
    final: { text: '「你……要幫我嗎？」', options: [
      { label: '「分給我吧。」（生命值 −35）', result: 'perfect', text: '灰色的霧爬上你的腳踝，冷得像刀割。可是女孩的腳鬆開了。她扶著你：「謝謝你。我會記得你的。」', hurt: 35, why: '替她承擔了霧', gold: 2 },
      { label: '「我去找別的辦法。」', result: 'good', text: '你在站裡找了很久，最後帶回一包鹽，撒在她腳邊。霧退了一點，她可以慢慢走了。' },
      { label: '轉身離開。', result: 'bad', text: '你聽到她在背後小聲地說：「……沒關係。」霧更濃了。', hurt: 5 },
    ] },
  }));

  D('rescue', 'c18', K => ({
    base: 'story', title: '最後一封訊息', hint: '有一封簡訊，一直沒有送出去。', need: 3,
    npcs: [
      { name: '拿著手機的老先生', at: 'c', behavior: 'sit', decides: true, look: { old: true, top: '#4a5a4a', bottom: '#2a2a2a', glasses: true }, intro: '「我打了一封簡訊給我孫子，可是不知道怎麼送出去。你可以幫我拿給他嗎？」', lines: ['「他長得跟我年輕時一模一樣。」', '「他喜歡火車。」'], clueLine: '（站裡有三個年輕人，誰才是他孫子？）' },
      { name: '戴耳機的少年', at: 'p', behavior: 'idle', look: { height: .92, top: '#2a2a2a', bottom: '#2a3a5a', hat: 'cap', hatColor: '#c42a2a' }, intro: '「幹嘛？」他拿下一邊耳機。「我在等我爺爺。他說要帶我去看火車。」', lines: ['「我爺爺很老派，連手機都不太會用。」'] },
      { name: '穿西裝的年輕人', at: 'u', behavior: 'pace', look: { top: '#2a2e36', pattern: 'shirt', accent: '#6a1a2a', bottom: '#1e2128' }, intro: '「我爺爺？他早就不在了。」', lines: ['「我討厭火車。」'] },
    ],
    clues: [
      { kind: 'photo', at: 'p', title: '老照片', text: '年輕時的老先生，戴著一頂紅色棒球帽，站在火車前面。', note: '老照片：年輕的老先生戴紅色棒球帽' },
      { kind: 'note', at: 'c', title: '沒送出的簡訊（抄在紙上）', text: '「阿翔，爺爺沒辦法帶你去看火車了。你長大以後，要自己去看喔。」', note: '簡訊：「阿翔，要自己去看火車」' },
      { kind: 'ticket', at: 'u', title: '火車博物館門票', text: '兩張門票，名字寫著「爺爺」和「阿翔」。', note: '門票：爺爺和阿翔' },
    ],
    final: { text: '老先生：「找到他了嗎？」', options: [
      { label: '把訊息交給戴紅帽子、喜歡火車的少年。', result: 'perfect', text: '少年讀著訊息，拿下耳機，抬頭看向大廳。老先生對他揮揮手。少年哭著揮手回去。' },
      { label: '交給穿西裝的年輕人。', result: 'bad', text: '年輕人看完，冷冷地把紙揉掉。「不是我。」霧裡傳來老先生失望的嘆息。', hurt: 10 },
      { label: '「我自己唸給你聽吧。」', result: 'good', text: '你把訊息唸了一遍。老先生點點頭：「這樣也好，至少有人聽到了。」' },
    ] },
  }));
})();
