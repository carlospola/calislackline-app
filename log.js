var currentLogSession = null;

function openLogModal(s){
  currentLogSession = s;
  document.getElementById('logModalTitle').textContent=(s.workout_name||'Sessione')+' - '+new Date(s.created_at).toLocaleDateString('it-IT');
  var logText = (s.log_text && s.log_text.trim()) ? s.log_text : buildLogSummary(s.log_data);
  document.getElementById('logModalContent').textContent = logText || 'Nessun log.';
  document.getElementById('logViewMode').style.display='block';
  document.getElementById('logEditMode').style.display='none';
  document.getElementById('logModal').classList.add('open');
}

function toggleLogEdit(){
  var view=document.getElementById('logViewMode'), edit=document.getElementById('logEditMode');
  if(edit.style.display==='none'){
    document.getElementById('logEditContent').value=currentLogSession.log_text||'';
    view.style.display='none'; edit.style.display='block';
  } else {
    view.style.display='block'; edit.style.display='none';
  }
}

async function saveLogEdit(){
  var newText=document.getElementById('logEditContent').value.trim();
  if(!currentLogSession) return;
  var r=await sb.from('sessions').update({log_text:newText}).eq('id',currentLogSession.id);
  if(r.error){alert('Errore salvataggio: '+r.error.message); return;}
  currentLogSession.log_text=newText;
  document.getElementById('logModalContent').textContent=newText;
  document.getElementById('logViewMode').style.display='block';
  document.getElementById('logEditMode').style.display='none';
  if(typeof showDash === 'function') showDash();
}

async function deleteLog(){
  if(!currentLogSession) return;
  if(!confirm('Eliminare questo log?')) return;
  var r=await sb.from('sessions').delete().eq('id',currentLogSession.id);
  if(r.error){alert('Errore eliminazione: '+r.error.message); return;}
  closeModal('logModal');
  currentLogSession=null;
  // Admin: resta nel pannello admin e ri-renderizza la tabella log.
  // Atleta: aggiorna la propria dashboard.
  if(currentProfile && currentProfile.role==='admin'){
    if(typeof renderLogTable === 'function') renderLogTable();
  } else {
    if(typeof showDash === 'function') showDash();
  }
}
