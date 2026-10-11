/* 列車外觀（塗裝）：各線標準車、主題彩繪車、季節限定、特別班車
 * 特別班車：每半小時的第一班車（遊戲裡不會告訴玩家這個規則），依地點、時段、條件決定是哪一種
 * 看過的列車會記在「紀錄 → 收藏 → 列車圖鑑」
 */
const LIVERIES = {
  // 各線標準車
  std_BR: { name: '文湖線標準車', line: 'BR', kind: 'std' },
  std_R: { name: '淡水信義線標準車', line: 'R', kind: 'std' },
  std_G: { name: '松山新店線標準車', line: 'G', kind: 'std' },
  std_O: { name: '中和新蘆線標準車', line: 'O', kind: 'std' },
  std_BL: { name: '板南線標準車', line: 'BL', kind: 'std' },
  std_Y: { name: '環狀線標準車', line: 'Y', kind: 'std', body: '#f4f1e6' },
  std_A: { name: '機場捷運標準車', line: 'A', kind: 'std', stripe: '#8246af' },
  // 主題彩繪車（各線偶爾出現）
  th_BR_zoo: { name: '動物園彩繪列車', line: 'BR', kind: 'theme', wrap: { type: 'icons', band: '#3d8a4a', bg: '#cfe8c8', icons: ['🐼', '🦒', '🐘', '🦁', '🐧'] } },
  th_BR_retro: { name: '復古文湖列車', line: 'BR', kind: 'theme', body: '#efe3c8', stripe: '#8a5a3a', seat: '#8a5a3a' },
  th_R_sunset: { name: '淡水夕照列車', line: 'R', kind: 'theme', wrap: { type: 'gradient', colors: ['#f2a03a', '#c4405a', '#5a3a7a'] } },
  th_R_ocean: { name: '海洋列車', line: 'R', kind: 'theme', wrap: { type: 'waves', colors: ['#2a7de1', '#bfe3f2'] } },
  th_G_leaf: { name: '碧潭綠意列車', line: 'G', kind: 'theme', wrap: { type: 'leaves', colors: ['#d8f0d8', '#3d7a4a', '#7ac04a'] } },
  th_O_star: { name: '星空列車', line: 'O', kind: 'theme', body: '#1f2a4a', wrap: { type: 'stars', colors: ['#1f2a4a', '#f2c200'] } },
  th_BL_city: { name: '城市彩繪列車', line: 'BL', kind: 'theme', wrap: { type: 'icons', band: '#2a6fb8', bg: '#d8e8f8', icons: ['🏙️', '🏮', '🌉', '🎐', '🚲'] } },
  th_BL_book: { name: '書香列車', line: 'BL', kind: 'theme', wrap: { type: 'icons', band: '#8a5a3a', bg: '#f4ead8', icons: ['📚', '📖', '✒️', '🔖'] } },
  th_Y_gold: { name: '黃金環狀列車', line: 'Y', kind: 'theme', body: '#e8c860', stripe: '#8a6a1a' },
  th_A_express: { name: '機場直達車', line: 'A', kind: 'theme', wrap: { type: 'gradient', colors: ['#8246af', '#c8a8e8', '#ffffff'] } },
  th_magpie: { name: '台灣藍鵲列車', kind: 'theme', wrap: { type: 'icons', bg: '#2a5fb0', icons: ['🐦', '🌿', '🐦'] } },
  th_art: { name: '公共藝術列車', kind: 'theme', wrap: { type: 'art', colors: ['#f4efe6', '#c4162a', '#f2c200', '#2a5fb0', '#3d7a4a'] } },
  th_pixel: { name: '像素電玩列車', kind: 'theme', wrap: { type: 'pixel', colors: ['#1d1d20', '#e04848', '#3ad06a', '#2a7de1', '#f2c200'] } },
  // 季節限定
  se_sakura: { name: '櫻花列車', kind: 'season', season: [[2, 15], [3, 31]], wrap: { type: 'icons', band: '#e8789a', bg: '#f8dce4', icons: ['🌸', '🌸', '🌷'] } },
  se_double10: { name: '國慶列車', kind: 'season', season: [[10, 8], [10, 12]], wrap: { type: 'flags', colors: ['#c4162a', '#1f3a8a', '#ffffff'] } },
  se_halloween: { name: '萬聖節南瓜列車', kind: 'season', season: [[10, 15], [10, 31]], body: '#2a2a32', stripe: '#e8741c', wrap: { type: 'icons', bg: '#3a2a4a', icons: ['🎃', '🦇', '👻', '🕸️'] } },
  se_xmas: { name: '聖誕列車', kind: 'season', season: [[12, 15], [12, 26]], wrap: { type: 'icons', bg: '#2a6a3a', icons: ['🎄', '🎁', '⛄', '❄️'] } },
  se_newyear: { name: '新春紅包列車', kind: 'season', season: [[1, 20], [2, 20]], body: '#c4162a', stripe: '#f2c200', wrap: { type: 'icons', bg: '#c4162a', icons: ['🧧', '🏮', '🍊'] } },
  // 特別班車（只在特定地方或時段出現）
  sp_onsen: { name: '溫泉列車', kind: 'special', stations: ['新北投', '北投'], wrap: { type: 'waves', colors: ['#e8f0f4', '#9ab8c8'] } },
  sp_panda: { name: '熊貓列車', kind: 'special', stations: ['動物園', '木柵', '萬芳社區'], body: '#f4f4f2', stripe: '#1d1d20', wrap: { type: 'icons', band: '#1d1d20', bg: '#f4f4f2', icons: ['🐼', '🎋'] } },
  sp_lantern: { name: '燈籠列車', kind: 'special', stations: ['龍山寺', '西門', '台北車站', '北門'], wrap: { type: 'icons', bg: '#5a1a1a', icons: ['🏮', '🏮', '✨'] } },
  sp_dawn: { name: '晨光列車', kind: 'special', hours: [6, 7], wrap: { type: 'gradient', colors: ['#f8e8b8', '#f2a03a', '#8ab8e8'] } },
  sp_night: { name: '夜行列車', kind: 'special', hours: [23, 24], body: '#14182a', stripe: '#6a7ab8', wrap: { type: 'stars', colors: ['#14182a', '#c8d8ff'] } },
  sp_mist: { name: '霧之列車', kind: 'special', hours: [0, 1], needFlag: 'mistArchive', body: '#e8eaf0', stripe: '#9fe0c8', wrap: { type: 'gradient', colors: ['#f4f6fa', '#c8d8e0', '#9fe0c8'] } },
  sp_rainbow: { name: '彩虹列車', kind: 'special', wrap: { type: 'gradient', colors: ['#e04848', '#f2c200', '#3ad06a', '#2a7de1', '#8a4ac8'] } },
};

