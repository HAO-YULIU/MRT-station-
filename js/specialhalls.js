/* 特殊車站大廳：22 個車站的大廳中央有專屬的大型特色裝置（可以走過去「欣賞」，會跳出介紹）
 * 由 Station3D.build 在花草裝飾（Decor）之前呼叫，裝置會登記成障礙物，後面的裝飾、設施會自動避開。
 * 位置：在付費區大廳找一塊夠大的空地（避開電扶梯口、閘門、房門、看板、設施點）。
 */
const SpecialHalls = (() => {
  // 每站：名稱、介紹、佔地（寬×深）、建造函式
  const HALLS = {
    台北車站: { name: '旅人廣場', w: 10, d: 7, text: '大廳中央的圓形旅人廣場，上方是挑高的光井。地上的銅環刻著台灣各地的方位與距離，很多人約在這裡碰面。', make: 'plaza' },
    中正紀念堂: { name: '捷運藝廊', w: 9, d: 5, text: '一整排白色展牆，展出捷運沿線的老照片與畫作。每一季換一次展，今天的主題是「月台上的光」。', make: 'gallery' },
    龍山寺: { name: '廟埕牌樓', w: 8, d: 5, text: '仿龍山寺山門的紅色牌樓，簷下掛著燈籠。很多旅客出站前會在這裡雙手合十。', make: 'gate' },
    西門: { name: '街頭舞台', w: 8, d: 6, text: '霓虹燈圍起來的小舞台，週末晚上有街舞和樂團。地上貼著「表演請登記」的貼紙。', make: 'stage' },
    '台北101/世貿': { name: '101 模型塔', w: 6, d: 6, text: '一比兩百的台北 101 模型，跨年夜會跟著真正的 101 一起亮燈。底座寫著它的高度：508 公尺。', make: 'tower' },
    中山: { name: '文創市集', w: 10, d: 5, text: '三個木頭攤位：手工書、底片相機、乾燥花。攤主說，這條地下街以前是書街。', make: 'market' },
    動物園: { name: '動物雕塑園', w: 9, d: 6, text: '草地上站著熊貓、長頸鹿和大象的雕塑。小朋友最喜歡爬上大象的鼻子拍照。', make: 'zoo' },
    淡水: { name: '夕陽船座', w: 9, d: 5, text: '用舊木船改成的長椅，背後的大壁畫是淡水河口的夕陽。傍晚的燈光會慢慢變成橘紅色。', make: 'boat' },
    北投: { name: '溫泉蒸氣池', w: 7, d: 5, text: '石頭圍起來的小池子冒著白色的蒸氣（是水霧，不是真的溫泉）。旁邊的牌子寫著北投溫泉的歷史。', make: 'steam' },
    松山機場: { name: '飛行展示區', w: 9, d: 6, text: '天花板吊著一架小飛機模型，下面的看板顯示今天的航班。偶爾會聽到跑道傳來的引擎聲。', make: 'plane' },
    大安森林公園: { name: '室內森林', w: 9, d: 7, text: '天窗下種了一圈真的樹，地上鋪著木棧道。這一站的空氣聞起來比別站清新。', make: 'forest' },
    南港展覽館: { name: '展覽大螢幕', w: 10, d: 5, text: '三面大螢幕輪播最新的展覽，前面擺著幾台試玩機。展期中這裡永遠排著隊。', make: 'expo' },
    市政府: { name: '跨年倒數鐘', w: 8, d: 5, text: '巨大的數字鐘每天倒數到午夜。十二月三十一日的晚上，整個大廳會一起喊出最後十秒。', make: 'clock' },
    公館: { name: '閱讀角', w: 9, d: 5, text: '兩面書牆和幾張沙發，書可以借走、看完放回任何一站的閱讀角。很多學生在這裡等人。', make: 'books' },
    台北小巨蛋: { name: '溜冰舞台', w: 9, d: 6, text: '一塊會反光的「冰面」舞台，兩旁站著運動員剪影。比賽日會擠滿穿著球衣的人。', make: 'rink' },
    圓山: { name: '花博花塔', w: 7, d: 7, text: '三層高的花塔，種滿當季的花。每年花博季，這裡會換上新的主題花。', make: 'flowers' },
    劍潭: { name: '夜市小吃街', w: 11, d: 5, text: '四個小吃攤的招牌：大餅包小餅、蚵仔煎、珍珠奶茶、雞排。（只有招牌，沒有在賣——要吃請出站去士林夜市。）', make: 'food' },
    國父紀念館: { name: '書法屏風', w: 8, d: 4, text: '一排書法屏風寫著「天下為公」。旁邊的桌上放著毛筆，可以在水寫布上練字。', make: 'screen' },
    象山: { name: '登山口', w: 8, d: 5, text: '仿象山步道口的石階和木頭指標：「往六巨石 1.2 km」。很多人穿著登山鞋從這裡出站。', make: 'trail' },
    府中: { name: '園林圓門', w: 8, d: 5, text: '仿林家花園的圓形洞門和花窗，門後是一小片竹子。穿過洞門，聲音好像變小了。', make: 'moongate' },
    南港軟體園區: { name: '機器人展示', w: 8, d: 5, text: '三台會揮手的服務機器人站在展台上。說「你好」的話，中間那台會回答你今天的天氣。', make: 'robots' },
    東門: { name: '小吃街招牌', w: 9, d: 5, text: '永康街的老招牌：小籠包、牛肉麵、芒果冰。蒸籠是假的，但旁邊的香味好像是真的。', make: 'food2' },
  };

  function build(L, g, K) {
    const h = HALLS[L.stationId]; if (!h) return;
    const T = K.T, M = K.M, box = K.box;
    const C = L.concourse, gz = L.gateZ;
    // 找空地：避開電扶梯口、障礙物、設施點、房門、看板、閘門前
    const ramps = L.platforms.flatMap(P => P.ramps.map(r => ({ x0: Math.min(r.xa, r.xb) - 3, x1: Math.max(r.xa, r.xb) + 3, z0: r.z - 3.5, z1: r.z + 3.5 })));
    const hit = (a, o) => a.x0 < o.x1 && a.x1 > o.x0 && a.z0 < o.z1 && a.z1 > o.z0;
    const free = a => a.x0 > C.x0 + 2 && a.x1 < C.x1 - 2 && a.z0 > C.z0 + 2.5 && a.z1 < gz - 5
      && !ramps.some(o => hit(a, o))
      && !(L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && hit(a, o))
      && !L.spots.some(s => Math.abs(s.y || 0) < .5 && s.x > a.x0 - 1.5 && s.x < a.x1 + 1.5 && s.z > a.z0 - 1.5 && s.z < a.z1 + 1.5)
      && !(L.rooms || []).some(r => hit(a, { x0: r.door.wx - 3, x1: r.door.wx + 3, z0: r.door.z - 2, z1: r.door.z + 2 }))
      && !(L.ads || []).some(d => hit(a, { x0: d.x - 2, x1: d.x + 2, z0: d.z - 2, z1: d.z + 2 }));
    let spot = null;
    const cands = [];
    for (let x = C.x0 + 2 + h.w / 2; x <= C.x1 - 2 - h.w / 2; x += 1) for (let z = C.z0 + 2.5 + h.d / 2; z <= gz - 5 - h.d / 2; z += 1) cands.push([x, z]);
    cands.sort((a, b) => (Math.abs(a[0]) + Math.abs(a[1] - (C.z0 + gz) / 2) * .6) - (Math.abs(b[0]) + Math.abs(b[1] - (C.z0 + gz) / 2) * .6));   // 越靠大廳中央越好
    for (const [x, z] of cands) { const a = { x0: x - h.w / 2, x1: x + h.w / 2, z0: z - h.d / 2, z1: z + h.d / 2 }; if (free(a)) { spot = { x, z }; break; } }
    if (!spot) { L.specialHall = { name: h.name, placed: false }; return; }
    const { x: cx, z: cz } = spot;
    const grp = new T.Group(); grp.position.set(cx, 0, cz); g.add(grp);
    const B = (w, hh, d, c, x, y, z, o = {}) => box(w, hh, d, typeof c === 'string' ? M(c, o) : c, x, y, z, grp);
    const cyl = (r0, r1, hh, c, x, y, z, seg = 14, o = {}) => { const m = new T.Mesh(new T.CylinderGeometry(r0, r1, hh, seg), typeof c === 'string' ? M(c, o) : c); m.position.set(x, y, z); grp.add(m); return m; };
    const sph = (r, c, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new T.Mesh(new T.SphereGeometry(r, 12, 9), typeof c === 'string' ? M(c) : c); m.position.set(x, y, z); m.scale.set(sx, sy, sz); grp.add(m); return m; };
    const em = (c, i = 1) => M(c, { e: c, ei: i });
    const label = (txt, w, hh, x, y, z, bg = '#23272b', fg = '#fff', ry = 0) => {
      const t = K.canvasTex(512, Math.round(512 * hh / w), (x2, W, H) => { x2.fillStyle = bg; x2.fillRect(0, 0, W, H); x2.fillStyle = fg; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.font = `700 ${Math.round(H * .5)}px "Noto Sans TC", sans-serif`; x2.fillText(txt, W / 2, H / 2); });
      const p = new T.Mesh(new T.PlaneGeometry(w, hh), new T.MeshBasicMaterial({ map: t })); p.position.set(x, y, z); p.rotation.y = ry; grp.add(p); return p;
    };
    const solid = (x0, z0, x1, z1) => K.solid(cx + (x0 + x1) / 2, cz + (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(z1 - z0));
    const W = h.w / 2, D = h.d / 2;
    const tree = (x, z, s = 1) => { cyl(.12 * s, .16 * s, 1.6 * s, '#6a4a30', x, .8 * s, z, 7); sph(.9 * s, '#3d7a4a', x, 2 * s, z, 1, .85, 1); sph(.6 * s, '#4a8a3a', x + .4 * s, 2.4 * s, z - .2 * s); solid(x - .5 * s, z - .5 * s, x + .5 * s, z + .5 * s); };
    const plinth = (w, d, c = '#d8d4cc') => { B(w, .12, d, c, 0, .06, 0, { r: .5 }); };

    switch (h.make) {
      case 'plaza': {
        cyl(3.4, 3.4, .06, '#c8b088', 0, .03, 0, 40, { r: .3, m: .5 });
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; B(.06, .065, 1.2, '#8a6a3a', Math.cos(a) * 2.6, .04, Math.sin(a) * 2.6, { m: .7 }).rotation.y = -a; }
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .26; const s = B(1.6, .45, .5, '#4a5058', Math.cos(a) * 4.2, .23, Math.sin(a) * 2.9, { r: .4 }); s.rotation.y = -a + Math.PI / 2; }
        cyl(3, 3, .08, em('#fff6e0', .8), 0, 4.1, 0, 40);
        label('旅人廣場 Travelers\' Plaza', 3.2, .5, 0, 2.6, 0, '#7a1e1e', '#f6e2a8');
        cyl(.06, .06, 2.4, '#3a3a3a', 0, 1.2, 0, 8); solid(-.4, -.4, .4, .4);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .26; solid(Math.cos(a) * 4.2 - .5, Math.sin(a) * 2.9 - .5, Math.cos(a) * 4.2 + .5, Math.sin(a) * 2.9 + .5); }
        break;
      }
      case 'gallery': {
        for (const z of [-D + .3, D - .3]) {
          B(h.w - 1, 2.6, .2, '#f6f4ee', 0, 1.3, z, { r: .7 });
          for (let i = 0; i < 4; i++) { const x = -W + 1.5 + i * 2; const col = ['#c4405a', '#2a7de1', '#f2a03a', '#3d7a4a'][i]; B(1.3, 1, .04, '#2a2a2a', x, 1.6, z + (z < 0 ? .12 : -.12)); B(1.15, .85, .045, col, x, 1.6, z + (z < 0 ? .13 : -.13), { r: .8 }); }
          solid(-W + .5, z - .15, W - .5, z + .15);
        }
        B(1.2, .9, .8, '#ffffff', 0, .45, 0, { r: .6 }); sph(.3, '#c8a868', 0, 1.2, 0, 1, 1.3, 1); solid(-.6, -.4, .6, .4);
        label('捷運藝廊 Metro Gallery', 3, .45, 0, 2.95, -D + .42, '#1d1d20');
        break;
      }
      case 'gate': {
        for (const x of [-W + 1, -1.1, 1.1, W - 1]) { cyl(.22, .26, 3.4, '#b3241e', x, 1.7, 0, 10); cyl(.36, .36, .3, '#3a3a3a', x, .15, 0, 10); solid(x - .35, -.35, x + .35, .35); }
        B(h.w, .4, 1.2, '#2a6a4a', 0, 3.6, 0); B(h.w + .8, .18, 1.6, '#b3241e', 0, 3.9, 0); B(h.w + .4, .3, 1.3, '#d8b048', 0, 4.1, 0, { m: .5 });
        label('龍山寺', 2.2, .7, 0, 3.15, .62, '#1d1d20', '#d8b048');
        for (const x of [-2.4, 0, 2.4]) { cyl(.012, .012, .5, '#2a2a2a', x, 3.15, -.4, 4); sph(.28, em('#d8282a', .5), x, 2.75, -.4, 1, 1.25, 1); }
        cyl(.6, .45, .8, '#4a4038', 0, .4, -D + .6, 10, { m: .5 }); solid(-.6, -D, .6, -D + 1.2);
        break;
      }
      case 'stage': {
        B(h.w - 1, .45, h.d - 2, '#1d1d24', 0, .225, -.5, { r: .3 }); solid(-W + .5, -D + .5, W - .5, D - 1.5);
        const neon = ['#ff4fa0', '#3ad0ff', '#f2e040'];
        for (let i = 0; i < 3; i++) B(h.w - 1, .05, .05, em(neon[i], 1.6), 0, 2.9 + i * .25, -D + .6);
        for (const x of [-W + .6, W - .6]) { B(.15, 3.6, .15, '#2a2a30', x, 1.8, -D + .6); B(.5, .8, .5, '#1a1a1a', x, .85, -D + 1.2); }
        label('STREET STAGE 街頭舞台', 3.6, .55, 0, 3.75, -D + .55, '#14141e', '#ff4fa0');
        cyl(.02, .02, 1.5, '#888', 0, 1.2, .5, 6); sph(.07, '#222', 0, 1.98, .5);
        break;
      }
      case 'tower': {
        plinth(4, 4, '#2e3238'); solid(-2, -2, 2, 2);
        for (let i = 0; i < 8; i++) { const y = .3 + i * .42; B(1.05 - i * .025, .4, 1.05 - i * .025, M('#5a8a7a', { r: .2, m: .6 }), 0, y + .2, 0).rotation.y = Math.PI / 4; cyl(.62, .62, .03, '#d8b048', 0, y + .41, 0, 4, { m: .7 }); }
        B(.5, .6, .5, '#5a8a7a', 0, 3.95, 0, { m: .6 }); cyl(.03, .05, 1, '#c8cdd2', 0, 4.6, 0, 6);
        label('TAIPEI 101  508 m', 2.4, .4, 0, .35, 2.02, '#1d1d20', '#d8b048');
        break;
      }
      case 'market': case 'food': case 'food2': {
        const sets = { market: [['手工書', '#7a5a3a'], ['底片相機', '#3a4a5a'], ['乾燥花', '#8a4a5a']], food: [['大餅包小餅', '#c4162a'], ['蚵仔煎', '#d87a1a'], ['珍珠奶茶', '#5a3a2a'], ['雞排', '#e0a020']], food2: [['小籠包', '#c4162a'], ['牛肉麵', '#7a3a1a'], ['芒果冰', '#f2a03a']] }[h.make];
        const n = sets.length, sp = (h.w - .6) / n;
        sets.forEach(([t, c], i) => {
          const x = -W + .3 + sp * (i + .5);
          B(sp - .4, .95, 1, '#c8a070', x, .475, 0, { r: .7 }); B(sp - .3, .06, 1.15, '#e8dcc0', x, .98, 0);
          for (const dx of [-(sp - .5) / 2, (sp - .5) / 2]) B(.08, 1.4, .08, '#5a3a20', x + dx, 1.7, -.45);
          B(sp - .3, .5, .06, c, x, 2.5, -.45); label(t, sp - .5, .4, x, 2.5, -.41, c, '#fff');
          B(sp - .2, .05, 1.3, M(c, { r: .6 }), x, 2.82, .1).rotation.x = -.25;
          if (h.make !== 'market') for (let k = 0; k < 2; k++) cyl(.18, .18, .14, '#d8c8a0', x - .25 + k * .5, 1.08, .1, 10);
          else for (let k = 0; k < 3; k++) B(.25, .06 + k * .02, .18, ['#c4405a', '#2a7de1', '#3d7a4a'][k], x - .4 + k * .4, 1.04, .1);
        });
        solid(-W + .3, -.6, W - .3, .6);
        if (h.make === 'food') for (let i = 0; i < 5; i++) { cyl(.012, .012, .4, '#2a2a2a', -W + 1 + i * 2.2, 3.4, -.45, 4); sph(.22, em('#e85a1a', .6), -W + 1 + i * 2.2, 3.1, -.45, 1, 1.2, 1); }
        break;
      }
      case 'zoo': {
        cyl(Math.min(W, D) - .3, Math.min(W, D) - .3, .1, '#7ab05a', 0, .05, 0, 24, { r: .9 }); solid(-W + 1, -D + 1, W - 1, D - 1);
        // 熊貓
        sph(.55, '#f4f4f2', -2.4, .7, 0, 1, 1.1, .9); sph(.36, '#f4f4f2', -2.4, 1.5, .1); for (const s of [-1, 1]) { sph(.12, '#1d1d20', -2.4 + s * .25, 1.8, .1); sph(.18, '#1d1d20', -2.4 + s * .35, .35, .3); sph(.08, '#1d1d20', -2.4 + s * .13, 1.55, .42); }
        // 長頸鹿
        sph(.45, '#e8b84a', .4, 1.5, 0, 1.5, .8, .7); for (const [dx, dz] of [[-.45, -.2], [-.45, .2], [.45, -.2], [.45, .2]]) cyl(.07, .07, 1.2, '#e8b84a', .4 + dx, .6, dz, 6);
        const neck = cyl(.12, .16, 1.4, '#e8b84a', .95, 2.25, 0, 8); neck.rotation.z = -.3; sph(.22, '#e8b84a', 1.2, 2.95, 0, 1.4, .9, .9);
        for (let i = 0; i < 6; i++) sph(.09, '#8a5a2a', .1 + i * .15, 1.6 + (i % 2) * .1, .3);
        // 大象
        sph(.8, '#9aa0a6', 2.9, 1.1, 0, 1.3, 1, 1); for (const [dx, dz] of [[-.5, -.35], [-.5, .35], [.5, -.35], [.5, .35]]) cyl(.2, .2, .8, '#9aa0a6', 2.9 + dx, .4, dz, 8);
        sph(.5, '#9aa0a6', 3.9, 1.5, 0); const tr = cyl(.1, .16, 1, '#9aa0a6', 4.25, .95, 0, 8); tr.rotation.z = .3; sph(.35, '#8a9096', 3.85, 1.6, .45, .3, 1, 1);
        label('動物雕塑園', 2.2, .4, 0, .3, D - .2, '#3d7a4a');
        break;
      }
      case 'boat': {
        B(h.w - 1, 3, .15, M('#ffffff', { map: K.canvasTex(512, 180, (x, Wd, Hd) => { const gr = x.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, '#f2a03a'); gr.addColorStop(.55, '#c4405a'); gr.addColorStop(.56, '#2a4a7a'); gr.addColorStop(1, '#1a2a4a'); x.fillStyle = gr; x.fillRect(0, 0, Wd, Hd); x.fillStyle = '#ffd890'; x.beginPath(); x.arc(Wd * .6, Hd * .55, 26, Math.PI, 0); x.fill(); x.fillStyle = '#1a1a24'; x.fillRect(Wd * .1, Hd * .48, Wd * .25, 8); }) }), 0, 1.5, -D + .3);
        solid(-W + .5, -D + .2, W - .5, -D + .45);
        for (const x of [-2, 2]) { const hull = B(3, .55, 1.2, '#8a5a3a', x, .35, .8, { r: .7 }); hull.rotation.y = .05; B(2.6, .08, .9, '#c8a070', x, .66, .8); B(.15, .7, .15, '#5a3a20', x - 1.3, .9, .8); solid(x - 1.5, .2, x + 1.5, 1.4); }
        label('淡水夕陽', 1.8, .4, 0, 3.25, -D + .4, '#5a3a7a', '#ffd890');
        break;
      }
      case 'steam': {
        cyl(2.4, 2.6, .5, '#6a6458', 0, .25, 0, 14, { r: .9 }); cyl(2.1, 2.1, .1, M('#bfe0d8', { r: .1, m: .2 }), 0, .45, 0, 20); solid(-2.6, -2.6, 2.6, 2.6);
        for (let i = 0; i < 9; i++) { const a = i * 1.7; sph(.3 + (i % 3) * .1, M('#ffffff', { t: true, o: .35, dw: false }), Math.cos(a) * 1.1, .8 + (i % 4) * .35, Math.sin(a) * .9); }
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; sph(.32, '#5a5448', Math.cos(a) * 2.5, .45, Math.sin(a) * 2.5, 1, .7, 1); }
        label('北投溫泉 1896', 2, .4, 0, 1.4, -D + .5, '#4a3020', '#ffe2b0');
        B(.08, 1.2, .08, '#4a3020', 0, .6, -D + .5);
        break;
      }
      case 'plane': {
        const y = 3.4; sph(.4, '#f4f6f8', 0, y, 0, 6, 1, 1); B(5.4, .08, 1.1, '#e8ecef', 0, y, .2); B(1.6, .06, .5, '#e8ecef', -2.3, y + .2, 0); B(.1, .9, .6, '#2a5fb0', -2.4, y + .45, 0);
        for (const x of [-1.6, 1.6]) cyl(.01, .01, 1, '#888', x, y + .55, 0, 4);
        B(3.6, 1.6, .2, '#14181e', 0, 1.6, -D + .4); solid(-1.9, -D + .2, 1.9, -D + .6);
        label('出發 DEPARTURES', 3.4, .3, 0, 2.2, -D + .52, '#14181e', '#f2c200');
        ['CI 108  金門   08:40', 'B7 8701 馬祖  09:15', 'AE 7921 花蓮  10:05', 'BR 191  東京  11:30'].forEach((t, i) => label(t, 3.3, .24, 0, 1.85 - i * .3, -D + .52, '#14181e', '#ffffff'));
        break;
      }
      case 'forest': {
        B(h.w, .06, h.d, '#8a6a4a', 0, .03, 0, { r: .8 });
        for (const [x, z, s] of [[-3.2, -2, 1.2], [3.1, -1.8, 1], [-2.6, 2, .9], [2.8, 2.2, 1.15], [0, -2.6, 1]]) tree(x, z, s);
        cyl(3.4, 3.4, .06, em('#f4ffe8', .9), 0, 4.1, 0, 30);
        B(1.6, .45, .5, '#6a4a30', 0, .23, .6); solid(-.8, .35, .8, .85);
        break;
      }
      case 'expo': {
        for (const [x, ry] of [[-3.3, .35], [0, 0], [3.3, -.35]]) {
          const s = B(3, 1.8, .15, '#14141a', x, 2.2, -D + .6 + Math.abs(x) * .12); s.rotation.y = ry;
          const sc = B(2.8, 1.6, .02, em(['#3ad0ff', '#c4405a', '#7aff8a'][Math.round(x / 3.3) + 1], .55), x, 2.2, -D + .69 + Math.abs(x) * .12); sc.rotation.y = ry;
          B(.12, 1.3, .12, '#2a2a30', x, .65, -D + .6 + Math.abs(x) * .12);
        }
        solid(-W + .3, -D + .3, W - .3, -D + 1.2);
        for (const x of [-2, 0, 2]) { B(.6, 1, .5, '#2a2e36', x, .5, .8); B(.5, .35, .04, em('#3ad0ff', .6), x, 1.2, .55); solid(x - .3, .55, x + .3, 1.05); }
        break;
      }
      case 'clock': {
        B(h.w - 1, 1.8, .4, '#14141a', 0, 2.6, -D + .6); solid(-W + .5, -D + .4, W - .5, -D + .8);
        const t = TaipeiTime.now(), left = (23 - t.hour) * 60 + (59 - t.minute);
        label(`${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`, 5, 1.2, 0, 2.65, -D + .81, '#14141a', '#ff4a3a');
        label('距離今天結束 COUNTDOWN', 3.4, .3, 0, 1.55, -D + .81, '#14141a', '#f2c200');
        for (const x of [-W + .8, W - .8]) { B(.3, 3.6, .3, '#2a2a30', x, 1.8, -D + .6); }
        break;
      }
      case 'books': {
        for (const z of [-D + .3]) for (const x of [-2.2, 2.2]) {
          B(3.8, 2.6, .4, '#5a3e26', x, 1.3, z);
          for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) B(.2, .3 + ((k * 7 + r) % 3) * .05, .25, ['#c4405a', '#2a5fb0', '#3d7a4a', '#d8b048', '#5a3a7a', '#e8dcc0'][(k + r * 3) % 6], x - 1.6 + k * .245, .45 + r * .6, z + .1);
          solid(x - 1.9, z - .2, x + 1.9, z + .2);
        }
        for (const x of [-1.8, 1.8]) { B(1.6, .45, .8, '#3a5a4a', x, .23, 1, { r: .9 }); B(1.6, .5, .2, '#3a5a4a', x, .6, 1.35, { r: .9 }); solid(x - .8, .6, x + .8, 1.45); }
        label('閱讀角 Reading Corner', 2.6, .4, 0, 2.85, -D + .52, '#2a5a3a');
        break;
      }
      case 'rink': {
        B(h.w - 1, .1, h.d - 1.5, M('#dff4fb', { r: .05, m: .3 }), 0, .05, 0); solid(-W + .5, -D + .75, W - .5, D - .75);
        for (const x of [-W + .5, W - .5]) B(.08, .9, h.d - 1.5, M('#cfe3ec', { t: true, o: .35 }), x, .5, 0);
        for (const [x, c] of [[-2.2, '#e04848'], [2.2, '#2a7de1']]) { const fig = B(.5, 1.7, .08, c, x, 1, -.5); fig.rotation.z = x < 0 ? .25 : -.25; sph(.2, c, x + (x < 0 ? .3 : -.3), 2, -.5); }
        label('冰上舞台 ICE STAGE', 3, .45, 0, 2.6, -D + 1, '#1f3a6b');
        break;
      }
      case 'flowers': {
        const cols = ['#e04870', '#f2c200', '#c45ae0', '#ff8a3a', '#f4f4f2'];
        for (let tier = 0; tier < 3; tier++) {
          const r = 3 - tier * .9, y = tier * .7;
          cyl(r, r, .6, '#c8a070', 0, y + .3, 0, 20);
          for (let i = 0; i < 14 - tier * 3; i++) { const a = i / (14 - tier * 3) * Math.PI * 2; sph(.2, cols[(i + tier) % 5], Math.cos(a) * (r - .25), y + .7, Math.sin(a) * (r - .25)); sph(.17, '#3d7a4a', Math.cos(a + .2) * (r - .45), y + .65, Math.sin(a + .2) * (r - .45)); }
        }
        solid(-3, -3, 3, 3);
        label('花博花塔', 1.6, .35, 0, .3, 3.02, '#3d7a4a');
        break;
      }
      case 'screen': {
        for (let i = 0; i < 4; i++) {
          const x = -W + 1.4 + i * 1.75, s = B(1.6, 2.2, .06, M('#ffffff', { map: K.canvasTex(128, 192, (c, Wd, Hd) => { c.fillStyle = '#f4ead8'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#1d1d20'; c.font = '700 64px "Noto Serif TC", serif'; c.textAlign = 'center'; c.fillText('天下為公'[i], Wd / 2, Hd * .6); c.strokeStyle = '#5a3a20'; c.lineWidth = 8; c.strokeRect(4, 4, Wd - 8, Hd - 8); }) }), x, 1.3, 0);
          s.rotation.y = (i % 2 ? -1 : 1) * .25;
        }
        solid(-W + .5, -.4, W - .5, .4);
        B(1.6, .8, .7, '#5a3a20', 0, .4, 1.4); B(1.4, .02, .5, '#3a3a3a', 0, .81, 1.4); solid(-.8, 1.05, .8, 1.75);
        break;
      }
      case 'trail': {
        for (let i = 0; i < 4; i++) B(3, .18, .6, '#8a8278', 0, .09 + i * .18, -D + 1 + i * .6 - 2.4 + 2.2, { r: .9 });
        for (const [x, z, s] of [[-3, -1, .7], [3.2, -.5, .9], [-3.3, 1.4, .6], [3, 1.6, .5]]) { sph(s, '#7a7468', x, s * .6, z, 1.2, .8, 1); solid(x - s, z - s, x + s, z + s); }
        tree(-2.4, -1.8, .8); tree(2.6, -1.9, .9);
        B(.12, 1.8, .12, '#5a3a20', 1.8, .9, 1.4); label('往六巨石 1.2 km →', 1.6, .3, 1.8, 1.6, 1.47, '#5a3a20', '#ffe2b0');
        solid(1.6, 1.2, 2, 1.6); solid(-1.5, -1.2, 1.5, .8);
        break;
      }
      case 'moongate': {
        const ring = new T.Mesh(new T.TorusGeometry(1.6, .35, 10, 28), M('#e8e2d4', { r: .8 })); ring.position.set(0, 1.9, 0); grp.add(ring);
        for (const s of [-1, 1]) { B(2.2, 3.6, .7, '#e8e2d4', s * 2.9, 1.8, 0, { r: .8 }); B(.8, .8, .04, '#6a4a30', s * 2.9, 2.2, .37); solid(s * 2.9 - 1.1, -.35, s * 2.9 + 1.1, .35); }
        B(7.6, .3, .9, '#4a4a48', 0, 3.75, 0); for (let i = 0; i < 6; i++) cyl(.04, .05, 2.2, '#5a8a3a', -1 + i * .4, 1.1, -1.6, 6);
        solid(-1.4, -1.9, 1.4, -1.3);
        break;
      }
      case 'robots': {
        plinth(h.w - 1, 1.6, '#2a2e36'); solid(-W + .5, -.8, W - .5, .8);
        for (const x of [-2.4, 0, 2.4]) { cyl(.35, .45, .9, '#f4f6f8', x, .57, 0, 14); sph(.32, '#f4f6f8', x, 1.25, 0); B(.36, .12, .02, em('#3ad0ff', 1.2), x, 1.28, .3); for (const s of [-1, 1]) { const arm = cyl(.06, .06, .5, '#c8cdd2', x + s * .45, .85, 0, 6); arm.rotation.z = s * (x === 0 ? 1.2 : .4); } }
        label('AI 服務機器人', 2.4, .4, 0, .25, .82, '#2a2e36', '#3ad0ff');
        break;
      }
    }
    // 可以「欣賞」：在裝置前面放一個設施點
    L.spots.push({ kind: 'feature', name: h.name, text: h.text, x: cx, y: 0, z: cz + D + .9 });
    L.specialHall = { name: h.name, placed: true, x: cx, z: cz };
  }
  return { build, HALLS };
})();
