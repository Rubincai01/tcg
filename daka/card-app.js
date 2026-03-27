// ===== State =====
const STORAGE_KEY = 'cardCollectionData';
let cards = [], currentFilter = 'all', currentView = 'grid', currentAlertFilter = 'all', expandedSeries = null;

// ===== Init =====
function init() {
  // v2: 强制加载真实收藏数据（替换旧示例缓存）
  const DATA_VERSION = 'v3_with_images';
  const savedVer = localStorage.getItem(STORAGE_KEY + '_ver');
  if (savedVer !== DATA_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY + '_ver', DATA_VERSION);
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  cards = saved ? (()=>{try{return JSON.parse(saved)}catch(e){return [...DEFAULT_CARDS]}})() : [...DEFAULT_CARDS];
  document.querySelectorAll('.nav-item').forEach(i=>i.addEventListener('click',()=>switchPage(i.dataset.page)));
  document.getElementById('sidebarBackdrop').addEventListener('click',toggleSidebar);
  renderAll();
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); }
function renderAll(){ renderDashboard(); renderCollection(); renderAlerts(); renderCatalog(); renderAnalytics(); renderAddForm(); renderScanPage(); renderSync(); }

// ===== Navigation =====
function switchPage(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${p}"]`)?.classList.add('active');
  if(p==='alerts') document.getElementById('notifDot').style.display='none';
}
function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarBackdrop').classList.toggle('active'); }

