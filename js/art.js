/* 車站裡的公共藝術：依臺北市政府捷運工程局「公共藝術總表」等公開資料，選出有明確站名、作品名、作者的作品，
 * 在遊戲裡用簡化的 3D 形式呈現（外觀與實際作品不同，請以現場為準）。
 * 走近可以「欣賞」，看過的作品會記在「紀錄 → 收藏 → 公共藝術」；全部看過有隱藏成就。
 * level：'hall' 放在大廳、'platform' 放在月台（原作位於月台層的作品）
 */
const ART = {
  松山: { kind: 'dome', name: '河流彎曲之處，域見繁花光穹', by: '江洋輝、麻粒國際文化試驗', year: 2014, text: '位於穿堂層橢圓大廳的巨型光雕，以不鏽鋼管、水晶玻璃與 LED 燈構成，曾獲第六屆公共藝術獎「藝術創作獎」。' },
  台北小巨蛋: { kind: 'lenticular', name: '推進', by: '洪東祿', year: 2014, text: '以壓克力與光柵片製作，隨著觀看角度不同，畫面會跟著改變。' },
  雙連: { kind: 'mural', name: '雙連‧行遠', by: '井婉婷、楊弼方', year: 1996, text: '位於穿堂層的琺瑯板壁畫，以年代符號呈現雙連地區的歷史變遷。' },
  台大醫院: { kind: 'hands', name: '手之組曲', by: '李光裕', year: 1998, level: 'platform', text: '位於月台層的四件雕塑，材質為銅與花崗石。' },
  中正紀念堂: { kind: 'curtain', name: '舞台、月台', by: '黃承令', year: 1998, level: 'platform', text: '位於月台層的垂簾式作品，以不鏽鋼管與烤漆板製作。' },
  新店: { kind: 'stones', name: '天、地、人', by: '田邊武', year: 1999, text: '原作位於新店站出入口廣場，由石柱三座、石板十二塊、自然石十二塊與一座鋁製燈柱組成。' },
  迴龍: { kind: 'listen', name: '傾聽', by: '黃心健', text: '結合不鏽鋼雕塑與網路錄像藝術的作品。' },
  新莊: { kind: 'glass', name: '編織夢', by: '黃文慶', text: '以彩色玻璃嵌板構成的作品。' },
  先嗇宮: { kind: 'gaze', name: '金屬之城－36 種凝視', by: '王梅珍', text: '以金屬為主題的作品，名稱中的「36 種凝視」在遊戲裡以 36 片圓形金屬片表現。' },
  松山機場: { kind: 'travel', name: '大旅行時代', by: '郭原森（元禾通藝術）', text: '文湖線松山機場站的雕塑作品。' },
  文德: { kind: 'birds', name: '鳥飛', by: '彭志煌', year: 2008, text: '原作位於 2 號出入口地面層無障礙電梯旁的牆面，以「鳥飛」為設計主題。' },
  '台北101/世貿': { kind: 'flaps', name: 'The Moment We Meet', by: '黃心健', year: 2013, text: '以翻牌顯示器（像舊式機場時刻表那樣一片一片翻動）組成的多媒體作品。' },
  板橋: { kind: 'buren', name: '思映之間', by: '丹尼爾．布罕（Daniel Buren）', text: '環狀線板橋站的大型永久裝置，是法國藝術家布罕為捷運車站設計的第二件作品，以他招牌的色彩與條紋呈現。' },
};
ACHIEVEMENTS.push(
  { id: 'a_art5', name: '看展的人', desc: '欣賞五件車站裡的公共藝術。', check: s => Object.keys((s.col || {}).art || {}).length >= 5 },
  { id: 'a_artall', name: '地下美術館', desc: '欣賞遊戲裡所有車站的公共藝術。', check: s => Object.keys((s.col || {}).art || {}).length >= Object.keys(ART).length, gold: 1 },
);

