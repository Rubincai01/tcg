// ===== GAME STATE =====
const GS = {
  gold:500, diamonds:10, level:1, xp:0, xpToNext:100, reputation:0,
  totalPacksOpened:0, totalCardsSold:0, totalGoldEarned:0, totalCardsGraded:0,
  cards:{}, newCards:new Set(), shopOpen:false,
  shelf:[], currentCustomer:null, customerTimer:null, customerTimeout:null,
  dailyPackClaimed:false, lastDailyDate:null,
  upgrades:{shelfSize:0,customerPatience:0,reputation:0,packDiscount:0,luckyCharm:0,autoSell:0},
  achievements:{},
  // Grading system
  gradingQueue:[], // {cardId, agency, startTime, duration, grade (set when done)}
  gradedCards:[],   // {cardId, agency, grade, subGrades, timestamp, serialNo}
  gradingSerial:1000,
};

// ===== UTILS =====
function toast(msg,dur=3000){const c=document.getElementById('toastContainer');const t=document.createElement('div');t.className='toast';t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),dur);}

function spawnParticles(x,y,emojis,count=8,large=false){
  for(let i=0;i<count;i++){
    const p=document.createElement('div');
    p.className=large?'particle particle-large':'particle';
    p.textContent=emojis[Math.floor(Math.random()*emojis.length)];
    p.style.left=x+'px';p.style.top=y+'px';
    const a=(Math.PI*2*i)/count;const d=(large?80:40)+Math.random()*(large?120:60);
    p.style.setProperty('--dx',Math.cos(a)*d+'px');
    p.style.setProperty('--dy',Math.sin(a)*d+'px');
    document.body.appendChild(p);setTimeout(()=>p.remove(),large?1500:1000);
  }
}

function weightedRandom(w){const e=Object.entries(w);const t=e.reduce((s,[,v])=>s+v,0);let r=Math.random()*t;for(const[k,v]of e){r-=v;if(r<=0)return k;}return e[e.length-1][0];}
function getCardById(id){return ALL_CARDS.find(c=>c.id===id);}
function getRarityOrder(r){return{common:0,uncommon:1,rare:2,epic:3,legendary:4,mythic:5}[r]||0;}
function fmt(n){return n.toLocaleString();}

// ===== SAVE/LOAD =====
function saveGame(){const d={...GS,newCards:[...GS.newCards]};localStorage.setItem('mc_tcg_save',JSON.stringify(d));}
function loadGame(){const r=localStorage.getItem('mc_tcg_save');if(r){try{const d=JSON.parse(r);Object.assign(GS,d);GS.newCards=new Set(d.newCards||[]);GS.shelf=d.shelf||[];GS.gradingQueue=d.gradingQueue||[];GS.gradedCards=d.gradedCards||[];GS.totalCardsGraded=d.totalCardsGraded||0;GS.gradingSerial=d.gradingSerial||1000;}catch(e){}}}

// ===== UI =====
function updateUI(){
  document.getElementById('goldDisplay').textContent=fmt(GS.gold);
  document.getElementById('diamondDisplay').textContent=GS.diamonds;
  document.getElementById('collectionDisplay').textContent=`${Object.keys(GS.cards).length}/${ALL_CARDS.length}`;
  document.getElementById('levelDisplay').textContent=GS.level;
  document.getElementById('reputationDisplay').textContent=GS.reputation;
  saveGame();
}

function addGold(n){GS.gold+=n;if(n>0)GS.totalGoldEarned+=n;updateUI();}
function addDiamonds(n){GS.diamonds+=n;updateUI();}
function addXP(n){GS.xp+=n;while(GS.xp>=GS.xpToNext){GS.xp-=GS.xpToNext;GS.level++;GS.xpToNext=Math.floor(GS.xpToNext*1.5);toast(`⬆️ 升级！等级 ${GS.level}`);addGold(GS.level*50);if(GS.level%3===0){addDiamonds(2);toast('💎 升级奖励: +2 钻石');}}updateUI();}
function addReputation(n){GS.reputation+=n;updateUI();}

// ===== CARD RENDERING HELPERS =====

// Build the MC-themed card back HTML
function buildCardBack(){
  return `<div class="card-back-design">
    <div class="card-back-corners">
      <div class="card-back-corner tl"></div>
      <div class="card-back-corner tr"></div>
      <div class="card-back-corner bl"></div>
      <div class="card-back-corner br"></div>
    </div>
    <div class="card-back-diamond"></div>
    <div class="card-back-logo">
      <div class="logo-pickaxe">⛏️</div>
      <div class="logo-text">MC · TCG</div>
      <div class="logo-sub">TRADING CARDS</div>
    </div>
  </div>`;
}

// Build card front with RICH MC elements
function buildCardFront(card){
  const r = RARITIES[card.rarity];
  const typeIcon = TYPE_ICONS[card.type]||'🎮';
  const stars = '★'.repeat(r.stars);
  
  // Scene background based on card scene type
  const sceneBg = getSceneBgStyle(card.scene, card.rarity);
  
  // Get scene decorations based on card type/scene
  const decor = getSceneDecorations(card);
  
  // Scene particles color based on rarity
  const particleColors = {
    common:'rgba(180,180,180,0.5)',uncommon:'rgba(85,255,85,0.5)',rare:'rgba(85,85,255,0.5)',
    epic:'rgba(170,0,170,0.5)',legendary:'rgba(255,200,50,0.5)',mythic:'rgba(255,85,255,0.6)'
  };
  const pColor = particleColors[card.rarity]||'rgba(255,255,255,0.3)';
  
  // Build floating scene particles
  let particlesHtml = '<div class="scene-particles">';
  const pCount = card.rarity==='mythic'?8:card.rarity==='legendary'?6:card.rarity==='epic'?5:3;
  for(let i=0;i<pCount;i++){
    const x = 10+Math.random()*80;
    const y = 10+Math.random()*80;
    const delay = Math.random()*3;
    const size = 1+Math.random()*2;
    particlesHtml += `<div class="scene-particle" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:${pColor};animation-delay:${delay}s"></div>`;
  }
  particlesHtml += '</div>';
  
  // Rarity-specific overlays
  let rarityOverlays = '';
  if(card.rarity==='epic'){
    rarityOverlays = '<div class="bottom-glow"></div>';
  }
  if(card.rarity==='legendary'){
    rarityOverlays = `
      <div class="corner-jewel cj-tl"></div><div class="corner-jewel cj-tr"></div>
      <div class="corner-jewel cj-bl"></div><div class="corner-jewel cj-br"></div>`;
  }
  if(card.rarity==='mythic'){
    rarityOverlays = '<div class="prismatic-overlay"></div>';
  }
  
  return `<div class="card-front-mc">
    <div class="card-inner-frame"></div>
    <div class="shimmer-overlay"></div>
    ${rarityOverlays}
    <div class="card-type-icon">${typeIcon}</div>
    <div class="card-frame-top" style="color:${r.color}">
      <span class="card-id-label">#${card.id.toUpperCase()}</span>
      <span class="rarity-label">${r.name}</span>
      <span class="card-id-label">${typeIcon}</span>
    </div>
    <div class="card-art-scene">
      <div class="scene-bg" style="${sceneBg}"></div>
      ${particlesHtml}
      <div class="scene-decor d1">${decor[0]||''}</div>
      <div class="scene-decor d2">${decor[1]||''}</div>
      <div class="scene-decor d3">${decor[2]||''}</div>
      <div class="scene-decor d4">${decor[3]||''}</div>
      <div class="scene-emoji">${card.emoji}</div>
    </div>
    <div class="card-info-area">
      <div class="card-name-text" style="color:${r.color}">${card.name}</div>
      <div class="card-rarity-badge" style="background:${r.color}22;color:${r.color};border:1px solid ${r.color}55">${r.name}</div>
      <div class="card-rarity-stars" style="color:${r.color}">${stars}</div>
      ${card.atk||card.hp?`<div class="card-stats-mini"><span class="stat-atk">⚔${card.atk}</span> <span class="stat-hp">❤${card.hp}</span></div>`:''}
    </div>
    <div class="card-bottom-bar">
      <span>MC·TCG</span>
      <span>${r.name} · ${'★'.repeat(r.stars)}</span>
    </div>
  </div>`;
}

// Get scene-appropriate decorations for card art
function getSceneDecorations(card){
  const sceneDecors = {
    plains:['🌾','☁️','🌻','🌿'],
    night:['🌙','⭐','🦇','✨'],
    cave:['🪨','💧','🕯️','⛏️'],
    deepcave:['💎','🪨','🔥','⛏️'],
    forest:['🌲','🍃','🌿','🍄'],
    ocean:['🌊','🐠','🪸','💧'],
    nether:['🔥','💀','🟥','⚡'],
    end:['🌌','✨','💜','🔮'],
    void:['🕳️','💫','✨','🌑'],
    village:['🏠','🌾','🪵','🛒'],
    swamp:['🌿','🍄','💧','🐸'],
    desert:['🌵','☀️','🏜️','🦂'],
    mountain:['🏔️','⛏️','☁️','🪨'],
    river:['💧','🐟','🌿','🌊'],
    mushroom:['🍄','🟣','🌸','✨'],
    enchant:['📖','✨','💫','🔮'],
    mansion:['🏚️','🕯️','🗝️','💀'],
    beacon:['💡','✨','⬆️','🌟'],
    treasure:['🗝️','💰','🏺','✨'],
    craft:['🔨','⚙️','🪵','🔩'],
    creative:['🌈','⭐','🎨','✨'],
  };
  return sceneDecors[card.scene] || sceneDecors.plains;
}

