/* 任務可完成性修正（不動其他模組檔案的補丁）
 * 1) 秀蔅：原本只在「這條線第一次到的那一站、而且主線還沒接」時出現，六條主線都接了以後就找不到她，
 *    需要和她說話／交東西給她的任務（知心、情人節、舊照片中的人物、底片上的字、凱程的線索）與她給的「跨站拜訪」都卡住。
 *    → 有任務需要她（或她有委託可給）時，她會在小碧潭站（傳送裝置所在的車站）的大廳等你。
 */
(() => {
  const XIUYU_WAIT = '小碧潭';
  const needsXiuyu = () => {
    const s = Game.state; if (!s || !s.quests) return false;
    for (const [id, st] of Object.entries(s.quests.active)) {
      const q = QUESTS[id]; if (!q || /^find_xiuyu/.test(id)) continue;
      const step = q.steps[st.step];
      if (step && step.goal.npc === 'xiuyu' && ['talk', 'give', 'decide', 'work'].includes(step.goal.kind)) return true;
      if ((q.clues || []).some(c => c.goal.npc === 'xiuyu' && !(st.clues && st.clues[c.id]))) return true;
    }
    return !s.flags.mistLine && (NPCS.xiuyu.gives || []).some(id => Quests.canAccept(id));
  };
  if (typeof Xiuyu !== 'undefined' && Xiuyu.here) {
    const here0 = Xiuyu.here;
    Xiuyu.here = stationId => {
      const r = here0(stationId);
      if (r) return r;
      const s = Game.state;
      if (stationId === XIUYU_WAIT && s && s.flags && s.flags.xiuyuIntro && needsXiuyu()) return { hidden: false };
      return null;
    };
  }

})();
