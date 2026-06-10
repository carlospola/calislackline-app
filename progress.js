// ============================================================
// PROGRESS SCREEN
// ============================================================
var progressData = [];
var chartRepsInst = null, chartTotalRepsInst = null, chartRPEInst = null;
var chartRIRPieInst = null;
var chartOvRPEInst = null;
var calCurrentMonth = null;
var currentProgressTab = 'exercise';

var CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#555', font: { family: 'DM Mono, monospace', size: 9 }, maxRotation: 0 }, grid: { color: 'rgba(255,255,255,0.03)' }, border: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#555', font: { family: 'DM Mono, monospace', size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' }, border: { color: 'rgba(255,255,255,0.05)' } }
  }
};

function switchProgressTab(tab){
  currentProgressTab = tab;
  document.getElementById('ptabExContent').style.display = tab === 'exercise' ? 'block' : 'none';
  document.getElementById('ptabOvContent').style.display = tab === 'overview' ? 'block' : 'none';
  document.getElementById('ptabEx').style.color = tab === 'exercise' ? 'var(--accent)' : '';
  document.getElementById('ptabEx').style.borderColor = tab === 'exercise' ? 'var(--accent)' : '';
  document.getElementById('ptabOv').style.color = tab === 'overview' ? 'var(--accent)' : '';
  document.getElementById('ptabOv').style.borderColor = tab === 'overview' ? 'var(--accent)' : '';
  if(tab === 'overview'){
    if(progressData.length > 0){ renderOverviewCharts(); }
    else { showProgress().then(function(){ switchProgressTab('overview'); }); }
  }
}

async function showProgress(){
  showScreen('progressScreen');
  switchProgressTab('exercise');
  var r = await sb.from('sessions')
    .select('id,workout_name,created_at,log_data')
    .eq('user_id', currentUser.id)
    .order('created_at', {ascending: true});
  progressData = r.data || [];
  var exercises = {};
  progressData.forEach(function(s){
    if(!s.log_data || !s.log_data.exercises) return;
    s.log_data.exercises.forEach(function(e){ if(e.name) exercises[e.name] = true; });
  });
  var sel = document.getElementById('progressExerciseSelect');
  sel.innerHTML = '<option value="">Seleziona esercizio...</option>';
  Object.keys(exercises).sort().forEach(function(name){
    var opt = document.createElement('option'); opt.value = name; opt.textContent = name; sel.appendChild(opt);
  });
  if(Object.keys(exercises).length >= 1){ sel.value = Object.keys(exercises)[0]; renderProgressCharts(); }
}

function destroyChart(inst){ if(inst) inst.destroy(); return null; }

function numOrNull(v){ return (typeof v === 'number' && !isNaN(v)) ? v : null; }

function getExSets(ex){
  if(Array.isArray(ex.sets)) return ex.sets.filter(function(s){ return s.reps > 0; }).map(function(s){ return { reps:s.reps, rir:numOrNull(s.rir), rpe:numOrNull(s.rpe), weight:s.weight||0, note:s.note||'' }; });
  if(ex.reps > 0) return [{ reps: ex.reps, rir: numOrNull(ex.rir), rpe: numOrNull(ex.rpe), weight: ex.weight||0, note: '' }];
  return [];
}

function makeBarOpts(extraY){
  var opts = JSON.parse(JSON.stringify(CHART_DEFAULTS));
  if(extraY) Object.assign(opts.scales.y, extraY);
  return opts;
}

