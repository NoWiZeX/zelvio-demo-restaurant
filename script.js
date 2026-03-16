/* ============================================================
   LE MAS PROVENÇAL — MAIN SCRIPT
   ============================================================ */

/* ---------- SUPABASE CONFIG ---------- */
const SUPABASE_URL = 'https://mknqupbuniryqjasekhc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GRFV5w5CBnKu78dIKhXWkQ_kTOzxZXt';

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    if (typeof window.supabase !== 'undefined') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
  }
  return supabaseClient;
}

/* ============================================================
   NAVBAR
   ============================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (!navbar) return;

  // Scroll handling (transparent → white)
  function handleScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      if (!navbar.classList.contains('scrolled') || navbar.dataset.forceScrolled) return;
      navbar.classList.remove('scrolled');
    }
  }

  // Pages with transparent hero
  const isHomePage = document.body.querySelector('.hero') !== null;
  if (!isHomePage) {
    navbar.classList.add('scrolled');
  } else {
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Mobile toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Close on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }
})();

/* ============================================================
   SCROLL REVEAL ANIMATION
   ============================================================ */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();

/* ============================================================
   MENU PAGE — TABS
   ============================================================ */
(function initMenuTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Scroll to target section
      const targetId = tab.dataset.tab;
      const target = document.getElementById(targetId);
      if (target) {
        const navHeight = document.getElementById('navbar')?.offsetHeight || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Highlight active tab on scroll
  const sections = ['entrees', 'plats', 'desserts', 'vins'];
  const navHeight = document.getElementById('navbar')?.offsetHeight || 80;

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= navHeight + 80) {
        current = id;
      }
    });
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === current);
    });
  }, { passive: true });
})();

/* ============================================================
   RESERVATION FORM
   ============================================================ */
(function initReservationForm() {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  // Set min date to today
  const dateInput = document.getElementById('date_reservation');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  // Couverts counter
  const couvertsInput = document.getElementById('couverts');
  const couvertsDown = document.getElementById('couvertsDown');
  const couvertsUp = document.getElementById('couvertsUp');

  if (couvertsInput && couvertsDown && couvertsUp) {
    couvertsDown.addEventListener('click', () => {
      const val = parseInt(couvertsInput.value) || 1;
      if (val > 1) couvertsInput.value = val - 1;
    });
    couvertsUp.addEventListener('click', () => {
      const val = parseInt(couvertsInput.value) || 1;
      if (val < 12) couvertsInput.value = val + 1;
    });
  }

  // Validation
  function validateField(id, value, rules) {
    const errorEl = document.getElementById(`${id}-error`) || document.getElementById(`${id.replace('_reservation','')}-error`);
    const inputEl = document.getElementById(id);
    let error = '';

    if (rules.required && !value.trim()) {
      error = 'Ce champ est requis.';
    } else if (rules.minLength && value.trim().length < rules.minLength) {
      error = `Minimum ${rules.minLength} caractères.`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.patternMsg || 'Format invalide.';
    }

    if (errorEl) errorEl.textContent = error;
    if (inputEl) inputEl.classList.toggle('invalid', !!error);
    return !error;
  }

  function validateForm() {
    const prenom = document.getElementById('prenom')?.value || '';
    const nom = document.getElementById('nom')?.value || '';
    const telephone = document.getElementById('telephone')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const date = document.getElementById('date_reservation')?.value || '';
    const heure = document.getElementById('heure')?.value || '';
    const consent = document.getElementById('consent');

    let valid = true;
    valid = validateField('prenom', prenom, { required: true, minLength: 2 }) && valid;
    valid = validateField('nom', nom, { required: true, minLength: 2 }) && valid;
    valid = validateField('telephone', telephone, {
      required: true,
      pattern: /^[\d\s\+\-\(\)\.]{8,}$/,
      patternMsg: 'Numéro de téléphone invalide.'
    }) && valid;
    valid = validateField('email', email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMsg: 'Adresse e-mail invalide.'
    }) && valid;
    valid = validateField('date_reservation', date, { required: true }) && valid;
    valid = validateField('heure', heure, { required: true }) && valid;

    // Consent
    const consentError = document.getElementById('consent-error');
    if (consent && !consent.checked) {
      if (consentError) consentError.textContent = 'Vous devez accepter pour continuer.';
      valid = false;
    } else if (consentError) {
      consentError.textContent = '';
    }

    return valid;
  }

  // Live validation on blur
  ['prenom', 'nom', 'telephone', 'email', 'date_reservation', 'heure'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('blur', () => {
        const rules = id === 'email'
          ? { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Adresse e-mail invalide.' }
          : id === 'telephone'
          ? { required: true, pattern: /^[\d\s\+\-\(\)\.]{8,}$/, patternMsg: 'Numéro de téléphone invalide.' }
          : { required: true, minLength: id === 'prenom' || id === 'nom' ? 2 : 1 };
        validateField(id, el.value, rules);
      });
    }
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoader = document.getElementById('submitLoader');
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');

    // Loading state
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline-block';
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    const data = {
      prenom: document.getElementById('prenom').value.trim(),
      nom: document.getElementById('nom').value.trim(),
      telephone: document.getElementById('telephone').value.trim(),
      email: document.getElementById('email').value.trim(),
      date_reservation: document.getElementById('date_reservation').value,
      heure: document.getElementById('heure').value,
      couverts: parseInt(document.getElementById('couverts').value),
      message: document.getElementById('message')?.value.trim() || '',
      statut: 'en attente'
    };

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase non configuré');

      const { error } = await sb.from('reservations').insert([data]);
      if (error) throw error;

      // Success
      successMsg.style.display = 'flex';
      form.reset();
      couvertsInput.value = 2;
      form.style.display = 'none';

      // Scroll to success
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error('Erreur réservation:', err);
      errorMsg.style.display = 'flex';
      errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      submitBtn.disabled = false;
      submitText.style.display = 'inline';
      submitLoader.style.display = 'none';
    }
  });
})();

