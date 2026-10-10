/* 台北捷運路網資料
 * stations: 車站（同名轉乘站共用同一個 id）
 *   ug: 是否為地下車站（決定月台與隧道/高架景色）
 *   x, y: 路網圖上的示意座標（0–1000）
 * lines: 路線，每條路線由一或多條「行駛路徑 routes」組成（處理支線/分岔）
 *   每條 route 是依序排列的 [車站id, 車站代碼]
 */
const STATIONS = {};
function st(id, en, ug, x, y) { STATIONS[id] = { id, zh: id, en, ug, x, y }; }

// ── 文湖線 BR ──
st('動物園', 'Taipei Zoo', false, 745, 885);
st('木柵', 'Muzha', false, 735, 855);
st('萬芳社區', 'Wanfang Community', false, 725, 825);
st('萬芳醫院', 'Wanfang Hospital', false, 715, 795);
st('辛亥', 'Xinhai', false, 705, 765);
st('麟光', 'Linguang', false, 698, 735);
st('六張犁', 'Liuzhangli', false, 690, 705);
st('科技大樓', 'Technology Building', false, 682, 675);
st('大安', 'Daan', true, 680, 640);
st('忠孝復興', 'Zhongxiao Fuxing', true, 680, 500);
st('南京復興', 'Nanjing Fuxing', true, 680, 430);
st('中山國中', 'Zhongshan Junior High School', false, 680, 385);
st('松山機場', 'Songshan Airport', true, 680, 340);
st('大直', 'Dazhi', true, 665, 295);
st('劍南路', 'Jiannan Rd.', false, 650, 250);
st('西湖', 'Xihu', false, 695, 222);
st('港墘', 'Gangqian', false, 740, 222);
st('文德', 'Wende', false, 785, 222);
st('內湖', 'Neihu', false, 830, 222);
st('大湖公園', 'Dahu Park', false, 875, 230);
st('葫洲', 'Huzhou', false, 912, 255);
st('東湖', 'Donghu', false, 940, 285);
st('南港軟體園區', 'Nangang Software Park', false, 958, 322);
st('南港展覽館', 'Nangang Exhibition Center', true, 970, 365);

// ── 淡水信義線 R ──
st('廣慈/奉天宮', 'Guangci / Fengtian Temple', true, 925, 640);
st('象山', 'Xiangshan', true, 865, 640);
st('台北101/世貿', 'Taipei 101 / World Trade Center', true, 810, 640);
st('信義安和', 'Xinyi Anhe', true, 745, 640);
st('大安森林公園', 'Daan Park', true, 625, 612);
st('東門', 'Dongmen', true, 570, 580);
st('中正紀念堂', 'Chiang Kai-Shek Memorial Hall', true, 500, 580);
st('台大醫院', 'NTU Hospital', true, 500, 540);
st('台北車站', 'Taipei Main Station', true, 500, 500);
st('中山', 'Zhongshan', true, 500, 440);
st('雙連', 'Shuanglian', true, 500, 400);
st('民權西路', 'Minquan W. Rd.', true, 500, 360);
st('圓山', 'Yuanshan', false, 500, 322);
st('劍潭', 'Jiantan', false, 500, 290);
st('士林', 'Shilin', false, 500, 258);
st('芝山', 'Zhishan', false, 508, 226);
st('明德', 'Mingde', false, 515, 196);
st('石牌', 'Shipai', false, 515, 166);
st('唭哩岸', 'Qilian', false, 500, 138);
st('奇岩', 'Qiyan', false, 482, 112);
st('北投', 'Beitou', false, 460, 90);
st('新北投', 'Xinbeitou', false, 500, 62);
st('復興崗', 'Fuxinggang', false, 430, 78);
st('忠義', 'Zhongyi', false, 400, 70);
st('關渡', 'Guandu', false, 365, 62);
st('竹圍', 'Zhuwei', false, 330, 55);
st('紅樹林', 'Hongshulin', false, 295, 48);
st('淡水', 'Tamsui', false, 255, 40);

// ── 松山新店線 G ──
st('新店', 'Xindian', false, 520, 915);
st('新店區公所', 'Xindian District Office', true, 520, 885);
st('七張', 'Qizhang', true, 520, 855);
st('小碧潭', 'Xiaobitan', false, 470, 870);
st('大坪林', 'Dapinglin', true, 520, 805);
st('景美', 'Jingmei', true, 512, 770);
st('萬隆', 'Wanlong', true, 505, 738);
st('公館', 'Gongguan', true, 500, 706);
st('台電大樓', 'Taipower Building', true, 500, 678);
st('古亭', 'Guting', true, 500, 650);
st('小南門', 'Xiaonanmen', true, 462, 568);
st('西門', 'Ximen', true, 430, 530);
st('北門', 'Beimen', true, 440, 478);
st('松江南京', 'Songjiang Nanjing', true, 570, 430);
st('台北小巨蛋', 'Taipei Arena', true, 745, 430);
st('南京三民', 'Nanjing Sanmin', true, 805, 430);
st('松山', 'Songshan', true, 865, 430);

