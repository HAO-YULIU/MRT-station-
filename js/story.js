/* 主線劇情：每條線挑五個「劇情站」，取代原本那一站的委託，要依章節順序解開
 * 章節種類（kind）：
 *   evidence 聽證詞、拿文件照片（取得證據）
 *   choice   兩難選擇（記錄選擇，影響結局與之後的人物態度）
 *   rescue   救援：選對處理方式才拿得到證據
 *   hidden   城市秘密：照謎語找出站內隱藏的地方
 *   chase    追捕：嫌疑人往某方向逃，限時趕到他下車的那一站
 *   escape   逃脫：被跟蹤，限時搭車到指定的站（不能傳送）
 *   deduce   推理：依證據判斷真相（多結局）
 * 結局：證據齊全＋推理正確＝真結局；推理正確＝一般結局；推理錯誤＝遺憾結局
 */
const STORY_LOOKS = {
  clerk: { girl: true, skin: '#efc6b2', hair: 'bun', hairColor: '#2a1d18', top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a' },
  oldwoman: { girl: true, old: true, skin: '#e2b49c', hair: 'bun', hairColor: '#d8d8d4', top: '#6a4a5a', pattern: 'knit', bottom: '#3a3a40' },
  grayman: { skin: '#d8a888', hair: 'short', hairColor: '#2a2a2a', top: '#6a6a6e', coat: true, bottom: '#2a2a30', hat: 'cap', hatColor: '#3a3a3e' },
  engineer: { girl: true, skin: '#f2cdb9', hair: 'bob', hairColor: '#1a1210', top: '#e08a2a', pattern: 'plain', bottom: '#3a3a3a', glasses: true },
  operator: { skin: '#e2b49c', hair: 'mush', hairColor: '#151515', top: '#2a3a4a', pattern: 'plain', bottom: '#1f2a3a', glasses: true },
  oldman: { old: true, skin: '#cf9f86', hair: 'short', hairColor: '#e0e0dc', top: '#5a4a3a', pattern: 'knit', bottom: '#2a2a30', hat: 'cap', hatColor: '#5a4a3a' },
  curator: { girl: true, skin: '#f2cdb9', hair: 'long', hairColor: '#2a1a12', top: '#3a5a4a', pattern: 'plain', bottom: '#2a2a2a' },
  mother: { girl: true, skin: '#eec4b0', hair: 'bob', hairColor: '#2a1a12', top: '#8a5a6a', pattern: 'plain', bottom: '#3a3a40', bag: 'tote', bagColor: '#6a5a4a' },
  student: { skin: '#e2b49c', hair: 'mush', hairColor: '#151515', top: '#f4f4f2', pattern: 'uniform', accent: '#2a4a8a', bottom: '#2a3a5a', bag: 'backpack', bagColor: '#3a6a9a' },
  teen: { skin: '#e2b49c', hair: 'mush', hairColor: '#151515', top: '#1d1d20', pattern: 'plain', bottom: '#2a3a5a', hat: 'cap', hatColor: '#3a6a3a' },
  father: { skin: '#d8a888', hair: 'short', hairColor: '#2a2a2a', top: '#f4f4f2', pattern: 'shirt', accent: '#1f3a6b', bottom: '#2a2e36', bag: 'briefcase' },
  watchmaker: { old: true, skin: '#d8b8a8', hair: 'short', hairColor: '#cfcfcf', top: '#3a3a3e', pattern: 'plain', bottom: '#2a2a30', glasses: true },
  hooded: { skin: '#c89070', hair: 'short', hairColor: '#151515', top: '#1d1d20', coat: true, bottom: '#1d1d20', hat: 'cap', hatColor: '#1d1d20' },
  nightguard: { skin: '#cf9f86', hair: 'short', hairColor: '#2a2a2a', top: '#2a3a4a', pattern: 'plain', bottom: '#1f2a3a', hat: 'cap', hatColor: '#2a3a4a' },
  runnerG: { girl: true, skin: '#f2cdb9', hair: 'long', hairColor: '#2a1a12', top: '#f2c200', pattern: 'plain', bottom: '#1d1d20' },
  researcher: { girl: true, skin: '#f2d2c0', hair: 'bob', hairColor: '#4a2a1a', top: '#d8c3a5', pattern: 'plain', bottom: '#3a3a40', glasses: true, bag: 'tote', bagColor: '#e6dcc6' },
  official: { skin: '#d8a888', hair: 'short', hairColor: '#2a2a2a', top: '#2a2e36', pattern: 'shirt', accent: '#7a1f2b', bottom: '#2a2e36', bag: 'briefcase' },
};

const STORY = {
  /* ── 板南線：多站串聯＋犯罪調查 ── */
  BL: {
    form: '多站串聯・犯罪調查',
    evidenceTotal: 4,
    chapters: [
      { station: '市政府', kind: 'evidence', npc: { name: '服務台的小林', role: '站務員', look: 'clerk' },
        pages: ['遺失物公告上的那把鑰匙？……說實話，那不是遺失物。是二十年前一位叫許文的維修員留下的。', '他在 2003 年冬天的某個晚上沒有來上班，之後就再也沒有人見過他。鑰匙一直放在服務台的抽屜裡。', '我把鑰匙拍給你看。上面刻著「7」——板南線的列車明明只有六節。'],
        evidence: { id: 'bl_key', name: '鑰匙的照片', icon: '📷', desc: '刻著「7」的鑰匙，屬於失蹤的維修員許文。' } },
      { station: '忠孝復興', kind: 'evidence', npc: { name: '江阿姨', role: '老乘客', look: 'oldwoman' },
        pages: ['2003 年的冬天？我記得。那天末班車進站，我數過車廂——七節。第七節的燈是綠色的。', '車門開的時候，一個穿工作服的年輕人走了進去。他回頭看了我一眼，好像想說什麼。', '然後車門就關了。我跟站務員講，他們說我看錯了。'],
        evidence: { id: 'bl_witness', name: '江阿姨的證詞', icon: '🗣️', desc: '2003 年冬天的末班車有七節，一個穿工作服的年輕人走進了第七節。' } },
      { station: '台北車站', kind: 'choice', npc: { name: '老陳', role: '站務員', look: null, npcId: 'chen' },
        pages: ['許文？……他是我帶過的徒弟。', '那天之後，維修日誌被改過。他失蹤前一晚的檢修紀錄寫著「七號車廂，正常」。可是哪來的七號車廂？', '日誌的副本在我這裡。我不能給你……被上面知道我會被調職。'],
        choice: { key: 'bl_log', prompt: '要怎麼拿到維修日誌？', options: [
          { label: '誠心拜託老陳，答應不讓他惹上麻煩', value: 'ask', text: '老陳沉默了很久，把副本推到你面前：「拿去吧。許文要是知道有人還在找他，會很高興的。」', friend: { chen: 15 }, evidence: { id: 'bl_log', name: '維修日誌副本', icon: '📒', desc: '失蹤前一晚的紀錄寫著「七號車廂，正常」，簽名欄被塗掉，還少了一頁。' } },
          { label: '趁老陳去巡站，偷偷拍下日誌', value: 'sneak', text: '你拍到了日誌。可是照片有一半糊掉了，而且老陳回來時，看你的眼神變得有點冷淡。', friend: { chen: -15 }, evidence: { id: 'bl_log', name: '模糊的日誌照片', icon: '📒', desc: '看得出寫著「七號車廂，正常」，簽名欄被塗掉，還少了一頁。' } },
        ] } },
      { station: '西門', kind: 'chase', npc: { name: '清潔阿姨', role: '目擊者', look: 'oldwoman' },
        pages: ['你在找日誌少掉的那一頁？剛剛有個穿灰大衣的男人在月台上撕東西，看到你就跑了！', '他往樓上的大廳跑了——好像要從出口溜出去！快追，在他出站前攔住他！'],
        chase: { minutes: 3, suspect: { name: '灰大衣的男人', look: 'grayman' },
          caught: '男人喘著氣，把一張皺掉的紙塞給你：「我只是收錢幫人處理掉它……我不知道會害到人。」', lost: '你追到大廳的時候，閘門外只剩下一張被風吹走的收據。他已經出站了。' },
        evidence: { id: 'bl_page', name: '撕掉的那一頁', icon: '📄', desc: '真正的檢修紀錄：「七號車廂出現在軌道上，非本公司車輛。主任周某要求刪除。」' } },
      { station: '板橋', kind: 'deduce', npc: { name: '秀蔅', role: '提燈的女孩', look: 'xiuyu' },
        pages: ['你把東西都攤開了：鑰匙、證詞、日誌……', '是誰讓「第七節車廂」從紀錄上消失的？'],
        deduce: { prompt: '你的推理是：', options: [
          { label: '維修主任周某偽造紀錄，掩蓋第七節車廂的事', correct: true },
          { label: '許文自己改了日誌，然後逃走了' },
          { label: '老陳是幕後的人，所以他才有副本' },
        ] } },
    ],
    endings: {
      true: { title: '第七節車廂的燈', text: '你把撕掉的那一頁交給秀蔅。她看完後輕輕說：「許文還在第七節車廂裡，他一直在等有人相信他。」那天晚上，末班車經過時，車窗裡有個人對你揮手。' },
      normal: { title: '沒有名字的乘客', text: '你知道是周主任刪掉了紀錄，可是證據不夠完整。許文的名字仍然沒有被寫回日誌裡，第七節車廂也還在霧中行駛。' },
      bad: { title: '關上的車門', text: '你相信了錯的答案。秀蔅沒有說什麼，只是把提燈轉暗了一點：「也許霧就是這樣，讓人看不清楚。」' },
    },
  },

  /* ── 文湖線：科技懸疑＋人物救援 ── */
  BR: {
    form: '科技懸疑・人物救援',
    evidenceTotal: 4,
    chapters: [
      { station: '動物園', kind: 'evidence', npc: { name: '阿亮', role: '行控中心值班員', look: 'operator' },
        pages: ['你也聽說了駕駛室的聲音？我給你看一張監視器截圖。', '凌晨 0:29，空無一人的列車，駕駛座上方有一團光。系統標示：「乘客 1 名」。', '可是那個時間，所有列車都已經回機廠了。'],
        evidence: { id: 'br_cctv', name: '監視器截圖', icon: '🖥️', desc: '0:29 的空列車，系統卻記錄著「乘客 1 名」。' } },
      { station: '六張犁', kind: 'hidden', npc: { name: '紙條', role: '阿亮留的', look: null },
        pages: ['阿亮的紙條：「舊系統的維修終端機還沒拆。在月台電梯旁邊的牆後面，把手放上去試試。」'],
        hidden: { at: 'elevator', text: '牆後面是一台佈滿灰塵的終端機，螢幕自己亮了：「BR-0 運轉日誌……最後一位駕駛員：林。」' },
        evidence: { id: 'br_log', name: 'BR-0 運轉日誌', icon: '💾', desc: '試車時期的舊系統，最後一筆紀錄寫著駕駛員「林」。' } },
      { station: '科技大樓', kind: 'choice', npc: { name: '阿凱', role: '文湖線維修工', look: null, npcId: 'kai' },
        pages: ['這個日誌……公司說舊系統早就格式化了。', '如果我們往上報，公司會派人來把終端機拆掉；如果不報，我可以私下幫你把資料讀出來，但我可能會丟工作。'],
        choice: { key: 'br_report', prompt: '你要怎麼做？', options: [
          { label: '照規定向公司回報', value: 'report', text: '阿凱點點頭，打了電話。第二天終端機被拆走了，但公司寄給你一封正式的感謝信，裡面附了一份錄音檔的編號。', friend: { kai: 5 } },
          { label: '和阿凱私下調查', value: 'secret', text: '阿凱熬夜把資料讀了出來。「這段聲音……是試車時期的駕駛員錄的報站名。他叫林，後來在北投退休。」', friend: { kai: 15 } },
        ] } },
      { station: '松山機場', kind: 'rescue', npc: { name: '工程師 Ivy', role: '被困在電梯裡', look: 'engineer' },
        pages: ['（電梯的對講機傳來聲音）「有人嗎？我在檢查舊系統的時候，電梯突然停在兩層樓中間……燈一直閃。」', '「我手上有那段錄音的原始檔，可是手機快沒電了。」'],
        rescue: { prompt: '你要怎麼做？', options: [
          { label: '按下電梯旁的緊急對講機，請站務員用手動模式放她出來', ok: true, text: '站務員很快趕到，用手動模式把電梯降到大廳。Ivy 出來後把隨身碟交給你：「謝謝你沒有亂來。」' },
          { label: '用力把電梯門撬開', text: '門卡得更緊了，警報大響。最後是消防人員救她出來，她太驚嚇，隨身碟也不知道掉到哪裡。' },
          { label: '叫她自己想辦法，你先去找別的線索', text: '你離開了。後來聽說她被困了兩個小時才被救出來。' },
        ] },
        evidence: { id: 'br_audio', name: '錄音原始檔', icon: '🎙️', desc: '試車時期的報站錄音，最後一站念的是「霧」。' } },
      { station: '劍南路', kind: 'deduce', npc: { name: '秀蔅', role: '提燈的女孩', look: 'xiuyu' },
        pages: ['駕駛室裡的聲音，到底是什麼？'],
        deduce: { prompt: '你的推理是：', options: [
          { label: '舊系統學會了試車駕駛員「林」的聲音，在沒人的時候繼續報站', correct: true },
          { label: '只是廣播系統故障，播出雜訊' },
          { label: '有人偷偷躲在駕駛室惡作劇' },
        ] } },
    ],
    endings: {
      true: { title: '最後一位駕駛員', text: '你帶著錄音去北投找林伯。他聽完笑了：「原來它還記得我。」那天的末班車，文湖線的廣播多念了一句：「謝謝搭乘，請慢走。」' },
      normal: { title: '沒有司機的列車', text: '你猜對了聲音的來源，但線索不夠完整，沒辦法找到那位駕駛員。廣播偶爾還是會在深夜響起。' },
      bad: { title: '雜訊', text: '你把它當成了故障。之後再也沒有人在文湖線上聽見那個聲音。' },
    },
  },

  /* ── 淡水信義線：歷史記憶 ── */
  R: {
    form: '歷史記憶',
    evidenceTotal: 4,
    chapters: [
      { station: '淡水', kind: 'evidence', npc: { name: '宋爺爺', role: '坐過第一班車的人', look: 'oldman' },
        pages: ['這張舊票卡？日期是 1997 年 3 月 28 日——淡水線通車那一天。', '那天我和一個女孩約好，坐第一班車去台北。我在淡水等了一整天，她沒有來。', '後來我才知道，她在半路的某一站下了車。我一直不知道是為什麼。'],
        evidence: { id: 'r_story', name: '宋爺爺的口述', icon: '🗣️', desc: '1997 年 3 月 28 日，和一個女孩約好坐第一班車，她卻在半路下車。' } },
      { station: '北投', kind: 'evidence', npc: { name: '林伯', role: '退休司機', look: null, npcId: 'linbo' },
        pages: ['通車那天我開的就是第一班車。', '有個女孩在北投下車，跑去公共電話打電話，哭得很厲害。她把一封信塞進月台的置物櫃，鑰匙交給了我。', '這封信我一直保管著。上面寫著「給在淡水等我的人」。'],
        evidence: { id: 'r_letter', name: '沒有寄出的信', icon: '✉️', desc: '寫著「給在淡水等我的人」，信裡說她父親在那天早上病倒了。' } },
      { station: '圓山', kind: 'evidence', npc: { name: '小蘇', role: '懷舊展策展人', look: 'curator' },
        pages: ['我們展覽裡有一張照片，是通車那天在圓山站拍的。', '照片角落有一個穿白大衣的女孩，抱著一束花往月台跑。……奇怪，這女孩長得好像現在常在車站出現的那個人。', '這張翻拍給你。'],
        evidence: { id: 'r_photo', name: '1997 年的舊照片', icon: '🖼️', desc: '通車那天的圓山站，一個穿白大衣、抱著花的女孩在月台上奔跑。' } },
      { station: '中正紀念堂', kind: 'choice', npc: { name: '秀蔅', role: '提燈的女孩', look: 'xiuyu' },
        pages: ['（秀蔅看著那封信，沉默了很久。）', '「如果你是寫信的人，你會希望他知道嗎？知道了，他可能會更難過。」'],
        choice: { key: 'r_letter_give', prompt: '要把信交給宋爺爺嗎？', options: [
          { label: '交給他。他等了這麼多年，有權利知道', value: 'give', text: '秀蔅點點頭：「嗯。等待的人，最需要的是一個答案。」', friend: { xiuyu: 10 } },
          { label: '先不要。等弄清楚她後來怎麼了再說', value: 'wait', text: '秀蔅輕輕說：「也是。有些答案，要一起帶過去才好。」' },
        ] } },
      { station: '象山', kind: 'deduce', npc: { name: '秀蔅', role: '提燈的女孩', look: 'xiuyu' },
        pages: ['那個女孩後來去了哪裡？'],
        deduce: { prompt: '你的推理是：', options: [
          { label: '她因為父親病倒趕去醫院，之後一直沒機會解釋，信就留在了北投', correct: true },
          { label: '她其實不想去，所以故意下車' },
          { label: '她搭錯車，迷路了' },
        ] } },
    ],
    endings: {
      true: { title: '淡水夕照', text: '宋爺爺讀完信，望著河口的夕陽說：「原來她來過。」那天傍晚，淡水站的月台上，有人看見一個穿白大衣的女孩，對著老人深深鞠了一個躬。' },
      normal: { title: '晚了二十年的信', text: '你明白了她下車的原因，但有些事情還沒拼湊完整。宋爺爺說：「知道她不是不想來，就夠了。」' },
      bad: { title: '沒有人來的月台', text: '你給了宋爺爺一個錯的答案。他笑了笑，說這樣也好，然後繼續每天去淡水看夕陽。' },
    },
  },

  /* ── 松山新店線：社會事件＋人物救援 ── */
  G: {
    form: '社會事件・人物救援',
    evidenceTotal: 3,
    chapters: [
      { station: '新店', kind: 'evidence', npc: { name: '簡媽媽', role: '焦急的母親', look: 'mother' },
        pages: ['我兒子柏翰昨天晚上和他爸爸吵架，摔門出去以後就沒回家。', '他手機不接……我只知道他身上帶著一片綠色的葉子書籤，是他小時候在碧潭撿的。', '拜託你，幫我找找他。'],
        evidence: { id: 'g_mom', name: '簡媽媽的話', icon: '🗣️', desc: '柏翰和爸爸吵架離家，帶著一片碧潭撿的綠葉書籤。' } },
      { station: '公館', kind: 'choice', npc: { name: '柏翰的同學', role: '高中生', look: 'student' },
        pages: ['柏翰？班上都在傳他偷了學校的東西，所以才不敢回家。', '可是他最好的朋友說，是有人故意陷害他。我也不知道該信誰。'],
        choice: { key: 'g_rumor', prompt: '你相信哪一邊？', options: [
          { label: '先不要相信謠言，聽聽柏翰自己怎麼說', value: 'trust', text: '同學愣了一下：「……你說得對。我們好像都沒問過他。」', evidence: { id: 'g_friend', name: '好朋友的說法', icon: '💬', desc: '柏翰被人陷害，偷東西的其實另有其人。' } },
          { label: '謠言傳成這樣，應該有幾分是真的', value: 'rumor', text: '同學點點頭：「對吧，大家都這樣說。」你心裡卻有點不踏實。' },
        ] } },
      { station: '西門', kind: 'rescue', npc: { name: '柏翰', role: '離家的高中生', look: 'teen' },
        pages: ['（月台盡頭，一個男孩坐在地上，手裡握著一片綠葉。）', '「別過來！你是我媽派來的？我不會回去的，反正他們都覺得是我偷的。」'],
        rescue: { prompt: '你要對他說什麼？', options: [
          { label: '「我不是來抓你回去的。我只是想聽你說發生了什麼事。」', ok: true, text: '柏翰沉默了很久，終於開口：「我沒有偷。我只是……不想再被當成問題了。」他把綠葉書籤遞給你看。' },
          { label: '「快跟我回家，你媽媽很擔心。」', text: '柏翰站起來就往電扶梯跑。你追上去的時候，他已經上了車。後來是他媽媽在車站找到他的。' },
          { label: '「謠言是真的嗎？你最好老實說。」', text: '柏翰的眼神暗了下去：「看吧，連你也這樣想。」他轉過頭不再說話。' },
        ] },
        evidence: { id: 'g_boy', name: '柏翰的心聲', icon: '🍃', desc: '他沒有偷東西，只是不想再被當成問題。' } },
      { station: '台北小巨蛋', kind: 'evidence', npc: { name: '簡爸爸', role: '加班的父親', look: 'father' },
        pages: ['我在這附近上班，最近被裁員的風聲搞得睡不著。', '那天我把氣出在他身上……說了「你就跟傳的一樣」這種話。', '你見到他的話……可以幫我跟他說，我錯了嗎？'],
        evidence: { id: 'g_dad', name: '爸爸的道歉', icon: '🗣️', desc: '爸爸因為工作壓力遷怒兒子，想跟他道歉。' } },
      { station: '松山', kind: 'deduce', npc: { name: '秀蔅', role: '提燈的女孩', look: 'xiuyu' },
        pages: ['這個家真正的問題是什麼？'],
        deduce: { prompt: '你的判斷是：', options: [
          { label: '一則沒人查證的謠言，加上爸爸的壓力，讓彼此都沒有好好聽對方說話', correct: true },
          { label: '柏翰真的偷了東西，只是不敢承認' },
          { label: '媽媽太保護他，才讓他不懂事' },
        ] } },
    ],
    endings: {
      true: { title: '碧潭綠葉', text: '那個週末，簡家三個人一起去了碧潭。柏翰把綠葉書籤送給了你：「這是我小時候撿的，現在給你。」葉脈的形狀，像一張縮小的路線圖。' },
      normal: { title: '回家的路', text: '柏翰回家了，但和爸爸之間還是有點尷尬。也許需要更多時間。' },
      bad: { title: '沒說出口的話', text: '你相信了謠言。柏翰後來還是回家了，只是再也不跟任何人提起那天的事。' },
    },
  },

  /* ── 中和新蘆線：追捕與逃脫＋陣營衝突 ── */
  O: {
    form: '追捕與逃脫・陣營衝突',
    evidenceTotal: 4,
    chapters: [
      { station: '南勢角', kind: 'evidence', npc: { name: '鐘錶行的何師傅', role: '修錶師傅', look: 'watchmaker' },
        pages: ['我修了五十年錶，從沒看過這種事：一只懷錶，不管怎麼修，指針都停在 00:30。', '昨天它被偷了。小偷戴著黑色兜帽，往頂溪的方向走。', '那只錶是一位老站長寄放的，他說：「錶停的時候，霧就會來。」'],
        evidence: { id: 'o_watch', name: '何師傅的證詞', icon: '⌚', desc: '停在 00:30 的懷錶被戴兜帽的人偷走，原本屬於一位老站長。' } },
      { station: '頂溪', kind: 'chase', npc: { name: '目擊的學生', role: '高中生', look: 'student' },
        pages: ['戴兜帽的人？剛剛還在！他看到你就往樓上跑了——', '我聽到他跟人講電話，說要在大廳碰面以後出站。快！'],
        chase: { minutes: 3, suspect: { name: '戴兜帽的人', look: 'hooded' },
          caught: '兜帽滑了下來，是一個年輕人。他沒有逃，只是把一張紙條給你：「我是替『守夜會』拿錶的。他們說那只錶不能落到『晨光會』手裡。」', lost: '你趕到大廳時，閘門前只剩一張掉落的車票，背面寫著「守夜會」。' },
        evidence: { id: 'o_note', name: '兜帽人的紙條', icon: '📝', desc: '偷錶是為了「守夜會」，他們不想讓錶落到「晨光會」手中。' } },
      { station: '東門', kind: 'choice', npc: { name: '兩群人', role: '守夜會與晨光會', look: 'nightguard' },
        pages: ['守夜會（夜班的保全、清潔員、司機）：「錶停在 00:30，是因為末班車之後的城市需要有人守著。把錶交給我們。」', '晨光會（早起的通勤族、跑者）：「那只錶讓城市卡在半夜！只要讓它重新走，霧就會散。交給我們。」'],
        choice: { key: 'o_side', prompt: '你相信哪一邊？', options: [
          { label: '相信守夜會：夜裡的城市也需要被守護', value: 'night', text: '守夜會的人向你點頭。晨光會的人憤憤離開：「你會後悔的。」', friend: { zhou: 10 } },
          { label: '相信晨光會：讓時間重新走動', value: 'morning', text: '晨光會的人鬆了一口氣。守夜會的人沒有說話，只是把燈關暗了一點。', friend: { jiahao: 10 } },
          { label: '兩邊都先不信，自己找出錶停下的原因', value: 'neither', text: '兩群人都愣住了。有個守夜會的老人低聲說：「……老站長要是在，也會這樣說。」', evidence: { id: 'o_both', name: '兩邊的說法', icon: '⚖️', desc: '守夜會想守住夜晚，晨光會想讓時間前進。兩邊都沒有說謊，只是各說了一半。' } },
        ] } },
      { station: '民權西路', kind: 'escape', npc: { name: '公共電話', role: '突然響起', look: null },
        pages: ['（公共電話突然響了。你接起來。）', '「有人在跟蹤你。不要回頭。三分鐘內跑到大廳的站務室，站務員會幫你。不要出站，他在外面等。」'],
        escape: { minutes: 3, stalker: { name: '跟蹤者', look: 'hooded' },
          safe: '你衝進站務室，回頭看——跟蹤的人停在門外，轉身走了。站務員遞給你一個信封，說是一位老站長很久以前寄放在這裡的：裡面是他的照片和一句話：「錶停，是因為我答應過她要等。」', caught: '在大廳，有人輕輕拍了你的肩膀。你回頭時，誰也沒有。口袋裡的紙條不見了。' },
        evidence: { id: 'o_letter', name: '老站長的信封', icon: '✉️', desc: '「錶停，是因為我答應過她要等。」' } },
      { station: '迴龍', kind: 'deduce', npc: { name: '秀蔅', role: '提燈的女孩', look: 'xiuyu' },
        pages: ['懷錶為什麼停在 00:30？'],
        deduce: { prompt: '你的推理是：', options: [
          { label: '老站長答應在末班車後等一個人，錶替他守著那個約定', correct: true },
          { label: '錶壞了，只是巧合停在 00:30' },
          { label: '守夜會故意把錶弄停，好控制夜晚' },
        ] } },
    ],
    endings: {
      true: { title: '停在 00:30 的懷錶', text: '你把懷錶放回老站長的信封裡。秒針輕輕動了一下，又停住——像是說「我知道了，再等一下」。守夜會和晨光會第一次坐下來一起喝了杯咖啡。' },
      normal: { title: '還在走的夜晚', text: '你明白了錶停下的原因，但兩派人還是各說各話。懷錶依然停在 00:30。' },
      bad: { title: '被搶走的時間', text: '你的判斷讓其中一派拿走了錶。從那天起，那一派的人再也不跟你說話。' },
    },
  },

  /* ── 環狀線：城市秘密＋區域解鎖 ── */
  Y: {
    form: '城市秘密・區域解鎖',
    evidenceTotal: 4,
    chapters: [
      { station: '大坪林', kind: 'hidden', npc: { name: '紙條', role: '秀蔅留下的', look: null },
        pages: ['秀蔅的紙條：「環狀線每一站都藏著同一個符號。第一個，在售票機後面的牆上。」'],
        hidden: { at: 'ticket', text: '售票機後面的牆上，有一個很小的刻痕：一個圓圈，中間一條往外延伸的線——像一個沒有指針的指南針。' },
        evidence: { id: 'y_sym1', name: '符號（一）', icon: '🧭', desc: '圓圈加一條往外延伸的線，刻在售票機後面。' } },
      { station: '中和', kind: 'evidence', npc: { name: '雨晴', role: '都市研究社的學生', look: 'researcher' },
        pages: ['你也在找那個符號？我們社團在研究一件怪事：車站周邊地圖上，有一塊地方永遠是空白的。', '每一站的周邊地圖都有，位置不一樣，可是連起來……是一條往西北延伸的線。', '這是我們整理的地圖，給你。'],
        evidence: { id: 'y_map', name: '空白區域地圖', icon: '🗺️', desc: '各站周邊地圖的空白處連起來，是一條往西北延伸的線。' } },
      { station: '板橋', kind: 'choice', npc: { name: '市府的陳專員', role: '公務員', look: 'official' },
        pages: ['（一位穿西裝的人攔住你。）「你們在調查地圖的空白處？那是規劃中的路線，還不能公開。」', '「把資料交給我，我保證之後會給你們一個交代。」雨晴在旁邊拚命搖頭。'],
        choice: { key: 'y_share', prompt: '你要怎麼做？', options: [
          { label: '把資料交給專員，相信制度', value: 'official', text: '專員收下資料，給你一張名片：「謝謝合作。」雨晴很失望地走開了。' },
          { label: '和雨晴一起保留資料，繼續追查', value: 'students', text: '雨晴笑了：「我就知道你會這樣選！」專員搖搖頭離開：「年輕人……好吧，小心一點。」', evidence: { id: 'y_notes', name: '研究社筆記', icon: '📓', desc: '空白線的終點，指向機場的方向。' } },
        ] } },
      { station: '頭前庄', kind: 'hidden', npc: { name: '紙條', role: '秀蔅留下的', look: null },
        pages: ['秀蔅的紙條：「第二個符號在月台的盡頭，靠近隧道的那面牆。這一次，它會指出方向。」'],
        hidden: { at: 'platformEnd', text: '月台盡頭的牆上，同樣的符號在發光。線的那一端指向西北——指向機場。' },
        evidence: { id: 'y_sym2', name: '符號（二）', icon: '🧭', desc: '發光的符號，指向西北的機場方向。' } },
      { station: '新北產業園區', kind: 'deduce', npc: { name: '秀蔅', role: '提燈的女孩', look: 'xiuyu' },
        pages: ['符號、地圖的空白、指向西北的線……這座城市藏著什麼？'],
        deduce: { prompt: '你的推理是：', options: [
          { label: '地圖的空白是一條被霧藏起來的路線，通往機場——要集齊六樣東西才會出現', correct: true },
          { label: '只是地圖印錯了' },
          { label: '那是市政府的秘密軍事設施' },
        ] } },
    ],
    endings: {
      true: { title: '沒有指針的指南針', text: '你把兩個符號疊在一起，指南針的外圈亮了，一根指針慢慢浮現，指向西北。秀蔅說：「那條路一直在那裡，只是在等有人把東西帶齊。」' },
      normal: { title: '空白的地圖', text: '你猜到了空白的意義，但還缺一些線索。指南針的指針若隱若現。' },
      bad: { title: '印錯的地圖', text: '你把它當成了印刷錯誤。之後再看車站周邊地圖，那塊空白好像變小了一點。' },
    },
  },
};
// 劇情站的總數（每條線五章），給任務列表用
const STORY_LINES = Object.keys(STORY);
