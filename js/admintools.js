/* 管理員工具（只有 admins 表裡的帳號看得到「🛠 管理員」選單）
 * 這些都只改「自己這台裝置的存檔」，是單人遊戲裡的測試工具；別人的資料、排行榜、公告都在大廳的管理頁處理，
 * 而且由資料庫權限保護（不是管理員就讀不到也寫不了）。管理員帳號不會出現在排行榜上。
 */
const AdminTools = (() => {
  let el = null, coordOn = false, coordEl = null, coordTimer = 0;
  const $q = s => el.querySelector(s);
  const opts = (list, sel) => list.map(([v, t]) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(t)}</option>`).join('');
  function showButton() { const b = document.getElementById('btnAdmin'); if (b) b.hidden = false; }
  document.addEventListener('mist-admin', showButton);

  function questRows() {
    const act = Game.state.quests.active || {};
    const ids = Object.keys(act).filter(id => QUESTS[id]);
    if (!ids.length) return '<p class="set-note">目前沒有進行中的任務。</p>';
    return ids.map(id => { const q = QUESTS[id], st = act[id], n = (q.steps || []).length;
      return `<div class="adm-q"><span><b>${esc(q.title)}</b><small>第 ${st.step + 1} / ${n} 步・${esc(id)}</small></span>
        <button class="btn small ghost" data-qs="${esc(id)}" data-d="-1">◀</button><button class="btn small ghost" data-qs="${esc(id)}" data-d="1">▶</button></div>`; }).join('');
  }
  function html() {
    const s = Game.state, t = TaipeiTime.now(), pad = n => String(n).padStart(2, '0');
    const stations = Object.keys(STATIONS).map(id => [id, `${id}${s.visited[id] ? '' : '（沒去過）'}`]);
    const items = Object.keys(ITEMS).map(id => [id, `${ITEMS[id].icon || ''} ${ITEMS[id].name}`]);
    const quests = Object.keys(QUESTS).filter(id => !(s.quests.active || {})[id]).map(id => [id, `${QUESTS[id].title}（${QUESTS[id].type}）`]);
    const tales = (FogEvents.ORDER || []).map((k, i) => { const tl = FogEvents.taleOf(k, { station: '某站', rnd: Math.random, L: {} }) || {}; return [k, `No.${String(i + 1).padStart(3, '0')} ${tl.name || k}`]; });
    return `<div class="modal-card wide-ish" role="dialog" aria-modal="true"><header><h3>🛠 管理員工具</h3><span>只會改這台裝置的存檔</span><button class="btn small ghost" data-x style="margin-left:auto">關閉</button></header><div class="set-body adm-tools">
      <section><h4>⏰ 遊戲時間</h4><p class="set-note">現在：${pad(t.month)}/${pad(t.day)} ${pad(t.hour)}:${pad(t.minute)}${TaipeiTime.shifted() ? '（已調整）' : '（真實時間）'}</p>
        <div class="adm-line"><input type="time" id="admTime" value="${pad(t.hour)}:${pad(t.minute)}"><input id="admDate" placeholder="月-日（可不填）" value="" style="width:9em"><button class="btn small primary" data-time>套用</button><button class="btn small ghost" data-time-reset>回到真實時間</button></div>
        <div class="adm-line">${[['02:00', '', '迷霧時刻'], ['08:00', '', '早上'], ['14:00', '', '尖峰（1 分鐘一班）'], ['00:20', '', '末班車前'], ['20:00', '10-31', '萬聖節晚上']].map(([h, d, n]) => `<button class="btn small ghost" data-preset="${h}|${d}">${n}</button>`).join('')}</div></section>
      <section><h4>🚇 傳送</h4><div class="adm-line"><select id="admSt">${opts(stations, s.current)}</select><button class="btn small primary" data-go>前往</button></div></section>
      <section><h4>💰 錢、黃金、經驗、道具</h4>
        <div class="adm-line"><input type="number" id="admMoney" placeholder="NT$" style="width:7em"><input type="number" id="admGold" placeholder="黃金" style="width:6em"><input type="number" id="admXp" placeholder="經驗" style="width:7em"><button class="btn small primary" data-give>加上去</button></div>
        <div class="adm-line"><select id="admItem">${opts(items)}</select><input type="number" id="admItemN" value="1" min="1" style="width:4em"><button class="btn small primary" data-item>給我</button></div></section>
      <section><h4>🔓 解鎖</h4><div class="adm-line"><button class="btn small ghost" data-unlock="airport">機場線</button><button class="btn small ghost" data-unlock="visited">所有車站都去過</button></div></section>
      <section><h4>📋 任務</h4>${questRows()}<div class="adm-line"><select id="admQuest">${opts(quests)}</select><button class="btn small primary" data-qa>接這個任務</button></div></section>
      <section><h4>🌫 霧夜短篇</h4><div class="adm-line"><select id="admTale">${opts(tales)}</select><button class="btn small primary" data-tale>看開場和結局</button></div></section>
      <section><h4>🐞 除錯</h4><div class="adm-line"><button class="btn small ghost" data-coord>${coordOn ? '關閉' : '顯示'}座標</button><button class="btn small ghost" data-save>立刻存檔並上傳</button></div></section>
    </div></div>`;
  }
  function render() { el.innerHTML = html(); }
  function open() {
    if (!el) {
      el = document.createElement('div'); el.className = 'modal'; el.id = 'adminModal'; el.style.zIndex = 30; document.body.appendChild(el);
      el.addEventListener('keydown', e => e.stopPropagation());
      el.addEventListener('click', onClick);
    }
    render(); el.hidden = false;
  }
  const close = () => { if (el) el.hidden = true; };
  function onClick(e) {
    const b = e.target.closest('button'); if (!b) { if (e.target === el) close(); return; }
    const s = Game.state;
    if (b.dataset.x !== undefined) return close();
    if (b.dataset.time !== undefined || b.dataset.preset !== undefined) {
      const [tm, dt] = b.dataset.preset ? b.dataset.preset.split('|') : [$q('#admTime').value, $q('#admDate').value.trim()];
      const [h, m] = tm.split(':').map(Number), md = /^(\d{1,2})-(\d{1,2})$/.exec(dt || '');
      if (isNaN(h)) return;
      TaipeiTime.setClock(h, m || 0, md ? +md[1] : 0, md ? +md[2] : 0);
      close(); Game.adminGo(s.current); toast(`<b>🛠 時間調到 ${tm}${md ? `（${dt}）` : ''}</b><span>這一站已經重新載入</span>`); return;
    }
    if (b.dataset.timeReset !== undefined) { TaipeiTime.resetClock(); close(); Game.adminGo(s.current); toast('<b>🛠 回到真實時間</b>'); return; }
    if (b.dataset.go !== undefined) { const id = $q('#admSt').value; close(); Game.adminGo(id); return; }
    if (b.dataset.give !== undefined) {
      const m = +$q('#admMoney').value || 0, g = +$q('#admGold').value || 0, x = +$q('#admXp').value || 0;
      s.money += m; s.gold = (s.gold || 0) + g; s.xp = Math.max(0, (s.xp || 0) + x); saveState(); updateHud(); toast(`<b>🛠 已調整</b><span>NT$ ${m >= 0 ? '+' : ''}${m}・黃金 ${g >= 0 ? '+' : ''}${g}・經驗 ${x >= 0 ? '+' : ''}${x}</span>`); return render();
    }
    if (b.dataset.item !== undefined) { const id = $q('#admItem').value, n = Math.max(1, +$q('#admItemN').value || 1); s.inv[id] = (s.inv[id] || 0) + n; saveState(); updateHud(); toast(`<b>🛠 ${esc(ITEMS[id].name)} ×${n}</b>`); return; }
    if (b.dataset.unlock === 'airport') { s.flags.mistLine = 1; MRT.openAirport(); saveState(); toast('<b>🛠 機場線已解鎖</b>'); return render(); }
    if (b.dataset.unlock === 'visited') { for (const id of Object.keys(STATIONS)) s.visited[id] = true; saveState(); toast('<b>🛠 所有車站都標成去過了</b>'); return render(); }
    if (b.dataset.qs) {
      const st = Quests.state(b.dataset.qs), q = QUESTS[b.dataset.qs]; if (!st || !q) return;
      st.step = Math.min((q.steps || []).length - 1, Math.max(0, st.step + (+b.dataset.d))); saveState(); updateHud(); return render();
    }
    if (b.dataset.qa !== undefined) { const id = $q('#admQuest').value; const ok = Quests.accept(id); toast(ok ? `<b>🛠 接了：${esc(QUESTS[id].title)}</b>` : '<b>這個任務現在不能接</b><span>可能是前置任務還沒完成、或時間地點不對</span>', ok ? '' : 'warn'); return render(); }
    if (b.dataset.tale !== undefined) {
      const k = $q('#admTale').value, t = FogEvents.taleOf(k, { station: Game.state.current, rnd: Math.random, L: World.layout || {} }) || {};
      const end = t.end && typeof t.end === 'object' ? Object.entries(t.end).map(([r, x]) => `<p><b>${{ perfect: '完美結局', good: '結局', bad: '苦澀的結局' }[r] || r}</b><br>${x}</p>`).join('') : `<p>${t.end || ''}</p>`;
      close();
      Dialog.show({ name: `《${t.name || k}》`, role: `霧夜短篇 No.${FogEvents.taleNo(k)}` }, `${t.intro || ''}${t.fail ? `<p><b>沒有走完</b><br>${t.fail}</p>` : ''}${end}`, [{ label: '關閉', primary: true, run: () => Dialog.close() }]);
      return;
    }
    if (b.dataset.coord !== undefined) { coordOn = !coordOn; coords(); return render(); }
    if (b.dataset.save !== undefined) { saveState(); if (typeof Cloud !== 'undefined') Cloud.push(true); return; }
  }
  // 座標：左下角顯示位置、區域、車站、fps（截圖回報問題用）
  function coords() {
    clearInterval(coordTimer);
    if (!coordOn) { if (coordEl) coordEl.hidden = true; return; }
    if (!coordEl) { coordEl = document.createElement('div'); coordEl.className = 'adm-coord'; document.body.appendChild(coordEl); }
    coordEl.hidden = false;
    let frames = 0, last = performance.now();
    const count = () => { frames++; if (coordOn) requestAnimationFrame(count); }; requestAnimationFrame(count);
    coordTimer = setInterval(() => {
      const p = World.player, z = World.zone(), now = performance.now(), fps = Math.round(frames * 1000 / (now - last)); frames = 0; last = now;
      coordEl.textContent = `${Game.state.current}｜x ${p.x.toFixed(2)} y ${p.y.toFixed(2)} z ${p.z.toFixed(2)}｜${z.kind}${z.P ? ' ' + z.P.line : ''}｜${fps} fps｜${TaipeiTime.clock()}`;
    }, 300);
  }
  return { open, close, showButton };
})();
