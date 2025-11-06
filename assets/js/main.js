
// assets/js/main.js
const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";
let fontes = [], rodovias = [], regioes = {};
let articles = [];

async function fetchJSON(path){ const r = await fetch(path); return r.json(); }
function nowStr(){ return new Date().toLocaleString(); }
function updateDateTime(){ document.getElementById('datetime').textContent = nowStr(); }
setInterval(updateDateTime,1000); updateDateTime();

async function initMain(){
  fontes = await fetchJSON('data/fontes.json');
  rodovias = await fetchJSON('data/rodovias.json');
  regioes = await fetchJSON('data/regioes.json');
  populateRoads();
  document.getElementById('refreshBtn').addEventListener('click', fetchAll);
  document.getElementById('downloadCsv').addEventListener('click', downloadCsv);
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('typeFilter').addEventListener('change', applyFilters);
  document.getElementById('regionFilter').addEventListener('change', applyFilters);
  document.getElementById('roadFilter').addEventListener('change', applyFilters);
  await fetchAll();
  // auto update every 15 minutes
  setInterval(fetchAll, 15*60*1000);
}

function populateRoads(){
  const sel = document.getElementById('roadFilter');
  sel.innerHTML = '<option value="all">Todas as Rodovias</option>';
  (rodovias.BRs||[]).forEach(b=>{ const o=document.createElement('option'); o.value=b; o.textContent=b; sel.appendChild(o); });
}

async function fetchAll(){
  const newsList = document.getElementById('newsList');
  newsList.innerHTML = 'Carregando notícias...';
  articles = [];
  // 1) fetch from fontes (RSS)
  for(const f of fontes){
    try{
      const url = RSS2JSON + encodeURIComponent(f.url);
      const res = await fetch(url);
      if(!res.ok) continue;
      const j = await res.json();
      if(j.items) j.items.forEach(it=>articles.push({title:it.title||'', description:it.description||'', link:it.link||'', pubDate:it.pubDate||it.isoDate||'', source:f.name}));
    }catch(e){ console.warn('feed error', f.url, e); }
  }
  // 2) supplement with Google News search queries for key terms (to broaden)
  const keywords = ['acidente','roubo','furto','interdição','trânsito','caminhão','rodovia'];
  for(const kw of keywords){
    try{
      const gurl = RSS2JSON + encodeURIComponent('https://news.google.com/rss/search?q=' + encodeURIComponent(kw + ' brasil'));
      const res = await fetch(gurl);
      if(!res.ok) continue;
      const j = await res.json();
      if(j.items) j.items.forEach(it=>articles.push({title:it.title||'', description:it.description||'', link:it.link||'', pubDate:it.pubDate||it.isoDate||'', source:'GoogleNews'}));
    }catch(e){ console.warn('googlenews err', e); }
  }

  // deduplicate by link
  const uniq = {}; articles = articles.filter(a=>{ if(!a.link) return false; if(uniq[a.link]) return false; uniq[a.link]=true; return true; });
  document.getElementById('last-collection').textContent = 'Última coleta: ' + nowStr() + ' • ' + articles.length + ' itens';
  classifyArticles();
  applyFilters();
  // update map markers
  try{ window.updateMapMarkers(articles); }catch(e){}
}

function classifyArticles(){
  const cats = {
    "Acidente": ["acidente","colisão","batida","tombamento","capot"],
    "Roubo / Furto": ["roubo","furto","assalto","carga roubada"],
    "Trânsito / Lentidão": ["trânsito","lentidão","engarrafamento","congestionamento"],
    "Interdição": ["interdição","interditada","pista interditada","bloqueio"],
    "Portos / Marítimo": ["porto","navio","terminal portuário"],
    "Leis / Regulação": ["ANTT","DNIT","lei","regulamentação"],
    "Sindicatos / Greve": ["sindicato","greve","paralisação"]
  };
  articles.forEach(a=>{
    a.category='Outros';
    const text=(a.title+' '+a.description).toLowerCase();
    for(const [cat, words] of Object.entries(cats)){
      for(const w of words){ if(text.includes(w)) { a.category=cat; break; } }
      if(a.category!== 'Outros') break;
    }
    // detect region
    a.region = detectRegion(a);
    // detect road
    a.road = detectRoad(a);
  });
}

