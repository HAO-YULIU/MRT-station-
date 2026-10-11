/* 換裝：髮型、髮色、上衣、下身、鞋子、包包、飾品
 * who：只有某位主角能穿（沒寫就兩人都可以）
 * def：該主角一開始就有、預設穿著的
 * shop：在哪些站的商店買得到；event：限時活動的獎勵（不賣）
 */
const OUTFIT_SLOTS = [['hair', '髮型'], ['hairColor', '髮色'], ['top', '上衣'], ['bottom', '下身'], ['shoes', '鞋子'], ['bag', '包包'], ['acc', '飾品']];

const OUTFITS = {
  // 髮型（台北車站地下街髮廊）
  xy_wolf: { slot: 'hair', name: '層次狼尾', who: 'xuanyu', def: true },
  xy_short: { slot: 'hair', name: '清爽短髮', who: 'xuanyu', price: 350, style: 'short' },
  ay_long: { slot: 'hair', name: '長捲髮', who: 'aiyun', def: true },
  ay_pony: { slot: 'hair', name: '高馬尾', who: 'aiyun', price: 400, style: 'pony' },
  ay_bun: { slot: 'hair', name: '丸子頭', who: 'aiyun', price: 400, style: 'bun' },
  // 髮色
  hc_natural: { slot: 'hairColor', name: '原本的髮色', def: true },
  hc_brown: { slot: 'hairColor', name: '深棕', price: 300, color: '#4a2a1a' },
  hc_milk: { slot: 'hairColor', name: '奶茶色', price: 450, color: '#9a7458' },
  hc_ash: { slot: 'hairColor', name: '霧灰', price: 450, color: '#77726e' },
  hc_wine: { slot: 'hairColor', name: '酒紅', price: 450, color: '#5c1a24' },
  hc_blue: { slot: 'hairColor', name: '霧藍', price: 500, color: '#33456e' },
  // 上衣
  xy_sweater: { slot: 'top', name: '白色波浪條紋毛衣', who: 'xuanyu', def: true },
  ay_halter: { slot: 'top', name: '黑色無袖高領上衣', who: 'aiyun', def: true },
  top_tee: { slot: 'top', name: '白色長袖 T', price: 290, color: '#f3f3f1' },
  top_hoodie: { slot: 'top', name: '灰色帽 T', price: 690, color: '#85888d', hood: true },
  top_flannel: { slot: 'top', name: '紅黑格紋襯衫', price: 790, color: '#a8262c', pattern: 'check', accent: '#1b1b1d' },
  top_cardigan: { slot: 'top', name: '奶茶色針織開衫', price: 890, color: '#c8a888', pattern: 'knit' },
  top_varsity: { slot: 'top', name: '深藍棒球外套', price: 1290, color: '#1f2d55', sleeves: '#efe9dc' },
  top_uniform: { slot: 'top', name: '高中制服襯衫', price: 490, color: '#f6f6f4', pattern: 'uniform', accent: '#1f3a6b' },
  top_wine: { slot: 'top', name: '酒紅無袖針織', who: 'aiyun', price: 590, color: '#6a1c28', pattern: 'rib', sleeveless: true },
  // 下身
  xy_jeans: { slot: 'bottom', name: '藍色直筒牛仔褲', who: 'xuanyu', def: true },
  ay_flare: { slot: 'bottom', name: '刷色喇叭牛仔褲', who: 'aiyun', def: true },
  bot_black: { slot: 'bottom', name: '黑色寬褲', price: 690, color: '#1d1d20' },
  bot_khaki: { slot: 'bottom', name: '卡其工作褲', price: 790, color: '#b49c74' },
  bot_light: { slot: 'bottom', name: '淺色牛仔褲', price: 890, color: '#8fa7c4', pattern: 'denim' },
  bot_pleat: { slot: 'bottom', name: '深藍百褶裙', who: 'aiyun', price: 690, color: '#2b2f3a', skirt: true },
  bot_plaid: { slot: 'bottom', name: '格紋短裙', who: 'aiyun', price: 790, color: '#6a5a48', pattern: 'check', accent: '#2a2420', skirt: true },
  // 鞋子
  xy_sneaker: { slot: 'shoes', name: '白色厚底球鞋', who: 'xuanyu', def: true },
  ay_boots: { slot: 'shoes', name: '黑色亮面短靴', who: 'aiyun', def: true },
  shoe_white: { slot: 'shoes', name: '白色球鞋', price: 1290, color: '#f4f4f1' },
  shoe_black: { slot: 'shoes', name: '黑色皮鞋', price: 1490, color: '#141212', rough: .3 },
  shoe_red: { slot: 'shoes', name: '紅色帆布鞋', price: 990, color: '#b8262e' },
  shoe_beige: { slot: 'shoes', name: '米色休閒鞋', price: 1190, color: '#d8c8a8' },
  // 包包
  bag_none: { slot: 'bag', name: '不背包包', def: 'xuanyu', free: true },
  ay_cross: { slot: 'bag', name: '黑色側背包', who: 'aiyun', def: true },
  bag_cross: { slot: 'bag', name: '黑色斜背包', who: 'xuanyu', price: 990, color: '#18181a' },
  bag_backpack: { slot: 'bag', name: '後背包', price: 1290, color: '#2c3e50' },
  bag_tote: { slot: 'bag', name: '帆布托特包', price: 590, color: '#d8c9a8' },
  // 飾品
  acc_none: { slot: 'acc', name: '不戴', def: true, free: true },
  acc_cap: { slot: 'acc', name: '黑色棒球帽', price: 590, color: '#1c1c20' },
  acc_bucket: { slot: 'acc', name: '漁夫帽', price: 590, color: '#e6dcc6' },
  acc_beret: { slot: 'acc', name: '酒紅貝雷帽', price: 690, color: '#6e2230' },
  acc_glasses: { slot: 'acc', name: '圓框眼鏡', price: 890 },
  acc_headphones: { slot: 'acc', name: '耳罩式耳機', price: 2490, color: '#e8e8e6' },
  acc_pumpkin: { slot: 'acc', name: '南瓜髮箍', event: 'event_halloween' },
  acc_santa: { slot: 'acc', name: '聖誕帽', event: 'event_xmas' },
  acc_lantern: { slot: 'acc', name: '小燈籠髮夾', event: 'event_lunar' },
};

