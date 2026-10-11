/* 主線謎題：每條線的每一站各有一題，只能在該線的月台上作答
 * 題目答案都從路網資料計算（站碼、下一站、英文站名、到終點幾站…），
 * 有名的站另外有地標題、轉乘題。
 */
const Puzzles = (() => {
  const hash = str => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100003, 17);

  // 某線所有車站（依路線順序、不重複）
  const lineCache = {};
  function stations(line) {
    if (lineCache[line]) return lineCache[line];
    const out = [];
    for (const r of LINES[line].routes) for (const [id] of r) if (!out.includes(id)) out.push(id);
    return (lineCache[line] = out);
  }
  // 同一條線上兩站相隔幾站（只走該線）
  function hops(line, a, b) {
    if (a === b) return 0;
    const nb = {};
    for (const r of LINES[line].routes) for (let i = 0; i < r.length - 1; i++) {
      (nb[r[i][0]] = nb[r[i][0]] || []).push(r[i + 1][0]);
      (nb[r[i + 1][0]] = nb[r[i + 1][0]] || []).push(r[i][0]);
    }
    const seen = { [a]: 0 }, q = [a];
    while (q.length) { const u = q.shift(); for (const v of nb[u] || []) if (seen[v] == null) { seen[v] = seen[u] + 1; if (v === b) return seen[v]; q.push(v); } }
    return Infinity;
  }

  // 地標：這一站附近最有名的地方
  const LANDMARK = {
    龍山寺: '艋舺龍山寺', 西門: '西門紅樓', 淡水: '淡水老街', 新北投: '北投溫泉博物館', 動物園: '臺北市立動物園',
    '台北101/世貿': '台北 101', 中正紀念堂: '國家戲劇院與音樂廳', 公館: '國立臺灣大學', 象山: '象山步道', 劍潭: '士林夜市',
    新店: '碧潭', 府中: '板橋林家花園', 景美: '景美夜市', 松山: '饒河街觀光夜市', 圓山: '花博公園',
    台大醫院: '二二八和平紀念公園', 北門: '北門（承恩門）', 善導寺: '華山 1914 文化創意產業園區', 劍南路: '美麗華摩天輪',
    台電大樓: '師大夜市', 東門: '永康街', 中山: '赤峰街',
  };
  // 除了捷運，還可以轉乘什麼
  const RAIL = {
    台北車站: '台鐵、高鐵和機場捷運', 板橋: '台鐵和高鐵', 南港: '台鐵和高鐵', 三重: '機場捷運', 新北產業園區: '機場捷運', 紅樹林: '淡海輕軌',
  };
  const RAIL_OPTS = ['台鐵和高鐵', '台鐵、高鐵和機場捷運', '機場捷運', '淡海輕軌'];

  function pickOthers(pool, answer, n, seed) {
    const rest = pool.filter(x => x !== answer);
    const out = [];
    for (let i = 0; out.length < n && i < rest.length * 3; i++) {
      const x = rest[(seed + i * 7) % rest.length];
      if (!out.includes(x)) out.push(x);
    }
    return out;
  }
  function shuffle(arr, seed) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { seed = (seed * 9301 + 49297) % 233280; const j = seed % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // 產生題目：{ q, options, answer }（answer 為 options 中正確答案的索引）
  function question(line, id) {
    const seed = hash(line + id), L = LINES[line], all = stations(line);
    const name = x => MRT.label(x, line).zh;
    let q, ans, wrong;
    const types = ['code', 'next', 'english', 'count'];
    if (MRT.undergroundOn(id, line)) types.push('under');
    let type = types[seed % types.length];
    if (RAIL[id]) type = 'rail';
    else if (LANDMARK[id]) type = 'landmark';
    if (type === 'landmark') {
      q = `秀蔅的紙條：「這一站出站後，最有名的地方是哪裡？」`;
      ans = LANDMARK[id]; wrong = pickOthers(Object.values(LANDMARK), ans, 3, seed);
    } else if (type === 'rail') {
      q = `秀蔅的紙條：「在這一站，除了捷運，還可以轉乘什麼？」`;
      ans = RAIL[id]; wrong = RAIL_OPTS.filter(x => x !== ans).slice(0, 3);
    } else if (type === 'code') {
      q = `秀蔅的紙條：「${name(id)}在${L.zh}的站碼是？」（月台的站名牌上有寫）`;
      ans = MRT.code(id, line); wrong = pickOthers(all.map(x => MRT.code(x, line)), ans, 3, seed);
    } else if (type === 'english') {
      q = `秀蔅的紙條：「這一站的英文站名是？」`;
      ans = MRT.label(id, line).en; wrong = pickOthers(all.map(x => MRT.label(x, line).en), ans, 3, seed);
    } else if (type === 'next' || type === 'count') {
      const dirs = MRT.directionsAt(id).filter(d => d.line === line);
      const d = dirs[seed % dirs.length];
      if (type === 'next') {
        q = `秀蔅的紙條：「從這裡搭${L.zh}往${name(d.terminal)}，下一站是哪裡？」`;
        ans = name(d.stops[0]); wrong = pickOthers(all.filter(x => x !== id).map(name), ans, 3, seed);
      } else {
        const n = d.stops.length;
        q = `秀蔅的紙條：「從這裡搭${L.zh}到終點站${name(d.terminal)}，要坐幾站？」`;
        ans = `${n} 站`; wrong = [n + 1, n + 2, n > 1 ? n - 1 : n + 3].map(k => `${k} 站`);
      }
    } else {
      q = `秀蔅的紙條：「這一站的${L.zh}月台在哪裡？」`;
      ans = '地下'; wrong = ['地面或高架'];
    }
    // 打亂後再轉一下，讓正確答案平均分散在各個位置
    let options = shuffle(wrong, seed);
    const at = (seed >> 2) % (options.length + 1);
    options = [...options.slice(0, at), ans, ...options.slice(at)];
    return { q, options, answer: at };
  }

  /* ── 站點委託：每一站固定一種（問答、找東西、帶路、找人、買東西、神秘通道、撿零錢、迷路） ── */
  const KINDS = ['quiz', 'lost', 'escort', 'person', 'buy', 'passage', 'coins', 'way'];
  const SURNAME = ['王', '李', '陳', '林', '張', '黃', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '曾'];
  const ROLE = [
    { t: '阿伯', old: true, girl: false }, { t: '阿嬤', old: true, girl: true }, { t: '阿姨', girl: true }, { t: '先生', girl: false },
    { t: '小姐', girl: true }, { t: '同學', girl: false }, { t: '同學', girl: true }, { t: '大哥', girl: false },
  ];
  const COLORS = [['紅色', '#b8262e'], ['黃色', '#e8b820'], ['綠色', '#3d7a4a'], ['藍色', '#2a5aa8'], ['白色', '#f2f2ee'], ['黑色', '#1d1d20'], ['紫色', '#6a3a8a'], ['橘色', '#e0702a'], ['粉紅色', '#e08aa8'], ['灰色', '#85888d']];
  const LOST = [
    ['ch_glasses', '老花眼鏡'], ['ch_scarf', '格子圍巾'], ['ch_card', '學生證'], ['ch_book', '藍色筆記本'],
    ['ch_toy', '小熊玩偶'], ['ch_phone', '手機'], ['ch_keys', '鑰匙圈'], ['ch_hat', '毛線帽'],
  ];
  const BUY = ['bubbletea', 'coffee', 'onigiri', 'pineapplecake', 'soymilk', 'bread', 'chicken', 'nougat', 'postcard', 'flower'];
  const PASSAGE = [
    { at: 'platformEnd', riddle: '「月台的盡頭，風從隧道吹進來的地方，牆上有一道不該存在的縫。」' },
    { at: 'elevator', riddle: '「月台電梯的旁邊，貼著牆仔細看，磁磚的顏色不太一樣。」' },
    { at: 'ticket', riddle: '「買票的人都不會往後看。售票機後面的牆，敲起來是空的。」' },
    { at: 'toilet', riddle: '「洗手間外面那面牆，晚上會有風聲。」' },
    { at: 'hallElevator', riddle: '「大廳的電梯口，地上有一塊方形的地磚是鬆的。」' },
  ];
  function rng(seed) { let x = seed % 2147483647 || 1; return () => (x = x * 16807 % 2147483647) / 2147483647; }
  function look(r, role, color) {
    const skins = ['#f2cdb9', '#e2b49c', '#d8a888', '#c89070'];
    return {
      girl: role.girl, old: role.old, skin: skins[(r() * 4) | 0],
      hair: role.old ? (role.girl ? 'bun' : 'short') : role.girl ? ['long', 'bob', 'bun'][(r() * 3) | 0] : ['short', 'mush'][(r() * 2) | 0],
      hairColor: role.old ? '#b8b8b4' : ['#1a1a1a', '#2a1a12', '#4a2a1a'][(r() * 3) | 0],
      top: color, pattern: r() < .3 ? 'knit' : 'plain', bottom: ['#2a3a5a', '#1a1a1a', '#6a5a4a', '#3a3a40'][(r() * 4) | 0],
      bag: r() < .3 ? 'tote' : r() < .4 ? 'backpack' : null, glasses: r() < .25,
    };
  }
  function person(r) {
    const role = ROLE[(r() * ROLE.length) | 0], c = COLORS[(r() * COLORS.length) | 0];
    return { name: SURNAME[(r() * SURNAME.length) | 0] + role.t, look: look(r, role, c[1]), color: c[0] };
  }
  // 同一條線上，距離 a 站 lo～hi 站的車站（以及往哪個終點方向）
  function around(line, a, lo, hi, r) {
    const opts = [];
    for (const d of MRT.directionsAt(a).filter(d => d.line === line)) d.stops.forEach((x, i) => { if (i + 1 >= lo && i + 1 <= hi) opts.push({ station: x, n: i + 1, terminal: d.terminal }); });
    return opts.length ? opts[(r() * opts.length) | 0] : null;
  }
  const shopOn = line => stations(line).filter(x => Station3D.SHOPS[x]);
  const isTerm = (line, id) => MRT.terminals(line).has(id);

  const chCache = {};
  function challenge(line, id) {
    const key = line + '|' + id;
    if (chCache[key]) return chCache[key];
    const seed = hash('ch' + key), r = rng(seed);
    const idx = stations(line).indexOf(id);
    // 每條線把八種類型打散後輪流分配，同一條線的種類會平均出現
    const order = KINDS.slice().sort((a, b) => hash(line + a) - hash(line + b));
    let kind = order[(idx + (hash(line) % 8)) % 8];
    const name = x => MRT.label(x, line).zh, L = LINES[line];
    const giver = person(r);
    let c = null;
    const tryKind = k => {
      if (k === 'lost') {
        const t = around(line, id, 2, 4, r); if (!t) return null;
        const it = LOST[(r() * LOST.length) | 0];
        return { kind: k, giver, item: it[0], itemName: it[1], target: t.station,
          ask: `我的${it[1]}好像忘在${L.zh}的某一站了……我記得是往${name(t.terminal)}的方向，大概${t.n <= 2 ? '一兩' : '三四'}站以內。月台盡頭還是大廳角落，我也不確定。可以幫我找找嗎？` };
      }
      if (k === 'escort') {
        const t = around(line, id, 2, 5, r); if (!t) return null;
        return { kind: k, giver, target: t.station,
          ask: `不好意思，我要去${name(t.station)}，可是我第一次搭捷運，看不懂……可以帶我一起坐過去嗎？（帶著人的時候不能傳送）` };
      }
      if (k === 'person') {
        const t = around(line, id, 2, 5, r); if (!t) return null;
        const friend = person(r);
        return { kind: k, giver, friend, target: t.station,
          ask: (pr => `我在等${friend.name}，${pr}說${pr}在「往${name(t.terminal)}方向第 ${t.n} 站」的月台等我，可是電話打不通……${pr}穿${friend.color}的衣服。可以幫我去跟${pr}說我在${name(id)}等${pr}嗎？`)(friend.look.girl ? '她' : '他') };
      }
      if (k === 'buy') {
        const shops = shopOn(line).filter(x => Station3D.SHOPS[x].items.some(i => BUY.includes(i))); if (!shops.length) return null;
        const at = shops[(r() * shops.length) | 0], items = Station3D.SHOPS[at].items.filter(i => BUY.includes(i));
        const item = items[(r() * items.length) | 0];
        return { kind: k, giver, item, shop: at,
          ask: `我腳受傷了走不動……可以幫我買一個${ITEMS[item].name}嗎？${L.zh}上的${name(at)}站有商店在賣。買回來我會把錢還你，還多給你一點。` };
      }
      if (k === 'passage') { const pz = PASSAGE[(r() * PASSAGE.length) | 0]; return { kind: k, at: pz.at, ask: `秀蔅的紙條：${pz.riddle}<br><small>（現場不會有任何標記，靠近對的地方才會發現）</small>` }; }
      if (k === 'coins') return { kind: k, giver, ask: '剛剛被人撞了一下，零錢包整個打開……三枚硬幣滾到這一站不知道哪裡去了，有的好像掉到別的樓層。可以幫我找回來嗎？硬幣很小，要仔細看。' };
      if (k === 'way') {
        if (isTerm(line, id)) return null;
        const dirs = MRT.directionsAt(id).filter(d => d.line === line);
        const d = dirs[(r() * dirs.length) | 0], dest = d.stops[Math.min(d.stops.length - 1, 1 + ((r() * 4) | 0))];
        return { kind: k, giver, dest,
          ask: `請問……我要去${name(dest)}，應該在月台的哪一邊等車？我看不懂站牌。可以帶我到對的那一邊嗎？` };
      }
      return { kind: 'quiz' };
    };
    c = tryKind(kind) || tryKind('quiz');
    return (chCache[key] = c);
  }

  // 沒有主線委託的特別車站（新北投：溫泉站，只有支線與隱藏任務）
  const NO_MAIN = new Set(['新北投']);
  const mainStations = line => stations(line).filter(x => !NO_MAIN.has(x));
  return { stations, mainStations, NO_MAIN, hops, question, challenge, LOST, LANDMARK, RAIL };
})();