function getSceneBgStyle(scene, rarity){
  const scenes = {
    plains:'background:linear-gradient(180deg,#87CEEB 0%,#87CEEB 45%,#5B8731 45%,#5B8731 55%,#866043 55%,#6a4a33 100%)',
    night:'background:linear-gradient(180deg,#0a0a2a 0%,#1a1a4a 40%,#2a3a2a 60%,#1a2a1a 100%)',
    cave:'background:linear-gradient(180deg,#2a2a2a 0%,#3a3a3a 30%,#4a4a4a 50%,#333 100%)',
    deepcave:'background:linear-gradient(180deg,#1a1a1a 0%,#2a2a2a 50%,#111 100%)',
    forest:'background:linear-gradient(180deg,#87CEEB 0%,#5a8a3a 30%,#3a6a2a 60%,#2a4a1a 100%)',
    ocean:'background:linear-gradient(180deg,#2a4a6a 0%,#1a3a5a 30%,#0a2a4a 60%,#0a1a3a 100%)',
    nether:'background:linear-gradient(180deg,#4a1a0a 0%,#6a2a1a 30%,#8a3a2a 50%,#4a1a0a 100%)',
    end:'background:linear-gradient(180deg,#0a0a1a 0%,#1a0a2a 40%,#2a1a3a 70%,#0a0a0a 100%)',
    void:'background:linear-gradient(180deg,#000 0%,#0a0a1a 30%,#050510 60%,#000 100%)',
    village:'background:linear-gradient(180deg,#87CEEB 0%,#87CEEB 40%,#5B8731 40%,#866043 70%,#6a4a33 100%)',
    swamp:'background:linear-gradient(180deg,#4a5a3a 0%,#3a4a2a 40%,#2a3a1a 70%,#1a2a0a 100%)',
    desert:'background:linear-gradient(180deg,#87CEEB 0%,#c8b060 40%,#b8a050 60%,#a89040 100%)',
    mountain:'background:linear-gradient(180deg,#87CEEB 0%,#aaa 30%,#888 50%,#666 80%,#444 100%)',
    river:'background:linear-gradient(180deg,#87CEEB 0%,#5B8731 35%,#3a7acc 50%,#2a6abc 70%,#866043 100%)',
    mushroom:'background:linear-gradient(180deg,#87CEEB 0%,#8a6aaa 40%,#7a5a9a 60%,#6a4a8a 100%)',
    enchant:'background:linear-gradient(180deg,#1a0a3a 0%,#2a1a5a 40%,#1a0a4a 70%,#0a0a2a 100%)',
    mansion:'background:linear-gradient(180deg,#2a1a0a 0%,#3a2a1a 40%,#2a1a0a 70%,#1a0a00 100%)',
    beacon:'background:linear-gradient(180deg,#87CEEB 0%,#cceeff 30%,#aaddff 50%,#5B8731 70%,#3B5B1F 100%)',
    treasure:'background:linear-gradient(180deg,#3a2a1a 0%,#5a4a2a 30%,#4a3a1a 60%,#2a1a0a 100%)',
    craft:'background:linear-gradient(180deg,#4a3a2a 0%,#3a2a1a 50%,#2a1a0a 100%)',
    creative:'background:linear-gradient(180deg,#ff88cc 0%,#88ccff 30%,#88ffcc 60%,#ffcc88 100%)',
  };
  return scenes[scene] || scenes.plains;
}

