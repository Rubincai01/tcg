// ===== RARITIES =====
const RARITIES = {
  common:    { name:'普通', color:'#AAAAAA', weight:50, sellMult:1, stars:1, bgEmoji:'⬜' },
  uncommon:  { name:'非凡', color:'#55FF55', weight:25, sellMult:2, stars:2, bgEmoji:'🟩' },
  rare:      { name:'稀有', color:'#5555FF', weight:13, sellMult:5, stars:3, bgEmoji:'🟦' },
  epic:      { name:'史诗', color:'#AA00AA', weight:7,  sellMult:12, stars:4, bgEmoji:'🟪' },
  legendary: { name:'传说', color:'#FFAA00', weight:4,  sellMult:30, stars:5, bgEmoji:'🟨' },
  mythic:    { name:'神话', color:'#FF55FF', weight:1,  sellMult:80, stars:6, bgEmoji:'💎' },
};

// ===== CARD TYPE ICONS =====
const TYPE_ICONS = {
  mob:'🐾', block:'🧱', item:'🎒', biome:'🌍', boss:'💀', enchant:'✨'
};

// ===== SCENE BACKGROUNDS for each card =====
// These are small pixel-art elements placed behind each card's emoji
const SCENE_ELEMENTS = {
  // Mobs get terrain
  mob: ['🌲','🌿','🍃','🌾'],
  block: ['⛏️','🪨'],
  item: ['📦','🔲'],
  biome: ['☁️','🌤️'],
  boss: ['🔥','💀','⚡'],
  enchant: ['✨','📖','💫'],
};

