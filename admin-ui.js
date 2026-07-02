var allExercises = [];

async function showAdmin(){showScreen('adminScreen'); await renderUserTable(); await renderLogTable();}

function switchTab(tab, btn){
  document.querySelectorAll('.atab').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.admin-section').forEach(function(s){s.classList.remove('active');});
  btn.classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');
  if(tab==='library'&&!allExercises.length) loadLibrary();
  if(tab==='templates') renderTemplates();
}

async function renderUserTable(){
  var tbody=document.getElementById('userTableBody');
  var r=await sb.from('profiles').select('*').eq('role','athlete').order('created_at',{ascending:false});
  var athletes=r.data;
  if(!athletes||!athletes.length){tbody.innerHTML='<tr><td colspan="4" class="empty-table">Nessun atleta ancora.</td></tr>'; return;}
  tbody.innerHTML=athletes.map(function(u){
    return '<tr><td>'+esc(u.name||'-')+'</td><td style="color:var(--muted)">'+esc(u.email)+'</td><td><span class="badge badge-'+(u.status||'pending')+'">'+(u.status||'pending')+'</span></td><td><button class="action-btn" onclick="openAthleteProfileModal(\''+u.id+'\',\''+esc(u.name||u.email)+'\')">Profilo</button><button class="action-btn primary" onclick="openAthleteProgramsModal(\''+u.id+'\',\''+esc(u.name||u.email)+'\')">Programmi</button><button class="action-btn '+(u.status==='active'?'danger':'')+'" onclick="toggleStatus(\''+u.id+'\',\''+u.status+'\')">'+(u.status==='active'?'Disattiva':'Attiva')+'</button><button class="action-btn" onclick="showProgress(\''+u.id+'\')">Progressi</button></td></tr>';
  }).join('');
}

async function renderLogTable(){
  var tbody=document.getElementById('logTableBody');
  var r=await sb.from('sessions').select('*, profiles(name,email)').order('created_at',{ascending:false}).limit(50);
  var logs=r.data;
  if(!logs||!logs.length){tbody.innerHTML='<tr><td colspan="4" class="empty-table">Nessuna sessione.</td></tr>'; return;}
  tbody.innerHTML=logs.map(function(s){
    var date=new Date(s.created_at).toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'});
    var name=(s.profiles&&(s.profiles.name||s.profiles.email))||'-';
    return '<tr><td>'+esc(name)+'</td><td>'+esc(s.workout_name)+'</td><td style="color:var(--muted)">'+date+'</td><td><button class="action-btn" onclick="openLogModalById(\''+s.id+'\')">Vedi log</button></td></tr>';
  }).join('');
  window._sessionLogs=logs;
}

function openLogModalById(id){
  var s=window._sessionLogs&&window._sessionLogs.find(function(x){return x.id===id;});
  if(s) openLogModal(s);
}

// Wrapper per /api/admin: allega il token di sessione Supabase come Bearer,
// cosi' l'endpoint privilegiato puo' verificare che il chiamante sia admin.
async function adminFetch(payload){
  var token='';
  try{ var s=await sb.auth.getSession(); token=(s&&s.data&&s.data.session&&s.data.session.access_token)||''; }catch(e){}
  var body=JSON.stringify(payload);
  var r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:body});
  if(r.status===401){
    var refreshed=false;
    try{ var rs=await sb.auth.refreshSession(); if(rs&&rs.data&&rs.data.session&&rs.data.session.access_token){ token=rs.data.session.access_token; refreshed=true; } }catch(e){}
    if(refreshed){
      r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:body});
    }
  }
  return r;
}

async function toggleStatus(userId, currentStatus){
  var newStatus=currentStatus==='active'?'inactive':'active';
  if(currentStatus==='active'&&!confirm('Disattivare questo atleta?')) return;
  var r=await adminFetch({action:'updateStatus',userId:userId,status:newStatus});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  await renderUserTable();
}

function openCreateUserModal(){
  document.getElementById('newUserName').value='';
  document.getElementById('newUserEmail').value='';
  document.getElementById('newUserPass').value='';
  document.getElementById('createUserModal').classList.add('open');
}

async function createUser(){
  var name=document.getElementById('newUserName').value.trim();
  var email=document.getElementById('newUserEmail').value.trim();
  var pass=document.getElementById('newUserPass').value.trim();
  if(!name||!email||!pass){alert('Compila tutti i campi.'); return;}
  var r=await adminFetch({action:'createUser',name:name,email:email,password:pass});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  closeModal('createUserModal'); await renderUserTable();
  alert('Atleta creato. Puo accedere con email e password temporanea.');
}