// ===== CARD GEN =====
function generateCard(pack){
  const lk=GS.upgrades.luckyCharm*2;const aw={...pack.weights};
  if(lk>0){const rs=Object.keys(aw);for(let i=1;i<rs.length;i++)aw[rs[i]]+=lk;aw[rs[0]]=Math.max(10,aw[rs[0]]-lk*(rs.length-1));}
  const rarity=weightedRandom(aw);let pool=ALL_CARDS.filter(c=>c.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}
function generateGuaranteed(pack){
  const gi=getRarityOrder(pack.guaranteed);const pr=pack.pool.filter(r=>getRarityOrder(r)>=gi);
  const rarity=pr[Math.floor(Math.random()*pr.length)];const pool=ALL_CARDS.filter(c=>c.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}

// ===== PACK OPENING =====
let curCards=[];let flippedCnt=0;

function openPack(pid){
  const pack=PACKS.find(p=>p.id===pid);if(!pack)return;
  if(pack.level>GS.level){toast(`🔒 需要等级 ${pack.level}`);return;}
  const disc=1-(GS.upgrades.packDiscount*0.05);const fp=Math.floor(pack.price*disc);
  if(pack.priceType==='gold'){if(GS.gold<fp){toast('💰 金币不足！');return;}GS.gold-=fp;}
  else{if(GS.diamonds<fp){toast('💎 钻石不足！');return;}GS.diamonds-=fp;}
  curCards=[];
  for(let i=0;i<pack.cardCount;i++){
    if(i===pack.cardCount-1&&pack.guaranteed)curCards.push(generateGuaranteed(pack));
    else curCards.push(generateCard(pack));
  }
  GS.totalPacksOpened++;addXP(pack.cardCount*5);
  showOpening(pack);updateUI();
}

function showOpening(pack){
  const ov=document.getElementById('openingOverlay');
  const cr=document.getElementById('cardsReveal');
  const hint=document.getElementById('openingHint');
  const acts=document.getElementById('openingActions');
  cr.innerHTML='';hint.textContent='点击卡包开启...';acts.style.display='none';flippedCnt=0;

  // Build opening scene with MC elements
  buildOpeningScene();
  
  // Build pack face
  const packFaceEl = document.getElementById('packFace');
  packFaceEl.innerHTML = `
    <div class="pack-face-bg"></div>
    <div class="pack-face-frame"></div>
    <div class="pack-face-title">MC · TCG</div>
    <div class="pack-face-icon">${pack.icon}</div>
    <div class="pack-face-sub">${pack.name}</div>
  `;

  ov.classList.add('active');
  const p3d=document.getElementById('pack3d');const po=document.getElementById('packOpening');
  p3d.style.animation='packFloat 2s ease-in-out infinite';
  p3d.classList.remove('exploding');
  po.style.display='';

  p3d.onclick=()=>{
    p3d.onclick=null;
    // Explosion effect
    p3d.classList.add('exploding');
    
    // Flash effect
    const flash = document.createElement('div');
    flash.className='opening-flash';
    document.body.appendChild(flash);
    setTimeout(()=>flash.remove(),600);
    
    // Spawn explosion particles
    const rect=p3d.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    spawnParticles(cx,cy,['⛏️','💎','🔥','✨','⭐','💰','🟩','🟫'],16,true);
    
    setTimeout(()=>{
      po.style.display='none';
      hint.textContent='点击卡牌翻开！';
      acts.style.display='block';
      
      // Sort cards: highest rarity last for dramatic effect
      const sorted = curCards.map((c,i)=>({card:c,idx:i}));
      sorted.sort((a,b)=>getRarityOrder(a.card.rarity)-getRarityOrder(b.card.rarity));
      const sortedCards = sorted.map(s=>s.card);
      curCards = sortedCards;
      
      curCards.forEach((card,i)=>{
        const el=document.createElement('div');
        el.className=`reveal-card rarity-${card.rarity}`;
        el.style.opacity='0';el.style.transform='translateY(30px)';
        
        el.innerHTML=`<div class="reveal-card-inner">
          <div class="reveal-card-front">${buildCardBack()}</div>
          <div class="reveal-card-back">${buildCardFront(card)}</div>
        </div>`;
        
        el.onclick=()=>flipCard(el,card,i);
        cr.appendChild(el);
        
        // Staggered entrance animation
        setTimeout(()=>{
          el.style.transition='all 0.4s ease-out';
          el.style.opacity='1';el.style.transform='translateY(0)';
        },i*150+200);
      });
    },800);
  };
}

function buildOpeningScene(){
  const scene = document.getElementById('openingScene');
  if(!scene) return;
  scene.innerHTML='';
  
  // Stars
  const starsDiv = document.createElement('div');
  starsDiv.className='mc-stars';
  for(let i=0;i<30;i++){
    const star=document.createElement('div');
    star.className='mc-star';
    star.style.left=Math.random()*100+'%';
    star.style.top=Math.random()*70+'%';
    star.style.animationDelay=Math.random()*2+'s';
    starsDiv.appendChild(star);
  }
  scene.appendChild(starsDiv);
  
  // Moon
  const moon=document.createElement('div');
  moon.className='mc-moon';
  scene.appendChild(moon);
  
  // Ground
  const ground=document.createElement('div');
  ground.className='mc-ground';
  scene.appendChild(ground);
  
  // Floating MC elements
  const floatEmojis=['⛏️','🗡️','💎','🔥','🌲','🐔','🪵','⭐','🍎','🏹','🧱','🌾','⚔️','🛡️','🔱'];
  for(let i=0;i<8;i++){
    const el=document.createElement('div');
    el.className='float-element';
    el.textContent=floatEmojis[Math.floor(Math.random()*floatEmojis.length)];
    el.style.left=5+Math.random()*90+'%';
    el.style.top=10+Math.random()*50+'%';
    el.style.animationDelay=Math.random()*10+'s';
    el.style.animationDuration=10+Math.random()*10+'s';
    scene.appendChild(el);
  }
}

function flipCard(el,card,idx){
  if(el.classList.contains('flipped'))return;
  el.classList.add('flipped');flippedCnt++;
  
  const isNew = !GS.cards[card.id];
  if(isNew){GS.cards[card.id]=1;GS.newCards.add(card.id);}
  else GS.cards[card.id]++;
  
  const rarityLvl = getRarityOrder(card.rarity);
  const rect = el.getBoundingClientRect();
  const cx = rect.left+rect.width/2, cy = rect.top+rect.height/2;
  
  // === RARITY-SPECIFIC EFFECTS ===
  
  if(rarityLvl >= 2){ // Rare+
    const e = card.rarity==='mythic' ? ['⭐','✨','💫','🌟','💎','🔮','⚡'] :
              card.rarity==='legendary' ? ['⭐','✨','🔥','💛','⚡'] :
              card.rarity==='epic' ? ['💜','✨','🔮','💫'] :
              ['💙','✨','💎'];
    spawnParticles(cx,cy,e,rarityLvl*5,rarityLvl>=4);
  }
  
  if(rarityLvl >= 3){ // Epic+: show rarity banner
    setTimeout(()=>{
      const banner = document.createElement('div');
      banner.className = `rarity-banner ${card.rarity}`;
      banner.innerHTML = `${RARITIES[card.rarity].name}！<br><span style="font-size:10px">${card.name}</span>`;
      document.body.appendChild(banner);
      setTimeout(()=>banner.remove(),2000);
    },300);
  }
  
  if(rarityLvl >= 4){ // Legendary+: screen shake + fullscreen pulse
    document.body.classList.add('screen-shake');
    setTimeout(()=>document.body.classList.remove('screen-shake'),500);
    
    const pulse = document.createElement('div');
    pulse.className = `fullscreen-effect ${card.rarity}`;
    document.body.appendChild(pulse);
    setTimeout(()=>pulse.remove(),2000);
    
    // Card enlarge effect
    el.classList.add('high-rarity-flip');
    
    // Extra huge particles
    spawnParticles(cx,cy,['🌟','⚡','💥','🔥','✨'],20,true);
  }
  
  if(rarityLvl >= 5){ // Mythic: additional rainbow border flash + sound-like visual
    el.classList.add('mythic-reveal');
    
    // Multiple waves of particles
    setTimeout(()=>spawnParticles(cx,cy,['🌈','💎','🌟','⚡','🔮'],15,true),400);
    setTimeout(()=>spawnParticles(cx,cy,['✨','💫','⭐','🎆'],12,true),800);
    
    // Flash
    const flash = document.createElement('div');
    flash.className='opening-flash';
    document.body.appendChild(flash);
    setTimeout(()=>flash.remove(),600);
  }
  
  if(isNew && rarityLvl>=3){
    toast(`🆕 新卡！${card.name} (${RARITIES[card.rarity].name})`);
  }
  
  updateUI();checkAchievements();
}

function flipAllCards(){
  document.querySelectorAll('.reveal-card:not(.flipped)').forEach((el,i)=>{
    setTimeout(()=>{
      const idx=[...el.parentNode.children].indexOf(el);
      flipCard(el,curCards[idx],idx);
    },i*300);
  });
}

function closeOpening(){
  document.querySelectorAll('.reveal-card:not(.flipped)').forEach(el=>{
    const idx=[...el.parentNode.children].indexOf(el);
    const card=curCards[idx];
    if(!GS.cards[card.id]){GS.cards[card.id]=1;GS.newCards.add(card.id);}
    else GS.cards[card.id]++;
  });
  document.getElementById('openingOverlay').classList.remove('active');
  updateUI();checkAchievements();renderPackShop();
}

// ===== DAILY =====
function claimDailyPack(){
  const today=new Date().toDateString();if(GS.lastDailyDate===today){toast('📅 今日已领取');return;}
  GS.lastDailyDate=today;curCards=[];const fp=PACKS[0];
  for(let i=0;i<3;i++)curCards.push(generateCard(fp));
  GS.totalPacksOpened++;addXP(15);showOpening({...fp,icon:'🌅',cardCount:3,name:'每日免费包'});
  document.getElementById('dailyPackBtn').disabled=true;document.getElementById('dailyPackBtn').textContent='已领取';updateUI();
}

// ===== RENDER PACK SHOP =====
function renderPackShop(){
  const g=document.getElementById('packGrid');g.innerHTML='';
  PACKS.forEach(p=>{
    const locked=p.level>GS.level;const disc=1-(GS.upgrades.packDiscount*0.05);const fp=Math.floor(p.price*disc);
    const el=document.createElement('div');el.className=`pack-item ${locked?'locked':''}`;
    el.innerHTML=`<div class="pack-icon">${p.icon}</div><div class="pack-name">${p.name}</div><div class="pack-desc">${p.desc}</div><div class="pack-price">${p.priceType==='gold'?'💰':'💎'} ${fmt(fp)}</div>${disc<1?`<div style="font-size:7px;color:#ff6666;text-decoration:line-through;margin-top:2px;">${fmt(p.price)}</div>`:''}<div class="pack-count">${p.cardCount} 张卡牌</div>${locked?`<div style="font-size:8px;color:#ff6666;margin-top:6px;">🔒 需要等级 ${p.level}</div>`:''}`;
    if(!locked)el.onclick=()=>openPack(p.id);g.appendChild(el);
  });
  const today=new Date().toDateString();const db=document.getElementById('dailyPackBtn');
  if(GS.lastDailyDate===today){db.disabled=true;db.textContent='已领取';}else{db.disabled=false;db.textContent='领取';}
}

// ===== COLLECTION =====
function renderCollection(){
  const g=document.getElementById('collectionGrid');
  const rf=document.getElementById('filterRarity').value;const tf=document.getElementById('filterType').value;
  const of2=document.getElementById('filterOwned').value;const sf=document.getElementById('filterSearch').value.toLowerCase();
  let cards=ALL_CARDS.filter(c=>{
    if(rf!=='all'&&c.rarity!==rf)return false;if(tf!=='all'&&c.type!==tf)return false;
    if(of2==='owned'&&!GS.cards[c.id])return false;if(of2==='missing'&&GS.cards[c.id])return false;
    if(sf&&!c.name.includes(sf)&&!c.desc.includes(sf))return false;return true;
  });
  cards.sort((a,b)=>{const ao=GS.cards[a.id]?1:0;const bo=GS.cards[b.id]?1:0;if(ao!==bo)return bo-ao;return getRarityOrder(b.rarity)-getRarityOrder(a.rarity);});
  g.innerHTML='';
  cards.forEach(card=>{
    const owned=GS.cards[card.id]||0;const isNew=GS.newCards.has(card.id);
    const r = RARITIES[card.rarity];
    const stars = '★'.repeat(r.stars);
    const el=document.createElement('div');
    el.className=`collection-card rarity-${card.rarity} ${owned?'':'not-owned'} ${isNew?'new-card':''}`;
    el.innerHTML=`<div class="card-emoji">${card.emoji}</div><div class="card-title" style="color:${r.color}">${card.name}</div><div class="card-rarity-badge" style="background:${r.color}22;color:${r.color}">${r.name}</div><div class="rarity-dots">${stars.split('').map(()=>`<div class="dot" style="background:${r.color}"></div>`).join('')}</div><div class="card-count">×${owned}</div>`;
    el.onclick=()=>{GS.newCards.delete(card.id);showCardDetail(card);};g.appendChild(el);
  });
  const oc=Object.keys(GS.cards).length;const pct=Math.round((oc/ALL_CARDS.length)*100);
  document.getElementById('collProgressFill').style.width=pct+'%';document.getElementById('collProgressText').textContent=`${oc}/${ALL_CARDS.length} (${pct}%)`;
}

function showCardDetail(card){
  const owned=GS.cards[card.id]||0;const sv=Math.floor(10*RARITIES[card.rarity].sellMult);
  const types={mob:'生物',block:'方块',item:'物品',biome:'群系',boss:'BOSS',enchant:'附魔'};
  const r = RARITIES[card.rarity];
  document.getElementById('modalArt').textContent=card.emoji;
  document.getElementById('modalName').style.color=r.color;
  document.getElementById('modalName').textContent=card.name;
  document.getElementById('modalType').textContent=`${r.name} · ${types[card.type]} · ${'★'.repeat(r.stars)}`;
  document.getElementById('modalDesc').textContent=card.desc;
  document.getElementById('modalStats').innerHTML=card.atk||card.hp?`⚔️ 攻击: ${card.atk}　❤️ 生命: ${card.hp}`:'';
  
  // Check graded versions
  const graded = GS.gradedCards.filter(g=>g.cardId===card.id);
  let gradedHtml = '';
  if(graded.length>0){
    gradedHtml = '<div style="margin-top:8px;border-top:2px solid #444;padding-top:8px;"><div style="font-size:8px;color:var(--mc-diamond);margin-bottom:4px;">📊 已评级版本:</div>';
    graded.forEach(g=>{
      const ag = GRADING_AGENCIES.find(a=>a.id===g.agency);
      gradedHtml += `<div style="font-size:7px;color:#aaa;margin:2px 0;"><span style="color:${ag.color}">${ag.name}</span> ${g.grade}分 · #${g.serialNo}</div>`;
    });
    gradedHtml += '</div>';
  }
  
  document.getElementById('modalExtra').innerHTML=`<div style="font-size:8px;color:#888;margin-bottom:8px;">拥有: ${owned} 张 | 售价: 💰${sv}</div>${owned>1?`<button class="mc-btn red" onclick="quickSell('${card.id}')" style="font-size:8px;">快速出售 (💰+${sv})</button>`:''}${gradedHtml}`;
  document.getElementById('cardModal').classList.add('active');document.getElementById('modalContent').style.borderColor=r.color;
}
function quickSell(cid){if(GS.cards[cid]>1){const c=getCardById(cid);const sv=Math.floor(10*RARITIES[c.rarity].sellMult);GS.cards[cid]--;addGold(sv);toast(`💰 出售 ${c.name}，+${sv}金币`);showCardDetail(c);renderCollection();}else toast('⚠️ 最后一张不能出售');}
function closeModal(){document.getElementById('cardModal').classList.remove('active');}

// ===== SHOP SYSTEM =====
let shopInterval=null;let custTimerInt=null;let selectedShelfSlot=-1;
let shopAmbientInterval=null;

// Shop ambient effects
function startShopAmbientEffects(){
  if(shopAmbientInterval) return;
  const bg=document.getElementById('myshopPageBackground');
  if(!bg) return;
  
  // Create floating coins and particles
  setInterval(()=>{
    if(!GS.shopOpen) return;
    const particle=document.createElement('div');
    particle.className='shop-ambient-particle';
    const types=['💰','✨','⭐','💎'];
    particle.textContent=types[Math.floor(Math.random()*types.length)];
    particle.style.left=Math.random()*100+'%';
    particle.style.bottom='-20px';
    particle.style.fontSize=(10+Math.random()*10)+'px';
    particle.style.animationDuration=(8+Math.random()*6)+'s';
    bg.appendChild(particle);
    setTimeout(()=>particle.remove(),14000);
  },2000);
}

function renderShelf(){
  const g=document.getElementById('shelfGrid');const total=6+GS.upgrades.shelfSize;g.innerHTML='';
  for(let i=0;i<total;i++){
    const slot=GS.shelf[i];const el=document.createElement('div');
    if(slot){
      const card=getCardById(slot.cardId);
      el.className='shelf-slot';
      el.innerHTML=`<div class="slot-emoji">${card.emoji}</div><div style="font-size:6px;color:${RARITIES[card.rarity].color};margin-top:2px;">${card.name}</div><div class="slot-price">💰${slot.price}</div>`;
      el.onclick=()=>removeFromShelf(i);
    }else{
      el.className='shelf-slot empty';el.onclick=()=>{selectedShelfSlot=i;renderShopInventory();};
    }
    g.appendChild(el);
  }
}

function renderShopInventory(){
  const g=document.getElementById('shopInventory');g.innerHTML='';
  const entries=Object.entries(GS.cards).filter(([id,cnt])=>cnt>0).map(([id,cnt])=>({card:getCardById(id),count:cnt})).filter(e=>e.card);
  entries.sort((a,b)=>getRarityOrder(b.card.rarity)-getRarityOrder(a.card.rarity));
  if(entries.length===0){g.innerHTML='<div style="font-size:8px;color:#666;padding:20px;text-align:center;">暂无库存卡牌，去开包吧！</div>';return;}
  entries.forEach(({card,count})=>{
    const onShelf=GS.shelf.filter(s=>s&&s.cardId===card.id).length;
    const available=count-onShelf;
    if(available<=0)return;
    const el=document.createElement('div');el.className='inv-card';
    el.innerHTML=`<div class="inv-emoji">${card.emoji}</div><div class="inv-name" style="color:${RARITIES[card.rarity].color}">${card.name}</div><div class="inv-count">可用: ${available}</div>`;
    el.onclick=()=>addToShelf(card);g.appendChild(el);
  });
}

function addToShelf(card){
  const total=6+GS.upgrades.shelfSize;
  let slot=selectedShelfSlot>=0?selectedShelfSlot:GS.shelf.findIndex((s,i)=>!s&&i<total);
  if(slot<0){for(let i=GS.shelf.length;i<total;i++){if(!GS.shelf[i]){slot=i;break;}}}
  if(slot<0||slot>=total){toast('⚠️ 货架已满');return;}
  const onShelf=GS.shelf.filter(s=>s&&s.cardId===card.id).length;
  if((GS.cards[card.id]||0)-onShelf<=0){toast('⚠️ 没有多余的卡牌');return;}
  const basePrice=Math.floor(10*RARITIES[card.rarity].sellMult);const price=Math.floor(basePrice*(1.2+Math.random()*0.6));
  GS.shelf[slot]={cardId:card.id,price};selectedShelfSlot=-1;
  toast(`📦 ${card.name} 已上架 (💰${price})`);renderShelf();renderShopInventory();saveGame();
}

function removeFromShelf(idx){
  const slot=GS.shelf[idx];if(!slot)return;
  const card=getCardById(slot.cardId);GS.shelf[idx]=null;
  toast(`📤 ${card.name} 已下架`);renderShelf();renderShopInventory();saveGame();
}

function openShop(){
  GS.shopOpen=true;document.getElementById('openShopBtn').style.display='none';document.getElementById('closeShopBtn').style.display='';
  addLog('🔔 店铺开始营业！');
  
  // Start ambient effects
  startShopAmbientEffects();
  
  // Add shop-opened visual feedback
  const page=document.getElementById('page-myshop');
  if(page)page.classList.add('shop-open-active');
  
  setTimeout(()=>spawnCustomer(),500);
  shopInterval=setInterval(()=>{if(!GS.currentCustomer)spawnCustomer();},8000);
}

function closeShop(){
  GS.shopOpen=false;document.getElementById('openShopBtn').style.display='';document.getElementById('closeShopBtn').style.display='none';
  clearInterval(shopInterval);clearInterval(custTimerInt);clearTimeout(GS.customerTimeout);
  clearInterval(shopAmbientInterval);shopAmbientInterval=null;
  GS.currentCustomer=null;
  document.getElementById('customerArea').innerHTML='<div style="color:#666;font-size:8px;text-align:center;padding:30px;">店铺已暂停营业</div>';
  
  // Remove shop-opened visual feedback
  const page=document.getElementById('page-myshop');
  if(page)page.classList.remove('shop-open-active');
  
  // Clear ambient particles
  const particles=document.querySelectorAll('.shop-ambient-particle');
  particles.forEach(p=>p.remove());
  
  addLog('⏸️ 店铺暂停营业');
}

function spawnCustomer(){
  if(!GS.shopOpen)return;
  const ni=Math.floor(Math.random()*CUSTOMER_NAMES.length);
  const budgetMult=1+GS.upgrades.reputation*0.2;
  const budget=Math.floor((50+Math.random()*200)*budgetMult);
  const patience=20+GS.upgrades.customerPatience*5;
  
  const shelfCards=GS.shelf.filter(s=>s).map(s=>({...s,card:getCardById(s.cardId)}));
  let wantType,wantCard,dialog;
  const roll=Math.random();
  if(roll<0.4&&shelfCards.length>0){
    const pick=shelfCards[Math.floor(Math.random()*shelfCards.length)];
    wantCard=pick.card;wantType='specific';
    const templates=['我想要一张{card}！','听说{card}很稀有，有卖吗？','你这里有{card}吗？','我儿子想要{card}，多少钱？'];
    dialog=templates[Math.floor(Math.random()*templates.length)].replace('{card}',wantCard.name);
  }else if(roll<0.7){
    const rarities=['common','uncommon','rare','epic'];
    const wantRarity=rarities[Math.floor(Math.random()*rarities.length)];
    wantType='rarity';wantCard={rarity:wantRarity};
    const templates=['有什么{rarity}卡吗？','我想收集{rarity}卡牌。','给我推荐一张{rarity}卡吧！'];
    dialog=templates[Math.floor(Math.random()*templates.length)].replace('{rarity}',RARITIES[wantRarity].name);
  }else{
    wantType='any';
    const templates=['随便看看有什么好卡~','今天有什么新到的卡吗？','我是卡牌收藏家，让我看看你的货架！','听说这家店不错，来逛逛。'];
    dialog=templates[Math.floor(Math.random()*templates.length)];
  }

  const skin=CUSTOMER_SKINS[ni%CUSTOMER_SKINS.length];
  GS.currentCustomer={name:CUSTOMER_NAMES[ni],avatar:CUSTOMER_AVATARS[ni%CUSTOMER_AVATARS.length],skin,dialog,budget,patience,timeLeft:patience,wantType,wantCard,entering:true};
  
  // Play enter animation
  renderCustomer();
  setTimeout(()=>{
    if(GS.currentCustomer){
      GS.currentCustomer.entering=false;
      renderCustomer();
    }
  },600);
  
  startCustomerTimer();
  if(GS.upgrades.autoSell>0&&wantType==='specific'){setTimeout(()=>tryAutoSell(),1500);}
}

function renderCustomer(){
  const c=GS.currentCustomer;if(!c){document.getElementById('customerArea').innerHTML='<div style="color:#666;font-size:8px;text-align:center;padding:30px;">等待顾客...</div>';return;}
  const area=document.getElementById('customerArea');
  
  const enteringClass=c.entering?'customer-entering':'';
  area.innerHTML=`<div class="customer ${enteringClass}"><div class="customer-avatar-container"><div class="customer-avatar">${c.avatar}</div><div class="avatar-glow"></div></div><div class="customer-info"><div class="customer-name">${c.name}</div><div class="customer-dialog">${c.dialog}</div><div class="customer-budget">💰 预算: ${c.budget} 金币</div></div></div><div class="customer-timer">⏰ ${c.timeLeft}s</div>`;

  const shelfCards=GS.shelf.map((s,i)=>s?{idx:i,...s,card:getCardById(s.cardId)}:null).filter(Boolean);
  let matches=[];
  if(c.wantType==='specific')matches=shelfCards.filter(s=>s.card.id===c.wantCard.id);
  else if(c.wantType==='rarity')matches=shelfCards.filter(s=>s.card.rarity===c.wantCard.rarity);
  else matches=shelfCards;
  
  matches=matches.filter(s=>s.price<=c.budget);
  if(matches.length>0){
    const btns=document.createElement('div');btns.style.cssText='margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;';
    matches.forEach(m=>{
      const b=document.createElement('button');b.className='mc-btn green';b.style.fontSize='8px';b.style.padding='6px 10px';
      b.textContent=`卖出 ${m.card.name} (💰${m.price})`;b.onclick=()=>sellToCustomer(m.idx);
      btns.appendChild(b);
    });
    area.appendChild(btns);
  }
}

function startCustomerTimer(){
  clearInterval(custTimerInt);clearTimeout(GS.customerTimeout);
  custTimerInt=setInterval(()=>{
    if(!GS.currentCustomer)return clearInterval(custTimerInt);
    GS.currentCustomer.timeLeft--;
    const timerEl=document.querySelector('.customer-timer');
    if(timerEl)timerEl.textContent=`⏰ ${GS.currentCustomer.timeLeft}s`;
    // Also update fullshop budget tag
    const fsBudgetTag=document.querySelector('.fs-customer-budget-tag');
    if(fsBudgetTag)fsBudgetTag.textContent=`💰 预算: ${GS.currentCustomer.budget} 金币 | ⏰ ${GS.currentCustomer.timeLeft}s`;
    if(GS.currentCustomer.timeLeft<=0){clearInterval(custTimerInt);customerLeave(false);}
  },1000);
}

function sellToCustomer(shelfIdx){
  const slot=GS.shelf[shelfIdx];if(!slot||!GS.currentCustomer)return;
  const card=getCardById(slot.cardId);const price=slot.price;
  if(price>GS.currentCustomer.budget){toast('💸 超出顾客预算');return;}
  
  // Animate card purchase
  const slotEl=document.querySelectorAll('.shelf-slot')[shelfIdx];
  if(slotEl){
    slotEl.classList.add('slot-selling');
    setTimeout(()=>{
      // Card flies to customer
      const area=document.getElementById('customerArea');
      const rect=area.getBoundingClientRect();
      spawnParticles(rect.left+rect.width/2,rect.top+rect.height/2,['💰','✨','💚'],6);
    },200);
  }
  
  setTimeout(()=>{
    GS.shelf[shelfIdx]=null;GS.cards[card.id]--;if(GS.cards[card.id]<=0)delete GS.cards[card.id];
    addGold(price);GS.totalCardsSold++;addXP(10);addReputation(1);
    addLog(`💚 卖出 ${card.name} 给 ${GS.currentCustomer.name}，💰+${price}`,true);
    toast(`💰 成功卖出 ${card.name}！+${price}金币`);
    
    // Customer leaving animation
    const c=GS.currentCustomer;
    GS.currentCustomer=null;
    renderCustomer();
    renderShelf();renderShopInventory();
    checkAchievements();updateUI();
    
    setTimeout(()=>{if(GS.shopOpen&&!GS.currentCustomer)spawnCustomer();},3000);
  },600);
}

function customerLeave(bought){
  if(!GS.currentCustomer)return;
  if(!bought)addLog(`❌ ${GS.currentCustomer.name} 等不及了，离开了`,false);
  GS.currentCustomer=null;renderCustomer();
}

function tryAutoSell(){
  if(!GS.currentCustomer||GS.currentCustomer.wantType!=='specific')return;
  const wId=GS.currentCustomer.wantCard.id;
  const matchIdx=GS.shelf.findIndex(s=>s&&s.cardId===wId&&s.price<=GS.currentCustomer.budget);
  if(matchIdx>=0){toast('🤖 自动售货匹配成功！');sellToCustomer(matchIdx);}
}

function addLog(msg,isSale){
  const log=document.getElementById('shopLog');
  const el=document.createElement('div');el.className=`log-entry ${isSale?'sale':isSale===false?'miss':''}`;
  const now=new Date();el.textContent=`[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}] ${msg}`;
  log.prepend(el);if(log.children.length>50)log.lastChild.remove();
}

// ===== UPGRADES =====
function renderUpgrades(){
  const g=document.getElementById('upgradesGrid');g.innerHTML='';
  UPGRADES.forEach(u=>{
    const lv=GS.upgrades[u.id]||0;const maxed=lv>=u.maxLevel;
    const cost=maxed?0:Math.floor(u.baseCost*Math.pow(u.costMult,lv));
    const el=document.createElement('div');el.className='upgrade-item';
    el.innerHTML=`<div class="upgrade-icon">${u.icon}</div><div class="upgrade-info"><div class="upgrade-name">${u.name}</div><div class="upgrade-desc">${u.desc}</div><div class="upgrade-level">等级: ${lv}/${u.maxLevel} | ${u.effect}</div></div>
    ${maxed?'<div style="font-size:8px;color:var(--mc-gold);">MAX</div>':`<button class="mc-btn gold" style="font-size:8px;padding:6px 12px;" onclick="buyUpgrade('${u.id}')">💰${fmt(cost)}</button>`}`;
    g.appendChild(el);
  });
}

function buyUpgrade(uid){
  const u=UPGRADES.find(x=>x.id===uid);if(!u)return;
  const lv=GS.upgrades[uid]||0;if(lv>=u.maxLevel){toast('已满级');return;}
  const cost=Math.floor(u.baseCost*Math.pow(u.costMult,lv));
  if(GS.gold<cost){toast('💰 金币不足');return;}
  GS.gold-=cost;GS.upgrades[uid]=(GS.upgrades[uid]||0)+1;
  toast(`⬆️ ${u.name} 升级到 ${GS.upgrades[uid]} 级！`);
  renderUpgrades();renderShelf();updateUI();
}

// ===== GRADING SYSTEM =====
let selectedGradingAgency = null;
let selectedGradingCard = null;
let gradingTimerInterval = null;

function renderGrading(){
  renderGradingAgencies();
  renderGradingInventory();
  renderGradingQueue();
  renderGradedCards();
}

function renderGradingAgencies(){
  const g=document.getElementById('gradingAgencies');if(!g)return;
  g.innerHTML='';
  GRADING_AGENCIES.forEach(ag=>{
    const el=document.createElement('div');
    el.className=`agency-card ${selectedGradingAgency===ag.id?'selected':''}`;
    el.innerHTML=`<div class="agency-logo ${ag.id}">${ag.name}</div>
      <div class="agency-info">
        <div class="agency-name">${ag.fullName}</div>
        <div class="agency-desc">${ag.desc}</div>
        <div class="agency-cost">💰 基础费用: ${ag.costBase}+ | ⏱️ ~${ag.timeBase}s</div>
      </div>`;
    el.onclick=()=>{selectedGradingAgency=ag.id;renderGradingAgencies();renderGradingInventory();};
    g.appendChild(el);
  });
}

function renderGradingInventory(){
  const g=document.getElementById('gradingInventory');if(!g)return;
  g.innerHTML='';
  
  if(!selectedGradingAgency){
    g.innerHTML='<div style="font-size:8px;color:#666;padding:20px;text-align:center;grid-column:1/-1;">请先选择一个评级机构</div>';
    return;
  }
  
  const ag = GRADING_AGENCIES.find(a=>a.id===selectedGradingAgency);
  const entries=Object.entries(GS.cards).filter(([id,cnt])=>cnt>1).map(([id,cnt])=>({card:getCardById(id),count:cnt})).filter(e=>e.card);
  entries.sort((a,b)=>getRarityOrder(b.card.rarity)-getRarityOrder(a.card.rarity));
  
  if(entries.length===0){
    g.innerHTML='<div style="font-size:8px;color:#666;padding:20px;text-align:center;grid-column:1/-1;">需要至少2张同款卡牌才能送评<br>(保留1张自用)</div>';
    return;
  }
  
  entries.forEach(({card,count})=>{
    const cost = Math.floor(ag.costBase + ag.costMult * RARITIES[card.rarity].sellMult * 10);
    const el=document.createElement('div');
    el.className=`grade-inv-card ${selectedGradingCard===card.id?'selected':''}`;
    el.innerHTML=`<div class="gi-emoji">${card.emoji}</div>
      <div class="gi-name" style="color:${RARITIES[card.rarity].color}">${card.name}</div>
      <div style="font-size:6px;color:#888;">×${count} | 💰${cost}</div>`;
    el.onclick=()=>{selectedGradingCard=card.id;renderGradingInventory();};
    g.appendChild(el);
  });
}

function submitGrading(){
  if(!selectedGradingAgency||!selectedGradingCard){toast('⚠️ 请选择评级机构和卡牌');return;}
  
  const ag = GRADING_AGENCIES.find(a=>a.id===selectedGradingAgency);
  const card = getCardById(selectedGradingCard);
  if(!card){toast('⚠️ 卡牌不存在');return;}
  
  // Check has >1 copy
  if((GS.cards[card.id]||0)<=1){toast('⚠️ 至少保留1张，需要2张以上');return;}
  
  const cost = Math.floor(ag.costBase + ag.costMult * RARITIES[card.rarity].sellMult * 10);
  if(GS.gold<cost){toast('💰 金币不足');return;}
  
  // Check queue limit
  if(GS.gradingQueue.length>=5){toast('⚠️ 评级队列已满(最多5张)');return;}
  
  GS.gold -= cost;
  GS.cards[card.id]--;
  
  const duration = Math.floor(ag.timeBase * ag.timeMult * (1 + Math.random()*0.3));
  
  GS.gradingQueue.push({
    cardId: card.id,
    agency: ag.id,
    startTime: Date.now(),
    duration: duration * 1000, // ms
    grade: null,
    cost: cost,
  });
  
  GS.totalCardsGraded++;
  toast(`📊 ${card.name} 已提交到 ${ag.name} 评级！`);
  
  selectedGradingCard=null;
  renderGrading();updateUI();
  startGradingTimers();
}

function startGradingTimers(){
  if(gradingTimerInterval) clearInterval(gradingTimerInterval);
  gradingTimerInterval = setInterval(()=>{
    let anyActive = false;
    GS.gradingQueue.forEach((item,idx)=>{
      if(item.grade!==null) return;
      const elapsed = Date.now()-item.startTime;
      if(elapsed >= item.duration){
        // Grading complete!
        completeGrading(idx);
      } else {
        anyActive = true;
      }
    });
    renderGradingQueue();
    if(!anyActive && GS.gradingQueue.every(i=>i.grade!==null)){
      clearInterval(gradingTimerInterval);
      gradingTimerInterval=null;
    }
  },1000);
}

function completeGrading(idx){
  const item = GS.gradingQueue[idx];
  if(item.grade !== null) return;
  
  const card = getCardById(item.cardId);
  const ag = GRADING_AGENCIES.find(a=>a.id===item.agency);
  
  // Calculate grade based on rarity + randomness + agency bonus
  const rarityBonus = getRarityOrder(card.rarity) * 0.3;
  let baseGrade = 5 + Math.random() * 4 + rarityBonus + (ag.gradeBonus||0);
  
  // Rare chance for perfect 10
  if(Math.random() < 0.05 + rarityBonus*0.01) baseGrade = 10;
  
  let grade = Math.min(10, Math.max(1, Math.round(baseGrade * 2) / 2)); // Round to 0.5
  
  // For CGC, allow .5 grades; for PSA round to integer
  if(ag.id==='psa') grade = Math.round(grade);
  
  item.grade = grade;
  
  // Sub-grades for BGS
  let subGrades = null;
  if(ag.hasSubGrades){
    subGrades = {
      centering: Math.min(10, Math.max(5, grade + (Math.random()-0.5)*2)),
      corners: Math.min(10, Math.max(5, grade + (Math.random()-0.5)*2)),
      edges: Math.min(10, Math.max(5, grade + (Math.random()-0.5)*2)),
      surface: Math.min(10, Math.max(5, grade + (Math.random()-0.5)*2)),
    };
    // Round sub-grades
    for(let k in subGrades) subGrades[k] = Math.round(subGrades[k]*2)/2;
  }
  
  const serialNo = GS.gradingSerial++;
  
  GS.gradedCards.push({
    cardId: card.id,
    agency: ag.id,
    grade: grade,
    subGrades: subGrades,
    timestamp: Date.now(),
    serialNo: serialNo,
  });
  
  // Value calculation
  const baseValue = Math.floor(10 * RARITIES[card.rarity].sellMult);
  const gradeMult = grade >= 10 ? ag.valueMult * 3 : grade >= 9 ? ag.valueMult * 2 : grade >= 8 ? ag.valueMult * 1.5 : ag.valueMult;
  const gradedValue = Math.floor(baseValue * gradeMult);
  
  toast(`🏅 ${ag.name} 评级完成！${card.name} 获得 ${grade} 分！价值 💰${gradedValue}`);
  
  // Special effects for high grades
  if(grade >= 10){
    toast(`🌟 完美 ${grade} 分！传世珍品！`);
    spawnParticles(window.innerWidth/2, window.innerHeight/2, ['🏆','🌟','💯','💎','✨'], 20, true);
  } else if(grade >= 9){
    spawnParticles(window.innerWidth/2, window.innerHeight/2, ['⭐','✨','🏅'], 10);
  }
  
  saveGame();checkAchievements();
}

function renderGradingQueue(){
  const g=document.getElementById('gradingQueue');if(!g)return;
  g.innerHTML='';
  
  if(GS.gradingQueue.length===0){
    g.innerHTML='<div style="font-size:8px;color:#666;text-align:center;padding:12px;">暂无评级中的卡牌</div>';
    return;
  }
  
  GS.gradingQueue.forEach((item,idx)=>{
    const card = getCardById(item.cardId);
    const ag = GRADING_AGENCIES.find(a=>a.id===item.agency);
    const elapsed = Date.now()-item.startTime;
    const progress = Math.min(100, (elapsed/item.duration)*100);
    const done = item.grade !== null;
    const remaining = done ? 0 : Math.max(0, Math.ceil((item.duration-elapsed)/1000));
    
    const el=document.createElement('div');
    el.className=`grading-queue-item ${done?'complete':''}`;
    el.innerHTML=`
      <div class="gq-emoji">${card.emoji}</div>
      <div class="gq-info">
        <div style="color:${RARITIES[card.rarity].color}">${card.name}</div>
        <div class="gq-agency" style="background:${ag.color}33;color:${ag.color}">${ag.name}</div>
      </div>
      <div class="gq-timer">${done?`✅ ${item.grade}分`:`⏳ ${remaining}s`}</div>
      <div class="gq-progress" style="width:${progress}%;background:${done?'var(--mc-emerald)':ag.color}"></div>
      ${done?`<button class="mc-btn green" style="font-size:8px;padding:6px 14px;margin-left:8px;color:#fff;text-shadow:1px 1px 0 rgba(0,0,0,0.5);" onclick="collectGraded(${idx})">领取</button>`:''}
    `;
    g.appendChild(el);
  });
}

function collectGraded(idx){
  if(idx<0||idx>=GS.gradingQueue.length)return;
  const item = GS.gradingQueue[idx];
  if(item.grade===null){toast('⚠️ 评级尚未完成');return;}
  GS.gradingQueue.splice(idx,1);
  renderGrading();saveGame();
  toast('📦 已领取评级卡牌！');
}

function renderGradedCards(){
  const g=document.getElementById('gradedCardsGrid');if(!g)return;
  g.innerHTML='';
  
  if(GS.gradedCards.length===0){
    g.innerHTML='<div style="font-size:8px;color:#666;text-align:center;padding:20px;">还没有评级卡牌，去提交评级吧！</div>';
    return;
  }
  
  // Sort by grade desc
  const sorted = [...GS.gradedCards].sort((a,b)=>b.grade-a.grade);
  
  sorted.forEach((graded,i)=>{
    const card = getCardById(graded.cardId);
    const ag = GRADING_AGENCIES.find(a=>a.id===graded.agency);
    const r = RARITIES[card.rarity];
    const isPerfect = graded.grade >= 10;
    const baseValue = Math.floor(10 * r.sellMult);
    const gradeMult = graded.grade >= 10 ? ag.valueMult * 3 : graded.grade >= 9 ? ag.valueMult * 2 : graded.grade >= 8 ? ag.valueMult * 1.5 : ag.valueMult;
    const gradedValue = Math.floor(baseValue * gradeMult);
    
    const el=document.createElement('div');
    el.className=`graded-card-display ${ag.id}-slab`;
    
    let subGradeHtml = '';
    if(graded.subGrades){
      subGradeHtml = `<div style="font-size:6px;color:#aaa;margin-top:2px;display:grid;grid-template-columns:1fr 1fr;gap:1px;text-align:left;padding:0 8px;">
        <span>居中 ${graded.subGrades.centering}</span>
        <span>边角 ${graded.subGrades.corners}</span>
        <span>边缘 ${graded.subGrades.edges}</span>
        <span>表面 ${graded.subGrades.surface}</span>
      </div>`;
    }
    
    el.innerHTML=`
      <div class="slab-header ${ag.id}">
        <span>${ag.name}</span>
        <span class="slab-grade ${isPerfect?'perfect':''}">${graded.grade}</span>
      </div>
      <div class="slab-card-area">
        <div class="slab-emoji">${card.emoji}</div>
        <div class="slab-name" style="color:${r.color}">${card.name}</div>
        <div class="slab-rarity" style="background:${r.color}22;color:${r.color}">${r.name}</div>
        ${subGradeHtml}
      </div>
      <div class="slab-footer">
        <span>#${graded.serialNo}</span>
        <span>${new Date(graded.timestamp).toLocaleDateString()}</span>
      </div>
      <div class="slab-value-badge">💰 价值: ${fmt(gradedValue)}</div>
      <button class="mc-btn gold" style="font-size:7px;padding:5px 12px;margin:6px;" onclick="sellGraded(${i})">出售</button>
    `;
    g.appendChild(el);
  });
}

function sellGraded(sortedIdx){
  // We need to find the actual index in GS.gradedCards
  const sorted = [...GS.gradedCards].sort((a,b)=>b.grade-a.grade);
  const graded = sorted[sortedIdx];
  if(!graded)return;
  
  const actualIdx = GS.gradedCards.indexOf(graded);
  if(actualIdx<0)return;
  
  const card = getCardById(graded.cardId);
  const ag = GRADING_AGENCIES.find(a=>a.id===graded.agency);
  const r = RARITIES[card.rarity];
  const baseValue = Math.floor(10 * r.sellMult);
  const gradeMult = graded.grade >= 10 ? ag.valueMult * 3 : graded.grade >= 9 ? ag.valueMult * 2 : graded.grade >= 8 ? ag.valueMult * 1.5 : ag.valueMult;
  const gradedValue = Math.floor(baseValue * gradeMult);
  
  GS.gradedCards.splice(actualIdx,1);
  addGold(gradedValue);
  GS.totalCardsSold++;
  addXP(20);
  toast(`💰 售出评级卡 ${card.name} (${ag.name} ${graded.grade}分)，+${gradedValue}金币！`);
  renderGradedCards();saveGame();checkAchievements();
}

// ===== ACHIEVEMENTS =====
function renderAchievements(){
  const g=document.getElementById('achievementsGrid');g.innerHTML='';
  ACHIEVEMENTS.forEach(a=>{
    const done=GS.achievements[a.id];
    const el=document.createElement('div');el.className=`achievement ${done?'unlocked':''}`;
    el.innerHTML=`<div class="achievement-icon">${done?'✅':a.icon}</div><div class="achievement-info"><div class="achievement-name">${a.name}</div><div class="achievement-desc">${a.desc}</div>${done?'<div style="font-size:7px;color:var(--mc-gold);margin-top:2px;">✓ 已完成 (+💰'+a.reward+')</div>':''}</div>`;
    g.appendChild(el);
  });
}

function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(!GS.achievements[a.id]&&a.check()){
      GS.achievements[a.id]=true;addGold(a.reward);
      toast(`🏆 成就解锁: ${a.name} (+💰${a.reward})`);
    }
  });
}