function renderProgressCharts(){
  var exerciseName = document.getElementById('progressExerciseSelect').value;
  var period = parseInt(document.getElementById('progressPeriodSelect').value);
  var emptyEl = document.getElementById('progressEmpty');
  if(!exerciseName){ emptyEl.style.display='block'; return; }
  var cutoff = new Date(Date.now() - period * 24*60*60*1000);
  var filtered = progressData.filter(function(s){
    if(new Date(s.created_at) < cutoff) return false;
    if(!s.log_data || !s.log_data.exercises) return false;
    return s.log_data.exercises.some(function(e){ return e.name === exerciseName; });
  });
  if(!filtered.length){ emptyEl.style.display='block'; return; }
  emptyEl.style.display='none';
  var labels = filtered.map(function(s){ return new Date(s.created_at).toLocaleDateString('it-IT', {day:'numeric', month:'short'}); });

  // È un esercizio con peso? (almeno un set con weight > 0)
  var isWeighted = filtered.some(function(s){
    var ex = s.log_data.exercises.find(function(e){ return e.name === exerciseName; });
    return ex && getExSets(ex).some(function(st){ return st.weight > 0; });
  });

  var avgRepsData=[], totalRepsData=[], avgRPEData=[], maxWeightData=[];
  var prReps=0, grandTotalReps=0, totalSetsCount=0;
  var prWeight=0, weightSum=0, weightSetsCount=0, totalVolume=0;
  filtered.forEach(function(s){
    var ex = s.log_data.exercises.find(function(e){ return e.name === exerciseName; });
    if(!ex){ avgRepsData.push(0); totalRepsData.push(0); avgRPEData.push(null); maxWeightData.push(0); return; }
    var sets = getExSets(ex);
    if(!sets.length){ avgRepsData.push(0); totalRepsData.push(0); avgRPEData.push(null); maxWeightData.push(0); return; }
    var tot = sets.reduce(function(a,s){ return a+s.reps; },0);
    var avg = Math.round(tot/sets.length*10)/10;
    var rpeSets = sets.filter(function(s){ return s.rpe>0; });
    var avgRPE = rpeSets.length>0 ? Math.round(rpeSets.reduce(function(a,s){ return a+s.rpe; },0)/rpeSets.length*10)/10 : null;
    avgRepsData.push(avg); totalRepsData.push(tot); avgRPEData.push(avgRPE);
    sets.forEach(function(st){ if(st.reps > prReps) prReps = st.reps; });
    grandTotalReps += tot; totalSetsCount += sets.length;
    // peso
    var sessionMaxW = 0;
    sets.forEach(function(st){
      if(st.weight > 0){ weightSum += st.weight; weightSetsCount++; totalVolume += st.weight * st.reps; if(st.weight > sessionMaxW) sessionMaxW = st.weight; }
      if(st.weight > prWeight) prWeight = st.weight;
    });
    maxWeightData.push(sessionMaxW);
  });

  var lblPR = document.getElementById('pLblPR');
  var lblAvg = document.getElementById('pLblAvg');
  var lblTot = document.getElementById('pLblTot');
  var chartTitle = document.getElementById('pChartRepsTitle');
  var accent='#c8f060', accentDim='rgba(200,240,96,0.15)';

  if(isWeighted){
    var avgWeight = weightSetsCount>0 ? Math.round(weightSum/weightSetsCount*10)/10 : 0;
    document.getElementById('pStatSessions').textContent = totalSetsCount || '—';
    document.getElementById('pStatPR').textContent = prWeight ? prWeight+'kg' : '—';
    document.getElementById('pStatAvgReps').textContent = avgWeight ? avgWeight+'kg' : '—';
    document.getElementById('pStatTotalReps').textContent = totalVolume ? totalVolume+'kg' : '—';
    if(lblPR) lblPR.textContent = 'PESO MAX';
    if(lblAvg) lblAvg.textContent = 'PESO MEDIO';
    if(lblTot) lblTot.textContent = 'VOLUME';
    if(chartTitle) chartTitle.textContent = 'Peso massimo (kg)';
    chartRepsInst = destroyChart(chartRepsInst);
    chartRepsInst = new Chart(document.getElementById('chartReps').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:maxWeightData, backgroundColor:accentDim, borderColor:accent, borderWidth:1.5, borderRadius:4 }] }, options:makeBarOpts() });
  } else {
    var globalAvgReps = totalSetsCount>0 ? Math.round(grandTotalReps/totalSetsCount*10)/10 : 0;
    document.getElementById('pStatSessions').textContent = totalSetsCount || '—';
    document.getElementById('pStatPR').textContent = prReps || '—';
    document.getElementById('pStatAvgReps').textContent = globalAvgReps || '—';
    document.getElementById('pStatTotalReps').textContent = grandTotalReps || '—';
    if(lblPR) lblPR.textContent = 'MASSIMALE';
    if(lblAvg) lblAvg.textContent = 'MEDIA';
    if(lblTot) lblTot.textContent = 'TOT REPS';
    if(chartTitle) chartTitle.textContent = 'Media reps per set';
    chartRepsInst = destroyChart(chartRepsInst);
    chartRepsInst = new Chart(document.getElementById('chartReps').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:avgRepsData, backgroundColor:accentDim, borderColor:accent, borderWidth:1.5, borderRadius:4 }] }, options:makeBarOpts() });
  }

  chartTotalRepsInst = destroyChart(chartTotalRepsInst);
  chartTotalRepsInst = new Chart(document.getElementById('chartTotalReps').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:totalRepsData, backgroundColor:'rgba(200,240,96,0.1)', borderColor:'rgba(200,240,96,0.4)', borderWidth:1, borderRadius:4 }] }, options:makeBarOpts() });
  chartRPEInst = destroyChart(chartRPEInst);
  chartRPEInst = new Chart(document.getElementById('chartRPE').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:avgRPEData, backgroundColor:'rgba(255,100,60,0.2)', borderColor:'rgba(255,100,60,0.6)', borderWidth:1, borderRadius:4 }] }, options:makeBarOpts({ min:0, max:10 }) });
}