// ── 中和新蘆線 O ──
st('南勢角', 'Nanshijiao', true, 395, 840);
st('景安', 'Jingan', true, 410, 790);
st('永安市場', 'Yongan Market', true, 432, 752);
st('頂溪', 'Dingxi', true, 455, 712);
st('忠孝新生', 'Zhongxiao Xinsheng', true, 570, 500);
st('行天宮', 'Xingtian Temple', true, 570, 395);
st('中山國小', 'Zhongshan Elementary School', true, 540, 362);
st('大橋頭', 'Daqiaotou', true, 430, 360);
st('台北橋', 'Taipei Bridge', true, 392, 372);
st('菜寮', 'Cailiao', true, 352, 386);
st('三重', 'Sanchong', true, 312, 400);
st('先嗇宮', 'Xianse Temple', true, 272, 420);
st('頭前庄', 'Touqianzhuang', true, 232, 440);
st('新莊', 'Xinzhuang', true, 192, 460);
st('輔大', 'Fu Jen University', true, 152, 480);
st('丹鳳', 'Danfeng', true, 112, 500);
st('迴龍', 'Huilong', true, 72, 520);
st('三重國小', 'Sanchong Elementary School', true, 412, 322);
st('三和國中', 'Sanhe Junior High School', true, 392, 290);
st('徐匯中學', 'St. Ignatius High School', true, 372, 258);
st('三民高中', 'Sanmin Senior High School', true, 352, 226);
st('蘆洲', 'Luzhou', true, 332, 194);

// ── 板南線 BL ──
st('頂埔', 'Dingpu', true, 70, 805);
st('永寧', 'Yongning', true, 92, 772);
st('土城', 'Tucheng', true, 115, 740);
st('海山', 'Haishan', true, 140, 710);
st('亞東醫院', 'Far Eastern Hospital', true, 168, 680);
st('府中', 'Fuzhong', true, 200, 650);
st('板橋', 'Banqiao', true, 230, 620);
st('新埔', 'Xinpu', true, 258, 588);
st('江子翠', 'Jiangzicui', true, 322, 565);
st('龍山寺', 'Longshan Temple', true, 382, 545);
st('善導寺', 'Shandao Temple', true, 535, 500);
st('忠孝敦化', 'Zhongxiao Dunhua', true, 735, 500);
st('國父紀念館', 'Sun Yat-Sen Memorial Hall', true, 785, 500);
st('市政府', 'Taipei City Hall', true, 835, 500);
st('永春', 'Yongchun', true, 885, 500);
st('後山埤', 'Houshanpi', true, 925, 480);
st('昆陽', 'Kunyang', true, 952, 450);
st('南港', 'Nangang', true, 968, 410);

// ── 環狀線 Y ──
st('十四張', 'Shisizhang', false, 485, 818);
st('秀朗橋', 'Xiulang Bridge', false, 455, 812);
st('景平', 'Jingping', false, 430, 800);
st('中和', 'Zhonghe', false, 372, 780);
st('橋和', 'Qiaohe', false, 340, 760);
st('中原', 'Zhongyuan', false, 310, 730);
st('板新', 'Banxin', false, 270, 680);
st('幸福', 'Xingfu', false, 202, 405);
st('新北產業園區', 'New Taipei Industrial Park', false, 172, 370);

// 同一實體車站在不同路線上的站名（例：板南線「新埔」＝環狀線「新埔民生」）
const LINE_LABELS = { '新埔': { Y: { zh: '新埔民生', en: 'Xinpu Minsheng' } } };