const ArtInstall = (() => {
  const T = THREE;
  let group = null, cur = null, anim = [];
  const S = () => Game.state;
  const M = (c, o = {}) => new T.MeshStandardMaterial({ color: c, map: o.map || null, roughness: o.r ?? .5, metalness: o.m ?? 0, emissive: o.e || '#000000', emissiveIntensity: o.ei ?? 0, transparent: !!o.t, opacity: o.o ?? 1, side: o.side || T.FrontSide });
  const mesh = (g, m, x, y, z) => { const o = new T.Mesh(g, m); o.position.set(x, y, z); group.add(o); return o; };
  const HALL = 4.2;
  // 找一塊空地：圓形範圍內都能走、沒有障礙物、離其他設施有一段距離
  function findSpot(L, r, wide) {
    const C = L.concourse, mid = (C.z0 + L.gateZ) / 2;
    const free = (px, pz) => World.groundAt(px, pz, 0) != null && !(L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && px > o.x0 - .3 && px < o.x1 + .3 && pz > o.z0 - .3 && pz < o.z1 + .3);
    // 牆面型作品：貼近後牆、避開中間的站名牆（寬 5、深 1.6 的空地）
    const cands = wide
      ? [[C.x1 - 9, C.z0 + 2.2], [C.x0 + 9, C.z0 + 2.2], [C.x1 - 13, C.z0 + 2.2], [C.x0 + 13, C.z0 + 2.2], [C.x1 - 18, C.z0 + 2.2], [C.x0 + 19, C.z0 + 2.2], [C.x1 - 9, mid + 2], [C.x0 + 9, mid + 2], [0, C.z0 + 5.5]]
      : [[C.x1 - 7, C.z0 + 5.5], [C.x0 + 7, C.z0 + 5.5], [C.x1 - 7, mid + 1], [C.x0 + 7, mid + 1], [C.x1 - 11, C.z0 + 8], [C.x0 + 11, C.z0 + 8], [0, C.z0 + 5.5]];
    for (const [x, z] of cands) {
      let ok = true;
      if (wide) { for (let dx = -2.6; dx <= 2.6 && ok; dx += .4) for (let dz = -.8; dz <= 1.2; dz += .4) if (!free(x + dx, z + dz)) { ok = false; break; } }
      else for (let a = 0; a < 12 && ok; a++) for (const rr of [0, r * .5, r]) { if (!free(x + Math.cos(a / 12 * 6.28) * rr, z + Math.sin(a / 12 * 6.28) * rr)) { ok = false; break; } }
      if (ok && !L.spots.some(s => s.y === 0 && Math.abs(s.x - x) < (wide ? 3.6 : r + 1.2) && Math.abs(s.z - z) < (wide ? 1.8 : r + 1.2))) return { x, z };
    }
    return null;
  }
  const block = (L, x, z, w, d) => L.obstacles.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y: 0 });
  const pedestal = (x, z, w = 1.6) => { mesh(new T.CylinderGeometry(w / 2, w / 2 + .05, .25, 24), M('#d8d4cc', { r: .6 }), x, .125, z); };
  const rainbow = ['#e04848', '#f28a2a', '#f2c200', '#3ad06a', '#2a9de1', '#5a5ae0', '#b04ad0'];

  function build(L, a, p) {
    const { x, z } = p, y0 = p.y || 0, top = y0 + (a.level === 'platform' ? 3.3 : HALL);
    const steel = M('#c9cfd4', { m: .8, r: .25 });
    if (a.kind === 'dome') {   // 光穹：不鏽鋼管＋水晶＋LED，懸在天花板下
      for (let i = 0; i < 46; i++) {
        const t = i / 46 * 6.28, r = 1.6 + (i % 3) * .5, len = .8 + (i % 5) * .25;
        const rod = mesh(new T.CylinderGeometry(.03, .03, len, 6), steel, x + Math.cos(t) * r * 1.3, top - .2 - len / 2, z + Math.sin(t) * r);
        const gem = mesh(new T.OctahedronGeometry(.11), M('#ffffff', { e: '#ffffff', ei: .8, t: true, o: .85, m: .3, r: .05 }), rod.position.x, top - .25 - len, rod.position.z);
        anim.push({ o: gem, type: 'hue', ph: i / 46 });
      }
    }
    if (a.kind === 'lenticular' || a.kind === 'glass') {   // 光柵片／彩色玻璃：一整面會隨角度變色的牆
      const glass = a.kind === 'glass';
      for (let i = 0; i < 10; i++) for (let j = 0; j < (glass ? 6 : 4); j++) {
        const w = glass ? .38 : .4, pn = mesh(new T.PlaneGeometry(w, w), M(rainbow[(i * 3 + j) % 7], { t: true, o: glass ? .65 : .9, e: rainbow[(i + j) % 7], ei: glass ? .35 : .15, side: T.DoubleSide, m: glass ? 0 : .4 }), x - 2.1 + i * (w + .06), y0 + .7 + j * (w + .06), z);
        anim.push({ o: pn, type: glass ? 'flip' : 'hue', ph: glass ? i * .4 + j : (i + j) / 14 });
      }
      mesh(new T.BoxGeometry(4.6, .1, .2), M('#30363c'), x, y0 + .6, z); block(L, x, z, 4.6, .4);
    }
    if (a.kind === 'mural') {   // 琺瑯板壁畫
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
      const bands = ['#1f3a6b', '#2a9d8f', '#e8c46a', '#c4512a', '#6a4a8a'];
      bands.forEach((col, i) => { g.fillStyle = col; g.fillRect(i * 205, 0, 205, 512); });
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 54px "Noto Serif TC", serif';
      ['1900', '1930', '1960', '1990', '2000'].forEach((t, i) => g.fillText(t, i * 205 + 30, 90 + (i % 2) * 300));
      for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6; g.beginPath(); g.arc(80 + i * 55, 300, 30 + (i % 4) * 14, 0, Math.PI); g.stroke(); }
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      mesh(new T.BoxGeometry(4.4, 2.3, .14), M('#e8e4dc'), x, y0 + 1.5, z - .08);
      mesh(new T.PlaneGeometry(4.2, 2.1), M('#ffffff', { map: tx, r: .25, m: .2 }), x, y0 + 1.5, z + .005);
      block(L, x, z, 4.4, .4);
    }
    if (a.kind === 'hands') {   // 手之組曲：銅手＋花崗石座，四件沿著月台
      const bronze = M('#8a5a2a', { m: .7, r: .35 }), granite = M('#8a8a86', { r: .9 });
      [-5, -2.5, 2.5, 5].forEach((dx, i) => {
        const hx = x + dx, hz = z + (i % 2 ? .9 : -.9);
        mesh(new T.BoxGeometry(.5, .6, .5), granite, hx, y0 + .3, hz); block(L, hx, hz, .5, .5);
        const palm = mesh(new T.BoxGeometry(.24, .3, .08), bronze, hx, y0 + .85, hz); palm.rotation.y = i * .8;
        for (let f = 0; f < 4; f++) { const fg = mesh(new T.CapsuleGeometry(.025, .16 + (f % 2) * .04, 4, 6), bronze, hx - .09 + f * .06, y0 + 1.1, hz); fg.rotation.z = (f - 1.5) * .12; }
        const th = mesh(new T.CapsuleGeometry(.03, .12, 4, 6), bronze, hx - .15, y0 + .92, hz); th.rotation.z = .9;
      });
    }
    if (a.kind === 'curtain') {   // 舞台、月台：不鏽鋼管＋烤漆板的垂簾
      for (let i = 0; i < 26; i++) {
        const cx = x - 3.8 + i * .3, len = .25 + Math.abs(Math.sin(i * .5)) * .35;
        mesh(new T.CylinderGeometry(.02, .02, len, 6), steel, cx, top - len / 2, z - .4);
        const pl = mesh(new T.PlaneGeometry(.24, .5), M(['#c4162a', '#f2c200', '#1f3a6b', '#e8e4dc'][i % 4], { r: .4, side: T.DoubleSide }), cx, top - len - .25, z - .4);
        anim.push({ o: pl, type: 'flip', ph: i * .3 });
      }
    }
    if (a.kind === 'stones') {   // 天、地、人：石柱三座、石板、自然石、燈柱
      const stone = M('#9a958c', { r: .95 });
      [-1, 0, 1].forEach(k => { mesh(new T.BoxGeometry(.5, 2 + (k === 0 ? .5 : 0), .5), stone, x + k * 1.1, y0 + 1 + (k === 0 ? .25 : 0), z); block(L, x + k * 1.1, z, .5, .5); });
      for (let i = 0; i < 12; i++) mesh(new T.BoxGeometry(.5, .04, .5), M('#b8b2a6', { r: .9 }), x - 1.65 + (i % 6) * .66, y0 + .02, z + 1 + ((i / 6) | 0) * .66);
      for (let i = 0; i < 12; i++) { const r = mesh(new T.DodecahedronGeometry(.12 + (i % 3) * .05), M('#7a766e', { r: 1 }), x - 1.8 + i * .33, y0 + .12, z - .9); r.rotation.set(i, i * 2, 0); }
      mesh(new T.CylinderGeometry(.06, .08, 2.6, 8), M('#c8ccd0', { m: .8, r: .3 }), x + 2, y0 + 1.3, z); block(L, x + 2, z, .3, .3);
      mesh(new T.SphereGeometry(.16, 12, 8), M('#ffffff', { e: '#fff3c0', ei: .9 }), x + 2, y0 + 2.7, z);
    }
    if (a.kind === 'listen') {   // 傾聽：不鏽鋼雕塑＋錄像螢幕
      mesh(new T.CylinderGeometry(.7, .8, .3, 24), M('#d8d4cc'), x, y0 + .15, z); block(L, x, z, 1.6, 1.6);
      const ear = mesh(new T.TorusGeometry(.55, .16, 16, 40, Math.PI * 1.5), M('#e8ecef', { m: 1, r: .12 }), x, y0 + 1.25, z); ear.rotation.y = .3;
      const scr = mesh(new T.PlaneGeometry(.9, .55), M('#0d1b2a', { e: '#2a7de1', ei: .6 }), x + 1.05, y0 + 1.5, z); scr.rotation.y = -.4;
      anim.push({ o: scr, type: 'hue', ph: .2 });
    }
    if (a.kind === 'gaze') {   // 36 種凝視：6×6 片金屬圓片
      mesh(new T.BoxGeometry(3.4, 3.2, .12), M('#3a3a40', { r: .7 }), x, y0 + 1.7, z - .08); block(L, x, z, 3.4, .4);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
        const d = mesh(new T.CylinderGeometry(.2, .2, .05, 20), M('#c9cfd4', { m: .95, r: .15 + ((i * 7 + j * 3) % 5) * .1 }), x - 1.35 + i * .54, y0 + .35 + j * .54, z + .02);
        d.rotation.x = Math.PI / 2; mesh(new T.SphereGeometry(.06, 10, 8), M('#1a1a1a', { m: .5 }), d.position.x + ((i + j) % 3 - 1) * .05, d.position.y, z + .06);
      }
    }
    if (a.kind === 'travel') {   // 大旅行時代：行李箱堆疊與機翼
      pedestal(x, z, 2); block(L, x, z, 2, 2);
      [['#c4162a', .9, .6], ['#2a7de1', .8, .5], ['#f2c200', .65, .42], ['#2a9d8f', .5, .34]].forEach(([c, w, h], i) => { const b = mesh(new T.BoxGeometry(w, h, .3), M(c, { r: .4 }), x + (i % 2 ? .1 : -.1), y0 + .25 + [0, .6, 1.1, 1.5][i] + h / 2, z); b.rotation.y = i * .3; });
      const wing = mesh(new T.BoxGeometry(2.2, .05, .5), M('#e8ecef', { m: .8, r: .2 }), x, y0 + 2.4, z); wing.rotation.z = .12; anim.push({ o: wing, type: 'sway', ph: 0 });
    }
    if (a.kind === 'birds') {   // 鳥飛：牆面上的飛鳥
      mesh(new T.BoxGeometry(4, 2.6, .12), M('#eef2f4', { r: .6 }), x, y0 + 1.5, z - .08); block(L, x, z, 4, .4);
      for (let i = 0; i < 14; i++) {
        const b = new T.Group(); b.position.set(x - 1.7 + (i * 1.37) % 3.4, y0 + .5 + (i * .61) % 2, z + .03);
        for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(.22, .06), M(['#1f3a6b', '#2a7de1', '#3a3a40'][i % 3], { side: T.DoubleSide })); w.position.x = s * .1; w.rotation.z = s * .35; b.add(w); }
        group.add(b); anim.push({ o: b, type: 'bob', y: b.position.y, ph: i });
      }
    }
    if (a.kind === 'flaps') {   // 翻牌顯示器：一格一格不停翻動
      mesh(new T.BoxGeometry(4.4, 2.2, .2), M('#1a1a1a', { r: .5 }), x, y0 + 1.6, z - .1); block(L, x, z, 4.4, .4);
      for (let i = 0; i < 14; i++) for (let j = 0; j < 6; j++) {
        const f = mesh(new T.PlaneGeometry(.26, .3), M('#2a2a2a', { e: '#ffffff', ei: 0, r: .4 }), x - 1.95 + i * .3, y0 + .78 + j * .33, z + .01);
        anim.push({ o: f, type: 'flap', ph: Math.random() * 10, next: 0 });
      }
    }
    if (a.kind === 'buren') {   // 布罕：8.7 公分寬的直條紋＋彩色鏡面
      const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#2a7de1'; for (let i = 0; i < 512; i += 44) g.fillRect(i, 0, 22, 512);
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
      ['#e04848', '#f2c200', '#3ad06a', '#2a7de1', '#e07ab0'].forEach((col, i) => {
        const bx = x - 2.2 + i * 1.1;
        mesh(new T.BoxGeometry(.9, 2.8, .1), M('#ffffff', { map: tx, r: .4 }), bx, y0 + 1.4, z - .2);
        const glass = mesh(new T.PlaneGeometry(.9, 2.8), M(col, { t: true, o: .45, m: .6, r: .05, e: col, ei: .2, side: T.DoubleSide }), bx, y0 + 1.4, z + .35); glass.rotation.y = .25;
      });
      block(L, x, z, 5.6, .8);
    }
    // 作品說明牌
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d'); g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#23272b';
    g.font = `700 ${a.name.length > 9 ? 30 : 46}px "Noto Sans TC", sans-serif`; g.fillText(a.name, 28, 80); g.font = '26px "Noto Sans TC", sans-serif'; g.fillStyle = '#6a6e72'; g.fillText(a.by, 28, 130);
    g.fillText(`公共藝術${a.year ? '・' + a.year : ''}　Public Art`, 28, 200);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const px = a.level === 'platform' ? x + 7 : x + (x > 0 ? -2.8 : 2.8), pz = a.level === 'platform' ? z + 1.6 : z + 1.9;
    mesh(new T.BoxGeometry(.06, 1, .06), M('#30363c'), px, y0 + .5, pz);
    const plate = mesh(new T.PlaneGeometry(.7, .35), new T.MeshBasicMaterial({ map: tex }), px, y0 + 1.05, pz + .04); plate.rotation.x = -.3;
  }

  // 月台層的作品：放在第一個月台中段（柱子與電扶梯之間）
  function platformSpot(L) { const P = L.platforms[0]; return { x: P.x, z: P.z, y: P.y }; }
  function spawn(stationId) {
    clear();
    const a = ART[stationId], L = World.layout; if (!a || !L) return;
    const wide = ['lenticular', 'glass', 'mural', 'gaze', 'birds', 'flaps', 'buren', 'stones'].includes(a.kind);
    const p = a.level === 'platform' ? platformSpot(L) : findSpot(L, a.kind === 'dome' ? 2.4 : 1.6, wide); if (!p) return;
    group = new T.Group(); World.scene.add(group);
    L.obstacles = L.obstacles || [];
    build(L, a, p);
    cur = { ...p, y: p.y || 0, art: a, station: stationId };
  }
  function clear() { if (group) World.scene.remove(group); group = null; cur = null; anim = []; }
  function tick(dt, now) {
    if (!group) return;
    group.visible = !World.riding;
    const t = now / 1000;
    for (const a of anim) {
      if (a.type === 'bob') a.o.position.y = a.y + Math.sin(t * .9 + a.ph) * .05;
      if (a.type === 'hue') a.o.material.emissive.setHSL((t * .05 + a.ph) % 1, .8, .55);
      if (a.type === 'flip') a.o.rotation.y = Math.sin(t * .7 + a.ph) * .8;
      if (a.type === 'sway') a.o.rotation.z = Math.sin(t * .8 + a.ph) * .08;
      if (a.type === 'flap' && t > a.next) {   // 翻牌：隨機一格翻成亮的或暗的
        a.next = t + 1.5 + Math.random() * 4; a.o.material.emissiveIntensity = Math.random() < .45 ? .55 + Math.random() * .4 : 0; a.o.rotation.x = Math.PI * 2 * Math.random() * .05;
      }
    }
  }
  const near = p => cur && Math.abs(p.y - cur.y) < .5 && Math.hypot(p.x - cur.x, p.z - cur.z) < (cur.art.level === 'platform' ? 7.5 : 3.4);
  const interaction = {
    get id() { return 'art:' + (cur ? cur.station : ''); },
    get label() { return cur ? `欣賞：${cur.art.name}` : '欣賞'; },
    when: p => !Dialog.with && !World.sitting && near(p),
    run: () => {
      if (!cur) return;
      World.lookToward(cur.x, cur.z);
      const c = Game.state.col = Game.state.col || {}, art = c.art = c.art || {}, first = !art[cur.station];
      art[cur.station] = TaipeiTime.date(); saveState();
      Dialog.info(`🎨 ${cur.art.name}`, `<small>${esc(cur.art.by)}${cur.art.year ? '・' + cur.art.year : ''}　${esc(cur.station)}站</small><br><br>${esc(cur.art.text)}<br><br><small>遊戲中為簡化的 3D 呈現，實際外觀請以現場為準。資料來源：臺北市政府捷運工程局公共藝術總表等公開資料。</small>${first ? `<br><small>已收進「紀錄 → 收藏 → 公共藝術」（${Object.keys(art).length} / ${Object.keys(ART).length}）</small>` : ''}`);
      if (first) { Investigate.add(5, null, true); if (typeof Life !== 'undefined') Life.log(`欣賞了公共藝術「${cur.art.name}」`); Achievements.check(); }
    },
  };
  function collectHtml() {
    const art = ((Game.state.col || {}).art) || {};
    return `<h4 class="bag-h">🎨 公共藝術（${Object.keys(art).length} / ${Object.keys(ART).length}）</h4>
      <div class="rc-titles">${Object.entries(ART).map(([st, a]) => art[st] ? `<span class="wd-chip" aria-pressed="true" title="${esc(st)}">${esc(a.name)}</span>` : `<span class="wd-chip" title="${esc(st)}">？？？</span>`).join('')}</div>`;
  }
  return { spawn, clear, tick, interaction, collectHtml, get current() { return cur; } };
})();
