// ============================================================
// PROGRESS SCREEN
// ============================================================
var progressData = [];
var chartRepsInst = null, chartTotalRepsInst = null, chartRPEInst = null;
var chartSetsInst = null;
var chartRirInst = null;
var chartRIRPieInst = null;
var chartOvRPEInst = null;
var chartOvSetsInst = null, chartOvTotRepsInst = null, chartOvVolInst = null, chartOvRirInst = null;
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

async function showProgress(targetUserId){
  // targetUserId valorizzato = admin che guarda i progressi di un atleta; back verso adminScreen
  var uid = targetUserId || currentUser.id;
  progressBackScreen = targetUserId ? 'adminScreen' : 'dashScreen';
  showScreen('progressScreen');
  switchProgressTab('exercise');
  var r = await sb.from('sessions')
    .select('id,workout_name,created_at,log_data')
    .eq('user_id', uid)
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
  switchProgressTab('overview');
}

function destroyChart(inst){ if(inst) inst.destroy(); return null; }

function numOrNull(v){ return (typeof v === 'number' && !isNaN(v)) ? v : null; }

function getExSets(ex){
  if(Array.isArray(ex.sets)) return ex.sets.filter(function(s){ return s.reps > 0; }).map(function(s){ return { reps:s.reps, rir:numOrNull(s.rir), rpe:numOrNull(s.rpe), weight:s.weight||0, note:s.note||'' }; });
  if(ex.reps > 0) return [{ reps: ex.reps, rir: numOrNull(ex.rir), rpe: numOrNull(ex.rpe), weight: ex.weight||0, note: '' }];
  return [];
}