// ===== NAV =====
document.querySelectorAll('.nav-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    // Special handling for fullshop tab
    if(tab.dataset.page==='fullshop'){
      enterFullShop();
      return;
    }
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+tab.dataset.page).classList.add('active');
    if(tab.dataset.page==='collection')renderCollection();
    if(tab.dataset.page==='myshop'){renderShelf();renderShopInventory();}
    if(tab.dataset.page==='upgrades')renderUpgrades();
    if(tab.dataset.page==='achievements')renderAchievements();
    if(tab.dataset.page==='shop')renderPackShop();
    if(tab.dataset.page==='grading')renderGrading();
  });
});

// ===== INTRO BACKGROUND INIT =====
function initIntroBackground(){
  // Stars
  const starsContainer = document.getElementById('introStars');
  if(starsContainer){
    for(let i=0;i<60;i++){
      const star = document.createElement('div');
      star.className='intro-star-dot';
      star.style.left=Math.random()*100+'%';
      star.style.top=Math.random()*100+'%';
      const size = 1+Math.floor(Math.random()*3);
      star.style.width=size+'px';
      star.style.height=size+'px';
      star.style.animationDelay=Math.random()*3+'s';
      star.style.animationDuration=(1.5+Math.random()*2)+'s';
      starsContainer.appendChild(star);
    }
  }
  
  // Floating MC items
  const floatContainer = document.getElementById('introFloatItems');
  if(floatContainer){
    const items=['⛏️','🗡️','💎','🔥','🌲','🍎','🏹','🧱','🪵','⭐','🛡️','🔱','🧪','🎣','🪣','🍖',
                 '🏠','⚔️','📖','🔮','💰','🎁','🃏','🌟','💫','🪨','⚡','🐉','👑','🗝️'];
    for(let i=0;i<20;i++){
      const el = document.createElement('div');
      el.className='intro-float-item';
      el.textContent=items[Math.floor(Math.random()*items.length)];
      el.style.left=Math.random()*95+'%';
      el.style.top=5+Math.random()*55+'%';
      el.style.fontSize=(14+Math.random()*24)+'px';
      el.style.animationDelay=Math.random()*12+'s';
      el.style.animationDuration=(8+Math.random()*12)+'s';
      floatContainer.appendChild(el);
    }
  }
  
  // Ambient falling particles (leaves, pollen)
  const ambientContainer = document.getElementById('introAmbient');
  if(ambientContainer){
    const particles=['🍃','🍂','✨','·','·','🌸'];
    for(let i=0;i<15;i++){
      const el=document.createElement('div');
      el.className='intro-ambient-particle';
      el.textContent=particles[Math.floor(Math.random()*particles.length)];
      el.style.left=Math.random()*100+'%';
      el.style.fontSize=(6+Math.random()*10)+'px';
      el.style.animationDelay=Math.random()*10+'s';
      el.style.animationDuration=(8+Math.random()*8)+'s';
      el.style.opacity='0.4';
      ambientContainer.appendChild(el);
    }
  }
}