// ===== ALL CARDS =====
const ALL_CARDS = [
  // COMMON - Mobs
  {id:'c001',name:'僵尸',emoji:'🧟',type:'mob',rarity:'common',desc:'在黑暗中游荡的不死生物，会在阳光下燃烧。',atk:3,hp:5,scene:'night'},
  {id:'c002',name:'骷髅',emoji:'💀',type:'mob',rarity:'common',desc:'精准的弓箭手，远程射击的不死生物。',atk:4,hp:4,scene:'cave'},
  {id:'c003',name:'蜘蛛',emoji:'🕷️',type:'mob',rarity:'common',desc:'能够攀爬墙壁的节肢生物。',atk:3,hp:4,scene:'cave'},
  {id:'c004',name:'苦力怕',emoji:'💣',type:'mob',rarity:'common',desc:'嘶嘶嘶...BOOM！你的建筑噩梦。',atk:6,hp:3,scene:'night'},
  {id:'c005',name:'猪',emoji:'🐷',type:'mob',rarity:'common',desc:'温驯的粉色动物，掉落猪排。',atk:0,hp:3,scene:'plains'},
  {id:'c006',name:'牛',emoji:'🐄',type:'mob',rarity:'common',desc:'可以用桶挤奶的被动生物。',atk:0,hp:4,scene:'plains'},
  {id:'c007',name:'鸡',emoji:'🐔',type:'mob',rarity:'common',desc:'会下蛋的家禽，掉落羽毛。',atk:0,hp:2,scene:'plains'},
  {id:'c008',name:'羊',emoji:'🐑',type:'mob',rarity:'common',desc:'用剪刀可以获得羊毛。',atk:0,hp:3,scene:'plains'},
  {id:'c009',name:'蝙蝠',emoji:'🦇',type:'mob',rarity:'common',desc:'洞穴中的夜行动物。',atk:0,hp:1,scene:'cave'},
  {id:'c010',name:'鱿鱼',emoji:'🦑',type:'mob',rarity:'common',desc:'水中生物，掉落墨囊。',atk:0,hp:3,scene:'ocean'},
  // COMMON - Blocks
  {id:'c011',name:'泥土',emoji:'🟫',type:'block',rarity:'common',desc:'最基本的方块之一，遍布世界。',atk:0,hp:1,scene:'plains'},
  {id:'c012',name:'石头',emoji:'⬜',type:'block',rarity:'common',desc:'挖掘后变成圆石的坚固方块。',atk:0,hp:3,scene:'cave'},
  {id:'c013',name:'橡木原木',emoji:'🪵',type:'block',rarity:'common',desc:'树木的主干，基础建材。',atk:0,hp:2,scene:'forest'},
  {id:'c014',name:'沙子',emoji:'🟨',type:'block',rarity:'common',desc:'受重力影响的沙漠方块。',atk:0,hp:1,scene:'desert'},
  {id:'c015',name:'砂砾',emoji:'🔘',type:'block',rarity:'common',desc:'有几率掉落燧石。',atk:0,hp:1,scene:'cave'},
  // COMMON - Items
  {id:'c016',name:'木剑',emoji:'🗡️',type:'item',rarity:'common',desc:'最基础的近战武器。',atk:2,hp:0,scene:'craft'},
  {id:'c017',name:'木镐',emoji:'⛏️',type:'item',rarity:'common',desc:'开采石头的基础工具。',atk:1,hp:0,scene:'craft'},
  {id:'c018',name:'面包',emoji:'🍞',type:'item',rarity:'common',desc:'用小麦合成的食物。',atk:0,hp:2,scene:'craft'},
  {id:'c019',name:'火把',emoji:'🔦',type:'item',rarity:'common',desc:'照亮黑暗的基础物品。',atk:0,hp:0,scene:'cave'},
  {id:'c020',name:'工作台',emoji:'🔨',type:'item',rarity:'common',desc:'合成一切的基础设施。',atk:0,hp:0,scene:'craft'},

  // UNCOMMON
  {id:'u001',name:'末影人',emoji:'👤',type:'mob',rarity:'uncommon',desc:'神秘的传送生物，不要直视它的眼睛。',atk:5,hp:8,scene:'night'},
  {id:'u002',name:'狼',emoji:'🐺',type:'mob',rarity:'uncommon',desc:'可以驯服的忠诚伙伴。',atk:4,hp:5,scene:'forest'},
  {id:'u003',name:'铁傀儡',emoji:'🤖',type:'mob',rarity:'uncommon',desc:'村庄的守护者，力量惊人。',atk:7,hp:15,scene:'village'},
  {id:'u004',name:'女巫',emoji:'🧙‍♀️',type:'mob',rarity:'uncommon',desc:'投掷药水的危险敌人。',atk:5,hp:6,scene:'swamp'},
  {id:'u005',name:'掠夺者',emoji:'🏹',type:'mob',rarity:'uncommon',desc:'手持弩的灾厄村民。',atk:5,hp:6,scene:'plains'},
  {id:'u006',name:'铁矿石',emoji:'🪨',type:'block',rarity:'uncommon',desc:'重要的金属矿石。',atk:0,hp:5,scene:'cave'},
  {id:'u007',name:'红石矿石',emoji:'🔴',type:'block',rarity:'uncommon',desc:'MC电路的核心材料。',atk:0,hp:5,scene:'cave'},
  {id:'u008',name:'甘蔗',emoji:'🎋',type:'block',rarity:'uncommon',desc:'造纸和制糖的原料。',atk:0,hp:1,scene:'river'},
  {id:'u009',name:'铁剑',emoji:'⚔️',type:'item',rarity:'uncommon',desc:'可靠的铁制武器。',atk:5,hp:0,scene:'craft'},
  {id:'u010',name:'盾牌',emoji:'🛡️',type:'item',rarity:'uncommon',desc:'格挡攻击的防御装备。',atk:0,hp:5,scene:'craft'},
  {id:'u011',name:'钓鱼竿',emoji:'🎣',type:'item',rarity:'uncommon',desc:'垂钓和拉拽的工具。',atk:1,hp:0,scene:'ocean'},
  {id:'u012',name:'指南针',emoji:'🧭',type:'item',rarity:'uncommon',desc:'永远指向出生点。',atk:0,hp:0,scene:'craft'},
  {id:'u013',name:'猫',emoji:'🐱',type:'mob',rarity:'uncommon',desc:'驯服后可吓跑苦力怕。',atk:2,hp:3,scene:'village'},
  {id:'u014',name:'海豚',emoji:'🐬',type:'mob',rarity:'uncommon',desc:'友好的海洋生物，给予速度增益。',atk:2,hp:4,scene:'ocean'},
  {id:'u015',name:'平原群系',emoji:'🌾',type:'biome',rarity:'uncommon',desc:'广阔的草地，村庄常见于此。',atk:0,hp:0,scene:'plains'},

  // RARE
  {id:'r001',name:'烈焰人',emoji:'🔥',type:'mob',rarity:'rare',desc:'下界要塞的火焰守卫。',atk:6,hp:8,scene:'nether'},
  {id:'r002',name:'恶魂',emoji:'👻',type:'mob',rarity:'rare',desc:'下界中漂浮的巨型幽灵。',atk:8,hp:6,scene:'nether'},
  {id:'r003',name:'守卫者',emoji:'🐡',type:'mob',rarity:'rare',desc:'海底神殿的激光守卫。',atk:6,hp:10,scene:'ocean'},
  {id:'r004',name:'劫掠兽',emoji:'🦏',type:'mob',rarity:'rare',desc:'灾厄村民骑乘的巨兽。',atk:8,hp:12,scene:'plains'},
  {id:'r005',name:'钻石矿石',emoji:'💎',type:'block',rarity:'rare',desc:'最珍贵的矿石之一！',atk:0,hp:8,scene:'deepcave'},
  {id:'r006',name:'绿宝石矿石',emoji:'🟢',type:'block',rarity:'rare',desc:'极其稀有，仅在山脉生成。',atk:0,hp:7,scene:'mountain'},
  {id:'r007',name:'黑曜石',emoji:'🖤',type:'block',rarity:'rare',desc:'极其坚硬，通往下界的钥匙。',atk:0,hp:20,scene:'cave'},
  {id:'r008',name:'钻石剑',emoji:'💠',type:'item',rarity:'rare',desc:'锋利而耐久的顶级武器。',atk:8,hp:0,scene:'craft'},
  {id:'r009',name:'附魔台',emoji:'📖',type:'item',rarity:'rare',desc:'用来附魔装备的神奇方块。',atk:0,hp:0,scene:'enchant'},
  {id:'r010',name:'末影珍珠',emoji:'🟣',type:'item',rarity:'rare',desc:'投掷后瞬间传送的神秘珠子。',atk:0,hp:0,scene:'night'},
  {id:'r011',name:'蘑菇岛群系',emoji:'🍄',type:'biome',rarity:'rare',desc:'稀有的蘑菇岛，不会生成怪物。',atk:0,hp:0,scene:'mushroom'},
  {id:'r012',name:'锋利附魔',emoji:'✨',type:'enchant',rarity:'rare',desc:'增加近战伤害。',atk:3,hp:0,scene:'enchant'},

  // EPIC
  {id:'e001',name:'凋灵骷髅',emoji:'🦴',type:'mob',rarity:'epic',desc:'下界要塞中手持石剑的危险生物。',atk:7,hp:10,scene:'nether'},
  {id:'e002',name:'远古守卫者',emoji:'🐙',type:'mob',rarity:'epic',desc:'海底神殿的BOSS级生物。',atk:8,hp:15,scene:'ocean'},
  {id:'e003',name:'唤魔者',emoji:'🧙',type:'mob',rarity:'epic',desc:'能召唤尖牙的强大灾厄村民。',atk:9,hp:8,scene:'mansion'},
  {id:'e004',name:'潜影贝',emoji:'🐚',type:'mob',rarity:'epic',desc:'末地城的守卫，使目标漂浮。',atk:5,hp:10,scene:'end'},
  {id:'e005',name:'信标',emoji:'🏮',type:'block',rarity:'epic',desc:'提供强力增益效果的光柱方块。',atk:0,hp:0,scene:'beacon'},
  {id:'e006',name:'下界合金块',emoji:'⬛',type:'block',rarity:'epic',desc:'下界最坚固的材料。',atk:0,hp:30,scene:'nether'},
  {id:'e007',name:'鞘翅',emoji:'🪂',type:'item',rarity:'epic',desc:'让你在空中滑翔的翅膀！',atk:0,hp:0,scene:'end'},
  {id:'e008',name:'三叉戟',emoji:'🔱',type:'item',rarity:'epic',desc:'可投掷的强力水战武器。',atk:9,hp:0,scene:'ocean'},
  {id:'e009',name:'不死图腾',emoji:'🗿',type:'item',rarity:'epic',desc:'防止一次死亡的珍贵物品。',atk:0,hp:0,scene:'mansion'},
  {id:'e010',name:'末地群系',emoji:'🌌',type:'biome',rarity:'epic',desc:'由末影石和黑曜石构成的异世界。',atk:0,hp:0,scene:'end'},

  // LEGENDARY
  {id:'l001',name:'末影龙',emoji:'🐉',type:'boss',rarity:'legendary',desc:'末地的最终BOSS，击败她才能通关！',atk:12,hp:30,scene:'end'},
  {id:'l002',name:'凋灵',emoji:'💀',type:'boss',rarity:'legendary',desc:'三头凋灵，召唤后的毁灭之王。',atk:10,hp:25,scene:'nether'},
  {id:'l003',name:'下界合金剑',emoji:'🗡️',type:'item',rarity:'legendary',desc:'游戏中最强的近战武器。',atk:12,hp:0,scene:'nether'},
  {id:'l004',name:'龙蛋',emoji:'🥚',type:'item',rarity:'legendary',desc:'击败末影龙后获得的战利品。',atk:0,hp:0,scene:'end'},
  {id:'l005',name:'附魔金苹果',emoji:'🍎',type:'item',rarity:'legendary',desc:'传说中的上帝苹果，极其稀有。',atk:0,hp:0,scene:'treasure'},
  {id:'l006',name:'命令方块',emoji:'📟',type:'block',rarity:'legendary',desc:'能执行命令的神秘方块。',atk:0,hp:0,scene:'creative'},

  // MYTHIC
  {id:'m001',name:'HIM',emoji:'👁️',type:'boss',rarity:'mythic',desc:'传说中的存在...白色眼睛在黑暗中注视。',atk:99,hp:99,scene:'void'},
  {id:'m002',name:'创世之剑',emoji:'⚡',type:'item',rarity:'mythic',desc:'传说可以一击斩杀任何生物的神器。',atk:50,hp:0,scene:'void'},
  {id:'m003',name:'世界种子',emoji:'🌍',type:'item',rarity:'mythic',desc:'创造世界的核心代码，蕴含无限力量。',atk:0,hp:0,scene:'void'},
  {id:'m004',name:'虚空之心',emoji:'🕳️',type:'item',rarity:'mythic',desc:'来自虚空的神秘核心，吞噬一切。',atk:0,hp:0,scene:'void'},
];

