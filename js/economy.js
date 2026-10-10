/* 金錢、等級、票價
 * 票價依台北捷運規則：起程 5 公里內 20 元，超過 5 公里後每 3 公里加 5 元，最高 65 元（依最短路徑距離）
 * 站間距離用路線平均站距估算（實際里程請以台北捷運公告為準）
 */
const Economy = (() => {
  const SEG_KM = { BR: 1.0, R: 1.25, G: 1.15, O: 1.2, BL: 1.15, Y: 1.15 };
  // 路網圖（站 → 鄰站與距離）
  const graph = {};
  for (const lid of LINE_ORDER) for (const r of LINES[lid].routes) for (let i = 0; i < r.length - 1; i++) {
    const a = r[i][0], b = r[i + 1][0], km = SEG_KM[lid];
    (graph[a] = graph[a] || {})[b] = km;
    (graph[b] = graph[b] || {})[a] = km;
  }
  const cache = {};
  // Dijkstra：兩站最短距離（公里）
  function distance(a, b) {
    if (a === b) return 0;
    const key = a < b ? a + '|' + b : b + '|' + a;
    if (cache[key] != null) return cache[key];
    const dist = { [a]: 0 }, done = new Set();
    for (;;) {
      let u = null;
      for (const k in dist) if (!done.has(k) && (u === null || dist[k] < dist[u])) u = k;
      if (u === null || u === b) break;
      done.add(u);
      for (const v in graph[u] || {}) { const d = dist[u] + graph[u][v]; if (dist[v] == null || d < dist[v]) dist[v] = d; }
    }
    return (cache[key] = dist[b] ?? 0);
  }
  function fare(a, b) {
    const km = distance(a, b);
    if (km <= 5) return 20;
    return Math.min(65, 20 + Math.ceil((km - 5) / 3) * 5);
  }

  // 等級：第 n 級升到 n+1 級需要 100 × n 經驗
  function levelInfo(xp) {
    let lv = 1, need = 100, rest = xp;
    while (rest >= need) { rest -= need; lv++; need = 100 * lv; }
    return { lv, cur: rest, need };
  }
  return { distance, fare, levelInfo };
})();