// Run intro background on load
initIntroBackground();

// ===== INIT =====
function startGame(){
  document.getElementById('introOverlay').classList.add('hidden');
  document.getElementById('topBar').style.display='';
  document.getElementById('navTabs').style.display='';
  document.getElementById('mainContent').style.display='';
  loadGame();updateUI();renderPackShop();checkAchievements();
  // Resume grading timers if any pending
  if(GS.gradingQueue.some(i=>i.grade===null)) startGradingTimers();
}

// ===== FULLSCREEN SHOP MODE =====
let fullShopMode = false;
let walkingCustomer = null;

const CUSTOMER_SKINS = ['steve','alex','villager','wanderer','miner','rich','enderman','creeper-fan','blaze','ice-mage','nether','farmer','librarian','pirate','redstone','knight','witch','guard'];

function enterFullShop(){
  fullShopMode = true;
  const overlay = document.getElementById('fullshopOverlay');
  overlay.classList.add('active');
  updateFullShop();
  startFsAmbient();
  
  // Don't mess with nav active state for this special tab
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
}

function exitFullShop(){
  fullShopMode = false;
  document.getElementById('fullshopOverlay').classList.remove('active');
  stopFsAmbient();
  // Restore myshop tab
  document.querySelectorAll('.nav-tab').forEach(t=>{
    if(t.dataset.page==='myshop') t.classList.add('active');
  });
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-myshop').classList.add('active');
  renderShelf();renderShopInventory();
}

