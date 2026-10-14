/* 大型車站：大廳加寬，非付費區上方多一層商店街（台北車站是「台北地下街」）
 * - 八個大站：南港展覽館（玩家出發的地方）、台北車站、西門、中山、忠孝復興、板橋、大安、動物園
 * - 樓層：非付費區上面 y = 4.7 多一層（地下站叫 B1，大廳變 B2；高架站叫 2F）
 * - 兩組電扶梯＋樓梯從非付費區上去（左右各一組），樓板挖洞、有玻璃欄杆
 * - 商店街：店面（可以逛、買東西）、樓層指南、長椅、植栽；台北地下街最長，還有美食廣場
 * 座標慣例沿用月台電扶梯：xa＝上層那一端，xb＝大廳那一端
 */
const BigStations = (() => {
  const MALL_Y = 4.7, MALL_H = 4.2;
  const CFG = {
    南港展覽館: { hall: 32, unpaid: 28, name: '南港展覽館 旅客廣場', en: 'Nangang Exhibition Plaza', theme: '#0070bd',
      shops: ['展覽周邊', '捷運紀念品', '旅客服務', '咖啡', '便當', '書店', '手機配件', '伴手禮', '文具', '飲料店'] },
    台北車站: { hall: 36, unpaid: 30, name: '台北地下街', en: 'Taipei City Mall', theme: '#c8102e', long: true, food: true,
      shops: ['電玩天地', '動漫公仔', '台灣伴手禮', '書店', '眼鏡行', '手機配件', '飲料店', '鳳梨酥專賣', '服飾', '藥妝', '紀念品', '鞋店', '文具', '模型店'] },
    西門: { hall: 30, unpaid: 26, name: '西門町地下商場', en: 'Ximen Underground Mall', theme: '#e07a3a',
      shops: ['潮牌服飾', '球鞋店', '珍珠奶茶', '刺青貼紙', '電影周邊', '黑膠唱片', '雞排', '飾品'] },
    中山: { hall: 30, unpaid: 26, name: '中山地下書街', en: 'Zhongshan Metro Mall', theme: '#3a8a5a',
      shops: ['二手書店', '繪本館', '咖啡書房', '文具雜貨', '設計小物', '漫畫屋', '甜點', '花店'] },
    忠孝復興: { hall: 30, unpaid: 26, name: '東區連通商店街', en: 'East Metro Mall', theme: '#2a6fb0',
      shops: ['百貨連通口', '美妝', '手搖飲', '麵包店', '精品', '書報攤', '手機殼', '香氛'] },
    板橋: { hall: 30, unpaid: 26, name: '板橋站前商店街', en: 'Banqiao Metro Mall', theme: '#8a4ab0',
      shops: ['車站便當', '伴手禮', '服飾', '手機維修', '藥局', '飲料店', '書店', '雜貨'] },
    大安: { hall: 30, unpaid: 26, name: '大安轉乘商店街', en: 'Daan Transfer Mall', theme: '#5a7a3a',
      shops: ['早餐店', '咖啡', '花店', '便利商店', '烘焙坊', '書報攤', '文具', '果汁吧'] },
    動物園: { hall: 30, unpaid: 26, name: '動物園遊客中心', en: 'Zoo Visitor Center', theme: '#d08a20', zoo: true,
      shops: ['動物玩偶', '熊貓紀念品', '冰淇淋', '野餐便當', '望遠鏡出租', '明信片', '貓空茶葉', '雨具'] },
  };
  const of = id => CFG[id] || null;
  const GOODS = { food: ['onigiri', 'bread', 'sausage', 'chicken'], drink: ['coffee', 'bubbletea', 'soymilk'], gift: ['pineapplecake', 'sunnycake', 'nougat', 'keychain', 'postcard'] };
  function goodsFor(name) {
    if (/奶茶|飲|咖啡|果汁|手搖/.test(name)) return GOODS.drink;
    if (/便當|雞排|麵包|烘焙|早餐|甜點|冰淇淋|野餐/.test(name)) return GOODS.food;
    return GOODS.gift;
  }

  // layout 階段：加大大廳、非付費區，定好上層的範圍和電扶梯
  function prepare(L) {
    const c = of(L.stationId); if (!c) return;
    const U = L.unpaid;
    const lv = { id: 'mall', name: c.name, y: MALL_Y, h: MALL_H, x0: U.x0, x1: U.x1, z0: U.z0, z1: U.z1 + (c.long ? 16 : 0), holes: [] };
    if (c.long) { lv.x0 = U.x0 - 40; lv.x1 = U.x1 + 40; }
    const run = MALL_Y * 1.65;
    const mk = (side, z) => {
      const xb = side * 12, xa = side * (12 + run);
      return { side, xa, xb, ya: MALL_Y, yb: 0, z, mall: true };
    };
    L.xramps = [mk(-1, U.z0 + 4.6), mk(1, U.z0 + 8.5)];
    for (const r of L.xramps) {
      const a = Math.min(r.xa, r.xb), b = Math.max(r.xa, r.xb);
      // 上層樓板的洞：整段電扶梯，留上層那一端 .3 公尺可以踏上去
      lv.holes.push(r.side < 0 ? { x0: a + .3, x1: b, z0: r.z - 1.95, z1: r.z + 1.95 } : { x0: a, x1: b - .3, z0: r.z - 1.95, z1: r.z + 1.95 });
    }
    L.levels = [lv];
    L.big = c;
    // 商店：沿著上層兩側長牆排
    const shops = [], step = 6.4;
    const rows = [{ z: lv.z1 - 1.6, face: Math.PI }, { z: lv.z0 + 1.6, face: 0 }];
    let i = 0;
    for (const row of rows) for (let x = lv.x0 + 4; x <= lv.x1 - 4; x += step) {
      if (L.xramps.some(r => Math.abs(row.z - r.z) < 4 && x > Math.min(r.xa, r.xb) - 4 && x < Math.max(r.xa, r.xb) + 4)) continue;
      const name = c.shops[i++ % c.shops.length];
      shops.push({ x, z: row.z, face: row.face, name });
      L.spots.push({ kind: 'mallshop', name, x, y: MALL_Y, z: row.z + (row.face === 0 ? 1.1 : -1.1), goods: goodsFor(name) });
    }
    lv.shops = shops;
    L.spots.push({ kind: 'malldir', x: 0, y: MALL_Y, z: (lv.z0 + lv.z1) / 2 - 1.2 });
  }

  // 大廳天花板要挖的洞（電扶梯穿過）
  const ceilHoles = L => (L.xramps || []).map(r => ({ x0: Math.min(r.xa, r.xb) - .2, x1: Math.max(r.xa, r.xb) + .2, z0: r.z - 1.95, z1: r.z + 1.95 }));
  // 擺設放之前先預留電扶梯的位置（裝飾、垃圾桶、特色大廳都會避開），蓋完再拿掉
  function reserve(L) {
    for (const r of L.xramps || []) L.obstacles.push({ x0: Math.min(r.xa, r.xb) - 2, x1: Math.max(r.xa, r.xb) + 2.5, z0: r.z - 2.6, z1: r.z + 2.6, y: 0, reserve: true });
  }

  function build(L, g, K) {
    const c = L.big; if (!c) return;
    const { T, M, box, plane, solid, tiled, canvasTex, TEX, sign, plainSign } = K;
    const lv = L.levels[0], Y = lv.y, H = lv.h;
    const theme = c.theme;
    // ── 地板（扣掉洞）──
    const floorM = M('#ffffff', { map: TEX.hall, r: .35 });
    for (const r of K.rectsMinus({ x0: lv.x0, x1: lv.x1, z0: lv.z0, z1: lv.z1 }, lv.holes)) {
      const w = r.x1 - r.x0, d = r.z1 - r.z0;
      const m = box(w, .3, d, floorM, (r.x0 + r.x1) / 2, Y - .15, (r.z0 + r.z1) / 2, g);
      m.material = floorM.clone(); m.material.map = tiled(TEX.hall, w / 2.4, d / 2.4);
    }
    // 地板中間一條主題色走道
    box(lv.x1 - lv.x0 - 2, .01, 1.6, M(theme, { r: .5 }), (lv.x0 + lv.x1) / 2, Y + .006, (lv.z0 + lv.z1) / 2, g);
    // ── 牆、天花板 ──
    const wallM = M('#efece6', { r: .7 });
    const W = lv.x1 - lv.x0, D = lv.z1 - lv.z0, cx = (lv.x0 + lv.x1) / 2, cz = (lv.z0 + lv.z1) / 2;
    box(W, H, .3, wallM, cx, Y + H / 2, lv.z0 - .15, g); box(W, H, .3, wallM, cx, Y + H / 2, lv.z1 + .15, g);
    box(.3, H, D, wallM, lv.x0 - .15, Y + H / 2, cz, g); box(.3, H, D, wallM, lv.x1 + .15, Y + H / 2, cz, g);
    box(W, .3, D, M('#d9dcdf', { r: .8 }), cx, Y + H + .15, cz, g);
    // 天花板燈條、主題色飾帶
    const lightM = M('#ffffff', { e: '#fff3dc', ei: 1.3 });
    for (let x = lv.x0 + 3; x < lv.x1 - 2; x += 5) for (const z of [cz - 3, cz + 3]) box(3, .04, .3, lightM, x, Y + H - .005, z, g);
    for (const z of [lv.z0 + .02, lv.z1 - .02]) box(W, .2, .04, M(theme, { e: theme, ei: .3 }), cx, Y + H - .5, z, g);
    // 柱子
    const colM = M('#f4f1ea', { r: .5 });
    for (let x = lv.x0 + 8; x < lv.x1 - 4; x += 12) for (const z of [cz - 4.2, cz + 4.2]) {
      if (lv.holes.some(h => x > h.x0 - 1 && x < h.x1 + 1 && z > h.z0 - 1 && z < h.z1 + 1)) continue;
      box(.8, H, .8, colM, x, Y + H / 2, z, g); solid(x, z, .8, .8, Y);
    }
    // ── 店面 ──
    const shopTex = {};
    const nameTex = name => shopTex[name] || (shopTex[name] = canvasTex(512, 128, x => {
      x.fillStyle = '#1d2024'; x.fillRect(0, 0, 512, 128); x.fillStyle = theme; x.fillRect(0, 110, 512, 18);
      x.fillStyle = '#fff'; x.font = '700 60px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText(name, 256, 80);
    }));
    const pal = ['#f2c27a', '#9fd3c7', '#e8a0b4', '#b8c6f0', '#d4e09b', '#f0b48a'];
    lv.shops.forEach((s, i) => {
      const z = s.z, out = s.face === 0 ? 1 : -1, back = z - out * 1.2;
      box(5.6, 3.4, .3, M('#2b2f34', { r: .4, m: .3 }), s.x, Y + 1.7, back, g);                          // 店面框
      const inner = box(5, 2.6, .05, M(pal[i % pal.length], { e: pal[i % pal.length], ei: .25 }), s.x, Y + 1.4, back + out * .2, g);
      inner.userData.keep = true;
      for (let k = -2; k <= 2; k++) box(.6, .5 + (k + 2) % 3 * .3, .4, M(['#ffffff', '#3a3f44', theme][(k + 5 + i) % 3], { r: .6 }), s.x + k * .95, Y + .45, back + out * .45, g);   // 貨架上的東西
      box(5, 2.6, .03, M('#cfe3ec', { t: true, o: .18, dw: false }), s.x, Y + 1.4, back + out * .75, g);    // 玻璃櫥窗
      const nm = plane(4.4, 1.1, M('#ffffff', { map: nameTex(s.name), e: '#ffffff', ei: .35 }), g);
      nm.position.set(s.x, Y + 3.25, back + out * .17); nm.rotation.y = s.face;
      box(1.2, .9, .6, M('#c9b48f', { r: .6 }), s.x + 1.8, Y + .45, back + out * 1.2, g); solid(s.x + 1.8, back + out * 1.2, 1.2, .6, Y);   // 櫃台
      solid(s.x, back + out * .5, 5.6, 1, Y);
    });
    // ── 長椅、植栽 ──
    for (let x = lv.x0 + 14; x < lv.x1 - 10; x += 16) {
      if (lv.holes.some(h => x > h.x0 - 3 && x < h.x1 + 3)) continue;
      for (const z of [cz - 2.2, cz + 2.2]) {
        box(2, .45, .5, M('#8a6a4a', { r: .6 }), x, Y + .23, z, g); solid(x, z, 2, .5, Y);
        for (const sx of [-.5, .5]) L.seats.push({ x: x + sx, y: Y, z, face: z < cz ? 0 : Math.PI, stand: { x: x + sx, z: z + (z < cz ? -.7 : .7) } });
      }
      box(.9, .7, .9, M('#7a7068', { r: .7 }), x + 3, Y + .35, cz, g); solid(x + 3, cz, .9, .9, Y);
      const leaf = new T.Mesh(new T.SphereGeometry(.7, 10, 8), M('#4a8a4a', { r: .9 })); leaf.position.set(x + 3, Y + 1.25, cz); leaf.scale.y = 1.2; g.add(leaf);
    }
    // ── 美食廣場（台北地下街）──
    if (c.food) {
      const fx = lv.x1 - 20, fz = cz;
      for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j += 2) {
        const tx = fx + i * 4, tz = fz + j * 2.6;
        const tb = new T.Mesh(new T.CylinderGeometry(.6, .6, .06, 16), M('#e8e2d4', { r: .5 })); tb.position.set(tx, Y + .75, tz); g.add(tb);
        box(.1, .75, .1, M('#555'), tx, Y + .37, tz, g); solid(tx, tz, 1.3, 1.3, Y);
        for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) box(.4, .45, .4, M(theme, { r: .6 }), tx + Math.cos(a) * .95, Y + .23, tz + Math.sin(a) * .95, g);
      }
      sign(plainSign('美食廣場', 'Food Court', '#1d2024', '#fff', { bg: theme, fg: '#fff', text: '🍜' }), 3, .75, fx + 4, Y + H - .9, fz, g);
    }
    // 動物園遊客中心盡頭：往貓空纜車的連通道（解鎖前門關著）
    if (c.zoo) {
      const open = typeof Gondola !== 'undefined' && Gondola.unlocked();
      const dx = lv.x1 - .05;
      box(.3, 3.2, .4, M('#2b2f34'), dx, Y + 1.6, cz - 1.8, g); box(.3, 3.2, .4, M('#2b2f34'), dx, Y + 1.6, cz + 1.8, g); box(.3, .4, 4, M('#2b2f34'), dx, Y + 3.2, cz, g);
      const door = plane(3.2, 3, M(open ? '#9fd7ff' : '#7a8288', { t: true, o: open ? .35 : .85, e: open ? '#cfefff' : '#000000', ei: open ? .5 : 0 }), g);
      door.position.set(dx - .17, Y + 1.5, cz); door.rotation.y = -Math.PI / 2;
      const gt = canvasTex(1024, 256, x => { x.fillStyle = open ? '#2f8f5b' : '#5a6068'; x.fillRect(0, 0, 1024, 256); x.fillStyle = '#fff'; x.font = '700 96px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText(open ? '🚡 貓空纜車 →' : '🚡 貓空纜車（暫停營運）', 512, 140); x.font = '44px "Barlow Semi Condensed", sans-serif'; x.fillText('Maokong Gondola', 512, 214); });
      sign(gt, 3.6, .9, dx - .3, Y + 2.75, cz + 4, g, -Math.PI / 2);
    }
    // 動物園遊客中心：動物剪影立牌
    if (c.zoo) {
      const silh = ['🐼', '🐨', '🦒', '🐘', '🐧'];
      silh.forEach((e, i) => {
        const t = canvasTex(256, 256, x => { x.fillStyle = '#f6efe0'; x.fillRect(0, 0, 256, 256); x.font = '190px sans-serif'; x.textAlign = 'center'; x.fillText(e, 128, 200); });
        const hx = lv.x0 + 8 + i * ((lv.x1 - lv.x0 - 16) / 4); box(.03, .6, .03, M('#555'), hx, Y + H - .3, cz, g); const p = new T.Mesh(new T.PlaneGeometry(1.3, 1.3), M('#ffffff', { map: t, r: .8, side: T.DoubleSide })); p.position.set(hx, Y + H - 1.25, cz); g.add(p);   // 吊在走道上方的動物吊牌
      });
    }
    // ── 樓層指南看板 ──
    const dirSp = L.spots.find(s => s.kind === 'malldir');
    if (dirSp) {
      box(1.6, 1.9, .2, M('#2b2f34'), dirSp.x, Y + 1.15, dirSp.z - .5, g); solid(dirSp.x, dirSp.z - .5, 1.6, .3, Y);
      const t = canvasTex(256, 320, x => { x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, 256, 320); x.fillStyle = theme; x.fillRect(0, 0, 256, 60); x.fillStyle = '#fff'; x.font = '700 30px "Noto Sans TC", sans-serif'; x.textAlign = 'center'; x.fillText('樓層指南', 128, 42); x.fillStyle = '#333'; x.font = '22px "Noto Sans TC", sans-serif'; c.shops.slice(0, 8).forEach((s, i) => x.fillText(s, 128, 96 + i * 28)); });
      const p = plane(1.4, 1.75, M('#ffffff', { map: t, e: '#ffffff', ei: .2 }), g); p.position.set(dirSp.x, Y + 1.15, dirSp.z - .39);
    }
    // 上層名稱大看板
    const nameBig = canvasTex(1024, 192, x => { x.fillStyle = '#1d2024'; x.fillRect(0, 0, 1024, 192); x.fillStyle = theme; x.fillRect(0, 0, 18, 192); x.fillStyle = '#fff'; x.font = '700 84px "Noto Sans TC", sans-serif'; x.fillText(c.name, 60, 108); x.fillStyle = '#c9ced4'; x.font = '38px "Barlow Semi Condensed", sans-serif'; x.fillText(c.en, 62, 160); });
    for (const [x, ry] of [[lv.x0 + 1.5, Math.PI / 2], [lv.x1 - 1.5, -Math.PI / 2]]) sign(nameBig, 5, .94, x, Y + H - 1.1, cz, g, ry);   // 掛在兩端，不擋走道上的鏡頭

    // ── 電扶梯＋樓梯（三道：往上電扶梯、樓梯、往下電扶梯）──
    const LANES = [-1.25, 0, 1.25];
    for (const r of L.xramps) {
      const dx = r.xa - r.xb, len = Math.hypot(dx, Y), ang = Math.atan(Y / dx), mx = (r.xa + r.xb) / 2, my = Y / 2;
      LANES.forEach((lz, i) => {
        const stair = i === 1;
        const m = box(len, .12, stair ? 1.3 : .95, M('#ffffff', { map: tiled(stair ? TEX.stairs : TEX.steps, 1, len / 1.5), r: .6 }), mx, my, r.z + lz, g);
        m.rotation.z = ang; m.material.map.rotation = Math.PI / 2;
        for (const sz of [-1, 1]) {
          const w = stair ? .62 : .52;   // 樓梯扶手往內，不跟電扶梯扶手重疊
          const rail = box(len, .9, .04, M('#cfe3ec', { t: true, o: .25, dw: false }), mx, my + .5, r.z + lz + sz * w, g); rail.rotation.z = ang;
          const hand = box(len, .06, .1, M(stair ? '#9aa1a8' : '#1c1c1e', { r: .4 }), mx, my + .97, r.z + lz + sz * w, g); hand.rotation.z = ang;
        }
      });
      // 電扶梯下方的側板（從地板到電扶梯底）：看起來是實心的，也說明為什麼底下不能走
      const skirtM = M('#c9cfd4', { m: .6, r: .35, side: T.DoubleSide });
      for (const sz of [-1.95, 1.95]) {
        const pos = [r.xb, 0, r.z + sz, r.xa, 0, r.z + sz, r.xa, Y - .2, r.z + sz];
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
        g.add(new T.Mesh(geo, skirtM));
      }
      box(.2, Y - .2, 3.9, skirtM, r.xa, (Y - .2) / 2, r.z, g);
      // 上層：洞口的玻璃欄杆（上層那一端留開口）
      const h = lv.holes.find(o => Math.abs((o.z0 + o.z1) / 2 - r.z) < .1);
      const gl = M('#cfe3ec', { t: true, o: .3, dw: false }), top = M('#9aa1a8', { m: .6 });
      for (const z of [h.z0, h.z1]) { box(h.x1 - h.x0, 1, .05, gl, (h.x0 + h.x1) / 2, Y + .5, z, g); box(h.x1 - h.x0, .06, .08, top, (h.x0 + h.x1) / 2, Y + 1.02, z, g); }
      const endX = r.side < 0 ? h.x1 : h.x0;   // 大廳那一端上方
      box(.05, 1, h.z1 - h.z0, gl, endX, Y + .5, r.z, g); box(.08, .06, h.z1 - h.z0, top, endX, Y + 1.02, r.z, g);
      // 洞口的樓板側邊
      box(h.x1 - h.x0, .5, .06, M('#d9dcdf'), (h.x0 + h.x1) / 2, Y - .25, h.z0, g); box(h.x1 - h.x0, .5, .06, M('#d9dcdf'), (h.x0 + h.x1) / 2, Y - .25, h.z1, g);
      // 大廳那端：往上層的指標
      const up = plainSign(`↑ ${c.name}`, c.en, '#1d2024', '#fff', { bg: theme, fg: '#fff', text: L.allUnder ? 'B1' : '2F' });
      sign(up, 2.6, .65, r.xb + r.side * -1.4, 3.2, r.z, g, r.side < 0 ? -Math.PI / 2 : Math.PI / 2);
      // 上層那端：往大廳／月台的指標
      const down = plainSign('↓ 大廳・閘門・月台', 'Concourse · Platforms', '#1d2024', '#fff', { bg: '#2a7de1', fg: '#fff', text: '↓' });
      sign(down, 2.6, .65, r.xa + r.side * 1.6, Y + 3, r.z, g, r.side < 0 ? Math.PI / 2 : -Math.PI / 2);
    }
  }
  // 蓋完：拿掉預留的位置
  function finish(L) { if (L.obstacles) L.obstacles = L.obstacles.filter(o => !o.reserve); }

  // 逛商店街的店
  function shopMenu(sp) {
    const s = Game.state;
    const items = (sp.goods || GOODS.gift).filter(id => ITEMS[id]);
    Dialog.show({ name: sp.name, role: (World.layout.big || {}).name || '商店街' }, `歡迎光臨！悠遊卡餘額 NT$ ${s.money}。`, items.map(id => ({
      label: `${ITEMS[id].icon} ${ITEMS[id].name}　NT$ ${Progress.price(ITEMS[id].price)}`, disabled: s.money < Progress.price(ITEMS[id].price),
      run: () => {
        s.money -= Progress.price(ITEMS[id].price); s.inv[id] = (s.inv[id] || 0) + 1; saveState(); updateHud(); Sound.gate();
        toast(`<b>買了 ${ITEMS[id].icon} ${ITEMS[id].name}</b><span>${esc(sp.name)}・餘額 NT$ ${s.money}</span>`);
        if (typeof questEvent === 'function') questEvent({ kind: 'buy', item: id });
        shopMenu(sp);
      },
    })).concat([{ label: '離開', run: () => Dialog.close() }]));
  }
  function dirInfo() {
    const L = World.layout, c = L.big, f = typeof Nav !== 'undefined' ? Nav.floors(L) : null;
    const rows = [`<b>${f ? f.mall : ''} ${esc(c.name)}</b>：${c.shops.map(esc).join('、')}${c.food ? '、美食廣場' : ''}`];
    if (f) { rows.push(`<b>${f.hall}</b> 大廳・閘門・出入口`); for (const P of L.platforms) rows.push(`<b>${f.byK[P.k]}</b> ${LINES[P.line].zh}月台`); }
    Dialog.info('🗺️ 樓層指南', rows.join('<br>') + (L.stationId === '動物園' && Game.state.flags.gondola ? '<br><b>🚡 貓空纜車</b>：本層盡頭的連通道' : ''));
  }
  return { CFG, of, prepare, ceilHoles, reserve, build, finish, shopMenu, dirInfo, MALL_Y };
})();
