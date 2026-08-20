// Utilitare globale, navigare, dashboard, backup/restore
let activeTab = 'dashboard';

function initNavigation() {
  const links = document.querySelectorAll('#nav-menu a[data-tab]');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      switchTab(tab);
    });
  });
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  // Backup / Restore
  document.getElementById('btn-backup').addEventListener('click', exportJSONBackup);
  document.getElementById('btn-restore').addEventListener('click', () => {
    document.getElementById('restore-file-input').click();
  });
  // Input ascuns pentru restore
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'restore-file-input';
  input.accept = '.json,.enc';
  input.style.display = 'none';
  input.addEventListener('change', importJSONBackup);
  document.body.appendChild(input);
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelectorAll('#nav-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.tab === tab);
  });
  // Reîncărcare date specifice la schimbare
  switch (tab) {
    case 'dashboard': initDashboard(); break;
    case 'facturi': incarcaFacturi(); break;
    case 'cheltuieli': incarcaCheltuieli(); break;
    case 'registru': genereazaRegistru(); break;
    case 'extrase': incarcaExtrase(); break;
    case 'contracte': incarcaContracte(); break;
    case 'declaratie': initDeclaratie(); break;
    case 'documente': incarcaDocumente(); break;
    case 'secretariat': incarcaSecretariat(); break;
    case 'efactura': incarcaListaFacturiEfactura(); break;
  }
}

