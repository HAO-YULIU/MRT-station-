/* 每一站不同的車站風格
 * 先依車站的特色挑一個主題（溫泉木造、大理石、古蹟紅磚、廟宇紅金、森林、河岸、潮流、都會、科技、航空、運動、社區），
 * 再依站名決定地磚花樣、牆磚排法、天花板、柱子、色調的細部變化，所以 118 站每一站看起來都不一樣。
 * Station3D.build 會用 StationStyle.of(站名) 取得這一站的風格來產生貼圖與材質。
 */
const StationStyle = (() => {
  // 主題：地板（色相、飽和、亮度、磚縫）、大廳地板、牆（底色、磚縫、排法）、柱子、天花板、燈色、護牆板
  const THEMES = {
    granite: { name: '花崗石', floor: [40, 8, 76], grout: '#8e897f', hall: [38, 7, 80], wall: '#e4e0d6', wallGrout: '#c9c3b6', col: '#e9e5dc', colLine: '#c8c1b4', ceil: 'grid', ceilC: '#b9bec4', light: '#fff6e0', dado: '#8f887b', trim: '#3c4249' },
    marble: { name: '白色大理石', floor: [210, 6, 88], grout: '#b8bcc2', hall: [40, 10, 90], wall: '#f2f0ea', wallGrout: '#d8d4ca', col: '#f6f4ee', colLine: '#cfc8b8', ceil: 'coffer', ceilC: '#ece8de', light: '#fffaf0', dado: '#d6d0c2', trim: '#a8946a', vein: true , feature: 'globe' },
    heritage: { name: '古蹟紅磚', floor: [20, 18, 62], grout: '#6e5a4a', hall: [25, 15, 66], wall: '#b86a4e', wallGrout: '#8a4a36', wallTile: 'brick', col: '#c8b8a0', colLine: '#8a7a64', ceil: 'beam', ceilC: '#6a4a36', light: '#ffe2b8', dado: '#5a3a2a', trim: '#3a2a20' , feature: 'lantern' },
    temple: { name: '廟宇紅金', floor: [12, 30, 56], grout: '#6a3a2a', hall: [15, 25, 60], wall: '#e8dcc0', wallGrout: '#c8a868', col: '#a8282a', colLine: '#d8b048', ceil: 'coffer', ceilC: '#8a2a22', light: '#ffd8a0', dado: '#7a1e1e', trim: '#d8b048' , feature: 'lantern' },
    onsen: { name: '溫泉木造', floor: [30, 22, 52], grout: '#4a3a2c', hall: [32, 24, 58], wall: '#d8c8a8', wallGrout: '#a88a68', wallTile: 'vertical', col: '#8a6a48', colLine: '#5a4430', ceil: 'slats', ceilC: '#a07a52', light: '#ffe0b0', dado: '#6a4e34', trim: '#3a2c20', wood: true , feature: 'woodlamp' },
    forest: { name: '森林綠意', floor: [90, 10, 66], grout: '#6a7a62', hall: [80, 12, 70], wall: '#dfe8d6', wallGrout: '#b2c4a4', col: '#cfdcc2', colLine: '#8aa47a', ceil: 'slats', ceilC: '#b89a70', light: '#f4ffe8', dado: '#4a6a44', trim: '#2e4430', wood: true , feature: 'plant' },
    river: { name: '河岸藍', floor: [200, 14, 72], grout: '#7a8a96', hall: [195, 12, 76], wall: '#dde9f0', wallGrout: '#a8c0d0', wallTile: 'mosaic', col: '#e4eef4', colLine: '#8ab0c8', ceil: 'wave', ceilC: '#c8d8e2', light: '#eef8ff', dado: '#3a6a8a', trim: '#24465c' , feature: 'globe' },
    pop: { name: '潮流色塊', floor: [0, 0, 82], grout: '#9a9a9a', hall: [0, 0, 86], wall: '#f4f4f4', wallGrout: '#dadada', wallTile: 'color', col: '#f0f0f0', colLine: '#c0c0c0', ceil: 'panel', ceilC: '#e8e8e8', light: '#ffffff', dado: '#2a2a32', trim: '#e0447a', checker: true , feature: 'neon' },
    urban: { name: '都會石材', floor: [220, 6, 42], grout: '#2a2e34', hall: [220, 5, 46], wall: '#d4d6d8', wallGrout: '#a4a8ae', wallTile: 'panel', col: '#3a3e44', colLine: '#c8a868', ceil: 'panel', ceilC: '#2e3238', light: '#fff2dc', dado: '#22262c', trim: '#c8a868' , feature: 'spot' },
    tech: { name: '科技清水模', floor: [210, 4, 62], grout: '#6a6e74', hall: [210, 4, 66], wall: '#b8bbbe', wallGrout: '#8e9296', wallTile: 'panel', col: '#a8acb0', colLine: '#7a7e84', ceil: 'grid', ceilC: '#8e949a', light: '#eaf6ff', dado: '#4a4e54', trim: '#2a7de1', concrete: true , feature: 'dots' },
    sky: { name: '航空天藍', floor: [205, 20, 80], grout: '#9ab0c4', hall: [205, 18, 84], wall: '#eef4fa', wallGrout: '#c8d8e8', wallTile: 'panel', col: '#f4f8fc', colLine: '#a8c4dc', ceil: 'wave', ceilC: '#dde8f2', light: '#f2faff', dado: '#2a5a8a', trim: '#2a5a8a' , feature: 'plane' },
    sport: { name: '運動活力', floor: [30, 14, 70], grout: '#7a7064', hall: [28, 14, 74], wall: '#f0ece2', wallGrout: '#d0c8b8', wallTile: 'stripe', col: '#e8e4da', colLine: '#c4162a', ceil: 'grid', ceilC: '#c4c8cc', light: '#ffffff', dado: '#2a3a5a', trim: '#e04848' , feature: 'pennant' },
    neon: { name: '夜市霓虹', floor: [250, 10, 30], grout: '#141420', hall: [250, 10, 34], wall: '#2a2a3a', wallGrout: '#1a1a26', wallTile: 'neon', col: '#33334a', colLine: '#ff4fa0', ceil: 'neon', ceilC: '#1c1c2a', light: '#ffd0f0', dado: '#14141e', trim: '#3ad0ff', feature: 'neon' },
    retro: { name: '台式懷舊花磚', floor: [30, 30, 74], grout: '#8a7a64', hall: [32, 30, 76], floorPat: 'flower', wall: '#e8f0e4', wallGrout: '#b8c8b0', wallTile: 'flower', col: '#d8e4d0', colLine: '#5a8a6a', ceil: 'beam', ceilC: '#7a5a3a', light: '#fff0d0', dado: '#3a6a5a', trim: '#a8342a', feature: 'lantern' },
    sunset: { name: '淡水夕照', floor: [24, 40, 70], grout: '#9a6a4a', hall: [20, 36, 74], wall: '#f8e0c8', wallGrout: '#e0b090', wallTile: 'wave', col: '#f4d4b4', colLine: '#c4405a', ceil: 'wave', ceilC: '#f0c8a8', light: '#ffd8a8', dado: '#8a3a4a', trim: '#5a3a7a', feature: 'globe' },
    ocean: { name: '海洋水族', floor: [195, 40, 56], grout: '#2a5a7a', hall: [190, 36, 62], floorPat: 'hex', wall: '#c8eaf4', wallGrout: '#7ab8d0', wallTile: 'wave', col: '#a8d8e8', colLine: '#2a7aa8', ceil: 'wave', ceilC: '#7ab8d4', light: '#d8f4ff', dado: '#1a4a6a', trim: '#f2a03a', feature: 'fish' },
    library: { name: '書香', floor: [28, 30, 48], grout: '#3a2a1c', hall: [28, 30, 52], floorPat: 'herring', wall: '#efe4cc', wallGrout: '#c8b48c', wallTile: 'shelf', col: '#7a5434', colLine: '#4a321e', ceil: 'coffer', ceilC: '#5a3e26', light: '#ffe2b0', dado: '#4a321e', trim: '#2a5a3a', wood: true, feature: 'pendant' },
    gallery: { name: '藝廊', floor: [0, 0, 90], grout: '#c8c8c8', hall: [0, 0, 92], wall: '#fafaf8', wallGrout: '#ececea', wallTile: 'panel', col: '#ffffff', colLine: '#d8d8d8', ceil: 'panel', ceilC: '#f4f4f2', light: '#ffffff', dado: '#e8e8e6', trim: '#1d1d20', feature: 'spot', vein: false },
    scifi: { name: '未來科幻', floor: [215, 18, 22], grout: '#3ad0ff', hall: [215, 18, 26], floorPat: 'hex', wall: '#1e2a38', wallGrout: '#3ad0ff', wallTile: 'neon', col: '#24303e', colLine: '#3ad0ff', ceil: 'stars', ceilC: '#121a24', light: '#c8f0ff', dado: '#0e141c', trim: '#3ad0ff', feature: 'dots' },
    starry: { name: '星空', floor: [230, 20, 30], grout: '#1a1e3a', hall: [230, 20, 34], wall: '#24284a', wallGrout: '#3a3e6a', wallTile: 'panel', col: '#2a2e52', colLine: '#f2c200', ceil: 'stars', ceilC: '#0e1028', light: '#fff2c8', dado: '#14163a', trim: '#f2c200', feature: 'dots' },
    flower: { name: '花卉', floor: [340, 18, 84], grout: '#c8a8b0', hall: [345, 16, 86], floorPat: 'flower', wall: '#fbeef0', wallGrout: '#e8c8d0', wallTile: 'flower', col: '#f8e8ec', colLine: '#d87890', ceil: 'panel', ceilC: '#f6ecee', light: '#fff4f6', dado: '#8a4a5a', trim: '#5a8a4a', feature: 'plant' },
    garden: { name: '庭園', floor: [80, 8, 60], grout: '#4a4a40', hall: [70, 8, 64], floorPat: 'border', wall: '#e8e4d4', wallGrout: '#b8b098', wallTile: 'brick', col: '#c84a3a', colLine: '#3a2a20', ceil: 'beam', ceilC: '#5a3a28', light: '#fff0d8', dado: '#3a4a32', trim: '#8a2a22', feature: 'lantern' },
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
    sport: ['台北小巨蛋', '南京三民', '三重', '徐匯中學'],
    // 第二批主題（後面的會蓋過前面的分配）
    neon: ['士林', '西門', '松山', '雙連', '景美', '頂溪'],
    retro: ['大橋頭', '台北橋', '菜寮', '新莊', '永安市場', '三重國小'],
    sunset: ['淡水'],
    ocean: ['紅樹林', '竹圍'],
    library: ['公館', '台電大樓', '古亭', '輔大'],
    gallery: ['中山', '松江南京', '忠孝新生'],
    scifi: ['南港展覽館', '新北產業園區', '幸福'],
    starry: ['劍南路', '大直'],
    flower: ['圓山', '芝山'],
    garden: ['府中'],
  };
  const theme = {};
  for (const [k, ids] of Object.entries(BY_STATION)) for (const id of ids) theme[id] = k;

  const hash = s => [...s].reduce((a, c) => (a * 131 + c.charCodeAt(0)) >>> 0, 2166136261);
  const FLOOR = ['grid', 'checker', 'border', 'diagonal', 'terrazzo', 'plank', 'hex', 'herring', 'flower'];
  const WALL = ['square', 'brick', 'vertical', 'mosaic', 'panel', 'stripe', 'color', 'wave', 'flower'];
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
      floorPat: t.floorPat && v(5, 3) ? t.floorPat : t.checker ? 'checker' : t.wood && v(5, 2) ? 'plank' : FLOOR[v(11, FLOOR.length)],
      hallPat: t.floorPat || (t.checker ? 'checker' : t.wood ? 'plank' : FLOOR[v(14, FLOOR.length)]),
      tiles: 3 + v(17, 3),                      // 一張貼圖裡幾乘幾塊磚
      wall: t.wall, wallGrout: t.wallGrout, wallTile: t.wallTile || WALL[v(19, 4)],
      col: t.col, colLine: t.colLine, colShape: COLS[v(22, COLS.length)],
      ceil: t.ceil || CEIL[v(24, CEIL.length)], ceilC: t.ceilC,
      light: t.light, dado: t.dado, trim: t.trim, feature: t.feature || null, dark: t.hall[2] < 40,
      vein: !!t.vein, wood: !!t.wood, concrete: !!t.concrete,
      accent: lines.length ? LINES[lines[0]].color : '#2a7de1',
      pop: k === 'pop' ? ['#e0447a', '#f2c200', '#2a9de1', '#3ad06a', '#8a4ac8'].sort((a, b) => hash(a + id) - hash(b + id)) : null,
    };
    return st;
  }
  return { of, THEMES, signature: id => sigOf(of(id)) };
})();
