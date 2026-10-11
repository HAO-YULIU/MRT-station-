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
      { kind: 'radio', at: 'u', title: '出口廣播（三）', text: '「……『一』路順風……」：<b>1</b>。另外，這段廣播的最後說：「從最遠的開始唸。」', note: '廣播三：1，「從最遠的開始唸」（月台→大廳→出口的反方向）' },
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
      { kind: 'bag', at: 'c', title: '一個背包', text: '標籤：「在雨傘之後找到」。', note: '背包：在雨傘之後' },
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
      { kind: 'note', at: 'u', title: '出口地圖的錯誤（三）', text: '出口地圖上，本站有一條不存在的第七號出口。', note: '錯誤三：不存在的第七號出口' },
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
      { kind: 'photo', at: 'c', title: '照片（四）', text: '月台上空無一人，只剩下一排鞋子。', note: '空無一人，只剩鞋子' },
    ],
    device: { kind: 'tv', at: 'c', name: '監視器螢幕', label: '把畫面排好', prompt: '依照發生的順序排列畫面：', order: ['月台正常', '眾人轉頭', '一片漆黑', '只剩鞋子'], locked: '螢幕上四個畫面都是雜訊。' },
    after: { text: '畫面排好後，最後一格慢慢變了——鞋子旁邊，多了一雙你的鞋。', options: [
      { label: '關掉螢幕', text: '你決定不要讓那一格成真。螢幕黑了。', result: 'up' },
    ] },
  }));

  /* ══════════ 第四大類：生存、追逐與危險（15） ══════════ */
  D('survive', 's01', { base: 'survive', title: '影子追逐', hint: '你的影子……不見了。它在別的地方。', hazard: { kind: 'shadow', count: 1, speed: 2.4, dmg: 18, why: '被影子抓到', grow: true }, goal: { type: 'collect', n: 4, kind: 'shard', name: '光的碎片', label: '撿起光的碎片', texts: ['碎片裡映著你的臉。', '影子跟得更近了。', '還差一點。', ''] }, doneText: '四片光合在一起，影子被吸了回來，乖乖躺在你腳下。' });
  D('survive', 's02', { base: 'survive', title: '熄燈區域', dark: true, hint: '燈全滅了。', hazard: { kind: 'ghost', count: 2, speed: 1.6, dmg: 15, why: '黑暗中有手抓住了你' }, goal: { type: 'collect', n: 4, kind: 'lamp', name: '備用燈泡', label: '撿起備用燈泡', texts: ['燈泡是溫的。', '', '', ''] }, doneText: '你把燈泡裝回配電盤，站內的燈一盞一盞亮起來。' });
  D('survive', 's03', { base: 'survive', title: '不能回頭', hint: '月台上寫著：「走過這裡，不要回頭」。', noTurn: true, hazard: { kind: 'shadow', count: 1, speed: 1.2, dmg: 10, mode: 'wander' }, goal: { type: 'reach', path: ['p', 'pend', 'p', 'pend'], kind: 'symbol', name: '記號', label: '碰觸記號', texts: ['背後有腳步聲。不要回頭。', '有人在叫你的名字。不要回頭。', '那個聲音很像你媽媽。不要回頭。', ''] }, doneText: '腳步聲停了。你終於可以回頭——身後什麼都沒有，只有一排濕濕的腳印。' });
  D('survive', 's04', { base: 'survive', title: '逐漸縮小的安全區', hint: '地上出現了一圈紅色的線，正在慢慢縮小。', shrink: { r: 22, rate: .06 }, goal: { type: 'collect', n: 3, kind: 'coin', name: '鎮霧的銅錢', label: '撿起銅錢', texts: ['紅線抖了一下。', '紅線停了一下。', ''] }, doneText: '三枚銅錢一放回地上，紅線就消失了。' });
  D('survive', 's05', { base: 'survive', title: '假站務人員', hint: '大廳裡有三個站務員。原本只有一個值班。', fakeStaff: true, hazard: { kind: 'shadow', count: 1, speed: 1.5, dmg: 12, mode: 'wander' }, goal: { type: 'none' } });
  D('survive', 's06', { base: 'survive', title: '靜止的乘客', hint: '月台上有個乘客一動也不動……你一動，他就動。', hazard: { kind: 'shadow', count: 2, speed: 2.8, dmg: 20, mode: 'statue', why: '你一動，它就到了你面前' }, goal: { type: 'collect', n: 3, kind: 'ticket', name: '他的車票', label: '撿起車票', texts: ['走一步，停一下。', '它又靠近了。', ''] }, doneText: '你把三張車票放在它面前。它低頭看了很久，然後……鞠躬，消失了。' });
  D('survive', 's07', K => ({ base: 'survive', title: '倒數封鎖', hint: '廣播：「本站將於十分鐘後全面封鎖」。', hazard: { kind: 'ghost', count: 1, speed: 1.8, dmg: 15 }, goal: { type: 'collect', n: 5, kind: 'paper', name: '通行證碎片', label: '撿起通行證碎片' }, timer: 420, doneText: '你在封鎖前拼好了通行證，鐵捲門在你身後落下。' }));
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
  // 無提示挑戰
  D('challenge', 'x01', K => ({ ...FogEvents.REG.p02.d(K), hint: '……', title: '無提示：倒轉的時間' }));
  // 限時解謎
  D('challenge', 'x02', K => ({ ...FogEvents.REG.p08.d(K), timer: 240, timerText: '置物櫃裡的鈴聲越來越急。四分鐘內打開它。', title: '限時：密碼置物櫃' }));
  // 無傷挑戰
  D('challenge', 'x03', { base: 'survive', noHit: true, title: '無傷挑戰：影子之間', hint: '地上寫著：「一次都不要被碰到」。', hazard: { kind: 'shadow', count: 3, speed: 1.9, dmg: 10 }, goal: { type: 'collect', n: 4, kind: 'shard', name: '光的碎片', label: '撿起光的碎片' }, doneText: '四片光都到手了。' });
  // 低工具挑戰：只能錯一次
  D('challenge', 'x04', K => ({ ...FogEvents.REG.p10.d(K), wrongDmg: 35, title: '低工具：證詞矛盾' }));
  // 完美調查
  D('challenge', 'x05', K => ({ ...FogEvents.REG.c15.d(K), title: '完美調查：相信誰' }));
  // 連續事件
  D('challenge', 'x06', K => ({ base: 'chain', steps: [
    { ...FogEvents.REG.n05.d(K), intro: '' },
    { base: 'survive', intro: '少年走了以後，燈全滅了。', dark: true, hazard: { kind: 'ghost', count: 2, speed: 1.6, dmg: 14 }, goal: { type: 'collect', n: 3, kind: 'lamp', name: '燈泡', label: '撿起燈泡' } },
  ] }));
  // 隨機路線
  D('challenge', 'x07', K => ({ base: 'survive', title: '隨機路線', hint: '記號每次出現的地方都不一樣。', hazard: { kind: 'shadow', count: 2, speed: 2.0, dmg: 14 }, goal: { type: 'reach', n: 6, kind: 'symbol', name: '記號', label: '碰觸記號' }, doneText: '你走完了霧畫出來的路。' }));
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
      { kind: 'paper', at: 'train', title: '駕駛室的日誌', text: '「目的地由最後一位上車的乘客決定。」', note: '目的地由最後上車的乘客決定' },
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
      { kind: 'note', at: 'train', label: '看車窗', title: '第三扇車窗', text: '倒影裡，門口站著你。老人在你背後。', note: '倒影三：老人站在你背後' },
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
})();