function updateFullShop(){
  if(!fullShopMode) return;
  
  // Update stats
  const gEl=document.getElementById('fsGold');
  const lEl=document.getElementById('fsLevel');
  const rEl=document.getElementById('fsReputation');
  if(gEl) gEl.textContent=fmt(GS.gold);
  if(lEl) lEl.textContent=GS.level;
  if(rEl) rEl.textContent=GS.reputation;
  
  // Update buttons
  const openBtn=document.getElementById('fsOpenBtn');
  const closeBtn=document.getElementById('fsCloseBtn');
  if(GS.shopOpen){
    if(openBtn)openBtn.style.display='none';
    if(closeBtn)closeBtn.style.display='';
  }else{
    if(openBtn)openBtn.style.display='';
    if(closeBtn)closeBtn.style.display='none';
  }
  
  // Render shelf
  renderFsShelf();
  // Render customer
  renderFsCustomer();
}

function renderFsShelf(){
  const g=document.getElementById('fsShelfGrid');if(!g)return;
  const total=6+GS.upgrades.shelfSize;
  g.innerHTML='';
  for(let i=0;i<total;i++){
    const slot=GS.shelf[i];
    const el=document.createElement('div');
    el.className='fs-shelf-slot';
    if(slot){
      const card=getCardById(slot.cardId);
      el.innerHTML=`<div class="fs-slot-emoji">${card.emoji}</div><div style="font-size:8px;color:${RARITIES[card.rarity].color};margin-top:2px;">${card.name}</div><div class="fs-slot-price">💰${slot.price}</div>`;
      el.onclick=()=>removeFromShelf(i);
    }else{
      el.classList.add('fs-empty');
      el.onclick=()=>{selectedShelfSlot=i;renderShopInventory();exitFullShop();
        document.querySelectorAll('.nav-tab').forEach(t=>{
          if(t.dataset.page==='myshop'){t.classList.add('active');}
        });
        document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
        document.getElementById('page-myshop').classList.add('active');
        renderShelf();renderShopInventory();
      };
    }
    g.appendChild(el);
  }
}

