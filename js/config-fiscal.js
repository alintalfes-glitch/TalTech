const CONFIG_FISCAL = {
  SUPABASE_URL: 'https://ngewvofbjvomqlglbjja.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_V-rL8e0Sp5gRKtnQv2WBuA_bNNAqr1x',

  PFA: {
    nume: 'Nume PFA',
    cui: '12345678',
    adresa: 'Adresa sediu PFA',
    localitate: 'Localitate',
    judet: 'Judet',
    telefon: '07xx xxx xxx',
    email: 'email@exemplu.ro',
    contBancar: 'RO00BANK...',
    serieFactura: 'FCT',
    mentiuneTVA: 'TVA neexigibil conform art. 399 alin. (1) din Codul fiscal',
    codCAEN: '6202'
  },

  EFACTURA: {
    termenTransmitereZileLucratoare: 5,
    versiuneCIUS: '1.0.0',
    obligatiePFA: true
  },

  FISCAL: {
    anCurent: new Date().getFullYear(),
    termenDeclaratieUnica: '2026-05-25',
    impozitVenit: 0.10,
    salariuMinimBrut: 3300,
    CAS: {
      procent: 0.25,
      plafonMinim: 12 * 3300,
      plafonMaxim: 24 * 3300,
      aplicabil: true
    },
    CASS: {
      procent: 0.10,
      plafonMinim: 6 * 3300,
      plafonMaxim: 60 * 3300,
      aplicabil: true
    }
  },

  TIMEOUT_AUTOLOGOUT_MIN: 30,
  BACKUP_ENCRYPTION_DEFAULT: true
};