const Liveries = (() => {
  const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 7);
  const inSeason = (lv, t) => { if (!lv.season) return true; const v = t.month * 100 + t.day, [[m0, d0], [m1, d1]] = lv.season; return v >= m0 * 100 + d0 && v <= m1 * 100 + d1; };
  const fits = (lv, line) => !lv.line || lv.line === line;
  // 這一班車是什麼外觀
  function pick(line, station) {
    const t = TaipeiTime.now(), r = Math.random(), flags = (typeof Game !== 'undefined' && Game.state && Game.state.flags) || {};
    const ids = Object.keys(LIVERIES);
    if (t.minute % 30 < 3) {   // 每半小時的第一班
      const pool = ids.filter(id => { const lv = LIVERIES[id]; return lv.kind === 'special' && (!lv.stations || lv.stations.includes(station)) && (!lv.hours || (t.hour >= lv.hours[0] && t.hour < lv.hours[1])) && (!lv.needFlag || flags[lv.needFlag]); });
      const specific = pool.filter(id => LIVERIES[id].stations || LIVERIES[id].hours);
      const list = specific.length ? specific : pool;
      if (list.length) return list[hash(t.month + '/' + t.day + ':' + t.hour + line) % list.length];
    }
    const season = ids.filter(id => LIVERIES[id].kind === 'season' && inSeason(LIVERIES[id], t) && fits(LIVERIES[id], line));
    if (season.length && r < .3) return season[(Math.random() * season.length) | 0];
    const theme = ids.filter(id => LIVERIES[id].kind === 'theme' && fits(LIVERIES[id], line));
    if (r > .85 && theme.length) return theme[(Math.random() * theme.length) | 0];
    return LIVERIES['std_' + line] ? 'std_' + line : 'std_BL';
  }
  // 彩繪圖案（會畫在整片車身側板上：圖案數量、大小依面積調整）
  function paint(g, w, h, wrap) {
    const c = wrap.colors || [], n = k => Math.max(6, Math.round(w * h / k));
    if (wrap.type === 'gradient') { const gr = g.createLinearGradient(0, 0, w, 0); c.forEach((col, i) => gr.addColorStop(i / Math.max(1, c.length - 1), col)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    if (wrap.type === 'icons') {
      g.fillStyle = wrap.bg || '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.1)'; for (let x = -h; x < w; x += h * .9) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h * .45, h); g.lineTo(x + h * .95, 0); g.lineTo(x + h * .5, 0); g.fill(); }
      if (wrap.band) { g.fillStyle = wrap.band; g.fillRect(0, h * .58, w, h * .42); g.fillRect(0, h * .5, w, h * .03); }   // 下半部的深色帶，遠看也認得出來
      else { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, h * .84, w, h * .16); }
      g.font = `${h * .68}px sans-serif`; g.textBaseline = 'middle';
      for (let i = 0, x = 6; x < w; i++, x += h * .84) g.fillText(wrap.icons[i % wrap.icons.length], x, h / 2 + (i % 2 ? h * .1 : -h * .08));
      g.textBaseline = 'alphabetic';
    }
    if (wrap.type === 'stars') {
      g.fillStyle = c[0]; g.fillRect(0, 0, w, h); g.fillStyle = c[1];
      for (let i = 0, k = n(260); i < k; i++) { const x = (i * 97.3) % w, y = (i * 53.7 + (i * i) % 17) % h, r = 1 + (i % 3); g.fillRect(x, y, r, r); }
      for (let i = 0, k = n(9000); i < k; i++) { const x = (i * 211.7 + 40) % w, y = (i * 71.3 + 20) % h, r = 4 + (i % 3) * 2; g.beginPath(); g.moveTo(x, y - r * 2); g.lineTo(x + r * .5, y - r * .5); g.lineTo(x + r * 2, y); g.lineTo(x + r * .5, y + r * .5); g.lineTo(x, y + r * 2); g.lineTo(x - r * .5, y + r * .5); g.lineTo(x - r * 2, y); g.lineTo(x - r * .5, y - r * .5); g.fill(); }
    }
    if (wrap.type === 'waves') { g.fillStyle = c[1]; g.fillRect(0, 0, w, h); g.strokeStyle = c[0]; g.lineWidth = Math.max(6, h / 16); const k = Math.max(3, Math.round(h / 34)); for (let j = 0; j < k; j++) { g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, h * (j + .5) / k + Math.sin(x / 34 + j * 1.3) * Math.min(14, h / k * .3)); g.stroke(); } }
    if (wrap.type === 'leaves') { g.fillStyle = c[0]; g.fillRect(0, 0, w, h); const s = Math.max(1, Math.min(2.2, h / 70)); for (let i = 0, k = n(700); i < k; i++) { g.fillStyle = c[1 + (i % 2)]; g.save(); g.translate((i * 41.3) % w, (i * 23.7) % h); g.rotate(i); g.beginPath(); g.ellipse(0, 0, 18 * s, 7 * s, 0, 0, 7); g.fill(); g.restore(); } }
    if (wrap.type === 'pixel') { for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 16) { g.fillStyle = c[((x * 7 + y * 3) / 16 | 0) % c.length]; g.fillRect(x, y, 16, 16); } }
    if (wrap.type === 'art') { g.fillStyle = c[0]; g.fillRect(0, 0, w, h); g.globalAlpha = .75; for (let i = 0, k = n(1800); i < k; i++) { g.fillStyle = c[1 + (i % (c.length - 1))]; g.beginPath(); g.arc((i * 61.7) % w, (i * 37.3) % h, 10 + (i % 4) * 8, 0, 7); g.fill(); } g.globalAlpha = 1; }
    if (wrap.type === 'flags') { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); const fw = h * .58, fh = h * .6; for (let x = 0; x < w; x += fw * 1.4) { g.fillStyle = c[0]; g.fillRect(x + 8, h * .2, fw, fh); g.fillStyle = c[1]; g.fillRect(x + 8, h * .2, fw * .46, fh * .5); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 8 + fw * .23, h * .2 + fh * .25, fh * .1, 0, 7); g.fill(); } }
  }
  // 看到／搭到
  function seen(id) {
    const s = Game.state; s.col = s.col || {}; const t = (s.col.trains = s.col.trains || {});
    if (t[id]) return;
    t[id] = { seen: TaipeiTime.date() }; saveState();
    const lv = LIVERIES[id], n = Object.keys(t).length;
    if (lv.kind !== 'std') { Sound.itemGet(); toast(`<b>🚆 ${lv.kind === 'special' ? '特別班車！' : '新的列車外觀'}：${lv.name}</b><span>列車圖鑑 ${n} 種</span>`, lv.kind === 'special' ? 'level' : ''); }
    if (typeof Life !== 'undefined') Life.log(`看到了${lv.name}`);
    if (typeof Achievements !== 'undefined') Achievements.check();
  }
  function rode(id) { const t = ((Game.state.col || {}).trains || {}); if (t[id] && !t[id].rode) { t[id].rode = TaipeiTime.date(); saveState(); if (typeof Achievements !== 'undefined') Achievements.check(); } }
  return { pick, paint, seen, rode };
})();
