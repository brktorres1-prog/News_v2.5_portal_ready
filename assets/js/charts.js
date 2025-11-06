
// assets/js/charts.js
let chartType=null, chartRegion=null;
function updateChartsSummary(filtered){
  const byType = {};
  const byRegion = {};
  filtered.forEach(a=>{ byType[a.category] = (byType[a.category]||0)+1; byRegion[a.region] = (byRegion[a.region]||0)+1; });
  const ctxType = document.getElementById('chartType').getContext('2d');
  const ctxRegion = document.getElementById('chartRegion').getContext('2d');
  const labelsType = Object.keys(byType);
  const dataType = Object.values(byType);
  const labelsRegion = Object.keys(byRegion);
  const dataRegion = Object.values(byRegion);
  if(chartType) chartType.destroy();
  if(chartRegion) chartRegion.destroy();
  chartType = new Chart(ctxType, {type:'bar', data:{labels:labelsType, datasets:[{label:'Ocorrências', data:dataType, backgroundColor:'#003D80'}]}, options:{responsive:true, maintainAspectRatio:false}});
  chartRegion = new Chart(ctxRegion, {type:'pie', data:{labels:labelsRegion, datasets:[{data:dataRegion, backgroundColor:['#003D80','#17a2b8','#6f42c1','#f0ad4e','#d9534f']}]}, options:{responsive:true, maintainAspectRatio:false}});
}
