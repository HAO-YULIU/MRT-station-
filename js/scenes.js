/* 場景繪製：月台（SVG）與車廂內部（SVG＋窗外 Canvas）
 * 兩個場景都使用 1600×900 的座標系
 */
const W = 1600, H = 900;
const DOOR_X = [250, 650, 1050, 1450];   // 月台門／車門位置（列車停妥時）

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── 共用：站名牌（台北捷運樣式：白底、路線代碼方塊、中英站名） ── */
function codeBadge(lineId, code, x, y, s = 1) {
  const L = LINES[lineId];
  const m = code.match(/^([A-Z]+)(\d+[A-Z]?)$/);
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect x="0" y="0" width="56" height="56" rx="10" fill="#fff" stroke="${L.color}" stroke-width="5"/>
    <text x="28" y="24" text-anchor="middle" font-family="Barlow Semi Condensed, Noto Sans TC, sans-serif" font-weight="700" font-size="19" fill="#1c2126">${m[1]}</text>
    <text x="28" y="46" text-anchor="middle" font-family="Barlow Semi Condensed, Noto Sans TC, sans-serif" font-weight="700" font-size="20" fill="#1c2126">${m[2]}</text>
  </g>`;
}

function stationNameSign(stationId, lineId, x, y, w, h) {
  const lines = MRT.linesAt(stationId);
  const name = MRT.label(stationId, lineId);
  const badges = lines.map((l, i) => codeBadge(l.line, l.code, 18 + i * 62, (h - 56) / 2)).join('');
  const tx = 18 + lines.length * 62 + 14;
  const zhSize = name.zh.length > 5 ? 34 : 42;
  return `<g transform="translate(${x},${y})">
    <rect x="3" y="5" width="${w}" height="${h}" rx="6" fill="#000" opacity=".25"/>
    <rect width="${w}" height="${h}" rx="6" fill="#f8f8f6"/>
    <rect width="${w}" height="8" rx="3" fill="${LINES[lineId].color}"/>
    ${badges}
    <text x="${tx}" y="${h / 2 + 4}" font-family="Noto Sans TC, sans-serif" font-weight="900" font-size="${zhSize}" fill="#1c2126">${esc(name.zh)}</text>
    <text x="${tx}" y="${h / 2 + 32}" font-family="Barlow Semi Condensed, sans-serif" font-weight="600" font-size="20" fill="#3d454d">${esc(name.en)}</text>
  </g>`;
}

/* ── 列車側面（停妥時位置為世界座標） ── */
function trainSide(lineId) {
  const L = LINES[lineId];
  const doors = [-150, ...DOOR_X];
  const top = 262, bot = 600;
  // 車窗（門與門之間）
  let wins = '';
  for (let i = 0; i < doors.length - 1; i++) {
    const a = doors[i] + 68 + 34, b = doors[i + 1] - 68 - 34;
    const joint = a < 850 && b > 850;
    const segs = joint ? [[a, 830], [870, b]] : [[a, b]];
    for (const [sa, sb] of segs) {
      wins += `<rect x="${sa}" y="300" width="${sb - sa}" height="132" rx="12" fill="url(#winGrad)"/>
               <rect x="${sa + 6}" y="304" width="${sb - sa - 12}" height="8" rx="3" fill="#f3f1e6" opacity=".55"/>`;
      // 車內乘客剪影
      for (let k = sa + 40; k < sb - 30; k += 70 + ((k * 7) % 50)) {
        if ((k * 13) % 3 === 0) continue;
        wins += `<g fill="#20262c" opacity=".55"><circle cx="${k}" cy="352" r="13"/><path d="M${k - 26},432 Q${k - 24},372 ${k},370 Q${k + 24},372 ${k + 26},432 Z"/></g>`;
      }
    }
  }
  let doorEls = '';
  for (const d of doors) {
    doorEls += `<g class="tdoor">
      <rect x="${d - 72}" y="${top + 12}" width="144" height="${bot - top - 8}" fill="#1a1e22"/>
      <g class="tdoor-l"><rect x="${d - 68}" y="${top + 14}" width="68" height="${bot - top - 12}" fill="url(#doorGrad)" stroke="#8f989f" stroke-width="2"/>
        <rect x="${d - 58}" y="304" width="48" height="140" rx="8" fill="url(#winGrad)"/></g>
      <g class="tdoor-r"><rect x="${d}" y="${top + 14}" width="68" height="${bot - top - 12}" fill="url(#doorGrad)" stroke="#8f989f" stroke-width="2"/>
        <rect x="${d + 10}" y="304" width="48" height="140" rx="8" fill="url(#winGrad)"/></g>
      <circle class="door-lamp" cx="${d}" cy="${top + 4}" r="5" fill="#5a2a14"/>
    </g>`;
  }
  return `
    <path d="M-420,${top + 20} Q-420,${top} -400,${top} L1760,${top} Q1830,${top} 1872,${top + 70} L1900,${bot - 40} Q1904,${bot} 1870,${bot} L-420,${bot} Z" fill="url(#bodyGrad)"/>
    <rect x="-420" y="${top}" width="2190" height="10" fill="#b8bfc5"/>
    <rect x="-420" y="458" width="2300" height="22" fill="${L.color}"/>
    <rect x="-420" y="482" width="2300" height="4" fill="${L.color}" opacity=".45"/>
    <path d="M1790,${top + 14} Q1840,${top + 20} 1868,${top + 90} L1880,440 L1790,440 Z" fill="#1d2329"/>
    <rect x="1840" y="500" width="34" height="14" rx="4" fill="#fff6d0"/>
    <rect x="-420" y="${bot - 30}" width="2300" height="30" fill="#aeb5bb"/>
    <rect x="842" y="${top}" width="16" height="${bot - top}" fill="#3a3f44"/>
    ${wins}${doorEls}`;
}

/* ── 月台場景 ── */
const Platform = {
  build(stationId, lineId, dir) {
    const L = LINES[lineId];
    const ug = MRT.undergroundOn(stationId, lineId);
    const fullPSD = ug || lineId === 'BR';
    const sky = TaipeiTime.sky();
    const name = MRT.label(stationId, lineId);
    const term = dir ? MRT.label(dir.terminal, lineId) : null;
    const goesRight = dir ? dir.goesRight : true;

    const skyStops = {
      day: ['#9cc3e2', '#dbe9ef'], dusk: ['#3e4f7c', '#f0a273'],
      dawn: ['#4d5d7f', '#d1b0a6'], night: ['#08111f', '#22314a'],
    }[sky];
    const night = sky === 'night';

    // 背景：地下牆面 or 高架天空與城市
    let back;
    if (ug) {
      back = `<rect x="0" y="0" width="${W}" height="660" fill="url(#tile)"/>
        <rect x="0" y="560" width="${W}" height="100" fill="#2b2c2d"/>
        <rect x="0" y="596" width="${W}" height="6" fill="#6d6f71"/>
        ${[70, 880].map(x => `<g transform="translate(${x},176) scale(.72)">${stationNameSign(stationId, lineId, 0, 0, 620, 78)}</g>`).join('')}`;
    } else {
      let bld = '';
      let seed = stationId.length * 97 + stationId.charCodeAt(0);
      const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let x = -20; x < W; x += 50 + rnd() * 60) {
        const bw = 50 + rnd() * 70, bh = 90 + rnd() * 230;
        const c = night ? '#141c29' : sky === 'dusk' ? '#5a5670' : '#8d9cab';
        bld += `<rect x="${x}" y="${560 - bh}" width="${bw}" height="${bh}" fill="${c}"/>`;
        for (let wy = 560 - bh + 12; wy < 548; wy += 18) for (let wx = x + 8; wx < x + bw - 10; wx += 16) {
          if (rnd() < (night ? 0.45 : 0.2)) bld += `<rect x="${wx}" y="${wy}" width="7" height="9" fill="${night ? '#f6d48a' : '#c7d6e2'}" opacity="${night ? .85 : .6}"/>`;
        }
      }
      back = `<rect x="0" y="0" width="${W}" height="660" fill="url(#sky)"/>
        <path d="M0,420 Q160,330 330,380 T700,360 T1080,350 T1400,370 T1600,350 L1600,560 L0,560 Z" fill="${night ? '#0e1726' : '#7e95a6'}" opacity=".7"/>
        ${bld}
        <rect x="0" y="540" width="${W}" height="120" fill="${night ? '#1d2228' : '#6f747a'}"/>
        <rect x="0" y="590" width="${W}" height="8" fill="#9a9ea2"/>`;
    }

    // 月台門
    let psd = '';
    const gTop = fullPSD ? 160 : 474;
    for (let i = 0; i < DOOR_X.length; i++) {
      const d = DOOR_X[i];
      psd += `<g class="psd">
        <g class="psd-l"><rect x="${d - 70}" y="${gTop}" width="70" height="${640 - gTop}" fill="url(#glass)" stroke="#7b858e" stroke-width="4"/></g>
        <g class="psd-r"><rect x="${d}" y="${gTop}" width="70" height="${640 - gTop}" fill="url(#glass)" stroke="#7b858e" stroke-width="4"/></g>
        <rect x="${d - 76}" y="${gTop}" width="152" height="${640 - gTop}" fill="none" stroke="#454c53" stroke-width="8"/>
        ${fullPSD ? `<rect x="${d - 40}" y="${gTop - 36}" width="80" height="24" rx="4" fill="#111"/><text x="${d}" y="${gTop - 18}" text-anchor="middle" font-family="Barlow Semi Condensed" font-size="17" fill="#ffb347">${i + 1}-${(i % 4) + 1}</text>` : ''}
      </g>`;
    }
    // 固定面板
    let panels = '';
    const edges = [0, ...DOOR_X.flatMap(d => [d - 76, d + 76]), W];
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i], b = edges[i + 1];
      panels += `<rect x="${a}" y="${gTop}" width="${b - a}" height="${640 - gTop}" fill="url(#glass)" stroke="#545c64" stroke-width="5"/>`;
      if (b - a > 200) panels += `<line x1="${(a + b) / 2}" y1="${gTop}" x2="${(a + b) / 2}" y2="640" stroke="#545c64" stroke-width="5"/>`;
    }

    // 地面上的候車標線（門兩側綠色，中央留給下車旅客）
    let marks = '';
    for (const d of DOOR_X) {
      marks += `<path d="M${d - 150},680 L${d - 92},680 L${d - 118},752 L${d - 186},752 Z" fill="#2f9e5a" opacity=".85"/>
                <path d="M${d + 92},680 L${d + 150},680 L${d + 186},752 L${d + 118},752 Z" fill="#2f9e5a" opacity=".85"/>
                <path d="M${d - 22},690 L${d + 22},690 L${d},716 Z" fill="#f5c400" opacity=".9"/>`;
    }

    const arrow = goesRight ? 'M0,0 L26,0 L26,-10 L44,8 L26,26 L26,16 L0,16 Z' : 'M44,0 L18,0 L18,-10 L0,8 L18,26 L18,16 L44,16 Z';
    const dirSign = dir ? `
      <g transform="translate(940,22)">
        <rect width="620" height="78" rx="6" fill="#23272b"/>
        <rect x="16" y="13" width="52" height="52" rx="10" fill="${L.color}"/>
        <text x="42" y="48" text-anchor="middle" font-family="Barlow Semi Condensed" font-weight="700" font-size="${lineId.length > 1 ? 24 : 30}" fill="${L.text}">${lineId}</text>
        <text x="86" y="44" font-family="Noto Sans TC" font-weight="700" font-size="30" fill="#fff">往 ${esc(term.zh)}</text>
        <text x="88" y="68" font-family="Barlow Semi Condensed" font-size="18" fill="#c8cdd2">To ${esc(term.en)}</text>
        <path d="${arrow}" transform="translate(${goesRight ? 548 : 548},30)" fill="#fff"/>
      </g>` : '';

    const ceiling = ug ? `
      <rect x="0" y="0" width="${W}" height="112" fill="#3a3e43"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${i * 210 + 30}" y="10" width="140" height="6" rx="3" fill="#fffbe9" opacity=".9"/>`).join('')}
      <rect x="0" y="104" width="${W}" height="56" fill="#2c3035"/>
      <rect x="0" y="152" width="${W}" height="8" fill="${L.color}"/>`
      : `<path d="M0,0 L${W},0 L${W},70 L0,110 Z" fill="${night ? '#23282e' : '#4a5057'}"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${i * 280 + 60}" y="${78 - i * 6}" width="120" height="5" rx="2" fill="#fffbe9" opacity="${night ? .95 : .6}"/>`).join('')}
      ${fullPSD ? `<rect x="0" y="120" width="${W}" height="40" fill="#30353a"/><rect x="0" y="152" width="${W}" height="8" fill="${L.color}"/>` : ''}`;

    return `<svg class="scene-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="tile" width="80" height="40" patternUnits="userSpaceOnUse">
          <rect width="80" height="40" fill="#dcd8ce"/><path d="M0,0 H80 M0,0 V40 M40,0 V40" stroke="#cbc6ba" stroke-width="2"/>
        </pattern>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyStops[0]}"/><stop offset="1" stop-color="${skyStops[1]}"/></linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e6f2f7" stop-opacity=".22"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".08"/>
          <stop offset=".5" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".56" stop-color="#ffffff" stop-opacity=".06"/>
          <stop offset="1" stop-color="#d5e6ee" stop-opacity=".16"/>
        </linearGradient>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f4f6f7"/><stop offset=".6" stop-color="#dfe3e6"/><stop offset="1" stop-color="#c3c9ce"/>
        </linearGradient>
        <linearGradient id="doorGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef0f2"/><stop offset="1" stop-color="#c9ced3"/></linearGradient>
        <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d7f8c"/><stop offset="1" stop-color="#2d3a44"/></linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${ug ? '#c9c5bc' : '#a9a8a3'}"/><stop offset="1" stop-color="${ug ? '#8f8b83' : '#77777a'}"/>
        </linearGradient>
        <radialGradient id="heroShadow"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      ${back}
      <g id="train" style="visibility:hidden">${trainSide(lineId)}</g>
      ${panels}${psd}
      <rect x="0" y="636" width="${W}" height="${H - 636}" fill="url(#floor)"/>
      <rect x="0" y="636" width="${W}" height="10" fill="#6f7277"/>
      <rect x="0" y="652" width="${W}" height="20" fill="#e2b600"/>
      ${Array.from({ length: 80 }, (_, i) => `<circle cx="${i * 20 + 10}" cy="662" r="3" fill="#b88f00"/>`).join('')}
      ${marks}
      <path d="M0,800 L${W},800" stroke="#fff" stroke-opacity=".06" stroke-width="40"/>
      ${ceiling}
      <g transform="translate(40,22)">${stationNameSign(stationId, lineId, 0, 0, 620, 78)}</g>
      ${dirSign}
      <g id="hero" transform="translate(820,0)">
        <ellipse class="hero-shadow" cx="0" cy="930" rx="150" ry="22" fill="url(#heroShadow)"/>
        <g class="hero-body">${CharArt.svgImage(Game.state.char, 0, 935, 640)}</g>
      </g>
    </svg>`;
  },
};

/* ── 車廂內部 ── */
const Cabin = {
  build(lineId) {
    const L = LINES[lineId];
    const seatColor = lineId === 'BR' ? '#5a6b7b' : '#2f5d9e';
    // 窗戶（挖空，透出後方 canvas）
    const wins = [[90, 175, 530, 280], [990, 175, 530, 280]];
    const holes = wins.map(([x, y, w, h]) => `M${x + 26},${y} h${w - 52} a26,26 0 0 1 26,26 v${h - 52} a26,26 0 0 1 -26,26 h-${w - 52} a26,26 0 0 1 -26,-26 v-${h - 52} a26,26 0 0 1 26,-26 Z`).join(' ');
    const wall = `M0,0 H${W} V${H} H0 Z ${holes} M700,150 h200 v560 h-200 Z`;
    const leaf = (x, cls) => `<g class="${cls}">
      <path d="M${x},150 h100 v560 h-100 Z M${x + 18},190 h64 a10,10 0 0 1 10,10 v240 a10,10 0 0 1 -10,10 h-64 a10,10 0 0 1 -10,-10 v-240 a10,10 0 0 1 10,-10 Z" fill="url(#cDoor)" fill-rule="evenodd" stroke="#9aa2a9" stroke-width="2"/>
      <rect x="${x + 8}" y="478" width="84" height="14" rx="3" fill="${L.color}"/>
    </g>`;

    let straps = '';
    for (let x = 60; x < W; x += 105) {
      if (x > 640 && x < 960) continue;
      straps += `<g class="strap" style="transform-origin:${x}px 172px; animation-delay:${(x % 7) * -0.3}s">
        <rect x="${x - 3}" y="172" width="6" height="64" fill="#d9dcdf"/>
        <path d="M${x - 16},236 L${x + 16},236 L${x},268 Z" fill="none" stroke="#e8eaec" stroke-width="7" stroke-linejoin="round"/>
      </g>`;
    }
    let seats = '';
    for (const [x0, x1] of [[60, 650], [950, 1540]]) {
      const n = 7, sw = (x1 - x0) / n;
      for (let i = 0; i < n; i++) {
        const prio = (x0 < 700 && i === n - 1) || (x0 > 900 && i === 0);
        seats += `<path d="M${x0 + i * sw + 4},520 h${sw - 8} q6,0 6,8 v60 q0,10 -10,10 h${-(sw - 12)} q-10,0 -10,-10 v-60 q0,-8 6,-8 Z" fill="${prio ? '#24427a' : seatColor}"/>
                  <path d="M${x0 + i * sw + 10},528 h${sw - 20}" stroke="#fff" stroke-opacity=".18" stroke-width="3"/>`;
      }
      seats += `<rect x="${x0 - 6}" y="586" width="${x1 - x0 + 12}" height="22" rx="4" fill="#b9bec3"/>`;
    }

    return `<svg class="scene-svg cabin-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f2f0"/><stop offset=".55" stop-color="#e3e5e3"/><stop offset="1" stop-color="#c9ccca"/></linearGradient>
        <linearGradient id="cDoor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9dde0"/><stop offset="1" stop-color="#eef0f1"/></linearGradient>
        <linearGradient id="cFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e9397"/><stop offset="1" stop-color="#5d6266"/></linearGradient>
        <linearGradient id="pole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d959c"/><stop offset=".4" stop-color="#f4f6f7"/><stop offset="1" stop-color="#7f878e"/></linearGradient>
        <radialGradient id="heroShadow2"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      </defs>
      <g id="cabinShake">
        <path d="${wall}" fill="url(#cWall)" fill-rule="evenodd"/>
        ${wins.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="none" stroke="#b7bcc0" stroke-width="10"/>
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="#fff" opacity=".05"/>`).join('')}
        <rect x="0" y="0" width="${W}" height="70" fill="#f6f7f5"/>
        <rect x="80" y="26" width="560" height="14" rx="7" fill="#fffef4"/><rect x="960" y="26" width="560" height="14" rx="7" fill="#fffef4"/>
        <rect x="0" y="66" width="${W}" height="6" fill="#d4d7d9"/>
        <!-- 路線圖條 -->
        <g id="routeStrip" transform="translate(100,96)"></g>
        <!-- 廣告框 -->
        <g transform="translate(1000,96)">
          <rect width="510" height="64" rx="4" fill="#20262c"/>
          <text x="22" y="40" font-family="Noto Serif TC, serif" font-weight="900" font-size="26" fill="#d9e1e6">迷霧</text>
          <text x="92" y="38" font-family="Noto Sans TC" font-size="15" fill="#9fb0bc">每條路線的終點，都留著一件東西。</text>
        </g>
        ${leaf(700, 'cdoor-l')}${leaf(800, 'cdoor-r')}
        <rect x="694" y="144" width="212" height="572" fill="none" stroke="#9ea5ab" stroke-width="8"/>
        <!-- LCD 到站顯示器 -->
        <g id="lcd" transform="translate(680,76)">
          <rect width="240" height="64" rx="6" fill="#0b0d0f" stroke="#555c62" stroke-width="3"/>
          <rect x="6" y="6" width="228" height="16" rx="2" fill="${L.color}"/>
          <text id="lcdHead" x="14" y="19" font-family="Noto Sans TC" font-weight="700" font-size="12" fill="${L.text}">下一站 Next Station</text>
          <text id="lcdZh" x="120" y="45" text-anchor="middle" font-family="Noto Sans TC" font-weight="900" font-size="20" fill="#ffd36b"></text>
          <text id="lcdEn" x="120" y="59" text-anchor="middle" font-family="Barlow Semi Condensed" font-size="11" fill="#e8e2c9"></text>
        </g>
        ${seats}
        <rect x="0" y="608" width="${W}" height="${H - 608}" fill="url(#cFloor)"/>
        <path d="M0,700 L${W},700 M0,800 L${W},800" stroke="#000" stroke-opacity=".08" stroke-width="2"/>
        <rect x="0" y="164" width="${W}" height="10" rx="5" fill="url(#pole)"/>
        ${straps}
        <rect x="660" y="0" width="16" height="${H}" fill="url(#pole)"/>
        <rect x="924" y="0" width="16" height="${H}" fill="url(#pole)"/>
      </g>
      <g id="hero" transform="translate(800,0)">
        <ellipse class="hero-shadow" cx="0" cy="930" rx="150" ry="22" fill="url(#heroShadow2)"/>
        <g class="hero-body">${CharArt.svgImage(Game.state.char, 0, 935, 660)}</g>
      </g>
    </svg>`;
  },

  // 更新上方路線圖條
  routeStrip(lineId, list, currentIdx) {
    const L = LINES[lineId];
    const from = Math.max(0, currentIdx - 1), to = Math.min(list.length, from + 7);
    const shown = list.slice(from, to);
    const w = 510, step = shown.length > 1 ? (w - 60) / (shown.length - 1) : 0;
    let s = `<rect width="${w}" height="64" rx="4" fill="#fbfbfa"/><line x1="30" y1="22" x2="${w - 30}" y2="22" stroke="${L.color}" stroke-width="7" stroke-linecap="round"/>`;
    shown.forEach((id, i) => {
      const gi = from + i;
      const x = 30 + i * step;
      const passed = gi < currentIdx, cur = gi === currentIdx;
      s += `<circle cx="${x}" cy="22" r="${cur ? 9 : 6}" fill="${passed ? '#bbb' : cur ? L.color : '#fff'}" stroke="${passed ? '#999' : '#1c2126'}" stroke-width="2.5"/>`;
      s += `<text x="${x}" y="52" text-anchor="middle" font-family="Noto Sans TC" font-weight="${cur ? 900 : 500}" font-size="${MRT.label(id, lineId).zh.length > 4 ? 10 : 13}" fill="${passed ? '#999' : '#1c2126'}">${esc(MRT.label(id, lineId).zh)}</text>`;
    });
    return s;
  },
};

