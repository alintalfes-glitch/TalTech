// Inițializare Supabase și gestionare autentificare
let supabase = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  supabase = window.supabase.createClient(
    CONFIG_FISCAL.SUPABASE_URL,
    CONFIG_FISCAL.SUPABASE_ANON_KEY
  );

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    showLoginScreen();
  } else {
    currentUser = session.user;
    await startApp();
  }

  // Ascultă schimbările de autentificare
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      currentUser = session.user;
      startApp();
    } else {
      showLoginScreen();
    }
  });

  // Formular login
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const errDiv = document.getElementById('login-error');
      errDiv.style.display = 'block';
      errDiv.textContent = 'Autentificare eșuată: ' + error.message;
    } else {
      document.getElementById('login-error').style.display = 'none';
      currentUser = data.user;
      await startApp();
    }
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
  });
});

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

async function startApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-email').textContent = currentUser.email;

  // Inițializează modulele
  initNavigation();
  initInactivityTimer();
  initHeartbeat();
  initDashboard();
  initFacturi();
  initCheltuieli();
  initRegistru();
  initExtrase();
  initContracte();
  initDeclaratie();
  initDocumente();
  initSecretariat();
  initEfactura();
}

function initInactivityTimer() {
  let timeout;
  const resetTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      await supabase.auth.signOut();
    }, CONFIG_FISCAL.TIMEOUT_AUTOLOGOUT_MIN * 60 * 1000);
  };
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, resetTimer)
  );
  resetTimer();
}

function initHeartbeat() {
  const updateSync = () => {
    const now = new Date();
    document.getElementById('last-sync').textContent =
      'ultima sincronizare: ' + now.toLocaleTimeString('ro-RO');
  };
  updateSync();
  setInterval(async () => {
    // Query ușor pentru a verifica conexiunea
    const { error } = await supabase.from('facturi').select('id', { head: true, count: 'exact' });
    if (!error) updateSync();
  }, 5 * 60 * 1000);
}