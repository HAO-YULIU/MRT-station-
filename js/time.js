/* 台灣時間與捷運營運時段
 *  06:00–00:30  營運中（open）
 *  00:30–05:30  迷霧時刻（mist）：特殊玩法，之後開放
 *  05:30–06:00  清晨，車站尚未開放（dawn）
 * 測試用：網址加上 ?time=23:58 可模擬台灣時間（之後仍會繼續走）
 */
const TaipeiTime = (() => {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
  });
  const WEEK = { Sun: '日', Mon: '一', Tue: '二', Wed: '三', Thu: '四', Fri: '五', Sat: '六' };

  let offsetMs = 0;
  const q = new URLSearchParams(location.search).get('time');
  if (q && /^\d{1,2}:\d{2}$/.test(q)) {
    const [h, m] = q.split(':').map(Number);
    const now = parts(new Date());
    offsetMs = ((h * 60 + m) - (now.hour * 60 + now.minute)) * 60000 - now.second * 1000;
  }

  function parts(d) {
    const o = {};
    for (const p of fmt.formatToParts(d)) o[p.type] = p.value;
    return {
      year: +o.year, month: +o.month, day: +o.day,
      hour: +o.hour, minute: +o.minute, second: +o.second,
      weekday: WEEK[o.weekday],
    };
  }

  const pad = n => String(n).padStart(2, '0');

  function now() { return parts(new Date(Date.now() + offsetMs)); }

  function state(t = now()) {
    const m = t.hour * 60 + t.minute;
    if (m >= 360 || m < 30) return 'open';
    if (m < 330) return 'mist';
    return 'dawn';
  }

  // 距離 06:00 首班車還有幾分鐘
  function minutesToFirstTrain(t = now()) {
    const m = t.hour * 60 + t.minute;
    return m <= 360 ? 360 - m : 1440 - m + 360;
  }
  // 距離 00:30 末班車還有幾分鐘（營運中才有意義）
  function minutesToLastTrain(t = now()) {
    const m = t.hour * 60 + t.minute;
    return m < 30 ? 30 - m : 1440 - m + 30;
  }

  // 依時間決定天空：day / dusk / night / dawn
  function sky(t = now()) {
    const h = t.hour + t.minute / 60;
    if (h >= 6.5 && h < 16.8) return 'day';
    if (h >= 16.8 && h < 18.3) return 'dusk';
    if (h >= 5.2 && h < 6.5) return 'dawn';
    return 'night';
  }

  /* 班距：每個方向固定 3 分鐘一班。各方向錯開不同秒數，
   * 依台灣時間計算下一班列車還有幾秒進站（超過末班車回傳 null） */
  const HEADWAY = 180;
  function hash(str) { let h = 7; for (const ch of str) h = (h * 31 + ch.codePointAt(0)) % 100003; return h; }
  function nextTrainIn(stationId, line, terminal) {
    const t = now();
    if (state(t) !== 'open') return null;
    const sec = Math.floor((Date.now() + offsetMs) / 1000);
    const off = hash(stationId + line + terminal) % HEADWAY;
    const eta = ((off - sec) % HEADWAY + HEADWAY) % HEADWAY;
    const toLast = minutesToLastTrain(t) * 60 - t.second;
    return eta > toLast ? null : eta;
  }

  return {
    now, state, nextTrainIn, HEADWAY, sky, minutesToFirstTrain, minutesToLastTrain,
    clock: (t = now()) => `${pad(t.hour)}:${pad(t.minute)}`,
    clockSec: (t = now()) => `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`,
    date: (t = now()) => `${t.year}/${pad(t.month)}/${pad(t.day)}（${t.weekday}）`,
    simulated: () => offsetMs !== 0,
  };
})();
