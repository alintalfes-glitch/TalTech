// Parametri fiscali configurabili – verificați periodic pe site-urile oficiale
const CONFIG_FISCAL = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',

  PFA: {
    nume: 'Nume PFA',
    cui: '12345678',
    adresa: 'Adresa sediu PFA',
    telefon: '07xx xxx xxx',
    email: 'email@exemplu.ro',
    contBancar: 'RO00BANK...',
    serieFactura: 'FCT',
    mentiuneTVA: 'TVA neexigibil conform art. 399 alin. (1) din Codul fiscal',
    codCAEN: '6202'
  },

  EFACTURA: {
    termenTransmitereZileLucratoare: 5,   // OUG 89/2025
    versiuneCIUS: '1.0.0',
    obligatiePFA: true                    // Legea 88/2026, OG 6/2026
  },

  FISCAL: {
    anCurent: new Date().getFullYear(),
    termenDeclaratieUnica: '2026-05-25',
    impozitVenit: 0.10,
    salariuMinimBrut: 3300,               // lei, verifică anual
    CAS: {
      procent: 0.25,
      salariiMinime: 12,                  // plafon minim 12 salarii
      plafonMinim: 12 * 3300,
      plafonMaxim: 24 * 3300,
      aplicabil: true
    },
    CASS: {
      procent: 0.10,
      salariiMinime: 6,
      plafonMinim: 6 * 3300,
      plafonMaxim: 60 * 3300,
      aplicabil: true
    }
  },

  TIMEOUT_AUTOLOGOUT_MIN: 30,
  BACKUP_ENCRYPTION_DEFAULT: true
};