/* ============================================================
   CONTACT FORM (simulation)
   ============================================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  function validateContactField(id, value, rules) {
    const errorEl = document.getElementById(`contact-${id}-error`);
    const inputEl = document.getElementById(`contact-${id}`);
    let error = '';

    if (rules.required && !value.trim()) {
      error = 'Ce champ est requis.';
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.patternMsg || 'Format invalide.';
    } else if (rules.minLength && value.trim().length < rules.minLength) {
      error = `Minimum ${rules.minLength} caractères.`;
    }

    if (errorEl) errorEl.textContent = error;
    if (inputEl) inputEl.classList.toggle('invalid', !!error);
    return !error;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prenom = document.getElementById('contact-prenom')?.value || '';
    const nom = document.getElementById('contact-nom')?.value || '';
    const email = document.getElementById('contact-email')?.value || '';
    const sujet = document.getElementById('contact-sujet')?.value || '';
    const message = document.getElementById('contact-message')?.value || '';

    let valid = true;
    valid = validateContactField('prenom', prenom, { required: true }) && valid;
    valid = validateContactField('nom', nom, { required: true }) && valid;
    valid = validateContactField('email', email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMsg: 'E-mail invalide.'
    }) && valid;
    valid = validateContactField('sujet', sujet, { required: true }) && valid;
    valid = validateContactField('message', message, { required: true, minLength: 10 }) && valid;

    if (!valid) return;

    const submitBtn = document.getElementById('contactSubmitBtn');
    const submitText = document.getElementById('contactSubmitText');
    const submitLoader = document.getElementById('contactSubmitLoader');
    const successMsg = document.getElementById('contactSuccess');

    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline-block';

    // Simulate async send (demo)
    await new Promise(resolve => setTimeout(resolve, 1200));

    successMsg.style.display = 'flex';
    form.reset();
    form.style.display = 'none';
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    submitBtn.disabled = false;
    submitText.style.display = 'inline';
    submitLoader.style.display = 'none';
  });
})();

/* ============================================================
   ADMIN PANEL
   ============================================================ */
