function initContracte() {
  const tab = document.getElementById('tab-contracte');
  tab.innerHTML = `
    <div class="card">
      <h3>Adaugă contract</h3>
      <form id="form-contract" class="grid-2">
        <div><label>Client</label><input type="text" id="contract-client" required></div>
        <div><label>Obiect</label><input type="text" id="contract-obiect" required></div>
        <div><label>Valoare (lei)</label><input type="number" step="0.01" id="contract-valoare" required></div>
        <div><label>Data început</label><input type="date" id="contract-start" required></div>
        <div><label>Data sfârșit</label><input type="date" id="contract-end" required></div>
        <div><label>Status</label><select id="contract-status"><option value="activ">Activ</option><option value="expirat">Expirat</option><option value="reziliat">Reziliat</option></select></div>
        <div><label>Atașament</label><input type="file" id="contract-atasament"></div>
        <div><button type="submit" class="btn">Salvează</button></div>
      </form>
    </div>
    <div class="card">
      <div id="alerte-contracte"></div>
      <div style="overflow-x:auto;"><table id="tabel-contracte"></table></div>
    </div>
  `;

  document.getElementById('form-contract').addEventListener('submit', salveazaContract);
  // Draft
  const draft = incarcaDraft('contract');
  if (draft) {
    Object.entries(draft).forEach(([key, val]) => {
      const el = document.getElementById(`contract-${key}`);
      if (el) el.value = val;
    });
  }
  document.getElementById('form-contract').addEventListener('input', () => {
    const draft = {
      client: document.getElementById('contract-client').value,
      obiect: document.getElementById('contract-obiect').value,
      valoare: document.getElementById('contract-valoare').value,
      start: document.getElementById('contract-start').value,
      end: document.getElementById('contract-end').value,
      status: document.getElementById('contract-status').value
    };
    salveazaDraft('contract', draft);
  });
  incarcaContracte();
}

async function incarcaContracte() {
  const user = (await supabase.auth.getUser()).data.user;
  const { data, error } = await supabase.from('contracte').select('*').order('data_end', { ascending: true });
  if (error) return;
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const alerte = data.filter(c => c.status === 'activ' && c.data_end <= thirtyDays && c.data_end >= now.toISOString().slice(0, 10));
  document.getElementById('alerte-contracte').innerHTML = alerte.length ? `
    <div class="alert alert-warning">
      <strong>Atenție!</strong> ${alerte.length} contracte expiră în următoarele 30 de zile.
      <ul>${alerte.map(c => `<li>${c.client} – ${c.data_end}</li>`).join('')}</ul>
    </div>` : '';

  const tbody = document.querySelector('#tabel-contracte');
  tbody.innerHTML = `
    <thead><tr><th>Client</th><th>Obiect</th><th>Valoare</th><th>Start</th><th>Sfârșit</th><th>Status</th><th>Atașament</th><th>Acțiuni</th></tr></thead>
    <tbody>
      ${data.map(c => `
        <tr>
          <td>${c.client}</td>
          <td>${c.obiect}</td>
          <td>${formatBani(c.valoare_bani)}</td>
          <td>${c.data_start}</td>
          <td>${c.data_end}</td>
          <td><span class="badge ${c.status === 'activ' ? 'badge-success' : 'badge-danger'}">${c.status}</span></td>
          <td>${c.atasament_path ? `<button class="btn btn-secondary btn-sm" onclick="window.open('${getSignedUrl(c.atasament_path)}')">Deschide</button>` : '-'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="stergeContract('${c.id}')">Șterge</button></td>
        </tr>
      `).join('')}
    </tbody>`;
}

async function salveazaContract(e) {
  e.preventDefault();
  const user = (await supabase.auth.getUser()).data.user;
  const client = document.getElementById('contract-client').value.trim();
  const obiect = document.getElementById('contract-obiect').value.trim();
  const valoare_bani = parseLeiToBani(document.getElementById('contract-valoare').value);
  const data_start = document.getElementById('contract-start').value;
  const data_end = document.getElementById('contract-end').value;
  const status = document.getElementById('contract-status').value;
  const file = document.getElementById('contract-atasament').files[0];
  let atasament_path = null;
  if (file) atasament_path = await uploadFileToStorage(file, 'contracte');
  const { error } = await supabase.from('contracte').insert({
    user_id: user.id, client, obiect, valoare_bani, data_start, data_end, status, atasament_path
  });
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else {
    showToast('Contract salvat', 'success');
    stergeDraft('contract');
    document.getElementById('form-contract').reset();
    incarcaContracte();
  }
}

async function stergeContract(id) {
  if (!confirm('Sigur ștergi contractul?')) return;
  const { error } = await supabase.from('contracte').delete().eq('id', id);
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else incarcaContracte();
}