// ===== Toast =====
function showToast(msg,type='info'){
  const c=document.getElementById('toastContainer'), t=document.createElement('div');
  t.className='toast '+type; t.textContent=msg; c.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

// ===== Modal =====
function closeModal(id){ document.getElementById(id).classList.remove('active'); }
function openAddModal(){ document.getElementById('addCardModal').classList.add('active'); }

// ===== Search =====
function handleSearch(q){
  if(!q.trim()){ switchPage('collection'); currentFilter='all'; renderCollection(); return; }
  switchPage('collection');
  const lq=q.toLowerCase();
  const filtered=cards.filter(c=>(c.player+c.playerCN+c.series+c.team+c.parallel+(c.tags||[]).join('')).toLowerCase().includes(lq));
  const grid=document.getElementById('collectionGrid');
  grid.innerHTML=filtered.length?filtered.map(c=>cardHTML(c)).join(''):'<div class="empty-state"><div class="empty-icon">🔍</div><h3>未找到匹配卡牌</h3><p>尝试不同的搜索词</p></div>';
}

// ===== Dashboard =====
function renderDashboard(){
  const tv=cards.reduce((s,c)=>s+(c.price||0),0), tc=cards.reduce((s,c)=>s+(c.cost||0),0);
  const profit=tv-tc, pp=tc>0?((profit/tc)*100).toFixed(1):0;
  const ac=cards.length?(cards.reduce((s,c)=>s+(c.change||0),0)/cards.length).toFixed(1):0;
  document.getElementById('page-dashboard').innerHTML=`
    <h1 class="page-title">仪表盘</h1><p class="page-subtitle">你的球星卡收藏总览</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-header"><div class="stat-icon" style="background:rgba(59,130,246,.15)">🃏</div><span class="stat-change up">活跃</span></div><div class="stat-value">${cards.length}</div><div class="stat-label">总收藏数量</div></div>
      <div class="stat-card"><div class="stat-header"><div class="stat-icon" style="background:rgba(245,158,11,.2)">💰</div><span class="stat-change ${profit>=0?'up':'down'}">${profit>=0?'+':''}${pp}%</span></div><div class="stat-value">¥${tv.toLocaleString()}</div><div class="stat-label">收藏总估值</div></div>
      <div class="stat-card"><div class="stat-header"><div class="stat-icon" style="background:rgba(16,185,129,.15)">📈</div><span class="stat-change ${profit>=0?'up':'down'}">${profit>=0?'+':''}¥${Math.abs(profit).toLocaleString()}</span></div><div class="stat-value">¥${tc.toLocaleString()}</div><div class="stat-label">总投入成本</div></div>
      <div class="stat-card"><div class="stat-header"><div class="stat-icon" style="background:rgba(139,92,246,.15)">🔥</div><span class="stat-change ${ac>=0?'up':'down'}">${ac>=0?'+':''}${ac}%</span></div><div class="stat-value">${ac>=0?'+':''}${ac}%</div><div class="stat-label">平均涨跌幅</div></div>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
      <div><h3 style="font-size:15px;font-weight:700;margin-bottom:12px">最近添加</h3>
        <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
          ${[...cards].sort((a,b)=>new Date(b.addedDate)-new Date(a.addedDate)).slice(0,4).map(c=>cardHTML(c)).join('')}
        </div>
      </div>
      <div><h3 style="font-size:15px;font-weight:700;margin-bottom:12px">价格异动</h3>
        ${[...cards].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,5).map(c=>`
          <div class="top-card-row" style="cursor:pointer" onclick="openCardDetail('${c.id}')">
            <div style="font-size:20px">${c.sport==='Football'?'⚽':'🏀'}</div>
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${c.playerCN||c.player}</div><div style="font-size:11px;color:var(--text-muted)">${c.parallel}</div></div>
            <div class="card-trend ${c.change>=0?'up':'down'}" style="font-size:14px;font-weight:700">${c.change>=0?'▲':'▼'} ${Math.abs(c.change)}%</div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ===== Collection =====
function renderCollection(){
  const sortSel = document.getElementById('sortSelect');
  document.getElementById('page-collection').innerHTML=`
    <h1 class="page-title">我的收藏</h1><p class="page-subtitle">管理你所有的球星卡</p>
    <div class="cards-toolbar">
      <div class="filter-chips" id="filterChips">
        ${['all','Basketball','Football','Rookie','Auto','Patch'].map(f=>`<div class="chip ${currentFilter===f?'active':''}" onclick="setFilter('${f}')">${{all:'全部',Basketball:'🏀 篮球',Football:'⚽ 足球',Rookie:'🌟 新秀',Auto:'✍️ 签字',Patch:'🧩 Patch'}[f]}</div>`).join('')}
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-icon btn-outline ${currentView==='grid'?'active':''}" onclick="setView('grid')" style="${currentView==='grid'?'background:var(--accent);color:#fff':''}">⊞</button>
        <button class="btn btn-icon btn-outline ${currentView==='list'?'active':''}" onclick="setView('list')" style="${currentView==='list'?'background:var(--accent);color:#fff':''}">☰</button>
      </div>
      <select id="sortSelect" onchange="renderCollection()" style="padding:6px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px;outline:none">
        <option value="date">最近添加</option><option value="price-desc">价格↓</option><option value="price-asc">价格↑</option><option value="name">名称 A-Z</option><option value="change">涨幅↓</option>
      </select>
    </div>
    <div class="card-grid ${currentView==='list'?'list-view':''}" id="collectionGrid"></div>`;

  let filtered=[...cards];
  if(currentFilter==='Basketball'||currentFilter==='Football') filtered=filtered.filter(c=>c.sport===currentFilter);
  else if(['Rookie','Auto','Patch'].includes(currentFilter)) filtered=filtered.filter(c=>c.tags&&c.tags.includes(currentFilter));

  const sort=document.getElementById('sortSelect')?.value||'date';
  if(sort==='date') filtered.sort((a,b)=>new Date(b.addedDate)-new Date(a.addedDate));
  else if(sort==='price-desc') filtered.sort((a,b)=>(b.price||0)-(a.price||0));
  else if(sort==='price-asc') filtered.sort((a,b)=>(a.price||0)-(b.price||0));
  else if(sort==='name') filtered.sort((a,b)=>a.player.localeCompare(b.player));
  else if(sort==='change') filtered.sort((a,b)=>(b.change||0)-(a.change||0));

  document.getElementById('collectionGrid').innerHTML=filtered.length
    ? filtered.map(c=>cardHTML(c)).join('')
    : '<div class="empty-state"><div class="empty-icon">🃏</div><h3>暂无卡牌</h3><p>点击"添加卡牌"开始管理你的收藏</p></div>';
}
function setFilter(f){currentFilter=f;renderCollection();}
function setView(v){currentView=v;renderCollection();}

function cardHTML(card){
  const badges=[];
  if(card.tags?.includes('Rookie')) badges.push('<span class="card-badge rookie">RC</span>');
  if(card.tags?.includes('Auto')) badges.push('<span class="card-badge auto">AUTO</span>');
  if(card.tags?.includes('Patch')) badges.push('<span class="card-badge auto">PATCH</span>');
  if(card.numbered) badges.push(`<span class="card-badge numbered">${card.numbered}</span>`);
  if(card.parallel&&card.parallel!=='Base') badges.push(`<span class="card-badge parallel">${card.parallel}</span>`);
  const isAuction=DEFAULT_ALERTS.some(a=>a.cardId===card.id&&a.type==='auction');
  const si=card.sport==='Football'?'⚽':'🏀';
  return`<div class="card-item" onclick="openCardDetail('${card.id}')">
    <div class="card-image">${card.image?`<img src="${card.image}" alt="${card.player}">`:`<div class="card-placeholder">${si}</div>`}
      <div class="card-badges">${badges.join('')}</div>${isAuction?'<div class="auction-tag">🔨 上拍中</div>':''}
    </div>
    <div class="card-info"><div class="card-name">${card.playerCN||card.player}</div><div class="card-series">${card.series} ${card.number||''}</div>
      <div class="card-meta"><span class="card-price">¥${(card.price||0).toLocaleString()}</span><span class="card-trend ${(card.change||0)>=0?'up':'down'}">${(card.change||0)>=0?'▲':'▼'} ${Math.abs(card.change||0)}%</span></div>
    </div></div>`;
}

// ===== Card Detail =====
function openCardDetail(id){
  const c=cards.find(x=>x.id===id); if(!c) return;
  document.getElementById('modalTitle').textContent=c.playerCN||c.player;
  const si=c.sport==='Football'?'⚽':'🏀', profit=(c.price||0)-(c.cost||0), pp=c.cost>0?((profit/c.cost)*100).toFixed(1):'N/A';
  const h=c.priceHistory||[], mx=Math.max(...h,1);
  const months=['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'].slice(-h.length);
  const rs=CATALOG_DATA.find(s=>c.series.includes(s.name.split(' ').slice(1,4).join(' ')));
  document.getElementById('modalBody').innerHTML=`<div class="detail-grid"><div>
    <div class="detail-image">${c.image?`<img src="${c.image}">`:`<div class="card-placeholder">${si}</div>`}</div>
    <div class="price-chart-container" style="margin-top:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="font-size:14px;font-weight:700">📈 价格走势（近12期）</h3><span style="font-size:11px;color:var(--text-muted)">盖高卡牌/eBay/卡淘</span></div>
      <div class="chart-bars">${h.map((p,i)=>{const ht=(p/mx)*120;const prev=i>0?h[i-1]:p;const col=p>=prev?'var(--red)':'var(--green)';return`<div class="chart-bar" style="height:${ht}px;background:${col}"><div class="chart-tooltip">¥${p.toLocaleString()}</div></div>`;}).join('')}</div>
      <div class="chart-labels">${months.map(m=>`<span>${m}</span>`).join('')}</div>
    </div></div><div>
    <div class="detail-info-section"><h3>基本信息</h3>
      <div class="detail-row"><span class="label">球员</span><span class="value">${c.player}</span></div>
      <div class="detail-row"><span class="label">中文名</span><span class="value">${c.playerCN||'-'}</span></div>
      <div class="detail-row"><span class="label">球队</span><span class="value">${c.team||'-'}</span></div>
      <div class="detail-row"><span class="label">运动</span><span class="value">${si} ${c.sport==='Football'?'足球':'篮球'}</span></div></div>
    <div class="detail-info-section"><h3>卡牌信息</h3>
      <div class="detail-row"><span class="label">系列</span><span class="value">${c.series}</span></div>
      <div class="detail-row"><span class="label">卡号</span><span class="value">${c.number||'-'}</span></div>
      <div class="detail-row"><span class="label">平行版本</span><span class="value">${c.parallel||'Base'}</span></div>
      <div class="detail-row"><span class="label">编号</span><span class="value">${c.numbered||'无编号'}</span></div>
      <div class="detail-row"><span class="label">类型</span><span class="value">${c.tags?.join(', ')||'普通'}</span></div></div>
    <div class="detail-info-section"><h3>估值信息</h3>
      <div class="detail-row"><span class="label">当前估价</span><span class="value" style="color:var(--gold);font-size:16px">¥${(c.price||0).toLocaleString()}</span></div>
      <div class="detail-row"><span class="label">购入成本</span><span class="value">¥${(c.cost||0).toLocaleString()}</span></div>
      <div class="detail-row"><span class="label">盈亏</span><span class="value" style="color:${profit>=0?'var(--red)':'var(--green)'}">${profit>=0?'+':''}¥${Math.abs(profit).toLocaleString()} (${profit>=0?'+':''}${pp}%)</span></div>
      <div class="detail-row"><span class="label">近期走势</span><span class="value" style="color:${(c.change||0)>=0?'var(--red)':'var(--green)'}">${(c.change||0)>=0?'▲':'▼'} ${Math.abs(c.change||0)}%</span></div>
      <div class="detail-row"><span class="label">添加日期</span><span class="value">${c.addedDate||'-'}</span></div></div>
    ${rs?`<div class="detail-info-section"><h3>📖 所属系列图鉴</h3>
      <div style="background:var(--bg-card);padding:12px;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="closeModal('cardDetailModal');switchPage('catalog')">
        <div style="font-size:14px;font-weight:700;margin-bottom:4px">${rs.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">${rs.description}</div>
        <div style="font-size:12px;color:var(--text-secondary)">共 ${rs.totalCards} 张 · ${rs.parallels.length} 种平行版本</div>
        <div style="font-size:11px;color:var(--accent);margin-top:6px">→ 点击查看完整图鉴</div></div></div>`:''}
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-outline btn-sm" onclick="deleteCard('${c.id}')">🗑️ 删除</button>
      <button class="btn btn-gold btn-sm" onclick="showToast('已设置价格提醒','success')">🔔 设置提醒</button>
    </div></div></div>`;
  document.getElementById('cardDetailModal').classList.add('active');
}
function deleteCard(id){if(!confirm('确定删除？'))return;cards=cards.filter(c=>c.id!==id);saveData();closeModal('cardDetailModal');renderAll();showToast('卡牌已删除','info');}

// ===== Alerts =====
function renderAlerts(){
  let al=[...DEFAULT_ALERTS];
  if(currentAlertFilter!=='all') al=al.filter(a=>a.type===currentAlertFilter);
  document.getElementById('page-alerts').innerHTML=`
    <h1 class="page-title">上拍 & 价格提醒</h1><p class="page-subtitle">追踪拍卖动态和价格变化</p>
    <div style="display:flex;gap:12px;margin-bottom:20px">
      ${['all','auction','price','new'].map(t=>`<button class="btn btn-sm ${currentAlertFilter===t?'btn-primary':'btn-outline'}" onclick="filterAlerts('${t}')">${{all:'全部',auction:'🔨 上拍',price:'💰 价格变动',new:'🆕 新品发布'}[t]}</button>`).join('')}
    </div>
    <div class="alert-list">${al.map(a=>`
      <div class="alert-item ${a.unread?'unread':''}">
        <div class="alert-icon ${a.type==='auction'?'auction':a.type==='price'?'price-up':'new'}">${a.type==='auction'?'🔨':a.type==='price'?'💰':'🆕'}</div>
        <div class="alert-content"><div class="alert-title">${a.title}</div><div class="alert-desc">${a.desc}</div></div>
        <div class="alert-time">${a.time}</div></div>`).join('')}
    </div>`;
  document.getElementById('alertBadge').textContent=DEFAULT_ALERTS.filter(a=>a.unread).length;
}
function filterAlerts(t){currentAlertFilter=t;renderAlerts();}

// ===== Catalog =====
function renderCatalog(){
  let catFilter='all';
  const render=(f)=>{
    catFilter=f;
    let filtered=CATALOG_DATA;
    if(f==='Basketball'||f==='Football') filtered=CATALOG_DATA.filter(s=>s.sport===f);
    else if(f!=='all') filtered=CATALOG_DATA.filter(s=>s.brand===f);
    document.getElementById('page-catalog').innerHTML=`
      <h1 class="page-title">系列图鉴</h1><p class="page-subtitle">浏览主流球星卡系列全图鉴，查看收集进度</p>
      <div class="cards-toolbar" style="margin-bottom:16px"><div class="filter-chips">
        ${['all','Panini','Topps','Basketball','Football'].map(b=>`<div class="chip ${catFilter===b?'active':''}" onclick="window._renderCat('${b}')">${{all:'全部品牌',Panini:'Panini',Topps:'Topps',Basketball:'🏀 篮球',Football:'⚽ 足球'}[b]}</div>`).join('')}
      </div></div>
      <div class="catalog-series">${filtered.map(s=>{
        const oc=cards.filter(c=>c.series.includes(s.name.split(' ').slice(1,3).join(' '))).length;
        return`<div class="series-card" onclick="toggleSeries('${s.id}')">
          <div class="series-banner" style="background:${s.color}"><div class="series-title-overlay"><h3>${s.name}</h3><p>${s.year} · ${s.brand}</p></div></div>
          <div class="series-info"><div class="series-stats"><div class="series-stat">总卡数 <strong>${s.totalCards}</strong></div><div class="series-stat">已拥有 <strong style="color:var(--green)">${oc}</strong></div><div class="series-stat">平行版 <strong>${s.parallels.length}</strong></div></div>
          <div class="series-tags">${s.parallels.slice(0,5).map(p=>`<span class="series-tag">${p}</span>`).join('')}${s.parallels.length>5?`<span class="series-tag">+${s.parallels.length-5}更多</span>`:''}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">${s.description}</div></div></div>`;}).join('')}</div>
      <div id="seriesDetail"></div>`;
  };
  render('all');
  window._renderCat=render;
}
function toggleSeries(sid){
  const s=CATALOG_DATA.find(x=>x.id===sid); if(!s)return;
  const el=document.getElementById('seriesDetail');
  if(expandedSeries===sid){expandedSeries=null;el.innerHTML='';return;}
  expandedSeries=sid;
  el.innerHTML=`<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:24px;animation:fadeIn .3s ease">
    <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">${s.name} · 全系列图鉴</h3>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${s.description}</p>
    <div style="margin-bottom:16px"><h4 style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">平行版本彩虹</h4>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${s.parallels.map(p=>`<span style="padding:4px 10px;border-radius:16px;font-size:11px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-secondary)">${p}</span>`).join('')}</div></div>
    <h4 style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">球员列表（部分）</h4>
    <div class="catalog-cards-grid">${s.sampleCards.map(name=>{
      const owned=cards.some(c=>c.player===name);const icon=s.sport==='Football'?'⚽':'🏀';
      return`<div class="catalog-card-mini ${owned?'owned':''}"><div class="mini-image">${icon}</div><div class="mini-info"><div class="mini-name">${name}</div><div class="mini-num">${s.year}</div></div></div>`;}).join('')}</div></div>`;
  el.scrollIntoView({behavior:'smooth',block:'start'});
}

// ===== Analytics =====
function renderAnalytics(){
  const tv=cards.reduce((s,c)=>s+(c.price||0),0), tc=cards.reduce((s,c)=>s+(c.cost||0),0);
  const bv=cards.filter(c=>c.sport==='Basketball').reduce((s,c)=>s+(c.price||0),0);
  const fv=cards.filter(c=>c.sport==='Football').reduce((s,c)=>s+(c.price||0),0);
  const bc=cards.filter(c=>c.sport==='Basketball').length, fc=cards.filter(c=>c.sport==='Football').length;

  // Portfolio history
  const ph=[]; for(let i=0;i<12;i++){let t=0;cards.forEach(c=>{if(c.priceHistory&&c.priceHistory[i])t+=c.priceHistory[i];});ph.push(t);}
  const mp=Math.max(...ph,1);
  const months=['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'];
  const top=[...cards].sort((a,b)=>(b.price||0)-(a.price||0)).slice(0,8);

  // Series breakdown
  const sm={};cards.forEach(c=>{if(!sm[c.series])sm[c.series]={count:0,value:0};sm[c.series].count++;sm[c.series].value+=(c.price||0);});
  const se=Object.entries(sm).sort((a,b)=>b[1].value-a[1].value);

  document.getElementById('page-analytics').innerHTML=`
    <h1 class="page-title">数据分析</h1><p class="page-subtitle">深度洞察收藏价值与市场趋势</p>
    <div class="analytics-grid">
      <div class="analytics-chart-box"><h3>📈 收藏组合价值走势</h3>
        <div class="chart-bars" style="height:180px">${ph.map((v,i)=>{const h=(v/mp)*160;const pv=i>0?ph[i-1]:v;const col=v>=pv?'var(--red)':'var(--green)';return`<div class="chart-bar" style="height:${h}px;background:${col}"><div class="chart-tooltip">¥${v.toLocaleString()}</div></div>`;}).join('')}</div>
        <div class="chart-labels">${months.map(m=>`<span>${m}</span>`).join('')}</div>
      </div>
      <div class="analytics-chart-box"><h3>🏀⚽ 运动分布</h3>
        <div style="display:flex;justify-content:center;margin:20px 0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="60" fill="none" stroke="var(--border)" stroke-width="20"/>
            <circle cx="80" cy="80" r="60" fill="none" stroke="var(--accent)" stroke-width="20" stroke-dasharray="${(bv/Math.max(tv,1))*377} 377" transform="rotate(-90 80 80)"/>
            <circle cx="80" cy="80" r="60" fill="none" stroke="var(--green)" stroke-width="20" stroke-dasharray="${(fv/Math.max(tv,1))*377} 377" stroke-dashoffset="${-(bv/Math.max(tv,1))*377}" transform="rotate(-90 80 80)"/>
          </svg>
        </div>
        <div style="text-align:center;margin-bottom:12px"><div style="font-size:24px;font-weight:800">¥${tv.toLocaleString()}</div><div style="font-size:11px;color:var(--text-muted)">总估值</div></div>
        <div class="legend">
          <div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div>🏀 篮球 ${bc}张 ¥${bv.toLocaleString()} (${tv?(bv/tv*100).toFixed(0):0}%)</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--green)"></div>⚽ 足球 ${fc}张 ¥${fv.toLocaleString()} (${tv?(fv/tv*100).toFixed(0):0}%)</div>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="analytics-chart-box"><h3>🏆 最高估值 TOP 8</h3>
        ${top.map((c,i)=>`<div class="top-card-row" style="cursor:pointer" onclick="openCardDetail('${c.id}')">
          <div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;${i===0?'background:var(--gold);color:#000':i===1?'background:#94a3b8;color:#000':i===2?'background:#b45309;color:#fff':'background:var(--bg-secondary)'}">${i+1}</div>
          <div style="flex:1"><div style="font-size:13px;font-weight:600">${c.playerCN||c.player}</div><div style="font-size:11px;color:var(--text-muted)">${c.series}</div></div>
          <div style="font-size:14px;font-weight:700;color:var(--gold)">¥${(c.price||0).toLocaleString()}</div></div>`).join('')}
      </div>
      <div class="analytics-chart-box"><h3>📦 系列分布</h3>
        ${se.map(([name,d])=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1"><div style="font-size:12px;font-weight:600">${name}</div><div style="font-size:10px;color:var(--text-muted)">${d.count}张卡</div></div>
          <div style="width:100px;height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden"><div style="height:100%;width:${(d.value/Math.max(tv,1))*100}%;background:var(--accent);border-radius:3px"></div></div>
          <div style="font-size:12px;font-weight:600;min-width:80px;text-align:right">¥${d.value.toLocaleString()}</div></div>`).join('')}
      </div>
    </div>`;
}

// ===== Scan =====
function renderScanPage(){
  document.getElementById('page-scan').innerHTML=`
    <h1 class="page-title">AI 扫描估值</h1><p class="page-subtitle">拍照或上传卡牌图片，智能识别并估算市场价值</p>
    <div class="scan-area">
      <div class="scan-box" onclick="document.getElementById('scanInput').click()">
        <div class="scan-icon">📷</div><div class="scan-text">点击拍照或拖拽上传卡牌图片</div><div class="scan-hint">支持 JPG / PNG，建议正面拍摄光线充足</div>
        <input type="file" id="scanInput" accept="image/*" style="display:none" onchange="handleScan(this)">
      </div>
      <div class="scan-result" id="scanResult"></div>
    </div>`;
}
function handleScan(input){
  if(!input.files||!input.files[0])return;
  const file=input.files[0], reader=new FileReader();
  reader.onload=function(e){
    const imgSrc=e.target.result;
    // Simulate AI scan
    const demo=DEFAULT_CARDS[Math.floor(Math.random()*DEFAULT_CARDS.length)];
    const el=document.getElementById('scanResult');
    el.classList.add('active');
    el.innerHTML=`
      <div style="display:flex;gap:16px;margin-bottom:16px">
        <img src="${imgSrc}" style="width:120px;height:160px;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
        <div style="flex:1">
          <div style="font-size:10px;color:var(--accent);font-weight:600;margin-bottom:4px">🤖 AI 识别结果</div>
          <div style="font-size:18px;font-weight:800;margin-bottom:4px">${demo.playerCN||demo.player}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${demo.series} ${demo.number} · ${demo.parallel}</div>
          <div style="font-size:24px;font-weight:800;color:var(--gold);margin-bottom:4px">¥${(demo.price||0).toLocaleString()}</div>
          <div style="font-size:11px;color:var(--text-muted)">AI 估价 · 基于近期成交数据</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="addFromScan('${demo.id}')">✓ 添加到收藏</button>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('scanResult').classList.remove('active')">重新扫描</button>
      </div>`;
  };
  reader.readAsDataURL(file);
}
function addFromScan(demoId){
  const demo=DEFAULT_CARDS.find(c=>c.id===demoId);
  if(demo&&!cards.find(c=>c.id===demo.id)){cards.push({...demo});saveData();showToast('已添加到收藏','success');renderAll();}
  else showToast('该卡牌已在收藏中','warning');
}

// ===== Add Card =====
function renderAddForm(){
  document.getElementById('addCardBody').innerHTML=`
    <form onsubmit="handleAddCard(event)">
      <div class="form-row"><div class="form-group"><label>球员名称 *</label><input type="text" name="player" required placeholder="如：Luka Dončić"></div>
        <div class="form-group"><label>中文名</label><input type="text" name="playerCN" placeholder="如：卢卡·东契奇"></div></div>
      <div class="form-row"><div class="form-group"><label>系列 *</label><select name="series" required><option value="">请选择</option>
        <option>2024-25 Panini Prizm</option><option>2024-25 Panini Select</option><option>2024-25 Panini Mosaic</option><option>2024-25 Panini National Treasures</option><option>2024-25 Panini Flawless</option>
        <option>2025-26 Topps Chrome</option><option>2024-25 Topps Chrome UCL</option><option>2024-25 Topps Merlin</option><option>2024-25 Panini Prizm Football</option><option>其他</option></select></div>
        <div class="form-group"><label>卡号</label><input type="text" name="number" placeholder="#1"></div></div>
      <div class="form-row"><div class="form-group"><label>平行版本</label><select name="parallel">
        <option value="Base">Base 普卡</option><option value="Silver Prizm">Silver Prizm</option><option value="Gold Prizm">Gold Prizm</option><option value="Green Prizm">Green Prizm</option>
        <option value="Red Prizm">Red Prizm</option><option value="Blue Prizm">Blue Prizm</option><option value="Black Prizm">Black Prizm</option>
        <option value="Mojo">Mojo</option><option value="Tiger Stripe">Tiger Stripe</option><option value="Shimmer">Shimmer</option><option value="Other">其他</option></select></div>
        <div class="form-group"><label>编号</label><input type="text" name="numbered" placeholder="/25"></div></div>
      <div class="form-row"><div class="form-group"><label>运动</label><select name="sport"><option value="Basketball">🏀 篮球</option><option value="Football">⚽ 足球</option></select></div>
        <div class="form-group"><label>球队</label><input type="text" name="team" placeholder="如：Dallas Mavericks"></div></div>
      <div class="form-row"><div class="form-group"><label>预估价格 (¥)</label><input type="number" name="price" placeholder="市场估价"></div>
        <div class="form-group"><label>购入价 (¥)</label><input type="number" name="cost" placeholder="购入成本"></div></div>
      <div class="form-group"><label>类型标签</label><div style="display:flex;gap:8px;flex-wrap:wrap">
        ${['Rookie','Auto','Patch','Insert','Graded'].map(t=>`<label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;color:var(--text-secondary)"><input type="checkbox" name="tags" value="${t}"> ${t}</label>`).join('')}</div></div>
      <div class="form-group"><label>图片URL</label><input type="url" name="image" placeholder="可选"></div>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
        <button type="button" class="btn btn-outline" onclick="closeModal('addCardModal')">取消</button>
        <button type="submit" class="btn btn-primary">添加到收藏</button></div></form>`;
}
function handleAddCard(e){
  e.preventDefault(); const f=new FormData(e.target);
  const tags=f.getAll('tags');
  const card={
    id:'c'+Date.now(), player:f.get('player'), playerCN:f.get('playerCN'), series:f.get('series'),
    number:f.get('number'), parallel:f.get('parallel'), numbered:f.get('numbered'),
    tags, price:Number(f.get('price'))||0, cost:Number(f.get('cost'))||0, change:0,
    image:f.get('image'), sport:f.get('sport')||'Basketball', team:f.get('team'),
    addedDate:new Date().toISOString().split('T')[0], priceHistory:[]
  };
  cards.push(card); saveData(); closeModal('addCardModal');
  renderAll(); showToast('卡牌已添加！','success');
}

// ===== Data Sync (Import / Export) =====
function renderSync(){
  const ts = new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
  document.getElementById('page-sync').innerHTML=`
    <h1 class="page-title">数据同步</h1>
    <p class="page-subtitle">在不同设备间迁移你的收藏数据</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:800px">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:24px">
        <div style="font-size:32px;margin-bottom:12px">📤</div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:8px">导出数据</h3>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;line-height:1.6">
          将当前所有卡牌数据导出为 JSON 文件。<br>可用于备份或迁移到其他设备。
        </p>
        <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;margin-bottom:16px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">当前数据概况</div>
          <div style="font-size:14px;font-weight:700">${cards.length} 张卡牌 · ¥${cards.reduce((s,c)=>s+(c.price||0),0).toLocaleString()} 总估值</div>
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="exportData()">📥 导出 JSON 文件</button>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:24px">
        <div style="font-size:32px;margin-bottom:12px">📥</div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:8px">导入数据</h3>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;line-height:1.6">
          从 JSON 文件导入卡牌数据。<br>可选择覆盖或合并现有数据。
        </p>
        <div style="background:var(--bg-secondary);border-radius:8px;padding:16px;margin-bottom:16px;text-align:center;cursor:pointer;border:2px dashed var(--border);transition:border-color .2s" onclick="document.getElementById('importInput').click()" onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border)'">
          <div style="font-size:20px;margin-bottom:4px">📁</div>
          <div style="font-size:12px;color:var(--text-secondary)">点击选择 JSON 文件</div>
          <input type="file" id="importInput" accept=".json" style="display:none" onchange="handleImportFile(this)">
        </div>
        <div id="importPreview"></div>
      </div>
    </div>
    <div style="margin-top:24px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:20px;max-width:800px">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:12px">💡 使用说明</h3>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.8">
        <p><strong>跨设备同步步骤：</strong></p>
        <ol style="padding-left:20px;margin:8px 0">
          <li>在当前设备点击「导出 JSON 文件」下载数据</li>
          <li>将 JSON 文件通过微信/邮件/U盘等方式传到另一台设备</li>
          <li>在另一台设备打开本页面，点击「导入数据」上传 JSON 文件</li>
          <li>选择「覆盖」或「合并」模式完成同步</li>
        </ol>
        <p style="color:var(--text-muted);margin-top:8px">⚠️ 建议在导入前先导出备份当前数据，以防万一。</p>
      </div>
    </div>`;
}

function exportData(){
  const exportObj = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cardCount: cards.length,
    cards: cards
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `球星卡收藏_${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`已导出 ${cards.length} 张卡牌数据`, 'success');
}

let _pendingImport = null;

function handleImportFile(input){
  if(!input.files||!input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data = JSON.parse(e.target.result);
      let importCards;
      // 兼容两种格式：直接数组 或 {cards:[...]} 对象
      if(Array.isArray(data)){
        importCards = data;
      } else if(data.cards && Array.isArray(data.cards)){
        importCards = data.cards;
      } else {
        showToast('文件格式不正确，请选择有效的 JSON 文件','error');
        return;
      }
      // 基本校验：每张卡至少要有 id 和 player
      const valid = importCards.filter(c => c.id && c.player);
      if(valid.length === 0){
        showToast('未找到有效的卡牌数据','error');
        return;
      }
      _pendingImport = valid;
      const tv = valid.reduce((s,c)=>s+(c.price||0),0);
      const newCount = valid.filter(c => !cards.some(x=>x.id===c.id)).length;
      const dupeCount = valid.length - newCount;
      document.getElementById('importPreview').innerHTML=`
        <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">文件预览</div>
          <div style="font-size:14px;font-weight:700;margin-bottom:4px">${valid.length} 张卡牌 · ¥${tv.toLocaleString()}</div>
          <div style="font-size:11px;color:var(--text-muted)">${newCount} 张新卡 · ${dupeCount} 张已存在</div>
          ${data.exportedAt?`<div style="font-size:10px;color:var(--text-muted);margin-top:4px">导出时间：${new Date(data.exportedAt).toLocaleString()}</div>`:''}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" style="flex:1" onclick="doImport('replace')">🔄 覆盖现有</button>
          <button class="btn btn-gold btn-sm" style="flex:1" onclick="doImport('merge')">➕ 合并数据</button>
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:8px;text-align:center">
          覆盖 = 清除现有数据，用导入数据替换<br>
          合并 = 保留现有数据，新增不重复的卡牌
        </div>`;
    } catch(err){
      showToast('JSON 解析失败：' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

function doImport(mode){
  if(!_pendingImport) return;
  if(mode === 'replace'){
    if(!confirm(`确定覆盖？当前 ${cards.length} 张卡牌将被替换为导入的 ${_pendingImport.length} 张`)) return;
    cards = [..._pendingImport];
  } else {
    // 合并：以 id 为 key，已有的不覆盖，新的追加
    let added = 0;
    _pendingImport.forEach(c => {
      if(!cards.some(x => x.id === c.id)){
        cards.push({...c});
        added++;
      }
    });
    showToast(`合并完成：新增 ${added} 张卡牌`, 'success');
  }
  saveData();
  _pendingImport = null;
  renderAll();
  if(mode === 'replace') showToast(`已导入 ${cards.length} 张卡牌`, 'success');
}

// ===== Start =====
init();