function detectRegion(a){
  const text=(a.title+' '+a.description).toLowerCase();
  for(const [reg, states] of Object.entries(regioes)){
    for(const st of states){
      if(text.includes(st.toLowerCase()) || text.includes(stateFullName(st))) return reg;
    }
  }
  return 'Desconhecida';
}
function stateFullName(code){
  const map = {SP:'são paulo',RJ:'rio de janeiro',MG:'minas gerais',ES:'espírito santo',PR:'paraná',SC:'santa catarina',RS:'rio grande do sul',BA:'bahia',PE:'pernambuco',CE:'ceará',PB:'paraíba',RN:'rio grande do norte',SE:'sergipe',AL:'alagoas',MA:'maranhão',PI:'piauí',PA:'pará',AM:'amazonas',RO:'rondônia',AC:'acre',RR:'roraima',AP:'amapá',TO:'tocantins',MT:'mato grosso',MS:'mato grosso do sul',GO:'goiás',DF:'distrito federal'};
  return map[code]||'';
}

function detectRoad(a){
  const text=(a.title+' '+a.description).toUpperCase();
  for(const r of (rodovias.BRs||[])){
    if(text.includes(r.replace('-','')) || text.includes(r)) return r;
  }
  const m = text.match(/BR[ -]?(\d{1,3})/);
  if(m) return 'BR-' + m[1];
  return 'Desconhecida';
}

function applyFilters(){
  const q=document.getElementById('searchInput').value.trim().toLowerCase();
  const type=document.getElementById('typeFilter').value;
  const region=document.getElementById('regionFilter').value;
  const road=document.getElementById('roadFilter').value;
  let filtered=articles.filter(a=>{
    if(q && !(a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))) return false;
    if(type!=='all' && a.category!==type) return false;
    if(region!=='all' && a.region!==region) return false;
    if(road!=='all' && a.road!==road) return false;
    return true;
  });
  renderList(filtered);
  updateStats(filtered);
  try{ updateChartsSummary(filtered); }catch(e){}
  try{ window.updateMapMarkers(filtered); }catch(e){}
}

function renderList(list){
  const container=document.getElementById('newsList'); container.innerHTML='';
  if(!list.length){ container.innerHTML='<div>Nenhuma notícia encontrada.</div>'; return; }
  list.slice(0,300).forEach(it=>{
    const d=document.createElement('div'); d.className='news-item';
    d.innerHTML = `<div class="news-title"><a href="${it.link}" target="_blank">${escapeHtml(it.title)}</a></div>
      <div class="news-desc">${escapeHtml(stripTags(it.description).slice(0,350))}</div>
      <div class="news-meta">${it.source} • ${it.pubDate} • ${it.category} • ${it.road} • ${it.region}</div>`;
    container.appendChild(d);
  });
}

function updateStats(list){
  document.getElementById('stat-total').textContent=list.length;
  document.getElementById('stat-acidentes').textContent=list.filter(a=>a.category==='Acidente').length;
  document.getElementById('stat-interdicoes').textContent=list.filter(a=>a.category==='Interdição').length;
  document.getElementById('stat-transito').textContent=list.filter(a=>a.category==='Trânsito / Lentidão').length;
  document.getElementById('stat-roubo').textContent=list.filter(a=>a.category==='Roubo / Furto').length;
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function stripTags(s){ return (s||'').replace(/(<([^>]+)>)/gi,""); }

function downloadCsv(){
  const rows = Array.from(document.querySelectorAll('.news-item')).map(div=>{
    return {
      title: div.querySelector('.news-title a').textContent,
      link: div.querySelector('.news-title a').href,
      desc: div.querySelector('.news-desc').textContent,
      meta: div.querySelector('.news-meta').textContent
    };
  });
  const csv = toCsv(rows);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='con_export.csv'; a.click(); URL.revokeObjectURL(url);
}
function toCsv(rows){ if(!rows.length) return ''; const keys=Object.keys(rows[0]); const lines=[keys.join(',')]; rows.forEach(r=>{ lines.push(keys.map(k=>`"${(r[k]||'').replace(/"/g,'""')}"`).join(',')); }); return lines.join('\n'); }

window.addEventListener('load', initMain);