const LINES = {
  BR: {
    id: 'BR', zh: '文湖線', en: 'Wenhu Line', color: '#c48c31', text: '#fff', medium: true,
    item: { name: '棕色齒輪', desc: '從無人駕駛的列車上掉下的一枚小齒輪，還在微微轉動。', icon: 'gear' },
    routes: [[
      ['動物園', 'BR01'], ['木柵', 'BR02'], ['萬芳社區', 'BR03'], ['萬芳醫院', 'BR04'], ['辛亥', 'BR05'],
      ['麟光', 'BR06'], ['六張犁', 'BR07'], ['科技大樓', 'BR08'], ['大安', 'BR09'], ['忠孝復興', 'BR10'],
      ['南京復興', 'BR11'], ['中山國中', 'BR12'], ['松山機場', 'BR13'], ['大直', 'BR14'], ['劍南路', 'BR15'],
      ['西湖', 'BR16'], ['港墘', 'BR17'], ['文德', 'BR18'], ['內湖', 'BR19'], ['大湖公園', 'BR20'],
      ['葫洲', 'BR21'], ['東湖', 'BR22'], ['南港軟體園區', 'BR23'], ['南港展覽館', 'BR24'],
    ]],
  },
  R: {
    id: 'R', zh: '淡水信義線', en: 'Tamsui-Xinyi Line', color: '#e3002c', text: '#fff',
    item: { name: '夕照票卡', desc: '一張被淡水夕陽染紅的舊票卡，背面寫著看不懂的日期。', icon: 'ticket' },
    routes: [
      [
        ['廣慈/奉天宮', 'R01'], ['象山', 'R02'], ['台北101/世貿', 'R03'], ['信義安和', 'R04'], ['大安', 'R05'], ['大安森林公園', 'R06'],
        ['東門', 'R07'], ['中正紀念堂', 'R08'], ['台大醫院', 'R09'], ['台北車站', 'R10'], ['中山', 'R11'],
        ['雙連', 'R12'], ['民權西路', 'R13'], ['圓山', 'R14'], ['劍潭', 'R15'], ['士林', 'R16'], ['芝山', 'R17'],
        ['明德', 'R18'], ['石牌', 'R19'], ['唭哩岸', 'R20'], ['奇岩', 'R21'], ['北投', 'R22'], ['復興崗', 'R23'],
        ['忠義', 'R24'], ['關渡', 'R25'], ['竹圍', 'R26'], ['紅樹林', 'R27'], ['淡水', 'R28'],
      ],
      [['北投', 'R22'], ['新北投', 'R22A']],
    ],
  },
  G: {
    id: 'G', zh: '松山新店線', en: 'Songshan-Xindian Line', color: '#008659', text: '#fff',
    item: { name: '碧潭綠葉', desc: '一片永遠不會枯黃的葉子，葉脈像一張縮小的路線圖。', icon: 'leaf' },
    routes: [
      [
        ['新店', 'G01'], ['新店區公所', 'G02'], ['七張', 'G03'], ['大坪林', 'G04'], ['景美', 'G05'], ['萬隆', 'G06'],
        ['公館', 'G07'], ['台電大樓', 'G08'], ['古亭', 'G09'], ['中正紀念堂', 'G10'], ['小南門', 'G11'],
        ['西門', 'G12'], ['北門', 'G13'], ['中山', 'G14'], ['松江南京', 'G15'], ['南京復興', 'G16'],
        ['台北小巨蛋', 'G17'], ['南京三民', 'G18'], ['松山', 'G19'],
      ],
      [['七張', 'G03'], ['小碧潭', 'G03A']],
    ],
  },
  O: {
    id: 'O', zh: '中和新蘆線', en: 'Zhonghe-Xinlu Line', color: '#f8b61c', text: '#3a2a00',
    item: { name: '橘色懷錶', desc: '指針停在 00:30，但你把它貼近耳朵時，聽得到滴答聲。', icon: 'watch' },
    routes: [
      [
        ['南勢角', 'O01'], ['景安', 'O02'], ['永安市場', 'O03'], ['頂溪', 'O04'], ['古亭', 'O05'], ['東門', 'O06'],
        ['忠孝新生', 'O07'], ['松江南京', 'O08'], ['行天宮', 'O09'], ['中山國小', 'O10'], ['民權西路', 'O11'],
        ['大橋頭', 'O12'], ['台北橋', 'O13'], ['菜寮', 'O14'], ['三重', 'O15'], ['先嗇宮', 'O16'],
        ['頭前庄', 'O17'], ['新莊', 'O18'], ['輔大', 'O19'], ['丹鳳', 'O20'], ['迴龍', 'O21'],
      ],
      [
        ['南勢角', 'O01'], ['景安', 'O02'], ['永安市場', 'O03'], ['頂溪', 'O04'], ['古亭', 'O05'], ['東門', 'O06'],
        ['忠孝新生', 'O07'], ['松江南京', 'O08'], ['行天宮', 'O09'], ['中山國小', 'O10'], ['民權西路', 'O11'],
        ['大橋頭', 'O12'], ['三重國小', 'O50'], ['三和國中', 'O51'], ['徐匯中學', 'O52'], ['三民高中', 'O53'],
        ['蘆洲', 'O54'],
      ],
    ],
  },
  BL: {
    id: 'BL', zh: '板南線', en: 'Bannan Line', color: '#0070bd', text: '#fff',
    item: { name: '藍色車廂鑰匙', desc: '一把刻著「第七節車廂」的鑰匙——可是板南線只有六節。', icon: 'key' },
    routes: [[
      ['頂埔', 'BL01'], ['永寧', 'BL02'], ['土城', 'BL03'], ['海山', 'BL04'], ['亞東醫院', 'BL05'], ['府中', 'BL06'],
      ['板橋', 'BL07'], ['新埔', 'BL08'], ['江子翠', 'BL09'], ['龍山寺', 'BL10'], ['西門', 'BL11'],
      ['台北車站', 'BL12'], ['善導寺', 'BL13'], ['忠孝新生', 'BL14'], ['忠孝復興', 'BL15'], ['忠孝敦化', 'BL16'],
      ['國父紀念館', 'BL17'], ['市政府', 'BL18'], ['永春', 'BL19'], ['後山埤', 'BL20'], ['昆陽', 'BL21'],
      ['南港', 'BL22'], ['南港展覽館', 'BL23'],
    ]],
  },
  Y: {
    id: 'Y', zh: '環狀線', en: 'Circular Line', color: '#fedb00', text: '#3a3000',
    item: { name: '金色指南環', desc: '一個沒有指針的指南針，外圈卻會慢慢朝某個方向發光。', icon: 'ring' },
    routes: [[
      ['大坪林', 'Y07'], ['十四張', 'Y08'], ['秀朗橋', 'Y09'], ['景平', 'Y10'], ['景安', 'Y11'], ['中和', 'Y12'],
      ['橋和', 'Y13'], ['中原', 'Y14'], ['板新', 'Y15'], ['板橋', 'Y16'], ['新埔', 'Y17'], ['頭前庄', 'Y18'],
      ['幸福', 'Y19'], ['新北產業園區', 'Y20'],
    ]],
  },
};
const LINE_ORDER = ['BR', 'R', 'G', 'O', 'BL', 'Y'];