// ===== PACKS =====
const PACKS = [
  {id:'basic',name:'基础卡包',icon:'📦',desc:'包含 5 张卡牌\n适合新手收集',price:100,priceType:'gold',cardCount:5,pool:['common','uncommon','rare'],weights:{common:65,uncommon:25,rare:10},guaranteed:null,level:1,theme:'green'},
  {id:'advanced',name:'进阶卡包',icon:'🎁',desc:'包含 5 张卡牌\n保底一张稀有以上',price:300,priceType:'gold',cardCount:5,pool:['common','uncommon','rare','epic'],weights:{common:45,uncommon:30,rare:18,epic:7},guaranteed:'rare',level:3,theme:'blue'},
  {id:'premium',name:'高级卡包',icon:'💫',desc:'包含 5 张卡牌\n保底一张史诗以上',price:800,priceType:'gold',cardCount:5,pool:['uncommon','rare','epic','legendary'],weights:{uncommon:35,rare:35,epic:22,legendary:8},guaranteed:'epic',level:5,theme:'purple'},
  {id:'nether',name:'下界卡包',icon:'🔥',desc:'包含 5 张下界主题卡\n高几率出稀有',price:500,priceType:'gold',cardCount:5,pool:['common','uncommon','rare','epic'],weights:{common:30,uncommon:35,rare:25,epic:10},guaranteed:'uncommon',level:4,theme:'red'},
  {id:'diamond',name:'钻石卡包',icon:'💎',desc:'包含 3 张卡牌\n保底一张传说！',price:5,priceType:'diamond',cardCount:3,pool:['rare','epic','legendary','mythic'],weights:{rare:30,epic:35,legendary:28,mythic:7},guaranteed:'legendary',level:8,theme:'diamond'},
  {id:'mythic',name:'神话卡包',icon:'🌟',desc:'包含 3 张卡牌\n有机会获得神话！',price:15,priceType:'diamond',cardCount:3,pool:['epic','legendary','mythic'],weights:{epic:45,legendary:35,mythic:20},guaranteed:'legendary',level:10,theme:'mythic'},
];

