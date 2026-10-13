/* 讓迷霧保持神秘：NPC 台詞、車廂乘客、傳聞、廣告都很少提到霧
 * 白天完全不提；傍晚偶爾有人說一句；越接近 00:30 才比較常聽到。
 */
const DayCalm = (() => {
  const RE = /霧|00:30|零點半|末班車(開走)?(以後|之後)|不存在的(站|月台)|提燈|第七節車廂|綠色的月台|鬼|消失|不見了/;
  // 讓迷霧保持神秘：大家很少提起它，越接近 00:30 才偶爾有人說溜嘴
  //   06:00–17:00 完全不提；17:00–22:00 偶爾（約一成）；22:00–00:30 比較常（約三成五）
  const mins = () => { const t = TaipeiTime.now(); return t.hour * 60 + t.minute; };
  function keepRate() { const m = mins(); if (m >= 360 && m < 1020) return 0; if (m >= 1020 && m < 1320) return .1; if (m >= 1320 || m < 30) return .35; return 1; }
  const active = () => keepRate() < 1;
  const ok = text => typeof text !== 'string' || !RE.test(text) || Math.random() < keepRate();
  // 從一組台詞裡挑：拿掉大部分跟霧有關的；全部都是的話，換成一般的日常台詞
  const DAILY = ['今天人好多。', '要趕車了。', '這班車好擠。', '天氣不錯。', '晚餐要吃什麼呢……', '手機快沒電了。'];
  function clean(list) { if (!active() || !Array.isArray(list)) return list; const out = list.filter(ok); return out.length ? out : DAILY; }
  // 廣告「霧——你看見了嗎？」：只有深夜（22:00 以後）才掛出來，其他時間是一般的展覽廣告
  const DAY_AD = { bg: '#2f6fb0', fg: '#fff', zh: '捷運藝文月　車站音樂會', en: 'Metro Arts Month' };
  const lateNight = () => { const m = mins(); return m >= 1320 || m < 30; };
  const ad = a => (!lateNight() && a && RE.test(a.zh) ? DAY_AD : a);
  const adText = (t) => (!lateNight() && RE.test(t || '') ? '這個月每個週末，大站的大廳都有小型音樂會。下班路過可以停下來聽一首。' : t);
  // 公告欄的「今日傳聞」只在早上出現：換掉跟霧、末班車有關的兩則
  if (typeof RUMORS !== 'undefined') for (let i = 0; i < RUMORS.length; i++) {
    if (/末班車之後，北投/.test(RUMORS[i])) RUMORS[i] = '今日傳聞：聽說北投站的月台，有時候會飄來淡淡的溫泉味。';
    if (/提燈在空中移動/.test(RUMORS[i])) RUMORS[i] = '今日傳聞：有乘客說，在文湖線的窗外看到一隻大冠鷲停在燈桿上。';
  }
  return { active, ok, clean, ad, adText };
})();