// Track FS customer animation state
let fsCustomerAnimState = 'none'; // none | entering | idle | exiting

function renderFsCustomer(){
  const stage=document.getElementById('fsCustomerStage');if(!stage)return;
  const c=GS.currentCustomer;
  
  // If exiting animation is playing, don't overwrite
  if(fsCustomerAnimState==='exiting') return;
  
  if(!c){
    // Only show empty if not in exit animation
    if(fsCustomerAnimState==='none'){
      stage.innerHTML='';
      const empty=document.createElement('div');
      empty.className='fs-customer-empty';
      empty.id='fsCustomerEmpty';
      empty.innerHTML=GS.shopOpen
        ?'<div style="font-size:40px;margin-bottom:12px;">👀</div><div>等待顾客光临...</div>'
        :'<div style="font-size:40px;margin-bottom:12px;">🚪</div><div>店铺未开张</div>';
      stage.appendChild(empty);
    }
    return;
  }
  
  // If already showing this customer in idle, just update timer & buttons
  const existingWrapper=stage.querySelector('.fs-pixel-customer-wrapper');
  if(existingWrapper && fsCustomerAnimState==='idle'){
    // Update budget tag
    const tag=stage.querySelector('.fs-customer-budget-tag');
    if(tag) tag.textContent=`💰 预算: ${c.budget} 金币 | ⏰ ${c.timeLeft}s`;
    return;
  }
  
  // Build new customer display with walk-in
  fsCustomerAnimState='entering';
  stage.innerHTML='';
  const display=document.createElement('div');
  display.className='fs-customer-display';
  display.id='fsCustomerDisplay';
  
  // Use the customer's fixed skin
  const skin=c.skin||'steve';
  
  // Build pixel character with walk-in animation
  display.innerHTML=`
    <div class="fs-pixel-customer-wrapper fs-walking-in" data-skin="${skin}" id="fsPixelCustomer">
      <div class="fs-pixel-nametag">${c.name}</div>
      <div class="pixel-steve" style="transform:scale(2.5);">
        <div class="pixel-steve-head"></div>
        <div class="pixel-steve-body"></div>
        <div class="pixel-steve-arm-l"></div>
        <div class="pixel-steve-arm-r"></div>
        <div class="pixel-steve-leg-l"></div>
        <div class="pixel-steve-leg-r"></div>
      </div>
    </div>
    <div class="fs-customer-dialog-bubble" style="opacity:0;" id="fsDialogBubble">
      <div style="margin-bottom:6px;font-size:13px;color:var(--mc-diamond);">${c.name}</div>
      <div>${c.dialog}</div>
    </div>
    <div class="fs-customer-budget-tag" style="opacity:0;" id="fsBudgetTag">💰 预算: ${c.budget} 金币 | ⏰ ${c.timeLeft}s</div>
  `;
  
  // Sell buttons (initially hidden)
  const shelfCards=GS.shelf.map((s,i)=>s?{idx:i,...s,card:getCardById(s.cardId)}:null).filter(Boolean);
  let matches=[];
  if(c.wantType==='specific')matches=shelfCards.filter(s=>s.card.id===c.wantCard.id);
  else if(c.wantType==='rarity')matches=shelfCards.filter(s=>s.card.rarity===c.wantCard.rarity);
  else matches=shelfCards;
  matches=matches.filter(s=>s.price<=c.budget);
  
  if(matches.length>0){
    const btns=document.createElement('div');
    btns.className='fs-customer-sell-btns';
    btns.id='fsSellBtns';
    btns.style.opacity='0';
    matches.forEach(m=>{
      const b=document.createElement('button');
      b.className='mc-btn green';
      b.style.fontSize='11px';b.style.padding='10px 18px';
      b.textContent=`卖出 ${m.card.name} (💰${m.price})`;
      b.onclick=()=>{
        // Trigger buy exit animation in fullshop
        triggerFsCustomerExit(true);
        sellToCustomer(m.idx);
      };
      btns.appendChild(b);
    });
    display.appendChild(btns);
  }
  
  stage.appendChild(display);
  
  // Sequence: walk in (1.2s) → stop & show dialog (0.3s fade) → show buttons
  setTimeout(()=>{
    const wrapper=document.getElementById('fsPixelCustomer');
    if(!wrapper) return;
    wrapper.classList.remove('fs-walking-in');
    wrapper.classList.add('fs-idle');
    fsCustomerAnimState='idle';
    
    // Fade in dialog
    const dialog=document.getElementById('fsDialogBubble');
    const budget=document.getElementById('fsBudgetTag');
    const btns=document.getElementById('fsSellBtns');
    if(dialog){dialog.style.transition='opacity 0.4s ease';dialog.style.opacity='1';}
    if(budget){setTimeout(()=>{budget.style.transition='opacity 0.4s ease';budget.style.opacity='1';},200);}
    if(btns){setTimeout(()=>{btns.style.transition='opacity 0.4s ease';btns.style.opacity='1';},400);}
  },1200);
}

