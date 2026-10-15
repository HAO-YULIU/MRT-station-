/* 迷霧之城：事件內容（第二部分）
 * 站內解謎 12、生存與危險 15、隱藏收藏 10、特殊挑戰 15、隱藏任務 12、列車事件 10
 */
(() => {
  const D = FogEvents.def;
  const S = () => Game.state;
  const code = st => { const l = MRT.linesAt(st)[0]; return l ? l.code.replace(/\D/g, '').padStart(2, '0') : '00'; };

  /* ══════════ 第三大類：站內解謎（12） ══════════ */
  D('puzzle', 'p01', K => ({
    base: 'puzzle', title: '廣播密碼', hint: '廣播在唸一串奇怪的數字。',
    clues: [
      { kind: 'radio', at: 'p', title: '月台廣播（一）', text: '「……第『三』月台……列車……」雜音中只聽得清楚一個數字：<b>3</b>。', note: '廣播一：3' },
      { kind: 'radio', at: 'c', title: '大廳廣播（二）', text: '「……請在『七』號出口……」：<b>7</b>。', note: '廣播二：7' },
      { kind: 'radio', at: 'u', title: '出口廣播（三）', text: '「……『一』路順風……」：<b>1</b>。這段廣播的最後，夜班廣播員補了一句：「密碼要從離出口最近的那一段開始唸，一路唸到月台。」', note: '廣播三（出口）：1；從出口開始唸，唸到月台' },
    ],
    device: { kind: 'console', at: 'spot:office', name: '廣播主機', label: '輸入廣播密碼', prompt: '主機螢幕：「請輸入三位數密碼」', options: ['137', '173', '317', '713', '371'], answer: '173', locked: '主機上貼著：「密碼藏在三段廣播裡」。' },
    after: { text: '主機打開了，裡面有一個開關：「全站廣播」，以及一卷錄音帶。', options: [
      { label: '打開全站廣播，對霧說「天快亮了」', text: '你的聲音傳遍整座車站。月台上那些不動的人影，一個一個轉身，走進隧道。', result: 'up' },
      { label: '拿走錄音帶', text: '錄音帶上寫著「1996 通車首日廣播」。你把它收進口袋。', result: 'up', items: { fog_tea: 1 } },
    ] },
  }));

  D('puzzle', 'p02', K => ({
    base: 'puzzle', title: '倒轉時鐘', hint: '站裡的時鐘走得都不一樣。',
    clues: [
      { kind: 'clock', at: 'c', label: '看時鐘', title: '大廳時鐘', text: '指著 <b>3:10</b>，秒針倒著走。', note: '大廳時鐘 3:10（倒走）' },
      { kind: 'clock', at: 'p', label: '看時鐘', title: '月台時鐘', text: '指著 <b>3:40</b>。下面貼著：「比真正的時間快 30 分鐘」。', note: '月台時鐘 3:40，快 30 分' },
      { kind: 'clock', at: 'u', label: '看時鐘', title: '出口時鐘', text: '指著 <b>2:50</b>。下面貼著：「比真正的時間慢 20 分鐘」。', note: '出口時鐘 2:50，慢 20 分' },
    ],
    device: { kind: 'clock', at: 'spot:timetable', name: '總時鐘', label: '調整總時鐘', prompt: '總時鐘的指針可以轉動。真正的時間是？', options: ['3:10', '3:40', '2:50', '3:30', '3:20'], answer: '3:10', locked: '總時鐘停住了，旁邊寫著：「找出真正的時間」。' },
    after: { text: '時鐘開始正常地走了。玻璃後面掉出一張紙條和一枚舊硬幣。', options: [
      { label: '讀紙條', text: '「謝謝你讓時間重新走動。我在這裡等了很久，終於可以去下一站了。」', result: 'up' },
      { label: '收下硬幣', text: '1996 年的紀念幣，摸起來是溫的。', result: 'up', items: { fog_charm: 1 } },
    ] },
  }));

  D('puzzle', 'p03', K => ({
    base: 'puzzle', title: '車站編號', hint: '有個置物櫃上寫著：「答案就是這一站」。',
    clues: [
      { kind: 'note', at: 'spot:map', title: '月台路線圖上的塗鴉', text: `有人在路線圖上，把本站的站碼圈了起來：<b>${MRT.linesAt(K.station).map(l => l.code).join('、')}</b>。`, note: `本站站碼：${MRT.linesAt(K.station).map(l => l.code).join('、')}` },
      { kind: 'note', at: 'c', title: '紙條', text: '「密碼是：本站第一個站碼的數字，再加上本站有幾條路線經過。」', note: '密碼＝第一個站碼數字＋路線數' },
    ],
    device: (() => { const n = parseInt(code(K.station), 10) + MRT.linesAt(K.station).length; const opts = [n, n + 1, n - 1, n + 10, parseInt(code(K.station), 10)].map(x => String(x).padStart(2, '0')); return { kind: 'locker', at: 'u', name: '密碼置物櫃', label: '輸入密碼', prompt: '兩位數的密碼鎖。', options: [...new Set(opts)], answer: String(n).padStart(2, '0'), locked: '「答案就是這一站。」' }; })(),
    after: { text: '櫃子打開了。裡面有一個信封，上面寫著你的名字。', options: [
      { label: '打開信封', text: '裡面是一張這一站的老照片，照片角落站著一個戴紅色貝雷帽的小女孩。', result: 'up' },
      { label: '把信封放回去，關上櫃子', text: '有些東西不該被打開。櫃子關上的瞬間，你聽見裡面傳來一聲「謝謝」。', result: 'up', items: { fog_salt: 1 } },
    ] },
  }));

  D('puzzle', 'p04', K => ({
    base: 'puzzle', title: '失物排列', hint: '失物招領處的架子上空了四格。',
    clues: [
      { kind: 'umbrella', at: 'p', title: '一把傘', text: '標籤：「第 1 件，月台撿到」。', note: '雨傘：第 1 件' },
      { kind: 'bag', at: 'c', title: '一個背包', text: '標籤：「第 2 件，緊接在雨傘之後找到」。', note: '背包：第 2 件（緊接在雨傘之後）' },
      { kind: 'photo', at: 'u', title: '一張照片', text: '標籤：「最後一件」。', note: '照片：最後一件' },
      { kind: 'coin', at: 'c', label: '撿起：一枚戒指', title: '一枚戒指', text: '標籤：「在照片之前」。', note: '戒指：在照片之前' },
    ],
    device: { kind: 'box', at: 'u', name: '失物招領架', label: '把失物放回架上', prompt: '依照找到的順序，一件一件放回架上：', order: ['雨傘', '背包', '戒指', '照片'], locked: '架子上寫著：「請依照發現的順序歸還」。' },
    after: { text: '最後一格擺好的時候，架子後面的牆打開了一條縫，裡面有一張紙。', options: [
      { label: '讀那張紙', text: '「這四件東西屬於同一個人。她在這一站等了四年，每年掉一樣東西，希望有人撿到會想起她。」', result: 'up' },
    ] },
  }));

  D('puzzle', 'p06', K => ({
    base: 'puzzle', title: '錯誤路線圖', hint: '大廳的路線圖有點不對勁。',
    clues: [
      { kind: 'note', at: 'spot:guide', title: '路線指南的錯誤（一）', text: '路線指南上，文湖線被畫成了一個圓圈。', note: '錯誤一：文湖線畫成圓圈' },
      { kind: 'note', at: 'spot:map', title: '月台路線圖的錯誤（二）', text: '月台路線圖上，淡水信義線的終點寫成「霧」。', note: '錯誤二：淡水信義線終點變成「霧」' },
      { kind: 'note', at: 'u', title: '出口地圖的錯誤（三）', text: '出口地圖上，本站有一條不存在的第七號出口。旁邊有人用鉛筆寫著：「線和字是人畫錯的；門，只有霧開得出來。」', note: '錯誤三：不存在的第七號出口（「門只有霧開得出來」）' },
    ],
    device: { kind: 'console', at: 'c', name: '路線查詢機', label: '查詢路線', prompt: '查詢機問：「三個錯誤裡，哪一個是霧故意留給你的路？」', options: ['文湖線變成圓圈', '淡水信義線的終點是「霧」', '不存在的第七號出口'], answer: '不存在的第七號出口', locked: '查詢機：「請先找出所有錯誤」。' },
    after: { text: '查詢機印出一張票：「第七號出口　單程」。', options: [
      { label: '收好這張票', text: '票在你手上慢慢變得透明。也許只有在霧裡才看得到。', result: 'up', items: { mistticket: 1 } },
    ] },
  }));

  D('puzzle', 'p08', K => ({
    base: 'puzzle', title: '密碼置物櫃', hint: '置物櫃裡傳出手機鈴聲。',
    clues: [
      { kind: 'note', at: 'c', title: '牆上的塗鴉', text: '三隻畫得很醜的貓，每隻貓的尾巴繞了不同圈數：<b>2、5、9</b>。', note: '三隻貓尾巴：2、5、9' },
      { kind: 'note', at: 'p', title: '月台上的貼紙', text: '「最胖的貓排第一個」——最胖的是尾巴繞 5 圈的那隻。', note: '最胖的貓（5）排第一' },
      { kind: 'note', at: 'u', title: '售票機上的便利貼', text: '「最瘦的貓排最後」——最瘦的是 2 圈的。', note: '最瘦的貓（2）排最後' },
    ],
    device: { kind: 'locker', at: 'u', name: '置物櫃', label: '轉密碼鎖', prompt: '三位數密碼鎖，鈴聲還在響。', options: ['259', '592', '529', '952', '925'], answer: '592', locked: '櫃門上畫著一隻貓。' },
    after: { text: '櫃子打開，手機還在響。螢幕上的來電顯示是：你的名字。', options: [
      { label: '接起來', text: '電話那頭是你自己的聲音：「……出口在你背後。」然後斷線了。你回頭，什麼都沒有。', result: 'up', hurt: 5 },
      { label: '掛掉', text: '鈴聲停了。櫃子底下有一包鹽。', result: 'up', items: { fog_salt: 1 } },
    ] },
  }));

  D('puzzle', 'p09', K => ({
    base: 'puzzle', title: '車票拼圖', hint: '地上散著被撕碎的車票。',
    clues: [
      { kind: 'ticket', at: 'c', title: '車票碎片（左上）', text: '寫著「往」。', note: '碎片：往' },
      { kind: 'ticket', at: 'p', title: '車票碎片（右上）', text: '寫著「如」。', note: '碎片：如' },
      { kind: 'ticket', at: 'u', title: '車票碎片（下半）', text: '寫著「月」，還有一行小字：「單程・不可退票」。', note: '碎片：月' },
    ],
    device: { kind: 'console', at: 'spot:ticket', name: '售票機', label: '把碎片拼回去', prompt: '售票機的螢幕上出現一個空白的車票框。拼出來的站名是？', options: ['往如月', '往月如', '如月往', '往霧'], answer: '往如月', locked: '售票機的螢幕閃著：「請放入車票」。' },
    after: { text: '車票拼好了：「往 如月」。售票機吐出一張一模一樣的新車票。', options: [
      { label: '收下車票', text: '「如月」……你好像在哪裡聽過這個站名。它不在任何一條路線上。', result: 'up', items: { mistticket: 1 } },
      { label: '把車票撕掉', text: '「不要去那裡。」你聽見有人在你耳邊說。也許這樣比較好。', result: 'up' },
    ] },
  }));

  D('puzzle', 'p10', K => ({
    base: 'puzzle', title: '證詞矛盾', hint: '三個錄音筆，錄下了三個人的證詞。',
    clues: [
      { kind: 'recorder', at: 'c', title: '證詞 A', text: '「我 1:00 在大廳，看到 B 從月台上來。」', note: 'A：1:00 在大廳，看到 B 從月台上來' },
      { kind: 'recorder', at: 'p', title: '證詞 B', text: '「我 1:00 一直在月台，從頭到尾沒有離開。」', note: 'B：1:00 一直在月台沒離開' },
      { kind: 'recorder', at: 'u', title: '證詞 C', text: '「1:00 的時候，A 在出口跟我說話。」', note: 'C：1:00，A 在出口跟我說話' },
    ],
    device: { kind: 'console', at: 'spot:office', name: '站務室的電腦', label: '提交結論', prompt: '三個人之中，誰說了謊？（只有一個人說謊）', options: ['A', 'B', 'C'], answer: 'A', locked: '電腦：「請先聽完三段證詞」。', },
    wrongText: '不對。如果他說謊，另外兩個人的話就對不起來。',
    after: { text: '電腦跳出一行字：「A 不在大廳，他在出口。那他是怎麼『看到』B 的？」螢幕上出現 A 的照片——他沒有臉。', options: [
      { label: '關掉電腦', text: '螢幕黑掉之前，A 的照片轉頭看了你一眼。', result: 'up' },
    ] },
  }));

  D('puzzle', 'p12', K => ({
    base: 'puzzle', title: '閃爍燈號', hint: '月台的指示燈以奇怪的節奏閃爍。',
    clues: [
      { kind: 'lamp', at: 'p', label: '觀察指示燈', title: '月台指示燈', text: '燈在閃：短、短、長……停……長、短……停……短、長、短、短。', note: '燈號：··— / —· / ·—··' },
      { kind: 'paper', at: 'c', title: '站務員的密碼表', text: '「·— = A、—· = N、··— = U、·—·· = L」', note: '密碼表：·—=A、—·=N、··—=U、·—··=L' },
    ],
    device: { kind: 'console', at: 'c', name: '號誌控制盤', label: '輸入訊息', prompt: '燈號翻譯出來的字是？', options: ['UNL', 'ANL', 'LUN', 'NUL'], answer: 'UNL', locked: '控制盤：「翻譯燈號」。' },
    after: { text: 'UNL——控制盤上的提示說，這是「UNLOCK」被截斷的訊息。閘門全部打開了。', options: [
      { label: '走過閘門', text: '閘門那邊的霧淡了一點。', result: 'up' },
    ] },
  }));

  D('puzzle', 'p14', K => ({
    base: 'puzzle', title: '文件排序', hint: '站務日誌的紙頁散了一地。',
    clues: [
      { kind: 'paper', at: 'c', title: '日誌（一）', text: '「23:58　末班車進站，一切正常。」', note: '23:58 末班車進站' },
      { kind: 'paper', at: 'p', title: '日誌（二）', text: '「00:47　月台出現霧，旅客陸續離開。」', note: '00:47 月台起霧' },
      { kind: 'paper', at: 'u', title: '日誌（三）', text: '「00:31　最後一名旅客出站。」', note: '00:31 最後旅客出站' },
      { kind: 'paper', at: 'c', title: '日誌（四）', text: '「02:13　有人敲站務室的門。我沒有開。」', note: '02:13 有人敲門' },
    ],
    device: { kind: 'box', at: 'spot:office', name: '日誌本', label: '把日誌排好', prompt: '依照時間，把紙頁一張一張夾回日誌本：', order: ['23:58 末班車進站', '00:31 最後旅客出站', '00:47 月台起霧', '02:13 有人敲門'], locked: '日誌本是空的。' },
    after: { text: '日誌本最後多了一頁，墨水還沒乾：「03:30　敲門的人，是我自己。」', options: [
      { label: '合上日誌', text: '你把日誌放回站務室。門外傳來敲門聲——三下，很輕。', result: 'up' },
    ] },
  }));

  D('puzzle', 'p17', K => ({
    base: 'puzzle', title: '假出口辨認', hint: '非付費區多了好幾扇一模一樣的出口。', need: 2,
    clues: [
      { kind: 'note', at: 'u', title: '出口的貼紙', text: '每扇門上都貼著「出口」。只有一扇門的貼紙，邊角翹起來了——因為真的有風吹過。', note: '真正的出口：貼紙被風吹翹' },
      { kind: 'note', at: 'c', title: '清潔員的話（寫在拖把桶上）', text: '「假的門不會有腳印。真的門前面，地板被磨得比較亮。」', note: '真正的出口：地板被磨亮' },
    ],
    device: { kind: 'reddoor', at: 'u', name: '三扇門', label: '選擇出口', prompt: '三扇門：<br>甲：貼紙平整，地板很亮。<br>乙：貼紙翹起，地板很亮。<br>丙：貼紙翹起，地板沒有痕跡。', options: ['甲', '乙', '丙'], answer: '乙', wrongDmg: 18, wrongWhy: '假的出口後面是一堵牆，你一頭撞了上去', locked: '每一扇都寫著「出口」。' },
    openText: '你推開乙門，冷空氣灌進來——是真的風。',
  }));

  D('puzzle', 'p20', K => ({
    base: 'puzzle', title: '事件時間軸', hint: '一連串怪事，發生的順序被打亂了。',
    clues: [
      { kind: 'photo', at: 'c', title: '照片（一）', text: '月台上的人全都轉頭看向隧道。照片背面：「燈還亮著」。', note: '眾人轉頭（燈還亮著）' },
      { kind: 'photo', at: 'p', title: '照片（二）', text: '一片漆黑，只有隧道深處有兩點紅光。', note: '漆黑，隧道紅光' },
      { kind: 'photo', at: 'u', title: '照片（三）', text: '月台很正常，大家在滑手機。', note: '月台正常' },
      { kind: 'photo', at: 'c', title: '照片（四）', text: '月台上空無一人，只剩下一排鞋子。照片背面：「燈又亮起來的時候」。', note: '空無一人，只剩鞋子（燈又亮了）' },
    ],
    device: { kind: 'tv', at: 'c', name: '監視器螢幕', label: '把畫面排好', prompt: '依照發生的順序排列畫面：', order: ['月台正常', '眾人轉頭', '一片漆黑', '只剩鞋子'], locked: '螢幕上四個畫面都是雜訊。' },
    after: { text: '畫面排好後，最後一格慢慢變了——鞋子旁邊，多了一雙你的鞋。', options: [
      { label: '關掉螢幕', text: '你決定不要讓那一格成真。螢幕黑了。', result: 'up' },
    ] },
  }));

  /* ══════════ 第四大類：生存、追逐與危險（15） ══════════ */
  D('survive', 's01', { base: 'survive', title: '影子追逐', hint: '你的影子……不見了。它在別的地方。', hazard: { kind: 'shadow', count: 1, speed: 2.4, dmg: 18, why: '被影子抓到', grow: true }, goal: { type: 'collect', n: 4, kind: 'shard', name: '光的碎片', label: '撿起光的碎片', texts: ['碎片裡映著你的臉。', '影子跟得更近了。', '還差一點。', ''] }, doneText: '四片光合在一起，影子被吸了回來，乖乖躺在你腳下。' });
  D('survive', 's02', { base: 'survive', title: '熄燈區域', dark: true, hint: '燈全滅了。', hazard: { kind: 'ghost', count: 2, speed: 1.6, dmg: 15, why: '黑暗中有手抓住了你' }, goal: { type: 'collect', n: 4, kind: 'lamp', name: '備用燈泡', label: '撿起備用燈泡', texts: ['燈泡是溫的。配電盤應該在站務室附近。', '黑暗裡有東西跟著燈泡的光在走。', '只差一顆了。不要停下來。', ''] }, doneText: '你把燈泡裝回配電盤，站內的燈一盞一盞亮起來。' });
  D('survive', 's03', { base: 'survive', title: '不能回頭', hint: '月台上寫著：「走過這裡，不要回頭」。', noTurn: true, hazard: { kind: 'shadow', count: 1, speed: 1.2, dmg: 10, mode: 'wander' }, goal: { type: 'reach', path: ['p', 'pend', 'p', 'pend'], kind: 'symbol', name: '記號', label: '碰觸記號', texts: ['背後有腳步聲。不要回頭。', '有人在叫你的名字。不要回頭。', '那個聲音很像你媽媽。不要回頭。', ''] }, doneText: '腳步聲停了。你終於可以回頭——身後什麼都沒有，只有一排濕濕的腳印。' });
  D('survive', 's04', { base: 'survive', title: '逐漸縮小的安全區', hint: '地上出現了一圈紅色的線，正在慢慢縮小。', shrink: { r: 22, rate: .06 }, goal: { type: 'collect', n: 3, kind: 'coin', name: '鎮霧的銅錢', label: '撿起銅錢', texts: ['紅線抖了一下。', '紅線停了一下。', ''] }, doneText: '三枚銅錢一放回地上，紅線就消失了。' });
  D('survive', 's05', { base: 'survive', title: '假站務人員', hint: '大廳裡有三個站務員。原本只有一個值班。', fakeStaff: true, hazard: { kind: 'shadow', count: 1, speed: 1.5, dmg: 12, mode: 'wander' }, goal: { type: 'none' } });
  D('survive', 's06', { base: 'survive', title: '靜止的乘客', hint: '月台上有個乘客一動也不動……你一動，他就動。', hazard: { kind: 'shadow', count: 2, speed: 2.8, dmg: 20, mode: 'statue', why: '你一動，它就到了你面前' }, goal: { type: 'collect', n: 3, kind: 'ticket', name: '他的車票', label: '撿起車票', texts: ['走一步，停一下。', '它又靠近了。', ''] }, doneText: '你把三張車票放在它面前。它低頭看了很久，然後……鞠躬，消失了。' });
  D('survive', 's07', K => ({ base: 'survive', title: '倒數封鎖', hint: '廣播：「本站將於十分鐘後全面封鎖」。', hazard: { kind: 'ghost', count: 1, speed: 1.8, dmg: 15 }, goal: { type: 'collect', n: 5, kind: 'paper', name: '通行證碎片', label: '撿起通行證碎片', texts: ['碎片上蓋著一個褪色的印章：「夜間通行」。', '廣播：「封鎖倒數中，請旅客儘速離站。」', '碎片背面寫著一個站務員的名字。', '你聽見鐵捲門的馬達開始轉動。', ''] }, timer: 420, doneText: '你在封鎖前拼好了通行證，鐵捲門在你身後落下。' }));
  D('survive', 's08', { base: 'survive', title: '失控手扶梯', hint: '手扶梯在反方向轉動，越轉越快。', hazard: { kind: 'shadow', count: 2, speed: 2.2, dmg: 16, why: '在手扶梯口被抓住' }, goal: { type: 'reach', path: ['p', 'c', 'p', 'u'], kind: 'symbol', name: '安全的樓層', label: '碰觸記號', texts: ['它在下一層等你。', '換樓層！它跟不上樓梯。', '', ''] }, doneText: '手扶梯慢慢停了下來。' });
  D('survive', 's09', { base: 'survive', title: '不要被點名', hint: '廣播在唸乘客的名字。', callout: true, hazard: { kind: 'ghost', count: 1, speed: 1.4, dmg: 10, mode: 'wander' }, goal: { type: 'none' } });
  D('survive', 's10', { base: 'survive', title: '無聲區域', hint: '牆上寫著：「請保持安靜」。跑步的聲音會引來它們。', hazard: { kind: 'ghost', count: 3, speed: 3.0, dmg: 18, mode: 'sound', why: '你的腳步聲把它引來了' }, goal: { type: 'collect', n: 4, kind: 'coin', name: '鈴鐺', label: '輕輕撿起鈴鐺', texts: ['不要跑。', '慢慢走。', '它就在附近。', ''] }, doneText: '四個鈴鐺一起響起來，它們摀著耳朵消失了。' });
  D('survive', 's12', { base: 'survive', title: '照明限制', dark: true, hint: '只有霧燈照得到的地方，才看得見東西。', hazard: { kind: 'shadow', count: 1, speed: 1.8, dmg: 14 }, goal: { type: 'collect', n: 4, kind: 'note', hidden: true, name: '藏在暗處的紙頁', label: '撿起紙頁', texts: ['「電量要省著用。」', '「它怕光，但光會吸引它。」', '「最後一頁在月台。」', '「你做到了。」'] }, doneText: '紙頁拼起來，是一張配電盤的位置圖。你打開總開關。' });
  D('survive', 's17', K => ({ base: 'survive', title: '閘門封鎖', hint: '閘門一扇一扇地關上了。', hazard: { kind: 'shadow', count: 2, speed: 2.0, dmg: 15 }, goal: { type: 'reach', path: ['c', 'u', 'c', 'p'], kind: 'symbol', name: '還開著的閘門', label: '鑽過去', texts: ['下一扇在另一邊。', '快！', '最後一扇！', ''] }, timer: 360, doneText: '你在最後一扇閘門關上前鑽了過去。' }));
  D('survive', 's18', { base: 'survive', title: '錯誤廣播', hint: '廣播說「請往月台避難」。……是真的嗎？', hazard: { kind: 'ghost', count: 2, speed: 2.0, dmg: 16, at: 'p' }, goal: { type: 'reach', path: ['u', 'c', 'u'], kind: 'symbol', name: '真正的避難點', label: '確認', texts: ['廣播又說：「請往月台」。月台上的東西在笑。', '不要相信廣播。', ''] }, doneText: '你一次都沒有照著廣播走。廣播最後說：「……你很聰明。」' });
  D('survive', 's19', K => ({
    base: 'survive', title: '受困乘客', hint: '有人被困在月台盡頭，影子圍著他。', hazard: { kind: 'shadow', count: 3, speed: 1.6, dmg: 14, at: 'p' },
    goal: { type: 'collect', n: 3, kind: 'coin', name: '解除封印的銅鈴', label: '撿起銅鈴', texts: ['被困的人在喊你。', '影子散開了一點。', ''] },
    doneText: '最後一個銅鈴響起，影子散了。被困的人向你道謝，然後走進霧裡。',
  }));
  D('survive', 's20', { base: 'survive', title: '最後一次照明', dark: true, hint: '燈只剩最後一點電。在燈完全熄滅前撐住。', hazard: { kind: 'ghost', count: 2, speed: 1.5, dmg: 14 }, goal: { type: 'survive', sec: 180 }, doneText: '燈熄滅的瞬間，天花板的緊急照明亮了起來。你撐過去了。' });

  /* ══════════ 第六大類：隱藏物品與收藏（10） ══════════ */
  const set = (key, name, icon, items, complete, o = {}) => D('collect', key, { base: 'collect', set: key, setName: name, icon, items, complete, ...o });
  set('k01', '異常車票', '🎫', [
    { name: '往如月的車票', kind: 'ticket', text: '站名是「如月」。票價欄是空白的。' },
    { name: '往霧的車票', kind: 'ticket', text: '站名只有一個字：「霧」。發車時間 00:30。' },
    { name: '往昨天的車票', kind: 'ticket', text: '終點寫著「昨天」。背面：「單程，不可回頭」。' },
    { name: '空白車票', kind: 'ticket', hidden: true, text: '完全空白的車票。對著霧燈看，浮現出你的名字。' },
  ], '四張不可能存在的車票。把它們排在一起，剛好是一條路線：如月 → 霧 → 昨天 → 你。', { gold: 1, hint: '地上有幾張不屬於任何路線的車票。' });
  set('k02', '破碎照片', '🖼️', [
    { name: '照片碎片：左上', kind: 'photo', text: '一隻手，戴著舊式手錶。' },
    { name: '照片碎片：右上', kind: 'photo', text: '車站的時鐘，指著 00:30。' },
    { name: '照片碎片：左下', kind: 'photo', text: '一雙紅色的鞋。' },
    { name: '照片碎片：右下', kind: 'photo', hidden: true, text: '一個人回頭的側臉——是秀蔅。' },
  ], '照片拼好了：1987 年，一個戴紅色貝雷帽的女孩站在月台上，回頭看著鏡頭。時鐘指著 00:30。', { gold: 1 });
  set('k03', '隱藏錄音', '📼', [
    { name: '錄音一', kind: 'recorder', text: '「這裡是夜班站務員，現在是 00:30，霧又來了。」' },
    { name: '錄音二', kind: 'recorder', text: '「月台上有人。我叫他，他沒有回頭。」' },
    { name: '錄音三', kind: 'recorder', text: '「他走進隧道了。我追過去……隧道裡有一座月台。」' },
    { name: '錄音四', kind: 'recorder', hidden: true, text: '「站名是『霧』。我在這裡等天亮。如果有人聽到這段——不要來找我。」' },
  ], '四段錄音按順序播完，最後是一段很長的沉默，然後是第一班車進站的聲音。', { gold: 1 });
  set('k04', '遺失的筆記', '📒', [
    { name: '筆記第 1 頁', kind: 'paper', text: '「今天在月台撿到一把鑰匙，不知道是誰的。」' },
    { name: '筆記第 2 頁', kind: 'paper', text: '「鑰匙可以打開站務室旁邊那扇門。門後面是另一座車站。」' },
    { name: '筆記第 3 頁', kind: 'paper', text: '「那座車站的人都在等車。他們說車從來沒來過。」' },
    { name: '筆記第 4 頁', kind: 'paper', hidden: true, text: '「我把鑰匙丟進軌道了。有些門不應該打開。」' },
  ], '筆記完整了。最後一頁的背面，貼著一把小小的鑰匙的照片。', { gold: 1 });
  set('k05', '神祕硬幣', '🪙', [
    { name: '民國 76 年的五十元', kind: 'coin', text: '1987 年的硬幣。摸起來是溫的。' },
    { name: '沒有年份的十元', kind: 'coin', text: '應該印年份的地方，印著一個「霧」字。' },
    { name: '穿孔的一元', kind: 'coin', text: '中間被打了一個洞，用紅線穿著，像護身符。' },
    { name: '透明的硬幣', kind: 'coin', hidden: true, text: '只有在霧燈下才看得到的硬幣。拿在手上，聽得到列車進站的聲音。' },
  ], '四枚硬幣疊在一起，剛好是一張末班車的票價。', { gold: 2 });
  set('k06', '站內符號', '🔣', [
    { name: '圓', kind: 'symbol', text: '牆上一個發光的圓圈。' },
    { name: '十字', kind: 'symbol', text: '柱子上的十字，像是站名牌的骨架。' },
    { name: '波浪', kind: 'symbol', text: '地板上的波浪紋，像河，也像霧。' },
    { name: '眼睛', kind: 'symbol', hidden: true, text: '天花板上的一隻眼睛。你看它的時候，它也在看你。' },
  ], '四個符號重疊起來，是這座城市的捷運標誌——只是中間多了一隻眼睛。');
  set('k11', '不存在的車站紀錄', '🗂️', [
    { name: '霧站施工圖', kind: 'paper', text: '一張捷運施工藍圖，在兩站之間多畫了一座月台，標著「M00」。' },
    { name: '霧站營運日報', kind: 'paper', text: '「本日進站人數：0。出站人數：1。」' },
    { name: '霧站站長名牌', kind: 'note', text: '站長：秀蔅。' },
    { name: '霧站廢站公告', kind: 'paper', hidden: true, text: '「本站將於天亮後消失。感謝各位旅客多年來的等待。」' },
  ], '四份文件都在描述同一座車站——一座每天 00:30 出現、06:00 消失的車站。', { gold: 2 });
  set('k12', '站務日誌', '📔', [
    { name: '日誌：週一', kind: 'paper', text: '「霧比上週濃。月台的長椅上多了一個人。」' },
    { name: '日誌：週三', kind: 'paper', text: '「那個人每天都在。他說他在等末班車。末班車早就開走了。」' },
    { name: '日誌：週五', kind: 'paper', text: '「我陪他等了一整晚。天亮的時候他對我說謝謝。」' },
    { name: '日誌：週日', kind: 'paper', hidden: true, text: '「長椅空了。我有點寂寞。」' },
  ], '一週的日誌，一個站務員和一個鬼的友情。');
  set('k15', '記憶碎頁', '📄', [
    { name: '碎頁：老陳', kind: 'note', text: '「通車那天，我在月台看到一個提燈的女孩在哭。」' },
    { name: '碎頁：美玲', kind: 'note', text: '「我小時候在捷運上走丟過。帶我去失物招領處的站務員，戴著紅色貝雷帽。」' },
    { name: '碎頁：林伯', kind: 'note', text: '「最後一班車，我在支線上多停了一站。那一站，有個女孩上車。」' },
    { name: '碎頁：無名', kind: 'note', hidden: true, text: '「我是提燈的女孩、戴貝雷帽的站務員、多停一站上車的乘客。我是秀蔅。」' },
  ], '不同人留下的碎頁，拼出同一個人。', { gold: 2 });
  set('k17', '廣播紀錄', '📻', [
    { name: '廣播：00:30', kind: 'radio', text: '「末班車已經開走了。」' },
    { name: '廣播：02:00', kind: 'radio', text: '「請在月台等候的旅客注意，下一班車不會來。」' },
    { name: '廣播：04:00', kind: 'radio', text: '「請不要回應隧道裡的聲音。」' },
    { name: '廣播：05:59', kind: 'radio', hidden: true, text: '「各位旅客早安。首班車即將進站。辛苦了。」' },
  ], '一整夜的廣播紀錄，從 00:30 到 05:59。最後一句是溫柔的。');

  /* ══════════ 第七大類：特殊挑戰（15） ══════════ */
  // 無提示挑戰：鐘錶匠的最後一班車
  D('challenge', 'x01', K => ({
    base: 'puzzle', title: '無提示：鐘錶匠的最後一班車', hint: '……',
    clues: [
      { kind: 'clock', at: 'c', label: '看掛鐘', title: '大廳的掛鐘', text: '指著 <b>4:25</b>。鐘擺上掛著一張小卡：「慢十五分鐘。慢一點的鐘，比較不會催人。——老鐘錶匠」', note: '掛鐘 4:25，慢 15 分鐘' },
      { kind: 'coin', at: 'p', label: '撿起：一支懷錶', title: '月台上的懷錶', text: '指著 <b>5:05</b>。錶蓋內側刻著：「快二十五分鐘，送給總是遲到的徒弟。」', note: '懷錶 5:05，快 25 分鐘' },
      { kind: 'clock', at: 'u', label: '看鬧鐘', title: '售票機上的鬧鐘', text: '指著 <b>4:10</b>。底下貼著：「慢半小時。我那天就是被它害的。」', note: '鬧鐘 4:10，慢 30 分鐘' },
    ],
    device: { kind: 'console', at: 'spot:timetable', name: '鐘錶匠的工作台', label: '把指針裝回去', prompt: '工作台上放著一支沒有指針的錶，旁邊壓著一張紙：「替我把真正的時間裝回去。」<br>真正的時間是？', options: ['4:25', '5:05', '4:10', '4:40', '4:55'], answer: '4:40', locked: '工作台上放著一支沒有指針的錶。站裡的鐘，每一個都說了一點謊。' },
    wrongText: '指針一裝上去就開始倒轉。工作台底下傳來一聲很老的嘆氣。',
    after: { text: '指針停在 4:40，開始滴答滴答地走。工作台的抽屜自己打開了，裡面有一張 1998 年的末班車車票，和一張紙條。', options: [
      { label: '讀紙條', text: '「我修了一輩子的鐘，每一個都故意調得不準，好讓別人不用趕。那天晚上，我自己趕不上末班車。謝謝你，讓我知道現在幾點了。」', result: 'up' },
      { label: '把車票收進口袋', text: '車票摸起來是溫的。背面蓋著一個很小的印章：「準時」。', result: 'up', items: { fog_charm: 1 } },
    ] },
  }));
  // 限時解謎：四分鐘後掛斷的電話
  D('challenge', 'x02', K => ({
    base: 'puzzle', title: '限時：四分鐘後掛斷的電話', hint: '公共電話一直在響。',
    timer: 240, timerText: '你一碰到線索，公共電話就響了。話筒裡的人說：「四分鐘以後，我就要掛了。」',
    clues: [
      { kind: 'note', at: 'c', title: '塞在電話簿裡的紙條', text: '「撥給我的號碼，是我們第一次約會那天的日期。你每次都記錯。」', note: '號碼＝第一次約會的日期' },
      { kind: 'photo', at: 'p', title: '月台柱子上的照片', text: '兩個年輕人在月台上比 YA。照片背面：「<b>1998.7.14</b>　第一次約會，在這一站等了一個小時。」', note: '照片：1998 年 7 月 14 日第一次約會' },
      { kind: 'paper', at: 'u', title: '電話卡的背面', text: '電話卡背面用原子筆寫著：「只撥月份和日子，四個數字。月份在前面。」', note: '只撥月、日，四碼，月份在前' },
    ],
    device: { kind: 'console', at: 'spot:phone', name: '公共電話', label: '撥號', prompt: '話筒那頭有人在等。你要撥哪一組號碼？', options: ['0714', '1407', '1998', '0417', '7140'], answer: '0714', locked: '電話在響，但話筒那頭只有雜音。<br>（站裡也許寫著該撥的號碼。）' },
    wrongText: '「……又記錯了。」話筒那頭的人苦笑，然後是一陣刺耳的雜音。',
    after: { text: '電話接通了。那頭是一個老太太的聲音：「……你終於記對了。我在這裡等了好久。」', options: [
      { label: '「他記得的。他只是不好意思說。」', text: '話筒那頭安靜了很久，然後輕輕笑了：「我知道。四十年了，我一直都知道。」電話掛上了，硬幣退幣口掉出一枚溫熱的十元。', result: 'up', items: { fog_tea: 1 } },
      { label: '把話筒輕輕掛回去', text: '你沒有說話。有些電話，接通了就夠了。', result: 'up' },
    ] },
  }));
  // 無傷挑戰
  D('challenge', 'x03', { base: 'survive', noHit: true, title: '無傷挑戰：影子之間', hint: '地上寫著：「一次都不要被碰到」。', hazard: { kind: 'shadow', count: 3, speed: 1.9, dmg: 10 }, goal: { type: 'collect', n: 4, kind: 'shard', name: '光的碎片', label: '撿起光的碎片', texts: ['影子們在你周圍轉圈，像在等你踩錯一步。', '一片光，一個舞步。', '最後一片在最暗的地方。', ''] }, doneText: '四片光都到手了。影子們停下來，像一群看完表演的觀眾，安靜地退回牆裡。' });
  // 低工具挑戰（答錯一次就很痛）：第七節車廂的目擊者
  D('challenge', 'x04', K => ({
    base: 'puzzle', title: '低工具：第七節車廂的目擊者', hint: '站務室的錄音機裡，有三段關於「第七節車廂」的證詞。', wrongDmg: 35,
    clues: [
      { kind: 'recorder', at: 'c', title: '證詞：上班族', text: '「我整晚都坐在第二節車廂，哪裡都沒去。第七節車廂？板南線只有六節，別開玩笑了。」', note: '上班族：整晚坐在第二節，沒去哪裡' },
      { kind: 'recorder', at: 'p', title: '證詞：學生', text: '「我看到那個上班族往車尾走，打開了最後一節的門——門後面，還有一節車廂。」', note: '學生：上班族走到車尾，打開了第七節的門' },
      { kind: 'recorder', at: 'u', title: '證詞：老婦人', text: '「那個學生說的是真的。我坐在她旁邊，也看到了。」', note: '老婦人：學生說的是真的' },
      { kind: 'paper', at: 'c', title: '站務員的備註', text: '錄音機旁邊的便條：「三個人之中，<b>只有一個人</b>說了謊。」', note: '三個證人裡只有一個人說謊' },
    ],
    device: { kind: 'console', at: 'spot:office', name: '站務室的錄音機', label: '指出說謊的人', prompt: '三個證人之中，只有一個人說謊。是誰？<br><small>（答錯的代價很大。）</small>', options: ['上班族', '學生', '老婦人'], answer: '上班族', locked: '錄音機：「請先聽完所有證詞。」' },
    wrongText: '如果是他說謊，就會有兩個人說謊。錄音機發出一聲長長的、像列車煞車一樣的尖叫。',
    after: { text: '錄音機自己播出了第四段錄音，是上班族的聲音，很小聲：「……對，我進去了。第七節車廂裡坐著一個人，他說他叫許文，他一直在等有人相信他。我太害怕了，所以說了謊。」', options: [
      { label: '「我相信你看到的。」', text: '錄音機安靜下來。遠處的隧道裡，好像有一節亮著燈的車廂，慢慢開過去。', result: 'up', items: { fog_charm: 1 } },
      { label: '把錄音帶取出來收好', text: '錄音帶的標籤上寫著：「第七節車廂・證詞」。也許有一天，有人需要它。', result: 'up' },
    ] },
  }));
  // 完美調查：月台上的一隻紅鞋
  D('challenge', 'x05', K => ({
    base: 'story', title: '完美調查：月台上的一隻紅鞋', hint: '服務台上放著一隻紅色的小鞋子。三個人都說是他們的。', need: 3,
    npcs: [
      { name: '撿到鞋子的站務員', at: 'c', behavior: 'watch', decides: true, look: { top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b' },
        intro: '「月台上掉了一隻紅色的小鞋子。霧來以後，有兩個人說是他們家小孩的。」他嘆氣，「只有一隻鞋，不能兩個人都給。」', lines: ['「霧裡的人，有時候會想要不屬於自己的東西。」', '「查清楚再告訴我。」'], clueLine: '（鞋子、小孩、照片——三樣都要看過。）', final: true },
      { name: '穿風衣的女人', at: 'p', behavior: 'pace', look: { girl: true, hair: 'long', hairColor: '#1a1a1a', top: '#5a4a4a', coat: true, bottom: '#2a2a2a' },
        intro: '「那是我女兒的鞋。她今天穿紅鞋出門的，我記得很清楚。」她一直沒有看你的眼睛。', lines: ['「我女兒在等我。把鞋子給我就好。」', '「你問那麼多做什麼？」'] },
      { name: '抱著孩子的父親', at: 'u', behavior: 'idle', look: { top: '#4a5a3a', bottom: '#2a2a2a' },
        intro: '「我兒子少了一隻鞋，在月台上跑丟的。」他懷裡的小男孩睡著了，一隻腳光著。', lines: ['「他哭到睡著。醒來找不到鞋子又要哭了。」'] },
    ],
    clues: [
      { kind: 'note', at: 'c', title: '紅鞋的鞋底', text: '這是一隻<b>右腳</b>的鞋，十七公分。鞋底內側用麥克筆寫著一個注音：「ㄩㄥˇ」。', note: '紅鞋：右腳、17 公分，鞋底寫「ㄩㄥˇ」' },
      { kind: 'photo', at: 'u', title: '父親懷裡的小孩', text: '小男孩光著<b>右腳</b>，左腳穿著一隻紅鞋。鞋邊用麥克筆寫著「小勇」。', note: '父親的兒子：光著右腳，左腳的紅鞋寫「小勇」' },
      { kind: 'recorder', at: 'p', title: '女人掉的手機', text: '手機桌布是一個穿<b>藍色雨鞋</b>的小女孩，照片日期是今天早上。最近一則訊息：「我先去找一雙紅鞋。」', note: '女人的女兒今天穿藍色雨鞋' },
    ],
    final: { text: '站務員：「所以，鞋子是誰的？」', options: [
      { label: '還給抱著孩子的父親：鞋底的「ㄩㄥˇ」就是小勇。', result: 'perfect', text: '父親把鞋子套回兒子的右腳，小男孩在夢裡笑了一下。穿風衣的女人看著你，嘴角抽動了一下，轉身走進霧裡——地上留下一灘水，是藍色的。', items: { fog_tea: 1 } },
      { label: '交給站務員保管，等天亮再說。', result: 'good', text: '「也好。」站務員把鞋子收進抽屜。天亮以後，真正的主人會來領——如果霧肯讓他們等到天亮的話。' },
      { label: '還給穿風衣的女人。', result: 'bad', text: '女人接過鞋子，笑得很溫柔。鞋子在她手裡化成一灘紅色的水。「謝謝。這樣，就有人陪我女兒了。」', hurt: 22, why: '女人的手像冰一樣冷' },
    ] },
  }));
  // 連續事件：守夜人的最後一盞燈
  D('challenge', 'x06', K => ({ base: 'chain', title: '連續：守夜人的最後一盞燈', steps: [
    { base: 'story', title: '守夜人的最後一盞燈', hint: '有個老站務員提著鑰匙串，在大廳裡找東西。', need: 2, intro: '',
      npc: { name: '守夜的老站務員', at: 'c', behavior: 'wander', speed: .5, look: { old: true, hairColor: '#d0d0d0', top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b' },
        intro: '「今晚是我最後一次值大夜班，明天就退休了。」老站務員笑著說，「我想好好巡最後一圈。可是手電筒和總開關的鑰匙，不知道放到哪裡去了。」',
        lines: ['「三十二年，每天晚上巡兩次。」', '「這座站的每一盞燈，我都知道它什麼時候會壞。」', '「巡完最後一圈，我要親手把燈關掉。」'], clueLine: '（幫他找手電筒和總開關的鑰匙。）' },
      clues: [
        { kind: 'lamp', at: 'p', label: '撿起：一支老手電筒', title: '巡夜手電筒', text: '手電筒的握把被磨得發亮，貼著一張貼紙：「1993—」，後面還沒寫。', note: '手電筒：「1993—」' },
        { kind: 'coin', at: 'u', label: '撿起：一把鑰匙', title: '總開關的鑰匙', text: '鑰匙上的塑膠牌寫著「配電室・總開關」。牌子背面有一行小字：「關燈以前，確認站裡沒有人。」', note: '總開關鑰匙：「關燈前確認站裡沒有人」' },
      ],
      final: { text: '「都找到了。」老站務員握著手電筒，「陪我巡最後一圈，好嗎？」', options: [
        { label: '「好，我陪你。」', result: 'perfect', text: '你們走完了最後一圈。他在配電室門口停下來：「確認站裡沒有人——除了你。」他笑了，轉動鑰匙。' },
        { label: '「你該下班了。剩下的我來巡。」', result: 'good', text: '他愣了一下，把手電筒交給你：「那……拜託你了。」他轉身走向配電室。' },
        { label: '「這種事，交給明天的人就好。」', result: 'bad', text: '他的笑容僵了一下。「也是。」他一個人走向配電室，背影很小。', hurt: 6, why: '霧裡有什麼東西擦過你的臉' },
      ] } },
    { base: 'survive', intro: '總開關被轉下去的那一刻，全站的燈一起熄了。黑暗裡，老站務員的聲音說：「糟了……不是這個開關。備用燈泡在站裡，快！」', dark: true, hazard: { kind: 'ghost', count: 2, speed: 1.6, dmg: 14 },
      goal: { type: 'collect', n: 3, kind: 'lamp', name: '備用燈泡', label: '撿起備用燈泡', texts: ['燈泡上貼著一張貼紙：「第一盞，1993」。', '黑暗裡，有一束手電筒的光在幫你照路。', ''] },
      doneText: '最後一顆燈泡亮起來的時候，大廳裡只剩下你。配電室的門上，掛著一支手電筒，貼紙上寫著：「1993—今天」。' },
  ] }));
  // 隨機路線
  D('challenge', 'x07', K => ({ base: 'survive', title: '隨機路線', hint: '記號每次出現的地方都不一樣。', hazard: { kind: 'shadow', count: 2, speed: 2.0, dmg: 14 }, goal: { type: 'reach', n: 6, kind: 'symbol', name: '記號', label: '碰觸記號', texts: ['下一個記號亮起來了，在你沒想到的地方。', '這條路沒有地圖。', '霧在你背後把走過的路擦掉。', '影子開始學你的路線。', '只剩一個。', ''] }, doneText: '你走完了霧畫出來的路。' }));
  // 無聲調查
  D('challenge', 'x08', { base: 'survive', title: '無聲調查', hint: '保持安靜。不要跑。', hazard: { kind: 'ghost', count: 4, speed: 3.2, dmg: 20, mode: 'sound', why: '你的腳步聲被聽見了' }, goal: { type: 'collect', n: 3, kind: 'recorder', name: '錄音', label: '輕輕撿起錄音', texts: ['「噓。」', '「它們看不見，只聽得見。」', '「謝謝你這麼安靜。」'] } });
  // 記憶挑戰
  D('challenge', 'x09', K => ({ base: 'memory', title: '記憶挑戰', at: 'c',
    scene: '監視器畫面：<br>・月台上有 <b>3</b> 個人。<br>・最左邊的人撐著一把 <b>紅色</b> 的傘。<br>・時鐘指著 <b>2:15</b>。<br>・中間的人手上拿著一顆 <b>蘋果</b>。<br>・右邊的人戴著 <b>眼鏡</b>。',
    questions: [
      { q: '月台上有幾個人？', o: ['2', '3', '4', '5'], a: '3' },
      { q: '傘是什麼顏色？', o: ['黑色', '紅色', '黃色', '透明'], a: '紅色' },
      { q: '時鐘指著幾點？', o: ['1:15', '2:15', '2:50', '3:15'], a: '2:15' },
      { q: '中間的人拿著什麼？', o: ['蘋果', '書', '車票', '手機'], a: '蘋果' },
    ] }));
  // 反向調查：先看到結果
  D('challenge', 'x10', K => ({ base: 'puzzle', title: '反向調查', hint: '月台上倒著一個人型的粉筆線。',
    clues: [
      { kind: 'stain', at: 'p', title: '粉筆線', text: '月台上畫著一個人型的粉筆線，旁邊散著打翻的咖啡。這是「結果」。', note: '結果：人型粉筆線、打翻的咖啡' },
      { kind: 'note', at: 'c', title: '咖啡店收據', text: '「熱美式 ×1，00:12」。收據背面寫：「好睏」。', note: '00:12 買了熱咖啡，「好睏」' },
      { kind: 'photo', at: 'u', title: '照片', text: '一個人坐在月台長椅上睡著了，咖啡放在腳邊。', note: '照片：在長椅上睡著了' },
    ],
    device: { kind: 'console', at: 'spot:office', name: '站務室電腦', label: '提交推論', prompt: '粉筆線的人，發生了什麼事？', options: ['睡著了，被人移到地上量體溫', '被列車撞了', '被推倒了', '是霧做的假人'], answer: '睡著了，被人移到地上量體溫', locked: '電腦：「請先倒推出原因」。' },
    openText: '電腦：「正確。那個人只是睡著了。站務員以為他昏倒，叫了救護車。他醒來的時候很不好意思。」<br>有時候，最可怕的結果，原因很普通。' }));
  // 神祕商人
  D('challenge', 'x11', { base: 'trade', title: '神祕商人', name: '戴面具的商人', hint: '大廳多了一個攤位，攤位上的東西在發光。', text: '「稀有的東西，只賣給在霧裡還站得住的人。」', goods: [
    { id: 'fog_charm', gold: 1 }, { id: 'mistticket', gold: 1 }, { name: '霧之瓶', icon: '🫙', gold: 3, col: true }, { name: '1987 年的末班車票', icon: '🎟️', gold: 4, col: true },
  ] });
  // 臨時販賣機
  D('challenge', 'x12', { base: 'trade', title: '臨時販賣機', name: '會說話的販賣機', role: '臨時販賣機', look: { top: '#c42a2a', bottom: '#c42a2a', hat: 'cap', hatColor: '#c42a2a', height: 1.15 }, hint: '大廳多了一台不認識的販賣機。', text: '「歡迎光臨。本機只在霧裡營業。」（螢幕上的笑臉眨了眨眼）', goods: [
    { id: 'fog_tea', gold: 1 }, { id: 'fog_salt', gold: 1 }, { name: '霧口味汽水', icon: '🥤', gold: 2, col: true }, { name: '隨機膠囊', icon: '💊', gold: 2, col: true },
  ] });
  // 交換物品的陌生人（N17）
  D('challenge', 'x13', { base: 'trade', title: '交換物品的陌生人', name: '揹著大布袋的陌生人', role: '想交換東西', look: { top: '#6a5a3a', coat: true, bottom: '#3a3a2a', hat: 'beanie', hatColor: '#4a4a3a' }, hint: '有個揹著大布袋的人在大廳角落。', text: '「我不收錢，也不收黃金。我只交換。」', goods: [
    { swap: true, label: '拿一樣普通東西換「霧裡的情報」', run: K => { K.clue('陌生人的情報：每一站的霧，都會在 05:30 開一扇門。'); K.toast('<b>換到情報</b><span>記在霧中筆記裡了。</span>'); } },
    { swap: true, label: '拿一樣普通東西換平安符', run: K => { Game.state.inv.fog_charm = (Game.state.inv.fog_charm || 0) + 1; saveState(); K.toast('<b>換到 🧧 平安符</b>'); } },
  ] });
  // 神祕售票員（N23）
  D('challenge', 'x14', { base: 'trade', title: '神祕售票員', name: '穿舊制服的售票員', role: '神祕售票員', look: { top: '#e9edf2', pattern: 'uniform', accent: '#8a1a1a', bottom: '#1f2a3a', hat: 'cap', hatColor: '#8a1a1a', old: true }, at: 'u', hint: '售票機旁邊站著一個售票員。這年頭已經沒有人工售票了。', text: '「要買票嗎？這些票，普通的售票機不會賣。」', goods: [
    { id: 'mistticket', gold: 2 }, { name: '往如月的車票', icon: '🎫', gold: 2, col: true }, { name: '往霧的定期票', icon: '🎫', gold: 4, col: true }, { name: '首班車的車票', icon: '🎫', gold: 1, col: true },
  ] });
  // 要求保密的人（N20）
  D('challenge', 'x15', K => ({
    base: 'story', title: '要求保密的人', hint: '有人塞了一樣東西給你。', need: 1,
    npcs: [
      { name: '戴兜帽的人', at: 'c', behavior: 'pace', decides: true, look: { top: '#2a2a2a', coat: true, bottom: '#1a1a1a', hat: 'beanie', hatColor: '#1a1a1a' }, intro: '「拿著。」他把一個小布包塞給你。「不要讓穿白衣服的人知道你有這個。」', lines: ['「她在找這個。」', '「布包裡的東西，是她的。可是不能還給她。」'], clueLine: '（布包裡是什麼？穿白衣服的人是誰？）' },
      { name: '穿白衣服的女人', at: 'p', behavior: 'wander', speed: .5, look: { girl: true, hair: 'long', hairColor: '#0a0a0a', top: '#f0f0f0', bottom: '#f0f0f0', skirt: true }, intro: '「你有沒有看到一個小布包？」她的聲音很溫柔。「裡面是我的名字。」', lines: ['「拿到名字，我就可以離開這裡了。」', '「他不讓我走。」'] },
    ],
    clues: [{ kind: 'note', at: 'u', title: '布包裡的紙', text: '一張紙，寫著一個名字。紙的背面寫：「名字還給她，她就會帶走一個人當替身。」', note: '名字還給她，她會帶走一個替身' }],
    final: { text: '戴兜帽的人：「你決定好了嗎？」', options: [
      { label: '保密，把布包還給戴兜帽的人。', result: 'perfect', text: '「謝謝。」他把布包收進懷裡。「她會再等一晚。總有一天，我會找到不需要替身的方法。」' },
      { label: '把名字還給穿白衣服的女人。', result: 'bad', text: '她接過名字，笑了。然後她看著你：「……那，就你吧。」你用盡全力才掙脫。', hurt: 30, why: '差點成為替身' },
      { label: '燒掉布包。', result: 'good', text: '布包燒起來，兩個人同時尖叫，然後都消失了。你不知道這樣對不對。' },
    ] },
  }));

  /* ══════════ 第八大類：隱藏任務（12） ══════════ */
  const H = (key, title, trigger, story, o = {}) => D('hidden', key, { base: 'hidden', title, trigger, story, ...o });
  H('h01', '所有時鐘同時停止', { type: 'idle', spot: 'timetable', sec: 25 }, [
    { who: '時刻表', text: '你在時刻表前站了很久。突然，站裡所有的時鐘同時停了——秒針停在同一個位置。' },
    { who: '？？？', text: '一個聲音從時刻表後面傳來：「你是第一個願意停下來的人。大家都在趕時間，只有你在等。」' },
    { who: '？？？', text: '「這座車站的時間，在 1987 年停過一次。今天，換你讓它停一次。」時鐘又開始走了。' },
  ], { gold: 1 });
  H('h02', '重複出現的公告', { type: 'spot', spot: 'notice', n: 4, title: '告示牌', texts: ['告示牌：「末班車已開走」。', '告示牌：「末班車已開走。請勿在月台逗留」。', '告示牌：「末班車已開走。請勿在月台逗留。他還在月台上」。'] }, [
    { who: '告示牌', text: '第四次看告示牌，上面的字變成：「末班車已開走。請勿在月台逗留。他還在月台上。謝謝你一直來看我。」' },
    { who: '？？？', text: '告示牌後面掉出一張舊照片：一個站務員對著告示牌敬禮。照片背面寫著：「每天都要確認公告有沒有貼好。」' },
  ], { gold: 1 });
  H('h03', '走到每一個盡頭', { type: 'ends' }, [
    { who: '月台盡頭', text: '你走過了每一座月台的兩端。最後一個盡頭的牆上，有一道你剛剛沒看到的門。' },
    { who: '？？？', text: '門的另一邊是一座小小的月台，只有一張長椅。長椅上放著一頂紅色貝雷帽。' },
    { who: '秀蔅的聲音', text: '「你找到了。這是我第一次等車的地方。」' },
  ], { gold: 2 });
  H('h04', '所有人看向同一個方向', { type: 'talkall' }, [
    { who: '霧裡的人們', text: '你和霧裡每一個人都說過話之後——他們同時安靜下來，同時轉身，看向同一個方向：隧道。' },
    { who: '？？？', text: '隧道裡亮起一盞燈，慢慢靠近。不是列車，是一個提著燈的人。他們全都向她鞠躬。' },
    { who: '提燈的人', text: '「謝謝你陪他們說話。很久沒有人這樣做了。」她把燈舉高，所有人都消失了。' },
  ], { gold: 2 });
  H('h05', '所有列車同時到站', { type: 'minute', m: 4 }, [
    { who: '廣播', text: '在某一分鐘的尾數是「4」的時候，你站在月台上。四面八方同時響起進站音樂。' },
    { who: '？？？', text: '每一條軌道上都停滿了列車，車廂裡沒有人。車門同時打開，同時關上。' },
    { who: '廣播', text: '「本日所有列車，已全數到站。」然後，全部消失。' },
  ], { gold: 1 });
  H('h06', '上下樓梯的人', { type: 'escalator', n: 8 }, [
    { who: '手扶梯', text: '你在月台和大廳之間上上下下了好多次。第八次的時候，手扶梯對面有一個人，跟你同時上、同時下。' },
    { who: '？？？', text: '你們在手扶梯中間擦身而過。那個人小聲說：「你也在找出口嗎？出口在第九次。」' },
    { who: '？？？', text: '第九次，手扶梯的盡頭不是大廳，是一片很亮的霧。你往前一步，又回到了大廳。手裡多了一張紙條：「下次見。」' },
  ], { gold: 1 });
  H('h07', '照亮角落的人', { type: 'lampcorner', at: 'pend' }, [
    { who: '霧燈', text: '你把霧燈照向月台盡頭的角落。牆上浮現出很多手印，大大小小，排成一列。' },
    { who: '？？？', text: '手印的最後一個，是空的輪廓，大小剛好是你的手。' },
    { who: '？？？', text: '你把手放上去。牆是溫的。有人在牆的另一邊，也把手放了上來。' },
  ], { gold: 2 });
  H('h08', '帶著車票的人', { type: 'item', item: 'mistticket', zone: 'platform' }, [
    { who: '霧中車票', text: '你帶著霧中車票走上月台。車票在口袋裡發燙。' },
    { who: '車票', text: '站名欄浮現出字：「本站」。也就是說——你等的車，就是這一站。' },
    { who: '？？？', text: '月台的地板上，浮現出一行字：「你已經到了。不用再等了。」' },
  ], { gold: 1 });
  H('h09', '安靜的人', { type: 'noclue', sec: 200 }, [
    { who: '霧', text: '你很久都沒有說話，也沒有碰任何東西。站裡變得非常安靜。' },
    { who: '？？？', text: '在安靜裡，你聽見了一首歌——有人在很遠的地方哼著〈00:30〉。' },
    { who: '？？？', text: '歌的最後一句是：「天亮的時候，記得醒來。」' },
  ], { gold: 1 });
  H('h10', '空白的車票', { type: 'blankticket', at: 'pend' }, [
    { who: '提燈的攤販', text: '攤販看到空白車票，臉色變了。「……你從哪裡撿到的？」' },
    { who: '提燈的攤販', text: '「這是『還沒決定目的地的人』的車票。只有真的不知道要去哪裡的人，才撿得到。」' },
    { who: '提燈的攤販', text: '他在車票上寫了一個字，還給你：「家」。「去吧。」' },
  ], { gold: 2 });
  H('h11', '打給過去的電話', { type: 'spot', spot: 'phone', n: 3, title: '公共電話', texts: ['嘟——嘟——沒有人接。', '嘟——嘟——……有人接起來了，但是不說話。'] }, [
    { who: '公共電話', text: '第三次，電話那頭是一個小孩的聲音：「喂？是爸爸嗎？」' },
    { who: '小孩', text: '「爸爸你什麼時候回家？媽媽說你在捷運站加班。」' },
    { who: '小孩', text: '你說你不是爸爸。小孩安靜了一下：「……那你可以幫我跟他說，我們等他吃飯嗎？」電話斷了。' },
  ], { gold: 1 });
  H('h12', '短暫顯現的出口', { type: 'spot', spot: 'areamap', n: 3, title: '車站周邊地圖', texts: ['周邊地圖上，本站的出口數量好像多了一個。', '多出來的出口在閃爍，標著「0 號出口」。'] }, [
    { who: '周邊地圖', text: '第三次看地圖，「0 號出口」亮了起來，畫著一條路——通往地圖外面。' },
    { who: '？？？', text: '你回頭，非付費區的牆上真的出現了一扇門，上面寫著「0」。門只開了一秒，又消失了。' },
    { who: '？？？', text: '門關上前，你看到門外是白天。' },
  ], { gold: 2, onTrigger: K => K.exitDoor(null, 'hidden0') });

  /* ══════════ 第九大類：列車事件（10）：月台上停著一班不會開的車 ══════════ */
  D('trainev', 't01', K => ({ base: 'trainev', sub: 'collect', title: '沒有乘客的列車', lcd: '往 　　　', hint: '月台上停著一班空車，車門一直開著。',
    ...{ set: 't01', setName: '空車裡的遺留物', icon: '🚃', complete: '每一節車廂都撿過了。車廂的燈閃了兩下，好像在說謝謝。', items: [
      { name: '一隻手套', kind: 'bag', text: '小孩的手套，另一隻不知道在哪裡。' },
      { name: '一本讀到一半的書', kind: 'paper', text: '書籤夾在第 87 頁。這一頁的最後一句：「列車在霧裡停了下來。」' },
      { name: '一張便當收據', kind: 'note', text: '「排骨便當 ×1，23:42」。' },
      { name: '一副耳機', kind: 'recorder', hidden: true, text: '耳機裡還在播歌，是〈00:30〉。' },
    ] }, base: 'trainev', collectBase: true }));
  D('trainev', 't02', K => ({ base: 'trainev', sub: 'story', title: '滿載的透明乘客', lcd: '往 ＿＿', hint: '月台上停著一班客滿的列車……再看一次，座位是空的。', need: 2,
    npc: { name: '唯一真實的乘客', at: 'train', behavior: 'sit', look: { girl: true, hair: 'bun', top: '#6a8a6a', bottom: '#3a3a3a' },
      intro: '「你也看得到他們嗎？這些人，每天晚上都坐在這班車上。」她看著四周空蕩蕩的座位。「只有我是活的。我下不了車。」',
      lines: ['「每次車門打開，我走到門口，就會回到座位上。」', '「他們不壞，只是很寂寞。」'], clueLine: '（找出她為什麼下不了車。）' },
    clues: [
      { kind: 'ticket', at: 'train', title: '她的車票', text: '車票上的終點是「下一站」。沒有站名。', note: '她的車票：終點「下一站」' },
      { kind: 'note', at: 'train', title: '座位上的紙條', text: '「要下車，必須有人在月台上叫你的名字。」', note: '要有人在月台上叫她的名字' },
      { kind: 'note', at: 'p', title: '月台上的名牌', text: '月台長椅上掉著一個名牌：「江曉雯」。', note: '名牌：江曉雯' },
    ],
    final: { text: '「你有辦法嗎？」', options: [
      { label: '走到月台上，大聲叫：「江曉雯！」', result: 'perfect', text: '她站起來，一步一步走過透明的乘客，走出車門。透明的乘客們對她揮手。' },
      { label: '「我陪妳坐到天亮。」', result: 'good', text: '你在她旁邊坐下。透明的乘客們，好像也安心了一點。' },
      { label: '把她拉下車。', result: 'bad', text: '她一出車門就消失了，又出現在座位上。透明的乘客們一起轉頭瞪著你。', hurt: 16, why: '被透明的乘客推開' },
    ] },
    setup: K2 => { for (let i = 0; i < 10; i++) { const p = FogEvents.at(K2, 'train'); const g = K2.person(K2.look(), p, { name: '透明的乘客', behavior: 'idle', speed: 0, sit: true, ghostly: .25 }); g.data.fade = true; } K2.every(() => { for (const n of K2.npcs) if (n.data.fade) n.rig.root.visible = K2.dist(n, World.player) > 2.6; }); },
  }));
  D('trainev', 't03', K => ({ base: 'trainev', sub: 'puzzle', title: '沒有終點的列車', lcd: '往 　　　　', hint: '列車的目的地顯示是空白的。',
    clues: [
      { kind: 'note', at: 'train', title: '車廂路線圖', text: '路線圖上所有的站名都被塗掉了，只剩下本站和最後一站。最後一站是「？」。', note: '路線圖只剩本站和「？」' },
      { kind: 'paper', at: 'train', title: '駕駛室的日誌', text: '「目的地由最後一位上車的乘客決定。最後一位乘客是在本站上車的，他只說了一句：『我想回到出發的地方。』」', note: '最後一位乘客：「我想回到出發的地方」' },
    ],
    device: { kind: 'console', at: 'train', name: '目的地顯示器', label: '設定目的地', prompt: '顯示器在等你輸入目的地。', options: ['本站', '霧', '如月', '家'], answer: '本站', locked: '顯示器一片空白。' },
    openText: '你輸入「本站」。列車的燈全亮了起來，車門關上又打開——它開回了原地。廣播：「本列車已抵達終點站：本站。」<br>沒有終點的列車，終於有了終點。' }));
  D('trainev', 't05', K => ({ base: 'trainev', sub: 'collect', title: '多出一節車廂', lcd: '往 ＿＿＿', hint: '這班車……好像比平常多了一節。',
    set: 't05', setName: '第四節車廂的東西', icon: '🚃', complete: '第四節車廂的門關上了，再也打不開。你數了數，列車只剩三節。', items: [
      { name: '舊式吊環', kind: 'coin', text: '1996 年的吊環，皮革已經裂開。' },
      { name: '褪色的廣告', kind: 'paper', text: '「歡迎搭乘木柵線」。' },
      { name: '車廂編號牌', kind: 'note', hidden: true, text: '「第 4 節」。可是這種車只有三節。' },
    ] }));
  D('trainev', 't06', K => ({ base: 'trainev', sub: 'puzzle', title: '車窗倒影', lcd: '往 　　', hint: '車窗裡的倒影，和車廂裡不一樣。',
    clues: [
      { kind: 'note', at: 'train', label: '看車窗', title: '第一扇車窗', text: '倒影裡，座位上坐著一個老人。現實的座位是空的。', note: '倒影一：座位上有老人' },
      { kind: 'note', at: 'train', label: '看車窗', title: '第二扇車窗', text: '倒影裡，老人站起來了，手指著門口。', note: '倒影二：老人指著門口' },
      { kind: 'note', at: 'train', label: '看車窗', title: '第三扇車窗', text: '倒影裡，門口站著你。老人在你背後，舉起帽子，好像在等你回頭跟他打招呼。', note: '倒影三：老人在你背後，舉著帽子等你打招呼' },
    ],
    device: { kind: 'console', at: 'train', name: '車門', label: '面對車門', prompt: '倒影裡的老人站在你背後。你要怎麼做？', options: ['轉身跟他打招呼', '不要回頭，直接下車', '閉上眼睛'], answer: '轉身跟他打招呼', wrongDmg: 14, wrongWhy: '背後的東西推了你一把', locked: '車門沒有反應。' },
    openText: '你轉身。背後什麼都沒有——可是車窗裡，老人對你微笑，舉起帽子致意，然後消失了。' }));
  D('trainev', 't09', K => ({ base: 'trainev', sub: 'story', title: '遺失物列車', lcd: '遺失物專車', hint: '一班列車停在月台，車上堆滿了遺失物。', need: 3,
    npc: { name: '遺失物列車的車掌', at: 'train', behavior: 'watch', look: { top: '#2a3a5a', pattern: 'uniform', accent: '#c8a040', bottom: '#1a2a3a', hat: 'cap', hatColor: '#2a3a5a', old: true },
      intro: '「這班車專門載遺失物。每樣東西都在等主人。你可以幫我送幾樣嗎？」', lines: ['「車上的東西，都有自己的故事。」', '「主人就在這一站。」'], clueLine: '（車上和站裡都有東西在等。）' },
    clues: [
      { kind: 'umbrella', at: 'train', title: '一把小傘', text: '標籤：「失主：在大廳等雨停的女孩」。', note: '小傘→大廳等雨停的女孩' },
      { kind: 'bag', at: 'train', title: '一個便當袋', text: '標籤：「失主：月台上的老先生，他還沒吃晚餐」。', note: '便當袋→月台上沒吃晚餐的老先生' },
      { kind: 'photo', at: 'train', title: '一張全家福', text: '標籤：「失主：車掌本人」。照片上的車掌年輕很多，抱著一個嬰兒。', note: '全家福→車掌本人' },
    ],
    final: { text: '車掌：「都找到了嗎？」', options: [
      { label: '把全家福還給車掌：「這是你的。」', result: 'perfect', text: '車掌接過照片，手在發抖。「……我一直在幫別人找東西，忘了自己也弄丟了東西。」他摘下帽子，第一次走下了列車。' },
      { label: '「其他東西我會幫你送。」', result: 'good', text: '「謝謝。」車掌把東西一樣一樣交給你。' },
      { label: '「這些都是沒人要的東西。」', result: 'bad', text: '車上所有的遺失物同時掉在地上，發出很大的聲響。', hurt: 10 },
    ] } }));
  D('trainev', 't10', K => ({ base: 'trainev', sub: 'puzzle', title: '乘客名單', lcd: '往 　　', hint: '車門旁貼著一張乘客名單。',
    clues: [
      { kind: 'paper', at: 'p', label: '看乘客名單', title: '乘客名單', text: '「1. 王大明（第一節）　2. 李小花（第二節）　3. 陳阿土（第三節）　4. 你（第四節）」', note: '名單：王大明、李小花、陳阿土、你（第四節）' },
      { kind: 'note', at: 'train', title: '第一節車廂', text: '座位上放著王大明的公事包。', note: '第一節：王大明的公事包' },
      { kind: 'note', at: 'train', title: '第二節車廂', text: '座位上放著李小花的書包。', note: '第二節：李小花的書包' },
      { kind: 'note', at: 'train', title: '第三節車廂', text: '座位上放著陳阿土的斗笠。再往後就是駕駛室的門——這班車，只有三節。', note: '第三節：陳阿土的斗笠；列車只有三節' },
    ],
    device: { kind: 'console', at: 'train', name: '車掌室的對講機', label: '回報', prompt: '名單上有一個人根本不存在。是誰？', options: ['王大明', '李小花', '陳阿土', '你'], answer: '你', wrongDmg: 12, locked: '對講機：「請確認乘客名單」。' },
    openText: '對講機：「確認。第四節車廂不存在，所以名單上的『你』也不存在。……那麼，現在站在這裡的，是誰呢？」<br>你把名單撕下來。你還在。' }));
  D('trainev', 't12', K => ({ base: 'trainev', sub: 'survive', title: '廣播中的求救', lcd: '往 ＿＿＿', hint: '車廂裡傳出微弱的求救聲。',
    hazard: { kind: 'ghost', count: 2, speed: 1.6, dmg: 14, at: 'p' }, goal: { type: 'reach', path: ['train', 'train', 'train'], kind: 'radio', name: '聲音的來源', label: '靠近聲音', texts: ['「救命……在後面……」', '「再後面一點……」', '「……謝謝你來。」'] }, doneText: '最後一節車廂的角落，有一台還開著的對講機。求救的人很久以前就獲救了，只是對講機一直沒有關。你把它關掉。' }));
  D('trainev', 't13', K => ({ base: 'trainev', sub: 'story', title: '記憶車廂', lcd: '往 從前', hint: '列車的目的地寫著「從前」。', need: 3,
    npc: { name: '車廂裡的女人', at: 'train', behavior: 'sit', look: { girl: true, hair: 'long', top: '#d8b8a8', bottom: '#5a4a4a' },
      intro: '「這節車廂會播放我的回憶。你要看嗎？」窗外的風景變成了二十年前的台北。', lines: ['「那天我在這班車上，遇見了他。」', '「我們一起搭了十年。」'], clueLine: '（車窗裡有她的回憶。）' },
    clues: [
      { kind: 'note', at: 'train', label: '看車窗', title: '回憶（一）', text: '車窗裡：兩個年輕人在擁擠的車廂裡被擠在一起，不好意思地笑了。', note: '回憶一：在擁擠的車廂裡相遇' },
      { kind: 'note', at: 'train', label: '看車窗', title: '回憶（二）', text: '車窗裡：他在這節車廂裡求婚，全車的乘客都在鼓掌。', note: '回憶二：在車廂裡求婚' },
      { kind: 'note', at: 'train', label: '看車窗', title: '回憶（三）', text: '車窗裡：她一個人坐在這個位置，旁邊的座位放著一束花。', note: '回憶三：她一個人，旁邊放著花' },
    ],
    final: { text: '「你看完了。……你覺得，我該讓這節車廂開走嗎？」', options: [
      { label: '「讓它開走吧。回憶會一直在妳心裡。」', result: 'perfect', text: '她點點頭，站起來走出車廂。車廂的燈熄了，窗外的舊台北慢慢褪色。她在月台上回頭，笑了。' },
      { label: '「妳可以再看一次。」', result: 'good', text: '她又坐了一會兒，看著車窗。「好，再一次就好。」' },
      { label: '把窗簾拉下來。', result: 'bad', text: '「不要！」她的尖叫讓所有車窗都裂開了。', hurt: 15, why: '車窗玻璃碎片' },
    ] } }));
  D('trainev', 't19', K => ({ base: 'trainev', sub: 'puzzle', title: '車廂重播', lcd: '往 （重播）', hint: '你走過這節車廂……又走進了同一節車廂。',
    clues: [
      { kind: 'note', at: 'train', title: '第一次的車廂', text: '吊環 12 個，座位上有一份報紙，廣告是牙膏。', note: '第一次：吊環 12、報紙、牙膏廣告' },
      { kind: 'note', at: 'train', title: '第二次的車廂', text: '吊環 12 個，座位上有一份報紙，廣告是……一張臉。', note: '第二次：廣告變成一張臉' },
      { kind: 'note', at: 'train', title: '第三次的車廂', text: '吊環 13 個。多出來的那個吊環上，掛著一隻手。', note: '第三次：多了一個吊環，掛著一隻手' },
    ],
    device: { kind: 'console', at: 'train', name: '緊急對講機', label: '回報異常', prompt: '每次重播都有東西不一樣。最危險的是哪一個？', options: ['報紙', '廣告的臉', '多出來的吊環'], answer: '多出來的吊環', wrongDmg: 14, locked: '對講機只有雜音。' },
    openText: '你回報「多出來的吊環」。吊環啪地斷掉，那隻手縮回了天花板。車廂終於不再重播了。' }));
  /* ══════════ 霧夜短篇：名字、開場、結局 ══════════ */
  FogEvents.tale({
    // 站內解謎
    p01: { name: '三段廣播的密碼', intro: '霧來以後，這一站的廣播開始自己說話。月台、大廳、出口，三個喇叭各唸了一個數字，像是有人想透過廣播傳一句話出去。<br>站務室的廣播主機上了鎖，密碼就藏在那三段廣播裡。',
      end: { perfect: '後來有人說，那一夜全城的捷運站都聽到了同一句廣播：「天快亮了。」只有你知道，是從哪一站發出去的。', good: '廣播主機安靜下來了。你按錯了幾次，但最後，那句話還是傳了出去。' } },
    p02: { name: '走錯時間的三座鐘', intro: '這一站的三座時鐘各走各的：一座倒著走，一座太快，一座太慢。總時鐘停住了，旁邊寫著：「找出真正的時間」。<br>只要讓時間重新走動，困在這一站的什麼東西，就能去下一站。',
      end: { perfect: '時鐘重新開始滴答作響。玻璃後面的那個人說他要去下一站了——你不知道他等了多久，但從今天起，他不用再算時間了。', good: '時間被你撥對了，雖然繞了一點路。總時鐘的秒針走得有點不情願，但它在走。' } },
    p03: K => ({ name: '答案就是這一站', intro: `非付費區有一排置物櫃，其中一格的門上寫著：「答案就是這一站」。<br>櫃子裡好像有東西在等你——一個寫著你名字的信封。這一站的站碼、這一站有幾條路線，霧都知道。`,
      end: { perfect: `信封裡是${K.station}的老照片。你把它翻過來，背面寫著：「你一定會來。」字跡是你自己的。`, good: '密碼試了幾次才對。櫃門打開時發出的聲音，像是有人鬆了一口氣。' } }),
    p04: { name: '一年掉一樣東西的人', intro: '失物招領處的架子上空了四格。四件失物散在站裡：一把傘、一個背包、一枚戒指、一張照片，每一件都貼著標籤，寫著它被找到的順序。<br>把它們依序放回去，失主的故事才會出現。',
      end: '她在這一站等了四年，每年掉一樣東西，希望有人撿到會想起她。今年，終於有人把四樣東西排好了。架子最上層，多了一張寫著「謝謝」的便條。' },
    p06: { name: '不存在的第七號出口', intro: '大廳的路線圖有三個錯誤：一條線被畫成圓圈、一個終點站寫成「霧」、還有一個不存在的第七號出口。<br>人會畫錯線，但有一個錯誤不是人畫的。路線查詢機在等你找出來。',
      end: { perfect: '「第七號出口　單程」。那張票你一直沒捨得用。聽說第七號出口只在霧夜出現，通往一個天亮前的地方。', good: '你猜了幾次，查詢機才肯印票。票是半透明的，好像還在猶豫要不要讓你走。' } },
    p08: { name: '尾巴打結的三隻貓', intro: '非付費區的置物櫃裡有手機在響，一直響，一直響。櫃門上畫著一隻醜醜的貓。<br>牆上、月台上、售票機上，有人用三隻貓留下了密碼。',
      end: { perfect: '鈴聲停了以後，你在置物櫃底下發現一張貓的塗鴉，旁邊寫著：「這是我小時候畫的。謝謝你接起來，或掛掉。」', good: '密碼錯了幾次，鈴聲越來越急。最後櫃門打開時，你的手還在發抖。' } },
    p09: { name: '往如月的碎車票', intro: '售票機前的地上散著一張被撕碎的車票。三片碎片分在站裡三個地方，像是有人不想讓它被拼回來——又不忍心丟掉。<br>拼好它，就知道它要去哪裡。',
      end: { perfect: '如月。一個不在任何路線上的站名。你決定把這個名字記在心裡，但不要在霧夜裡唸出來。', good: '車票拼歪了一點，但站名還看得清楚。你開始覺得，有人在等這張票被拼好。' } },
    p10: { name: '誰在 1:00 說了謊', intro: '站務室的電腦裡存著三段證詞，都是關於凌晨一點，這一站發生的事。三個人之中，只有一個人說了謊。<br>聽完三段錄音，你就知道誰不在他說的地方。',
      end: { perfect: 'A 沒有臉。他看到的那個 B，可能也不是 B。這一站的霧夜，從來就不只有活人在。', good: '答錯的時候，電腦螢幕上每個人的照片都轉頭看你。最後你找到了說謊的人——他還在看。' } },
    p12: { name: '眨眼的號誌燈', intro: '月台的指示燈用一種奇怪的節奏閃著：短、短、長……停……像是有人困在號誌後面，用燈在說話。<br>大廳某處，應該有一張夜班站務員用的密碼表。',
      end: { perfect: 'UNL——UNLOCK，被截斷的「解鎖」。閘門全部打開了。號誌燈最後閃了一次：「· — — ·」，你查了密碼表，那個字母是 P。也許是「Please」，也許是一個人的名字。', good: '控制盤接受了你的答案，雖然你錯過幾次。閘門打開時，號誌燈像鬆了一口氣似地熄滅了。' } },
    p14: { name: '02:13 的敲門聲', intro: '站務日誌的紙頁散了一地。值夜班的人寫下了那一夜發生的事，但順序被打亂了——最後一頁停在 02:13：「有人敲站務室的門。我沒有開。」<br>把日誌排好，就看得到那一夜的全貌。',
      end: { perfect: '「03:30　敲門的人，是我自己。」你把日誌放回站務室時，門外傳來三聲很輕的敲門聲。你沒有開門——這一次，是你選擇讓他安心地等。', good: '日誌排好了。你決定不去想門外是誰，只把燈留著。' } },
    p17: { name: '有風的那扇門', intro: '非付費區多了三扇一模一樣的門，每一扇都貼著「出口」。<br>假的門後面是牆，真的門後面有風。霧夜裡的清潔員，比誰都清楚哪扇門是真的。',
      end: { perfect: '你推開乙門，冷空氣灌進來——是真的風，帶著清晨的豆漿味。', good: '你撞了一次牆才找到真的門。額頭還在痛，但風是真的。' } },
    p20: { name: '一排鞋子的四張照片', intro: '大廳的監視器螢幕上，四個畫面都是雜訊。站裡散著四張照片，記錄了一連串怪事——月台、轉頭、黑暗、一排鞋子——順序被打亂了。<br>排好它們，就知道那天晚上月台上的人去了哪裡。',
      end: { perfect: '畫面的最後一格，鞋子旁邊多了一雙你的鞋。你關掉了螢幕——有些結局，你可以不讓它發生。', good: '你排錯過一次，螢幕裡的人群就轉頭看你。最後你關掉螢幕的時候，手心全是汗。' } },

    // 生存與危險
    s01: { name: '走失的影子', intro: '你低頭，發現自己的腳下什麼都沒有。你的影子走失了——它在站裡的某個地方，而且它不想回來。<br>站裡散落著四片光的碎片。光拼齊了，影子就會被吸回來。小心，它會越來越快。',
      end: { perfect: '影子乖乖躺回你腳下，一下都沒有碰到你。回家的路上，你一直覺得它走得比你慢半拍，像在鬧彆扭。', good: '影子回來了，帶著一點傷。你也是。', bad: '影子回來了，可是有時候，它的手會比你的手早一點動。' } },
    s02: { name: '熄燈之後', intro: '燈全滅了。站務室的配電盤被人拆掉了四顆燈泡，散在站裡。<br>黑暗裡有東西在走動，它們不喜歡光。找回燈泡，把燈點亮。',
      end: { perfect: '站內的燈一盞一盞亮起來。黑暗裡的東西退回了牆縫，你一下都沒被抓到。', good: '燈亮了。你的手臂上有幾道冰冷的指痕，但你撐過去了。', bad: '燈亮了，可是有一盞燈下面，一直站著一個你看不清楚的人影。' } },
    s03: { name: '不要回頭', intro: '月台的地上寫著：「走過這裡，不要回頭。」<br>你一踏上月台，背後就響起了腳步聲。四個記號依序亮起，你得一個一個碰過去——在月台上，千萬不要轉身。',
      end: '腳步聲停了。你終於可以回頭——身後什麼都沒有，只有一排濕濕的腳印，停在你剛剛站的地方。' },
    s04: { name: '收緊的紅線', intro: '大廳地上出現了一圈紅線，正在慢慢縮小。紅線外面的霧會灼傷人。<br>傳說，只要把三枚鎮霧的銅錢放回原位，紅線就會消失。銅錢散在站裡——有些在紅線外面。',
      end: { perfect: '三枚銅錢一放回地上，紅線就像退潮一樣消失了。你連衣角都沒被燒到。', good: '紅線消失了。你的鞋底有點焦，但人沒事。', bad: '紅線消失的時候，你已經被霧燒得頭昏眼花。下次要跑快一點。' } },
    s05: { name: '三個站務員', intro: '大廳裡站著三個站務員。可是今晚值班的，只有一個人。<br>假冒的那一個在等你靠近。看清楚名牌、制服、鞋子，再決定要指認誰。',
      end: { perfect: '假的站務員像一件空衣服一樣塌下去。另外兩個站務員對看了一眼：「……原來我們之中，真的有一個不是人。」', good: '你指錯過一次，才找到真正的假冒者。被你錯怪的站務員揉著肩膀，原諒了你。', bad: '你找到了假冒者，但付出了不少代價。' } },
    s06: { name: '你動，它才動', intro: '月台上有個乘客一動也不動，像一尊雕像。可是你一動，它就動。<br>它在找三張車票。替它把車票找回來——走一步，停一下。',
      end: { perfect: '你把三張車票放在它面前。它低頭看了很久，然後鞠躬，消失了。整個過程，它一次都沒碰到你。', good: '它鞠躬的時候，你才發現自己一直憋著氣。', bad: '它收下了車票，你收下了好幾道瘀青。' } },
    s07: { name: '七分鐘後封站', intro: '廣播響起：「本站即將全面封鎖。」鐵捲門的馬達開始轉動。<br>要在封鎖前離開，你需要一張夜間通行證——它被撕成五片，散在站裡。七分鐘。',
      end: { perfect: '鐵捲門在你身後落下，你手上的通行證完整無缺。蓋在上面的名字，是一個三十年前的站務員。', good: '你在最後一刻拼好了通行證。鐵捲門擦過你的背包。', bad: '你出來了，但不太體面。' }, fail: '鐵捲門在你面前落下。廣播說：「本站已封鎖，請等待天亮。」霧把這一站整個關了起來，你只能等 05:30 的那扇門。' },
    s08: { name: '逆轉的手扶梯', intro: '手扶梯開始反方向轉動，越轉越快。有東西在手扶梯口等你。<br>它跟不上樓層的變化——在月台和大廳之間來回奔跑，碰觸亮起的記號，讓手扶梯停下來。',
      end: { perfect: '手扶梯慢慢停了下來。你一次都沒有被抓住，連扶手都沒碰到。', good: '手扶梯停了。你的腳踝有點痛，但你到了。', bad: '手扶梯停下來的時候，你整個人癱在階梯上，不想再動了。' } },
    s09: { name: '廣播在念你的名字', intro: '每隔一陣子，廣播就會開始念一個名字：「請……旅客……到……」——那是你的名字。<br>名字被念完，霧裡的東西就會知道你在哪裡。站務室旁邊的廣播主機，可以把它關掉。要關三次。',
      end: { perfect: '第三次，喇叭裡傳來一聲嘆氣，然後是一句很小聲的：「……晚安。」它再也沒有念過你的名字。', good: '你的名字被念完過一次。從那天起，有時候你會在人群裡聽見有人叫你，回頭卻沒有人。', bad: '你的名字在霧裡迴盪了好久。霧記住你了。' } },
    s10: { name: '請保持安靜', intro: '牆上貼著：「請保持安靜」。站裡有東西看不見，但聽得見——跑步的聲音會把它們引來。<br>四個鈴鐺散在站裡。把它們一起搖響，它們就會摀著耳朵離開。慢慢走。',
      end: { perfect: '四個鈴鐺同時響起。你一次都沒有被聽見，連你自己的心跳都放輕了。', good: '鈴聲響起時，它們摀著耳朵消失了。你有幾次走得太急。', bad: '你撐過去了，但耳朵到天亮都還在嗡嗡作響。' } },
    s12: { name: '只照亮一步的燈', intro: '站裡一片漆黑，只有霧燈照得到的地方，才看得見東西。有人在暗處留下了四張紙頁，寫著怎麼讓燈重新亮起來。<br>電量要省著用。暗處的東西怕光——但光也會吸引它。',
      end: { perfect: '紙頁拼起來是一張配電盤的位置圖。總開關打開的那一刻，你發現自己一直站在影子正中間，它卻從來沒碰到你。', good: '燈亮了。最後一頁紙上寫著：「你做到了。」字跡跟第一頁不一樣——像是寫的人一路陪著你。', bad: '燈亮了，可是你在暗處吃了不少苦頭。' } },
    s17: { name: '一扇一扇關上的閘門', intro: '閘門一扇一扇地關上了，只剩下幾扇還開著，而且位置一直在換。<br>趕在全部關上以前鑽過去。影子們也在找還開著的門。',
      end: { perfect: '你在最後一扇閘門關上前鑽了過去，連票卡都沒刷。', good: '你鑽過去了，背包被夾了一下。', bad: '你過去了，但閘門夾到的不只是背包。' }, fail: '最後一扇閘門在你面前關上。你被留在閘門這一邊，等霧散的門出現。' },
    s18: { name: '請往月台避難', intro: '廣播一直在說：「請往月台避難。」月台上，有東西在笑。<br>真正的避難點不在廣播說的地方。不要相信廣播，相信你自己的眼睛。',
      end: { perfect: '你一次都沒有照著廣播走。廣播最後說：「……你很聰明。」然後再也沒有出聲。', good: '你差一點就照著廣播走了。廣播最後說：「……可惜。」', bad: '你到了真正的避難點，但身上全是月台上那些東西留下的痕跡。' } },
    s19: { name: '被影子圍住的人', intro: '有人被困在月台盡頭，三個影子圍著他，他一步都動不了。<br>站裡藏著三個解除封印的銅鈴。每響一個，影子就會散開一點。',
      end: { perfect: '最後一個銅鈴響起，影子散了。被困的人向你深深鞠躬：「我被困在這裡二十年，你是第一個沒被碰到就走過來的人。」', good: '影子散了。被困的人向你道謝，然後走進霧裡。', bad: '影子散了，你卻成了被影子記住的人。' } },
    s20: { name: '最後三分鐘的燈', intro: '燈只剩下最後一點電。在燈完全熄滅以前，天花板的緊急照明不會亮。<br>撐住三分鐘。黑暗裡有東西，它們等這一刻很久了。',
      end: { perfect: '燈熄滅的瞬間，緊急照明亮了起來。你毫髮無傷，好像這三分鐘只是一場夢。', good: '緊急照明亮起來的時候，你蹲在角落，大口喘氣。你撐過去了。', bad: '你撐過去了。但那三分鐘，會是你這輩子最長的三分鐘。' } },

    // 隱藏收藏
    k01: { name: '四張不可能的車票', intro: '地上散著幾張車票，它們不屬於任何一條路線：往如月、往霧、往昨天……還有一張，只有在霧燈下才看得到。<br>把它們全部收齊，排在一起看看。',
      end: '如月 → 霧 → 昨天 → 你。四張車票排在一起，是一條路線，終點寫著你的名字。你把它們收進圖鑑最裡面的那一頁。' },
    k02: { name: '1987 年的照片', intro: '一張老照片被撕成四片，散在站裡。其中一片只有霧燈照得到。<br>照片裡有一個時鐘，指著 00:30。',
      end: '照片拼好了：1987 年，一個戴紅色貝雷帽的女孩站在月台上，回頭看著鏡頭。你認得那個表情——秀蔅。可是 1987 年，她還沒有出生。' },
    k03: { name: '隧道裡的值班錄音', intro: '站裡藏著四卷錄音帶，是一個夜班站務員留下的。他在某個霧夜追著一個人走進了隧道。<br>最後一卷，只有在霧燈下才找得到。',
      end: '四段錄音按順序播完，最後是一段很長的沉默，然後是第一班車進站的聲音。他說「不要來找我」——可是他留下了錄音，好像又希望有人聽見。' },
    k04: { name: '撿到鑰匙的人的筆記', intro: '有人在這一站撿到一把鑰匙，然後把發生的事寫進了筆記本。筆記的四頁散在站裡，最後一頁藏在暗處。',
      end: '「我把鑰匙丟進軌道了。有些門不應該打開。」最後一頁的背面，貼著一把小小的鑰匙的照片——上面刻著「第七節車廂」。' },
    k05: { name: '末班車的票價', intro: '站裡掉了幾枚奇怪的硬幣：一九八七年的、沒有年份的、穿了孔的……還有一枚透明得只有霧燈看得到。<br>它們加起來，好像剛好是某個數字。',
      end: '四枚硬幣疊在一起，剛好是一張末班車的票價。你突然明白，霧裡的人一直在等的，也許只是一個能付得起車票的人。' },
    k06: { name: '捷運標誌裡的眼睛', intro: '霧夜的這一站，牆上、柱子上、地板上、天花板上，各藏著一個發光的符號。<br>最後一個在很高的地方，要用霧燈才找得到。',
      end: '四個符號重疊起來，是這座城市的捷運標誌——只是中間多了一隻眼睛。從此以後，你搭車時總會忍不住抬頭看一眼站名牌。' },
    k11: { name: 'M00：不存在的車站', intro: '站裡散著四份文件，都蓋著同一個站碼：<b>M00</b>。施工圖、營運日報、站長名牌……最後一份，在暗處。<br>一座沒有出現在任何路線圖上的車站，留下了它的紀錄。',
      end: '四份文件描述的是同一座車站：每天 00:30 出現、06:00 消失。站長的名字是秀蔅。你把這份檔案收好——2087 年的她，也許正在找它。' },
    k12: { name: '站務員與鬼的一週', intro: '站務室的日誌掉了幾頁，從週一到週日。寫日誌的站務員，在那一週認識了一個每天坐在長椅上等末班車的人。<br>週日那一頁，藏在暗處。',
      end: '「長椅空了。我有點寂寞。」你把一週的日誌夾回去。一個站務員和一個鬼，做了七天的朋友。' },
    k15: { name: '提燈女孩的四個名字', intro: '四張碎頁散在站裡，是不同的人留下的回憶：老陳、美玲、林伯……還有一張沒有署名，只有霧燈照得到。<br>他們好像都見過同一個人。',
      end: '提燈的女孩、戴貝雷帽的站務員、多停一站上車的乘客——都是秀蔅。她在這座城市的每一個年代都出現過，只為了把散落的東西撿回來。' },
    k17: { name: '從 00:30 到 05:59 的廣播', intro: '站裡藏著四台收音機，各自停在一個時間：00:30、02:00、04:00……最後一台在暗處，停在 05:59。<br>收齊它們，就能聽完一整夜的廣播。',
      end: '「各位旅客早安。首班車即將進站。辛苦了。」一整夜的廣播，最後一句是溫柔的。你把它收進圖鑑，每次熬夜都會想起來。' },

    // 特殊挑戰
    x01: { name: '鐘錶匠的最後一班車', intro: '這一站沒有任何提示。<br>只有站裡的鐘，每一個都走得不一樣——掛鐘、懷錶、鬧鐘，每一個旁邊都留著鐘錶匠的字條。時刻表旁邊，有一張沒有指針的工作台。',
      end: { perfect: '4:40。老鐘錶匠的錶終於有了指針。他修了一輩子的鐘，故意把每一個調得不準，好讓別人不用趕——那天晚上，他自己沒趕上末班車。現在，他知道幾點了。', good: '指針倒轉了幾次，才肯停在對的地方。工作台底下的嘆氣聲，最後變成了一聲輕笑。' } },
    x02: { name: '四分鐘後掛斷的電話', intro: '公共電話一直在響。你一靠近線索，話筒裡就有人說：「四分鐘以後，我就要掛了。」<br>她在等一通電話——等一個總是記錯日子的人，撥對號碼。',
      end: { perfect: '四十年前的 7 月 14 日，有人在這一站等了一個小時。四十年後，電話終於接通了。', good: '你撥錯過，她還是等到了。話筒裡最後一句是：「沒關係，他以前也這樣。」' },
      fail: '電話掛斷了。話筒裡最後一個聲音是一聲很輕的嘆氣。公共電話再也沒有響過。' },
    x03: { name: '不能被碰到的夜', intro: '地上用粉筆寫著：「一次都不要被碰到」。三個影子在站裡跳著很慢的舞。<br>撿起四片光的碎片，跟它們跳完這支舞——不要被碰到。',
      end: { perfect: '你跳完了整支舞，一次都沒被碰到。影子們像一群看完表演的觀眾，安靜地退回牆裡。', good: '你被碰到了。舞跳完了，但不算完美。', bad: '你被碰到了。舞跳完了，但不算完美。' } },
    x04: { name: '第七節車廂的目擊者', intro: '板南線的列車只有六節。可是站務室的錄音機裡，三個證人都在說「第七節車廂」。<br>三個人之中只有一個人說謊。答錯的代價很大——想清楚再開口。',
      end: { perfect: '說謊的人其實看見了。第七節車廂裡坐著一個叫許文的人，他一直在等有人相信他。這一次，有人相信了。', good: '你在錄音機前猶豫了太久，付出了代價。但最後，第四段錄音還是被你聽見了。' } },
    x05: { name: '月台上的一隻紅鞋', intro: '服務台上放著一隻紅色的小鞋子。穿風衣的女人說是她女兒的；抱著孩子的父親說是他兒子的。<br>只有一隻鞋。這是一場要完美的調查——鞋子、小孩、照片，每一樣都要看清楚。',
      end: { perfect: '小勇的右腳終於穿回了鞋。霧裡有些東西會假裝失去了什麼，好把別人的東西帶走——你沒有讓它得逞。', good: '鞋子被鎖進抽屜裡，等天亮。真相還在，只是晚一點。', bad: '紅鞋化成了水。那一夜，月台上多了一個找不到鞋子的孩子的哭聲。' } },
    x06: { name: '守夜人的最後一盞燈', intro: '一個老站務員提著鑰匙串，在大廳裡找東西。今晚是他最後一次值大夜班，明天就退休了。<br>他想好好巡完最後一圈，親手關上這座站的燈。可是有些事，不會照著計畫走。',
      end: { perfect: '天亮以後，新來的站務員在配電室門上看到一支手電筒，貼紙上寫著：「1993—今天」。他把它擦乾淨，掛回了原位。', good: '燈都亮了。老站務員沒有再出現，但你知道他巡完了最後一圈。', bad: '燈亮了，你身上帶著黑暗留下的傷。老站務員的手電筒，掉在配電室門口。' } },
    x07: { name: '霧畫出來的路', intro: '這一站沒有固定的路。記號每一次都出現在不一樣的地方，影子們也在跟著記號走。<br>跟著霧畫的路走完六個記號——它不會告訴你下一個在哪裡。',
      end: { perfect: '你走完了霧畫出來的路，影子連你的衣角都沒碰到。最後一個記號消失前，在地上留下了一個小小的箭頭，指向出口。', good: '你走完了那條路，雖然被追上過幾次。', bad: '路走完了。你回頭看，影子們正在你走過的地方，慢慢學你的步伐。' } },
    x08: { name: '它們只聽得見', intro: '保持安靜。不要跑。<br>站裡有四個看不見的東西，它們只聽得見聲音。三段錄音藏在站裡，是之前來過的人留下的提醒。',
      end: { perfect: '「謝謝你這麼安靜。」最後一段錄音說完，你才發現自己整晚都踮著腳。', good: '你被聽見過，但還是把三段錄音都帶出來了。', bad: '錄音都到手了。可是它們記住了你腳步聲的節奏。' } },
    x09: { name: '只看一次的監視器', intro: '大廳的某個螢幕亮著，正在播一段監視器畫面。旁邊貼著：「只播一次」。<br>看完以後，大廳另一邊的告示牌會問你問題。記住你看到的每一個細節。',
      end: { perfect: '你全部答對了。告示牌上浮現一行字：「你是第一個記得我們的人。」畫面裡的三個人，原來一直在等有人記住他們。', good: '你記錯了幾個地方。告示牌上的字慢慢褪去，最後只剩下「謝謝」。' } },
    x10: { name: '粉筆線的原因', intro: '月台上倒著一個人型的粉筆線，旁邊是打翻的咖啡。你看到的是「結果」。<br>這一篇要倒著讀：從結果往回推，找出那個人到底發生了什麼事。',
      end: { perfect: '那個人只是睡著了。站務員以為他昏倒，叫了救護車，還畫了粉筆線。他醒來的時候很不好意思。有時候，最可怕的結果，原因很普通。', good: '你推錯了幾次，才找到那個很普通的答案。' } },
    x11: { name: '戴面具的商人', intro: '大廳多了一個攤位，攤位上的東西在發光。攤主戴著面具，說他的東西只賣給「在霧裡還站得住的人」。<br>霧裡的黃金，可以換到霧外換不到的東西。',
      end: '你買下的東西放在手心，比看起來重得多。面具商人收起攤子前說：「下一個霧夜，在別的站見。」' },
    x12: { name: '只在霧裡營業的販賣機', intro: '大廳裡多了一台你沒見過的販賣機，螢幕上有一張會眨眼的笑臉。「歡迎光臨。本機只在霧裡營業。」<br>它只收黃金。',
      end: '販賣機吐出你的東西，螢幕上的笑臉對你眨了眨眼。天亮以後，那個位置只剩下一塊比較乾淨的地板。' },
    x13: { name: '只交換、不收錢的人', intro: '大廳角落有個揹著大布袋的陌生人。他不收錢，也不收黃金，只交換——拿一樣你身上的普通東西，換一樣霧裡的東西。',
      end: '你的東西被他收進布袋裡，跟其他人換來的東西放在一起。布袋裡傳出很多聲音，像一座小小的車站。' },
    x14: { name: '不賣普通票的售票員', intro: '售票機旁邊站著一個穿舊制服的售票員。這年頭已經沒有人工售票了。<br>他賣的票，普通的售票機不會賣。',
      end: '你買到的那張票，站名欄的字一直在變。售票員說：「別擔心，它會帶你去你該去的地方。」' },
    x15: { name: '白衣女人的名字', intro: '一個戴兜帽的人把一個小布包塞給你：「不要讓穿白衣服的人知道你有這個。」<br>月台上，一個穿白衣服的女人溫柔地問你，有沒有看到她的名字。',
      end: { perfect: '戴兜帽的人說，他會找到不需要替身的方法。下一個霧夜，你在別的站看到他，他對你點了點頭——布包還在他懷裡。', good: '布包燒成了灰，兩個人都不見了。你不知道這樣對不對，霧也沒有告訴你。', bad: '她拿回了名字，差一點也拿走了你。你的手腕上，留下一圈白色的痕跡。' } },

    // 隱藏任務（開場只有傳聞；傳聞就是線索）
    h01: { name: '願意停下來的人', intro: '這一站好像什麼事都沒有發生。<br>只是，霧裡有個傳聞：「大家都在趕時間。如果有人願意在<b>時刻表</b>前面停下來，站得夠久，時間也會停下來等他。」',
      note: '傳聞：在時刻表前面一動也不動地站久一點', end: '時鐘又開始走了。你是這一站第一個願意停下來的人——這一站的時間，記住了你。' },
    h02: { name: '第四次看公告', intro: '這一站好像什麼事都沒有發生。<br>只是，大廳的<b>告示牌</b>上的字，好像每看一次都不太一樣。有人說，看第四次的時候，告示牌會跟你說謝謝。',
      note: '傳聞：告示牌每看一次都會變；看到第四次', end: '一個站務員每天都會確認公告有沒有貼好，即使在他離開以後。你替他確認了四次。' },
    h03: { name: '每一座月台的盡頭', intro: '這一站好像什麼事都沒有發生。<br>只是，霧裡有個傳聞：「走過每一座月台的<b>兩端</b>，最後一個盡頭會多出一道門。」',
      note: '傳聞：走到每一座月台的兩端', end: '小小的月台、一張長椅、一頂紅色貝雷帽。秀蔅第一次等車的地方，你找到了。' },
    h04: { name: '和每一個人說過話', intro: '這一站好像什麼事都沒有發生。霧裡的人各自做著自己的事，沒有人在等你。<br>可是，有人說：「霧裡的人很寂寞。如果有人跟<b>每一個人</b>都說過話……」',
      note: '傳聞：跟霧裡的每一個人都說說話', end: '提燈的人把燈舉高，所有人都消失了——不是被帶走，是終於可以離開了。謝謝你陪他們說話。' },
    h05: { name: '尾數是四的那一分鐘', intro: '這一站好像什麼事都沒有發生。<br>只是，月台的時刻表上，每一個發車時間的分鐘尾數都被人用紅筆圈成了「<b>4</b>」。據說在那一分鐘站在<b>月台</b>上，會看到不該看到的東西。',
      note: '傳聞：分鐘尾數是 4 的時候，站在月台上', end: '所有列車同時到站，又同時消失。「本日所有列車，已全數到站。」你是唯一的見證人。' },
    h06: { name: '第九次的手扶梯', intro: '這一站好像什麼事都沒有發生。<br>只是，手扶梯旁邊有人用粉筆畫了很多「正」字。據說在月台和大廳之間<b>上上下下很多次</b>，會遇見另一個也在找出口的人。',
      note: '傳聞：在月台和大廳之間上下很多次', end: '「下次見。」你握著那張紙條，在大廳裡站了很久。另一個在找出口的人，也許某天會在別的站跟你擦身而過。' },
    h07: { name: '牆上的手印', intro: '這一站好像什麼事都沒有發生。<br>只是，月台盡頭的角落特別暗。有人說，用<b>霧燈</b>照那個角落，會看到很多人留下的東西。',
      note: '傳聞：用霧燈照月台盡頭的角落', end: '牆的另一邊也放上了一隻手。那隻手是溫的。你不知道是誰，但你知道自己不是一個人在霧裡。' },
    h08: { name: '已經到站的車票', intro: '這一站好像什麼事都沒有發生。<br>只是，有人說：「帶著<b>霧中車票</b>走上<b>月台</b>，車票會告訴你，你要去哪裡。」',
      note: '傳聞：帶著霧中車票走上月台', end: '「你已經到了。不用再等了。」你在月台上站了一會兒，第一次覺得，霧夜裡的車站也可以是一個終點。' },
    h09: { name: '安靜到聽見歌', intro: '這一站好像什麼事都沒有發生。<br>只是，牆上的塗鴉寫著：「<b>什麼都不要碰、什麼都不要說</b>。安靜久一點，你會聽見。」',
      note: '傳聞：很久都不說話、不調查任何東西', end: '「天亮的時候，記得醒來。」那首歌你從來沒聽過，可是你會唱。' },
    h10: { name: '空白的車票', intro: '這一站好像什麼事都沒有發生。<br>只是，提燈的攤販今天好像在等什麼。據說<b>月台盡頭的暗處</b>掉了一張只有<b>霧燈</b>照得到的車票，而攤販認得它。',
      note: '傳聞：月台盡頭的暗處有一張車票（霧燈），拿去給攤販看', end: '攤販在空白車票上寫了一個字：「家」。這是霧裡唯一一張，你確定自己知道要去哪裡的車票。' },
    h11: { name: '打給爸爸的電話', intro: '這一站好像什麼事都沒有發生。<br>只是，<b>公共電話</b>的話筒沒有掛好。有人說，在霧夜裡連打幾次，會有人接。',
      note: '傳聞：在公共電話打幾次', end: '你把那句話帶到了。後來的某個晚上，你在這一站看到一個穿工作服的男人，急急忙忙地刷卡出站——像是要趕回家吃飯。' },
    h12: { name: '零號出口', intro: '這一站好像什麼事都沒有發生。<br>只是，牆上的<b>車站周邊地圖</b>，出口的數量好像不太對。多看幾次，你會發現多出來的那一個。',
      note: '傳聞：多看幾次車站周邊地圖', end: '零號出口只開了一秒。門外是白天。站裡多了一扇發光的門——這次，它會等你。' },

    // 列車事件
    t01: { name: '空車裡的遺留物', intro: '月台上停著一班空車，車門一直開著，看板上的目的地是空白的。車廂裡沒有人，只有乘客留下的東西：一隻手套、一本書、一張收據……<br>有一樣東西，只有霧燈照得到。',
      end: '每一節車廂都撿過了。車廂的燈閃了兩下，好像在說謝謝。那班車在你轉身的時候，靜靜地開走了，車上終於什麼都沒有留下。' },
    t02: { name: '叫她名字的人', intro: '月台上停著一班客滿的列車——再看一次，座位上全是透明的乘客。只有一個女人是活的，她說她下不了車。<br>車上和月台上，留著讓她下車的方法。',
      end: { perfect: '江曉雯走出車門的時候，透明的乘客們一起對她揮手。列車開走了，她在月台上哭著揮手回去。', good: '你們在車上坐到天亮。透明的乘客們安靜地聽你們聊天，好像也安心了一點。', bad: '她又回到了座位上。透明的乘客們把她圍在中間，不讓任何人再靠近。' } },
    t03: { name: '開回原地的列車', intro: '月台上停著一班列車，目的地顯示是空白的。車廂裡的路線圖上，所有的站名都被塗掉了。<br>這班車在等一個目的地。駕駛室裡也許寫著，該由誰來決定。',
      end: { perfect: '「本列車已抵達終點站：本站。」沒有終點的列車，終於有了終點。它關上車門，熄了燈，像一個終於回到家的人。', good: '你輸入錯過幾次，列車往前滑了一點又停下來。最後它還是回到了原地。' } },
    t05: { name: '三節車廂的第四節', intro: '月台上停著一班車。你數了數：一、二、三、四。可是這種車，只有三節。<br>多出來的那一節車廂裡，留著一些舊東西。',
      end: '第四節車廂的門關上了，再也打不開。你再數一次，列車只剩三節。你手裡的東西，是證明它存在過的唯一證據。' },
    t06: { name: '車窗裡的老人', intro: '月台上停著一班列車，車窗裡的倒影和車廂裡不一樣。倒影裡有一個老人，每一扇窗裡，他都靠你近一點。<br>看完三扇車窗，再決定要怎麼面對他。',
      end: { perfect: '老人舉起帽子，對你微笑，然後消失了。他只是一個想跟人打招呼的老乘客。', good: '你猶豫了，背後被推了一把。但最後你還是轉過身，看見他對你舉起了帽子。' } },
    t09: { name: '遺失物專車', intro: '月台上停著一班「遺失物專車」，車上堆滿了遺失物。老車掌說，每樣東西都在等主人，主人就在這一站。<br>他請你幫忙送幾樣。',
      end: { perfect: '車掌第一次走下了列車。那張全家福，他一直放在胸前的口袋裡。', good: '你幫車掌把東西一樣一樣送了出去。最後一樣，他說要自己留著。', bad: '遺失物散了一地。車掌一樣一樣撿回去，再也沒有跟你說話。' } },
    t10: { name: '名單上的第四個人', intro: '月台上停著一班列車，車門旁貼著一張乘客名單：四個名字，最後一個是「你」，坐在第四節車廂。<br>名單上有一個人根本不存在。',
      end: { perfect: '你把名單撕下來。你還在。也許名單上的「你」，是這班車在等的另一個人。', good: '對講機確認了答案。你答錯過，所以有那麼一瞬間，你也不太確定自己還在不在。' } },
    t12: { name: '沒有關掉的對講機', intro: '月台上停著一班列車，車廂深處傳來微弱的求救聲：「救命……在後面……」<br>聲音在車廂裡移動。跟著它走——月台上有東西在等你分心。',
      end: { perfect: '求救的人很久以前就獲救了，只是對講機一直沒有關。你把它關掉。整節車廂安靜得像在睡覺。', good: '你把對講機關掉了，身上多了幾道冰冷的抓痕。', bad: '你終於關掉了對講機，然後坐在車廂地板上，很久都站不起來。' } },
    t13: { name: '往從前的車廂', intro: '月台上停著一班列車，看板寫著：「往 從前」。車廂裡坐著一個女人，她說這節車廂會播放她的回憶。<br>車窗裡，窗外的風景變成了二十年前的台北。',
      end: { perfect: '她在月台上回頭，笑了。車廂的燈熄了，窗外的舊台北慢慢褪色——但它會一直在她心裡。', good: '「再一次就好。」也許還要很多個霧夜，她才捨得下車。', bad: '車窗全裂了。回憶從裂縫裡漏出來，像霧一樣散在月台上。' } },
    t19: { name: '第十三個吊環', intro: '你走過這節車廂——又走進了同一節車廂。每一次重播，都有一點點不一樣。<br>記住每一次的細節。最危險的那個變化，要回報給緊急對講機。',
      end: { perfect: '吊環啪地斷掉，那隻手縮回了天花板。車廂終於不再重播了，你走到下一節，是真的下一節。', good: '你回報錯過一次，那隻手差點碰到你的肩膀。最後，車廂還是停止了重播。' } },
  });
})();
