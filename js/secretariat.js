// Modul Secretariat – Registru de intrări/ieșiri
function initSecretariat() {
  const tab = document.getElementById('tab-secretariat');
  tab.innerHTML = `
    <div class="card">
      <h3>Adaugă înregistrare</h3>
      <form id="form-secretariat" class="grid-2">
        <div><label>Tip</label>
          <select id="secretariat-tip">
            <option value="intrare">Intrare</option>
            <option value="iesire">Ieșire</option>
          </select>
        </div>
        <div><label>Data</label><input type="date" id="secretariat-data" required></div>
        <div><label>Expeditor/Destinatar</label><input type="text" id="secretariat-expeditor" required></div>
        <div><label>Obiect</label><input type="text" id="secretariat-obiect" required></div>
        <div><label>Referință document</label><input type="text" id="secretariat-referinta"></div>
        <div><label>Atașament</label><input type="file" id="secretariat-atasament"></div>
        <div><button type="submit" class="btn">Salvează</button></div>
      </form>
    </div>
    <div class="card">
      <h3>Registru</h3>
      <div class="grid-2">
        <input type="text" id="secretariat-filtru" placeholder="Caută după număr, obiect, expeditor">
        <select id="secretariat-filtru-tip">
          <option value="">Toate</option>
          <option value="intrare">Intrări</option>
          <option value="iesire">Ieșiri</option>
        </select>
      </div>
      <button id="btn-export-csv-secretariat" class="btn btn-secondary">Export CSV</button>
      <div style="overflow-x:auto;"><table id="tabel-secretariat"></table></div>
    </div>
  `;

  document.getElementById('form-secretariat').addEventListener('submit', salveazaSecretariat);
  document.getElementById('secretariat-filtru').addEventListener('input', incarcaSecretariat);
  document.getElementById('secretariat-filtru-tip').addEventListener('change', incarcaSecretariat);
  document.getElementById('btn-export-csv-secretariat').addEventListener('click', exportCSVSecretariat);

  incarcaSecretariat();
}

async function incarcaSecretariat() {
  const filtru = document.getElementById('secretariat-filtru')?.value?.toLowerCase() || '';
  const tip = document.getElementById('secretariat-filtru-tip')?.value || '';
  let query = supabase.from('secretariat').select('*').order('data', { ascending: false }).order('numar_registru', { ascending: false });
  if (tip) query = query.eq('tip', tip);
  if (filtru) query = query.or(`numar_registru.eq.${filtru},obiect.ilike.%${filtru}%,expeditor_destinatar.ilike.%${filtru}%`);

  const { data, error } = await query;
  if (error) return;

  const tbody = document.querySelector('#tabel-secretariat');
  tbody.innerHTML = `
    <thead><tr>
      <th>Tip</th><th>Număr</th><th>Data</th><th>Expeditor/Destinatar</th>
      <th>Obiect</th><th>Referință</th><th>Atașament</th><th>Acțiuni</th>
    </tr></thead>
    <tbody>
      ${data.map(s => `
        <tr>
          <td>${s.tip}</td>
          <td>${s.numar_registru}</td>
          <td>${s.data}</td>
          <td>${s.expeditor_destinatar}</td>
          <td>${s.obiect}</td>
          <td>${s.referinta_document || '-'}</td>
          <td>${s.atasament_path ? `<button class="btn btn-secondary btn-sm" onclick="window.open('${getSignedUrl(s.atasament_path)}')">Deschide</button>` : '-'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="stergeSecretariat('${s.id}')">Șterge</button></td>
        </tr>
      `).join('')}
    </tbody>`;
}

async function salveazaSecretariat(e) {
  e.preventDefault();
  const user = (await supabase.auth.getUser()).data.user;
  const tip = document.getElementById('secretariat-tip').value;
  const data = document.getElementById('secretariat-data').value;
  const expeditor = document.getElementById('secretariat-expeditor').value.trim();
  const obiect = document.getElementById('secretariat-obiect').value.trim();
  const referinta = document.getElementById('secretariat-referinta').value.trim();
  const file = document.getElementById('secretariat-atasament').files[0];
  if (!data || !expeditor || !obiect) {
    showToast('Completează câmpurile obligatorii!', 'danger');
    return;
  }
  let atasament_path = null;
  if (file) atasament_path = await uploadFileToStorage(file, 'secretariat');
  const { error } = await supabase.from('secretariat').insert({
    user_id: user.id,
    tip,
    data,
    expeditor_destinatar: expeditor,
    obiect,
    referinta_document: referinta,
    atasament_path
  });
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else {
    showToast('Înregistrare salvată', 'success');
    document.getElementById('form-secretariat').reset();
    incarcaSecretariat();
  }
}

async function stergeSecretariat(id) {
  if (!confirm('Sigur ștergi înregistrarea?')) return;
  const { error } = await supabase.from('secretariat').delete().eq('id', id);
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else incarcaSecretariat();
}

function exportCSVSecretariat() {
  const rows = document.querySelectorAll('#tabel-secretariat tbody tr');
  let csv = 'Tip,Numar,Data,Expeditor/Destinatar,Obiect,Referinta\n';
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    csv += `${cells[0].textContent},${cells[1].textContent},${cells[2].textContent},${cells[3].textContent},${cells[4].textContent},${cells[5].textContent}\n`;
  });
  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'registru_secretariat.csv', 'text/csv');
}