// ===== GRADING AGENCIES =====
const GRADING_AGENCIES = [
  {
    id:'psa',
    name:'PSA',
    fullName:'Professional Sports Authenticator',
    desc:'全球最知名的卡牌评级机构，标准严格，市场认可度最高。',
    color:'#cc0000',
    costBase:200,
    costMult:1.5, // multiplied by rarity sellMult
    timeBase:30,  // seconds
    timeMult:1.0,
    gradeBonus:0, // extra grade chance
    valueMult:2.5, // how much grading multiplies value
    maxGrade:10,
    gradeLabels:{10:'Gem Mint',9:'Mint',8:'NM-MT',7:'Near Mint',6:'EX-MT',5:'Excellent',4:'VG-EX',3:'Very Good',2:'Good',1:'Fair'},
  },
  {
    id:'cgc',
    name:'CGC',
    fullName:'Certified Guaranty Company',
    desc:'以严谨和一致性著称，评分体系精细到0.5分。',
    color:'#0066cc',
    costBase:150,
    costMult:1.2,
    timeBase:25,
    timeMult:0.9,
    gradeBonus:0.5,
    valueMult:2.2,
    maxGrade:10,
    gradeLabels:{10:'Pristine',9.5:'Gem Mint',9:'Mint',8.5:'NM/Mint',8:'NM',7.5:'NM-',7:'Near Mint',6:'EX-NM'},
  },
  {
    id:'bgs',
    name:'BGS',
    fullName:'Beckett Grading Services',
    desc:'子评分系统(居中/边角/表面/边缘)详尽，黑标10分极具收藏价值。',
    color:'#cc9900',
    costBase:250,
    costMult:1.8,
    timeBase:35,
    timeMult:1.1,
    gradeBonus:-0.3,
    valueMult:3.0, // Higher value because stricter
    maxGrade:10,
    gradeLabels:{10:'Black Label',9.5:'Gem Mint',9:'Mint',8.5:'NM-Mint+',8:'NM-Mint',7.5:'Near Mint+',7:'Near Mint'},
    hasSubGrades:true,
  },
];