function calNavMonth(dir){
  if(calCurrentMonth === null){
    var now = new Date();
    calCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    calCurrentMonth = new Date(calCurrentMonth.getFullYear(), calCurrentMonth.getMonth() + dir, 1);
  }
  renderHeatmapMonth();
}

function renderOverviewCharts(){
  var period = parseInt(document.getElementById('progressPeriodSelectOv').value);
  var cutoff = new Date(Date.now() - period * 24*60*60*1000);
  var filtered = progressData.filter(function(s){ return new Date(s.created_at) >= cutoff; });

  var totalSets = 0, rpeSum = 0, rpeCount = 0;
  filtered.forEach(function(s){
    if(!s.log_data || !s.log_data.exercises) return;
    s.log_data.exercises.forEach(function(ex){
      var sets = getExSets(ex);
      totalSets += sets.length;
      sets.forEach(function(st){ if(st.rpe > 0){ rpeSum += st.rpe; rpeCount++; } });
    });
  });
  document.getElementById('ovStatSessions').textContent = filtered.length;
  document.getElementById('ovStatSets').textContent = totalSets;
  document.getElementById('ovStatRPE').textContent = rpeCount > 0 ? Math.round(rpeSum/rpeCount*10)/10 : '—';

  if(calCurrentMonth === null){
    var now = new Date();
    calCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  renderHeatmapMonth();

  var rpeLabels = [], rpeData = [];
  filtered.forEach(function(s){
    if(!s.log_data || !s.log_data.exercises) return;
    var rSum = 0, rCnt = 0;
    s.log_data.exercises.forEach(function(ex){ getExSets(ex).forEach(function(st){ if(st.rpe>0){ rSum+=st.rpe; rCnt++; } }); });
    if(rCnt > 0){
      rpeLabels.push(new Date(s.created_at).toLocaleDateString('it-IT', {day:'numeric', month:'short'}));
      rpeData.push(Math.round(rSum/rCnt*10)/10);
    }
  });
  chartOvRPEInst = destroyChart(chartOvRPEInst);
  if(rpeLabels.length > 0){
    chartOvRPEInst = new Chart(document.getElementById('chartOvRPE').getContext('2d'), {
      type: 'bar',
      data: { labels: rpeLabels, datasets: [{ data: rpeData, backgroundColor: 'rgba(255,100,60,0.2)', borderColor: 'rgba(255,100,60,0.6)', borderWidth: 1, borderRadius: 4 }] },
      options: makeBarOpts({ min: 0, max: 10 })
    });
  }

  var rirBuckets = { 'RIR 0': 0, 'RIR 1': 0, 'RIR 2': 0, 'RIR 3+': 0 };
  filtered.forEach(function(s){
    if(!s.log_data || !s.log_data.exercises) return;
    s.log_data.exercises.forEach(function(ex){
      getExSets(ex).forEach(function(st){
        var r = st.rir;
        if(r == null) return;
        if(r === 0) rirBuckets['RIR 0']++;
        else if(r === 1) rirBuckets['RIR 1']++;
        else if(r === 2) rirBuckets['RIR 2']++;
        else rirBuckets['RIR 3+']++;
      });
    });
  });
  var pieLabels = Object.keys(rirBuckets);
  var pieData = pieLabels.map(function(k){ return rirBuckets[k]; });
  var pieColors = ['#ff5f5f', '#ffaa44', '#c8f060', '#444'];
  var total = pieData.reduce(function(a,b){ return a+b; }, 0);
  chartRIRPieInst = destroyChart(chartRIRPieInst);
  if(total > 0){
    chartRIRPieInst = new Chart(document.getElementById('chartRIRPie').getContext('2d'), {
      type: 'doughnut',
      data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: pieColors, borderColor: '#141414', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' }
    });
  }
  var legend = document.getElementById('rirPieLegend');
  legend.innerHTML = pieLabels.map(function(l, i){
    var pct = total > 0 ? Math.round(pieData[i]/total*100) : 0;
    return '<div style="display:flex;align-items:center;gap:8px;">'
      + '<div style="width:10px;height:10px;border-radius:2px;background:'+pieColors[i]+';flex-shrink:0;"></div>'
      + '<span>'+l+' — <strong style="color:var(--text)">'+pct+'%</strong> ('+pieData[i]+')</span></div>';
  }).join('');
}

function renderHeatmapMonth(){
  var grid = document.getElementById('heatmapGrid');
  var label = document.getElementById('calMonthLabel');
  if(!grid || !calCurrentMonth) return;

  label.textContent = calCurrentMonth.toLocaleDateString('it-IT', {month:'long', year:'numeric'});

  var dayMap = {};
  progressData.forEach(function(s){
    var d = new Date(s.created_at);
    var key = d.toDateString();
    if(!dayMap[key]) dayMap[key] = [];
    dayMap[key].push(s);
  });

  var year = calCurrentMonth.getFullYear();
  var month = calCurrentMonth.getMonth();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var today = new Date(); today.setHours(0,0,0,0);

  var days = [];
  for(var d=1; d<=daysInMonth; d++) days.push(new Date(year, month, d));

  var firstDay = days[0];
  var dow = firstDay.getDay();
  var startOffset = (dow === 0 ? 6 : dow - 1);

  var slots = [];
  for(var i=0; i<startOffset; i++) slots.push(null);
  days.forEach(function(d){ slots.push(d); });
  while(slots.length % 7 !== 0) slots.push(null);
  var wkArrays = [];
  for(var i=0; i<slots.length; i+=7) wkArrays.push(slots.slice(i, i+7));

  grid.innerHTML = '';
  for(var wi=0; wi<wkArrays.length; wi++){
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:3px;align-items:center;';
    for(var di=0; di<7; di++){
      var cell = document.createElement('div');
      var d = wkArrays[wi][di];
      if(!d){
        cell.style.cssText = 'width:28px;height:28px;border-radius:3px;flex-shrink:0;background:transparent;';
      } else {
        var isFuture = d > today;
        var cnt = isFuture ? 0 : (dayMap[d.toDateString()] || []).length;
        var bg = isFuture ? 'rgba(255,255,255,0.03)' : cnt===0 ? 'var(--border2)' : cnt===1 ? 'rgba(200,240,96,0.35)' : cnt===2 ? 'rgba(200,240,96,0.65)' : '#c8f060';
        cell.style.cssText = 'width:28px;height:28px;border-radius:3px;flex-shrink:0;background:'+bg+';display:flex;align-items:flex-end;justify-content:flex-end;cursor:'+(cnt>0?'pointer':'default')+';';
        var numSpan = document.createElement('span');
        numSpan.style.cssText = 'font-size:9px;line-height:1;color:'+(cnt>0?'rgba(0,0,0,0.6)':isFuture?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.3)')+';padding:2px 3px;';
        numSpan.textContent = d.getDate();
        cell.appendChild(numSpan);
        if(cnt > 0){
          (function(day){
            cell.addEventListener('click', function(){
              var sessions = dayMap[day.toDateString()] || [];
              var modal = document.getElementById('heatmapDayModal');
              document.getElementById('heatmapDayTitle').textContent = day.toLocaleDateString('it-IT', {day:'numeric', month:'long', year:'numeric'});
              document.getElementById('heatmapDayContent').innerHTML = sessions.map(function(s){
                return '<div style="padding:8px 0;border-bottom:1px solid var(--border);">'
                  +'<div style="font-weight:600;color:var(--text);">'+esc(s.workout_name||'-')+'</div>'
                  +'<div style="font-size:11px;color:var(--muted);">'+new Date(s.created_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})+'</div></div>';
              }).join('');
              modal.style.display = 'flex';
            });
          })(d);
        }
      }
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
}