async function openAthleteProfileModal(userId, userName){
  athleteProgramsUserId=userId;
  document.getElementById('athleteProfileName').textContent=userName;
  var r=await sb.from('profiles').select('*').eq('id',userId).maybeSingle();
  if(r.data){
    var d=r.data;
    var map={apEta:d.eta,apSesso:d.sesso,apPeso:d.peso,apAltezza:d.altezza,apLivello:d.livello,apFrequenza:d.frequenza,apObiettivo:d.obiettivo,apObiettivo3m:d.obiettivo3m,apLuogo:d.luogo,apDisponibilita:d.disponibilita,apDiscipline:d.discipline,apSkill:d.skill,apAttrezzatura:d.attrezzatura,apInfortuni:d.infortuni,apLimitazioni:d.limitazioni,apStile:d.stile,apSonno:d.sonno,apMotivazione:d.motivazione,apNote:d.note_libere};
    Object.entries(map).forEach(function(e){var el=document.getElementById(e[0]); if(el) el.value=e[1]||'';});
  }
  document.getElementById('athleteProfileModal').classList.add('open');
}

async function saveAthleteProfile(){
  var r=await adminFetch({action:'updateProfile',userId:athleteProgramsUserId,eta:document.getElementById('apEta').value||null,sesso:document.getElementById('apSesso').value||null,peso:document.getElementById('apPeso').value||null,altezza:document.getElementById('apAltezza').value||null,livello:document.getElementById('apLivello').value||null,frequenza:document.getElementById('apFrequenza').value||null,obiettivo:document.getElementById('apObiettivo').value||null,obiettivo3m:document.getElementById('apObiettivo3m').value||null,luogo:document.getElementById('apLuogo').value||null,disponibilita:document.getElementById('apDisponibilita').value||null,discipline:document.getElementById('apDiscipline').value||null,skill:document.getElementById('apSkill').value||null,attrezzatura:document.getElementById('apAttrezzatura').value||null,infortuni:document.getElementById('apInfortuni').value||null,limitazioni:document.getElementById('apLimitazioni').value||null,stile:document.getElementById('apStile').value||null,sonno:document.getElementById('apSonno').value||null,motivazione:document.getElementById('apMotivazione').value||null,note_libere:document.getElementById('apNote').value||null});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  closeModal('athleteProfileModal'); await renderUserTable(); alert('Profilo salvato.');
}

async function resetAthleteProfile(){
  if(!confirm('Resettare tutti i dati del profilo?')) return;
  var r=await adminFetch({action:'updateProfile',userId:athleteProgramsUserId,eta:null,sesso:null,peso:null,altezza:null,livello:null,frequenza:null,obiettivo:null,obiettivo3m:null,luogo:null,disponibilita:null,discipline:null,skill:null,attrezzatura:null,infortuni:null,limitazioni:null,stile:null,sonno:null,motivazione:null,note_libere:null});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  await openAthleteProfileModal(athleteProgramsUserId, document.getElementById('athleteProfileName').textContent);
  alert('Profilo resettato.');
}

async function deleteAthlete(){
  if(!confirm('Eliminare definitivamente questo atleta?')) return;
  if(!confirm('Sicuro? Verranno eliminati account, programmi e sessioni.')) return;
  var r=await adminFetch({action:'deleteUser',userId:athleteProgramsUserId});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  closeModal('athleteProfileModal'); await renderUserTable(); alert('Atleta eliminato.');
}

async function openAthleteProgramsModal(userId, userName){
  athleteProgramsUserId=userId;
  document.getElementById('athleteProgramsName').textContent=userName;
  document.getElementById('newProgName').value='';
  document.getElementById('newProgRules').value='';
  document.getElementById('newProgCsv').value='';
  document.getElementById('newProgPrompt').value='';
  await renderAthletePrograms();
  document.getElementById('athleteProgramsModal').classList.add('open');
}

