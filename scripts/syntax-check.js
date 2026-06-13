// Syntax-check pre-commit — zero dipendenze npm, solo built-in.
// Estrae i blocchi <script> SENZA src da index.html e fa "node --check"
// su ognuno; poi "node --check" diretto su progress.js e admin-ui.js.
var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var failures = [];

function checkFile(file, label) {
  try {
    cp.execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    var msg = (e.stderr ? e.stderr.toString() : '') || e.message;
    failures.push({ label: label, error: msg.trim() });
  }
}

// --- 1) blocchi <script> inline di index.html ---
var indexPath = path.join(ROOT, 'index.html');
var html = fs.readFileSync(indexPath, 'utf8');

// match di ogni <script ...> ... </script> (case-insensitive, multilinea)
var re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
var m;
var blockNum = 0;
while ((m = re.exec(html)) !== null) {
  var attrs = m[1] || '';
  var body = m[2] || '';
  // salta i tag con attributo src
  if (/\bsrc\s*=/i.test(attrs)) continue;
  blockNum++;
  var tmp = path.join(os.tmpdir(), 'synckchk_index_block' + blockNum + '_' + process.pid + '.js');
  fs.writeFileSync(tmp, body, 'utf8');
  checkFile(tmp, 'index.html <script> blocco #' + blockNum);
  try { fs.unlinkSync(tmp); } catch (e) {}
}

// --- 2) file .js esterni nella root ---
['progress.js', 'admin-ui.js'].forEach(function (f) {
  var p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    checkFile(p, f);
  } else {
    failures.push({ label: f, error: 'File non trovato: ' + p });
  }
});

// --- esito ---
if (failures.length > 0) {
  console.error('Syntax check FALLITO:\n');
  failures.forEach(function (f) {
    console.error('  ✗ ' + f.label);
    console.error('    ' + f.error.replace(/\n/g, '\n    '));
    console.error('');
  });
  process.exit(1);
}

console.log('Syntax OK');
process.exit(0);
