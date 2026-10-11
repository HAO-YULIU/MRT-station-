/* 主線：小碧潭的時空傳送裝置
 * 秀蔅其實是從未來來的人。她的傳送裝置壞掉了，六個零件散落在六條路線：
 *   水晶（文湖線）、羅盤（環狀線）、懷錶（中和新蘆線）、懸鏡（板南線）、石環（松山新店線）、星圖（淡水信義線）
 * 找到一件就可以先放上小碧潭月台的傳送裝置；六件都放好，秀蔅就能回到未來（並打開桃園機場捷運）。
 * 開場：玩家收到一份委託（委託人：秀蔅）。
 */
const TELE_PARTS = { BR: '能源核心', Y: '定位羅盤', O: '時間校準器', BL: '映像之門', G: '錨定環', R: '時空座標' };
const TELE_STATION = '小碧潭';

const Teleporter = (() => {
  const T = THREE;
  const S = () => Game.state;
  let group = null, dev = null, gems = {}, ring = null, beam = null;
  const slots = () => {
    const s = S(); s.flags.teleSlots = s.flags.teleSlots || {};
    // 舊存檔：以前是把六件寶物交給擺渡人，已經完成結局的人，六個槽都算放好了
    if (s.flags.mistLine && Object.keys(s.flags.teleSlots).length < 6) for (const l of Object.keys(MAIN_STORY)) s.flags.teleSlots[l] = s.flags.teleSlots[l] || 'legacy';
    return s.flags.teleSlots;
  };
  const placed = () => Object.keys(MAIN_STORY).filter(l => slots()[l]);
  const done = () => placed().length === Object.keys(MAIN_STORY).length;
  // 寶物數量：背包裡的＋已經放上去的
  const total = () => Object.keys(MAIN_STORY).filter(l => slots()[l] || S().inv['treasure_' + l] > 0).length;

  function spawn(stationId) {
    clear();
    if (stationId !== TELE_STATION || !World.layout) return;
    const L = World.layout, C = L.concourse;
    group = new T.Group(); World.scene.add(group);
    // 放在小碧潭大廳後面的「時空研究室」裡（讓玩家自己找；大廳與月台有指標）
    const cx = L.lab ? L.lab.x : C.x0 + 4, cz = L.lab ? L.lab.z : C.z0 + 13;
    const y = 0;
    // 指標：大廳中央、月台、閘門內側
    const arrow = (text, sub, x, yy, z, rot) => {
      const c2 = document.createElement('canvas'); c2.width = 1024; c2.height = 256; const g2 = c2.getContext('2d');
      g2.fillStyle = '#0a1420'; g2.fillRect(0, 0, 1024, 256); g2.fillStyle = '#4ab0ff'; g2.fillRect(0, 0, 1024, 14);
      g2.fillStyle = '#9fe0ff'; g2.font = '900 84px "Noto Sans TC", sans-serif'; g2.fillText(text, 40, 130); g2.font = '600 40px sans-serif'; g2.fillStyle = '#6a8aa8'; g2.fillText(sub, 44, 200);
      const t2 = new T.CanvasTexture(c2); t2.colorSpace = T.SRGBColorSpace;
      const m = new T.Mesh(new T.PlaneGeometry(2.6, .65), new T.MeshBasicMaterial({ map: t2, side: T.DoubleSide })); m.position.set(x, yy, z); m.rotation.y = rot || 0; group.add(m);
    };
    arrow('⌛ 時空研究室 ←', 'Temporal Lab', C.x0 + 6, 3.2, cz, Math.PI / 2);
    arrow('⌛ 時空研究室 ↑', '往大廳 · To concourse', L.platforms[0].x + 4, L.platforms[0].y + 2.9, L.platforms[0].z + .05, 0);
    arrow('⌛ 時空研究室', '進閘門後往左 · Inside fare gates, turn left', -6, 3.2, L.gateZ - 2, 0);
    dev = { x: cx, y, z: cz };
    // 底座
    const baseM = new T.MeshStandardMaterial({ color: '#2c3440', roughness: .35, metalness: .7 });
    const base = new T.Mesh(new T.CylinderGeometry(1.5, 1.7, .25, 36), baseM); base.position.set(cx, y + .125, cz); group.add(base);
    const top = new T.Mesh(new T.CylinderGeometry(1.35, 1.35, .04, 36), new T.MeshStandardMaterial({ color: '#9fe0ff', emissive: '#4ab0ff', emissiveIntensity: .35, roughness: .2 })); top.position.set(cx, y + .27, cz); group.add(top);
    // 拱環
    ring = new T.Mesh(new T.TorusGeometry(1.25, .08, 12, 64), new T.MeshStandardMaterial({ color: '#c8d0dc', metalness: .9, roughness: .2, emissive: '#6ac8ff', emissiveIntensity: .2 }));
    ring.position.set(cx, y + 1.65, cz); ring.rotation.y = Math.PI / 2; group.add(ring);   // 正面朝門口
    const inner = new T.Mesh(new T.CircleGeometry(1.15, 48), new T.MeshBasicMaterial({ color: '#8fd8ff', transparent: true, opacity: .0, side: T.DoubleSide, depthWrite: false }));
    inner.position.copy(ring.position); inner.rotation.y = Math.PI / 2; group.add(inner); ring.userData.inner = inner;
    // 六個槽，繞著底座
    const lines = Object.keys(MAIN_STORY);
    lines.forEach((l, i) => {
      const a = i / lines.length * Math.PI * 2, px = cx + Math.cos(a) * 1.15, pz = cz + Math.sin(a) * 1.15;
      const ped = new T.Mesh(new T.CylinderGeometry(.14, .18, .6, 12), baseM); ped.position.set(px, y + .55, pz); group.add(ped);
      const col = LINES[l].color;
      const gem = new T.Mesh(new T.OctahedronGeometry(.16), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2, roughness: .2 }));
      gem.position.set(px, y + 1.02, pz); gem.visible = !!slots()[l]; group.add(gem); gems[l] = gem;
      const sock = new T.Mesh(new T.TorusGeometry(.12, .025, 6, 18), new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .4 })); sock.rotation.x = Math.PI / 2; sock.position.set(px, y + .86, pz); group.add(sock);
    });
    beam = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 8, 32, 1, true), new T.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false }));
    beam.position.set(cx, y + 4, cz); group.add(beam);
    // 告示
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#10161c'; g.fillRect(0, 0, 512, 128); g.fillStyle = '#9fe0ff'; g.font = '900 52px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.fillText('時空傳送裝置', 256, 66); g.font = '600 26px sans-serif'; g.fillStyle = '#7a8a9a'; g.fillText('TEMPORAL GATE · 2087', 256, 106);
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace;
    const sign = new T.Mesh(new T.PlaneGeometry(2, .5), new T.MeshBasicMaterial({ map: tx, side: T.DoubleSide })); sign.position.set(cx, y + 3.05, cz); group.add(sign);
    (L.obstacles = L.obstacles || []).push({ x0: cx - 1.5, x1: cx + 1.5, z0: cz - 1.5, z1: cz + 1.5, y });
    refresh();
  }
  function clear() { if (group) World.scene.remove(group); group = null; dev = null; gems = {}; ring = null; beam = null; }
  function refresh() {
    if (!ring) return;
    const n = placed().length;
    ring.material.emissiveIntensity = .2 + n * .25;
    ring.userData.inner.material.opacity = done() ? .55 : n * .05;
    for (const l in gems) gems[l].visible = !!slots()[l];
  }
  function tick(dt, now) {
    if (!group) return;
    group.visible = !World.riding;
    const t = now / 1000;
    for (const l in gems) { gems[l].rotation.y = t * 1.4; gems[l].position.y = dev.y + 1.02 + Math.sin(t * 2 + l.length) * .04; }
    if (ring) ring.rotation.z = t * (.2 + placed().length * .15);
    if (beam) beam.material.opacity = done() ? .18 + Math.sin(t * 3) * .06 : 0;
  }
  const near = p => dev && Math.abs(p.y - dev.y) < .8 && Math.hypot(p.x - dev.x, p.z - dev.z) < 2.6;
  const interaction = {
    id: 'teleporter', get label() { return done() ? '查看傳送裝置' : '傳送裝置：放上寶物'; },
    when: p => !Dialog.with && near(p),
    run: () => menu(),
  };
  function menu() {
    const s = S(), lines = Object.keys(MAIN_STORY);
    const holding = lines.filter(l => !slots()[l] && s.inv['treasure_' + l] > 0);
    const rows = lines.map(l => `${slots()[l] ? '✅' : s.inv['treasure_' + l] > 0 ? '🟡' : '⬜'} ${ITEMS['treasure_' + l].icon} ${ITEMS['treasure_' + l].name}（${TELE_PARTS[l]}・${LINES[l].zh}）`).join('<br>');
    if (done()) return Dialog.show({ name: '時空傳送裝置', role: '已啟動' }, `六個零件都在發光。<br>${rows}`, [{ label: '關閉', run: () => Dialog.close() }]);
    Dialog.show({ name: '時空傳送裝置', role: `已放上 ${placed().length} / 6` }, `圓環上有六個凹槽，每一個都刻著一個符號。<br>${rows}<br><small>（找到一件就可以先放一件，不用一次收齊。）</small>`,
      holding.map(l => ({ label: `放上 ${ITEMS['treasure_' + l].icon} ${ITEMS['treasure_' + l].name}`, primary: true, run: () => place(l) })).concat(holding.length > 1 ? [{ label: '全部放上去', primary: true, run: () => { for (const l of holding) place(l, true); afterPlace(); } }] : [], [{ label: '離開', run: () => Dialog.close() }]));
  }
  function place(l, batch) {
    const s = S();
    if (!(s.inv['treasure_' + l] > 0) || slots()[l]) return;
    s.inv['treasure_' + l]--; slots()[l] = TaipeiTime.date(); saveState(); updateHud();
    Sound.itemGet(); refresh();
    toast(`<b>${ITEMS['treasure_' + l].icon} ${ITEMS['treasure_' + l].name} 放上去了</b><span>${TELE_PARTS[l]}亮了起來（${placed().length} / 6）</span>`, 'level');
    if (!batch) afterPlace();
  }
  function afterPlace() {
    Dialog.close();
    if (!Quests.isActive('final') && !Quests.isDone('final')) Quests.accept('final');
    if (done()) setTimeout(finale, 900);
  }
  // 六件都放好：秀蔅回到未來
  function finale() {
    const s = S();
    if (s.flags.mistLine) return;
    s.flags.mistLine = true; s.flags.xiuyuHome = TaipeiTime.date();
    MRT.openAirport();
    Quests.emit({ kind: 'handin' });
    saveState(); updateHud(); refresh();
    const nTrue = Object.values(s.story || {}).filter(x => x.ending === 'true').length;
    const ov = $('#itemOverlay');
    const pages = [
      { h: '時空傳送裝置，啟動', t: '六個零件同時亮起來。圓環開始轉動，越轉越快，月台上的風往同一個方向吹。<br>圓環中間，慢慢出現了一片發光的霧。' },
      { h: '秀蔅', t: `秀蔅從霧裡走出來，提著那盞燈。「${s.char === 'aiyun' ? '愛紜' : '軒宇'}，謝謝你。」<br>「我來自 2087 年。那一年，台北的捷運已經長到了山的另一邊。我在測試這台裝置的時候，被捲進了 00:30 的霧裡，零件散落在六條路線上……」<br>「如果沒有你，我會一直在這座城市裡繞圈子。」` },
      { h: '再見', t: `${nTrue === 6 ? '「六條路線的真相，你一個都沒有錯過。未來的台北，會記得你的名字。」' : nTrue >= 3 ? `「你看清了 ${nTrue} 個真相。剩下的，霧還替你留著。」` : '「有些真相，你還沒看清楚。不過沒關係，路還很長。」'}<br>她走進光裡，回頭笑了一下。「在未來的月台上，等你。」<br>光散了。裝置安靜下來——可是路網圖上，多了一條往西延伸的新路線：<b>桃園機場捷運</b>。` },
    ];
    let i = 0;
    const show = () => {
      const p = pages[i];
      ov.innerHTML = `<div class="item-card" style="--c:#4ab0ff" role="dialog" aria-modal="true" aria-labelledby="teleH">
        <div class="item-line">小碧潭・時空傳送裝置　${i + 1} / ${pages.length}</div>
        <div class="item-icon" style="font-size:72px">${['🌀', '🏮', '✨'][i]}</div>
        <h2 id="teleH">${p.h}</h2><p>${p.t}</p>
        <button class="btn primary" id="teleOk">${i < pages.length - 1 ? '繼續' : '打開路網圖看看'}</button></div>`;
      ov.hidden = false;
      $('#teleOk').onclick = () => { i++; if (i < pages.length) show(); else { ov.hidden = true; openMap(); Map3D.focusLine('A'); } };
      $('#teleOk').focus();
    };
    Sound.fog && Sound.fog('good');
    show();
  }

  /* ── 開場：一份委託 ── */
  function prologue() {
    return new Promise(res => {
      const s = S(), me = s.char === 'aiyun' ? '愛紜' : '軒宇';
      const pages = [
        { icon: '📨', h: '一份委託', t: `${me}的手機震了一下。是一封委託信，寄件人欄位是空白的。<br><div class="letter">委託人：秀蔅<br>委託內容：<b>請幫我回家。</b><br>地點：台北捷運全線<br>報酬：一個還沒發生的未來<br><small>※ 我在南港展覽館的大廳等你。</small></div>` },
        { icon: '🕰️', h: '來自未來的人', t: '「我叫秀蔅。說出來你可能不相信——我是從 2087 年來的。」<br>「我在測試一台時空傳送裝置，被捲進了 00:30 的霧裡。裝置的六個零件散落在台北捷運的六條路線：<b>水晶、羅盤、懷錶、懸鏡、石環、星圖</b>。」' },
        { icon: '🌀', h: '小碧潭的傳送裝置', t: '「裝置本體在<b>小碧潭</b>的月台上。每找到一個零件，就帶去放上去——不用一次收齊。」<br>「六個都放好，我就能回去了。」<br>她把一盞小燈放在你手心：「拜託你了。」' },
      ];
      let i = 0;
      const ov = $('#itemOverlay');
      const show = () => {
        const p = pages[i];
        ov.innerHTML = `<div class="item-card prologue" style="--c:#8fd8ff" role="dialog" aria-modal="true" aria-labelledby="proH">
          <div class="item-line">序章　${i + 1} / ${pages.length}</div>
          <div class="item-icon" style="font-size:72px">${p.icon}</div>
          <h2 id="proH">${p.h}</h2><div class="pro-text">${p.t}</div>
          <button class="btn primary" id="proOk">${i < pages.length - 1 ? '繼續' : '接下委託'}</button></div>`;
        ov.hidden = false;
        $('#proOk').onclick = () => { i++; if (i < pages.length) show(); else { ov.hidden = true; s.flags.prologue = true; saveState(); res(); } };
        $('#proOk').focus();
      };
      show();
    });
  }
  return { spawn, clear, tick, interaction, menu, placed, total, done, prologue, finale };
})();