async function renderAthletePrograms(){
  var list=document.getElementById('athleteProgramsList');
  var r=await sb.from('programs').select('*').eq('user_id',athleteProgramsUserId).order('created_at',{ascending:true});
  var programs=r.data;
  if(!programs||!programs.length){list.innerHTML='<div style="font-size:12px;color:var(--muted);padding:8px 0;">Nessun programma assegnato.</div>'; return;}
  list.innerHTML=programs.map(function(p){
    return '<div style="background:var(--bg);border:1px solid var(--border2);border-radius:8px;padding:12px;">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      +'<div style="font-family:var(--display);font-size:13px;font-weight:700;">'+esc(p.program_name)+'</div>'
      +'<div style="display:flex;gap:6px;">'
      +'<button class="action-btn primary" onclick="editProgram(\''+p.id+'\')">Modifica</button>'
      +'<button class="action-btn danger" onclick="removeProgram(\''+p.id+'\')">Rimuovi</button>'
      +'</div></div>'
      +'<div id="edit_'+p.id+'" style="display:none;border-top:1px solid var(--border);padding-top:10px;margin-top:6px;">'
      +'<div class="modal-field"><div class="modal-label">Nome</div><input class="modal-input" id="editName_'+p.id+'" value="'+esc(p.program_name)+'"></div>'
      +'<div class="modal-field"><div class="modal-label" style="display:flex;justify-content:space-between;"><span>Coach Rules</span><span style="font-size:9px;color:var(--muted);font-weight:normal;letter-spacing:0;text-transform:none;">Regole comportamentali AI</span></div>'
      +'<div class="modal-field"><div class="modal-label">Tipo sessione</div><select class="modal-input" id="editType_'+p.id+'" style="cursor:pointer;"><option value="bodyweight"'+(p.session_type==='gym'?'':' selected')+'>Bodyweight / Calisthenics</option><option value="gym"'+(p.session_type==='gym'?' selected':'')+'>Palestra (con peso)</option></select></div>'+'<textarea class="modal-textarea" id="editRules_'+p.id+'" style="min-height:100px;">'+esc(p.coach_rules||'')+'</textarea></div>'
      +'<div class="modal-field"><div class="modal-label" style="display:flex;justify-content:space-between;"><span>Workout</span><span style="font-size:9px;color:var(--muted);font-weight:normal;letter-spacing:0;text-transform:none;">Esercizio, Set, Reps, RIR, Recupero</span></div>'
      +'<textarea class="modal-textarea" id="editCsv_'+p.id+'" style="min-height:120px;font-size:11px;">'+esc(p.workout_csv||'')+'</textarea></div>'
      +'<div class="modal-field"><div class="modal-label" style="display:flex;justify-content:space-between;"><span>Note extra</span><span style="font-size:9px;color:var(--muted);font-weight:normal;letter-spacing:0;text-transform:none;">opzionali</span></div>'
      +'<textarea class="modal-textarea" id="editPrompt_'+p.id+'" style="min-height:60px;">'+esc(p.ai_prompt||'')+'</textarea></div>'
      +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">'
      +'<button class="modal-cancel" onclick="document.getElementById(\'edit_'+p.id+'\').style.display=\'none\'">Annulla</button>'
      +'<button class="modal-save" onclick="saveEditProgram(\''+p.id+'\')">Salva</button>'
      +'</div></div></div>';
  }).join('');
}

function editProgram(id){
  var el=document.getElementById('edit_'+id);
  el.style.display=el.style.display==='none'?'block':'none';
}

async function saveEditProgram(programId){
  var name=document.getElementById('editName_'+programId).value.trim();
  var rules=document.getElementById('editRules_'+programId).value.trim();
  var csv=document.getElementById('editCsv_'+programId).value.trim();
  var prompt=document.getElementById('editPrompt_'+programId).value.trim();
  if(!name){alert('Inserisci almeno il nome.'); return;}
  var editType=document.getElementById('editType_'+programId); var sType=editType?editType.value:'bodyweight';
  var r=await adminFetch({action:'editProgram',programId:programId,program_name:name,coach_rules:rules,workout_csv:csv,ai_prompt:prompt,session_type:sType});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  await renderAthletePrograms();
}

async function addProgram(){
  var name=document.getElementById('newProgName').value.trim();
  var rules=document.getElementById('newProgRules').value.trim();
  var csv=document.getElementById('newProgCsv').value.trim();
  var prompt=document.getElementById('newProgPrompt').value.trim();
  if(!name){alert('Inserisci almeno il nome.'); return;}
  var progType=document.getElementById('newProgType').value||'bodyweight';
  var r=await adminFetch({action:'addProgram',userId:athleteProgramsUserId,program_name:name,coach_rules:rules,workout_csv:csv,ai_prompt:prompt,session_type:progType});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  document.getElementById('newProgName').value='';
  document.getElementById('newProgRules').value='';
  document.getElementById('newProgCsv').value='';
  document.getElementById('newProgPrompt').value='';
  await renderAthletePrograms(); await renderUserTable();
}

