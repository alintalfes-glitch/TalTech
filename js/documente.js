function initDocumente() {
  const tab = document.getElementById('tab-documente');
  tab.innerHTML = `
    <div class="card">
      <h3>Adaugă document arhivă</h3>
      <form id="form-document" class="grid-2">
        <div><label>Denumire</label><input type="text" id="document-denumire" required></div>
        <div><label>Tip</label><input type="text" id="document-tip" required></div>
        <div><label>