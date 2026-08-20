// Modul Arhivă documente
function initDocumente() {
  const tab = document.getElementById('tab-documente');
  tab.innerHTML = `
    <div class="card">
      <h3>Adaugă document arhivă</h3>
      <form id="form-document" class="grid-2">
        <div><label>Denumire</label><input type="text" id="document-denumire" required></div>
        <div><label>Tip document</label><input type="text" id="document-tip" required></div>
        <div><label>Data document</label><input type="date" id="document-data"></div>
        <div><label>Client/Furnizor</label><input type="text" id="document-client_furnizor"></div>
        <div><label>Atașament</label><input type="file" id="document-atasament"></div>
        <div><button type="submit" class="btn">Salvează</button></div>
      </form>
    </div>
    <div class="card">
      <h3>Documente arhivate</h3>
      <input type="text" id="document-filtru" placeholder="Caută după denumire, tip, client">
      <div style="overflow-x:auto;"><table id="tabel-documente"></table></div>
    </div>
  `;

  document.getElementById('form-document').addEventListener('submit', salveazaDocument);
  document.getElementById('document-filtru').addEventListener('input', incarcaDocumente);
  incarcaDocumente();
}

async function incarcaDocumente() {
  const filtru = document.getElementById('document-filtru')?.value?.toLowerCase() || '';
  let query = supabase.from('documente').select('*').order('data_document', { ascending: false });
  if (filtru) {
    query = query.or(`denumire.ilike.%${filtru}%,tip.ilike.%${filtru}%,client_furnizor.ilike.%${filtru}%`);
  }
  const { data, error } = await query;
  if (error) return;

  const tbody = document.querySelector('#tabel-documente');
  tbody.innerHTML = `
    <thead><tr>
      <th>Denumire</th><th>Tip</th><th>Data</th><th>Client/Furnizor</th>
      <th>Atașament</th><th>Perioadă păstrare</th><th>Status</th><th>Acțiuni</th>
    </tr></thead>
    <tbody>
      ${data.map(d => {
        const dataDoc = new Date(d.data_document || Date.now());
        const expirare = new Date(dataDoc);
        expirare.setFullYear(expirare.getFullYear() + d.perioada_pastrare_ani);
        const now = new Date();
        const zileRamase = Math.ceil((expirare - now) / (1000 * 60 * 60 * 24));
        let status = 'activ';
        if (zileRamase < 0) status = 'expirat';
        else if (zileRamase < 365) status = 'aproape de expirare';
        return `
          <tr>
            <td>${d.denumire}</td>
            <td>${d.tip}</td>
            <td>${d.data_document || '-'}</td>
            <td>${d.client_furnizor || '-'}</td>
            <td>${d.atasament_path ? `<button class="btn btn-secondary btn-sm" onclick="window.open('${getSignedUrl(d.atasament_path)}')">Deschide</button>` : '-'}</td>
            <td>${d.perioada_pastrare_ani} ani</td>
            <td><span class="badge ${status === 'activ' ? 'badge-success' : status === 'aproape de expirare' ? 'badge-warning' : 'badge-danger'}">${status}</span></td>
          </tr>`;
      }).join('')}
    </tbody>`;
}

async function salveazaDocument(e) {
  e.preventDefault();
  const user = (await supabase.auth.getUser()).data.user;
  const denumire = document.getElementById('document-denumire').value.trim();
  const tip = document.getElementById('document-tip').value.trim();
  const data_document = document.getElementById('document-data').value || null;
  const client_furnizor = document.getElementById('document-client_furnizor').value.trim();
  const file = document.getElementById('document-atasament').files[0];
  if (!denumire || !tip) {
    showToast('Completează denumirea și tipul!', 'danger');
    return;
  }
  let atasament_path = null;
  if (file) atasament_path = await uploadFileToStorage(file, 'documente');
  const { error } = await supabase.from('documente').insert({
    user_id: user.id,
    denumire,
    tip,
    data_document,
    client_furnizor,
    atasament_path,
    perioada_pastrare_ani: 5
  });
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else {
    showToast('Document arhivat', 'success');
    document.getElementById('form-document').reset();
    incarcaDocumente();
  }
}

async function stergeDocument(id) {
  if (!confirm('Sigur ștergi documentul?')) return;
  const { error } = await supabase.from('documente').delete().eq('id', id);
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else { showToast('Document șters', 'success'); incarcaDocumente(); }
}
