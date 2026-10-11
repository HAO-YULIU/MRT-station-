/* 每一站不同的車站風格
 * 先依車站的特色挑一個主題（溫泉木造、大理石、古蹟紅磚、廟宇紅金、森林、河岸、潮流、都會、科技、航空、運動、社區），
 * 再依站名決定地磚花樣、牆磚排法、天花板、柱子、色調的細部變化，所以 118 站每一站看起來都不一樣。
 * Station3D.build 會用 StationStyle.of(站名) 取得這一站的風格來產生貼圖與材質。
 */
const StationStyle = (() => {
  // 主題：地板（色相、飽和、亮度、磚縫）、大廳地板、牆（底色、磚縫、排法）、柱子、天花板、燈色、護牆板
  const THEMES = {
    granite: { name: '花崗石', floor: [40, 8, 76], grout: '#8e897f', hall: [38, 7, 80], wall: '#e4e0d6', wallGrout: '#c9c3b6', col: '#e9e5dc', colLine: '#c8c1b4', ceil: 'grid', ceilC: '#b9bec4', light: '#fff6e0', dado: '#8f887b', trim: '#3c4249' },
    marble: { name: '白色大理石', floor: [210, 6, 88], grout: '#b8bcc2', hall: [40, 10, 90], wall: '#f2f0ea', wallGrout: '#d8d4ca', col: '#f6f4ee', colLine: '#cfc8b8', ceil: 'coffer', ceilC: '#ece8de', light: '#fffaf0', dado: '#d6d0c2', trim: '#a8946a', vein: true },
    heritage: { name: '古蹟紅磚', floor: [20, 18, 62], grout: '#6e5a4a', hall: [25, 15, 66], wall: '#b86a4e', wallGrout: '#8a4a36', wallTile: 'brick', col: '#c8b8a0', colLine: '#8a7a64', ceil: 'beam', ceilC: '#6a4a36', light: '#ffe2b8', dado: '#5a3a2a', trim: '#3a2a20' },
    temple: { name: '廟宇紅金', floor: [12, 30, 56], grout: '#6a3a2a', hall: [15, 25, 60], wall: '#e8dcc0', wallGrout: '#c8a868', col: '#a8282a', colLine: '#d8b048', ceil: 'coffer', ceilC: '#8a2a22', light: '#ffd8a0', dado: '#7a1e1e', trim: '#d8b048' },
    onsen: { name: '溫泉木造', floor: [30, 22, 52], grout: '#4a3a2c', hall: [32, 24, 58], wall: '#d8c8a8', wallGrout: '#a88a68', wallTile: 'vertical', col: '#8a6a48', colLine: '#5a4430', ceil: 'slats', ceilC: '#a07a52', light: '#ffe0b0', dado: '#6a4e34', trim: '#3a2c20', wood: true },
    forest: { name: '森林綠意', floor: [90, 10, 66], grout: '#6a7a62', hall: [80, 12, 70], wall: '#dfe8d6', wallGrout: '#b2c4a4', col: '#cfdcc2', colLine: '#8aa47a', ceil: 'slats', ceilC: '#b89a70', light: '#f4ffe8', dado: '#4a6a44', trim: '#2e4430', wood: true },
    river: { name: '河岸藍', floor: [200, 14, 72], grout: '#7a8a96', hall: [195, 12, 76], wall: '#dde9f0', wallGrout: '#a8c0d0', wallTile: 'mosaic', col: '#e4eef4', colLine: '#8ab0c8', ceil: 'wave', ceilC: '#c8d8e2', light: '#eef8ff', dado: '#3a6a8a', trim: '#24465c' },
    pop: { name: '潮流色塊', floor: [0, 0, 82], grout: '#9a9a9a', hall: [0, 0, 86], wall: '#f4f4f4', wallGrout: '#dadada', wallTile: 'color', col: '#f0f0f0', colLine: '#c0c0c0', ceil: 'panel', ceilC: '#e8e8e8', light: '#ffffff', dado: '#2a2a32', trim: '#e0447a', checker: true },
    urban: { name: '都會石材', floor: [220, 6, 42], grout: '#2a2e34', hall: [220, 5, 46], wall: '#d4d6d8', wallGrout: '#a4a8ae', wallTile: 'panel', col: '#3a3e44', colLine: '#c8a868', ceil: 'panel', ceilC: '#2e3238', light: '#fff2dc', dado: '#22262c', trim: '#c8a868' },
    tech: { name: '科技清水模', floor: [210, 4, 62], grout: '#6a6e74', hall: [210, 4, 66], wall: '#b8bbbe', wallGrout: '#8e9296', wallTile: 'panel', col: '#a8acb0', colLine: '#7a7e84', ceil: 'grid', ceilC: '#8e949a', light: '#eaf6ff', dado: '#4a4e54', trim: '#2a7de1', concrete: true },
    sky: { name: '航空天藍', floor: [205, 20, 80], grout: '#9ab0c4', hall: [205, 18, 84], wall: '#eef4fa', wallGrout: '#c8d8e8', wallTile: 'panel', col: '#f4f8fc', colLine: '#a8c4dc', ceil: 'wave', ceilC: '#dde8f2', light: '#f2faff', dado: '#2a5a8a', trim: '#2a5a8a' },
    sport: { name: '運動活力', floor: [30, 14, 70], grout: '#7a7064', hall: [28, 14, 74], wall: '#f0ece2', wallGrout: '#d0c8b8', wallTile: 'stripe', col: '#e8e4da', colLine: '#c4162a', ceil: 'grid', ceilC: '#c4c8cc', light: '#ffffff', dado: '#2a3a5a', trim: '#e04848' },
    suburb: { name: '社區暖色', floor: [35, 16, 72], grout: '#9a8a74', hall: [36, 16, 76], wall: '#f2e8d8', wallGrout: '#d8c8b0', col: '#ece2d2', colLine: '#c4b29a', ceil: 'panel', ceilC: '#ece6dc', light: '#fff2d8', dado: '#8a6a4a', trim: '#5a4a3a' },
  };
  // 依車站特色指定主題（沒列到的站依路線與站名分配）
  const BY_STATION = {
    marble: ['中正紀念堂', '國父紀念館', '台大醫院', '善導寺', '東門', '小南門'],
    heritage: ['北門', '大橋頭', '台北橋', '民權西路', '雙連', '新莊', '府中', '板橋', '松山', '景美'],
    temple: ['龍山寺', '行天宮', '劍潭', '圓山', '先嗇宮', '廣慈/奉天宮', '土城'],
    onsen: ['北投', '新北投', '奇岩', '復興崗', '唭哩岸', '石牌'],
    forest: ['動物園', '木柵', '萬芳社區', '萬芳醫院', '大安森林公園', '芝山', '明德', '大湖公園', '象山', '麟光', '辛亥'],
    river: ['淡水', '紅樹林', '竹圍', '關渡', '忠義', '新店', '小碧潭', '碧潭', '江子翠', '秀朗橋', '景平', '葫洲'],
    pop: ['西門', '中山', '公館', '台電大樓', '永春', '頂溪', '忠孝敦化', '松江南京'],
    urban: ['台北101/世貿', '市政府', '信義安和', '忠孝復興', '南京復興', '大安', '科技大樓', '台北車站', '忠孝新生'],
    tech: ['南港軟體園區', '東湖', '內湖', '港墘', '西湖', '劍南路', '南港展覽館', '文德', '新北產業園區', '頂埔', '南港', '昆陽', '後山埤', '幸福'],
    sky: ['松山機場', '中山國中', '大直'],
    sport: ['台北小巨蛋', '南京三民', '三重', '徐匯中學', '輔大'],
  };
  const theme = {};
  for (const [k, ids] of Object.entries(BY_STATION)) for (const id of ids) theme[id] = k;

  const hash = s => [...s].reduce((a, c) => (a * 131 + c.charCodeAt(0)) >>> 0, 2166136261);
  const FLOOR = ['grid', 'checker', 'border', 'diagonal', 'terrazzo', 'plank'];
  const WALL = ['square', 'brick', 'vertical', 'mosaic', 'panel', 'stripe', 'color'];
  const CEIL = ['grid', 'slats', 'panel', 'coffer', 'wave', 'beam'];
  const COLS = ['square', 'round', 'clad'];

  const cache = {};
  const sigOf = st => [st.theme, st.floorPat, st.hallPat, st.tiles, st.wallTile, st.colShape, st.ceil].join('|');
  let ready = false;
  // 第一次用到時一次排好全部車站：如果和前面的站組合重複，就換一組細部變化，保證 118 站每站都不同
  function prepare() {
    if (ready || typeof STATIONS === 'undefined') return; ready = true;
    const used = new Set();
    for (const id of Object.keys(STATIONS)) {
      let salt = 0, st = make(id, 0);
      while (used.has(sigOf(st)) && salt < 60) st = make(id, ++salt);
      used.add(sigOf(st)); cache[id] = st;
    }
  }
  function of(id) {
    prepare();
    return cache[id] || (cache[id] = make(id, 0));
  }
  function make(id, salt) {
    const h = hash((id || '') + (salt ? '#' + salt : '')), lines = (typeof MRT !== 'undefined' && MRT.linesAt) ? MRT.linesAt(id).map(x => x.line) : [];
    let k = theme[id];
    if (!k) {   // 沒指定的站：依路線挑比較像的主題
      const pool = lines.includes('O') || lines.includes('Y') ? ['suburb', 'suburb', 'granite', 'sport', 'river'] : lines.includes('BR') ? ['tech', 'forest', 'sky', 'granite'] : lines.includes('BL') ? ['granite', 'suburb', 'urban', 'heritage'] : ['granite', 'suburb', 'river', 'forest'];
      k = pool[hash(id || '') % pool.length];   // 主題不隨 salt 改變
    }
    const t = THEMES[k];
    // 細部變化：同主題的站也不一樣
    const v = (n, m) => ((h >>> n) % m);
    const shift = (v(3, 21) - 10);            // 色相 ±10
    const light = (v(8, 9) - 4) * .8;          // 亮度 ±3
    const st = {
      key: id, theme: k, name: t.name,
      floor: [t.floor[0] + shift, t.floor[1], t.floor[2] + light], grout: t.grout,
      hall: [t.hall[0] + shift, t.hall[1], t.hall[2] + light],
      floorPat: t.checker ? 'checker' : t.wood && v(5, 2) ? 'plank' : FLOOR[v(11, FLOOR.length)],
      hallPat: t.checker ? 'checker' : t.wood ? 'plank' : FLOOR[v(14, FLOOR.length)],
      tiles: 3 + v(17, 3),                      // 一張貼圖裡幾乘幾塊磚
      wall: t.wall, wallGrout: t.wallGrout, wallTile: t.wallTile || WALL[v(19, 4)],
      col: t.col, colLine: t.colLine, colShape: COLS[v(22, COLS.length)],
      ceil: t.ceil || CEIL[v(24, CEIL.length)], ceilC: t.ceilC,
      light: t.light, dado: t.dado, trim: t.trim,
      vein: !!t.vein, wood: !!t.wood, concrete: !!t.concrete,
      accent: lines.length ? LINES[lines[0]].color : '#2a7de1',
      pop: k === 'pop' ? ['#e0447a', '#f2c200', '#2a9de1', '#3ad06a', '#8a4ac8'].sort((a, b) => hash(a + id) - hash(b + id)) : null,
    };
    return st;
  }
  return { of, THEMES, signature: id => sigOf(of(id)) };
})();
