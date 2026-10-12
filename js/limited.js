/* 車站限定小舖：每一站賣自己的在地小吃、紀念品，少數站有特別的道具
 * - 非付費區靠牆的推車（{站名}限定），只有那一站買得到；第一次買到會記進收藏（col.limited）
 * - 道具：象山登山杖（走路、跑步快 8%）、龍山寺平安符（迷霧之城擋一次傷害）、台北車站限定悠遊卡（車資 9 折）
 * - 收集 15 種限定商品：稱號「限定收藏家」
 */
const Limited = (() => {
  // [id, 名稱, 圖示, 價格, 種類, 說明, 吃／喝]
  const SHOPS = {
    台北車站: { name: '台北車站限定', color: '#c8102e', items: [['ltd_bento', '台鐵排骨便當', '🍱', 100, 'use', '圓形便當盒，排骨、滷蛋、酸菜，一打開就是火車的味道。', '吃'], ['ltd_card', '台北車站限定悠遊卡', '💳', 300, 'tool', '印著大廳黑白格地板的悠遊卡。帶在身上，搭捷運的車資打 9 折。']] },
    淡水: { name: '淡水老街限定', color: '#e3002c', items: [['ltd_agei', '淡水阿給', '🥟', 60, 'use', '油豆腐包冬粉，淋上甜辣醬。', '吃'], ['ltd_ironegg', '淡水鐵蛋', '🥚', 80, 'col', '又黑又硬，越嚼越香的滷蛋。']] },
    新北投: { name: '北投溫泉限定', color: '#d38ca8', items: [['ltd_mantou', '溫泉饅頭', '🍙', 45, 'use', '用溫泉蒸氣蒸的饅頭，帶一點點硫磺香。', '吃'], ['ltd_soap', '北投硫磺皂', '🧼', 120, 'col', '淡黃色的手工皂，洗起來有溫泉的味道。']] },
    北投: { name: '北投市場限定', color: '#e3002c', items: [['ltd_ricecake', '北投市場米糕', '🍚', 55, 'use', '市場裡排隊排到轉角的米糕。', '吃']] },
    士林: { name: '士林夜市限定', color: '#e3002c', items: [['ltd_bigcake', '大餅包小餅', '🌯', 60, 'use', '酥餅包在薄餅裡，咬下去喀滋喀滋。', '吃'], ['ltd_rosecard', '官邸玫瑰書籤', '🌹', 70, 'col', '壓了一片玫瑰花瓣的書籤。']] },
    劍潭: { name: '劍潭夜市限定', color: '#e3002c', items: [['ltd_chicken', '巨無霸雞排', '🍗', 75, 'use', '比臉還大的雞排，要切嗎？不切。', '吃']] },
    圓山: { name: '圓山花博限定', color: '#e3002c', items: [['ltd_seeds', '花博花種包', '🌼', 50, 'col', '一小包混合花種，背面寫著「種在看得到陽光的地方」。']] },
    中山: { name: '中山選物限定', color: '#008659', items: [['ltd_coffee', '中山手沖濾掛', '☕', 90, 'use', '巷子裡咖啡館自己烘的豆子。', '喝'], ['ltd_book', '地下書街選書', '📕', 220, 'col', '書店老闆推薦的一本舊書，扉頁寫著別人的名字。']] },
    雙連: { name: '雙連朝市限定', color: '#e3002c', items: [['ltd_douhua', '雙連豆花', '🍮', 50, 'use', '花生、粉圓、薑汁，冬天熱的夏天冰的。', '吃']] },
    西門: { name: '西門町限定', color: '#0070bd', items: [['ltd_mianxian', '大腸麵線', '🍜', 70, 'use', '站著吃的麵線，沒有椅子是傳統。', '吃'], ['ltd_redhouse', '紅樓紀念磁鐵', '🧲', 90, 'col', '八角形的紅磚小樓，貼在冰箱上剛剛好。']] },
    龍山寺: { name: '龍山寺限定', color: '#0070bd', items: [['fog_charm', '平安符', '🧧', 180, null, null], ['ltd_incense', '艋舺香包', '🪷', 80, 'col', '繡著蓮花的小香包，聞起來淡淡的檀香。']] },
    北門: { name: '北門限定', color: '#008659', items: [['ltd_trainmodel', '蒸汽火車模型', '🚂', 280, 'col', '黑色的小火車頭，輪子還會轉。']] },
    中正紀念堂: { name: '中正紀念堂限定', color: '#e3002c', items: [['ltd_guard', '衛兵交接公仔', '💂', 160, 'col', '槍轉一圈也不會掉的那種精神。']] },
    古亭: { name: '古亭文學限定', color: '#f8b61c', items: [['ltd_poem', '紀州庵詩箋', '📜', 60, 'col', '印著一首短詩的信紙，適合寫給很久沒聯絡的人。']] },
    東門: { name: '東門永康街限定', color: '#e3002c', items: [['ltd_xlb', '小籠包', '🥟', 120, 'use', '十八摺，湯汁燙口，要先咬一個小洞。', '吃'], ['ltd_mangoice', '芒果冰', '🥭', 150, 'use', '一整顆芒果切成的山。', '吃']] },
    大安: { name: '大安森林公園限定', color: '#c48c31', items: [['ltd_leaf', '森林公園葉片書籤', '🍃', 50, 'col', '一片真的落葉做的書籤。']] },
    忠孝復興: { name: '東區限定', color: '#c48c31', items: [['ltd_bag', '週年慶購物袋', '🛍️', 90, 'col', '週年慶限定花色，大家搶著要的那一款。']] },
    忠孝敦化: { name: '敦化林蔭限定', color: '#0070bd', items: [['ltd_latte', '街角拿鐵', '🥛', 110, 'use', '綠蔭下的那間咖啡館。', '喝']] },
    '台北101/世貿': { name: '101 限定', color: '#e3002c', items: [['ltd_101card', '101 觀景台明信片', '🏙️', 80, 'col', '從 89 樓往下看的台北，雲在腳下。'], ['ltd_101key', '101 鑰匙圈', '🗝️', 150, 'col', '竹節造型的小鑰匙圈。']] },
    市政府: { name: '信義區限定', color: '#0070bd', items: [['ltd_xmas', '信義耶誕燈飾吊飾', '🎄', 120, 'col', '每年冬天廣場上那棵大樹的縮小版。']] },
    象山: { name: '象山步道限定', color: '#e3002c', items: [['hikestick', '象山登山杖', '🦯', 260, 'tool', '可以伸縮的登山杖。帶在身上，走路、跑步都快一點（+8%）。']] },
    動物園: { name: '動物園限定', color: '#c48c31', items: [['ltd_panda', '圓仔玩偶', '🐼', 240, 'col', '軟軟的熊貓玩偶，抱著就不想放手。'], ['ltd_zooicecream', '動物造型冰棒', '🍦', 45, 'use', '咬掉耳朵之前會猶豫一下。', '吃']] },
    木柵: { name: '木柵限定', color: '#c48c31', items: [['ltd_tieguanyin', '木柵鐵觀音', '🍵', 260, 'col', '焙火重、回甘長的老茶。']] },
    公館: { name: '公館限定', color: '#008659', items: [['ltd_pepperbun', '公館胡椒餅', '🫓', 60, 'use', '炭爐烤的，小心燙，蔥很多。', '吃'], ['ltd_tote', '台大帆布袋', '👜', 180, 'col', '印著椰林大道的帆布袋。']] },
    景美: { name: '景美夜市限定', color: '#008659', items: [['ltd_tofu', '臭豆腐', '🧆', 60, 'use', '外酥內嫩，泡菜要多。', '吃']] },
    新店: { name: '碧潭限定', color: '#008659', items: [['ltd_swanboat', '碧潭天鵝船模型', '🦢', 160, 'col', '白色的天鵝船，可以浮在洗臉台上。']] },
    南勢角: { name: '緬甸街限定', color: '#f8b61c', items: [['ltd_milktea', '緬甸奶茶', '🧋', 50, 'use', '用煉乳調的奶茶，甜到心裡。', '喝']] },
    板橋: { name: '板橋限定', color: '#0070bd', items: [['ltd_lingarden', '林家花園書籤', '🏯', 70, 'col', '園林窗花造型的金屬書籤。']] },
    新莊: { name: '新莊老街限定', color: '#f8b61c', items: [['ltd_xinzhuangcake', '新莊老餅', '🥮', 90, 'use', '老餅舖的鹹光餅，一串掛在脖子上。', '吃']] },
    三重: { name: '三重限定', color: '#f8b61c', items: [['ltd_puppet', '布袋戲偶', '🎎', 300, 'col', '小小的掌中戲偶，手伸進去就會動。']] },
    南港展覽館: { name: '展覽館限定', color: '#0070bd', items: [['ltd_badge', '展覽限定徽章', '📛', 80, 'col', '每一檔展覽只發一次的徽章。']] },
    松山機場: { name: '松山機場限定', color: '#c48c31', items: [['ltd_plane', '客機模型', '✈️', 240, 'col', '機身漆著台灣的島嶼輪廓。']] },
    松山: { name: '饒河夜市限定', color: '#008659', items: [['ltd_pepperbun2', '饒河胡椒餅', '🫓', 60, 'use', '夜市入口排隊的那攤。', '吃']] },
  };
  // 建立道具
  for (const [st, shop] of Object.entries(SHOPS)) for (const it of shop.items) {
    const [id, name, icon, price, cat, desc, eat] = it;
    if (ITEMS[id] && !cat) { ITEMS[id].price = ITEMS[id].price || price; continue; }   // 已經有的道具（平安符）：只在這裡也買得到
    ITEMS[id] = Object.assign({ name, icon, price, cat, desc, limited: st }, eat ? { eat, xp: 30 } : {});
  }
  const shopOf = st => SHOPS[st] || null;
  const ids = () => Object.values(SHOPS).flatMap(s => s.items.map(i => i[0])).filter(id => ITEMS[id] && ITEMS[id].limited);
  const got = () => Object.keys((Game.state.col || {}).limited || {}).length;

  function menu(st) {
    const shop = SHOPS[st], s = Game.state; if (!shop) return;
    const seen = (s.col = s.col || {}).limited = s.col.limited || {};
    Dialog.show({ name: shop.name, role: `${st}${st.endsWith('站') ? '' : '站'}・只有這裡買得到` }, `悠遊卡餘額 NT$ ${s.money}。限定收藏 ${got()} / ${ids().length}。`, shop.items.map(([id]) => {
      const it = ITEMS[id], price = Progress.price(it.price), owned = it.cat === 'tool' && s.inv[id] > 0;
      return {
        label: `${it.icon} ${it.name}　NT$ ${price}${owned ? '（已擁有）' : seen[id] ? '' : '　🆕'}`, disabled: owned || s.money < price,
        run: () => {
          s.money -= price; s.inv[id] = (s.inv[id] || 0) + 1;
          const first = it.limited && !seen[id]; if (it.limited) seen[id] = 1;
          saveState(); updateHud(); Sound.gate();
          toast(`<b>買了 ${it.icon} ${it.name}</b><span>${esc(it.desc)}${first ? `<br>限定收藏 ${got()} / ${ids().length}` : ''}</span>`, first ? 'level' : '');
          if (id === 'hikestick' && typeof Progress !== 'undefined' && Progress.applySpeed) Progress.applySpeed();
          if (typeof questEvent === 'function') questEvent({ kind: 'buy', item: id });
          menu(st);
        },
      };
    }).concat([{ label: '離開', run: () => Dialog.close() }]));
  }

  // 車資：帶著限定悠遊卡打 9 折
  const _fare = Economy.fare;
  Economy.fare = (a, b) => { const f = _fare(a, b); const s = Game.state; return s && s.inv && s.inv.ltd_card > 0 ? Math.max(1, Math.round(f * .9)) : f; };

  TITLES.push({ id: 't_limited', name: '限定收藏家', cond: s => Object.keys((s.col || {}).limited || {}).length >= 15 });
  return { SHOPS, shopOf, menu, ids, got };
})();
