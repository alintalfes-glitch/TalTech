function initCheltuieli() {
  const tab = document.getElementById('tab-cheltuieli');
  tab.innerHTML = `
    <div class="card">
      <h3>Adaugă cheltuială</h3>
      <form id="form-cheltuiala" class="grid-2">
        <div><label>Furnizor</label><input type="text" id="cheltuiala-furnizor" required></div>
        <div><label>Categorie</label>
          <select id="cheltuiala-categorie">
            <option value="materiale">Materiale</option>
            <option value="servicii">Servicii</option>
            <option value="utilitati">Utilități</option>
            <option value="transport">Transport</option>
            <option value="altele">Altele</option>
          </select>
        </div>
        <div><label>Sumă totală (lei)</label><input type="number" step="0.01" id="cheltuiala-suma" required></div>
        <div><label>Data</label><input type="date" id="cheltuiala-data" required></div>
        <div><label>Nr. factură furnizor</label><input type="text" id="cheltuiala-numar"></div>
        <div><label>Atașament</label><input type="file" id="cheltuiala-atasament"></div>
        <div><button type="submit" class="btn">Salvează</button></div>
      </form>
    </div>
    <div class="card">
      <div class="grid-2">
        <input type="text" id="cheltuiala-filtru-furnizor" placeholder="Filtrează furnizor">
        <select id="cheltuiala-filtru-categorie">
          <option value="">Toate</option>
          <option value="materiale">Materiale</option>
          <option value="servicii">Servicii</option>
          <option value="utilitati">Utilități</option>
          <option value="transport">Transport</option>
          <option value="altele">Altele</option>
        </select>
      </div>
      <div style="overflow-x:auto;"><table id="tabel-cheltuieli"></table></div>
    </div>
  `;

  document.getElementById('form-cheltuiala').addEventListener('submit', salveazaCheltuiala);
  document.getElementById('cheltuiala-filtru-furnizor').addEventListener('input', incarcaCheltuieli);
  document.getElementById('cheltuiala-filtru-categorie').addEventListener('change', incarcaCheltuieli);

  // Draft
  const draft = incarcaDraft('cheltuiala');
  if (draft) {
    Object.entries(draft).forEach(([key, val]) => {
      const el = document.getElementById(`cheltuiala-${key}`);
      if (el) el.value = val;
    });
  }
  document.getElementById('form-cheltuiala').addEventListener('input', () => {
    const draft = {
      furnizor: document.getElementById('cheltuiala-furnizor').value,
      categorie: document.getElementById('cheltuiala-categorie').value,
      suma: document.getElementById('cheltuiala-suma').value,
      data: document.getElementById('cheltuiala-data').value,
      numar: document.getElementById('cheltuiala-numar').value
    };
    salveazaDraft('cheltuiala', draft);
  });

  incarcaCheltuieli();
}

async function incarcaCheltuieli() {
  const user = (await supabase.auth.getUser()).data.user;
  const filtruFurnizor = document.getElementById('cheltuiala-filtru-furnizor')?.value?.toLowerCase() || '';
  const filtruCategorie = document.getElementById('cheltuiala-filtru-categorie')?.value || '';
  let query = supabase.from('cheltuieli').select('*').order('data', { ascending: false });
  if (filtruFurnizor) query = query.ilike('furnizor', `%${filtruFurnizor}%`);
  if (filtruCategorie) query = query.eq('categorie', filtruCategorie);
  const { data, error } = await query;
  if (error) return;

  const tbody = document.querySelector('#tabel-cheltuieli');
  tbody.innerHTML = `
    <thead><tr><th>Data</th><th>Furnizor</th><th>Categorie</th><th>Sumă</th><th>Nr. fact.</th><th>Atașament</th><th>Acțiuni</th></tr></thead>
    <tbody>
      ${data.map(c => `
        <tr>
          <td>${c.data}</td>
          <td>${c.furnizor}</td>
          <td>${c.categorie}</td>
          <td>${formatBani(c.suma_total_bani)}</td>
          <td>${c.numar_factura_furnizor || '-'}</td>
          <td>${c.atasament_path ? `<button class="btn btn-secondary btn-sm" onclick="window.open('${getSignedUrl(c.atasament_path)}')">Deschide</button>` : '-'}</td>
          <td><button class="btn btn-danger btn-sm" onclick="stergeCheltuiala('${c.id}')">Șterge</button></td>
        </tr>
      `).join('')}
    </tbody>`;
}

async function salveazaCheltuiala(e) {
  e.preventDefault();
  const user = (await supabase.auth.getUser()).data.user;
  const furnizor = document.getElementById('cheltuiala-furnizor').value.trim();
  const categorie = document.getElementById('cheltuiala-categorie').value;
  const suma_bani = parseLeiToBani(document.getElementById('cheltuiala-suma').value);
  const data = document.getElementById('cheltuiala-data').value;
  const numar = document.getElementById('cheltuiala-numar').value.trim();
  const file = document.getElementById('cheltuiala-atasament').files[0];
  if (!furnizor || !data || suma_bani <= 0) {
    showToast('Completează câmpurile obligatorii', 'danger');
    return;
  }
  let atasament_path = null;
  if (file) atasament_path = await uploadFileToStorage(file, 'cheltuieli');
  const { error } = await supabase.from('cheltuieli').insert({
    user_id: user.id,
    furnizor,
    categorie,
    suma_total_bani: suma_bani,
    data,
    numar_factura_furnizor: numar,
    atasament_path
  });
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else {
    showToast('Cheltuială salvată', 'success');
    stergeDraft('cheltuiala');
    document.getElementById('form-cheltuiala').reset();
    incarcaCheltuieli();
  }
}

async function stergeCheltuiala(id) {
  if (!confirm('Sigur ștergi cheltuiala?')) return;
  const { error } = await supabase.from('cheltuieli').delete().eq('id', id);
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else { showToast('Ștearsă', 'success'); incarcaCheltuieli(); }
}