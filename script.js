/* ============================================================
   LE MAS PROVENÇAL — MAIN SCRIPT
   ============================================================ */

/* ---------- SUPABASE CONFIG ---------- */
const SUPABASE_URL = 'https://mknqupbuniryqjasekhc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GRFV5w5CBnKu78dIKhXWkQ_kTOzxZXt';

/* ---------- EMAILJS CONFIG ----------
   Pour activer les emails de confirmation/annulation :
   1. Compte gratuit sur https://www.emailjs.com
   2. Service ID  → votre service email (Gmail, Outlook…)
   3. Template de confirmation  → variables : {{prenom}}, {{nom}}, {{date}}, {{heure}}, {{couverts}}, {{message}}
   4. Template d'annulation     → variables : {{prenom}}, {{nom}}, {{date}}, {{heure}}
   5. Public Key → Account > API Keys
   Laissez vide pour désactiver.
   ---------------------------------------------------------------- */
const EMAILJS_PUBLIC_KEY       = 'lMfhOxP-5VR4eHcJx';
const EMAILJS_SERVICE_ID       = 'service_lyda6hd';
const EMAILJS_CONFIRM_TEMPLATE  = 'template_b44wl9p';   // envoyé au client à la réservation
const EMAILJS_CANCEL_TEMPLATE   = 'template_v0xchc5';   // envoyé au client lors de l'annulation admin
const EMAILJS_REMINDER_TEMPLATE = '';                    // rappel J-1 : {to_email, prenom, nom, date, heure, couverts, manage_url, phone}
const EMAILJS_REVIEW_TEMPLATE   = '';                    // avis post-repas : {to_email, prenom, nom, date, review_url, phone}
const GOOGLE_REVIEW_URL         = '';                    // URL page Google Avis du restaurant

/* ---------- SUPABASE CLIENT ---------- */
let _sb = null;
function getSupabase() {
  if (!_sb && typeof window.supabase !== 'undefined') {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return _sb;
}

/* ============================================================
   NAVBAR
   ============================================================ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  if (!navbar) return;

  const isHome = !!document.querySelector('.hero');
  if (isHome) {
    const onScroll = () => {
      if (window.scrollY > 80) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('click', e => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }
})();

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
})();

/* ============================================================
   MENU PAGE — TABS
   ============================================================ */
(function initMenuTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) {
        const offset = (document.getElementById('navbar')?.offsetHeight || 80) + 20;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
      }
    });
  });
  const ids = ['entrees','plats','desserts','vins'];
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar')?.offsetHeight || 80;
    let current = '';
    ids.forEach(id => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= nav + 80) current = id; });
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === current));
  }, { passive: true });
})();

/* ============================================================
   RESERVATION FORM
   ============================================================ */
(function initReservationForm() {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  /* Date picker — gestion assurée par le custom datepicker (voir initDatepicker) */
  const dateInput = document.getElementById('date_reservation');

  /* Time slots */
  const heureInput = document.getElementById('heure');
  document.querySelectorAll('.time-slot').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (heureInput) heureInput.value = btn.dataset.time;
      clearErr('heure');
    });
  });

  /* Couverts counter */
  const couvertsInput = document.getElementById('couverts');
  const couvertsLabel = document.getElementById('couvertsLabel');
  const updateLabel = () => {
    if (couvertsLabel) couvertsLabel.textContent = parseInt(couvertsInput.value) <= 1 ? 'personne' : 'personnes';
  };
  document.getElementById('couvertsDown')?.addEventListener('click', () => {
    const v = parseInt(couvertsInput.value) || 2;
    if (v > 1) { couvertsInput.value = v - 1; updateLabel(); }
  });
  document.getElementById('couvertsUp')?.addEventListener('click', () => {
    const v = parseInt(couvertsInput.value) || 2;
    if (v < 12) { couvertsInput.value = v + 1; updateLabel(); }
  });

  /* Helpers */
  function setErr(id, msg) { const e = document.getElementById(id + '-error'); if (e) e.textContent = msg; }
  function clearErr(id)    { const e = document.getElementById(id + '-error'); if (e) e.textContent = ''; }
  function setInvalid(inputId, msg) {
    const inp = document.getElementById(inputId);
    const err = document.getElementById(inputId.replace('_reservation','') + '-error');
    if (inp) inp.classList.add('invalid');
    if (err) err.textContent = msg;
  }
  function clearInvalid(inputId) {
    const inp = document.getElementById(inputId);
    const err = document.getElementById(inputId.replace('_reservation','') + '-error');
    if (inp) inp.classList.remove('invalid');
    if (err) err.textContent = '';
  }

  /* Live blur validation */
  [
    { id: 'prenom',    test: v => v.trim().length >= 2, msg: 'Minimum 2 caractères.' },
    { id: 'nom',       test: v => v.trim().length >= 2, msg: 'Minimum 2 caractères.' },
    { id: 'telephone', test: v => /^[\d\s\+\-\(\)\.]{8,}$/.test(v.trim()), msg: 'Numéro invalide.' },
    { id: 'email',     test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'E-mail invalide.' },
  ].forEach(({ id, test, msg }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur',  () => { if (!test(el.value)) setInvalid(id, msg); else clearInvalid(id); });
    el.addEventListener('input', () => { if (el.classList.contains('invalid') && test(el.value)) clearInvalid(id); });
  });

  /* Full validation */
  function validateAll() {
    let ok = true;
    const check = (id, test, msg) => {
      const el = document.getElementById(id); const val = el?.value || '';
      if (!test(val)) { setInvalid(id, msg); ok = false; } else clearInvalid(id);
    };
    check('prenom',    v => v.trim().length >= 2, 'Prénom requis.');
    check('nom',       v => v.trim().length >= 2, 'Nom requis.');
    check('telephone', v => /^[\d\s\+\-\(\)\.]{8,}$/.test(v.trim()), 'Téléphone invalide.');
    check('email',     v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), 'E-mail invalide.');
    check('date_reservation', v => !!v, 'Veuillez choisir une date.');
    if (dateInput?.value) {
      if (new Date(dateInput.value + 'T12:00:00').getDay() === 1) {
        setInvalid('date_reservation', 'Fermé le lundi.'); ok = false;
      }
    }
    if (!heureInput?.value) {
      setErr('heure', 'Veuillez choisir un créneau horaire.'); ok = false;
    } else clearErr('heure');
    return ok;
  }

  /* Email : confirmation à la réservation */
  async function sendConfirmationEmail(data, token) {
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_CONFIRM_TEMPLATE) return false;
    try {
      if (typeof emailjs === 'undefined') return false;
      emailjs.init(EMAILJS_PUBLIC_KEY);
      const manageUrl = window.location.href.split('?')[0] + '?token=' + token;
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONFIRM_TEMPLATE, {
        to_email:   data.email,
        prenom:     data.prenom,
        nom:        data.nom,
        date:       formatDateFr(data.date_reservation),
        heure:      data.heure.replace(':', 'h'),
        couverts:   data.couverts,
        message:    data.message || '—',
        phone:      '04 90 54 32 11',
        manage_url: manageUrl,
      });
      return true;
    } catch (err) {
      console.error('Email confirmation non envoyé :', err);
      return false;
    }
  }

  /* Submit — statut = 'confirmée' directement */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateAll()) {
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const submitBtn  = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loader     = document.getElementById('submitLoader');
    const successMsg = document.getElementById('successMessage');
    const errorMsg   = document.getElementById('errorMessage');

    submitBtn.disabled = true;
    submitText.style.display = 'none';
    loader.style.display = 'inline-block';
    successMsg.style.display = 'none';
    errorMsg.style.display   = 'none';

    const editTokenEl = document.getElementById('editToken');
    const isEditMode  = !!(editTokenEl && editTokenEl.value);

    const data = {
      prenom:           document.getElementById('prenom').value.trim(),
      nom:              document.getElementById('nom').value.trim(),
      telephone:        document.getElementById('telephone').value.trim(),
      email:            document.getElementById('email').value.trim(),
      date_reservation: dateInput.value,
      heure:            heureInput.value,
      couverts:         parseInt(couvertsInput.value) || 2,
      message:          document.getElementById('message')?.value.trim() || '',
    };

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase non initialisé.');

      if (isEditMode) {
        const { error } = await sb.from('reservations').update(data).eq('token', editTokenEl.value);
        if (error) throw error;
        const st = document.getElementById('successTitle');
        const sd = document.getElementById('successDesc');
        if (st) st.textContent = 'Modifications enregistrées !';
        if (sd) sd.textContent = 'Vos modifications ont bien été prises en compte.';
      } else {
        const token = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : (Math.random().toString(36).slice(2) + Date.now().toString(36));
        const { error } = await sb.from('reservations').insert([{ ...data, statut: 'confirmée', token }]);
        if (error) throw error;
        const emailOk = await sendConfirmationEmail(data, token);
        const sd = document.getElementById('successDesc');
        if (sd && !emailOk) {
          sd.textContent = 'Votre réservation est bien enregistrée. (Email de confirmation non envoyé — vérifiez la configuration EmailJS.)';
        }
      }

      successMsg.style.display = 'flex';
      form.style.display = 'none';
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error('Erreur réservation :', err);
      errorMsg.style.display = 'flex';
      errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      submitBtn.disabled = false;
      submitText.style.display = 'inline';
      loader.style.display = 'none';
    }
  });
})();

/* ============================================================
   CONTACT FORM
   ============================================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  function validate(id, test, msg) {
    const el  = document.getElementById('contact-' + id);
    const err = document.getElementById('contact-' + id + '-error');
    const ok  = test(el?.value || '');
    if (el)  el.classList.toggle('invalid', !ok);
    if (err) err.textContent = ok ? '' : msg;
    return ok;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    valid = validate('prenom',  v => v.trim().length >= 2,     'Prénom requis.')        && valid;
    valid = validate('nom',     v => v.trim().length >= 2,     'Nom requis.')           && valid;
    valid = validate('email',   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), 'E-mail invalide.') && valid;
    valid = validate('sujet',   v => !!v,                      'Choisissez un sujet.')  && valid;
    valid = validate('message', v => v.trim().length >= 10,    'Message trop court.')   && valid;
    if (!valid) return;

    const btn    = document.getElementById('contactSubmitBtn');
    const txt    = document.getElementById('contactSubmitText');
    const loader = document.getElementById('contactSubmitLoader');
    const ok     = document.getElementById('contactSuccess');

    btn.disabled = true;
    txt.style.display    = 'none';
    loader.style.display = 'inline-block';
    await new Promise(r => setTimeout(r, 900));
    ok.style.display   = 'flex';
    form.style.display = 'none';
    ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.disabled = false;
    txt.style.display    = 'inline';
    loader.style.display = 'none';
  });
})();

/* ============================================================
   ADMIN PANEL
   ============================================================ */