// ===== CUSTOMER DATA =====
const CUSTOMER_NAMES = ['史蒂夫','亚历克斯','村民甲','流浪商人','铁匠','图书管理员','牧羊人','渔夫','药水师','附魔师','矿工老王','建筑师小张','探险家','红石工程师','农场主','新手玩家','MC老玩家','钻石大佬'];
const CUSTOMER_AVATARS = ['👨‍🌾','👩‍🔬','🧑‍💼','👴','👨‍🏫','👩‍🎨','🧑‍🍳','👨‍⚕️','🧝','🧙‍♂️','⛏️','🏗️','🗺️','🔧','🌾','😊','😎','💎'];

// ===== UPGRADES =====
const UPGRADES = [
  {id:'shelfSize',name:'扩展货架',icon:'📦',desc:'增加货架槽位数量',maxLevel:6,baseCost:500,costMult:2,effect:'+1 槽位/级'},
  {id:'customerPatience',name:'舒适环境',icon:'🛋️',desc:'顾客等待时间增加',maxLevel:5,baseCost:300,costMult:1.8,effect:'+5秒/级'},
  {id:'reputation',name:'店铺招牌',icon:'🏮',desc:'吸引更多有钱顾客',maxLevel:5,baseCost:800,costMult:2.2,effect:'顾客预算+20%/级'},
  {id:'packDiscount',name:'批发渠道',icon:'🤝',desc:'购买卡包享折扣',maxLevel:5,baseCost:600,costMult:2,effect:'-5%价格/级'},
  {id:'luckyCharm',name:'幸运护符',icon:'🍀',desc:'开包时更容易出稀有',maxLevel:5,baseCost:1000,costMult:2.5,effect:'稀有+2%/级'},
  {id:'autoSell',name:'自动售货',icon:'🤖',desc:'自动向顾客推荐卡牌',maxLevel:3,baseCost:2000,costMult:3,effect:'自动匹配'},
];

