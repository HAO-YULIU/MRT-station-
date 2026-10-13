/* 玩家自己取的角色名字
 * - 選角色時先選男主／女主，再取名：2–6 個字，可用中文、英文大小寫
 * - 遊戲裡所有叫到主角名字的地方都用 playerName()（沒取名的舊存檔用角色預設名字）
 * - 已經在玩的玩家：背包直接收到一張「改名卡」，用了就能改名
 */
const NAME_RE = /^[A-Za-z㐀-䶿一-鿿豈-﫿]{2,6}$/;
function nameError(n) {
  n = String(n || '');
  if (!n) return '請輸入角色名字';
  if (/\s/.test(n)) return '名字不能有空白';
  if (!/^[A-Za-z㐀-䶿一-鿿豈-﫿]*$/.test(n)) return '只能用中文或英文字母';
  if (n.length < 2) return '至少要 2 個字';
  if (n.length > 6) return '最多 6 個字';
  return '';
}
function playerName(s) {
  s = s || (typeof Game !== 'undefined' && Game.state) || {};
  return s.name || (CHARACTERS[s.char] || {}).name || '';
}
ITEMS.rename_card = { name: '改名卡', desc: '可以替角色重新取一次名字（2–6 個字，中文或英文）。', icon: '🪪', cat: 'use' };

const PlayerName = (() => {
  // 舊存檔：已經選過角色、但還沒有自己取的名字 → 送一張改名卡（只送一次）
  function gift(s) {
    if (!s || !s.char || s.name || (s.flags || {}).renameGift) return;
    s.flags.renameGift = 1;
    s.inv.rename_card = (s.inv.rename_card || 0) + 1;
  }
  // 進遊戲時提示一次
  function notice() {
    const s = Game.state;
    if (s.flags.renameGift !== 1) return;
    s.flags.renameGift = 2; saveState();
    toast('<b>🪪 收到「改名卡」</b><span>現在可以替角色取自己的名字了。打開背包，在消耗品裡使用。</span>', 'level');
  }
  function use() {
    const s = Game.state;
    if (!(s.inv.rename_card > 0)) return;
    const cur = playerName(s);
    Dialog.show({ name: '🪪 改名卡', role: '2–6 個字，中文或英文大小寫' },
      `目前的名字：<b>${esc(cur)}</b><br><input class="name-in" id="renameIn" maxlength="6" autocomplete="off" spellcheck="false" placeholder="新的名字" value="${esc(cur)}"><small class="name-tip" id="renameTip">可用中文、英文大小寫，2–6 個字</small>`,
      [{ label: '確定改名', primary: true, run: () => {
        const n = $('#renameIn').value.trim(), err = nameError(n);
        if (err) { const t = $('#renameTip'); t.textContent = err; t.classList.add('bad'); return; }
        s.name = n; s.inv.rename_card -= 1; if (s.inv.rename_card <= 0) delete s.inv.rename_card;
        saveState(); updateHud(); Dialog.close(); Sound.gate();
        toast(`<b>改名完成</b><span>從現在開始，大家都會叫你「${esc(n)}」。</span>`, 'level');
      } }, { label: '取消', run: () => Dialog.close() }]);
    const inp = $('#renameIn');
    if (inp) {
      inp.addEventListener('keydown', e => e.stopPropagation());   // 打字時不要動到角色
      inp.addEventListener('input', () => { const t = $('#renameTip'), err = nameError(inp.value.trim()); t.textContent = err || '可以用這個名字'; t.classList.toggle('bad', !!err); });
      setTimeout(() => inp.focus(), 50);
    }
  }
  return { gift, notice, use };
})();
