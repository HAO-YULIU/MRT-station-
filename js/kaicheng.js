/* 凱程：背著底片相機的大學生（中山站，晚上才出現）
 * 神秘任務「凱程的底片」：他拍的每一張照片裡，都多了一個提燈的女孩。
 *   找回散落的底片、確認照片裡多出來的東西，最後揭開他和秀蔅之間的關係。
 * 另有一個隱藏任務（觸發前不顯示）：在迷霧之城的夜晚遇見凱程。
 */
Object.assign(ITEMS, {
  kc_film1: { name: '第一卷底片', desc: '沖洗出來的照片裡，公館站的月台盡頭站著一個提燈的女孩。拍照的時候，那裡明明沒有人。', icon: '🎞️' },
  kc_film2: { name: '最後一卷底片', desc: '最後一張照片是象山站的月台。女孩回頭了，嘴型像在說：「謝謝」。', icon: '🎞️' },
  kc_photo: { name: '凱程的照片', desc: '凱程送你的照片：月台上，你和一個提著燈的女孩站在一起。背面寫著「2026・未來見」。', icon: '📷', cat: 'col' },
});
Object.assign(NPCS, {
  kaicheng: {
    name: '凱程', role: '背著底片相機的大學生', station: '中山', spot: 'concourse', speed: .5, hours: [[19, 24]],
    look: { skin: '#e6c0a8', hair: 'mush', hairColor: '#1a1612', top: '#3a4a5a', coat: true, bottom: '#2a2a30', glasses: true, bag: 'backpack', bagColor: '#5a4a3a', scarf: '#c8a040' },
    gives: ['sq_kaicheng'], likes: ['coffee', 'fishcracker', 'bubbletea'],
    lines: ['底片相機很慢。按下快門以後，要等好幾天才知道自己拍到了什麼。', '我只在晚上拍。白天的車站太吵了，照片會說謊。', '你有沒有覺得，有些月台比別的月台安靜？', '……你身上有一種我照片裡才看得到的光。'],
    knows: [{ text: '我在攝影社，學長說我拍的東西「不太對勁」。我覺得只是光線的問題。' }],
    rumors: ['我洗出來的照片，月台上常常多一個人。每次都是同一個女孩，提著一盞燈。'],
    questTalk: { sq_kaicheng: '「你真的把底片找回來了……讓我看看。」' },
  },
});
NPCS.chen.questTalk = NPCS.chen.questTalk || {};
NPCS.chen.questTalk.sq_kaicheng = '「提燈的女孩？」老陳愣了一下，壓低聲音。「通車那天，我在月台上也看過。她站在最後一節車廂的位置，好像在等誰。我叫她，她回頭笑了一下，就不見了。……這件事，我三十年沒跟人說過。」';
NPCS.laoliao.questTalk = NPCS.laoliao.questTalk || {};
NPCS.laoliao.questTalk.sq_kaicheng = '「凱程？那孩子常常來借我的暗房。他洗照片的時候很安靜，可是有一次，他盯著一張照片看了一整個下午。」';

QUESTS.sq_kaicheng = {
  type: 'side', title: '凱程的底片', giver: 'kaicheng', diff: 'story', mystery: true,
  desc: '凱程說，他的底片不見了兩卷。「你幫我找回來，我就讓你看看我拍到了什麼。」他沒有說他拍到了什麼。',
  steps: [
    { text: '到公館的月台，找到「第一卷底片」', goal: { kind: 'find', item: 'kc_film1', station: '公館' } },
    { text: '照片裡，劍潭的路線圖好像多了一站。去劍潭看看月台的路線圖', goal: { kind: 'inspect', spot: 'map', station: '劍潭' } },
    { text: '照片裡的女孩站在通車那天的月台上。去台北車站問問老陳', goal: { kind: 'talk', npc: 'chen' } },
    { text: '到象山的月台，找到「最後一卷底片」', goal: { kind: 'find', item: 'kc_film2', station: '象山' } },
    { text: '把底片還給凱程（中山，晚上）', goal: { kind: 'give', npc: 'kaicheng', item: 'kc_film2' } },
  ],
  clues: [
    { id: 'laoliao', text: '淡水的老廖說：凱程常來借暗房，曾經盯著一張照片看了一整個下午。', goal: { kind: 'talk', npc: 'laoliao' } },
    { id: 'xiuyu', text: '秀蔅看到凱程的名字時，手裡的燈晃了一下。', goal: { kind: 'talk', npc: 'xiuyu' } },
  ],
  stepReward: [80, 250],
  outcomes: {
    perfect: { name: '未來見', text: '凱程把照片一張一張排在地上。每一張裡，都有那個提燈的女孩——最後一張，她和你站在一起。<br>「我好像……認識她。不對，是『將來』會認識她。」他推了推眼鏡，笑了。<br>「如果我以後有孫女，我要叫她秀蔅。……很奇怪吧？這個名字自己跑進我腦袋裡的。」<br>他把那張合照送給你：「替我跟她說，未來見。」', reward: { money: 900, xp: 500, ixp: 80, gold: 3, title: 't_kaicheng', items: { kc_photo: 1 }, friend: { kaicheng: 40, xiuyu: 10 } } },
    normal: { name: '照片裡的女孩', text: '凱程看著照片，沉默了很久。「她到底是誰？」<br>他把一張照片送給你：「你好像也看得到她。如果你遇見她，幫我問問她的名字。」', reward: { money: 550, xp: 320, ixp: 40, gold: 1, items: { kc_photo: 1 }, friend: { kaicheng: 25 } } },
  },
};
// 隱藏任務：迷霧之城的夜晚，在中山遇見凱程（觸發前不顯示）
QUESTS.sec_kaicheng_fog = {
  type: 'secret', giver: null, title: '霧裡的快門',
  desc: '迷霧之城的夜晚，中山站裡響起一聲快門聲。',
  steps: [{ text: '在迷霧之城的夜晚，於中山站找到凱程', goal: { kind: 'talk', npc: 'kaicheng_fog' } }],
  reward: { money: 400, xp: 300, gold: 2, ixp: 50, title: 't_darkroom' },
};
TITLES.push(
  { id: 't_kaicheng', name: '未來的合照', cond: s => (s.titles || {}).t_kaicheng },
  { id: 't_darkroom', name: '暗房裡的人', cond: s => (s.titles || {}).t_darkroom },
);
ACHIEVEMENTS.push({ id: 'a_kaicheng', name: '凱程的底片', desc: '幫凱程找回兩卷底片，看見照片裡的女孩。', check: s => !!(s.quests.done || {}).sq_kaicheng, gold: 1 });

// 迷霧之城：中山站多一個凱程（不算事件，只是霧裡的人）
const Kaicheng = (() => {
  function fogSpawn(stationId) {
    if (stationId !== '中山' || !FogCity.K) return;
    const K = FogCity.K;
    const n = K.person(NPCS.kaicheng.look, K.pointIn({ kind: 'platform' }), { name: '凱程', role: '在霧裡拍照', behavior: 'pace', speed: .6 });
    n.talk = () => {
      if (!Quests.isDone('sec_kaicheng_fog') && !Quests.isActive('sec_kaicheng_fog')) Quests.secret('sec_kaicheng_fog');
      Quests.emit({ kind: 'talk', npc: 'kaicheng_fog' });
      K.say(n, '喀嚓——<br>「啊，是你。」凱程放下相機。「霧裡的光很漂亮，對吧？我剛剛拍到她了，就在月台盡頭。……這一次，她在對我揮手。」', [{ label: '……', run: () => Dialog.close() }]);
    };
  }
  return { fogSpawn };
})();