function isTimedExercise(name, filtered){
  if(!name) return false;
  if(filtered && filtered.length){
    for(var i=0;i<filtered.length;i++){
      var ld = filtered[i].log_data;
      if(!ld || !ld.exercises) continue;
      var ex = ld.exercises.find(function(e){ return e.name===name; });
      if(ex && Array.isArray(ex.sets)){
        for(var k=0;k<ex.sets.length;k++){ if(ex.sets[k].metric==='time') return true; }
      }
    }
  }
  if(typeof currentProfile==='undefined' || !currentProfile || !currentProfile.workout_csv) return false;
  if(typeof parseWorkoutCsv!=='function' || typeof isTimedReps!=='function') return false;
  var p = parseWorkoutCsv(currentProfile.workout_csv);
  for(var w=0; w<p.orderedWorkouts.length; w++){
    var fields = p.fieldsByWorkout[p.orderedWorkouts[w]];
    for(var f=0; f<fields.length; f++){
      if(fields[f].nome===name && isTimedReps(fields[f].reps)) return true;
    }
  }
  return false;
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
  var isTimed = !isWeighted && isTimedExercise(exerciseName, filtered);

  var avgRepsData=[], totalRepsData=[], avgRPEData=[], avgRirData=[], maxWeightData=[], e1rmData=[], volumeData=[];
  var prReps=0, grandTotalReps=0, totalSetsCount=0;
  var prWeight=0, weightSum=0, weightSetsCount=0, bestSet=0;
  filtered.forEach(function(s){
    var ex = s.log_data.exercises.find(function(e){ return e.name === exerciseName; });
    if(!ex){ avgRepsData.push(0); totalRepsData.push(0); avgRPEData.push(null); avgRirData.push(null); maxWeightData.push(0); e1rmData.push(0); volumeData.push(0); return; }
    var sets = getExSets(ex);
    if(!sets.length){ avgRepsData.push(0); totalRepsData.push(0); avgRPEData.push(null); avgRirData.push(null); maxWeightData.push(0); e1rmData.push(0); volumeData.push(0); return; }
    var tot = sets.reduce(function(a,s){ return a+s.reps; },0);
    var avg = Math.round(tot/sets.length*10)/10;
    var rpeSets = sets.filter(function(s){ return s.rpe>0; });
    var avgRPE = rpeSets.length>0 ? Math.round(rpeSets.reduce(function(a,s){ return a+s.rpe; },0)/rpeSets.length*10)/10 : null;
    var rirSets = sets.filter(function(s){ return s.rir != null; });
    var avgRIR = rirSets.length>0 ? Math.round(rirSets.reduce(function(a,s){ return a+s.rir; },0)/rirSets.length*10)/10 : null;
    avgRepsData.push(avg); totalRepsData.push(tot); avgRPEData.push(avgRPE); avgRirData.push(avgRIR);
    sets.forEach(function(st){ if(st.reps > prReps) prReps = st.reps; });
    grandTotalReps += tot; totalSetsCount += sets.length;
    // peso
    var sessionMaxW = 0, sessionVolume = 0, sessionMaxE1rm = 0;
    sets.forEach(function(st){
      if(st.weight > 0){
        weightSum += st.weight; weightSetsCount++;
        var setVol = st.weight * st.reps;
        sessionVolume += setVol;
        if(setVol > bestSet) bestSet = setVol;
        if(st.weight > sessionMaxW) sessionMaxW = st.weight;
        if(st.reps > 0){
          var rirEff = (typeof st.rir === 'number' && !isNaN(st.rir)) ? st.rir : 0;
          var e1 = st.weight * (1 + (st.reps + rirEff)/30);
          if(e1 > sessionMaxE1rm) sessionMaxE1rm = e1;
        }
      }
      if(st.weight > prWeight) prWeight = st.weight;
    });
    maxWeightData.push(sessionMaxW);
    e1rmData.push(Math.round(sessionMaxE1rm*10)/10);
    volumeData.push(Math.round(sessionVolume*10)/10);
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
    document.getElementById('pStatTotalReps').textContent = bestSet ? (Math.round(bestSet*10)/10)+'kg' : '—';
    if(lblPR) lblPR.textContent = 'PESO MAX';
    if(lblAvg) lblAvg.textContent = 'PESO MEDIO';
    if(lblTot) lblTot.textContent = 'MIGLIOR SET';
    if(chartTitle) chartTitle.textContent = 'Massimale stimato per sessione (kg)';
    chartRepsInst = destroyChart(chartRepsInst);
    chartRepsInst = new Chart(document.getElementById('chartReps').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:e1rmData, backgroundColor:accentDim, borderColor:accent, borderWidth:1.5, borderRadius:4 }] }, options:makeBarOpts() });
  } else {
    var globalAvgReps = totalSetsCount>0 ? Math.round(grandTotalReps/totalSetsCount*10)/10 : 0;
    document.getElementById('pStatSessions').textContent = totalSetsCount || '—';
    document.getElementById('pStatPR').textContent = prReps || '—';
    document.getElementById('pStatAvgReps').textContent = globalAvgReps || '—';
    document.getElementById('pStatTotalReps').textContent = grandTotalReps || '—';
    if(lblPR) lblPR.textContent = 'MASSIMALE';
    if(lblAvg) lblAvg.textContent = 'MEDIA';
    if(lblTot) lblTot.textContent = 'TOT REPS';
    if(chartTitle) chartTitle.textContent = 'Media reps a serie (per sessione)';
    if(isTimed){
      if(lblPR) lblPR.textContent = 'TENUTA MAX';
      if(lblAvg) lblAvg.textContent = 'MEDIA';
      if(lblTot) lblTot.textContent = 'TOT SECONDI';
      if(chartTitle) chartTitle.textContent = 'Media secondi per set';
      document.getElementById('pStatPR').textContent = prReps ? prReps+'s' : '—';
      document.getElementById('pStatAvgReps').textContent = globalAvgReps ? globalAvgReps+'s' : '—';
      document.getElementById('pStatTotalReps').textContent = grandTotalReps ? grandTotalReps+'s' : '—';
    }
    chartRepsInst = destroyChart(chartRepsInst);
    chartRepsInst = new Chart(document.getElementById('chartReps').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:avgRepsData, backgroundColor:accentDim, borderColor:accent, borderWidth:1.5, borderRadius:4 }] }, options:makeBarOpts() });
  }

  var totalChartData = isWeighted ? volumeData : totalRepsData;
  chartTotalRepsInst = destroyChart(chartTotalRepsInst);
  chartTotalRepsInst = new Chart(document.getElementById('chartTotalReps').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:totalChartData, backgroundColor:'rgba(200,240,96,0.1)', borderColor:'rgba(200,240,96,0.4)', borderWidth:1, borderRadius:4 }] }, options:makeBarOpts() });
  var ttlTotal = document.getElementById('pChartTotalRepsTitle');
  if(ttlTotal) ttlTotal.textContent = isWeighted ? 'Tonnellaggio per sessione (kg)' : (isTimed ? 'Secondi totali sessione' : 'Reps totali per sessione');
  chartRPEInst = destroyChart(chartRPEInst);
  chartRPEInst = new Chart(document.getElementById('chartRPE').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:avgRPEData, backgroundColor:'rgba(255,100,60,0.2)', borderColor:'rgba(255,100,60,0.6)', borderWidth:1, borderRadius:4 }] }, options:makeBarOpts({ min:0, max:10 }) });

  chartRirInst = destroyChart(chartRirInst);
  chartRirInst = new Chart(document.getElementById('chartRir').getContext('2d'), { type:'bar', data:{ labels:labels, datasets:[{ data:avgRirData, backgroundColor:'rgba(255,138,92,0.2)', borderColor:'rgba(255,138,92,0.6)', borderWidth:1, borderRadius:4 }] }, options:makeBarOpts({ min:0, max:10 }) });

  var fOpen = '<span style="color:#8fb0c0;">', fClose = '</span>';
  var repsDescEl = document.getElementById('pChartRepsDesc');
  if(repsDescEl){
    if(isWeighted){ repsDescEl.innerHTML = esc('Una stima di quanto solleveresti per una singola ripetizione al massimo, allenamento dopo allenamento. Guarda il trend, non il numero esatto.') + ' ' + fOpen + esc('Come si calcola (Epley): peso x (1 + (reps + rir) / 30). Il RIR serve a stimare quante ripetizioni avevi ancora in canna.') + fClose; }
    else if(isTimed){ repsDescEl.innerHTML = ''; }
    else { repsDescEl.innerHTML = esc('In media quante ripetizioni fai per ogni serie. Quando sale, stai migliorando.') + ' ' + fOpen + esc('Reps totali diviso il numero di serie.') + fClose; }
  }
  var totDescEl = document.getElementById('pChartTotalRepsDesc');
  if(totDescEl){
    if(isWeighted){ totDescEl.innerHTML = esc('Quanti kg hai spostato in tutto in un allenamento. Pi\u00F9 \u00E8 alto, pi\u00F9 volume di lavoro hai fatto.') + ' ' + fOpen + esc('Somma di (reps x peso) per ogni serie.') + fClose; }
    else if(isTimed){ totDescEl.innerHTML = ''; }
    else { totDescEl.innerHTML = esc('Il tuo volume di lavoro a corpo libero: tutte le ripetizioni messe insieme.') + ' ' + fOpen + esc('Somma delle reps di tutte le serie.') + fClose; }
  }

  renderSetDetailChart(filtered, isWeighted, isTimed);
}