(function initAdmin() {
  const loginScreen    = document.getElementById('loginScreen');
  const adminInterface = document.getElementById('adminInterface');
  if (!loginScreen || !adminInterface) return;

  const ADMIN_PASSWORD = 'admin33';
  const SESSION_KEY    = 'mas_admin_v3';

  /* ── Session restore ── */
  if (sessionStorage.getItem(SESSION_KEY) === '1') showAdmin();

  /* ── Login ── */
  document.getElementById('loginForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const pwd = document.getElementById('loginPassword')?.value;
    const err = document.getElementById('loginError');
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      err.style.display = 'none';
      showAdmin();
    } else {
      err.style.display = 'flex';
      document.getElementById('loginPassword').value = '';
    }
  });

  /* ── Logout ── */
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    loginScreen.style.display    = 'flex';
    adminInterface.style.display = 'none';
  });

  /* ── Sidebar navigation ── */
  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      document.querySelectorAll('.admin-view').forEach(v => v.classList.toggle('active', v.id === 'view' + cap(view)));
      if (view === 'all')       loadAllReservations();
      if (view === 'salle')     loadSalleView();
      if (view === 'notif')     loadNotifView();
      if (view === 'qr')        loadQrView();
      if (view === 'fidelite')  loadFideliteView();
      if (view === 'attente')   loadAttenteView();
      if (view === 'menuAdmin') loadMenuAdminView();
    });
  });

  /* ── Day navigation ── */
  let viewedDate = new Date(); viewedDate.setHours(12,0,0,0);

  document.getElementById('prevDay')?.addEventListener('click', () => {
    viewedDate.setDate(viewedDate.getDate() - 1); loadTodaySection();
  });
  document.getElementById('nextDay')?.addEventListener('click', () => {
    viewedDate.setDate(viewedDate.getDate() + 1); loadTodaySection();
  });

  /* ── Refresh / filters ── */
  document.getElementById('refreshBtn')?.addEventListener('click', () => { loadTodaySection(); updateSidebarStats(); });
  document.getElementById('refreshAllBtn')?.addEventListener('click', loadAllReservations);
  document.getElementById('filterStatut')?.addEventListener('change', loadAllReservations);
  document.getElementById('filterService')?.addEventListener('change', loadAllReservations);
  // Recherche : reload après 300ms de pause de frappe
  document.getElementById('filterSearch')?.addEventListener('input', (() => {
    let t; return () => { clearTimeout(t); t = setTimeout(loadAllReservations, 300); };
  })());
  document.getElementById('rlsToggle')?.addEventListener('click', () => {
    const d = document.getElementById('rlsDetails');
    if (d) d.style.display = d.style.display === 'none' ? 'block' : 'none';
  });

  /* ── Ajout de réservation ── */
  const addModal = document.getElementById('addModal');

  document.getElementById('addReservationBtn')?.addEventListener('click', () => {
    document.getElementById('adminAddForm')?.reset();
    document.getElementById('addFormError').style.display = 'none';
    // Pré-remplir la date avec aujourd'hui
    const todayIso = toISO(new Date());
    const addDateEl = document.getElementById('addDate');
    if (addDateEl) addDateEl.value = todayIso;
    addModal.classList.add('open');
  });

  document.getElementById('addModalClose')?.addEventListener('click',  () => addModal.classList.remove('open'));
  document.getElementById('addModalCancel')?.addEventListener('click', () => addModal.classList.remove('open'));
  addModal?.addEventListener('click', e => { if (e.target === addModal) addModal.classList.remove('open'); });

  document.getElementById('addModalSubmit')?.addEventListener('click', async () => {
    const prenom    = document.getElementById('addPrenom')?.value.trim();
    const nom       = document.getElementById('addNom')?.value.trim();
    const telephone = document.getElementById('addTelephone')?.value.trim();
    const email     = document.getElementById('addEmail')?.value.trim() || '';
    const date      = document.getElementById('addDate')?.value;
    const heure     = document.getElementById('addHeure')?.value;
    const couverts  = parseInt(document.getElementById('addCouverts')?.value) || 2;
    const message   = document.getElementById('addMessage')?.value.trim() || '';

    const errEl  = document.getElementById('addFormError');
    const errMsg = document.getElementById('addFormErrorMsg');

    if (!prenom || !nom || !telephone || !date || !heure) {
      errMsg.textContent = 'Veuillez remplir tous les champs obligatoires.';
      errEl.style.display = 'flex';
      return;
    }

    const btn = document.getElementById('addModalSubmit');
    const txt = document.getElementById('addModalBtnText');
    const ldr = document.getElementById('addModalBtnLoader');
    btn.disabled = true; txt.style.display = 'none'; ldr.style.display = 'inline-block';
    errEl.style.display = 'none';

    try {
      const sb = getSupabase();
      const token = (crypto.randomUUID?.()) || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      const { error } = await sb.from('reservations').insert([{
        prenom, nom, telephone, email,
        date_reservation: date, heure, couverts, message,
        statut: 'confirmée', token
      }]);
      if (error) throw error;
      addModal.classList.remove('open');
      await Promise.all([loadTodaySection(), updateSidebarStats()]);
      if (document.getElementById('viewAll')?.classList.contains('active')) loadAllReservations();
    } catch (err) {
      console.error('Erreur ajout réservation :', err);
      errMsg.textContent = 'Erreur lors de l\'ajout. Vérifiez les données ou la connexion.';
      errEl.style.display = 'flex';
    } finally {
      btn.disabled = false; txt.style.display = 'inline'; ldr.style.display = 'none';
    }
  });

  /* ── Event delegation — cancel buttons ── */
  ['todayBody', 'allBody'].forEach(tbodyId => {
    document.getElementById(tbodyId)?.addEventListener('click', e => {
      const btn = e.target.closest('.btn-cancel-icon');
      if (!btn) return;
      openCancelModal({
        id:    parseInt(btn.dataset.id),
        prenom: btn.dataset.prenom,
        nom:    btn.dataset.nom,
        email:  btn.dataset.email,
        date:   btn.dataset.date,
        heure:  btn.dataset.heure,
        couverts: btn.dataset.couverts,
      });
    });
  });

  /* ── Cancel modal ── */
  let pendingCancel = null;

  function openCancelModal(row) {
    pendingCancel = row;
    const modal = document.getElementById('cancelModal');
    document.getElementById('modalClientInfo').textContent =
      `${row.prenom} ${row.nom} — ${formatDateFr(row.date)} à ${(row.heure||'').substring(0,5).replace(':','h')} (${row.couverts} pers.)`;

    const emailOk = !!(EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_CANCEL_TEMPLATE);
    document.getElementById('modalEmailNotice').style.display = emailOk ? 'block' : 'none';
    document.getElementById('modalEmailOff').style.display    = emailOk ? 'none'  : 'block';
    if (emailOk) document.getElementById('modalEmail').textContent = row.email;

    modal.classList.add('open');
  }

  function closeModal() {
    document.getElementById('cancelModal')?.classList.remove('open');
    pendingCancel = null;
    const btn = document.getElementById('modalConfirmCancel');
    const txt = document.getElementById('modalBtnText');
    const ldr = document.getElementById('modalBtnLoader');
    if (btn) btn.disabled = false;
    if (txt) txt.style.display = 'inline';
    if (ldr) ldr.style.display = 'none';
  }

  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalCancelClose')?.addEventListener('click', closeModal);
  document.getElementById('cancelModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('cancelModal')) closeModal();
  });

  document.getElementById('modalConfirmCancel')?.addEventListener('click', async () => {
    if (!pendingCancel) return;
    const btn = document.getElementById('modalConfirmCancel');
    const txt = document.getElementById('modalBtnText');
    const ldr = document.getElementById('modalBtnLoader');
    btn.disabled = true;
    txt.style.display = 'none';
    ldr.style.display = 'inline-block';

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase non initialisé');

      // Suppression immédiate de la ligne — avant l'appel réseau pour fluidité
      const cancelledId = pendingCancel.id;
      const savedCancel = { ...pendingCancel };
      ['todayBody', 'allBody'].forEach(tbodyId => {
        document.getElementById(tbodyId)
          ?.querySelector(`[data-id="${cancelledId}"]`)
          ?.closest('tr')?.remove();
      });
      closeModal();

      // Mise à jour en base (non bloquante pour l'UI)
      sb.from('reservations')
        .update({ statut: 'annulée' })
        .eq('id', cancelledId)
        .then(({ error }) => {
          if (error) console.error('Erreur update Supabase :', error);
        });

      // Email d'annulation
      sendCancelEmail(savedCancel);

      // Rafraîchir uniquement les stats (pas la table — sinon la ligne revient)
      showRlsNotice(false);
      updateSidebarStats();

    } catch (err) {
      // Uniquement si Supabase n'est pas initialisé (la ligne n'a pas encore été supprimée)
      console.error('Erreur annulation :', err);
      closeModal();
    }
  });

  /* ── Email annulation au client ── */
  async function sendCancelEmail(row) {
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_CANCEL_TEMPLATE) return;
    try {
      if (typeof emailjs === 'undefined') return;
      emailjs.init(EMAILJS_PUBLIC_KEY);
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CANCEL_TEMPLATE, {
        to_email: row.email,
        prenom:   row.prenom,
        nom:      row.nom,
        date:     formatDateFr(row.date),
        heure:    (row.heure || '').substring(0,5).replace(':','h'),
        phone:    '04 90 54 32 11',
      });
    } catch (err) { console.warn('Email annulation non envoyé :', err); }
  }

  /* ══════════════════════════════════════════
     SHOW ADMIN
  ══════════════════════════════════════════ */
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  function showAdmin() {
    loginScreen.style.display    = 'none';
    adminInterface.style.display = 'block';

    // Header date
    const d = document.getElementById('adminHeaderDate');
    if (d) d.textContent = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    // Petit délai pour laisser le client Supabase finir son init au premier chargement
    setTimeout(() => { loadTodaySection(); updateSidebarStats(); }, 80);

    // Supabase Realtime — nouvelles réservations
    const sb = getSupabase();
    if (sb) {
      let bellCount = 0;
      sb.channel('new-reservations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
          const r = payload.new;
          bellCount++;
          const badge = document.getElementById('notifBellBadge');
          if (badge) { badge.textContent = bellCount; badge.style.display = 'inline-flex'; }
          showToast(`🔔 Nouvelle réservation — ${r.prenom} ${r.nom}, ${r.couverts} pers. le ${formatDateFr(r.date_reservation)} à ${(r.heure||'').substring(0,5).replace(':','h')}`);
          updateSidebarStats();
          const todayISO = toISO(new Date());
          if (r.date_reservation === todayISO) loadTodaySection();
        })
        .subscribe();

      // Click bell → clear badge + naviguer vers aujourd'hui
      document.getElementById('notifBell')?.addEventListener('click', () => {
        bellCount = 0;
        const badge = document.getElementById('notifBellBadge');
        if (badge) badge.style.display = 'none';
        document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-view="today"]')?.classList.add('active');
        document.querySelectorAll('.admin-view').forEach(v => v.classList.toggle('active', v.id === 'viewToday'));
        loadTodaySection();
      });
    }
  }

  /* ══════════════════════════════════════════
     TODAY SECTION
  ══════════════════════════════════════════ */
  async function loadTodaySection(_retry = false) {
    const dateStr   = toISO(viewedDate);
    const isToday   = toISO(new Date()) === dateStr;
    const titleEl   = document.getElementById('todayTitle');
    const labelEl   = document.getElementById('todayDateLabel');
    const loading   = document.getElementById('todayLoading');
    const empty     = document.getElementById('todayEmpty');
    const wrapper   = document.getElementById('todayTableWrapper');
    const summary   = document.getElementById('todaySummary');
    const tbody     = document.getElementById('todayBody');

    if (titleEl) titleEl.textContent = isToday ? 'Aujourd\'hui' : 'Réservations';
    if (labelEl) labelEl.textContent = viewedDate.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    loading.style.display  = 'flex';
    empty.style.display    = 'none';
    wrapper.style.display  = 'none';
    summary.style.display  = 'none';

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');

      const { data, error } = await sb
        .from('reservations')
        .select('*')
        .eq('date_reservation', dateStr)
        .neq('statut', 'annulée')
        .order('heure', { ascending: true });

      if (error) throw error;

      loading.style.display = 'none';
      const rows = data || [];

      if (!rows.length) { empty.style.display = 'flex'; return; }

      // Summary chips
      const lunch   = rows.filter(r => r.heure < '15:00');
      const dinner  = rows.filter(r => r.heure >= '15:00');
      const couverts = rows.reduce((s, r) => s + (r.couverts || 0), 0);
      setVal('chipTotal',    rows.length);
      setVal('chipCouverts', couverts);
      setVal('chipLunch',    lunch.length);
      setVal('chipDinner',   dinner.length);
      summary.style.display = 'flex';

      // Table
      tbody.innerHTML = rows.map(r => buildRow(r, false)).join('');
      wrapper.style.display = 'block';

    } catch (err) {
      if (!_retry) {
        // Première tentative échouée → on réessaie après 600ms
        setTimeout(() => loadTodaySection(true), 600);
        return;
      }
      console.error('Erreur chargement jour :', err);
      loading.style.display = 'none';
      empty.style.display   = 'flex';
      const p = empty.querySelector('p');
      if (p) p.textContent = 'Erreur de chargement.';
    }
  }

  /* ══════════════════════════════════════════
     ALL RESERVATIONS + CALENDRIER FILTRE ADMIN
  ══════════════════════════════════════════ */
  let _adminFilterDate = ''; // ISO date sélectionnée dans le calendrier admin

  // Calendrier admin (sans restriction passé/lundi)
  (function initAdminDatepicker() {
    const wrapper   = document.getElementById('adminDpWrapper');
    if (!wrapper) return;
    const trigger  = document.getElementById('adminDpTrigger');
    const display  = document.getElementById('adminDpDisplay');
    const clearBtn = document.getElementById('adminDpClear');
    const dropdown = document.getElementById('adminDpDropdown');
    const MONTHS   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    let cur = new Date(); cur.setDate(1); cur.setHours(0,0,0,0);

    function renderCal() {
      const y = cur.getFullYear(), m = cur.getMonth();
      document.getElementById('adminDpMonthYear').textContent = `${MONTHS[m]} ${y}`;
      const grid = document.getElementById('adminDpDays');
      grid.innerHTML = '';
      const startDow = (new Date(y, m, 1).getDay() + 6) % 7;
      for (let i = 0; i < startDow; i++) {
        const e = document.createElement('div'); e.className = 'dp-day dp-empty'; grid.appendChild(e);
      }
      const dim = new Date(y, m + 1, 0).getDate();
      const todayISO = toISO(new Date());
      for (let d = 1; d <= dim; d++) {
        const date = new Date(y, m, d);
        const iso  = toISO(date);
        const btn  = document.createElement('button');
        btn.type = 'button'; btn.className = 'dp-day'; btn.textContent = d;
        if (iso === todayISO) btn.classList.add('dp-today');
        if (iso === _adminFilterDate) btn.classList.add('dp-selected');
        btn.addEventListener('click', () => {
          _adminFilterDate = iso;
          display.textContent = date.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
          trigger.classList.add('has-value');
          clearBtn.style.display = 'inline-flex';
          closeCalendar();
          loadAllReservations();
        });
        grid.appendChild(btn);
      }
    }

    function openCalendar()  { dropdown.classList.add('open'); renderCal(); }
    function closeCalendar() { dropdown.classList.remove('open'); }

    trigger.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.contains('open') ? closeCalendar() : openCalendar(); });
    clearBtn?.addEventListener('click', e => {
      e.stopPropagation();
      _adminFilterDate = '';
      display.textContent = 'Toutes les dates';
      trigger.classList.remove('has-value');
      clearBtn.style.display = 'none';
      loadAllReservations();
    });
    document.getElementById('adminDpPrev')?.addEventListener('click', e => { e.stopPropagation(); cur.setMonth(cur.getMonth() - 1); renderCal(); });
    document.getElementById('adminDpNext')?.addEventListener('click', e => { e.stopPropagation(); cur.setMonth(cur.getMonth() + 1); renderCal(); });
    document.addEventListener('click', e => { if (!wrapper.contains(e.target)) closeCalendar(); });
  })();

  async function loadAllReservations() {
    const loading = document.getElementById('allLoading');
    const wrapper = document.getElementById('allTableWrapper');
    const empty   = document.getElementById('allEmpty');
    const tbody   = document.getElementById('allBody');

    loading.style.display = 'flex';
    wrapper.style.display = 'none';
    empty.style.display   = 'none';

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');

      let q = sb.from('reservations').select('*')
        .order('date_reservation', { ascending: false })
        .order('heure', { ascending: true });

      const statut = document.getElementById('filterStatut')?.value;
      if (statut) q = q.eq('statut', statut);
      if (_adminFilterDate) q = q.eq('date_reservation', _adminFilterDate);

      const { data, error } = await q;
      if (error) throw error;

      loading.style.display = 'none';
      let rows = data || [];

      // Filtres côté client
      const search  = (document.getElementById('filterSearch')?.value || '').trim().toLowerCase();
      const service = document.getElementById('filterService')?.value || '';

      if (search) {
        rows = rows.filter(r => {
          const prenom = (r.prenom || '').toLowerCase();
          const nom    = (r.nom    || '').toLowerCase();
          return prenom.includes(search) ||
                 nom.includes(search) ||
                 `${prenom} ${nom}`.includes(search) ||
                 `${nom} ${prenom}`.includes(search) ||
                 (r.telephone || '').replace(/\s/g,'').includes(search.replace(/\s/g,'')) ||
                 (r.email || '').toLowerCase().includes(search);
        });
      }
      if (service === 'dejeuner') rows = rows.filter(r => (r.heure || '') < '15:00');
      if (service === 'diner')    rows = rows.filter(r => (r.heure || '') >= '15:00');

      if (!rows.length) { empty.style.display = 'flex'; return; }

      tbody.innerHTML = rows.map(r => buildRow(r, true)).join('');
      wrapper.style.display = 'block';

    } catch (err) {
      console.error('Erreur chargement réservations :', err);
      loading.style.display = 'none';
      empty.style.display   = 'flex';
    }
  }

  /* ══════════════════════════════════════════
     SIDEBAR STATS
  ══════════════════════════════════════════ */
  async function updateSidebarStats() {
    try {
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.from('reservations').select('*');
      if (!data) return;
      const today = toISO(new Date());
      const todayRows = data.filter(r => r.date_reservation === today);
      setVal('sidebarToday',     todayRows.length);
      setVal('sidebarCouverts',  todayRows.reduce((s,r) => s + (r.couverts||0), 0));
      setVal('sidebarTotal',     data.length);
      setVal('sidebarCancelled', data.filter(r => r.statut === 'annulée').length);
    } catch (_) { /* silencieux */ }
  }

  /* ══════════════════════════════════════════
     BUILD TABLE ROW
  ══════════════════════════════════════════ */
  function buildRow(r, showDate) {
    const h         = (r.heure || '').substring(0,5);
    const hLabel    = h.replace(':','h');
    const isCancelled = r.statut === 'annulée';
    const sc        = isCancelled ? 'cancelled' : 'confirmed';
    const label     = isCancelled ? 'Annulée' : 'Confirmée';
    const dateCol   = showDate ? `<td>${formatDateFr(r.date_reservation)}</td>` : '';

    return `
      <tr class="${isCancelled ? 'row-cancelled' : ''}">
        ${dateCol}
        <td><strong>${hLabel}</strong></td>
        <td>
          <div class="td-name">${esc(r.prenom)} ${esc(r.nom)}</div>
          <div class="td-email">${esc(r.email || '')}</div>
        </td>
        <td>${r.couverts} pers.</td>
        <td>${esc(r.telephone || '')}</td>
        <td class="td-note" title="${esc(r.message || '')}">${esc(r.message || '—')}</td>
        <td><span class="status-badge ${sc}">${label}</span></td>
        <td>
          <button class="btn-cancel-icon" title="Annuler cette réservation"
            data-id="${r.id}"
            data-prenom="${esc(r.prenom)}"
            data-nom="${esc(r.nom)}"
            data-email="${esc(r.email || '')}"
            data-date="${r.date_reservation}"
            data-heure="${h}"
            data-couverts="${r.couverts}"
            ${isCancelled ? 'disabled' : ''}>
            &#215;
          </button>
        </td>
      </tr>
    `;
  }

  /* ── Helpers ── */
  function showRlsNotice(show) {
    const n = document.getElementById('rlsNotice');
    if (n) n.style.display = show ? 'block' : 'none';
  }
  function toISO(d)  { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function setVal(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function cap(s)    { return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(str)  { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ══════════════════════════════════════════
     PLAN DE SALLE
  ══════════════════════════════════════════ */
  const DEFAULT_TABLES = [
    { id:'T1',  zone:'salle',    cap:2 },
    { id:'T2',  zone:'salle',    cap:2 },
    { id:'T3',  zone:'salle',    cap:4 },
    { id:'T4',  zone:'salle',    cap:4 },
    { id:'T5',  zone:'salle',    cap:4 },
    { id:'T6',  zone:'salle',    cap:6 },
    { id:'T7',  zone:'salle',    cap:8 },
    { id:'T8',  zone:'salle',    cap:4 },
    { id:'T9',  zone:'terrasse', cap:2 },
    { id:'T10', zone:'terrasse', cap:2 },
    { id:'T11', zone:'terrasse', cap:4 },
    { id:'T12', zone:'terrasse', cap:4 },
  ];
  let TABLES = (() => {
    try { const r = localStorage.getItem('salle_config_tables'); if (r) return JSON.parse(r); } catch {}
    return DEFAULT_TABLES.map(t => ({...t}));
  })();
  function saveTablesConfig() { localStorage.setItem('salle_config_tables', JSON.stringify(TABLES)); }

  let ZONES = (() => {
    try { const r = localStorage.getItem('salle_config_zones'); if (r) return JSON.parse(r); } catch {}
    return [...new Set(DEFAULT_TABLES.map(t => t.zone))];
  })();
  function saveZonesConfig() { localStorage.setItem('salle_config_zones', JSON.stringify(ZONES)); }

  /* ── Modal confirmation générique ── */
  function showConfirmModal(title, msg, labelOk, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) { if (confirm(msg)) onConfirm(); return; }
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMsg').textContent   = msg;
    document.getElementById('confirmModalOk').textContent   = labelOk || 'Confirmer';
    modal.classList.add('open');
    const btnOk  = document.getElementById('confirmModalOk');
    const btnNo  = document.getElementById('confirmModalCancel');
    function cleanup() { modal.classList.remove('open'); btnOk.replaceWith(btnOk.cloneNode(true)); btnNo.replaceWith(btnNo.cloneNode(true)); }
    document.getElementById('confirmModalOk').addEventListener('click', () => { cleanup(); onConfirm(); }, { once: true });
    document.getElementById('confirmModalCancel').addEventListener('click', cleanup, { once: true });
    modal.addEventListener('click', e => { if (e.target === modal) cleanup(); }, { once: true });
  }

  function getSalleData(date, service, tableId) {
    const raw = localStorage.getItem(`salle_${date}_${service}_${tableId}`);
    if (!raw) return { statut: 'libre' };
    try { return JSON.parse(raw); } catch { return { statut: raw || 'libre' }; }
  }

  function setSalleData(date, service, tableId, data) {
    const key = `salle_${date}_${service}_${tableId}`;
    if (!data || data.statut === 'libre') localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(data));
  }

  function buildTableCard(table, date, service) {
    const data   = getSalleData(date, service, table.id);
    const statut = data.statut || 'libre';
    const isOccupied   = statut === 'reservee' || statut === 'occupee';
    const isIncomplete = isOccupied && data.couverts && data.couverts < table.cap;
    const isOverflow   = isOccupied && data.couverts && data.couverts > table.cap;
    const clientLine   = isOccupied && data.prenom
      ? `<div class="salle-table-client">${esc(data.prenom)} ${esc(data.nom)}</div>` : '';
    const warnBadge    = isIncomplete
      ? `<span class="salle-warn-badge">▲ ${data.couverts}/${table.cap}</span>`
      : isOverflow
      ? `<span class="salle-warn-badge overflow">▲ ${data.couverts}/${table.cap}</span>` : '';
    const extraClass   = isIncomplete ? ' incomplete' : isOverflow ? ' overflow' : '';
    const trashBtn     = isOccupied
      ? `<button class="salle-table-trash" data-table="${esc(table.id)}" title="Vider la table">🗑</button>` : '';
    const displayName  = table.label || table.id;
    return `<div class="salle-table-card ${statut}${extraClass}" data-table="${esc(table.id)}" title="Cliquer pour gérer">
      ${trashBtn}
      <div class="salle-table-id">${esc(displayName)}</div>
      <div class="salle-table-cap">${table.cap} pers.</div>
      ${clientLine}
      <div class="salle-table-statut">${statut === 'libre' ? 'Libre' : statut === 'reservee' ? 'Réservée' : 'Occupée'}${warnBadge}</div>
    </div>`;
  }

  function refreshSalle() {
    const isAerial = document.getElementById('aerialView')?.style.display !== 'none';
    if (isAerial) renderAerialView(); else renderSalle();
  }

  function renderSalle() {
    const date    = document.getElementById('salleDate')?.value || toISO(new Date());
    const service = document.getElementById('salleService')?.value || 'dejeuner';
    const zonesEl = document.getElementById('salleZones');
    if (!zonesEl) return;
    const zones = [...new Set(TABLES.map(t => t.zone))];
    zonesEl.innerHTML = zones.map(zone => {
      const cards = TABLES.filter(t => t.zone === zone).map(t => buildTableCard(t, date, service)).join('');
      return `<div class="salle-section">
        <h3 class="salle-section-title">${esc(cap(zone))}</h3>
        <div class="salle-grid">${cards}</div>
      </div>`;
    }).join('');
    updateSalleStats(date, service);
  }

  function updateSalleStats(date, service) {
    const statsEl = document.getElementById('salleStats');
    if (!statsEl) return;
    let reservees = 0, capaciteTotal = TABLES.reduce((s,t) => s + t.cap, 0);
    TABLES.forEach(t => {
      const d = getSalleData(date, service, t.id);
      const st = d.statut || 'libre';
      if (st === 'reservee' || st === 'occupee') reservees += t.cap;
    });
    statsEl.innerHTML = `<div class="salle-stat-chip">
      <strong>${reservees}</strong> couverts assignés / <strong>${capaciteTotal}</strong> capacité totale
    </div>`;
  }

  let _salleListenersAttached = false;

  function loadSalleView() {
    const dateEl = document.getElementById('salleDate');
    if (dateEl && !dateEl.value) dateEl.value = toISO(new Date());
    renderSalle();

    if (_salleListenersAttached) return;
    _salleListenersAttached = true;

    document.getElementById('viewSalle')?.addEventListener('click', e => {
      // Poubelle — vider la table sans confirmation
      const trash = e.target.closest('.salle-table-trash');
      if (trash) {
        e.stopPropagation();
        const date    = document.getElementById('salleDate')?.value || toISO(new Date());
        const service = document.getElementById('salleService')?.value || 'dejeuner';
        setSalleData(date, service, trash.dataset.table, { statut: 'libre' });
        refreshSalle();
        return;
      }
      const card = e.target.closest('.salle-table-card');
      if (!card) return;
      const tableId = card.dataset.table;
      const date    = document.getElementById('salleDate')?.value || toISO(new Date());
      const service = document.getElementById('salleService')?.value || 'dejeuner';
      openSalleModal(tableId, date, service);
    });

    document.getElementById('salleDate')?.addEventListener('change', refreshSalle);
    document.getElementById('salleService')?.addEventListener('change', refreshSalle);

    document.getElementById('salleAutoFillBtn')?.addEventListener('click', autoFillSalle);

    document.getElementById('salleAerialBtn')?.addEventListener('click', () => {
      const zones  = document.getElementById('salleZones');
      const aerial = document.getElementById('aerialView');
      const btn    = document.getElementById('salleAerialBtn');
      if (!zones || !aerial) return;
      const isOpen = aerial.style.display !== 'none';
      aerial.style.display = isOpen ? 'none' : 'block';
      zones.style.display  = isOpen ? ''     : 'none';
      btn.textContent = isOpen ? '🗺 Vue aérienne' : '⬛ Vue liste';
      if (!isOpen) renderAerialView();
    });

    document.getElementById('salleConfigBtn')?.addEventListener('click', () => {
      const panel = document.getElementById('tableConfigPanel');
      if (!panel) return;
      const isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) renderTableConfigPanel();
    });

    document.getElementById('salleConfigClose')?.addEventListener('click', () => {
      document.getElementById('tableConfigPanel').style.display = 'none';
    });

    document.getElementById('addZoneBtn')?.addEventListener('click', () => {
      const name = document.getElementById('newZoneName').value.trim().toLowerCase();
      if (!name || ZONES.includes(name)) return;
      ZONES.push(name);
      saveZonesConfig();
      document.getElementById('newZoneName').value = '';
      renderTableConfigPanel();
    });

    document.getElementById('addTableBtn')?.addEventListener('click', () => {
      const zoneEl = document.getElementById('newTableZone');
      const zone   = zoneEl.value;
      const capVal = parseInt(document.getElementById('newTableCap').value);
      if (!zone || isNaN(capVal) || capVal < 1) return;
      const nums  = TABLES.map(t => parseInt(t.id.replace(/\D/g, ''))).filter(n => !isNaN(n));
      const newId = 'T' + (nums.length ? Math.max(...nums) + 1 : 1);
      TABLES.push({ id: newId, zone, cap: capVal });
      saveTablesConfig();
      document.getElementById('newTableCap').value = '';
      renderTableConfigPanel();
      renderSalle();
    });
  }

  /* ══════════════════════════════════════════
     VUE AÉRIENNE (drag-to-position floor plan)
  ══════════════════════════════════════════ */
  let _aerialPositions = (() => {
    try { const r = localStorage.getItem('salle_aerial_pos'); if (r) return JSON.parse(r); } catch {}
    return {};
  })();
  function saveAerialPositions() { localStorage.setItem('salle_aerial_pos', JSON.stringify(_aerialPositions)); }

  // Paliers cap → taille fixe (snap au relâchement du resize)
  const AERIAL_PRESETS = [
    { cap: 1, w: 68,  h: 62  },
    { cap: 2, w: 82,  h: 72  },
    { cap: 3, w: 96,  h: 83  },
    { cap: 4, w: 110, h: 94  },
    { cap: 5, w: 122, h: 105 },
    { cap: 6, w: 134, h: 115 },
    { cap: 8, w: 150, h: 128 },
    { cap: 12, w: 170, h: 145 },
  ];
  function _capToPreset(cap) {
    return AERIAL_PRESETS.find(p => cap <= p.cap) || AERIAL_PRESETS[AERIAL_PRESETS.length - 1];
  }
  function _snapPreset(w) {
    return AERIAL_PRESETS.reduce((best, p) => Math.abs(p.w - w) < Math.abs(best.w - w) ? p : best);
  }

  function renderAerialView() {
    const container = document.getElementById('aerialView');
    if (!container) return;
    const date    = document.getElementById('salleDate')?.value    || toISO(new Date());
    const service = document.getElementById('salleService')?.value || 'dejeuner';

    container.innerHTML = '<div class="aerial-floor" id="aerialFloor"></div>';
    const floor = document.getElementById('aerialFloor');

    TABLES.forEach((table, idx) => {
      const preset = _capToPreset(table.cap);
      const saved  = _aerialPositions[table.id] || {};
      const pos    = {
        x: saved.x ?? (28 + (idx % 6) * 165),
        y: saved.y ?? (28 + Math.floor(idx / 6) * 155),
      };
      const data = getSalleData(date, service, table.id);
      const st   = data.statut || 'libre';
      const name = table.label || table.id;

      const el = document.createElement('div');
      el.className = `aerial-table aerial-${st}`;
      el.dataset.table = table.id;
      el.style.cssText = `left:${pos.x}px;top:${pos.y}px;width:${preset.w}px;height:${preset.h}px;`;
      el.innerHTML = `
        <div class="aerial-table-name">${esc(name)}</div>
        <div class="aerial-table-cap">${table.cap} pers.</div>
        ${st !== 'libre' && data.prenom ? `<div class="aerial-table-client">${esc(data.prenom)}</div>` : ''}
        <div class="aerial-resize-handle" title="Redimensionner"></div>`;

      const savePos = () => {
        _aerialPositions[table.id] = { x: pos.x, y: pos.y };
        saveAerialPositions();
      };

      // ── Drag (déplacer) ──
      let dragging = false, ox = 0, oy = 0;
      el.addEventListener('mousedown', e => {
        if (e.button !== 0 || e.target.classList.contains('aerial-resize-handle')) return;
        dragging = true;
        const rect = floor.getBoundingClientRect();
        ox = e.clientX - rect.left - pos.x;
        oy = e.clientY - rect.top  - pos.y;
        el.classList.add('dragging');
        e.preventDefault();
      });
      document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const rect = floor.getBoundingClientRect();
        const cur = _capToPreset(table.cap);
        pos.x = Math.max(0, Math.min(rect.width  - cur.w, e.clientX - rect.left - ox));
        pos.y = Math.max(0, Math.min(rect.height - cur.h, e.clientY - rect.top  - oy));
        el.style.left = pos.x + 'px';
        el.style.top  = pos.y + 'px';
      });
      document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        el.classList.remove('dragging');
        savePos();
      });

      // ── Resize (snap au palier le plus proche au relâchement) ──
      const handle = el.querySelector('.aerial-resize-handle');
      let resizing = false, rx = 0, ry = 0, rw0 = 0, rh0 = 0;
      handle.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        resizing = true;
        rx = e.clientX; ry = e.clientY;
        rw0 = el.offsetWidth; rh0 = el.offsetHeight;
        el.classList.add('resizing');
        e.stopPropagation(); e.preventDefault();
      });
      document.addEventListener('mousemove', e => {
        if (!resizing) return;
        const w = Math.max(60, rw0 + (e.clientX - rx));
        const h = Math.max(55, rh0 + (e.clientY - ry));
        el.style.width  = w + 'px';
        el.style.height = h + 'px';
      });
      document.addEventListener('mouseup', e => {
        if (!resizing) return;
        resizing = false;
        el.classList.remove('resizing');
        const snapped = _snapPreset(el.offsetWidth);
        table.cap = snapped.cap;
        saveTablesConfig();
        savePos();
        // Applique la taille snappée et met à jour le label
        el.style.width  = snapped.w + 'px';
        el.style.height = snapped.h + 'px';
        el.querySelector('.aerial-table-cap').textContent = snapped.cap + ' pers.';
      });

      floor.appendChild(el);
    });
  }

  async function autoFillSalle() {
    const date    = document.getElementById('salleDate')?.value || toISO(new Date());
    const service = document.getElementById('salleService')?.value || 'dejeuner';
    const btn = document.getElementById('salleAutoFillBtn');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { data, error } = await sb.from('reservations')
        .select('*')
        .eq('date_reservation', date)
        .eq('statut', 'confirmée');
      if (error) throw error;
      const resas = (data || [])
        .filter(r => service === 'dejeuner' ? (r.heure || '') < '15:00' : (r.heure || '') >= '15:00')
        .sort((a, b) => b.couverts - a.couverts);
      // Reset toutes les tables
      TABLES.forEach(t => setSalleData(date, service, t.id, { statut: 'libre' }));
      // Assignation greedy : plus grande réservation → plus petite table qui convient
      const used = new Set();
      for (const r of resas) {
        const best = TABLES.filter(t => !used.has(t.id) && t.cap >= r.couverts).sort((a, b) => a.cap - b.cap)[0]
                  || TABLES.filter(t => !used.has(t.id)).sort((a, b) => b.cap - a.cap)[0];
        if (best) {
          setSalleData(date, service, best.id, { statut: 'reservee', reservationId: r.id, prenom: r.prenom, nom: r.nom, couverts: r.couverts });
          used.add(best.id);
        }
      }
      refreshSalle();
      showToast(`✓ ${resas.length} réservation(s) assignée(s) automatiquement`);
    } catch(err) {
      console.error('Auto-fill:', err);
      showToast('Erreur lors du remplissage automatique');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⚡ Remplir auto'; }
    }
  }

  function _buildZoneOptions(selected) {
    // Merge zones from ZONES list + zones actually in use
    const allZones = [...new Set([...ZONES, ...TABLES.map(t => t.zone)])];
    return allZones.map(z => `<option value="${esc(z)}" ${z === selected ? 'selected' : ''}>${esc(z)}</option>`).join('');
  }

  function renderTableConfigPanel() {
    // ── Zone list ──
    const zoneListEl = document.getElementById('zoneConfigList');
    if (zoneListEl) {
      zoneListEl.innerHTML = ZONES.length
        ? `<div class="zone-tags">${ZONES.map(z => `
            <span class="zone-tag">
              ${esc(z)}
              <button class="zone-tag-del" data-zone="${esc(z)}" title="Supprimer la zone">×</button>
            </span>`).join('')}</div>`
        : '<p style="font-size:0.83rem;color:var(--text-lighter);">Aucune zone définie.</p>';
      zoneListEl.querySelectorAll('.zone-tag-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const z = btn.dataset.zone;
          const inUse = TABLES.some(t => t.zone === z);
          const doDelete = () => {
            const remaining = ZONES.filter(x => x !== z);
            const fallback  = remaining[0] || '';
            if (inUse) TABLES.forEach(t => { if (t.zone === z) t.zone = fallback; });
            ZONES = remaining;
            saveZonesConfig();
            if (inUse) saveTablesConfig();
            renderTableConfigPanel();
            renderSalle();
          };
          if (inUse) {
            showConfirmModal('Zone utilisée', `La zone "${z}" est utilisée par des tables. Les tables seront déplacées vers "${ZONES.filter(x => x !== z)[0] || '?'}". Continuer ?`, 'Supprimer', doDelete);
          } else {
            doDelete();
          }
        });
      });
    }

    // ── Table list ──
    const listEl = document.getElementById('tableConfigList');
    if (!listEl) return;
    listEl.innerHTML = `<table class="admin-table" style="margin:1rem 0;">
      <thead><tr><th>ID</th><th>Nom affiché</th><th>Zone</th><th>Cap.</th><th></th></tr></thead>
      <tbody>${TABLES.map(t => `<tr>
        <td><strong>${esc(t.id)}</strong></td>
        <td><input class="admin-input tbl-edit" type="text" value="${esc(t.label || '')}" data-id="${esc(t.id)}" data-field="label" placeholder="${esc(t.id)}" style="width:7rem;padding:0.3rem 0.5rem;font-size:0.83rem;" /></td>
        <td><select class="admin-select tbl-edit" data-id="${esc(t.id)}" data-field="zone" style="font-size:0.83rem;padding:0.3rem 0.5rem;">${_buildZoneOptions(t.zone)}</select></td>
        <td><input class="admin-input tbl-edit" type="number" min="1" max="30" value="${t.cap}" data-id="${esc(t.id)}" data-field="cap" style="width:5rem;padding:0.3rem 0.5rem;font-size:0.83rem;" /></td>
        <td><button class="btn btn-danger btn-sm tbl-del" data-id="${esc(t.id)}" style="font-size:0.75rem;padding:0.3rem 0.7rem;">✕</button></td>
      </tr>`).join('')}</tbody>
    </table>`;

    // ── Dropdown zone dans "Ajouter une table" ──
    const newZoneSel = document.getElementById('newTableZone');
    if (newZoneSel) newZoneSel.innerHTML = _buildZoneOptions(newZoneSel.value || ZONES[0]);

    listEl.querySelectorAll('.tbl-edit').forEach(inp => {
      inp.addEventListener('change', () => {
        const t = TABLES.find(x => x.id === inp.dataset.id);
        if (!t) return;
        if (inp.dataset.field === 'cap')   t.cap   = Math.max(1, parseInt(inp.value) || 1);
        if (inp.dataset.field === 'zone')  t.zone  = inp.value;
        if (inp.dataset.field === 'label') t.label = inp.value.trim();
        saveTablesConfig(); renderSalle();
      });
    });

    listEl.querySelectorAll('.tbl-del').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirmModal(
          'Supprimer la table',
          `Supprimer définitivement la table ${btn.dataset.id} ?`,
          'Supprimer',
          () => {
            TABLES = TABLES.filter(x => x.id !== btn.dataset.id);
            saveTablesConfig(); renderTableConfigPanel(); renderSalle();
          }
        );
      });
    });
  }

  /* ── Modal salle listeners (attacher une seule fois) ── */
  let _salleModalListeners = false;

  async function openSalleModal(tableId, date, service) {
    const modal = document.getElementById('salleModal');
    if (!modal) return;

    const table = TABLES.find(t => t.id === tableId);
    if (!table) return;
    const data = getSalleData(date, service, tableId);

    document.getElementById('salleModalTitle').textContent = `Table ${tableId} — ${table.cap} pers.`;

    const statusEl = document.getElementById('salleModalStatus');
    const resaEl   = document.getElementById('salleModalReservations');
    const footer   = document.getElementById('salleModalFooter');

    // Reset footer to just the close button
    footer.innerHTML = '<button class="btn btn-ghost" id="salleModalCloseBtn">Fermer</button>';

    if (!_salleModalListeners) {
      _salleModalListeners = true;
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('open');
      });
      document.getElementById('salleModalClose')?.addEventListener('click', () => modal.classList.remove('open'));
    }
    // Listener sur le close btn (recrée à chaque ouverture car innerHTML est réécrit)
    footer.querySelector('#salleModalCloseBtn')?.addEventListener('click', () => modal.classList.remove('open'));

    if (data.statut === 'libre') {
      statusEl.innerHTML = '<span class="status-badge confirmed">Libre</span>';

      // Bouton walk-in dans le footer (table occupée sans réservation)
      const btnWalkIn = document.createElement('button');
      btnWalkIn.className = 'btn btn-secondary btn-sm';
      btnWalkIn.textContent = 'Occupée (sans résa)';
      btnWalkIn.style.marginLeft = '0.5rem';
      btnWalkIn.addEventListener('click', () => {
        setSalleData(date, service, tableId, { statut: 'occupee' });
        modal.classList.remove('open');
        renderSalle();
      });
      footer.appendChild(btnWalkIn);

      // Charger les réservations non assignées du jour/service
      resaEl.innerHTML = '<p style="font-size:0.83rem;color:var(--text-lighter);">Chargement…</p>';
      modal.classList.add('open');

      const sb = getSupabase();
      if (!sb) { resaEl.innerHTML = '<p style="font-size:0.83rem;color:var(--text-lighter);">Supabase non configuré.</p>'; return; }

      const { data: rows, error } = await sb.from('reservations')
        .select('*')
        .eq('date_reservation', date)
        .eq('statut', 'confirmée');

      if (error) { resaEl.innerHTML = '<p style="font-size:0.83rem;color:#dc2626;">Erreur de chargement.</p>'; return; }

      // Filtrer par service (déjeuner < 15h, dîner >= 15h)
      const filtered = (rows || []).filter(r => {
        if (service === 'dejeuner') return (r.heure || '') < '15:00';
        return (r.heure || '') >= '15:00';
      });

      // Récupérer les reservationIds déjà assignés à d'autres tables ce jour/service
      const assignedIds = new Set();
      TABLES.forEach(t => {
        if (t.id === tableId) return;
        const d = getSalleData(date, service, t.id);
        if (d.reservationId) assignedIds.add(d.reservationId);
      });

      const available = filtered.filter(r => !assignedIds.has(r.id));

      if (!available.length) {
        resaEl.innerHTML = '<p style="font-size:0.83rem;color:var(--text-lighter);">Aucune réservation disponible pour ce service.</p>';
        return;
      }

      const ul = document.createElement('ul');
      ul.className = 'salle-resa-list';
      available.forEach(r => {
        const li = document.createElement('li');
        li.className = 'salle-resa-item';
        li.innerHTML = `<div class="resa-name">${esc(r.prenom)} ${esc(r.nom)}</div>
          <div class="resa-details">${(r.heure||'').substring(0,5).replace(':','h')} — ${r.couverts} pers.</div>`;
        li.addEventListener('click', () => {
          setSalleData(date, service, tableId, {
            statut: 'reservee',
            reservationId: r.id,
            prenom: r.prenom,
            nom: r.nom,
            couverts: r.couverts,
          });
          modal.classList.remove('open');
          renderSalle();
        });
        ul.appendChild(li);
      });
      resaEl.innerHTML = '';
      resaEl.appendChild(ul);

    } else {
      // Statut reservee ou occupee
      const statutLabel = data.statut === 'reservee' ? 'Réservée' : 'Occupée';
      const statutClass = data.statut === 'reservee' ? 'status-badge' : 'status-badge cancelled';
      statusEl.innerHTML = `<span class="${statutClass}">${statutLabel}</span>`;

      let infoHtml = '';
      if (data.prenom) {
        const warnNote = data.couverts && data.couverts !== table.cap
          ? `<span class="salle-warn-inline">${data.couverts < table.cap ? '▲ incomplet' : '▲ surcharge'} (${data.couverts}/${table.cap})</span>` : '';
        infoHtml += `<p style="margin:0.5rem 0;font-weight:600;">${esc(data.prenom)} ${esc(data.nom)} — ${data.couverts || '?'} pers. ${warnNote}</p>`;
      }
      resaEl.innerHTML = infoHtml;

      // Boutons d'action
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'salle-modal-actions';

      if (data.statut === 'reservee') {
        const btnOccupee = document.createElement('button');
        btnOccupee.className = 'btn btn-primary btn-sm';
        btnOccupee.textContent = 'Marquer occupée';
        btnOccupee.addEventListener('click', () => {
          setSalleData(date, service, tableId, { ...data, statut: 'occupee' });
          modal.classList.remove('open');
          renderSalle();
        });
        actionsDiv.appendChild(btnOccupee);
      } else {
        const btnReservee = document.createElement('button');
        btnReservee.className = 'btn btn-secondary btn-sm';
        btnReservee.textContent = 'Marquer réservée';
        btnReservee.addEventListener('click', () => {
          setSalleData(date, service, tableId, { ...data, statut: 'reservee' });
          modal.classList.remove('open');
          renderSalle();
        });
        actionsDiv.appendChild(btnReservee);
      }

      const btnLibre = document.createElement('button');
      btnLibre.className = 'btn btn-danger btn-sm';
      btnLibre.textContent = 'Libérer la table';
      btnLibre.addEventListener('click', () => {
        setSalleData(date, service, tableId, { statut: 'libre' });
        modal.classList.remove('open');
        renderSalle();
      });
      actionsDiv.appendChild(btnLibre);

      resaEl.appendChild(actionsDiv);
      modal.classList.add('open');
    }
  }

  /* ══════════════════════════════════════════
     NOTIFICATIONS
  ══════════════════════════════════════════ */
  let _notifListenersAttached = false;

  function loadNotifView() {
    const today     = new Date(); today.setHours(12,0,0,0);
    const demain    = new Date(today); demain.setDate(today.getDate() + 1);
    const avantHier = new Date(today); avantHier.setDate(today.getDate() - 2);
    const demainISO    = toISO(demain);
    const avantHierISO = toISO(avantHier);

    let rappelRows = [], avisRows = [];

    const sb = getSupabase();
    if (!sb) return;

    // Toggles auto-envoi — restaurer état
    const autoRappelEl = document.getElementById('toggleAutoRappel');
    const autoAvisEl   = document.getElementById('toggleAutoAvis');
    if (autoRappelEl) autoRappelEl.checked = localStorage.getItem('notif_auto_rappel') !== 'false';
    if (autoAvisEl)   autoAvisEl.checked   = localStorage.getItem('notif_auto_avis')   !== 'false';

    // Charger rappels J-1
    sb.from('reservations').select('*')
      .eq('date_reservation', demainISO).eq('statut', 'confirmée')
      .then(({ data }) => {
        rappelRows = data || [];
        const btn = document.getElementById('btnEnvoyerRappels');
        if (btn) { btn.textContent = `Envoyer les rappels (${rappelRows.length})`; btn.disabled = rappelRows.length === 0; }

        // Auto-envoi J-1
        const autoOn = localStorage.getItem('notif_auto_rappel') !== 'false';
        const alreadySent = localStorage.getItem('notif_rappel_sent_' + demainISO) === 'true';
        if (autoOn && !alreadySent && rappelRows.length > 0 && EMAILJS_REMINDER_TEMPLATE) {
          localStorage.setItem('notif_rappel_sent_' + demainISO, 'true');
          sendBatchEmails({
            rows: rappelRows,
            progressBarId: 'rappelProgressFill',
            progressLabelId: 'rappelProgressLabel',
            progressContainerId: 'rappelProgress',
            resultId: 'rappelResult',
            btnId: 'btnEnvoyerRappels',
            buildParams: (r) => ({
              to_email:   r.email,
              prenom:     r.prenom,
              nom:        r.nom,
              date:       formatDateFr(r.date_reservation),
              heure:      (r.heure||'').substring(0,5).replace(':','h'),
              couverts:   r.couverts,
              manage_url: window.location.href.split('?')[0].replace('admin.html','reservation.html') + '?token=' + r.token,
              phone:      '04 90 54 32 11',
            }),
            template: EMAILJS_REMINDER_TEMPLATE,
          }).then(() => {
            const resultEl = document.getElementById('rappelResult');
            if (resultEl && !resultEl.innerHTML.includes('✓')) {
              resultEl.innerHTML = '<div class="notif-alert notif-alert-ok">✓ Rappels envoyés automatiquement</div>';
            }
          });
        }
      });

    // Charger avis
    sb.from('reservations').select('*')
      .eq('date_reservation', avantHierISO).eq('statut', 'confirmée')
      .then(({ data }) => {
        avisRows = data || [];
        const btn = document.getElementById('btnEnvoyerAvis');
        if (btn) { btn.textContent = `Envoyer les demandes (${avisRows.length})`; btn.disabled = avisRows.length === 0; }

        // Auto-envoi avis
        const autoOn = localStorage.getItem('notif_auto_avis') !== 'false';
        const alreadySent = localStorage.getItem('notif_avis_sent_' + avantHierISO) === 'true';
        if (autoOn && !alreadySent && avisRows.length > 0 && EMAILJS_REVIEW_TEMPLATE) {
          localStorage.setItem('notif_avis_sent_' + avantHierISO, 'true');
          sendBatchEmails({
            rows: avisRows,
            progressBarId: 'avisProgressFill',
            progressLabelId: 'avisProgressLabel',
            progressContainerId: 'avisProgress',
            resultId: 'avisResult',
            btnId: 'btnEnvoyerAvis',
            buildParams: (r) => ({
              to_email:   r.email,
              prenom:     r.prenom,
              nom:        r.nom,
              date:       formatDateFr(r.date_reservation),
              review_url: GOOGLE_REVIEW_URL || '#',
              phone:      '04 90 54 32 11',
            }),
            template: EMAILJS_REVIEW_TEMPLATE,
          }).then(() => {
            const resultEl = document.getElementById('avisResult');
            if (resultEl && !resultEl.innerHTML.includes('✓')) {
              resultEl.innerHTML = '<div class="notif-alert notif-alert-ok">✓ Avis envoyés automatiquement</div>';
            }
          });
        }
      });

    if (_notifListenersAttached) return;
    _notifListenersAttached = true;

    // Listeners des toggles
    document.getElementById('toggleAutoRappel')?.addEventListener('change', e => {
      localStorage.setItem('notif_auto_rappel', e.target.checked);
    });
    document.getElementById('toggleAutoAvis')?.addEventListener('change', e => {
      localStorage.setItem('notif_auto_avis', e.target.checked);
    });

    // Bouton rappels
    document.getElementById('btnEnvoyerRappels')?.addEventListener('click', async () => {
      if (!EMAILJS_REMINDER_TEMPLATE) {
        document.getElementById('rappelResult').innerHTML = '<div class="notif-alert notif-alert-warn">Configurez <code>EMAILJS_REMINDER_TEMPLATE</code> dans script.js.</div>';
        return;
      }
      await sendBatchEmails({
        rows: rappelRows,
        progressBarId: 'rappelProgressFill',
        progressLabelId: 'rappelProgressLabel',
        progressContainerId: 'rappelProgress',
        resultId: 'rappelResult',
        btnId: 'btnEnvoyerRappels',
        buildParams: (r) => ({
          to_email:   r.email,
          prenom:     r.prenom,
          nom:        r.nom,
          date:       formatDateFr(r.date_reservation),
          heure:      (r.heure||'').substring(0,5).replace(':','h'),
          couverts:   r.couverts,
          manage_url: window.location.href.split('?')[0].replace('admin.html','reservation.html') + '?token=' + r.token,
          phone:      '04 90 54 32 11',
        }),
        template: EMAILJS_REMINDER_TEMPLATE,
      });
    });

    // Bouton avis
    document.getElementById('btnEnvoyerAvis')?.addEventListener('click', async () => {
      if (!EMAILJS_REVIEW_TEMPLATE) {
        document.getElementById('avisResult').innerHTML = '<div class="notif-alert notif-alert-warn">Configurez <code>EMAILJS_REVIEW_TEMPLATE</code> dans script.js.</div>';
        return;
      }
      await sendBatchEmails({
        rows: avisRows,
        progressBarId: 'avisProgressFill',
        progressLabelId: 'avisProgressLabel',
        progressContainerId: 'avisProgress',
        resultId: 'avisResult',
        btnId: 'btnEnvoyerAvis',
        buildParams: (r) => ({
          to_email:   r.email,
          prenom:     r.prenom,
          nom:        r.nom,
          date:       formatDateFr(r.date_reservation),
          review_url: GOOGLE_REVIEW_URL || '#',
          phone:      '04 90 54 32 11',
        }),
        template: EMAILJS_REVIEW_TEMPLATE,
      });
    });
  }

  async function sendBatchEmails({ rows, progressBarId, progressLabelId, progressContainerId, resultId, btnId, buildParams, template }) {
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID) {
      document.getElementById(resultId).innerHTML = '<div class="notif-alert notif-alert-warn">EmailJS non configuré.</div>';
      return;
    }
    if (typeof emailjs !== 'undefined') emailjs.init(EMAILJS_PUBLIC_KEY);
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = true;
    const progress   = document.getElementById(progressContainerId);
    const fill       = document.getElementById(progressBarId);
    const label      = document.getElementById(progressLabelId);
    if (progress) progress.style.display = 'block';

    let sent = 0, failed = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, template, buildParams(r));
        sent++;
      } catch(e) {
        failed++;
        console.warn('Email non envoyé:', e);
      }
      const pct = Math.round(((i + 1) / rows.length) * 100);
      if (fill)  fill.style.width = pct + '%';
      if (label) label.textContent = `${i + 1} / ${rows.length}`;
    }

    const resultEl = document.getElementById(resultId);
    if (resultEl) {
      resultEl.innerHTML = `<div class="notif-alert ${failed === 0 ? 'notif-alert-ok' : 'notif-alert-warn'}">
        ✓ ${sent} e-mail(s) envoyé(s)${failed > 0 ? ` — ${failed} échec(s)` : ''}.
      </div>`;
    }
    if (progress) progress.style.display = 'none';
  }

  /* ══════════════════════════════════════════
     QR CODES
  ══════════════════════════════════════════ */
  function loadQrView() {
    const grid = document.getElementById('qrGrid');
    if (!grid || grid.dataset.loaded) return;
    grid.dataset.loaded = '1';
    grid.innerHTML = '';

    const baseUrl = window.location.href.split('/admin')[0];

    TABLES.forEach(table => {
      const card   = document.createElement('div');
      card.className = 'qr-card';

      const canvas = document.createElement('canvas');
      const nameEl = document.createElement('div');
      nameEl.className = 'qr-card-name';
      nameEl.textContent = table.id;
      const capEl  = document.createElement('div');
      capEl.className = 'qr-card-cap';
      capEl.textContent = `${table.cap} personnes — ${table.zone === 'salle' ? 'Salle' : 'Terrasse'}`;

      card.appendChild(canvas);
      card.appendChild(nameEl);
      card.appendChild(capEl);
      grid.appendChild(card);

      const url = `${baseUrl}/menu.html?table=${table.id}`;
      if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(canvas, url, { width: 160, margin: 1 }, err => {
          if (err) console.warn('QR error', err);
        });
      } else {
        canvas.style.cssText = 'width:160px;height:160px;background:#eee;';
        const msg = document.createElement('p');
        msg.textContent = 'QRCode.js non chargé';
        card.insertBefore(msg, nameEl);
      }
    });
  }

  /* ══════════════════════════════════════════
     FIDÉLITÉ
  ══════════════════════════════════════════ */
  async function loadFideliteView() {
    const loading = document.getElementById('fideliteLoading');
    const wrapper = document.getElementById('fideliteTableWrapper');
    const empty   = document.getElementById('fideliteEmpty');
    const tbody   = document.getElementById('fideliteBody');

    if (loading) loading.style.display = 'flex';
    if (wrapper) wrapper.style.display = 'none';
    if (empty)   empty.style.display   = 'none';

    const refreshBtn = document.getElementById('refreshFideliteBtn');
    if (refreshBtn && !refreshBtn._listenerSet) {
      refreshBtn._listenerSet = true;
      refreshBtn.addEventListener('click', loadFideliteView);
    }

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { data, error } = await sb.from('reservations').select('prenom,nom,email').eq('statut', 'confirmée');
      if (error) throw error;

      if (loading) loading.style.display = 'none';
      const rows = data || [];

      // Grouper par email
      const map = {};
      rows.forEach(r => {
        const key = (r.email || '').toLowerCase();
        if (!key) return;
        if (!map[key]) map[key] = { prenom: r.prenom, nom: r.nom, email: r.email, visites: 0 };
        map[key].visites++;
      });

      const clients = Object.values(map).filter(c => c.visites >= 2)
        .sort((a,b) => b.visites - a.visites);

      if (!clients.length) { if (empty) empty.style.display = 'flex'; return; }

      tbody.innerHTML = clients.map(c => {
        const niveau = c.visites >= 8 ? '🥇 Or' : c.visites >= 5 ? '🥈 Argent' : c.visites >= 3 ? '🥉 Bronze' : '—';
        return `<tr>
          <td><div class="td-name">${esc(c.prenom)} ${esc(c.nom)}</div></td>
          <td><div class="td-email">${esc(c.email)}</div></td>
          <td><strong>${c.visites}</strong></td>
          <td><span class="fidelite-niveau">${niveau}</span></td>
        </tr>`;
      }).join('');
      if (wrapper) wrapper.style.display = 'block';
    } catch(err) {
      console.error('Erreur fidélité:', err);
      if (loading) loading.style.display = 'none';
      if (empty)   empty.style.display   = 'flex';
    }
  }

  /* ══════════════════════════════════════════
     LISTE D'ATTENTE (ADMIN)
  ══════════════════════════════════════════ */
  async function loadAttenteView() {
    const loading = document.getElementById('attenteLoading');
    const wrapper = document.getElementById('attenteTableWrapper');
    const empty   = document.getElementById('attenteEmpty');
    const tbody   = document.getElementById('attenteBody');

    if (loading) loading.style.display = 'flex';
    if (wrapper) wrapper.style.display = 'none';
    if (empty)   empty.style.display   = 'none';

    const refreshAttenteBtn = document.getElementById('refreshAttenteBtn');
    if (refreshAttenteBtn && !refreshAttenteBtn._listenerSet) {
      refreshAttenteBtn._listenerSet = true;
      refreshAttenteBtn.addEventListener('click', loadAttenteView);
    }

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { data, error } = await sb.from('liste_attente').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      if (loading) loading.style.display = 'none';
      const rows = data || [];
      if (!rows.length) { if (empty) empty.style.display = 'flex'; return; }

      tbody.innerHTML = rows.map(r => {
        const dateCreated = r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—';
        return `<tr>
          <td>${dateCreated}</td>
          <td>
            <div class="td-name">${esc(r.prenom)} ${esc(r.nom)}</div>
            <div class="td-email">${esc(r.email || '')}</div>
          </td>
          <td>${formatDateFr(r.date_souhaitee)}</td>
          <td>${r.couverts || '—'} pers.</td>
          <td>${esc(r.telephone || '')}</td>
          <td class="td-note" title="${esc(r.message || '')}">${esc(r.message || '—')}</td>
          <td style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            <a href="mailto:${esc(r.email || '')}?subject=Liste+d'attente+Le+Mas+Proven%C3%A7al&body=Bonjour+${esc(r.prenom)},"
               class="btn btn-secondary btn-sm" style="font-size:0.75rem;padding:0.3rem 0.7rem;">Contacter</a>
            <button class="btn btn-danger btn-sm attente-delete-btn" data-id="${r.id}"
               style="font-size:0.75rem;padding:0.3rem 0.7rem;">Supprimer</button>
          </td>
        </tr>`;
      }).join('');
      if (wrapper) wrapper.style.display = 'block';

      // Délégation pour suppression (sur le wrapper, attaché une seule fois)
      const attenteWrapper = document.getElementById('attenteTableWrapper');
      if (attenteWrapper && !attenteWrapper._deleteListenerSet) {
        attenteWrapper._deleteListenerSet = true;
        attenteWrapper.addEventListener('click', async e => {
          const btn = e.target.closest('.attente-delete-btn');
          if (!btn) return;
          if (!confirm('Supprimer cette demande ?')) return;
          btn.disabled = true; btn.textContent = '…';
          try {
            const { error } = await getSupabase().from('liste_attente').delete().eq('id', btn.dataset.id);
            if (error) throw error;
            btn.closest('tr')?.remove();
          } catch(err) {
            console.error('Erreur suppression attente:', err);
            btn.disabled = false; btn.textContent = 'Supprimer';
          }
        });
      }
    } catch(err) {
      console.error('Erreur liste attente:', err);
      if (loading) loading.style.display = 'none';
      if (empty)   empty.style.display   = 'flex';
    }
  }

  /* ══════════════════════════════════════════
     GESTION DU MENU
  ══════════════════════════════════════════ */
  const CAT_LABELS = { entree:'Entrées', plat:'Plats', dessert:'Desserts', vin:'Vins' };
  const CAT_ORDER  = ['entree','plat','dessert','vin'];
  let menuAdminPlats = [];

  async function loadMenuAdminView() {
    const loading = document.getElementById('menuAdminLoading');
    const content = document.getElementById('menuAdminContent');
    if (loading) loading.style.display = 'flex';
    if (content) content.innerHTML = '';

    const refreshMenuBtn = document.getElementById('refreshMenuBtn');
    if (refreshMenuBtn && !refreshMenuBtn._listenerSet) {
      refreshMenuBtn._listenerSet = true;
      refreshMenuBtn.addEventListener('click', loadMenuAdminView);
    }

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { data, error } = await sb.from('plats').select('*').order('categorie').order('nom');
      if (error) throw error;
      menuAdminPlats = data || [];
      if (loading) loading.style.display = 'none';
      renderMenuAdmin();
    } catch(err) {
      console.error('Erreur menu:', err);
      if (loading) loading.style.display = 'none';
      if (content) content.innerHTML = '<div class="admin-empty-state"><span class="empty-icon">◌</span><p>Erreur de chargement.</p></div>';
    }
  }

  function renderMenuAdmin() {
    const content = document.getElementById('menuAdminContent');
    if (!content) return;
    if (!menuAdminPlats.length) {
      content.innerHTML = '<div class="admin-empty-state"><span class="empty-icon">◌</span><p>Aucun plat enregistré.</p></div>';
      return;
    }
    const grouped = {};
    CAT_ORDER.forEach(c => { grouped[c] = []; });
    menuAdminPlats.forEach(p => {
      if (!grouped[p.categorie]) grouped[p.categorie] = [];
      grouped[p.categorie].push(p);
    });

    content.innerHTML = CAT_ORDER.map(cat => {
      const plats = grouped[cat];
      if (!plats.length) return '';
      return `<div class="menu-admin-section">
        <h3 class="menu-admin-cat-title">${CAT_LABELS[cat] || cat}</h3>
        <table class="admin-table">
          <thead><tr>
            <th>Nom</th><th>Description</th><th>Prix</th><th>Tag</th><th>Actif</th><th></th>
          </tr></thead>
          <tbody>
            ${plats.map(p => `<tr>
              <td><div class="td-name">${esc(p.nom)}</div></td>
              <td class="td-note" title="${esc(p.description||'')}">${esc(p.description || '—')}</td>
              <td><strong>${p.prix ? parseFloat(p.prix).toFixed(2) + ' €' : '—'}</strong></td>
              <td>${esc(p.tag || '—')}</td>
              <td><span class="status-badge ${p.actif ? 'confirmed' : 'cancelled'}">${p.actif ? 'Actif' : 'Inactif'}</span></td>
              <td style="display:flex;gap:0.4rem;">
                <button class="btn btn-secondary btn-sm plat-edit-btn" data-id="${p.id}" style="font-size:0.75rem;padding:0.3rem 0.7rem;">Modifier</button>
                <button class="btn btn-danger btn-sm plat-delete-btn" data-id="${p.id}" style="font-size:0.75rem;padding:0.3rem 0.7rem;">Supprimer</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    }).join('');

    // Délégation (une seule fois)
    if (!content._clickListenerSet) {
      content._clickListenerSet = true;
      content.addEventListener('click', e => {
        const editBtn   = e.target.closest('.plat-edit-btn');
        const deleteBtn = e.target.closest('.plat-delete-btn');
        if (editBtn) {
          const plat = menuAdminPlats.find(p => p.id == editBtn.dataset.id);
          if (plat) openPlatModal(plat);
        }
        if (deleteBtn) deletePlat(parseInt(deleteBtn.dataset.id));
      });
    }
  }

  // Photo drop zone — helpers
  function _showPhotoPreview(src) {
    const prompt  = document.getElementById('photoDropPrompt');
    const preview = document.getElementById('photoDropPreview');
    if (!prompt || !preview) return;
    prompt.style.display  = 'none';
    preview.style.display = 'flex';
    preview.innerHTML = `<img src="${src}" alt="preview" /><button class="photo-drop-clear" id="photoDropClear" type="button">×</button>`;
    document.getElementById('photoDropClear')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('platPhoto').value = '';
      _clearPhotoPreview();
    });
  }
  function _clearPhotoPreview() {
    const prompt  = document.getElementById('photoDropPrompt');
    const preview = document.getElementById('photoDropPreview');
    if (prompt)  { prompt.style.display  = 'flex'; }
    if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
    const fi = document.getElementById('photoFileInput');
    if (fi) fi.value = '';
  }

  // Attacher les listeners une seule fois
  (function setupPhotoDrop() {
    const dropZone  = document.getElementById('photoDropZone');
    const fileInput = document.getElementById('photoFileInput');
    const photoIn   = document.getElementById('platPhoto');
    if (!dropZone || !fileInput || !photoIn) return;
    function applyFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => { photoIn.value = e.target.result; _showPhotoPreview(e.target.result); };
      reader.readAsDataURL(file);
    }
    dropZone.addEventListener('click', e => { if (!e.target.closest('.photo-drop-clear')) fileInput.click(); });
    fileInput.addEventListener('change', () => applyFile(fileInput.files[0]));
    dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); applyFile(e.dataTransfer.files[0]); });
  })();

  function openPlatModal(plat) {
    const modal = document.getElementById('platModal');
    if (!modal) return;
    const isEdit = !!plat;
    document.getElementById('platModalTitle').textContent = isEdit ? 'Modifier le plat' : 'Ajouter un plat';
    document.getElementById('platId').value           = isEdit ? plat.id : '';
    document.getElementById('platCategorie').value    = isEdit ? (plat.categorie || '') : '';
    document.getElementById('platNom').value          = isEdit ? (plat.nom || '') : '';
    document.getElementById('platPrix').value         = isEdit ? (plat.prix || '') : '';
    document.getElementById('platTag').value          = isEdit ? (plat.tag || '') : '';
    document.getElementById('platDescription').value  = isEdit ? (plat.description || '') : '';
    document.getElementById('platPhoto').value        = isEdit ? (plat.photo_url || '') : '';
    document.getElementById('platAllergens').value    = isEdit ? (plat.allergens || '') : '';
    document.getElementById('platActif').checked      = isEdit ? !!plat.actif : true;
    document.getElementById('platFormError').style.display = 'none';
    // Sync drop zone
    if (isEdit && plat.photo_url) _showPhotoPreview(plat.photo_url);
    else _clearPhotoPreview();
    modal.classList.add('open');
  }

  async function deletePlat(id) {
    if (!confirm('Supprimer ce plat ?')) return;
    try {
      const { error } = await getSupabase().from('plats').delete().eq('id', id);
      if (error) throw error;
      menuAdminPlats = menuAdminPlats.filter(p => p.id !== id);
      renderMenuAdmin();
    } catch(err) {
      console.error('Erreur suppression plat:', err);
      alert('Erreur lors de la suppression.');
    }
  }

  // Données statiques de la carte (pour import initial)
  const STATIC_DISHES = [
    { categorie:'entree',   nom:'Soupe de truffes noires du Vaucluse',  description:'Bouillon de volaille fermière truffé, copeaux de truffe fraîche du Vaucluse, mouillettes au beurre de truffe noire, œuf poché', prix:28, tag:'Signature', allergens:'Gluten · Œufs · Lait',            actif:true, photo_url:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80&auto=format&fit=crop' },
    { categorie:'entree',   nom:'Terrine de foie gras maison',           description:'Foie gras de canard mi-cuit au torchon, chutney de figues de Provence, brioche toastée au beurre salé, fleur de sel de Camargue', prix:24, tag:'Maison',    allergens:'Gluten · Lait',                  actif:true, photo_url:'https://images.unsplash.com/photo-1600803907087-f56d462fd26b?w=600&q=80&auto=format&fit=crop' },
    { categorie:'entree',   nom:'Salade de chèvre chaud aux herbes',     description:'Crottin de chèvre rôti de la ferme des Alpilles, mesclun de jeunes pousses, tomates cerises confites au thym, vinaigrette au miel de lavande et noix de Grenoble', prix:18, tag:null, allergens:'Lait · Fruits à coque', actif:true, photo_url:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80&auto=format&fit=crop' },
    { categorie:'plat',     nom:"Agneau des Alpilles en croûte d'herbes", description:"Selle d'agneau rôtie en croûte d'herbes de Provence, jus corsé au romarin sauvage, tian de légumes estivaux, gratin dauphinois à la truffe", prix:42, tag:'Signature', allergens:'Lait · Gluten',         actif:true, photo_url:'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?w=600&q=80&auto=format&fit=crop' },
    { categorie:'plat',     nom:'Filet de saint-pierre rôti',            description:'Filet de saint-pierre de Méditerranée, bouillabaisse légère au safran, rouille maison, brunoise de fenouil et orange, huile d\'olive AOC des Baux', prix:38, tag:null, allergens:'Poisson · Gluten · Œufs',  actif:true, photo_url:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80&auto=format&fit=crop' },
    { categorie:'plat',     nom:'Magret de canard aux cerises',          description:'Magret de canard du Périgord rôti rosé, sauce aux cerises aigres et vinaigre balsamique, polenta crémeuse aux herbes fraîches, haricots verts extra-fins', prix:36, tag:null, allergens:'Lait · Sulfites',    actif:true, photo_url:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80&auto=format&fit=crop' },
    { categorie:'plat',     nom:'Risotto aux champignons des bois',      description:'Risotto Carnaroli mantecato au parmesan 24 mois, assortiment de champignons sauvages (cèpes, girolles, pleurotes), huile de truffe blanche, parmesan râpé', prix:28, tag:'Végétarien', allergens:'Lait · Sulfites', actif:true, photo_url:'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80&auto=format&fit=crop' },
    { categorie:'dessert',  nom:'Soufflé chaud au Grand Marnier',        description:"Soufflé léger au Grand Marnier et zeste d'orange confite, crème anglaise à la vanille de Madagascar — À commander en début de repas", prix:16, tag:'Signature', allergens:'Œufs · Lait · Gluten',         actif:true, photo_url:'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80&auto=format&fit=crop' },
    { categorie:'dessert',  nom:'Tarte aux figues et lavande',           description:"Pâte sablée maison, crème d'amande à la lavande, figues fraîches de Provence rôties au miel, sorbet figue-basilic, tuile aux amandes", prix:14, tag:null, allergens:'Gluten · Œufs · Lait · Fruits à coque', actif:true, photo_url:'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&q=80&auto=format&fit=crop' },
    { categorie:'dessert',  nom:'Nougat glacé de Montélimar',            description:'Nougat glacé aux amandes et pistaches de Sicile, coulis de fruits rouges de Provence, meringue française, feuille d\'or', prix:13, tag:null, allergens:'Œufs · Lait · Fruits à coque',                  actif:true, photo_url:'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80&auto=format&fit=crop' },
    // Vins — le champ "description" contient la région, "tag" la couleur (Rouge / Rosé / Blanc)
    { categorie:'vin', nom:'Bandol Rouge — Domaine Tempier',          description:'Bandol, Provence',           prix:58, tag:'Rouge', allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:'Châteauneuf-du-Pape — Château Rayas',    description:'Vallée du Rhône',            prix:95, tag:'Rouge', allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:'Les Baux-de-Provence — Mas de la Dame',  description:'Les Baux, Provence',         prix:42, tag:'Rouge', allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:'Palette Rosé — Château Simone',          description:'Palette, Aix-en-Provence',   prix:52, tag:'Rosé',  allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:'Côtes de Provence — Domaine Ott',        description:'Côtes de Provence',          prix:48, tag:'Rosé',  allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:'Tavel Rosé — Domaine de la Mordorée',    description:'Tavel, Rhône',               prix:38, tag:'Rosé',  allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:'Cassis Blanc — Clos Sainte-Magdeleine',  description:'Cassis, Provence',           prix:46, tag:'Blanc', allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:'Condrieu — Domaine Georges Vernay',      description:'Condrieu, Rhône Nord',       prix:72, tag:'Blanc', allergens:'Sulfites', actif:true, photo_url:null },
    { categorie:'vin', nom:"Viognier — Château d'Aquéria",           description:'Lirac, Rhône Sud',           prix:34, tag:'Blanc', allergens:'Sulfites', actif:true, photo_url:null },
  ];

  async function seedMenu() {
    const sb = getSupabase();
    if (!sb) return;
    const btn = document.getElementById('btnSeedMenu');
    if (btn) { btn.disabled = true; btn.textContent = 'Import…'; }
    try {
      const { error } = await sb.from('plats').insert(STATIC_DISHES);
      if (error) throw error;
      showToast('✓ Carte importée avec succès');
      await loadMenuAdminView();
    } catch(err) {
      console.error('Seed menu:', err);
      showToast('Erreur lors de l\'import — vérifiez que la table plats existe');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⬇ Importer la carte'; }
    }
  }

  document.getElementById('btnSeedMenu')?.addEventListener('click', () => {
    if (menuAdminPlats.length > 0) {
      showConfirmModal('Importer la carte', `${menuAdminPlats.length} plat(s) déjà présent(s). Ajouter quand même les plats par défaut ?`, 'Importer', seedMenu);
    } else {
      seedMenu();
    }
  });

  // Ouvrir modal pour ajout
  document.getElementById('btnAddPlat')?.addEventListener('click', () => openPlatModal(null));

  // Fermer modal plat
  document.getElementById('platModalClose')?.addEventListener('click',  () => document.getElementById('platModal')?.classList.remove('open'));
  document.getElementById('platModalCancel')?.addEventListener('click', () => document.getElementById('platModal')?.classList.remove('open'));
  document.getElementById('platModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('platModal')) document.getElementById('platModal').classList.remove('open');
  });

  // Soumettre modal plat
  document.getElementById('platModalSubmit')?.addEventListener('click', async () => {
    const categorie   = document.getElementById('platCategorie').value;
    const nom         = document.getElementById('platNom').value.trim();
    const prix        = parseFloat(document.getElementById('platPrix').value);
    const errEl       = document.getElementById('platFormError');
    const errMsg      = document.getElementById('platFormErrorMsg');

    if (!categorie || !nom || isNaN(prix)) {
      errMsg.textContent = 'Catégorie, nom et prix sont obligatoires.';
      errEl.style.display = 'flex';
      return;
    }

    const btn = document.getElementById('platModalSubmit');
    const txt = document.getElementById('platModalBtnText');
    const ldr = document.getElementById('platModalBtnLoader');
    btn.disabled = true; txt.style.display = 'none'; ldr.style.display = 'inline-block';
    errEl.style.display = 'none';

    const payload = {
      categorie,
      nom,
      prix,
      tag:         document.getElementById('platTag').value.trim() || null,
      description: document.getElementById('platDescription').value.trim() || null,
      photo_url:   document.getElementById('platPhoto').value.trim() || null,
      allergens:   document.getElementById('platAllergens').value.trim() || null,
      actif:       document.getElementById('platActif').checked,
    };

    const platId = document.getElementById('platId').value;
    try {
      const sb = getSupabase();
      let error;
      if (platId) {
        ({ error } = await sb.from('plats').update(payload).eq('id', platId));
      } else {
        ({ error } = await sb.from('plats').insert([payload]));
      }
      if (error) throw error;
      document.getElementById('platModal').classList.remove('open');
      await loadMenuAdminView();
    } catch(err) {
      console.error('Erreur plat:', err);
      errMsg.textContent = 'Erreur lors de l\'enregistrement.';
      errEl.style.display = 'flex';
    } finally {
      btn.disabled = false; txt.style.display = 'inline'; ldr.style.display = 'none';
    }
  });

})();

/* ============================================================
   CUSTOM DATEPICKER
   ============================================================ */
(function initDatepicker() {
  const wrapper  = document.getElementById('datepickerWrapper');
  if (!wrapper) return;
  const trigger   = document.getElementById('datepickerTrigger');
  const display   = document.getElementById('datepickerDisplay');
  const dropdown  = document.getElementById('datepickerDropdown');
  const dateInput = document.getElementById('date_reservation');

  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const today  = new Date(); today.setHours(0,0,0,0);
  let cur = new Date(today.getFullYear(), today.getMonth(), 1);

  /* toISO en heure locale (pas UTC) pour éviter le décalage d'un jour */
  function toISO(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function render() {
    const y = cur.getFullYear(), m = cur.getMonth();
    document.getElementById('dpMonthYear').textContent = `${MONTHS[m]} ${y}`;
    const grid = document.getElementById('dpDays');
    grid.innerHTML = '';
    // Monday-first grid (Sun→6, Mon→0)
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7;
    for (let i = 0; i < startDow; i++) {
      const emp = document.createElement('div'); emp.className = 'dp-day dp-empty'; grid.appendChild(emp);
    }
    const dim = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const date = new Date(y, m, d);
      const iso  = toISO(date);
      const btn  = document.createElement('button');
      btn.type = 'button'; btn.className = 'dp-day'; btn.textContent = d;
      if (date < today || date.getDay() === 1) {
        btn.disabled = true; btn.classList.add('dp-disabled');
      } else {
        if (iso === toISO(today)) btn.classList.add('dp-today');
        if (iso === dateInput.value) btn.classList.add('dp-selected');
        btn.addEventListener('click', () => {
          dateInput.value = iso;
          display.textContent = date.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
          trigger.classList.add('has-value');
          close();
          const errEl = document.getElementById('date-error');
          if (errEl) errEl.textContent = '';
          wrapper.classList.remove('invalid');
        });
      }
      grid.appendChild(btn);
    }
  }

  function open()  { dropdown.classList.add('open'); trigger.setAttribute('aria-expanded','true');  render(); }
  function close() { dropdown.classList.remove('open'); trigger.setAttribute('aria-expanded','false'); }

  trigger.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.contains('open') ? close() : open(); });
  document.getElementById('dpPrevMonth')?.addEventListener('click', e => { e.stopPropagation(); cur.setMonth(cur.getMonth() - 1); render(); });
  document.getElementById('dpNextMonth')?.addEventListener('click', e => { e.stopPropagation(); cur.setMonth(cur.getMonth() + 1); render(); });
  document.addEventListener('click', e => { if (!wrapper.contains(e.target)) close(); });
})();

