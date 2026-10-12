/* 稱號整理：修正重複的 id、加上說明與稀有度、得到新稱號時通知（還是「新手乘客」就自動換上）
 * TITLES 由各檔案 push 進來（progress、daily、gold、festival、onsen、kaicheng、fogspecial…），這個檔案最後載入，統一整理。
 */
const Titles = (() => {
  // 特色大廳全部看過
  TITLES.push({ id: 't_halls', name: '大廳巡禮者', cond: s => Object.keys((s.col || {}).halls || {}).length >= (typeof SpecialHalls !== 'undefined' ? Object.keys(SpecialHalls.HALLS).length : 22) });
  // 迷霧之城《記憶》的稱號原本和「城市拾憶者」共用 t_memory：改成自己的 id，兩個都拿得到、選得到
  for (const t of TITLES) if (t.id === 't_memory' && t.name === '城市的記憶') t.id = 't_fogmemory';
  // 其他重複的 id：保留第一個
  const seen = new Set();
  for (let i = 0; i < TITLES.length; i++) { if (seen.has(TITLES[i].id)) { TITLES.splice(i, 1); i--; } else seen.add(TITLES[i].id); }

  // 說明、稀有度（1 普通 2 稀有 3 史詩 4 傳說）、是否隱藏（拿到之前不顯示名字）
  const INFO = {
    t_rookie: ['剛開始搭捷運的人。', 1],
    t_commuter: ['等級達到 5。', 1],
    t_detective: ['5 個任務拿到 S 評價。', 2],
    t_stamp: ['收集 50 個車站紀念章。', 3],
    t_friend: ['和 10 個人的好感度達到 50。', 2],
    t_explorer: ['去過 60 個車站。', 2],
    t_mist: ['完成主線「回到未來」，送秀蔅回家。', 4],
    t_ace: ['在委託所拿到王牌評價。', 3],
    t_lasttrain: ['搭上末班車。', 2, true],
    t_firsttrain: ['搭上第一班車。', 2, true],
    t_farthest: ['一次坐完最遠的距離。', 2, true],
    t_unregistered: ['在不存在的月台上發現了自己的名字。', 3, true],
    t_archive: ['打開霧的檔案室。', 3, true],
    t_silent: ['默默發現 15 個藏起來的東西，觀察力 3 以上。', 3, true],
    t_memory: ['收集 10 種車票、5 張舊照片。', 2],
    t_bestie: ['和 5 個人的好感度達到 120。', 3],
    t_hw_costume: ['萬聖節變裝比賽第一名。', 2],
    t_hw_ghost: ['萬聖節抓到 10 隻鬼。', 2],
    t_onsen: ['幫湯之庭找回舊招牌。', 3],
    t_moonbath: ['在月光下泡湯。', 3, true],
    t_onsenfan: ['連續好幾天來泡湯。', 2, true],
    t_kaicheng: ['完美解開凱程的底片之謎。', 3],
    t_darkroom: ['在迷霧之城的夜晚遇見凱程。', 3, true],
    t_crossing: ['迷霧之城：從《穿越》的列車上活著下來。', 4, true],
    t_twin: ['迷霧之城：證明自己才是真正的你。', 4, true],
    t_fogmemory: ['迷霧之城：解開台北車站的記憶。', 4, true],
    t_expo: ['迷霧之城：看完第零展區。', 4, true],
    t_fogwalker: ['在 06:00 前離開迷霧 5 次。', 3],
    t_halls: ['欣賞過全部的特色大廳。', 3],
    t_limited: ['收集 15 種車站限定商品。', 3],
  };
  const info = t => {
    if (INFO[t.id]) return { desc: INFO[t.id][0], rare: INFO[t.id][1], secret: !!INFO[t.id][2] };
    if (/^t_inv/.test(t.id)) return { desc: `調查等級達到「${t.name}」。`, rare: Math.min(4, 1 + Math.floor((+t.id.slice(5) || 2) / 2)), secret: false };
    if (/^t_rep_/.test(t.id)) return { desc: `${t.id.slice(6)}一帶的聲望達到 100。`, rare: 2, secret: false };
    if (/^t_story_/.test(t.id)) { const q = QUESTS[t.id.slice(8)]; return { desc: `完成人物故事${q ? `「${q.title}」` : ''}。`, rare: 3, secret: false }; }
    return { desc: '', rare: 2, secret: false };
  };
  const RARE = ['', '普通', '稀有', '史詩', '傳說'];
  const S = () => Game.state;
  const owned = () => TITLES.filter(t => { try { return t.cond(S()); } catch (e) { return false; } });

  // 得到新稱號：通知；還掛著「新手乘客」就自動換上最稀有的那個
  let lastCheck = 0;
  function check(force) {
    const now = performance.now(); if (!force && now - lastCheck < 1500) return; lastCheck = now;
    const s = S(); if (!s) return;
    const have = owned(), known = s.titlesSeen = s.titlesSeen || {};
    const first = !s.titlesSeenInit;
    const fresh = have.filter(t => !known[t.id]);
    if (!fresh.length) return;
    for (const t of fresh) known[t.id] = 1;
    s.titlesSeenInit = true;
    const best = fresh.slice().sort((a, b) => info(b).rare - info(a).rare)[0];
    if (first) {   // 第一次整理（舊存檔）：已經有的稱號不一一通知；還是新手乘客就直接換上最好的一個
      if ((!s.title || s.title === 't_rookie') && best && best.id !== 't_rookie') { s.title = best.id; toast(`<b>🎖️ 換上稱號「${esc(best.name)}」</b><span>你已經有 ${have.length} 個稱號了，到「紀錄 → 角色」可以更換</span>`, 'level'); }
    } else {
      for (const t of fresh.slice(0, 3)) toast(`<b>🎖️ 新稱號「${esc(t.name)}」</b><span>${RARE[info(t).rare]}・${esc(info(t).desc)}　到「紀錄 → 角色」可以更換</span>`, 'level');
      if (!s.title || s.title === 't_rookie') s.title = best.id;
    }
    saveState();
    if (typeof updateHud === 'function') updateHud();
  }
  // 紀錄 → 角色 的稱號區
  function html(current) {
    const have = owned(), haveIds = new Set(have.map(t => t.id));
    const chip = t => { const i = info(t); return `<button class="wd-chip title-chip r${i.rare}" data-title="${t.id}" aria-pressed="${current === t.id}" title="${esc(i.desc)}"><b>${esc(t.name)}</b><small>${RARE[i.rare]}・${esc(i.desc)}</small></button>`; };
    const locked = TITLES.filter(t => !haveIds.has(t.id));
    const open = locked.filter(t => !info(t).secret), hidden = locked.length - open.length;
    return `<div class="rc-titles">${have.sort((a, b) => info(b).rare - info(a).rare).map(chip).join('')}</div>
      <p class="rc-note">已得到 ${have.length} / ${TITLES.length} 個稱號${hidden ? `，還有 ${hidden} 個隱藏稱號等你發現` : ''}。</p>
      ${open.length ? `<details class="title-locked"><summary>還沒得到的稱號（${open.length}）</summary><ul>${open.map(t => `<li><b>${esc(t.name)}</b><small>${RARE[info(t).rare]}・${esc(info(t).desc)}</small></li>`).join('')}</ul></details>` : ''}`;
  }
  return { check, html, owned, info };
})();
