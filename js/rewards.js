/* 任務報酬依難度調整：要跑多遠、有幾個步驟、有沒有時間限制
 * 每個任務算出「路程」：委託人所在的車站 → 每一步要去的車站／要找的人所在的車站，依路網最短距離加總（公里）。
 * 報酬 = 原本依任務類型給的基本報酬（progress.js）＋ 路程加給 ＋ 步驟加給 ＋ 限時加給。
 * 任務卡片上會顯示難度星等和路程，玩家接任務前就知道要跑多遠。
 */
const QuestEffort = (() => {
  const npcStation = id => (typeof NPCS !== 'undefined' && NPCS[id] && NPCS[id].station) || null;
  // 一步要去的車站（不知道的回傳 null）
  function stepStation(g) {
    if (!g) return null;
    if (g.station && g.station[0] !== '@') return g.station;
    if (g.npc) return npcStation(g.npc);
    if (g.kind === 'terminal' && g.line && typeof MRT !== 'undefined') { const t = [...MRT.terminals(g.line)]; return t[0] || null; }
    return null;
  }
  function measure(q) {
    const pts = [];
    const start = q.giver ? npcStation(q.giver) : null;
    if (start) pts.push(start);
    for (const s of q.steps || []) { const st = stepStation(s.goal); if (st && st !== pts[pts.length - 1]) pts.push(st); }
    let km = 0;
    for (let i = 1; i < pts.length; i++) km += Economy.distance(pts[i - 1], pts[i]);
    // 搭整條線、到終點站之類沒有固定起點的步驟：估一段距離
    for (const s of q.steps || []) if (s.goal && (s.goal.kind === 'ride' || s.goal.kind === 'terminal') && !s.goal.station) km += 6;
    const steps = (q.steps || []).length, timed = !!(q.minutes || q.hours || q.deadline || q.type === 'timed');
    const score = km / 4 + steps * .8 + (timed ? 1.5 : 0) + (q.type === 'secret' ? 1 : 0) + ({ easy: 0, normal: .5, adv: 1.5, hard: 2.5, story: 3 }[q.diff] || 0);
    const stars = Math.max(1, Math.min(5, Math.round(score / 2.2) + 1));
    return { km: Math.round(km * 10) / 10, steps, timed, stars, stations: pts.length };
  }
  // 路程、步驟、限時的加給
  function bonus(e, f = 1) {
    const money = Math.round((e.km * 14 + Math.max(0, e.steps - 1) * 20 + (e.timed ? 60 : 0)) * f / 10) * 10;
    const xp = Math.round((e.km * 9 + Math.max(0, e.steps - 1) * 12 + (e.timed ? 40 : 0)) * f);
    return { money: Math.min(money, 600), xp: Math.min(xp, 400), gold: e.stars >= 5 && f >= 1 ? 1 : 0 };
  }
  const add = (r, b) => { r = r || {}; if (b.money) r.money = (r.money || 0) + b.money; if (b.xp) r.xp = (r.xp || 0) + b.xp; if (b.gold) r.gold = (r.gold || 0) + b.gold; return r; };
  const factor = k => ({ perfect: 1, special: 1, hidden: 1, surprise: .8, normal: .6, good: .8, bad: .4, wrong: 0 }[k] ?? .8);

  function apply() {
    for (const [id, q] of Object.entries(QUESTS)) {
      if (q.effort || q.type === 'main' || q.type === 'daily' || q.type === 'weekly') continue;   // 主線另外處理（都在站內完成）；每日／每週委託自己有報酬表
      const e = q.effort = measure(q);
      if (q.outcomes) for (const [k, o] of Object.entries(q.outcomes)) o.reward = add(o.reward, bonus(e, factor(k)));
      else q.reward = add(q.reward, bonus(e));
    }
  }
  // 任務卡片上的難度說明
  function label(q) {
    const e = q.effort; if (!e) return '';
    return `<span class="q-effort">難度 ${'★'.repeat(e.stars)}${'☆'.repeat(5 - e.stars)}${e.km ? `・路程約 ${e.km} 公里` : '・在附近就能完成'}${e.timed ? '・限時' : ''}</span>`;
  }
  return { apply, measure, label };
})();
QuestEffort.apply();