async function removeProgram(programId){
  if(!confirm('Rimuovere questo programma?')) return;
  var r=await adminFetch({action:'removeProgram',programId:programId});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  await renderAthletePrograms(); await renderUserTable();
}

// ============================================================
// LIBRERIA TEMPLATE (program_templates)
// Lettura diretta da Supabase (RLS: select consentito ad admin);
// le SCRITTURE passano da adminFetch -> /api/admin (service role).
// ============================================================
var editingTemplateId = null;

async function renderTemplates(){
  var list=document.getElementById('templateList');
  list.innerHTML='<div style="font-size:12px;color:var(--muted);padding:8px 0;">Caricamento...</div>';
  var r=await sb.from('program_templates').select('*').order('created_at',{ascending:true});
  var templates=r.data;
  window._templates=templates||[];
  if(!templates||!templates.length){list.innerHTML='<div style="font-size:12px;color:var(--muted);padding:8px 0;">Nessun template ancora. Creane uno con "+ Nuovo template".</div>'; return;}
  // Assegnatari: righe programs con template_id valorizzato -> nomi atleti.
  // Poche query FUORI dal loop, join lato client. RLS admin consente entrambe.
  var asgMap={}; var seen={};
  var pr=await sb.from('programs').select('user_id,template_id').not('template_id','is',null);
  var prog=pr.data||[];
  var ur=await sb.from('profiles').select('id,name,email');
  var profs=ur.data||[];
  var nameById={};
  profs.forEach(function(p){ nameById[p.id]=p.name||p.email; });
  prog.forEach(function(row){
    var tid=row.template_id; if(!tid) return;
    var k=tid+'|'+row.user_id; if(seen[k]) return; seen[k]=true;
    var nm=nameById[row.user_id]; if(!nm) return;
    if(!asgMap[tid]) asgMap[tid]=[];
    asgMap[tid].push(nm);
  });
  list.innerHTML=templates.map(function(t){
    var typeLabel=t.session_type==='gym'?'Palestra (con peso)':'Bodyweight / Calisthenics';
    var asg=asgMap[t.id]||[];
    var asgLine=asg.length ? ('Assegnato a: '+asg.map(function(n){return esc(n);}).join(', ')) : 'Assegnato a: nessuno';
    return '<div style="background:var(--bg);border:1px solid var(--border2);border-radius:8px;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;">'
      +'<div><div style="font-family:var(--display);font-size:13px;font-weight:700;">'+esc(t.program_name)+'</div>'
      +'<div style="font-size:10px;color:var(--muted);margin-top:3px;letter-spacing:.05em;">'+typeLabel+'</div>'
      +'<div style="font-size:10px;color:var(--muted);margin-top:3px;">'+asgLine+'</div></div>'
      +'<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">'
      +'<button class="action-btn primary" onclick="openTemplateForm(\''+t.id+'\')">Modifica</button>'
      +'<button class="action-btn danger" onclick="deleteTemplate(\''+t.id+'\')">Elimina</button>'
      +'<button class="action-btn" onclick="openAssignModal(\''+t.id+'\')">Assegna</button>'
      +'<button class="action-btn" onclick="startTestSession(\''+t.id+'\')">Prova</button>'
      +'<button class="action-btn" onclick="applyToAll(\''+t.id+'\')">Applica a tutti</button>'
      +'</div></div>';
  }).join('');
}

function openTemplateForm(id){
  editingTemplateId=id||null;
  var t=(id&&window._templates)?window._templates.find(function(x){return x.id===id;}):null;
  document.getElementById('templateFormTitle').textContent=t?'Modifica template':'Nuovo template';
  document.getElementById('tplName').value=t?(t.program_name||''):'';
  document.getElementById('tplType').value=(t&&t.session_type==='gym')?'gym':'bodyweight';
  document.getElementById('tplRules').value=t?(t.coach_rules||''):'';
  document.getElementById('tplCsv').value=t?(t.workout_csv||''):'';
  document.getElementById('tplPrompt').value=t?(t.ai_prompt||''):'';
  document.getElementById('templateFormModal').classList.add('open');
}