(function initAdmin() {
  const loginScreen = document.getElementById('loginScreen');
  const adminInterface = document.getElementById('adminInterface');
  if (!loginScreen || !adminInterface) return;

  const ADMIN_PASSWORD = 'zelvio2024';
  const SESSION_KEY = 'mas_admin_logged';

  // Check existing session
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    showAdmin();
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = document.getElementById('loginPassword')?.value;
      const errorEl = document.getElementById('loginError');

      if (pwd === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        errorEl.style.display = 'none';
        showAdmin();
      } else {
        errorEl.style.display = 'flex';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      loginScreen.style.display = 'flex';
      adminInterface.style.display = 'none';
    });
  }

  // Filters
  const filterStatut = document.getElementById('filterStatut');
  const filterDate = document.getElementById('filterDate');
  const refreshBtn = document.getElementById('refreshBtn');
  const retryBtn = document.getElementById('retryBtn');

  if (filterStatut) filterStatut.addEventListener('change', loadReservations);
  if (filterDate) filterDate.addEventListener('change', loadReservations);
  if (refreshBtn) refreshBtn.addEventListener('click', loadReservations);
  if (retryBtn) retryBtn.addEventListener('click', loadReservations);

  function showAdmin() {
    loginScreen.style.display = 'none';
    adminInterface.style.display = 'block';
    loadReservations();
  }

  async function loadReservations() {
    const loading = document.getElementById('adminLoading');
    const tableWrapper = document.getElementById('adminTableWrapper');
    const errorEl = document.getElementById('adminError');
    const noResults = document.getElementById('noResults');
    const tbody = document.getElementById('reservationsBody');

    loading.style.display = 'block';
    tableWrapper.style.display = 'none';
    errorEl.style.display = 'none';

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase non configuré');

      let query = sb
        .from('reservations')
        .select('*')
        .order('date_reservation', { ascending: true })
        .order('heure', { ascending: true });

      const statut = filterStatut?.value;
      if (statut) query = query.eq('statut', statut);

      const dateFilter = filterDate?.value;
      if (dateFilter) query = query.eq('date_reservation', dateFilter);

      const { data, error } = await query;
      if (error) throw error;

      loading.style.display = 'none';
      tableWrapper.style.display = 'block';

      updateStats(data || []);
      renderTable(data || [], tbody, noResults);

    } catch (err) {
      console.error('Erreur chargement réservations:', err);
      loading.style.display = 'none';
      errorEl.style.display = 'block';
    }
  }

  function updateStats(reservations) {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = reservations.filter(r => r.date_reservation === today).length;
    const pendingCount = reservations.filter(r => r.statut === 'en attente').length;
    const confirmedCount = reservations.filter(r => r.statut === 'confirmée').length;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('statToday', todayCount);
    set('statPending', pendingCount);
    set('statConfirmed', confirmedCount);
    set('statTotal', reservations.length);
  }

  function renderTable(reservations, tbody, noResults) {
    if (!tbody) return;

    if (!reservations.length) {
      tbody.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';

    tbody.innerHTML = reservations.map(r => {
      const dateFormatted = formatDate(r.date_reservation);
      const statusClass = r.statut === 'confirmée' ? 'confirmed'
        : r.statut === 'annulée' ? 'cancelled'
        : 'pending';
      const statusLabel = r.statut || 'en attente';

      const canConfirm = r.statut !== 'confirmée';
      const canCancel = r.statut !== 'annulée';

      return `
        <tr>
          <td><strong>${dateFormatted}</strong></td>
          <td>${formatHeure(r.heure)}</td>
          <td>
            <div><strong>${escapeHtml(r.prenom)} ${escapeHtml(r.nom)}</strong></div>
            <div style="font-size:0.8rem;color:#9CA3AF;">${escapeHtml(r.email || '')}</div>
          </td>
          <td><strong>${r.couverts}</strong> pers.</td>
          <td>${escapeHtml(r.telephone || '')}</td>
          <td class="td-message" title="${escapeHtml(r.message || '')}">${escapeHtml(r.message || '—')}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td>
            <button
              class="action-btn confirm"
              onclick="updateStatus(${r.id}, 'confirmée')"
              ${canConfirm ? '' : 'disabled'}>
              ✓ Confirmer
            </button>
            <button
              class="action-btn cancel"
              onclick="updateStatus(${r.id}, 'annulée')"
              ${canCancel ? '' : 'disabled'}>
              ✕ Annuler
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Expose globally for onclick handlers
  window.updateStatus = async function(id, newStatus) {
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase non configuré');

      const { error } = await sb
        .from('reservations')
        .update({ statut: newStatus })
        .eq('id', id);

      if (error) throw error;
      await loadReservations();
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      alert('Erreur lors de la mise à jour du statut.');
    }
  };

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatHeure(heureStr) {
    if (!heureStr) return '—';
    return heureStr.substring(0, 5).replace(':', 'h');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
