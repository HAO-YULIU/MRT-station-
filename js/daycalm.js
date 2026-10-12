/* 白天（06:00–12:30）不提迷霧：NPC 台詞、車廂乘客、傳聞、廣告都先跳過跟霧有關的內容
 * 迷霧是晚上的事；早上大家在趕上班、上學，不會一直講霧。過了中午才慢慢有人提起。
 */
const DayCalm = (() => {
  const RE = /霧|00:30|零點半|末班車(開走)?(以後|之後)|不存在的(站|月台)|提燈|第七節車廂|綠色的月台|鬼|消失|不見了/;
  function active() { const t = TaipeiTime.now(), m = t.hour * 60 + t.minute; return m >= 360 && m < 750; }   // 06:00–12:30
  const ok = text => !active() || typeof text !== 'string' || !RE.test(text);
  // 從一組台詞裡挑：白天先拿掉跟霧有關的；全部都是的話，換成一般的日常台詞
  const DAILY = ['早安。', '今天人好多。', '要趕上班了。', '早餐還沒吃……', '這班車好擠。', '天氣不錯。'];
  function clean(list) { if (!active() || !Array.isArray(list)) return list; const out = list.filter(ok); return out.length ? out : DAILY; }
  // 廣告「霧——你看見了嗎？」：白天換成一般的展覽廣告
  const DAY_AD = { bg: '#2f6fb0', fg: '#fff', zh: '捷運藝文月　車站音樂會', en: 'Metro Arts Month' };
  const ad = a => (active() && a && RE.test(a.zh) ? DAY_AD : a);
  const adText = (t) => (active() && RE.test(t || '') ? '這個月每個週末，大站的大廳都有小型音樂會。下班路過可以停下來聽一首。' : t);
  // 公告欄的「今日傳聞」只在早上出現：換掉跟霧、末班車有關的兩則
  if (typeof RUMORS !== 'undefined') for (let i = 0; i < RUMORS.length; i++) {
    if (/末班車之後，北投/.test(RUMORS[i])) RUMORS[i] = '今日傳聞：聽說北投站的月台，有時候會飄來淡淡的溫泉味。';
    if (/提燈在空中移動/.test(RUMORS[i])) RUMORS[i] = '今日傳聞：有乘客說，在文湖線的窗外看到一隻大冠鷲停在燈桿上。';
  }
  return { active, ok, clean, ad, adText };
})();