async function saveTemplate(){
  var name=document.getElementById('tplName').value.trim();
  var rules=document.getElementById('tplRules').value.trim();
  var csv=document.getElementById('tplCsv').value.trim();
  var prompt=document.getElementById('tplPrompt').value.trim();
  var sType=document.getElementById('tplType').value||'bodyweight';
  if(!name){alert('Inserisci almeno il nome.'); return;}
  var payload;
  if(editingTemplateId){
    payload={action:'editTemplate',templateId:editingTemplateId,program_name:name,coach_rules:rules,workout_csv:csv,ai_prompt:prompt,session_type:sType};
  }else{
    payload={action:'addTemplate',program_name:name,coach_rules:rules,workout_csv:csv,ai_prompt:prompt,session_type:sType};
  }
  var r=await adminFetch(payload);
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  closeModal('templateFormModal');
  await renderTemplates();
}

async function deleteTemplate(id){
  if(!confirm('Eliminare questo template? I programmi gia\' assegnati agli atleti restano invariati.')) return;
  var r=await adminFetch({action:'removeTemplate',templateId:id});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  await renderTemplates();
}

var assigningTemplateId = null;
var assignInFlight = false;

async function openAssignModal(templateId){
  assigningTemplateId=templateId;
  var sel=document.getElementById('assignAthleteSelect');
  sel.innerHTML='<option value="">Caricamento...</option>';
  var r=await sb.from('profiles').select('id,name,email').eq('role','athlete').order('name',{ascending:true});
  var athletes=r.data||[];
  if(!athletes.length){
    sel.innerHTML='<option value="">Nessun atleta disponibile</option>';
  }else{
    sel.innerHTML=athletes.map(function(a){
      return '<option value="'+a.id+'">'+esc(a.name||a.email)+'</option>';
    }).join('');
  }
  document.getElementById('assignModal').classList.add('open');
}

async function confirmAssign(){
  if(assignInFlight) return;
  var userId=document.getElementById('assignAthleteSelect').value;
  if(!userId){alert('Seleziona un atleta.'); return;}
  var t=window._templates?window._templates.find(function(x){return x.id===assigningTemplateId;}):null;
  if(!t){alert('Template non trovato.'); return;}
  assignInFlight=true;
  var btn=document.querySelector('#assignModal .modal-save');
  if(btn) btn.disabled=true;
  try{
    var r=await adminFetch({action:'assignTemplate',userId:userId,templateId:assigningTemplateId,program_name:t.program_name,coach_rules:t.coach_rules,workout_csv:t.workout_csv,ai_prompt:t.ai_prompt,session_type:t.session_type});
    var data=await r.json();
    if(data.error){alert('Errore: '+data.error); return;}
    closeModal('assignModal');
    await renderTemplates();
    alert('Template assegnato');
  }finally{
    assignInFlight=false;
    if(btn) btn.disabled=false;
  }
}

async function applyToAll(templateId){
  if(!confirm('Sovrascrive il programma di tutti gli atleti a cui e\' assegnato questo template, inclusi eventuali ritocchi manuali. Procedere?')) return;
  var t=window._templates?window._templates.find(function(x){return x.id===templateId;}):null;
  if(!t){alert('Template non trovato.'); return;}
  var r=await adminFetch({action:'repushTemplate',templateId:templateId,program_name:t.program_name,coach_rules:t.coach_rules,workout_csv:t.workout_csv,ai_prompt:t.ai_prompt,session_type:t.session_type});
  var data=await r.json();
  if(data.error){alert('Errore: '+data.error); return;}
  alert('Programmi aggiornati');
}

// Prova sessione dall'admin: avvia una sessione AI reale da un template, NON persistita.
function startTestSession(templateId){
  var t=window._templates?window._templates.find(function(x){return x.id===templateId;}):null;
  if(!t){alert('Template non trovato.'); return;}
  if(!t.workout_csv || !t.workout_csv.trim()){alert('Template senza esercizi (workout_csv vuoto)'); return;}
  var orig=JSON.parse(JSON.stringify(currentProfile||{}));
  currentProfile={_isDemo:true,_orig:orig};
  testSession=true;
  startSessionWithPrompt(t.program_name, t.coach_rules, t.workout_csv, t.ai_prompt, t.session_type, null);
}

// ============================================================
// EXERCISE LIBRARY (admin)
// ============================================================
async function loadLibrary(){
  var r = await sb.from('exercises').select('*').order('name',{ascending:true});
  allExercises = r.data || [];
  filterLibrary();
}