/* ── 查詢工具 ── */
const MRT = {
  // 某站在某線上顯示的名稱
  label(stationId, lineId) {
    const s = STATIONS[stationId];
    const l = LINE_LABELS[stationId] && LINE_LABELS[stationId][lineId];
    return l ? { zh: l.zh, en: l.en } : { zh: s.zh, en: s.en };
  },
  // 經過某站的所有路線與代碼
  linesAt(stationId) {
    const out = [];
    for (const lid of LINE_ORDER) {
      for (const route of LINES[lid].routes) {
        const hit = route.find(([id]) => id === stationId);
        if (hit) { out.push({ line: lid, code: hit[1] }); break; }
      }
    }
    return out;
  },
  // 某線所有終點站
  terminals(lineId) {
    // 在該線上只有一個相鄰車站的站就是終點站（北投、七張、大橋頭這類分岔站不算）
    const nb = {};
    for (const r of LINES[lineId].routes) {
      for (let i = 0; i < r.length; i++) {
        const id = r[i][0];
        nb[id] = nb[id] || new Set();
        if (i > 0) nb[id].add(r[i - 1][0]);
        if (i < r.length - 1) nb[id].add(r[i + 1][0]);
      }
    }
    return new Set(Object.keys(nb).filter(id => nb[id].size === 1));
  },
  // 在某站可搭乘的方向（月台）。每個方向：{ line, terminal, stops:[後續各站] }
  directionsAt(stationId) {
    const dirs = [];
    const seen = new Set();
    for (const lid of LINE_ORDER) {
      for (const route of LINES[lid].routes) {
        const ids = route.map(r => r[0]);
        const i = ids.indexOf(stationId);
        if (i < 0) continue;
        for (const step of [1, -1]) {
          const stops = [];
          for (let j = i + step; j >= 0 && j < ids.length; j += step) stops.push(ids[j]);
          if (!stops.length) continue;
          const terminal = stops[stops.length - 1];
          const key = lid + '>' + terminal;
          if (seen.has(key)) continue;
          seen.add(key);
          dirs.push({ line: lid, terminal, stops });
        }
      }
    }
    return dirs;
  },
  code(stationId, lineId) {
    const hit = this.linesAt(stationId).find(l => l.line === lineId);
    return hit ? hit.code : '';
  },
  // 地圖用：每條路線的所有區段
  segments() {
    const segs = [];
    for (const lid of LINE_ORDER) {
      for (const route of LINES[lid].routes) {
        for (let i = 0; i < route.length - 1; i++) segs.push({ line: lid, a: route[i][0], b: route[i + 1][0] });
      }
    }
    return segs;
  },
  // 某站在某線上的月台是否在地下（文湖線、環狀線大多為高架）
  undergroundOn(stationId, lineId) {
    if (lineId === 'BR') return stationId === '松山機場' || stationId === '大直';
    if (lineId === 'Y') return stationId === '大坪林';
    return STATIONS[stationId].ug;
  },
  // 兩站之間是否為地下區段（任一端在地下就以隧道呈現）
  isTunnel(a, b, lineId) { return this.undergroundOn(a, lineId) || this.undergroundOn(b, lineId); },
};

// HTML 跳脫
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
