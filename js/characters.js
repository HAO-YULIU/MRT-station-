/* 主角：軒宇、愛紜（皆為 17 歲高中生）
 * 立繪使用真人照片去背（assets/characters/*.webp），畫面上以前景半身呈現。
 */
const CHARACTERS = {
  xuanyu: {
    id: 'xuanyu', name: '軒宇', en: 'Xuanyu', gender: '男', age: 17,
    role: '高中二年級',
    bio: '總是背著那個米白色側背包。喜歡在巷子裡亂走，說每條老巷都有自己的出口。',
    img: 'assets/characters/xuanyu.webp', w: 649, h: 1100,
  },
  aiyun: {
    id: 'aiyun', name: '愛紜', en: 'Aiyun', gender: '女', age: 17,
    role: '高中二年級',
    bio: '記得每一個日子發生過的事。最喜歡在公園野餐，卻說最近公園的霧一直散不掉。',
    img: 'assets/characters/aiyun.webp', w: 592, h: 1100,
  },
};

const CharArt = {
  // HTML 立繪
  img(charId, cls = '') {
    const c = CHARACTERS[charId];
    return `<img class="char-img ${cls}" src="${c.img}" alt="${c.name}" draggable="false">`;
  },
  // 嵌入場景 SVG 的立繪：以 cx 為中心，底部對齊 bottom，高度 height
  svgImage(charId, cx, bottom, height) {
    const c = CHARACTERS[charId];
    const w = height * c.w / c.h;
    return `<image href="${c.img}" x="${cx - w / 2}" y="${bottom - height}" width="${w}" height="${height}" preserveAspectRatio="xMidYMax meet"/>`;
  },
};