function filterLibrary(){
  var q = (document.getElementById('libSearch').value||'').toLowerCase().trim();
  var cat = document.getElementById('libCat').value;
  var equip = (document.getElementById('libEquip').value||'').toLowerCase();
  var level = document.getElementById('libLevel').value;
  var filtered = allExercises.filter(function(ex){
    if(q && ex.name && ex.name.toLowerCase().indexOf(q)===-1) return false;
    if(cat && ex.category !== cat) return false;
    if(equip && (!ex.equipment || ex.equipment.toLowerCase().indexOf(equip)===-1)) return false;
    if(level && ex.level !== level) return false;
    return true;
  });
  document.getElementById('libCount').textContent = filtered.length + ' / ' + allExercises.length + ' esercizi';
  var tbody = document.getElementById('libTableBody');
  if(!filtered.length){
    tbody.innerHTML = '<tr><td colspan="8" class="empty-table">Nessun esercizio trovato.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function(ex){
    return '<tr><td>'+esc(ex.name||'-')+'</td>'
      +'<td style="color:var(--muted)">'+esc(ex.category||'-')+'</td>'
      +'<td style="color:var(--muted);font-size:11px;">'+esc(ex.muscles||'-')+'</td>'
      +'<td style="color:var(--muted);font-size:11px;">'+esc(ex.equipment||'-')+'</td>'
      +'<td><span class="badge">'+esc(ex.level||'-')+'</span></td>'
      +'<td style="color:var(--muted);font-size:11px;">'+esc(ex.progressions||'-')+'</td>'
      +'<td style="color:var(--muted);font-size:11px;">'+esc(ex.cue||'-')+'</td>'
      +'<td><button class="action-btn" onclick="openExerciseModal(\''+ex.id+'\')">Modifica</button>'
      +'<button class="action-btn danger" onclick="deleteExercise(\''+ex.id+'\')">X</button></td></tr>';
  }).join('');
}

function openExerciseModal(id){
  var ex = id ? allExercises.find(function(e){return e.id===id;}) : null;
  document.getElementById('exModalTitle').textContent = ex ? 'Modifica esercizio' : 'Nuovo esercizio';
  document.getElementById('exId').value = ex ? ex.id : '';
  document.getElementById('exName').value = ex ? (ex.name||'') : '';
  document.getElementById('exCategory').value = ex ? (ex.category||'') : '';
  document.getElementById('exLevel').value = ex ? (ex.level||'') : '';
  document.getElementById('exMuscles').value = ex ? (ex.muscles||'') : '';
  document.getElementById('exEquipment').value = ex ? (ex.equipment||'') : '';
  document.getElementById('exRest').value = ex ? (ex.rest_seconds||'') : '';
  document.getElementById('exCue').value = ex ? (ex.cue||'') : '';
  document.getElementById('exProgressions').value = ex ? (ex.progressions||'') : '';
  document.getElementById('exNotes').value = ex ? (ex.notes||'') : '';
  document.getElementById('exError').textContent = '';
  document.getElementById('exerciseModal').classList.add('open');
}

async function saveExercise(){
  var id = document.getElementById('exId').value;
  var name = document.getElementById('exName').value.trim();
  var errEl = document.getElementById('exError');
  if(!name){ errEl.textContent = 'Il nome \u00E8 obbligatorio.'; return; }
  var data = {
    name: name,
    category: document.getElementById('exCategory').value||null,
    level: document.getElementById('exLevel').value||null,
    muscles: document.getElementById('exMuscles').value.trim()||null,
    equipment: document.getElementById('exEquipment').value.trim()||null,
    rest_seconds: document.getElementById('exRest').value?parseInt(document.getElementById('exRest').value):null,
    cue: document.getElementById('exCue').value.trim()||null,
    progressions: document.getElementById('exProgressions').value.trim()||null,
    notes: document.getElementById('exNotes').value.trim()||null
  };
  var r;
  if(id){
    r = await sb.from('exercises').update(data).eq('id', id);
  } else {
    r = await sb.from('exercises').insert(data);
  }
  if(r.error){ errEl.textContent = 'Errore: '+r.error.message; return; }
  closeModal('exerciseModal');
  await loadLibrary();
}

async function deleteExercise(id){
  if(!confirm('Eliminare questo esercizio?')) return;
  var r = await sb.from('exercises').delete().eq('id', id);
  if(r.error){ alert('Errore: '+r.error.message); return; }
  await loadLibrary();
}