/* ── 窗外景色（Canvas） ── */
const Outside = {
  draw(ctx, pos, cfg, speed) {
    const { D } = cfg;
    const envAt = wx => ((wx < D / 2 ? cfg.depUg : cfg.arrUg) ? 'tunnel' : 'out');
    const bx = D / 2 - pos + 800;   // 隧道／地面交界的螢幕座標
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (cfg.depUg === cfg.arrUg) {
      cfg.depUg ? this.tunnel(ctx, pos, speed) : this.outdoor(ctx, pos, cfg, speed);
    } else {
      const leftEnv = envAt(pos - 800 + Math.min(Math.max(bx, 0), W) - 1);
      const clipDraw = (x0, x1, env) => {
        if (x1 <= x0) return;
        ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
        env === 'tunnel' ? this.tunnel(ctx, pos, speed) : this.outdoor(ctx, pos, cfg, speed);
        ctx.restore();
      };
      const b = Math.min(Math.max(bx, 0), W);
      clipDraw(0, b, cfg.depUg ? 'tunnel' : 'out');
      clipDraw(b, W, cfg.arrUg ? 'tunnel' : 'out');
      if (bx > -60 && bx < W + 60) { ctx.fillStyle = '#4d5156'; ctx.fillRect(bx - 30, 0, 60, H); ctx.fillStyle = '#2a2d30'; ctx.fillRect(bx - 4, 0, 8, H); }
      void leftEnv;
    }
    this.station(ctx, 0 - pos + 800, cfg.dep, cfg.depUg);
    this.station(ctx, D - pos + 800, cfg.arr, cfg.arrUg);
    ctx.restore();
  },

  tunnel(ctx, pos, speed) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b2d2f'); g.addColorStop(.5, '#141516'); g.addColorStop(1, '#1f2021');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 3;
    for (let x = -((pos) % 160); x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    // 電纜
    ctx.lineWidth = 4;
    for (const [y, c] of [[330, '#0a0a0a'], [344, '#090909'], [358, '#0c0c0c'], [372, '#0a0a0a']]) {
      ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y - 2); ctx.lineTo(W, y - 2); ctx.stroke(); ctx.lineWidth = 4;
    }
    // 隧道燈（高速時拉成光帶）
    const streak = 18 + speed * 160;
    ctx.save();
    ctx.shadowColor = '#ffe7b0'; ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff2d2';
    for (let x = -((pos) % 420) - 40; x < W + 200; x += 420) ctx.fillRect(x, 238, streak, 7);
    ctx.restore();
    // 緊急出口綠燈
    ctx.fillStyle = '#31d07a';
    for (let x = -((pos) % 2300); x < W; x += 2300) ctx.fillRect(x + 700, 420, 26, 12);
  },

  skyColors(sky) {
    return {
      day: ['#8fbbe0', '#d8e8f0', '#8197a8', '#93a2b0'],
      dusk: ['#3d4f7a', '#f2a273', '#4c4864', '#5e5a72'],
      dawn: ['#4a5a7a', '#cfa9a0', '#5b6680', '#6d7488'],
      night: ['#07101d', '#1e2b42', '#0f1828', '#151d2b'],
    }[sky];
  },

  outdoor(ctx, pos, cfg, speed) {
    const sky = cfg.sky, [s0, s1, mtn, bldC] = this.skyColors(sky), night = sky === 'night';
    const g = ctx.createLinearGradient(0, 120, 0, 520);
    g.addColorStop(0, s0); g.addColorStop(1, s1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 遠山
    ctx.fillStyle = mtn;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + pos * 0.04;
      ctx.lineTo(x, 330 - 40 * Math.sin(wx / 210) - 25 * Math.sin(wx / 83 + 1.3));
    }
    ctx.lineTo(W, H); ctx.fill();
    // 城市
    const par = 0.22, off = pos * par;
    const slot = 64;
    for (let i = Math.floor(off / slot) - 2; i < (off + W) / slot + 2; i++) {
      const r = n => { const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return v - Math.floor(v); };
      const bw = 44 + r(1) * 50, bh = 70 + r(2) * 220, x = i * slot - off;
      ctx.fillStyle = bldC; ctx.fillRect(x, 470 - bh, bw, bh + 60);
      ctx.fillStyle = night ? 'rgba(255,214,140,.85)' : 'rgba(210,225,236,.55)';
      for (let wy = 470 - bh + 10; wy < 460; wy += 16) for (let wx = 6; wx < bw - 8; wx += 13) {
        if (r(wx * 0.37 + wy * 0.11) < (night ? 0.4 : 0.25)) ctx.fillRect(x + wx, wy, 6, 8);
      }
    }
    // 霧氣
    const fog = ctx.createLinearGradient(0, 300, 0, 520);
    fog.addColorStop(0, 'rgba(220,228,232,0)'); fog.addColorStop(1, night ? 'rgba(80,96,116,.35)' : 'rgba(225,232,236,.45)');
    ctx.fillStyle = fog; ctx.fillRect(0, 300, W, 220);
    // 近景：電車線桿與護欄
    ctx.fillStyle = night ? '#1b1f24' : '#56606a';
    if (cfg.line !== 'BR') {
      for (let x = -((pos) % 640); x < W + 40; x += 640) {
        ctx.fillRect(x, 140, 12, 380);
        ctx.fillRect(x - 60, 160, 140, 7);
      }
      ctx.fillRect(0, 168, W, 2);
    }
    ctx.fillStyle = night ? '#2c3137' : '#9aa1a7';
    ctx.fillRect(0, 440, W, 120);
    ctx.fillStyle = night ? '#22262b' : '#7d858c';
    for (let x = -((pos) % 90); x < W; x += 90) ctx.fillRect(x, 440, 4, 120);
    if (speed > 0.4) {
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      ctx.fillRect(0, 440, W, 120);
    }
  },

  // 車站月台（從車窗看出去）
  station(ctx, cx, st, ug) {
    const half = 1500;
    if (cx + half < 0 || cx - half > W) return;
    const x0 = Math.max(0, cx - half), x1 = Math.min(W, cx + half);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
    if (ug) {
      ctx.fillStyle = '#e3dfd6'; ctx.fillRect(x0, 0, x1 - x0, H);
      ctx.strokeStyle = '#d2cdc2'; ctx.lineWidth = 2;
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
      ctx.fillStyle = '#fbf8ee'; ctx.fillRect(x0, 120, x1 - x0, 14);
      ctx.fillStyle = '#bdb8ae'; ctx.fillRect(x0, 430, x1 - x0, 300);
    } else {
      ctx.fillStyle = 'rgba(40,46,52,.92)'; ctx.fillRect(x0, 0, x1 - x0, 150);
      ctx.fillStyle = '#9a9a96'; ctx.fillRect(x0, 440, x1 - x0, 300);
      ctx.fillStyle = '#5e646a';
      for (let x = cx - half; x < cx + half; x += 520) ctx.fillRect(x, 150, 22, 300);
    }
    // 站名牌
    for (let k = -1; k <= 1; k++) this.sign(ctx, cx + k * 900, 230, st);
    // 月台上的乘客剪影
    ctx.fillStyle = 'rgba(40,44,50,.55)';
    for (let k = -6; k <= 6; k++) {
      if ((k * 7 + st.zh.length) % 3 === 0) continue;
      const px = cx + k * 210 + ((k * 37) % 60);
      ctx.beginPath(); ctx.arc(px, 330, 16, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - 30, 460); ctx.quadraticCurveTo(px - 28, 350, px, 348); ctx.quadraticCurveTo(px + 28, 350, px + 30, 460); ctx.fill();
    }
    // 月台門框
    if (ug) {
      ctx.fillStyle = '#3f464d';
      ctx.fillRect(x0, 140, x1 - x0, 40);
      ctx.fillStyle = st.color; ctx.fillRect(x0, 176, x1 - x0, 6);
      for (let x = cx - half; x < cx + half; x += 200) ctx.fillRect(x, 180, 0, 0);
      ctx.fillStyle = '#4a5157';
      for (let x = cx - half; x < cx + half; x += 200) ctx.fillRect(x, 180, 10, 300);
    }
    ctx.restore();
  },

  sign(ctx, cx, y, st) {
    const w = 380, h = 74, x = cx - w / 2;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = '#f8f8f6'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = st.color; ctx.fillRect(x, y, w, 7);
    ctx.strokeStyle = st.color; ctx.lineWidth = 4; ctx.strokeRect(x + 14, y + 16, 44, 44);
    ctx.fillStyle = '#1c2126'; ctx.textAlign = 'center';
    ctx.font = '700 15px "Barlow Semi Condensed", sans-serif';
    const m = st.code.match(/^([A-Z]+)(\d+[A-Z]?)$/);
    ctx.fillText(m[1], x + 36, y + 35); ctx.fillText(m[2], x + 36, y + 53);
    ctx.textAlign = 'left';
    ctx.font = `900 ${st.zh.length > 5 ? 24 : 30}px "Noto Sans TC", sans-serif`; ctx.fillText(st.zh, x + 72, y + 42);
    ctx.font = '600 15px "Barlow Semi Condensed", sans-serif'; ctx.fillStyle = '#3d454d'; ctx.fillText(st.en, x + 72, y + 63);
  },
};
