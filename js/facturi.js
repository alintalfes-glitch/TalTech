// js/facturi.js – Modul facturi emise
function initFacturi() {
  const tab = document.getElementById('tab-facturi');
  tab.innerHTML = `
    <div class="card">
      <h3>Adaugă factură</h3>
      <form id="form-factura" class="grid-2">
        <div><label>Client</label><input type="text" id="factura-client" required></div>
        <div><label>Data</label><input type="date" id="factura-data" required></div>
        <div><label>Serviciu</label><input type="text" id="factura-serviciu" required></div>
        <div><label>Sumă (lei)</label><input type="number" step="0.01" id="factura-suma" required></div>
        <div><label>Status</label>
          <select id="factura-status">
            <option value="emisă">Emisă</option>
            <option value="plătită">Plătită</option>
            <option value="neplătită">Neplătită</option>
          </select>
        </div>
        <div><button type="submit" class="btn">Salvează</button></div>
      </form>
    </div>
    <div class="card">
      <div class="grid-2">
        <input type="text" id="factura-filtru-client" placeholder="Filtrează client">
        <select id="factura-filtru-status">
          <option value="">Toate statusurile</option>
          <option value="emisă">Emisă</option>
          <option value="plătită">Plătită</option>
          <option value="neplătită">Neplătită</option>
        </select>
      </div>
      <button id="btn-export-csv" class="btn btn-secondary">Export CSV</button>
      <div style="overflow-x:auto;"><table id="tabel-facturi"></table></div>
      <div id="totaluri-facturi"></div>
    </div>
  `;

  document.getElementById('form-factura').addEventListener('submit', salveazaFactura);
  document.getElementById('factura-filtru-client').addEventListener('input', incarcaFacturi);
  document.getElementById('factura-filtru-status').addEventListener('change', incarcaFacturi);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSVFacturi);

  // Restaurare draft
  const draft = incarcaDraft('factura');
  if (draft) {
    Object.entries(draft).forEach(([key, val]) => {
      const el = document.getElementById(`factura-${key}`);
      if (el) el.value = val;
    });
  }
  // Salvare draft la modificări
  document.getElementById('form-factura').addEventListener('input', () => {
    const draft = {
      client: document.getElementById('factura-client').value,
      data: document.getElementById('factura-data').value,
      serviciu: document.getElementById('factura-serviciu').value,
      suma: document.getElementById('factura-suma').value,
      status: document.getElementById('factura-status').value
    };
    salveazaDraft('factura', draft);
  });

  incarcaFacturi();
}

async function incarcaFacturi() {
  const filtruClient = document.getElementById('factura-filtru-client')?.value?.toLowerCase() || '';
  const filtruStatus = document.getElementById('factura-filtru-status')?.value || '';
  let query = supabase.from('facturi').select('*').order('data', { ascending: false }).order('numar', { ascending: false });
  if (filtruStatus) query = query.eq('status', filtruStatus);
  if (filtruClient) query = query.ilike('client', `%${filtruClient}%`);
  const { data, error } = await query;
  if (error) { showToast('Eroare încărcare facturi: ' + error.message, 'danger'); return; }

  const tbody = document.querySelector('#tabel-facturi');
  tbody.innerHTML = `
    <thead><tr>
      <th>Serie/Număr</th><th>Data</th><th>Client</th><th>Serviciu</th><th>Sumă</th>
      <th>Status</th><th>Reconciliat</th><th>Acțiuni</th>
    </tr></thead>
    <tbody>
      ${data.map(f => `
        <tr>
          <td>${f.serie}${f.numar}</td>
          <td>${f.data}</td>
          <td>${f.client}</td>
          <td>${f.serviciu}</td>
          <td>${formatBani(f.suma_bani)}</td>
          <td><span class="badge ${f.status === 'plătită' ? 'badge-success' : 'badge-warning'}">${f.status}</span></td>
          <td>${f.reconciliat ? 'Da' : 'Nu'}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="editeazaFactura('${f.id}')">Editează</button>
            <button class="btn btn-secondary btn-sm" onclick="exportPDFFactura('${f.id}')">PDF</button>
            <button class="btn btn-secondary btn-sm" onclick="genereazaXMLSiDescarca('${f.id}')">XML e-Factura</button>
            <button class="btn btn-danger btn-sm" onclick="stergeFactura('${f.id}')">Șterge</button>
          </td>
        </tr>
      `).join('')}
    </tbody>`;
  // tbody.innerHTML += `</tbody>`; // This was wrong before; we fixed it now.

  const totaluri = data.reduce((acc, f) => {
    if (f.status === 'plătită') acc.incasat += f.suma_bani;
    else if (f.status === 'neplătită') acc.neincasat += f.suma_bani;
    return acc;
  }, { incasat: 0, neincasat: 0 });
  document.getElementById('totaluri-facturi').innerHTML = `
    <p>Total încasat: <strong>${formatBani(totaluri.incasat)}</strong> | 
       Total neîncasat: <strong>${formatBani(totaluri.neincasat)}</strong></p>
  `;
}