// Trigger fullshop customer exit animation
function triggerFsCustomerExit(bought){
  if(fsCustomerAnimState==='exiting' || fsCustomerAnimState==='none') return;
  fsCustomerAnimState='exiting';
  
  const stage=document.getElementById('fsCustomerStage');if(!stage)return;
  const wrapper=document.getElementById('fsPixelCustomer');
  const dialog=document.getElementById('fsDialogBubble');
  const budget=document.getElementById('fsBudgetTag');
  const btns=document.getElementById('fsSellBtns');
  
  // Hide buttons and dialog immediately
  if(btns) btns.style.display='none';
  
  if(bought && wrapper){
    // === PURCHASE EXIT: happy jump + coins + walk right ===
    
    // Show happy speech
    if(dialog){
      const happyMsgs=['太棒了！','好开心！','谢谢老板！','值了！','下次还来！'];
      dialog.innerHTML=`<div style="font-size:16px;margin-bottom:4px;">😄</div><div>${happyMsgs[Math.floor(Math.random()*happyMsgs.length)]}</div>`;
    }
    
    // Spawn flying coins from character
    const rect=wrapper.getBoundingClientRect();
    for(let i=0;i<8;i++){
      setTimeout(()=>{
        const coin=document.createElement('div');
        coin.className='fs-fly-coin';
        coin.textContent=['💰','✨','💚','⭐'][i%4];
        coin.style.left=(rect.left+rect.width/2+(-20+Math.random()*40))+'px';
        coin.style.top=(rect.top)+'px';
        document.body.appendChild(coin);
        setTimeout(()=>coin.remove(),1200);
      },i*100);
    }
    
    // Happy jump
    wrapper.classList.remove('fs-idle');
    wrapper.classList.add('fs-happy-jump');
    
    // After jump, walk out to right
    setTimeout(()=>{
      if(dialog){dialog.style.transition='opacity 0.3s';dialog.style.opacity='0';}
      if(budget){budget.style.transition='opacity 0.3s';budget.style.opacity='0';}
      wrapper.classList.remove('fs-happy-jump');
      wrapper.classList.add('fs-walk-out-right');
      
      // Clean up after walk out
      setTimeout(()=>{
        fsCustomerAnimState='none';
        stage.innerHTML='';
        renderFsCustomer(); // show empty state
      },1200);
    },800);
    
  }else if(wrapper){
    // === TIMEOUT EXIT: sad shake + walk left ===
    
    // Show sad speech
    if(dialog){
      const sadMsgs=['算了，走了...','等太久了！','下次吧...','没有想要的...','哼，不买了'];
      dialog.innerHTML=`<div style="font-size:16px;margin-bottom:4px;">😞</div><div>${sadMsgs[Math.floor(Math.random()*sadMsgs.length)]}</div>`;
    }
    
    // Sad head shake
    wrapper.classList.remove('fs-idle');
    wrapper.classList.add('fs-sad-shake');
    
    // After shake, walk out to left
    setTimeout(()=>{
      if(dialog){dialog.style.transition='opacity 0.3s';dialog.style.opacity='0';}
      if(budget){budget.style.transition='opacity 0.3s';budget.style.opacity='0';}
      wrapper.classList.remove('fs-sad-shake');
      wrapper.classList.add('fs-walk-out-left');
      
      setTimeout(()=>{
        fsCustomerAnimState='none';
        stage.innerHTML='';
        renderFsCustomer(); // show empty state
      },1200);
    },800);
    
  }else{
    // No wrapper, just clear
    fsCustomerAnimState='none';
    stage.innerHTML='';
    renderFsCustomer();
  }
}

// Fullshop ambient particles
let fsAmbientInt=null;
function startFsAmbient(){
  if(fsAmbientInt)return;
  const container=document.getElementById('fsAmbientParticles');if(!container)return;
  fsAmbientInt=setInterval(()=>{
    const p=document.createElement('div');
    p.className='shop-ambient-particle';
    const types=['💰','✨','⭐','💎','🃏'];
    p.textContent=types[Math.floor(Math.random()*types.length)];
    p.style.left=Math.random()*100+'%';
    p.style.bottom='-20px';
    p.style.fontSize=(12+Math.random()*12)+'px';
    p.style.animationDuration=(8+Math.random()*6)+'s';
    container.appendChild(p);
    setTimeout(()=>p.remove(),14000);
  },1500);
}
function stopFsAmbient(){
  if(fsAmbientInt){clearInterval(fsAmbientInt);fsAmbientInt=null;}
}

// ===== MC PIXEL CUSTOMER WALK SYSTEM =====
// Creates a walking pixel-art Minecraft character that walks across the screen

function buildPixelCharacterHTML(skin){
  return `
    <div class="pixel-steve" style="transform:scale(1.5);">
      <div class="pixel-steve-head"></div>
      <div class="pixel-steve-body"></div>
      <div class="pixel-steve-arm-l"></div>
      <div class="pixel-steve-arm-r"></div>
      <div class="pixel-steve-leg-l"></div>
      <div class="pixel-steve-leg-r"></div>
    </div>
  `;
}

function spawnWalkingCustomer(name, dialog, fromRight){
  const overlay=document.getElementById('mcCustomerWalkOverlay');
  if(!overlay)return;
  
  // Remove existing walking character
  const existing=overlay.querySelector('.mc-walk-character');
  if(existing)existing.remove();
  
  // Use the customer's bound skin instead of random
  const skin=(GS.currentCustomer && GS.currentCustomer.skin) || CUSTOMER_SKINS[Math.floor(Math.random()*CUSTOMER_SKINS.length)];
  
  const char=document.createElement('div');
  char.className='mc-walk-character';
  char.setAttribute('data-skin', skin);
  
  // Name tag
  char.innerHTML=`
    <div class="mc-walk-nametag">${name}</div>
    ${buildPixelCharacterHTML(skin)}
  `;
  
  // Walk direction
  if(fromRight){
    char.style.right='-120px';
    char.style.left='auto';
    char.style.transform='scaleX(-1)';
    char.style.animation=`walkInFromRight 3s ease-out forwards`;
  }else{
    char.style.left='-120px';
    char.style.animation=`walkInFromLeft 3s ease-out forwards`;
  }
  
  overlay.appendChild(char);
  walkingCustomer=char;
  
  // After walk-in, stop and show speech bubble
  setTimeout(()=>{
    char.classList.add('stopped');
    // Fix position at center
    if(fromRight){
      char.style.animation='none';
      char.style.right='auto';
      char.style.left='calc(50% - 30px)';
    }else{
      char.style.animation='none';
      char.style.left='calc(50% - 30px)';
    }
    char.style.transform='none'; // face right
    
    // Add speech bubble
    const speech=document.createElement('div');
    speech.className='mc-walk-speech';
    speech.textContent=dialog;
    char.appendChild(speech);
    
    // Auto-remove speech bubble
    setTimeout(()=>{
      if(speech.parentNode)speech.remove();
    },4000);
    
  },3000);
}

function removeWalkingCustomer(bought){
  const overlay=document.getElementById('mcCustomerWalkOverlay');
  if(!overlay)return;
  const char=overlay.querySelector('.mc-walk-character');
  if(!char)return;
  
  // Remove speech
  const speech=char.querySelector('.mc-walk-speech');
  if(speech)speech.remove();
  
  // Unfreeze legs
  char.classList.remove('stopped');
  
  if(bought){
    // Spawn flying coins
    const rect=char.getBoundingClientRect();
    for(let i=0;i<5;i++){
      setTimeout(()=>{
        const coin=document.createElement('div');
        coin.className='mc-fly-coin';
        coin.textContent='💰';
        coin.style.left=(rect.left+Math.random()*40)+'px';
        coin.style.top=(rect.top-20)+'px';
        document.body.appendChild(coin);
        setTimeout(()=>coin.remove(),1000);
      },i*150);
    }
  }
  
  // Walk out
  char.style.animation=`walkOutToRight 2s ease-in forwards`;
  setTimeout(()=>{
    char.remove();
    walkingCustomer=null;
  },2000);
}

// ===== HOOK INTO EXISTING SHOP SYSTEM =====
// Override spawnCustomer to also trigger walk animation
const _originalSpawnCustomer = spawnCustomer;
spawnCustomer = function(){
  _originalSpawnCustomer();
  
  if(GS.currentCustomer){
    // Trigger walking animation
    const fromRight = Math.random()>0.5;
    spawnWalkingCustomer(
      GS.currentCustomer.name,
      GS.currentCustomer.dialog,
      fromRight
    );
    
    // Reset FS customer anim state and update fullshop mode
    if(fullShopMode){
      fsCustomerAnimState='none';
      setTimeout(()=>renderFsCustomer(),100);
    }
  }
};

// Override sellToCustomer for walk-out animation
const _originalSellToCustomer = sellToCustomer;
sellToCustomer = function(shelfIdx){
  const hadCustomer = !!GS.currentCustomer;
  
  // If in fullshop mode, trigger fs exit animation (don't call triggerFsCustomerExit here, 
  // it's already called from the sell button onclick in renderFsCustomer)
  
  _originalSellToCustomer(shelfIdx);
  
  if(hadCustomer){
    // Trigger walk-out with purchase after original 600ms timeout
    setTimeout(()=>{
      removeWalkingCustomer(true);
      // Update fullshop after exit animation finishes
      setTimeout(()=>updateFullShop(),1500);
    },700);
  }
};

// Override customerLeave for walk-out animation
const _originalCustomerLeave = customerLeave;
customerLeave = function(bought){
  const hadCustomer = !!GS.currentCustomer;
  
  // Trigger fullshop exit animation BEFORE clearing the customer
  if(hadCustomer && fullShopMode){
    triggerFsCustomerExit(bought);
  }
  
  _originalCustomerLeave(bought);
  
  if(hadCustomer){
    removeWalkingCustomer(bought);
    // Delayed fullshop update (let exit animation play)
    setTimeout(()=>updateFullShop(),2500);
  }
};

// Override updateUI to also update fullshop
const _originalUpdateUI = updateUI;
updateUI = function(){
  _originalUpdateUI();
  updateFullShop();
};

// Also sync the fullshop log
const _originalAddLog = addLog;
addLog = function(msg, isSale){
  _originalAddLog(msg, isSale);
  
  // Also add to fullshop mini log
  const fsLog=document.getElementById('fsLogMini');
  if(fsLog){
    const el=document.createElement('div');
    el.className=`log-entry ${isSale?'sale':isSale===false?'miss':''}`;
    const now=new Date();
    el.textContent=`[${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}] ${msg}`;
    fsLog.prepend(el);
    if(fsLog.children.length>20)fsLog.lastChild.remove();
  }
};

// Click outside modal to close
document.getElementById('cardModal').addEventListener('click',e=>{if(e.target===document.getElementById('cardModal'))closeModal();});
