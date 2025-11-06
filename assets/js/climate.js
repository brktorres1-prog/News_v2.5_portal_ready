
// assets/js/climate.js
async function loadClimate(){
  const el = document.getElementById('climateContent');
  try{
    const lat=-15.0, lon=-55.0;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const r = await fetch(url);
    if(!r.ok){ el.textContent='Não foi possível carregar clima.'; return; }
    const j = await r.json();
    const cw = j.current_weather;
    el.innerHTML = `<div><strong>Condição (código):</strong> ${cw.weathercode || 'N/A'}</div><div><strong>Temp:</strong> ${cw.temperature} °C</div><div><strong>Vento:</strong> ${cw.windspeed} m/s</div>`;
  }catch(e){ el.textContent='Erro ao obter clima.'; }
}
window.addEventListener('load', loadClimate);