// Formatare bani: integer bani -> string lei
function formatBani(bani) {
  return (bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' lei';
}
function parseLeiToBani(leiStr) {
  const nr = parseFloat(leiStr.replace(',', '.'));
  if (isNaN(nr)) return 0;
  return Math.round(nr * 100);
}

// Draft-uri localStorage
function salveazaDraft(key, data) {
  try {
    localStorage.setItem(`draft_${key}`, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}
function incarcaDraft(key) {
  try {
    const raw = localStorage.getItem(`draft_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function stergeDraft(key) {
  localStorage.removeItem(`draft_${key}`);
}

function showToast(msg, type = 'success') {
  const div = document.createElement('div');
  div.className = `alert alert-${type === 'success' ? 'warning' : 'danger'}`;
  div.textContent = msg;
  div.style.position = 'fixed';
  div.style.top = '1rem';
  div.style.right = '1rem';
  div.style.zIndex = '300';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// Upload fișier în Storage (bucket privat)
async function uploadFileToStorage(file, modul) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;
  const path = `${user.id}/${modul}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('documente').upload(path, file);
  if (error) {
    showToast('Eroare upload: ' + error.message, 'danger');
    return null;
  }
  return path;
}

// Obține URL semnat pentru un path
async function getSignedUrl(path) {
  const { data, error } = await supabase.storage.from('documente').createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

// Dashboard
async function initDashboard() {
  const tab = document.getElementById('tab-dashboard');
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [facturiLuna, cheltuieliLuna, facturiNeincasate, contracteExpirand, declaratie] = await Promise.all([
    supabase.from('facturi').select('suma_bani').gte('data', startOfMonth).lte('data', endOfMonth),
    supabase.from('cheltuieli').select('suma_total_bani').gte('data', startOfMonth).lte('data', endOfMonth),
    supabase.from('facturi').select('suma_bani').eq('status', 'neplătită'),
    supabase.from('contracte').select('id, client, data_end').eq('status', 'activ').lte('data_end', thirtyDaysFromNow).gte('data_end', now.toISOString().slice(0, 10)),
    supabase.from('declaratii').select('*').eq('an', CONFIG_FISCAL.FISCAL.anCurent).maybeSingle()
  ]);

  const totalFacturat = facturiLuna.data?.reduce((sum, f) => sum + f.suma_bani, 0) || 0;
  const totalCheltuieli = cheltuieliLuna.data?.reduce((sum, c) => sum + c.suma_total_bani, 0) || 0;
  const totalNeincasat = facturiNeincasate.data?.reduce((sum, f) => sum + f.suma_bani, 0) || 0;

  const termenDeclaratie = new Date(CONFIG_FISCAL.FISCAL.termenDeclaratieUnica);
  const zilePanaTermen = Math.ceil((termenDeclaratie - now) / (1000 * 60 * 60 * 24));

  tab.innerHTML = `
    <div class="grid-3">
      <div class="card"><h3>Facturat luna curentă</h3><p>${formatBani(totalFacturat)}</p></div>
      <div class="card"><h3>Cheltuieli luna curentă</h3><p>${formatBani(totalCheltuieli)}</p></div>
      <div class="card"><h3>Sold estimativ</h3><p>${formatBani(totalFacturat - totalCheltuieli)}</p></div>
    </div>
    <div class="grid-3" style="margin-top:1rem;">
      <div class="card"><h3>Facturi neîncasate</h3><p>${formatBani(totalNeincasat)}</p></div>
      <div class="card"><h3>Contracte care expiră în 30 zile</h3>
        <ul>${contracteExpirand.data?.map(c => `<li>${c.client} – ${c.data_end}</li>`).join('') || '<li>Niciunul</li>'}</ul>
      </div>
      <div class="card"><h3>Declarația unică</h3>
        <p>Termen: ${CONFIG_FISCAL.FISCAL.termenDeclaratieUnica}</p>
        <p>Status: ${declaratie.data?.status || 'nedepusă'}</p>
        ${zilePanaTermen <= 30 && zilePanaTermen > 0 ? `<p class="alert alert-warning">Mai sunt ${zilePanaTermen} zile!</p>` : ''}
      </div>
    </div>
    <div class="card">
      <canvas id="chart-venituri-cheltuieli" style="max-height:300px;"></canvas>
    </div>
  `;

  // Grafic simplu cu Chart.js
  const { data: facturiAn } = await supabase.from('facturi').select('data, suma_bani')
    .gte('data', `${CONFIG_FISCAL.FISCAL.anCurent}-01-01`).lte('data', `${CONFIG_FISCAL.FISCAL.anCurent}-12-31`);
  const { data: cheltuieliAn } = await supabase.from('cheltuieli').select('data, suma_total_bani')
    .gte('data', `${CONFIG_FISCAL.FISCAL.anCurent}-01-01`).lte('data', `${CONFIG_FISCAL.FISCAL.anCurent}-12-31`);

  const lunile = Array.from({length: 12}, (_, i) => new Date(CONFIG_FISCAL.FISCAL.anCurent, i, 1).toLocaleString('ro-RO', { month: 'short' }));
  const venituri = new Array(12).fill(0);
  const cheltuieliArr = new Array(12).fill(0);
  facturiAn?.forEach(f => { const m = new Date(f.data).getMonth(); venituri[m] += f.suma_bani; });
  cheltuieliAn?.forEach(c => { const m = new Date(c.data).getMonth(); cheltuieliArr[m] += c.suma_total_bani; });

  const ctx = document.getElementById('chart-venituri-cheltuieli')?.getContext('2d');
  if (ctx && window.Chart) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lunile,
        datasets: [
          { label: 'Venituri (lei)', data: venituri.map(v => v / 100), backgroundColor: '#2563eb' },
          { label: 'Cheltuieli (lei)', data: cheltuieliArr.map(c => c / 100), backgroundColor: '#dc2626' }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  }
}

// Export JSON backup (cu opțiune criptare)
async function exportJSONBackup() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const tables = ['facturi', 'cheltuieli', 'extrase', 'contracte', 'declaratii', 'documente', 'secretariat'];
  const backup = { version: 1, exportedAt: new Date().toISOString(), data: {} };
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (!error) backup.data[table] = data;
  }
  const json = JSON.stringify(backup, null, 2);

  const encrypt = confirm('Dorești criptarea fișierului cu o parolă? (Recomandat)');
  if (encrypt) {
    const password = prompt('Introdu parola pentru criptare:');
    if (!password) { showToast('Parolă lipsă, export anulat', 'danger'); return; }
    try {
      const enc = await encryptData(json, password);
      downloadBlob(new Blob([enc]), `backup_pfa_${new Date().toISOString().slice(0,10)}.enc`, 'application/octet-stream');
      showToast('Backup criptat descărcat. Păstrează parola!', 'success');
    } catch (e) {
      showToast('Eroare criptare: ' + e.message, 'danger');
    }
  } else {
    downloadBlob(new Blob([json], { type: 'application/json' }), `backup_pfa_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
    showToast('Backup JSON descărcat (necriptat!).', 'warning');
  }
}

// Import JSON backup
async function importJSONBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    let content = e.target.result;
    let jsonText;
    if (file.name.endsWith('.enc')) {
      const password = prompt('Introdu parola pentru decriptare:');
      if (!password) return;
      try {
        jsonText = await decryptData(content, password);
      } catch (err) {
        showToast('Decriptare eșuată: ' + err.message, 'danger');
        return;
      }
    } else {
      jsonText = content;
    }
    try {
      const backup = JSON.parse(jsonText);
      if (!backup.data) throw new Error('Structură invalidă');
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      for (const [table, rows] of Object.entries(backup.data)) {
        if (!rows.length) continue;
        const allowed = ['facturi', 'cheltuieli', 'extrase', 'contracte', 'declaratii', 'documente', 'secretariat'];
        if (!allowed.includes(table)) continue;
        // Curățare date existente? Mai sigur upsert cu onConflict
        for (const row of rows) {
          const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
          if (error) console.error(`Eroare import ${table}:`, error);
        }
      }
      showToast('Restaurare completă!', 'success');
      // Reîncarcă dashboard
      initDashboard();
    } catch (err) {
      showToast('Eroare import: ' + err.message, 'danger');
    }
  };
  reader.readAsText(file);
}

function downloadBlob(blob, filename, mimeType) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Criptare cu Web Crypto API
async function encryptData(plainText, password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );
  // Structură: [salt(16)][iv(12)][ciphertext]
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return combined;
}

async function decryptData(encryptedBytes, password) {
  const data = new Uint8Array(encryptedBytes);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}