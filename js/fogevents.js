/* 迷霧之城：各車站的事件
 * 八大類（車站數）：NPC 特殊遭遇 20、站內解謎 12、生存與危險 15、救援與選擇 15、隱藏收藏 10、特殊挑戰 15、隱藏任務 12、列車事件 10
 * （迷霧列車 5 站與四個特殊事件在 fogspecial.js）
 * 每個事件用「引擎＋資料」寫成：story（人物與選擇）、puzzle（解謎）、survive（生存）、collect（收藏）、hidden（隱藏條件）、trainev（停著的列車）
 */
const FogEvents = (() => {
  const REG = {};          // key → { cat, run(K) }
  const S = () => Game.state;
  const bye = [{ label: '……', run: () => Dialog.close() }];
  const shuffle = (a, rnd = Math.random) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // 位置：c 大廳、u 非付費區、p 月台、pend 月台盡頭、spot:種類（設施旁邊）、train 停著的列車裡
  function at(K, where = 'c') {
    const L = K.L;
    if (where === 'c') return K.pointIn({ kind: 'concourse' }, K.rnd);
    if (where === 'u') return K.pointIn({ kind: 'unpaid' }, K.rnd);
    if (where === 'p') return K.pointIn({ kind: 'platform' }, K.rnd);
    if (where === 'pend') { const P = L.platforms[(K.rnd() * L.platforms.length) | 0], ex = K.rnd() < .5 ? -1 : 1; return { x: P.x + ex * 30.5, y: P.y, z: P.z + (K.rnd() - .5) * 2 }; }
    if (where === 'train' && K.train) { const tr = K.train, tx = tr.P.x + tr.x, tz = tr.P.z + tr.side * Station3D.TRACK; return { x: tx + (K.rnd() - .5) * 54, y: tr.P.y, z: tz + (K.rnd() - .5) * 1.2 }; }
    if (where.startsWith('spot:')) {
      const sp = L.spots.filter(s => s.kind === where.slice(5)); const s = sp[(K.rnd() * sp.length) | 0];
      if (s) { for (const [dx, dz] of [[0, 1], [1, 0], [-1, 0], [0, -1], [0, 1.6]]) { const h = World.groundAt(s.x + dx, s.z + dz, s.y); if (h != null) return { x: s.x + dx, y: h, z: s.z + dz }; } return { x: s.x, y: s.y, z: s.z }; }
    }
    return K.pointIn({ kind: 'concourse' }, K.rnd);
  }
  const once = (K, k) => { if (K.ev[k]) return false; K.ev[k] = 1; saveState(); return true; };

  /* ════════ 引擎：人物與選擇（NPC 特殊遭遇、救援與選擇） ════════ */
  function story(K, d) {
    const ev = K.ev; ev.found = ev.found || {}; ev.t = ev.t || 0;
    const people = (d.npcs || [d.npc]).map((n, i) => {
      const pos = at(K, n.at || 'c');
      const lk = n.self ? null : K.look(n.look || {});
      const nn = n.self ? selfPerson(K, pos) : K.person(lk, pos, { name: n.name, role: n.role || '？？？', behavior: n.behavior || 'idle', speed: n.speed ?? .8, sit: n.behavior === 'sit', ghostly: n.ghostly, hidden: n.hidden });
      nn.name = n.name; nn.role = n.role || '？？？'; nn.def = n; nn.data.key = true; nn.idx = i;
      if (n.behavior === 'wall') nn.face = 0;
      return nn;
    });
    const found = () => Object.keys(ev.found).length;
    (d.clues || []).forEach((c, i) => {
      if (ev.found[i]) return;
      const p = K.prop(c.kind || 'note', at(K, c.at || 'c'), { label: c.label || '調查', hidden: c.hidden, tag: 'clue', use: () => {
        ev.found[i] = 1; saveState(); K.removeProp(p);
        K.say({ name: c.title || '線索', role: '迷霧之城' }, c.text, [{ label: '記下來', run: () => { Dialog.close(); K.clue(c.note || c.title || c.text.replace(/<[^>]+>/g, '').slice(0, 30)); c.onFind && c.onFind(K, people); } }]);
      } });
    });
    const need = d.need ?? (d.clues || []).length;
    function resolve(o, npc) {
      if (ev.resolved) return; ev.resolved = o.result; K.choice(o.id || o.label); saveState();
      if (o.hurt) K.hurt(o.hurt, o.why || '霧裡有什麼東西撲了過來');
      K.say(npc, o.text, [{ label: o.ok || '……', run: () => {
        Dialog.close();
        if (o.vanish !== false && d.vanish) { K.removeNpc(npc); }
        if (o.hostile) { npc.behavior = 'stalk'; npc.hostile = { dmg: o.hostile, why: `被${npc.name}攻擊`, range: 8 }; npc.speed = 1.6; }
        K.done(o.result, { gold: o.gold, items: o.items, title: d.title, text: o.doneText, col: o.col });
        o.after && o.after(K, npc);
      } }]);
    }
    function decide(npc) {
      const f = d.final;
      const opts = (typeof f.options === 'function' ? f.options(K) : f.options);
      K.say(npc, typeof f.text === 'function' ? f.text(K) : f.text, opts.map(o => ({ label: o.label, primary: !!o.primary, run: () => resolve(o, npc) })).concat(d.final.noLeave ? [] : [{ label: '再想想', run: () => Dialog.close() }]));
    }
    for (const npc of people) {
      const n = npc.def;
      npc.talk = () => {
        if (ev.resolved) return K.say(npc, n.after || d.after || '……', bye);
        if (n.ignore && found() < (n.ignore === true ? 1 : n.ignore)) return K.say(npc, n.ignoreText || '他好像完全看不見你，視線直直穿過你的身體。', bye);
        if (n.final !== false && (n.decides || (npc.idx === 0 && !d.npcs)) && found() >= need) return decide(npc);
        const first = !ev['met' + npc.idx]; ev['met' + npc.idx] = 1;
        const lines = n.lines || [];
        let text = first && n.intro ? (typeof n.intro === 'function' ? n.intro(K) : n.intro) : lines[(ev.t++) % Math.max(1, lines.length)] || '……';
        if (n.clueLine && found() < need && !first) text += `<br><small>${n.clueLine}</small>`;
        if (first && n.note) K.clue(n.note);
        K.say(npc, text, (n.decides || (npc.idx === 0 && !d.npcs)) && found() >= need ? [{ label: d.final.button || '告訴他你知道的事', primary: true, run: () => decide(npc) }, ...bye] : bye);
      };
    }
    if (d.setup) d.setup(K, people);
    K.hint(d.hint || '這一站有人在等什麼。');
    return people;
  }
  // 長得跟玩家一樣的人（未來的自己、兩個你）
  function selfPerson(K, pos) {
    const s = S(), rig = Human3D.build(s.char, s.wardrobe.wear);
    rig.root.position.set(pos.x, pos.y, pos.z); K.group.add(rig.root);
    const n = { id: 'self', name: '你', role: '？', rig, x: pos.x, y: pos.y, z: pos.z, face: 0, behavior: 'watch', speed: .8, home: { ...pos }, wait: 0, cd: 0, data: {}, talk: null };
    K.npcs.push(n);
    return n;
  }

  /* ════════ 引擎：解謎 ════════ */
  function puzzle(K, d) {
    const ev = K.ev; ev.found = ev.found || {}; ev.wrong = ev.wrong || 0;
    const found = () => Object.keys(ev.found).length;
    (d.clues || []).forEach((c, i) => {
      if (ev.found[i]) return;
      const p = K.prop(c.kind || 'note', at(K, c.at || 'c'), { label: c.label || '調查', hidden: c.hidden, tag: 'clue', use: () => {
        ev.found[i] = 1; saveState(); K.removeProp(p);
        if (d.timer && !ev.timerOn) startTimer();
        K.say({ name: c.title || '線索', role: '迷霧之城' }, c.text, [{ label: '記下來', run: () => { Dialog.close(); K.clue(c.note || c.text.replace(/<[^>]+>/g, '').slice(0, 34)); } }]);
      } });
    });
    let timer = null;
    function startTimer() {
      ev.timerOn = 1; let left = d.timer;
      K.toast(`<b>⏳ 倒數 ${d.timer} 秒</b><span>${d.timerText || '有什麼東西開始倒數了。'}</span>`, 'warn');
      timer = K.timer(d.timer, () => { if (!ev.solved) { ev.solved = 'fail'; K.hurt(d.timerDmg || 25, d.timerWhy || '時間到了，霧整個壓了下來'); K.done('fail'); } });
      K.every(dt => { if (!ev.solved && left > 0) { left -= dt; if (((left * 10) | 0) % 10 === 0) K.hint(`⏳ ${Math.ceil(left)} 秒`); } });
    }
    const dev = d.device;
    const devP = K.prop(dev.kind || 'console', at(K, dev.at || 'c'), { label: dev.label || '調查裝置', glint: false, tag: 'device', r: 1.6, use: () => {
      if (ev.solved) return K.say({ name: dev.name || '裝置', role: '' }, d.solvedText || '已經打開了。', bye);
      if (found() < (d.need ?? (d.clues || []).length)) return K.say({ name: dev.name || '裝置', role: '' }, `${dev.locked || '它需要某種答案。'}<br><small>（線索 ${found()} / ${d.need ?? d.clues.length}）</small>`, bye);
      if (dev.order) return askOrder();
      K.say({ name: dev.name || '裝置', role: '' }, dev.prompt, shuffle(dev.options, K.rnd).map(o => ({ label: o, run: () => answer(o === dev.answer) })).concat([{ label: '先不要', run: () => Dialog.close() }]));
    } });
    function askOrder() {
      const picked = [];
      const step = () => {
        const left = dev.order.filter(x => !picked.includes(x));
        if (!left.length) return answer(true);
        K.say({ name: dev.name || '裝置', role: `${picked.length + 1} / ${dev.order.length}` }, `${dev.prompt}<br><small>${picked.length ? '已選：' + picked.join(' → ') : ''}</small>`, shuffle(left, K.rnd).map(o => ({ label: o, run: () => { if (o !== dev.order[picked.length]) return answer(false); picked.push(o); step(); } })).concat([{ label: '先不要', run: () => Dialog.close() }]));
      };
      step();
    }
    function answer(ok) {
      if (!ok) {
        ev.wrong++; saveState();
        K.hurt(d.wrongDmg ?? 10, d.wrongWhy || '答錯了，裝置迸出一道冰冷的霧');
        return K.say({ name: dev.name || '裝置', role: '' }, d.wrongText || '不對。四周的燈閃了一下，好像有什麼東西靠近了一步。', bye);
      }
      ev.solved = 1; saveState(); if (timer) K.cancel(timer);
      K.sound('good');
      const res = ev.wrong ? 'good' : 'perfect';
      const after = d.after;
      if (!after) { K.say({ name: dev.name || '裝置', role: '' }, d.openText, [{ label: '好', run: () => { Dialog.close(); K.done(res, { title: d.title }); } }]); return; }
      K.say({ name: dev.name || '裝置', role: '' }, after.text, after.options.map(o => ({ label: o.label, run: () => {
        K.choice(o.label);
        K.say({ name: dev.name || '裝置', role: '' }, o.text, [{ label: '……', run: () => { Dialog.close(); if (o.hurt) K.hurt(o.hurt, o.why || '霧裡有什麼撲了過來'); K.done(o.result === 'down' ? (res === 'perfect' ? 'good' : 'bad') : res, { gold: o.gold, items: o.items, title: d.title }); } }]);
      } })));
    }
    void devP;
    K.hint(d.hint || '這一站的某樣東西被鎖起來了。');
  }

  /* ════════ 引擎：生存與危險 ════════ */
  function survive(K, d) {
    const ev = K.ev; ev.got = ev.got || 0; ev.hit0 = ev.hit0 ?? K.r.dmg;
    if (d.dark) { K.setMood('dark'); if (!(S().inv.mistlamp > 0)) { const lp = K.prop('lamp', at(K, 'c'), { label: '撿起：一盞舊霧燈', use: () => { S().inv.mistlamp = 1; K.r.lamp = Math.max(K.r.lamp, 70); saveState(); K.removeProp(lp); K.setLamp(true); K.toast('<b>🏮 撿到一盞霧燈</b><span>畫面上方可以開關；電量有限。</span>'); FogCity.hud(); } }); } }
    // 危險：追人的東西
    const hz = d.hazard || {}, hcount = hz.count || 0;
    const far = () => { for (let i = 0; i < 20; i++) { const p = at(K, hz.at || (K.rnd() < .5 ? 'c' : 'p')); if (K.dist(p, World.player) > 12) return p; } return at(K, 'pend'); };
    for (let i = 0; i < hcount; i++) K.chaser(hz.kind || 'shadow', far(), { speed: hz.speed || 2.2, dmg: hz.dmg || 18, range: hz.range || 14, mode: hz.mode || 'chase', why: hz.why || '被影子抓到', sleep: 6 + i * 4 });
    K.onRevive = () => { World.spawnInConcourse(); for (const c of K.chasers) c.sleep = 6; };
    const finish = () => {
      if (ev.done) return; ev.done = 1; saveState();
      const taken = K.r.dmg - ev.hit0;
      if (d.noHit && taken > 0) return K.done('bad', { title: d.title, text: '完成了，但你被碰到了——這不算完美。' });
      for (const c of [...K.chasers]) K.removeChaser(c);
      if (d.dark) K.setMood(K.phase === 'fade' ? 'fade' : 'fog');
      K.done(taken === 0 ? 'perfect' : taken < 40 ? 'good' : 'bad', { title: d.title, text: d.doneText });
    };
    if (d.noHit) K.onHurt = () => { if (!ev.done && !ev.warned) { ev.warned = 1; K.toast('<b>被碰到了</b><span>無傷挑戰失敗，但還是可以把事情做完。</span>', 'warn'); } };
    const g = d.goal || { type: 'collect', n: 4 };
    if (g.type === 'collect') {
      const pts = K.spread(g.n, { rnd: K.rnd, minD: 9 });
      pts.forEach((pt, i) => {
        if (ev['g' + i]) return;
        const p = K.prop(g.kind || 'shard', pt, { label: g.label || '撿起', hidden: g.hidden, tag: 'goal', use: () => {
          ev['g' + i] = 1; ev.got++; saveState(); K.removeProp(p); K.sound('bell');
          K.toast(`<b>${g.name || '碎片'}（${ev.got} / ${g.n}）</b><span>${(g.texts || [])[i] || ''}</span>`);
          if (g.texts && g.texts[i]) K.clue(g.texts[i]);
          if (ev.got >= g.n) finish();
          else if (hz.grow) K.chaser(hz.kind || 'shadow', far(), { speed: (hz.speed || 2.2) + ev.got * .15, dmg: hz.dmg || 18, mode: hz.mode || 'chase', why: hz.why || '被影子抓到', sleep: 5 });
        } });
      });
    } else if (g.type === 'survive') {
      let left = ev.left ?? g.sec;
      K.every(dt => { if (ev.done || K.dead) return; left -= dt; ev.left = left; if (((left * 4) | 0) % 4 === 0) K.hint(`撐住：還有 ${Math.ceil(left)} 秒`); if (left <= 0) finish(); });
    } else if (g.type === 'reach') {
      const pts = g.path ? g.path.map(w => at(K, w)) : K.spread(g.n || 4, { rnd: K.rnd, minD: 12 });
      const next = () => {
        const i = ev.got; if (i >= pts.length) return finish();
        const p = K.prop(g.kind || 'symbol', pts[i], { label: g.label || '碰觸記號', tag: 'goal', use: () => { ev.got++; saveState(); K.removeProp(p); K.sound('bell'); K.toast(`<b>${g.name || '記號'}（${ev.got} / ${pts.length}）</b><span>${(g.texts || [])[i] || '下一個在別的地方亮起來了。'}</span>`); next(); } });
      };
      next();
    }
    // 特殊規則
    if (d.noTurn) {   // 不能回頭：在月台上，鏡頭轉超過 120 度就受傷
      let base = null;
      K.every(dt => { if (ev.done || K.dead) return; const z = World.zone(); if (z.kind !== 'platform') { base = null; return; } const y = World.camYaw; if (base == null) base = y; let dd = Math.abs(((y - base + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (dd > 2.1) { base = y; K.hurt(15, '你回頭了。背後的東西貼了上來'); } });
    }
    if (d.shrink) {   // 逐漸縮小的安全區
      const c = at(K, 'c'); let rad = d.shrink.r || 18;
      const ring = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 64), new THREE.MeshBasicMaterial({ color: '#ff4040', transparent: true, opacity: .6, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(c.x, .03, c.z); K.group.add(ring);
      let tick = 0;
      K.every(dt => {
        if (ev.done || K.dead) { ring.visible = false; return; }
        rad = Math.max(3, rad - dt * (d.shrink.rate || .09)); ring.scale.set(rad, rad, 1);
        const p = World.player; tick += dt;
        if (tick > 1 && (Math.abs(p.y) > .3 || Math.hypot(p.x - c.x, p.z - c.z) > rad)) { tick = 0; K.hurt(4, '安全區外的霧在灼燒你'); }
      });
    }
    if (d.callout) {   // 不要被點名
      const radio = K.prop('radio', at(K, 'spot:office'), { label: '關掉廣播', glint: false, tag: 'goal', use: () => { if (ev.called) { ev.called = 0; ev.got++; saveState(); K.sound('good'); K.toast(`<b>📻 廣播停了（${ev.got} / 3）</b><span>喇叭裡傳來一聲嘆氣。</span>`); if (ev.got >= 3) finish(); } else K.say({ name: '廣播主機', role: '' }, '喇叭裡只有沙沙聲。等它念到你的名字，再來關掉它。', bye); } });
      void radio;
      let t = 20;
      K.every(dt => {
        if (ev.done || K.dead) return; t -= dt;
        if (ev.called) { ev.callLeft -= dt; K.hint(`被點名了！${Math.ceil(ev.callLeft)} 秒內到站務室旁關掉廣播`); if (ev.callLeft <= 0) { ev.called = 0; K.hurt(22, '名字被念完了，有東西知道你在哪裡'); } }
        else if (t <= 0) { t = 45; ev.called = 1; ev.callLeft = 35; K.sound('radio'); K.toast(`<b>📢 「請 ${esc(S().name || (S().char === 'aiyun' ? '愛紜' : '軒宇'))} 旅客……到……」</b><span>廣播在念你的名字。</span>`, 'warn'); }
      });
    }
    if (d.fakeStaff) {   // 假站務人員
      const pts = K.spread(3, { areas: ['concourse'], rnd: K.rnd, minD: 6 }), fake = (K.rnd() * 3) | 0;
      const tells = ['名牌上的照片是空白的', '制服的扣子扣錯邊', '鞋子是濕的，地上卻沒有水', '他說話時，廣播也同時說著一模一樣的話'];
      pts.forEach((pt, i) => {
        const real = i !== fake;
        const nn = K.person(K.look({ top: '#e9edf2', pattern: 'uniform', accent: '#1f3a6b', bottom: '#1f2a3a', hat: 'cap', hatColor: '#1f3a6b' }), pt, { name: `站務員 ${'甲乙丙'[i]}`, role: '站務人員？', behavior: 'watch', speed: 0 });
        nn.data.key = true;
        const tell = tells[(i + fake) % tells.length];
        nn.talk = () => K.say(nn, (real ? ['「這麼晚了還在站裡？我們在等霧散。」', '「如果你看到另一個穿制服的人一直盯著你，別靠近他。」'][i % 2] : '「這麼晚了還在站裡？……我們在等霧散。」') + `<br><small>${real ? '他的名牌、制服、鞋子都很正常。' : tell + '。'}</small>`, [
          { label: '指認他是假的', run: () => {
            Dialog.close();
            if (real) { K.hurt(20, '你指認錯了。真正的假冒者在你背後笑了'); ev.wrongPick = 1; saveState(); }
            else { ev.done = 1; saveState(); K.sound('good'); K.removeNpc(nn); for (const c of [...K.chasers]) K.removeChaser(c); K.done(ev.wrongPick ? 'good' : 'perfect', { title: '假站務人員', text: '假冒的站務員像一件空衣服一樣塌了下去。' }); }
          } }, ...bye]);
        if (!real) K.clue('三個站務員裡，有一個不對勁。看名牌、制服、鞋子。');
      });
    }
    if (d.timer) {   // 倒數：時間到還沒完成就失敗
      let left = ev.tleft ?? d.timer;
      K.every(dt => { if (ev.done || K.dead) return; left -= dt; ev.tleft = left; if (((left * 2) | 0) % 2 === 0) K.hint(`⏳ ${Math.floor(left / 60)}:${String(Math.ceil(left % 60) % 60).padStart(2, '0')}`); if (left <= 0) { ev.done = 1; saveState(); K.hurt(25, '時間到了，霧整個壓了下來'); K.done('fail'); } });
    }
    K.hint(d.hint || '小心。這裡有東西在動。');
  }

  /* ════════ 引擎：隱藏收藏 ════════ */
  function collect(K, d) {
    const col = (S().fogCol = S().fogCol || {}), set = (col[d.set] = col[d.set] || {});
    const ev = K.ev;
    const pts = K.spread(d.items.length, { rnd: K.rnd, minD: 7 });
    d.items.forEach((it, i) => {
      if (ev['k' + i]) return;
      const p = K.prop(it.kind || d.kind || 'note', pts[i], { label: it.label || d.label || '撿起', hidden: it.hidden, tag: 'collect', use: () => {
        ev['k' + i] = 1; const dup = !!set[it.name]; set[it.name] = K.r.night; saveState(); K.removeProp(p); K.sound('bell');
        K.say({ name: `${d.icon || '📦'} ${it.name}`, role: `${d.setName}（${Object.keys(set).length} / ${d.items.length}）${dup ? '・已經有了' : ''}` }, it.text, [{ label: '收進圖鑑', run: () => {
          Dialog.close(); K.clue(`${d.setName}：${it.name}`);
          if (dup) { S().flags.fogDup = (S().flags.fogDup || 0) + 1; saveState(); }
          if (d.items.every((x, j) => ev['k' + j])) finish();
        } }]);
      } });
    });
    function finish() {
      if (ev.done) return; ev.done = 1; saveState();
      const all = d.items.every(x => set[x.name]);
      K.say({ name: d.setName, role: '收藏完成' }, d.complete, [{ label: '好', run: () => { Dialog.close(); K.done(all ? 'perfect' : 'good', { title: d.setName, gold: all && !S().flags['fogset_' + d.set] ? (S().flags['fogset_' + d.set] = 1, d.gold || 1) : 0 }); } }]);
    }
    K.hint(d.hint || '這一站散落著一些不屬於這裡的東西。');
  }

  /* ════════ 引擎：隱藏任務（條件達成前什麼都看不出來） ════════ */
  function hidden(K, d) {
    const ev = K.ev;
    K.hint('……');
    const trigger = () => {
      if (ev.triggered) return; ev.triggered = 1; saveState(); K.sound('sting');
      const steps = d.story.slice(); let i = 0;
      const next = () => { if (i >= steps.length) { Dialog.close(); return K.done('perfect', { title: d.title, text: d.doneText || '有什麼東西被你看見了。', gold: d.gold || 0, col: [['hidden', d.title]] }); } const st = steps[i++]; K.say({ name: st.who || '？？？', role: st.role || '隱藏任務' }, st.text, [{ label: i >= steps.length ? '……' : '繼續', run: next }]); };
      if (d.onTrigger) d.onTrigger(K);
      setTimeout(next, d.delay || 400);
    };
    const t = d.trigger;
    if (t.type === 'idle') {   // 在某個地方一動也不動
      let still = 0, sp = t.spot ? at(K, 'spot:' + t.spot) : null;
      K.every(dt => { if (ev.triggered || K.dead || Dialog.with) return; const p = World.player; if (World.moving || (sp && K.dist(sp, p) > 2.5)) { still = 0; return; } still += dt; if (still > t.sec) trigger(); });
    }
    if (t.type === 'spot') {   // 調查某個設施很多次
      K.onSpot = sp => { if (ev.triggered || sp.kind !== t.spot) return false; ev.n = (ev.n || 0) + 1; saveState(); if (ev.n >= t.n) { trigger(); return true; } if (t.texts && t.texts[ev.n - 1]) { Dialog.info(t.title || '……', t.texts[ev.n - 1]); return true; } return false; };
    }
    if (t.type === 'ends') {   // 走到每一座月台的兩端
      K.every(() => { if (ev.triggered) return; const p = World.player; for (const P of K.L.platforms) for (const ex of [-1, 1]) if (Math.abs(p.y - P.y) < .5 && Math.abs(p.x - (P.x + ex * 30)) < 2 && Math.abs(p.z - P.z) < 3) { const k = 'e' + P.k + ex; if (!ev[k]) { ev[k] = 1; saveState(); } } if (K.L.platforms.every(P => ev['e' + P.k + '-1'] && ev['e' + P.k + '1'])) trigger(); });
    }
    if (t.type === 'talkall') {   // 和每一個霧裡的人都說過話
      const amb = K.npcs.filter(n => n.ambient);
      for (const n of amb) { const old = n.talk; n.talk = x => { ev['t' + n.name] = 1; saveState(); old(x); if (amb.every(m => ev['t' + m.name])) setTimeout(() => { Dialog.close(); trigger(); }, 1500); }; }
    }
    if (t.type === 'minute') {   // 某一分鐘站在月台上
      K.every(() => { if (ev.triggered) return; const m = TaipeiTime.now().minute; if (m % 10 === t.m && World.zone().kind === 'platform') trigger(); });
    }
    if (t.type === 'escalator') {   // 上下電扶梯很多次
      let last = '';
      K.every(() => { if (ev.triggered) return; const z = World.zone().kind, k = z === 'platform' ? 'p' : z === 'concourse' ? 'c' : ''; if (k && k !== last) { if (last) { ev.esc = (ev.esc || 0) + 1; saveState(); } last = k; } if ((ev.esc || 0) >= t.n) trigger(); });
    }
    if (t.type === 'lampcorner') {   // 在某個角落打開霧燈
      const c = at(K, t.at || 'pend');
      K.every(() => { if (ev.triggered) return; if (K.lamp && K.dist(c, World.player) < 3) trigger(); });
    }
    if (t.type === 'item') {   // 帶著某樣東西
      K.every(() => { if (ev.triggered) return; if ((S().inv[t.item] || 0) > 0 && World.zone().kind === (t.zone || 'platform')) trigger(); });
    }
    if (t.type === 'noclue') {   // 一整晚什麼都不碰（3 分鐘內不和任何人說話、不調查）
      let calm = 0;
      K.every(dt => { if (ev.triggered) return; if (Dialog.with) calm = 0; else calm += dt; if (calm > t.sec) trigger(); });
    }
    if (t.type === 'blankticket') {   // 撿到空白車票，拿給攤販看
      const pt = at(K, t.at || 'pend');
      const p = K.prop('ticket', pt, { label: '撿起：一張空白的車票', hidden: true, use: () => { ev.ticket = 1; saveState(); K.removeProp(p); K.toast('<b>🎫 一張完全空白的車票</b><span>正反面都沒有字。也許有人認得它。</span>'); } });
      const m = K.npcs.find(n => n.data.merchant);
      if (m) { const old = m.talk; m.talk = x => (ev.ticket ? trigger() : old(x)); }
    }
  }

  /* ════════ 引擎：停著不開的列車 ════════ */
  async function trainev(K, d) {
    const L = K.L, P = L.platforms[0], side = 1, k = 0;
    const ev = K.ev;
    const tr = World.spawnTrain(k, side, P.line, 1, null); tr.fog = true;
    K.tintTrain(tr, '#333', d.light || '#9fe0c8');
    tr.x = 0; tr.group.position.x = P.x; tr.doorAmt = 1;
    World.setDoors(tr, true, 10);
    K.train = tr;
    K.noPhantom = true;
    // 車門旁的看板
    const sign = K.canvasSprite(g => { g.fillStyle = '#07090b'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#ffd36b'; g.font = '900 44px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.fillText(d.lcd || '往 　　　', 256, 62); }, 512, 96, .5);
    sign.position.set(P.x, P.y + 2.8, P.z + side * 2.4); K.group.add(sign);
    K.cleanup = () => { World.removeTrain(tr); };
    K.hint(d.hint || '月台上停著一班列車，車門一直開著。');
    const sub = d.sub || 'story';
    if (sub === 'story') story(K, d);
    else if (sub === 'puzzle') puzzle(K, d);
    else if (sub === 'collect') collect(K, d);
    else if (sub === 'survive') survive(K, d);
    K.hint(d.hint || '月台上停著一班列車，車門一直開著。');
    if (d.extra) d.extra(K, tr);
    void ev;
  }

  /* ════════ 引擎：交易 ════════ */
  function trade(K, d) {
    const ev = K.ev, s = S();
    const pos = at(K, d.at || 'c');
    const m = K.person(K.look(d.look || { top: '#2a2a3a', coat: true, hat: 'beret', hatColor: '#6a2a2a' }), pos, { name: d.name, role: d.role || '神祕商人', behavior: 'watch', speed: 0 });
    m.data.key = true;
    const menu = () => {
      const goods = d.goods.map(g => {
        const it = ITEMS[g.id] || { name: g.name, icon: g.icon };
        const owned = g.once && (s.inv[g.id] || 0) > 0;
        if (g.swap) {   // 用普通物品交換
          const haveAny = Object.keys(s.inv).filter(id => s.inv[id] > 0 && ITEMS[id] && ITEMS[id].price && !ITEMS[id].cat);
          return { label: `🔁 ${g.label}`, disabled: !haveAny.length || ev.swapped, run: () => K.say(m, '「拿一樣普通的東西來換。」', haveAny.slice(0, 8).map(id => ({ label: `${ITEMS[id].icon} ${ITEMS[id].name}`, run: () => { s.inv[id]--; ev.swapped = 1; saveState(); g.run(K); if (!ev.dealt) { ev.dealt = 1; K.done('good', { title: d.title }); } } })).concat(bye)) };
        }
        return { label: `${it.icon} ${it.name}　🪙 ${g.gold}${owned ? '（已擁有）' : ''}`, disabled: owned || (s.gold || 0) < g.gold, run: () => {
          s.gold -= g.gold; if (ITEMS[g.id]) s.inv[g.id] = (s.inv[g.id] || 0) + 1; if (g.col) { const c = (s.fogCol = s.fogCol || {}); (c.rare = c.rare || {})[g.name || it.name] = K.r.night; }
          saveState(); updateHud(); Sound.itemGet(); K.toast(`<b>換到了 ${it.icon} ${it.name}</b>`);
          if (!ev.dealt) { ev.dealt = 1; K.done('perfect', { title: d.title }); } menu();
        } };
      });
      K.say(m, d.text, goods.concat(bye));
    };
    m.talk = menu;
    K.hint(d.hint || '大廳裡多了一個攤位。');
  }

  /* ════════ 引擎：記憶挑戰 ════════ */
  function memory(K, d) {
    const ev = K.ev;
    const scene = d.scene, qs = d.questions;
    const p = K.prop(d.kind || 'tv', at(K, d.at || 'c'), { label: d.label || '看著螢幕', glint: false, tag: 'device', r: 1.8, use: () => {
      if (ev.done) return K.say({ name: d.name || '螢幕', role: '' }, '畫面已經變成雜訊了。', bye);
      if (!ev.seen) {
        ev.seen = 1; saveState();
        K.say({ name: d.name || '螢幕', role: '只看一次' }, scene, [{ label: '我記住了', run: () => { Dialog.close(); K.toast('<b>畫面消失了</b><span>十秒後，到大廳另一邊的告示牌回答問題。</span>'); } }]);
        return;
      }
      K.say({ name: d.name || '螢幕', role: '' }, '畫面只剩下雜訊。<br><small>去告示牌那裡回答問題。</small>', bye);
    } });
    void p;
    let q = 0, wrong = 0;
    K.onSpot = sp => {
      if (sp.kind !== 'notice' || !ev.seen || ev.done) return false;
      const ask = () => {
        if (q >= qs.length) { ev.done = 1; saveState(); Dialog.close(); return K.done(wrong ? 'good' : 'perfect', { title: d.title }); }
        const it = qs[q];
        K.say({ name: '告示牌', role: `問題 ${q + 1} / ${qs.length}` }, it.q, shuffle(it.o, K.rnd).map(o => ({ label: o, run: () => { if (o === it.a) { q++; ask(); } else { wrong++; K.hurt(12, '記錯了，告示牌上的字變成你的名字'); Dialog.close(); } } })));
      };
      ask();
      return true;
    };
    K.hint(d.hint || '大廳的某個螢幕亮著。');
  }

  // 連續事件：做完一個接下一個
  function chain(K, d) {
    const ev = K.ev; ev.stage = ev.stage || 0;
    const realDone = K.done;
    const run = i => { K.ev = ev['s' + i] = ev['s' + i] || {}; const st = d.steps[i]; ({ story, puzzle, survive, collect, memory })[st.base](K, st); };
    K.done = (res, o) => {
      if (ev.stage < d.steps.length - 1) {
        ev.stage++; saveState(); K.toast(`<b>🌫 還沒結束</b><span>${d.steps[ev.stage].intro || '另一件事開始了。'}</span>`, 'warn');
        for (const p of [...K.props]) if (p.tag) K.removeProp(p);
        setTimeout(() => run(ev.stage), 1500);
      } else { K.done = realDone; K.ev = ev; realDone(res, o); }
    };
    run(ev.stage);
  }

  const ENG = { story, puzzle, survive, collect, hidden, trainev, trade, memory, chain };
  function def(cat, key, d) { REG[key] = { cat, d }; }
  function start(key, K) {
    const e = REG[key];
    if (!e) return;
    const d = typeof e.d === 'function' ? e.d(K) : e.d;
    K.eventCat = e.cat; K.eventKey = key;
    (ENG[d.base] || FogEvents[d.base])(K, d);
  }
  const keysOf = cat => Object.keys(REG).filter(k => REG[k].cat === cat);
  return { def, start, keysOf, REG, at, story, puzzle, survive, collect, hidden, trainev, trade, memory, chain, selfPerson, shuffle };
})();
