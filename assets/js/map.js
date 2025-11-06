
// assets/js/map.js
let map, markersLayer, brLayer;
async function initMap(){
  map = L.map('map').setView([-15, -55], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(map);
  markersLayer = L.markerClusterGroup();
  map.addLayer(markersLayer);
  // try to fetch DNIT WFS GeoJSON for rodovias (may be blocked by CORS in some hosts)
  const dnitUrl = 'https://servicos.dnit.gov.br/geoserver/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=rodovias_federais&outputFormat=application/json';
  try{
    const r = await fetch(dnitUrl);
    if(r.ok){
      const gj = await r.json();
      brLayer = L.geoJSON(gj, {style:{color:'#003D80', weight:3, opacity:0.6}}).addTo(map);
    }
  }catch(e){ console.warn('DNIT layer failed', e); }
}

function clearMarkers(){ if(markersLayer) markersLayer.clearLayers(); }

// update markers from articles
function updateMapMarkers(items){
  if(!map) initMap();
  clearMarkers();
  items.forEach(it=>{
    // choose marker position heuristically: if article mentions a BR and brLayer exists, try to find that br feature centroid
    let latlng = null;
    if(brLayer && it.road && it.road!=='Desconhecida'){
      brLayer.eachLayer(layer=>{
        if(!latlng && layer.feature && layer.feature.properties){
          const name = (layer.feature.properties.nome || layer.feature.properties.nome_rota || '').toString().toUpperCase();
          if(name.includes(it.road.replace('-',''))) {
            latlng = layer.getBounds().getCenter();
          }
        }
      });
    }
    // fallback: try to find state name and use approximate center coords (simple map)
    if(!latlng){
      const stateCenters = {'SP':[-22.0,-48.0],'RJ':[-22.7,-43.2],'MG':[-18.5,-44.0],'PR':[-25.3,-52.0],'RS':[-30.0,-53.2],'SC':[-27.0,-50.5],'BA':[-12.9,-41.7],'PE':[-8.4,-35.0],'CE':[-5.2,-39.3],'AM':[-3.1,-60.0],'PA':[-5.5,-52.7],'GO':[-15.8,-49.3],'DF':[-15.8,-47.9]};
      for(const k in stateCenters){
        if((it.title+it.description).toUpperCase().includes(k)) { latlng = stateCenters[k]; break; }
      }
    }
    if(!latlng) { latlng = [-15.0, -55.0]; } // center fallback
    const icon = createIconByCategory(it.category);
    const marker = L.marker(latlng, {icon: icon});
    const popup = `<strong>${escapeHtml(it.title)}</strong><br/>${it.source} • ${it.pubDate}<br/><a href="${it.link}" target="_blank">Abrir notícia</a>`;
    marker.bindPopup(popup);
    markersLayer.addLayer(marker);
  });
}

function createIconByCategory(cat){
  const html = `<div style="background:${colorForCategory(cat)};width:18px;height:18px;border-radius:50%;border:2px solid #fff;"></div>`;
  return L.divIcon({className:'custom-marker', html:html, iconSize:[24,24], iconAnchor:[12,12]});
}

function colorForCategory(cat){
  switch(cat){
    case 'Acidente': return '#d9534f'; // red
    case 'Interdição': return '#f0ad4e'; // orange
    case 'Trânsito / Lentidão': return '#f39c12'; // amber
    case 'Roubo / Furto': return '#6f42c1'; // purple
    case 'Portos / Marítimo': return '#17a2b8'; // teal
    default: return '#007bff';
  }
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

window.updateMapMarkers = updateMapMarkers;
window.addEventListener('load', initMap);