// Grafico "Dettaglio serie per serie": asse X = ogni singolo set del periodo.
// Multi-metrica con controlli on/off + stile (barre/punti/linea) per metrica.
// Stato metriche RICREATO a ogni render (nessuna persistenza).
function renderSetDetailChart(filtered, isWeighted, isTimed){
  var exerciseName = document.getElementById('progressExerciseSelect').value;
  var accent = '#c8f060', accentDim = 'rgba(200,240,96,0.15)';

  // lista piatta dei set: arrai grezzi allineati
  var labels = [], repsArr = [], weightArr = [], rirArr = [], rpeArr = [];
  filtered.forEach(function(s){
    var ex = s.log_data.exercises.find(function(e){ return e.name === exerciseName; });
    if(!ex) return;
    var sets = getExSets(ex);
    if(!sets.length) return;
    var d = new Date(s.created_at);
    var dm = d.getDate() + '/' + (d.getMonth()+1);
    sets.forEach(function(st, idx){
      labels.push(dm + ' #' + (idx+1));
      repsArr.push(st.reps);
      weightArr.push(st.weight);
      rirArr.push(numOrNull(st.rir));
      rpeArr.push(numOrNull(st.rpe));
    });
  });

  // cap difensivo: solo gli ultimi 60 set (code allineate su ogni serie)
  if(labels.length > 60){
    labels = labels.slice(-60);
    repsArr = repsArr.slice(-60);
    weightArr = weightArr.slice(-60);
    rirArr = rirArr.slice(-60);
    rpeArr = rpeArr.slice(-60);
  }

  // metriche disponibili per tipo. axis: 'y' sinistra, 'yE'/'yEffort' destra.
  var metrics = [];
  function addMetric(key, label, color, bg, axis, on, compute){
    metrics.push({ key:key, label:label, color:color, bg:bg, axis:axis, on:on, style:'bar', compute:compute });
  }
  if(isWeighted){
    addMetric('tonn','Tonnellaggio',accent,accentDim,'y',true, function(i){ return Math.round(weightArr[i]*repsArr[i]*10)/10; });
    addMetric('e1rm','Massimale stimato','rgba(122,200,255,1)','rgba(122,200,255,0.15)','yE',false, function(i){ var r = (rirArr[i] != null ? rirArr[i] : 0); return Math.round(weightArr[i]*(1+(repsArr[i]+r)/30)*10)/10; });
    addMetric('reps','Reps','rgba(200,155,255,1)','rgba(200,155,255,0.15)','y',false, function(i){ return repsArr[i]; });
    addMetric('rir','RIR','rgba(255,138,92,1)','rgba(255,138,92,0.15)','yEffort',true, function(i){ return rirArr[i]; });
    addMetric('rpe','RPE','rgba(255,209,102,1)','rgba(255,209,102,0.15)','yEffort',false, function(i){ return rpeArr[i]; });
  } else if(isTimed){
    addMetric('reps','Secondi',accent,accentDim,'y',true, function(i){ return repsArr[i]; });
    addMetric('rir','RIR','rgba(255,138,92,1)','rgba(255,138,92,0.15)','yEffort',true, function(i){ return rirArr[i]; });
    addMetric('rpe','RPE','rgba(255,209,102,1)','rgba(255,209,102,0.15)','yEffort',false, function(i){ return rpeArr[i]; });
  } else {
    addMetric('reps','Reps',accent,accentDim,'y',true, function(i){ return repsArr[i]; });
    addMetric('rir','RIR','rgba(255,138,92,1)','rgba(255,138,92,0.15)','yEffort',true, function(i){ return rirArr[i]; });
    addMetric('rpe','RPE','rgba(255,209,102,1)','rgba(255,209,102,0.15)','yEffort',false, function(i){ return rpeArr[i]; });
  }

  function btnCss(active){
    return 'font-size:9px;padding:2px 6px;border-radius:5px;cursor:pointer;border:1px solid var(--border);margin-left:4px;' + (active ? 'background:var(--accent);color:#0a0a0a;border-color:var(--accent);' : 'background:transparent;color:var(--muted);');
  }

  // (ri)costruisce SOLO il chart leggendo lo stato corrente delle metriche
  function buildChart(){
    var datasets = [], usedAxes = {};
    metrics.forEach(function(m){
      if(!m.on) return;
      usedAxes[m.axis] = true;
      var data = [];
      for(var i=0;i<labels.length;i++){ data.push(m.compute(i)); }
      var ds = { _mkey:m.key, label:m.label, data:data, yAxisID:m.axis, borderColor:m.color };
      if(m.style === 'bar'){ ds.type='bar'; ds.backgroundColor=m.bg; ds.borderWidth=1.5; ds.borderRadius=4; }
      else if(m.style === 'point'){ ds.type='line'; ds.showLine=false; ds.pointRadius=4; ds.backgroundColor=m.color; ds.pointBackgroundColor=m.color; ds.spanGaps=false; }
      else { ds.type='line'; ds.pointRadius=2; ds.spanGaps=false; ds.tension=0.2; ds.backgroundColor=m.color; ds.borderWidth=1.5; }
      datasets.push(ds);
    });

    var opts = makeBarOpts();
    if(usedAxes.yE){
      opts.scales.yE = { position:'right', ticks:{ color:'#555', font:{ family:'DM Mono, monospace', size:9 } }, grid:{ display:false }, border:{ color:'rgba(255,255,255,0.05)' } };
    }
    if(usedAxes.yEffort){
      opts.scales.yEffort = { position:'right', min:0, max:10, ticks:{ color:'#555', font:{ family:'DM Mono, monospace', size:9 } }, grid:{ display:false }, border:{ color:'rgba(255,255,255,0.05)' } };
    }
    if(!usedAxes.y){ opts.scales.y.display = false; }

    opts.plugins = opts.plugins || {};
    opts.plugins.tooltip = { callbacks: { label: function(ctx){
      var k = ctx.dataset._mkey, v = ctx.parsed.y, di = ctx.dataIndex;
      if(k === 'tonn'){ return repsArr[di] + ' x ' + weightArr[di] + ' = ' + v + ' kg'; }
      if(k === 'e1rm'){ return '1RM stim: ' + v + ' kg'; }
      if(k === 'reps'){ return 'Reps: ' + v; }
      if(k === 'rir'){ return 'RIR: ' + v; }
      if(k === 'rpe'){ return 'RPE: ' + v; }
      return v;
    } } };

    var active = metrics.filter(function(m){ return m.on; }).map(function(m){ return m.label.toLowerCase(); });
    var ttl = document.getElementById('pChartSetsTitle');
    if(ttl) ttl.textContent = 'Dettaglio serie per serie' + (active.length ? ' - ' + active.join(' + ') : '');

    chartSetsInst = destroyChart(chartSetsInst);
    chartSetsInst = new Chart(document.getElementById('chartSets').getContext('2d'), { data:{ labels:labels, datasets:datasets }, options:opts });
  }

  // descrizione statica (passata da esc())
  var desc = document.getElementById('pChartSetsDesc');
  if(desc){
    var descTxt = isWeighted
      ? "Ogni colonna \u00E8 una singola serie. Scegli cosa vedere e come: il carico spostato, il massimale stimato, le ripetizioni e quanto eri vicino al cedimento (RIR/RPE)."
      : "Ogni colonna \u00E8 una singola serie. Scegli cosa vedere e come: le ripetizioni e quanto eri vicino al cedimento (RIR/RPE).";
    desc.innerHTML = esc(descTxt);
  }

  // controlli on/off + stile per metrica (generati via DOM, nessun onclick inline)
  var ctrlWrap = document.getElementById('pChartSetsControls');
  if(ctrlWrap){
    ctrlWrap.innerHTML = '';
    metrics.forEach(function(m){
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;margin-bottom:4px;';
      var lbl = document.createElement('label');
      lbl.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text);min-width:96px;cursor:pointer;';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = m.on;
      cb.style.cssText = 'accent-color:' + m.color + ';';
      var span = document.createElement('span');
      span.textContent = m.label;
      lbl.appendChild(cb);
      lbl.appendChild(span);
      row.appendChild(lbl);

      var styleBtns = [];
      var styleDefs = [ ['bar','barre'], ['point','punti'], ['line','linea'] ];
      function refreshBtns(){
        styleBtns.forEach(function(o){
          o.btn.style.cssText = btnCss(m.style === o.style);
          if(!m.on){ o.btn.style.opacity = '0.35'; o.btn.style.pointerEvents = 'none'; }
          else { o.btn.style.opacity = '1'; o.btn.style.pointerEvents = 'auto'; }
        });
      }
      styleDefs.forEach(function(sd){
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = sd[1];
        b.addEventListener('click', function(){
          if(!m.on) return;
          m.style = sd[0];
          refreshBtns();
          buildChart();
        });
        styleBtns.push({ btn:b, style:sd[0] });
        row.appendChild(b);
      });
      refreshBtns();

      cb.addEventListener('change', function(){
        m.on = cb.checked;
        refreshBtns();
        buildChart();
      });
      ctrlWrap.appendChild(row);
    });
  }

  buildChart();
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

  var totalSets = 0, rpeSum = 0, rpeCount = 0, repsTot = 0, rirSum = 0, rirCount = 0;
  filtered.forEach(function(s){
    if(!s.log_data || !s.log_data.exercises) return;
    s.log_data.exercises.forEach(function(ex){
      var sets = getExSets(ex);
      totalSets += sets.length;
      sets.forEach(function(st){
        if(st.rpe > 0){ rpeSum += st.rpe; rpeCount++; }
        repsTot += st.reps;
        if(st.rir != null){ rirSum += st.rir; rirCount++; }
      });
    });
  });
  document.getElementById('ovStatSessions').textContent = filtered.length;
  document.getElementById('ovStatSets').textContent = totalSets;
  document.getElementById('ovStatRPE').textContent = rpeCount > 0 ? Math.round(rpeSum/rpeCount*10)/10 : '—';
  document.getElementById('ovStatReps').textContent = repsTot || '—';
  document.getElementById('ovStatRir').textContent = rirCount > 0 ? Math.round(rirSum/rirCount*10)/10 : '—';
  document.getElementById('ovStatAvgSets').textContent = filtered.length > 0 ? Math.round(totalSets/filtered.length*10)/10 : '—';

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

  var ovLabels = [], ovSets = [], ovReps = [], ovVol = [], ovRir = [];
  filtered.forEach(function(s){
    if(!s.log_data || !s.log_data.exercises) return;
    var sCnt = 0, rCnt = 0, vSum = 0, riSum = 0, riN = 0;
    s.log_data.exercises.forEach(function(ex){
      getExSets(ex).forEach(function(st){
        sCnt++;
        rCnt += st.reps;
        if(st.weight > 0){ vSum += st.weight * st.reps; }
        if(st.rir != null){ riSum += st.rir; riN++; }
      });
    });
    ovLabels.push(new Date(s.created_at).toLocaleDateString('it-IT', {day:'numeric', month:'short'}));
    ovSets.push(sCnt);
    ovReps.push(rCnt);
    ovVol.push(Math.round(vSum*10)/10);
    ovRir.push(riN > 0 ? Math.round(riSum/riN*10)/10 : null);
  });
  var ovAccent = '#c8f060', ovAccentDim = 'rgba(200,240,96,0.15)';
  chartOvSetsInst = destroyChart(chartOvSetsInst);
  chartOvSetsInst = new Chart(document.getElementById('chartOvSets').getContext('2d'), { type:'bar', data:{ labels:ovLabels, datasets:[{ data:ovSets, backgroundColor:ovAccentDim, borderColor:ovAccent, borderWidth:1.5, borderRadius:4 }] }, options:makeBarOpts() });
  chartOvTotRepsInst = destroyChart(chartOvTotRepsInst);
  chartOvTotRepsInst = new Chart(document.getElementById('chartOvTotReps').getContext('2d'), { type:'bar', data:{ labels:ovLabels, datasets:[{ data:ovReps, backgroundColor:ovAccentDim, borderColor:ovAccent, borderWidth:1.5, borderRadius:4 }] }, options:makeBarOpts() });
  chartOvVolInst = destroyChart(chartOvVolInst);
  chartOvVolInst = new Chart(document.getElementById('chartOvVol').getContext('2d'), { type:'bar', data:{ labels:ovLabels, datasets:[{ data:ovVol, backgroundColor:'rgba(200,240,96,0.1)', borderColor:'rgba(200,240,96,0.4)', borderWidth:1, borderRadius:4 }] }, options:makeBarOpts() });
  chartOvRirInst = destroyChart(chartOvRirInst);
  chartOvRirInst = new Chart(document.getElementById('chartOvRir').getContext('2d'), { type:'bar', data:{ labels:ovLabels, datasets:[{ data:ovRir, backgroundColor:'rgba(255,138,92,0.2)', borderColor:'rgba(255,138,92,0.6)', borderWidth:1, borderRadius:4 }] }, options:makeBarOpts({ min:0, max:10 }) });

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
