/* 台北捷運實際會有的站內設施（由 Station3D.build 呼叫，在 Decor 之後）
 * 非付費區：出口端牆＋往地面的樓梯口、出口方向吊牌（黃底出口編號）、出口「禁止飲食」地貼與黃線、愛心服務鈴、
 *           行動電源租借機（通用外觀，非品牌）；付費區與非付費區之間的玻璃隔欄（貼禁止飲食標誌）
 * 大廳：導盲磚（出口 → 寬閘門 → 電梯，另一條到詢問處）、藝文櫥窗（大站／轉乘站）、電扶梯口「站穩扶好」地貼
 * 月台：月台門「請勿倚靠」貼紙、門號燈、半高月台門的門號箱、地下月台端牆的緊急出口綠燈
 * 所有文字／圖案畫在三張共用的圖集貼圖上（跨車站共用、不會被釋放），幾何收集成每種材質一個網格，
 * 之後再交給 mergeStatic 合併；每站只多出個位數的 draw call。
 */
const MetroProps = (() => {
  let T = null, R = null;   // R：共用材質、圖集座標

  const hash = s => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 2166136261);
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const SANS = '"Noto Sans TC", sans-serif', LAT = '"Barlow Semi Condensed", sans-serif';
  function arrow(g, cx, cy, s, ang, col = '#fff') {
    g.save(); g.translate(cx, cy); g.rotate(ang); g.scale(s / 100, s / 100); g.fillStyle = col;
    g.beginPath(); g.moveTo(-44, -16); g.lineTo(6, -16); g.lineTo(6, -44); g.lineTo(52, 0); g.lineTo(6, 44); g.lineTo(6, 16); g.lineTo(-44, 16); g.closePath(); g.fill(); g.restore();
  }
  // 圓形禁止標誌（紅圈＋斜線），draw 畫裡面的圖案
  function noSign(g, cx, cy, r, draw) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    draw(); g.strokeStyle = '#d0202e'; g.lineWidth = r * .17; g.beginPath(); g.arc(cx, cy, r * .9, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(cx - r * .64, cy - r * .64); g.lineTo(cx + r * .64, cy + r * .64); g.stroke();
  }
  function foodIcon(g, cx, cy, r) {   // 杯子＋吸管、麵包
    g.fillStyle = '#1c2126';
    g.beginPath(); g.moveTo(cx - r * .5, cy - r * .3); g.lineTo(cx - r * .1, cy - r * .3); g.lineTo(cx - r * .17, cy + r * .45); g.lineTo(cx - r * .43, cy + r * .45); g.closePath(); g.fill();
    g.fillRect(cx - r * .3, cy - r * .62, r * .06, r * .34);
    g.beginPath(); g.ellipse(cx + r * .3, cy + r * .12, r * .3, r * .2, 0, Math.PI, 0); g.fill(); g.fillRect(cx, cy + r * .17, r * .6, r * .1); g.fillRect(cx + .02 * r, cy + r * .32, r * .56, r * .12);
  }

  /* ── 共用圖集 ── */
  const LIT = { W: 1024, H: 1024, exitF: [0, 0, 1024, 160], exitB: [0, 176, 1024, 160], green: [0, 352, 384, 128], stairs: [400, 352, 256, 288], screen: [672, 352, 128, 160], num0: [0, 656] };
  const PRN = { W: 1024, H: 512, psd: [0, 0, 256, 96], noeat: [264, 0, 192, 256], bell: [464, 0, 160, 256], kiosk: [832, 0, 192, 500], showA: [0, 264, 400, 240], showB: [408, 264, 400, 240] };
  const FLR = { W: 512, H: 512, bar: [0, 0, 64, 64], dot: [72, 0, 64, 64], yel: [144, 0, 48, 48], noeat: [0, 72, 512, 160], esc: [0, 240, 256, 192] };
  const uvOf = (A, r, inset = 1.5) => [(r[0] + inset) / A.W, 1 - (r[1] + r[3] - inset) / A.H, (r[0] + r[2] - inset) / A.W, 1 - (r[1] + inset) / A.H];

  function drawLit(g) {
    g.fillStyle = '#23272b'; g.fillRect(0, 0, LIT.W, LIT.H);
    // 出口方向吊牌（正面：往出口；背面：往閘門）
    {
      const [x0, y0] = LIT.exitF; g.fillStyle = '#1c2024'; g.fillRect(x0, y0, 1024, 160);
      g.fillStyle = '#fff'; g.font = `700 64px ${SANS}`; g.fillText('出口', x0 + 34, y0 + 86); g.fillStyle = '#c8cdd2'; g.font = `500 32px ${LAT}`; g.fillText('Exit', x0 + 38, y0 + 128);
      [['3', -Math.PI * .75], ['2', -Math.PI / 2], ['1', -Math.PI / 4]].forEach(([n, a], i) => {
        const bx = x0 + 250 + i * 262;
        g.fillStyle = '#f2c200'; rr(g, bx, y0 + 25, 110, 110, 14); g.fill();
        g.fillStyle = '#1c2126'; g.font = `700 92px ${LAT}`; g.textAlign = 'center'; g.fillText(n, bx + 55, y0 + 113); g.textAlign = 'left';
        arrow(g, bx + 175, y0 + 80, 92, a);
      });
    }
    {
      const [x0, y0] = LIT.exitB; g.fillStyle = '#1c2024'; g.fillRect(x0, y0, 1024, 160);
      arrow(g, x0 + 70, y0 + 80, 100, -Math.PI / 2);
      g.fillStyle = '#fff'; g.font = `700 54px ${SANS}`; g.fillText('閘門・往月台', x0 + 132, y0 + 78); g.fillStyle = '#c8cdd2'; g.font = `500 28px ${LAT}`; g.fillText('Fare gates · To platforms', x0 + 136, y0 + 122);
      g.fillStyle = '#f2c200'; rr(g, x0 + 590, y0 + 30, 100, 100, 14); g.fill(); g.fillStyle = '#23272b'; g.font = `700 76px ${SANS}`; g.textAlign = 'center'; g.fillText('?', x0 + 640, y0 + 108); g.textAlign = 'left';
      g.fillStyle = '#fff'; g.font = `700 54px ${SANS}`; g.fillText('詢問處', x0 + 710, y0 + 78); g.fillStyle = '#c8cdd2'; g.font = `500 28px ${LAT}`; g.fillText('Information', x0 + 714, y0 + 122);
      arrow(g, x0 + 960, y0 + 80, 92, 0);
    }
    // 緊急出口綠燈
    {
      const [x0, y0, w, h] = LIT.green; g.fillStyle = '#17a058'; g.fillRect(x0, y0, w, h);
      g.fillStyle = '#fff'; g.fillRect(x0 + 18, y0 + 18, 70, 92); g.fillStyle = '#17a058'; g.fillRect(x0 + 26, y0 + 26, 54, 84);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x0 + 110, y0 + 30, 11, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 11; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(x0 + 104, y0 + 46); g.lineTo(x0 + 92, y0 + 76); g.lineTo(x0 + 110, y0 + 92); g.lineTo(x0 + 106, y0 + 114); g.stroke();
      g.beginPath(); g.moveTo(x0 + 92, y0 + 76); g.lineTo(x0 + 72, y0 + 104); g.stroke();
      g.beginPath(); g.moveTo(x0 + 82, y0 + 58); g.lineTo(x0 + 102, y0 + 50); g.lineTo(x0 + 122, y0 + 66); g.stroke();
      g.fillStyle = '#fff'; g.font = `700 50px ${SANS}`; g.fillText('緊急出口', x0 + 150, y0 + 66); g.font = `700 34px ${LAT}`; g.fillText('EXIT', x0 + 152, y0 + 108);
    }
    // 出口樓梯口（往地面的樓梯，透視畫）
    {
      const [x0, y0, w, h] = LIT.stairs;
      const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, '#3a3f45'); gr.addColorStop(1, '#22262a'); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      const top = y0 + 64, vx = x0 + w / 2, tw = 70;
      // 地面出口的亮光
      const sky = g.createLinearGradient(0, y0 + 14, 0, top); sky.addColorStop(0, '#fffaf0'); sky.addColorStop(1, '#e8e2d2'); g.fillStyle = sky; g.fillRect(vx - tw, y0 + 14, tw * 2, top - y0 - 14);
      // 側牆
      g.fillStyle = '#cfcac0'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(vx - tw, y0 + 14); g.lineTo(vx - tw, top); g.lineTo(x0, y0 + h); g.fill();
      g.fillStyle = '#bdb8ae'; g.beginPath(); g.moveTo(x0 + w, y0); g.lineTo(vx + tw, y0 + 14); g.lineTo(vx + tw, top); g.lineTo(x0 + w, y0 + h); g.fill();
      // 階梯
      const N = 16;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N, ya = y0 + h - (h - (top - y0)) * Math.pow(t0, .8), yb = y0 + h - (h - (top - y0)) * Math.pow(t1, .8);
        const hw = w / 2 - (w / 2 - tw) * Math.pow(t0, .8);
        g.fillStyle = i % 2 ? '#a8a398' : '#c2bdb2'; g.fillRect(vx - hw, yb, hw * 2, ya - yb);
        g.fillStyle = '#d9b100'; g.fillRect(vx - hw, yb, hw * 2, Math.max(1.5, (ya - yb) * .14));
      }
      // 扶手、天花板燈
      g.strokeStyle = '#6a6f75'; g.lineWidth = 5;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(vx + s * (w / 2 - 6), y0 + h * .62); g.lineTo(vx + s * (tw - 4), top - 10); g.stroke(); }
      g.fillStyle = '#fff6e0'; for (let i = 0; i < 4; i++) { const yy = y0 + 4 + i * 4, ww = 60 - i * 12; g.fillRect(vx - ww / 2, yy, ww, 2.5); }
    }
    // 行動電源螢幕
    {
      const [x0, y0, w, h] = LIT.screen; g.fillStyle = '#0e2a33'; g.fillRect(x0, y0, w, h);
      g.fillStyle = '#18a08f'; g.fillRect(x0, y0, w, 30); g.fillStyle = '#fff'; g.font = `700 20px ${SANS}`; g.fillText('掃碼租借', x0 + 22, y0 + 22);
      g.fillStyle = '#fff'; g.fillRect(x0 + 24, y0 + 44, 80, 80); g.fillStyle = '#111';
      const r = rng(7); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (r() < .45) g.fillRect(x0 + 28 + i * 9, y0 + 48 + j * 9, 9, 9);
      for (const [a, b] of [[0, 0], [5, 0], [0, 5]]) { g.fillStyle = '#111'; g.fillRect(x0 + 28 + a * 9, y0 + 48 + b * 9, 27, 27); g.fillStyle = '#fff'; g.fillRect(x0 + 33 + a * 9, y0 + 53 + b * 9, 17, 17); g.fillStyle = '#111'; g.fillRect(x0 + 37 + a * 9, y0 + 57 + b * 9, 9, 9); }
      g.fillStyle = '#9fe0d8'; g.font = `500 17px ${LAT}`; g.fillText('Power bank', x0 + 26, y0 + 148);
    }
    // 門號（1-1 … 3-4）
    for (let i = 0; i < 12; i++) {
      const x = LIT.num0[0] + (i % 8) * 128, y = LIT.num0[1] + ((i / 8) | 0) * 72;
      g.fillStyle = '#23272b'; g.fillRect(x, y, 128, 64); g.fillStyle = '#fff'; g.font = `700 44px ${LAT}`; g.textAlign = 'center'; g.fillText(`${((i / 4) | 0) + 1}-${i % 4 + 1}`, x + 64, y + 48); g.textAlign = 'left';
    }
  }
  function drawPrint(g) {
    g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, PRN.W, PRN.H);
    { // 請勿倚靠
      const [x0, y0, w, h] = PRN.psd; g.fillStyle = '#fff'; rr(g, x0 + 2, y0 + 2, w - 4, h - 4, 12); g.fill(); g.strokeStyle = '#d0202e'; g.lineWidth = 4; g.stroke();
      noSign(g, x0 + 48, y0 + 48, 36, () => {
        g.strokeStyle = '#1c2126'; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0 + 66, y0 + 22); g.lineTo(x0 + 66, y0 + 76); g.stroke();                       // 門
        g.fillStyle = '#1c2126'; g.beginPath(); g.arc(x0 + 52, y0 + 30, 6, 0, 7); g.fill();
        g.beginPath(); g.moveTo(x0 + 50, y0 + 38); g.lineTo(x0 + 60, y0 + 56); g.lineTo(x0 + 46, y0 + 76); g.stroke();   // 倚靠的人
      });
      g.fillStyle = '#1c2126'; g.font = `700 34px ${SANS}`; g.fillText('請勿倚靠', x0 + 96, y0 + 50); g.fillStyle = '#555'; g.font = `500 21px ${LAT}`; g.fillText('Do not lean on doors', x0 + 97, y0 + 78);
    }
    { // 禁止飲食（圓形標誌）
      const [x0, y0, w, h] = PRN.noeat; g.fillStyle = '#fff'; rr(g, x0 + 2, y0 + 2, w - 4, h - 4, 14); g.fill(); g.strokeStyle = '#c9cdd1'; g.lineWidth = 3; g.stroke();
      noSign(g, x0 + w / 2, y0 + 88, 70, () => foodIcon(g, x0 + w / 2, y0 + 88, 62));
      g.fillStyle = '#1c2126'; g.font = `700 36px ${SANS}`; g.textAlign = 'center'; g.fillText('禁止飲食', x0 + w / 2, y0 + 200); g.fillStyle = '#555'; g.font = `500 20px ${LAT}`; g.fillText('No eating or drinking', x0 + w / 2, y0 + 230); g.textAlign = 'left';
    }
    { // 愛心服務鈴
      const [x0, y0, w, h] = PRN.bell; g.fillStyle = '#1f5fb0'; rr(g, x0 + 2, y0 + 2, w - 4, h - 4, 12); g.fill();
      g.fillStyle = '#fff'; const hx = x0 + w / 2, hy = y0 + 54;
      g.beginPath(); g.moveTo(hx, hy + 30); g.bezierCurveTo(hx - 50, hy - 4, hx - 26, hy - 40, hx, hy - 16); g.bezierCurveTo(hx + 26, hy - 40, hx + 50, hy - 4, hx, hy + 30); g.fill();
      g.textAlign = 'center'; g.font = `700 28px ${SANS}`; g.fillText('愛心服務鈴', hx, y0 + 124); g.font = `500 18px ${LAT}`; g.fillText('Assistance bell', hx, y0 + 148);
      g.fillStyle = '#f2c200'; g.beginPath(); g.arc(hx, y0 + 198, 30, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#23272b'; g.font = `700 18px ${SANS}`; g.fillText('按鈴', hx, y0 + 205); g.textAlign = 'left';
    }
    { // 行動電源租借機正面
      const [x0, y0, w, h] = PRN.kiosk; g.fillStyle = '#eef1f2'; g.fillRect(x0, y0, w, h);
      g.fillStyle = '#18a08f'; g.fillRect(x0, y0, w, 74); g.fillStyle = '#fff'; g.font = `700 32px ${SANS}`; g.fillText('行動電源', x0 + 32, y0 + 40); g.font = `500 19px ${LAT}`; g.fillText('Power Bank Rental', x0 + 34, y0 + 64);
      g.fillStyle = '#2a2e33'; g.fillRect(x0 + 24, y0 + 90, w - 48, 150);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) {
        const sx = x0 + 22 + c * 78, sy = y0 + 262 + r * 34;
        g.fillStyle = '#3a4046'; rr(g, sx, sy, 70, 26, 5); g.fill(); g.fillStyle = (r + c) % 3 ? '#3ad06a' : '#f2a12a'; g.fillRect(sx + 56, sy + 10, 7, 7);
      }
      g.fillStyle = '#18a08f'; g.fillRect(x0, y0 + h - 34, w, 34); g.fillStyle = '#fff'; g.font = `600 17px ${SANS}`; g.fillText('租借・歸還 Rent / Return', x0 + 12, y0 + h - 11);
    }
    // 藝文櫥窗背板（兩種主題）
    for (const [key, zh, en, bg] of [['showA', '捷運模型展', 'Metro model exhibition', ['#f3ecdf', '#dcd2bf']], ['showB', '台灣陶藝小展', 'Taiwan ceramics', ['#e9eef0', '#cfd8dc']]]) {
      const [x0, y0, w, h] = PRN[key];
      const gr = g.createLinearGradient(x0, y0, x0, y0 + h); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      g.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x0 + w - 70 - i * 26, y0 + 70 + i * 10, 60 - i * 7, 0, 7); g.fill(); }
      g.fillStyle = '#23272b'; g.fillRect(x0 + 18, y0 + 18, 196, 58); g.fillStyle = '#fff'; g.font = `700 30px ${SANS}`; g.fillText('藝文櫥窗', x0 + 32, y0 + 58);
      g.fillStyle = '#23272b'; g.font = `700 30px ${SANS}`; g.fillText(zh, x0 + 22, y0 + 116); g.fillStyle = '#5a5f66'; g.font = `500 20px ${LAT}`; g.fillText(en, x0 + 24, y0 + 142);
      g.fillStyle = '#8a8f96'; for (let i = 0; i < 3; i++) g.fillRect(x0 + 24, y0 + 162 + i * 16, 150 - i * 30, 6);
    }
  }
  function drawFloor(g) {
    g.clearRect(0, 0, FLR.W, FLR.H);
    { // 導盲磚：線狀（行進方向）
      const [x0, y0] = FLR.bar; g.fillStyle = '#e2b400'; g.fillRect(x0, y0, 64, 64);
      for (let i = 0; i < 4; i++) { const y = y0 + 7 + i * 14; g.fillStyle = '#b08c00'; g.fillRect(x0, y + 7, 64, 2); g.fillStyle = '#f6cc1a'; g.fillRect(x0, y, 64, 7); }
      g.fillStyle = '#9a7a00'; g.fillRect(x0, y0, 1.5, 64);
    }
    { // 導盲磚：點狀（警示）
      const [x0, y0] = FLR.dot; g.fillStyle = '#e2b400'; g.fillRect(x0, y0, 64, 64);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const cx = x0 + 8 + i * 16, cy = y0 + 8 + j * 16; g.fillStyle = '#b08c00'; g.beginPath(); g.arc(cx + 1, cy + 1.5, 5, 0, 7); g.fill(); g.fillStyle = '#f6cc1a'; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill(); }
      g.strokeStyle = '#9a7a00'; g.lineWidth = 1.5; g.strokeRect(x0 + .75, y0 + .75, 62.5, 62.5);
    }
    { const [x0, y0, w, h] = FLR.yel; g.fillStyle = '#f2c200'; g.fillRect(x0, y0, w, h); }
    { // 出口：禁止飲食地貼
      const [x0, y0, w, h] = FLR.noeat; g.fillStyle = '#f2c200'; rr(g, x0 + 3, y0 + 3, w - 6, h - 6, 20); g.fill(); g.strokeStyle = '#1c2126'; g.lineWidth = 6; g.stroke();
      noSign(g, x0 + 80, y0 + h / 2, 56, () => foodIcon(g, x0 + 80, y0 + h / 2, 50));
      g.fillStyle = '#1c2126'; g.font = `900 66px ${SANS}`; g.fillText('禁止飲食', x0 + 156, y0 + 88); g.font = `600 30px ${LAT}`; g.fillText('No eating or drinking', x0 + 160, y0 + 130);
    }
    { // 電扶梯口：站穩扶好
      const [x0, y0, w, h] = FLR.esc; g.fillStyle = '#1c2126'; rr(g, x0 + 3, y0 + 3, w - 6, h - 6, 16); g.fill();
      g.fillStyle = '#f2c200'; rr(g, x0 + 14, y0 + 14, w - 28, h - 28, 10); g.fill();
      g.fillStyle = '#1c2126'; g.textAlign = 'center'; g.font = `900 56px ${SANS}`; g.fillText('站穩扶好', x0 + w / 2, y0 + 92); g.font = `600 25px ${LAT}`; g.fillText('Hold the handrail', x0 + w / 2, y0 + 128);
      g.font = `600 20px ${SANS}`; g.fillText('注意腳步・小心夾腳', x0 + w / 2, y0 + 160); g.textAlign = 'left';
    }
  }

  function init(K) {
    if (R) return;
    T = K.T;
    const lit = K.canvasTex(LIT.W, LIT.H, drawLit), prn = K.canvasTex(PRN.W, PRN.H, drawPrint), flr = K.canvasTex(FLR.W, FLR.H, drawFloor);
    const share = m => { m.userData.shared = true; return m; };
    R = {
      lit: share(new T.MeshBasicMaterial({ map: lit })),
      prn: share(new T.MeshStandardMaterial({ map: prn, roughness: .55 })),
      flr: share(new T.MeshStandardMaterial({ map: flr, roughness: .6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 })),
      uv: {}, tpl: {},
    };
    for (const [k, r] of Object.entries(LIT)) if (Array.isArray(r) && r.length === 4) R.uv['L' + k] = uvOf(LIT, r);
    for (const [k, r] of Object.entries(PRN)) if (Array.isArray(r)) R.uv['P' + k] = uvOf(PRN, r);
    for (const [k, r] of Object.entries(FLR)) if (Array.isArray(r)) R.uv['F' + k] = uvOf(FLR, r, k === 'bar' || k === 'dot' ? .5 : 1.5);
    for (let i = 0; i < 12; i++) R.uv['num' + i] = uvOf(LIT, [LIT.num0[0] + (i % 8) * 128, LIT.num0[1] + ((i / 8) | 0) * 72, 128, 64], 3);
    const prep = geo => { const g = geo.index ? geo.toNonIndexed() : geo; return { pos: g.attributes.position.array, nor: g.attributes.normal.array, uv: g.attributes.uv.array }; };
    R.tpl.plane = prep(new T.PlaneGeometry(1, 1));
    R.tpl.box = prep(new T.BoxGeometry(1, 1, 1));
    R.tpl.cyl = prep(new T.CylinderGeometry(.5, .5, 1, 10));
  }

  // 收集幾何：每種材質一桶
  const binTex = {};   // 垃圾桶標籤貼圖（各站共用）
  function batcher() {
    const B = new Map();
    const m4 = new T.Matrix4(), nm = new T.Matrix3(), q = new T.Quaternion(), e = new T.Euler(), S = new T.Vector3(), P = new T.Vector3(), v = new T.Vector3();
    let n = 0;
    function add(mat, kind, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, uv = null) {
      const t = R.tpl[kind]; let b = B.get(mat); if (!b) B.set(mat, b = { pos: [], nor: [], uv: [] });
      e.set(rx, ry, rz); q.setFromEuler(e); m4.compose(P.set(x, y, z), q, S.set(sx, sy, sz)); nm.getNormalMatrix(m4);
      for (let i = 0, j = 0; i < t.pos.length; i += 3, j += 2) {
        v.set(t.pos[i], t.pos[i + 1], t.pos[i + 2]).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z);
        v.set(t.nor[i], t.nor[i + 1], t.nor[i + 2]).applyMatrix3(nm).normalize(); b.nor.push(v.x, v.y, v.z);
        const u = t.uv[j], w = t.uv[j + 1];
        if (uv) b.uv.push(uv[0] + u * (uv[2] - uv[0]), uv[1] + w * (uv[3] - uv[1])); else b.uv.push(u, w);
      }
      n++;
    }
    function finish(parent) {
      let meshes = 0;
      for (const [mat, b] of B) {
        if (!b.pos.length) continue;
        const geo = new T.BufferGeometry();
        geo.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3));
        geo.setAttribute('normal', new T.Float32BufferAttribute(b.nor, 3));
        geo.setAttribute('uv', new T.Float32BufferAttribute(b.uv, 2));
        geo.computeBoundingSphere();
        const m = new T.Mesh(geo, mat); m.name = 'metroprops'; if (mat.transparent) m.renderOrder = 1;
        parent.add(m); meshes++;
      }
      return meshes;
    }
    return { add, finish, get count() { return n; } };
  }

  function build(L, g, K) {
    init(K);
    const b = batcher(), add = b.add, M = K.M, uv = R.uv;
    const C = L.concourse, U = L.unpaid, gz = L.gateZ, hallH = 4.2;
    const seed = hash(L.stationId), rnd = rng(seed);
    const transfer = L.platforms.length >= 2, big = !!(typeof Station3D !== 'undefined' && Station3D.SHOPS && Station3D.SHOPS[L.stationId]);
    const lineC = (typeof LINES !== 'undefined' && LINES[L.platforms[0].line]) ? LINES[L.platforms[0].line].color : '#2a7de1';
    const steel = M('#c8cdd2', { r: .25, m: .9 }), dark = M('#30363c', { r: .5 }), glass = M('#cfe3ec', { t: true, o: .16, r: .05, m: .1, dw: false });
    const info = { stationId: L.stationId, items: [] };
    const placed = [];   // 我放的東西（地面範圍）
    const solid = (x, z, w, d, y = 0, tag) => { K.solid(x, z, w, d, y); placed.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, y }); if (tag) info.items.push([tag, +x.toFixed(2), +z.toFixed(2)]); };
    const hit = (a, o) => a.x0 < o.x1 && a.x1 > o.x0 && a.z0 < o.z1 && a.z1 > o.z0;
    const R2 = (x0, x1, z0, z1) => ({ x0, x1, z0, z1 });
    // 局部座標（繞 y 轉 ry）→ 世界座標
    const loc = (x, z, ry) => (lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
    const rampBox = (m = 0) => L.platforms.flatMap(P => P.ramps.map(r => R2(Math.min(r.xa, r.xb) - 1.9 - m, Math.max(r.xa, r.xb) + 1.9 + m, r.z - 2.3 - m, r.z + 2.3 + m)));
    // 地面上一塊區域是否空著（大廳／非付費區，y = 0）
    const RESERVED = [];
    { // 牆上原有的設施、特別場所（沒有登記成障礙物的）
      const bz = C.z0;
      for (const [a, w] of [[C.x0 + 4, 1.2], [C.x0 + 8, 1.3], [C.x0 + 14, 2.8], [C.x0 + 22, 1.8], [C.x1 - 15, 1.8], [C.x1 - 10.5, .7], [C.x1 - 8, .6], [C.x1 - 4, 1.3], [0, 4.2], [-5.2, .4], [5.2, .4]]) RESERVED.push(R2(a - w, a + w, bz, bz + 1.2));
      for (const wx of [C.x0, C.x1]) RESERVED.push(R2(wx - 1.2, wx + 1.2, C.z0 + 7.2, C.z0 + 8.8));   // 消防栓
      RESERVED.push(R2(C.x1 - 5.5, C.x1, C.z0 + 10.5, C.z0 + 17.5), R2(C.x0, C.x0 + 5.5, C.z0 + 11.5, C.z0 + 15.5), R2(C.x1 - 6, C.x1 - 1, C.z0 + 16, C.z0 + 21));
      RESERVED.push(R2(C.x0, C.x0 + 2.6, C.z0 + 14.3, C.z0 + 17.7), R2(C.x1 - 2.6, C.x1, C.z0 + 14.3, C.z0 + 17.7));
      RESERVED.push(R2(-12, 12, gz - 4.6, gz + 3.6));                                                     // 閘門前後、時刻表、路線指南
      RESERVED.push(R2(U.x0 - 1, U.x0 + 1.6, U.z0, U.z0 + 11.6), R2(U.x1 - 10.2, U.x1 + 1, U.z0, U.z0 + 12.6));   // 非付費區兩側牆
      RESERVED.push(R2(-8.6, -6.4, U.z1 - 1.2, U.z1), R2(6.8, 10.2, U.z1 - 1.2, U.z1), R2(-11.8, -10.2, U.z1 - 1, U.z1));   // 周邊地圖、廣告、傘架
    }
    const floorFree = (a, m = .35) => {
      const am = R2(a.x0 - m, a.x1 + m, a.z0 - m, a.z1 + m);
      const inPaid = a.x0 > C.x0 && a.x1 < C.x1 && a.z0 > C.z0 && a.z1 < gz - .2, inUnpaid = a.x0 > U.x0 && a.x1 < U.x1 && a.z0 > U.z0 && a.z1 < U.z1;
      if (!inPaid && !inUnpaid) return false;
      if ((L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && hit(am, o))) return false;
      if (placed.some(o => Math.abs(o.y || 0) < .5 && hit(am, o))) return false;
      if (RESERVED.some(o => hit(a, o))) return false;
      if (rampBox(.5).some(o => hit(a, o))) return false;
      if (L.spots.some(s => (s.y || 0) === 0 && hit(R2(a.x0 - 1, a.x1 + 1, a.z0 - 1, a.z1 + 1), R2(s.x, s.x, s.z, s.z)))) return false;
      if ((L.rooms || []).some(r => hit(am, R2(r.door.wx - 2.4, r.door.wx + 2.4, r.door.z - r.door.w / 2 - 1.2, r.door.z + r.door.w / 2 + 1.2)))) return false;
      if ((L.ads || []).some(d => hit(am, R2(d.x - 2, d.x + 2, d.z - 2, d.z + 2)))) return false;
      if (tiles.some(t => hit(am, R2(t[1] - .2, t[1] + .2, t[2] - .2, t[2] + .2)))) return false;   // 不要蓋在導盲磚上
      return true;
    };
    const take = (a, y = 0) => placed.push({ ...a, y });

    /* ── 1) 非付費區出口端牆：牆面、往地面的樓梯口、不鏽鋼門框 ── */
    const exitXs = [U.x0 + 1.5, 0, U.x1 - 1.5];
    {
      const W = U.x1 - U.x0, wallM = M('#ffffff', { map: K.tiled(K.TEX.wall, W / 1.6, 3), r: .6 });
      add(wallM, 'box', (U.x0 + U.x1) / 2, hallH / 2, U.z1 + .15, W, hallH, .3);
      add(M(lineC, { r: .4, m: .2 }), 'box', (U.x0 + U.x1) / 2, 3.62, U.z1 - .02, W, .16, .04);
      add(M('#3c4249', { r: .4, m: .5 }), 'box', (U.x0 + U.x1) / 2, 3.5, U.z1 - .022, W, .03, .045);
      // 踢腳板（出口之間）
      const cuts = exitXs.map(x => [x - 1.3, x + 1.3]).sort((a, c) => a[0] - c[0]); let x = U.x0;
      for (const [a, c] of cuts) { if (a > x + .1) add(M('#4a4f55', { r: .4, m: .3 }), 'box', (x + a) / 2, .08, U.z1 - .035, a - x, .16, .07); x = Math.max(x, c); }
      if (U.x1 > x + .1) add(M('#4a4f55', { r: .4, m: .3 }), 'box', (x + U.x1) / 2, .08, U.z1 - .035, U.x1 - x, .16, .07);
      for (const ex of exitXs) {
        add(R.lit, 'plane', ex, 1.28, U.z1 - .062, 2.3, 2.5, 1, 0, Math.PI, 0, uv.Lstairs);          // 樓梯口（畫在出口門洞上）
        for (const s of [-1, 1]) add(steel, 'box', ex + s * 1.22, 1.3, U.z1 - .09, .07, 2.62, .1);
        add(steel, 'box', ex, 2.63, U.z1 - .09, 2.51, .07, .1);
      }
    }

    /* ── 2) 付費區與非付費區之間的玻璃隔欄（閘門兩側） ── */
    {
      const zf = gz + .6, gl = L.gates[0] - 1.2 - .26, gr = L.gates[L.gates.length - 1] + 1.2 + .26;
      for (const [a, c] of [[U.x0 + .02, gl], [gr, U.x1 - .02]]) {
        const len = c - a, n = Math.max(1, Math.ceil(len / 1.5));
        for (let i = 0; i <= n; i++) add(steel, 'box', a + len * i / n, .58, zf, .06, 1.16, .06);
        add(steel, 'box', (a + c) / 2, 1.17, zf, len, .05, .07); add(steel, 'box', (a + c) / 2, .1, zf, len, .06, .07);
        add(glass, 'box', (a + c) / 2, .64, zf, len, .98, .02);
        solid((a + c) / 2, zf, len, .1);
        const mx = (a + c) / 2 + (a < 0 ? -.75 : .75);   // 兩面都貼禁止飲食
        for (const s of [-1, 1]) add(R.prn, 'plane', mx, .78, zf + s * .018, .27, .36, 1, 0, s > 0 ? 0 : Math.PI, 0, uv.Pnoeat);
      }
      info.items.push(['fence']);
    }

    /* ── 3) 出口的禁止飲食地貼與黃線 ── */
    for (const ex of exitXs) {
      if ((L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && hit(R2(ex - 1.3, ex + 1.3, U.z1 - 2.2, U.z1), o))) continue;
      add(R.flr, 'plane', ex, .013, U.z1 - 1.25, 2.3, .09, 1, -Math.PI / 2, 0, 0, uv.Fyel);
      add(R.flr, 'plane', ex - .62, .013, U.z1 - 1.72, 1.0, .31, 1, -Math.PI / 2, 0, 0, uv.Fnoeat);
      info.items.push(['noeat', ex]);
    }

    /* ── 4) 導盲磚 ── */
    const gx = L.gates[L.gates.length - 1];   // 寬閘門
    const tiles = [];   // [kind, x, z, rotZ]
    const strip = (pts) => {
      const S = .3;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [cx, cz] = pts[i + 1], len = Math.hypot(cx - ax, cz - az); if (len < .01) continue;
        const dx = (cx - ax) / len, dz = (cz - az) / len, t0 = i === 0 ? .3 : .15, t1 = len - (i === pts.length - 2 ? .3 : .15);
        const n = Math.max(0, Math.round((t1 - t0) / S)), st = n ? (t1 - t0) / n : 0, rz = Math.abs(dx) > .5 ? 0 : Math.PI / 2;
        for (let k = 0; k < n; k++) { const t = t0 + st * (k + .5); tiles.push(['bar', ax + dx * t, az + dz * t, rz, st]); }
      }
      for (let i = 1; i < pts.length - 1; i++) tiles.push(['dot', pts[i][0], pts[i][1], 0, .3]);
      for (const i of [0, pts.length - 1]) for (const [ox, oz] of [[-.15, -.15], [.15, -.15], [-.15, .15], [.15, .15]]) tiles.push(['dot', pts[i][0] + ox, pts[i][1] + oz, 0, .3]);
    };
    // 方格最短路徑（轉彎有懲罰），回傳轉折點
    function gridPath(box, blocked, start, goals, cs = .5) {
      const nx = Math.ceil((box.x1 - box.x0) / cs), nz = Math.ceil((box.z1 - box.z0) / cs);
      const ci = x => Math.round((x - box.x0) / cs - .5), cj = z => Math.round((z - box.z0) / cs - .5);
      const cx = i => box.x0 + (i + .5) * cs, cz = j => box.z0 + (j + .5) * cs;
      const free = new Uint8Array(nx * nz);
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) free[j * nx + i] = blocked(cx(i), cz(j)) ? 0 : 1;
      const s = [ci(start[0]), cj(start[1])]; if (s[0] < 0 || s[1] < 0 || s[0] >= nx || s[1] >= nz) return null;
      free[s[1] * nx + s[0]] = 1;
      const goalSet = new Set();
      for (const gp of goals) { const i = ci(gp[0]), j = cj(gp[1]); if (i >= 0 && j >= 0 && i < nx && j < nz) { goalSet.add(j * nx + i); free[j * nx + i] = 1; } }
      const D = [[1, 0], [-1, 0], [0, 1], [0, -1]], N = nx * nz * 4, dist = new Float32Array(N).fill(1e9), prev = new Int32Array(N).fill(-1);
      const heap = []; const push = (d, st) => { heap.push([d, st]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      for (let d = 0; d < 4; d++) { const st = (s[1] * nx + s[0]) * 4 + d; dist[st] = 0; push(0, st); }
      let end = -1;
      while (heap.length) {
        const [dd, st] = pop(); if (dd > dist[st]) continue;
        const c = st >> 2, d = st & 3; if (goalSet.has(c)) { end = st; break; }
        const i = c % nx, j = (c / nx) | 0;
        for (let nd = 0; nd < 4; nd++) {
          const ni = i + D[nd][0], nj = j + D[nd][1]; if (ni < 0 || nj < 0 || ni >= nx || nj >= nz || !free[nj * nx + ni]) continue;
          const ns = (nj * nx + ni) * 4 + nd, cost = dd + 1 + (nd !== d ? 5 : 0);
          if (cost < dist[ns]) { dist[ns] = cost; prev[ns] = st; push(cost, ns); }
        }
      }
      if (end < 0) return null;
      const cells = []; for (let st = end; st >= 0; st = prev[st]) { const c = st >> 2; if (!cells.length || cells[cells.length - 1] !== c) cells.push(c); }
      cells.reverse();
      const pts = cells.map(c => [cx(c % nx), cz((c / nx) | 0)]);
      const out = [pts[0]];
      for (let k = 1; k < pts.length - 1; k++) { const a = out[out.length - 1], p = pts[k], n = pts[k + 1]; if ((a[0] === p[0] && p[0] === n[0]) || (a[1] === p[1] && p[1] === n[1])) continue; out.push(p); }
      if (pts.length > 1) out.push(pts[pts.length - 1]);
      return out;
    }
    const snapEnd = (pts, i, x, z) => {   // 把端點對齊到真正的位置（沿最後一段的方向移動那一段）
      const j = i === 0 ? 1 : pts.length - 2, p = pts[i], q = pts[j];
      if (!q) { pts[i] = [x, z]; return; }
      if (Math.abs(p[0] - q[0]) < 1e-6) { p[0] = x; q[0] = x; p[1] = z; } else { p[1] = z; q[1] = z; p[0] = x; }
    };
    const obstBlock = (x, z, m) => (L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && x > o.x0 - m && x < o.x1 + m && z > o.z0 - m && z < o.z1 + m) || placed.some(o => Math.abs(o.y || 0) < .5 && x > o.x0 - m && x < o.x1 + m && z > o.z0 - m && z < o.z1 + m);
    const ramps = rampBox(.2);
    let tacN = 0;
    { // 非付費區：2 號出口 → 寬閘門，另一條接到詢問處
      const box = R2(gx - 30, gx + 30, U.z0 - .25, U.z1);
      const blk = (x, z) => x < U.x0 + .55 || x > U.x1 - .55 || z < U.z0 + .3 || z > U.z1 - .3 || obstBlock(x, z, .4);
      const p = gridPath(box, blk, [0, U.z1 - .5], [[gx, U.z0 + .25]]);
      if (p) {
        snapEnd(p, 0, 0, U.z1 - .45); snapEnd(p, p.length - 1, gx, U.z0 + .2);
        // 穿過寬閘門接到付費區那一段
        const l = p.length - 1;
        if (l > 0 && Math.abs(p[l][0] - p[l - 1][0]) < 1e-6) p[l] = [gx, gz - .45]; else p.push([gx, gz - .45]);
        strip(p); tacN++;
        const onPath = []; for (let k = 0; k < p.length - 1; k++) { const [ax, az] = p[k], [cx, cz] = p[k + 1], n = Math.ceil(Math.hypot(cx - ax, cz - az) / .5); for (let t = 0; t <= n; t++) if (az + (cz - az) * t / n > U.z0 + .5) onPath.push([ax + (cx - ax) * t / n, az + (cz - az) * t / n]); }
        const dx = U.x1 - 3.5, dz = U.z0 + 4.25;
        const q = onPath.length && gridPath(box, blk, [dx, dz], onPath);
        if (q && q.length > 1) { snapEnd(q, 0, dx, dz); strip(q); tacN++; }
      }
    }
    { // 付費區：寬閘門 → 大廳電梯
      const ex = C.x0 + 4, ez = C.z0 + 1.0;
      const box = R2(C.x0, C.x1, C.z0, gz);
      const blk = (x, z) => x < C.x0 + .6 || x > C.x1 - .6 || z > gz - .4 || (z < C.z0 + .8 && Math.abs(x - ex) > .3) || obstBlock(x, z, .4) || ramps.some(r => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
      const p = gridPath(box, blk, [gx, gz - .7], [[ex, ez]]);
      if (p && p.length > 1) { snapEnd(p, 0, gx, gz - .45); snapEnd(p, p.length - 1, ex, ez); p.shift(); p.unshift([gx, gz - .45]); strip(p); tacN++; }
    }
    // 導盲磚畫在最後面（同一個網格裡後畫的蓋在上面）
    const tacTiles = tiles;

    /* ── 5) 出口方向吊牌（非付費區，出閘門後看得到） ── */
    {
      const z = U.z0 + 3.4, y = 3.05;
      add(dark, 'box', 0, y, z, 3.96, .68, .06);
      add(R.lit, 'plane', 0, y, z - .032, 3.9, .61, 1, 0, Math.PI, 0, uv.LexitF);
      add(R.lit, 'plane', 0, y, z + .032, 3.9, .61, 1, 0, 0, 0, uv.LexitB);
      for (const s of [-1, 1]) add(dark, 'box', s * 1.5, (y + .34 + hallH) / 2, z, .04, hallH - y - .34, .04);
      info.items.push(['exitboard']);
    }

    /* ── 6) 愛心服務鈴（2 號出口旁） ── */
    {
      const x = 1.9, a = R2(x - .3, x + .3, U.z1 - .6, U.z1);
      if (!(L.obstacles || []).some(o => Math.abs(o.y || 0) < .5 && hit(a, o))) {
        add(M('#e8eaec', { r: .4, m: .3 }), 'box', x, 1.22, U.z1 - .02, .38, .55, .04);
        add(R.prn, 'plane', x, 1.22, U.z1 - .043, .34, .51, 1, 0, Math.PI, 0, uv.Pbell);
        add(M('#f2c200', { r: .3, e: '#f2a000', ei: .25 }), 'cyl', x, 1.04, U.z1 - .055, .1, .03, .1, Math.PI / 2, 0, 0);
        info.items.push(['bell', x]);
      }
    }

    /* ── 7) 行動電源租借機（靠牆） ── */
    function kiosk(x, z, ry) {
      const W = loc(x, z, ry), body = M('#e9ecef', { r: .4, m: .2 });
      add(body, 'box', x, .875, z, .56, 1.75, .4, 0, ry, 0);
      add(M('#18a08f', { r: .5 }), 'box', x, 1.77, z, .58, .06, .42, 0, ry, 0);
      const [fx, fz] = W(0, .206); add(R.prn, 'plane', fx, .95, fz, .5, 1.3, 1, 0, ry, 0, uv.Pkiosk);
      const [sx, sz] = W(0, .212); add(R.lit, 'plane', sx, 1.43, sz, .38, .44, 1, 0, ry, 0, uv.Lscreen);
    }
    {
      const want = big || transfer ? 2 : 1, cands = [];
      for (const x of [5.6, -5.4]) cands.push([x, U.z1 - .32, Math.PI]);
      for (let z = U.z0 + 11.2; z < U.z1 - 1.4; z += .6) { cands.push([U.x0 + .32, z, Math.PI / 2]); cands.push([U.x1 - .32, z, -Math.PI / 2]); }
      for (let z = C.z0 + 9; z < gz - 2; z += 1) { cands.push([C.x0 + .3, z, Math.PI / 2]); cands.push([C.x1 - .3, z, -Math.PI / 2]); }
      for (let i = 2; i < cands.length; i++) { const j = 2 + ((rnd() * (cands.length - 2)) | 0); [cands[i], cands[j]] = [cands[j], cands[i]]; }
      if (seed % 2) [cands[0], cands[1]] = [cands[1], cands[0]];
      let n = 0;
      for (const [x, z, ry] of cands) {
        if (n >= want) break;
        const side = Math.abs(Math.sin(ry)) > .5, a = side ? R2(x - .2, x + .2, z - .28, z + .28) : R2(x - .28, x + .28, z - .2, z + .2);
        const front = side ? R2(x - (x < 0 ? -.2 : 1.2), x + (x < 0 ? 1.2 : -.2), z - .3, z + .3) : R2(x - .3, x + .3, z - 1.2, z - .2);
        if (!floorFree(a, .25) || !floorFree(front, .1)) continue;
        if (placed.some(o => o.kiosk && Math.hypot(o.cx - x, o.cz - z) < 8)) continue;
        kiosk(x, z, ry); solid(x, z, side ? .4 : .56, side ? .56 : .4, 0, 'powerbank'); Object.assign(placed[placed.length - 1], { kiosk: true, cx: x, cz: z }); take(R2(front.x0, front.x1, front.z0, front.z1)); n++;
      }
    }

    /* ── 8) 藝文櫥窗（大站、轉乘站；其他站三分之一有） ── */
    function showcase(x, z, ry, theme) {
      const W = loc(x, z, ry), base = M('#3c4249', { r: .45, m: .3 }), cap = M('#2a2e33', { r: .4, m: .4 });
      add(base, 'box', x, .42, z, 2.0, .84, .52, 0, ry, 0);
      { const [px, pz] = W(0, .262); add(M(lineC, { r: .4, m: .2 }), 'box', px, .78, pz, 2.0, .05, .01, 0, ry, 0); }
      add(glass, 'box', x, 1.31, z, 1.98, .94, .5, 0, ry, 0);
      add(cap, 'box', x, 1.84, z, 2.06, .12, .56, 0, ry, 0);
      { const [lx, lz] = W(0, .05); add(M('#fff6e0', { e: '#fff6e0', ei: 1 }), 'box', lx, 1.775, lz, 1.8, .015, .06, 0, ry, 0); }
      for (const s of [-1, 1]) { const [px, pz] = W(s * .99, .24); add(steel, 'box', px, 1.31, pz, .03, .94, .03, 0, ry, 0); }
      { const [bx, bz] = W(0, -.235); add(R.prn, 'plane', bx, 1.31, bz, 1.94, .9, 1, 0, ry, 0, theme ? uv.PshowB : uv.PshowA); }
      if (!theme) {   // 捷運模型：三節車廂＋軌道
        const [tx, tz] = W(0, .06); add(M('#8a8f96', { m: .6, r: .3 }), 'box', tx, .86, tz, 1.8, .02, .16, 0, ry, 0);
        for (let i = -1; i <= 1; i++) {
          const [cx, cz] = W(i * .55, .06);
          add(M('#e9ecef', { r: .35, m: .3 }), 'box', cx, .95, cz, .52, .14, .12, 0, ry, 0);
          add(M(lineC, { r: .4 }), 'box', cx, .93, cz, .525, .03, .125, 0, ry, 0);
          add(M('#1c2126', { r: .2 }), 'box', cx, .985, cz, .5, .035, .125, 0, ry, 0);
        }
        const [px, pz] = W(.62, -.12); add(M('#d8d4cc'), 'box', px, 1.05, pz, .3, .38, .02, -.15, ry, 0);
      } else {        // 陶藝：幾個不同顏色、高度的花瓶
        const cols = ['#2f6f78', '#b8613a', '#e9e5dc', '#3d4248', '#c8a24a'];
        [-.7, -.3, .1, .45, .78].forEach((dx, i) => { const [px, pz] = W(dx, (i % 2) * .1 - .02), h = .18 + ((seed >> i) % 4) * .07, r = .08 + (i % 3) * .025; add(M(cols[(i + seed) % 5], { r: .3, m: .1 }), 'cyl', px, .84 + h / 2, pz, r * 2, h, r * 2); add(M(cols[(i + seed + 2) % 5], { r: .3 }), 'cyl', px, .84 + h + .02, pz, r * 1.1, .04, r * 1.1); });
      }
    }
    if (big || transfer || seed % 3 === 0) {
      const want = big && transfer ? 2 : 1, cands = [];
      for (let z = C.z0 + 9.5; z < gz - 2.5; z += .5) { cands.push([C.x0 + .33, z, Math.PI / 2]); cands.push([C.x1 - .33, z, -Math.PI / 2]); }
      for (let x = C.x0 + 3; x < C.x1 - 3; x += .5) cands.push([x, C.z0 + .33, 0]);
      for (let x = C.x0 + 2; x < C.x1 - 2; x += .5) if (x < U.x0 - 1.2 || x > U.x1 + 1.2) cands.push([x, gz - .33, Math.PI]);
      for (let i = cands.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [cands[i], cands[j]] = [cands[j], cands[i]]; }
      let n = 0;
      for (const [x, z, ry] of cands) {
        if (n >= want) break;
        const side = Math.abs(Math.sin(ry)) > .5, a = side ? R2(x - .28, x + .28, z - 1.02, z + 1.02) : R2(x - 1.02, x + 1.02, z - .28, z + .28);
        const front = side ? (x < 0 ? R2(x + .3, x + 1.6, z - 1, z + 1) : R2(x - 1.6, x - .3, z - 1, z + 1)) : ry ? R2(x - 1, x + 1, z - 1.6, z - .3) : R2(x - 1, x + 1, z + .3, z + 1.6);
        if (!floorFree(a, .3) || !floorFree(front, .1)) continue;
        if (placed.some(o => o.show && Math.hypot(o.cx - x, o.cz - z) < 10)) continue;
        showcase(x, z, ry, (seed >> 3) % 2 ^ n); solid(x, z, side ? .56 : 2.04, side ? 2.04 : .56, 0, 'showcase'); Object.assign(placed[placed.length - 1], { show: true, cx: x, cz: z }); take(front); n++;
      }
    }

    /* ── 9) 電扶梯口的「站穩扶好」地貼（大廳端往月台、月台端往大廳） ── */
    for (const P of L.platforms) for (const r of P.ramps) {
      add(R.flr, 'plane', r.xb + r.b * 1.55, .013, r.z + 1.25, .8, .6, 1, -Math.PI / 2, 0, r.b * Math.PI / 2, uv.Fesc);
      add(R.flr, 'plane', r.xa - r.b * 1.55, P.y + .013, r.z - 1.25, .8, .6, 1, -Math.PI / 2, 0, -r.b * Math.PI / 2, uv.Fesc);
    }

    /* ── 10) 月台：月台門貼紙、門號燈、半高月台門的門號箱、地下月台端牆的緊急出口燈 ── */
    const lamp = M('#5a1414', { r: .3, e: '#ff3020', ei: .35 });
    for (const P of L.platforms) {
      const full = P.under || P.line === 'BR', ox = P.x, oy = P.y, oz = P.z;
      const edges = [-K.LEN / 2, ...K.DOORS.flatMap(d => [d - .82, d + .82]), K.LEN / 2];
      for (const s of [-1, 1]) {
        const ry = s > 0 ? Math.PI : 0;
        for (let i = 0; i < edges.length; i += 2) { const mx = (edges[i] + edges[i + 1]) / 2; add(R.prn, 'plane', ox + mx, oy + (full ? 1.3 : 1.02), oz + s * (K.PSD - .032), .46, .17, 1, 0, ry, 0, uv.Ppsd); }
        K.DOORS.forEach((d, i) => {
          if (full) add(lamp, 'box', ox + d + .34, oy + 2.52, oz + s * (K.PSD - .17), .12, .06, .04);
          else {
            add(M('#30363c'), 'box', ox + d, oy + 1.59, oz + s * K.PSD, .58, .16, .16);
            add(R.lit, 'plane', ox + d - .06, oy + 1.59, oz + s * (K.PSD - .082), .3, .12, 1, 0, ry, 0, uv['num' + i]);
            add(lamp, 'box', ox + d + .19, oy + 1.59, oz + s * (K.PSD - .08), .07, .07, .02);
          }
        });
      }
      if (P.under) for (const ex of [-1, 1]) {
        const x = ox + ex * (K.LEN / 2 - .03), ry = ex > 0 ? -Math.PI / 2 : Math.PI / 2;
        add(M('#e8eaec', { r: .4 }), 'box', x, oy + 2.92, oz + 1.4, .06, .34, .96);
        add(R.lit, 'plane', ox + ex * (K.LEN / 2 - .062), oy + 2.92, oz + 1.4, .9, .3, 1, 0, ry, 0, uv.Lgreen);
      }
    }

    /* ── 11) 垃圾桶：一般垃圾＋資源回收（大廳、非付費區、每個月台） ── */
    {
      const lab = (txt, en, bg) => { const key = 'bin_' + txt; if (!binTex[key]) binTex[key] = M('#ffffff', { map: K.canvasTex(128, 96, x => { x.fillStyle = bg; x.fillRect(0, 0, 128, 96); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 30px "Noto Sans TC", sans-serif'; x.fillText(txt, 64, 44); x.font = '500 18px "Barlow Semi Condensed", sans-serif'; x.fillText(en, 64, 74); }), r: .5 }); return binTex[key]; };
      const steel = M('#9aa2a8', { r: .35, m: .7 }), dark = M('#3a3f44', { r: .5, m: .3 });
      const pair = (x, y, z, ry) => {   // 兩個並排的桶子：一般垃圾（灰）、資源回收（藍）
        const W = loc(x, z, ry);
        [[-.26, '#5a6066', '一般垃圾', 'Trash'], [.26, '#2a6fb8', '資源回收', 'Recycle']].forEach(([dx, c, t, en]) => {
          const [bx, bz] = W(dx, 0);
          add(steel, 'cyl', bx, y + .42, bz, .44, .84, .44);
          add(M(c, { r: .45 }), 'cyl', bx, y + .87, bz, .47, .07, .47);
          add(dark, 'cyl', bx, y + .91, bz, .2, .02, .2);
          const [lx, lz] = W(dx, .222); add(lab(t, en, c), 'plane', lx, y + .55, lz, .3, .22, 1, 0, ry, 0);
        });
      };
      let nb = 0;
      const tryHall = (x, z, ry) => {
        const side = Math.abs(Math.sin(ry)) > .5, a = side ? R2(x - .26, x + .26, z - .52, z + .52) : R2(x - .52, x + .52, z - .26, z + .26);
        if (!floorFree(a, .2)) return false;
        if (placed.some(o => o.bin && Math.hypot(o.cx - x, o.cz - z) < 9)) return false;
        pair(x, 0, z, ry); solid(x, z, side ? .52 : 1.04, side ? 1.04 : .52, 0, 'trash'); Object.assign(placed[placed.length - 1], { bin: true, cx: x, cz: z }); nb++; return true;
      };
      // 大廳（付費區）沿牆、非付費區沿牆，各找兩組
      const hallC = [], unpC = [];
      for (let z = C.z0 + 3; z < gz - 2; z += .7) { hallC.push([C.x0 + .3, z, Math.PI / 2]); hallC.push([C.x1 - .3, z, -Math.PI / 2]); }
      for (let x = C.x0 + 3; x < C.x1 - 3; x += .7) hallC.push([x, C.z0 + .3, 0]);
      for (let z = U.z0 + 1; z < U.z1 - 1; z += .7) { unpC.push([U.x0 + .3, z, Math.PI / 2]); unpC.push([U.x1 - .3, z, -Math.PI / 2]); }
      for (let x = U.x0 + 2; x < U.x1 - 2; x += .7) unpC.push([x, gz + .5, 0]);
      for (let x = U.x0 + 2; x < U.x1 - 2; x += .7) unpC.push([x, U.z1 - .32, Math.PI]);   // 出口端牆，出口之間
      for (const list of [hallC, unpC]) {
        for (let i = list.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [list[i], list[j]] = [list[j], list[i]]; }
        let k = 0; for (const c of list) { if (k >= 2) break; if (tryHall(...c)) k++; }
      }
      // 月台：中線上、柱子與座椅之間的空位（離月台門遠、不擋通道）
      for (const P of L.platforms) {
        let k = 0;
        for (const lx of [4.5, -4.5, 26, -26, 32, -32, 13, -13, 22, -22]) {   // 兩座電扶梯之間、月台兩端（避開電扶梯、柱子、電梯、座椅）
          if (k >= 2) break;
          const x = P.x + lx, z = P.z, a = R2(x - .55, x + .55, z - .3, z + .3);
          if (Math.abs(lx) > K.LEN / 2 - 1) continue;
          if ((L.obstacles || []).some(o => Math.abs((o.y || 0) - P.y) < .5 && hit(R2(a.x0 - .3, a.x1 + .3, a.z0 - .3, a.z1 + .3), o))) continue;
          if (P.ramps.some(r => x > Math.min(r.xa, r.xb) - 2.5 && x < Math.max(r.xa, r.xb) + 2.5)) continue;
          if (L.spots.some(sp => Math.abs((sp.y || 0) - P.y) < .5 && Math.hypot(sp.x - x, sp.z - z) < 1.6)) continue;
          pair(x, P.y, z, k % 2 ? Math.PI : 0); K.solid(x, z, 1.04, .52, P.y); placed.push({ ...a, y: P.y }); info.items.push(['trash', +x.toFixed(2), +z.toFixed(2)]); k++; nb++;
        }
      }
      info.bins = nb;
    }

    // 導盲磚（最後加，在同一個透明網格裡畫在其他地貼上面）
    for (const [k, x, z, rz, len] of tacTiles) add(R.flr, 'plane', x, .016, z, k === 'bar' ? len + .002 : .3, .3, 1, -Math.PI / 2, 0, rz, k === 'bar' ? uv.Fbar : uv.Fdot);

    const meshes = b.finish(g);
    L.metroprops = { meshes, parts: b.count, tactile: tacN, tiles: tacTiles.length, items: info.items, bins: info.bins };
  }
  return { build };
})();
