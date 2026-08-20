// Generator XML e-Factura CIUS-RO și validare best-effort
function genereazaXMLFactura(factura) {
  const pfa = CONFIG_FISCAL.PFA;
  const sumaTotalLei = (factura.suma_bani / 100).toFixed(2);
  const data = factura.data;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#RO:CIUS-RO:${CONFIG_FISCAL.EFACTURA.versiuneCIUS}</cbc:CustomizationID>
  <cbc:ID>${pfa.serieFactura}${factura.numar}</cbc:ID>
  <cbc:IssueDate>${data}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>${factura.suma_bani >= 0 ? '380' : '381'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>RON</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXML(pfa.nume)}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${pfa.cui}</cbc:CompanyID>
        <cbc:TaxScheme><cbc:ID>VAT</cbc:ID></cbc:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXML(pfa.adresa)}</cbc:StreetName>
        <cbc:CityName>${escapeXML(pfa.localitate || '')}</cbc:CityName>
        <cbc:CountrySubentity>${escapeXML(pfa.judet || '')}</cbc:CountrySubentity>
        <cac:Country><cbc:IdentificationCode>RO</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${escapeXML(factura.client)}</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount><cbc:ID>${escapeXML(pfa.contBancar)}</cbc:ID></cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="RON">${(factura.tva_bani / 100).toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="RON">${sumaTotalLei}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="RON">${sumaTotalLei}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="RON">${sumaTotalLei}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="RON">${sumaTotalLei}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="RON">${sumaTotalLei}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${escapeXML(factura.serviciu)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>Z</cbc:ID>
        <cbc:Percent>0</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="RON">${sumaTotalLei}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>`;
  return xml;
}

function escapeXML(str) {
  return String(str).replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

// Validare best-effort: verifică structura și sumele
function validareXMLBestEffort(xmlString) {
  const errors = [];
  if (!xmlString.includes('<Invoice')) errors.push('Lipsește elementul rădăcină Invoice');
  if (!xmlString.includes('<cbc:ID>')) errors.push('Lipsește ID factură');
  if (!xmlString.includes('<cbc:IssueDate>')) errors.push('Lipsește data emiterii');
  if (!xmlString.includes('<cbc:InvoiceTypeCode>380') && !xmlString.includes('<cbc:InvoiceTypeCode>381'))
    errors.push('Cod tip factură invalid (trebuie 380 sau 381)');
  if (!xmlString.includes('<cbc:DocumentCurrencyCode>RON')) errors.push('Moneda nu este RON');
  if (!xmlString.includes('<cac:LegalMonetaryTotal>')) errors.push('Lipsesc totalurile monetare');
  // Verificare simplă pentru balanță sume (best-effort)
  const sumRegex = /<cbc:PayableAmount[^>]*>([\d.]+)<\/cbc:PayableAmount>/;
  const taxRegex = /<cbc:TaxAmount[^>]*>([\d.]+)<\/cbc:TaxAmount>/;
  const matchSum = xmlString.match(sumRegex);
  const matchTax = xmlString.match(taxRegex);
  if (matchSum && matchTax) {
    const sum = parseFloat(matchSum[1]);
    const tax = parseFloat(matchTax[1]);
    if (tax !== 0 && tax > sum) errors.push('TVA depășește totalul');
  } else {
    errors.push('Nu s-au putut extrage sumele pentru validare');
  }
  // Notă: validarea XSD oficială necesită fișiere ANAF și este doar best-effort aici.
  return errors;
}

async function descarcaSauCopiazaXML(xmlString, filename) {
  if (confirm('Descarcă XML-ul?')) {
    downloadBlob(new Blob([xmlString], { type: 'application/xml' }), filename, 'application/xml');
  } else {
    await navigator.clipboard.writeText(xmlString);
    showToast('XML copiat în clipboard', 'success');
  }
}
// Încarcă lista de facturi pentru tab-ul e-Factura
async function incarcaListaFacturiEfactura() {
  const tab = document.getElementById('tab-efactura');
  tab.innerHTML = `
    <div class="card">
      <h3>Facturi pentru e-Factura</h3>
      <p class="alert alert-warning">
        Termen transmitere: ${CONFIG_FISCAL.EFACTURA.termenTransmitereZileLucratoare} zile lucrătoare.
        ${CONFIG_FISCAL.EFACTURA.obligatiePFA ? 'Obligația se aplică și PFA-urilor identificate prin CNP (Legea 88/2026, OG 6/2026).' : ''}
        Validarea finală este la ANAF; aplicația nu se conectează la SPV. Uploadul se face manual.
      </p>
      <div style="overflow-x:auto;"><table id="tabel-efactura"></table></div>
    </div>
  `;

  const { data, error } = await supabase.from('facturi').select('*').order('data', { ascending: false });
  if (error) return;

  const tbody = document.querySelector('#tabel-efactura');
  tbody.innerHTML = `
    <thead><tr>
      <th>Serie/Număr</th><th>Data</th><th>Client</th><th>Sumă</th><th>Status XML</th><th>Acțiune</th>
    </tr></thead>
    <tbody>
      ${data.map(f => `
        <tr>
          <td>${f.serie}${f.numar}</td>
          <td>${f.data}</td>
          <td>${f.client}</td>
          <td>${formatBani(f.suma_bani)}</td>
          <td>Nedescărcat</td>
          <td><button class="btn btn-secondary btn-sm" onclick="genereazaXMLSiDescarca('${f.id}')">Generează XML</button></td>
        </tr>
      `).join('')}
    </tbody>`;
}