async function salveazaFactura(e) {
  e.preventDefault();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) { showToast('Utilizator neautentificat', 'danger'); return; }
  const client = document.getElementById('factura-client').value.trim();
  const data = document.getElementById('factura-data').value;
  const serviciu = document.getElementById('factura-serviciu').value.trim();
  const sumaLei = document.getElementById('factura-suma').value;
  const status = document.getElementById('factura-status').value;
  const suma_bani = parseLeiToBani(sumaLei);
  if (!client || !data || !serviciu || suma_bani <= 0) {
    showToast('Completează corect toate câmpurile!', 'danger');
    return;
  }
  const { data: inserted, error } = await supabase.from('facturi').insert({
    user_id: user.id,
    client,
    data,
    serviciu,
    suma_bani,
    tva_bani: 0,
    status,
    serie: CONFIG_FISCAL.PFA.serieFactura
  }).select().single();
  if (error) {
    showToast('Eroare salvare: ' + error.message, 'danger');
  } else {
    showToast(`Factura ${inserted.serie}${inserted.numar} salvată!`, 'success');
    stergeDraft('factura');
    document.getElementById('form-factura').reset();
    incarcaFacturi();
  }
}

async function editeazaFactura(id) {
  const { data, error } = await supabase.from('facturi').select('*').eq('id', id).single();
  if (error) { showToast('Eroare: ' + error.message, 'danger'); return; }
  document.getElementById('factura-client').value = data.client;
  document.getElementById('factura-data').value = data.data;
  document.getElementById('factura-serviciu').value = data.serviciu;
  document.getElementById('factura-suma').value = (data.suma_bani / 100).toFixed(2);
  document.getElementById('factura-status').value = data.status;
  // Modificare formular pentru update
  const form = document.getElementById('form-factura');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const suma_bani = parseLeiToBani(document.getElementById('factura-suma').value);
    const { error: updateError } = await supabase.from('facturi').update({
      client: document.getElementById('factura-client').value,
      data: document.getElementById('factura-data').value,
      serviciu: document.getElementById('factura-serviciu').value,
      suma_bani,
      status: document.getElementById('factura-status').value
    }).eq('id', id);
    if (updateError) showToast('Eroare actualizare: ' + updateError.message, 'danger');
    else {
      showToast('Factură actualizată', 'success');
      form.reset();
      form.onsubmit = salveazaFactura;
      incarcaFacturi();
    }
  };
}

async function stergeFactura(id) {
  console.log('Ștergere factură cu id:', id);
  if (!confirm('Sigur ștergi factura?')) return;
  const { error } = await supabase.from('facturi').delete().eq('id', id);
  if (error) {
    showToast('Eroare ștergere: ' + error.message, 'danger');
    console.error('Eroare la ștergere:', error);
  } else {
    showToast('Factură ștearsă', 'success');
    incarcaFacturi();
  }
}

async function exportPDFFactura(id) {
  const { data: factura, error } = await supabase.from('facturi').select('*').eq('id', id).single();
  if (error || !factura) { showToast('Factura nu a fost găsită', 'danger'); return; }
  const doc = new window.jspdf.jsPDF();
  const pfa = CONFIG_FISCAL.PFA;
  doc.setFontSize(14);
  doc.text(pfa.nume, 20, 20);
  doc.text(pfa.cui, 20, 27);
  doc.text(pfa.adresa, 20, 34);
  doc.text(`Factura ${factura.serie}${factura.numar}`, 150, 20);
  doc.text(`Data: ${factura.data}`, 150, 27);
  doc.text(`Client: ${factura.client}`, 150, 34);
  doc.text('---', 20, 40);
  doc.text('Serviciu: ' + factura.serviciu, 20, 50);
  doc.text('Sumă: ' + formatBani(factura.suma_bani), 20, 60);
  doc.text('TVA: ' + formatBani(factura.tva_bani), 20, 70);
  doc.text('Total: ' + formatBani(factura.suma_bani), 20, 80);
  doc.text(pfa.mentiuneTVA, 20, 95, { maxWidth: 170 });
  doc.save(`factura_${factura.serie}${factura.numar}.pdf`);
}

function exportCSVFacturi() {
  // Obține datele din tabelul afișat
  const rows = document.querySelectorAll('#tabel-facturi tbody tr');
  if (!rows.length) { showToast('Nu există facturi de exportat', 'warning'); return; }
  let csv = 'Serie/Numar,Data,Client,Serviciu,Suma (lei),Status,Reconciliat\n';
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 7) {
      csv += `${cells[0].textContent},${cells[1].textContent},${cells[2].textContent},${cells[3].textContent},${cells[4].textContent},${cells[5].textContent},${cells[6].textContent}\n`;
    }
  });
  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'facturi.csv', 'text/csv');
}

async function genereazaXMLSiDescarca(id) {
  console.log('Generare XML pentru factura cu id:', id);
  const { data: factura, error } = await supabase.from('facturi').select('*').eq('id', id).single();
  if (error || !factura) { showToast('Factura nu a fost găsită', 'danger'); return; }
  const xml = genereazaXMLFactura(factura);
  const errors = validareXMLBestEffort(xml);
  if (errors.length > 0) {
    showToast('Validare best-effort a găsit erori: ' + errors.join('; '), 'danger');
    if (!confirm('Continui descărcarea oricum?')) return;
  } else {
    showToast('Validare structurală reușită (best-effort)', 'success');
  }
  await descarcaSauCopiazaXML(xml, `factura_${factura.serie}${factura.numar}.xml`);
}
