function initExtrase() {
  const tab = document.getElementById('tab-extrase');
  tab.innerHTML = `
    <div class="card">
      <h3>Adaugă tranzacție</h3>
      <form id="form-extras" class="grid-2">
        <div><label>Data</label><input type="date" id="extras-data" required></div>
        <div><label>Descriere</label><input type="text" id="extras-descriere" required></div>
        <div><label>Sumă (lei)</label><input type="number" step="0.01" id="extras-suma" required></div>
        <div><label>Tip</label>
          <select id="extras-tip"><option value="venit">Venit</option><option value="cheltuiala">Cheltuială</option></select>
        </div>
        <div><label>Asociază factură</label><select id="extras-factura"></select></div>
        <div><label>Asociază cheltuială</label><select id="extras-cheltuiala"></select></div>
        <div><label>Atașament</label><input type="file" id="extras-atasament"></div>
        <div><button type="submit" class="btn">Salvează</button></div>
      </form>
    </div>
    <div class="card">
      <div style="overflow-x:auto;"><table id="tabel-extrase"></table></div>
    </div>
  `;

  document.getElementById('form-extras').addEventListener('submit', salveazaExtras);
  incarcaExtrase();
}

async function incarcaExtrase() {
  const user = (await supabase.auth.getUser()).data.user;
  const [facturi, cheltuieli, extrase] = await Promise.all([
    supabase.from('facturi').select('id, serie, numar, client'),
    supabase.from('cheltuieli').select('id, furnizor'),
    supabase.from('extrase').select('*').order('data', { ascending: false })
  ]);
  if (extrase.error) return;
  const facturaSelect = document.getElementById('extras-factura');
  const cheltuialaSelect = document.getElementById('extras-cheltuiala');
  facturaSelect.innerHTML = '<option value="">Niciuna</option>' + facturi.data.map(f => `<option value="${f.id}">${f.serie}${f.numar} - ${f.client}</option>`).join('');
  cheltuialaSelect.innerHTML = '<option value="">Niciuna</option>' + cheltuieli.data.map(c => `<option value="${c.id}">${c.furnizor}</option>`).join('');

  const tbody = document.querySelector('#tabel-extrase');
  tbody.innerHTML = `
    <thead><tr><th>Data</th><th>Descriere</th><th>Sumă</th><th>Tip</th><th>Asociere</th><th>Reconciliat</th><th>Acțiuni</th></tr></thead>
    <tbody>
      ${extrase.data.map(ex => `
        <tr>
          <td>${ex.data}</td>
          <td>${ex.descriere}</td>
          <td>${formatBani(Math.abs(ex.suma_bani))}</td>
          <td>${ex.tip}</td>
          <td>${ex.factura_id ? 'Factură' : ex.cheltuiala_id ? 'Cheltuială' : '-'}</td>
          <td>${ex.reconciliat ? 'Da' : 'Nu'}</td>
          <td><button class="btn btn-secondary btn-sm" onclick="marcheazaReconciliat('${ex.id}')">Reconciliază</button>
        </tr>
      `).join('')}
    </tbody>`;
}

async function salveazaExtras(e) {
  e.preventDefault();
  const user = (await supabase.auth.getUser()).data.user;
  const data = document.getElementById('extras-data').value;
  const descriere = document.getElementById('extras-descriere').value.trim();
  const sumaAbs = parseLeiToBani(document.getElementById('extras-suma').value);
  const tip = document.getElementById('extras-tip').value;
  const factura_id = document.getElementById('extras-factura').value || null;
  const cheltuiala_id = document.getElementById('extras-cheltuiala').value || null;
  const suma_bani = tip === 'venit' ? sumaAbs : -sumaAbs;
  const file = document.getElementById('extras-atasament').files[0];
  let atasament_path = null;
  if (file) atasament_path = await uploadFileToStorage(file, 'extrase');
  const { error } = await supabase.from('extrase').insert({
    user_id: user.id,
    data,
    descriere,
    suma_bani,
    tip,
    factura_id,
    cheltuiala_id,
    atasament_path,
    reconciliat: (factura_id || cheltuiala_id) ? true : false
  });
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else {
    showToast('Tranzacție salvată', 'success');
    document.getElementById('form-extras').reset();
    incarcaExtrase();
  }
}

async function marcheazaReconciliat(id) {
  const { error } = await supabase.from('extrase').update({ reconciliat: true }).eq('id', id);
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else incarcaExtrase();
}

async function stergeExtras(id) {
  if (!confirm('Sigur ștergi tranzacția?')) return;
  const { error } = await supabase.from('extrase').delete().eq('id', id);
  if (error) showToast('Eroare: ' + error.message, 'danger');
  else incarcaExtrase();
}