// 哪裡買得到
const OUTFIT_SHOPS = {
  台北車站: ['xy_short', 'ay_pony', 'ay_bun', 'hc_brown', 'hc_milk', 'hc_ash', 'hc_wine', 'hc_blue'],
  西門: ['top_tee', 'top_hoodie', 'top_flannel', 'top_wine', 'bot_black', 'bot_khaki', 'bot_pleat', 'acc_cap', 'acc_bucket'],
  忠孝復興: ['shoe_white', 'shoe_black', 'shoe_red', 'shoe_beige', 'bag_cross', 'bag_backpack', 'bag_tote'],
  市政府: ['top_cardigan', 'top_varsity', 'bot_light', 'bot_plaid', 'acc_headphones'],
  中山: ['acc_beret', 'acc_glasses', 'top_cardigan'],
  板橋: ['top_uniform', 'bot_pleat', 'shoe_white', 'bag_backpack'],
};

const Outfits = {
  fits: (id, char) => { const o = OUTFITS[id]; return !!o && (!o.who || o.who === char); },
  isDefault(id, char) { const o = OUTFITS[id]; return !!o && (o.def === true || o.def === char) && (!o.who || o.who === char); },
  // 補上沒指定的部位（用預設）
  wear(char, w = {}) {
    const out = {};
    for (const [slot] of OUTFIT_SLOTS) {
      const cur = w[slot];
      out[slot] = cur && OUTFITS[cur] && Outfits.fits(cur, char) ? cur
        : Object.keys(OUTFITS).find(id => OUTFITS[id].slot === slot && Outfits.isDefault(id, char)) || 'acc_none';
    }
    return out;
  },
  // 主角擁有的（含預設）
  owned(char, own = {}) {
    return Object.keys(OUTFITS).filter(id => Outfits.fits(id, char) && (Outfits.isDefault(id, char) || OUTFITS[id].free || own[id]));
  },
};
