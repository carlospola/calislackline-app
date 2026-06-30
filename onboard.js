// onboard.js - lead-only "Richiedi il coaching" form logic.
// ES5 only: var, no template literals, no localStorage. Accents via Unicode escape.

var APPS_URL = 'https://script.google.com/macros/s/AKfycbwfbQO20H0vkbjrVBE-l-bSdGNoyWm10-viRaBQjvUgfDgfnPRQbamaeI0iTiXqoUEE/exec';

async function submitLead(){
  var btn = document.getElementById('onboardBtn');
  var errEl = document.getElementById('onboardErr');
  var nome = document.getElementById('f_nome').value.trim();
  var email = document.getElementById('f_email').value.trim();
  var telefono = document.getElementById('f_telefono').value.trim();
  var messaggio = document.getElementById('f_messaggio').value.trim();
  var consenso = document.getElementById('f_consenso').checked;

  // Validation: nome, email and consent are required.
  if(!nome){ errEl.textContent = 'Inserisci il tuo nome.'; errEl.style.display = 'block'; return; }
  if(!email){ errEl.textContent = 'Inserisci la tua email.'; errEl.style.display = 'block'; return; }
  if(!consenso){ errEl.textContent = 'Accetta la informativa privacy per continuare.'; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none'; errEl.textContent = '';

  btn.disabled = true; btn.textContent = 'Invio in corso...';
  var dati = {
    nome: nome,
    email: email,
    telefono: telefono,
    messaggio: messaggio,
    consenso: true,
    timestamp: new Date().toISOString()
  };
  try{
    await fetch(APPS_URL, {method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body: JSON.stringify(dati)});
    document.getElementById('onboardForm').style.display = 'none';
    document.getElementById('onboardSuccess').style.display = 'flex';
  }catch(e){
    btn.disabled = false; btn.textContent = 'Invia richiesta';
    errEl.textContent = 'Errore di rete. Riprova.'; errEl.style.display = 'block';
  }
}

function closeLead(){
  if(currentUser){ showDash(); }
  else { showScreen('loginScreen'); }
  // Reset the form state for a future visit.
  var form = document.getElementById('onboardForm');
  if(form) form.style.display = 'flex';
  var succ = document.getElementById('onboardSuccess');
  if(succ) succ.style.display = 'none';
  var btn = document.getElementById('onboardBtn');
  if(btn){ btn.disabled = false; btn.textContent = 'Invia richiesta'; }
  var ids = ['f_nome','f_email','f_telefono','f_messaggio'];
  var i;
  for(i=0;i<ids.length;i++){ var el = document.getElementById(ids[i]); if(el) el.value = ''; }
  var cons = document.getElementById('f_consenso'); if(cons) cons.checked = false;
  var errEl = document.getElementById('onboardErr'); if(errEl){ errEl.textContent = ''; errEl.style.display = 'none'; }
}