// ===== ACHIEVEMENTS =====
const ACHIEVEMENTS = [
  {id:'first_pack',name:'初次开包',icon:'📦',desc:'开启你的第一个卡包',check:()=>GS.totalPacksOpened>=1,reward:50},
  {id:'pack_10',name:'卡包猎人',icon:'🎁',desc:'累计开启10个卡包',check:()=>GS.totalPacksOpened>=10,reward:200},
  {id:'pack_50',name:'卡包狂热',icon:'💫',desc:'累计开启50个卡包',check:()=>GS.totalPacksOpened>=50,reward:500},
  {id:'collect_10',name:'初级收藏家',icon:'🃏',desc:'收集10种不同卡牌',check:()=>Object.keys(GS.cards).length>=10,reward:100},
  {id:'collect_30',name:'高级收藏家',icon:'📚',desc:'收集30种不同卡牌',check:()=>Object.keys(GS.cards).length>=30,reward:500},
  {id:'collect_all',name:'大师收藏家',icon:'👑',desc:'收集全部卡牌',check:()=>Object.keys(GS.cards).length>=ALL_CARDS.length,reward:5000},
  {id:'first_leg',name:'传说降临',icon:'⭐',desc:'获得第一张传说卡',check:()=>ALL_CARDS.filter(c=>c.rarity==='legendary').some(c=>GS.cards[c.id]),reward:300},
  {id:'first_myth',name:'神话诞生',icon:'🌟',desc:'获得第一张神话卡',check:()=>ALL_CARDS.filter(c=>c.rarity==='mythic').some(c=>GS.cards[c.id]),reward:1000},
  {id:'first_sale',name:'首次交易',icon:'🏪',desc:'在牌店卖出第一张卡',check:()=>GS.totalCardsSold>=1,reward:50},
  {id:'sales_10',name:'精明商人',icon:'💰',desc:'累计卖出10张卡牌',check:()=>GS.totalCardsSold>=10,reward:300},
  {id:'sales_50',name:'卡牌大亨',icon:'🏦',desc:'累计卖出50张卡牌',check:()=>GS.totalCardsSold>=50,reward:1000},
  {id:'gold_5k',name:'富甲一方',icon:'💰',desc:'累计赚取5000金币',check:()=>GS.totalGoldEarned>=5000,reward:500},
  {id:'level_5',name:'小有名气',icon:'📈',desc:'达到等级5',check:()=>GS.level>=5,reward:200},
  {id:'level_10',name:'声名远扬',icon:'🏆',desc:'达到等级10',check:()=>GS.level>=10,reward:1000},
  // Grading achievements
  {id:'first_grade',name:'初次评级',icon:'🏅',desc:'提交第一张卡牌进行评级',check:()=>GS.totalCardsGraded>=1,reward:100},
  {id:'grade_10',name:'评级达人',icon:'📊',desc:'累计评级10张卡牌',check:()=>GS.totalCardsGraded>=10,reward:500},
  {id:'perfect_10',name:'完美10分',icon:'💯',desc:'获得一张满分10分的评级卡',check:()=>GS.gradedCards&&GS.gradedCards.some(g=>g.grade>=10),reward:2000},
  {id:'bgs_black',name:'BGS黑标',icon:'🏴',desc:'获得BGS黑标10分评级',check:()=>GS.gradedCards&&GS.gradedCards.some(g=>g.agency==='bgs'&&g.grade>=10),reward:3000},
];
