function initRegistru() {
  const tab = document.getElementById('tab-registru');
  tab.innerHTML = `
    <div class="card">
      <h3>Registru de evidență fiscală</h3>
      <div class="grid-2">
        <select id="registru-an"></select>
        <select id="registru-luna">
          <option value="">Toate lunile</option>
        </select>
      </div>
      <button id="btn-export-csv-registru" class="btn btn-secondary">Export CSV</button>
      <div id="tabel-registru"></div>
    </div>
  `;
  const anSelect = document.getElementById('registru-an');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    anSelect.appendChild(opt);
  }
  anSelect.value = currentYear;
  const lunaSelect = document.getElementById('registru-luna');
  for (let m = 0; m < 12; m++) {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = new Date(2020, m, 1).toLocaleString('ro-RO', { month: 'long' });
    lunaSelect.appendChild(opt);
  }
  anSelect.addEventListener('change', genereazaRegistru);
  lunaSelect.addEventListener('change', genereazaRegistru);
  document.getElementById('btn-export-csv-registru').addEventListener('click', exportCSVRegistru);
  genereazaRegistru();
}

async function genereazaRegistru() {
  const an = parseInt(document.getElementById('registru-an').value);
  const luna = document.getElementById('registru-luna').value;
  const user = (await supabase.auth.getUser()).data.user;
  let startDate = `${an}-01-01`;
  let endDate = `${an}-12-31`;
  if (luna !== '') {
    const m = parseInt(luna);
    startDate = `${an}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(an, m + 1, 0).getDate();
    endDate = `${an}-${String(m + 1).padStart(2, '0')}-${lastDay}`;
  }
  const [facturi, cheltuieli] = await Promise.all([
    supabase.from('facturi').select('*').gte('data', startDate).lte('data', endDate),
    supabase.from('cheltuieli').select('*').gte('data', startDate).lte('data', endDate)
  ]);
  if (facturi.error || cheltuieli.error) return;

  const lunar = {};
  facturi.data.forEach(f => {
    const key = f.data.slice(0, 7);
    if (!lunar[key]) lunar[key] = { venituri: 0, cheltuieli: 0 };
    lunar[key].venituri += f.suma_bani;
  });
  cheltuieli.data.forEach(c => {
    const key = c.data.slice(0, 7);
    if (!lunar[key]) lunar[key] = { venituri: 0, cheltuieli: 0 };
    lunar[key].cheltuieli += c.suma_total_bani;
  });

  const div = document.getElementById('tabel-registru');
  div.innerHTML = `
    <table>
      <thead><tr><th>Lună</th><th>Total venituri</th><th>Total cheltuieli</th><th>Rezultat net</th></tr></thead>
      <tbody>
        ${Object.entries(lunar).sort().map(([key, val]) => `
          <tr>
            <td>${key}</td>
            <td>${formatBani(val.venituri)}</td>
            <td>${formatBani(val.cheltuieli)}</td>
            <td>${formatBani(val.venituri - val.cheltuieli)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function exportCSVRegistru() {
  const rows = document.querySelectorAll('#tabel-registru tbody tr');
  let csv = 'Luna,Venituri,Cheltuieli,Rezultat\n';
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    csv += `${cells[0].textContent},${cells[1].textContent},${cells[2].textContent},${cells[3].textContent}\n`;
  });
  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'registru_fiscal.csv', 'text/csv');
}