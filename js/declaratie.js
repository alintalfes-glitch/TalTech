function initDeclaratie() {
  const tab = document.getElementById('tab-declaratie');
  tab.innerHTML = `
    <div class="card">
      <h3>Calculator Declarația unică (estimativ)</h3>
      <div class="grid-2">
        <div><label>Venit net estimat (lei)</label><input type="number" step="0.01" id="declaratie-venit"></div>
        <div><button id="btn-calculeaza" class="btn">Calculează</button></div>
      </div>
      <div id="rezultat-calcul"></div>
      <p class="alert alert-warning">Verifică pe site ANAF înainte de utilizare. Valorile sunt configurabile în js/config-fiscal.js.</p>
    </div>
    <div class="card">
      <h3>Status depunere</h3>
      <div class="grid-2">
        <div><label>An</label><select id="declaratie-an"></select></div>
        <div><label>Status</label><select id="declaratie-status"><option value="nedepusa">Nedepusă</option><option value="depusa">Depusă</option></select></div>
        <div><label>Data depunerii</label><input type="date" id="declaratie-data"></div>
        <div><button id="btn-salveaza-declaratie" class="btn">Salvează</button></div>
      </div>
      <div id="alerta-termen"></div>
    </div>
  `;

  const anSelect = document.getElementById('declaratie-an');
  for (let y = 2025; y <= 2030; y++) {
    const opt = document.createElement('option'); opt.value = y; opt.textContent = y; anSelect.appendChild(opt);
  }
  anSelect.value = CONFIG_FISCAL.FISCAL.anCurent;
  document.getElementById('btn-calculeaza').addEventListener('click', calculeazaDeclaratie);
  document.getElementById('btn-salveaza-declaratie').addEventListener('click', salveazaDeclaratie);
  verificaTermen();
}

function calculeazaDeclaratie() {
  const venitLei = parseFloat(document.getElementById('declaratie-venit').value || '0');
  const venitBani = Math.round(venitLei * 100);
  const fiscal = CONFIG_FISCAL.FISCAL;
  const salariuMin = fiscal.salariuMinimBrut * 100;

  let impozit = Math.round(venitBani * fiscal.impozitVenit);
  let cas = 0;
  if (fiscal.CAS.aplicabil) {
    const bazaCAS = Math.min(Math.max(venitBani, fiscal.CAS.plafonMinim * 100), fiscal.CAS.plafonMaxim * 100);
    if (venitBani >= fiscal.CAS.plafonMinim * 100) cas = Math.round(bazaCAS * fiscal.CAS.procent);
  }
  let cass = 0;
  if (fiscal.CASS.aplicabil) {
    const bazaCASS = Math.min(Math.max(venitBani, fiscal.CASS.plafonMinim * 100), fiscal.CASS.plafonMaxim * 100);
    if (venitBani >= fiscal.CASS.plafonMinim * 100) cass = Math.round(bazaCASS * fiscal.CASS.procent);
  }
  const total = impozit + cas + cass;

  document.getElementById('rezultat-calcul').innerHTML = `
    <table>
      <tr><td>Impozit 10%</td><td>${formatBani(impozit)}</td></tr>
      <tr><td>CAS (25%)</td><td>${formatBani(cas)}</td></tr>
      <tr><td>CASS (10%)</td><td>${formatBani(cass)}</td></tr>
      <tr><td><strong>Total</strong></td><td><strong>${formatBani(total)}</strong></td></tr>
    </table>`;
}

async function salveazaDeclaratie() {
  const user = (await supabase.auth.getUser()).data.user;
  const an = parseInt(document.getElementById('declaratie-an').value);
  const status = document.getElementById('declaratie-status').value;
  const data = document.getElementById('declaratie-data').value || null;
  const venitLei = parseFloat(document.getElementById('declaratie-venit').value || '0');
  const venit_bani = Math.round(venitLei * 100);
  const { data: existing, error: fetchError } = await supabase.from('declaratii').select('id').eq('user_id', user.id).eq('an', an).maybeSingle();
  if (fetchError) { showToast('Eroare: ' + fetchError.message, 'danger'); return; }
  let result;
  if (existing) {
    result = await supabase.from('declaratii').update({ venit_net_estimat_bani: venit_bani, status, data_depunere: data }).eq('id', existing.id);
  } else {
    result = await supabase.from('declaratii').insert({ user_id: user.id, an, venit_net_estimat_bani: venit_bani, status, data_depunere: data });
  }
  if (result.error) showToast('Eroare: ' + result.error.message, 'danger');
  else { showToast('Declarație salvată', 'success'); verificaTermen(); }
}

function verificaTermen() {
  const now = new Date();
  const termen = new Date(CONFIG_FISCAL.FISCAL.termenDeclaratieUnica);
  const zile = Math.ceil((termen - now) / (1000 * 60 * 60 * 24));
  const div = document.getElementById('alerta-termen');
  if (zile <= 30 && zile > 0) {
    div.innerHTML = `<div class="alert alert-warning">Termenul limită pentru declarația unică este în ${zile} zile (${termen.toLocaleDateString('ro-RO')}).</div>`;
  } else if (zile <= 0) {
    div.innerHTML = `<div class="alert alert-danger">Termenul pentru declarația unică a trecut!</div>`;
  } else {
    div.innerHTML = '';
  }
}