/* ============================================================
   MANAGE RESERVATION (via lien token — ex: reservation.html?token=xxx)
   IMPORTANT : ajoutez la colonne token dans Supabase :
     ALTER TABLE reservations ADD COLUMN IF NOT EXISTS token TEXT;
     CREATE UNIQUE INDEX IF NOT EXISTS reservations_token_idx ON reservations(token);
   ============================================================ */
(function initManageMode() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('token');
  if (!token) return;

  const managePanel     = document.getElementById('managePanel');
  const reservationMain = document.getElementById('reservationMain');
  if (managePanel)     managePanel.style.display     = 'block';
  if (reservationMain) reservationMain.style.display = 'none';

  const heroH1 = document.querySelector('.page-hero-content h1');
  if (heroH1) heroH1.textContent = 'Gérer ma réservation';

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  (async function loadReservation() {
    const loadingEl  = document.getElementById('manageLoading');
    const notFoundEl = document.getElementById('manageNotFound');
    const contentEl  = document.getElementById('manageContent');
    try {
      const sb = getSupabase();
      if (!sb) throw new Error('no supabase');
      const { data, error } = await sb.from('reservations').select('*').eq('token', token).single();
      if (error || !data) throw new Error('not found');

      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';

      // Status badge
      const badge = document.getElementById('manageBadge');
      if (badge) {
        const c = data.statut === 'annulée';
        badge.className = `status-badge ${c ? 'cancelled' : 'confirmed'}`;
        badge.textContent = c ? 'Annulée' : 'Confirmée';
      }

      // Details grid
      const grid = document.getElementById('manageDetailsGrid');
      if (grid) {
        const h = (data.heure || '').substring(0,5).replace(':','h');
        grid.innerHTML = `
          <div class="manage-detail"><span class="manage-detail-label">Nom</span><strong>${esc(data.prenom)} ${esc(data.nom)}</strong></div>
          <div class="manage-detail"><span class="manage-detail-label">Date</span><strong>${formatDateFr(data.date_reservation)}</strong></div>
          <div class="manage-detail"><span class="manage-detail-label">Heure</span><strong>${h}</strong></div>
          <div class="manage-detail"><span class="manage-detail-label">Couverts</span><strong>${data.couverts} pers.</strong></div>
          ${data.email ? `<div class="manage-detail"><span class="manage-detail-label">E-mail</span><strong>${esc(data.email)}</strong></div>` : ''}
          ${data.message ? `<div class="manage-detail manage-detail-wide"><span class="manage-detail-label">Note</span><strong>${esc(data.message)}</strong></div>` : ''}
        `;
      }

      // Already cancelled?
      if (data.statut === 'annulée') {
        const ci = document.getElementById('manageCancelledInfo');
        const ma = document.getElementById('manageActions');
        if (ci) ci.style.display = 'flex';
        if (ma) ma.style.display = 'none';
        return;
      }

      // Edit button — pre-fill form and show it
      document.getElementById('manageEditBtn')?.addEventListener('click', () => {
        if (reservationMain) reservationMain.style.display = '';
        ['prenom','nom','telephone','email'].forEach(id => {
          const el = document.getElementById(id); if (el) el.value = data[id] || '';
        });
        const msgEl = document.getElementById('message');
        if (msgEl) msgEl.value = data.message || '';

        // Set date in custom picker
        const di = document.getElementById('date_reservation');
        const dp = document.getElementById('datepickerDisplay');
        const dt = document.getElementById('datepickerTrigger');
        if (di && data.date_reservation) {
          di.value = data.date_reservation;
          const d = new Date(data.date_reservation + 'T12:00:00');
          if (dp) dp.textContent = d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
          if (dt) dt.classList.add('has-value');
        }

        // Set time slot
        const hi = document.getElementById('heure');
        if (hi && data.heure) {
          const t = data.heure.substring(0,5);
          hi.value = t;
          document.querySelectorAll('.time-slot').forEach(b => b.classList.toggle('selected', b.dataset.time === t));
        }

        // Set couverts
        const ci2 = document.getElementById('couverts');
        const cl  = document.getElementById('couvertsLabel');
        if (ci2) { ci2.value = data.couverts; if (cl) cl.textContent = data.couverts <= 1 ? 'personne' : 'personnes'; }

        // Token for edit mode
        const etEl = document.getElementById('editToken');
        if (etEl) etEl.value = token;

        // Change submit button label
        const st = document.getElementById('submitText');
        if (st) st.textContent = 'Enregistrer les modifications';

        reservationMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      // Cancel button
      document.getElementById('manageClientCancelBtn')?.addEventListener('click', async () => {
        if (!confirm('Confirmer l\'annulation de votre réservation ?')) return;
        const btn     = document.getElementById('manageClientCancelBtn');
        const editBtn = document.getElementById('manageEditBtn');
        if (btn)     { btn.disabled = true; btn.textContent = 'Annulation...'; }
        if (editBtn) editBtn.disabled = true;
        try {
          const sb = getSupabase();
          const { error } = await sb.from('reservations').update({ statut: 'annulée' }).eq('token', token);
          if (error) throw error;
          const ma = document.getElementById('manageActions');
          const cs = document.getElementById('manageCancelSuccess');
          const badge2 = document.getElementById('manageBadge');
          if (ma) ma.style.display = 'none';
          if (cs) cs.style.display = 'flex';
          if (badge2) { badge2.className = 'status-badge cancelled'; badge2.textContent = 'Annulée'; }
        } catch(err) {
          console.error('Erreur annulation client:', err);
          if (btn) { btn.disabled = false; btn.textContent = 'Annuler la réservation'; }
          if (editBtn) editBtn.disabled = false;
          alert('Erreur. Veuillez nous appeler au 04 90 54 32 11.');
        }
      });

    } catch(err) {
      console.error('Erreur chargement réservation:', err);
      if (loadingEl)  loadingEl.style.display  = 'none';
      if (notFoundEl) notFoundEl.style.display = 'block';
    }
  })();
})();

/* ============================================================
   MENU DYNAMIQUE (menu.html → chargé depuis Supabase plats)
   ============================================================ */
(function initDynamicMenu() {
  if (!document.getElementById('items-entree')) return; // pas sur menu.html

  const CAT_GRIDS = { entree: 'items-entree', plat: 'items-plat', dessert: 'items-dessert' };

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function reObserve(container) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    container.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
  }

  const sbClient = (typeof window.supabase !== 'undefined')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  if (!sbClient) return;

  (async function() {
    try {
      const { data, error } = await sbClient
        .from('plats').select('*').eq('actif', true)
        .order('categorie').order('tag').order('nom');
      if (error || !data || !data.length) return;

      const grouped = {};
      data.forEach(p => { if (!grouped[p.categorie]) grouped[p.categorie] = []; grouped[p.categorie].push(p); });

      // ── Entrées, Plats, Desserts ──
      Object.entries(CAT_GRIDS).forEach(([cat, gridId]) => {
        const el   = document.getElementById(gridId);
        const list = grouped[cat];
        if (!el || !list || !list.length) return;

        el.innerHTML = list.map((p, i) => {
          const delay = ['', ' delay-1', ' delay-2', ' delay-3'][Math.min(i, 3)];
          const imgHtml = p.photo_url
            ? `<div class="menu-item-img"><img src="${esc(p.photo_url)}" alt="${esc(p.nom)}" loading="lazy" /></div>` : '';
          const tagHtml     = p.tag         ? `<span class="menu-tag">${esc(p.tag)}</span>` : '';
          const descHtml    = p.description ? `<p>${esc(p.description)}</p>` : '';
          const allergenHtml = p.allergens  ? `<div class="menu-item-footer"><span class="allergen">${esc(p.allergens)}</span></div>` : '';
          const price = p.prix ? parseFloat(p.prix).toFixed(2).replace('.', ',') + '\u202f€' : '';
          return `<div class="menu-item reveal${delay}">
            ${imgHtml}
            <div class="menu-item-header">
              <div><h3>${esc(p.nom)}</h3>${tagHtml}</div>
              <span class="menu-item-price">${price}</span>
            </div>
            ${descHtml}${allergenHtml}
          </div>`;
        }).join('');
        reObserve(el);
      });

      // ── Vins — groupés par tag (couleur) ──
      const vinGrid = document.getElementById('items-vin');
      const vinList = grouped['vin'] || [];
      if (vinGrid && vinList.length) {
        const COLOR_ORDER = ['Rouge', 'Rosé', 'Blanc'];
        const vinGroups   = {};
        vinList.forEach(p => {
          const col = p.tag || 'Autres';
          if (!vinGroups[col]) vinGroups[col] = [];
          vinGroups[col].push(p);
        });
        const cols = [
          ...COLOR_ORDER.filter(c => vinGroups[c]),
          ...Object.keys(vinGroups).filter(c => !COLOR_ORDER.includes(c)),
        ];
        vinGrid.innerHTML = cols.map((col, i) => {
          const delay = ['', ' delay-1', ' delay-2'][Math.min(i, 2)];
          const wines = vinGroups[col];
          return `<div class="wine-category reveal${delay}">
            <h3 class="wine-cat-title">Vins ${esc(col)}s</h3>
            ${wines.map(w => `<div class="wine-item">
              <div>
                <strong>${esc(w.nom)}</strong>
                ${w.description ? `<span class="wine-region">${esc(w.description)}</span>` : ''}
              </div>
              <span class="wine-price">${w.prix ? parseFloat(w.prix).toFixed(0) + '\u202f€' : ''}</span>
            </div>`).join('')}
          </div>`;
        }).join('');
        reObserve(vinGrid);
      }

    } catch(err) {
      console.warn('Menu dynamique indisponible, affichage statique.', err);
    }
  })();
})();

/* ============================================================
   SHARED HELPERS
   ============================================================ */
function formatDateFr(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
